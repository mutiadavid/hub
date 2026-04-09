// export default Myqueue;
import { useMemo, useState, useEffect } from "react";
import { Table, Spin, Empty, Tabs, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import {
  useGetChecklistsByCreatorQuery,
  useGetAllCoCreatorChecklistsQuery,
  useLockDclMutation,
} from "../../api/checklistApi";
import { useSelector } from "react-redux";
import { formatCommentTimestamp } from "../../utils/checklistUtils";
import { deleteDraft } from "../../utils/draftsUtils";
import { showLockToast } from "../../utils/authToast";
import "../../styles/creatorDesignSystem.css";

const { TabPane } = Tabs;

const getQueueStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (["cocreatorreview", "co_creator_review"].includes(normalizedStatus)) {
    return { label: "Co-Creator Review", variant: "pending" };
  }

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus === "rejected") {
    return { label: "Rejected", variant: "rework" };
  }

  if (normalizedStatus === "pending") {
    return { label: "Pending", variant: "pending" };
  }

  if (normalizedStatus === "rmreview") {
    return { label: "RM Review", variant: "qs-review" };
  }

  if (normalizedStatus === "cocheckerreview") {
    return { label: "Checker Review", variant: "qs-review" };
  }

  return {
    label: (status || "In Progress").replace(/_/g, " "),
    variant: "qs-review",
  };
};

const Myqueue = ({ draftToRestore = null, setDraftToRestore = null }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("co_creator_review"); // Default to CO Creator Review tab
  const [searchText, setSearchText] = useState("");

  const { user } = useSelector((state) => state.auth);
  const creatorId = user?.id || user?._id;

  const getLockMeta = (checklist) => {
    const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
    const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
    const isLockedBySomeoneElse = !!lockedByUserId && lockedByUserId !== creatorId;
    const isLockedByMe = !!lockedByUserId && lockedByUserId === creatorId;

    return {
      lockedByUserId,
      lockedByUserName,
      isLockedBySomeoneElse,
      isLockedByMe,
    };
  };

  // Fetch creator's checklists (with polling to keep lock status fresh)
  const {
    data: allChecklists = [],
    isLoading: isLoadingCreator,
    refetch: refetchCreatorChecklists,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
    // Poll every 2 seconds to keep lock badges fresh across sessions
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Fetch ALL DCLs in the system (for Active DCLs tab)
  const {
    data: allSystemDcls = [],
    isLoading: isLoadingUnassigned,
    refetch: refetchSystemDcls,
  } = useGetAllCoCreatorChecklistsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    // Poll every 2 seconds to keep lock badges fresh across sessions
    pollingInterval: 2000,
    refetchOnFocus: true,
  });

  console.log("Fetched all system DCLs:", allSystemDcls);

  // Lock DCL mutation
  const [lockDcl] = useLockDclMutation();

  // Restore drafts by opening the routed review page for the checklist.
  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      const checklistId = draftToRestore.data.checklistId || draftToRestore.id;

      if (checklistId) {
        deleteDraft(draftToRestore.id);
        navigate(`/cocreator/review/${checklistId}`, {
          state: {
            initialTab: "documents",
            source: "drafts",
            restoredDraft: draftToRestore,
          },
        });
      }

      if (setDraftToRestore) {
        setDraftToRestore(null);
      }
    }
  }, [draftToRestore, navigate, setDraftToRestore]);

  // Lock when needed, then open the routed review page.
  const handleSelectChecklist = async (checklist) => {
    const checklistId = checklist?.id || checklist?._id;
    const { isLockedBySomeoneElse, lockedByUserName } = getLockMeta(checklist);

    if (!checklistId) {
      return;
    }

    if (isLockedBySomeoneElse) {
      showLockToast(lockedByUserName || "another user");
      return;
    }

    // Lock DCL for both active/unassigned and co-creator review tabs
    if (activeTab === "unassigned" || activeTab === "co_creator_review") {
      try {
        await lockDcl(checklistId).unwrap();
        console.log("DCL locked:", checklist.dclNo);

        // Refetch data to update lock status across all tabs
        refetchCreatorChecklists();
        refetchSystemDcls();
      } catch (error) {
        console.error("Failed to lock DCL:", error);
        if (error?.data?.lockedByUserId) {
          showLockToast(error?.data?.lockedByUserName || "another user");
          refetchCreatorChecklists();
          refetchSystemDcls();
          return;
        }
      }
    }

    navigate(`/cocreator/review/${checklistId}`, {
      state: { initialTab: "documents", source: "myqueue" },
    });
  };

  /* ---------------- UNASSIGNED DCLS QUEUE (NEW TAB) ---------------- */
  const unassignedQueue = useMemo(() => {
    let filtered = allSystemDcls.filter((c) => {
      const status = (c.status || "").toLowerCase();
      return status === "cocreatorreview";
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [allSystemDcls, searchText]);

  /* ---------------- CO_CREATOR_REVIEW QUEUE ---------------- */
  const coCreatorReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "cocreatorreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  /* ---------------- RM_REVIEW QUEUE ---------------- */
  const rmReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "rmreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  /* ---------------- CO_CHECKER_REVIEW QUEUE ---------------- */
  const coCheckerReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "cocheckerreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  const tabCounts = useMemo(
    () => ({
      co_creator_review: allChecklists.filter(
        (c) => (c.status || "").toLowerCase() === "cocreatorreview",
      ).length,
      rm_review: allChecklists.filter(
        (c) => (c.status || "").toLowerCase() === "rmreview",
      ).length,
      co_checker_review: allChecklists.filter(
        (c) => (c.status || "").toLowerCase() === "cocheckerreview",
      ).length,
      unassigned: allSystemDcls.filter(
        (c) => (c.status || "").toLowerCase() === "cocreatorreview",
      ).length,
    }),
    [allChecklists, allSystemDcls],
  );

  const renderTabLabel = (label, count) => (
    <span className="creator-tab-label">
      <span>{label}</span>
      <span className="creator-tab-count">{count}</span>
    </span>
  );

  /* ---------------- TABLE COLUMNS ---------------- */
  const getColumns = () => [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="creator-table-primary-cell">
          <span className="creator-table-primary-value">{text || "-"}</span>
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
      title: "TIME/DATE CREATED",
      dataIndex: "createdAt",
      width: 142,
      ellipsis: true,
      render: (value, record) => (
        <span className="creator-table-muted">
          {formatCommentTimestamp(value || record.createdAt || record.updatedAt) || "-"}
        </span>
      ),
    },
    {
      title: "IBPS NO",
      dataIndex: "ibpsNo",
      width: 98,
      ellipsis: true,
      render: (text) => (
        <span className="creator-table-muted" style={{ fontFamily: "monospace" }}>
          {text || "Not set"}
        </span>
      ),
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
      title: "Docs",
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
    .creator-queue-search {
      width: min(360px, 100%);
    }
    .creator-queue-search.ant-input-affix-wrapper {
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      box-shadow: none !important;
    }
    .creator-queue-search.ant-input-affix-wrapper:hover,
    .creator-queue-search.ant-input-affix-wrapper:focus,
    .creator-queue-search.ant-input-affix-wrapper-focused {
      border-color: var(--color-primary-dark) !important;
      box-shadow: none !important;
    }
    .creator-queue-search input {
      background: transparent !important;
      font-size: 12px !important;
      color: var(--color-text-medium) !important;
    }
    .creator-queue-search .anticon {
      color: var(--color-text-light);
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
    .creator-tab-empty,
    .creator-tab-loading {
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
      .creator-queue-shell {
        padding: 0;
      }
      .creator-queue-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .creator-queue-search {
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
      <div className="creator-queue-shell">
        <div className="creator-queue-card">
          <div className="creator-queue-toolbar">
            <h2 className="creator-queue-title">My Queue</h2>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search DCL / Customer / Loan"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="creator-queue-search"
            />
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} className="creator-tabs">
        {/* NEW TAB: Unassigned DCLs */}

        <TabPane tab={renderTabLabel("CO Creator Review", tabCounts.co_creator_review)} key="co_creator_review">
          {isLoadingCreator ? (
            <div className="creator-tab-loading">
              <Spin style={{ display: "block", margin: 40 }} />
            </div>
          ) : coCreatorReviewQueue.length === 0 ? (
            <div className="creator-tab-empty">
              <Empty description="No pending items" />
            </div>
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={coCreatorReviewQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab={renderTabLabel("RM Review", tabCounts.rm_review)} key="rm_review">
          {isLoadingCreator ? (
            <div className="creator-tab-loading">
              <Spin style={{ display: "block", margin: 40 }} />
            </div>
          ) : rmReviewQueue.length === 0 ? (
            <div className="creator-tab-empty">
              <Empty description="No RM review items" />
            </div>
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={rmReviewQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab={renderTabLabel("CO Checker Review", tabCounts.co_checker_review)} key="co_checker_review">
          {isLoadingCreator ? (
            <div className="creator-tab-loading">
              <Spin style={{ display: "block", margin: 40 }} />
            </div>
          ) : coCheckerReviewQueue.length === 0 ? (
            <div className="creator-tab-empty">
              <Empty description="No approved items" />
            </div>
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={coCheckerReviewQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane
          tab={renderTabLabel("Active DCLs", tabCounts.unassigned)}
          key="unassigned"
        >
          {isLoadingUnassigned ? (
            <div className="creator-tab-loading">
              <Spin style={{ display: "block", margin: 40 }} />
            </div>
          ) : unassignedQueue.length === 0 ? (
            <div className="creator-tab-empty">
              <Empty description="No unassigned DCLs available" />
            </div>
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={unassignedQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>
      </Tabs>
        </div>
      </div>

    </div>
  );
};

export default Myqueue;
