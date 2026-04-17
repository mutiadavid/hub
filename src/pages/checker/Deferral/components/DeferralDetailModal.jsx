import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Input,
  message as antMessage,
  Spin,
  Table,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getCloseRequestDocumentGroups,
  getDeferralDocumentBuckets,
} from "../../../../utils/deferralDocuments";
import { openFileInNewTab, downloadFile } from "../../../../utils/fileUtils";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import DeferralReviewHeader from "../../../creator/Deferrals/components/DeferralReviewHeader";
import DeferralStatusAlert from "./DeferralStatusAlert";
import "./DeferralDetailModal.css";
import "../../../../styles/creatorDesignSystem.css";

const { TextArea } = Input;
const { Text } = Typography;

const TABS = [
  { key: "details", label: "Deferral Details" },
  { key: "documents", label: "Documents & Flow" },
];

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

const normalizeCloseRequestDecisionKey = (value) =>
  String(value || "")
    .trim()
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

const isApprovalMarkedApproved = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "approved";

const formatHistoryTimestamp = (value) => {
  if (!value) return "";

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return String(value);
  }

  return parsed.format("DD MMM YYYY HH:mm");
};

const DeferralDetailModal = ({
  visible = true,
  deferral,
  actionLoading,
  onDownloadPDF,
  onClose,
  onApprove,
  onReturnForRework,
  approvalConfirmVisible,
  onApprovalConfirm,
  onApprovalCancel,
  reworkConfirmVisible,
  reworkComment,
  onReworkCommentChange,
  onReworkConfirm,
  onReworkCancel,
  creatorComment,
  onCreatorCommentChange,
  sourceTab,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const isCloseRequestAction = sourceTab === "closeRequests";
  const closeRequestDocuments = useMemo(
    () => {
      if (!deferral) {
        return [];
      }

      if (isCloseRequestAction && Array.isArray(deferral.checkerCloseRequestDocuments)) {
        return getCloseRequestDocumentGroups({
          ...deferral,
          closeRequestDocuments: deferral.checkerCloseRequestDocuments,
        });
      }

      return getCloseRequestDocumentGroups(deferral);
    },
    [deferral, isCloseRequestAction],
  );
  const [checkerDocumentDecisions, setCheckerDocumentDecisions] = useState({});

  useEffect(() => {
    const nextState = closeRequestDocuments.reduce((accumulator, document) => {
      const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
      if (!key) {
        return accumulator;
      }

      const statusValue = String(document.checkerStatus || "").trim().toLowerCase();
      accumulator[key] = {
        status: ["approved", "rejected"].includes(statusValue) ? statusValue : "",
        comment: document.checkerComment || "",
        documentName: document.documentName,
      };
      return accumulator;
    }, {});

    setCheckerDocumentDecisions(nextState);
  }, [deferral?._id, deferral?.id, deferral?.updatedAt, closeRequestDocuments]);

  if (!deferral || !visible) {
    return null;
  }

  const approvalFlow = Array.isArray(deferral.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral.approvers)
      ? deferral.approvers
      : [];
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
  const creatorApproved = isApprovalMarkedApproved(normalizedCreatorApprovalStatus);
  const checkerApproved = isApprovalMarkedApproved(normalizedCheckerApprovalStatus);
  const approvedApproversCount = approvalFlow.filter(
    (approver) =>
      approver?.approved === true ||
      isApprovalMarkedApproved(approver?.approvalStatus) ||
      isApprovalMarkedApproved(approver?.status),
  ).length;
  const allApproversApproved = approvalFlow.length > 0
    ? approvedApproversCount === approvalFlow.length
    : deferral.allApproversApproved === true;
  const status = String(deferral.status || "").trim().toLowerCase();
  const isRejected = ["rejected", "deferral_rejected"].includes(status);
  const isClosed = [
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
  ].includes(status);
  const canAccept = isCloseRequestAction
    ? status === "close_requested_creator_approved"
    : allApproversApproved && creatorApproved && !checkerApproved && !isRejected && !isClosed;
  const canReturnForRework = !isCloseRequestAction && canAccept;
  const { dclDocs, uploadedDocs, requestedDocs } =
    getDeferralDocumentBuckets(deferral);
  const generalUploadedDocs = uploadedDocs.filter(
    (doc) => !doc.isCloseRequestEvidence,
  );
  const isCloseRequestContext = [
    "close_requested",
    "close_requested_creator_approved",
    "closed",
  ].includes(status);
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
  const uploadedDocumentCount =
    dclDocs.length + generalUploadedDocs.length + closeRequestDocuments.length;
  const pendingCheckerDecisions = isCloseRequestAction
    ? closeRequestDocuments.filter((document) => {
        const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const decision = checkerDocumentDecisions[key];
        return !["approved", "rejected"].includes(String(decision?.status || "").toLowerCase());
      }).length
    : 0;

  const updateCheckerDocumentDecision = (document, updates) => {
    const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
    if (!key) {
      return;
    }

    setCheckerDocumentDecisions((current) => ({
      ...current,
      [key]: {
        status: current[key]?.status || "",
        comment: current[key]?.comment || "",
        documentName: document.documentName,
        ...updates,
      },
    }));
  };

  const history = (function buildHistory() {
    const events = [];

    if (Array.isArray(deferral.comments)) {
      deferral.comments.forEach((comment) => {
        if (comment.isSystemComment || comment.isSystem) {
          return;
        }
        if (!String(comment.text || "").trim()) {
          return;
        }
        events.push({
          user:
            comment.author?.name || comment.authorName || comment.userName || "User",
          userRole: comment.author?.role || comment.authorRole || "User",
          date: comment.createdAt,
          comment: comment.text || "",
          isSystemComment: Boolean(comment.isSystemComment || comment.isSystem),
        });
      });
    }

    return dedupeHistoryEntries(events);
  })();

  const downloadDeferralAsPDF = async () => {
    if (!deferral?._id) {
      return;
    }

    setDownloadLoading(true);
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
    } finally {
      setDownloadLoading(false);
    }
  };

  const requestedDocsColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>{value || "-"}</span>
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
      render: (_, doc) => (
        <div className="deferral-review-actionset">
          <Button
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

  const closeRequestUploadColumns = [
    {
      title: "File",
      key: "file",
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
      render: (_, upload) => (
        <div className="deferral-review-actionset">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFileInNewTab(upload.fileUrl || upload.url)}
            disabled={!upload.fileUrl && !upload.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(upload.fileUrl || upload.url, upload.name)}
            disabled={!upload.fileUrl && !upload.url}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  const closeRequestColumns = [
    {
      title: "Document",
      dataIndex: "documentName",
      key: "documentName",
      render: (value) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>{value || "-"}</span>
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
        const reviewState = String(document.creatorStatus || "pending").toLowerCase();
        const label =
          reviewState === "approved"
            ? "Approved"
            : reviewState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{
                color:
                  reviewState === "approved"
                    ? SUCCESS_GREEN
                    : reviewState === "rejected"
                      ? ERROR_RED
                      : PRIMARY_BLUE,
              }}
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
        const decisionKey = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const liveDecision = checkerDocumentDecisions[decisionKey];
        const reviewState = String(liveDecision?.status || document.checkerStatus || "pending").toLowerCase();
        const label =
          reviewState === "approved"
            ? "Approved"
            : reviewState === "rejected"
              ? "Rejected"
              : "Pending";

        return (
          <div>
            <div
              className="deferral-review-status-pill"
              style={{
                color:
                  reviewState === "approved"
                    ? SUCCESS_GREEN
                    : reviewState === "rejected"
                      ? ERROR_RED
                      : PRIMARY_BLUE,
              }}
            >
              {label}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 300,
      render: (_, document) => {
        const decisionKey = normalizeCloseRequestDecisionKey(document.documentName || document.key);
        const decision = checkerDocumentDecisions[decisionKey] || {
          status: "",
          comment: "",
          documentName: document.documentName,
        };

        if (!isCloseRequestAction || !canAccept) {
          return (
            <span className="deferral-review-status-pill" style={{ color: PRIMARY_BLUE }}>
              {decision.status === "approved"
                ? "Approved"
                : decision.status === "rejected"
                  ? "Rejected"
                  : "Awaiting checker decision"}
            </span>
          );
        }

        return (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button
                size="small"
                type={decision.status === "approved" ? "primary" : "default"}
                onClick={() => updateCheckerDocumentDecision(document, { status: "approved" })}
              >
                Accept
              </Button>
              <Button
                size="small"
                danger={decision.status === "rejected"}
                type={decision.status === "rejected" ? "primary" : "default"}
                onClick={() => updateCheckerDocumentDecision(document, { status: "rejected" })}
              >
                Reject
              </Button>
              <Button
                size="small"
                onClick={() => updateCheckerDocumentDecision(document, { status: "", comment: "" })}
              >
                Reset
              </Button>
            </div>
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
        const approved =
          approver.approved || isApprovalMarkedApproved(approver.approvalStatus);
        const isCurrent =
          !approved &&
          approvalFlow
            .slice(0, index)
            .every(
              (item) =>
                item.approved || isApprovalMarkedApproved(item.approvalStatus),
            );

        return (
          <span
            className="deferral-review-status-pill"
            style={{
              color: approved
                ? SUCCESS_GREEN
                : isCurrent
                  ? PRIMARY_BLUE
                  : "var(--color-text-muted)",
            }}
          >
            {approved ? "Approved" : isCurrent ? "Current" : "Pending Approval"}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className="deferral-review-panel">
        <div className="deferral-review-container">
          <DeferralReviewHeader
            deferral={deferral}
            onClose={onClose}
            onViewDocuments={() => setActiveTab("documents")}
            documentCount={uploadedDocumentCount}
          />

          <div className="deferral-review-actionbar">
            <div className="deferral-review-actionbar__group">
              {canAccept ? (
                <Button
                  className="deferral-review-actionbar__button"
                  disabled={Boolean(actionLoading)}
                  onClick={onApprove}
                  icon={<CheckCircleOutlined />}
                >
                  {isCloseRequestAction ? "Submit Review" : "Accept"}
                </Button>
              ) : null}

              {canReturnForRework ? (
                <Button
                  className="deferral-review-actionbar__button"
                  disabled={Boolean(actionLoading)}
                  onClick={onReturnForRework}
                  icon={<ExclamationCircleOutlined />}
                >
                  Return for Rework
                </Button>
              ) : null}
            </div>

            <div className="deferral-review-actionbar__group deferral-review-actionbar__group--end">
              <Button
                className="deferral-review-actionbar__button"
                icon={<DownloadOutlined />}
                loading={downloadLoading || Boolean(actionLoading)}
                onClick={onDownloadPDF || downloadDeferralAsPDF}
              >
                Download PDF
              </Button>
              <Button
                className="deferral-review-actionbar__button ant-btn--secondary"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="deferral-review-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`deferral-review-tab${activeTab === tab.key ? " deferral-review-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="deferral-review-workspace">
            <div className="deferral-review-main">
              <div className="deferral-review-body">
                <Spin spinning={Boolean(actionLoading)}>
                  {activeTab === "details" ? (
                    <>
                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Workflow Status</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <DeferralStatusAlert deferral={deferral} />
                      </Card>

                      <Card
                        className="deferral-info-card deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Deferral Details</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <Descriptions className="deferral-review-summary" size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
                          <Descriptions.Item label="Customer Name">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerName || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Customer Number">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerNumber || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Deferral No">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.deferralNumber || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="DCL No">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.dclNo || deferral.dclNumber || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Type">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanType || "-"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Created At">
                            <Text strong style={{ color: PRIMARY_BLUE }}>
                              {deferral.createdAt ? dayjs(deferral.createdAt).format("DD MMM YYYY") : "-"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Status">
                            <Text
                              strong
                              style={{
                                color: checkerApproved
                                  ? SUCCESS_GREEN
                                  : isRejected
                                    ? ERROR_RED
                                    : PRIMARY_BLUE,
                              }}
                            >
                              {deferral.status
                                ? deferral.status.replace(/_/g, " ")
                                : "-"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Creator Status">
                            <Text style={{ color: creatorApproved ? SUCCESS_GREEN : PRIMARY_BLUE }}>
                              {creatorApproved ? "Approved" : "Pending"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Checker Status">
                            <Text style={{ color: checkerApproved ? SUCCESS_GREEN : PRIMARY_BLUE }}>
                              {checkerApproved ? "Approved" : "Pending"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Approvers Status">
                            <Text strong style={{ color: PRIMARY_BLUE }}>
                              {approvedApproversCount} of {approvalFlow.length} Approved
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Amount">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanAmountCategory || deferral.loanAmount || "Below 75 million"}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Requested Documents">
                            <Text strong style={{ color: PRIMARY_BLUE }}>{requestedDocsWithDates.length}</Text>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>

                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Review Summary</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-stats">
                          <div className="deferral-review-stat">
                            <div className="deferral-review-stat__label">Requested Docs</div>
                            <div className="deferral-review-stat__value">{requestedDocsWithDates.length}</div>
                          </div>
                          <div className="deferral-review-stat">
                            <div className="deferral-review-stat__label">Uploaded Docs</div>
                            <div className="deferral-review-stat__value">{dclDocs.length + generalUploadedDocs.length}</div>
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
                        title={<span style={{ color: PRIMARY_BLUE }}>Deferral Description</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-text-block">
                          {deferral.deferralDescription || "No description provided."}
                        </div>
                      </Card>

                      {deferral.facilities?.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Facility Details ({deferral.facilities.length})</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={deferral.facilities}
                              columns={getFacilityColumns()}
                              pagination={false}
                              size="small"
                              rowKey={(row, index) => row.facilityNumber || row._id || `facility-${index}`}
                              scroll={{ x: 600 }}
                            />
                          </div>
                        </Card>
                      ) : null}

                      {approvalFlow.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Approval Flow</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={approvalFlow}
                              columns={approvalFlowColumns}
                              pagination={false}
                              size="small"
                              rowKey={(approver, index) => approver._id || approver.userId || `approver-${index}`}
                              scroll={{ x: 640 }}
                            />
                          </div>
                        </Card>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {requestedDocsWithDates.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Document(s) to be Deferred ({requestedDocsWithDates.length})</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={requestedDocsWithDates}
                              columns={requestedDocsColumns}
                              pagination={false}
                              size="small"
                              rowKey={(doc, index) => doc.id || doc._id || `${doc.name || "doc"}-${index}`}
                              scroll={{ x: 720 }}
                            />
                          </div>
                        </Card>
                      ) : null}

                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Mandatory: DCL Upload</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-table-shell">
                          <Table
                            dataSource={dclDocs}
                            columns={uploadedDocumentColumns}
                            pagination={false}
                            size="small"
                            rowKey={(doc, index) => doc.id || doc._id || `dcl-${index}`}
                            locale={{ emptyText: "Auto-generated DCL document pending upload" }}
                          />
                        </div>
                      </Card>

                      <Card
                        className="deferral-review-section"
                        size="small"
                        title={<span style={{ color: PRIMARY_BLUE }}>Additional Documents ({generalUploadedDocs.length})</span>}
                        style={{ marginBottom: 18 }}
                      >
                        <div className="deferral-review-table-shell">
                          <Table
                            dataSource={generalUploadedDocs}
                            columns={uploadedDocumentColumns}
                            pagination={false}
                            size="small"
                            rowKey={(doc, index) => doc.id || doc._id || `upload-${index}`}
                            locale={{ emptyText: "No additional supporting documents" }}
                          />
                        </div>
                      </Card>

                      {isCloseRequestContext && closeRequestDocuments.length > 0 ? (
                        <Card
                          className="deferral-review-section"
                          size="small"
                          title={<span style={{ color: PRIMARY_BLUE }}>Close Request Documents ({closeRequestDocuments.length})</span>}
                          style={{ marginBottom: 18 }}
                        >
                          <div className="deferral-review-table-shell">
                            <Table
                              dataSource={closeRequestDocuments}
                              columns={closeRequestColumns}
                              pagination={false}
                              size="small"
                              rowKey={(document) => document.key || document.documentName}
                              expandable={{
                                expandedRowRender: (document) => (
                                  <Table
                                    dataSource={document.uploads || []}
                                    columns={closeRequestUploadColumns}
                                    pagination={false}
                                    size="small"
                                    rowKey={(upload, index) => upload.id || upload._id || `${document.key}-upload-${index}`}
                                    locale={{ emptyText: "No uploaded close-request evidence found for this document." }}
                                  />
                                ),
                              }}
                              scroll={{ x: 1100 }}
                            />
                          </div>
                        </Card>
                      ) : null}
                    </>
                  )}
                </Spin>
              </div>
            </div>

            <aside className="deferral-review-sidebar">
              <div className="deferral-review-sidebar__section">
                <div className="deferral-review-sidebar__title">Recent Comments</div>
                {history.length === 0 ? (
                  <div className="deferral-review-sidebar__empty">No user comments yet.</div>
                ) : (
                  <div className="deferral-review-sidebar__history">
                    {history.map((item, index) => (
                      <div
                        key={`${item.date || item.createdAt || "comment"}-${index}`}
                        className="deferral-review-sidebar__history-item"
                      >
                        <div className="deferral-review-sidebar__history-meta">
                          <span className="deferral-review-sidebar__history-user">
                            {item.user || "User"}
                          </span>
                          <span className="deferral-review-sidebar__history-time">
                            {formatHistoryTimestamp(item.date || item.createdAt || item.timestamp)}
                          </span>
                        </div>
                        <div className="deferral-review-sidebar__history-text">
                          {item.comment || item.notes || item.message || item.text || "No comment provided."}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {approvalConfirmVisible ? (
        <div className="deferral-review-confirm-overlay" role="presentation">
          <div
            className="deferral-review-confirm-dialog admin-page__modal deferral-review-confirm deferral-review-confirm--acceptance"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checker-approval-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-page__modal-header deferral-review-confirm__hero">
              <div className="deferral-review-confirm__hero-icon"><CheckCircleOutlined /></div>
              <h2 className="admin-page__modal-title" id="checker-approval-dialog-title">
                {isCloseRequestAction ? "Submit Close Request Review" : "Confirm Acceptance"}
              </h2>
              <p className="admin-page__modal-subtitle">
                {isCloseRequestAction
                  ? "Review the checker decisions and submit this close request using the same admin modal layout used elsewhere in the workspace."
                  : "Confirm this deferral decision using the same admin modal layout used across the application."}
              </p>
              <button
                type="button"
                className="deferral-review-confirm__close"
                onClick={onApprovalCancel}
                aria-label="Close approval dialog"
              >
                ×
              </button>
            </div>

            <div className="deferral-review-confirm__body admin-page__modal-body">
              <div className="deferral-review-confirm__body-card">
                <div className="deferral-review-confirm__summary">
                  <div className="deferral-review-confirm__summary-title">
                    {deferral.deferralNumber || (isCloseRequestAction ? "Close request review" : "Deferral acceptance")}
                  </div>
                  <div className="deferral-review-confirm__summary-copy">
                    {isCloseRequestAction
                      ? "Review and submit the close-request decision for this deferral."
                      : "Accept this deferral using the same controlled review flow as the other system modals."}
                  </div>
                  <div className="deferral-review-confirm__summary-copy">
                    {isCloseRequestAction
                      ? pendingCheckerDecisions > 0
                        ? `Review ${pendingCheckerDecisions} remaining close-request document${pendingCheckerDecisions === 1 ? "" : "s"} before you submit.`
                        : "Approving this review will advance the close request and publish your decision to the workflow trail."
                      : "Approving this request will advance it in the workflow and publish your decision to the review trail."}
                  </div>
                </div>

                <label className="deferral-review-confirm__label" htmlFor="checker-approval-comment">
                  {isCloseRequestAction ? "Review comment" : "Approval comments"}
                </label>
                <TextArea
                  id="checker-approval-comment"
                  rows={4}
                  placeholder="Enter any additional comments..."
                  value={creatorComment}
                  onChange={(event) => onCreatorCommentChange?.(event.target.value)}
                  className="deferral-review-confirm__textarea"
                />
              </div>

              <div className="admin-page__modal-footer">
                <Button
                  onClick={onApprovalCancel}
                  disabled={Boolean(actionLoading)}
                  className="admin-page__action-button admin-page__action-button--secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => onApprovalConfirm?.({
                    comment: creatorComment,
                    checkerDocumentDecisions: closeRequestDocuments.map((document) => {
                      const key = normalizeCloseRequestDecisionKey(document.documentName || document.key);
                      const decision = checkerDocumentDecisions[key] || {};
                      return {
                        documentName: document.documentName,
                        status: decision.status || "pending",
                        comment: decision.comment || "",
                      };
                    }),
                  })}
                  loading={Boolean(actionLoading)}
                  disabled={Boolean(actionLoading) || (isCloseRequestAction && pendingCheckerDecisions > 0)}
                  className="admin-page__action-button deferral-review-confirm__confirm"
                >
                  {isCloseRequestAction ? "Yes, Submit Review" : "Yes, Approve"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reworkConfirmVisible ? (
        <div className="deferral-review-confirm-overlay" role="presentation">
          <div
            className="deferral-review-confirm-dialog admin-page__modal deferral-review-confirm deferral-review-confirm--rework"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checker-rework-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-page__modal-header deferral-review-confirm__hero">
              <div className="deferral-review-confirm__hero-icon"><RedoOutlined /></div>
              <h2 className="admin-page__modal-title" id="checker-rework-dialog-title">
                Return for Rework
              </h2>
              <p className="admin-page__modal-subtitle">
                Send the request back with corrective guidance using the same admin modal layout as the other system dialogs.
              </p>
              <button
                type="button"
                className="deferral-review-confirm__close"
                onClick={onReworkCancel}
                aria-label="Close rework dialog"
              >
                ×
              </button>
            </div>

            <div className="deferral-review-confirm__body admin-page__modal-body">
              <div className="deferral-review-confirm__body-card">
                <div className="deferral-review-confirm__summary">
                  <div className="deferral-review-confirm__summary-title">
                    {deferral.deferralNumber || "Return for rework"}
                  </div>
                  <div className="deferral-review-confirm__summary-copy">
                    Send the request back with clear corrective instructions.
                  </div>
                  <div className="deferral-review-confirm__summary-copy">
                    Returning this request will send it back with your instructions so the originating team can correct it.
                  </div>
                </div>

                <label className="deferral-review-confirm__label" htmlFor="checker-rework-comment">
                  Rework instructions (Required)
                </label>
                <TextArea
                  id="checker-rework-comment"
                  rows={4}
                  placeholder="Enter rework instructions..."
                  value={reworkComment}
                  onChange={(event) => onReworkCommentChange?.(event.target.value)}
                  className="deferral-review-confirm__textarea"
                />
              </div>

              <div className="admin-page__modal-footer">
                <Button
                  onClick={onReworkCancel}
                  disabled={Boolean(actionLoading)}
                  className="admin-page__action-button admin-page__action-button--secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onReworkConfirm}
                  loading={Boolean(actionLoading)}
                  disabled={!String(reworkComment || "").trim()}
                  className="admin-page__action-button deferral-review-confirm__confirm"
                >
                  Yes, Return for Rework
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DeferralDetailModal;