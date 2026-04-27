import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Input, Spin } from "antd";
import {
  LeftOutlined,
  LockOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  useAddDocumentMutation,
  useDeleteDocumentMutation,
  useGetChecklistCommentsQuery,
  useGetCoCreatorChecklistByIdQuery,
  useLockDclMutation,
  useUnlockDclMutation,
} from "../../../api/checklistApi";
import { useDocumentHandlers } from "../../../hooks/useDocumentHandlers";
import { useChecklistOperations } from "../../../hooks/useChecklistOperations";
import { getUniqueCategories } from "../../../utils/checklistUtils";
import {
  saveDraft as saveDraftToStorage,
  deleteDraft,
  getDraftRoute,
} from "../../../utils/draftsUtils";
import { showErrorToast, showSuccessToast, showWarningToast } from "../../../utils/authToast";
import { loanTypeDocuments } from "../../../pages/docTypes";
import { message } from "antd";
import "../../../styles/creatorDesignSystem.css";
import dayjs from "dayjs";
import deferralApi from "../../../service/deferralApi";
import { API_ORIGIN } from "../../../config/runtimeConfig";

import ActionButtons from "./ActionButtons";
import AddDocumentModal from "../../common/AddDocumentModal";
import ChecklistHeader from "./ChecklistHeader";
import CommentHistory from "../../common/CommentHistory";
import DocumentSidebar from "./DocumentSidebar";
import DocumentTable from "./DocumentTable";
import ProgressStats from "./ProgressStats";

const TABS = [
  { key: "details", label: "Checklist Details" },
  { key: "documents", label: "Required Documents" },
];

const cloneDraftRecord = (record) => {
  if (!record || typeof record !== "object") {
    return record;
  }

  return JSON.parse(JSON.stringify(record));
};

const buildDraftCommentTrail = ({ comments, creatorComment, currentUserName }) => {
  const persistedComments = Array.isArray(comments)
    ? comments.map((comment) => cloneDraftRecord(comment)).filter(Boolean)
    : [];

  const normalizedDraftComment = String(creatorComment || "").trim();
  if (!normalizedDraftComment) {
    return persistedComments;
  }

  const alreadyPresent = persistedComments.some((comment) => {
    const message = String(comment?.message || comment?.comment || "").trim();
    return message === normalizedDraftComment;
  });

  if (alreadyPresent) {
    return persistedComments;
  }

  return [
    {
      _id: "draft-comment",
      message: normalizedDraftComment,
      comment: normalizedDraftComment,
      createdAt: new Date().toISOString(),
      userName: currentUserName,
      role: "cocreator",
      isDraftComment: true,
      userId: {
        name: currentUserName,
        role: "cocreator",
      },
    },
    ...persistedComments,
  ];
};

const normalizeLookupValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeSupportingUpload = (doc) => ({
  ...doc,
  category: "Supporting Documents",
  isSupporting: true,
  fileUrl: doc.fileUrl || doc.uploadData?.fileUrl || doc.url || "",
  fileName:
    doc.fileName || doc.name || doc.uploadData?.fileName || "Supporting document",
});

const dedupeSupportingUploads = (uploads = []) => {
  const seen = new Set();
  return uploads.filter((doc) => {
    const idKey = String(doc.id || doc._id || "").trim().toLowerCase();
    const urlKey = String(doc.fileUrl || doc.url || "").trim().toLowerCase();
    const nameKey = String(doc.fileName || doc.name || "").trim().toLowerCase();
    const key = idKey || `${urlKey}|${nameKey}`;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const isDeferredAction = (value) =>
  ["deferred", "deferralrequested", "defferalrequested"].includes(
    normalizeLookupValue(value).replace(/[^a-z]/g, ""),
  );

const getResolvedCheckerStatus = (doc, parentDoc = null) =>
  doc?.checkerStatus ||
  doc?.finalCheckerStatus ||
  doc?.coCheckerStatus ||
  doc?.co_checker_status ||
  parentDoc?.checkerStatus ||
  parentDoc?.finalCheckerStatus ||
  parentDoc?.coCheckerStatus ||
  parentDoc?.co_checker_status ||
  null;

const isDeferralFullyApproved = (deferral) => {
  const normalizedStatus = normalizeLookupValue(deferral?.status).replace(
    /[^a-z]/g,
    "",
  );
  const creatorApproved = normalizeLookupValue(
    deferral?.creatorApprovalStatus,
  ) === "approved";
  const checkerApproved = normalizeLookupValue(
    deferral?.checkerApprovalStatus,
  ) === "approved";
  const allApproversApproved = deferral?.allApproversApproved === true;

  return (
    normalizedStatus === "approved" &&
    creatorApproved &&
    checkerApproved &&
    allApproversApproved
  );
};

const ReviewChecklistPage = ({
  checklistId: checklistIdProp,
  initialChecklist = null,
  onClose,
  embedded = false,
  readOnly = false,
}) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");
  const resolvedChecklistId = checklistIdProp || id;
  const restoredDraft = location.state?.restoredDraft || null;
  const restoredDraftData = restoredDraft?.data || null;

  const [activeTab, setActiveTab] = useState(
    location.state?.initialTab === "documents" ? "documents" : "details",
  );
  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [creatorComment, setCreatorComment] = useState("");
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [localChecklist, setLocalChecklist] = useState(initialChecklist);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isUploadingSupportingDoc, setIsUploadingSupportingDoc] = useState(false);
  const [deferralValidationByDoc, setDeferralValidationByDoc] = useState({});
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const hasAttemptedLockRef = useRef(false);
  const keepLockOnCloseRef = useRef(false);
  const submittedRef = useRef(false);
  const hydrationKeyRef = useRef(null);
  const pendingUnlockTimeoutRef = useRef(null);
  const activeLockChecklistIdRef = useRef(null);

  const {
    data: checklistData,
    isLoading,
    isFetching,
    refetch: refetchChecklist,
  } = useGetCoCreatorChecklistByIdQuery(resolvedChecklistId, {
    skip: !resolvedChecklistId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const checklist = localChecklist || checklistData;
  const checklistId = checklist?.id || checklist?._id;
  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
      return;
    }

    navigate("/cocreator");
  };

  const { data: comments = [], isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklistId, {
      skip: !checklistId,
    });

  const currentUserId = auth?.user?.id || auth?.user?._id;
  const currentUserName = auth?.user?.name || auth?.user?.username || "Current User";
  const displayComments = useMemo(() => {
    if (Array.isArray(restoredDraftData?.commentTrail) && restoredDraftData.commentTrail.length > 0) {
      return restoredDraftData.commentTrail;
    }

    return comments;
  }, [comments, restoredDraftData]);

  const persistDraft = useCallback((notify = false) => {
    if (readOnly) {
      return false;
    }

    try {
      if (!checklistId) {
        return false;
      }

      const draftData = {
        checklistId,
        dclNo: checklist?.dclNo,
        title: checklist?.title,
        customerName: checklist?.customerName,
        customerNumber: checklist?.customerNumber,
        loanType: checklist?.loanType,
        status: checklist?.status,
        documents: docs.map((doc) => ({
          ...cloneDraftRecord(doc),
          _id: doc._id || doc.id,
          id: doc.id || doc._id,
          status: doc.status || doc.action,
          action: doc.action || doc.status,
          checkerStatus: getResolvedCheckerStatus(doc),
          finalCheckerStatus: getResolvedCheckerStatus(doc),
          deferralNo: doc.deferralNo || doc.deferralNumber || "",
          deferralNumber: doc.deferralNumber || doc.deferralNo || "",
        })),
        creatorComment,
        supportingDocs: supportingDocs.map((doc) => cloneDraftRecord(doc)),
        commentTrail: buildDraftCommentTrail({
          comments,
          creatorComment,
          currentUserName,
        }),
      };

      saveDraftToStorage("cocreator", draftData, checklistId);

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
  }, [readOnly, checklistId, checklist, docs, creatorComment, supportingDocs, comments, currentUserName]);

  const handleCloseWithoutSavingDraft = () => {
    keepLockOnCloseRef.current = hasLocalEdits;
    handleClose();
  };

  const markChecklistEdited = useCallback(() => {
    if (readOnly) {
      return;
    }

    keepLockOnCloseRef.current = true;
    setHasLocalEdits((prev) => (prev ? prev : true));
  }, [readOnly]);

  const [addDocumentMutation] = useAddDocumentMutation();
  const [deleteDocumentMutation] = useDeleteDocumentMutation();
  const [lockDcl] = useLockDclMutation();
  const [unlockDcl] = useUnlockDclMutation();

  const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
  const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
  const isLockedBySomeoneElse = lockedByUserId && lockedByUserId !== currentUserId;

  const checklistStatus = (checklist?.status || "").toLowerCase();
  const isCreatorReviewAllowed = ["pending", "cocreatorreview", "co_creator_review"].includes(checklistStatus);
  const shouldGrayOut = readOnly || !isCreatorReviewAllowed || isLockedBySomeoneElse;
  const isActionDisabled = readOnly;

  useEffect(() => {
    hasAttemptedLockRef.current = false;
    keepLockOnCloseRef.current = false;
    submittedRef.current = false;
    setHasLocalEdits(false);

    if (pendingUnlockTimeoutRef.current) {
      window.clearTimeout(pendingUnlockTimeoutRef.current);
      pendingUnlockTimeoutRef.current = null;
    }
  }, [checklistId]);

  useEffect(() => {
    if (
      checklistId &&
      currentUserId &&
      lockedByUserId &&
      String(lockedByUserId) === String(currentUserId)
    ) {
      activeLockChecklistIdRef.current = checklistId;
    }
  }, [checklistId, currentUserId, lockedByUserId]);

  useEffect(() => {
    if (
      readOnly ||
      !checklistId ||
      !currentUserId ||
      !isCreatorReviewAllowed ||
      isLockedBySomeoneElse ||
      lockedByUserId === currentUserId ||
      hasAttemptedLockRef.current
    ) {
      return;
    }

    let isCancelled = false;
    hasAttemptedLockRef.current = true;

    const acquireLock = async () => {
      try {
        await lockDcl(checklistId).unwrap();
        if (isCancelled) {
          return;
        }

        activeLockChecklistIdRef.current = checklistId;

        setLocalChecklist((prev) => ({
          ...(prev || checklist || {}),
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
            ...(prev || checklist || {}),
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
    checklist,
    checklistId,
    currentUserId,
    currentUserName,
    isCreatorReviewAllowed,
    isLockedBySomeoneElse,
    lockDcl,
    lockedByUserId,
    readOnly,
  ]);

  useEffect(() => {
    if (readOnly || !checklistId || !currentUserId) {
      return undefined;
    }

    if (pendingUnlockTimeoutRef.current) {
      window.clearTimeout(pendingUnlockTimeoutRef.current);
      pendingUnlockTimeoutRef.current = null;
    }

    return () => {
      if (
        !keepLockOnCloseRef.current &&
        !submittedRef.current &&
        activeLockChecklistIdRef.current === checklistId
      ) {
        pendingUnlockTimeoutRef.current = window.setTimeout(() => {
          if (!keepLockOnCloseRef.current && !submittedRef.current) {
            unlockDcl(checklistId).unwrap().catch(() => {});
            activeLockChecklistIdRef.current = null;
          }

          pendingUnlockTimeoutRef.current = null;
        }, 250);
      }
    };
  }, [checklistId, currentUserId, readOnly, unlockDcl]);

  const {
    handleNameChange,
    handleActionChange: baseHandleActionChange,
    handleCommentChange,
    handleDeferralNoChange: baseHandleDeferralNoChange,
    handleDelete,
    handleExpiryDateChange,
    handleViewFile,
  } = useDocumentHandlers(docs, setDocs, isActionDisabled);

  const getChecklistCustomerContext = () => ({
    customerNumber: normalizeLookupValue(
      checklist?.customerNumber || localChecklist?.customerNumber,
    ),
    customerName: normalizeLookupValue(
      checklist?.customerName || localChecklist?.customerName,
    ),
    dclNumber: normalizeLookupValue(
      checklist?.dclNo ||
        checklist?.dclNumber ||
        localChecklist?.dclNo ||
        localChecklist?.dclNumber,
    ),
  });

  const clearDeferralValidation = (docIdx) => {
    setDeferralValidationByDoc((prev) => {
      if (!(docIdx in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[docIdx];
      return next;
    });
  };

  const markDeferralValidationPending = (docIdx) => {
    setDeferralValidationByDoc((prev) => ({
      ...prev,
      [docIdx]: {
        status: "idle",
        message: "This deferral number will be checked before submission to Co-Checker.",
      },
    }));
  };

  const validateDeferredDocument = async (docIdx, valueOverride, options = {}) => {
    const doc = docs.find((entry) => entry.docIdx === docIdx);
    const deferralNumber = String(
      valueOverride ?? doc?.deferralNo ?? doc?.deferralNumber ?? "",
    ).trim();

    if (!doc || !isDeferredAction(doc.action || doc.status)) {
      clearDeferralValidation(docIdx);
      return { valid: true, skipped: true };
    }

    if (!deferralNumber) {
      const missingResult = {
        status: "invalid",
        message: "Enter a deferral number before sending to Co-Checker.",
      };
      setDeferralValidationByDoc((prev) => ({
        ...prev,
        [docIdx]: missingResult,
      }));
      return { valid: false, ...missingResult };
    }

    setDeferralValidationByDoc((prev) => ({
      ...prev,
      [docIdx]: {
        status: "validating",
        message: "Checking deferral number...",
      },
    }));

    try {
      const matches = await deferralApi.searchDeferrals({ deferralNumber }, token);
      const exactMatches = (Array.isArray(matches) ? matches : []).filter(
        (item) => normalizeLookupValue(item?.deferralNumber) === normalizeLookupValue(deferralNumber),
      );

      if (!exactMatches.length) {
        const invalidResult = {
          status: "invalid",
          message: `Deferral number ${deferralNumber} is invalid.`,
        };
        setDeferralValidationByDoc((prev) => ({
          ...prev,
          [docIdx]: invalidResult,
        }));
        return { valid: false, ...invalidResult };
      }

      const customerContext = getChecklistCustomerContext();
      const matchedDeferral = exactMatches.find((item) => {
        const resultCustomerNumber = normalizeLookupValue(item?.customerNumber);
        const resultCustomerName = normalizeLookupValue(item?.customerName);
        const resultDclNumber = normalizeLookupValue(item?.dclNumber || item?.dclNo);

        if (customerContext.customerNumber && resultCustomerNumber) {
          return customerContext.customerNumber === resultCustomerNumber;
        }

        if (customerContext.customerName && resultCustomerName) {
          return customerContext.customerName === resultCustomerName;
        }

        if (customerContext.dclNumber && resultDclNumber) {
          return customerContext.dclNumber === resultDclNumber;
        }

        return true;
      });

      if (!matchedDeferral) {
        const customerMismatchResult = {
          status: "invalid",
          message: "This deferral number does not belong to this checklist customer.",
        };
        setDeferralValidationByDoc((prev) => ({
          ...prev,
          [docIdx]: customerMismatchResult,
        }));
        return { valid: false, ...customerMismatchResult };
      }

      const fullDeferral = await deferralApi.getDeferralById(matchedDeferral.id, token);

      if (!isDeferralFullyApproved(fullDeferral)) {
        const notApprovedResult = {
          status: "invalid",
          message: "This deferral is not yet fully approved by all approvers, co-creator and co-checker.",
        };
        setDeferralValidationByDoc((prev) => ({
          ...prev,
          [docIdx]: notApprovedResult,
        }));
        return { valid: false, ...notApprovedResult };
      }

      const validResult = {
        status: "valid",
        message: "Deferral number verified and fully approved.",
        approvedAtText: fullDeferral?.checkerApprovalDate
          ? dayjs(fullDeferral.checkerApprovalDate).format("DD MMM YYYY")
          : "",
        deferral: fullDeferral,
      };
      setDeferralValidationByDoc((prev) => ({
        ...prev,
        [docIdx]: validResult,
      }));
      return { valid: true, ...validResult };
    } catch (error) {
      const failedResult = {
        status: "invalid",
        message:
          error?.message || "Unable to validate deferral approval right now.",
      };
      setDeferralValidationByDoc((prev) => ({
        ...prev,
        [docIdx]: failedResult,
      }));
      if (!options.silent) {
        message.error(failedResult.message);
      }
      return { valid: false, ...failedResult };
    }
  };

  const applyDeferredSubmissionErrorToRows = (errorMessage) => {
    const messageText = String(errorMessage || "").trim();
    if (!messageText) {
      return;
    }

    const deferralNumberMatch = messageText.match(/Deferral number\s+([^\s]+)\s+/i);
    const documentNameMatch = messageText.match(/Deferred document '([^']+)'/i);
    const matchedDeferralNumber = deferralNumberMatch?.[1]?.trim();
    const matchedDocumentName = documentNameMatch?.[1]?.trim();

    const matchingDocs = docs.filter((doc) => {
      if (!isDeferredAction(doc.action || doc.status)) {
        return false;
      }

      if (matchedDeferralNumber) {
        const docDeferralNumber = String(
          doc.deferralNo || doc.deferralNumber || "",
        ).trim();
        return docDeferralNumber.toLowerCase() === matchedDeferralNumber.toLowerCase();
      }

      if (matchedDocumentName) {
        return String(doc.name || "").trim().toLowerCase() === matchedDocumentName.toLowerCase();
      }

      return true;
    });

    if (!matchingDocs.length) {
      return;
    }

    setDeferralValidationByDoc((prev) => {
      const next = { ...prev };
      matchingDocs.forEach((doc) => {
        next[doc.docIdx] = {
          status: "invalid",
          message: messageText,
        };
      });
      return next;
    });
  };

  const handleActionChange = (docIdx, value) => {
    markChecklistEdited();
    baseHandleActionChange(docIdx, value);

    setDocs((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.docIdx !== docIdx) {
          return doc;
        }

        return {
          ...doc,
          action: value,
          status: value,
          deferralNo: "",
          deferralNumber: "",
        };
      }),
    );

    clearDeferralValidation(docIdx);
  };

  const handleDeferralNoChange = (docIdx, value) => {
    markChecklistEdited();
    baseHandleDeferralNoChange(docIdx, value);
    markDeferralValidationPending(docIdx);
  };

  const handleDocumentNameChange = (docIdx, value) => {
    markChecklistEdited();
    handleNameChange(docIdx, value);
  };

  const handleDocumentCommentChange = (docIdx, value) => {
    markChecklistEdited();
    handleCommentChange(docIdx, value);
  };

  const handleDocumentExpiryDateChange = (docIdx, value) => {
    markChecklistEdited();
    handleExpiryDateChange(docIdx, value);
  };

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
  };

  const {
    isSubmittingToRM,
    isCheckerSubmitting,
    isSavingDraft,
    submitToRM,
    submitToCheckers,
  } = useChecklistOperations(
    checklist,
    docs,
    supportingDocs,
    creatorComment,
    null,
    handleChecklistUpdate,
    () => {
      refetchChecklist();
    },
  );

  const handleExplicitDraftSave = async () => {
    const saved = persistDraft(true);

    if (!saved) {
      return false;
    }

    keepLockOnCloseRef.current = false;
    handleClose?.();
    navigate(getDraftRoute("cocreator"));
    return true;
  };

  const submitToRMWithUnlock = async () => {
    const result = await submitToRM();
    submittedRef.current = true;
    if (checklistId) {
      deleteDraft(checklistId);
      try {
        await unlockDcl(checklistId).unwrap();
        activeLockChecklistIdRef.current = null;
      } catch (error) {
        console.warn("Failed to unlock DCL after RM submission:", error);
      }
    }
    return result;
  };

  const submitToCheckersWithUnlock = async () => {
    const deferredDocs = docs.filter((doc) =>
      isDeferredAction(doc.action || doc.status),
    );

    for (const doc of deferredDocs) {
      const validationResult = await validateDeferredDocument(
        doc.docIdx,
        doc.deferralNo || doc.deferralNumber || "",
        { silent: true },
      );

      if (!validationResult.valid) {
        showWarningToast(
          validationResult.message || "Fix deferred rows before submitting.",
        );
        return false;
      }
    }

    let result;
    try {
      result = await submitToCheckers();
    } catch (error) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        "Failed to submit checklist.";
      applyDeferredSubmissionErrorToRows(errorMessage);
      showErrorToast(errorMessage);
      return false;
    }

    if (checklistId) {
      submittedRef.current = true;
      deleteDraft(checklistId);
      try {
        await unlockDcl(checklistId).unwrap();
        activeLockChecklistIdRef.current = null;
      } catch (error) {
        console.warn("Failed to unlock DCL after checker submission:", error);
      }
    }
    return result;
  };

  const handleDeleteDocument = async (docIdx) => {
    if (isActionDisabled) return;

    const documentToDelete = docs[docIdx];
    if (!documentToDelete || !checklistId) return;

    const documentId = documentToDelete._id || documentToDelete.id;

    try {
      markChecklistEdited();
      if (documentId && !documentToDelete.isNew) {
        await deleteDocumentMutation({ id: checklistId, docId: documentId }).unwrap();
      }

      handleDelete(docIdx);
    } catch (error) {
      console.error("Error deleting document:", error);
      message.error(error?.data?.message || error?.data?.error || "Failed to delete document");
    }
  };

  const getAvailableCategories = () => {
    const loanType = checklist?.loanType;
    if (loanType && loanTypeDocuments[loanType]) {
      return loanTypeDocuments[loanType].map((cat) => cat.title);
    }
    return getUniqueCategories(docs);
  };

  const handleAddDocument = async (newDoc) => {
    if (readOnly) {
      return;
    }

    if (!checklistId) {
      message.error("Checklist ID missing - cannot add document");
      return;
    }

    try {
      markChecklistEdited();
      const documentData = {
        name: newDoc.name,
        category: newDoc.category,
        status: newDoc.status || "pending",
        comment: newDoc.comment || "",
      };

      const result = await addDocumentMutation({
        id: checklistId,
        data: documentData,
      }).unwrap();

      const savedDoc = {
        ...newDoc,
        docIdx: docs.length,
        _id:
          result?.document?._id ||
          result?.document?.id ||
          result?._id ||
          result?.id,
        id:
          result?.document?.id ||
          result?.document?._id ||
          result?.id ||
          result?._id,
        status: result?.document?.status || newDoc.status || "pending",
      };

      setDocs((prevDocs) => [...prevDocs, savedDoc]);
      message.success("Document added successfully");

      if (result?.checklist) {
        handleChecklistUpdate(result.checklist);
      }
    } catch (error) {
      console.error("Error adding document:", error);
      message.error(error?.data?.message || error?.data?.error || "Failed to add document");
      setDocs((prevDocs) => [
        ...prevDocs,
        {
          ...newDoc,
          docIdx: prevDocs.length,
          isNew: true,
        },
      ]);
    }
  };

  const handleUploadSupportingDoc = async (file) => {
    if (readOnly) {
      return;
    }

    try {
      markChecklistEdited();
      setIsUploadingSupportingDoc(true);

      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistId", checklistId);
      formData.append("documentName", file.name);
      formData.append("category", "Supporting Documents");

      const response = await fetch(`${API_ORIGIN}/api/uploads`, {
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
      const uploadedDoc = result.data;

      const newSupportingDoc = {
        id: uploadedDoc.id || uploadedDoc._id,
        _id: uploadedDoc._id || uploadedDoc.id,
        name: uploadedDoc.name || uploadedDoc.fileName || file.name,
        fileName: uploadedDoc.fileName || file.name,
        category: "Supporting Documents",
        status: "submitted",
        action: "submitted",
        creatorStatus: "submitted",
        checkerStatus: null,
        comment: "",
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize,
        fileType: uploadedDoc.fileType,
        uploadedBy: uploadedDoc.uploadedBy,
        uploadedByRole: uploadedDoc.uploadedByRole || auth?.user?.role || "cocreator",
        uploadedAt: uploadedDoc.createdAt || new Date().toISOString(),
        isSupporting: true,
        uploadData: {
          fileName: uploadedDoc.fileName || file.name,
          fileUrl: uploadedDoc.fileUrl,
          createdAt: uploadedDoc.createdAt || new Date().toISOString(),
          fileSize: uploadedDoc.fileSize,
          fileType: uploadedDoc.fileType,
          uploadedBy: uploadedDoc.uploadedBy || auth?.user?.name || "Co-Creator",
        },
      };

      setSupportingDocs((prevDocs) =>
        dedupeSupportingUploads([
          ...prevDocs.map(normalizeSupportingUpload),
          normalizeSupportingUpload(newSupportingDoc),
        ]),
      );
      showSuccessToast(`"${file.name}" uploaded successfully.`);
    } catch (error) {
      console.error("Error uploading supporting document:", error);
      showErrorToast(error?.message || "Failed to upload supporting document");
      throw error;
    } finally {
      setIsUploadingSupportingDoc(false);
    }
  };

  useEffect(() => {
    hydrationKeyRef.current = null;
  }, [resolvedChecklistId, restoredDraft?.id]);

  useEffect(() => {
    const baseChecklist = checklistData || initialChecklist || null;

    if (!baseChecklist && !restoredDraftData) {
      setLocalChecklist(null);
      setCreatorComment("");
      return;
    }

    const hydrationKey = restoredDraft?.id
      ? `draft:${restoredDraft.id}`
      : baseChecklist
        ? `checklist:${resolvedChecklistId}`
        : null;

    if (!hydrationKey || hydrationKeyRef.current === hydrationKey) {
      return;
    }

    const mergedChecklist = restoredDraftData
      ? {
          ...(baseChecklist || {}),
          id:
            baseChecklist?.id ||
            baseChecklist?._id ||
            restoredDraftData.checklistId ||
            restoredDraft?.id,
          _id:
            baseChecklist?._id ||
            baseChecklist?.id ||
            restoredDraftData.checklistId ||
            restoredDraft?.id,
          dclNo: restoredDraftData.dclNo || baseChecklist?.dclNo,
          title: restoredDraftData.title || baseChecklist?.title,
          customerName:
            restoredDraftData.customerName || baseChecklist?.customerName,
          customerNumber:
            restoredDraftData.customerNumber || baseChecklist?.customerNumber,
          loanType: restoredDraftData.loanType || baseChecklist?.loanType,
          status: restoredDraftData.status || baseChecklist?.status,
          documents:
            restoredDraftData.documents ||
            baseChecklist?.documents ||
            baseChecklist?.docList ||
            [],
          supportingDocs:
            restoredDraftData.supportingDocs ||
            baseChecklist?.supportingDocs ||
            [],
        }
      : baseChecklist;

    setLocalChecklist(mergedChecklist);
    setCreatorComment(
      restoredDraftData?.creatorComment || mergedChecklist?.creatorComment || "",
    );
    hydrationKeyRef.current = hydrationKey;
  }, [
    checklistData,
    initialChecklist,
    resolvedChecklistId,
    restoredDraft,
    restoredDraftData,
  ]);

  useEffect(() => {
    if (location.state?.initialTab === "documents") {
      setActiveTab("documents");
      return;
    }

    setActiveTab("details");
  }, [resolvedChecklistId, location.state]);

  useEffect(() => {
    const sourceChecklist = localChecklist || checklistData;
    if (!sourceChecklist) {
      setDocs([]);
      setSupportingDocs([]);
      return;
    }

    const documentArray =
      sourceChecklist.documents ||
      sourceChecklist.docList ||
      sourceChecklist.items ||
      [];

    const flatDocs = Array.isArray(documentArray)
      ? documentArray.reduce((acc, item) => {
          if (item.docList && Array.isArray(item.docList) && item.docList.length > 0) {
            const nestedDocs = item.docList.map((doc) => ({
              ...doc,
              category: item.category || doc.category,
                checkerStatus: getResolvedCheckerStatus(doc, item),
                finalCheckerStatus:
                  doc.finalCheckerStatus ||
                  item.finalCheckerStatus ||
                  getResolvedCheckerStatus(doc, item),
                coCheckerStatus: doc.coCheckerStatus || item.coCheckerStatus,
                co_checker_status:
                  doc.co_checker_status || item.co_checker_status,
            }));
            return acc.concat(nestedDocs);
          }

          if (item.title || item.fileName || item.status || item.name) {
            return acc.concat(item);
          }

          return acc;
        }, [])
      : [];

    setDocs(
      flatDocs
        .map((doc, idx) => ({
          ...doc,
          docIdx: idx,
          fileName: doc.fileName || doc.uploadData?.fileName || null,
          fileType: doc.fileType || doc.uploadData?.fileType || null,
          fileSize: doc.fileSize || doc.uploadData?.fileSize || null,
          status: doc.status || doc.action || "pending",
          creatorStatus: doc.creatorStatus,
          checkerStatus: getResolvedCheckerStatus(doc),
          finalCheckerStatus: getResolvedCheckerStatus(doc),
          checkerComment: doc.checkerComment || "",
          action: doc.action || doc.status || "pending",
          comment: doc.comment || "",
          fileUrl: doc.fileUrl || null,
          expiryDate: doc.expiryDate || doc.ExpiryDate || null,
          deferralNumber: doc.deferralNumber || doc.deferralNo || "",
          deferralNo: doc.deferralNo || doc.deferralNumber || "",
          rmStatus: doc.rmStatus || "",
        }))
        .filter(
          (doc) =>
            normalizeLookupValue(doc.category) !==
            normalizeLookupValue("Supporting Documents"),
        ),
    );

    setSupportingDocs(
      dedupeSupportingUploads(
        (sourceChecklist.supportingDocs || []).map(normalizeSupportingUpload),
      ),
    );
    setDeferralValidationByDoc({});
  }, [localChecklist, checklistData]);

  // Fetch supporting docs from backend when checklist changes
  useEffect(() => {
    if (!checklistId) return;

    const fetchSupportingDocs = async () => {
      try {
        const response = await fetch(
          `${API_ORIGIN}/api/uploads/checklist/${checklistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          const docsWithCategory = dedupeSupportingUploads(
            result.data
              .filter((doc) => {
                const category = normalizeLookupValue(doc.category);
                const hasSupportingCategory =
                  category === normalizeLookupValue("Supporting Documents");
                const hasNoCategory = !category;
                const isNotDeleted =
                  normalizeLookupValue(doc.status || doc.uploadData?.status) !==
                  "deleted";
                // Allow RM and Co-creator supporting uploads in the same sidebar.
                return (hasSupportingCategory || hasNoCategory) && isNotDeleted;
              })
              .map(normalizeSupportingUpload),
          );
          setSupportingDocs(docsWithCategory);
        }
      } catch (error) {
        console.error("Error fetching supporting docs:", error);
      }
    };

    fetchSupportingDocs();
  }, [checklistId, token]);

  useEffect(() => {
    if (readOnly || !checklistId) {
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
  }, [readOnly, checklistId, persistDraft]);

  const uploadedDocumentCount = useMemo(() => {
    const mainDocumentCount = docs.filter((doc) => doc.fileUrl || doc.uploadData?.fileUrl).length;
    const supportingDocumentCount = supportingDocs.filter((doc) => doc.fileUrl).length;
    return mainDocumentCount + supportingDocumentCount;
  }, [docs, supportingDocs]);

  const hasBlockingDeferredValidation = useMemo(() => {
    const deferredDocs = docs.filter((doc) =>
      isDeferredAction(doc.action || doc.status),
    );

    if (!deferredDocs.length) {
      return false;
    }

    return deferredDocs.some((doc) => {
      const deferralNumber = String(doc.deferralNo || doc.deferralNumber || "").trim();
      const validationState = deferralValidationByDoc?.[doc.docIdx];

      if (!deferralNumber) {
        return true;
      }

      if (!validationState) {
        return true;
      }

      return validationState.status !== "valid";
    });
  }, [deferralValidationByDoc, docs]);

  if (!checklist && (isLoading || isFetching)) {
    return (
      <div className="creator-theme" style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="creator-theme" style={{ padding: 24 }}>
        <Empty description="Checklist not found" />
      </div>
    );
  }

  return (
    <div className="creator-theme" style={{ minHeight: "100%", background: "var(--color-bg)" }}>
      <style>{`
        .creator-review-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .creator-review-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .creator-review-topbar-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .creator-review-back {
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid var(--color-primary-soft) !important;
          color: var(--color-primary-medium) !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .creator-review-back:hover,
        .creator-review-back:focus {
          background: rgba(214, 189, 152, 0.1) !important;
        }
        .creator-review-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }
        .creator-review-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .creator-review-viewdocs {
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
        .creator-review-viewdocs-count {
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
        .creator-review-actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
        }
        .creator-review-layout {
          display: block;
        }
        .creator-review-main {
          min-width: 0;
        }
        .creator-review-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 16px;
          align-items: start;
        }
        .creator-review-details-main {
          min-width: 0;
        }
        .creator-review-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .creator-review-tab {
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
        .creator-review-tab:hover {
          color: var(--color-primary-medium);
        }
        .creator-review-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }
        .creator-review-comments-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .creator-review-comments-card--inline {
          margin-top: 0;
        }
        .creator-review-comment-box .ant-input {
          padding: 6px 8px !important;
          font-size: 11px !important;
          line-height: 1.35 !important;
          min-height: 80px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif !important;
        }
        .creator-review-warning {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 12px;
          line-height: 1.4;
        }
        .creator-review-warning--locked {
          background: #fff7e6;
          border: 1px solid #ffd591;
          color: #b45309;
        }
        .creator-review-warning--readonly {
          background: rgba(214, 189, 152, 0.1);
          border: 1px solid rgba(214, 189, 152, 0.2);
          color: var(--color-text-medium);
        }
        .creator-review-add-row {
          width: 100%;
          margin-top: 12px;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid var(--color-primary-soft) !important;
          background: transparent !important;
          color: var(--color-primary-medium) !important;
        }
        .creator-review-add-row:hover,
        .creator-review-add-row:focus {
          background: rgba(214, 189, 152, 0.1) !important;
        }
        @media (min-width: 768px) {
          .creator-review-title {
            font-size: 17px;
          }
        }
        @media (min-width: 1024px) {
          .creator-review-title {
            font-size: 19px;
          }
        }
        @media (max-width: 1023px) {
          .creator-review-details-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <DocumentSidebar
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      <div className="creator-review-page" data-embedded={embedded ? "true" : "false"}>
        <div className="creator-review-topbar">
          <div className="creator-review-topbar-main">
            <Button icon={<LeftOutlined />} className="creator-review-back" onClick={handleCloseWithoutSavingDraft}>
              Back
            </Button>
            <div>
              <h1 className="creator-review-title">{checklist.dclNo || checklist.title || "Checklist Review"}</h1>
              <div className="creator-review-subtitle">{checklist.customerName || checklist.title || "Checklist workspace"}</div>
            </div>
          </div>

          <Button className="creator-review-viewdocs" onClick={() => setShowDocumentSidebar(true)}>
            <UnorderedListOutlined />
            View Documents
            <span className="creator-review-viewdocs-count">{uploadedDocumentCount}</span>
          </Button>
        </div>

        <div className="creator-review-actionbar">
          <ActionButtons
            readOnly={readOnly}
            isActionDisabled={isActionDisabled || shouldGrayOut}
            shouldGrayOut={shouldGrayOut}
            isSubmittingToRM={isSubmittingToRM}
            isCheckerSubmitting={isCheckerSubmitting}
            isSavingDraft={isSavingDraft}
            checklist={checklist}
            docs={docs}
            supportingDocs={supportingDocs}
            creatorComment={creatorComment}
            auth={auth}
            onSaveDraft={handleExplicitDraftSave}
            onSubmitToRM={submitToRMWithUnlock}
            onSubmitToCheckers={submitToCheckersWithUnlock}
            onUploadSupportingDoc={handleUploadSupportingDoc}
            uploadingSupportingDoc={isUploadingSupportingDoc}
            onClose={handleClose}
            comments={displayComments}
            isLockedBySomeoneElse={isLockedBySomeoneElse}
            lockedByUserName={lockedByUserName}
            hasBlockingDeferredValidation={hasBlockingDeferredValidation}
          />
        </div>

        <div className="creator-review-layout">
          <div className="creator-review-main">
            {isLockedBySomeoneElse && (
              <div className="creator-review-warning creator-review-warning--locked">
                <LockOutlined style={{ marginTop: 2 }} />
                <div>
                  This DCL is currently being edited by {lockedByUserName}. You cannot make changes while someone else is working on this checklist.
                </div>
              </div>
            )}

            {shouldGrayOut && !isActionDisabled && !isLockedBySomeoneElse && (
              <div className="creator-review-warning creator-review-warning--readonly">
                This checklist status does not allow creator actions. The page is currently read-only.
              </div>
            )}

            <div className="creator-review-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`creator-review-tab ${activeTab === tab.key ? "creator-review-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "details" && (
              <div className="creator-review-details-layout">
                <div className="creator-review-details-main">
                  <ChecklistHeader checklist={checklist} />
                  <ProgressStats docs={docs} />
                </div>

                <section className="creator-review-comments-card creator-review-comments-card--inline">
                  <div className="creator-caption">Comments</div>
                  <div>
                    <label className="creator-label">Add Comment</label>
                    <Input.TextArea
                      className="creator-review-comment-box"
                      rows={3}
                      value={creatorComment}
                      onChange={(event) => {
                        markChecklistEdited();
                        setCreatorComment(event.target.value);
                      }}
                      disabled={isActionDisabled || shouldGrayOut}
                      placeholder="Add a comment for RM or Co-Checker"
                    />
                    <div className="creator-helper-text" style={{ marginTop: 4 }}>
                      Comments are included when you save draft or submit.
                    </div>
                  </div>

                  <CommentHistory comments={displayComments} isLoading={commentsLoading} />
                </section>
              </div>
            )}

            {activeTab === "documents" && (
              <>
                <div className="creator-table-shell">
                  <DocumentTable
                    docs={docs}
                    onNameChange={handleDocumentNameChange}
                    onActionChange={handleActionChange}
                    onCommentChange={handleDocumentCommentChange}
                    onDeferralNoChange={handleDeferralNoChange}
                    onClearDeferralValidation={clearDeferralValidation}
                    onDelete={handleDeleteDocument}
                    onExpiryDateChange={handleDocumentExpiryDateChange}
                    onViewFile={handleViewFile}
                    isActionDisabled={isActionDisabled || shouldGrayOut}
                    checklistStatus={checklist.status}
                    deferralValidationByDoc={deferralValidationByDoc}
                    onValidateDeferralNo={validateDeferredDocument}
                  />
                </div>

                {!shouldGrayOut && (
                  <Button
                    icon={<PlusOutlined />}
                    className="creator-review-add-row"
                    onClick={() => setIsAddDocModalOpen(true)}
                  >
                    Add New Document
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AddDocumentModal
        open={!readOnly && isAddDocModalOpen}
        onClose={() => setIsAddDocModalOpen(false)}
        onAdd={handleAddDocument}
        categories={getAvailableCategories()}
        title="Add New Document to Checklist"
        showFileUpload={false}
      />
    </div>
  );
};

export default ReviewChecklistPage;