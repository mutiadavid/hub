import React from "react";
import { Button, Popconfirm } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { downloadFile, openFileInNewTab } from "../../../../utils/fileUtils";

const buildDocumentTitle = (value, primaryBlue) => (
  <span style={{ color: primaryBlue, fontWeight: 600 }}>
    {value || "-"}
  </span>
);

export const buildRequestedDocsColumns = ({ primaryBlue }) => [
  {
    title: "Document",
    dataIndex: "name",
    key: "name",
    render: (value) => buildDocumentTitle(value, primaryBlue),
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

export const buildUploadedDocumentColumns = () => [
  {
    title: "Document",
    key: "document",
    render: (_, doc) => (
      <div>
        <div style={{ color: "#164679", fontWeight: 600 }}>
          {doc.name || "Uploaded Document"}
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>
          {doc.uploadDate
            ? `Uploaded ${dayjs(doc.uploadDate).format("DD MMM YYYY")}`
            : "Upload date not set"}
        </div>
      </div>
    ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 168,
    render: (_, doc) => (
      <div className="deferral-review-actionset">
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

export const buildApprovalFlowColumns = ({
  approvalFlow,
  activeTab,
  canShowRemindButton,
  handleRemindApprover,
  sendingReminder,
  isApprovalMarkedApproved,
  primaryBlue,
  successGreen,
}) => [
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
    render: (_, approver) =>
      approver.user?.name || approver.name || approver.approverName || "User",
  },
  {
    title: "Status",
    key: "status",
    render: (_, approver, index) => {
      const isApprovedInDeferral = isApprovalMarkedApproved(approver);
      const previousApprovalsComplete = approvalFlow
        .slice(0, index)
        .every(isApprovalMarkedApproved);
      const isCurrent = !isApprovedInDeferral && previousApprovalsComplete;

      return (
        <span
          className="deferral-review-status-pill"
          style={{
            color: isApprovedInDeferral
              ? successGreen
              : isCurrent
                ? primaryBlue
                : "#64748b",
          }}
        >
          {isApprovedInDeferral ? "Approved" : isCurrent ? "Current" : "Pending Approval"}
        </span>
      );
    },
  },
  {
    title: "Action",
    key: "action",
    width: 120,
    render: (_, approver, index) => {
      const isApprovedInDeferral = isApprovalMarkedApproved(approver);
      const previousApprovalsComplete = approvalFlow
        .slice(0, index)
        .every(isApprovalMarkedApproved);
      const isCurrent = !isApprovedInDeferral && previousApprovalsComplete;

      if (activeTab === "closed" || !isCurrent || !canShowRemindButton) {
        return <span style={{ color: "#94a3b8" }}>-</span>;
      }

      return (
        <Popconfirm
          title="Send Reminder"
          description={`Send a reminder email to ${approver?.name || approver?.approverName || "this approver"}?`}
          onConfirm={handleRemindApprover}
          okText="Send"
          cancelText="Cancel"
          okButtonProps={{ loading: sendingReminder }}
        >
          <Button
            type="default"
            size="small"
            loading={sendingReminder}
            disabled={!canShowRemindButton}
          >
            Remind
          </Button>
        </Popconfirm>
      );
    },
  },
];

export const buildCloseRequestUploadColumns = () => [
  {
    title: "File",
    key: "name",
    render: (_, upload) => (
      <div>
        <div style={{ color: "#164679", fontWeight: 600 }}>
          {upload.name || "Evidence Document"}
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>
          {upload.uploadDate
            ? `Uploaded ${dayjs(upload.uploadDate).format("DD MMM YYYY")}`
            : "Upload date not set"}
        </div>
      </div>
    ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 168,
    render: (_, upload) => (
      <div className="deferral-review-actionset">
        <Button
          size="small"
          onClick={() => openFileInNewTab(upload.fileUrl || upload.url)}
        >
          View
        </Button>
        <Button
          size="small"
          onClick={() => downloadFile(upload.fileUrl || upload.url, upload.name)}
        >
          Download
        </Button>
      </div>
    ),
  },
];

export const buildCloseRequestColumns = ({
  primaryBlue,
  successGreen,
  errorRed,
}) => [
  {
    title: "Document",
    dataIndex: "documentName",
    key: "documentName",
    render: (value) => buildDocumentTitle(value, primaryBlue),
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
      const creatorState = String(document.creatorStatus || "pending").toLowerCase();
      const creatorLabel =
        creatorState === "approved"
          ? "Approved"
          : creatorState === "rejected"
            ? "Rejected"
            : "Pending";

      return (
        <div>
          <div
            className="deferral-review-status-pill"
            style={{
              color:
                creatorState === "approved"
                  ? successGreen
                  : creatorState === "rejected"
                    ? errorRed
                    : primaryBlue,
            }}
          >
            {creatorLabel}
          </div>
          {document.creatorComment ? (
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
              {document.creatorComment}
            </div>
          ) : null}
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
            style={{
              color:
                checkerState === "approved"
                  ? successGreen
                  : checkerState === "rejected"
                    ? errorRed
                    : primaryBlue,
            }}
          >
            {checkerLabel}
          </div>
          {document.checkerComment ? (
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
              {document.checkerComment}
            </div>
          ) : null}
        </div>
      );
    },
  },
  {
    title: "Evidence",
    key: "evidenceCount",
    width: 110,
    render: (_, document) => document.uploads?.length || 0,
  },
];
