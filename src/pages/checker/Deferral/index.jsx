import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Tabs,
  Button,
  Divider,
  Tag,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Badge,
  Tooltip,
  Space,
  message,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import deferralApi from "../../../service/deferralApi.js";
import ExtensionApprovalModal from "../../../components/modals/ExtensionApprovalModal";
import { customTableStyles, customModalStyles } from "./utils/deferralStyles";
import { getDeferralTableColumns } from "./utils/deferralColumns.jsx";
import { DeferralDetailModal, DeferralHeader, DeferralFilters } from "./components";
import { useDeferralAPI } from "./hooks/useDeferralAPI";
import { useDeferralHandlers } from "./hooks/useDeferralHandlers";
import {
  hasAnyCloseRequestDocumentState,
  hasCheckerCloseRequestDocuments,
} from "../../../utils/deferralDocuments";
import "../../../styles/creatorDesignSystem.css";

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;

const CHECKER_TERMINAL_STATUSES = new Set([
  "approved",
  "deferral_approved",
  "close_requested",
  "close_requested_creator_approved",
  "closed",
  "deferral_closed",
  "closed_by_co",
  "closed_by_creator",
  "rejected",
  "deferral_rejected",
  "returned_for_rework",
  "returned_by_creator",
  "returned_by_checker",
]);

const isApprovalMarkedApproved = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "approved";

const hasAllApproversApproved = (deferral) => {
  if (!deferral) return false;
  if (deferral.allApproversApproved === true) return true;

  const approvalFlow = Array.isArray(deferral.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral.approvers)
      ? deferral.approvers
      : Array.isArray(deferral.approvals)
        ? deferral.approvals
        : [];

  return (
    approvalFlow.length > 0 &&
    approvalFlow.every(
      (approver) =>
        approver?.approved === true ||
        isApprovalMarkedApproved(approver?.approvalStatus) ||
        isApprovalMarkedApproved(approver?.status),
    )
  );
};

const hasCoCreatorApproved = (deferral) =>
  isApprovalMarkedApproved(deferral?.coCreatorApprovalStatus) ||
  isApprovalMarkedApproved(deferral?.creatorApprovalStatus) ||
  isApprovalMarkedApproved(deferral?.creatorStatus);

const hasCheckerAccepted = (deferral) =>
  isApprovalMarkedApproved(deferral?.checkerApprovalStatus) ||
  isApprovalMarkedApproved(deferral?.checkerStatus);

const isCheckerQueueDeferral = (deferral) => {
  const status = String(deferral?.status || "")
    .trim()
    .toLowerCase();

  return (
    hasAllApproversApproved(deferral) &&
    hasCoCreatorApproved(deferral) &&
    !hasCheckerAccepted(deferral) &&
    !CHECKER_TERMINAL_STATUSES.has(status)
  );
};

/**
 * Main Deferral Management Component (Refactored for DRY)
 * Orchestrates all deferral workflows through reusable hooks and utilities
 */
const DeferralIndex = ({ userId }) => {
  const token = useSelector((state) => state.auth.token);

  // API and handlers hooks
  const {
    loading,
    fetchDeferrals: apiFetchDeferrals,
    loadPendingExtensions: apiLoadExtensions,
    approveExtension,
  } = useDeferralAPI(token);

  // State
  const [deferrals, setDeferrals] = useState([]);
  const [filteredDeferrals, setFilteredDeferrals] = useState([]);
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [filters, setFilters] = useState({
    search: "",
    statusFilter: "all",
    dateRange: null,
  });
  const [pendingExtensions, setPendingExtensions] = useState([]);
  const [extensionsLoading, setExtensionsLoading] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [extensionDetailsLoading, setExtensionDetailsLoading] = useState(false);
  const [creatorComment, setCreatorComment] = useState("");
  const [showReworkConfirm, setShowReworkConfirm] = useState(false);
  const [reworkComment, setReworkComment] = useState("");
  const [approvalConfirmModalVisible, setApprovalConfirmModalVisible] =
    useState(false);

  // Load deferrals on mount
  const loadDeferrals = useCallback(async () => {
    const data = await apiFetchDeferrals();
    setDeferrals(data);
  }, [apiFetchDeferrals]);

  // Handlers hook
  const {
    actionLoading,
    handleApproveConfirm,
    handleReturnForRework,
    handleApproveCloseRequest,
    handleDownloadPDF,
    handleExportCSV,
  } = useDeferralHandlers(token, {
    deferrals,
    setDeferrals,
    selectedDeferral,
    setSelectedDeferral,
    setActiveTab,
    setModalVisible,
    loadDeferrals,
  });

  useEffect(() => {
    loadDeferrals();
    const handler = (e) => {
      const updated = e?.detail;
      const updatedId = updated?._id || updated?.id;
      if (!updated || !updatedId) return;

      const normalizedUpdated = {
        ...updated,
        _id: updatedId,
        id: updatedId,
      };

      setDeferrals((prev) => {
        const exists = prev.some(
          (d) => String(d._id || d.id) === String(updatedId),
        );
        if (exists) {
          return prev.map((d) =>
            String(d._id || d.id) === String(updatedId)
              ? { ...d, ...normalizedUpdated }
              : d,
          );
        }
        return [normalizedUpdated, ...prev];
      });

      if (String(selectedDeferral?._id || selectedDeferral?.id) === String(updatedId)) {
        setSelectedDeferral((prev) => ({ ...prev, ...normalizedUpdated }));
      }

      void loadDeferrals();
    };

    window.addEventListener("deferral:updated", handler);
    return () => window.removeEventListener("deferral:updated", handler);
  }, [loadDeferrals, selectedDeferral?._id, selectedDeferral?.id, userId]);

  const loadPendingExtensions = useCallback(async () => {
    setExtensionsLoading(true);
    const extensions = await apiLoadExtensions();
    setPendingExtensions(extensions);
    setExtensionsLoading(false);
  }, [apiLoadExtensions]);

  useEffect(() => {
    const handleExtensionUpdated = () => {
      if (activeTab === "extensions") {
        void loadPendingExtensions();
      }
      void loadDeferrals();
    };

    window.addEventListener("extension:updated", handleExtensionUpdated);
    window.addEventListener("extension:created", handleExtensionUpdated);

    return () => {
      window.removeEventListener("extension:updated", handleExtensionUpdated);
      window.removeEventListener("extension:created", handleExtensionUpdated);
    };
  }, [activeTab, loadDeferrals, loadPendingExtensions]);

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
      console.error("Error loading checker extension details:", error);
      message.error("Failed to load extension details");
    } finally {
      setExtensionDetailsLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    const approvedStatuses = ["approved", "deferral_approved"];
    const completedStatuses = [
      "closed",
      "deferral_closed",
      "closed_by_co",
      "closed_by_creator",
    ];
    const rejectedStatuses = ["rejected", "deferral_rejected"];
    const returnedStatuses = [
      "returned_for_rework",
      "returned_by_creator",
      "returned_by_checker",
    ];

    let base = deferrals.filter((d) => {
      const s = (d.status || "").toString().toLowerCase();

      if (activeTab === "pending") {
        return isCheckerQueueDeferral(d);
      }

      if (activeTab === "approved") return approvedStatuses.includes(s);
      if (activeTab === "closeRequests")
        return hasCheckerCloseRequestDocuments(d) ||
          (s === "close_requested_creator_approved" && !hasAnyCloseRequestDocumentState(d));
      if (activeTab === "completed")
        return (
          completedStatuses.includes(s) ||
          rejectedStatuses.includes(s) ||
          returnedStatuses.includes(s)
        );

      return true;
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      base = base.filter(
        (d) =>
          (d.customerNumber || "").toLowerCase().includes(searchLower) ||
          (d.dclNo || d.dclNumber || "").toLowerCase().includes(searchLower) ||
          (d.customerName || "").toLowerCase().includes(searchLower) ||
          (d.deferralNumber || "").toLowerCase().includes(searchLower),
      );
    }

    if (filters.statusFilter && filters.statusFilter !== "all") {
      base = base.filter(
        (d) => String(d.status || "").toLowerCase() === filters.statusFilter,
      );
    }

    if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
      base = base.filter((d) => {
        const createdDate = dayjs(d.createdAt);
        return (
          createdDate.isAfter(filters.dateRange[0]) &&
          createdDate.isBefore(filters.dateRange[1])
        );
      });
    }

    setFilteredDeferrals(base);
  }, [activeTab, deferrals, filters]);

  // Load filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Load extensions when tab changes
  useEffect(() => {
    if (activeTab === "extensions") {
      void loadPendingExtensions();
    }
  }, [activeTab, loadPendingExtensions]);

  const handleRowClick = (record) => {
    setSelectedDeferral(record);
    setModalVisible(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const getTabCount = (tab) => {
    const statuses = {
      pending: (d) => isCheckerQueueDeferral(d),
      approved: (d) => {
        const s = (d.status || "").toLowerCase();
        return ["approved", "deferral_approved"].includes(s);
      },
      closeRequests: (d) => {
        const s = (d.status || "").toLowerCase();
        return hasCheckerCloseRequestDocuments(d) ||
          (s === "close_requested_creator_approved" && !hasAnyCloseRequestDocumentState(d));
      },
      completed: (d) => {
        const s = (d.status || "").toLowerCase();
        return [
          "closed",
          "deferral_closed",
          "closed_by_co",
          "closed_by_creator",
          "rejected",
          "deferral_rejected",
          "returned_for_rework",
          "returned_by_creator",
          "returned_by_checker",
        ].includes(s);
      },
    };

    return deferrals.filter(statuses[tab] || (() => true)).length;
  };

  const columns = getDeferralTableColumns();
  const showDeferralReview = modalVisible && !!selectedDeferral;
  const showExtensionReview = extensionModalOpen && !!selectedExtension;

  return (
    <div className="creator-theme checker-deferrals-page" style={{ padding: 24, background: "var(--color-bg)", minHeight: "100%" }}>
      <style>{customTableStyles}</style>
      <style>{customModalStyles}</style>
      <style>{`
        .checker-deferrals-page {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .checker-deferrals-shell,
        .checker-deferrals-workspace {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .deferrals-header,
        .deferrals-filters,
        .checker-deferrals-table-card {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 12px;
          box-shadow: 0 10px 24px rgba(26, 54, 54, 0.06);
        }
        .deferrals-header {
          padding: 14px;
          border-left: 4px solid var(--color-accent);
        }
        .deferrals-header__main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .deferrals-header__title {
          margin: 0;
          color: var(--color-primary-dark);
          font-size: 16px;
          font-weight: 700;
        }
        .deferrals-header__meta,
        .checker-deferrals-workspace__meta {
          margin: 6px 0 0;
          color: var(--color-text-light);
          font-size: 13px;
        }
        .deferrals-header__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .deferrals-header__button.ant-btn {
          min-height: 38px;
          border-radius: 8px;
          font-weight: 600;
          box-shadow: none;
        }
        .deferrals-header__button--primary.ant-btn {
          border: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
        }
        .deferrals-header__button.ant-btn:hover,
        .deferrals-header__button.ant-btn:focus,
        .deferrals-header__button.ant-btn:active {
          border-color: rgba(64, 83, 76, 0.24) !important;
          background: rgba(214, 189, 152, 0.1) !important;
          color: var(--color-text-dark) !important;
          box-shadow: none !important;
        }
        .deferrals-filters {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(214, 189, 152, 0.2);
          box-shadow: 0 10px 24px rgba(26, 54, 54, 0.06);
          background: var(--color-white);
        }
        .deferrals-filters__grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: center;
        }
        .deferrals-filters__actions {
          display: flex;
          justify-content: stretch;
        }
        .deferrals-filters__field,
        .deferrals-filters__field .ant-input-affix-wrapper,
        .deferrals-filters__field .ant-select,
        .deferrals-filters__field .ant-picker,
        .deferrals-filters__actions .ant-btn {
          width: 100%;
        }
        .deferrals-filters__field .ant-input-affix-wrapper,
        .deferrals-filters__field .ant-select-selector,
        .deferrals-filters__field .ant-picker,
        .deferrals-filters__actions .ant-btn {
          min-height: 40px;
          border-radius: 10px !important;
        }
        .deferrals-filters__field .ant-input-affix-wrapper,
        .deferrals-filters__field .ant-select-selector,
        .deferrals-filters__field .ant-picker {
          border-color: rgba(214, 189, 152, 0.22) !important;
          box-shadow: none !important;
        }
        .deferrals-filters__field .ant-input-affix-wrapper:hover,
        .deferrals-filters__field .ant-select-selector:hover,
        .deferrals-filters__field .ant-picker:hover,
        .deferrals-filters__field .ant-input-affix-wrapper:focus-within,
        .deferrals-filters__field .ant-select-focused .ant-select-selector,
        .deferrals-filters__field .ant-picker-focused {
          border-color: rgba(64, 83, 76, 0.26) !important;
          box-shadow: none !important;
        }
        .deferrals-filters__actions .ant-btn {
          border: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          font-weight: 600;
          box-shadow: none !important;
        }
        .deferrals-filters__actions .ant-btn:hover,
        .deferrals-filters__actions .ant-btn:focus {
          border-color: rgba(64, 83, 76, 0.24) !important;
          background: rgba(214, 189, 152, 0.1) !important;
          color: var(--color-text-dark) !important;
        }
        .checker-deferrals-table-card {
          overflow: hidden;
        }
        .checker-deferrals-table-card .ant-tabs-nav {
          padding: 0 18px;
          margin-bottom: 0;
          background: linear-gradient(180deg, rgba(245, 240, 231, 0.58) 0%, #fff 100%);
        }
        .checker-deferrals-table-card .ant-tabs-tab {
          padding: 14px 8px;
          font-weight: 600;
        }
        .checker-deferrals-workspace {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .checker-deferrals-workspace__topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }
        .checker-deferrals-workspace__title {
          margin: 0;
          color: var(--color-text-dark);
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .checker-deferrals-workspace__meta {
          margin: 4px 0 0;
          color: var(--color-text-light);
          font-size: 12px;
        }
        .checker-deferrals-workspace__actionbar {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 12px 14px;
        }
        .checker-deferrals-workspace__actionbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .checker-deferrals-workspace__actionbar-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .checker-workspace-btn.ant-btn {
          min-height: 38px;
          border-radius: 8px;
          font-weight: 600;
          box-shadow: none;
        }
        .checker-workspace-btn--primary.ant-btn {
          border: none !important;
          background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
          color: var(--color-white) !important;
        }
        .checker-workspace-btn--primary.ant-btn:hover,
        .checker-workspace-btn--primary.ant-btn:focus,
        .checker-workspace-btn--primary.ant-btn:active {
          border: none !important;
          background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
          color: var(--color-white) !important;
          box-shadow: none !important;
        }
        .checker-workspace-btn--secondary.ant-btn {
          border: 1px solid rgba(214, 189, 152, 0.28) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
        }
        .checker-workspace-btn--secondary.ant-btn:hover,
        .checker-workspace-btn--secondary.ant-btn:focus,
        .checker-workspace-btn--secondary.ant-btn:active {
          border-color: rgba(64, 83, 76, 0.24) !important;
          background: rgba(214, 189, 152, 0.1) !important;
          color: var(--color-text-dark) !important;
          box-shadow: none !important;
        }
        .checker-workspace-btn.ant-btn:disabled,
        .checker-workspace-btn.ant-btn[disabled] {
          background: #D1D5DB !important;
          border-color: #D1D5DB !important;
          color: #fff !important;
          box-shadow: none !important;
        }
        .checker-workspace-btn.ant-btn:disabled span,
        .checker-workspace-btn.ant-btn[disabled] span {
          color: #fff !important;
        }
        .checker-comment-trail__header {
          margin-bottom: 12px;
        }
        .checker-comment-trail__title {
          margin: 0;
          color: var(--color-text-dark);
          font-size: 15px;
          font-weight: 700;
        }
        .checker-comment-trail__subtitle {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }
        .checker-comment-trail__table {
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          overflow: hidden;
        }
        .checker-comment-trail__row {
          display: grid;
          grid-template-columns: minmax(140px, 1fr) minmax(120px, 140px) minmax(160px, 180px) 2fr;
          gap: 12px;
          padding: 12px 14px;
          align-items: start;
          border-bottom: 1px solid rgba(214, 189, 152, 0.14);
          font-size: 12px;
          color: #334155;
        }
        .checker-comment-trail__row:last-child {
          border-bottom: none;
        }
        .checker-comment-trail__row--head {
          background: var(--color-bg);
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .checker-comment-trail__author {
          font-weight: 600;
          color: var(--color-text-dark);
        }
        .checker-comment-trail__message {
          white-space: pre-wrap;
          line-height: 1.5;
        }
        @media (max-width: 767px) {
          .checker-deferrals-page {
            padding: 12px !important;
          }
          .deferrals-header,
          .deferrals-filters {
            padding: 14px;
          }
          .deferrals-header__title,
          .checker-deferrals-workspace__title {
            font-size: 16px;
          }
          .deferrals-header__main,
          .checker-deferrals-workspace__topbar {
            align-items: stretch;
          }
          .deferrals-header__actions,
          .checker-deferrals-workspace__actionbar-group,
          .checker-deferrals-workspace__actionbar-inner {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr;
          }
          .deferrals-header__button.ant-btn,
          .checker-deferrals-workspace__actionbar .ant-btn {
            width: 100%;
          }
          .checker-deferrals-table-card .ant-tabs-nav {
            padding: 0 10px;
          }
          .checker-deferrals-table-card .ant-tabs-tab {
            padding: 12px 6px;
            font-size: 12px;
          }
        }
        @media (min-width: 768px) {
          .deferrals-filters__grid {
            grid-template-columns: minmax(240px, 2fr) minmax(180px, 1fr) minmax(220px, 1.2fr) auto;
          }
          .deferrals-filters__actions {
            justify-content: flex-end;
          }
        }
        @media (max-width: 960px) {
          .checker-comment-trail__row {
            grid-template-columns: 1fr;
          }
        }
        .deferral-page-card {
          border-radius: 12px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: 0 10px 24px rgba(26, 54, 54, 0.06) !important;
        }
        .deferral-top-card {
          border-left: 4px solid var(--color-accent) !important;
        }
        .deferral-tabs .ant-tabs-nav {
          margin-bottom: 12px !important;
        }
        .deferral-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
        }
        .deferral-tabs .ant-tabs-tab {
          padding: 8px 12px !important;
          color: var(--color-text-light) !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif !important;
        }
        .deferral-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: var(--color-primary-dark) !important;
        }
        .deferral-tabs .ant-tabs-ink-bar {
          background: var(--color-primary-dark) !important;
        }
        .deferral-action-btn.ant-btn {
          min-height: 34px !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
        }
        .deferral-action-btn--ghost.ant-btn {
          background: var(--color-white) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-medium) !important;
        }
        .deferral-action-btn--ghost.ant-btn:hover,
        .deferral-action-btn--ghost.ant-btn:focus {
          color: var(--color-primary-dark) !important;
          border-color: rgba(214, 189, 152, 0.35) !important;
        }
        .deferral-table-shell {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(26, 54, 54, 0.06);
        }
        .deferral-empty {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 12px;
          padding: 40px 16px;
        }
      `}</style>

      {showDeferralReview ? (
        <div className="checker-deferrals-workspace">
          <DeferralDetailModal
            visible={modalVisible}
            deferral={selectedDeferral}
            actionLoading={actionLoading}
            onDownloadPDF={() => handleDownloadPDF()}
            onClose={() => {
              setModalVisible(false);
              setSelectedDeferral(null);
              setCreatorComment("");
              setApprovalConfirmModalVisible(false);
              setShowReworkConfirm(false);
              setReworkComment("");
            }}
            onApprove={() => setApprovalConfirmModalVisible(true)}
            onReturnForRework={() => {
              setReworkComment("");
              setShowReworkConfirm(true);
            }}
            approvalConfirmVisible={approvalConfirmModalVisible}
            onApprovalConfirm={(payload) => {
              if (activeTab === "closeRequests") {
                handleApproveCloseRequest(payload || { comment: creatorComment });
              } else {
                handleApproveConfirm(creatorComment);
              }
              setApprovalConfirmModalVisible(false);
            }}
            onApprovalCancel={() => setApprovalConfirmModalVisible(false)}
            reworkConfirmVisible={showReworkConfirm}
            reworkComment={reworkComment}
            onReworkCommentChange={setReworkComment}
            onReworkConfirm={() => {
              handleReturnForRework(reworkComment);
              setShowReworkConfirm(false);
              setReworkComment("");
            }}
            onReworkCancel={() => setShowReworkConfirm(false)}
            creatorComment={creatorComment}
            onCreatorCommentChange={setCreatorComment}
            sourceTab={activeTab}
          />
        </div>
      ) : showExtensionReview ? (
        <div className="checker-deferrals-workspace">
          <div className="checker-deferrals-workspace__topbar">
            <div>
              <h2 className="checker-deferrals-workspace__title">Review extension request</h2>
              <p className="checker-deferrals-workspace__meta">
                Extension review is rendered inline for consistency with the deferral workspace.
              </p>
            </div>
          </div>

          <ExtensionApprovalModal
            extension={selectedExtension}
            open={extensionModalOpen}
            loading={extensionDetailsLoading}
            embedded
            onClose={() => {
              setExtensionModalOpen(false);
              setSelectedExtension(null);
            }}
            onApprove={async (_extensionId, comment) => {
              const success = await approveExtension(selectedExtension.id, comment);
              if (success) {
                loadPendingExtensions();
                setExtensionModalOpen(false);
                setSelectedExtension(null);
              }
            }}
            approverRole="checker"
          />
        </div>
      ) : (
        <div className="checker-deferrals-shell">
          <DeferralHeader
            deferrals={deferrals}
            onRefresh={loadDeferrals}
            onExport={() => handleExportCSV(filteredDeferrals)}
            loading={loading}
            disabledExport={filteredDeferrals.length === 0}
          />

          <DeferralFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={() =>
              setFilters({ search: "", statusFilter: "all", dateRange: null })
            }
          />

          <div className="checker-deferrals-table-card">
            <div className="deferral-tabs">
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab={`My Queue (${getTabCount("pending")})`} key="pending" />
                <Tabs.TabPane tab={`Approved (${getTabCount("approved")})`} key="approved" />
                <Tabs.TabPane tab={`Close Requests (${getTabCount("closeRequests")})`} key="closeRequests" />
                <Tabs.TabPane tab={`Extensions (${pendingExtensions.length})`} key="extensions" />
              </Tabs>
            </div>

            {activeTab === "extensions" ? (
              extensionsLoading ? (
                <div className="deferral-empty">
                  <Spin tip="Loading..." style={{ padding: 40 }} />
                </div>
              ) : pendingExtensions.length === 0 ? (
                <div className="deferral-empty">
                  <Empty description="No extensions pending" />
                </div>
              ) : (
                <div className="deferral-table-shell deferrals-table">
                  <Table
                    columns={[
                      {
                        title: "Deferral No",
                        dataIndex: "deferralNumber",
                        key: "deferralNumber",
                      },
                      {
                        title: "Customer",
                        dataIndex: "customerName",
                        key: "customerName",
                      },
                      {
                        title: "Days Requested",
                        dataIndex: "requestedDaysSought",
                        key: "requestedDaysSought",
                        render: (d) => <strong>{d} days</strong>,
                      },
                      {
                        title: "Action",
                        key: "action",
                        render: (_, record) => (
                          <Button
                            type="primary"
                            size="small"
                            className="deferral-action-btn"
                            loading={
                              extensionDetailsLoading &&
                              String(selectedExtension?._id || selectedExtension?.id || "") ===
                                String(record?._id || record?.id || "")
                            }
                            onClick={() => {
                              handleOpenExtensionReview(record);
                            }}
                          >
                            Review
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={pendingExtensions}
                    rowKey={(r) => r.id}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                  />
                </div>
              )
            ) : loading ? (
              <div className="deferral-empty">
                <Spin tip={`Loading ${activeTab} deferrals...`} style={{ padding: 40 }} />
              </div>
            ) : filteredDeferrals.length === 0 ? (
              <div className="deferral-empty">
                <Empty description="No deferrals found" />
              </div>
            ) : (
              <div className="deferral-table-shell deferrals-table">
                <Table
                  columns={columns}
                  dataSource={filteredDeferrals}
                  rowKey={(r) => r._id}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: 1300 }}
                  onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: "pointer" },
                  })}
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DeferralIndex;