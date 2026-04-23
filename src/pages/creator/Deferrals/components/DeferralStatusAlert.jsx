import React from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  PRIMARY_BLUE,
  ACCENT_LIME,
  SUCCESS_GREEN,
  ERROR_RED,
  WARNING_ORANGE,
  SECONDARY_PURPLE,
} from "../utils/styleConstants";
import { getReturnedForReworkReason } from "../utils/deferralHelpers";
import BankingSlaTimer from "../../../../components/common/BankingSlaTimer";

const alertBaseClassName = "mt-6 mb-[18px] rounded-lg border p-4";
const alertContentClassName = "mb-2 flex items-center gap-3";
const detailsClassName = "mt-2 pl-9 text-[13px] text-[#666]";

const toneClassNames = {
  success: {
    wrapper: "border-[#52c41a] bg-[#52c41a15]",
    icon: "text-[#52c41a]",
    title: "text-[#52c41a]",
  },
  error: {
    wrapper: "border-[#ff4d4f] bg-[#ff4d4f15]",
    icon: "text-[#ff4d4f]",
    title: "text-[#ff4d4f]",
  },
  warning: {
    wrapper: "border-[#faad14] bg-[#faad1415]",
    icon: "text-[#faad14]",
    title: "text-[#faad14]",
  },
  info: {
    wrapper: "border-[#164679] bg-[#16467915]",
    icon: "text-[#164679]",
    title: "text-[#164679]",
  },
  closed: {
    wrapper: "border-[#b5d334] bg-[#b5d33415]",
    icon: "text-[#b5d334]",
    title: "text-[#b5d334]",
  },
};

/**
 * DeferralStatusAlert Component
 * Displays real-time status of deferral with contextual messages
 *
 * Props:
 *   - deferral: Deferral object
 */
const DeferralStatusAlert = ({ deferral }) => {
  if (!deferral) return null;

  const status = (deferral.status || "").toLowerCase();

  // Determine approval status
  const hasCreatorApproved = deferral.creatorApprovalStatus === "approved";
  const hasCheckerApproved = deferral.checkerApprovalStatus === "approved";
  const isFullyApproved =
    deferral.deferralApprovalStatus === "approved" ||
    (hasCreatorApproved && hasCheckerApproved);
  const isRejected =
    status === "deferral_rejected" ||
    status === "rejected" ||
    deferral.deferralApprovalStatus === "rejected";
  const isReturned =
    status === "returned_for_rework" ||
    deferral.deferralApprovalStatus === "returned";

  const returnedForReworkReason = getReturnedForReworkReason(deferral);

  // Check for approvers approval
  let allApproversApprovedLocal = false;
  if (deferral.approvals && deferral.approvals.length > 0) {
    allApproversApprovedLocal = deferral.approvals.every(
      (app) => app.status === "approved",
    );
  }

  if (typeof deferral.allApproversApproved !== "undefined") {
    allApproversApprovedLocal = deferral.allApproversApproved === true;
  }

  const isPartiallyApproved =
    (hasCreatorApproved || hasCheckerApproved || allApproversApprovedLocal) &&
    !isFullyApproved;
  const isUnderReview =
    status === "deferral_requested" ||
    status === "pending_approval" ||
    status === "in_review";
  const isClosed =
    status === "closed" ||
    status === "deferral_closed" ||
    status === "closed_by_co" ||
    status === "closed_by_creator";
  const slaStorageKey = `creator-sla-${deferral._id || deferral.id || deferral.deferralNumber || "deferral"}`;
  const renderSlaTimer = (completed = false) => {
    if (!deferral?.createdAt && !deferral?.slaExpiry) {
      return null;
    }

    return (
      <BankingSlaTimer
        storageKey={slaStorageKey}
        startedAt={deferral.createdAt}
        completed={completed}
        completedAt={completed ? deferral.closedAt || deferral.updatedAt : null}
        slaExpiry={deferral.slaExpiry}
        excludeWeekends
      />
    );
  };

  const AlertContent = ({
    tone,
    icon,
    title,
    message,
    details,
  }) => {
    const palette = toneClassNames[tone];

    return (
    <div className={`${alertBaseClassName} ${palette.wrapper}`}>
      <div className={alertContentClassName}>
        <div className={palette.icon}>{icon}</div>
        <div>
          <h3 className={`m-0 font-bold ${palette.title}`}>
            {title}
          </h3>
          <p className="m-1 text-sm text-[#666]">{message}</p>
        </div>
      </div>
      {details && (
        <div className={detailsClassName}>
          {details}
        </div>
      )}
    </div>
  );
  };

  // Fully Approved Status
  if (isFullyApproved) {
    return (
      <AlertContent
        tone="success"
        icon={<CheckCircleOutlined className="text-2xl" />}
        title="Deferral Fully Approved ✓"
        message="All approvers, Creator, and Checker have approved this deferral request. You can now submit the deferred document before or during the next due date."
      />
    );
  }

  // Rejected Status
  if (isRejected) {
    return (
      <AlertContent
        tone="error"
        icon={<CloseCircleOutlined className="text-2xl" />}
        title="Deferral Rejected ✗"
        message={`This deferral request has been rejected.${
          deferral.rejectionReason ? ` Reason: ${deferral.rejectionReason}` : ""
        }`}
      />
    );
  }

  // Returned for Rework Status
  if (isReturned) {
    return (
      <AlertContent
        tone="warning"
        icon={<WarningOutlined className="text-2xl" />}
        title="Returned for Rework"
        message={`This deferral has been returned for rework.${
          returnedForReworkReason ? ` Reason: ${returnedForReworkReason}` : ""
        }`}
      />
    );
  }

  // Partially Approved Status
  if (isPartiallyApproved) {
    const details = (
      <div>
        <div>
          Approvers: {allApproversApprovedLocal ? "All Approved" : "Pending"}
        </div>
        <div>CO Creator: {hasCreatorApproved ? "Approved" : "Pending"}</div>
        <div>CO Checker: {hasCheckerApproved ? "Approved" : "Pending"}</div>
        {renderSlaTimer(false)}
      </div>
    );
    return (
      <AlertContent
        tone="info"
        title={
          allApproversApprovedLocal
            ? "Pending CO Creator & Checker Approval"
            : "Deferral Partially Approved"
        }
        message={
          allApproversApprovedLocal
            ? "All approvers have approved. Awaiting CO Creator and CO Checker approval to complete the process."
            : "Awaiting approvals from remaining parties."
        }
        details={details}
      />
    );
  }

  // Under Review Status
  if (isUnderReview) {
    const details = renderSlaTimer(false);
    return (
      <div className={`${alertBaseClassName} ${toneClassNames.info.wrapper}`}>
        <div className={alertContentClassName}>
          <ClockCircleOutlined className={`text-2xl ${toneClassNames.info.icon}`} />
          <div>
            <h3 className={`m-0 font-bold ${toneClassNames.info.title}`}>
              Under Review by Approvers
            </h3>
            <p className="m-1 text-sm text-[#666]">
              This deferral request is currently awaiting approval from the
              approval chain
            </p>
          </div>
        </div>
        {details}
      </div>
    );
  }

  // Closed Status
  if (isClosed) {
    return (
      <AlertContent
        tone="closed"
        icon={<CheckCircleOutlined className="text-2xl" />}
        title="Document Submitted - Awaiting Approval"
        message="The deferred document has been submitted and is awaiting final approval from the Checker."
        details={renderSlaTimer(true)}
      />
    );
  }

  return null;
};

export default DeferralStatusAlert;
