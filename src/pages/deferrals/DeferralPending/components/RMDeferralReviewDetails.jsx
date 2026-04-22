import React from "react";
import { Card, Descriptions, Table, Typography } from "antd";
import dayjs from "dayjs";
import getFacilityColumns from "../../../../utils/facilityColumns";

const toSentenceCase = (str) => {
  if (!str) return "-";
  const s = String(str).trim().toLowerCase();
  if (!s) return "-";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const RMDeferralReviewDetails = ({
  primaryBlue,
  successGreen,
  warningOrange,
  displayDeferral,
  isWithdrawnDeferral,
  isRejectedDeferral,
  isReturnedForReworkDeferral,
  isApprovedTabContext,
  withdrawalActor,
  withdrawalReasonText,
  rejectionActor,
  rejectionReasonText,
  returnedForReworkActor,
  returnedForReworkReasonText,
  allApproversApproved,
  currentApproverLabel,
  approvedApproversCount,
  approvalFlow,
  creatorApproved,
  checkerApproved,
  deferralStatusColor,
  deferralStatusLabel,
  requestedDocsWithDates,
  generalUploadedDocs,
  approvalFlowExpanded,
  onToggleApprovalFlow,
  approvalFlowColumns,
}) => {
  return (
    <>
      <Card
        style={{
          marginBottom: 18,
          borderLeft: `4px solid ${isWithdrawnDeferral || isRejectedDeferral ? "#ff4d4f" : isReturnedForReworkDeferral ? warningOrange : isApprovedTabContext ? successGreen : primaryBlue}`,
        }}
      >
        {isWithdrawnDeferral ? (
          <>
            <div style={{ color: "#ff4d4f", fontWeight: 600, fontSize: 14 }}>
              Deferral Withdrawn
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.45 }}>
              This deferral has been withdrawn by {withdrawalActor}.
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic", lineHeight: 1.45 }}>
              <b>Withdrawal Reason:</b> {withdrawalReasonText}
            </div>
          </>
        ) : isRejectedDeferral ? (
          <>
            <div style={{ color: "#ff4d4f", fontWeight: 600, fontSize: 14 }}>
              Deferral Rejected
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.45 }}>
              This deferral has been rejected by {rejectionActor}.
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic", lineHeight: 1.45 }}>
              <b>Rejection Reason:</b> {rejectionReasonText}
            </div>
          </>
        ) : isReturnedForReworkDeferral ? (
          <>
            <div style={{ color: warningOrange, fontWeight: 600, fontSize: 14 }}>
              Returned for Rework
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.45 }}>
              This deferral has been returned for rework by {returnedForReworkActor}.
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic", lineHeight: 1.45 }}>
              <b>Rework Reason:</b> {returnedForReworkReasonText}
            </div>
          </>
        ) : isApprovedTabContext ? (
          <>
            <div style={{ color: successGreen, fontWeight: 600, fontSize: 14 }}>
              Deferral Fully Approved
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.45 }}>
              This deferral appears under the approved tab, so the approval flow is complete and no further approvals are pending.
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic", lineHeight: 1.45 }}>
              <b>Approval Progress:</b> {approvalFlow.length} of {approvalFlow.length} approvers approved. Creator approved; Checker approved.
            </div>
          </>
        ) : (
          <>
            <div style={{ color: primaryBlue, fontWeight: 600, fontSize: 14 }}>
              {allApproversApproved
                ? "Awaiting Creator and Checker Closure"
                : currentApproverLabel !== "System"
                  ? `Under Review by ${currentApproverLabel}`
                  : "Under Review by Approvers"}
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.45 }}>
              {allApproversApproved
                ? "This deferral is awaiting co creator and checker closure"
                : currentApproverLabel !== "System"
                  ? `This deferral request is currently awaiting approval from ${currentApproverLabel}.`
                  : "This deferral request is currently undergoing approval from the designated approvers."}
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic", lineHeight: 1.45 }}>
              <b>Approval Progress:</b> {approvedApproversCount} of {approvalFlow.length} approvers approved. Creator {creatorApproved ? "approved" : "pending"}; Checker {checkerApproved ? "approved" : "pending"}.
            </div>
          </>
        )}
      </Card>

      <Card
        className="deferral-info-card deferral-review-section"
        size="small"
        title={<span style={{ color: "var(--color-heading)" }}>Customer Information</span>}
        style={{ marginBottom: 18 }}
      >
        <Descriptions className="deferral-review-summary" size="middle" column={{ xs: 1, sm: 3, lg: 3 }}>
          <Descriptions.Item label="Customer Name">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {displayDeferral.customerName}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Customer Number">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {displayDeferral.customerNumber}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Loan Type">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {toSentenceCase(displayDeferral.loanType)}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        className="deferral-info-card deferral-review-section"
        size="small"
        title={<span style={{ color: "var(--color-heading)" }}>Deferral Details</span>}
        style={{ marginBottom: 18 }}
      >
        <Descriptions className="deferral-review-summary" size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="Deferral Number">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {displayDeferral.deferralNumber}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="DCL No">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {displayDeferral.dclNumber || displayDeferral.dclNo || "-"}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Typography.Text style={{ color: deferralStatusColor, fontWeight: 500 }}>
              {deferralStatusLabel}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Creator Status">
            <Typography.Text style={{ color: creatorApproved ? "green" : "var(--color-text-dark)", fontWeight: 500 }}>
              {creatorApproved ? "Approved" : "Pending"}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Checker Status">
            <Typography.Text style={{ color: checkerApproved ? "green" : "var(--color-text-dark)", fontWeight: 500 }}>
              {checkerApproved ? "Approved" : "Pending"}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Approver Status">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {`${approvedApproversCount} of ${approvalFlow.length} Approved`}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Loan Amount">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {displayDeferral.loanAmountCategory || "Below 75 million"}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            <Typography.Text style={{ color: "var(--color-text-dark)", fontWeight: 500 }}>
              {displayDeferral.createdAt || displayDeferral.CreatedAt
                ? dayjs(displayDeferral.createdAt || displayDeferral.CreatedAt).format("DD MMM YYYY")
                : "-"}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        className="deferral-review-section"
        size="small"
        title={<span style={{ color: "var(--color-heading)" }}>Review Summary</span>}
        style={{ marginBottom: 18 }}
      >
        <div className="deferral-review-stats">
          <div className="deferral-review-stat">
            <div className="deferral-review-stat__label">Requested Docs</div>
            <div className="deferral-review-stat__value">{requestedDocsWithDates.length}</div>
          </div>
          <div className="deferral-review-stat">
            <div className="deferral-review-stat__label">Uploaded Docs</div>
            <div className="deferral-review-stat__value">{generalUploadedDocs.length}</div>
          </div>
          <div className="deferral-review-stat">
            <div className="deferral-review-stat__label">Approvals</div>
            <div className="deferral-review-stat__value">{approvedApproversCount}</div>
          </div>
        </div>
      </Card>

      <Card
        className="deferral-review-section"
        size="small"
        title={<span style={{ color: "var(--color-heading)" }}>Deferral Description</span>}
        style={{ marginBottom: 18 }}
      >
        <div className="deferral-review-text-block">
          {displayDeferral.deferralDescription || "-"}
        </div>
      </Card>

      {displayDeferral.facilities && displayDeferral.facilities.length > 0 && (
        <Card
          className="deferral-review-section"
          size="small"
          title={<span style={{ color: "var(--color-heading)" }}>Facility Details ({displayDeferral.facilities.length})</span>}
          style={{ marginBottom: 18 }}
        >
          <div className="deferral-review-table-shell">
            <Table
              dataSource={displayDeferral.facilities}
              columns={getFacilityColumns()}
              pagination={false}
              size="small"
              rowKey={(row, index) => row.facilityNumber || row._id || `facility-${index}`}
              scroll={{ x: 600 }}
            />
          </div>
        </Card>
      )}

      {approvalFlow && approvalFlow.length > 0 && (
        <Card
          className="deferral-review-section"
          size="small"
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={onToggleApprovalFlow}>
              <span style={{ color: primaryBlue }}>Approval Flow</span>
              <span style={{ color: "var(--color-heading)" }}>Approval Flow</span>
              <span style={{ fontSize: 12, color: "#999" }}>
                {approvalFlowExpanded ? "▼" : "▶"}
              </span>
            </div>
          }
          style={{ marginBottom: 18 }}
        >
          {approvalFlowExpanded && (
            <div className="deferral-review-table-shell">
              <Table
                dataSource={approvalFlow}
                columns={approvalFlowColumns}
                pagination={false}
                size="small"
                rowKey={(approver, index) => approver._id || approver.id || `approver-${index}`}
                scroll={{ x: 760 }}
              />
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default RMDeferralReviewDetails;