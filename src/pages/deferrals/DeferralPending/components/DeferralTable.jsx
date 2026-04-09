import React from "react";
import {
  Tabs,
  Table,
  Spin,
  Empty,
  Tag,
  Typography,
  Row,
  Col,
} from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  PRIMARY_BLUE,
  SECONDARY_PURPLE,
  SUCCESS_GREEN,
  ERROR_RED,
  WARNING_ORANGE,
} from "../utils/constants";
import RealTimeSlaTag from "../../../../components/common/RealTimeSlaTag";

const { Text } = Typography;

const renderTabLabel = (label, count) => (
  <span className="creator-tab-label">
    <span>{label}</span>
    <span className="creator-tab-count">{count}</span>
  </span>
);

/**
 * DeferralTable Component
 * Displays the deferral data in a tabbed table interface
 */
const DeferralTable = ({
  activeTab = "pending",
  onTabChange,
  pendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
  closeRequestsCount = 0,
  extensionsCount = 0,
  isLoading = false,
  currentData = [],
  onRowClick,
}) => {
  // Table columns definition
  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      key: "deferralNumber",
      width: 140,
      render: (text) => (
        <div className="creator-table-primary-cell">
          <span className="creator-table-primary-value" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ color: SECONDARY_PURPLE }} />
            {text}
          </span>
          <span className="creator-table-secondary-value">Deferral request</span>
        </div>
      ),
    },
    {
      title: "DCL No",
      dataIndex: "dclNo",
      key: "dclNo",
      width: 120,
      render: (text, record) => {
        const value = record.dclNo || record.dclNumber;
        return value ? (
          <span className="creator-table-muted" style={{ color: SECONDARY_PURPLE, fontWeight: 600 }}>
            {value}
          </span>
        ) : (
          <Tag color="warning" style={{ fontWeight: 700 }}>
            Missing DCL
          </Tag>
        );
      },
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      width: 160,
      render: (text) => <span className="creator-table-primary-value">{text}</span>,
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      key: "loanType",
      width: 140,
      render: (text) => <span className="creator-table-muted">{text || "Not Specified"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => {
        const withdrawnBy =
          record?.closedByName ||
          record?.ClosedByName ||
          record?.closedBy ||
          record?.closedByUser;
        
        if (withdrawnBy)
          return (
            <span className="creator-badge creator-badge--rework">
              Withdrawn
            </span>
          );

        const s = (status || "").toLowerCase();
        if (s === "deferral_requested" || s === "pending_approval")
          return (
            <span className="creator-badge creator-badge--pending">
              Pending
            </span>
          );
        if (s === "deferral_approved" || s === "approved")
          return (
            <span className="creator-badge creator-badge--approved">
              Approved
            </span>
          );
        if (s === "deferral_rejected" || s === "rejected")
          return (
            <span className="creator-badge creator-badge--rework">
              Rejected
            </span>
          );
        return (
          <span className="creator-badge creator-badge--draft">
            {status}
          </span>
        );
      },
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      key: "slaExpiry",
      width: 100,
      fixed: "right",
      render: (date, record) => {
        return (
          <RealTimeSlaTag
            slaExpiry={date}
            startedAt={record?.createdAt}
            emptyLabel="N/A"
            minWidth={60}
            displayStyle="text"
          />
        );
      },
    },
  ];

  return (
    <>
      <style>{`
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
        .creator-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: var(--color-primary-dark) !important;
          font-weight: 600;
        }
        .creator-tabs .ant-tabs-ink-bar {
          height: 2px !important;
          background: var(--color-primary-dark) !important;
        }
        .creator-tab-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
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
          color: var(--color-text-dark);
          font-size: 10px;
          font-weight: 700;
        }
        .creator-tab-meta {
          padding: 18px 16px 12px;
          color: var(--color-text-dark);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-align: center;
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
        .myqueue-table .ant-table-thead > tr > th {
          background: transparent !important;
          color: var(--color-text-medium) !important;
          font-weight: 600;
          font-size: 11px;
          padding: 14px 12px !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-right: none !important;
          text-transform: uppercase;
        }
        .myqueue-table .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
          border-right: none !important;
          padding: 16px 12px !important;
          font-size: 12px;
          color: var(--color-text-medium);
        }
        .myqueue-table .ant-table-tbody > tr:hover > td {
          background-color: rgba(214, 189, 152, 0.06) !important;
          cursor: pointer;
        }
        .myqueue-table .ant-table-thead > tr > th:first-child,
        .myqueue-table .ant-table-tbody > tr > td:first-child {
          padding-left: 0 !important;
        }
        .myqueue-table .ant-table-thead > tr > th:last-child,
        .myqueue-table .ant-table-tbody > tr > td:last-child {
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
        .creator-queue-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 0 16px 16px;
          padding: 16px;
          background: rgba(214, 189, 152, 0.08);
          border: 1px solid rgba(214, 189, 152, 0.16);
          border-radius: 8px;
          font-size: 12px;
          color: var(--color-text-light);
        }
      `}</style>
      <div>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => onTabChange(key)}
          className="creator-tabs"
          items={[
            {
              key: "pending",
              label: renderTabLabel("Pending Deferrals", pendingCount),
            },
            {
              key: "approved",
              label: renderTabLabel("Approved Deferrals", approvedCount),
            },
            {
              key: "extensions",
              label: renderTabLabel("Extension Applications", extensionsCount),
            },
            {
              key: "rejected",
              label: renderTabLabel("Re-work Deferrals", rejectedCount),
            },
            {
              key: "closeRequests",
              label: renderTabLabel("Close Requests", closeRequestsCount),
            },
          ]}
        />
      </div>

      <div className="creator-tab-meta">
          {activeTab === "pending"
            ? "Pending Deferrals"
            : activeTab === "approved"
              ? "Approved Deferrals"
              : activeTab === "extensions"
                ? "Extension Applications"
                : activeTab === "rejected"
                  ? "Re-work Deferrals"
                  : "Close Requests"}{" "}
              ({currentData.length} items)
          </div>

      {/* Table Content */}
      {isLoading ? (
            <div className="creator-tab-loading">
          <Spin />
        </div>
      ) : currentData.length === 0 ? (
            <div className="creator-tab-empty">
              <Empty
                description={
                  <div>
                    <p style={{ fontSize: 16, marginBottom: 8 }}>
                      {activeTab === "pending"
                        ? "No pending deferrals found"
                        : activeTab === "approved"
                          ? "No approved deferrals found"
                          : activeTab === "rejected"
                            ? "No re-work deferrals found"
                          : "No close requests found"}
                    </p>
                    <p style={{ color: "#999" }}>
                      {activeTab === "pending"
                        ? "No pending deferrals currently"
                        : activeTab === "approved"
                          ? "No deferrals have been approved yet"
                          : activeTab === "rejected"
                            ? "No deferrals have been rejected"
                          : "No close requests currently"}
                    </p>
                  </div>
                }
              />
            </div>
      ) : (
            <div className="myqueue-table deferral-pending-table">
          <Table
            columns={columns}
            dataSource={currentData}
            rowKey="_id"
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              position: ["bottomCenter"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} deferrals`,
            }}
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () => {
                console.log("Row clicked:", record);
                if (onRowClick) {
                  onRowClick(record);
                }
              },
              style: { cursor: "pointer" },
            })}
          />
        </div>
      )}

      {/* Footer Info */}
      <div className="creator-queue-footer">
        <Row justify="space-between" align="middle">
          <Col>
            Report generated on: {dayjs().format("DD/MM/YYYY HH:mm:ss")}
          </Col>
          <Col>
            <Text type="secondary">
              Showing {currentData.length} items • Data as of latest system
              update
            </Text>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default DeferralTable;
