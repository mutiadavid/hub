import React from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  PRIMARY_BLUE,
  ACCENT_LIME,
  SUCCESS_GREEN,
  ERROR_RED,
  WARNING_ORANGE,
} from "../utils/constants";
import { getReturnedForReworkReason } from "../utils/helpers.jsx";
import "../../../../styles/creatorDesignSystem.css";

const alertToneStyles = {
  success: {
    backgroundColor: `${SUCCESS_GREEN}10`,
    borderColor: `${SUCCESS_GREEN}36`,
    accentColor: SUCCESS_GREEN,
  },
  error: {
    backgroundColor: `${ERROR_RED}10`,
    borderColor: `${ERROR_RED}36`,
    accentColor: ERROR_RED,
  },
  warning: {
    backgroundColor: `${WARNING_ORANGE}10`,
    borderColor: `${WARNING_ORANGE}36`,
    accentColor: WARNING_ORANGE,
  },
  info: {
    backgroundColor: `${PRIMARY_BLUE}10`,
    borderColor: `${PRIMARY_BLUE}28`,
    accentColor: PRIMARY_BLUE,
  },
  accent: {
    backgroundColor: `rgba(214, 189, 152, 0.12)`,
    borderColor: `rgba(214, 189, 152, 0.32)`,
    accentColor: "var(--color-primary-dark)",
  },
  lime: {
    backgroundColor: `${ACCENT_LIME}10`,
    borderColor: `${ACCENT_LIME}30`,
    accentColor: ACCENT_LIME,
  },
};

const DeferralStatusAlert = ({ deferral }) => {
  if (!deferral) return null;

  const status = (deferral.status || "").toLowerCase();
  const normalizedCreatorApprovalStatus = String(
    deferral.creatorApprovalStatus || deferral.creatorStatus || "",
  )
    .trim()
    .toLowerCase();
  const normalizedCheckerApprovalStatus = String(
    deferral.checkerApprovalStatus || deferral.checkerStatus || "",
  )
    .trim()
    .toLowerCase();
  const approvalFlow = Array.isArray(deferral.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral.approvers)
      ? deferral.approvers
      : [];
  const approvedApproversCount = approvalFlow.filter(
    (approver) => approver?.approved === true || approver?.approvalStatus === "approved",
  ).length;
  const allApproversApproved = approvalFlow.length > 0
    ? approvedApproversCount === approvalFlow.length
    : deferral.allApproversApproved === true;
  const hasCreatorApproved = normalizedCreatorApprovalStatus === "approved";
  const hasCheckerApproved = normalizedCheckerApprovalStatus === "approved";
  const currentApprover = approvalFlow.find(
    (approver) => approver?.isCurrent === true || approver?.current === true,
  );
  const currentApproverLabel =
    currentApprover?.designation || currentApprover?.role || currentApprover?.name || currentApprover?.user?.name || null;

  const isFullyApproved =
    hasCreatorApproved && hasCheckerApproved && allApproversApproved;
  const isRejected =
    status === "deferral_rejected" ||
    status === "rejected" ||
    deferral.deferralApprovalStatus === "rejected";
  const isReturned =
    status === "returned_for_rework" ||
    deferral.deferralApprovalStatus === "returned";
  const isPartiallyApproved =
    (hasCreatorApproved || allApproversApproved) && !isFullyApproved;
  const isClosed =
    status === "closed" ||
    status === "deferral_closed" ||
    status === "closed_by_co" ||
    status === "closed_by_creator";
  const isUnderReview =
    status === "deferral_requested" ||
    status === "pending_approval" ||
    status === "in_review" ||
    (!isRejected && !isReturned && !isClosed && !isFullyApproved && !isPartiallyApproved);

  const returnedForReworkReason = getReturnedForReworkReason(deferral);

  const renderAlert = ({ tone, icon, title, description, metadata }) => {
    const palette = alertToneStyles[tone];

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 18,
          background: palette.backgroundColor,
          border: `1px solid ${palette.borderColor}`,
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ color: palette.accentColor, fontSize: 20, lineHeight: 1 }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, color: palette.accentColor, fontWeight: 700, fontSize: 18 }}>
              {title}
            </h3>
            <p style={{ margin: "6px 0 0", color: "var(--color-text-light)", fontSize: 13, lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
        </div>

        {metadata ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {metadata.map((item) => (
              <span
                key={item.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  background: "rgba(255, 255, 255, 0.72)",
                  color: "var(--color-text-dark)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "#64748b", fontWeight: 500 }}>{item.label}:</span>
                <span>{item.value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  // Fully Approved Status
  if (isFullyApproved) {
    return renderAlert({
      tone: "success",
      icon: <CheckCircleOutlined />,
      title: "Deferral fully approved",
      description:
        "All approvers, Creator, and Checker have approved this deferral request. The document submission is authorized.",
      metadata: [
        { label: "Approvers", value: "All Approved" },
        { label: "Creator", value: "Approved" },
        { label: "Checker", value: "Approved" },
      ],
    });
  }

  // Rejected Status
  if (isRejected) {
    return renderAlert({
      tone: "error",
      icon: <CloseCircleOutlined />,
      title: "Deferral rejected",
      description: deferral.rejectionReason
        ? `This deferral request has been rejected. Reason: ${deferral.rejectionReason}`
        : "This deferral request has been rejected.",
      metadata: [
        { label: "Status", value: "Rejected" },
        { label: "Creator", value: hasCreatorApproved ? "Approved" : "Pending" },
        { label: "Checker", value: hasCheckerApproved ? "Approved" : "Pending" },
      ],
    });
  }

  // Returned for Rework Status
  if (isReturned) {
    return renderAlert({
      tone: "warning",
      icon: <WarningOutlined />,
      title: "Returned for rework",
      description: returnedForReworkReason
        ? `This deferral has been returned for rework. Reason: ${returnedForReworkReason}`
        : "This deferral has been returned for rework.",
      metadata: [
        { label: "Approvers", value: allApproversApproved ? "All Approved" : "Pending" },
        { label: "Creator", value: hasCreatorApproved ? "Approved" : "Pending" },
        { label: "Checker", value: hasCheckerApproved ? "Approved" : "Pending" },
      ],
    });
  }

  // Partially Approved Status
  if (isPartiallyApproved) {
    return renderAlert({
      tone: "accent",
      title: "Deferral partially approved",
      description: hasCreatorApproved && !hasCheckerApproved
        ? "Creator has approved. Awaiting Checker approval to finalize."
        : allApproversApproved
          ? "All approvers have approved. Awaiting Creator and Checker completion."
          : "The approval process is in progress across the workflow.",
      metadata: [
        { label: "Approvers", value: allApproversApproved ? "All Approved" : "Pending" },
        { label: "Creator", value: hasCreatorApproved ? "Approved" : "Pending" },
        { label: "Checker", value: hasCheckerApproved ? "Approved" : "Pending" },
      ],
    });
  }

  // Under Review Status
  if (isUnderReview) {
    return renderAlert({
      tone: "info",
      icon: <ClockCircleOutlined />,
      title: allApproversApproved
        ? "Awaiting Creator and Checker Approval"
        : currentApproverLabel
          ? `Under review by ${currentApproverLabel}`
          : "Under review by approvers",
      description: allApproversApproved
        ? "This deferral request has cleared the approver chain and is waiting for creator and checker approval."
        : currentApproverLabel
          ? `This deferral request is currently awaiting approval from ${currentApproverLabel}.`
          : "This deferral request is currently undergoing approval from the designated approvers.",
      metadata: [
        { label: "Approvers", value: `${approvedApproversCount} of ${approvalFlow.length} Approved` },
        { label: "Creator", value: hasCreatorApproved ? "Approved" : "Pending" },
        { label: "Checker", value: hasCheckerApproved ? "Approved" : "Pending" },
      ],
    });
  }

  // Closed Status
  if (isClosed) {
    return renderAlert({
      tone: "lime",
      icon: <CheckCircleOutlined />,
      title: "Document submitted and verified",
      description:
        "The deferred document has been submitted and verified by all required parties.",
      metadata: [
        { label: "Approvers", value: allApproversApproved ? "All Approved" : "Pending" },
        { label: "Creator", value: hasCreatorApproved ? "Approved" : "Pending" },
        { label: "Checker", value: hasCheckerApproved ? "Approved" : "Pending" },
      ],
    });
  }

  return null;
};

export default DeferralStatusAlert;
