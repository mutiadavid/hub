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
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import DeferralReviewHeader from "./DeferralReviewHeader";
import DeferralReviewContent from "./DeferralReviewContent";
import DeferralReviewFooter from "./DeferralReviewFooter";
import DeferralReviewSidebar from "./DeferralReviewSidebar";

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
    newComment,
    onNewCommentChange,
    onPostComment,
    isPostingComment,
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
    (deferral.approverFlow || []).length === 0 ||
    (deferral.approverFlow || []).every(a => a.approved || a.approvalStatus === "approved");
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
        <span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>
          {value || "-"}
        </span>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, doc) => <span className="text-sm font-normal">{doc.type || doc.documentType || "-"}</span>,
    },
    {
      title: "Requested Days",
      key: "requestedDays",
      render: (_, doc) => <span className="text-sm font-normal">{doc.requestedDays || doc.daysSought || "-"}</span>,
    },
    {
      title: "New Due Date",
      key: "newDueDate",
      render: (_, doc) => (
        <span className="text-sm font-normal">
          {doc.newDueDate ? dayjs(doc.newDueDate).format("DD MMM YYYY") : "-"}
        </span>
      ),
    },
  ];

  const uploadedDocumentColumns = [
    {
      title: "Document",
      key: "document",
      render: (_, doc) => (
        <div>
          <div className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>
            {doc.name || "Uploaded Document"}
          </div>
          {doc.uploadDate ? (
            <div className="text-md text-gray-400">
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
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Button
              type="default"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openFileInNewTab(documentUrl)}
              disabled={!documentUrl}
              className="text-sm"
            >
              View
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadFile(documentUrl, doc.name)}
              disabled={!documentUrl}
              className="text-sm"
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
      render: (_, __, index) => <span className="text-sm font-normal">{index + 1}</span>,
    },
    {
      title: "Role",
      key: "role",
      render: (_, approver) => <span className="text-sm font-normal">{approver.designation || approver.role || "-"}</span>,
    },
    {
      title: "Approver",
      key: "approver",
      render: (_, approver) => <span className="text-sm font-normal">{approver.name || approver.approverName || "User"}</span>,
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
            className="text-sm font-normal"
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
          <div className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>
            {upload.name || "Evidence Document"}
          </div>
          {upload.uploadDate ? (
            <div className="text-md text-gray-400">
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
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Button size="small" onClick={() => openFileInNewTab(documentUrl)} disabled={!documentUrl} className="text-sm">
              View
            </Button>
            <Button size="small" onClick={() => downloadFile(documentUrl, upload.name)} disabled={!documentUrl} className="text-sm">
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
        <span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>
          {value || "-"}
        </span>
      ),
    },
    {
      title: "RM Comment",
      dataIndex: "comment",
      key: "comment",
      render: (value) => <span className="text-sm font-normal">{value || "-"}</span>,
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
              className="text-sm font-normal"
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
              className="text-sm font-normal"
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
        <div className="flex items-center gap-2">
          <Button
            type={document.decision?.status === "approved" ? "primary" : "default"}
            onClick={() => _onDocDecision?.(document.decisionKey, "approved", document.decision?.comment || "")}
            disabled={sourceTab !== "closeRequests"}
            className="text-sm"
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
            className="text-sm"
          >
            Reject
          </Button>
          <Button
            onClick={() => _onResetDocDecision?.(document.decisionKey)}
            disabled={sourceTab !== "closeRequests"}
            className="text-sm"
          >
            Reset
          </Button>
        </div>
      ),
    },
  ];

  return (
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

        <div className="flex gap-1 border-b border-[rgba(214,189,152,0.2)] mb-4 overflow-x-auto">
          <button
            type="button"
            className={`px-3 py-2 border-none border-b-2 border-transparent bg-transparent text-gray-500 text-sm font-semibold cursor-pointer whitespace-nowrap font-['Century_Gothic','CenturyGothic','AppleGothic',sans-serif] ${
              activeTab === "details" ? "text-[#164679] border-b-2 border-[#164679]" : ""
            }`}
            onClick={() => setActiveTab("details")}
          >
            Deferral Details
          </button>
          <button
            type="button"
            className={`px-3 py-2 border-none border-b-2 border-transparent bg-transparent text-gray-500 text-sm font-semibold cursor-pointer whitespace-nowrap font-['Century_Gothic','CenturyGothic','AppleGothic',sans-serif] ${
              activeTab === "documents" ? "text-[#164679] border-b-2 border-[#164679]" : ""
            }`}
            onClick={() => setActiveTab("documents")}
          >
            Required Documents
          </button>
        </div>

        {/* Updated grid layout - wider sidebar (5fr for content, 3.5fr for sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(380px,3.5fr)] gap-6 items-start">
          <div className="min-w-0">
            <div className="p-0 overflow-visible">
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

          {/* Larger sidebar */}
          <div className="min-w-[380px]">
            <DeferralReviewSidebar
              newComment={newComment}
              onNewCommentChange={onNewCommentChange}
              onPostComment={onPostComment}
              isPostingComment={isPostingComment}
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
    </div>
  );
};

export default DeferralDetailsModal;