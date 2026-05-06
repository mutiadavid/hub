import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, Tabs, Input, Button, Select, DatePicker, Space, Empty, Spin, message, Table, Descriptions, Typography } from "antd";
import { SearchOutlined, ReloadOutlined, CalendarOutlined, FilePdfOutlined, FileDoneOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
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

const { RangePicker } = DatePicker;

const queueSearchClassName = "w-full max-w-[360px] [&.ant-input-affix-wrapper]:rounded-md [&.ant-input-affix-wrapper]:border-[rgba(214,189,152,0.2)] [&.ant-input-affix-wrapper]:bg-white [&.ant-input-affix-wrapper]:px-3 [&.ant-input-affix-wrapper]:py-2 [&.ant-input-affix-wrapper]:shadow-none hover:[&.ant-input-affix-wrapper]:border-[var(--color-primary-dark)] focus:[&.ant-input-affix-wrapper]:border-[var(--color-primary-dark)] [&.ant-input-affix-wrapper-focused]:border-[var(--color-primary-dark)] [&.ant-input-affix-wrapper-focused]:shadow-none [&_input]:bg-transparent [&_input]:text-xs [&_input]:text-(--color-text-dark) [&_.anticon]:text-(--color-text-light) md:w-[min(360px,100%)]";

const baseFiltersRowClassName = "grid items-end gap-3 border-b border-[rgba(214,189,152,0.2)] bg-white p-4 [grid-template-columns:minmax(0,1fr)] min-[769px]:[grid-template-columns:repeat(2,minmax(0,1fr))] min-[1201px]:[grid-template-columns:minmax(220px,1.2fr)_repeat(2,minmax(180px,0.8fr))_auto] [&_.ant-select]:w-full [&_.ant-picker]:w-full [&_.ant-select-selector]:min-h-[46px] [&_.ant-select-selector]:items-center [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-[rgba(214,189,152,0.24)] [&_.ant-select-selector]:bg-white [&_.ant-select-selector]:shadow-none [&_.ant-picker]:min-h-[46px] [&_.ant-picker]:rounded-lg [&_.ant-picker]:border-[rgba(214,189,152,0.24)] [&_.ant-picker]:bg-white [&_.ant-picker]:shadow-none hover:[&_.ant-select-selector]:border-[var(--color-primary-dark)] hover:[&_.ant-picker]:border-[var(--color-primary-dark)] [&_.ant-select-focused_.ant-select-selector]:border-[var(--color-primary-dark)] [&_.ant-picker-focused]:border-[var(--color-primary-dark)]";

const compactFiltersRowClassName = "grid items-end gap-3 border-b border-[rgba(214,189,152,0.2)] bg-white p-4 [grid-template-columns:minmax(0,1fr)] min-[769px]:[grid-template-columns:minmax(220px,1.2fr)_auto]";

const queueActionsClassName = "flex flex-wrap justify-end gap-2.5 max-md:justify-stretch [&_.ant-btn]:max-md:flex-1";

const primaryQueueButtonClassName = "!min-h-[42px] !rounded-lg !border-0 !bg-[var(--ncb-primary-500)] !px-4 !text-xs !font-semibold !text-white !shadow-none hover:!bg-[var(--ncb-primary-700)] hover:!text-white focus:!bg-[var(--ncb-primary-700)] focus:!text-white active:!bg-[var(--ncb-primary-700)] active:!text-white disabled:!border-0 disabled:!border-[#D1D5DB] disabled:!bg-[#D1D5DB] disabled:!text-white [&>span]:!text-white disabled:[&>span]:!text-white";

const secondaryQueueButtonClassName = "!min-h-[42px] !rounded-lg !border !border-[rgba(214,189,152,0.28)] !bg-white !px-4 !text-xs !font-semibold !text-[var(--color-text-medium)] !shadow-none hover:!border-[rgba(64,83,76,0.24)] hover:!bg-white hover:!text-[var(--color-text-dark)] focus:!border-[rgba(64,83,76,0.24)] focus:!bg-white focus:!text-[var(--color-text-dark)] active:!border-[rgba(64,83,76,0.24)] active:!bg-white active:!text-[var(--color-text-dark)] disabled:!border-[#D1D5DB] disabled:!bg-[#D1D5DB] disabled:!text-white disabled:[&>span]:!text-white";

const queueTabsClassName = "[&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:border-b [&_.ant-tabs-nav]:border-[rgba(214,189,152,0.2)] [&_.ant-tabs-nav]:bg-white [&_.ant-tabs-nav]:px-4 max-md:[&_.ant-tabs-nav]:px-0 [&_.ant-tabs-nav-wrap]:overflow-auto [&_.ant-tabs-nav::before]:border-[rgba(214,189,152,0.2)] [&_.ant-tabs-tab]:mr-6 [&_.ant-tabs-tab]:rounded-none [&_.ant-tabs-tab]:border-none [&_.ant-tabs-tab]:bg-transparent [&_.ant-tabs-tab]:px-2 [&_.ant-tabs-tab]:pb-3 [&_.ant-tabs-tab]:pt-3.5 [&_.ant-tabs-tab]:text-xs [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-(--color-text-light) [&_.ant-tabs-tab]:transition-all max-md:[&_.ant-tabs-tab]:mr-[22px] max-md:[&_.ant-tabs-tab]:pb-2.5 max-md:[&_.ant-tabs-tab]:pt-3 [&_.ant-tabs-tab-active]:border-transparent [&_.ant-tabs-tab-active]:bg-transparent [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-normal [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-(--color-primary-dark) [&_.ant-tabs-ink-bar]:h-0.5 [&_.ant-tabs-ink-bar]:rounded-none [&_.ant-tabs-ink-bar]:bg-(--color-primary-dark)";

const queueTableShellClassName = "rounded-lg bg-white px-4 pb-4 [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:border-none [&_.ant-table-content]:bg-transparent [&_table]:border-none [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_tr]:border-none [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-thead>tr>th]:bg-transparent [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3.5 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-normal [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:leading-[1.2] [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr>td]:border-t-0 [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:bg-transparent [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:leading-[1.25] [&_.ant-table-tbody>tr>td]:text-(--color-text-dark) hover:[&_.ant-table-tbody>tr:hover>td]:bg-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-table-thead>tr>th::before]:hidden [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden [&_.ant-table-wrapper::before]:hidden [&_.ant-table-wrapper::after]:hidden [&_.ant-table-container::before]:hidden [&_.ant-table-container::after]:hidden [&_.ant-table-thead>tr::after]:hidden [&_.ant-table-tbody>tr::after]:hidden [&_.ant-pagination]:mb-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination_.ant-pagination-item]:min-w-[34px] [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-item]:bg-transparent [&_.ant-pagination_.ant-pagination-prev]:min-w-[34px] [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:bg-transparent [&_.ant-pagination_.ant-pagination-next]:min-w-[34px] [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-next]:bg-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active_a]:font-normal [&_.ant-pagination_.ant-pagination-item-active_a]:text-(--color-text-dark)";

const queueLoadingStateClassName = "flex min-h-[220px] items-center justify-center rounded-lg border border-[rgba(214,189,152,0.2)] bg-white";

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
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[rgba(214,189,152,0.18)] px-[5px] text-[10px] font-normal text-(--color-text-dark)">{count}</span>
    </span>
  );

  return (
    <div className="creator-theme min-h-full w-full bg-(--color-bg)">
      <div className="w-full">
        <div className="overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] bg-(--color-bg) p-4 max-md:flex-col max-md:items-stretch">
                <div>
                  <h2 className="m-0 text-[15px] font-normal leading-[1.2] tracking-[-0.02em] text-(--color-text-dark)">My Queue</h2>
                  <p className="m-0 text-xs leading-6 text-(--color-text-dark)">
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
                  className={queueSearchClassName}
                />
              </div>

              <Tabs
                className={queueTabsClassName}
                activeKey={activeTab}
                onChange={handleTabChange}
                items={[
                  {
                    key: "deferrals",
                    label: renderTabLabel("Deferrals", filteredDeferrals.length),
                    children: (
                      <div>
                      <div className={baseFiltersRowClassName}>
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
                        <div className={queueActionsClassName}>
                          <Button
                            className={primaryQueueButtonClassName}
                            icon={<ReloadOutlined />}
                            onClick={refetchDeferrals}
                            loading={isLoading}
                            size="large"
                          >
                            Refresh
                          </Button>
                          {hasActiveFilters && (
                            <Button className={secondaryQueueButtonClassName} onClick={resetFilters} size="large">
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </div>

                      {isLoading ? (
                        <div className={queueLoadingStateClassName}>
                          <Spin />
                        </div>
                      ) : filteredDeferrals.length === 0 ? (
                        <div className={queueLoadingStateClassName}>
                          <Empty description="No pending deferrals" />
                        </div>
                      ) : (
                        <div className={queueTableShellClassName}>
                          <Table
                            columns={deferralColumns}
                            dataSource={filteredDeferrals}
                            rowKey={(record) => record._id || record.id}
                            tableLayout="fixed"
                            pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: ["5", "10", "20", "50"] }}
                            scroll={{ x: 720 }}
                            onRow={(record) => ({
                              onClick: () => handleOpenDeferralDetails(record),
                              className: "cursor-pointer",
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
                      <div className={compactFiltersRowClassName}>
                        <div className={queueActionsClassName}>
                          <Button
                            className={primaryQueueButtonClassName}
                            icon={<ReloadOutlined />}
                            onClick={refetchExtensions}
                            loading={extensionsLoading}
                            size="large"
                          >
                            Refresh
                          </Button>
                          {extensionSearchText && (
                            <Button className={secondaryQueueButtonClassName} onClick={resetExtensionFilters} size="large">
                              Clear Search
                            </Button>
                          )}
                        </div>
                      </div>

                        <ExtensionApplicationsTab
                          extensions={filteredExtensions}
                          loading={extensionsLoading}
                          onOpenExtensionDetails={handleOpenExtensionDetails}
                          tableClassName={queueTableShellClassName}
                        />
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