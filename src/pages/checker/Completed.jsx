// export default Completed;
import React, { useMemo, useState } from "react";
import {
  Button,
  Table,
  Spin,
  Empty,
  Input,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { useGetCompletedDCLsForCheckerQuery } from "../../api/checklistApi";
import "../../styles/creatorDesignSystem.css";

const getCompletedStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus === "approved_with_revisions") {
    return { label: "Approved Revised", variant: "qs-review" };
  }

  return {
    label: status || "Completed",
    variant: "approved",
  };
};

const Completed = ({ userId }) => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const {
    data: checklists = [],
    isLoading,
    refetch,
  } = useGetCompletedDCLsForCheckerQuery(userId);

  console.log("🔍 All Completed Checklists for Checker:", checklists);

  // ✅ No filtering needed - backend already filters by checker and approved status
  const filteredData = useMemo(() => {
    if (!checklists || !userId) return [];

    return checklists.filter((c) => {
      if (!searchText) return true;
      const q = searchText.toLowerCase();

      return (
        c.dclNo?.toLowerCase().includes(q) ||
        c.customerNumber?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.loanType?.toLowerCase().includes(q) ||
        c.createdBy?.name?.toLowerCase().includes(q)
      );
    });
  }, [checklists, userId, searchText]);

  console.log("user:", userId);
  console.log("Completed Checklists for Checker:", filteredData);

  const clearFilters = () => setSearchText("");

  console.log("🔎 Filtered Completed Data:", filteredData);

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="creator-table-primary-cell">
          <span className="creator-table-primary-value">{text || "-"}</span>
          <span className="creator-table-secondary-value">Completed checklist</span>
        </div>
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
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 146,
      ellipsis: true,
      render: (text) => (
        <span className="creator-table-primary-value">{text || "-"}</span>
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
      title: "CHECKER",
      dataIndex: "assignedToCoChecker",
      width: 122,
      ellipsis: true,
      render: (checker) => {
        const checkerName = checker?.name || checker || "-";
        return <span className="creator-table-muted">{checkerName}</span>;
      },
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 74,
      align: "center",
      render: (docs = []) => {
        const total =
          docs.reduce((sum, cat) => sum + (cat.docList?.length || 0), 0) || 0;
        return <span className="creator-table-primary-value">{total}</span>;
      },
    },
    {
      title: "TIME/DATE COMPLETED",
      dataIndex: "completionDate",
      width: 142,
      ellipsis: true,
      render: (date, record) => (
        <span className="creator-table-muted">
          {dayjs(date || record.updatedAt || record.createdAt).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 108,
      ellipsis: true,
      render: (status) => {
        const statusMeta = getCompletedStatusMeta(status);
        return (
          <span className={`creator-badge creator-badge--${statusMeta.variant}`}>
            {statusMeta.label}
          </span>
        );
      },
    },
  ];

  /* ================= UI ================= */
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
    .creator-queue-toolbar-actions {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: min(520px, 100%);
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .creator-queue-clear.ant-btn {
      min-height: 38px !important;
      height: 38px !important;
      padding: 0 18px !important;
      border-radius: 6px !important;
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      color: var(--color-text-medium) !important;
      font-weight: 600 !important;
      box-shadow: none !important;
      background: var(--color-white) !important;
    }
    .creator-queue-clear.ant-btn:hover,
    .creator-queue-clear.ant-btn:focus {
      color: var(--color-primary-dark) !important;
      border-color: var(--color-primary-dark) !important;
      background: rgba(214, 189, 152, 0.08) !important;
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
    @media (max-width: 768px) {
      .creator-queue-shell {
        padding: 0;
      }
      .creator-queue-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .creator-queue-toolbar-actions {
        width: 100%;
        justify-content: stretch;
      }
      .creator-queue-search,
      .creator-queue-clear {
        width: 100%;
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
            <h2 className="creator-queue-title">Completed Checklists</h2>
            <div className="creator-queue-toolbar-actions">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search DCL / Customer / Loan"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="creator-queue-search"
              />
              <Button onClick={clearFilters} className="creator-queue-clear">
                Clear
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="creator-tab-loading">
              <Spin style={{ display: "block", margin: 40 }} tip="Loading completed checklists..." />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="creator-tab-empty">
              <Empty description="No completed checklists found" />
            </div>
          ) : (
            <div className="myqueue-table">
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey={(record) => record.id || record._id || record.dclNo}
                tableLayout="fixed"
                scroll={{ x: 980 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(record) => ({
                  onClick: () => {
                    console.log("🖱️ Clicked on checklist:", record.dclNo, record);
                    const checklistId = record?.id || record?._id;
                    if (checklistId) {
                      navigate(`/cochecker/completed/${checklistId}`);
                    }
                  },
                })}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-light)" }}>
        Generated: {dayjs().format("DD/MM/YYYY HH:mm")}
      </div>
    </div>
  );
};

export default Completed;
