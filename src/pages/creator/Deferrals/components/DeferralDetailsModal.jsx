import React, { useState } from "react";
import {
  Button,
  Spin,
  message as antMessage,
} from "antd";
import {
  CheckOutlined,
  DownloadOutlined,
  EyeOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import DeferralDecisionModal from "../../../../components/deferrals/DeferralDecisionModal";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  getCloseRequestDocumentGroups,
  getDeferralDocumentBuckets,
} from "../../../../utils/deferralDocuments";
import { openFileInNewTab, downloadFile } from "../../../../utils/fileUtils";
import useProtectedFileFetcher from "../../../../hooks/useProtectedFileFetcher";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import DeferralReviewHeader from "./DeferralReviewHeader";
import DeferralReviewContent from "./DeferralReviewContent";
import DeferralReviewFooter from "./DeferralReviewFooter";
import DeferralReviewSidebar from "./DeferralReviewSidebar";
import "./DeferralDetailsModal.css";

dayjs.extend(relativeTime);

const PRIMARY_BLUE = "var(--color-primary-dark)";
const SUCCESS_GREEN = "var(--color-status-success)";
const ERROR_RED = "var(--color-status-danger)";

const GENERIC_ROLE_LABELS = new Set([
  "user",
  "system",
  "approver",
  "rm",
  "creator",
  "checker",
  "cocreator",
  "co creator",
  "cochecker",
  "co checker",
  "customer",
  "admin",
]);

const DUPLICATE_TIME_WINDOW_MS = 2 * 60 * 1000;

const normalizeHistoryValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getTimestampValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.valueOf();
};

const resolveDocumentUrl = (item) =>
  item?.fileUrl || item?.url || item?.FileUrl || item?.Url || null;

const getRoleSpecificityScore = (roleLabel) => {
  const normalizedRole = normalizeHistoryValue(roleLabel);
  if (!normalizedRole) return 0;
  if (GENERIC_ROLE_LABELS.has(normalizedRole)) return 1;
  return 10 + normalizedRole.length;
};

const dedupeHistoryEntries = (entries) => {
  const deduped = [];

  entries.forEach((entry, index) => {
    const normalizedUser = normalizeHistoryValue(entry.user);
    const normalizedComment = normalizeHistoryValue(entry.comment);
    const entryTime = getTimestampValue(
      entry.date || entry.createdAt || entry.timestamp,
    );

    const current = {
      ...entry,
      __index: index,
      __score: getRoleSpecificityScore(entry.userRole || entry.role),
      __user: normalizedUser,
      __comment: normalizedComment,
      __time: entryTime,
    };

    const existingIndex = deduped.findIndex((candidate) => {
      if (
        candidate.__user !== current.__user ||
        candidate.__comment !== current.__comment
      ) {
        return false;
      }

      if (candidate.__time == null || current.__time == null) {
        return true;
      }

      return Math.abs(candidate.__time - current.__time) <= DUPLICATE_TIME_WINDOW_MS;
    });

    if (existingIndex === -1) {
      deduped.push(current);
      return;
    }

    const existing = deduped[existingIndex];
    const shouldReplace =
      current.__score > existing.__score ||
      (current.__score === existing.__score && current.__index < existing.__index);

    if (shouldReplace) {
      deduped[existingIndex] = current;
    }
  });

  return deduped
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .map((entry) => {
      const nextEntry = { ...entry };
      delete nextEntry.__index;
      delete nextEntry.__score;
      delete nextEntry.__user;
      delete nextEntry.__comment;
      delete nextEntry.__time;
      return nextEntry;
    });
};

const DeferralDetailsModal = (props) => {
  const {
    visible,
    deferral,
    onClose,
    onApprove,
    onReturnForRework,
    isLoading,
    creatorComment,
    onCommentChange,
    approvalConfirmVisible,
    onApprovalConfirm,
    onApprovalCancel,
    reworkConfirmVisible,
    reworkComment,
    onReworkCommentChange,
    onReworkConfirm,
    onReworkCancel,
    returnReworkLoading,
    _creatorDocDecisions,
    _onDocDecision,
    _onResetDocDecision,
    sourceTab,
  } = props;

  const [activeTab, setActiveTab] = useState("details");

  if (!deferral || !visible) return null;

  const isApprovedTabContext = sourceTab === "approved";
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
  const creatorApproved =
    isApprovedTabContext || normalizedCreatorApprovalStatus === "approved";
  const checkerApproved =
    isApprovedTabContext || normalizedCheckerApprovalStatus === "approved";
  const creatorStatusLabel = creatorApproved ? "Approved" : "Pending";
  const checkerStatusLabel = checkerApproved ? "Approved" : "Pending";
  const { dclDocs, uploadedDocs, requestedDocs } = getDeferralDocumentBuckets(deferral);
  const generalUploadedDocs = uploadedDocs.filter((doc) => !doc.isCloseRequestEvidence);
  const closeRequestDocuments = getCloseRequestDocumentGroups(deferral);
  const isCloseRequestContext = ["close_requested", "close_requested_creator_approved", "closed"].includes(
    String(deferral.status || "").trim().toLowerCase(),
  );
  const closeRequestDecisionStates = closeRequestDocuments.map((document) => {
    const decisionKey = String(document.documentName || "")
      .trim()
      .toLowerCase();
    return String(_creatorDocDecisions?.[decisionKey]?.status || document.creatorStatus || "pending")
      .trim()
      .toLowerCase();
  });
  const requestedDocsWithDates = requestedDocs.map((doc) => {
    const requestedDays = doc.requestedDays || doc.daysSought || 0;
    const newDueDate =
      doc.nextDocumentDueDate ||
      deferral.nextDocumentDueDate ||
      (deferral.createdAt
        ? dayjs(deferral.createdAt).add(requestedDays, "days").toISOString()
        : null);

    return {
      ...doc,
      newDueDate,
    };
  });
  const allCloseRequestDocumentsReviewed =
    closeRequestDecisionStates.length > 0 &&
    closeRequestDecisionStates.every((status) => {
      return status === "approved" || status === "rejected";
    });

  // Determine if deferral can be approved
  const allApproversApproved =
    isApprovedTabContext ||
    (deferral.approverFlow || []).length === 0 || // No approvers needed
    (deferral.approverFlow || []).every(a => a.approved || a.approvalStatus === "approved"); // OR all approvers approved
  const approvedApproversCount = isApprovedTabContext
    ? (deferral.approverFlow || []).length
    : (deferral.approverFlow || []).filter(
        (approver) => approver.approved || approver.approvalStatus === "approved",
      ).length;
 
  const canApprove = sourceTab === "closeRequests"
    ? !isApprovedTabContext && allCloseRequestDocumentsReviewed
    : !isApprovedTabContext && allApproversApproved && !creatorApproved;
  const canReturnForRework =
    !isApprovedTabContext && !creatorApproved;
  const uploadedDocumentCount = dclDocs.length + generalUploadedDocs.length + closeRequestDocuments.length;
  // Build history from comments and events
  const history = (function renderHistory() {
    const events = [];

    if (deferral.comments && Array.isArray(deferral.comments)) {
      deferral.comments.forEach((c) => {
        if (c.isSystemComment || c.isSystem) return;
        if (!String(c.text || "").trim()) return;
        const commentAuthorName =
          c.author?.name || c.authorName || c.userName || "User";
        const commentAuthorRole = c.author?.role || c.authorRole || "User";
        events.push({
          user: commentAuthorName,
          userRole: commentAuthorRole,
          date: c.createdAt,
          comment: c.text || "",
          isSystemComment: Boolean(c.isSystemComment || c.isSystem),
        });
      });
    }

    return dedupeHistoryEntries(events);
  })();

  const downloadDeferralAsPDF = async () => {
    if (!deferral || !deferral._id) {
      antMessage.error("No deferral selected");
      return;
    }

    try {
      await downloadDeferralPdf(deferral, {
        requestedDocsWithDates,
        history,
        closeRequestDocuments,
      });
      antMessage.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      antMessage.error("Failed to generate PDF");
    }
  };

  const requestedDocsColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
          {value || "-"}
        </span>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, doc) => doc.type || doc.documentType || "-",
    },
    {
      title: "Requested Days",
      key: "requestedDays",
      render: (_, doc) => doc.requestedDays || doc.daysSought || "-",
    },
    {
      title: "New Due Date",
      key: "newDueDate",
      render: (_, doc) =>
        doc.newDueDate ? dayjs(doc.newDueDate).format("DD MMM YYYY") : "-",
    },
  ];

  const uploadedDocumentColumns = [
    {
      title: "Document",
      key: "document",
      render: (_, doc) => (
        <div>
          <div style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
            {doc.name || "Uploaded Document"}
          </div>
          {doc.uploadDate ? (
            <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
              {`Uploaded ${dayjs(doc.uploadDate).format("DD MMM YYYY")}`}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, doc) => {
        const documentUrl = resolveDocumentUrl(doc);

        return (
          <div className="deferral-review-actionset">
            <Button
              type="default"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openFile(documentUrl).catch((err) => console.error(err))}
              disabled={!documentUrl}
            >
              View
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => fetchDownloadFile(documentUrl, doc.name).catch((err) => console.error(err))}
              disabled={!documentUrl}
            >
              Download
            </Button>
          </div>
        );
      },
    },
  ];

  const approvalFlowColumns = [
    {
      title: "Step",
      key: "step",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Role",
      key: "role",
      render: (_, approver) => approver.designation || approver.role || "-",
    },
    {
      title: "Approver",
      key: "approver",
      render: (_, approver) => approver.name || approver.approverName || "User",
    },
    {
      title: "Status",
      key: "status",
      render: (_, approver, index) => {
        const isApprovedInFlow =
          isApprovedTabContext ||
          approver.approved ||
          approver.approvalStatus === "approved";
        const isCurrent =
          !isApprovedTabContext &&
          !approver.approved &&
          approver.approvalStatus !== "approved" &&
          deferral.approverFlow
            .slice(0, index)
            .every((item) => item.approved || item.approvalStatus === "approved");

        return (
          <span
            className="deferral-review-status-pill"
            style={{ color: isApprovedInFlow ? SUCCESS_GREEN : isCurrent ? PRIMARY_BLUE : "var(--color-text-muted)" }}
          >
            {isApprovedInFlow ? "Approved" : isCurrent ? "Current" : "Pending Approval"}
          </span>
        );
      },
    },
  ];

  const closeRequestUploadColumns = [
    {
      title: "File",
      key: "name",
      render: (_, upload) => (
        <div>
          <div style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
            {upload.name || "Evidence Document"}
          </div>
          {upload.uploadDate ? (
            <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
              {`Uploaded ${dayjs(upload.uploadDate).format("DD MMM YYYY")}`}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 168,
      render: (_, upload) => {
        const documentUrl = resolveDocumentUrl(upload);

        return (
          <div className="deferral-review-actionset">
            <Button size="small" onClick={() => openFile(documentUrl).catch((err) => console.error(err))} disabled={!documentUrl}>
              View
            </Button>
            <Button size="small" onClick={() => fetchDownloadFile(documentUrl, upload.name).catch((err) => console.error(err))} disabled={!documentUrl}>
              Download
            </Button>
          </div>
        );
      },
    },
  ];

  const closeRequestColumns = closeRequestDocuments.map((document) => {
    const decisionKey = String(document.documentName || "")
      .trim()
      .toLowerCase();
    const decision =
      _creatorDocDecisions?.[decisionKey] || {
        status: document.creatorStatus || "pending",
        comment: document.creatorComment || "",
      };

    return {
      ...document,
      decisionKey,
      decision,
    };
  });

  const closeRequestDocumentColumns = [
    {
      title: "Document",
      dataIndex: "documentName",
      key: "documentName",
      render: (value) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>
          {value || "-"}
        </span>
      ),
    },
    {
      title: "RM Comment",
      dataIndex: "comment",
      key: "comment",
      render: (value) => value || "-",
    },
    {
      title: "Creator Review",
      key: "creatorReview",
      render: (_, document) => {
        const state = String(document.decision?.status || "pending").toLowerCase();
        const label =
          state === "approved"
            ? "Approved"
            : state === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{ color: state === "approved" ? SUCCESS_GREEN : state === "rejected" ? ERROR_RED : PRIMARY_BLUE }}
            >
              {label}
            </div>
          </div>
        );
      },
    },
    {
      title: "Checker Review",
      key: "checkerReview",
      render: (_, document) => {
        const checkerState = String(document.checkerStatus || "pending").toLowerCase();
        const checkerLabel =
          checkerState === "approved"
            ? "Approved"
            : checkerState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{ color: checkerState === "approved" ? SUCCESS_GREEN : checkerState === "rejected" ? ERROR_RED : PRIMARY_BLUE }}
            >
              {checkerLabel}
            </div>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 300,
      render: (_, document) => (
        <div className="deferral-review-actionset">
          <Button
            type={document.decision?.status === "approved" ? "primary" : "default"}
            onClick={() => _onDocDecision?.(document.decisionKey, "approved", document.decision?.comment || "")}
            disabled={sourceTab !== "closeRequests"}
            style={
              document.decision?.status === "approved"
                ? { backgroundColor: SUCCESS_GREEN, borderColor: SUCCESS_GREEN }
                : undefined
            }
          >
            Accept
          </Button>
          <Button
            danger={document.decision?.status === "rejected"}
            type={document.decision?.status === "rejected" ? "primary" : "default"}
            onClick={() => _onDocDecision?.(document.decisionKey, "rejected", document.decision?.comment || "")}
            disabled={sourceTab !== "closeRequests"}
          >
            Reject
          </Button>
          <Button
            onClick={() => _onResetDocDecision?.(document.decisionKey)}
            disabled={sourceTab !== "closeRequests"}
          >
            Reset
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="deferral-review-panel">
          <div className="deferral-review-container creator-theme">
            <DeferralReviewHeader
              deferral={deferral}
              onClose={onClose}
              onViewDocuments={() => setActiveTab("documents")}
              documentCount={uploadedDocumentCount}
            />

            <DeferralReviewFooter
              canApprove={canApprove}
              canReturnForRework={canReturnForRework}
              isLoading={isLoading}
              onApprove={onApprove}
              onReturnForRework={onReturnForRework}
              onDownloadPDF={downloadDeferralAsPDF}
              onClose={onClose}
              sourceTab={sourceTab}
            />

            <div className="deferral-review-tabs">
              <button
                type="button"
                className={`deferral-review-tab${activeTab === "details" ? " deferral-review-tab--active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                Deferral Details
              </button>
              <button
                type="button"
                className={`deferral-review-tab${activeTab === "documents" ? " deferral-review-tab--active" : ""}`}
                onClick={() => setActiveTab("documents")}
              >
                Required Documents
              </button>
            </div>

            <div className="deferral-review-workspace">
              <div className="deferral-review-main">
                <div className="deferral-review-body">
                  <Spin spinning={isLoading}>
                    <DeferralReviewContent
                      deferral={deferral}
                      activeTab={activeTab}
                      isApprovedTabContext={isApprovedTabContext}
                      creatorApproved={creatorApproved}
                      checkerApproved={checkerApproved}
                      creatorStatusLabel={creatorStatusLabel}
                      checkerStatusLabel={checkerStatusLabel}
                      approvedApproversCount={approvedApproversCount}
                      requestedDocsWithDates={requestedDocsWithDates}
                      requestedDocsColumns={requestedDocsColumns}
                      dclDocs={dclDocs}
                      generalUploadedDocs={generalUploadedDocs}
                      uploadedDocumentColumns={uploadedDocumentColumns}
                      isCloseRequestContext={isCloseRequestContext}
                      closeRequestDocuments={closeRequestDocuments}
                      closeRequestColumns={closeRequestColumns}
                      closeRequestDocumentColumns={closeRequestDocumentColumns}
                      closeRequestUploadColumns={closeRequestUploadColumns}
                      approvalFlowColumns={approvalFlowColumns}
                    />
                  </Spin>
                </div>
              </div>

              <DeferralReviewSidebar
                newComment={props.newComment}
                onNewCommentChange={props.onNewCommentChange}
                onPostComment={props.onPostComment}
                isPostingComment={props.isPostingComment}
                history={history}
              />
            </div>
          </div>
      </div>

      <DeferralDecisionModal
        open={approvalConfirmVisible}
        onCancel={onApprovalCancel}
        title={
          sourceTab === "closeRequests"
            ? `Submit Close Request Review: ${deferral.deferralNumber || ""}`
            : `Confirm Acceptance: ${deferral.deferralNumber || ""}`
        }
        subtitle={
          sourceTab === "closeRequests"
            ? "Review and submit the close-request decision for this deferral."
            : "Confirm the request and advance it to the next workflow stage."
        }
        titleIcon={<CheckOutlined />}
        deferralNumber={deferral.deferralNumber}
        customerName={deferral.customerName}
        summaryCopy={
          sourceTab === "closeRequests"
            ? [
                "Review and submit the close-request decision for this deferral.",
                "Submit the creator review for these close request documents?",
              ]
            : "Approving this request will advance it in the workflow and publish your decision to the review trail."
        }
        inputLabel={sourceTab === "closeRequests" ? "Review comment" : "Approval comments"}
        inputRequired={false}
        inputValue={creatorComment}
        onInputChange={onCommentChange}
        inputPlaceholder="Enter any additional comments..."
        confirmText={sourceTab === "closeRequests" ? "Submit Review" : "Accept"}
        onConfirm={onApprovalConfirm}
        confirmLoading={isLoading}
        zIndex={1600}
      />

      <DeferralDecisionModal
        open={reworkConfirmVisible}
        onCancel={onReworkCancel}
        title={`Return for Rework: ${deferral.deferralNumber || ""}`}
        subtitle="Send the request back with clear corrective instructions."
        titleIcon={<RedoOutlined />}
        deferralNumber={deferral.deferralNumber}
        customerName={deferral.customerName}
        summaryCopy="Returning this request will send it back with your instructions so the originating team can correct it."
        inputLabel="Rework instructions"
        inputRequired
        inputValue={reworkComment}
        onInputChange={onReworkCommentChange}
        inputPlaceholder="Enter rework instructions..."
        confirmText="Return for Rework"
        onConfirm={onReworkConfirm}
        confirmLoading={returnReworkLoading}
        confirmDisabled={!String(reworkComment || "").trim()}
        zIndex={1600}
      />
    </>
  );
};
  const { openFile, downloadFile: fetchDownloadFile } = useProtectedFileFetcher();

export default DeferralDetailsModal;
