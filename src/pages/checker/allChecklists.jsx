// export default AllChecklists;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Button, Input, Select, Tabs, Spin, Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ChecklistsPage from "./ChecklistsPage.jsx";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";
import {
  useGetAllCoCreatorChecklistsQuery,
  useGetCheckerMyQueueQuery,
} from "../../api/checklistApi.js";
import { showLockToast } from "../../utils/authToast";
import "../../styles/creatorDesignSystem.css";

const { TabPane } = Tabs;

const getQueueStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus === "rejected") {
    return { label: "Rejected", variant: "rework" };
  }

  if (["cocreatorreview", "co_creator_review", "pending"].includes(normalizedStatus)) {
    return { label: "Pending", variant: "pending" };
  }

  if (["rmreview", "rm_review"].includes(normalizedStatus)) {
    return { label: "RM Review", variant: "qs-review" };
  }

  if (["cocheckerreview", "co_checker_review"].includes(normalizedStatus)) {
    return { label: "Checker Review", variant: "qs-review" };
  }

  return {
    label: (status || "In Progress").replace(/_/g, " "),
    variant: "qs-review",
  };
};

const matchesActiveTab = (status, activeTab) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (activeTab === "assigned" || activeTab === "all") {
    return normalizedStatus === "co_checker_review" || normalizedStatus === "cocheckerreview";
  }

  return normalizedStatus === activeTab;
};

const AllChecklists = ({ userId, draftToRestore = null, setDraftToRestore = null }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("assigned");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");

  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      const draftChecklist = {
        id: draftToRestore.data.checklistId || draftToRestore.id,
        _id: draftToRestore.data.checklistId || draftToRestore.id,
        dclNo: draftToRestore.data.dclNo,
        title: draftToRestore.data.title,
        customerName: draftToRestore.data.customerName,
        customerNumber: draftToRestore.data.customerNumber,
        loanType: draftToRestore.data.loanType,
        status: draftToRestore.data.status,
        documents: draftToRestore.data.documents || [],
      };

      const restoreId = window.setTimeout(() => {
        setSelectedChecklist(draftChecklist);
      }, 0);

      if (setDraftToRestore) {
        setDraftToRestore(null);
      }

      return () => window.clearTimeout(restoreId);
    }

    return undefined;
  }, [draftToRestore, setDraftToRestore]);

  const { data: myChecklists = [], refetch, isLoading } =
    useGetCheckerMyQueueQuery(userId, {
      skip: !userId,
      pollingInterval: 2000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    });
  const { data: allChecklists = [], isLoading: isLoadingAllChecklists } =
    useGetAllCoCreatorChecklistsQuery(undefined, {
      pollingInterval: 2000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    });

  console.log("🔍 All Checklists for Co-Checker:", myChecklists);
  console.log("📋 Total checklists fetched:", myChecklists.length);
  console.log("👤 Current User ID:", userId);

  const getLockMeta = useCallback(
    (checklist) => {
      const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
      const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
      const isLockedBySomeoneElse = !!lockedByUserId && lockedByUserId !== userId;
      const isLockedByMe = !!lockedByUserId && lockedByUserId === userId;

      return {
        lockedByUserId,
        lockedByUserName,
        isLockedBySomeoneElse,
        isLockedByMe,
      };
    },
    [userId],
  );

  const openChecklist = useCallback(
    (checklist) => {
      const { isLockedBySomeoneElse, lockedByUserName } = getLockMeta(checklist);

      if (isLockedBySomeoneElse) {
        showLockToast(lockedByUserName || "another user");
        return;
      }

      setSelectedChecklist(checklist);
    },
    [getLockMeta],
  );

  const applyCommonFilters = useCallback(
    (checklists) =>
      checklists.filter((checklist) => {
      const searchTarget = [
        checklist.dclNo,
        checklist.customerName,
        checklist.customerNumber,
        checklist.loanType,
        checklist.assignedToChecker?.name,
        checklist.assignedToRM?.name,
        checklist.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchText || searchTarget.includes(searchText.toLowerCase());

      const normalizedStatus = String(checklist.status || "")
        .trim()
        .toLowerCase();
      const matchesStatus = matchesActiveTab(normalizedStatus, activeTab);

      const normalizedLoanType = String(checklist.loanType || "")
        .trim()
        .toLowerCase();
      const matchesLoanType =
        loanTypeFilter === "all" || normalizedLoanType === loanTypeFilter;

        return matchesSearch && matchesStatus && matchesLoanType;
      }),
    [activeTab, loanTypeFilter, searchText],
  );

  const assignedReviewChecklists = useMemo(
    () => applyCommonFilters(myChecklists),
    [applyCommonFilters, myChecklists],
  );

  const allReviewChecklists = useMemo(
    () => applyCommonFilters(allChecklists),
    [allChecklists, applyCommonFilters],
  );

  const statusCounts = useMemo(
    () => ({
      assigned: myChecklists.filter((item) => {
        const value = String(item.status || "").trim().toLowerCase();
        return value === "co_checker_review" || value === "cocheckerreview";
      }).length,
      all: allChecklists.filter((item) => {
        const value = String(item.status || "").trim().toLowerCase();
        return value === "co_checker_review" || value === "cocheckerreview";
      }).length,
    }),
    [allChecklists, myChecklists],
  );

  const loanTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myChecklists
            .map((item) => item.loanType)
            .filter(Boolean)
            .map((value) => value.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [myChecklists],
  );

  const clearFilters = () => {
    setSearchText("");
    setActiveTab("assigned");
    setLoanTypeFilter("all");
  };

  const renderTabLabel = (label, count) => (
    <span className="creator-tab-label">
      <span>{label}</span>
      <span className="creator-tab-count">{count}</span>
    </span>
  );

  const columns = [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="creator-table-primary-cell">
          <span className="creator-table-primary-value">{text || "-"}</span>
          <span className="creator-table-secondary-value">Document checklist</span>
        </div>
      ),
    },
    {
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 146,
      ellipsis: true,
      render: (text) => <span className="creator-table-primary-value">{text || "-"}</span>,
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 134,
      ellipsis: true,
      render: (text) => <span className="creator-table-muted">{text || "-"}</span>,
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => <span className="creator-table-muted">{text || "-"}</span>,
    },
    {
      title: "ASSIGNED RM",
      dataIndex: "assignedToRM",
      width: 122,
      ellipsis: true,
      render: (rm) => <span className="creator-table-muted">{rm?.name || "Not Assigned"}</span>,
    },
    {
      title: "DOCS",
      dataIndex: "documents",
      width: 74,
      align: "center",
      render: (docs = []) => {
        const total = docs.reduce((sum, documentItem) => {
          if (Array.isArray(documentItem?.docList)) {
            return sum + documentItem.docList.length;
          }

          return sum + 1;
        }, 0);

        return <span className="creator-table-primary-value">{total}</span>;
      },
    },
    {
      title: "STATUS",
      width: 96,
      ellipsis: true,
      render: (_, record) => {
        const statusMeta = getQueueStatusMeta(record.status);

        return (
          <span className={`creator-badge creator-badge--${statusMeta.variant}`}>
            {statusMeta.label}
          </span>
        );
      },
    },
    {
      title: "LOCK",
      width: 136,
      ellipsis: true,
      render: (_, record) => {
        const { isLockedByMe, isLockedBySomeoneElse, lockedByUserName } = getLockMeta(record);

        if (isLockedByMe) {
          return <span className="creator-lock-badge creator-lock-badge--mine">Locked by you</span>;
        }

        if (isLockedBySomeoneElse) {
          return (
            <span className="creator-lock-badge creator-lock-badge--locked" title={lockedByUserName || "Locked"}>
              {`Locked by ${lockedByUserName || "user"}`}
            </span>
          );
        }

        return <span className="creator-lock-badge creator-lock-badge--open">Available</span>;
      },
    },
  ];

  const customTableStyles = `
    .creator-queue-page {
      min-height: 100%;
      width: 100%;
      background: var(--color-bg);
      font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
    }
    .creator-queue-shell {
      width: 100%;
    }
    .creator-queue-card {
      background: var(--color-white);
      border: 1px solid rgba(214, 189, 152, 0.2);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
      overflow: hidden;
    }
    .creator-queue-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 16px;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-bg);
    }
    .creator-queue-title {
      color: var(--color-text-dark);
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .creator-queue-toolbar-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      flex: 1;
      flex-wrap: wrap;
    }
    .creator-queue-search {
      width: min(360px, 100%);
    }
    .creator-queue-search.ant-input-affix-wrapper,
    .creator-queue-filter.ant-select .ant-select-selector {
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      border-radius: 6px !important;
      box-shadow: none !important;
    }
    .creator-queue-search.ant-input-affix-wrapper {
      padding: 8px 12px !important;
    }
    .creator-queue-filter {
      min-width: 180px;
    }
    .creator-queue-filter.ant-select {
      height: 38px;
    }
    .creator-queue-filter.ant-select .ant-select-selector {
      min-height: 38px !important;
      padding: 4px 12px !important;
    }
    .creator-queue-search.ant-input-affix-wrapper:hover,
    .creator-queue-search.ant-input-affix-wrapper:focus,
    .creator-queue-search.ant-input-affix-wrapper-focused,
    .creator-queue-filter.ant-select:hover .ant-select-selector,
    .creator-queue-filter.ant-select-focused .ant-select-selector {
      border-color: var(--color-primary-dark) !important;
    }
    .creator-queue-search input {
      background: transparent !important;
      font-size: 12px !important;
      color: var(--color-text-medium) !important;
    }
    .creator-queue-search .anticon,
    .creator-queue-filter .ant-select-arrow {
      color: var(--color-text-light);
    }
    .creator-queue-clear {
      height: 38px;
      border-radius: 6px;
      border-color: rgba(214, 189, 152, 0.28);
      color: var(--color-text-medium);
      font-size: 12px;
      font-weight: 600;
      box-shadow: none;
    }
    .creator-tabs .ant-tabs-nav {
      margin-bottom: 0;
      padding: 0 16px;
      background: var(--color-white);
      border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    }
    .creator-tabs .ant-tabs-nav::before {
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      display: block !important;
    }
    .creator-tabs .ant-tabs-nav-wrap {
      overflow: auto;
    }
    .creator-tabs .ant-tabs-tab {
      border: none !important;
      background: transparent !important;
      border-radius: 0 !important;
      padding: 14px 8px 12px !important;
      color: var(--color-text-light);
      font-size: 12px;
      font-weight: 500;
      margin: 0 24px 0 0 !important;
    }
    .creator-tab-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .creator-tabs .ant-tabs-tab-active {
      background: transparent !important;
      border-color: transparent !important;
    }
    .creator-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: var(--color-primary-dark) !important;
      font-weight: 600;
    }
    .creator-tabs .ant-tabs-ink-bar {
      display: block !important;
      height: 2px !important;
      background: var(--color-primary-dark) !important;
      border-radius: 0 !important;
    }
    .creator-tab-count {
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
      font-weight: 700;
    }
    .creator-tab-loading,
    .creator-tab-empty {
      padding: 24px 16px;
      background: var(--color-white);
    }
    .myqueue-table {
      background: var(--color-white);
      border-radius: 8px;
      padding: 0 16px 16px;
    }
    .myqueue-table .ant-table,
    .myqueue-table .ant-table-wrapper,
    .myqueue-table .ant-spin-nested-loading,
    .myqueue-table .ant-spin-container,
    .myqueue-table .ant-table-container,
    .myqueue-table .ant-table-content,
    .myqueue-table table,
    .myqueue-table thead,
    .myqueue-table tbody,
    .myqueue-table tr {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .myqueue-table .ant-table {
      table-layout: fixed;
      width: 100%;
    }
    .myqueue-table .ant-table-container {
      background: inherit !important;
    }
    .myqueue-table .ant-table-content {
      overflow-x: hidden;
    }
    .myqueue-table .ant-table-header,
    .myqueue-table .ant-table-body,
    .myqueue-table .ant-table-placeholder,
    .myqueue-table .ant-empty,
    .myqueue-table .ant-empty-normal {
      background: inherit !important;
    }
    .myqueue-table .ant-table-thead > tr > th {
      background: transparent !important;
      color: var(--color-text-medium) !important;
      font-weight: 600;
      font-size: 11px;
      padding: 14px 12px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      border-right: none !important;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .myqueue-table .ant-table-tbody > tr > td {
      background: transparent !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
      border-top: none !important;
      border-right: none !important;
      padding: 16px 12px !important;
      font-size: 12px;
      color: var(--color-text-medium);
      line-height: 1.25;
    }
    .myqueue-table .ant-table-thead > tr > th::before,
    .myqueue-table .ant-table-cell::before,
    .myqueue-table .ant-table-cell::after,
    .myqueue-table .ant-table-wrapper::before,
    .myqueue-table .ant-table-wrapper::after,
    .myqueue-table .ant-table-container::before,
    .myqueue-table .ant-table-container::after,
    .myqueue-table .ant-table-thead > tr::after,
    .myqueue-table .ant-table-tbody > tr::after {
      display: none !important;
    }
    .myqueue-table .ant-table-tbody > tr:hover > td {
      background-color: rgba(214, 189, 152, 0.06) !important;
      cursor: pointer;
    }
    .myqueue-table .ant-table-tbody > tr > td:first-child,
    .myqueue-table .ant-table-thead > tr > th:first-child {
      padding-left: 0 !important;
    }
    .myqueue-table .ant-table-tbody > tr > td:last-child,
    .myqueue-table .ant-table-thead > tr > th:last-child {
      padding-right: 0 !important;
    }
    .myqueue-table .ant-pagination {
      margin-top: 18px !important;
      margin-bottom: 0 !important;
    }
    .myqueue-table .ant-pagination .ant-pagination-item,
    .myqueue-table .ant-pagination .ant-pagination-prev,
    .myqueue-table .ant-pagination .ant-pagination-next {
      border-radius: 999px !important;
      border-color: transparent !important;
      background: transparent !important;
      min-width: 34px;
    }
    .myqueue-table .ant-pagination .ant-pagination-item-active {
      background: rgba(214, 189, 152, 0.18) !important;
      border-color: rgba(214, 189, 152, 0.18) !important;
    }
    .myqueue-table .ant-pagination .ant-pagination-item-active a {
      color: var(--color-text-dark) !important;
      font-weight: 700;
    }
    .creator-table-primary-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .creator-table-primary-value {
      color: var(--color-text-dark);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .creator-table-secondary-value {
      color: var(--color-text-light);
      font-size: 8px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .creator-table-muted {
      color: var(--color-text-medium);
      font-size: 12px;
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .creator-lock-badge {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid transparent;
    }
    .creator-lock-badge--open {
      background: rgba(64, 83, 76, 0.08);
      color: var(--color-text-medium);
      border-color: rgba(64, 83, 76, 0.12);
    }
    .creator-lock-badge--mine {
      background: rgba(26, 54, 54, 0.12);
      color: var(--color-primary-dark);
      border-color: rgba(26, 54, 54, 0.16);
    }
    .creator-lock-badge--locked {
      background: rgba(185, 28, 28, 0.08);
      color: #991b1b;
      border-color: rgba(185, 28, 28, 0.14);
    }
    @media (max-width: 768px) {
      .creator-queue-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .creator-queue-toolbar-actions {
        justify-content: stretch;
      }
      .creator-queue-search,
      .creator-queue-filter,
      .creator-queue-clear {
        width: 100%;
      }
      .creator-tabs .ant-tabs-nav {
        padding: 0;
      }
      .creator-tabs .ant-tabs-tab {
        margin-right: 22px !important;
        padding-top: 12px !important;
        padding-bottom: 10px !important;
        font-size: 12px;
      }
      .myqueue-table .ant-table-thead > tr > th,
      .myqueue-table .ant-table-tbody > tr > td {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
      }
    }
  `;

  return (
    <div className="creator-queue-page creator-theme" style={{ boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>
      <style>{`
        .checker-allchecklists-inline-review {
          width: 100%;
          min-height: 100%;
          padding: 0;
          margin: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }
      `}</style>
      {/* Drawer for creating new DCL */}
      {selectedChecklist ? (
        <section className="checker-allchecklists-inline-review">
          <CheckerReviewChecklistModal
            checklist={selectedChecklist}
            embedded
            open={!!selectedChecklist}
            onClose={() => {
              setSelectedChecklist(null);
              refetch();
            }}
          />
        </section>
      ) : (
        <>
          {drawerOpen && (
            <ChecklistsPage
              open={drawerOpen}
              onClose={() => {
                setDrawerOpen(false);
                refetch();
              }}
              coCreatorId={userId}
            />
          )}

          <div className="creator-queue-shell">
            <div className="creator-queue-card">
              <div className="creator-queue-toolbar">
                <h2 className="creator-queue-title">My Queue</h2>
                <div className="creator-queue-toolbar-actions">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search DCL / Customer / Loan"
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="creator-queue-search"
                  />
                  <Select
                    value={loanTypeFilter}
                    onChange={setLoanTypeFilter}
                    className="creator-queue-filter"
                    options={[
                      { value: "all", label: "All loan types" },
                      ...loanTypeOptions.map((value) => ({
                        value: value.toLowerCase(),
                        label: value,
                      })),
                    ]}
                  />
                  <Button className="creator-queue-clear" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>

              <Tabs activeKey={activeTab} onChange={setActiveTab} className="creator-tabs">
                <TabPane tab={renderTabLabel("CO Checker Review", statusCounts.assigned)} key="assigned">
                  {isLoading ? (
                    <div className="creator-tab-loading">
                      <Spin style={{ display: "block", margin: 40 }} />
                    </div>
                  ) : assignedReviewChecklists.length === 0 ? (
                    <div className="creator-tab-empty">
                      <Empty description="No assigned co-checker review items" />
                    </div>
                  ) : (
                    <div className="myqueue-table">
                      <Table
                        columns={columns}
                        dataSource={assignedReviewChecklists}
                        rowKey={(record) => record.id || record._id || record.dclNo}
                        tableLayout="fixed"
                        scroll={{ x: 920 }}
                        pagination={{
                          pageSize: 5,
                          showSizeChanger: true,
                          pageSizeOptions: ["5", "10", "20", "50"],
                          position: ["bottomCenter"],
                        }}
                        onRow={(record) => ({
                          onClick: () => openChecklist(record),
                          style: { cursor: "pointer" },
                        })}
                      />
                    </div>
                  )}
                </TabPane>
                <TabPane tab={renderTabLabel("All", statusCounts.all)} key="all">
                  {isLoadingAllChecklists ? (
                    <div className="creator-tab-loading">
                      <Spin style={{ display: "block", margin: 40 }} />
                    </div>
                  ) : allReviewChecklists.length === 0 ? (
                    <div className="creator-tab-empty">
                      <Empty description="No co-checker review items in the system" />
                    </div>
                  ) : (
                    <div className="myqueue-table">
                      <Table
                        columns={columns}
                        dataSource={allReviewChecklists}
                        rowKey={(record) => record.id || record._id || record.dclNo}
                        tableLayout="fixed"
                        scroll={{ x: 920 }}
                        pagination={{
                          pageSize: 5,
                          showSizeChanger: true,
                          pageSizeOptions: ["5", "10", "20", "50"],
                          position: ["bottomCenter"],
                        }}
                        onRow={(record) => ({
                          onClick: () => openChecklist(record),
                          style: { cursor: "pointer" },
                        })}
                      />
                    </div>
                  )}
                </TabPane>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AllChecklists;
