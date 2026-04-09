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
} from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../../../service/deferralApi";
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
import "../../../../styles/creatorDesignSystem.css";

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
    .map(({ __index, __score, __user, __comment, __time, ...entry }) => entry);
};

const REVIEW_STYLES = `
  .approver-deferral-review {
    border-top: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-bg);
  }

  .approver-deferral-review__page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .approver-deferral-review__topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .approver-deferral-review__title-wrap {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .approver-deferral-review__title-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 54, 54, 0.08);
    color: var(--color-primary-dark);
    flex-shrink: 0;
  }

  .approver-deferral-review__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text-dark);
  }

  .approver-deferral-review__subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-light);
  }

  .approver-deferral-review__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-white);
    color: var(--color-text-medium);
  }

  .approver-deferral-review__banner,
  .approver-deferral-review__section,
  .approver-deferral-review__comments,
  .approver-deferral-review__decision-card {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
  }

  .approver-deferral-review__banner {
    padding: 12px 14px;
  }

  .approver-deferral-review__banner-title {
    color: ${PRIMARY_BLUE};
    font-weight: 700;
    font-size: 13px;
  }

  .approver-deferral-review__banner-copy {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-medium);
  }

  .approver-deferral-review__tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    overflow-x: auto;
  }

  .approver-deferral-review__tab {
    padding: 10px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-light);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
  }

  .approver-deferral-review__tab--active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary-dark);
  }

  .approver-deferral-review__details-layout {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
    gap: 16px;
    align-items: start;
  }

  .approver-deferral-review__details-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .approver-deferral-review__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }

  .approver-deferral-review__section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-dark);
  }

  .approver-deferral-review__section-body {
    padding: 16px;
  }

  .approver-deferral-review__comments {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .approver-deferral-review__decision-card .ant-input {
    padding: 8px !important;
    font-size: 12px !important;
    border-radius: 6px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
  }

  .approver-deferral-review__primary-btn.ant-btn,
  .approver-deferral-review__decision-primary.ant-btn {
    border: none !important;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .approver-deferral-review__primary-btn.ant-btn:hover,
  .approver-deferral-review__primary-btn.ant-btn:focus,
  .approver-deferral-review__primary-btn.ant-btn:active,
  .approver-deferral-review__decision-primary.ant-btn:hover,
  .approver-deferral-review__decision-primary.ant-btn:focus,
  .approver-deferral-review__decision-primary.ant-btn:active {
    border: none !important;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  .approver-deferral-review__secondary-btn.ant-btn,
  .approver-deferral-review__decision-secondary.ant-btn {
    border: 1px solid var(--color-primary-soft) !important;
    background: transparent !important;
    color: var(--color-primary-medium) !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .approver-deferral-review__secondary-btn.ant-btn:hover,
  .approver-deferral-review__secondary-btn.ant-btn:focus,
  .approver-deferral-review__secondary-btn.ant-btn:active,
  .approver-deferral-review__decision-secondary.ant-btn:hover,
  .approver-deferral-review__decision-secondary.ant-btn:focus,
  .approver-deferral-review__decision-secondary.ant-btn:active {
    border-color: var(--color-primary-soft) !important;
    background: rgba(214, 189, 152, 0.1) !important;
    color: var(--color-primary-dark) !important;
    box-shadow: none !important;
  }

  .approver-deferral-review__primary-btn.ant-btn:disabled,
  .approver-deferral-review__primary-btn.ant-btn[disabled],
  .approver-deferral-review__secondary-btn.ant-btn:disabled,
  .approver-deferral-review__secondary-btn.ant-btn[disabled],
  .approver-deferral-review__decision-primary.ant-btn:disabled,
  .approver-deferral-review__decision-primary.ant-btn[disabled],
  .approver-deferral-review__decision-secondary.ant-btn:disabled,
  .approver-deferral-review__decision-secondary.ant-btn[disabled] {
    background: #D1D5DB !important;
    border-color: #D1D5DB !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  .approver-deferral-review__primary-btn.ant-btn:disabled span,
  .approver-deferral-review__primary-btn.ant-btn[disabled] span,
  .approver-deferral-review__secondary-btn.ant-btn:disabled span,
  .approver-deferral-review__secondary-btn.ant-btn[disabled] span,
  .approver-deferral-review__decision-primary.ant-btn:disabled span,
  .approver-deferral-review__decision-primary.ant-btn[disabled] span,
  .approver-deferral-review__decision-secondary.ant-btn:disabled span,
  .approver-deferral-review__decision-secondary.ant-btn[disabled] span {
    color: #fff !important;
  }

  .approver-deferral-review__table-shell {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .approver-deferral-review__table-shell + .approver-deferral-review__table-shell {
    margin-top: 16px;
  }

  .approver-deferral-review .ant-descriptions-item-label {
    font-weight: 700 !important;
    color: var(--color-text-light) !important;
    font-size: 11px !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .approver-deferral-review .ant-descriptions-item-content {
    color: var(--color-text-dark) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
  }

  .approver-deferral-review .ant-table,
  .approver-deferral-review .ant-table-wrapper,
  .approver-deferral-review .ant-spin-nested-loading,
  .approver-deferral-review .ant-spin-container,
  .approver-deferral-review .ant-table-container,
  .approver-deferral-review .ant-table-content,
  .approver-deferral-review table,
  .approver-deferral-review thead,
  .approver-deferral-review tbody,
  .approver-deferral-review tr {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .approver-deferral-review .ant-table-thead > tr > th {
    background: transparent !important;
    color: var(--color-text-medium) !important;
    font-size: 11px;
    font-weight: 600;
    padding: 12px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    text-transform: uppercase;
    border-right: none !important;
  }

  .approver-deferral-review .ant-table-tbody > tr > td {
    padding: 14px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
    border-right: none !important;
    color: var(--color-text-medium);
    font-size: 12px;
  }

  .approver-deferral-review .ant-table-thead > tr > th::before,
  .approver-deferral-review .ant-table-cell::before,
  .approver-deferral-review .ant-table-cell::after {
    display: none !important;
  }

  .approver-deferral-review__actionbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px 16px;
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
  }

  .approver-deferral-review__actionbar-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .approver-deferral-review__empty {
    padding: 24px;
  }

  .approver-decision-modal .ant-modal-content {
    border-radius: 16px !important;
    border: 1px solid rgba(214, 189, 152, 0.28) !important;
    box-shadow: 0 24px 64px rgba(26, 54, 54, 0.14) !important;
    overflow: hidden;
    padding: 0 !important;
  }

  .approver-decision-modal .ant-modal-header {
    margin: 0 !important;
    padding: 16px 20px 0 !important;
    border-bottom: none !important;
  }

  .approver-decision-modal .ant-modal-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-dark);
  }

  .approver-decision-modal .ant-modal-body {
    padding: 16px 20px 20px !important;
  }

  .approver-decision-modal .ant-modal-footer {
    margin: 0 !important;
    padding: 0 20px 20px !important;
  }

  .approver-deferral-review__decision-card {
    padding: 14px;
  }

  .approver-deferral-review__decision-summary {
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 10px;
    background: rgba(214, 189, 152, 0.12);
  }

  .approver-deferral-review__decision-label {
    display: block;
    margin-bottom: 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-light);
  }

  @media (max-width: 1023px) {
    .approver-deferral-review__details-layout {
      grid-template-columns: 1fr;
    }

    .approver-deferral-review__actionbar,
    .approver-deferral-review__actionbar-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;

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
      message.success("Deferral approved successfully");

      if (approveComment.trim()) {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const currentUser = storedUser?.user || storedUser;
        const authorName = currentUser?.name || currentUser?.userName || "Approver";
        const authorRole = currentUser?.role || currentUser?.user?.role || "Approver";

        try {
          await deferralApi.postComment(
            safeDeferral._id,
            {
              text: approveComment.trim(),
              author: { name: authorName, role: authorRole },
              createdAt: new Date().toISOString(),
            },
            token,
          );
        } catch (error) {
          console.error("Failed to post approval comment:", error);
        }
      }

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
      message.error(error.message || "Failed to approve");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      message.error("Please provide a rejection reason");
      return;
    }

    setRejecting(true);
    try {
      const updated = await deferralApi.rejectDeferral(
        safeDeferral._id || safeDeferral.id,
        { reason: rejectComment.trim() },
        token,
      );
      message.success("Deferral rejected");

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const currentUser = storedUser?.user || storedUser;
      const authorName = currentUser?.name || currentUser?.userName || "Approver";
      const authorRole = currentUser?.role || currentUser?.user?.role || "Approver";

      await deferralApi.postComment(
        safeDeferral._id,
        {
          text: rejectComment.trim(),
          author: { name: authorName, role: authorRole },
          createdAt: new Date().toISOString(),
        },
        token,
      );

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
      message.error(error.message || "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const executeReturnForRework = async () => {
    if (!reworkComment.trim()) {
      message.error("Please provide rework instructions");
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
      );

      message.success(
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
      message.error(error.message || "Failed to return for rework");
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
        events.push({
          user: comment.author?.name || comment.authorName || comment.userName || "User",
          userRole: comment.author?.role || comment.authorRole || "User",
          date: comment.createdAt,
          comment: comment.text || "",
        });
      });
    }

    if (Array.isArray(safeDeferral.history)) {
      safeDeferral.history.forEach((entry) => {
        if (entry.action === "moved") {
          return;
        }

        events.push({
          user: entry.userName || entry.user?.name || entry.user || "System",
          userRole: entry.userRole || entry.user?.role || "System",
          date: entry.date || entry.createdAt || entry.timestamp,
          comment: entry.comment || entry.notes || "",
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
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
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
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {value || "Document"}
        </span>
      ),
    },
    {
      title: "Uploaded At",
      dataIndex: "uploadDate",
      key: "uploadDate",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
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
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
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
          <span style={{ fontWeight: 700, color: approved ? SUCCESS_GREEN : PRIMARY_BLUE }}>
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
      title={title}
      open={modalOpen}
      onCancel={onCancel}
      maskClosable={false}
      wrapClassName="approver-decision-modal"
      footer={[
        <Button
          key="cancel"
          className="approver-deferral-review__decision-secondary"
          onClick={onCancel}
          disabled={confirmLoading}
        >
          Cancel
        </Button>,
        <Button
          key="confirm"
          className={`approver-deferral-review__decision-primary ${confirmClassName || ""}`.trim()}
          loading={confirmLoading}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmText}
        </Button>,
      ]}
    >
      <div className="approver-deferral-review__decision-card">
        <div className="approver-deferral-review__decision-summary">
          <div style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
            {safeDeferral.deferralNumber || "Deferral request"}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-medium)" }}>
            {safeDeferral.customerName || "Customer"}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-medium)" }}>
            {summaryCopy}
          </div>
        </div>

        <label className="approver-deferral-review__decision-label">
          {inputLabel}
          {inputRequired ? " (Required)" : ""}
        </label>
        <Input.TextArea
          rows={4}
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={inputPlaceholder}
        />
      </div>
    </Modal>
  );

  return (
    <>
      <style>{REVIEW_STYLES}</style>

      <div className="approver-deferral-review">
        <div className="approver-deferral-review__page">
          <div className="approver-deferral-review__topbar">
            <div className="approver-deferral-review__title-wrap">
              <span className="approver-deferral-review__title-icon">
                <BankOutlined />
              </span>
              <div>
                <h2 className="approver-deferral-review__title">
                  {headerTag
                    ? `${headerTag}: ${safeDeferral.deferralNumber}`
                    : `Deferral Request: ${safeDeferral.deferralNumber}`}
                </h2>
                <div className="approver-deferral-review__subtitle">{detailsSubtitle}</div>
              </div>
            </div>

            <Button
              className="approver-deferral-review__close"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>

          <div className="approver-deferral-review__banner">
            <div className="approver-deferral-review__banner-title">Under Review by Approvers</div>
            <div className="approver-deferral-review__banner-copy">
              This deferral request is currently undergoing approval from the designated approvers.
            </div>
          </div>

          <div className="approver-deferral-review__actionbar">
            <Button
              className="approver-deferral-review__primary-btn"
              icon={<FilePdfOutlined />}
              onClick={downloadDeferralAsPDF}
              loading={downloadLoading}
            >
              Download PDF
            </Button>

            <div className="approver-deferral-review__actionbar-actions">
              {!readOnly ? (
                <Button
                  className="approver-deferral-review__primary-btn approver-deferral-review__warning-btn"
                  onClick={() => setReturnReworkModalVisible(true)}
                  loading={returnReworkLoading}
                >
                  Return for Rework
                </Button>
              ) : null}

              {showApprovalActions ? (
                <>
                  <Button
                    className="approver-deferral-review__primary-btn approver-deferral-review__danger-btn"
                    icon={<CloseOutlined />}
                    onClick={() => setRejectModalVisible(true)}
                    loading={rejecting}
                  >
                    Reject
                  </Button>
                  <Button
                    className="approver-deferral-review__primary-btn"
                    icon={<CheckOutlined />}
                    onClick={() => setApproveModalVisible(true)}
                    loading={approveLoading}
                  >
                    Approve
                  </Button>
                </>
              ) : null}

              <Button className="approver-deferral-review__secondary-btn" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="approver-deferral-review__tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`approver-deferral-review__tab ${activeTab === tab.key ? "approver-deferral-review__tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "details" ? (
            <div className="approver-deferral-review__details-layout">
              <div className="approver-deferral-review__details-main">
                <section className="approver-deferral-review__section">
                  <div className="approver-deferral-review__section-head">
                    <h3 className="approver-deferral-review__section-title">Customer Information</h3>
                  </div>
                  <div className="approver-deferral-review__section-body">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Customer Name">{safeDeferral.customerName || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Customer Number">{safeDeferral.customerNumber || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Loan Type">{safeDeferral.loanType || "-"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="approver-deferral-review__section">
                  <div className="approver-deferral-review__section-head">
                    <h3 className="approver-deferral-review__section-title">Deferral Summary</h3>
                  </div>
                  <div className="approver-deferral-review__section-body">
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

                <section className="approver-deferral-review__section">
                  <div className="approver-deferral-review__section-head">
                    <h3 className="approver-deferral-review__section-title">Deferral Description</h3>
                  </div>
                  <div className="approver-deferral-review__section-body">
                    <Typography.Paragraph
                      style={{ marginBottom: 0, whiteSpace: "pre-wrap", color: "var(--color-text-medium)" }}
                    >
                      {safeDeferral.deferralDescription || "-"}
                    </Typography.Paragraph>
                  </div>
                </section>
              </div>

              <aside className="approver-deferral-review__comments">
                <div className="creator-caption">Comments</div>
                <CommentTrail history={history} isLoading={loadingComments} />
              </aside>
            </div>
          ) : (
            <div>
              <div className="approver-deferral-review__table-shell">
                <div className="approver-deferral-review__section-head">
                  <h3 className="approver-deferral-review__section-title">Documents To Be Deferred</h3>
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
                  <div className="approver-deferral-review__empty"><Empty description="No deferred documents" /></div>
                )}
              </div>

              <div className="approver-deferral-review__table-shell">
                <div className="approver-deferral-review__section-head">
                  <h3 className="approver-deferral-review__section-title">Facility Details</h3>
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
                  <div className="approver-deferral-review__empty"><Empty description="No facilities available" /></div>
                )}
              </div>

              <div className="approver-deferral-review__table-shell">
                <div className="approver-deferral-review__section-head">
                  <h3 className="approver-deferral-review__section-title">Mandatory DCL Upload</h3>
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
                  <div className="approver-deferral-review__empty"><Empty description="No DCL document uploaded" /></div>
                )}
              </div>

              <div className="approver-deferral-review__table-shell">
                <div className="approver-deferral-review__section-head">
                  <h3 className="approver-deferral-review__section-title">Additional Documents</h3>
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
                  <div className="approver-deferral-review__empty"><Empty description="No additional documents" /></div>
                )}
              </div>

              <div className="approver-deferral-review__table-shell">
                <div className="approver-deferral-review__section-head">
                  <h3 className="approver-deferral-review__section-title">Approval Flow</h3>
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
                  <div className="approver-deferral-review__empty"><Empty description="No approval flow recorded" /></div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {renderDecisionModal({
        title: `Reject Deferral Request: ${safeDeferral.deferralNumber}`,
        open: rejectModalVisible,
        onCancel: () => {
          setRejectModalVisible(false);
          setRejectComment("");
        },
        onConfirm: handleReject,
        confirmText: "Yes, Reject",
        confirmLoading: rejecting,
        confirmDisabled: !rejectComment.trim(),
        confirmClassName: "approver-deferral-review__danger-btn",
        summaryCopy: "Rejecting this request will close the approval path and record your reason in the audit trail.",
        inputLabel: "Rejection reason",
        inputRequired: true,
        inputValue: rejectComment,
        onInputChange: setRejectComment,
        inputPlaceholder: "Enter rejection reason...",
      })}

      {renderDecisionModal({
        title: `Return for Rework: ${safeDeferral.deferralNumber}`,
        open: returnReworkModalVisible,
        onCancel: () => {
          setReturnReworkModalVisible(false);
          setReworkComment("");
        },
        onConfirm: executeReturnForRework,
        confirmText: "Yes, Return for Rework",
        confirmLoading: returnReworkLoading,
        confirmDisabled: !reworkComment.trim(),
        confirmClassName: "approver-deferral-review__warning-btn",
        summaryCopy: "Returning this request will send it back with your instructions so the originating team can correct it.",
        inputLabel: "Rework instructions",
        inputRequired: true,
        inputValue: reworkComment,
        onInputChange: setReworkComment,
        inputPlaceholder: "Enter rework instructions...",
      })}

      {renderDecisionModal({
        title: `Approve Deferral: ${safeDeferral.deferralNumber}`,
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
