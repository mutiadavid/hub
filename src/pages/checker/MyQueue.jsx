import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Table, Button, Tag, Spin, Empty, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";
import { useGetCheckerMyQueueQuery, useLockDclMutation } from "../../api/checklistApi.js";
import { showLockToast } from "../../utils/authToast";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";
import "../../styles/creatorDesignSystem.css";

const getQueueStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (["cocheckerreview", "co_checker_review"].includes(normalizedStatus)) {
    return { label: "Checker Review", variant: "qs-review" };
  }

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  return {
    label: (status || "In Progress").replace(/_/g, " "),
    variant: "pending",
  };
};

const MyQueuePage = () => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");

  // Get checker ID from Redux auth
  const auth = useSelector((state) => state.auth);
  const checkerId = auth?.user?.id || auth?.user?._id || auth?.id || auth?._id;
  const checkerName = auth?.user?.name || auth?.user?.username || auth?.name || auth?.username || "Current User";
  const [lockDcl] = useLockDclMutation();

  const getLockMeta = (checklist) => {
    const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
    const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
    const isLockedBySomeoneElse = !!lockedByUserId && lockedByUserId !== checkerId;
    const isLockedByMe = !!lockedByUserId && lockedByUserId === checkerId;

    return {
      lockedByUserId,
      lockedByUserName,
      isLockedBySomeoneElse,
      isLockedByMe,
    };
  };

  const openChecklist = async (checklist) => {
    const checklistId = checklist?.id || checklist?._id;
    const { isLockedBySomeoneElse, isLockedByMe, lockedByUserName } = getLockMeta(checklist);

    if (!checklistId) {
      return;
    }

    if (isLockedBySomeoneElse) {
      showLockToast(lockedByUserName || "another user");
      return;
    }

    if (!isLockedByMe) {
      try {
        await lockDcl(checklistId).unwrap();
      } catch (error) {
        if (error?.data?.lockedByUserId) {
          showLockToast(error?.data?.lockedByUserName || "another user");
          return;
        }

        console.error("Failed to lock checker checklist before opening:", error);
        return;
      }
    }

    setSelectedChecklist({
      ...checklist,
      lockedByUserId: checkerId,
      lockedByUserName: checkerName,
      lockedBy: { id: checkerId, name: checkerName },
    });
  };

  // 🔍 DEBUG LOGS
  console.log("🔍 MyQueue Component Loaded");
  console.log("📋 Auth State:", auth);
  console.log("🔑 Checker ID:", checkerId);
  console.log("🔐 Auth ID fields:", { id: auth?.id, _id: auth?._id });

  // Fetch checklists assigned to this checker for review
  const {
    data: myQueue = [],
    isLoading,
    error,
    refetch,
  } = useGetCheckerMyQueueQuery(checkerId, {
    skip: !checkerId, // Skip query if no checkerId
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // 🔍 DEBUG: Log API response
  console.log("📊 My Queue Data:", myQueue);
  console.log("⏳ Is Loading:", isLoading);
  console.log("❌ API Error:", error);
  console.log("🚀 Query Endpoint: /checkerChecklist/my-queue/" + checkerId);

  /**
   * ✅ PENDING CHECKLISTS FOR THIS CHECKER
   * These are checklists in CoCheckerReview status assigned to this specific checker
   */
  const pendingChecklists = useMemo(() => {
    const filtered = myQueue.filter((c) => {
      const isPendingReview =
        c.status?.toLowerCase() === "cocheckerreview" ||
        c.status?.toLowerCase() === "co_checker_review";

      if (!isPendingReview) {
        return false;
      }

      const searchTarget = [
        c.dclNo,
        c.customerName,
        c.customerNumber,
        c.loanType,
        c.createdBy?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchText || searchTarget.includes(searchText.toLowerCase());
      const matchesLoanType =
        loanTypeFilter === "all" ||
        (c.loanType || "").toLowerCase() === loanTypeFilter;
      const matchesCreator =
        creatorFilter === "all" ||
        (c.createdBy?.name || "").toLowerCase() === creatorFilter;

      return matchesSearch && matchesLoanType && matchesCreator;
    });
    console.log(
      "🔍 Filtering checklists by status 'cocheckerreview'/'co_checker_review'",
    );
    console.log("📋 All queue items:", myQueue);
    console.log("✅ Filtered pending checklists:", filtered);
    console.log("Status comparison - Sample item status:", myQueue[0]?.status);
    return filtered;
  }, [creatorFilter, loanTypeFilter, myQueue, searchText]);

  const loanTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myQueue
            .map((item) => item.loanType)
            .filter(Boolean)
            .map((value) => value.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [myQueue],
  );

  const creatorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myQueue
            .map((item) => item.createdBy?.name)
            .filter(Boolean)
            .map((value) => value.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [myQueue],
  );

  const clearFilters = () => {
    setSearchText("");
    setLoanTypeFilter("all");
    setCreatorFilter("all");
  };

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
      render: (text) => (
        <span className="creator-table-primary-value">{text || "-"}</span>
      ),
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 134,
      ellipsis: true,
      render: (text) => (
        <span className="creator-table-muted">{text || "-"}</span>
      ),
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => (
        <span className="creator-table-muted">{text || "-"}</span>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 74,
      align: "center",
      render: (docs) => {
        const totalDocs =
          docs?.reduce((sum, cat) => sum + (cat.docList?.length || 0), 0) || 0;
        return <span className="creator-table-primary-value">{totalDocs}</span>;
      },
    },
    {
      title: "CO CREATOR",
      dataIndex: "createdBy",
      width: 122,
      ellipsis: true,
      render: (creator) => (
        <span className="creator-table-muted">{creator?.name || "Not Assigned"}</span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 96,
      ellipsis: true,
      render: (status) => {
        const statusMeta = getQueueStatusMeta(status);
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
    {
      title: "TAT CONSUMED",
      dataIndex: "slaExpiry",
      width: 116,
      fixed: "right",
      ellipsis: true,
      render: (date, record) => (
        <RealTimeSlaTag
          slaExpiry={date}
          startedAt={record?.createdAt}
          emptyLabel="N/A"
          minWidth={60}
          fontSize={12}
          displayStyle="text"
        />
      ),
    },
    {
      title: "ACTION",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          style={{ fontWeight: 600, color: "var(--color-primary-medium)", padding: 0 }}
          onClick={() => openChecklist(record)}
        >
          Review
        </Button>
      ),
    },
  ];

  if (isLoading) {
    console.log("⏳ Component in loading state...");
    return (
      <div className="creator-theme" style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="creator-queue-page creator-theme" style={{ boxSizing: "border-box" }}>
      <style>{`
        .checker-myqueue-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .checker-myqueue-inline-review {
          width: 100%;
          min-height: 100%;
          padding: 0;
          margin: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
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
        .creator-queue-filters {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) repeat(2, minmax(180px, 1fr)) minmax(120px, 160px);
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          background: var(--color-white);
        }
        .creator-queue-filters .ant-select-selector,
        .creator-queue-filters .ant-btn {
          height: 38px !important;
          border-radius: 6px !important;
        }
        .creator-queue-filters .ant-select-selector,
        .creator-queue-filters .ant-btn,
        .creator-queue-filters .ant-input-affix-wrapper {
          border-color: rgba(214, 189, 152, 0.2) !important;
          box-shadow: none !important;
        }
        .creator-queue-filters .ant-btn {
          color: var(--color-text-medium);
          font-weight: 600;
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
          overflow-x: auto;
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

        .creator-table-primary-value {
          color: var(--color-text-dark);
          font-size: 13px;
          font-weight: 400;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .creator-tab-empty,
        .creator-tab-loading {
          padding: 24px 16px;
          background: var(--color-white);
        }

        @media (max-width: 1024px) {
          .creator-queue-filters {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .creator-queue-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .creator-queue-search {
            width: 100%;
          }
          .creator-queue-filters {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="checker-myqueue-page">
        {selectedChecklist ? (
          <section className="checker-myqueue-inline-review">
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
          <div className="creator-queue-shell">
            <div className="creator-queue-card">
              <div className="creator-queue-toolbar">
                <h2 className="creator-queue-title">My Queue</h2>
                <Input
                  className="creator-queue-search"
                  placeholder="Search DCL, Customer, Loan, Co-Creator"
                  prefix={<SearchOutlined />}
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="creator-queue-filters">
                <Select
                  value={loanTypeFilter}
                  onChange={setLoanTypeFilter}
                  style={{ width: "100%" }}
                  options={[
                    { value: "all", label: "All loan types" },
                    ...loanTypeOptions.map((value) => ({
                      value: value.toLowerCase(),
                      label: value,
                    })),
                  ]}
                />
                <Select
                  value={creatorFilter}
                  onChange={setCreatorFilter}
                  style={{ width: "100%" }}
                  options={[
                    { value: "all", label: "All co-creators" },
                    ...creatorOptions.map((value) => ({
                      value: value.toLowerCase(),
                      label: value,
                    })),
                  ]}
                />
                <Button block onClick={clearFilters}>
                  Clear
                </Button>
              </div>

              {pendingChecklists.length === 0 ? (
                <div className="creator-tab-empty">
                  <Empty description="No checklists pending review" />
                </div>
              ) : (
                <div className="myqueue-table">
                  <Table
                    columns={columns}
                    dataSource={pendingChecklists}
                    rowKey={(record) => record.id || record._id || record.dclNo}
                    tableLayout="fixed"
                    scroll={{ x: 1180 }}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQueuePage;
