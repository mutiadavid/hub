import React, { useState, useMemo } from "react";
import {
  Button,
  Table,
  Spin,
  Empty,
  Input,
  Typography,
} from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { formatDateTime } from "../../utils/checklistUtils";
import { getStatusColor } from "../../utils/statusColors";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";
import "../../styles/creatorDesignSystem.css";

const { Text } = Typography;

const Completed = ({ userId }) => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const {
    data: checklists = [],
    isLoading,
  } = useGetAllCoCreatorChecklistsQuery();

  const filteredData = useMemo(() => {
    if (!checklists) return [];

    return checklists
      .filter(
        (checklist) =>
          (checklist.assignedToRM?.id || checklist.assignedToRM?._id) === userId,
      )
      .filter((checklist) => {
        const status = (checklist.status || "").toLowerCase();
        return status === "approved" || status === "completed";
      })
      .filter((checklist) => {
        if (!searchText) return true;
        const query = searchText.toLowerCase();
        return (
          checklist.dclNo?.toLowerCase().includes(query) ||
          checklist.customerNumber?.toLowerCase().includes(query) ||
          checklist.customerName?.toLowerCase().includes(query) ||
          checklist.loanType?.toLowerCase().includes(query) ||
          checklist.createdBy?.name?.toLowerCase().includes(query)
        );
      });
  }, [checklists, userId, searchText]);

  const clearFilters = () => setSearchText("");

  const renderStatusTag = (status) => {
    const statusConfig = getStatusColor(status);

    return (
      <span
        className="rm-completed-status-text"
        style={{
          fontWeight: 600,
          fontSize: 12,
          color: statusConfig.textColor,
        }}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="rm-completed-primary-cell">
          <span className="rm-completed-primary-value">{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 132,
      ellipsis: true,
      render: (text) => <div className="rm-completed-muted">{text || "-"}</div>,
    },
    {
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 148,
      ellipsis: true,
      render: (text) => (
        <div
          className="rm-completed-primary-value"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <UserOutlined style={{ color: "var(--color-text-light)", fontSize: 12 }} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {text || "-"}
          </span>
        </div>
      ),
    },
    {
      title: "IBPS NO",
      dataIndex: "ibpsNo",
      width: 98,
      ellipsis: true,
      render: (text) => (
        <div className="rm-completed-muted" style={{ fontFamily: "monospace" }}>
          {text || "Not set"}
        </div>
      ),
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => <div className="rm-completed-muted">{text || "-"}</div>,
    },
    {
      title: "CREATOR",
      dataIndex: "createdBy",
      width: 132,
      ellipsis: true,
      render: (creator) => (
        <div
          className="rm-completed-muted"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <UserOutlined style={{ color: "var(--color-text-light)", fontSize: 12 }} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {creator?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "RM",
      dataIndex: "assignedToRM",
      width: 132,
      ellipsis: true,
      render: (rm) => (
        <div
          className="rm-completed-muted"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <UserOutlined style={{ color: "var(--color-text-light)", fontSize: 12 }} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {rm?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "DOCS",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs) => {
        const totalDocs =
          docs?.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;

        return <span className="rm-completed-primary-value">{totalDocs}</span>;
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 135,
      render: (status) => renderStatusTag(status),
    },
    {
      title: "TAT consumed",
      dataIndex: "slaExpiry",
      width: 100,
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
  ];

  const customTableStyles = `
    .rm-completed-page {
      min-height: 100%;
      width: 100%;
      background: var(--color-white);
      font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
    }
    .rm-completed-shell {
      width: 100%;
    }
    .rm-completed-card {
      background: var(--color-white);
      border: 1px solid rgba(214, 189, 152, 0.2);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
      overflow: hidden;
    }
    .rm-completed-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
      flex-wrap: wrap;
      padding: 16px;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-white);
    }
    .rm-completed-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 240px;
    }
    .rm-completed-title {
      color: var(--color-text-dark);
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .rm-completed-subtitle {
      color: var(--color-text-light);
      font-size: 12px;
      margin: 0;
    }
    .rm-completed-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
      flex: 1;
    }
    .rm-completed-count {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(214, 189, 152, 0.2);
      background: var(--color-white);
      border-radius: 999px;
      padding: 9px 14px;
      color: var(--color-text-light);
      font-size: 12px;
      font-weight: 500;
    }
    .rm-completed-count strong {
      color: var(--color-text-dark);
      font-weight: 700;
    }
    .rm-completed-search {
      width: min(420px, 100%);
    }
    .rm-completed-search.ant-input-affix-wrapper {
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
      box-shadow: none !important;
    }
    .rm-completed-search.ant-input-affix-wrapper:hover,
    .rm-completed-search.ant-input-affix-wrapper:focus,
    .rm-completed-search.ant-input-affix-wrapper-focused {
      border-color: var(--color-primary-dark) !important;
      box-shadow: none !important;
    }
    .rm-completed-search input {
      background: transparent !important;
      font-size: 12px !important;
      color: var(--color-text-medium) !important;
    }
    .rm-completed-search .anticon {
      color: var(--color-text-light);
    }
    .rm-completed-clear.ant-btn {
      min-height: 40px !important;
      padding: 0 14px !important;
      border-radius: 6px !important;
      border: 1px solid rgba(214, 189, 152, 0.2) !important;
      background: var(--color-white) !important;
      color: var(--color-text-medium) !important;
      box-shadow: none !important;
      font-size: 12px !important;
      font-weight: 600 !important;
    }
    .rm-completed-clear.ant-btn:hover,
    .rm-completed-clear.ant-btn:focus {
      border-color: var(--color-primary-dark) !important;
      color: var(--color-primary-dark) !important;
    }
    .rm-completed-table {
      background: var(--color-white);
      border-radius: 8px;
      padding: 0 16px 16px;
    }
    .rm-completed-table .ant-table,
    .rm-completed-table .ant-table-wrapper,
    .rm-completed-table .ant-spin-nested-loading,
    .rm-completed-table .ant-spin-container,
    .rm-completed-table .ant-table-container,
    .rm-completed-table .ant-table-content,
    .rm-completed-table table,
    .rm-completed-table thead,
    .rm-completed-table tbody,
    .rm-completed-table tr {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: var(--color-white) !important;
    }
    .rm-completed-table .ant-table {
      table-layout: fixed;
      width: 100%;
    }
    .rm-completed-table .ant-table-container {
      background: inherit !important;
    }
    .rm-completed-table .ant-table-content {
      overflow-x: hidden;
    }
    .rm-completed-table .ant-table-header,
    .rm-completed-table .ant-table-body,
    .rm-completed-table .ant-table-placeholder,
    .rm-completed-table .ant-empty,
    .rm-completed-table .ant-empty-normal {
      background: inherit !important;
    }
    .rm-completed-table .ant-table-thead > tr > th {
      background: var(--color-white) !important;
      color: var(--color-text-medium) !important;
      font-weight: 600;
      font-size: 11px;
      padding: 14px 12px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      border-right: none !important;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .rm-completed-table .ant-table-tbody > tr > td {
      background: var(--color-white) !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
      border-top: none !important;
      border-right: none !important;
      padding: 16px 12px !important;
      font-size: 12px;
      color: var(--color-text-medium);
      line-height: 1.25;
    }
    .rm-completed-table .ant-table-thead > tr > th::before,
    .rm-completed-table .ant-table-cell::before,
    .rm-completed-table .ant-table-cell::after,
    .rm-completed-table .ant-table-wrapper::before,
    .rm-completed-table .ant-table-wrapper::after,
    .rm-completed-table .ant-table-container::before,
    .rm-completed-table .ant-table-container::after,
    .rm-completed-table .ant-table-thead > tr::after,
    .rm-completed-table .ant-table-tbody > tr::after {
      display: none !important;
    }
    .rm-completed-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(245, 247, 244, 0.9) !important;
      cursor: pointer;
    }
    .rm-completed-table .ant-table-tbody > tr > td:first-child,
    .rm-completed-table .ant-table-thead > tr > th:first-child {
      padding-left: 0 !important;
    }
    .rm-completed-table .ant-table-tbody > tr > td:last-child,
    .rm-completed-table .ant-table-thead > tr > th:last-child {
      padding-right: 0 !important;
    }
    .rm-completed-table .ant-pagination {
      margin-top: 18px !important;
      margin-bottom: 0 !important;
    }
    .rm-completed-table .ant-pagination .ant-pagination-item,
    .rm-completed-table .ant-pagination .ant-pagination-prev,
    .rm-completed-table .ant-pagination .ant-pagination-next {
      border-radius: 999px !important;
      border-color: transparent !important;
      background: transparent !important;
      min-width: 34px;
    }
    .rm-completed-table .ant-pagination .ant-pagination-item-active {
      background: rgba(214, 189, 152, 0.18) !important;
      border-color: rgba(214, 189, 152, 0.18) !important;
    }
    .rm-completed-table .ant-pagination .ant-pagination-item-active a {
      color: var(--color-text-dark) !important;
      font-weight: 700;
    }
    .rm-completed-primary-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .rm-completed-primary-value {
      color: var(--color-text-dark);
      font-size: 13px;
      font-weight: 400;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rm-completed-secondary-value {
      color: var(--color-text-light);
      font-size: 8px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rm-completed-muted {
      color: var(--color-text-medium);
      font-size: 12px;
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rm-completed-state,
    .rm-completed-footer {
      padding: 16px;
      background: var(--color-white);
    }
    .rm-completed-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      border-top: 1px solid rgba(214, 189, 152, 0.2);
      color: var(--color-text-light);
      font-size: 12px;
    }
    @media (max-width: 768px) {
      .rm-completed-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .rm-completed-toolbar-actions {
        justify-content: stretch;
      }
      .rm-completed-search {
        width: 100%;
      }
      .rm-completed-table .ant-table-thead > tr > th,
      .rm-completed-table .ant-table-tbody > tr > td {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
      }
    }
  `;

  return (
    <div className="rm-completed-page creator-theme" style={{ boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>

      <div className="rm-completed-shell">
        <div className="rm-completed-card">
          <div className="rm-completed-toolbar">
            <div className="rm-completed-title-wrap">
              <h2 className="rm-completed-title">Completed</h2>
              <p className="rm-completed-subtitle">
                Review approved and completed DCLs assigned to you
              </p>
            </div>

            <div className="rm-completed-toolbar-actions">
              <span className="rm-completed-count">
                Total
                <strong>{filteredData.length}</strong>
              </span>
              <Input
                placeholder="Search by DCL No, Customer, Loan Type, or Creator"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                allowClear
                className="rm-completed-search"
              />
              <Button onClick={clearFilters} className="rm-completed-clear">
                Clear
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="rm-completed-state">
              <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="rm-completed-state">
              <Empty
                description={
                  <div>
                    <p style={{ fontSize: 16, marginBottom: 8 }}>
                      No completed DCLs found
                    </p>
                    <p style={{ color: "var(--color-text-light)" }}>
                      {searchText
                        ? "Try changing your search term"
                        : "No approved or completed DCLs assigned to you yet"}
                    </p>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="rm-completed-table">
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey={(record) => record.id || record._id || record.dclNo}
                size="middle"
                tableLayout="fixed"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  position: ["bottomCenter"],
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} DCLs`,
                }}
                scroll={{ x: 1090 }}
                onRow={(record) => ({
                  onClick: () => {
                    const checklistId = record.id || record._id;
                    if (!checklistId) return;
                    navigate(`/rm/completed/${checklistId}`);
                  },
                })}
              />
            </div>
          )}

          <div className="rm-completed-footer">
            <div>Report generated on: {formatDateTime(new Date())}</div>
            <Text type="secondary">
              Showing {filteredData.length} items • Data as of latest system update
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Completed;
