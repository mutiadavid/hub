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

  // Base alert styles
  const alertBaseStyle = {
    border: "1px solid",
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
    marginTop: 24,
  };

  const AlertContent = ({
    bgColor,
    borderColor,
    icon,
    title,
    message,
    details,
  }) => (
    <div style={{ backgroundColor: bgColor, borderColor, ...alertBaseStyle }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        {icon}
        <div>
          <h3 style={{ margin: 0, color: borderColor, fontWeight: 700 }}>
            {title}
          </h3>
          <p style={{ margin: 4, color: "#666", fontSize: 14 }}>{message}</p>
        </div>
      </div>
      {details && (
        <div
          style={{ fontSize: 13, color: "#666", marginTop: 8, paddingLeft: 36 }}
        >
          {details}
        </div>
      )}
    </div>
  );

  // Fully Approved Status
  if (isFullyApproved) {
    return (
      <AlertContent
        bgColor={`${SUCCESS_GREEN}15`}
        borderColor={SUCCESS_GREEN}
        icon={
          <CheckCircleOutlined style={{ color: SUCCESS_GREEN, fontSize: 24 }} />
        }
        title="Deferral Fully Approved ✓"
        message="All approvers, Creator, and Checker have approved this deferral request. You can now submit the deferred document before or during the next due date."
      />
    );
  }

  // Rejected Status
  if (isRejected) {
    return (
      <AlertContent
        bgColor={`${ERROR_RED}15`}
        borderColor={ERROR_RED}
        icon={
          <CloseCircleOutlined style={{ color: ERROR_RED, fontSize: 24 }} />
        }
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
        bgColor={`${WARNING_ORANGE}15`}
        borderColor={WARNING_ORANGE}
        icon={
          <WarningOutlined style={{ color: WARNING_ORANGE, fontSize: 24 }} />
        }
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
        bgColor={`${PRIMARY_BLUE}15`}
        borderColor={PRIMARY_BLUE}
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
      <div
        style={{
          backgroundColor: `${PRIMARY_BLUE}15`,
          borderColor: PRIMARY_BLUE,
          ...alertBaseStyle,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <ClockCircleOutlined style={{ color: PRIMARY_BLUE, fontSize: 24 }} />
          <div>
            <h3 style={{ margin: 0, color: PRIMARY_BLUE, fontWeight: 700 }}>
              Under Review by Approvers
            </h3>
            <p style={{ margin: 4, color: "#666", fontSize: 14 }}>
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
        bgColor={`${ACCENT_LIME}15`}
        borderColor={ACCENT_LIME}
        icon={
          <CheckCircleOutlined style={{ color: ACCENT_LIME, fontSize: 24 }} />
        }
        title="Document Submitted - Awaiting Approval"
        message="The deferred document has been submitted and is awaiting final approval from the Checker."
        details={renderSlaTimer(true)}
      />
    );
  }

  return null;
};

export default DeferralStatusAlert;
