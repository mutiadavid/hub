import React, { useState } from "react";
import { Empty, Spin, Table, message } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

import { DCL_STATUS_COLORS, NCBA_REPORT_THEME } from "./reportTheme";
import { getDueDate, getOverdueDays, safeLower } from "./reportUtils";
import deferralApi from "../../../service/deferralApi";
import { hasClosedCloseRequestDocuments } from "../../../utils/deferralDocuments";
import ActionedDeferralDetailsModal from "../../approver/Actioned/components/DeferralDetailsModal";
import ApproverDeferralDetailsModal from "../../approver/MyQueue/components/DeferralDetailsModal";
import RmDeferralDetailsModal from "../../deferrals/DeferralPending/components/DeferralDetailsModal";

const APPROVER_STAGE_STATUSES = new Set([
  "pending_approval",
  "in_review",
  "partially_approved",
]);

const TERMINAL_STATUSES = new Set([
  "approved",
  "deferral_approved",
  "rejected",
  "deferral_rejected",
  "closed",
  "deferral_closed",
  "closed_by_co",
  "closed_by_creator",
]);

const getNormalizedStatus = (status) => safeLower(status).replace(/\s+/g, "_");

const getRmReportsStage = (deferral) => {
  if (hasClosedCloseRequestDocuments(deferral)) {
    return "actioned";
  }

  const normalizedStatus = getNormalizedStatus(deferral?.status);

  if (APPROVER_STAGE_STATUSES.has(normalizedStatus)) {
    return "approver";
  }

  if (TERMINAL_STATUSES.has(normalizedStatus)) {
    return "actioned";
  }

  return "rm";
};

const getReportStatusMeta = (deferral) => {
  if (hasClosedCloseRequestDocuments(deferral)) {
    return { label: "Closed", variant: "approved" };
  }

  const normalizedStatus = safeLower(deferral?.status);

  if (normalizedStatus.includes("approved")) {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus.includes("rejected") || normalizedStatus.includes("returned")) {
    return { label: normalizedStatus.includes("returned") ? "Returned" : "Rejected", variant: "rework" };
  }

  if (normalizedStatus.includes("pending") || normalizedStatus.includes("open")) {
    return { label: "Pending", variant: "pending" };
  }

  return {
    label: String(status || "In Progress")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    variant: "qs-review",
  };
};

export default function DeferralsReportTable({ rows }) {
  const token = useSelector((state) => state?.auth?.token);
  const [selectedDeferral, setSelectedDeferral] = useState(null);
  const [loadingDeferralId, setLoadingDeferralId] = useState(null);

  const customTableStyles = `
    .deferrals-report-shell {
      background: var(--color-white);
      border-radius: 8px;
      padding: 0 12px 16px;
    }
    .reports-review-surface {
      width: 100%;
    }
    .deferrals-report-table .ant-table,
    .deferrals-report-table .ant-table-wrapper,
    .deferrals-report-table .ant-spin-nested-loading,
    .deferrals-report-table .ant-spin-container,
    .deferrals-report-table .ant-table-container,
    .deferrals-report-table .ant-table-content,
    .deferrals-report-table table,
    .deferrals-report-table thead,
    .deferrals-report-table tbody,
    .deferrals-report-table tr {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .deferrals-report-table .ant-table {
      table-layout: fixed;
      width: 100%;
    }
    .deferrals-report-table .ant-table-content {
      overflow-x: hidden;
    }
    .deferrals-report-table .ant-table-container {
      background: inherit !important;
    }
    .deferrals-report-table .ant-table-header,
    .deferrals-report-table .ant-table-body,
    .deferrals-report-table .ant-table-placeholder,
    .deferrals-report-table .ant-empty,
    .deferrals-report-table .ant-empty-normal {
      background: inherit !important;
    }
    .deferrals-report-table .ant-table-thead > tr > th {
      background: transparent !important;
      color: var(--color-text-medium) !important;
      font-weight: 600;
      font-size: 12px;
      padding: 14px 12px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      border-right: none !important;
      line-height: 1.2;
      text-transform: uppercase;
      text-align: left;
    }
    .deferrals-report-table .ant-table-thead > tr > th.ant-table-cell-align-center {
      text-align: center !important;
    }
    .deferrals-report-table .ant-table-tbody > tr > td {
      background: transparent !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
      border-top: none !important;
      border-right: none !important;
      padding: 16px 12px !important;
      font-size: 12px;
      color: var(--color-text-medium);
      line-height: 1.25;
      text-align: left;
    }
    .deferrals-report-table .ant-table-thead > tr > th::before,
    .deferrals-report-table .ant-table-cell::before,
    .deferrals-report-table .ant-table-cell::after,
    .deferrals-report-table .ant-table-wrapper::before,
    .deferrals-report-table .ant-table-wrapper::after,
    .deferrals-report-table .ant-table-container::before,
    .deferrals-report-table .ant-table-container::after,
    .deferrals-report-table .ant-table-thead > tr::after,
    .deferrals-report-table .ant-table-tbody > tr::after {
      display: none !important;
    }
    .deferrals-report-table .ant-table-tbody > tr:hover > td {
      background-color: rgba(214, 189, 152, 0.06) !important;
      cursor: pointer;
    }
    .deferrals-report-table .ant-table-tbody > tr > td:first-child,
    .deferrals-report-table .ant-table-thead > tr > th:first-child {
      padding-left: 0 !important;
    }
    .deferrals-report-table .ant-table-tbody > tr > td:last-child,
    .deferrals-report-table .ant-table-thead > tr > th:last-child {
      padding-right: 0 !important;
    }
    .deferrals-report-table .ant-table-thead > tr > th.ant-table-cell,
    .deferrals-report-table .ant-table-tbody > tr > td.ant-table-cell {
      vertical-align: middle;
    }
    .deferrals-report-table .ant-pagination {
      margin-top: 18px !important;
      margin-bottom: 0 !important;
      text-align: center;
    }
    .deferrals-report-table .ant-pagination .ant-pagination-item,
    .deferrals-report-table .ant-pagination .ant-pagination-prev,
    .deferrals-report-table .ant-pagination .ant-pagination-next {
      border-radius: 999px !important;
      border-color: transparent !important;
      background: transparent !important;
      min-width: 34px;
    }
    .deferrals-report-table .ant-pagination .ant-pagination-item-active {
      background: rgba(214, 189, 152, 0.18) !important;
      border-color: rgba(214, 189, 152, 0.18) !important;
    }
    .deferrals-report-table .ant-pagination .ant-pagination-item-active a {
      color: var(--color-text-dark) !important;
      font-weight: 700;
    }
    .deferrals-report-table .ant-pagination .ant-select-selector {
      border-radius: 999px !important;
    }
    .deferrals-report-primary {
      color: var(--color-text-dark);
      font-size: 13px;
      font-weight: 400;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .deferrals-report-muted {
      color: var(--color-text-medium);
      font-size: 12px;
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .deferrals-report-center {
      display: inline-flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .deferrals-report-header-center {
      display: inline-flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .deferrals-report-overdue {
      display: inline-flex;
      min-width: 36px;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .deferrals-report-status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 24px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.2;
      white-space: nowrap;
    }
    .deferrals-report-status--approved {
      background: rgba(21, 128, 61, 0.12);
      color: #166534;
    }
    .deferrals-report-status--rework {
      background: rgba(220, 38, 38, 0.1);
      color: #b91c1c;
    }
    .deferrals-report-status--pending {
      background: rgba(180, 83, 9, 0.12);
      color: #b45309;
    }
    .deferrals-report-status--qs-review {
      background: rgba(22, 70, 121, 0.1);
      color: var(--color-primary-dark);
    }
    @media (max-width: 768px) {
      .deferrals-report-table .ant-table-thead > tr > th,
      .deferrals-report-table .ant-table-tbody > tr > td {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
      }
    }
  `;

  const handleCloseModal = () => {
    setSelectedDeferral(null);
    setLoadingDeferralId(null);
  };

  const handleRowClick = async (record) => {
    const recordId = record?._id || record?.id;
    setSelectedDeferral(record);

    if (!recordId) {
      return;
    }

    setLoadingDeferralId(String(recordId));

    try {
      const freshDeferral = await deferralApi.getDeferralById(recordId, token);
      if (freshDeferral) {
        setSelectedDeferral(freshDeferral);
      }
    } catch (error) {
      console.error("Failed to load report deferral details:", error);
      message.warning("Showing available deferral details only.");
    } finally {
      setLoadingDeferralId((current) =>
        current === String(recordId) ? null : current,
      );
    }
  };

  const renderSelectedDeferral = () => {
    if (!selectedDeferral) {
      return null;
    }

    const stage = getRmReportsStage(selectedDeferral);

    if (stage === "actioned") {
      return (
        <ActionedDeferralDetailsModal
          deferral={selectedDeferral}
          open
          onClose={handleCloseModal}
        />
      );
    }

    if (stage === "approver") {
      return (
        <ApproverDeferralDetailsModal
          deferral={selectedDeferral}
          open
          onClose={handleCloseModal}
          readOnly={true}
          token={token}
        />
      );
    }

    return (
      <RmDeferralDetailsModal
        deferral={selectedDeferral}
        open
        embedded
        onClose={handleCloseModal}
        activeTab="reports"
        readOnly={true}
      />
    );
  };

  if (!rows.length) {
    return (
      <Empty
        description="No deferrals found for the selected filters"
        style={{ marginTop: 24 }}
      />
    );
  }

  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      key: "deferralNumber",
      width: 128,
      ellipsis: true,
      render: (value) => <span className="deferrals-report-primary">{value || "-"}</span>,
    },
    {
      title: "DCL No",
      key: "dclNo",
      width: 108,
      ellipsis: true,
      render: (_, row) => (
        <span className="deferrals-report-primary">{row?.dclNo || row?.dclNumber || "-"}</span>
      ),
    },
    {
      title: "Customer",
      key: "customerName",
      width: 148,
      ellipsis: true,
      render: (_, row) => (
        <span className="deferrals-report-primary">
          {row?.customerName || row?.customerNumber || "-"}
        </span>
      ),
    },
    {
      title: "RM",
      key: "rm",
      width: 124,
      ellipsis: true,
      render: (_, row) => (
        <span className="deferrals-report-muted">
          {row?.createdBy?.name || row?.requestor?.name || "-"}
        </span>
      ),
    },
    {
      title: <span className="deferrals-report-header-center">Status</span>,
      dataIndex: "status",
      key: "status",
      width: 130,
      align: "center",
      ellipsis: true,
      render: (_, row) => {
        const statusMeta = getReportStatusMeta(row);

        return (
          <span className="deferrals-report-center">
            <span className={`deferrals-report-status deferrals-report-status--${statusMeta.variant}`}>
              {statusMeta.label}
            </span>
          </span>
        );
      },
    },
    {
      title: <span className="deferrals-report-header-center">Created</span>,
      key: "createdAt",
      width: 118,
      align: "center",
      ellipsis: true,
      render: (_, row) =>
        row?.createdAt ? (
          <span className="deferrals-report-center deferrals-report-muted">
            {dayjs(row.createdAt).format("DD MMM YYYY")}
          </span>
        ) : (
          <span className="deferrals-report-center deferrals-report-muted">-</span>
        ),
    },
    {
      title: <span className="deferrals-report-header-center">Due Date</span>,
      key: "dueDate",
      width: 118,
      align: "center",
      ellipsis: true,
      render: (_, row) => {
        const dueDate = getDueDate(row);
        return (
          <span className="deferrals-report-center deferrals-report-muted">
            {dueDate?.isValid() ? dueDate.format("DD MMM YYYY") : "-"}
          </span>
        );
      },
    },
    {
      title: <span className="deferrals-report-header-center">Overdue Days</span>,
      key: "overdueDays",
      align: "center",
      width: 110,
      render: (_, row) => {
        const overdueDays = getOverdueDays(row);
        return (
          <span className="deferrals-report-center">
            <span className="deferrals-report-primary deferrals-report-overdue">
              {overdueDays > 0 ? overdueDays : 0}
            </span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="deferrals-report-shell">
      <style>{customTableStyles}</style>
      {selectedDeferral ? (
        <div className="reports-review-surface creator-theme">
          {loadingDeferralId ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
              <Spin />
            </div>
          ) : null}
          {renderSelectedDeferral()}
        </div>
      ) : (
        <div className="deferrals-report-table">
          <Table
            size="middle"
            rowKey={(row, index) => String(row?._id || row?.id || row?.deferralNumber || index)}
            dataSource={rows}
            columns={columns}
            tableLayout="fixed"
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              position: ["bottomCenter"],
            }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
            })}
          />
        </div>
      )}
    </div>
  );
}