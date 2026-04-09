import { useState } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import {
  useSubmitChecklistToRMMutation,
  useUpdateChecklistStatusMutation,
} from "../../src/api/checklistApi";
import { API_BASE_URL } from "../utils/constants";
import { saveDraft as saveDraftToStorage } from "../utils/draftsUtils";

const getResolvedCheckerStatus = (doc) =>
  doc?.checkerStatus ||
  doc?.finalCheckerStatus ||
  doc?.coCheckerStatus ||
  doc?.co_checker_status ||
  null;

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
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);

  const submitToRM = async () => {
    try {
      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      // Build document structure matching backend DocumentCategoryDto
      // Filter out supporting documents - they're stored in Uploads table, not Checklist.Documents
      const supportingDocsCount = docs.filter(d => d.category === "Supporting Documents").length;
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
            fileUrl: doc.fileUrl,
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

      console.log("📤 RM SUBMISSION:");
      console.log("   Checklist ID:", checklistId);
      console.log("   Total docs in state:", docs.length);
      console.log("   Supporting docs (filtered out):", supportingDocsCount);
      console.log("   Main docs being submitted:", nestedDocuments.reduce((sum, cat) => sum + cat.docList.length, 0));
      console.log("   Creator Comment:", creatorComment ? `"${creatorComment.substring(0, 50)}..."` : "(empty)");
      console.log("   Payload:", JSON.stringify(payload, null, 2));

      const result = await submitRmChecklist({
        id: checklistId,
        body: payload,
      }).unwrap();

      message.success("Checklist submitted to RM successfully!");

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
        console.log("🔄 Triggering refetch after successful RM submission");
        onRefetchNeeded();
      }

      return result;
    } catch (err) {
      console.error("Submit to RM error:", err);
      message.error(
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
      message.loading({
        content: "Submitting checklist to Co-Checker...",
        key: "checkerSubmit",
      });

      // ✅ CRITICAL FIX: Send documents as a FLAT list matching CoCreatorDocumentDto
      // NOT as nested categories with docList!
      // Backend expects: { id, category, name, status, creatorStatus, ... }
      // NOT: { category, docList: [...] }
      // Filter out supporting documents - they're stored in Uploads table, not Checklist.Documents
      const supportingDocsCount = docs.filter(d => d.category === "Supporting Documents").length;
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
          fileUrl: doc.fileUrl || null,
          expiryDate: doc.expiryDate || null,
          deferralNo: doc.deferralNo || null,
          deferralReason: doc.deferralReason || null,
        });
      });

      const payload = {
        dclNo: checklist.dclNo,
        documents: flatDocuments, // FLAT list, not nested!
        finalComment: creatorComment || "", // ✅ CRITICAL: Include comment from user
      };

      console.log("📤 BEFORE SUBMISSION:");
      console.log("   Payload:", JSON.stringify(payload, null, 2));
      console.log("   Total docs in state:", docs.length);
      console.log("   Supporting docs (filtered out):", supportingDocsCount);
      console.log("   Main docs being submitted:", flatDocuments.length);
      console.log("   Creator Comment:", creatorComment ? `"${creatorComment.substring(0, 50)}..."` : "(empty)");

      const result = await updateChecklistStatus(payload).unwrap();

      console.log("📥 AFTER SUBMISSION RESPONSE:");
      console.log("   Response:", JSON.stringify(result, null, 2));
      console.log("   Returned documents:", result?.checklist?.documents?.length);
      
      if (result?.checklist?.documents) {
        result.checklist.documents.forEach((cat) => {
          console.log(`   Category: ${cat.category}, Docs: ${cat.docList?.length}`);
        });
      }

      message.success({
        content: "Checklist submitted to Co-Checker!",
        key: "checkerSubmit",
        duration: 3,
      });

      // Trigger parent callback with updated checklist data from server
      if (onChecklistUpdate) {
        const updatedChecklistData = result?.checklist ||  {
          id: checklist.id || checklist._id,
          dclNo: checklist.dclNo,
          status: "CoCheckerReview",
          documents: flatDocuments,
          message: "Checklist submitted to Co-Checker",
        };
        
        console.log("🔄 Calling onChecklistUpdate with:", updatedChecklistData);
        onChecklistUpdate(updatedChecklistData);
      }

      // ✅ NEW: Trigger refetch to ensure frontend has latest data from backend
      if (onRefetchNeeded) {
        console.log("🔄 Triggering refetch after successful submission");
        onRefetchNeeded();
      }

      return result;
    } catch (err) {
      console.error("Submit Error Details:", err);
      message.error({
        content:
          err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "Failed to submit checklist.",
        key: "checkerSubmit",
      });
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
          fileUrl: doc.fileUrl,
          expiryDate: doc.expiryDate,
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

      console.log("📤 UploadSupportingDoc - Checklist object:", {
        checklistId: checklistId,
        checklistIdDirect: checklist?.id,
        checklistIdUnderscore: checklist?._id,
        fullChecklist: checklist
      });

      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const formData = new FormData();
      // Backend expects: file, checklistId, documentId, documentName, category
      formData.append("file", file);
      formData.append("checklistId", checklistId);
      formData.append("category", "Supporting Documents");
      formData.append("documentName", file.name);

      console.log("📤 Uploading supporting document:", {
        checklistId,
        checklistIdType: typeof checklistId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

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
      console.log("✅ Upload response:", result);

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

      console.log("✅ Supporting doc normalized:", newSupportingDoc);

      return newSupportingDoc;
    } catch (error) {
      console.error("Upload error:", error);
      message.error(`Upload failed: ${error.message}`);
      throw error;
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  return {
    isSubmittingToRM,
    isCheckerSubmitting,
    isSavingDraft,
    uploadingSupportingDoc,
    submitToRM,
    submitToCheckers,
    saveDraft: saveDraftHandler,
    uploadSupportingDoc,
  };
};
