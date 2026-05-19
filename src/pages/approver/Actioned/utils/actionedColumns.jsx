/**
 * Actioned Module - Table Column Definitions
 * Column configurations for the Actioned Deferrals main table
 */

import React from "react";
import { Typography, Tag } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  PRIMARY_BLUE,
  WARNING_ORANGE,
  PROCESSING_BLUE,
  SUCCESS_GREEN,
  ERROR_RED,
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

/**
 * Gets column definition for main actioned deferrals table
 * @returns {Array} - Ant Design table columns
 */
export const getActionedColumns = () => [
  {
    title: "Deferral No",
    dataIndex: "deferralNumber",
    key: "deferralNumber",
    width: 120,
    fixed: "left",
    render: (text) => (
      <div style={{ fontWeight: 400, color: "var(--color-text-dark)" }}>
        <FileTextOutlined style={{ marginRight: 6 }} />
        {text}
      </div>
    ),
  },
  {
    title: "DCL No",
    dataIndex: "dclNumber",
    key: "dclNumber",
    width: 100,
  },
  {
    title: "Customer Name",
    dataIndex: "customerName",
    key: "customerName",
    width: 180,
    render: (name) => (
      <Typography.Text style={{ color: "var(--color-text-dark)", fontSize: 13, fontWeight: 400 }}>
        {name}
      </Typography.Text>
    ),
  },
  {
    title: "Loan Type",
    dataIndex: "loanType",
    key: "loanType",
    width: 120,
    render: (loanType) => (
      <div style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-dark)" }}>{loanType}</div>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status, record) => {
      // If closed by RM metadata exists, show Withdrawn
      const withdrawnBy =
        record?.closedByName ||
        record?.ClosedByName ||
        record?.closedBy ||
        record?.closedByUser ||
        null;

      if (withdrawnBy) {
        return (
          <div style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-dark)" }}>
            Withdrawn
          </div>
        );
      }

      const config = statusToneMap[status] || {
        background: "rgba(64, 83, 76, 0.08)",
        color: "var(--color-text-dark)",
        text: status ? String(status).replace(/_/g, " ") : "Unknown",
      };

      return (
        <span
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "var(--color-text-dark)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 999,
            background: config.background,
            textTransform: "capitalize",
          }}
        >
          {config.icon}
          {config.text}
        </span>
      );
    },
  },
  {
    title: "TAT consumed",
    dataIndex: "slaExpiry",
    key: "slaExpiry",
    width: 100,
    render: (date, record) => {
      const slaDate = date || record?.slaExpiry || record?.deferral?.slaExpiry || null;
      const startedAt = record?.__extension?.createdAt || record?.createdAt || record?.deferral?.createdAt || null;
      const endedAt = record?.__extension?.updatedAt || record?.__extension?.approvedAt || record?.updatedAt || record?.approvedAt || record?.closedAt || null;

      return (
        <RealTimeSlaTag
          slaExpiry={slaDate}
          startedAt={startedAt}
          endedAt={endedAt}
          emptyLabel="Not set"
          minWidth={76}
          displayStyle="text"
          businessHoursOnly
        />
      );
    },
  },
];
