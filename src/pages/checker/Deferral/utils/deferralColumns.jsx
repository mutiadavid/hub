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
    width: 160,
    render: (text) => (
      <div className="creator-table-primary-cell">
        <span className="creator-table-primary-value">{text || "-"}</span>
      </div>
    ),
  },
  {
    title: "DCL No",
    dataIndex: "dclNo",
    width: 160,
    render: (text, record) => {
      const value = record.dclNo || record.dclNumber;
      return value ? (
        <span className="creator-table-muted">{value}</span>
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
      <span className="creator-table-primary-value">{text || "-"}</span>
    ),
  },
  {
    title: "Loan Type",
    dataIndex: "loanType",
    width: 150,
    render: (t) => <span className="creator-table-muted">{t || "-"}</span>,
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 130,
    align: "center",
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
          <span className="creator-badge creator-badge--approved">Approved</span>
        );
      }

      if (isPartiallyApproved) {
        return (
          <span className="creator-badge creator-badge--qs-review">Pending</span>
        );
      }

      if (isRejected) {
        return (
          <span className="creator-badge creator-badge--rework">Rejected</span>
        );
      }

      return (
        <span className="creator-badge creator-badge--qs-review">Pending</span>
      );
    },
  },
  {
    title: "Days Sought",
    dataIndex: "daysSought",
    width: 120,
    align: "center",
    render: (d) => (
      <span className="creator-table-primary-value">{d || 0} days</span>
    ),
  },
  {
    title: "TAT Consumed",
    dataIndex: "slaExpiry",
    width: 160,
    align: "center",
    render: (s, record) => (
      <RealTimeSlaTag
        slaExpiry={s}
        startedAt={record?.createdAt}
        endedAt={["approved", "rejected", "deferral_approved", "deferral_rejected"].includes(String(record?.status).toLowerCase()) ? (record?.updatedAt || record?.approvedAt || null) : null}
        emptyLabel="Not set"
        minWidth={0}
        displayStyle="text"
        fontSize={12}
        businessHoursOnly
      />
    ),
  },
];

export default getDeferralTableColumns;
