import React, { useMemo, useState } from "react";
import {
  Table,
  Spin,
  Empty,
  Input,
} from "antd";
import {
  SearchOutlined,
} from "@ant-design/icons";
import {
  useGetChecklistsByCreatorQuery,
} from "../../api/checklistApi";
import { formatDate } from "../../utils/checklistUtils";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../../styles/creatorDesignSystem.css";

const Completed = () => {
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  /* ---------------- FETCH DATA ---------------- */
  // const {
  //   data: allChecklists = [],
  //   isLoading,
  //   refetch,
  // } = useGetChecklistsByCreatorQuery();

  const { user } = useSelector((state) => state.auth);

  const creatorId = user?.id || user?._id;

  const {
    data: allChecklists = [],
    isLoading,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
  });

  console.log("Creator ID:", creatorId);
  console.log("Redux user:", user);
  console.log("Creator ID:", user?._id);
  console.log("User token:", user?.token);
  console.log("Is authenticated:", !!user?.token);
  console.log("All Checklists in MyQueue:", allChecklists);

  /* ---------------- FILTER APPROVED ---------------- */
  const filteredData = useMemo(() => {
    let filtered = allChecklists.filter((c) => {
      const statusLower = c.status?.toLowerCase() || "";
      // Show completed/approved checklists
      // Exclude revived copies (co_creator_review status) as those go to CoChecklistPage
      const isCompletedOrApproved =
        statusLower === "approved" || statusLower === "completed";
      const isNotRevived = statusLower !== "co_creator_review";

      return isCompletedOrApproved && isNotRevived;
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q) ||
          c.approvedBy?.name?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allChecklists, searchText]);


  // ✅ Helper function to get assigned checker info
  const getCheckerInfo = (record) => {
    // Priority: assignedToCoChecker → assignedChecker → checkerAssigned → coChecker
    return (
      record.assignedToCoChecker ||
      record.assignedChecker ||
      record.checkerAssigned ||
      record.coChecker ||
      null
    );
  };

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="creator-completed-primary-cell">
          <span className="creator-completed-primary-value">{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 146,
      ellipsis: true,
      render: (text) => <div className="creator-completed-primary-value">{text || "-"}</div>,
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 132,
      ellipsis: true,
      render: (text) => <div className="creator-completed-muted">{text || "-"}</div>,
    },
    {
      title: "IBPS NO",
      dataIndex: "ibpsNo",
      width: 98,
      ellipsis: true,
      render: (text) => (
        <span className="creator-completed-muted" style={{ fontFamily: "monospace" }}>
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => <div className="creator-completed-muted">{text || "-"}</div>,
    },
    {
      title: "CHECKER/APPROVER",
      dataIndex: "assignedToCoChecker", // primary field to check for checker info
      width: 138,
      ellipsis: true,
      render: (checkerValue, record) => {
        // 🔍 Debug: Log what we're getting
        console.log("🔍 Checker Column Debug:", {
          checkerValue,
          record_assignedToCoChecker: record?.assignedToCoChecker,
          record_assignedChecker: record?.assignedChecker,
          record_approvedBy: record?.approvedBy,
          record_checkerAssigned: record?.checkerAssigned,
          record_checker: record?.checker,
          allKeys: Object.keys(record || {}),
        });

        // ✅ Use helper to get assigned checker info from various field names
        const approver = getCheckerInfo(record);

        // ✅ Handle different possible name field variations
        const checkerName =
          approver?.name ||
          approver?.checkerName ||
          approver?.fullName ||
          approver?.userName ||
          "Not Assigned";

        return (
          <div className="creator-completed-muted" style={{ color: "var(--color-text-medium)", fontWeight: 500 }}>
            {checkerName}
          </div>
        );
      },
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs = []) => {
        const totalDocs =
          docs.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;
        return <span className="creator-completed-primary-value">{totalDocs}</span>;
      },
    },
    {
      title: "COMPLETED DATE",
      dataIndex: "updatedAt",
      width: 118,
      ellipsis: true,
      render: (date) => (
        <div className="creator-completed-muted" style={{ color: "var(--color-text-medium)", fontWeight: 500 }}>
          {date ? formatDate(date) : "—"}
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 92,
      ellipsis: true,
      render: () => (
        <span className="creator-badge creator-badge--approved">
          Approved
        </span>
      ),
    },
  ];

  const customTableStyles = `
    .creator-completed-page {
      min-height: 100%;
      width: 100%;
      background: var(--color-bg);
      font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
    }
    .creator-completed-shell {
      width: 100%;
    }
    .creator-completed-card {
      background: var(--color-white);
      border: 1px solid rgba(214, 189, 152, 0.2);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
      overflow: hidden;
    }
    .creator-completed-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 16px;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-bg);
    }
    .creator-completed-title {
      color: #374151;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .creator-completed-search {
      width: min(380px, 100%);
    }
    .creator-completed-search.ant-input-affix-wrapper {
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      border-radius: 6px !important;
      padding: 6px 10px !important;
      box-shadow: none !important;
    }
    .creator-completed-search.ant-input-affix-wrapper:hover,
    .creator-completed-search.ant-input-affix-wrapper:focus,
    .creator-completed-search.ant-input-affix-wrapper-focused {
      border-color: var(--color-primary-dark) !important;
      box-shadow: none !important;
    }
    .creator-completed-search input {
      background: transparent !important;
      font-size: 12px !important;
      color: #374151 !important;
    }
    .creator-completed-search .anticon {
      color: var(--color-text-light);
    }
    .creator-completed-count {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-white);
      border-radius: 999px;
      padding: 9px 14px;
      color: #374151;
      font-size: 12px;
      font-weight: 500;
    }
    .creator-completed-count strong {
      color: #374151;
      font-weight: 700;
    }
    .creator-completed-table {
      background: var(--color-white);
      border-radius: 8px;
      padding: 0 16px 16px;
    }
    .creator-completed-table .ant-table,
    .creator-completed-table .ant-table-wrapper,
    .creator-completed-table .ant-spin-nested-loading,
    .creator-completed-table .ant-spin-container,
    .creator-completed-table .ant-table-container,
    .creator-completed-table .ant-table-content,
    .creator-completed-table table,
    .creator-completed-table thead,
    .creator-completed-table tbody,
    .creator-completed-table tr {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .creator-completed-table .ant-table {
      table-layout: fixed;
      width: 100%;
    }
    .creator-completed-table .ant-table-container {
      background: inherit !important;
    }
    .creator-completed-table .ant-table-content {
      overflow-x: hidden;
    }
    .creator-completed-table .ant-table-header,
    .creator-completed-table .ant-table-body,
    .creator-completed-table .ant-table-placeholder,
    .creator-completed-table .ant-empty,
    .creator-completed-table .ant-empty-normal {
      background: inherit !important;
    }
    .creator-completed-table .ant-table-thead > tr > th {
      background: transparent !important;
      color: #374151 !important;
      font-weight: 600;
      font-size: 12px;
      padding: 12px 12px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      border-right: none !important;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .creator-completed-table .ant-table-tbody > tr > td {
      background: transparent !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
      border-top: none !important;
      border-right: none !important;
      padding: 12px 12px !important;
      font-size: 12px;
      color: #374151;
    }
    .creator-completed-table .ant-table-thead > tr > th::before,
    .creator-completed-table .ant-table-cell::before,
    .creator-completed-table .ant-table-cell::after,
    .creator-completed-table .ant-table-wrapper::before,
    .creator-completed-table .ant-table-wrapper::after,
    .creator-completed-table .ant-table-container::before,
    .creator-completed-table .ant-table-container::after,
    .creator-completed-table .ant-table-thead > tr::after,
    .creator-completed-table .ant-table-tbody > tr::after {
      display: none !important;
    }
    .creator-completed-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(214, 189, 152, 0.06) !important;
      cursor: pointer;
    }
    .creator-completed-table .ant-table-tbody > tr > td:first-child,
    .creator-completed-table .ant-table-thead > tr > th:first-child {
      padding-left: 0 !important;
    }
    .creator-completed-table .ant-table-tbody > tr > td:last-child,
    .creator-completed-table .ant-table-thead > tr > th:last-child {
      padding-right: 0 !important;
    }
    .creator-completed-table .ant-pagination {
      margin-top: 18px !important;
      margin-bottom: 0 !important;
    }
    .creator-completed-table .ant-pagination .ant-pagination-item,
    .creator-completed-table .ant-pagination .ant-pagination-prev,
    .creator-completed-table .ant-pagination .ant-pagination-next {
      border-radius: 999px !important;
      border-color: transparent !important;
      background: transparent !important;
      min-width: 34px;
    }
    .creator-completed-table .ant-pagination .ant-pagination-item-active {
      background: rgba(214, 189, 152, 0.18) !important;
      border-color: rgba(214, 189, 152, 0.18) !important;
    }
    .creator-completed-table .ant-pagination .ant-pagination-item-active a {
      color: var(--color-text-dark) !important;
      font-weight: 700;
    }
    .creator-completed-primary-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .creator-completed-primary-value {
      color: #374151;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .creator-completed-secondary-value {
      color: #374151;
      font-size: 12px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .creator-completed-muted {
      color: #374151;
      font-size: 12px;
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .creator-completed-state {
      padding: 24px 16px;
      background: var(--color-white);
    }
    @media (max-width: 768px) {
      .creator-completed-shell {
        padding: 0;
      }
      .creator-completed-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .creator-completed-search {
        width: 100%;
      }
      .creator-completed-table .ant-table-thead > tr > th,
      .creator-completed-table .ant-table-tbody > tr > td {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
      }
    }
  `;

  return (
    <div className="creator-completed-page creator-theme" style={{ boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>
      <div className="creator-completed-shell">
        <div className="creator-completed-card">
          <div className="creator-completed-toolbar">
            <h2 className="creator-completed-title">Approved Checklists</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span className="creator-completed-count">
                Total
                <strong>{filteredData.length}</strong>
              </span>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search by DCL, Customer, Loan Type or Checker"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="creator-completed-search"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="creator-completed-state">
              <Spin style={{ display: "block", margin: "40px auto" }} />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="creator-completed-state">
              <Empty description="No approved checklists found" />
            </div>
          ) : (
            <div className="creator-completed-table">
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={columns}
                dataSource={filteredData}
                tableLayout="fixed"
                scroll={{ x: 1120 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(record) => ({
                  onClick: () => {
                    const checklistId = record.id || record._id;
                    if (checklistId) {
                      navigate(`/cocreator/completed/${checklistId}`);
                    }
                  },
                })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Completed;
