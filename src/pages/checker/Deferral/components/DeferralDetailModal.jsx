import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Input,
  message as antMessage,
  Spin,
  Table,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getCloseRequestDocumentGroups,
  getDeferralDocumentBuckets,
} from "../../../../utils/deferralDocuments";
import { openFileInNewTab, downloadFile } from "../../../../utils/fileUtils";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import DeferralReviewHeader from "../../../creator/Deferrals/components/DeferralReviewHeader";
import DeferralStatusAlert from "./DeferralStatusAlert";

const { TextArea } = Input;
const { Text } = Typography;

const TABS = [
  { key: "details", label: "Deferral Details" },
  { key: "documents", label: "Documents & Flow" },
];

const PRIMARY_BLUE = "var(--color-primary-dark)";
const SUCCESS_GREEN = "var(--color-status-success)";
const ERROR_RED = "var(--color-status-danger)";

const GENERIC_ROLE_LABELS = new Set([
  "user",
  "system",
  "approver",
  "rm",
  "creator",
  "checker",
  "cocreator",
  "co creator",
  "cochecker",
  "co checker",
  "customer",
  "admin",
]);

const DUPLICATE_TIME_WINDOW_MS = 2 * 60 * 1000;

const normalizeHistoryValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeCloseRequestDecisionKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getTimestampValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.valueOf();
};

const getRoleSpecificityScore = (roleLabel) => {
  const normalizedRole = normalizeHistoryValue(roleLabel);
  if (!normalizedRole) return 0;
  if (GENERIC_ROLE_LABELS.has(normalizedRole)) return 1;
  return 10 + normalizedRole.length;
};

const dedupeHistoryEntries = (entries) => {
  const deduped = [];

  entries.forEach((entry, index) => {
    const normalizedUser = normalizeHistoryValue(entry.user);
    const normalizedComment = normalizeHistoryValue(entry.comment);
    const entryTime = getTimestampValue(
      entry.date || entry.createdAt || entry.timestamp,
    );

    const current = {
      ...entry,
      __index: index,
      __score: getRoleSpecificityScore(entry.userRole || entry.role),
      __user: normalizedUser,
      __comment: normalizedComment,
      __time: entryTime,
    };

    const existingIndex = deduped.findIndex((candidate) => {
      if (
        candidate.__user !== current.__user ||
        candidate.__comment !== current.__comment
      ) {
        return false;
      }

      if (candidate.__time == null || current.__time == null) {
        return true;
      }

      return Math.abs(candidate.__time - current.__time) <= DUPLICATE_TIME_WINDOW_MS;
    });

    if (existingIndex === -1) {
      deduped.push(current);
      return;
    }

    const existing = deduped[existingIndex];
    const shouldReplace =
      current.__score > existing.__score ||
      (current.__score === existing.__score && current.__index < existing.__index);

    if (shouldReplace) {
      deduped[existingIndex] = current;
    }
  });

  return deduped
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .map((entry) => {
      const nextEntry = { ...entry };
      delete nextEntry.__index;
      delete nextEntry.__score;
      delete nextEntry.__user;
      delete nextEntry.__comment;
      delete nextEntry.__time;
      return nextEntry;
    });
};

const isApprovalMarkedApproved = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "approved";

const formatHistoryTimestamp = (value) => {
  if (!value) return "";

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return String(value);
  }

  return parsed.format("DD MMM YYYY HH:mm");
};

const reviewShellClassName =
  "border-t border-[rgba(214,189,152)] bg-(--color-bg) [&_.ant-card]:overflow-hidden [&_.ant-card]:rounded-xl [&_.ant-card]:border-[rgba(214,189,152,0.18)] [&_.ant-card]:shadow-[0_8px_24px_rgba(15,23,42,0.04)] [&_.ant-card-head]:min-h-0 [&_.ant-card-head]:border-b [&_.ant-card-head]:border-[rgba(214,189,152,0.18)] [&_.ant-card-head]:bg-white [&_.ant-card-head]:px-4 [&_.ant-card-head]:py-3.5 [&_.ant-card-head-title]:p-0 [&_.ant-card-body]:bg-white [&_.ant-card-body]:p-4 [&_.ant-descriptions-item-label]:text-[11px] [&_.ant-descriptions-item-label]:font-semibold [&_.ant-descriptions-item-label]:uppercase [&_.ant-descriptions-item-label]:tracking-[0.04em] [&_.ant-descriptions-item-label]:text-(--color-text-light) [&_.ant-descriptions-item-content]:overflow-wrap-anywhere [&_.ant-descriptions-item-content]:text-[13px] [&_.ant-descriptions-item-content]:font-medium [&_.ant-descriptions-item-content]:text-(--color-text-dark) [&_.ant-input]:rounded-[10px] [&_.ant-input]:border-[rgba(214,189,152,0.22)] [&_.ant-input]:bg-white [&_.ant-input]:shadow-none [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-header]:border-b-0 [&_.ant-table-header]:shadow-none [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:border-none [&_.ant-table-content]:bg-transparent [&_table]:border-none [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_tr]:border-none [&_.ant-table-thead>tr]:border-b-0 [&_.ant-table-thead>tr>th]:!border-b-0 [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-thead>tr>th]:bg-[#fbfaf6] [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.04em] [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-tbody>tr:first-child>td]:!border-t-0 [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.1)] [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr:last-child>td]:border-b-0 [&_.ant-table-row:hover>td]:bg-[#fcfbf8] [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

const sectionCardClassName = "mb-[18px]";
const infoCardClassName =
  "mb-[18px] [&_.ant-card-head]:border-b-2 [&_.ant-card-head]:border-[var(--color-success-soft-border)] [&_.ant-descriptions-view]:overflow-hidden [&_.ant-descriptions-view]:rounded-lg [&_.ant-descriptions-view]:border [&_.ant-descriptions-view]:border-[rgba(214,189,152,0.2)] [&_.ant-descriptions-row>th]:border-b [&_.ant-descriptions-row>td]:border-b [&_.ant-descriptions-row>th]:border-[rgba(214,189,152,0.14)] [&_.ant-descriptions-row>td]:border-[rgba(214,189,152,0.14)] [&_.ant-descriptions-row:last-child>th]:border-b-0 [&_.ant-descriptions-row:last-child>td]:border-b-0 [&_.ant-descriptions-item-label]:min-w-[140px] [&_.ant-descriptions-item-label]:bg-(--color-bg) [&_.ant-descriptions-item-label]:px-[14px] [&_.ant-descriptions-item-label]:py-3 [&_.ant-descriptions-item-content]:bg-white [&_.ant-descriptions-item-content]:px-[14px] [&_.ant-descriptions-item-content]:py-3";
const cardTitleClassName = "font-semibold text-(--color-primary-dark)";
const actionBarClassName =
  "mb-3.5 flex flex-wrap justify-between gap-3 rounded-xl border border-[rgba(214,189,152,0.2)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(26,54,54,0.06)] max-md:flex-col max-md:items-stretch";
const actionGroupClassName = "flex flex-wrap gap-2";
const actionGroupEndClassName = "ml-auto flex flex-wrap gap-2 max-md:ml-0";
const primaryButtonClassName =
  "h-[34px]! rounded-md! border-0! bg-(--ncb-primary-500)! px-3.5! text-xs! font-semibold! text-white! shadow-none! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! disabled:bg-[var(--color-disabled)]! disabled:border-[var(--color-disabled)]! disabled:text-white! [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:text-white!";
const secondaryButtonClassName =
  "h-[34px]! rounded-md! border-[rgba(214,189,152,0.28)]! bg-white! px-3.5! text-xs! font-semibold! text-(--color-text-medium)! shadow-none! hover:border-[rgba(214,189,152,0.35)]! hover:bg-[#faf7f2]! hover:text-(--color-text-dark)! focus:border-[rgba(214,189,152,0.35)]! focus:bg-[#faf7f2]! focus:text-(--color-text-dark)! active:border-[rgba(214,189,152,0.35)]! active:bg-[#faf7f2]! active:text-(--color-text-dark)! [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5";
const tabListClassName = "mb-4 flex gap-1 overflow-x-auto border-b border-[rgba(214,189,152,0.2)] max-md:mb-3 max-md:gap-2 max-md:pb-1";
const workspaceClassName = "grid items-start gap-4 min-[1101px]:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)] max-md:gap-3";
const sidebarClassName = "flex flex-col gap-4 rounded-xl border border-[rgba(214,189,152,0.2)] bg-white p-3.5 shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const tableShellClassName = "mb-[18px] overflow-x-auto rounded-xl border border-[rgba(214,189,152,0.2)] bg-white";
const statsGridClassName = "grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))] max-md:grid-cols-1";
const statCardClassName = "rounded-[10px] border border-[rgba(214,189,152,0.16)] bg-[linear-gradient(180deg,rgba(245,240,231,0.58)_0%,#fff_100%)] p-3";
const actionSetClassName = "inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap [&_.ant-btn]:h-[27px] [&_.ant-btn]:min-w-0 [&_.ant-btn]:rounded-[7px] [&_.ant-btn]:px-2 [&_.ant-btn]:text-xs [&_.ant-btn>span]:inline-flex [&_.ant-btn>span]:items-center [&_.ant-btn>span]:gap-1";
const confirmOverlayClassName = "fixed inset-0 z-[1400] flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-6 backdrop-blur-[2px] max-md:items-end max-md:p-3";
const confirmDialogClassName = "w-[min(550px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[rgba(214,189,152,0.28)] bg-[var(--gradient-surface-soft)] shadow-[0_24px_64px_rgba(26,54,54,0.14)] max-md:w-full max-md:max-w-full";
const confirmHeroClassName = "relative bg-[var(--gradient-primary)] px-6 pb-5 pt-6 text-white max-md:px-4 max-md:pr-[52px]";
const confirmHeroIconClassName = "mb-3.5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.18)] text-[22px] text-white";
const confirmCloseClassName = "absolute right-5 top-[18px] inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-[rgba(255,255,255,0.08)] p-0 text-2xl leading-none text-white hover:bg-[rgba(255,255,255,0.14)] max-md:right-4 max-md:top-[14px]";
const confirmBodyClassName = "bg-[var(--gradient-surface-soft)] px-6 pb-6 pt-5 max-md:px-4";
const confirmBodyCardClassName = "rounded-xl border border-[rgba(214,189,152,0.22)] bg-white p-3.5";
const confirmSummaryClassName = "mb-3 rounded-[10px] bg-[rgba(214,189,152,0.12)] p-3";
const confirmLabelClassName = "mb-1.5 block text-[11px] font-bold tracking-[0.04em] text-(--color-text-light) uppercase";
const confirmTextareaClassName = "rounded-[10px] border-[rgba(214,189,152,0.22)]";
const modalFooterClassName = "mt-[18px] flex justify-end gap-2";
const modalPrimaryButtonClassName =
  "rounded-lg! border-0! bg-(--ncb-primary-500)! text-white! shadow-none! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! [&>span]:text-white!";
const modalSecondaryButtonClassName =
  "rounded-lg! border-[rgba(214,189,152,0.28)]! bg-white! text-(--color-text-medium)! shadow-none! hover:border-[rgba(214,189,152,0.35)]! hover:bg-[#faf7f2]! hover:text-(--color-text-dark)!";

const getStatusToneClassName = (tone) => {
  if (tone === "success") return "text-[var(--color-status-success)]";
  if (tone === "danger") return "text-[var(--color-status-danger)]";
  if (tone === "muted") return "text-[var(--color-text-muted)]";
  return "text-(--color-primary-dark)";
};

const DeferralDetailModal = ({
  visible = true,
  deferral,
  actionLoading,
  onDownloadPDF,
  onClose,
  onApprove,
  onReturnForRework,
  approvalConfirmVisible,
  onApprovalConfirm,
  onApprovalCancel,
  reworkConfirmVisible,
  reworkComment,
  onReworkCommentChange,
  onReworkConfirm,
  onReworkCancel,
  creatorComment,
  onCreatorCommentChange,
  sourceTab,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const isCloseRequestAction = sourceTab === "closeRequests";
  const closeRequestDocuments = useMemo(
    () => {
      if (!deferral) {
        return [];
      }

      if (isCloseRequestAction && Array.isArray(deferral.checkerCloseRequestDocuments)) {
        return getCloseRequestDocumentGroups({
          ...deferral,
          closeRequestDocuments: deferral.checkerCloseRequestDocuments,
        });
      }

      return getCloseRequestDocumentGroups(deferral);
    },
    [deferral, isCloseRequestAction],
  );
  const [checkerDocumentDecisions, setCheckerDocumentDecisions] = useState({});

  useEffect(() => {
    const nextState = closeRequestDocuments.reduce((accumulator, document) => {
      const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
      if (!key) {
        return accumulator;
      }

      const statusValue = String(document.checkerStatus || "").trim().toLowerCase();
      accumulator[key] = {
        status: ["approved", "rejected"].includes(statusValue) ? statusValue : "",
        comment: document.checkerComment || "",
        documentName: document.documentName,
      };
      return accumulator;
    }, {});

    setCheckerDocumentDecisions(nextState);
  }, [deferral?._id, deferral?.id, deferral?.updatedAt, closeRequestDocuments]);

  if (!deferral || !visible) {
    return null;
  }

  const approvalFlow = Array.isArray(deferral.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral.approvers)
      ? deferral.approvers
      : [];
  const normalizedCreatorApprovalStatus = String(
    deferral.creatorApprovalStatus || deferral.creatorStatus || "",
  )
    .trim()
    .toLowerCase();
  const normalizedCheckerApprovalStatus = String(
    deferral.checkerApprovalStatus || deferral.checkerStatus || "",
  )
    .trim()
    .toLowerCase();
  const creatorApproved = isApprovalMarkedApproved(normalizedCreatorApprovalStatus);
  const checkerApproved = isApprovalMarkedApproved(normalizedCheckerApprovalStatus);
  const approvedApproversCount = approvalFlow.filter(
    (approver) =>
      approver?.approved === true ||
      isApprovalMarkedApproved(approver?.approvalStatus) ||
      isApprovalMarkedApproved(approver?.status),
  ).length;
  const allApproversApproved = approvalFlow.length > 0
    ? approvedApproversCount === approvalFlow.length
    : deferral.allApproversApproved === true;
  const status = String(deferral.status || "").trim().toLowerCase();
  const isRejected = ["rejected", "deferral_rejected"].includes(status);
  const isClosed = [
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
  ].includes(status);
  const canAccept = isCloseRequestAction
    ? status === "close_requested_creator_approved"
    : allApproversApproved && creatorApproved && !checkerApproved && !isRejected && !isClosed;
  const canReturnForRework = !isCloseRequestAction && canAccept;
  const { dclDocs, uploadedDocs, requestedDocs } =
    getDeferralDocumentBuckets(deferral);
  const generalUploadedDocs = uploadedDocs.filter(
    (doc) => !doc.isCloseRequestEvidence,
  );
  const isCloseRequestContext = [
    "close_requested",
    "close_requested_creator_approved",
    "closed",
  ].includes(status);
  const requestedDocsWithDates = requestedDocs.map((doc) => {
    const requestedDays = doc.requestedDays || doc.daysSought || 0;
    const newDueDate =
      doc.nextDocumentDueDate ||
      deferral.nextDocumentDueDate ||
      (deferral.createdAt
        ? dayjs(deferral.createdAt).add(requestedDays, "days").toISOString()
        : null);

    return {
      ...doc,
      newDueDate,
    };
  });
  const uploadedDocumentCount =
    dclDocs.length + generalUploadedDocs.length + closeRequestDocuments.length;
  const pendingCheckerDecisions = isCloseRequestAction
    ? closeRequestDocuments.filter((document) => {
        const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const decision = checkerDocumentDecisions[key];
        return !["approved", "rejected"].includes(String(decision?.status || "").toLowerCase());
      }).length
    : 0;

  const updateCheckerDocumentDecision = (document, updates) => {
    const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
    if (!key) {
      return;
    }

    setCheckerDocumentDecisions((current) => ({
      ...current,
      [key]: {
        status: current[key]?.status || "",
        comment: current[key]?.comment || "",
        documentName: document.documentName,
        ...updates,
      },
    }));
  };

  const history = (function buildHistory() {
    const events = [];

    if (Array.isArray(deferral.comments)) {
      deferral.comments.forEach((comment) => {
        if (comment.isSystemComment || comment.isSystem) {
          return;
        }
        if (!String(comment.text || "").trim()) {
          return;
        }
        events.push({
          user:
            comment.author?.name || comment.authorName || comment.userName || "User",
          userRole: comment.author?.role || comment.authorRole || "User",
          date: comment.createdAt,
          comment: comment.text || "",
          isSystemComment: Boolean(comment.isSystemComment || comment.isSystem),
        });
      });
    }

    return dedupeHistoryEntries(events);
  })();

  const downloadDeferralAsPDF = async () => {
    if (!deferral?._id) {
      return;
    }

    setDownloadLoading(true);
    try {
      await downloadDeferralPdf(deferral, {
        requestedDocsWithDates,
        history,
        closeRequestDocuments,
      });
      antMessage.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      antMessage.error("Failed to generate PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  const requestedDocsColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span className="font-semibold text-(--color-primary-dark)">{value || "-"}</span>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, doc) => doc.type || doc.documentType || "-",
    },
    {
      title: "Requested Days",
      key: "requestedDays",
      render: (_, doc) => doc.requestedDays || doc.daysSought || "-",
    },
    {
      title: "New Due Date",
      key: "newDueDate",
      render: (_, doc) =>
        doc.newDueDate ? dayjs(doc.newDueDate).format("DD MMM YYYY") : "-",
    },
  ];

  const uploadedDocumentColumns = [
    {
      title: "Document",
      key: "document",
      render: (_, doc) => (
        <div>
          <div className="font-semibold text-(--color-primary-dark)">
            {doc.name || "Uploaded Document"}
          </div>
          {doc.uploadDate ? (
            <div className="text-xs text-(--color-text-muted)">
              {`Uploaded ${dayjs(doc.uploadDate).format("DD MMM YYYY")}`}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, doc) => (
        <div className={actionSetClassName}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(doc.fileUrl || doc.url)}
            disabled={!doc.fileUrl && !doc.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(doc.fileUrl || doc.url, doc.name)}
            disabled={!doc.fileUrl && !doc.url}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const closeRequestUploadColumns = [
    {
      title: "File",
      key: "file",
      render: (_, upload) => (
        <div>
          <div className="font-semibold text-(--color-primary-dark)">
            {upload.name || "Evidence Document"}
          </div>
          {upload.uploadDate ? (
            <div className="text-xs text-(--color-text-muted)">
              {`Uploaded ${dayjs(upload.uploadDate).format("DD MMM YYYY")}`}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, upload) => (
        <div className={actionSetClassName}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(upload.fileUrl || upload.url)}
            disabled={!upload.fileUrl && !upload.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(upload.fileUrl || upload.url, upload.name)}
            disabled={!upload.fileUrl && !upload.url}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const closeRequestColumns = [
    {
      title: "Document",
      dataIndex: "documentName",
      key: "documentName",
      render: (value) => (
        <span className="font-semibold text-(--color-primary-dark)">{value || "-"}</span>
      ),
    },
    {
      title: "RM Comment",
      dataIndex: "comment",
      key: "comment",
      render: (value) => value || "-",
    },
    {
      title: "Creator Review",
      key: "creatorReview",
      render: (_, document) => {
        const reviewState = String(document.creatorStatus || "pending").toLowerCase();
        const label =
          reviewState === "approved"
            ? "Approved"
            : reviewState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div className={`inline-flex items-center text-xs font-semibold ${getStatusToneClassName(reviewState === "approved" ? "success" : reviewState === "rejected" ? "danger" : "primary")}`}>
              {label}
            </div>
          </div>
        );
      },
    },
    {
      title: "Checker Review",
      key: "checkerReview",
      render: (_, document) => {
        const decisionKey = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const liveDecision = checkerDocumentDecisions[decisionKey];
        const reviewState = String(liveDecision?.status || document.checkerStatus || "pending").toLowerCase();
        const label =
          reviewState === "approved"
            ? "Approved"
            : reviewState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div className={`inline-flex items-center text-xs font-semibold ${getStatusToneClassName(reviewState === "approved" ? "success" : reviewState === "rejected" ? "danger" : "primary")}`}>
              {label}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 300,
      render: (_, document) => {
        const decisionKey = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const decision = checkerDocumentDecisions[decisionKey] || {
          status: "",
          comment: "",
          documentName: document.documentName,
        };

        if (!isCloseRequestAction || !canAccept) {
          return (
            <span className="inline-flex items-center text-xs font-semibold text-(--color-primary-dark)">
              {decision.status === "approved"
                ? "Approved"
                : decision.status === "rejected"
                  ? "Rejected"
                  : "Awaiting checker decision"}
            </span>
          );
        }

        return (
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                size="small"
                type={decision.status === "approved" ? "primary" : "default"}
                onClick={() => updateCheckerDocumentDecision(document, { status: "approved" })}
              >
                Accept
              </Button>
              <Button
                size="small"
                danger={decision.status === "rejected"}
                type={decision.status === "rejected" ? "primary" : "default"}
                onClick={() => updateCheckerDocumentDecision(document, { status: "rejected" })}
              >
                Reject
              </Button>
              <Button
                size="small"
                onClick={() => updateCheckerDocumentDecision(document, { status: "", comment: "" })}
              >
                Reset
              </Button>
            </div>
          </div>
        );
      },
    },
  ];

  const approvalFlowColumns = [
    {
      title: "Step",
      key: "step",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Role",
      key: "role",
      render: (_, approver) => approver.designation || approver.role || "-",
    },
    {
      title: "Approver",
      key: "approver",
      render: (_, approver) => approver.name || approver.approverName || "User",
    },
    {
      title: "Status",
      key: "status",
      render: (_, approver, index) => {
        const approved =
          approver.approved || isApprovalMarkedApproved(approver.approvalStatus);
        const isCurrent =
          !approved &&
          approvalFlow
            .slice(0, index)
            .every(
              (item) =>
                item.approved || isApprovalMarkedApproved(item.approvalStatus),
            );

        return (
          <span className={`inline-flex items-center text-xs font-semibold ${getStatusToneClassName(approved ? "success" : isCurrent ? "primary" : "muted")}`}>
            {approved ? "Approved" : isCurrent ? "Current" : "Pending Approval"}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className={reviewShellClassName}>
        <div className="w-full max-w-full">
          <DeferralReviewHeader
            deferral={deferral}
            onClose={onClose}
            onViewDocuments={() => setActiveTab("documents")}
            documentCount={uploadedDocumentCount}
          />

          <div className={actionBarClassName}>
            <div className={actionGroupClassName}>
              {canAccept ? (
                <Button
                  className={primaryButtonClassName}
                  disabled={Boolean(actionLoading)}
                  onClick={onApprove}
                  icon={<CheckCircleOutlined />}
                >
                  {isCloseRequestAction ? "Submit Review" : "Accept"}
                </Button>
              ) : null}

              {canReturnForRework ? (
                <Button
                  className={primaryButtonClassName}
                  disabled={Boolean(actionLoading)}
                  onClick={onReturnForRework}
                  icon={<ExclamationCircleOutlined />}
                >
                  Return for Rework
                </Button>
              ) : null}
            </div>

            <div className={actionGroupEndClassName}>
              <Button
                className={primaryButtonClassName}
                icon={<DownloadOutlined />}
                loading={downloadLoading || Boolean(actionLoading)}
                onClick={onDownloadPDF || downloadDeferralAsPDF}
              >
                Download PDF
              </Button>
              <Button
                className={secondaryButtonClassName}
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>

          <div className={tabListClassName}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`whitespace-nowrap border-b-2 bg-transparent px-3 py-2 text-[11px] font-semibold ${activeTab === tab.key ? "border-(--color-primary-dark) text-(--color-primary-dark)" : "border-transparent text-(--color-text-light)"}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={workspaceClassName}>
            <div className="min-w-0">
              <div>
                <Spin spinning={Boolean(actionLoading)}>
                  {activeTab === "details" ? (
                    <>
                      <Card
                        className={sectionCardClassName}
                        size="small"
                        title={<span className={cardTitleClassName}>Workflow Status</span>}
                      >
                        <DeferralStatusAlert deferral={deferral} />
                      </Card>

                      <Card
                        className={infoCardClassName}
                        size="small"
                        title={<span className={cardTitleClassName}>Deferral Details</span>}
                      >
                        <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                          <Descriptions.Item label="Customer Name">
                            <span className="font-semibold text-(--color-primary-dark)">{deferral.customerName || "-"}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Customer Number">
                            <span className="font-semibold text-(--color-primary-dark)">{deferral.customerNumber || "-"}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Deferral No">
                            <span className="font-semibold text-(--color-primary-dark)">{deferral.deferralNumber || "-"}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="DCL No">
                            <span className="font-semibold text-(--color-primary-dark)">{deferral.dclNo || deferral.dclNumber || "-"}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Type">
                            <span className="font-semibold text-(--color-primary-dark)">{deferral.loanType || "-"}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Created At">
                            <span className="font-semibold text-(--color-primary-dark)">
                              {deferral.createdAt ? dayjs(deferral.createdAt).format("DD MMM YYYY") : "-"}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Status">
                            <span className={`font-semibold ${getStatusToneClassName(checkerApproved ? "success" : isRejected ? "danger" : "primary")}`}>
                              {deferral.status
                                ? deferral.status.replace(/_/g, " ")
                                : "-"}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Creator Status">
                            <span className={creatorApproved ? "text-[#52c41a]" : "text-(--color-primary-dark)"}>
                              {creatorApproved ? "Approved" : "Pending"}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Checker Status">
                            <span className={checkerApproved ? "text-[#52c41a]" : "text-(--color-primary-dark)"}>
                              {checkerApproved ? "Approved" : "Pending"}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Approvers Status">
                            <span className="font-semibold text-(--color-primary-dark)">
                              {approvedApproversCount} of {approvalFlow.length} Approved
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Amount">
                            <span className="font-semibold text-(--color-primary-dark)">{deferral.loanAmountCategory || deferral.loanAmount || "Below 75 million"}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Requested Documents">
                            <span className="font-semibold text-(--color-primary-dark)">{requestedDocsWithDates.length}</span>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>

                      <Card
                        className={sectionCardClassName}
                        size="small"
                        title={<span className={cardTitleClassName}>Review Summary</span>}
                      >
                        <div className={statsGridClassName}>
                          <div className={statCardClassName}>
                            <div className="text-[10px] font-bold tracking-[0.08em] text-(--color-text-muted) uppercase">Requested Docs</div>
                            <div className="mt-2 text-[22px] font-bold text-(--color-text-dark)">{requestedDocsWithDates.length}</div>
                          </div>
                          <div className={statCardClassName}>
                            <div className="text-[10px] font-bold tracking-[0.08em] text-(--color-text-muted) uppercase">Uploaded Docs</div>
                            <div className="mt-2 text-[22px] font-bold text-(--color-text-dark)">{dclDocs.length + generalUploadedDocs.length}</div>
                          </div>
                          <div className={statCardClassName}>
                            <div className="text-[10px] font-bold tracking-[0.08em] text-(--color-text-muted) uppercase">Approvals</div>
                            <div className="mt-2 text-[22px] font-bold text-(--color-text-dark)">{approvedApproversCount}</div>
                          </div>
                        </div>
                      </Card>

                      <Card
                        className={sectionCardClassName}
                        size="small"
                        title={<span className={cardTitleClassName}>Deferral Description</span>}
                      >
                        <div className="overflow-wrap-anywhere whitespace-pre-wrap break-word rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-4 py-3.5 text-[13px] leading-6 text-(--color-text-body-soft)">
                          {deferral.deferralDescription || "No description provided."}
                        </div>
                      </Card>

                      {deferral.facilities?.length > 0 ? (
                        <Card
                          className={sectionCardClassName}
                          size="small"
                          title={<span className={cardTitleClassName}>Facility Details ({deferral.facilities.length})</span>}
                        >
                          <div className={tableShellClassName}>
                            <Table
                              dataSource={deferral.facilities}
                              columns={getFacilityColumns()}
                              pagination={false}
                              size="small"
                              rowKey={(row, index) => row.facilityNumber || row._id || `facility-${index}`}
                              scroll={{ x: 600 }}
                            />
                          </div>
                        </Card>
                      ) : null}

                      {approvalFlow.length > 0 ? (
                        <Card
                          className={sectionCardClassName}
                          size="small"
                          title={<span className={cardTitleClassName}>Approval Flow</span>}
                        >
                          <div className={tableShellClassName}>
                            <Table
                              dataSource={approvalFlow}
                              columns={approvalFlowColumns}
                              pagination={false}
                              size="small"
                              rowKey={(approver, index) => approver._id || approver.userId || `approver-${index}`}
                              scroll={{ x: 640 }}
                            />
                          </div>
                        </Card>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {requestedDocsWithDates.length > 0 ? (
                        <Card
                          className={sectionCardClassName}
                          size="small"
                          title={<span className={cardTitleClassName}>Document(s) to be Deferred ({requestedDocsWithDates.length})</span>}
                        >
                          <div className={tableShellClassName}>
                            <Table
                              dataSource={requestedDocsWithDates}
                              columns={requestedDocsColumns}
                              pagination={false}
                              size="small"
                              rowKey={(doc, index) => doc.id || doc._id || `${doc.name || "doc"}-${index}`}
                              scroll={{ x: 720 }}
                            />
                          </div>
                        </Card>
                      ) : null}

                      <Card
                        className={sectionCardClassName}
                        size="small"
                        title={<span className={cardTitleClassName}>Mandatory: DCL Upload</span>}
                      >
                        <div className={tableShellClassName}>
                          <Table
                            dataSource={dclDocs}
                            columns={uploadedDocumentColumns}
                            pagination={false}
                            size="small"
                            rowKey={(doc, index) => doc.id || doc._id || `dcl-${index}`}
                            locale={{ emptyText: "Auto-generated DCL document pending upload" }}
                          />
                        </div>
                      </Card>

                      <Card
                        className={sectionCardClassName}
                        size="small"
                        title={<span className={cardTitleClassName}>Additional Documents ({generalUploadedDocs.length})</span>}
                      >
                        <div className={tableShellClassName}>
                          <Table
                            dataSource={generalUploadedDocs}
                            columns={uploadedDocumentColumns}
                            pagination={false}
                            size="small"
                            rowKey={(doc, index) => doc.id || doc._id || `upload-${index}`}
                            locale={{ emptyText: "No additional supporting documents" }}
                          />
                        </div>
                      </Card>

                      {isCloseRequestContext && closeRequestDocuments.length > 0 ? (
                        <Card
                          className={sectionCardClassName}
                          size="small"
                          title={<span className={cardTitleClassName}>Close Request Documents ({closeRequestDocuments.length})</span>}
                        >
                          <div className={tableShellClassName}>
                            <Table
                              dataSource={closeRequestDocuments}
                              columns={closeRequestColumns}
                              pagination={false}
                              size="small"
                              rowKey={(document) => document.key || document.documentName}
                              expandable={{
                                expandedRowRender: (document) => (
                                  <Table
                                    dataSource={document.uploads || []}
                                    columns={closeRequestUploadColumns}
                                    pagination={false}
                                    size="small"
                                    rowKey={(upload, index) => upload.id || upload._id || `${document.key}-upload-${index}`}
                                    locale={{ emptyText: "No uploaded close-request evidence found for this document." }}
                                  />
                                ),
                              }}
                              scroll={{ x: 1100 }}
                            />
                          </div>
                        </Card>
                      ) : null}
                    </>
                  )}
                </Spin>
              </div>
            </div>

            <aside className={sidebarClassName}>
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold tracking-[0.08em] text-(--color-text-medium) uppercase">Recent Comments</div>
                {history.length === 0 ? (
                  <div className="text-xs leading-5 text-(--color-text-medium)">No user comments yet.</div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {history.map((item, index) => (
                      <div
                        key={`${item.date || item.createdAt || "comment"}-${index}`}
                        className={`${index === 0 ? "" : "border-t border-[rgba(214,189,152,0.14)] pt-2.5"}`}
                      >
                        <div className="mb-1 flex justify-between gap-2">
                          <span className="overflow-wrap-anywhere break-word text-xs font-semibold text-(--color-primary-dark)">
                            {item.user || "User"}
                          </span>
                          <span className="shrink-0 text-[11px] text-[#94a3b8]">
                            {formatHistoryTimestamp(item.date || item.createdAt || item.timestamp)}
                          </span>
                        </div>
                        <div className="overflow-wrap-anywhere break-word text-xs leading-5 text-(--color-text-medium)">
                          {item.comment || item.notes || item.message || item.text || "No comment provided."}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {approvalConfirmVisible ? (
        <div className={confirmOverlayClassName} role="presentation">
          <div
            className={confirmDialogClassName}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checker-approval-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={confirmHeroClassName}>
              <div className={confirmHeroIconClassName}><CheckCircleOutlined /></div>
              <h2 className="m-0 text-xl font-semibold" id="checker-approval-dialog-title">
                {isCloseRequestAction ? "Submit Close Request Review" : "Confirm Acceptance"}
              </h2>
              <p className="mt-2 mb-0 text-sm leading-6 text-white/80">
                {isCloseRequestAction
                  ? "Review the checker decisions and submit this close request using the same admin modal layout used elsewhere in the workspace."
                  : "Confirm this deferral decision using the same admin modal layout used across the application."}
              </p>
              <button
                type="button"
                className={confirmCloseClassName}
                onClick={onApprovalCancel}
                aria-label="Close approval dialog"
              >
                ×
              </button>
            </div>

            <div className={confirmBodyClassName}>
              <div className={confirmBodyCardClassName}>
                <div className={confirmSummaryClassName}>
                  <div className="text-sm font-bold text-(--color-text-dark)">
                    {deferral.deferralNumber || (isCloseRequestAction ? "Close request review" : "Deferral acceptance")}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-(--color-text-medium)">
                    {isCloseRequestAction
                      ? "Review and submit the close-request decision for this deferral."
                      : "Accept this deferral using the same controlled review flow as the other system modals."}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-(--color-text-medium)">
                    {isCloseRequestAction
                      ? pendingCheckerDecisions > 0
                        ? `Review ${pendingCheckerDecisions} remaining close-request document${pendingCheckerDecisions === 1 ? "" : "s"} before you submit.`
                        : "Approving this review will advance the close request and publish your decision to the workflow trail."
                      : "Approving this request will advance it in the workflow and publish your decision to the review trail."}
                  </div>
                </div>

                <label className={confirmLabelClassName} htmlFor="checker-approval-comment">
                  {isCloseRequestAction ? "Review comment" : "Approval comments"}
                </label>
                <TextArea
                  id="checker-approval-comment"
                  rows={4}
                  placeholder="Enter any additional comments..."
                  value={creatorComment}
                  onChange={(event) => onCreatorCommentChange?.(event.target.value)}
                  className={confirmTextareaClassName}
                />
              </div>

              <div className={modalFooterClassName}>
                <Button
                  onClick={onApprovalCancel}
                  disabled={Boolean(actionLoading)}
                  className={modalSecondaryButtonClassName}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => onApprovalConfirm?.({
                    comment: creatorComment,
                    checkerDocumentDecisions: closeRequestDocuments.map((document) => {
                      const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
                      const decision = checkerDocumentDecisions[key] || {};
                      return {
                        documentName: document.documentName,
                        status: decision.status || "pending",
                        comment: decision.comment || "",
                      };
                    }),
                  })}
                  loading={Boolean(actionLoading)}
                  disabled={Boolean(actionLoading) || (isCloseRequestAction && pendingCheckerDecisions > 0)}
                  className={modalPrimaryButtonClassName}
                >
                  {isCloseRequestAction ? "Yes, Submit Review" : "Yes, Approve"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reworkConfirmVisible ? (
        <div className={confirmOverlayClassName} role="presentation">
          <div
            className={confirmDialogClassName}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checker-rework-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={confirmHeroClassName}>
              <div className={confirmHeroIconClassName}><RedoOutlined /></div>
              <h2 className="m-0 text-xl font-semibold" id="checker-rework-dialog-title">
                Return for Rework
              </h2>
              <p className="mt-2 mb-0 text-sm leading-6 text-white/80">
                Send the request back with corrective guidance using the same admin modal layout as the other system dialogs.
              </p>
              <button
                type="button"
                className={confirmCloseClassName}
                onClick={onReworkCancel}
                aria-label="Close rework dialog"
              >
                ×
              </button>
            </div>

            <div className={confirmBodyClassName}>
              <div className={confirmBodyCardClassName}>
                <div className={confirmSummaryClassName}>
                  <div className="text-sm font-bold text-(--color-text-dark)">
                    {deferral.deferralNumber || "Return for rework"}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-(--color-text-medium)">
                    Send the request back with clear corrective instructions.
                  </div>
                  <div className="mt-1 text-xs leading-6 text-(--color-text-medium)">
                    Returning this request will send it back with your instructions so the originating team can correct it.
                  </div>
                </div>

                <label className={confirmLabelClassName} htmlFor="checker-rework-comment">
                  Rework instructions (Required)
                </label>
                <TextArea
                  id="checker-rework-comment"
                  rows={4}
                  placeholder="Enter rework instructions..."
                  value={reworkComment}
                  onChange={(event) => onReworkCommentChange?.(event.target.value)}
                  className={confirmTextareaClassName}
                />
              </div>

              <div className={modalFooterClassName}>
                <Button
                  onClick={onReworkCancel}
                  disabled={Boolean(actionLoading)}
                  className={modalSecondaryButtonClassName}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onReworkConfirm}
                  loading={Boolean(actionLoading)}
                  disabled={!String(reworkComment || "").trim()}
                  className={modalPrimaryButtonClassName}
                >
                  Yes, Return for Rework
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DeferralDetailModal;