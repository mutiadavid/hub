// export default CheckerReviewChecklistModal;
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button, message } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useUpdateCheckerStatusMutation,
  useGetChecklistCommentsQuery,
  useGetCheckerDclByIdQuery,
  useLockDclMutation,
  useUnlockDclMutation,
} from "../../../api/checklistApi";
import {
  LeftOutlined,
  LockOutlined,
  UnorderedListOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import ConfirmationModal from "./ConfirmationModal";
import ActionButtons from "./ActionButtons";
import CommentSection from "./CommentSection";
import DocumentTable from "./DocumentTable";
import DocumentSidebar from "./DocumentSidebar";
import ChecklistHeader from "../ReviewChecklistModalComponents/ChecklistHeader";
import ProgressStats from "../ReviewChecklistModalComponents/ProgressStats";
import { calculateDocumentStats } from "../../../utils/checklistUtils";
import { generateChecklistPDF } from "../../../utils/reportGenerator";
import {
  buildDraftCommentTrail,
  cloneDraftRecord,
  saveDraft as saveDraftToStorage,
  deleteDraft,
  getDraftRoute,
} from "../../../utils/draftsUtils";
import { showErrorToast, showSuccessToast, showWarningToast } from "../../../utils/authToast";
import { API_ORIGIN } from "../../../config/runtimeConfig";
import "../../../styles/creatorDesignSystem.css";

const normalizeChecklistStatus = (value) => String(value || "").trim().toLowerCase();

const isApprovedChecklistStatus = (status) =>
  ["approved", "completed", "approvedandcompleted"].includes(
    normalizeChecklistStatus(status),
  );

const resolveCheckerStatus = (doc, checklistStatus, shouldForceApproved = false) => {
  if (shouldForceApproved || isApprovedChecklistStatus(checklistStatus)) {
    return "approved";
  }

  return (
    doc?.checkerStatus ||
    doc?.finalCheckerStatus ||
    doc?.coCheckerStatus ||
    doc?.co_checker_status ||
    (doc?.approved ? "approved" : "pending")
  );
};

const TABS = [
  { key: "details", label: "Checklist Details" },
  { key: "documents", label: "Required Documents" },
];

const CheckerReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  embedded = false,
  isReadOnly = false,
  readOnly = false,
  onChecklistUpdate = null,
}) => {
  const navigate = useNavigate();
  const effectiveReadOnly = isReadOnly || readOnly;
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");
  const API_BASE_URL = API_ORIGIN;

  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [checkerComment, setCheckerComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const hasAttemptedLockRef = useRef(false);
  const keepLockOnCloseRef = useRef(false);
  const submittedRef = useRef(false);
  const resolvedChecklistId = localChecklist?.id || localChecklist?._id || checklist?.id || checklist?._id;

  const [submitCheckerStatus] = useUpdateCheckerStatusMutation();
  const [lockDcl] = useLockDclMutation();
  const [unlockDcl] = useUnlockDclMutation();
  const { data: checklistDetail } = useGetCheckerDclByIdQuery(resolvedChecklistId, {
    skip: !resolvedChecklistId,
    refetchOnMountOrArgChange: true,
  });
  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(resolvedChecklistId, {
      skip: !resolvedChecklistId,
    });

  const uploadedDocsCount = useMemo(() => {
    const mainDocsCount = docs.filter((doc) => doc.fileUrl || doc.uploadData?.fileUrl).length;
    const supportingDocsCount = supportingDocs.filter((doc) => doc.fileUrl || doc.uploadData?.fileUrl).length;
    return mainDocsCount + supportingDocsCount;
  }, [docs, supportingDocs]);

  const documentStats = useMemo(() => {
    return calculateDocumentStats(docs);
  }, [docs]);

  const { total, checkerApproved, checkerRejected, checkerReviewed } =
    documentStats;
  const currentUserId = auth?.user?.id || auth?.user?._id || auth?.id || auth?._id;
  const currentUserName = auth?.user?.name || auth?.user?.username || "Current User";
  const activeChecklist = localChecklist || checklistDetail || checklist;
  const isDraftRestored = Boolean(localChecklist?._draftRestored || checklist?._draftRestored);
  const displayComments = useMemo(() => {
    if (Array.isArray(localChecklist?.commentTrail) && localChecklist.commentTrail.length > 0) {
      return localChecklist.commentTrail;
    }

    if (Array.isArray(checklist?.commentTrail) && checklist.commentTrail.length > 0) {
      return checklist.commentTrail;
    }

    return comments || [];
  }, [comments, checklist, localChecklist]);
  const lockedByUserId = activeChecklist?.lockedByUserId || activeChecklist?.lockedBy?.id;
  const lockedByUserName = activeChecklist?.lockedBy?.name || activeChecklist?.lockedByUserName;
  const isLockedBySomeoneElse = !!lockedByUserId && lockedByUserId !== currentUserId;
  const isLockedByMe = !!lockedByUserId && lockedByUserId === currentUserId;

  const handleChecklistUpdate = (updatedChecklist) => {
    const mergedChecklist = {
      ...localChecklist,
      ...checklist,
      ...updatedChecklist,
      supportingDocs:
        updatedChecklist?.supportingDocs ||
        checklist?.supportingDocs ||
        localChecklist?.supportingDocs ||
        [],
    };

    setLocalChecklist(mergedChecklist);
    if (onChecklistUpdate) {
      onChecklistUpdate(mergedChecklist);
    }
  };

  const markChecklistEdited = useCallback(() => {
    if (effectiveReadOnly) {
      return;
    }

    keepLockOnCloseRef.current = true;
    setHasLocalEdits((prev) => (prev ? prev : true));
  }, [effectiveReadOnly]);

  useEffect(() => {
    const nextChecklist = checklistDetail || checklist;

    if (!nextChecklist && !checklist?._draftRestored) {
      return;
    }

    setLocalChecklist((previousChecklist) => {
      const restoredChecklist = previousChecklist?._draftRestored
        ? previousChecklist
        : checklist?._draftRestored
          ? checklist
          : null;

      if (!restoredChecklist) {
        return nextChecklist;
      }

      return {
        ...(nextChecklist || {}),
        ...restoredChecklist,
        documents:
          restoredChecklist.documents ||
          nextChecklist?.documents ||
          nextChecklist?.docList ||
          [],
        supportingDocs:
          restoredChecklist.supportingDocs ||
          restoredChecklist._supportingDocs ||
          nextChecklist?.supportingDocs ||
          [],
        commentTrail:
          restoredChecklist.commentTrail ||
          restoredChecklist._draftCommentTrail ||
          nextChecklist?.commentTrail ||
          [],
      };
    });
  }, [checklist, checklistDetail]);

  useEffect(() => {
    if (isDraftRestored) {
      setCheckerComment(
        localChecklist?.checkerComment ||
          localChecklist?._checkerComment ||
          checklist?.checkerComment ||
          checklist?._checkerComment ||
          checklist?.creatorComment ||
          "",
      );
      return;
    }

    setCheckerComment(
      checklistDetail?.checkerComment ||
        checklist?.checkerComment ||
        checklistDetail?.creatorComment ||
        checklist?.creatorComment ||
        "",
    );
  }, [checklist, checklistDetail, isDraftRestored, localChecklist]);

  useEffect(() => {
    hasAttemptedLockRef.current = false;
    keepLockOnCloseRef.current = false;
    submittedRef.current = false;
    setHasLocalEdits(false);
  }, [resolvedChecklistId]);

  useEffect(() => {
    const normalizedStatus = normalizeChecklistStatus(activeChecklist?.status);
    const canLock = ["cocheckerreview", "co_checker_review", "check_review"].includes(normalizedStatus);

    if (
      effectiveReadOnly ||
      !open ||
      !resolvedChecklistId ||
      !currentUserId ||
      !canLock ||
      isLockedBySomeoneElse ||
      isLockedByMe ||
      hasAttemptedLockRef.current
    ) {
      return;
    }

    let isCancelled = false;
    hasAttemptedLockRef.current = true;

    const acquireLock = async () => {
      try {
        await lockDcl(resolvedChecklistId).unwrap();
        if (isCancelled) {
          return;
        }

        setLocalChecklist((prev) => ({
          ...(prev || activeChecklist || {}),
          lockedByUserId: currentUserId,
          lockedByUserName: currentUserName,
          lockedBy: { id: currentUserId, name: currentUserName },
        }));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const conflictingUserId = error?.data?.lockedByUserId;
        const conflictingUserName = error?.data?.lockedByUserName;

        if (conflictingUserId) {
          setLocalChecklist((prev) => ({
            ...(prev || activeChecklist || {}),
            lockedByUserId: conflictingUserId,
            lockedByUserName: conflictingUserName,
            lockedBy: error?.data?.lockedBy || (conflictingUserName ? { id: conflictingUserId, name: conflictingUserName } : undefined),
          }));
        } else {
          hasAttemptedLockRef.current = false;
        }
      }
    };

    acquireLock();

    return () => {
      isCancelled = true;
    };
  }, [
    activeChecklist,
    currentUserId,
    currentUserName,
    effectiveReadOnly,
    isLockedByMe,
    isLockedBySomeoneElse,
    lockDcl,
    open,
    resolvedChecklistId,
  ]);

  useEffect(() => {
    if (effectiveReadOnly || !open || !resolvedChecklistId || !currentUserId) {
      return undefined;
    }

    return () => {
      if (!keepLockOnCloseRef.current && !submittedRef.current) {
        unlockDcl(resolvedChecklistId).unwrap().catch(() => {});
      }
    };
  }, [currentUserId, effectiveReadOnly, open, resolvedChecklistId, unlockDcl]);

  useEffect(() => {
    if (!activeChecklist) {
      console.warn("⚠️ No checklist available for document loading");
      setDocs([]);
      setSupportingDocs([]);
      return;
    }

    const documentArray =
      activeChecklist.documents || activeChecklist.docList || activeChecklist.items || [];

    if (!Array.isArray(documentArray) || documentArray.length === 0) {
      console.warn("⚠️ No documents found in checklist", {
        hasDocuments: !!activeChecklist.documents,
        hasDocList: !!activeChecklist.docList,
        hasItems: !!activeChecklist.items,
      });
      setDocs([]);
      return;
    }

    const flatDocs = documentArray.reduce((acc, item) => {
      if (
        item.docList &&
        Array.isArray(item.docList) &&
        item.docList.length > 0
      ) {
        const nested = item.docList.map((doc) => ({
          ...doc,
          category: item.category || doc.category,
          coStatus: doc.status || doc.action || "pending",
        }));
        return acc.concat(nested);
      }
      if (item.title || item.fileName || item.status) {
        return acc.concat(item);
      }
      return acc;
    }, []);

    const shouldForceApproved =
      effectiveReadOnly || isApprovedChecklistStatus(activeChecklist?.status);

    const processedDocs = flatDocs.map((doc, idx) => {
      const resolvedCheckerStatus = resolveCheckerStatus(
        doc,
        activeChecklist?.status,
        shouldForceApproved,
      );

      return {
        ...doc,
        key: doc.id || doc._id || `doc-${idx}`,
        status: doc.status || doc.action || "pending",
        coStatus: doc.coStatus || doc.status || doc.action || "pending",
        approved: resolvedCheckerStatus === "approved",
        checkerStatus: resolvedCheckerStatus,
        finalCheckerStatus: resolvedCheckerStatus,
        comment: doc.comment || "",
        fileUrl: doc.fileUrl || null,
        expiryDate: doc.expiryDate || doc.ExpiryDate || null,
        deferralNo: doc.deferralNo || null,
      };
    });

    const supportingDocsData = activeChecklist.supportingDocs || [];

    setSupportingDocs(supportingDocsData);
    setDocs(processedDocs);
  }, [activeChecklist, effectiveReadOnly]);

  const handlePdfDownload = async () => {
    setIsGeneratingPDF(true);
    try {
      generateChecklistPDF(
        activeChecklist,
        docs,
        documentStats,
        displayComments,
      );
      message.success("Checklist PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleUploadSupportingDoc = async (file) => {
    try {
      markChecklistEdited();
      setUploadingSupportingDoc(true);

      const checklistId = activeChecklist?.id || activeChecklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistId", checklistId);
      formData.append("documentName", file.name);
      formData.append("category", "Supporting Documents");

      const response = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid upload response");
      }

      const uploadedDoc = result.data;

      const newSupportingDoc = {
        id: uploadedDoc.id || uploadedDoc._id,
        _id: uploadedDoc._id || uploadedDoc.id,
        name: uploadedDoc.name || uploadedDoc.fileName || file.name,
        fileName: uploadedDoc.fileName || file.name,
        category: "Supporting Documents",
        status: "submitted",
        action: "submitted",
        comment: "",
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize,
        fileType: uploadedDoc.fileType,
        uploadedBy: uploadedDoc.uploadedBy,
        uploadedByRole: uploadedDoc.uploadedByRole || "checker",
        uploadedAt: uploadedDoc.createdAt || new Date().toISOString(),
        isSupporting: true,
        uploadData: {
          fileName: uploadedDoc.fileName || file.name,
          fileUrl: uploadedDoc.fileUrl,
          createdAt: uploadedDoc.createdAt || new Date().toISOString(),
          fileSize: uploadedDoc.fileSize,
          fileType: uploadedDoc.fileType,
          uploadedBy: uploadedDoc.uploadedBy || "Checker",
        },
      };

      setSupportingDocs((prevDocs) => [...prevDocs, newSupportingDoc]);

      showSuccessToast(`"${file.name}" uploaded successfully.`);
    } catch (error) {
      console.error(
        "❌ Checker Modal - Error uploading supporting doc:",
        error,
      );
      showErrorToast(error?.message || "Failed to upload supporting document");
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  const handleDocApprove = (index) => {
    markChecklistEdited();
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = true;
      updated[index].checkerStatus = "approved";
      return updated;
    });
  };

  const handleDocReject = (index) => {
    markChecklistEdited();
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = false;
      updated[index].checkerStatus = "rejected";
      return updated;
    });
  };

  const handleDocReset = (index) => {
    markChecklistEdited();
    setDocs((prev) => {
      const updated = [...prev];
      updated[index].approved = false;
      updated[index].checkerStatus = "pending";
      return updated;
    });
  };

  const submitCheckerAction = async (action) => {
    const checklistId = checklist?.id || checklist?._id;
    if (!checklistId) {
      showErrorToast("Checklist ID missing");
      return;
    }

    if (action === "approved") {
      const hasRejectedDocuments = docs.some(
        (doc) => doc.checkerStatus === "rejected",
      );
      if (hasRejectedDocuments) {
        showWarningToast("Cannot approve checklist: Some documents are rejected");
        setConfirmAction(null);
        return;
      }

      const hasUnreviewedDocuments = docs.some((doc) => {
        const status = doc.checkerStatus;
        return !status || status === "" || status === "pending";
      });

      if (hasUnreviewedDocuments) {
        showWarningToast(
          "Cannot approve checklist: Not all documents have been reviewed",
        );
        setConfirmAction(null);
        return;
      }

      const hasNonApprovedDocuments = docs.some(
        (doc) => doc.checkerStatus !== "approved",
      );

      if (hasNonApprovedDocuments) {
        showWarningToast(
          "Cannot approve checklist: All documents must be approved",
        );
        setConfirmAction(null);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        id: checklistId,
        action: action,
        checkerDecisions: docs
          .filter(
            (doc) => !doc.isNew && doc.category !== "Supporting Documents",
          )
          .map((doc) => ({
            documentId: doc.id || doc._id || doc.key,
            checkerStatus: doc.checkerStatus,
            checkerComment: doc.checkerComment || "",
          })),
        checkerComments: checkerComment,
        checkerComment: checkerComment,
      };

      await submitCheckerStatus(payload).unwrap();
      submittedRef.current = true;
      if (checklistId) {
        deleteDraft(checklistId);
        try {
          await unlockDcl(checklistId).unwrap();
        } catch (unlockError) {
          console.warn("Failed to unlock DCL after checker submission:", unlockError);
        }
      }
      setConfirmAction(null);
      handleChecklistUpdate({ ...localChecklist, status: action });
      showSuccessToast(
        action === "approved"
          ? "Checklist approved successfully!"
          : "Checklist returned successfully!",
      );
      onClose();
    } catch (err) {
      console.error(err);
      showErrorToast(err?.data?.message || "Failed to submit checklist");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      keepLockOnCloseRef.current = true;
      setIsSavingDraft(true);
      message.loading({ content: "Saving draft...", key: "saveDraft" });

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const draftData = {
        checklistId: checklistId,
        dclNo: activeChecklist?.dclNo,
        title: activeChecklist?.title,
        customerName: activeChecklist?.customerName,
        customerNumber: activeChecklist?.customerNumber,
        loanType: activeChecklist?.loanType,
        status: activeChecklist?.status,
        documents: docs.map((doc) => ({
          ...cloneDraftRecord(doc),
          _id: doc.id || doc._id,
          id: doc.id || doc._id,
          deferralNo: doc.deferralNo || doc.deferralNumber || "",
          deferralNumber: doc.deferralNumber || doc.deferralNo || "",
        })),
        creatorComment: checkerComment,
        checkerComment,
        supportingDocs: supportingDocs.map((doc) => cloneDraftRecord(doc)),
        commentTrail: buildDraftCommentTrail({
          comments: displayComments,
          currentComment: checkerComment,
          currentUserName,
          role: "checker",
        }),
      };

      saveDraftToStorage("checker", draftData, checklistId);

      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
      keepLockOnCloseRef.current = false;
      onClose?.();
      navigate(getDraftRoute("checker"));
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({
        content: error?.message || "Failed to save draft",
        key: "saveDraft",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const persistDraft = useCallback((notify = false) => {
    if (effectiveReadOnly) {
      return false;
    }

    try {
      const checklistId = activeChecklist?.id || activeChecklist?._id;
      if (!checklistId) {
        return false;
      }

      const draftData = {
        checklistId,
        dclNo: activeChecklist?.dclNo,
        title: activeChecklist?.title,
        customerName: activeChecklist?.customerName,
        customerNumber: activeChecklist?.customerNumber,
        loanType: activeChecklist?.loanType,
        status: activeChecklist?.status,
        documents: docs.map((doc) => ({
          ...cloneDraftRecord(doc),
          _id: doc.id || doc._id,
          id: doc.id || doc._id,
          deferralNo: doc.deferralNo || doc.deferralNumber || "",
          deferralNumber: doc.deferralNumber || doc.deferralNo || "",
        })),
        creatorComment: checkerComment,
        checkerComment,
        supportingDocs: supportingDocs.map((doc) => cloneDraftRecord(doc)),
        commentTrail: buildDraftCommentTrail({
          comments: displayComments,
          currentComment: checkerComment,
          currentUserName,
          role: "checker",
        }),
      };

      saveDraftToStorage("checker", draftData, checklistId);

      if (notify) {
        message.success("Draft saved successfully");
      }

      return true;
    } catch (error) {
      console.error("Auto-save draft error:", error);
      if (notify) {
        message.error(error?.message || "Failed to save draft");
      }
      return false;
    }
  }, [effectiveReadOnly, activeChecklist, docs, checkerComment, supportingDocs, displayComments, currentUserName]);

  const handleCloseWithoutSavingDraft = () => {
    keepLockOnCloseRef.current = hasLocalEdits;
    onClose?.();
  };

  const isDisabled =
    effectiveReadOnly ||
    !["CoCheckerReview", "co_checker_review", "check_review"].some(
      (status) =>
        (activeChecklist?.status || "").toLowerCase() === status.toLowerCase(),
    );
  const shouldGrayOut = effectiveReadOnly || isDisabled || isLockedBySomeoneElse;

  useEffect(() => {
    if (effectiveReadOnly || !open) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      persistDraft(false);
    }, 2000);

    const handleWindowLeave = () => {
      persistDraft(false);
    };

    window.addEventListener("beforeunload", handleWindowLeave);
    window.addEventListener("pagehide", handleWindowLeave);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleWindowLeave);
      window.removeEventListener("pagehide", handleWindowLeave);
    };
  }, [effectiveReadOnly, open, persistDraft]);

  const canApproveChecklist = () => {
    if (isDisabled) return false;
    for (let doc of docs) {
      if (doc.checkerStatus !== "approved") {
        return false;
      }
    }
    return true;
  };

  const canReturnToCreator = () => {
    if (isDisabled) return false;
    const hasRejectedDocuments = docs.some(
      (doc) => doc.checkerStatus === "rejected",
    );
    return hasRejectedDocuments;
  };

  const getApproveButtonTooltip = () => {
    if (isDisabled) return "Checklist is not in review state";
    const rejectedCount = docs.filter(
      (doc) => doc.checkerStatus === "rejected",
    ).length;
    const pendingCount = docs.filter(
      (doc) =>
        !doc.checkerStatus ||
        doc.checkerStatus === "pending" ||
        doc.checkerStatus === "",
    ).length;
    const notApprovedCount = docs.filter(
      (doc) => doc.checkerStatus !== "approved",
    ).length;

    if (rejectedCount > 0) return `${rejectedCount} document(s) are rejected`;
    if (pendingCount > 0) return `${pendingCount} document(s) are not reviewed`;
    if (notApprovedCount > 0)
      return `${notApprovedCount} document(s) are not approved`;

    return "Approve this checklist";
  };

  const getReturnToCreatorTooltip = () => {
    if (isDisabled) return "Checklist is not in review state";
    const rejectedCount = docs.filter(
      (doc) => doc.checkerStatus === "rejected",
    ).length;
    if (rejectedCount === 0) return "No rejected documents to return";
    return `Return checklist to creator with ${rejectedCount} rejected document(s)`;
  };

  if (!embedded && !open) return null;

  return (
    <>
      <DocumentSidebar
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      <style>{`
        .checker-review-overlay {
          position: fixed;
          inset: 64px 0 0 var(--sidebar-width, 150px);
          background: rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(6px);
          z-index: 990;
          transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
        }

        .checker-review-shell {
          position: absolute;
          inset: 16px;
          background: var(--color-bg);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(26, 54, 54, 0.18);
          border: 1px solid rgba(214, 189, 152, 0.2);
          display: flex;
          flex-direction: column;
        }

        .checker-review-shell__body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 20px;
        }

        .checker-review-shell--embedded {
          position: static;
          inset: auto;
          background: transparent;
          border-radius: 0;
          overflow: visible;
          box-shadow: none;
          border: none;
          display: block;
        }

        .checker-review-shell__body--embedded {
          overflow: visible;
          padding: 0;
        }

        .checker-review-embedded {
          min-height: 100%;
          background: var(--color-bg);
        }

        .checker-review-embedded__body {
          padding: 0;
        }

        .checker-review-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .checker-review-page[data-embedded="true"] {
          min-height: 100%;
        }

        .checker-review-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .checker-review-topbar-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .checker-review-back {
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid var(--color-primary-soft) !important;
          color: var(--color-primary-medium) !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .checker-review-back:hover,
        .checker-review-back:focus {
          background: rgba(214, 189, 152, 0.1) !important;
        }

        .checker-review-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }

        .checker-review-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }

        .checker-review-topbar-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .checker-review-viewdocs {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }

        .checker-review-viewdocs-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(214, 189, 152, 0.2);
          color: var(--color-text-dark);
          font-size: 9px;
          font-weight: 600;
        }

        .checker-review-close {
          width: 36px !important;
          height: 36px !important;
          border-radius: 8px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }

        .checker-review-close:hover,
        .checker-review-close:focus {
          color: var(--color-primary-dark) !important;
        }

        .checker-review-actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
        }

        .checker-review-warning {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 12px;
          line-height: 1.4;
        }

        .checker-review-warning--readonly {
          background: rgba(214, 189, 152, 0.1);
          border: 1px solid rgba(214, 189, 152, 0.2);
          color: var(--color-text-medium);
        }

        .checker-review-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .checker-review-tab {
          padding: 6px 12px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--color-text-light);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: color 150ms, border-color 150ms;
          white-space: nowrap;
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
        }

        .checker-review-tab:hover {
          color: var(--color-primary-medium);
        }

        .checker-review-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }

        .checker-review-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(300px, 3fr);
          gap: 16px;
          align-items: start;
        }

        .checker-review-details-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .checker-review-layout {
          display: block;
        }

        .checker-review-comments-card--inline {
          margin-top: 0;
        }

        .checker-review-documents {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .checker-review-title {
            font-size: 17px;
          }
        }

        @media (min-width: 1024px) {
          .checker-review-title {
            font-size: 19px;
          }
        }

        @media (min-width: 768px) and (max-width: 1099px) {
          .checker-review-overlay {
            left: var(--sidebar-width, 40px);
          }
        }

        @media (max-width: 767px) {
          .checker-review-overlay {
            left: 0;
          }

          .checker-review-shell {
            inset: 0;
            border-radius: 0;
          }

          .checker-review-shell__body {
            padding: 16px;
          }

          .checker-review-details-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {embedded ? (
        <div className="checker-review-embedded creator-theme">
          <div className="checker-review-embedded__body">
            <div className="checker-review-page" data-embedded="true">
              <div className="checker-review-topbar">
                <div className="checker-review-topbar-main">
                  <Button icon={<LeftOutlined />} className="checker-review-back" onClick={handleCloseWithoutSavingDraft}>
                    Back
                  </Button>
                  <div>
                    <h1 className="checker-review-title">Review Checklist</h1>
                    <div className="checker-review-subtitle">
                      DCL: {activeChecklist?.dclNo || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="checker-review-topbar-actions">
                  <Button
                    className="checker-review-viewdocs"
                    onClick={() => setShowDocumentSidebar(true)}
                  >
                    <UnorderedListOutlined />
                    View Documents
                    <span className="checker-review-viewdocs-count">{uploadedDocsCount}</span>
                  </Button>
                </div>
              </div>

              <div className="checker-review-actionbar">
                <ActionButtons
                  checklist={localChecklist}
                  docs={docs}
                  comments={displayComments}
                  auth={auth}
                  effectiveReadOnly={effectiveReadOnly}
                  isGeneratingPDF={isGeneratingPDF}
                  isSavingDraft={isSavingDraft}
                  uploadingSupportingDoc={uploadingSupportingDoc}
                  isDisabled={isDisabled || isLockedBySomeoneElse}
                  canApproveChecklist={canApproveChecklist}
                  canReturnToCreator={canReturnToCreator}
                  handlePdfDownload={handlePdfDownload}
                  handleSaveDraft={handleSaveDraft}
                  handleUploadSupportingDoc={handleUploadSupportingDoc}
                  setConfirmAction={setConfirmAction}
                  onClose={onClose}
                  documentStats={documentStats}
                  total={total}
                  supportingDocs={supportingDocs}
                  getApproveButtonTooltip={getApproveButtonTooltip}
                  getReturnToCreatorTooltip={getReturnToCreatorTooltip}
                />
              </div>

              {isLockedBySomeoneElse && (
                <div className="checker-review-warning checker-review-warning--readonly">
                  <LockOutlined style={{ marginTop: 2 }} />
                  <div>
                    This DCL is currently being edited by {lockedByUserName}. You cannot make changes while someone else is working on this checklist.
                  </div>
                </div>
              )}

              {shouldGrayOut && (
                <div className="checker-review-warning checker-review-warning--readonly">
                  <LockOutlined style={{ marginTop: 2 }} />
                  <div>
                    {isLockedBySomeoneElse
                      ? "Editing is locked until the current user leaves without saving a draft or submits the checklist."
                      : "This checklist status does not allow checker actions. Disabled controls are grayed out until the checklist returns to checker review."}
                  </div>
                </div>
              )}

              <div className="checker-review-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`checker-review-tab ${activeTab === tab.key ? "checker-review-tab--active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="checker-review-layout">
                {activeTab === "details" && (
                  <div className="checker-review-details-layout">
                    <div className="checker-review-details-main">
                      <ChecklistHeader checklist={activeChecklist} />
                      <ProgressStats docs={docs} />
                    </div>

                    <CommentSection
                      comments={displayComments}
                      commentsLoading={commentsLoading}
                      checkerComment={checkerComment}
                      setCheckerComment={setCheckerComment}
                      onEdit={markChecklistEdited}
                      isDisabled={shouldGrayOut}
                      className="checker-review-comments-card--inline"
                    />
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="checker-review-documents">
                    <div className="creator-table-shell">
                      <DocumentTable
                        docs={docs}
                        isDisabled={isDisabled || isLockedBySomeoneElse}
                        effectiveReadOnly={effectiveReadOnly}
                        handleDocApprove={handleDocApprove}
                        handleDocReject={handleDocReject}
                        handleDocReset={handleDocReset}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!effectiveReadOnly && confirmAction && (
            <ConfirmationModal
              confirmAction={confirmAction}
              setConfirmAction={setConfirmAction}
              loading={loading}
              submitCheckerAction={submitCheckerAction}
              canApproveChecklist={canApproveChecklist}
              canReturnToCreator={canReturnToCreator}
              checkerRejected={checkerRejected}
              total={total}
              checkerReviewed={checkerReviewed}
              checkerApproved={checkerApproved}
            />
          )}
        </div>
      ) : (
        <div
          className="checker-review-overlay"
          onClick={handleCloseWithoutSavingDraft}
        >
          <div
            className="checker-review-shell"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="checker-review-shell__body creator-theme">
              <div className="checker-review-page">
                <div className="checker-review-topbar">
                  <div className="checker-review-topbar-main">
                    <Button icon={<LeftOutlined />} className="checker-review-back" onClick={handleCloseWithoutSavingDraft}>
                      Back
                    </Button>
                    <div>
                      <h1 className="checker-review-title">Review Checklist</h1>
                      <div className="checker-review-subtitle">
                        DCL: {activeChecklist?.dclNo || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="checker-review-topbar-actions">
                    <Button
                      className="checker-review-viewdocs"
                      onClick={() => setShowDocumentSidebar(true)}
                    >
                      <UnorderedListOutlined />
                      View Documents
                      <span className="checker-review-viewdocs-count">{uploadedDocsCount}</span>
                    </Button>
                    <Button
                      className="checker-review-close"
                      icon={<CloseOutlined />}
                      onClick={handleCloseWithoutSavingDraft}
                    />
                  </div>
                </div>

                <div className="checker-review-actionbar">
                  <ActionButtons
                    checklist={localChecklist}
                    docs={docs}
                    comments={displayComments}
                    auth={auth}
                    effectiveReadOnly={effectiveReadOnly}
                    isGeneratingPDF={isGeneratingPDF}
                    isSavingDraft={isSavingDraft}
                    uploadingSupportingDoc={uploadingSupportingDoc}
                    isDisabled={isDisabled || isLockedBySomeoneElse}
                    canApproveChecklist={canApproveChecklist}
                    canReturnToCreator={canReturnToCreator}
                    handlePdfDownload={handlePdfDownload}
                    handleSaveDraft={handleSaveDraft}
                    handleUploadSupportingDoc={handleUploadSupportingDoc}
                    setConfirmAction={setConfirmAction}
                    onClose={onClose}
                    documentStats={documentStats}
                    total={total}
                    supportingDocs={supportingDocs}
                    getApproveButtonTooltip={getApproveButtonTooltip}
                    getReturnToCreatorTooltip={getReturnToCreatorTooltip}
                  />
                </div>

                {isLockedBySomeoneElse && (
                  <div className="checker-review-warning checker-review-warning--readonly">
                    <LockOutlined style={{ marginTop: 2 }} />
                    <div>
                      This DCL is currently being edited by {lockedByUserName}. You cannot make changes while someone else is working on this checklist.
                    </div>
                  </div>
                )}

                {shouldGrayOut && (
                  <div className="checker-review-warning checker-review-warning--readonly">
                    <LockOutlined style={{ marginTop: 2 }} />
                    <div>
                      {isLockedBySomeoneElse
                        ? "Editing is locked until the current user leaves without saving a draft or submits the checklist."
                        : "This checklist status does not allow checker actions. Disabled controls are grayed out until the checklist returns to checker review."}
                    </div>
                  </div>
                )}

                <div className="checker-review-tabs">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`checker-review-tab ${activeTab === tab.key ? "checker-review-tab--active" : ""}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="checker-review-layout">
                  {activeTab === "details" && (
                    <div className="checker-review-details-layout">
                      <div className="checker-review-details-main">
                        <ChecklistHeader checklist={activeChecklist} />
                        <ProgressStats docs={docs} />
                      </div>

                      <CommentSection
                        comments={displayComments}
                        commentsLoading={commentsLoading}
                        checkerComment={checkerComment}
                        setCheckerComment={setCheckerComment}
                        onEdit={markChecklistEdited}
                        isDisabled={shouldGrayOut}
                        className="checker-review-comments-card--inline"
                      />
                    </div>
                  )}

                  {activeTab === "documents" && (
                    <div className="checker-review-documents">
                      <div className="creator-table-shell">
                        <DocumentTable
                          docs={docs}
                          isDisabled={isDisabled || isLockedBySomeoneElse}
                          effectiveReadOnly={effectiveReadOnly}
                          handleDocApprove={handleDocApprove}
                          handleDocReject={handleDocReject}
                          handleDocReset={handleDocReset}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!effectiveReadOnly && confirmAction && (
              <ConfirmationModal
                confirmAction={confirmAction}
                setConfirmAction={setConfirmAction}
                loading={loading}
                submitCheckerAction={submitCheckerAction}
                canApproveChecklist={canApproveChecklist}
                canReturnToCreator={canReturnToCreator}
                checkerRejected={checkerRejected}
                total={total}
                checkerReviewed={checkerReviewed}
                checkerApproved={checkerApproved}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CheckerReviewChecklistModal;
