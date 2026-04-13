import React from "react";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  PRIMARY_BLUE,
  SUCCESS_GREEN,
  ERROR_RED,
  WARNING_ORANGE,
  PROCESSING_BLUE,
} from "./constants";
import RealTimeSlaTag from "../../../../components/common/RealTimeSlaTag";

const statusToneMap = {
  pending_approval: {
    background: "rgba(214, 189, 152, 0.18)",
    color: "#7b5d31",
    text: "Pending approval",
    icon: <ClockCircleOutlined />,
  },
  in_review: {
    background: "rgba(89, 126, 108, 0.12)",
    color: "#40534c",
    text: "In review",
    icon: <ClockCircleOutlined />,
  },
  approved: {
    background: "rgba(94, 140, 106, 0.14)",
    color: "#346144",
    text: "Approved",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    background: "rgba(179, 69, 50, 0.12)",
    color: "#8d3a2a",
    text: "Rejected",
    icon: <CloseCircleOutlined />,
  },
};

const queueTextStyles = {
  primaryCell: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 0,
  },
  primaryValue: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    color: "var(--color-text-dark)",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  secondaryValue: {
    color: "var(--color-text-light)",
    fontSize: 11,
    lineHeight: 1.2,
  },
  mutedValue: {
    color: "var(--color-text-medium)",
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.2,
  },
};

const resolveRecordValue = (record, keys = []) => {
  for (const key of keys) {
    if (!key) continue;
    const path = Array.isArray(key) ? key : String(key).split(".");
    let value = record;
    for (const segment of path) {
      if (value == null) break;
      value = value[segment];
    }
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
};

const renderPrimaryQueueCell = (value, subtitle) => (
  <div style={queueTextStyles.primaryCell}>
    <span style={queueTextStyles.primaryValue}>
      <FileTextOutlined style={{ fontSize: 14, color: "var(--color-text-light)" }} />
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
        {value || "-"}
      </span>
    </span>
    <span style={queueTextStyles.secondaryValue}>{subtitle}</span>
  </div>
);

const renderMutedValue = (value, options = {}) => {
  const color = options.color || queueTextStyles.mutedValue.color;
  const fontWeight = options.fontWeight || queueTextStyles.mutedValue.fontWeight;

  return (
    <span
      style={{
        ...queueTextStyles.mutedValue,
        color,
        fontWeight,
      }}
    >
      {value || "-"}
    </span>
  );
};

export const renderQueueStatusTag = (status) => {
  const config = statusToneMap[status] || {
    background: "rgba(64, 83, 76, 0.08)",
    color: "var(--color-text-medium)",
    text: status ? String(status).replace(/_/g, " ") : "Unknown",
  };

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: config.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3px 12px",
        borderRadius: 999,
        background: config.background,
        textTransform: "capitalize",
        minWidth: 68,
        lineHeight: 1.2,
      }}
    >
      {config.text}
    </span>
  );
};

export const renderQueueSla = (date, record, pendingStatuses = ["pending_approval", "in_review"]) => {
  if (!pendingStatuses.includes(record?.status)) {
    return <div style={{ fontSize: 11, color: "#999" }}>N/A</div>;
  }

  return (
    <RealTimeSlaTag
      slaExpiry={date}
      startedAt={record?.createdAt}
      emptyLabel="N/A"
      minWidth={60}
      displayStyle="text"
    />
  );
};

/**
 * Get deferral queue table columns configuration
 * @param {function} onRowClick - Callback when row is clicked
 * @returns {array} Column definitions
 */
export const getDeferralColumns = (onRowClick) => [
  {
    title: "DEFERRAL NO",
    dataIndex: "deferralNumber",
    width: 220,
    fixed: "left",
    render: (deferralNumber) => renderPrimaryQueueCell(deferralNumber, "Deferral request"),
  },
  {
    title: "DCL NO",
    dataIndex: "dclNumber",
    width: 170,
    render: (_, record) =>
      renderMutedValue(
        resolveRecordValue(record, ["dclNumber", "dclNo", "checklistNumber", "checklist.dclNo"]),
        { color: "#7A5C93", fontWeight: 600 },
      ),
  },
  {
    title: "CUSTOMER NAME",
    dataIndex: "customerName",
    width: 210,
    render: (customerName, record) =>
      renderMutedValue(
        customerName || resolveRecordValue(record, ["customer.name", "customerName"]),
        { color: "var(--color-text-dark)", fontWeight: 600 },
      ),
  },
  {
    title: "LOAN TYPE",
    dataIndex: "loanType",
    width: 210,
    render: (loanType, record) =>
      renderMutedValue(
        loanType || resolveRecordValue(record, ["loanType", "facilityType", "productType"]),
      ),
  },
  {
    title: "STATUS",
    dataIndex: "status",
    width: 140,
    render: (status) => renderQueueStatusTag(status),
  },
  {
    title: "TAT consumed",
    dataIndex: "slaExpiry",
    width: 110,
    render: (date, record) => renderQueueSla(date, record),
  },
];

/**
 * Get extension applications table columns configuration
 * @param {function} onRowClick - Callback when row is clicked
 * @returns {array} Column definitions
 */
export const getExtensionColumns = (onRowClick) => [
  {
    title: "DEFERRAL NO",
    dataIndex: "deferralNumber",
    width: 220,
    render: (v, r) =>
      renderPrimaryQueueCell(
        resolveRecordValue(r, ["deferralNumber", "deferral.deferralNumber", "deferralNo"]),
        "Extension application",
      ),
  },
  {
    title: "DCL NO",
    dataIndex: "dclNumber",
    width: 170,
    render: (_, record) =>
      renderMutedValue(
        resolveRecordValue(record, ["dclNumber", "dclNo", "deferral.dclNumber", "deferral.dclNo"]),
        { color: "#7A5C93", fontWeight: 600 },
      ),
  },
  {
    title: "CUSTOMER NAME",
    dataIndex: "customerName",
    width: 210,
    render: (v, record) =>
      renderMutedValue(
        v || resolveRecordValue(record, ["deferral.customerName", "customer.name"]),
        { color: "var(--color-text-dark)", fontWeight: 600 },
      ),
  },
  {
    title: "LOAN TYPE",
    dataIndex: "loanType",
    width: 210,
    render: (v, record) =>
      renderMutedValue(
        v || resolveRecordValue(record, ["deferral.loanType", "loanType", "productType"]),
      ),
  },
  {
    title: "STATUS",
    dataIndex: "status",
    width: 140,
    render: (status) => renderQueueStatusTag(status),
  },
  {
    title: "TAT consumed",
    dataIndex: "slaExpiry",
    width: 110,
    render: (_, record) =>
      renderQueueSla(
        resolveRecordValue(record, ["slaExpiry", "deferral.slaExpiry", "deferral.nextDueDate"]),
        record,
        ["pending", "pending_approval", "in_review"],
      ),
  },
];

/**
 * Get facility table columns (used in deferral detail modal)
 * @returns {array} Column definitions
 */
export const getDeferralDetailColumns = () => [
  {
    title: "Asset Class",
    dataIndex: "assetClass",
    width: 150,
    render: (text) => (
      <span style={{ fontSize: 12, fontWeight: 500 }}>{text || "N/A"}</span>
    ),
  },
  {
    title: "Currency",
    dataIndex: "currency",
    width: 120,
    render: (text) => (
      <span style={{ fontSize: 12, fontWeight: 500 }}>{text || "N/A"}</span>
    ),
  },
  {
    title: "Amount",
    dataIndex: "amount",
    width: 140,
    align: "right",
    render: (amount) => (
      <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY_BLUE }}>
        {amount ? `${amount.toLocaleString()}` : "N/A"}
      </span>
    ),
  },
  {
    title: "Facility Name",
    dataIndex: "facilityName",
    width: 180,
    render: (text) => (
      <span style={{ fontSize: 12, fontWeight: 500 }}>{text || "N/A"}</span>
    ),
  },
];

/**
 * Get document table columns (used in deferral detail modal)
 * @returns {array} Column definitions
 */
export const getDocumentColumns = () => [
  {
    title: "Document Name",
    dataIndex: "documentName",
    align: "left",
    render: (text) => (
      <span style={{ fontSize: 12, fontWeight: 500 }}>{text || "N/A"}</span>
    ),
  },
  {
    title: "Document Type",
    dataIndex: "documentType",
    width: 140,
    render: (text) => (
      <span style={{ fontSize: 11 }}>{text ? String(text).toUpperCase() : "N/A"}</span>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 120,
    render: (status) => {
      const statusColors = {
        submitted: SUCCESS_GREEN,
        pending: WARNING_ORANGE,
        approved: SUCCESS_GREEN,
        rejected: ERROR_RED,
      };
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusColors[status] || "#666",
            textTransform: "capitalize",
          }}
        >
          {status || "N/A"}
        </span>
      );
    },
  },
];
