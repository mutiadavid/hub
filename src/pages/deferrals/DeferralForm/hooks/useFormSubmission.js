import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import deferralApi from "../../../../service/deferralApi";
import {
  normalizeFacilities,
  normalizeDocumentType,
  getDocumentCategory,
  parseLoanAmount,
} from "../utils/helpers";
import { validateDeferralSubmission } from "../utils/validation";
import { GUID_REGEX } from "../utils/constants";
import { showErrorToast, showSuccessToast, showWarningToast } from "../../../../utils/authToast";
import { deleteDraft } from "../../../../utils/draftsUtils";

/**
 * Custom hook to handle form submission logic
 */
export const useFormSubmission = () => {
  const navigate = useNavigate();

  const handleSubmitDeferral = useCallback(
    async (
      {
        selectedCustomerId,
        customerNumber,
        dclNumber,
        selectedDocuments,
        dclFile,
        approverSlots,
        loanAmount,
        customerName,
        businessName,
        loanType,
        deferralDescription,
        facilities,
        perDocumentDays,
        currentUser,
        postedComments,
        additionalFiles,
        draftId = null,
      },
      setIsSubmitting
    ) => {
      // Comprehensive validation
      if (
        !validateDeferralSubmission(
          selectedCustomerId,
          customerNumber,
          dclNumber,
          selectedDocuments,
          dclFile,
          approverSlots,
          loanAmount
        )
      ) {
        return;
      }

      const missingManualDays = (selectedDocuments || []).some((doc, idx) => {
        if (!doc?.isManual) {
          return false;
        }

        const docKey = (doc && (doc._id || doc.name)) || String(idx);
        return (Number(perDocumentDays?.[docKey]) || 0) <= 0;
      });

      if (missingManualDays) {
        showErrorToast(
          "Every manually added document must have days sought greater than zero before submission"
        );
        return;
      }

      setIsSubmitting(true);

      try {
        const documentCategory = getDocumentCategory(selectedDocuments);
        const normalizedFacilities = normalizeFacilities(facilities);

        // Convert loan amount category to numeric value
        const loanAmountValue =
          loanAmount === "above75" ? 100000000 : // 100M for above threshold
          loanAmount === "below75" ? 50000000 :  // 50M for below threshold
          parseLoanAmount(loanAmount);

        const resolvedApprovers = approverSlots
          .filter((slot) => !!slot.userId)
          .map((slot) => {
            const resolvedUserId = GUID_REGEX.test(String(slot.userId || ""))
              ? String(slot.userId)
              : null;

            return {
              role: slot.role,
              userId: resolvedUserId,
              user: resolvedUserId,
              name: slot.name,
              email: slot.email,
              samAccountName: slot.samAccountName,
              department: slot.department,
              position: slot.role || slot.position,
            };
          });

        const selectedDocumentPayload = (selectedDocuments || []).map((doc, idx) => {
          const docKey = (doc && (doc._id || doc.name)) || String(idx);
          const days = Number(perDocumentDays[docKey]) || 0;
          const nextDateIso = days
            ? dayjs()
                .add(days, "day")
                .toISOString()
            : undefined;

          if (typeof doc === "string") {
            return {
              name: doc,
              type: documentCategory === "Primary" ? "Primary" : "Secondary",
              daysSought: days || undefined,
              nextDocumentDueDate: nextDateIso,
            };
          }

          return {
            ...doc,
            type: normalizeDocumentType(doc, documentCategory),
            daysSought: days || undefined,
            nextDocumentDueDate: nextDateIso,
          };
        });

        const aggregateDaysSought = selectedDocumentPayload
          .map((doc) => Number(doc?.daysSought) || 0)
          .filter((days) => days > 0)
          .reduce((max, value) => Math.max(max, value), 0);

        if (aggregateDaysSought <= 0) {
          showErrorToast("Please enter number of days sought before submitting the deferral request");
          setIsSubmitting(false);
          return;
        }

        const payload = {
          request: "CreateDeferral", // Add required request field
          customerId: selectedCustomerId || undefined,
          customerNumber,
          customerName,
          businessName,
          loanType,
          loanAmount: loanAmountValue, // Use numeric value instead of category string
          daysSought: aggregateDaysSought,
          dclNumber,
          deferralDescription,
          facilities: normalizedFacilities,
          approvers: resolvedApprovers,
          selectedDocuments: selectedDocumentPayload,
          comments: postedComments.map((c) => ({
            text: c.message,
            createdAt: c.createdAt,
            authorName: c.user?.name || currentUser.name || "RM",
            authorRole: c.user?.role || currentUser.role || "RM",
            author: {
              name: c.user?.name || currentUser.name || "RM",
              role: c.user?.role || currentUser.role || "RM",
            },
          })),
        };

        // Get user token for file uploads
        let userToken = localStorage.getItem("token");
        if (!userToken) {
          try {
            const stored = JSON.parse(localStorage.getItem("user") || "null");
            userToken = stored?.token || null;
          } catch {
            userToken = null;
          }
        }

        // Create deferral
        let newDeferral;
        try {
          newDeferral = await deferralApi.createDeferral(payload, userToken);
        } catch (err) {
          showErrorToast(err.message || "Failed to create deferral");
          setIsSubmitting(false);
          return;
        }

        const createdDeferralId = newDeferral?.id || newDeferral?._id;

        if (!createdDeferralId) {
          console.error("Create deferral succeeded but response had no id/_id", newDeferral);
          showWarningToast(
            "Deferral created but document linking failed: missing deferral ID"
          );
          navigate("/rm/deferrals/pending");
          return;
        }

        // Upload documents using the proper upload endpoint
        const uploadRequests = [];

        if (dclFile) {
          uploadRequests.push(
            deferralApi.uploadDocument(
              createdDeferralId,
              dclFile,
              { isDCL: true },
              userToken
            ).catch((e) => {
              console.error("Failed to upload DCL document", e);
              // Don't re-throw, allow other uploads to continue
            })
          );
        }

        if (additionalFiles && additionalFiles.length > 0) {
          for (const f of additionalFiles) {
            uploadRequests.push(
              deferralApi.uploadDocument(
                createdDeferralId,
                f,
                { isAdditional: true },
                userToken
              ).catch((e) => {
                console.error("Failed to upload additional document", e);
                // Don't re-throw, allow other uploads to continue
              })
            );
          }
        }

        try {
          await Promise.all(uploadRequests);
        } catch (e) {
          console.error("One or more document uploads failed", e);
        }

        // Delete draft if one exists (successful submission)
        if (draftId) {
          try {
            deleteDraft(draftId);
          } catch (e) {
            console.error("Failed to delete draft after submission:", e);
            // Don't throw, submission was successful
          }
        }

        // Navigate and show success message
        navigate("/rm/deferrals/pending");

        const attemptedRecipients = Number(
          newDeferral?.emailNotification?.attemptedRecipients || 0
        );
        const hadDispatchError = !!newDeferral?.emailNotification?.hadDispatchError;

        if (attemptedRecipients > 0) {
          showSuccessToast(
            hadDispatchError
              ? `Deferral request created. Email notifications attempted for ${attemptedRecipients} recipient(s), but dispatch had issues.`
              : `Deferral request created. Email notifications queued for ${attemptedRecipients} recipient(s).`
          );
        } else {
          showSuccessToast("Deferral request created");
        }

        // Dispatch global event
        try {
          window.dispatchEvent(
            new CustomEvent("deferral:created", { detail: newDeferral })
          );
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error(err);
        showErrorToast("Failed to submit deferral");
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigate]
  );

  return { handleSubmitDeferral };
};