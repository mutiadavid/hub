import { Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import {
  SUCCESS_GREEN,
  ERROR_RED,
} from "../utils/constants";
import RealTimeSlaTag from "../../../../components/common/RealTimeSlaTag";

export const getDeferralTableColumns = () => [
  {
    title: "Deferral No",
    dataIndex: "deferralNumber",
    width: 150,
    render: (text) => (
      <div style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>{text}</div>
    ),
  },
  {
    title: "DCL No",
    dataIndex: "dclNo",
    width: 140,
    render: (text, record) => {
      const value = record.dclNo || record.dclNumber;
      return value ? (
        <div style={{ fontWeight: 600, color: "var(--color-text-medium)" }}>{value}</div>
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
    width: 220,
    render: (text) => (
      <div style={{ fontWeight: 600, color: "var(--color-text-dark)" }}>{text}</div>
    ),
  },
  {
    title: "Loan Type",
    dataIndex: "loanType",
    width: 120,
    render: (t) => <div style={{ color: "var(--color-text-light)" }}>{t || "—"}</div>,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 120,
    render: (status, record) => {
      const hasCreatorApproved = record.creatorApprovalStatus === "approved";
      const hasCheckerApproved = record.checkerApprovalStatus === "approved";

      let allApproversApproved = false;
      if (record.allApproversApproved === true) {
        allApproversApproved = true;
      } else if (record.approvals && record.approvals.length > 0) {
        allApproversApproved = record.approvals.every(
          (app) =>
            app.status === "approved" || app.approvalStatus === "approved",
        );
      } else if (record.coCreatorApprovalStatus === "approved") {
        allApproversApproved = true;
      }

      const isFullyApproved =
        hasCreatorApproved && hasCheckerApproved && allApproversApproved;
      const isPartiallyApproved =
        (hasCreatorApproved || hasCheckerApproved || allApproversApproved) &&
        !isFullyApproved;
      const isRejected =
        status === "rejected" || status === "deferral_rejected";

      if (isFullyApproved) {
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{
              fontWeight: 700,
              backgroundColor: `${SUCCESS_GREEN}15`,
              borderColor: SUCCESS_GREEN,
              color: SUCCESS_GREEN,
              borderRadius: 999,
            }}
          >
            Approved
          </Tag>
        );
      }

      if (isPartiallyApproved) {
        return (
          <Tag
            color="processing"
            style={{
              fontWeight: 700,
              borderRadius: 999,
              background: "rgba(214, 189, 152, 0.12)",
              color: "var(--color-primary-dark)",
              borderColor: "rgba(214, 189, 152, 0.35)",
            }}
          >
            Pending
          </Tag>
        );
      }

      if (isRejected) {
        return (
          <Tag
            icon={<CloseCircleOutlined />}
            color="error"
            style={{
              fontWeight: 700,
              backgroundColor: `${ERROR_RED}15`,
              borderColor: ERROR_RED,
              color: ERROR_RED,
              borderRadius: 999,
            }}
          >
            Rejected
          </Tag>
        );
      }

      return (
        <Tag
          color="processing"
          style={{
            fontWeight: 700,
            borderRadius: 999,
            background: "rgba(214, 189, 152, 0.12)",
            color: "var(--color-primary-dark)",
            borderColor: "rgba(214, 189, 152, 0.35)",
          }}
        >
          Pending
        </Tag>
      );
    },
  },
  {
    title: "Days Sought",
    dataIndex: "daysSought",
    width: 110,
    render: (d) => <div style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>{d || 0} days</div>,
  },
  {
    title: "SLA",
    dataIndex: "slaExpiry",
    width: 160,
    render: (s, record) => (
      <RealTimeSlaTag
        slaExpiry={s}
        startedAt={record?.createdAt}
        emptyLabel="Not set"
        minWidth={0}
        displayStyle="text"
        fontSize={12}
      />
    ),
  },
];

export default getDeferralTableColumns;
