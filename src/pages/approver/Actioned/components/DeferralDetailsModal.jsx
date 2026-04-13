import React, { useState } from "react";
import { Button, Descriptions, Empty, Table, Typography, message } from "antd";
import {
  BankOutlined,
  CloseOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import getFacilityColumns from "../../../../utils/facilityColumns";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";
import { getLivePartyApprovalStatuses } from "../../../../utils/deferralApprovalStatus";
import { openFileInNewTab, downloadFile } from "../../../../utils/fileUtils";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import {
  PRIMARY_BLUE,
  SUCCESS_GREEN,
} from "../utils/constants";
import CommentTrail from "./CommentTrail";
import "../../../../styles/creatorDesignSystem.css";

const TABS = [
  { key: "details", label: "Deferral Details" },
  { key: "documents", label: "Documents & Flow" },
];

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

const normalizeHistoryValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const DUPLICATE_TIME_WINDOW_MS = 2 * 60 * 1000;

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

const REVIEW_STYLES = `
  .actioned-deferral-review {
    border-top: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-bg);
  }

  .actioned-deferral-review__page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .actioned-deferral-review__topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .actioned-deferral-review__title-wrap {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .actioned-deferral-review__title-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 54, 54, 0.08);
    color: var(--color-primary-dark);
    flex-shrink: 0;
  }

  .actioned-deferral-review__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text-dark);
  }

  .actioned-deferral-review__subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-light);
  }

  .actioned-deferral-review__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-white);
    color: var(--color-text-medium);
  }

  .actioned-deferral-review__banner,
  .actioned-deferral-review__section,
  .actioned-deferral-review__comments {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
  }

  .actioned-deferral-review__banner {
    padding: 12px 14px;
  }

  .actioned-deferral-review__banner-title {
    color: ${SUCCESS_GREEN};
    font-weight: 700;
    font-size: 13px;
  }

  .actioned-deferral-review__banner-copy {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-medium);
  }

  .actioned-deferral-review__tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    overflow-x: auto;
  }

  .actioned-deferral-review__tab {
    padding: 10px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-light);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
  }

  .actioned-deferral-review__tab--active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary-dark);
  }

  .actioned-deferral-review__details-layout {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
    gap: 16px;
    align-items: start;
  }

  .actioned-deferral-review__details-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .actioned-deferral-review__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }

  .actioned-deferral-review__section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-dark);
  }

  .actioned-deferral-review__section-body {
    padding: 16px;
  }

  .actioned-deferral-review__comments {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .actioned-deferral-review__comments .ant-input {
    padding: 8px !important;
    font-size: 12px !important;
    border-radius: 6px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
  }

  .actioned-deferral-review__primary-btn.ant-btn {
    border: none !important;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .actioned-deferral-review__primary-btn.ant-btn:hover,
  .actioned-deferral-review__primary-btn.ant-btn:focus,
  .actioned-deferral-review__primary-btn.ant-btn:active {
    border: none !important;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
  }

  .actioned-deferral-review__secondary-btn.ant-btn {
    border: 1px solid var(--color-primary-soft) !important;
    background: transparent !important;
    color: var(--color-primary-medium) !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .actioned-deferral-review__secondary-btn.ant-btn:hover,
  .actioned-deferral-review__secondary-btn.ant-btn:focus,
  .actioned-deferral-review__secondary-btn.ant-btn:active {
    border-color: var(--color-primary-soft) !important;
    background: rgba(214, 189, 152, 0.1) !important;
    color: var(--color-primary-dark) !important;
    box-shadow: none !important;
  }

  .actioned-deferral-review__primary-btn.ant-btn:disabled,
  .actioned-deferral-review__primary-btn.ant-btn[disabled],
  .actioned-deferral-review__secondary-btn.ant-btn:disabled,
  .actioned-deferral-review__secondary-btn.ant-btn[disabled] {
    background: #D1D5DB !important;
    border-color: #D1D5DB !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  .actioned-deferral-review__primary-btn.ant-btn:disabled span,
  .actioned-deferral-review__primary-btn.ant-btn[disabled] span,
  .actioned-deferral-review__secondary-btn.ant-btn:disabled span,
  .actioned-deferral-review__secondary-btn.ant-btn[disabled] span {
    color: #fff !important;
  }

  .actioned-deferral-review__table-shell {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .actioned-deferral-review__table-shell + .actioned-deferral-review__table-shell {
    margin-top: 16px;
  }

  .actioned-deferral-review .ant-descriptions-item-label {
    font-weight: 700 !important;
    color: var(--color-text-light) !important;
    font-size: 11px !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .actioned-deferral-review .ant-descriptions-item-content {
    color: var(--color-text-dark) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
  }

  .actioned-deferral-review .ant-table,
  .actioned-deferral-review .ant-table-wrapper,
  .actioned-deferral-review .ant-spin-nested-loading,
  .actioned-deferral-review .ant-spin-container,
  .actioned-deferral-review .ant-table-container,
  .actioned-deferral-review .ant-table-content,
  .actioned-deferral-review table,
  .actioned-deferral-review thead,
  .actioned-deferral-review tbody,
  .actioned-deferral-review tr {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .actioned-deferral-review .ant-table-thead > tr > th {
    background: transparent !important;
    color: var(--color-text-medium) !important;
    font-size: 11px;
    font-weight: 600;
    padding: 12px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    text-transform: uppercase;
    border-right: none !important;
  }

  .actioned-deferral-review .ant-table-tbody > tr > td {
    padding: 14px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
    border-right: none !important;
    color: var(--color-text-medium);
    font-size: 12px;
  }

  .actioned-deferral-review .ant-table-thead > tr > th::before,
  .actioned-deferral-review .ant-table-cell::before,
  .actioned-deferral-review .ant-table-cell::after {
    display: none !important;
  }

  .actioned-deferral-review__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 0 16px 16px;
  }

  .actioned-deferral-review__empty {
    padding: 24px;
  }

  @media (max-width: 1023px) {
    .actioned-deferral-review__details-layout {
      grid-template-columns: 1fr;
    }
  }
`;

const DeferralDetailsModal = ({
  deferral,
  open,
  onClose,
  onAction,
  headerTag,
  overrideApprovals,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [loadingComments] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const safeDeferral = deferral || null;
  const { dclDocs, uploadedDocs, requestedDocs } = getDeferralDocumentBuckets(safeDeferral || {});
  const livePartyStatuses = getLivePartyApprovalStatuses(safeDeferral || {});
  const normalizedCreatorApprovalStatus = String(
    safeDeferral?.creatorApprovalStatus || safeDeferral?.creatorStatus || "",
  )
    .trim()
    .toLowerCase();
  const normalizedCheckerApprovalStatus = String(
    safeDeferral?.checkerApprovalStatus || safeDeferral?.checkerStatus || "",
  )
    .trim()
    .toLowerCase();
  const hasExplicitPartyApprovalStatuses = Boolean(
    normalizedCreatorApprovalStatus || normalizedCheckerApprovalStatus,
  );
  const showCompletedBanner = hasExplicitPartyApprovalStatuses
    ? normalizedCreatorApprovalStatus === "approved" &&
      normalizedCheckerApprovalStatus === "approved"
    : livePartyStatuses.creatorApproved && livePartyStatuses.checkerApproved;

  const requestedDocsWithDates = requestedDocs.map((doc) => {
    const requestedDays = doc.requestedDays || doc.daysSought || 0;
    const newDueDate = safeDeferral?.createdAt
      ? dayjs(safeDeferral.createdAt).add(requestedDays, "days").toISOString()
      : null;
    return {
      ...doc,
      newDueDate,
    };
  });
  const facilities = Array.isArray(safeDeferral?.facilities)
    ? safeDeferral.facilities
    : Array.isArray(safeDeferral?.Facilities)
      ? safeDeferral.Facilities
      : [];

  const history = (function renderHistory() {
    const events = [];
    if (safeDeferral?.comments && Array.isArray(safeDeferral.comments)) {
      safeDeferral.comments.forEach((c) => {
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

  const approvalFlow = (overrideApprovals && overrideApprovals.approvers) || safeDeferral?.approverFlow || [];

  const requestedDocumentColumns = [
      {
        title: "Document",
        dataIndex: "name",
        key: "name",
        render: (value) => <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>{value || "Untitled document"}</span>,
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        render: (value, record) => value || record.documentType || "-",
      },
      {
        title: "Days Sought",
        dataIndex: "requestedDays",
        key: "requestedDays",
        width: 120,
        render: (value, record) => value || record.daysSought || "-",
      },
      {
        title: "New Due Date",
        dataIndex: "newDueDate",
        key: "newDueDate",
        width: 140,
        render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
      },
    ];

  const uploadedDocumentColumns = [
      {
        title: "Document",
        dataIndex: "name",
        key: "name",
        render: (value) => <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>{value || "Document"}</span>,
      },
      {
        title: "Uploaded At",
        dataIndex: "uploadDate",
        key: "uploadDate",
        width: 140,
        render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 160,
        render: (_, record) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openFileInNewTab(record.fileUrl || record.url)}
              disabled={!record.fileUrl && !record.url}
            >
              View
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadFile(record.fileUrl || record.url, record.name || "document")}
              disabled={!record.fileUrl && !record.url}
            >
              Download
            </Button>
          </div>
        ),
      },
    ];

  const approvalColumns = [
      {
        title: "Approver",
        key: "approver",
        render: (_, record) => <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>{record.name || record.approverName || "User"}</span>,
      },
      {
        title: "Role",
        dataIndex: "designation",
        key: "designation",
        render: (value, record) => value || record.role || "-",
      },
      {
        title: "Status",
        key: "status",
        width: 140,
        render: (_, record) => {
          const approved = record.approved || record.approvalStatus === "approved";
          return (
            <span style={{ fontWeight: 700, color: approved ? SUCCESS_GREEN : PRIMARY_BLUE }}>
              {approved ? "Approved" : "Pending Approval"}
            </span>
          );
        },
      },
    ];

  const downloadDeferralAsPDF = async () => {
    if (!safeDeferral || !safeDeferral._id) {
      message.error("No deferral selected");
      return;
    }

    setDownloadLoading(true);
    try {
      await downloadDeferralPdf(safeDeferral, { requestedDocsWithDates, history });
      message.success("Deferral downloaded as PDF successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Failed to generate PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!open || !safeDeferral) return null;

  const detailsSubtitle = `${safeDeferral.customerName || "Customer"} • ${safeDeferral.dclNumber || safeDeferral.dclNo || "No DCL"}`;

  return (
    <>
      <style>{REVIEW_STYLES}</style>
      <div className="actioned-deferral-review">
        <div className="actioned-deferral-review__page">
          <div className="actioned-deferral-review__topbar">
            <div className="actioned-deferral-review__title-wrap">
              <span className="actioned-deferral-review__title-icon">
                <BankOutlined />
              </span>
              <div>
                <h2 className="actioned-deferral-review__title">
                  {headerTag ? `${headerTag}: ${safeDeferral.deferralNumber}` : `Deferral Request: ${safeDeferral.deferralNumber}`}
                </h2>
                <div className="actioned-deferral-review__subtitle">{detailsSubtitle}</div>
              </div>
            </div>

            <Button className="actioned-deferral-review__close" icon={<CloseOutlined />} onClick={onClose} />
          </div>

          {showCompletedBanner ? (
            <div className="actioned-deferral-review__banner">
              <div className="actioned-deferral-review__banner-title">Deferral Completed</div>
              <div className="actioned-deferral-review__banner-copy">
                This deferral request has been fully processed and is now available in the actioned workspace.
              </div>
            </div>
          ) : null}

          <div className="actioned-deferral-review__tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`actioned-deferral-review__tab ${activeTab === tab.key ? "actioned-deferral-review__tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "details" ? (
            <div className="actioned-deferral-review__details-layout">
              <div className="actioned-deferral-review__details-main">
                <section className="actioned-deferral-review__section">
                  <div className="actioned-deferral-review__section-head">
                    <h3 className="actioned-deferral-review__section-title">Customer Information</h3>
                  </div>
                  <div className="actioned-deferral-review__section-body">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Customer Name">{deferral.customerName || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Customer Number">{safeDeferral.customerNumber || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Loan Type">{safeDeferral.loanType || "-"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="actioned-deferral-review__section">
                  <div className="actioned-deferral-review__section-head">
                    <h3 className="actioned-deferral-review__section-title">Deferral Summary</h3>
                  </div>
                  <div className="actioned-deferral-review__section-body">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Deferral Number">{safeDeferral.deferralNumber || "-"}</Descriptions.Item>
                      <Descriptions.Item label="DCL No">{safeDeferral.dclNumber || safeDeferral.dclNo || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Status">{safeDeferral.status || "Completed"}</Descriptions.Item>
                      <Descriptions.Item label="Creator Status">{livePartyStatuses.creatorLabel}</Descriptions.Item>
                      <Descriptions.Item label="Checker Status">{livePartyStatuses.checkerLabel}</Descriptions.Item>
                      <Descriptions.Item label="Approver Status">{`${approvalFlow.filter((item) => item.approved || item.approvalStatus === "approved").length} of ${approvalFlow.length} Approved`}</Descriptions.Item>
                      <Descriptions.Item label="Loan Amount">{safeDeferral.loanAmountCategory || "Below 75 million"}</Descriptions.Item>
                      <Descriptions.Item label="Created At">{safeDeferral.createdAt ? dayjs(safeDeferral.createdAt).format("DD MMM YYYY") : "-"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="actioned-deferral-review__section">
                  <div className="actioned-deferral-review__section-head">
                    <h3 className="actioned-deferral-review__section-title">Deferral Description</h3>
                  </div>
                  <div className="actioned-deferral-review__section-body">
                    <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap", color: "var(--color-text-medium)" }}>
                      {safeDeferral.deferralDescription || "-"}
                    </Typography.Paragraph>
                  </div>
                </section>
              </div>

              <aside className="actioned-deferral-review__comments">
                <div className="creator-caption">Comments</div>
                <CommentTrail history={history} isLoading={loadingComments} />
              </aside>
            </div>
          ) : (
            <div>
              <div className="actioned-deferral-review__table-shell">
                <div className="actioned-deferral-review__section-head">
                  <h3 className="actioned-deferral-review__section-title">Documents To Be Deferred</h3>
                </div>
                {requestedDocsWithDates.length > 0 ? (
                  <Table
                    columns={requestedDocumentColumns}
                    dataSource={requestedDocsWithDates}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `${record.name}-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="actioned-deferral-review__empty"><Empty description="No deferred documents" /></div>
                )}
              </div>

              <div className="actioned-deferral-review__table-shell">
                <div className="actioned-deferral-review__section-head">
                  <h3 className="actioned-deferral-review__section-title">Facility Details</h3>
                </div>
                {facilities.length > 0 ? (
                  <Table
                    dataSource={facilities}
                    columns={getFacilityColumns()}
                    pagination={false}
                    rowKey={(record, index) => record.facilityNumber || record._id || `facility-${index}`}
                    scroll={{ x: 720 }}
                  />
                ) : (
                  <div className="actioned-deferral-review__empty"><Empty description="No facilities available" /></div>
                )}
              </div>

              <div className="actioned-deferral-review__table-shell">
                <div className="actioned-deferral-review__section-head">
                  <h3 className="actioned-deferral-review__section-title">Mandatory DCL Upload</h3>
                </div>
                {dclDocs.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={dclDocs}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `dcl-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="actioned-deferral-review__empty"><Empty description="No DCL document uploaded" /></div>
                )}
              </div>

              <div className="actioned-deferral-review__table-shell">
                <div className="actioned-deferral-review__section-head">
                  <h3 className="actioned-deferral-review__section-title">Additional Documents</h3>
                </div>
                {uploadedDocs.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={uploadedDocs}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `uploaded-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="actioned-deferral-review__empty"><Empty description="No additional documents" /></div>
                )}
              </div>

              <div className="actioned-deferral-review__table-shell">
                <div className="actioned-deferral-review__section-head">
                  <h3 className="actioned-deferral-review__section-title">Approval Flow</h3>
                </div>
                {approvalFlow.length > 0 ? (
                  <Table
                    columns={approvalColumns}
                    dataSource={approvalFlow}
                    pagination={false}
                    rowKey={(record, index) => record._id || `${record.name || record.approverName || "approver"}-${index}`}
                    scroll={{ x: 540 }}
                  />
                ) : (
                  <div className="actioned-deferral-review__empty"><Empty description="No approval flow recorded" /></div>
                )}
              </div>
            </div>
          )}

          <div className="actioned-deferral-review__footer">
            <Button
              className="actioned-deferral-review__primary-btn"
              icon={<FilePdfOutlined />}
              onClick={downloadDeferralAsPDF}
              loading={downloadLoading}
            >
              Download PDF
            </Button>
            <Button className="actioned-deferral-review__secondary-btn" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeferralDetailsModal;
