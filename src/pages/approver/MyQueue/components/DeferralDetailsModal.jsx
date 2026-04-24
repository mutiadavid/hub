import React, { useState } from "react";
import {
  Button,
  Descriptions,
  Empty,
  Input,
  Modal,
  Table,
  Typography,
  message,
} from "antd";
import {
  BankOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../../../service/deferralApi";
import {
  showErrorToast,
  showSuccessToast,
} from "../../../../utils/authToast";
import getFacilityColumns from "../../../../utils/facilityColumns";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";
import { getLivePartyApprovalStatuses } from "../../../../utils/deferralApprovalStatus";
import { openFileInNewTab, downloadFile } from "../../../../utils/fileUtils";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import {
  ERROR_RED,
  PRIMARY_BLUE,
  SUCCESS_GREEN,
  WARNING_ORANGE,
} from "../utils/constants";
import CommentTrail from "./CommentTrail";

const TABS = [
  { key: "details", label: "Deferral Details" },
  { key: "documents", label: "Documents & Flow" },
];

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

const normalizeHistoryValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const DUPLICATE_TIME_WINDOW_MS = 2 * 60 * 1000;

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
      const cleanedEntry = { ...entry };
      delete cleanedEntry.__index;
      delete cleanedEntry.__score;
      delete cleanedEntry.__user;
      delete cleanedEntry.__comment;
      delete cleanedEntry.__time;
      return cleanedEntry;
    });
};

const reviewShellClassName = "border-t border-[rgba(214,189,152)] bg-(--color-bg) [&_.ant-descriptions-item-label]:text-[11px] [&_.ant-descriptions-item-label]:font-normal [&_.ant-descriptions-item-label]:uppercase [&_.ant-descriptions-item-label]:tracking-[0.04em] [&_.ant-descriptions-item-label]:text-(--color-text-dark) [&_.ant-descriptions-item-content]:overflow-wrap-anywhere [&_.ant-descriptions-item-content]:text-[13px] [&_.ant-descriptions-item-content]:font-normal [&_.ant-descriptions-item-content]:text-(--color-text-dark) max-md:[&_.ant-descriptions-view]:block max-md:[&_.ant-descriptions-view_table]:block max-md:[&_.ant-descriptions-view_tbody]:block max-md:[&_.ant-descriptions-row]:block max-md:[&_.ant-descriptions-item]:block max-md:[&_.ant-descriptions-item]:w-full max-md:[&_.ant-descriptions-item]:border-b max-md:[&_.ant-descriptions-item]:border-[rgba(214,189,152,0.14)] max-md:[&_.ant-descriptions-item:last-child]:border-b-0 max-md:[&_.ant-descriptions-item-label]:block max-md:[&_.ant-descriptions-item-content]:block max-md:[&_.ant-descriptions-item-label]:w-full max-md:[&_.ant-descriptions-item-content]:w-full max-md:[&_.ant-descriptions-item-label]:whitespace-normal max-md:[&_.ant-descriptions-item-content]:whitespace-normal max-md:[&_.ant-descriptions-item-label]:px-0 max-md:[&_.ant-descriptions-item-content]:px-0 max-md:[&_.ant-descriptions-item-label]:pb-1.5 max-md:[&_.ant-descriptions-item-content]:pt-0 max-md:[&_.ant-descriptions-item-content]:min-w-0 [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-header]:border-b-0 [&_.ant-table-header]:shadow-none [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:border-none [&_.ant-table-content]:bg-transparent [&_table]:border-none [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_tr]:border-none [&_.ant-table-thead>tr]:border-b-0 [&_.ant-table-thead>tr]:shadow-none [&_.ant-table-thead>tr>th]:!border-b-0 [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-thead>tr>th]:bg-[rgba(247,244,239,0.55)] [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.04em] [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-thead>tr>th]:shadow-none [&_.ant-table-tbody>tr:first-child>td]:!border-t-0 [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.1)] [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr:last-child>td]:border-b-0 [&_.ant-table-row:hover>td]:bg-[rgba(247,244,239,0.35)] [&_.ant-table-thead>tr>th::before]:hidden [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

const tableShellClassName = "overflow-hidden rounded-xl border border-[rgba(214,189,152,0.16)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]";

const primaryButtonClassName = "rounded-lg! border-0! bg-(--ncb-primary-500)! text-white! shadow-none! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-[#6b7280]! [&>span]:text-white! disabled:[&>span]:text-[#6b7280]!";

const secondaryButtonClassName = "rounded-lg! border-(--color-primary-soft)! bg-transparent! text-(--color-primary-medium)! shadow-none! hover:border-(--color-primary-soft)! hover:bg-[rgba(214,189,152,0.1)]! hover:text-(--color-primary-dark)! focus:border-(--color-primary-soft)! focus:bg-[rgba(214,189,152,0.1)]! focus:text-(--color-primary-dark)! active:border-(--color-primary-soft)! active:bg-[rgba(214,189,152,0.1)]! active:text-(--color-primary-dark)! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-[#6b7280]! disabled:[&>span]:text-[#6b7280]!";

const decisionSecondaryButtonClassName = "min-w-[92px]! h-11! rounded-[10px]! border-[#d0d5dd]! bg-white! text-(--color-text-medium)! shadow-none! font-semibold! hover:border-[#d0d5dd]! hover:bg-[#f8fafc]! hover:text-(--color-text-dark)! focus:border-[#d0d5dd]! focus:bg-[#f8fafc]! focus:text-(--color-text-dark)! active:border-[#d0d5dd]! active:bg-[#f8fafc]! active:text-(--color-text-dark)! max-sm:w-full";

const decisionPrimaryButtonClassName = "min-w-[156px]! h-11! rounded-[10px]! border-0! bg-(--ncb-primary-500)! text-white! shadow-[0_10px_20px_rgba(58,179,229,0.18)]! font-bold! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! [&>span]:text-white! max-sm:w-full";

const decisionModalWrapClassName = "approver-decision-modal [&_.ant-modal]:max-sm:mx-auto [&_.ant-modal]:max-sm:my-3 [&_.ant-modal]:max-sm:max-w-[calc(100vw-24px)] [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:border-0 [&_.ant-modal-content]:bg-white [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:shadow-[0_32px_72px_rgba(18,36,36,0.24)] [&_.ant-modal-header]:m-0 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-[rgba(214,189,152,0.18)] [&_.ant-modal-header]:bg-white! [&_.ant-modal-title]:text-(--color-text-dark) [&_.ant-modal-close]:top-5 [&_.ant-modal-close]:end-5 [&_.ant-modal-close]:h-8 [&_.ant-modal-close]:w-8 [&_.ant-modal-close]:text-(--color-text-medium) hover:[&_.ant-modal-close]:bg-[rgba(214,189,152,0.12)] hover:[&_.ant-modal-close]:text-(--color-text-dark) [&_.ant-modal-body]:bg-white [&_.ant-modal-footer]:m-0 [&_.ant-modal-footer]:bg-white [&_.ant-modal-footer]:pt-0";

const renderStatusLabel = (status) =>
  String(status || "pending")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const DeferralDetailsModal = ({
  deferral,
  open,
  onClose,
  onAction,
  headerTag,
  readOnly = false,
  overrideApprovals,
  token = null,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [returnReworkLoading, setReturnReworkLoading] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [reworkComment, setReworkComment] = useState("");
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [returnReworkModalVisible, setReturnReworkModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const loadingComments = false;
  const safeDeferral = deferral || null;

  const executeApprove = async () => {
    setApproveLoading(true);
    try {
      const updated = await deferralApi.approveDeferral(
        safeDeferral._id || safeDeferral.id,
        approveComment.trim() || "",
        token,
      );
      showSuccessToast("Deferral approved successfully");

      if (onAction) {
        onAction("refreshQueue");
        onAction("gotoActioned");
      }

      try {
        window.dispatchEvent(new CustomEvent("deferral:updated", { detail: updated }));
      } catch (error) {
        console.debug("Failed to dispatch deferral:updated", error);
      }

      setApproveModalVisible(false);
      setApproveComment("");
      onClose();
    } catch (error) {
      showErrorToast(error.message || "Failed to approve");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      showErrorToast("Please provide a rejection reason");
      return;
    }

    setRejecting(true);
    try {
      const updated = await deferralApi.rejectDeferral(
        safeDeferral._id || safeDeferral.id,
        { reason: rejectComment.trim() },
        token,
      );
      showSuccessToast("Deferral rejected");

      if (onAction) {
        onAction("refreshQueue");
        onAction("gotoActioned");
      }

      try {
        window.dispatchEvent(new CustomEvent("deferral:updated", { detail: updated }));
      } catch (error) {
        console.debug("Failed to dispatch deferral:updated", error);
      }

      setRejectModalVisible(false);
      setRejectComment("");
      onClose();
    } catch (error) {
      showErrorToast(error.message || "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const executeReturnForRework = async () => {
    if (!reworkComment.trim()) {
      showErrorToast("Please provide rework instructions");
      return;
    }

    setReturnReworkLoading(true);
    try {
      const updatedDeferral = await deferralApi.returnForRework(
        safeDeferral._id || safeDeferral.id,
        {
          comment: reworkComment,
          reworkInstructions: reworkComment,
        },
        token,
      );

      showSuccessToast(
        "Deferral returned for rework. Relationship Manager has been notified.",
      );

      if (onAction) {
        onAction("returnForRework", safeDeferral._id || safeDeferral.id, updatedDeferral);
      }

      try {
        window.dispatchEvent(new CustomEvent("deferral:updated", { detail: updatedDeferral }));
      } catch (error) {
        console.debug("Failed to dispatch deferral:updated", error);
      }

      setReturnReworkModalVisible(false);
      setReworkComment("");
      onClose();
    } catch (error) {
      console.error("Return for rework error:", error);
      showErrorToast(error.message || "Failed to return for rework");
    } finally {
      setReturnReworkLoading(false);
    }
  };

  if (!open || !safeDeferral) {
    return null;
  }

  const { dclDocs, uploadedDocs, requestedDocs } = getDeferralDocumentBuckets(safeDeferral);
  const livePartyStatuses = getLivePartyApprovalStatuses(safeDeferral);
  const requestedDocsWithDates = requestedDocs.map((doc) => {
    const requestedDays = doc.requestedDays || doc.daysSought || 0;
    const newDueDate = safeDeferral.createdAt
      ? dayjs(safeDeferral.createdAt).add(requestedDays, "days").toISOString()
      : null;

    return {
      ...doc,
      newDueDate,
    };
  });

  const history = (() => {
    const events = [];

    if (Array.isArray(safeDeferral.comments)) {
      safeDeferral.comments.forEach((comment) => {
        if (comment.isSystemComment || comment.isSystem) {
          return;
        }
        if (!String(comment.text || "").trim()) {
          return;
        }
        events.push({
          user: comment.author?.name || comment.authorName || comment.userName || "User",
          userRole: comment.author?.role || comment.authorRole || "User",
          date: comment.createdAt,
          comment: comment.text || "",
          isSystemComment: Boolean(comment.isSystemComment || comment.isSystem),
        });
      });
    }

    return dedupeHistoryEntries(events);
  })();

  const approvalFlow = overrideApprovals?.approvers || safeDeferral.approverFlow || [];
  const approvalFlowWithCurrent = approvalFlow.map((approver, index) => {
    const approved = approver.approved || approver.approvalStatus === "approved";
    const previousApprovalsComplete = approvalFlow
      .slice(0, index)
      .every((item) => item.approved || item.approvalStatus === "approved");

    return {
      ...approver,
      current: !approved && previousApprovalsComplete,
    };
  });

  const requestedDocumentColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span className="font-normal text-(--color-text-dark)">
          {value || "Untitled document"}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (value, record) => value || record.documentType || "-",
    },
    {
      title: "Days Sought",
      dataIndex: "requestedDays",
      key: "requestedDays",
      width: 120,
      render: (value, record) => value || record.daysSought || "-",
    },
    {
      title: "New Due Date",
      dataIndex: "newDueDate",
      key: "newDueDate",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
  ];

  const uploadedDocumentColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span className="font-normal text-(--color-text-dark)">
          {value || "Document"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(record.fileUrl || record.url)}
            disabled={!record.fileUrl && !record.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(record.fileUrl || record.url, record.name || "document")}
            disabled={!record.fileUrl && !record.url}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const approvalColumns = [
    {
      title: "Approver",
      key: "approver",
      render: (_, record) => (
        <span className="font-normal text-(--color-text-dark)">
          {record.name || record.approverName || "User"}
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "designation",
      key: "designation",
      render: (value, record) => value || record.role || "-",
    },
    {
      title: "Status",
      key: "status",
      width: 180,
      render: (_, record) => {
        const approved = record.approved || record.approvalStatus === "approved";
        return (
          <span className="font-normal text-(--color-text-dark)">
            {approved ? "Approved" : record.current ? "Current Reviewer" : "Pending Approval"}
          </span>
        );
      },
    },
  ];

  const detailsSubtitle = `${safeDeferral.customerName || "Customer"} • ${safeDeferral.dclNumber || safeDeferral.dclNo || "No DCL"}`;
  const showApprovalActions =
    !readOnly &&
    ["pending_approval", "in_review"].includes(String(safeDeferral.status || "").toLowerCase());

  const downloadDeferralAsPDF = async () => {
    if (!safeDeferral?._id) {
      message.error("No deferral selected");
      return;
    }

    setDownloadLoading(true);
    try {
      await downloadDeferralPdf(safeDeferral, { requestedDocsWithDates, history });
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Failed to generate PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  const renderDecisionModal = ({
    title,
    subtitle,
    titleIcon,
    open: modalOpen,
    onCancel,
    onConfirm,
    confirmText,
    confirmLoading,
    confirmDisabled = false,
    confirmClassName,
    summaryCopy,
    inputLabel,
    inputRequired = false,
    inputValue,
    onInputChange,
    inputPlaceholder,
  }) => (
    <Modal
      title={(
        <div className="flex items-start gap-4 pr-9 max-sm:gap-3 max-sm:pr-6">
          {titleIcon ? (
            <span className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[rgba(214,189,152,0.2)] bg-[rgba(26,54,54,0.04)] text-(--color-text-dark) [&_.anticon]:text-[22px] max-sm:h-11 max-sm:w-11">{titleIcon}</span>
          ) : null}
          <span className="flex flex-col gap-1.5">
            <strong className="text-[20px] font-bold leading-[1.2] text-(--color-text-dark) max-sm:text-[18px]">{title}</strong>
            <span className="text-[13px] leading-[1.45] text-(--color-text-medium)">{subtitle}</span>
          </span>
        </div>
      )}
      open={modalOpen}
      onCancel={onCancel}
      maskClosable={false}
      wrapClassName={decisionModalWrapClassName}
      styles={{
        header: { background: "white", margin: 0, padding: "22px 26px 18px" },
        body: { background: "white", padding: "28px 26px 24px" },
        footer: { background: "white", padding: "0 26px 24px", margin: 0 },
        content: { background: "white", padding: 0 }
      }}
      width={760}
      footer={[
        <div key="actions" className="flex justify-end gap-3 max-sm:flex-col-reverse">
          <Button
            className={decisionSecondaryButtonClassName}
            onClick={onCancel}
            disabled={confirmLoading}
          >
            Cancel
          </Button>,
          <Button
            className={`${decisionPrimaryButtonClassName} ${confirmClassName || ""}`.trim()}
            loading={confirmLoading}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </Button>
        </div>,
      ]}
    >
      <div className="rounded-[14px] border border-[rgba(214,189,152,0.18)] bg-[rgba(255,255,255,0.98)] p-5 shadow-[0_10px_28px_rgba(26,54,54,0.06)] max-sm:p-3.5 [&_.ant-input]:min-h-[132px] [&_.ant-input]:rounded-[10px] [&_.ant-input]:border-[#eaecf0] [&_.ant-input]:bg-white [&_.ant-input]:p-3.5 [&_.ant-input]:text-[15px] [&_.ant-input]:text-(--color-text-dark) [&_.ant-input]:shadow-none [&_.ant-input]:placeholder:text-[#98a2b3] hover:[&_.ant-input]:border-(--ncb-primary-500) focus-within:[&_.ant-input]:border-(--ncb-primary-500) focus-within:[&_.ant-input]:shadow-[0_0_0_2px_rgba(58,179,229,0.12)]">
        <div className="mb-5 rounded-[14px] border border-[rgba(214,189,152,0.18)] bg-white p-[18px] max-sm:mb-3 max-sm:rounded-[10px] max-sm:p-3">
          <div className="text-[28px] font-bold leading-[1.2] text-(--color-text-dark) max-sm:text-[22px]">
            {safeDeferral.deferralNumber || "Deferral request"}
          </div>
          <div className="mt-2 text-[18px] leading-[1.35] text-(--color-text-medium) max-sm:text-base">
            {safeDeferral.customerName || "Customer"}
          </div>
          <div className="mt-4 text-[15px] leading-[1.65] text-(--color-text-medium) max-sm:text-sm">
            {summaryCopy}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-(--color-text-medium)">
            {inputLabel}
            {inputRequired ? " (Required)" : ""}
          </label>
          <Input.TextArea
            rows={4}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={inputPlaceholder}
            className="resize-y"
          />
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      <div className={reviewShellClassName}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 max-md:flex-col max-md:items-stretch">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(26,54,54,0.08)] text-(--color-primary-dark)">
                <BankOutlined />
              </span>
              <div>
                <h2 className="m-0 text-base font-normal tracking-[-0.02em] text-(--color-text-dark)">
                  {headerTag
                    ? `${headerTag}: ${safeDeferral.deferralNumber}`
                    : `Deferral Request: ${safeDeferral.deferralNumber}`}
                </h2>
                <div className="mt-1 text-xs text-(--color-text-light)">{detailsSubtitle}</div>
              </div>
            </div>

            <Button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(214,189,152,0.2)] bg-white text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.2)] hover:bg-white hover:text-(--color-text-dark)"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>

          <div className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
            <div className="text-[13px] font-normal text-(--color-text-dark)">Under Review by Approvers</div>
            <div className="mt-1 text-xs text-(--color-text-medium)">
              This deferral request is currently undergoing approval from the designated approvers.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)] max-[1100px]:flex-col max-[1100px]:items-stretch">
            <Button
              className={primaryButtonClassName}
              icon={<FilePdfOutlined />}
              onClick={downloadDeferralAsPDF}
              loading={downloadLoading}
            >
              Download PDF
            </Button>

            <div className="flex flex-wrap justify-end gap-2 max-[1100px]:flex-col max-[1100px]:items-stretch">
              {!readOnly ? (
                <Button
                  className={primaryButtonClassName}
                  onClick={() => setReturnReworkModalVisible(true)}
                  loading={returnReworkLoading}
                >
                  Return for Rework
                </Button>
              ) : null}

              {showApprovalActions ? (
                <>
                  <Button
                    className={primaryButtonClassName}
                    icon={<CloseOutlined />}
                    onClick={() => setRejectModalVisible(true)}
                    loading={rejecting}
                  >
                    Reject
                  </Button>
                  <Button
                    className={primaryButtonClassName}
                    icon={<CheckOutlined />}
                    onClick={() => setApproveModalVisible(true)}
                    loading={approveLoading}
                  >
                    Approve
                  </Button>
                </>
              ) : null}

              <Button className={secondaryButtonClassName} onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-[rgba(214,189,152,0.2)]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`whitespace-nowrap border-b-2 bg-transparent px-3 py-2.5 text-xs font-medium ${activeTab === tab.key ? "border-(--color-primary-dark) text-(--color-primary-dark)" : "border-transparent text-(--color-text-light)"}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "details" ? (
            <div className="grid items-start gap-4 min-[1101px]:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
              <div className="flex min-w-0 flex-col gap-4">
                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Customer Information</h3>
                  </div>
                  <div className="p-4">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Customer Name">{safeDeferral.customerName || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Customer Number">{safeDeferral.customerNumber || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Loan Type">{safeDeferral.loanType || "-"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Deferral Summary</h3>
                  </div>
                  <div className="p-4">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Deferral Number">{safeDeferral.deferralNumber || "-"}</Descriptions.Item>
                      <Descriptions.Item label="DCL No">{safeDeferral.dclNumber || safeDeferral.dclNo || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Status">{renderStatusLabel(safeDeferral.status)}</Descriptions.Item>
                      <Descriptions.Item label="Creator Status">{livePartyStatuses.creatorLabel}</Descriptions.Item>
                      <Descriptions.Item label="Checker Status">{livePartyStatuses.checkerLabel}</Descriptions.Item>
                      <Descriptions.Item label="Approver Status">
                        {`${approvalFlowWithCurrent.filter((item) => item.approved || item.approvalStatus === "approved").length} of ${approvalFlowWithCurrent.length} Approved`}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loan Amount">{safeDeferral.loanAmountCategory || "Below 75 million"}</Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {safeDeferral.createdAt ? dayjs(safeDeferral.createdAt).format("DD MMM YYYY") : "-"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Deferral Description</h3>
                  </div>
                  <div className="p-4">
                    <Typography.Paragraph
                      className="mb-0 whitespace-pre-wrap text-(--color-text-medium)"
                    >
                      {safeDeferral.deferralDescription || "-"}
                    </Typography.Paragraph>
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-2 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white p-2.5 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                <div className="creator-caption">Comments</div>
                <CommentTrail history={history} isLoading={loadingComments} />
              </aside>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Documents To Be Deferred</h3>
                </div>
                {requestedDocsWithDates.length > 0 ? (
                  <Table
                    columns={requestedDocumentColumns}
                    dataSource={requestedDocsWithDates}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `${record.name}-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No deferred documents" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Facility Details</h3>
                </div>
                {safeDeferral.facilities?.length > 0 ? (
                  <Table
                    dataSource={safeDeferral.facilities}
                    columns={getFacilityColumns()}
                    pagination={false}
                    rowKey={(record, index) => record.facilityNumber || record._id || `facility-${index}`}
                    scroll={{ x: 720 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No facilities available" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Mandatory DCL Upload</h3>
                </div>
                {dclDocs.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={dclDocs}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `dcl-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No DCL document uploaded" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Additional Documents</h3>
                </div>
                {uploadedDocs.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={uploadedDocs}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `uploaded-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No additional documents" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Approval Flow</h3>
                </div>
                {approvalFlowWithCurrent.length > 0 ? (
                  <Table
                    columns={approvalColumns}
                    dataSource={approvalFlowWithCurrent}
                    pagination={false}
                    rowKey={(record, index) => record._id || `${record.name || record.approverName || "approver"}-${index}`}
                    scroll={{ x: 540 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No approval flow recorded" /></div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {renderDecisionModal({
        title: `Reject Deferral Request: ${safeDeferral.deferralNumber}`,
        subtitle: "Document your rejection before closing this approval path.",
        titleIcon: null,
        open: rejectModalVisible,
        onCancel: () => {
          setRejectModalVisible(false);
          setRejectComment("");
        },
        onConfirm: handleReject,
        confirmText: "Yes, Reject",
        confirmLoading: rejecting,
        confirmDisabled: !rejectComment.trim(),
        confirmClassName: "",
        summaryCopy: "Rejecting this request will close the approval path and record your reason in the audit trail.",
        inputLabel: "Rejection reason",
        inputRequired: true,
        inputValue: rejectComment,
        onInputChange: setRejectComment,
        inputPlaceholder: "Enter rejection reason...",
      })}

      {renderDecisionModal({
        title: `Return for Rework: ${safeDeferral.deferralNumber}`,
        subtitle: "Send the request back with clear corrective instructions.",
        titleIcon: <RedoOutlined />,
        open: returnReworkModalVisible,
        onCancel: () => {
          setReturnReworkModalVisible(false);
          setReworkComment("");
        },
        onConfirm: executeReturnForRework,
        confirmText: "Yes, Return for Rework",
        confirmLoading: returnReworkLoading,
        confirmDisabled: !reworkComment.trim(),
        confirmClassName: "",
        summaryCopy: "Returning this request will send it back with your instructions so the originating team can correct it.",
        inputLabel: "Rework instructions",
        inputRequired: true,
        inputValue: reworkComment,
        onInputChange: setReworkComment,
        inputPlaceholder: "Enter rework instructions...",
      })}

      {renderDecisionModal({
        title: `Approve Deferral: ${safeDeferral.deferralNumber}`,
        subtitle: "Confirm the request and advance it to the next workflow stage.",
        titleIcon: <CheckOutlined />,
        open: approveModalVisible,
        onCancel: () => {
          setApproveModalVisible(false);
          setApproveComment("");
        },
        onConfirm: executeApprove,
        confirmText: "Yes, Approve",
        confirmLoading: approveLoading,
        summaryCopy: "Approving this request will advance it in the workflow and publish your decision to the review trail.",
        inputLabel: "Approval comments",
        inputValue: approveComment,
        onInputChange: setApproveComment,
        inputPlaceholder: "Enter any additional comments...",
      })}
    </>
  );
};

export default DeferralDetailsModal;