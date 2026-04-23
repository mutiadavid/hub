import React, { useState } from "react";
import {
  Button,
  Modal,
  Spin,
  Input,
  message as antMessage,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
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
const reviewShellClassName = "border-t border-[rgba(214,189,152,0.2)] bg-(--color-bg)";
const reviewContainerClassName = "w-full max-w-full";
const tabsClassName = "mb-4 flex gap-1 overflow-x-auto border-b border-[rgba(214,189,152,0.2)]";
const workspaceClassName = "grid items-start gap-4 min-[1024px]:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]";
const actionSetClassName = "inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap [&_.ant-btn]:h-[27px] [&_.ant-btn]:min-w-0 [&_.ant-btn]:rounded-[7px] [&_.ant-btn]:px-2 [&_.ant-btn]:text-xs [&_.ant-btn>span]:inline-flex [&_.ant-btn>span]:items-center [&_.ant-btn>span]:gap-1";
const modalRootClassName = "[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:border [&_.ant-modal-content]:border-[rgba(214,189,152,0.28)] [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:shadow-[0_24px_64px_rgba(26,54,54,0.14)] [&_.ant-modal-body]:bg-white [&_.ant-modal-body]:p-4 [&_.ant-modal-footer]:bg-white [&_.ant-modal-header]:m-0 [&_.ant-modal-header]:px-5 [&_.ant-modal-header]:py-[18px] [&_.ant-modal-title]:text-(--color-text-dark) [&_.ant-modal-title]:font-semibold [&_.ant-modal-close]:text-(--color-text-dark)";
const acceptanceModalRootClassName = `${modalRootClassName} [&_.ant-modal-header]:border-b-0`;
const rejectionModalRootClassName = `${modalRootClassName} [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-[rgba(214,189,152,0.2)]`;
const modalTitleClassName = "inline-flex items-center gap-2.5 text-(--color-text-dark)";
const modalTitleAcceptanceClassName = "inline-flex items-center gap-2.5 text-(--color-primary-dark)";
const modalIconClassName = "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[rgba(26,54,54,0.12)] bg-[rgba(26,54,54,0.08)]";
const modalRejectIconClassName = "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[rgba(196,29,20,0.16)] bg-[rgba(196,29,20,0.08)]";
const modalBodyCardClassName = "rounded-xl border border-[rgba(214,189,152,0.22)] bg-white p-3.5";
const modalSummaryClassName = "mb-3 rounded-[10px] bg-[rgba(245,247,244,0.9)] p-3";
const modalSummaryTitleClassName = "text-sm font-bold text-(--color-text-dark)";
const modalSummaryCopyClassName = "mt-1 text-xs leading-6 text-(--color-text-medium)";
const modalLabelClassName = "mb-1.5 block text-[11px] font-bold tracking-[0.04em] text-(--color-text-light) uppercase";
const modalTextareaClassName = "rounded-[10px] border-[rgba(214,189,152,0.22)]";
const modalFooterClassName = "admin-page__modal-footer mt-4 flex justify-end gap-2";

const getStatusToneClassName = (tone) => {
  if (tone === "success") return "text-[var(--color-status-success)]";
  if (tone === "danger") return "text-[var(--color-status-danger)]";
  if (tone === "muted") return "text-(--color-text-muted)";
  return "text-(--color-primary-dark)";
};

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

  const { TextArea } = Input;
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
        <span className="font-semibold text-(--color-primary-dark)">
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
          <div className="font-semibold text-(--color-primary-dark)">
            {doc.name || "Uploaded Document"}
          </div>
          {doc.uploadDate ? (
            <div className="text-xs text-(--color-text-muted)">
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
      render: (_, doc) => (
        <div className={actionSetClassName}>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(doc.fileUrl || doc.url)}
            disabled={!doc.fileUrl && !doc.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(doc.fileUrl || doc.url, doc.name)}
            disabled={!doc.fileUrl && !doc.url}
          >
            Download
          </Button>
        </div>
      ),
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
          <span className={`inline-flex items-center text-xs font-semibold ${getStatusToneClassName(isApprovedInFlow ? "success" : isCurrent ? "primary" : "muted")}`}>
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
          <div className="font-semibold text-(--color-primary-dark)">
            {upload.name || "Evidence Document"}
          </div>
          {upload.uploadDate ? (
            <div className="text-xs text-(--color-text-muted)">
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
      render: (_, upload) => (
        <div className={actionSetClassName}>
          <Button size="small" onClick={() => openFileInNewTab(upload.fileUrl || upload.url)}>
            View
          </Button>
          <Button size="small" onClick={() => downloadFile(upload.fileUrl || upload.url, upload.name)}>
            Download
          </Button>
        </div>
      ),
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
        <span className="font-semibold text-(--color-primary-dark)">
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
            <div className={`inline-flex items-center text-xs font-semibold ${getStatusToneClassName(state === "approved" ? "success" : state === "rejected" ? "danger" : "primary")}`}>
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
            <div className={`inline-flex items-center text-xs font-semibold ${getStatusToneClassName(checkerState === "approved" ? "success" : checkerState === "rejected" ? "danger" : "primary")}`}>
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
        <div className={actionSetClassName}>
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
      <div className={reviewShellClassName}>
          <div className={reviewContainerClassName}>
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

            <div className={tabsClassName}>
              <button
                type="button"
                className={`whitespace-nowrap border-b-2 bg-transparent px-3 py-2 text-[11px] font-semibold ${activeTab === "details" ? "border-(--color-primary-dark) text-(--color-primary-dark)" : "border-transparent text-(--color-text-light)"}`}
                onClick={() => setActiveTab("details")}
              >
                Deferral Details
              </button>
              <button
                type="button"
                className={`whitespace-nowrap border-b-2 bg-transparent px-3 py-2 text-[11px] font-semibold ${activeTab === "documents" ? "border-(--color-primary-dark) text-(--color-primary-dark)" : "border-transparent text-(--color-text-light)"}`}
                onClick={() => setActiveTab("documents")}
              >
                Required Documents
              </button>
            </div>

            <div className={workspaceClassName}>
              <div className="min-w-0">
                <div>
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

      <Modal
        open={approvalConfirmVisible}
        onCancel={onApprovalCancel}
        footer={null}
        centered
        width={550}
        rootClassName={acceptanceModalRootClassName}
        closeIcon={
          <span className="text-2xl leading-none text-(--color-primary-dark)">
            ×
          </span>
        }
        title={
          <div className={modalTitleAcceptanceClassName}>
            <div className={modalIconClassName}><CheckCircleOutlined /></div>
            <span>{sourceTab === "closeRequests" ? "Submit Close Request Review" : "Confirm Acceptance"}</span>
          </div>
        }
      >
        <div className="admin-page__modal-body">
          <div className={modalBodyCardClassName}>
            <div className={modalSummaryClassName}>
              <div className={modalSummaryTitleClassName}>
                {sourceTab === "closeRequests" ? (deferral.deferralNumber || "Close request review") : (deferral.deferralNumber || "Deferral acceptance")}
              </div>
              <div className={modalSummaryCopyClassName}>
                {sourceTab === "closeRequests"
                  ? "Review and submit the close-request decision for this deferral."
                  : "Accept this deferral using the same controlled review flow as the other system modals."}
              </div>
              <div className={modalSummaryCopyClassName}>
                {sourceTab === "closeRequests"
                  ? "Submit the creator review for these close request documents?"
                  : "Accepting this deferral will move it forward in the workflow and record your comment in the audit trail."}
              </div>
            </div>

            <label className={modalLabelClassName}>
              {sourceTab === "closeRequests" ? "Review comment" : "Acceptance comment"}
            </label>
            <TextArea
              placeholder="Add an optional comment..."
              value={creatorComment}
              onChange={(e) => onCommentChange(e.target.value)}
              rows={4}
              className={modalTextareaClassName}
            />
          </div>

          <div className={modalFooterClassName}>
            <Button
              onClick={onApprovalCancel}
              className="admin-page__action-button admin-page__action-button--secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={onApprovalConfirm}
              loading={isLoading}
              className="admin-page__action-button deferral-review-confirm__confirm"
            >
              {sourceTab === "closeRequests" ? "Submit Review" : "Accept"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={reworkConfirmVisible}
        onCancel={onReworkCancel}
        footer={null}
        centered
        width={550}
        rootClassName={rejectionModalRootClassName}
        closeIcon={<span className="text-2xl leading-none text-(--color-text-dark)">×</span>}
        title={
          <div className={modalTitleClassName}>
            <div className={modalRejectIconClassName}><ExclamationCircleOutlined /></div>
            <span>Return for Rework</span>
          </div>
        }
      >
        <div className="admin-page__modal-body">
          <div className={modalBodyCardClassName}>
            <div className={modalSummaryClassName}>
              <div className={modalSummaryTitleClassName}>
                {deferral.deferralNumber || "Return for rework"}
              </div>
              <div className={modalSummaryCopyClassName}>
                Send the deferral back with clear next-step instructions for the request owner.
              </div>
              <div className={modalSummaryCopyClassName}>
                Returning this deferral will send it back for correction and preserve your instructions in the workflow history.
              </div>
            </div>

            <label className={modalLabelClassName}>Rework instructions</label>
            <TextArea
              placeholder="Rework instructions..."
              value={reworkComment}
              onChange={(e) => onReworkCommentChange(e.target.value)}
              rows={4}
              className={modalTextareaClassName}
            />
          </div>

          <div className={modalFooterClassName}>
            <Button
              onClick={onReworkCancel}
              className="admin-page__action-button admin-page__action-button--secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={onReworkConfirm}
              loading={returnReworkLoading}
              className="admin-page__action-button admin-page__action-button--primary"
            >
              Return
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeferralDetailsModal;