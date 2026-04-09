
import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Card,
  Input,
  Button,
  Space,
  Avatar,
  Typography,
  Modal,
  message,
  Descriptions,
  List,
  Select,
  Popconfirm,
} from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  FileDoneOutlined,
  BankOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  LeftOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import deferralApi from "../../../../service/deferralApi";
import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getDeferralDocumentBuckets,
  getCloseRequestDocumentGroups,
  resolveDocumentDaysAndDateWithExtension,
} from "../../../../utils/deferralDocuments";
import UniformTag from "../../../../components/common/UniformTag";
import { openFileInNewTab, downloadFile } from "../../../../utils/fileUtils";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import {
  PRIMARY_BLUE,
  ACCENT_LIME,
  SUCCESS_GREEN,
  ERROR_RED,
  WARNING_ORANGE,
} from "../utils/constants";
import { getReturnedForReworkReason } from "../utils/helpers.jsx";
import { resolveDisplayName } from "../../../../utils/extensionHistory";
import ReturnForReworkModal from "./ReturnForReworkModal";
import ExtensionApplicationModal from "./ExtensionApplicationModal";
import CloseRequestModal from "./CloseRequestModal";
import RMDeferralReviewHeader from "./RMDeferralReviewHeader";
import RMDeferralReviewActionBar from "./RMDeferralReviewActionBar";
import RMDeferralReviewDetails from "./RMDeferralReviewDetails";
import RMDeferralReviewDocuments from "./RMDeferralReviewDocuments";
import RMDeferralReviewSidebar from "./RMDeferralReviewSidebar";
import RMWithdrawModal from "./RMWithdrawModal";
import RMEditApproversModal from "./RMEditApproversModal";

const isApprovalMarkedApproved = (approver) =>
  approver?.approved === true ||
  String(
    approver?.approvalStatus || approver?.ApprovalStatus || approver?.status || "",
  )
    .trim()
    .toLowerCase() === "approved";

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

const MODAL_STYLES = `
  .deferral-modal-overlay {
    position: fixed;
    top: 65px;
    left: var(--sidebar-width, 150px);
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 990;
    overflow: auto;
    padding-top: 20px;
    padding-bottom: 20px;
    transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
    max-height: 100vh;
  }
 
  .deferral-modal-container {
    background: white;
    border-radius: 12px;
    overflow: visible;
    width: 1200px;
    max-width: calc(100vw - 310px);
    box-shadow: none;
    border: 1px solid #e5e7eb;
    margin: 0 auto;
    position: relative;
    z-index: 1001;
  }

  .deferral-modal-embedded {
    width: 100%;
    margin-top: 16px;
  }

  .deferral-modal-container--embedded {
    width: 100%;
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    margin: 0;
  }

  .deferral-review-panel {
    margin-top: 0;
  }

  .deferral-review-container {
    background: transparent;
    border-radius: 0;
    overflow: visible;
    width: 100%;
    max-width: 100%;
    box-shadow: none;
    border: none;
    margin: 0;
    position: relative;
    z-index: 1;
  }

  .deferral-review-topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .deferral-review-topbar__main {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  .deferral-review-topbar__back.ant-btn {
    padding: 8px 12px !important;
    border-radius: 6px !important;
    border: 1px solid rgba(214, 189, 152, 0.35) !important;
    color: var(--color-text-medium) !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .deferral-review-topbar__title {
    color: ${PRIMARY_BLUE};
    font-size: 16px;
    font-weight: 700;
  }

  .deferral-review-topbar__subtitle {
    margin-top: 4px;
    color: #6b7280;
    font-size: 12px;
  }

  .deferral-review-topbar__docs.ant-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
    background: white !important;
    color: var(--color-text-medium) !important;
    box-shadow: none !important;
  }

  .deferral-review-topbar__count {
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

  .deferral-review-actionbar {
    background: white;
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .deferral-review-actionbar__group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .deferral-review-actionbar__group--end {
    margin-left: auto;
  }

  .deferral-review-actionbar__button.ant-btn,
  .deferral-review-sidebar__post.ant-btn {
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
    border: none !important;
    background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
    border-color: transparent !important;
    color: #FFFFFF !important;
  }

  .deferral-review-actionbar__button.ant-btn span,
  .deferral-review-sidebar__post.ant-btn span {
    color: #FFFFFF !important;
  }

  .deferral-review-actionbar__button.ant-btn:disabled,
  .deferral-review-actionbar__button.ant-btn[disabled],
  .deferral-review-sidebar__post.ant-btn:disabled,
  .deferral-review-sidebar__post.ant-btn[disabled] {
    background: #D1D5DB !important;
    border-color: #D1D5DB !important;
    color: #FFFFFF !important;
    border: none !important;
  }

  .deferral-review-actionbar__button.ant-btn:disabled span,
  .deferral-review-actionbar__button.ant-btn[disabled] span,
  .deferral-review-sidebar__post.ant-btn:disabled span,
  .deferral-review-sidebar__post.ant-btn[disabled] span {
    color: #FFFFFF !important;
  }

  .deferral-review-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    margin-bottom: 16px;
    overflow-x: auto;
  }

  .deferral-review-tab {
    padding: 8px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-light);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
  }

  .deferral-review-tab--active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary-dark);
  }

  .deferral-review-workspace {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(300px, 3fr);
    gap: 16px;
    align-items: start;
  }

  .deferral-review-main {
    min-width: 0;
  }

  .deferral-review-body {
    padding: 0;
    overflow: visible;
  }

  .deferral-review-sidebar {
    background: white;
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .deferral-review-sidebar__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .deferral-review-sidebar__title,
  .deferral-review-sidebar__history-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-medium);
  }

  .deferral-review-sidebar__label,
  .deferral-review-sidebar__hint {
    color: #6b7280;
    font-size: 11px;
  }

  .deferral-review-sidebar__textarea.ant-input {
    min-height: 120px;
  }

  .deferral-review-sidebar__post.ant-btn {
    align-self: flex-start;
  }

  .deferral-review-sidebar__history {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .deferral-review-sidebar__history-item {
    padding-top: 10px;
    border-top: 1px solid rgba(214, 189, 152, 0.14);
  }

  .deferral-review-sidebar__history-item:first-child {
    border-top: none;
    padding-top: 0;
  }

  .deferral-review-sidebar__history-meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  .deferral-review-sidebar__history-user {
    color: ${PRIMARY_BLUE};
    font-size: 12px;
    font-weight: 600;
  }

  .deferral-review-sidebar__history-time {
    color: #94a3b8;
    font-size: 11px;
  }

  .deferral-review-sidebar__history-text,
  .deferral-review-sidebar__empty {
    color: var(--color-text-medium);
    font-size: 12px;
    line-height: 1.5;
  }

  .deferral-review-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .deferral-review-stat {
    padding: 12px;
    border: 1px solid rgba(214, 189, 152, 0.16);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(245, 240, 231, 0.58) 0%, #fff 100%);
  }

  .deferral-review-stat__label {
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .deferral-review-stat__value {
    margin-top: 8px;
    color: var(--color-text-dark);
    font-size: 22px;
    font-weight: 700;
  }

  .deferral-review-table-shell {
    margin-bottom: 18px;
  }

  .deferral-review-table-shell .ant-table {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .deferral-review-table-shell .ant-table-thead > tr > th {
    background: var(--color-bg, #f5f7f4) !important;
    color: #64748b !important;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
  }

  .deferral-review-table-shell .ant-table-tbody > tr > td {
    color: #334155;
    font-size: 12px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.14) !important;
    vertical-align: top;
  }
 
  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: #7e6496 !important; padding-bottom: 4px; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  .deferral-review-summary .ant-descriptions-view {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .deferral-review-summary .ant-descriptions-row > th,
  .deferral-review-summary .ant-descriptions-row > td {
    border-bottom: 1px solid rgba(214, 189, 152, 0.14);
  }

  .deferral-review-summary .ant-descriptions-row:last-child > th,
  .deferral-review-summary .ant-descriptions-row:last-child > td {
    border-bottom: none;
  }

  .deferral-review-summary .ant-descriptions-item-label {
    background: var(--color-bg, #f5f7f4);
    min-width: 140px;
    padding: 12px 14px !important;
  }

  .deferral-review-summary .ant-descriptions-item-content {
    padding: 12px 14px !important;
    background: #fff;
  }

  .deferral-review-text-block {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    padding: 14px 16px;
    color: #475569;
    font-size: 13px;
    line-height: 1.6;
    background: #fff;
    white-space: pre-wrap;
  }

  .deferral-review-actionset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  .deferral-review-actionset .ant-btn {
    min-width: 0;
    height: 27px;
    padding: 0 8px;
    border-radius: 7px;
    font-size: 12px;
  }

  .deferral-review-actionset .ant-btn > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .deferral-review-status-pill {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
  }

  /* Action Buttons */
  .deferral-action-btn {
    background-color: ${PRIMARY_BLUE} !important;
    color: white !important;
    border-color: ${PRIMARY_BLUE} !important;
  }
 
  .deferral-action-btn:hover {
    background-color: #0d3652 !important;
    color: white !important;
    border-color: #0d3652 !important;
  }
 
  .deferral-action-btn:focus {
    background-color: ${PRIMARY_BLUE} !important;
    color: white !important;
    border-color: ${PRIMARY_BLUE} !important;
  }

  @media (min-width: 768px) and (max-width: 1099px) {
    .deferral-modal-overlay {
      left: var(--sidebar-width, 40px);
      transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
    }
  }
 
  @media (max-width: 767px) {
    .deferral-modal-overlay {
      left: 0;
      padding-left: 0;
      padding-right: 16px;
    }
    .deferral-modal-container {
      width: calc(100vw - 32px) !important;
      max-width: calc(100vw - 32px) !important;
      margin: 0 !important;
    }

    .deferral-review-topbar,
    .deferral-review-topbar__main,
    .deferral-review-actionbar,
    .deferral-review-actionbar__group,
    .deferral-review-actionbar__group--end {
      flex-direction: column;
      align-items: stretch;
    }

    .deferral-review-topbar__docs.ant-btn,
    .deferral-review-topbar__back.ant-btn,
    .deferral-review-actionbar .ant-btn,
    .deferral-review-sidebar__post.ant-btn {
      width: 100%;
    }
  }
`;

const DeferralDetailsModal = ({
  deferral,
  open,
  onClose,
  onAction,
  headerTag,
  overrideDaysSought,
  overrideNextDueDate,
  readOnly = false,
  overrideApprovals,
  activeTab = "pending",
  embedded = false,
}) => {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitModalVisible, setResubmitModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [editingApprovers, setEditingApprovers] = useState(false);
  const [editedApprovers, setEditedApprovers] = useState([]);
  const [confirmingApprovers, setConfirmingApprovers] = useState(false);
  const [approversFromDb, setApproversFromDb] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [remindBlockExpiry, setRemindBlockExpiry] = useState(null);
  const [canShowRemindButton, setCanShowRemindButton] = useState(true);
  const [approvalFlowExpanded, setApprovalFlowExpanded] = useState(true);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeRequestModalOpen, setCloseRequestModalOpen] = useState(false);
  const [applyExtensionModalOpen, setApplyExtensionModalOpen] = useState(false);
  const [extensionDays, setExtensionDays] = useState("");
  const [extensionDaysByDoc, setExtensionDaysByDoc] = useState({});
  const [extensionComment, setExtensionComment] = useState("");
  const [extensionFiles, setExtensionFiles] = useState([]);
  const [extensionSubmitting, setExtensionSubmitting] = useState(false);
  const [extensionSubmissionSuccess, setExtensionSubmissionSuccess] = useState(false);
  const [fullDeferral, setFullDeferral] = useState(deferral);
  const [loadingFullDeferral, setLoadingFullDeferral] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState("details");

  // Fetch full deferral details when modal opens to ensure documents are loaded
  useEffect(() => {
    if (!open || !deferral?._id) {
      setFullDeferral(deferral);
      return;
    }

    const fetchFullDeferral = async () => {
      setLoadingFullDeferral(true);
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        const token = stored?.token;
       
        if (token && deferral._id) {
          const fullData = await deferralApi.getDeferralById(deferral._id, token);
          if (fullData) {
            setFullDeferral(fullData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch full deferral details:", err);
        // Fall back to the partial deferral data
        setFullDeferral(deferral);
      } finally {
        setLoadingFullDeferral(false);
      }
    };

    fetchFullDeferral();
  }, [open, deferral?._id]);

  // Initialize remind block status from localStorage
  useEffect(() => {
    if (!open || !deferral?._id) return;

    const deferralId = deferral._id || deferral.id;
    const key = `remind_block_${deferralId}`;
    const storedExpiry = localStorage.getItem(key);

    if (storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      setRemindBlockExpiry(expiry);
      setCanShowRemindButton(Date.now() >= expiry);
    } else {
      setCanShowRemindButton(true);
    }
  }, [deferral?._id, deferral?.id, open]);

  // Check periodically if remind button should reappear
  useEffect(() => {
    if (!remindBlockExpiry) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= remindBlockExpiry) {
        setCanShowRemindButton(true);
        clearInterval(interval);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [remindBlockExpiry]);

  useEffect(() => {
    if (open && deferral) {
      setWorkspaceTab("details");
    }
  }, [open, deferral?._id]);

  const handleRemindApprover = async () => {
    if (!deferral || !deferral._id) {
      return;
    }

    setSendingReminder(true);
    try {
      if (onAction) {
        onAction({ action: "remindApprover", deferral });
      }

      // Post a comment about the reminder
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
     
      // Find the current approver's name
      const currentApprover = deferral.approverFlow?.find((a) => {
        const previousComplete = deferral.approverFlow
          .slice(0, deferral.approverFlow.indexOf(a))
          .every((x) => x.approved || x.approvalStatus === "approved");
        const isCurrent = !(a.approved || a.approvalStatus === "approved") && previousComplete;
        return isCurrent;
      });

      const reminderComment = `Reminder sent to ${currentApprover?.name || currentApprover?.approverName || "approver"}`;

      const commentData = {
        text: reminderComment,
        author: {
          name: currentUser.name || currentUser.user?.name || "System",
          role: currentUser.role || currentUser.user?.role || "system",
        },
        createdAt: new Date().toISOString(),
        isSystemComment: true,
      };

      try {
        await deferralApi.postComment(deferral._id, commentData);
      } catch (err) {
        console.error("Failed to post reminder comment:", err);
        // Don't block the reminder from being sent if comment fails
      }

      // Block remind button for 1 hour
      const deferralId = deferral._id || deferral.id;
      const expiryTime = Date.now() + 60 * 60 * 1000;
      const key = `remind_block_${deferralId}`;
      localStorage.setItem(key, String(expiryTime));
      setRemindBlockExpiry(expiryTime);
      setCanShowRemindButton(false);

      // Collapse the approval flow section
      setApprovalFlowExpanded(false);

      message.success("Reminder sent successfully");
    } catch (err) {
      console.error("Error sending reminder", err);
    } finally {
      setSendingReminder(false);
    }
  };

  const handleWithdraw = async () => {
    if (!deferral || !deferral._id) {
      message.error("No deferral selected");
      return;
    }

    if (!withdrawReason.trim()) {
      message.error("Please provide a reason for withdrawal");
      return;
    }

    setWithdrawLoading(true);
    try {
      await deferralApi.withdrawDeferral(deferral._id, { reason: withdrawReason });
      message.success("Deferral withdrawn successfully");
      if (onAction) onAction({ action: "refreshQueue" });
      setWithdrawReason("");
      setWithdrawModalVisible(false);
      onClose();
    } catch (error) {
      console.error("Failed to withdraw deferral:", error);
      message.error(error.message || "Failed to withdraw deferral");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleResubmitDeferral = () => {
    if (!deferral || !deferral._id) {
      message.error("No deferral selected");
      return;
    }
    setResubmitModalVisible(true);
  };

  const handleReworkUpdate = async (updatedData) => {
    try {
      setResubmitLoading(true);
      if (updatedData && (updatedData._id || updatedData.id)) {
        setFullDeferral((prev) => ({ ...(prev || {}), ...updatedData }));
      }
      message.success("Deferral resubmitted successfully");
      setResubmitModalVisible(false);

      if (updatedData && (updatedData._id || updatedData.id)) {
        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedData }),
          );
        } catch (eventError) {
          console.debug("Failed to dispatch deferral:updated", eventError);
        }
      }
     
      // Trigger refresh of parent data to sync across all DeferralDetailsModal instances
      if (onAction) {
        onAction({
          action: "refreshDeferrals",
          deferralId: deferral._id,
          updatedDeferral: updatedData,
        });
      }
    } catch (error) {
      console.error("Failed to update deferral:", error);
      message.error(error.message || "Failed to resubmit deferral");
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleSubmitCloseRequest = async ({ comment, documents }) => {
    if (!deferral || !deferral._id) {
      message.error("No deferral selected");
      return;
    }

    setCloseLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const token = currentUser?.token || localStorage.getItem("token");
      const closeRequestDocuments = [];

      for (const document of documents || []) {
        const uploadedFiles = [];

        for (const file of document.files || []) {
          const uploadResponse = await deferralApi.uploadDocument(
            deferral._id,
            file,
            {
              isAdditional: true,
              documentName: document.documentName,
            },
            token,
          );

          const uploadedDocument = uploadResponse?.document || {};
          uploadedFiles.push({
            documentId: uploadedDocument.id || uploadedDocument._id || "",
            fileName: uploadedDocument.name || file.name || "Supporting document",
            url: uploadedDocument.url || uploadedDocument.fileUrl || "",
            uploadedAt:
              uploadedDocument.uploadedAt ||
              uploadedDocument.createdAt ||
              new Date().toISOString(),
          });
        }

        closeRequestDocuments.push({
          documentName: document.documentName,
          comment: document.comment,
          files: uploadedFiles,
        });
      }

      const response = await deferralApi.closeDeferral(
        deferral._id,
        {
          comment: comment || "Close request submitted by Relationship Manager",
          closeRequestDocuments,
          documentComments: closeRequestDocuments
            .filter((document) => String(document.comment || "").trim())
            .map((document) => ({
              documentName: document.documentName,
              comment: document.comment,
            })),
        },
        token,
      );

      if (response && (response.success || response.status === 200)) {
        const refreshedDeferral = await deferralApi
          .getDeferralById(deferral._id, token)
          .catch(() => response?.deferral || response);

        message.success("Close request submitted successfully!");
        setCloseRequestModalOpen(false);

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: refreshedDeferral?.deferral || refreshedDeferral,
            }),
          );
        } catch (eventError) {
          console.debug("Failed to dispatch close request update", eventError);
        }

        if (onAction) {
          onAction({
            action: "refreshDeferrals",
            deferralId: deferral._id,
            updatedDeferral: refreshedDeferral?.deferral || refreshedDeferral,
          });
        }
        onClose();
      } else {
        throw new Error(response?.message || "Failed to submit close request");
      }
    } catch (error) {
      console.error("Error submitting close request:", error);
      message.error(error.message || "Failed to submit close request");
    } finally {
      setCloseLoading(false);
    }
  };

  const handleApplyExtension = async () => {
    if (!deferral || !deferral._id) {
      message.error("No deferral selected");
      return;
    }

    if (!extensionDaysByDoc || Object.keys(extensionDaysByDoc).length === 0) {
      message.error("Please specify extension days for at least one document");
      return;
    }

    const requestedDaysByDoc = requestedDocs.reduce((accumulator, doc) => {
      const key = String((doc && (doc.name || doc.label)) || doc || "")
        .trim()
        .toLowerCase();
      const currentRequestedDays = Number(
        doc?.daysSought ?? doc?.requestedDaysSought ?? 0,
      );

      accumulator[key] = Number.isFinite(currentRequestedDays)
        ? currentRequestedDays
        : 0;
      return accumulator;
    }, {});
    const requestedAbsoluteDays = Object.entries(extensionDaysByDoc).reduce(
      (absoluteDays, [key, extensionDays]) => {
        const normalizedExtensionDays = Number(extensionDays);
        if (!Number.isFinite(normalizedExtensionDays) || normalizedExtensionDays <= 0) {
          return absoluteDays;
        }

        const currentRequestedDays = requestedDaysByDoc[key] || 0;
        absoluteDays[key] = currentRequestedDays + normalizedExtensionDays;
        return absoluteDays;
      },
      {},
    );
    const requestedAbsoluteValues = Object.values(requestedAbsoluteDays);

    if (requestedAbsoluteValues.length === 0) {
      message.error("Please enter valid extension days");
      return;
    }

    setExtensionSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      // Format additional files properly - ensure they have name and url properties
      const formattedFiles = (extensionFiles || []).map((file) => ({
        name: file.name || file.fileName || "document",
        url: file.url || file.fileUrl || file.response?.url || "",
        size: file.size || 0,
        uploadedAt: new Date().toISOString(),
      })).filter((file) => file.url); // Only include files with URLs

      const maxDays = Math.max(...requestedAbsoluteValues);
     
      console.log("🚀 Extension submission details:", {
        deferralId: deferral._id,
        deferralStatus: deferral.status,
        maxRequestedDays: maxDays,
        extensionDaysByDocCount: Object.keys(extensionDaysByDoc).length,
        filesCount: formattedFiles.length,
      });

      const payload = {
        deferralId: deferral._id,
        requestedDaysSought: maxDays,
        extensionReason: extensionComment || "Extension requested",
        extensionDaysByDoc,
        additionalFiles: formattedFiles,
      };

      const response = await deferralApi.submitExtension(deferral._id, payload, token);

      if (response && (response.success || response.status === 201 || response.id)) {
        message.success("Extension submitted successfully!");
        const createdExtension = response.extension || response;
        const existingExtensions = Array.isArray((fullDeferral || deferral)?.extensions)
          ? (fullDeferral || deferral).extensions
          : [];
        const updatedDeferral = {
          ...(fullDeferral || deferral),
          extensionStatus: createdExtension.status || createdExtension.Status || "PendingApproval",
          extensions: [...existingExtensions, createdExtension],
        };

        setFullDeferral(updatedDeferral);
        setExtensionDays("");
        setExtensionDaysByDoc({});
        setExtensionComment("");
        setExtensionFiles([]);
        setApplyExtensionModalOpen(false);
        setExtensionSubmissionSuccess(false);

        // Trigger refresh
        if (onAction) {
          onAction({
            action: "extensionSubmitted",
            deferralId: deferral._id,
            extension: createdExtension,
            updatedDeferral,
          });
        }
      } else {
        throw new Error(response?.message || "Failed to submit extension");
      }
    } catch (error) {
      console.error("Error submitting extension:", error);
      const errorMessage = error.message || "Failed to submit extension";
     
      // Provide more specific error messages
      if (errorMessage.includes("approved")) {
        message.error("Extension can only be applied to approved deferrals");
      } else if (errorMessage.includes("greater than")) {
        message.error("Requested extension days must be more than current days");
      } else {
        message.error(errorMessage);
      }
    } finally {
      setExtensionSubmitting(false);
    }
  };

  const handleApplyExtensionClick = () => {
    setExtensionDays("");
    setExtensionDaysByDoc({});
    setExtensionComment("");
    setExtensionFiles([]);
    setExtensionSubmissionSuccess(false);
    setApplyExtensionModalOpen(true);
  };

  const downloadDeferralAsPDF = async () => {
    if (!deferral || !deferral._id) {
      message.error("No deferral selected");
      return;
    }

    setDownloadLoading(true);
    try {
      await downloadDeferralPdf(deferral, {
        requestedDocsWithDates,
        history,
        closeRequestDocuments,
      });
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Failed to generate PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleEditApproversClick = async () => {
    setEditedApprovers(deferral.approverFlow ? [...deferral.approverFlow] : []);
    setEditingApprovers(true);

    // Fetch approvers from database using deferralApi
    setLoadingApprovers(true);
    try {
      const token = localStorage.getItem("token");
      const users = await deferralApi.getApprovers(token);
      setApproversFromDb(users || []);
    } catch (error) {
      console.error("Error loading approvers:", error);
      message.error("Failed to load approvers from database");
      setApproversFromDb([]);
    } finally {
      setLoadingApprovers(false);
    }
  };

  const handleAddApprover = (afterIndex) => {
    if (
      typeof afterIndex === "number" &&
      editedApprovers[afterIndex + 1] &&
      (editedApprovers[afterIndex + 1].approved ||
        editedApprovers[afterIndex + 1].approvalStatus === "approved")
    ) {
      message.error("You cannot insert a new approver before an approver who has already approved");
      return;
    }

    const newApprover = {
      _id: `temp-${Date.now()}`,
      role: "",
      name: "",
      approved: false,
      approvalStatus: "pending",
    };

    if (afterIndex === undefined || afterIndex === -1) {
      // Add at the end
      setEditedApprovers([...editedApprovers, newApprover]);
    } else {
      // Add after specific index
      const updated = [...editedApprovers];
      updated.splice(afterIndex + 1, 0, newApprover);
      setEditedApprovers(updated);
    }
  };

  const handleRemoveApprover = (idx) => {
    if (editedApprovers[idx]?.approved || editedApprovers[idx]?.approvalStatus === "approved") {
      message.error("Approved approvers cannot be removed");
      return;
    }

    if (editedApprovers.length <= 1) {
      message.error("At least one approver is required");
      return;
    }
    const updated = editedApprovers.filter((_, i) => i !== idx);
    setEditedApprovers(updated);
  };

  const handleApproverChange = (idx, field, value) => {
    if (editedApprovers[idx]?.approved || editedApprovers[idx]?.approvalStatus === "approved") {
      return;
    }

    setEditedApprovers((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleApproverSelection = (idx, option) => {
    if (!option || editedApprovers[idx]?.approved || editedApprovers[idx]?.approvalStatus === "approved") return;

    setEditedApprovers((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        userId: option.value,
        name: typeof option.label === "string"
          ? option.label
          : updated[idx]?.name || "",
      };
      return updated;
    });
  };

  const handleConfirmApprovers = async () => {
    console.log("=== handleConfirmApprovers CLICKED ===");
    console.log("editedApprovers:", editedApprovers);

    // Validate that all approvers have role and name
    const allValid = editedApprovers.every((a) => a.role && a.name);
    console.log("All valid?", allValid);

    if (!allValid) {
      message.error("Please fill in all approver details");
      return;
    }

    setConfirmingApprovers(true);

    try {
      // Prepare approvers data for API
      const approversToSave = editedApprovers.map((a) => ({
        userId: a.userId, // Include the user ID that was captured from the dropdown
        role: a.role,
        name: a.name,
        approved: false,
        approvalStatus: "pending",
      }));

      console.log("[EditApprovers] Saving approvers:", approversToSave);
      console.log("[EditApprovers] Deferral ID:", deferral?._id);

      // Get token from localStorage
      const token = localStorage.getItem("token");
      console.log("[EditApprovers] Token available:", !!token);

      if (!deferral || !deferral._id) {
        message.error("No deferral selected");
        return;
      }

      // Call API to update deferral approvers
      const result = await deferralApi.updateApprovers(
        deferral._id,
        approversToSave,
        token,
      );
      console.log("[EditApprovers] API Response:", result);

      const updatedDeferral = result?.deferral || result;

      message.success("Approvers updated successfully");

      if (updatedDeferral && (updatedDeferral._id || updatedDeferral.id)) {
        setFullDeferral(updatedDeferral);
        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
        } catch (eventError) {
          console.debug("Failed to dispatch deferral:updated", eventError);
        }
      }

      // Update local state to reflect new approvers
      if (onAction) {
        onAction({ action: "refreshDeferrals", updatedDeferral });
      }

      setEditingApprovers(false);
    } catch (error) {
      console.error("[EditApprovers] Error:", error);
      message.error(error.message || "Failed to update approvers");
    } finally {
      setConfirmingApprovers(false);
    }
  };

  if (!open || !deferral) return null;

  const displayDeferral = fullDeferral || deferral;
  const rejectedApprover = Array.isArray(displayDeferral?.approverFlow)
    ? displayDeferral.approverFlow.find(
        (approver) => approver?.rejected || approver?.approvalStatus === "rejected",
      )
    : null;
  const returnedApprover = Array.isArray(displayDeferral?.approverFlow)
    ? displayDeferral.approverFlow.find(
        (approver) => approver?.returned || approver?.approvalStatus === "returned",
      )
    : null;
  const normalizedStatus = String(displayDeferral?.status || "").toLowerCase();
  const isReturnedForReworkDeferral = Boolean(
    normalizedStatus === "returned_for_rework" ||
      normalizedStatus === "returned_by_creator" ||
      normalizedStatus === "returned_by_checker" ||
      String(displayDeferral?.deferralApprovalStatus || "").toLowerCase() ===
        "returned",
  );
  const isRejectedDeferral = Boolean(
    normalizedStatus === "rejected" ||
      normalizedStatus === "deferral_rejected" ||
      String(displayDeferral?.deferralApprovalStatus || "").toLowerCase() ===
        "rejected",
  );
  const isWithdrawnDeferral = Boolean(
    displayDeferral?.closedByName ||
      displayDeferral?.ClosedByName ||
      displayDeferral?.closedBy ||
      displayDeferral?.closedByUser,
  );
  const rejectionActor =
    displayDeferral?.rejectedByName ||
    rejectedApprover?.name ||
    rejectedApprover?.approverName ||
    rejectedApprover?.user?.name ||
    displayDeferral?.rejectedBy?.name ||
    displayDeferral?.rejectedBy ||
    "the approver";
  const rejectionReasonRaw =
    displayDeferral?.rejectionReason ||
    displayDeferral?.rejectedReason ||
    displayDeferral?.reason ||
    "";
  const rejectionReasonText =
    rejectionReasonRaw ||
    "No rejection reason was captured.";
  const returnedForReworkActor =
    displayDeferral?.returnedByName ||
    returnedApprover?.name ||
    returnedApprover?.approverName ||
    returnedApprover?.user?.name ||
    (String(displayDeferral?.returnedByRole || "").toLowerCase() === "creator"
      ? "the creator"
      : String(displayDeferral?.returnedByRole || "").toLowerCase() === "checker"
        ? "the checker"
        : "the approver");
  const returnedForReworkReasonText =
    getReturnedForReworkReason(displayDeferral) ||
    "No rework reason was captured.";
  const withdrawalActor =
    displayDeferral?.closedByName ||
    displayDeferral?.ClosedByName ||
    displayDeferral?.closedByUser?.name ||
    displayDeferral?.closedByUser ||
    "the RM";
  const withdrawalReasonRaw =
    displayDeferral?.withdrawalReason ||
    displayDeferral?.closedReason ||
    displayDeferral?.ClosedReason ||
    displayDeferral?.reason ||
    "";
  const withdrawalReasonText =
    withdrawalReasonRaw ||
    "No withdrawal reason was captured.";
  const isApprovedTabContext = activeTab === "approved";
  const isCloseRequestContext = activeTab === "closeRequests";
  const isExtensionTabContext = activeTab === "extensions";
  const extensionRecords = Array.isArray(displayDeferral?.extensions)
    ? displayDeferral.extensions
    : [];
  const currentExtension =
    [...extensionRecords]
      .reverse()
      .find((extension) => {
        const status = String(extension?.status || extension?.Status || "")
          .trim()
          .toLowerCase();
        return status && !["approved", "rejected", "withdrawn"].includes(status);
      }) || extensionRecords[extensionRecords.length - 1] || null;
  const hasOpenExtensionRequest =
    (!["approved", "rejected", "withdrawn", ""].includes(
      String(displayDeferral?.extensionStatus || "").trim().toLowerCase(),
    )) ||
    extensionRecords.some((extension) => {
      const status = String(extension?.status || extension?.Status || "")
        .trim()
        .toLowerCase();
      return status && !["approved", "rejected", "withdrawn"].includes(status);
    });
  const normalizedExtensionStatus = String(
    currentExtension?.status || currentExtension?.Status || "",
  )
    .trim()
    .toLowerCase();
  const extensionApprovalFlow = Array.isArray(currentExtension?.approvers)
    ? currentExtension.approvers
    : [];
  const extensionApprovedApproversCount = extensionApprovalFlow.filter(
    isApprovalMarkedApproved,
  ).length;
  const normalizedExtensionCreatorApprovalStatus = String(
    currentExtension?.creatorApprovalStatus || "",
  )
    .trim()
    .toLowerCase();
  const normalizedExtensionCheckerApprovalStatus = String(
    currentExtension?.checkerApprovalStatus || "",
  )
    .trim()
    .toLowerCase();
  const deferralStatusLabel = isWithdrawnDeferral
    ? "Withdrawn"
    : isRejectedDeferral
      ? "Rejected"
      : isExtensionTabContext
        ? normalizedExtensionStatus === "approved"
          ? "Approved"
          : normalizedExtensionStatus === "rejected"
            ? "Rejected"
            : normalizedExtensionStatus === "withdrawn"
              ? "Withdrawn"
              : "Pending"
      : isApprovedTabContext
        ? "Approved"
      : displayDeferral?.status
        ? String(displayDeferral.status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Pending";
  const deferralStatusColor = isWithdrawnDeferral || isRejectedDeferral
    ? ERROR_RED
    : isExtensionTabContext
      ? normalizedExtensionStatus === "approved"
        ? SUCCESS_GREEN
        : normalizedExtensionStatus === "rejected" || normalizedExtensionStatus === "withdrawn"
          ? ERROR_RED
          : PRIMARY_BLUE
    : isApprovedTabContext
      ? SUCCESS_GREEN
    : normalizedStatus === "approved" || normalizedStatus === "deferral_approved"
      ? SUCCESS_GREEN
      : PRIMARY_BLUE;
  const approvalFlow = isExtensionTabContext
    ? extensionApprovalFlow
    : Array.isArray(displayDeferral?.approverFlow)
      ? displayDeferral.approverFlow
      : Array.isArray(displayDeferral?.approvers)
        ? displayDeferral.approvers
        : [];
  const { dclDocs, uploadedDocs, requestedDocs } = getDeferralDocumentBuckets(displayDeferral);
  const closeRequestDocuments = getCloseRequestDocumentGroups(displayDeferral);
  const generalUploadedDocs = uploadedDocs.filter((doc) => !doc.isCloseRequestEvidence);
  const approvedApproversCount = approvalFlow.filter(
    isApprovalMarkedApproved,
  ).length;
  const allApproversApproved = isApprovedTabContext || (approvalFlow.length > 0
    ? approvedApproversCount === approvalFlow.length
    : false);
  const currentApprover = approvalFlow.find((approver, index) => {
    const isApproved = isApprovalMarkedApproved(approver);
    const previousApprovalsComplete = approvalFlow
      .slice(0, index)
      .every(isApprovalMarkedApproved);

    return !isApproved && previousApprovalsComplete;
  });
  const currentApproverLabel = resolveDisplayName(
    currentApprover?.designation,
    currentApprover?.role,
    currentApprover?.user?.name,
    currentApprover?.name,
    currentApprover?.approverName,
  );
  const normalizedCreatorApprovalStatus = String(
    displayDeferral?.creatorApprovalStatus || displayDeferral?.creatorStatus || "",
  )
    .trim()
    .toLowerCase();
  const normalizedCheckerApprovalStatus = String(
    displayDeferral?.checkerApprovalStatus || displayDeferral?.checkerStatus || "",
  )
    .trim()
    .toLowerCase();
  const creatorApproved =
    isExtensionTabContext
      ? normalizedExtensionCreatorApprovalStatus === "approved"
      : isApprovedTabContext || normalizedCreatorApprovalStatus === "approved";
  const checkerApproved =
    isExtensionTabContext
      ? normalizedExtensionCheckerApprovalStatus === "approved"
      : isApprovedTabContext || normalizedCheckerApprovalStatus === "approved";
  const pendingFinalApproversLabel = creatorApproved && !checkerApproved
    ? "checker"
    : !creatorApproved && checkerApproved
      ? "creator"
      : "creator and checker";

  const requestedDocsWithDates = requestedDocs.map((doc) => {
    const extensionDocumentData = isExtensionTabContext && currentExtension
      ? resolveDocumentDaysAndDateWithExtension(doc, displayDeferral, currentExtension)
      : null;
    const requestedDays =
      extensionDocumentData?.days ?? doc.requestedDays ?? doc.daysSought ?? 0;
    const newDueDate =
      extensionDocumentData?.nextDate ??
      doc.newDueDate ??
      doc.nextDocumentDueDate ??
      doc.nextDueDate ??
      null;

    return {
      ...doc,
      requestedDays,
      newDueDate,
    };
  });
  const documentCount =
    requestedDocsWithDates.length +
    dclDocs.length +
    generalUploadedDocs.length +
    closeRequestDocuments.length;

  const history = (function renderHistory() {
    const events = [];
    const hasMatchingHistoryEntry = (needle) =>
      events.some((event) =>
        String(event.comment || "")
          .toLowerCase()
          .includes(String(needle || "").toLowerCase()),
      );
    const findActionHistoryEntry = (keyword) =>
      events.find((event) =>
        String(event.comment || "")
          .toLowerCase()
          .includes(keyword),
      );

    if (displayDeferral.comments && Array.isArray(displayDeferral.comments)) {
      displayDeferral.comments.forEach((c) => {
        const commentAuthorName =
          c.author?.name || c.authorName || c.userName || "User";
        const commentAuthorRole = c.author?.role || c.authorRole || "User";
        events.push({
          user: commentAuthorName,
          userRole: commentAuthorRole,
          date: c.createdAt,
          comment: c.text || "",
        });
      });
    }

    if (deferral.history && Array.isArray(deferral.history)) {
      deferral.history.forEach((h) => {
        if (h.action === "moved") return;
        const userName = h.userName || h.user?.name || h.user || "System";
        const userRole = h.userRole || h.user?.role || "System";
        events.push({
          user: userName,
          userRole: userRole,
          date: h.date || h.createdAt || h.timestamp,
          comment: h.comment || h.notes || "",
        });
      });
    }

    const existingRejectionEntry = findActionHistoryEntry("reject");
    if (
      existingRejectionEntry &&
      rejectionReasonRaw &&
      !String(existingRejectionEntry.comment || "")
        .toLowerCase()
        .includes(rejectionReasonRaw.toLowerCase())
    ) {
      existingRejectionEntry.comment = `${existingRejectionEntry.comment}. Reason: ${rejectionReasonRaw}`;
    } else if (rejectionReasonRaw && !hasMatchingHistoryEntry(rejectionReasonRaw)) {
      events.push({
        user: rejectionActor,
        userRole: rejectedApprover?.role || rejectedApprover?.designation || "Approver",
        date:
          rejectedApprover?.rejectedAt ||
          displayDeferral?.updatedAt ||
          displayDeferral?.createdAt,
        comment: `Rejected deferral. Reason: ${rejectionReasonRaw}`,
      });
    }

    const existingWithdrawalEntry = findActionHistoryEntry("withdraw");
    if (
      existingWithdrawalEntry &&
      withdrawalReasonRaw &&
      !String(existingWithdrawalEntry.comment || "")
        .toLowerCase()
        .includes(withdrawalReasonRaw.toLowerCase())
    ) {
      existingWithdrawalEntry.comment = `${existingWithdrawalEntry.comment}. Reason: ${withdrawalReasonRaw}`;
    } else if (withdrawalReasonRaw && !hasMatchingHistoryEntry(withdrawalReasonRaw)) {
      events.push({
        user: withdrawalActor,
        userRole: "RM",
        date:
          displayDeferral?.closedAt ||
          displayDeferral?.updatedAt ||
          displayDeferral?.createdAt,
        comment: `Withdrew deferral. Reason: ${withdrawalReasonRaw}`,
      });
    }

    return dedupeHistoryEntries(events);
  })();

  const requestedDocsColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
          {value || "-"}
        </span>
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
          <div style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
            {doc.name || "Uploaded Document"}
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {doc.uploadDate
              ? `Uploaded ${dayjs(doc.uploadDate).format("DD MMM YYYY")}`
              : "Upload date not set"}
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, doc) => (
        <div className="deferral-review-actionset">
          <Button
            type="default"
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
      render: (_, approver) =>
        approver.user?.name || approver.name || approver.approverName || "User",
    },
    {
      title: "Status",
      key: "status",
      render: (_, approver, index) => {
        const isApprovedInDeferral = isApprovalMarkedApproved(approver);
        const effectivelyApproved = isApprovedInDeferral;
        const previousApprovalsComplete = approvalFlow
          .slice(0, index)
          .every(isApprovalMarkedApproved);
        const isCurrent = !effectivelyApproved && previousApprovalsComplete;

        return (
          <span
            className="deferral-review-status-pill"
            style={{ color: effectivelyApproved ? SUCCESS_GREEN : isCurrent ? PRIMARY_BLUE : "#64748b" }}
          >
            {effectivelyApproved ? "Approved" : isCurrent ? "Current" : "Pending Approval"}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, approver, index) => {
        const isApprovedInDeferral = isApprovalMarkedApproved(approver);
        const previousApprovalsComplete = approvalFlow
          .slice(0, index)
          .every(isApprovalMarkedApproved);
        const isCurrent = !isApprovedInDeferral && previousApprovalsComplete;

        if (activeTab === "closed" || !isCurrent || !canShowRemindButton) {
          return <span style={{ color: "#94a3b8" }}>-</span>;
        }

        return (
          <Popconfirm
            title="Send Reminder"
            description={`Send a reminder email to ${approver?.name || approver?.approverName || "this approver"}?`}
            onConfirm={handleRemindApprover}
            okText="Send"
            cancelText="Cancel"
            okButtonProps={{ loading: sendingReminder }}
          >
            <Button
              type="default"
              size="small"
              loading={sendingReminder}
              disabled={!canShowRemindButton}
            >
              Remind
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  const closeRequestUploadColumns = [
    {
      title: "File",
      key: "name",
      render: (_, upload) => (
        <div>
          <div style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
            {upload.name || "Evidence Document"}
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {upload.uploadDate
              ? `Uploaded ${dayjs(upload.uploadDate).format("DD MMM YYYY")}`
              : "Upload date not set"}
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, upload) => (
        <div className="deferral-review-actionset">
          <Button
            size="small"
            onClick={() => openFileInNewTab(upload.fileUrl || upload.url)}
          >
            View
          </Button>
          <Button
            size="small"
            onClick={() => downloadFile(upload.fileUrl || upload.url, upload.name)}
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
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
          {value || "-"}
        </span>
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
        const creatorState = String(document.creatorStatus || "pending").toLowerCase();
        const creatorLabel =
          creatorState === "approved"
            ? "Approved"
            : creatorState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{ color: creatorState === "approved" ? SUCCESS_GREEN : creatorState === "rejected" ? ERROR_RED : PRIMARY_BLUE }}
            >
              {creatorLabel}
            </div>
            {document.creatorComment ? (
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                {document.creatorComment}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Checker Review",
      key: "checkerReview",
      render: (_, document) => {
        const checkerState = String(document.checkerStatus || "pending").toLowerCase();
        const checkerLabel =
          checkerState === "approved"
            ? "Approved"
            : checkerState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{ color: checkerState === "approved" ? SUCCESS_GREEN : checkerState === "rejected" ? ERROR_RED : PRIMARY_BLUE }}
            >
              {checkerLabel}
            </div>
            {document.checkerComment ? (
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                {document.checkerComment}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Evidence",
      key: "evidenceCount",
      width: 110,
      render: (_, document) => document.uploads?.length || 0,
    },
  ];

  if (!deferral || !open) {
    return null;
  }

  const wrapperClassName = embedded
    ? "deferral-modal-embedded"
    : "deferral-modal-overlay";
  const wrapperStyle = embedded ? undefined : { display: "flex" };
  const wrapperClickHandler = embedded ? undefined : onClose;
  const containerClassName = embedded
    ? "deferral-modal-container deferral-modal-container--embedded deferral-review-container"
    : "deferral-modal-container deferral-review-container";

  return (
    <>
      <style>{MODAL_STYLES}</style>

      <div
        className={wrapperClassName}
        style={wrapperStyle}
        onClick={wrapperClickHandler}
      >
        <div
          className={containerClassName}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="deferral-review-panel">
            <RMDeferralReviewHeader
              deferral={displayDeferral}
              headerTag={headerTag}
              documentCount={documentCount}
              onClose={onClose}
              onViewDocuments={() => setWorkspaceTab("documents")}
            />

            <RMDeferralReviewActionBar
              activeTab={activeTab}
              readOnly={readOnly}
              confirmingApprovers={confirmingApprovers}
              onEditApprovers={handleEditApproversClick}
              withdrawLoading={withdrawLoading}
              onWithdraw={() => setWithdrawModalVisible(true)}
              onResubmit={handleResubmitDeferral}
              resubmitLoading={resubmitLoading}
              extensionSubmissionSuccess={extensionSubmissionSuccess}
              hasOpenExtensionRequest={hasOpenExtensionRequest}
              onApplyExtension={handleApplyExtensionClick}
              closeLoading={closeLoading}
              onOpenCloseRequest={() => setCloseRequestModalOpen(true)}
              normalizedStatus={normalizedStatus}
              onDownloadPDF={downloadDeferralAsPDF}
              downloadLoading={downloadLoading}
              onClose={onClose}
            />

            <div className="deferral-review-body" onClick={(e) => e.stopPropagation()}>
              <div className="deferral-review-tabs">
                <button
                  type="button"
                  className={`deferral-review-tab ${workspaceTab === "details" ? "deferral-review-tab--active" : ""}`}
                  onClick={() => setWorkspaceTab("details")}
                >
                  Details
                </button>
                <button
                  type="button"
                  className={`deferral-review-tab ${workspaceTab === "documents" ? "deferral-review-tab--active" : ""}`}
                  onClick={() => setWorkspaceTab("documents")}
                >
                  Documents
                </button>
              </div>

              <div className="deferral-review-workspace">
                <div className="deferral-review-main">
                  {workspaceTab === "details" && (
                    <RMDeferralReviewDetails
                      primaryBlue={PRIMARY_BLUE}
                      successGreen={SUCCESS_GREEN}
                      warningOrange={WARNING_ORANGE}
                      displayDeferral={displayDeferral}
                      isWithdrawnDeferral={isWithdrawnDeferral}
                      isRejectedDeferral={isRejectedDeferral}
                      isReturnedForReworkDeferral={isReturnedForReworkDeferral}
                      isApprovedTabContext={isApprovedTabContext}
                      withdrawalActor={withdrawalActor}
                      withdrawalReasonText={withdrawalReasonText}
                      rejectionActor={rejectionActor}
                      rejectionReasonText={rejectionReasonText}
                      returnedForReworkActor={returnedForReworkActor}
                      returnedForReworkReasonText={returnedForReworkReasonText}
                      allApproversApproved={allApproversApproved}
                      currentApproverLabel={currentApproverLabel}
                      pendingFinalApproversLabel={pendingFinalApproversLabel}
                      approvedApproversCount={approvedApproversCount}
                      approvalFlow={approvalFlow}
                      creatorApproved={creatorApproved}
                      checkerApproved={checkerApproved}
                      deferralStatusColor={deferralStatusColor}
                      deferralStatusLabel={deferralStatusLabel}
                      requestedDocsWithDates={requestedDocsWithDates}
                      generalUploadedDocs={generalUploadedDocs}
                      approvalFlowExpanded={approvalFlowExpanded}
                      onToggleApprovalFlow={() => setApprovalFlowExpanded(!approvalFlowExpanded)}
                      approvalFlowColumns={approvalFlowColumns}
                    />
                  )}

                  {workspaceTab === "documents" && (
                    <RMDeferralReviewDocuments
                      primaryBlue={PRIMARY_BLUE}
                      requestedDocsWithDates={requestedDocsWithDates}
                      requestedDocsColumns={requestedDocsColumns}
                      dclDocs={dclDocs}
                      uploadedDocumentColumns={uploadedDocumentColumns}
                      isCloseRequestContext={isCloseRequestContext}
                      closeRequestDocuments={closeRequestDocuments}
                      closeRequestColumns={closeRequestColumns}
                      closeRequestUploadColumns={closeRequestUploadColumns}
                      generalUploadedDocs={generalUploadedDocs}
                    />
                  )}
                </div>

                <RMDeferralReviewSidebar history={history} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <RMWithdrawModal
        open={withdrawModalVisible}
        withdrawReason={withdrawReason}
        withdrawLoading={withdrawLoading}
        onReasonChange={setWithdrawReason}
        onCancel={() => {
          setWithdrawModalVisible(false);
          setWithdrawReason("");
        }}
        onConfirm={handleWithdraw}
      />

      <RMEditApproversModal
        open={editingApprovers}
        editedApprovers={editedApprovers}
        handleApproverChange={handleApproverChange}
        handleApproverSelection={handleApproverSelection}
        handleRemoveApprover={handleRemoveApprover}
        handleAddApprover={handleAddApprover}
        approversFromDb={approversFromDb}
        loadingApprovers={loadingApprovers}
        confirmingApprovers={confirmingApprovers}
        onCancel={() => setEditingApprovers(false)}
        onConfirm={handleConfirmApprovers}
      />

      {/* Return for Rework Modal */}
      <ReturnForReworkModal
        open={resubmitModalVisible}
        onClose={() => setResubmitModalVisible(false)}
        deferral={displayDeferral}
        onUpdate={handleReworkUpdate}
      />

      {/* Extension Application Modal */}
      <ExtensionApplicationModal
        open={applyExtensionModalOpen}
        selectedDeferral={deferral}
        extensionDays={extensionDays}
        extensionDaysByDoc={extensionDaysByDoc}
        extensionComment={extensionComment}
        extensionFiles={extensionFiles}
        extensionSubmitting={extensionSubmitting}
        extensionSubmissionSuccess={extensionSubmissionSuccess}
        onDaysChange={setExtensionDays}
        onDaysByDocChange={setExtensionDaysByDoc}
        onCommentChange={setExtensionComment}
        onFilesChange={setExtensionFiles}
        onClose={() => setApplyExtensionModalOpen(false)}
        onSubmit={handleApplyExtension}
        onSuccessViewExtensions={() => {
          setApplyExtensionModalOpen(false);
          setExtensionSubmissionSuccess(false);
          if (onAction) {
            onAction({
              action: "viewExtensionApplications",
              tab: "extensions",
            });
          }
          onClose();
        }}
      />

      <CloseRequestModal
        open={closeRequestModalOpen}
        documents={requestedDocsWithDates}
        loading={closeLoading}
        onClose={() => setCloseRequestModalOpen(false)}
        onSubmit={handleSubmitCloseRequest}
      />
    </>
  );
};

export default DeferralDetailsModal;









