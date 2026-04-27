import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Tabs,
  Divider,
  Modal,
  Card,
  Descriptions,
  Table,
  List,
  Tag,
  Button,
  Badge,
  Empty,
  Spin,
  Space,
  Tooltip,
  message,
  Typography,
  Input as AntInput,
} from "antd";

const { Text: AntText } = Typography;
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BankOutlined,
  FilePdfOutlined,
  ReloadOutlined as ReloadIcon,
  FileDoneOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  UploadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "../../../styles/creatorDesignSystem.css";

// Import modular components
import DeferralHeader from "./components/DeferralHeader";
import DeferralFilters from "./components/DeferralFilters";
import DeferralTabs from "./components/DeferralTabs";
import DeferralTable from "./components/DeferralTable";
import CommentTrail from "./components/CommentTrail";
import DeferralStatusAlert from "./components/DeferralStatusAlert";
import ExtensionTab from "./components/ExtensionTab";
import DeferralDetailsModal from "./components/DeferralDetailsModal";

// Import custom hooks
import {
  useDeferralData,
  useDeferralFiltering,
  useDeferralModal,
  useDocDecisions,
} from "./hooks";

// Import utilities and constants
import {
  PRIMARY_BLUE,
  ACCENT_LIME,
  SUCCESS_GREEN,
  ERROR_RED,
  WARNING_ORANGE,
  HIGHLIGHT_GOLD,
  LIGHT_YELLOW,
  SECONDARY_PURPLE,
  getCustomStyles,
} from "./utils/styleConstants";
import {
  getRoleTag,
  formatUsername,
  getReturnedForReworkReason,
  canApproveDeferral,
  getCurrentUser,
  formatDate,
  isFinalStatus,
} from "./utils/deferralHelpers";

// Import services and external utilities
import deferralApi from "../../../service/deferralApi.js";
import { openFileInNewTab, downloadFile } from "../../../utils/fileUtils";
import getFacilityColumns from "../../../utils/facilityColumns";
import { formatDeferralDocumentType } from "../../../utils/deferralDocumentType";
import {
  getDeferralDocumentBuckets,
  hasAnyCloseRequestDocumentState,
  hasPendingCreatorCloseRequestDocuments,
} from "../../../utils/deferralDocuments";
import { getLoanDisplay } from "../../../utils/loanUtils";
import UniformTag from "../../../components/common/UniformTag";
import RealTimeSlaTag from "../../../components/common/RealTimeSlaTag";

// Extend dayjs
dayjs.extend(relativeTime);

const { TextArea } = AntInput;

const getDeferralStatusMeta = (record) => {
  const withdrawnBy =
    record?.closedByName ||
    record?.ClosedByName ||
    record?.closedBy ||
    record?.closedByUser ||
    null;

  if (withdrawnBy) {
    return { label: "Withdrawn", tone: "negative" };
  }

  const status = String(record?.status || "").trim().toLowerCase();

  if (["approved", "deferral_approved"].includes(status)) {
    return { label: "Approved", tone: "positive" };
  }

  if (["rejected", "deferral_rejected"].includes(status)) {
    return { label: "Rejected", tone: "negative" };
  }

  if (
    ["returned_for_rework", "returned_by_creator", "returned_by_checker"].includes(status)
  ) {
    return { label: "Returned", tone: "warning" };
  }

  if (["close_requested", "close_requested_creator_approved"].includes(status)) {
    return { label: "Close Requested", tone: "neutral" };
  }

  if (["closed", "deferral_closed", "closed_by_co", "closed_by_creator"].includes(status)) {
    return { label: "Closed", tone: "muted" };
  }

  if (status === "in_review") {
    return { label: "In Review", tone: "neutral" };
  }

  return { label: "Pending", tone: "warning" };
};

const QUEUE_TERMINAL_STATUSES = new Set([
  "approved",
  "deferral_approved",
  "rejected",
  "deferral_rejected",
  "returned_for_rework",
  "returned_by_creator",
  "returned_by_checker",
  "close_requested",
  "close_requested_creator_approved",
  "closed",
  "deferral_closed",
  "closed_by_co",
  "closed_by_creator",
]);

const isApprovalMarkedApproved = (approval) => {
  if (!approval || typeof approval !== "object") return false;
  if (approval.approved === true) return true;

  const status = String(
    approval.approvalStatus || approval.status || approval.state || "",
  )
    .trim()
    .toLowerCase();

  return status === "approved";
};

const hasAllApproversApproved = (deferral) => {
  if (deferral?.allApproversApproved === true) {
    return true;
  }

  const approvalFlow = Array.isArray(deferral?.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral?.approvers)
      ? deferral.approvers
      : Array.isArray(deferral?.approvals)
        ? deferral.approvals
        : [];

  if (!approvalFlow.length) {
    return false;
  }

  return approvalFlow.every(isApprovalMarkedApproved);
};

const isCreatorQueueDeferral = (deferral) => {
  const status = String(deferral?.status || "").trim().toLowerCase();
  const creatorStatus = String(
    deferral?.creatorApprovalStatus || deferral?.creatorStatus || "",
  )
    .trim()
    .toLowerCase();
  const checkerStatus = String(
    deferral?.checkerApprovalStatus || deferral?.checkerStatus || "",
  )
    .trim()
    .toLowerCase();

  if (QUEUE_TERMINAL_STATUSES.has(status)) {
    return false;
  }

  if (creatorStatus === "approved" || checkerStatus === "approved") {
    return false;
  }

  return status === "partially_approved" || hasAllApproversApproved(deferral);
};

const deferralsPageStyles = `
  .creator-deferrals-page {
    min-height: 100%;
    background: var(--color-white);
    padding: 0;
  }

  .creator-deferrals-shell {
    width: 100%;
  }

  .creator-deferrals-shell--review {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .creator-deferrals-card {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    overflow: hidden;
  }

  .creator-deferrals-toolbar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-white);
  }

  .deferrals-header,
  .deferrals-filters {
    width: 100%;
  }

  .deferrals-header__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .deferrals-header__copy {
    min-width: 0;
  }

  .deferrals-header__title {
    margin: 0;
    color: var(--color-text-dark);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .deferrals-header__meta {
    margin: 4px 0 0;
    color: var(--color-text-light);
    font-size: 12px;
    line-height: 1.4;
  }

  .deferrals-header__actions,
  .deferrals-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .deferrals-header__button,
  .deferrals-filter-clear {
    height: auto !important;
    min-height: 36px;
    padding: 8px 14px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
    background: var(--color-white) !important;
    box-shadow: none !important;
    color: var(--color-text-dark) !important;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }

  .deferrals-header__button--primary {
    background: var(--ncb-primary-500) !important;
    border-color: transparent !important;
    color: var(--color-white) !important;
  }

  .deferrals-filter {
    min-width: 180px;
    flex: 1 1 220px;
  }

  .deferrals-filter--search {
    max-width: 420px;
  }

  .deferrals-filter--date {
    min-width: 250px;
    flex: 1 1 280px;
    padding: 7px 11px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
    border-radius: 6px !important;
    background: var(--color-white) !important;
    box-shadow: none !important;
  }

  .deferrals-filter--date.ant-picker-focused,
  .deferrals-filter--date:hover {
    border-color: var(--color-primary-dark) !important;
  }

  .deferrals-tabs {
    padding: 0 16px;
    background: var(--color-white);
  }

  .deferrals-tabs .ant-tabs-nav {
    margin: 0 !important;
    padding-top: 10px;
  }

  .deferrals-tabs .ant-tabs-nav::before,
  .deferrals-tabs .ant-tabs-ink-bar {
    display: none !important;
  }

  .deferrals-tabs .ant-tabs-tab {
    margin: 0 8px 12px 0 !important;
    padding: 8px 12px !important;
    border: 1px solid rgba(214, 189, 152, 0.22) !important;
    border-radius: 8px !important;
    background: var(--color-white) !important;
    transition: all 0.2s ease;
  }

  .deferrals-tabs .ant-tabs-tab-active {
    background: rgba(214, 189, 152, 0.18) !important;
    border-color: rgba(214, 189, 152, 0.4) !important;
  }

  .deferrals-tabs .ant-tabs-tab-btn {
    color: var(--color-text-medium) !important;
    font-size: 12px;
    font-weight: 600;
  }

  .deferrals-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: var(--color-text-dark) !important;
  }

  .deferrals-table-shell {
    border: none;
    border-top: 1px solid rgba(214, 189, 152, 0.18);
    border-radius: 0;
    box-shadow: none;
    background: var(--color-white);
  }

  .deferrals-table__primary-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .deferrals-table__primary-value {
    color: var(--color-text-dark);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deferrals-table__secondary-value,
  .deferrals-table__muted {
    color: var(--color-text-light);
    font-size: 11px;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deferrals-table__muted {
    color: var(--color-text-medium);
    font-size: 12px;
  }

  .deferrals-table__mono {
    font-family: Consolas, 'Courier New', monospace;
    letter-spacing: 0.01em;
  }

  .deferrals-table__status {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
  }

  .deferrals-table__status--positive {
    color: #15803d;
  }

  .deferrals-table__status--warning {
    color: #b45309;
  }

  .deferrals-table__status--negative {
    color: #b42318;
  }

  .deferrals-table__status--neutral {
    color: #164679;
  }

  .deferrals-table__status--muted {
    color: var(--color-text-medium);
  }

  .deferrals-table__days {
    color: var(--color-text-dark);
    font-size: 13px;
    font-weight: 600;
  }

  .deferrals-table__action-button {
    height: auto !important;
    min-height: 32px;
    padding: 6px 12px !important;
    border-radius: 8px !important;
    border: 1px solid var(--ncb-primary-500) !important;
    background: var(--ncb-primary-500) !important;
    color: var(--color-white) !important;
    box-shadow: none !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }

  .deferrals-confirm-modal__icon-badge {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(214, 189, 152, 0.18);
    border: 1px solid rgba(214, 189, 152, 0.32);
    color: var(--color-text-dark);
    flex-shrink: 0;
  }

  .deferrals-confirm-modal__button.ant-btn {
    min-width: 120px;
    height: 36px;
    border-radius: 8px;
    font-weight: 600;
    box-shadow: none;
  }

  .deferrals-confirm-modal__button--primary.ant-btn {
    background: var(--ncb-primary-500);
    border: none;
    color: var(--color-white);
  }

  .deferrals-confirm-modal__button--secondary.ant-btn {
    border: 1px solid rgba(214, 189, 152, 0.4);
    background: var(--color-white);
    color: var(--color-text-dark);
  }

  .deferrals-confirm-modal__button--danger.ant-btn {
    background: linear-gradient(135deg, #b42318 0%, #7f1d1d 100%);
    border: none;
    color: var(--color-white);
  }

  @media (max-width: 767px) {
    .creator-deferrals-card {
      border-radius: 8px;
    }

    .deferrals-header__actions,
    .deferrals-filters {
      width: 100%;
    }

    .deferrals-filter,
    .deferrals-filter--date,
    .deferrals-filter-clear {
      width: 100%;
      min-width: 100%;
    }
  }
`;

/**
 * Deferrals Component - Main Container & Page Logic
 *
 * This is the refactored container component that orchestrates all modular parts.
 * - Modular UI Components (Header, Filters, Table, etc.)
 * - Custom Hooks (Data fetching, filtering, modal state, document decisions)
 * - Separated Utilities (Constants, Helpers, Styles)
 * - Scalable Business Logic (Action handlers, etc.)
 *
 * Responsibilities:
 * - Main state management and coordination
 * - Page layout and orchestration
 * - Action handlers (approve, reject, return, close, etc.)
 * - Modal rendering with all content
 * - Tab navigation and filtering
 */
const Deferrals = ({ userId }) => {
  // Auth from Redux
  const token = useSelector((state) => state.auth.token);

  // Main state management using custom hooks
  const { deferrals, setDeferrals, loading, loadDeferrals } =
    useDeferralData(token);
  const [filters, setFilters] = useState({
    priority: "all",
    search: "",
    dateRange: null,
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const a = q.get("active");
      if (
        a === "rejected" ||
        a === "approved" ||
        a === "pending" ||
        a === "closed" ||
        a === "closeRequests" ||
        a === "extensions"
      )
        return a;
    } catch (e) {}
    return "pending";
  });

  const { filteredDeferrals } = useDeferralFiltering(
    deferrals,
    filters,
    activeTab,
  );
  const {
    selectedDeferral,
    setSelectedDeferral,
    modalVisible,
    setModalVisible,
    openModal,
    closeModal,
  } = useDeferralModal();

  // Extension state
  const [extensionsLoading, setExtensionsLoading] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [pendingExtensions, setPendingExtensions] = useState([]);
  const [extensionDetailsLoading, setExtensionDetailsLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalConfirmModalVisible, setApprovalConfirmModalVisible] =
    useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showReworkConfirm, setShowReworkConfirm] = useState(false);
  const [creatorComment, setCreatorComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [reworkComment, setReworkComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [returnReworkLoading, setReturnReworkLoading] = useState(false);
  const [disabledDeferralIds, setDisabledDeferralIds] = useState(new Set());

  // Per-document decisions hook
  const { creatorDocDecisions, setDocDecision, resetDocDecision } =
    useDocDecisions(selectedDeferral, getDeferralDocumentBuckets);

  // Initialize load
  useEffect(() => {
    loadDeferrals();

    const handler = (e) => {
      try {
        const updated = e && e.detail ? e.detail : null;
        if (!updated || !updated._id) return;

        setDeferrals((prev) => {
          const exists = prev.some(
            (d) => String(d._id) === String(updated._id),
          );
          if (exists) {
            return prev.map((d) =>
              d._id === updated._id ? { ...d, ...updated } : d,
            );
          }

          const stored = JSON.parse(localStorage.getItem("user") || "null");
          const myId = stored?.user?._id || userId;
          const isMine =
            updated.requestor &&
            ((updated.requestor._id &&
              String(updated.requestor._id) === String(myId)) ||
              String(updated.requestor) === String(myId));
          if (isMine) return [updated, ...prev];
          return prev;
        });

        if (
          selectedDeferral &&
          String(selectedDeferral._id) === String(updated._id)
        ) {
          setSelectedDeferral((prev) => ({ ...prev, ...updated }));
        }

        const myUserId = localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).user._id
          : null;
        const isMine =
          updated.requestor &&
          ((updated.requestor._id &&
            String(updated.requestor._id) === String(myUserId)) ||
            String(updated.requestor) === String(myUserId));
        const s = (updated.status || "").toLowerCase();
        if (
          (s === "rejected" ||
            s === "deferral_rejected" ||
            s === "returned_for_rework") &&
          isMine
        ) {
          setActiveTab("rejected");
        }
        if (
          [
            "closed",
            "deferral_closed",
            "closed_by_co",
            "closed_by_creator",
          ].includes(s) &&
          isMine
        ) {
          setActiveTab("closed");
        }
        if (s === "close_requested") {
          setActiveTab("closeRequests");
        }
        if ((s === "approved" || s === "deferral_approved") && isMine) {
          setActiveTab("approved");
        }
        if (
          [
            "returned_for_rework",
            "returned_by_creator",
            "returned_by_checker",
          ].includes(s) &&
          isMine
        ) {
          setActiveTab("closed");
        }
      } catch (err) {
        console.warn("deferral:updated handler error", err);
      }
    };

    window.addEventListener("deferral:updated", handler);
    return () => {
      window.removeEventListener("deferral:updated", handler);
    };
  }, [userId]);

  // Refresh deferral when modal opens
  useEffect(() => {
    if (!selectedDeferral || !modalVisible) return;
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        const fresh = await deferralApi.getDeferralById(
          selectedDeferral._id,
          token,
        );
        if (!cancelled && fresh) setSelectedDeferral(fresh);
      } catch (err) {
        console.debug("deferral refresh failed", err?.message || err);
      }
    };
    fetchLatest();
    const t = setInterval(fetchLatest, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [selectedDeferral?._id, modalVisible]);

  // Load extensions when tab changes
  useEffect(() => {
    if (activeTab === "extensions") {
      loadPendingExtensions();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleExtensionUpdated = () => {
      if (activeTab === "extensions") {
        loadPendingExtensions();
      }
      loadDeferrals();
    };

    window.addEventListener("extension:updated", handleExtensionUpdated);
    window.addEventListener("extension:created", handleExtensionUpdated);

    return () => {
      window.removeEventListener("extension:updated", handleExtensionUpdated);
      window.removeEventListener("extension:created", handleExtensionUpdated);
    };
  }, [activeTab]);

  const loadPendingExtensions = async () => {
    try {
      setExtensionsLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = user?.token;

      if (!token) {
        message.error("Authentication token not found");
        return;
      }

      const extensions = await deferralApi.getCreatorPendingExtensions(token);
      setPendingExtensions(extensions || []);
    } catch (error) {
      console.error("Error loading pending extensions:", error);
      message.error("Failed to load extension applications");
      setPendingExtensions([]);
    } finally {
      setExtensionsLoading(false);
    }
  };

  const handleOpenExtensionReview = async (extensionRecord) => {
    try {
      setExtensionDetailsLoading(true);

      const extensionId = extensionRecord?._id || extensionRecord?.id;
      const freshExtension = extensionId
        ? await deferralApi.getExtensionById(extensionId, token)
        : extensionRecord;

      const deferralId =
        freshExtension?.deferralId ||
        freshExtension?.deferral?._id ||
        freshExtension?.deferral?.id ||
        extensionRecord?.deferralId;

      const fullDeferral = deferralId
        ? await deferralApi.getDeferralById(deferralId, token)
        : freshExtension?.deferral || null;

      setSelectedExtension({
        ...freshExtension,
        deferral: fullDeferral || freshExtension?.deferral || null,
        linkedDeferral:
          fullDeferral ||
          freshExtension?.linkedDeferral ||
          freshExtension?.deferral ||
          null,
      });
      setExtensionModalOpen(true);
    } catch (error) {
      console.error("Error loading extension review details:", error);
      message.error("Failed to load extension details");
    } finally {
      setExtensionDetailsLoading(false);
    }
  };

  // ============= ACTION HANDLERS =============

  const handleApproveDeferral = async () => {
    if (!selectedDeferral) {
      message.error("No deferral selected");
      return;
    }
    setApprovalConfirmModalVisible(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedDeferral) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      const currentUser = getCurrentUser();
      const userId = currentUser._id;
      const userRole = currentUser.role;

      const hasCreatorApproved =
        selectedDeferral.creatorApprovalStatus === "approved";
      const hasCheckerApproved =
        selectedDeferral.checkerApprovalStatus === "approved";

      const isCreator =
        selectedDeferral.creator &&
        (selectedDeferral.creator._id === userId ||
          selectedDeferral.creator === userId);
      const isChecker =
        selectedDeferral.checker &&
        (selectedDeferral.checker._id === userId ||
          selectedDeferral.checker === userId);

      const effectiveIsCreator =
        isCreator || userRole === "creator" || !selectedDeferral.creator;
      const effectiveIsChecker = isChecker || userRole === "checker";

      let response;

      if (effectiveIsCreator) {
        response = await deferralApi.approveByCreator(
          selectedDeferral._id,
          {
            comment: creatorComment,
            creatorId: userId,
          },
          token,
        );
      } else if (effectiveIsChecker) {
        response = await deferralApi.approveByChecker(
          selectedDeferral._id,
          {
            comment: creatorComment,
            checkerId: userId,
          },
          token,
        );
      } else {
        throw new Error(
          "Unable to determine user role. Please contact support.",
        );
      }

      if (response) {
        const updatedDeferral = response.deferral || response;

        message.success(response.message || "Deferral approved successfully!");

        try {
          const userName = currentUser.name || currentUser.email;
          const approvalType = effectiveIsChecker ? "checker" : "creator";

          await deferralApi.sendEmailNotification(
            selectedDeferral._id,
            `approved_by_${approvalType}`,
            {
              comment: creatorComment,
              userName: userName,
              approvedBy: effectiveIsChecker ? "Checker" : "Creator",
            },
          );
        } catch (emailErr) {
          console.warn("Failed to send email notification:", emailErr);
        }

        setDisabledDeferralIds((prev) =>
          new Set(prev).add(selectedDeferral._id),
        );

        const updatedDeferrals = deferrals.map((d) =>
          d._id === updatedDeferral._id ? updatedDeferral : d,
        );
        setDeferrals(updatedDeferrals);

        setCreatorComment("");
        setApprovalConfirmModalVisible(false);

        setTimeout(() => {
          setModalVisible(false);
          setSelectedDeferral(null);
        }, 800);

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: updatedDeferral,
            }),
          );
          window.dispatchEvent(
            new CustomEvent("deferral:moved-to-checker", {
              detail: updatedDeferral,
            }),
          );
        } catch (e) {
          console.error("Error dispatching events:", e);
        }
      } else {
        throw new Error("No response from server");
      }
    } catch (error) {
      console.error("Error in handleConfirmApproval", error);
      message.error(error.message || "Failed to approve deferral");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    setRejectComment("");
    setShowRejectConfirm(true);
  };

  const doReject = async () => {
    if (!rejectComment.trim()) {
      message.error("Please provide a reason for rejection");
      return;
    }

    setRejecting(true);
    try {
      const currentUser = getCurrentUser();
      const userId = currentUser._id;
      const userName = currentUser.name || currentUser.email;

      const isCreator =
        selectedDeferral.creator &&
        (selectedDeferral.creator._id === userId ||
          selectedDeferral.creator === userId);
      const isChecker =
        selectedDeferral.checker &&
        (selectedDeferral.checker._id === userId ||
          selectedDeferral.checker === userId);

      let response;

      if (isCreator) {
        response = await deferralApi.rejectByCreator(
          selectedDeferral._id,
          {
            comment: rejectComment,
            rejectedBy: userId,
            rejectedByName: userName,
            status: "rejected",
          },
          token,
        );
      } else if (isChecker) {
        response = await deferralApi.rejectByChecker(
          selectedDeferral._id,
          {
            comment: rejectComment,
            rejectedBy: userId,
            rejectedByName: userName,
            status: "rejected",
          },
          token,
        );
      } else {
        response = await deferralApi.rejectDeferral(
          selectedDeferral._id,
          {
            comment: rejectComment,
            rejectedBy: userId,
            rejectedByName: userName,
            status: "rejected",
          },
          token,
        );
      }

      if (response && response.success) {
        message.success("Deferral rejected successfully!");

        try {
          await deferralApi.sendEmailNotification(
            selectedDeferral._id,
            "rejected_to_rm",
            {
              comment: rejectComment,
              userName: userName,
              rejectedBy: isCreator
                ? "Creator"
                : isChecker
                  ? "Checker"
                  : "Approver",
            },
          );
        } catch (emailErr) {
          console.warn("Failed to send email notification:", emailErr);
        }

        const updatedDeferrals = deferrals.map((d) =>
          d._id === selectedDeferral._id ? { ...d, ...response.deferral } : d,
        );
        setDeferrals(updatedDeferrals);

        setModalVisible(false);
        setSelectedDeferral(null);
        setActiveTab("rejected");
        loadDeferrals();

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: response.deferral,
            }),
          );
          try {
            localStorage.setItem(
              "deferral:update",
              JSON.stringify({ id: response.deferral?._id, ts: Date.now() }),
            );
          } catch (e) {}
        } catch (e) {}
      } else {
        throw new Error(response?.message || "Failed to reject deferral");
      }
    } catch (error) {
      console.error("Error rejecting deferral:", error);
      message.error(error.message || "Failed to reject deferral");
    } finally {
      setRejecting(false);
      setShowRejectConfirm(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      message.error("Please enter a comment before posting");
      return;
    }

    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setPostingComment(true);
    try {
      const currentUser = getCurrentUser();

      const commentData = {
        text: newComment.trim(),
        author: {
          name: currentUser.name || "User",
          role: currentUser.role || "user",
        },
        createdAt: new Date().toISOString(),
      };

      await deferralApi.postComment(selectedDeferral._id, commentData, token);

      message.success("Comment posted successfully");

      setNewComment("");

      const refreshedDeferral = await deferralApi.getDeferralById(
        selectedDeferral._id,
        token,
      );
      setSelectedDeferral(refreshedDeferral);

      const updatedDeferrals = deferrals.map((d) =>
        d._id === refreshedDeferral._id ? refreshedDeferral : d,
      );
      setDeferrals(updatedDeferrals);
    } catch (error) {
      console.error("Failed to post comment:", error);
      message.error(error.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleReturnForRework = () => {
    setReworkComment("");
    setShowReworkConfirm(true);
  };

  const doReturnForRework = async () => {
    if (!reworkComment.trim()) {
      message.error("Please provide rework instructions");
      return;
    }

    setReturnReworkLoading(true);
    try {
      const currentUser = getCurrentUser();
      const userId = currentUser._id;
      const userName = currentUser.name || currentUser.email;
      const userRole = (currentUser.role || "").toLowerCase();

      const isChecker = userRole === "checker" || userRole === "co_checker";

      let response;

      if (isChecker) {
        response = await deferralApi.returnForReworkByChecker(
          selectedDeferral._id,
          {
            comment: reworkComment,
            returnedBy: userId,
            returnedByName: userName,
            returnedByRole: "Checker",
          },
          token,
        );
      } else {
        response = await deferralApi.returnForReworkByCreator(
          selectedDeferral._id,
          {
            comment: reworkComment,
            returnedBy: userId,
            returnedByName: userName,
            returnedByRole: "Creator",
          },
          token,
        );
      }

      const reworkSucceeded =
        !!response &&
        (response.success === true ||
          /returned\s+for\s+rework/i.test(String(response.message || "")));

      if (reworkSucceeded) {
        message.success("Deferral returned for rework successfully!");

        const returnedDeferral = response?.deferral || {
          ...selectedDeferral,
          status: isChecker ? "returned_by_checker" : "returned_by_creator",
          lastReturnedByRole: isChecker ? "checker" : "creator",
        };

        const updatedDeferrals = deferrals.map((d) =>
          d._id === selectedDeferral._id ? { ...d, ...returnedDeferral } : d,
        );
        setDeferrals(updatedDeferrals);

        setModalVisible(false);
        setSelectedDeferral(null);
        setActiveTab("closed");
        loadDeferrals();

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: returnedDeferral,
            }),
          );
        } catch (e) {}
      } else {
        throw new Error(
          response?.message || "Failed to return deferral for rework",
        );
      }
    } catch (error) {
      console.error("Error returning deferral for rework:", error);
      message.error(error.message || "Failed to return deferral for rework");
    } finally {
      setReturnReworkLoading(false);
      setShowReworkConfirm(false);
    }
  };

  const handleCloseDeferral = async () => {
    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      const currentUser = getCurrentUser();
      const userId = currentUser._id;
      const userName = currentUser.name || currentUser.email;

      const response = await deferralApi.closeDeferral(
        selectedDeferral._id,
        {
          closedBy: userId,
          closedByName: userName,
          comment: creatorComment || "Deferral closed by CO",
        },
        token,
      );

      if (response && response.success) {
        try {
          await deferralApi.sendEmailNotification(
            selectedDeferral._id,
            "closed_to_all_parties",
            {
              comment: creatorComment || "Deferral closed by CO",
              userName: userName,
            },
          );
        } catch (emailErr) {
          console.warn("Failed to send email notification:", emailErr);
        }

        const updatedDeferrals = deferrals.map((d) =>
          d._id === selectedDeferral._id ? { ...d, ...response.deferral } : d,
        );
        setDeferrals(updatedDeferrals);
        message.success("Deferral closed successfully!");

        setModalVisible(false);
        setSelectedDeferral(null);
        setCreatorComment("");

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", {
              detail: response.deferral,
            }),
          );
        } catch (e) {}
      } else {
        throw new Error(response?.message || "Failed to close deferral");
      }
    } catch (error) {
      console.error("Error closing deferral:", error);
      message.error("Failed to close deferral");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCloseRequestByCreator = async () => {
    if (!selectedDeferral || !selectedDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setActionLoading(true);
    try {
      const decisions = Object.keys(creatorDocDecisions || {}).map((k) => ({
        documentName: k,
        status:
          (creatorDocDecisions[k] && creatorDocDecisions[k].status) ||
          "pending",
        comment:
          (creatorDocDecisions[k] && creatorDocDecisions[k].comment) || "",
      }));

      const hasUploadedDocs = Object.keys(creatorDocDecisions || {}).length > 0;
      const hasPendingDecisions = decisions.some(
        (d) => !d.status || String(d.status).toLowerCase() === "pending",
      );

      if (hasUploadedDocs && hasPendingDecisions) {
        message.error(
          "Please review all uploaded documents (approve/reject) before approving close request",
        );
        setActionLoading(false);
        return;
      }

      const approvedDocs = decisions
        .filter((d) => String(d.status).toLowerCase() === "approved")
        .map((d) => d.documentName);

      const payload = {
        comment: creatorComment || "Close request approved by creator",
        approvedDocuments: approvedDocs,
        creatorDocumentDecisions: decisions,
      };

      const response = await deferralApi.approveCloseRequestByCreator(
        selectedDeferral._id,
        payload,
        token,
      );

      const updatedDeferral = response?.deferral || response;
      if (!updatedDeferral?._id) {
        throw new Error("Invalid response while approving close request");
      }

      setDeferrals((prev) =>
        prev.map((d) => (d._id === updatedDeferral._id ? updatedDeferral : d)),
      );
      setSelectedDeferral(updatedDeferral);
      setCreatorComment("");
      message.success(
        response?.message || "Creator close-request review saved successfully",
      );

      window.dispatchEvent(
        new CustomEvent("deferral:updated", {
          detail: updatedDeferral,
        }),
      );

      setApprovalConfirmModalVisible(false);
      setModalVisible(false);
      setSelectedDeferral(null);
      loadDeferrals();
    } catch (error) {
      console.error("Error approving close request by creator:", error);
      message.error(error.message || "Failed to approve close request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveExtension = async (extensionId, comment) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = user?.token;

      if (!token) {
        message.error("Authentication token not found");
        return;
      }

      const response = await deferralApi.approveExtensionAsCreator(
        extensionId,
        comment,
        token,
      );
      const updatedExtension = response?.extension || response;
      const updatedDeferral =
        response?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      message.success(response?.message || "Extension approved successfully");
      try {
        window.dispatchEvent(
          new CustomEvent("extension:updated", { detail: updatedExtension }),
        );
        if (updatedDeferral?._id || updatedDeferral?.id) {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
        }
      } catch (eventError) {
        console.debug("Failed to dispatch extension approval events", eventError);
      }

      setExtensionModalOpen(false);
      setSelectedExtension(null);
      await loadPendingExtensions();
    } catch (error) {
      console.error("Error approving extension:", error);
      message.error(error.message || "Failed to approve extension");
    }
  };

  const handleRejectExtension = async (extensionId, reason) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = user?.token;

      if (!token) {
        message.error("Authentication token not found");
        return;
      }

      const response = await deferralApi.rejectExtensionAsCreator(
        extensionId,
        reason,
        token,
      );
      const updatedExtension = response?.extension || response;
      const updatedDeferral =
        response?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      message.success(response?.message || "Extension rejected successfully");
      try {
        window.dispatchEvent(
          new CustomEvent("extension:updated", { detail: updatedExtension }),
        );
        if (updatedDeferral?._id || updatedDeferral?.id) {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
        }
      } catch (eventError) {
        console.debug("Failed to dispatch extension rejection events", eventError);
      }

      setExtensionModalOpen(false);
      setSelectedExtension(null);
      await loadPendingExtensions();
    } catch (error) {
      console.error("Error rejecting extension:", error);
      message.error(error.message || "Failed to reject extension");
    }
  };

  // ============= RENDER HELPERS =============

  const normalizeDocKey = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");

  const { dclDocs, uploadedDocs, requestedDocs } =
    getDeferralDocumentBuckets(selectedDeferral);

  // Tab counts
  const pendingCount = deferrals.filter(isCreatorQueueDeferral).length;

  const approvedCount = deferrals.filter((d) => {
    const s = (d.status || "").toString().toLowerCase();
    return ["approved", "deferral_approved"].includes(s);
  }).length;

  const closeRequestsCount = deferrals.filter((d) => {
    const s = (d.status || "").toString().toLowerCase();
    return hasPendingCreatorCloseRequestDocuments(d) ||
      (s === "close_requested" && !hasAnyCloseRequestDocumentState(d));
  }).length;

  // Column definitions for deferral table
  const columns = useMemo(() => {
    return [
      {
        title: "Deferral No",
        dataIndex: "deferralNumber",
        key: "deferralNumber",
        width: 120,
        render: (text, record) => (
          <div className="deferrals-table__primary-cell">
            <span className="deferrals-table__primary-value">{text || "-"}</span>
            <span className="deferrals-table__secondary-value">
              {record.requestor?.name || "Deferral request"}
            </span>
          </div>
        ),
      },
      {
        title: "Customer",
        dataIndex: "customerName",
        key: "customerName",
        width: 180,
        render: (text, record) => (
          <div className="deferrals-table__primary-cell">
            <span className="deferrals-table__primary-value">{text || "-"}</span>
            <span className="deferrals-table__secondary-value">
              {record.customerNumber || "Customer number not set"}
            </span>
          </div>
        ),
      },
      {
        title: "DCL No",
        dataIndex: "dclNo",
        key: "dclNo",
        width: 120,
        render: (text, record) => (
          <span className="deferrals-table__muted deferrals-table__mono">
            {record.dclNo || record.dclNumber || "-"}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (status, record) => {
          const statusMeta = getDeferralStatusMeta(record);

          return (
            <span
              className={`deferrals-table__status deferrals-table__status--${statusMeta.tone}`}
            >
              {statusMeta.label}
            </span>
          );
        },
      },
      {
        title: "Days Sought",
        dataIndex: "daysSought",
        width: 110,
        render: (d) => <span className="deferrals-table__days">{d || 0} days</span>,
      },
      {
        title: "TAT consumed",
        dataIndex: "slaExpiry",
        width: 160,
        render: (s, record) => (
          <RealTimeSlaTag
            slaExpiry={s}
            startedAt={record?.createdAt}
            emptyLabel="Not set"
            minWidth={76}
            displayStyle="text"
            businessHoursOnly
          />
        ),
      },
    ];
  }, []);

  // Extension columns
  const computeExtensionColumns = () => [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      key: "deferralNumber",
      render: (text) => (
        <span className="deferrals-table__primary-value">{text || "-"}</span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Current Days",
      dataIndex: "currentDaysSought",
      key: "currentDaysSought",
      render: (days) => <span className="deferrals-table__muted">{days} days</span>,
    },
    {
      title: "Requested Days",
      dataIndex: "requestedDaysSought",
      key: "requestedDaysSought",
      render: (days) => <span className="deferrals-table__days">{days} days</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_, record) => {
        const statusMeta = getDeferralStatusMeta(record);
        return (
          <span
            className={`deferrals-table__status deferrals-table__status--${statusMeta.tone}`}
          >
            {statusMeta.label}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="default"
          size="small"
          className="deferrals-table__action-button"
          loading={extensionDetailsLoading && String(selectedExtension?._id || selectedExtension?.id || "") === String(record?._id || record?.id || "")}
          onClick={() => {
            handleOpenExtensionReview(record);
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  // ============= RENDER =============

  const customStyles = getCustomStyles();
  const showingExtensionReview =
    extensionModalOpen && !!selectedExtension;
  const showingDeferralReview =
    !showingExtensionReview && modalVisible && !!selectedDeferral;
  const showingReviewSurface = showingDeferralReview || showingExtensionReview;

  return (
    <div className="creator-deferrals-page creator-theme" style={{ padding: 18 }}>
      <style>{`${customStyles}${deferralsPageStyles}`}</style>

      <div className={`creator-deferrals-shell${showingReviewSurface ? " creator-deferrals-shell--review" : ""}`}>
        {showingReviewSurface ? (
          <>
            {showingDeferralReview && (
              <DeferralDetailsModal
                deferral={selectedDeferral}
                visible={modalVisible}
                sourceTab={activeTab}
                onClose={closeModal}
                onApprove={handleApproveDeferral}
                onReject={handleReject}
                onReturnForRework={handleReturnForRework}
                isApproving={actionLoading}
                isRejecting={rejecting}
                isReturningForRework={returnReworkLoading}
                isLoading={false}
                onPostComment={handlePostComment}
                isPostingComment={postingComment}
                newComment={newComment}
                onNewCommentChange={setNewComment}
                _creatorDocDecisions={creatorDocDecisions}
                _onDocDecision={setDocDecision}
                _onResetDocDecision={resetDocDecision}
                userId={userId}
                token={token}
              />
            )}

            {showingExtensionReview && (
              <ExtensionTab
                extensionModalOpen={extensionModalOpen}
                selectedExtension={selectedExtension}
                extensionsLoading={extensionDetailsLoading}
                onApprove={handleApproveExtension}
                onReject={handleRejectExtension}
                onModalClose={() => {
                  setExtensionModalOpen(false);
                  setSelectedExtension(null);
                }}
              />
            )}
          </>
        ) : (
          <div className="creator-deferrals-card">
            <div className="creator-deferrals-toolbar">
              <DeferralHeader
                deferrals={deferrals}
                onRefresh={loadDeferrals}
                onExport={() => {
                  message.info("Export functionality coming soon");
                }}
                loading={loading}
                disabledExport={filteredDeferrals.length === 0}
              />

              <DeferralFilters
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={() =>
                  setFilters({
                    priority: "all",
                    search: "",
                    dateRange: null,
                  })
                }
              />
            </div>

            <DeferralTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              closeRequestsCount={closeRequestsCount}
              extensionsCount={pendingExtensions.length}
            />

            <DeferralTable
              columns={columns}
              data={filteredDeferrals}
              loading={loading}
              activeTab={activeTab}
              onRowClick={openModal}
              customTableStyles={deferralsPageStyles}
              computeExtensionColumns={computeExtensionColumns}
              pendingExtensions={pendingExtensions}
              extensionsLoading={extensionsLoading}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <Modal
        open={approvalConfirmModalVisible}
        onCancel={() => setApprovalConfirmModalVisible(false)}
        footer={null}
        width={550}
        centered
        className="admin-page__modal deferral-review-confirm deferral-review-confirm--acceptance"
        closeIcon={
          <span style={{ color: "var(--color-primary-dark)", fontSize: 24, lineHeight: 1 }}>
            ×
          </span>
        }
        title={
          <div className="deferral-review-confirm__title">
            <div className="deferral-review-confirm__icon"><CheckCircleOutlined /></div>
            <span>
              {activeTab === "closeRequests"
                ? "Submit Close Request Review"
                : "Confirm Acceptance"}
            </span>
          </div>
        }
        styles={{
          header: {
            margin: 0,
            background: "transparent",
            borderBottom: "none",
            padding: "18px 20px",
          },
          body: { padding: 16 },
          content: { padding: 0, borderRadius: 16 },
        }}
      >
        <div className="admin-page__modal-body">
          <div className="deferral-review-confirm__body-card">
            <div className="deferral-review-confirm__summary">
              <div className="deferral-review-confirm__summary-title">
              {activeTab === "closeRequests"
                ? selectedDeferral?.deferralNumber || "Close request review"
                : selectedDeferral?.deferralNumber || "Deferral acceptance"}
              </div>
              <div className="deferral-review-confirm__summary-copy">
              {activeTab === "closeRequests"
                ? "Review and submit the close-request decision for this deferral."
                : "Use the same controlled review flow and color palette as the other system confirmation modals."}
              </div>
              <div className="deferral-review-confirm__summary-copy">
                {activeTab === "closeRequests"
                  ? "Submit the creator review for these close request documents?"
                  : "Accepting this deferral will move it forward in the workflow and record your comment in the audit trail."}
              </div>
            </div>
            <label className="deferral-review-confirm__label">
            {activeTab === "closeRequests"
              ? "Review Comment (Optional)"
              : "Acceptance Comment (Optional)"}
            </label>
            <TextArea
              rows={3}
              placeholder={
                activeTab === "closeRequests"
                  ? "Add any comments for this close-request review..."
                  : "Add any comments for acceptance..."
              }
              value={creatorComment}
              onChange={(e) => setCreatorComment(e.target.value)}
              className="deferral-review-confirm__textarea"
            />
          </div>

          <div className="admin-page__modal-footer">
            <Button
              onClick={() => setApprovalConfirmModalVisible(false)}
              className="admin-page__action-button admin-page__action-button--secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={
                activeTab === "closeRequests"
                  ? handleApproveCloseRequestByCreator
                  : handleConfirmApproval
              }
              loading={actionLoading}
              className="admin-page__action-button deferral-review-confirm__confirm"
            >
              {activeTab === "closeRequests" ? "Submit Review" : "Accept"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showRejectConfirm}
        onCancel={() => setShowRejectConfirm(false)}
        footer={null}
        loading={rejecting}
        width={550}
        centered
        className="admin-page__modal deferral-review-confirm deferral-review-confirm--reject"
        closeIcon={
          <span style={{ color: "var(--color-text-dark)", fontSize: 24, lineHeight: 1 }}>
            ×
          </span>
        }
        title={
          <div className="deferral-review-confirm__title">
            <div className="deferral-review-confirm__icon"><CloseCircleOutlined /></div>
            <span>Confirm Rejection</span>
          </div>
        }
        styles={{
          header: {
            margin: 0,
            background: "var(--color-white)",
            borderBottom: "1px solid rgba(214, 189, 152, 0.2)",
            padding: "18px 20px",
          },
          body: { padding: 16 },
          content: { padding: 0, borderRadius: 16 },
        }}
      >
        <div className="admin-page__modal-body">
          <div className="deferral-review-confirm__body-card">
            <div className="deferral-review-confirm__summary">
              <div className="deferral-review-confirm__summary-title">
                {selectedDeferral?.deferralNumber || "Deferral rejection"}
              </div>
              <div className="deferral-review-confirm__summary-copy">
                Rejecting this deferral will stop the current review path and capture your reason in the workflow history.
              </div>
            </div>
            <label className="deferral-review-confirm__label">
              Rejection Reason
            </label>
            <TextArea
              rows={4}
              placeholder="Provide reason for rejection..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="deferral-review-confirm__textarea"
            />
          </div>

          <div className="admin-page__modal-footer">
            <Button
              onClick={() => setShowRejectConfirm(false)}
              className="admin-page__action-button admin-page__action-button--secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={doReject}
              loading={rejecting}
              className="admin-page__action-button deferral-review-confirm__confirm deferral-review-confirm__confirm--danger"
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showReworkConfirm}
        onCancel={() => setShowReworkConfirm(false)}
        footer={null}
        loading={returnReworkLoading}
        width={550}
        centered
        className="admin-page__modal deferral-review-confirm deferral-review-confirm--rework"
        closeIcon={<span style={{ color: "var(--color-text-dark)", fontSize: 24, lineHeight: 1 }}>×</span>}
        title={
          <div className="deferral-review-confirm__title">
            <div className="deferral-review-confirm__icon"><ExclamationCircleOutlined /></div>
            <span>Return for Rework</span>
          </div>
        }
        styles={{
          header: {
            margin: 0,
            background: "var(--color-white)",
            borderBottom: "1px solid rgba(214, 189, 152, 0.2)",
            padding: "18px 20px",
          },
          body: { padding: 16 },
          content: { padding: 0, borderRadius: 16 },
        }}
      >
        <div className="admin-page__modal-body">
          <div className="deferral-review-confirm__body-card">
            <div className="deferral-review-confirm__summary">
              <div className="deferral-review-confirm__summary-title">
              {selectedDeferral?.deferralNumber || "Return for rework"}
              </div>
              <div className="deferral-review-confirm__summary-copy">
                Send the deferral back with clear next-step instructions for the request owner.
              </div>
              <div className="deferral-review-confirm__summary-copy">
              Returning this deferral will send it back for correction and preserve your instructions in the workflow history.
              </div>
            </div>
            <label className="deferral-review-confirm__label">
              Rework Instructions
            </label>
            <TextArea
              rows={4}
              placeholder="Provide detailed rework instructions..."
              value={reworkComment}
              onChange={(e) => setReworkComment(e.target.value)}
              className="deferral-review-confirm__textarea"
            />
          </div>

          <div className="admin-page__modal-footer">
            <Button
              onClick={() => setShowReworkConfirm(false)}
              className="admin-page__action-button admin-page__action-button--secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={doReturnForRework}
              loading={returnReworkLoading}
              className="admin-page__action-button admin-page__action-button--primary"
            >
              Return
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Deferrals;
