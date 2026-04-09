import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { Modal, Button, message, Upload, Tag, Space } from "antd";
import dayjs from "dayjs";
import {
  UploadOutlined,
  CloseOutlined,
  UnorderedListOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import DocumentSidebar from "./DocumentSidebar";
import ChecklistInfoCard from "./ChecklistInfoCard";
import ProgressSummary from "./ProgressSummary";
import DocumentTable from "./DocumentTable";
import CommentSection from "./CommentSection";
import PDFGenerator from "./PDFGenerator.jsx";
import SaveDraftButton from "./SaveDraftButton";
import { useRmSubmitChecklistToCoCreatorMutation } from "../../../api/checklistApi";
import { useGetChecklistCommentsQuery, useGetChecklistByIdRMQuery } from "../../../api/checklistApi";
import deferralApi from "../../../service/deferralApi";
import { uploadFileToBackend } from "../../../utils/uploadUtils";
import { saveDraft as saveDraftToStorage } from "../../../utils/draftsUtils";
import { API_ORIGIN } from "../../../config/runtimeConfig";
import "../../../styles/creatorDesignSystem.css";

const TABS = [
  { key: "details", label: "Checklist Details" },
  { key: "documents", label: "Required Documents" },
];

const normalizeLookupValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isDeferralRequestedStatus = (status) => {
  const normalized = normalizeLookupValue(status).replace(/[^a-z]/g, "");
  return normalized === "deferralrequested" || normalized === "defferalrequested";
};

const isNaStatus = (status) => {
  const normalized = normalizeLookupValue(status).replace(/[^a-z]/g, "");
  return normalized === "na";
};

const getDeferralRequestedDays = (deferral) => {
  const candidateDays = [Number(deferral?.daysSought || 0)];

  if (Array.isArray(deferral?.selectedDocuments)) {
    candidateDays.push(
      ...deferral.selectedDocuments.map((doc) =>
        Number(doc?.requestedDays || doc?.daysSought || 0),
      ),
    );
  }

  if (Array.isArray(deferral?.documents)) {
    candidateDays.push(
      ...deferral.documents.map((doc) =>
        Number(doc?.requestedDays || doc?.daysSought || 0),
      ),
    );
  }

  return candidateDays.reduce(
    (maxDays, currentDays) =>
      Number.isFinite(currentDays) && currentDays > maxDays ? currentDays : maxDays,
    0,
  );
};

const getDeferralExpiryMoment = (deferral) => {
  const explicitDueDate =
    deferral?.nextDueDate || deferral?.nextDocumentDueDate || null;

  if (explicitDueDate) {
    const parsedDueDate = dayjs(explicitDueDate);
    if (parsedDueDate.isValid()) {
      return parsedDueDate;
    }
  }

  const createdAt = dayjs(deferral?.createdAt);
  const requestedDays = getDeferralRequestedDays(deferral);

  if (createdAt.isValid() && requestedDays > 0) {
    return createdAt.add(requestedDays, "day");
  }

  return null;
};

const formatDeferralExpiry = (expiryMoment) => {
  if (!expiryMoment || !expiryMoment.isValid()) {
    return "";
  }

  return expiryMoment.format("DD MMM YYYY");
};

const isAwaitingApprovalStatus = (status) => {
  const normalized = normalizeLookupValue(status).replace(/[^a-z]/g, "");
  return ["pendingapproval", "pending", "inreview", "partiallyapproved"].includes(
    normalized,
  );
};

const getReviewStatusMeta = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("approved")) {
    return { label: "Approved", variant: "approved" };
  }

  if (normalized.includes("rejected")) {
    return { label: "Rejected", variant: "rework" };
  }

  if (normalized.includes("pending")) {
    return { label: "Pending", variant: "pending" };
  }

  if (["rm_review", "rmreview"].includes(normalized)) {
    return { label: "RM Review", variant: "qs-review" };
  }

  return {
    label: (status || "RM Review").replace(/_/g, " "),
    variant: "qs-review",
  };
};

const RmReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  refetch,
  readOnly = false,
  onChecklistUpdate = null,
}) => {
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");

  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [rmGeneralComment, setRmGeneralComment] = useState("");
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [localChecklist, setLocalChecklist] = useState(checklist);
  const [activeTab, setActiveTab] = useState("details");
  const [deferralValidationByDoc, setDeferralValidationByDoc] = useState({});
  const resolvedChecklistId = localChecklist?.id || localChecklist?._id || checklist?.id || checklist?._id;
  const activeChecklist = localChecklist || checklistDetail || checklist;
  const isDraftRestored = Boolean(localChecklist?._draftRestored || checklist?._draftRestored);

  const [submitRmChecklistToCoCreator, { isLoading }] =
    useRmSubmitChecklistToCoCreatorMutation();
  const { data: checklistDetail } = useGetChecklistByIdRMQuery(resolvedChecklistId, {
    skip: !resolvedChecklistId,
    refetchOnMountOrArgChange: true,
  });

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(resolvedChecklistId, {
      skip: !resolvedChecklistId,
    });

  const API_BASE_URL = API_ORIGIN;

  const handleChecklistUpdate = (updatedChecklist) => {
    // Merge the updated checklist with existing localChecklist to preserve fields not returned by submission
    const mergedChecklist = {
      ...localChecklist,
      ...checklist,
      ...updatedChecklist,
      // Ensure supportingDocs from backend response is preserved
      supportingDocs:
        updatedChecklist?.supportingDocs ||
        checklist?.supportingDocs ||
        localChecklist?.supportingDocs ||
        [],
    };

    console.log("🔄 RM handleChecklistUpdate called:");
    console.log(
      "   Updated checklist supportingDocs:",
      updatedChecklist?.supportingDocs?.length || 0,
    );
    console.log(
      "   Merged checklist supportingDocs:",
      mergedChecklist.supportingDocs?.length || 0,
    );

    setLocalChecklist(mergedChecklist);
    if (onChecklistUpdate) {
      onChecklistUpdate(mergedChecklist);
    }
  };

  const persistDraft = useCallback((notify = false) => {
    if (readOnly) {
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
          _id: doc._id || doc.id,
          name: doc.name,
          category: doc.category,
          status: doc.status,
          action: doc.action,
          rmStatus: doc.rmStatus,
          comment: doc.comment,
          fileUrl: doc.fileUrl,
          expiryDate: doc.expiryDate,
          deferralNo: doc.deferralNo || doc.deferralNumber,
        })),
        creatorComment: rmGeneralComment,
        rmGeneralComment,
        supportingDocs,
      };

      saveDraftToStorage("rm", draftData, checklistId);

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
  }, [readOnly, activeChecklist, docs, rmGeneralComment, supportingDocs]);

  const handleCloseWithDraft = () => {
    persistDraft(false);
    onClose?.();
  };

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
          [],
        supportingDocs:
          restoredChecklist.supportingDocs ||
          restoredChecklist._supportingDocs ||
          nextChecklist?.supportingDocs ||
          [],
      };
    });
  }, [checklist, checklistDetail]);

  useEffect(() => {
    if (isDraftRestored) {
      setRmGeneralComment(
        localChecklist?.rmGeneralComment ||
          localChecklist?._rmComment ||
          checklist?.rmGeneralComment ||
          checklist?._rmComment ||
          checklist?.creatorComment ||
          "",
      );
      return;
    }

    setRmGeneralComment(
      checklistDetail?.rmGeneralComment ||
        checklistDetail?.creatorComment ||
        checklist?.rmGeneralComment ||
        checklist?.creatorComment ||
        "",
    );
  }, [checklist, checklistDetail, isDraftRestored, localChecklist]);

  const getInitialRmStatus = (doc) => {
    if (doc.rmStatus !== undefined && doc.rmStatus !== null) {
      return doc.rmStatus;
    }
    return doc.status || "pendingrm";
  };

  useEffect(() => {
    const activeChecklist = localChecklist || checklistDetail || checklist;

    if (!activeChecklist) return;

    // Handle both flat format (from draft restoration) and nested format (from backend)
    let docsToProcess = [];

    if (!activeChecklist.documents) {
      setDocs([]);
      return;
    }

    // Check if documents are in flat format (from draft) or nested format (from backend)
    const firstDoc = activeChecklist.documents[0];
    const isFlatFormat =
      firstDoc &&
      (firstDoc._id || firstDoc.id || firstDoc.name) &&
      !firstDoc.docList;

    if (isFlatFormat) {
      // Flat format from draft - use directly
      docsToProcess = activeChecklist.documents;
      console.log(
        "📋 RM Modal - Processing flat document format from draft:",
        docsToProcess.length,
        "docs",
      );
    } else {
      // Nested format from backend - flatten it
      let docIdxCounter = 0;
      docsToProcess = activeChecklist.documents.reduce((acc, categoryObj) => {
        const filteredDocs = (categoryObj.docList || [])
          .filter((doc) => doc.name?.trim() !== "")
          .map((doc) => ({
            ...doc,
            category: categoryObj.category || "Missing Category",
            docIdx: docIdxCounter++,
          }));
        return [...acc, ...filteredDocs];
      }, []);
      console.log(
        "📋 RM Modal - Processing nested document format from backend:",
        docsToProcess.length,
        "docs",
      );
    }

    // Process all documents
    const processedDocs = docsToProcess.map((doc, idx) => ({
      ...doc,
      category: doc.category || "Missing Category",
      rmStatus: getInitialRmStatus(doc),
      rmTouched: doc.rmStatus != null,
      uploadData: doc.uploadData || null,
      docIdx: doc.docIdx !== undefined ? doc.docIdx : idx,
    }));

    // Store supporting docs separately - they should NOT appear in DocumentTable
    const supportingDocsData = activeChecklist.supportingDocs || [];
    console.log(
      "📎 RM Modal - Supporting docs from backend:",
      supportingDocsData.length,
    );

    // Set main docs WITHOUT supporting docs
    setDocs(processedDocs);
    setDeferralValidationByDoc({});
    console.log(
      "📋 RM Modal - Main documents (no supporting docs):",
      processedDocs.length,
    );

    // Set supporting docs separately for DocumentSidebar
    setSupportingDocs(supportingDocsData);
  }, [checklist, checklistDetail, localChecklist]);

  
  const isActionAllowed =
    !readOnly && activeChecklist?.status?.toLowerCase() === "rmreview";

  const getChecklistCustomerContext = () => ({
    customerNumber: normalizeLookupValue(
      activeChecklist?.customerNumber,
    ),
    customerName: normalizeLookupValue(
      activeChecklist?.customerName,
    ),
    dclNumber: normalizeLookupValue(
      activeChecklist?.dclNo ||
        activeChecklist?.dclNumber,
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
        message: "Deferral number will be checked before submission.",
      },
    }));
  };

  const validateDeferralNumberForDoc = async (
    docIdx,
    valueOverride,
    options = {},
  ) => {
    const doc = docs.find((entry) => entry.docIdx === docIdx);
    const deferralNumber = String(
      valueOverride ?? doc?.deferralNumber ?? doc?.deferralNo ?? "",
    ).trim();

    if (!doc) {
      return { valid: false, message: "Document not found." };
    }

    if (!isDeferralRequestedStatus(doc.rmStatus)) {
      clearDeferralValidation(docIdx);
      return { valid: true, skipped: true };
    }

    if (!deferralNumber) {
      const emptyResult = {
        status: "invalid",
        message: "Deferral number is required for deferral requested items.",
      };

      setDeferralValidationByDoc((prev) => ({
        ...prev,
        [docIdx]: emptyResult,
      }));

      return { valid: false, ...emptyResult };
    }

    setDeferralValidationByDoc((prev) => ({
      ...prev,
      [docIdx]: {
        status: "validating",
        message: "Checking deferral number...",
      },
    }));

    try {
      const results = await deferralApi.searchDeferrals(
        { deferralNumber },
        token,
      );
      const exactMatches = (Array.isArray(results) ? results : []).filter(
        (item) =>
          normalizeLookupValue(item?.deferralNumber) ===
          normalizeLookupValue(deferralNumber),
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
      const matchingCustomerDeferral = exactMatches.find((item) => {
        const resultCustomerNumber = normalizeLookupValue(item?.customerNumber);
        const resultCustomerName = normalizeLookupValue(item?.customerName);
        const resultDclNumber = normalizeLookupValue(
          item?.dclNumber || item?.dclNo,
        );

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
        const invalidCustomerResult = {
          status: "invalid",
          message:
            "This deferral number does not belong to the selected customer.",
        };

        setDeferralValidationByDoc((prev) => ({
          ...prev,
          [docIdx]: invalidCustomerResult,
        }));

        return { valid: false, ...invalidCustomerResult };
      }

      const fullDeferral = await deferralApi.getDeferralById(
        matchingCustomerDeferral.id,
        token,
      );
      const workflowStatus = fullDeferral?.status || matchingCustomerDeferral.status;

      if (!isAwaitingApprovalStatus(workflowStatus)) {
        const inactiveResult = {
          status: "invalid",
          message: "This deferral is not awaiting approval.",
        };

        setDeferralValidationByDoc((prev) => ({
          ...prev,
          [docIdx]: inactiveResult,
        }));

        return { valid: false, ...inactiveResult };
      }

      const expiryMoment = getDeferralExpiryMoment(fullDeferral);
      const expiryDateText = formatDeferralExpiry(expiryMoment);

      if (expiryMoment && expiryMoment.isBefore(dayjs())) {
        const expiredResult = {
          status: "invalid",
          message: expiryDateText
            ? `This deferral expired on ${expiryDateText}.`
            : "This deferral has expired based on the approved days sought.",
          expiryDateText,
        };

        setDeferralValidationByDoc((prev) => ({
          ...prev,
          [docIdx]: expiredResult,
        }));

        return { valid: false, ...expiredResult };
      }

      const validResult = {
        status: "valid",
        message: "Deferral number verified and still awaiting approval.",
        expiryDateText,
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
          error?.message || "Unable to validate deferral number right now.",
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

  const documentStats = useMemo(() => {
    const total = docs.length;

    const submitted = docs.filter(
      (d) =>
        d.status?.toLowerCase() === "submitted" ||
        d.action?.toLowerCase() === "submitted",
    ).length;

    const pendingFromRM = docs.filter(
      (d) => d.status?.toLowerCase() === "pendingrm",
    ).length;

    const pendingFromCo = docs.filter(
      (d) => d.status?.toLowerCase() === "pendingco",
    ).length;

    const deferred = docs.filter(
      (d) => d.status?.toLowerCase() === "deferred",
    ).length;

    const sighted = docs.filter(
      (d) => d.status?.toLowerCase() === "sighted",
    ).length;

    const waived = docs.filter(
      (d) => d.status?.toLowerCase() === "waived",
    ).length;

    const tbo = docs.filter((d) => d.status?.toLowerCase() === "tbo").length;

    const progressPercent =
      total === 0
        ? 0
        : Math.round(
            ((submitted + deferred + sighted + waived + tbo) / total) * 100,
          );

    return {
      total,
      submitted,
      pendingFromRM,
      pendingFromCo,
      deferred,
      sighted,
      waived,
      tbo,
      progressPercent,
    };
  }, [docs]);

  const handleFileUpload = async (docIdx, file) => {
    const document = docs[docIdx];

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error("Please upload only images, PDFs, Word, or Excel files");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("File size exceeds 10MB limit");
      return false;
    }

    setUploadingDocs((prev) => ({ ...prev, [docIdx]: true }));

    try {
      const resolvedChecklistId = checklist?.id || checklist?._id;
      const resolvedDocumentId = document?.id || document?._id;

      const uploadResult = await uploadFileToBackend(
        file,
        resolvedChecklistId,
        resolvedDocumentId,
        document.name,
        document.category,
        token,
      );

      setDocs((prev) =>
        prev.map((d, idx) =>
          idx === docIdx
            ? {
                ...d,
                uploadData: uploadResult,
                fileUrl: `${API_BASE_URL}${uploadResult.fileUrl}`,
                isUploading: false,
              }
            : d,
        ),
      );

      message.success(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docIdx]: false }));
    }

    return false;
  };

  const submitRM = async () => {
    try {
      const checklistId = activeChecklist?._id || activeChecklist?.id;
      if (!checklistId) throw new Error("Checklist ID missing");

      const missingDeferral = docs.find(
        (doc) =>
          isDeferralRequestedStatus(doc.rmStatus) && !doc.deferralNumber?.trim(),
      );

      if (missingDeferral) {
        Modal.warning({
          title: "Deferral Number Required",
          content:
            "Please enter a deferral number for all documents marked as Deferral Requested.",
          okText: "OK",
          centered: true,
        });
        return;
      }

      const hasNaSelection = docs.some((doc) => isNaStatus(doc.rmStatus));

      if (hasNaSelection && !String(rmGeneralComment || "").trim()) {
        Modal.warning({
          title: "General Comment Required",
          content:
            "Please explain the N/A selection in RM General Comment before submitting to co-creator.",
          okText: "OK",
          centered: true,
        });
        return;
      }

      const deferralDocs = docs.filter(
        (doc) =>
          isDeferralRequestedStatus(doc.rmStatus) && doc.deferralNumber?.trim(),
      );

      for (const doc of deferralDocs) {
        const validationResult = await validateDeferralNumberForDoc(
          doc.docIdx,
          doc.deferralNumber,
          { silent: true },
        );

        if (!validationResult.valid) {
          Modal.warning({
            title: "Invalid Deferral Number",
            content:
              validationResult.message ||
              "One or more deferral numbers are invalid.",
            okText: "OK",
            centered: true,
          });
          return;
        }
      }

      const payload = {
        checklistId: checklistId,
        documents: docs
          .filter((doc) => !doc.isNew) // Filter out new/temporary documents
          .map((doc) => ({
            _id: doc._id,
            id: doc.id,
            category: doc.category,
            status: doc.status,
            action: doc.action,
            comment: doc.comment || "",
            fileUrl: doc.uploadData?.fileUrl || null,
            deferralReason: doc.deferralReason || "",
            rmStatus: doc.rmStatus || null,
            deferralNumber: doc.deferralNumber || "",
          })),
        supportingDocs: supportingDocs
          .filter((doc) => !doc.isNew) // Filter out new/temporary supporting docs
          .map((doc) => ({
            id: doc.id || doc._id,
            name: doc.fileName || doc.name,
            fileUrl: doc.fileUrl,
            uploadedByRole: doc.uploadedByRole,
          })),
        rmGeneralComment: rmGeneralComment || "",
      };

      console.log("📤 RM SUBMISSION TO CO-CREATOR:");
      console.log("   Total docs in state:", docs.length);
      console.log("   Supporting docs:", payload.supportingDocs.length);
      console.log("   Main docs being submitted:", payload.documents.length);

      await submitRmChecklistToCoCreator(payload).unwrap();
      if (refetch) refetch();

      handleChecklistUpdate({ ...localChecklist, status: "CoCreatorReview" });

      message.success("Checklist submitted to CO-Checker!");
      onClose();
    } catch (err) {
      console.error(err);
      message.error(err?.data?.error || "Failed to submit checklist");
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const uploadedDocumentCount = useMemo(() => {
    const mainDocumentCount = docs.filter((doc) => doc.fileUrl || doc.uploadData?.fileUrl).length;
    const supportingDocumentCount = (supportingDocs || []).filter((doc) => doc.fileUrl).length;
    return mainDocumentCount + supportingDocumentCount;
  }, [docs, supportingDocs]);
  const reviewStatusMeta = getReviewStatusMeta(activeChecklist?.status);

  useEffect(() => {
    if (readOnly || !open) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      persistDraft(false);
    }, 15000);

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
  }, [readOnly, open, persistDraft]);

  if (!open) {
    return null;
  }

  return (
    <>
      <style>{`
        .deferral-confirm-btn {
          color: #FFFFFF !important;
        }
        .deferral-cancel-btn {
          color: #000000 !important;
        }
        .rm-review-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 100%;
        }
        .rm-review-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rm-review-topbar-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rm-review-close.ant-btn,
        .rm-review-close.ant-btn:hover,
        .rm-review-close.ant-btn:focus {
          width: 36px;
          height: 36px;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .rm-review-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }
        .rm-review-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .rm-review-viewdocs.ant-btn,
        .rm-review-viewdocs.ant-btn:hover,
        .rm-review-viewdocs.ant-btn:focus {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px !important;
          min-height: 36px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .rm-review-viewdocs-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(214, 189, 152, 0.2);
          color: var(--color-text-dark) !important;
          font-size: 9px;
          font-weight: 600;
          line-height: 1;
        }
        .rm-review-actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 16px;
        }
        .rm-review-actionbar-left,
        .rm-review-actionbar-right {
          display: flex;
          align-items: center;
          gap: 8px 8px;
          flex-wrap: wrap;
        }
        .rm-review-actionbar-shell {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 16px;
        }
        .rm-review-actionbar .ant-space {
          display: flex !important;
          align-items: center !important;
          gap: 8px 8px !important;
        }
        .rm-review-actionbar .ant-space-item {
          display: flex;
          align-items: center;
        }
        .rm-review-actionbar .pdf-generator-btn.ant-btn,
        .rm-review-actionbar .rm-review-save-draft.ant-btn,
        .rm-review-actionbar .rm-review-action-submit.ant-btn,
        .rm-review-actionbar .rm-review-close-action.ant-btn {
          min-height: 34px !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
        }
        .rm-review-actionbar .pdf-generator-btn.ant-btn,
        .rm-review-actionbar .rm-review-save-draft.ant-btn,
        .rm-review-actionbar .rm-review-action-submit.ant-btn,
        .rm-review-actionbar .pdf-generator-btn.ant-btn:hover,
        .rm-review-actionbar .pdf-generator-btn.ant-btn:focus,
        .rm-review-actionbar .pdf-generator-btn.ant-btn:active,
        .rm-review-actionbar .rm-review-save-draft.ant-btn:hover,
        .rm-review-actionbar .rm-review-save-draft.ant-btn:focus,
        .rm-review-actionbar .rm-review-save-draft.ant-btn:active,
        .rm-review-actionbar .rm-review-action-submit.ant-btn:hover,
        .rm-review-actionbar .rm-review-action-submit.ant-btn:focus,
        .rm-review-actionbar .rm-review-action-submit.ant-btn:active {
          background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .rm-review-actionbar .pdf-generator-btn.ant-btn span,
        .rm-review-actionbar .rm-review-save-draft.ant-btn span,
        .rm-review-actionbar .rm-review-action-submit.ant-btn span {
          color: #FFFFFF !important;
        }
        .rm-review-actionbar .pdf-generator-btn.ant-btn:disabled,
        .rm-review-actionbar .pdf-generator-btn.ant-btn[disabled],
        .rm-review-actionbar .rm-review-save-draft.ant-btn:disabled,
        .rm-review-actionbar .rm-review-save-draft.ant-btn[disabled],
        .rm-review-actionbar .rm-review-action-submit.ant-btn:disabled,
        .rm-review-actionbar .rm-review-action-submit.ant-btn[disabled] {
          background: #D1D5DB !important;
          border-color: #D1D5DB !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .rm-review-actionbar .pdf-generator-btn.ant-btn:disabled span,
        .rm-review-actionbar .pdf-generator-btn.ant-btn[disabled] span,
        .rm-review-actionbar .rm-review-save-draft.ant-btn:disabled span,
        .rm-review-actionbar .rm-review-save-draft.ant-btn[disabled] span,
        .rm-review-actionbar .rm-review-action-submit.ant-btn:disabled span,
        .rm-review-actionbar .rm-review-action-submit.ant-btn[disabled] span {
          color: #FFFFFF !important;
        }
        .rm-review-actionbar .rm-review-close-action.ant-btn,
        .rm-review-actionbar .rm-review-close-action.ant-btn:hover,
        .rm-review-actionbar .rm-review-close-action.ant-btn:focus,
        .rm-review-actionbar .rm-review-close-action.ant-btn:active {
          background: transparent !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-medium) !important;
        }
        .rm-review-actionbar .ant-btn .anticon {
          font-size: 13px;
        }
        .rm-review-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          margin-bottom: 16px;
          overflow-x: auto;
        }
        .rm-review-tab {
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
        .rm-review-tab:hover {
          color: var(--color-primary-medium);
        }
        .rm-review-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }
        .rm-review-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 16px;
          align-items: start;
        }
        .rm-review-details-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .rm-review-documents-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          overflow: hidden;
        }
        .rm-review-documents-card-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-dark);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .rm-review-documents-card-body {
          padding: 0;
        }
        @media (max-width: 1023px) {
          .rm-review-details-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 767px) {
          .rm-review-topbar,
          .rm-review-actionbar {
            flex-direction: column;
            align-items: stretch;
          }
          .rm-review-actionbar-left,
          .rm-review-actionbar-right {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>

      <DocumentSidebar
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
        getFullUrl={getFullUrl}
        readOnly={readOnly}
      />

      <div className="creator-theme" style={{ minHeight: "100%", background: "var(--color-bg)" }}>
        <div className="rm-review-page">
          <div className="rm-review-topbar">
            <div className="rm-review-topbar-main">
              <Button
                icon={<CloseOutlined />}
                className="rm-review-close"
                onClick={handleCloseWithDraft}
              />
              <div>
                <h1 className="rm-review-title">{activeChecklist?.dclNo || `Review Checklist ${activeChecklist?.customerNumber || ""}`}</h1>
                <div className="rm-review-subtitle">{activeChecklist?.customerName || activeChecklist?.customerNumber || "RM review workspace"}</div>
                <div style={{ marginTop: 8 }}>
                  <span className={`creator-badge creator-badge--${reviewStatusMeta.variant}`}>
                    {reviewStatusMeta.label}
                  </span>
                </div>
              </div>
            </div>

            <Button className="rm-review-viewdocs" onClick={() => setShowDocumentSidebar(true)}>
              <UnorderedListOutlined />
              View Documents
              <span className="rm-review-viewdocs-count">{uploadedDocumentCount}</span>
            </Button>
          </div>

          <div className="rm-review-actionbar">
            <div className="rm-review-actionbar-shell">
              <Space wrap className="rm-review-actionbar-left">
                <PDFGenerator
                  key="download"
                  checklist={{
                    ...activeChecklist,
                    dclNo: activeChecklist?.dclNo || activeChecklist?._id,
                    rmName:
                      activeChecklist?.assignedToRM?.name ||
                      activeChecklist?.rmName ||
                      auth?.user?.name ||
                      auth?.user?.username ||
                      "Relationship Manager",
                  }}
                  docs={docs}
                  supportingDocs={supportingDocs || []}
                  creatorComment=""
                  rmGeneralComment={rmGeneralComment || ""}
                  comments={comments || []}
                  buttonText="Download PDF"
                  variant="primary"
                  className="rm-review-pdf"
                />
                <SaveDraftButton
                  key="save"
                  checklist={{
                    ...activeChecklist,
                    dclNo: activeChecklist?.dclNo || activeChecklist?._id,
                  }}
                  docs={docs}
                  rmGeneralComment={rmGeneralComment}
                  supportingDocs={supportingDocs || []}
                  className="rm-review-save-draft"
                  icon={<SaveOutlined />}
                />
              </Space>

              <Space wrap className="rm-review-actionbar-right">
                <Button
                  key="close"
                  onClick={handleCloseWithDraft}
                  className="rm-review-close-action"
                >
                  Close
                </Button>
                {!readOnly && (
                  <Button
                    key="submit"
                    type="primary"
                    loading={isLoading}
                    onClick={submitRM}
                    disabled={!isActionAllowed}
                    className="rm-review-action-submit"
                    icon={<SendOutlined />}
                  >
                    Submit to CO
                  </Button>
                )}
              </Space>
            </div>
          </div>

          <div className="rm-review-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`rm-review-tab ${activeTab === tab.key ? "rm-review-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {checklist && activeTab === "details" && (
            <div className="rm-review-details-layout">
              <div className="rm-review-details-main">
                <ChecklistInfoCard checklist={checklist} />
                <ProgressSummary documentStats={documentStats} />
              </div>

              <CommentSection
                checklist={checklist}
                rmGeneralComment={rmGeneralComment}
                setRmGeneralComment={setRmGeneralComment}
                isActionAllowed={isActionAllowed}
                comments={comments}
                commentsLoading={commentsLoading}
              />
            </div>
          )}

          {checklist && activeTab === "documents" && (
            <div className="rm-review-documents-card">
              <div className="rm-review-documents-card-header">Required Documents</div>
              <div className="rm-review-documents-card-body">
                <DocumentTable
                  docs={docs}
                  setDocs={setDocs}
                  checklist={checklist}
                  isActionAllowed={isActionAllowed}
                  handleFileUpload={handleFileUpload}
                  uploadingDocs={uploadingDocs}
                  getFullUrl={getFullUrl}
                  readOnly={!isActionAllowed}
                  checklistStatus={checklist?.status}
                  deferralValidationByDoc={deferralValidationByDoc}
                  onValidateDeferralNumber={validateDeferralNumberForDoc}
                  onDeferralNumberEdit={markDeferralValidationPending}
                  onClearDeferralValidation={clearDeferralValidation}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RmReviewChecklistModal;
