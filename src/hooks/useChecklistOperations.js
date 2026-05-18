import { useState } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import {
  useSubmitChecklistToRMMutation,
  useUpdateChecklistStatusMutation,
  useUpdateChecklistStatusDirectMutation,
} from "../../src/api/checklistApi";
import { API_BASE_URL } from "../utils/constants";
import { saveDraft as saveDraftToStorage } from "../utils/draftsUtils";
import { showErrorToast, showSuccessToast } from "../utils/authToast";
import {
  getComplianceDocumentsMissingResolvedExpiry,
  getNaReasonMissingDocs,
} from "../utils/documentUtils";
import deferralApi from "../service/deferralApi";

const getResolvedCheckerStatus = (doc) =>
  doc?.checkerStatus ||
  doc?.finalCheckerStatus ||
  doc?.coCheckerStatus ||
  doc?.co_checker_status ||
  null;

const normalizeLookupValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isDeferredAction = (value) =>
  ["deferred", "deferralrequested", "defferalrequested"].includes(
    normalizeLookupValue(value).replace(/[^a-z]/g, ""),
  );

export const useChecklistOperations = (
  checklist,
  docs,
  supportingDocs,
  creatorComment,
  currentUser,
  onChecklistUpdate = null, // Callback to update parent component with fresh checklist data
  onRefetchNeeded = null, // Callback to trigger parent refetch after submission
) => {
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");
  const [submitRmChecklist, { isLoading: isSubmittingToRM }] =
    useSubmitChecklistToRMMutation();
  const [updateChecklistStatus, { isLoading: isCheckerSubmitting }] =
    useUpdateChecklistStatusMutation();
  const [updateChecklistStatusDirect, { isLoading: isDiscarding }] =
    useUpdateChecklistStatusDirectMutation();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);

  const validateDeferredDocumentForRmSubmission = async (doc) => {
    if (!isDeferredAction(doc?.action || doc?.status)) {
      return { valid: true, skipped: true };
    }

    const deferralNumber = String(doc?.deferralNo || doc?.deferralNumber || "").trim();
    if (!deferralNumber) {
      return {
        valid: false,
        message: "Enter a deferral number for all deferred documents before submitting to RM.",
      };
    }

    const results = await deferralApi.searchDeferrals({ deferralNumber }, token);
    const exactMatches = (Array.isArray(results) ? results : []).filter(
      (item) =>
        normalizeLookupValue(item?.deferralNumber) ===
        normalizeLookupValue(deferralNumber),
    );

    if (!exactMatches.length) {
      return {
        valid: false,
        message: `Deferral number ${deferralNumber} is invalid.`,
      };
    }

    const customerContext = {
      customerNumber: normalizeLookupValue(checklist?.customerNumber),
      customerName: normalizeLookupValue(checklist?.customerName),
      dclNumber: normalizeLookupValue(checklist?.dclNo || checklist?.dclNumber),
    };

    const matchingCustomerDeferral = exactMatches.find((item) => {
      const resultCustomerNumber = normalizeLookupValue(item?.customerNumber);
      const resultCustomerName = normalizeLookupValue(item?.customerName);
      const resultDclNumber = normalizeLookupValue(item?.dclNumber || item?.dclNo);

      if (customerContext.customerNumber && resultCustomerNumber) {
        return resultCustomerNumber === customerContext.customerNumber;
      }

      if (customerContext.customerName && resultCustomerName) {
        return resultCustomerName === customerContext.customerName;
      }

      if (customerContext.dclNumber && resultDclNumber) {
        return resultDclNumber === customerContext.dclNumber;
      }

      return true;
    });

    if (!matchingCustomerDeferral) {
      return {
        valid: false,
        message: "This deferral number does not belong to the selected customer.",
      };
    }

    return { valid: true, deferral: matchingCustomerDeferral };
  };

  const submitToRM = async () => {
    try {
      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const requiresComplianceExpiryForRmSubmission = ["cocreatorreview", "co_creator_review"].includes(
        String(checklist?.status || "").toLowerCase(),
      );
      const complianceDocsMissingExpiry = getComplianceDocumentsMissingResolvedExpiry(docs);
      if (requiresComplianceExpiryForRmSubmission && complianceDocsMissingExpiry.length > 0) {
        throw new Error(
          `Cannot submit to RM: ${complianceDocsMissingExpiry.length} compliance document(s) missing a valid expiry date. Set the expiry date so the document shows Current or Expired before submission.`,
        );
      }

      const deferredDocs = docs.filter((doc) =>
        isDeferredAction(doc?.action || doc?.status),
      );

      for (const doc of deferredDocs) {
        const validationResult = await validateDeferredDocumentForRmSubmission(doc);
        if (!validationResult.valid) {
          throw new Error(
            validationResult.message ||
              "Checklist cannot be submitted to RM because one or more deferral numbers are invalid.",
          );
        }
      }

      // Build document structure matching backend DocumentCategoryDto
      // Filter out supporting documents - they're stored in Uploads table, not Checklist.Documents
      const nestedDocuments = docs
        .filter(doc => doc.category !== "Supporting Documents")
        .reduce((acc, doc) => {
          let categoryGroup = acc.find((c) => c.category === doc.category);
          if (!categoryGroup) {
            categoryGroup = { category: doc.category, docList: [] };
            acc.push(categoryGroup);
          }
          categoryGroup.docList.push({
            id: doc._id || doc.id,
            _id: doc._id || doc.id,
            name: doc.name,
            status: doc.status || doc.action, // Use action as fallback
            creatorStatus: doc.creatorStatus, // PRESERVE creator status
            checkerStatus: getResolvedCheckerStatus(doc), // PRESERVE checker status
            finalCheckerStatus: getResolvedCheckerStatus(doc),
            comment: doc.comment,
            fileUrl: doc.fileUrl || doc.uploadData?.fileUrl || null,
            expiryDate: doc.expiryDate || doc.ExpiryDate || null,
            deferralNumber: doc.deferralNo,
            deferralReason: doc.deferralReason,
          });

          return acc;
        }, []);

      // Send document updates to backend BEFORE submitting to RM
      const payload = {
        documents: nestedDocuments,
        creatorComment: creatorComment || "", // ✅ CRITICAL: Include comment from user
      };

      const result = await submitRmChecklist({
        id: checklistId,
        body: payload,
      }).unwrap();

      showSuccessToast("Checklist submitted to RM successfully!");

      // Trigger parent callback with updated checklist data from server
      if (onChecklistUpdate) {
        onChecklistUpdate(
          result?.checklist || {
            id: checklistId,
            status: "RMReview",
            message: "Checklist submitted to RM",
          },
        );
      }

      // ✅ NEW: Trigger refetch to ensure frontend has latest data from backend
      if (onRefetchNeeded) {
        onRefetchNeeded();
      }

      return result;
    } catch (err) {
      console.error("Submit to RM error:", err);
      showErrorToast(
        err?.data?.error || err?.message || "Failed to submit checklist to RM",
      );
      throw err;
    }
  };

  const submitToCheckers = async () => {
    if (!checklist?.dclNo) {
      throw new Error("DCL No missing.");
    }

    try {
      const complianceDocsMissingExpiry = getComplianceDocumentsMissingResolvedExpiry(docs);
      if (complianceDocsMissingExpiry.length > 0) {
        throw new Error(
          `Cannot submit to Co-Checker: ${complianceDocsMissingExpiry.length} compliance document(s) missing a valid expiry date. Set the expiry date so the document shows Current or Expired before submission.`,
        );
      }

      const naReasonMissingDocs = getNaReasonMissingDocs(docs);
      if (naReasonMissingDocs.length > 0) {
        throw new Error(
          `Cannot submit to Co-Checker: ${naReasonMissingDocs.length} N/A document(s) are missing a valid reason. Enter a reason in the Creator Comment column for each waived document before submission.`,
        );
      }

      message.loading({
        content: "Submitting checklist to Co-Checker...",
        key: "checkerSubmit",
      });

      // ✅ CRITICAL FIX: Send documents as a FLAT list matching CoCreatorDocumentDto
      // NOT as nested categories with docList!
      // Backend expects: { id, category, name, status, creatorStatus, ... }
      // NOT: { category, docList: [...] }
      // Filter out supporting documents - they're stored in Uploads table, not Checklist.Documents
      const flatDocuments = [];
      docs.forEach((doc) => {
        // Skip supporting documents - they're in Uploads table
        if (doc.category === "Supporting Documents") return;

        flatDocuments.push({
          id: doc._id || doc.id,
          _id: doc._id || doc.id,
          category: doc.category,
          name: doc.name,
          status: doc.action || doc.status,
          creatorStatus: doc.creatorStatus, // PRESERVE creator status
          checkerStatus: getResolvedCheckerStatus(doc), // PRESERVE checker status
          finalCheckerStatus: getResolvedCheckerStatus(doc),
          comment: doc.comment || "",
          fileUrl: doc.fileUrl || doc.uploadData?.fileUrl || null,
          expiryDate: doc.expiryDate || doc.ExpiryDate || null,
          deferralNo: doc.deferralNo || null,
          deferralReason: doc.deferralReason || null,
        });
      });

      const payload = {
        dclNo: checklist.dclNo,
        documents: flatDocuments, // FLAT list, not nested!
        finalComment: creatorComment || "", // ✅ CRITICAL: Include comment from user
      };

      const result = await updateChecklistStatus(payload).unwrap();

      showSuccessToast("Checklist submitted to Co-Checker!");

      // Trigger parent callback with updated checklist data from server
      if (onChecklistUpdate) {
        const updatedChecklistData = result?.checklist ||  {
          id: checklist.id || checklist._id,
          dclNo: checklist.dclNo,
          status: "CoCheckerReview",
          documents: flatDocuments,
          message: "Checklist submitted to Co-Checker",
        };

        onChecklistUpdate(updatedChecklistData);
      }

      // ✅ NEW: Trigger refetch to ensure frontend has latest data from backend
      if (onRefetchNeeded) {
        onRefetchNeeded();
      }

      return result;
    } catch (err) {
      console.error("Submit Error Details:", err);
      showErrorToast(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "Failed to submit checklist.",
      );
      throw err;
    }
  };

  const saveDraftHandler = async () => {
    try {
      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        message.error("Checklist ID missing");
        return;
      }

      setIsSavingDraft(true);
      message.loading({
        content: "Saving draft...",
        key: "saveDraft",
      });

      // Prepare draft data for localStorage
      const draftData = {
        checklistId: checklistId,
        dclNo: checklist?.dclNo,
        title: checklist?.title,
        customerName: checklist?.customerName,
        customerNumber: checklist?.customerNumber,
        loanType: checklist?.loanType,
        status: checklist?.status,
        documents: docs.map((doc) => ({
          _id: doc._id || doc.id,
          name: doc.name,
          category: doc.category,
          status: doc.status || doc.action,
          action: doc.action,
          creatorStatus: doc.creatorStatus,
          checkerStatus: getResolvedCheckerStatus(doc),
          finalCheckerStatus: getResolvedCheckerStatus(doc),
          comment: doc.comment,
          fileUrl: doc.fileUrl || doc.uploadData?.fileUrl || null,
          expiryDate: doc.expiryDate ?? doc.ExpiryDate ?? null,
          deferralNo: doc.deferralNo,
        })),
        creatorComment,
        supportingDocs,
      };

      // Save to localStorage instead of API
      saveDraftToStorage("cocreator", draftData, checklistId);

      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({
        content: error?.message || "Failed to save draft",
        key: "saveDraft",
      });
      throw error;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const uploadSupportingDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);

      const checklistId = checklist?.id || checklist?._id;

      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const formData = new FormData();
      // Backend expects: file, checklistId, documentId, documentName, category
      formData.append("file", file);
      formData.append("checklistId", checklistId);
      formData.append("category", "Supporting Documents");
      formData.append("documentName", file.name);

      const response = await fetch(
        `${API_BASE_URL}/api/uploads`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      // Handle different response structures
      const uploadedDoc = result.data || result.uploadedDoc || result;

      if (!uploadedDoc || (!uploadedDoc.id && !uploadedDoc._id)) {
        throw new Error("Invalid upload response - missing document ID");
      }

      // Normalize the document structure
      const newSupportingDoc = {
        id: uploadedDoc.id || uploadedDoc._id,
        _id: uploadedDoc._id || uploadedDoc.id,
        name: uploadedDoc.fileName || uploadedDoc.documentName || uploadedDoc.name || file.name,
        fileName: uploadedDoc.fileName || uploadedDoc.documentName || uploadedDoc.name || file.name,
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize || file.size,
        fileType: uploadedDoc.fileType || file.type,
        category: 'Supporting Documents',
        isSupporting: true,
        uploadedBy: uploadedDoc.uploadedBy || auth?.user?.name || 'Current User',
        uploadedById: uploadedDoc.uploadedById || auth?.user?.id,
        uploadedByRole: uploadedDoc.uploadedByRole || auth?.user?.role || 'cocreator',
        uploadedAt: uploadedDoc.createdAt || uploadedDoc.uploadedAt || new Date().toISOString(),
        uploadData: {
          _id: uploadedDoc.id || uploadedDoc._id,
          fileName: uploadedDoc.fileName || uploadedDoc.documentName || file.name,
          fileUrl: uploadedDoc.fileUrl,
          createdAt: uploadedDoc.createdAt || uploadedDoc.uploadedAt || new Date().toISOString(),
          fileSize: uploadedDoc.fileSize || file.size,
          fileType: uploadedDoc.fileType || file.type,
          uploadedBy: uploadedDoc.uploadedBy || auth?.user?.name || 'Current User',
        }
      };

      return newSupportingDoc;
    } catch (error) {
      console.error("Upload error:", error);
      showErrorToast(error?.message || "Failed to upload supporting document");
      throw error;
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  const discardChecklist = async () => {
    try {
      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      message.loading({
        content: "Discarding checklist...",
        key: "discardChecklist",
      });

      const result = await updateChecklistStatusDirect({
        checklistId,
        status: "Discarded",
      }).unwrap();

      showSuccessToast("Checklist discarded successfully!");

      if (onChecklistUpdate) {
        onChecklistUpdate({
          ...checklist,
          status: "Discarded",
        });
      }

      if (onRefetchNeeded) {
        onRefetchNeeded();
      }

      return result;
    } catch (err) {
      console.error("Discard checklist error:", err);
      showErrorToast(
        err?.data?.message || err?.data?.error || err?.message || "Failed to discard checklist.",
      );
      throw err;
    }
  };

  return {
    isSubmittingToRM,
    isCheckerSubmitting,
    isSavingDraft,
    isDiscarding,
    uploadingSupportingDoc,
    submitToRM,
    submitToCheckers,
    saveDraft: saveDraftHandler,
    uploadSupportingDoc,
    discardChecklist,
  };
};
