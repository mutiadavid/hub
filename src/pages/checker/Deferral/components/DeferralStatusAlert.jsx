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

const alertToneStyles = {
  success: {
    wrapperClassName: `border-[${SUCCESS_GREEN}36] bg-[${SUCCESS_GREEN}10]`,
    accentClassName: `text-[${SUCCESS_GREEN}]`,
  },
  error: {
    wrapperClassName: `border-[${ERROR_RED}36] bg-[${ERROR_RED}10]`,
    accentClassName: `text-[${ERROR_RED}]`,
  },
  warning: {
    wrapperClassName: `border-[${WARNING_ORANGE}36] bg-[${WARNING_ORANGE}10]`,
    accentClassName: `text-[${WARNING_ORANGE}]`,
  },
  info: {
    wrapperClassName: `border-[${PRIMARY_BLUE}28] bg-[${PRIMARY_BLUE}10]`,
    accentClassName: `text-[${PRIMARY_BLUE}]`,
  },
  accent: {
    wrapperClassName: "border-[rgba(214,189,152,0.32)] bg-[rgba(214,189,152,0.12)]",
    accentClassName: "text-(--color-primary-dark)",
  },
  lime: {
    wrapperClassName: `border-[${ACCENT_LIME}30] bg-[${ACCENT_LIME}10]`,
    accentClassName: `text-[${ACCENT_LIME}]`,
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
        className={`flex flex-col gap-3.5 rounded-lg border p-[18px] ${palette.wrapperClassName}`}
      >
        <div className="flex items-start gap-3">
          <div className={`text-[20px] leading-none ${palette.accentClassName}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className={`m-0 text-lg font-bold ${palette.accentClassName}`}>
              {title}
            </h3>
            <p className="mt-1.5 mb-0 text-[13px] leading-6 text-(--color-text-light)">
              {description}
            </p>
          </div>
        </div>

        {metadata ? (
          <div className="flex flex-wrap gap-2">
            {metadata.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1.5 text-xs font-semibold text-(--color-text-dark)"
              >
                <span className="font-medium text-[#64748b]">{item.label}:</span>
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
