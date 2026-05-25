import React, { useMemo } from "react";
import { Empty, Table, Tooltip } from "antd";
import dayjs from "dayjs";
import { buildTATTableRows } from "./reportUtils";
import { DCL_DISPLAY_NAME } from "./reportTheme";
import useReportNow from "./useReportNow";

const renderStageValue = (stage) => {
  return (
    <span className="tat-consumed-metric">
      {stage?.label || "0m"}
    </span>
  );
};

export default function TATConsumedTable({ deferralRows = [], dclRows = [] }) {
  const now = useReportNow();
  const allRows = useMemo(() => buildTATTableRows(deferralRows, dclRows, now), [deferralRows, dclRows, now]);

  const getStatusMeta = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();

    if (normalizedStatus.includes("approved") || normalizedStatus.includes("completed") || normalizedStatus.includes("closed")) {
      return { label: "Approved", variant: "approved" };
    }

    if (normalizedStatus.includes("rejected") || normalizedStatus.includes("returned")) {
      return { label: normalizedStatus.includes("returned") ? "Returned" : "Rejected", variant: "rework" };
    }

    if (normalizedStatus.includes("review") || normalizedStatus.includes("checker") || normalizedStatus.includes("creator") || normalizedStatus.includes("approval")) {
      return { label: String(status || "In Progress").replace(/_/g, " "), variant: "review" };
    }

    return { label: String(status || "Pending").replace(/_/g, " "), variant: "pending" };
  };
  const customTableStyles = `
    .tat-consumed-table,
    .tat-consumed-table * {
      font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif !important;
    }
    .tat-consumed-table {
      background: var(--color-white);
      border-radius: 8px;
      padding: 0 16px 16px;
    }

    .tat-consumed-table .ant-table,
    .tat-consumed-table .ant-table-wrapper,
    .tat-consumed-table .ant-spin-nested-loading,
    .tat-consumed-table .ant-spin-container,
    .tat-consumed-table .ant-table-container,
    .tat-consumed-table .ant-table-content,
    .tat-consumed-table table,
    .tat-consumed-table thead,
    .tat-consumed-table tbody,
    .tat-consumed-table tr {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    .tat-consumed-table .ant-table {
      table-layout: fixed;
      width: 100%;
    }

    .tat-consumed-table .ant-table-container {
      background: inherit !important;
    }

    .tat-consumed-table .ant-table-content {
      overflow-x: hidden;
    }

    .tat-consumed-table .ant-table-thead > tr > th {
      background: transparent !important;
      font-weight: 600;
      color: var(--color-text-medium) !important;
      font-size: 11px !important;
      padding: 12px 12px !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
      text-transform: uppercase;
      border-right: none !important;
      line-height: 1.2;
    }

    .tat-consumed-table .ant-table-thead > tr > th.ant-table-cell-align-center {
      text-align: center !important;
    }

    .tat-consumed-table .ant-table-column-sorters {
      position: relative;
      width: 100%;
      justify-content: center;
      gap: 8px;
    }

    .tat-consumed-table .ant-table-thead > tr > th.ant-table-cell-align-center .ant-table-column-sorters {
      justify-content: center;
    }

    .tat-consumed-table .ant-table-thead > tr > th.ant-table-cell-align-center .ant-table-column-title {
      flex: 0 1 auto;
      text-align: center;
    }

    .tat-consumed-table .ant-table-thead > tr > th.ant-table-cell-align-center .ant-table-column-sorter {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      margin-inline-start: 0;
    }

    .tat-consumed-table .ant-table-tbody > tr > td {
      background: transparent !important;
      border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
      padding: 12px 12px !important;
      color: var(--color-text-medium);
      font-size: 12px !important;
      border-right: none !important;
      line-height: 1.25;
      border-top: none !important;
    }

    .tat-consumed-table .ant-table-thead > tr > th::before,
    .tat-consumed-table .ant-table-cell::before,
    .tat-consumed-table .ant-table-cell::after,
    .tat-consumed-table .ant-table-wrapper::before,
    .tat-consumed-table .ant-table-wrapper::after,
    .tat-consumed-table .ant-table-container::before,
    .tat-consumed-table .ant-table-container::after,
    .tat-consumed-table .ant-table-thead > tr::after,
    .tat-consumed-table .ant-table-tbody > tr::after {
      display: none !important;
    }

    .tat-consumed-table .ant-table-tbody > tr:hover > td {
      background-color: rgba(214, 189, 152, 0.06) !important;
      cursor: pointer;
    }

    .tat-consumed-table .ant-table-tbody > tr > td:first-child,
    .tat-consumed-table .ant-table-thead > tr > th:first-child {
      padding-left: 0 !important;
    }

    .tat-consumed-table .ant-table-tbody > tr > td:last-child,
    .tat-consumed-table .ant-table-thead > tr > th:last-child {
      padding-right: 0 !important;
    }

    .tat-consumed-table .ant-pagination {
      margin-top: 18px !important;
      margin-bottom: 0 !important;
      text-align: center;
    }

    .tat-consumed-table .ant-pagination .ant-pagination-item,
    .tat-consumed-table .ant-pagination .ant-pagination-prev,
    .tat-consumed-table .ant-pagination .ant-pagination-next {
      border-radius: 999px !important;
      border-color: transparent !important;
      background: transparent !important;
      min-width: 34px;
    }

    .tat-consumed-table .ant-pagination .ant-pagination-item-active {
      background: rgba(214, 189, 152, 0.18) !important;
      border-color: rgba(214, 189, 152, 0.18) !important;
    }

    .tat-consumed-table .ant-pagination .ant-pagination-item-active a {
      color: var(--color-text-dark) !important;
      font-weight: 500;
    }

    .tat-consumed-table .ant-pagination .ant-select-selector {
      border-radius: 999px !important;
    }

    .tat-consumed-name {
      color: var(--color-text-dark);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .tat-consumed-meta {
      color: var(--color-text-medium);
      font-size: 11px;
    }

    .tat-consumed-metric {
      display: inline-flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-weight: 400;
      font-size: 12px;
      color: var(--color-text-medium);
    }

    .tat-consumed-type {
      display: inline-flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-weight: 400;
      color: var(--color-text-medium);
      font-size: 12px;
    }

    .tat-consumed-status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 24px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 400;
      line-height: 1.2;
      white-space: nowrap;
    }

    .tat-consumed-center {
      display: inline-flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .tat-consumed-header-center {
      display: inline-flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .tat-consumed-status--approved {
      background: rgba(21, 128, 61, 0.12);
      color: #166534;
    }

    .tat-consumed-status--pending {
      background: rgba(180, 83, 9, 0.12);
      color: #b45309;
    }

    .tat-consumed-status--review {
      background: rgba(22, 70, 121, 0.1);
      color: var(--color-primary-dark);
    }

    .tat-consumed-status--rework {
      background: rgba(220, 38, 38, 0.1);
      color: #b91c1c;
    }

    @media (max-width: 768px) {
      .tat-consumed-table {
        padding: 0 12px 12px;
      }

      .tat-consumed-table .ant-table-thead > tr > th,
      .tat-consumed-table .ant-table-tbody > tr > td {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
      }
    }
  `;

  const columns = [
    {
      title: "Item",
      dataIndex: "itemId",
      key: "itemId",
      width: 210,
      render: (text, record) => (
        <Tooltip title={record.itemId}>
          <div>
            <div className="tat-consumed-name">{text}</div>
            <div className="tat-consumed-meta">{record.customerName}</div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: <span className="tat-consumed-header-center">Type</span>,
      dataIndex: "workflowType",
      key: "workflowType",
      width: 100,
      align: "center",
      render: (text) => (
        <span className="tat-consumed-type">
          {text === "DCL" ? DCL_DISPLAY_NAME : text}
        </span>
      ),
    },
    {
      title: "Creation Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (date) => (
        <span className="tat-consumed-meta">
          {date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "N/A"}
        </span>
      ),
    },
    {
      title: <span className="tat-consumed-header-center">RM TAT</span>,
      dataIndex: "rmTat",
      key: "rmTat",
      width: 160,
      align: "center",
      render: (stage, record) => (
        <Tooltip
          title={record.rmCompletedAt ? `RM exit: ${dayjs(record.rmCompletedAt).format("DD/MM/YYYY HH:mm")}` : "Awaiting RM completion"}
        >
          {renderStageValue(stage)}
        </Tooltip>
      ),
      sorter: (a, b) => (a.rmTat.minutes || 0) - (b.rmTat.minutes || 0),
    },
    {
      title: <span className="tat-consumed-header-center">CO Creator TAT</span>,
      dataIndex: "coCreatorTat",
      key: "coCreatorTat",
      width: 160,
      align: "center",
      render: (stage, record) => (
        <Tooltip
          title={record.coCreatorCompletedAt ? `CO Creator exit: ${dayjs(record.coCreatorCompletedAt).format("DD/MM/YYYY HH:mm")}` : "Awaiting CO Creator completion"}
        >
          {renderStageValue(stage)}
        </Tooltip>
      ),
      sorter: (a, b) => (a.coCreatorTat.minutes || 0) - (b.coCreatorTat.minutes || 0),
    },
    {
      title: <span className="tat-consumed-header-center">CO Checker TAT</span>,
      dataIndex: "coCheckerTat",
      key: "coCheckerTat",
      width: 160,
      align: "center",
      render: (stage, record) => (
        <Tooltip
          title={record.coCheckerCompletedAt ? `Final action: ${dayjs(record.coCheckerCompletedAt).format("DD/MM/YYYY HH:mm")}` : "Awaiting CO Checker completion"}
        >
          {renderStageValue(stage)}
        </Tooltip>
      ),
      sorter: (a, b) => (a.coCheckerTat.minutes || 0) - (b.coCheckerTat.minutes || 0),
    },
    {
      title: <span className="tat-consumed-header-center">Total TAT</span>,
      dataIndex: "totalTatLabel",
      key: "totalTatLabel",
      width: 170,
      align: "center",
      render: (value, record) => (
        <Tooltip title={`Total Business TAT consumed: ${record.totalTatLabel.replace(/\s*\(in progress\)$/i, "")} (≈ ${record.totalTatDays} business days)`}>
          <div className="tat-consumed-metric">
            {value}
          </div>
        </Tooltip>
      ),
      sorter: (a, b) => (a.totalTatMinutes || 0) - (b.totalTatMinutes || 0),
    },
    {
      title: <span className="tat-consumed-header-center">Status</span>,
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusMeta = getStatusMeta(status);
        return (
          <span className="tat-consumed-center">
            <span className={`tat-consumed-status tat-consumed-status--${statusMeta.variant}`}>
              {statusMeta.label}
            </span>
          </span>
        );
      },
    },
  ];

  if (!allRows.length) {
    return (
      <Empty
        description="No TAT data available for the selected filters"
        style={{ marginTop: 24 }}
      />
    );
  }

  return (
    <div className="tat-consumed-table">
      <style>{customTableStyles}</style>
      <Table
        columns={columns}
        dataSource={allRows}
        rowKey="key"
        pagination={{
          pageSize: 20,
          total: allRows.length,
          showSizeChanger: true,
          showQuickJumper: true,
          position: ["bottomCenter"],
        }}
        size="small"
        bordered={false}
      />
    </div>
  );
}
