import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, Tabs, Input, Button, Select, DatePicker, Space, Empty, Spin, message, Table, Descriptions, Typography, Modal } from "antd";
import { SearchOutlined, ReloadOutlined, CalendarOutlined, FilePdfOutlined, FileDoneOutlined, CloseOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { PRIMARY_BLUE, ACCENT_LIME, SUCCESS_GREEN } from "../utils/constants";
import { getDeferralColumns } from "../utils/tableColumns";
import {
  useMyQueueData,
  useMyQueueModal,
  useMyQueueTabs,
  useMyQueueFilters,
  useExtensionFilters,
  useMyQueueActions,
} from "../hooks";
import { DeferralDetailsModal, ExtensionApplicationsTab } from ".";
import ExtensionApplicationModal from "./ExtensionApplicationModal";
import { API_BASE_URL } from "../../../../config/runtimeConfig";
import { getDrafts, deleteDraft, formatDraftDate } from "../../../../utils/draftsUtils";
import "../../../../styles/creatorDesignSystem.css";

const { RangePicker } = DatePicker;

const queuePageStyles = `
  .approver-queue-page {
    min-height: 100%;
    width: 100%;
    background: var(--color-bg);
  }

  .approver-queue-shell {
    width: 100%;
  }

  .approver-queue-card {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    overflow: hidden;
  }

  .approver-queue-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-bg);
  }

  .approver-queue-title {
    color: var(--color-text-dark);
    font-size: 15px;
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .approver-queue-copy {
    margin: 0;
    color: var(--color-text-dark);
    font-size: 12px;
    line-height: 1.5;
  }

  .approver-queue-search {
    width: min(360px, 100%);
  }

  .approver-queue-search.ant-input-affix-wrapper {
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
    background: var(--color-white) !important;
    border-radius: 6px !important;
    padding: 8px 12px !important;
    box-shadow: none !important;
  }

  .approver-queue-search.ant-input-affix-wrapper:hover,
  .approver-queue-search.ant-input-affix-wrapper:focus,
  .approver-queue-search.ant-input-affix-wrapper-focused {
    border-color: var(--color-primary-dark) !important;
    box-shadow: none !important;
  }

  .approver-queue-search input {
    background: transparent !important;
    font-size: 12px !important;
    color: var(--color-text-dark) !important;
  }

  .approver-queue-search .anticon {
    color: var(--color-text-light);
  }

  .approver-queue-filters-row {
    display: grid;
    grid-template-columns: minmax(220px, 1.2fr) repeat(2, minmax(180px, 0.8fr)) auto;
    gap: 12px;
    align-items: end;
    padding: 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-white);
  }

  .approver-queue-filters-row .ant-select,
  .approver-queue-filters-row .ant-picker {
    width: 100%;
  }

  .approver-queue-filters-row .ant-select-selector,
  .approver-queue-filters-row .ant-picker {
    min-height: 46px !important;
    border-radius: 8px !important;
    border: 1px solid rgba(214, 189, 152, 0.24) !important;
    box-shadow: none !important;
    background: #fff !important;
  }

  .approver-queue-filters-row .ant-select:hover .ant-select-selector,
  .approver-queue-filters-row .ant-select-focused .ant-select-selector,
  .approver-queue-filters-row .ant-picker:hover,
  .approver-queue-filters-row .ant-picker-focused {
    border-color: var(--color-primary-dark) !important;
  }

  .approver-queue-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .approver-queue-button.ant-btn {
    min-height: 42px !important;
    padding: 0 16px !important;
    border-radius: 8px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    box-shadow: none !important;
  }

  .approver-queue-button--primary.ant-btn {
    border: none !important;
    background: var(--ncb-primary-500) !important;
    color: #fff !important;
  }

  .approver-queue-button--primary.ant-btn:hover,
  .approver-queue-button--primary.ant-btn:focus,
  .approver-queue-button--primary.ant-btn:active {
    border: none !important;
    background: var(--ncb-primary-700) !important;
    color: #6b7280 !important;
  }

  .approver-queue-button--secondary.ant-btn {
    border: 1px solid rgba(214, 189, 152, 0.28) !important;
    background: #fff !important;
    color: var(--color-text-medium) !important;
  }

  .approver-queue-button--secondary.ant-btn:hover,
  .approver-queue-button--secondary.ant-btn:focus,
  .approver-queue-button--secondary.ant-btn:active {
    border-color: rgba(64, 83, 76, 0.24) !important;
    background: #fff !important;
    color: var(--color-text-dark) !important;
  }

  .approver-queue-button.ant-btn:disabled,
  .approver-queue-button.ant-btn[disabled] {
    border: none !important;
    background: #D1D5DB !important;
    border-color: #D1D5DB !important;
    color: #6b7280 !important;
  }

  .approver-queue-button.ant-btn:disabled span,
  .approver-queue-button.ant-btn[disabled] span {
    color: #fff !important;
  }

  .approver-queue-tabs .ant-tabs-nav {
    margin-bottom: 0;
    padding: 0 16px;
    background: var(--color-white);
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }

  .approver-queue-tabs .ant-tabs-nav::before {
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    display: block !important;
  }

  .approver-queue-tabs .ant-tabs-nav-wrap {
    overflow: auto;
  }

  .approver-queue-tabs .ant-tabs-tab {
    border: none !important;
    background: transparent !important;
    border-radius: 0 !important;
    padding: 14px 8px 12px !important;
    color: var(--color-text-light);
    font-size: 12px;
    font-weight: 500;
    margin: 0 24px 0 0 !important;
    transition: all 0.2s ease;
  }

  .approver-queue-tabs .ant-tabs-tab-active {
    background: transparent !important;
    border-color: transparent !important;
  }

  .approver-queue-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: var(--color-primary-dark) !important;
    font-weight: 400;
  }

  .approver-queue-tabs .ant-tabs-ink-bar {
    display: block !important;
    height: 2px !important;
    background: var(--color-primary-dark) !important;
    border-radius: 0 !important;
  }

  .approver-queue-tab-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .approver-queue-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(214, 189, 152, 0.18);
    border: none;
    color: var(--color-text-dark);
    font-size: 10px;
    font-weight: 400;
  }

  .approver-queue-table-shell {
    background: var(--color-white);
    border-radius: 8px;
    padding: 0 16px 16px;
  }

  .approver-queue-table-shell .ant-table,
  .approver-queue-table-shell .ant-table-wrapper,
  .approver-queue-table-shell .ant-spin-nested-loading,
  .approver-queue-table-shell .ant-spin-container,
  .approver-queue-table-shell .ant-table-container,
  .approver-queue-table-shell .ant-table-content,
  .approver-queue-table-shell table,
  .approver-queue-table-shell thead,
  .approver-queue-table-shell tbody,
  .approver-queue-table-shell tr {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .approver-queue-table-shell .ant-table-thead > tr > th {
    background: transparent !important;
    color: var(--color-text-dark) !important;
    font-size: 11px;
    font-weight: 400;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    border-right: none !important;
    line-height: 1.2;
    padding: 14px 12px !important;
  }

  .approver-queue-table-shell .ant-table-tbody > tr > td {
    background: transparent !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
    border-top: none !important;
    border-right: none !important;
    color: var(--color-text-dark);
    padding: 16px 12px !important;
    font-size: 12px;
    line-height: 1.25;
  }

  .approver-queue-table-shell .ant-table-thead > tr > th::before,
  .approver-queue-table-shell .ant-table-cell::before,
  .approver-queue-table-shell .ant-table-cell::after,
  .approver-queue-table-shell .ant-table-wrapper::before,
  .approver-queue-table-shell .ant-table-wrapper::after,
  .approver-queue-table-shell .ant-table-container::before,
  .approver-queue-table-shell .ant-table-container::after,
  .approver-queue-table-shell .ant-table-thead > tr::after,
  .approver-queue-table-shell .ant-table-tbody > tr::after {
    display: none !important;
  }

  .approver-queue-table-shell .ant-table-tbody > tr:hover > td {
    background: rgba(214, 189, 152, 0.12) !important;
  }

  .approver-queue-table-shell .ant-table-tbody > tr > td:first-child,
  .approver-queue-table-shell .ant-table-thead > tr > th:first-child {
    padding-left: 0 !important;
  }

  .approver-queue-table-shell .ant-table-tbody > tr > td:last-child,
  .approver-queue-table-shell .ant-table-thead > tr > th:last-child {
    padding-right: 0 !important;
  }

  .approver-queue-table-shell .ant-pagination-item-active {
    border-color: rgba(214, 189, 152, 0.18) !important;
    background: rgba(214, 189, 152, 0.18) !important;
  }

  .approver-queue-table-shell .ant-pagination-item-active a {
    color: var(--color-text-dark) !important;
    font-weight: 400;
  }

  .approver-queue-table-shell .ant-pagination {
    margin-top: 18px !important;
    margin-bottom: 0 !important;
  }

  .approver-queue-table-shell .ant-pagination .ant-pagination-item,
  .approver-queue-table-shell .ant-pagination .ant-pagination-prev,
  .approver-queue-table-shell .ant-pagination .ant-pagination-next {
    border-radius: 999px !important;
    border-color: transparent !important;
    background: transparent !important;
    min-width: 34px;
  }

  @media (max-width: 1200px) {
    .approver-queue-filters-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 768px) {
    .approver-queue-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .approver-queue-search {
      width: 100%;
    }

    .approver-queue-filters-row {
      grid-template-columns: minmax(0, 1fr);
    }

    .approver-queue-actions {
      justify-content: stretch;
    }

    .approver-queue-actions .ant-btn {
      flex: 1;
    }

    .approver-queue-tabs .ant-tabs-nav {
      padding: 0;
    }

    .approver-queue-tabs .ant-tabs-tab {
      margin-right: 22px !important;
      padding-top: 12px !important;
      padding-bottom: 10px !important;
      font-size: 12px;
    }
  }
`;

const MyQueue = ({ initialTab = "deferrals" }) => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const {
    deferrals,
    isLoading,
    queueExtensions,
    extensionsLoading,
    refetchDeferrals,
    refetchExtensions,
  } = useMyQueueData();

  const {
    selectedDeferral,
    setSelectedDeferral,
    modalOpen,
    setModalOpen,
    selectedExtension,
    extensionModalOpen,
    detailOverrides,
    handleOpenExtensionDetails,
    handleCloseModal,
    handleCloseExtensionModal,
  } = useMyQueueModal();

  const { activeTab, handleTabChange } = useMyQueueTabs(initialTab);

  const {
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    filteredDeferrals,
    resetFilters,
    hasActiveFilters,
  } = useMyQueueFilters(deferrals);

  const {
    searchText: extensionSearchText,
    setSearchText: setExtensionSearchText,
    filteredExtensions,
    resetFilters: resetExtensionFilters,
  } = useExtensionFilters(queueExtensions);

  const {
    handleApprove,
    handleReject,
    handleReturnForRework,
    handleSendReminder,
  } = useMyQueueActions((action) => {
    if (action === "approved" || action === "rejected") {
      handleCloseModal();
      refetchDeferrals();
    }
  });

  const [extensionApproveLoading, setExtensionApproveLoading] = useState(false);
  const [extensionRejectLoading, setExtensionRejectLoading] = useState(false);
  const [extensionReworkLoading, setExtensionReworkLoading] = useState(false);

  // Draft management
  const [draftsList, setDraftsList] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);

  // Load drafts
  const loadDrafts = useCallback(() => {
    setDraftsLoading(true);
    try {
      const allDrafts = getDrafts('deferral');
      setDraftsList(allDrafts);
    } catch (err) {
      console.error('Error loading drafts:', err);
      message.error('Failed to load drafts');
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  // Load drafts on mount and when tab changes to drafts
  useEffect(() => {
    if (activeTab === 'drafts') {
      loadDrafts();
    }
  }, [activeTab, loadDrafts]);

  const handleRestoreDraft = (draft) => {
    navigate(`/rm/deferrals/request?draftId=${encodeURIComponent(draft.id)}`);
  };

  const handleDeleteDraftFromList = (draftId) => {
    Modal.confirm({
      title: 'Delete Draft',
      content: 'Are you sure you want to delete this draft? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk() {
        try {
          deleteDraft(draftId);
          setDraftsList(draftsList.filter(d => d.id !== draftId));
          message.success('Draft deleted successfully');
        } catch (err) {
          console.error('Error deleting draft:', err);
          message.error('Failed to delete draft');
        }
      },
    });
  };

  const handleOpenDeferralDetails = (deferral) => {
    setSelectedDeferral(deferral);
    setModalOpen(true);
  };

  const handleApproveExtension = useCallback(async (comment = "") => {
    if (!selectedExtension || (!selectedExtension._id && !selectedExtension.id)) {
      message.error("Invalid extension selected");
      return;
    }

    setExtensionApproveLoading(true);
    try {
      const extId = selectedExtension._id || selectedExtension.id;
      const res = await fetch(`${API_BASE_URL}/extensions/${extId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
          body: JSON.stringify({ comment }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to approve extension";
        try {
          const body = await res.json();
          errorMsg = body?.message || body?.error || errorMsg;
        } catch {
          errorMsg = await res.text();
        }

        if (res.status === 403) {
          throw new Error("Forbidden: you are not authorized to approve this extension");
        }
        throw new Error(errorMsg);
      }

      const updated = await res.json();
      const updatedExtension = updated?.extension || updated;
      const updatedDeferral =
        updated?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      message.success(updated?.message || "Extension approved successfully");
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
        console.debug("Failed to dispatch extension:updated", eventError);
      }

      handleCloseExtensionModal();
      refetchDeferrals();
    } catch (error) {
      console.error("Extension approval error:", error);
      message.error(error.message || "Failed to approve extension");
    } finally {
      setExtensionApproveLoading(false);
    }
  }, [handleCloseExtensionModal, refetchDeferrals, selectedExtension, token]);

  const handleRejectExtension = useCallback(async (reason) => {
    if (!selectedExtension || (!selectedExtension._id && !selectedExtension.id)) {
      message.error("Invalid extension selected");
      return;
    }

    if (!reason || reason.trim() === "") {
      message.error("Please provide a rejection reason");
      return;
    }

    setExtensionRejectLoading(true);
    try {
      const extId = selectedExtension._id || selectedExtension.id;
      const res = await fetch(`${API_BASE_URL}/extensions/${extId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to reject extension";
        try {
          const body = await res.json();
          errorMsg = body?.message || body?.error || errorMsg;
        } catch {
          errorMsg = await res.text();
        }

        if (res.status === 403) {
          throw new Error("Forbidden: you are not authorized to reject this extension");
        }
        throw new Error(errorMsg);
      }

      const updated = await res.json();
      const updatedExtension = updated?.extension || updated;
      const updatedDeferral =
        updated?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      message.success(updated?.message || "Extension rejected successfully");
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
        console.debug("Failed to dispatch extension:updated", eventError);
      }

      handleCloseExtensionModal();
      refetchDeferrals();
    } catch (error) {
      console.error("Extension rejection error:", error);
      message.error(error.message || "Failed to reject extension");
    } finally {
      setExtensionRejectLoading(false);
    }
  }, [handleCloseExtensionModal, refetchDeferrals, selectedExtension, token]);

  const handleReturnExtensionForRework = useCallback(async (reason) => {
    if (!selectedExtension || (!selectedExtension._id && !selectedExtension.id)) {
      message.error("Invalid extension selected");
      return;
    }

    if (!reason || reason.trim() === "") {
      message.error("Please provide rework instructions");
      return;
    }

    setExtensionReworkLoading(true);
    try {
      const extId = selectedExtension._id || selectedExtension.id;
      const res = await fetch(`${API_BASE_URL}/extensions/${extId}/return-for-rework`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to return extension for rework";
        try {
          const body = await res.json();
          errorMsg = body?.message || body?.error || errorMsg;
        } catch {
          errorMsg = await res.text();
        }

        if (res.status === 403) {
          throw new Error("Forbidden: you are not authorized to return this extension for rework");
        }
        throw new Error(errorMsg);
      }

      const updated = await res.json();
      const updatedExtension = updated?.extension || updated;
      const updatedDeferral =
        updated?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      message.success(updated?.message || "Extension returned for rework successfully");
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
        console.debug("Failed to dispatch extension:updated", eventError);
      }

      handleCloseExtensionModal();
      refetchDeferrals();
    } catch (error) {
      console.error("Extension return-for-rework error:", error);
      message.error(error.message || "Failed to return extension for rework");
    } finally {
      setExtensionReworkLoading(false);
    }
  }, [handleCloseExtensionModal, refetchDeferrals, selectedExtension, token]);

  const handleModalAction = (action) => {
    switch (action) {
      case "refreshQueue":
        refetchDeferrals();
        break;
      case "gotoActioned":
        handleCloseModal();
        navigate("/approver/actioned");
        break;
      case "approve":
        handleApprove(selectedDeferral);
        break;
      case "reject":
        handleReject(selectedDeferral);
        break;
      case "returnForRework":
        handleReturnForRework(selectedDeferral);
        break;
      case "remindApprover":
        handleSendReminder(selectedDeferral);
        break;
      default:
        break;
    }
  };

  const deferralColumns = getDeferralColumns();
  const showDeferralDetails = modalOpen && !!selectedDeferral && !extensionModalOpen;
  const showExtensionDetails = extensionModalOpen && !!selectedExtension;

  const renderTabLabel = (label, count) => (
    <span className="approver-queue-tab-label">
      <span>{label}</span>
      <span className="approver-queue-tab-count">{count}</span>
    </span>
  );

  return (
    <div className="approver-queue-page creator-theme">
      <style>{queuePageStyles}</style>
      <div className="approver-queue-shell">
        <div className="approver-queue-card">
          {showDeferralDetails ? (
            <DeferralDetailsModal
              deferral={selectedDeferral}
              extension={selectedExtension}
              open={modalOpen}
              onClose={handleCloseModal}
              onAction={handleModalAction}
              token={token}
              headerTag={detailOverrides?.headerTag}
              overrideDaysSought={detailOverrides?.overrideDaysSought}
              overrideNextDueDate={detailOverrides?.overrideNextDueDate}
              readOnly={detailOverrides?.readOnly}
              overrideApprovals={detailOverrides?.overrideApprovals}
            />
          ) : showExtensionDetails ? (
            <ExtensionApplicationModal
              selectedExtension={selectedExtension}
              open={extensionModalOpen}
              onClose={handleCloseExtensionModal}
              onApprove={handleApproveExtension}
              onReject={handleRejectExtension}
              onReturnForRework={handleReturnExtensionForRework}
              approveLoading={extensionApproveLoading}
              rejectLoading={extensionRejectLoading}
              reworkLoading={extensionReworkLoading}
            />
          ) : (
            <>
              <div className="approver-queue-toolbar">
                <div>
                  <h2 className="approver-queue-title">My Queue</h2>
                  <p className="approver-queue-copy">
                    Review pending deferrals and extension applications from one workspace.
                  </p>
                </div>
                <Input
                  placeholder="Search deferrals or extensions"
                  prefix={<SearchOutlined />}
                  value={activeTab === "deferrals" ? searchText : extensionSearchText}
                  onChange={(e) => {
                    if (activeTab === "deferrals") {
                      setSearchText(e.target.value);
                    } else {
                      setExtensionSearchText(e.target.value);
                    }
                  }}
                  allowClear
                  className="approver-queue-search"
                />
              </div>

              <Tabs
                className="approver-queue-tabs"
                activeKey={activeTab}
                onChange={handleTabChange}
                items={[
                  {
                    key: "deferrals",
                    label: renderTabLabel("Deferrals", filteredDeferrals.length),
                    children: (
                      <div>
                      <div className="approver-queue-filters-row">
                        <Select
                          placeholder="Status"
                          value={statusFilter}
                          onChange={setStatusFilter}
                          size="large"
                          options={[
                            { label: "All statuses", value: "all" },
                            { label: "Pending approval", value: "pending_approval" },
                            { label: "In review", value: "in_review" },
                          ]}
                        />
                        <RangePicker
                          value={dateRange.length === 2 ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                          onChange={(dates) => {
                            if (dates) {
                              setDateRange([dates[0].toDate(), dates[1].toDate()]);
                            } else {
                              setDateRange([]);
                            }
                          }}
                          size="large"
                        />
                        <div className="approver-queue-actions">
                          <Button
                            className="approver-queue-button approver-queue-button--primary"
                            icon={<ReloadOutlined />}
                            onClick={refetchDeferrals}
                            loading={isLoading}
                            size="large"
                          >
                            Refresh
                          </Button>
                          {hasActiveFilters && (
                            <Button className="approver-queue-button approver-queue-button--secondary" onClick={resetFilters} size="large">
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </div>

                      {isLoading ? (
                        <div className="creator-tab-loading">
                          <Spin />
                        </div>
                      ) : filteredDeferrals.length === 0 ? (
                        <div className="creator-tab-empty">
                          <Empty description="No pending deferrals" />
                        </div>
                      ) : (
                        <div className="approver-queue-table-shell">
                          <Table
                            columns={deferralColumns}
                            dataSource={filteredDeferrals}
                            rowKey={(record) => record._id || record.id}
                            tableLayout="fixed"
                            pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: ["5", "10", "20", "50"] }}
                            scroll={{ x: 720 }}
                            onRow={(record) => ({
                              onClick: () => handleOpenDeferralDetails(record),
                              style: { cursor: "pointer" },
                            })}
                          />
                        </div>
                      )}
                      </div>
                    ),
                  },
                  {
                    key: "extensions",
                    label: renderTabLabel("Extensions", filteredExtensions.length),
                    children: (
                      <div>
                      <div className="approver-queue-filters-row" style={{ gridTemplateColumns: "minmax(220px, 1.2fr) auto" }}>
                        <div className="approver-queue-actions">
                          <Button
                            className="approver-queue-button approver-queue-button--primary"
                            icon={<ReloadOutlined />}
                            onClick={refetchExtensions}
                            loading={extensionsLoading}
                            size="large"
                          >
                            Refresh
                          </Button>
                          {extensionSearchText && (
                            <Button className="approver-queue-button approver-queue-button--secondary" onClick={resetExtensionFilters} size="large">
                              Clear Search
                            </Button>
                          )}
                        </div>
                      </div>

                        <ExtensionApplicationsTab
                          extensions={filteredExtensions}
                          loading={extensionsLoading}
                          onOpenExtensionDetails={handleOpenExtensionDetails}
                          tableClassName="approver-queue-table-shell"
                        />
                      </div>
                    ),
                  },
                  {
                    key: "drafts",
                    label: renderTabLabel("Drafts", draftsList.length),
                    children: (
                      <div>
                      <div className="approver-queue-filters-row" style={{ gridTemplateColumns: "minmax(220px, 1.2fr) auto" }}>
                        <div className="approver-queue-actions">
                          <Button
                            className="approver-queue-button approver-queue-button--primary"
                            icon={<ReloadOutlined />}
                            onClick={loadDrafts}
                            loading={draftsLoading}
                            size="large"
                          >
                            Refresh
                          </Button>
                        </div>
                      </div>

                      {draftsLoading ? (
                        <div className="creator-tab-loading">
                          <Spin />
                        </div>
                      ) : draftsList.length === 0 ? (
                        <div className="creator-tab-empty">
                          <Empty description="No saved deferral drafts" />
                        </div>
                      ) : (
                        <div className="approver-queue-table-shell">
                          <Table
                            columns={[
                              {
                                title: "Customer",
                                dataIndex: ["data", "customerName"],
                                key: "customerName",
                                render: (text) => text || "N/A",
                              },
                              {
                                title: "DCL #",
                                dataIndex: ["data", "dclNumber"],
                                key: "dclNumber",
                                render: (text) => text || "N/A",
                              },
                              {
                                title: "Loan Amount",
                                dataIndex: ["data", "loanAmount"],
                                key: "loanAmount",
                                render: (text) => (text ? `$${Number(text).toLocaleString()}` : "N/A"),
                              },
                              {
                                title: "Saved",
                                dataIndex: "updatedAt",
                                key: "updatedAt",
                                render: (text) => formatDraftDate(text),
                              },
                              {
                                title: "Actions",
                                key: "actions",
                                render: (_, record) => (
                                  <Space size="small">
                                    <Button
                                      type="primary"
                                      size="small"
                                      onClick={() => handleRestoreDraft(record)}
                                    >
                                      Restore
                                    </Button>
                                    <Button
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleDeleteDraftFromList(record.id)}
                                    />
                                  </Space>
                                ),
                              },
                            ]}
                            dataSource={draftsList}
                            rowKey={(record) => record.id}
                            tableLayout="fixed"
                            pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: ["5", "10", "20", "50"] }}
                            scroll={{ x: 720 }}
                          />
                        </div>
                      )}
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyQueue;