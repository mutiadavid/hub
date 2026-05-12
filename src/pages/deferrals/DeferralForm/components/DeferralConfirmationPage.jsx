import React, { useMemo, useState } from "react";
import { Button, Empty, Table } from "antd";
import { LeftOutlined, UnorderedListOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import "../../../../styles/creatorDesignSystem.css";
import "../../../../styles/deferralFormGlobalStyles.css";
import { LOAN_THRESHOLD } from "../utils/constants";
import {
  formatLoanType,
  getDocumentCategory,
  parseLoanAmount,
} from "../utils/helpers";
import { handleDownload, handleViewDocument } from "../utils/fileUtils";
import { formatCommentTimestamp } from "../../../../utils/checklistUtils";

const TABS = [
  { key: "details", label: "Request Details" },
  { key: "documents", label: "Documents" },
];

const getStatusVariant = (value) => {
  if (value === "Uploaded") {
    return "approved";
  }

  if (value === "Above 75 million") {
    return "rework";
  }

  return "pending";
};

export default function DeferralConfirmationPage({
  previewDeferralNumber,
  customerName,
  customerNumber,
  dclNumber,
  loanType,
  loanAmount,
  selectedDocuments,
  perDocumentDays,
  deferralDescription,
  approverSlots,
  facilities,
  dclFile,
  additionalFiles,
  postedComments,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const [activeTab, setActiveTab] = useState("details");

  const numericLoan = parseLoanAmount(loanAmount);
  const isAboveThreshold = Number(numericLoan) > LOAN_THRESHOLD;
  const loanAmountLabel = Number(numericLoan) > 0
    ? isAboveThreshold
      ? "Above 75 million"
      : "Below 75 million"
    : "Not specified";
  const documentCategory = getDocumentCategory(selectedDocuments);

  const uploadedFiles = useMemo(
    () => [
      ...(dclFile ? [{ name: dclFile.name, fileObj: dclFile, kind: "DCL" }] : []),
      ...additionalFiles.map((file) => ({
        name: file.name,
        fileObj: file,
        kind: "Additional",
      })),
    ],
    [additionalFiles, dclFile],
  );

  const approvers = useMemo(
    () => approverSlots.filter((slot) => slot.userId),
    [approverSlots],
  );

  const documentRows = useMemo(
    () =>
      (selectedDocuments || []).map((doc, index) => {
        const name = typeof doc === "string" ? doc : doc.name || doc.label || "Document";
        const rawType = typeof doc === "string" ? "" : String(doc.type || "").trim().toLowerCase();
        const type = rawType === "primary"
          ? "Primary"
          : rawType === "secondary"
            ? "Secondary"
            : documentCategory;

        const uploaded = uploadedFiles.find(
          (file) =>
            file.name && name && file.name.toLowerCase().includes(name.toLowerCase()),
        );

        const docKey = (doc && (doc._id || doc.name)) || name || String(index);
        const requestedDays = Number(perDocumentDays[docKey]) || 0;
        const dueDate = requestedDays ? dayjs().add(requestedDays, "day").format("DD MMM YYYY") : "-";

        return {
          key: docKey,
          name,
          type,
          requestedDays: requestedDays || "-",
          dueDate,
          uploadName: uploaded?.name || "Not uploaded",
          file: uploaded || null,
          status: uploaded ? "Uploaded" : "Requested",
        };
      }),
    [documentCategory, perDocumentDays, selectedDocuments, uploadedFiles],
  );

  const facilityRows = useMemo(
    () => facilities.map((facility, index) => ({ ...facility, key: index })),
    [facilities],
  );

  const uploadedRows = useMemo(
    () =>
      uploadedFiles.map((file, index) => ({
        key: `${file.name}-${index}`,
        ...file,
        size: file.fileObj?.size ? `${(file.fileObj.size / 1024).toFixed(2)} KB` : "-",
      })),
    [uploadedFiles],
  );

  const summaryRows = [
    { label: "Deferral Number", value: previewDeferralNumber || "TBD" },
    { label: "Customer", value: `${customerName || "-"}${customerNumber ? ` — ${customerNumber}` : ""}` },
    { label: "DCL No", value: dclNumber || "-" },
    { label: "Loan Type", value: formatLoanType(loanType) || "-" },
    { label: "Loan Amount", value: loanAmountLabel, isBadge: true },
    { label: "Deferral Description", value: deferralDescription || "No description added" },
  ];

  const documentColumns = [
    {
      title: "DOCUMENT",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div className="deferral-confirm-table-primary">
          <span className="deferral-confirm-table-primary-value">{value}</span>
          <span className="deferral-confirm-table-secondary-value">{record.uploadName}</span>
        </div>
      ),
    },
    {
      title: "TYPE",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (value) => (
        <span className={`creator-badge creator-badge--${getStatusVariant(value === "Primary" ? "Uploaded" : "Requested")}`}>
          {value}
        </span>
      ),
    },
    {
      title: "REQUESTED DAYS",
      dataIndex: "requestedDays",
      key: "requestedDays",
      width: 120,
      render: (value) => <span className="deferral-confirm-table-muted">{value}</span>,
    },
    {
      title: "NEW DUE DATE",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 140,
      render: (value) => <span className="deferral-confirm-table-muted">{value}</span>,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value) => (
        <span className={`creator-badge creator-badge--${getStatusVariant(value)}`}>
          {value}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 140,
      render: (_, record) =>
        record.file ? (
          <div className="deferral-confirm-inline-actions">
            <Button type="link" size="small" onClick={() => handleViewDocument(record.file.fileObj || record.file)}>
              View
            </Button>
            <Button type="link" size="small" onClick={() => handleDownload(record.file)}>
              Download
            </Button>
          </div>
        ) : (
          <span className="deferral-confirm-table-muted">-</span>
        ),
    },
  ];

  const facilityColumns = [
    {
      title: "FACILITY TYPE",
      dataIndex: "type",
      key: "type",
      render: (value, record) => (
        <span className="deferral-confirm-table-primary-value">
          {value || record.facilityType || record.name || "N/A"}
        </span>
      ),
    },
    {
      title: "SANCTIONED (KES '000)",
      dataIndex: "sanctioned",
      key: "sanctioned",
      align: "right",
      render: (value, record) => (
        <span className="deferral-confirm-table-muted">{Number(value ?? record.amount ?? 0).toLocaleString()}</span>
      ),
    },
    {
      title: "BALANCE (KES '000)",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      render: (value, record) => (
        <span className="deferral-confirm-table-muted">{Number(value ?? record.balance ?? 0).toLocaleString()}</span>
      ),
    },
    {
      title: "HEADROOM (KES '000)",
      dataIndex: "headroom",
      key: "headroom",
      align: "right",
      render: (value, record) => (
        <span className="deferral-confirm-table-muted">
          {Number(value ?? record.headroom ?? Math.max(0, (record.amount || 0) - (record.balance || 0))).toLocaleString()}
        </span>
      ),
    },
  ];

  const uploadedColumns = [
    {
      title: "FILE",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div className="deferral-confirm-table-primary">
          <span className="deferral-confirm-table-primary-value">{value}</span>
          <span className="deferral-confirm-table-secondary-value">{record.kind}</span>
        </div>
      ),
    },
    {
      title: "SIZE",
      dataIndex: "size",
      key: "size",
      width: 120,
      render: (value) => <span className="deferral-confirm-table-muted">{value}</span>,
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <div className="deferral-confirm-inline-actions">
          <Button type="link" size="small" onClick={() => handleViewDocument(record.fileObj || record)}>
            View
          </Button>
          <Button type="link" size="small" onClick={() => handleDownload(record)}>
            Download
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="creator-theme" style={{ minHeight: "100%", background: "var(--color-bg)", padding: 24 }}>
      <style>{`
        .deferral-confirm-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .deferral-confirm-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .deferral-confirm-topbar-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .deferral-confirm-back.ant-btn {
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid var(--color-primary-soft) !important;
          color: var(--color-primary-medium) !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .deferral-confirm-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--color-text-dark);
        }
        .deferral-confirm-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-light);
        }
        .deferral-confirm-docs.ant-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .deferral-confirm-doc-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(214, 189, 152, 0.2);
          color: var(--color-text-dark);
          font-size: 9px;
          font-weight: 400;
        }
        .deferral-confirm-actionbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 12px 14px;
        }
        .deferral-confirm-note {
          font-size: 12px;
          color: var(--color-text-light);
        }
        .deferral-confirm-actionset {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .deferral-confirm-secondary.ant-btn {
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.3) !important;
          color: var(--color-text-medium) !important;
          background: var(--color-white) !important;
          box-shadow: none !important;
        }
        .deferral-confirm-primary.ant-btn {
          border: none !important;
          border-radius: 6px !important;
          background: var(--ncb-primary-500) !important;
          color: var(--color-white) !important;
          box-shadow: 0 10px 20px rgba(26, 54, 54, 0.14) !important;
        }
        .deferral-confirm-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2);
          overflow-x: auto;
        }
        .deferral-confirm-tab {
          padding: 12px 16px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--color-text-light);
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
        }
        .deferral-confirm-tab--active {
          color: var(--color-primary-dark);
          border-bottom-color: var(--color-primary-dark);
        }
        .deferral-confirm-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
          gap: 16px;
          align-items: start;
        }
        .deferral-confirm-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .deferral-confirm-summary {
          width: 100%;
          border-collapse: collapse;
        }
        .deferral-confirm-summary tr + tr {
          border-top: 1px solid rgba(214, 189, 152, 0.16);
        }
        .deferral-confirm-summary th,
        .deferral-confirm-summary td {
          padding: 14px 0;
          text-align: left;
          vertical-align: top;
        }
        .deferral-confirm-summary th {
          width: 180px;
          color: var(--color-text-light);
          font-size: 12px;
          font-weight: 400;
        }
        .deferral-confirm-summary td {
          color: var(--color-text-dark);
          font-size: 13px;
          font-weight: 400;
        }
        .deferral-confirm-description {
          padding: 10px 12px;
          background: rgba(214, 189, 152, 0.08);
          border-radius: 8px;
          color: var(--color-text-medium);
        }
        .deferral-confirm-approver-list,
        .deferral-confirm-comments-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .deferral-confirm-approver-item,
        .deferral-confirm-comment-item {
          padding: 10px 12px;
          border: 1px solid rgba(214, 189, 152, 0.16);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.72);
        }
        .deferral-confirm-approver-name,
        .deferral-confirm-comment-author {
          font-size: 13px;
          font-weight: 400;
          color: var(--color-text-dark);
        }
        .deferral-confirm-approver-role,
        .deferral-confirm-comment-meta,
        .deferral-confirm-comment-message {
          font-size: 12px;
          font-weight: 400;
          color: var(--color-text-light);
        }
        .deferral-confirm-table-shell .ant-table,
        .deferral-confirm-table-shell .ant-table-wrapper,
        .deferral-confirm-table-shell .ant-table-container,
        .deferral-confirm-table-shell .ant-table-content,
        .deferral-confirm-table-shell table,
        .deferral-confirm-table-shell thead,
        .deferral-confirm-table-shell tbody,
        .deferral-confirm-table-shell tr {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        .deferral-confirm-table-shell .ant-table-thead > tr > th {
          background: transparent !important;
          color: var(--color-text-medium) !important;
          font-size: 11px;
          font-weight: 400;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
          padding: 14px 12px !important;
        }
        .deferral-confirm-table-shell .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
          padding: 14px 12px !important;
          font-size: 12px;
          font-weight: 400;
          color: var(--color-text-dark);
        }
        .deferral-confirm-table-primary {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .deferral-confirm-table-primary-value {
          color: var(--color-text-dark);
          font-size: 13px;
          font-weight: 400;
        }
        .deferral-confirm-table-secondary-value,
        .deferral-confirm-table-muted {
          color: var(--color-text-light);
          font-size: 12px;
        }
        .deferral-confirm-inline-actions {
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }
        .deferral-confirm-empty {
          padding: 24px 0 8px;
        }
        @media (max-width: 1023px) {
          .deferral-confirm-details-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 767px) {
          .deferral-confirm-page {
            gap: 14px;
          }
          .deferral-confirm-topbar,
          .deferral-confirm-actionbar {
            flex-direction: column;
            align-items: stretch;
          }
          .deferral-confirm-actionset {
            width: 100%;
          }
          .deferral-confirm-actionset .ant-btn {
            flex: 1;
          }
          .deferral-confirm-summary th,
          .deferral-confirm-summary td {
            display: block;
            width: 100%;
            padding: 8px 0;
          }
          .deferral-confirm-summary tr {
            display: block;
            padding: 6px 0;
          }
        }
      `}</style>

      <div className="deferral-confirm-page">
        <div className="deferral-confirm-topbar">
          <div className="deferral-confirm-topbar-main">
            <Button icon={<LeftOutlined />} className="deferral-confirm-back" onClick={onCancel}>
              Back
            </Button>
            <div>
              <h1 className="deferral-confirm-title">Confirm submission to approvers</h1>
              <div className="deferral-confirm-subtitle">
                {(previewDeferralNumber || "TBD")} • {customerName || "No customer"}
              </div>
            </div>
          </div>

          <Button className="deferral-confirm-docs" onClick={() => setActiveTab("documents")}>
            <UnorderedListOutlined />
            View documents
            <span className="deferral-confirm-doc-count">{documentRows.length + uploadedRows.length}</span>
          </Button>
        </div>

        <div className="deferral-confirm-actionbar">
          <div className="deferral-confirm-note">
            Review the request summary, attachments, and approver flow before submission.
          </div>
          <div className="deferral-confirm-actionset">
            <Button className="deferral-confirm-secondary" onClick={onCancel}>
              Back to form
            </Button>
            <Button
              className="deferral-confirm-primary"
              onClick={onSubmit}
              disabled={approvers.length === 0}
              loading={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </div>

        <div className="deferral-confirm-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`deferral-confirm-tab ${activeTab === tab.key ? "deferral-confirm-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <div className="deferral-confirm-details-layout">
            <div className="deferral-confirm-stack">
              <section className="creator-card">
                <div className="creator-card__header">
                  <div>
                    <div className="creator-card__title">Request Summary</div>
                    <div className="creator-card__subtitle">Core deferral details and loan information</div>
                  </div>
                </div>
                <div className="creator-card__body">
                  <table className="deferral-confirm-summary">
                    <tbody>
                      {summaryRows.map((row) => (
                        <tr key={row.label}>
                          <th>{row.label}</th>
                          <td>
                            {row.isBadge ? (
                              <span className={`creator-badge creator-badge--${getStatusVariant(row.value)}`}>
                                {row.value}
                              </span>
                            ) : row.label === "Deferral Description" ? (
                              <div className="deferral-confirm-description">{row.value}</div>
                            ) : (
                              row.value
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="creator-card deferral-confirm-table-shell">
                <div className="creator-card__header">
                  <div>
                    <div className="creator-card__title">Facilities</div>
                    <div className="creator-card__subtitle">Facility exposure and headroom summary</div>
                  </div>
                </div>
                <div className="creator-card__body">
                  {facilityRows.length > 0 ? (
                    <Table
                      size="small"
                      columns={facilityColumns}
                      dataSource={facilityRows}
                      pagination={false}
                    />
                  ) : (
                    <div className="deferral-confirm-empty">
                      <Empty description="No facilities added" />
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="deferral-confirm-stack">
              <section className="creator-card">
                <div className="creator-card__header">
                  <div>
                    <div className="creator-card__title">Approvers</div>
                    <div className="creator-card__subtitle">Submission flow and assigned approvers</div>
                  </div>
                </div>
                <div className="creator-card__body">
                  {approvers.length > 0 ? (
                    <div className="deferral-confirm-approver-list">
                      {approvers.map((slot, index) => {
                        return (
                          <div key={`${slot.userId}-${index}`} className="deferral-confirm-approver-item">
                            <div className="deferral-confirm-approver-name">{slot.name || slot.email || slot.samAccountName || slot.userId}</div>
                            <div className="deferral-confirm-approver-role">{slot.position || slot.role || "Approver"}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty description="No approvers selected" />
                  )}
                </div>
              </section>

              <section className="creator-card">
                <div className="creator-card__header">
                  <div>
                    <div className="creator-card__title">Comment Trail & History</div>
                    <div className="creator-card__subtitle">Existing comments included in the request</div>
                  </div>
                </div>
                <div className="creator-card__body">
                  {postedComments && postedComments.length > 0 ? (
                    <div className="deferral-confirm-comments-list">
                      {postedComments.map((item, index) => (
                        <div key={`${item.createdAt || index}`} className="deferral-confirm-comment-item">
                          <div className="deferral-confirm-comment-author">{item.user?.name || "Unknown"}</div>
                          <div className="deferral-confirm-comment-message">{item.message}</div>
                          <div className="deferral-confirm-comment-meta">
                            {item.user?.role || "User"}
                            {item.createdAt
                              ? ` • ${formatCommentTimestamp(item.createdAt)}`
                              : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="No comment history" />
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="deferral-confirm-stack">
            <section className="creator-card deferral-confirm-table-shell">
              <div className="creator-card__header">
                <div>
                  <div className="creator-card__title">Documents to Be Deferred</div>
                  <div className="creator-card__subtitle">Requested documents, requested days, and due dates</div>
                </div>
              </div>
              <div className="creator-card__body">
                {documentRows.length > 0 ? (
                  <Table
                    size="small"
                    columns={documentColumns}
                    dataSource={documentRows}
                    pagination={false}
                  />
                ) : (
                  <div className="deferral-confirm-empty">
                    <Empty description="No documents selected" />
                  </div>
                )}
              </div>
            </section>

            <section className="creator-card deferral-confirm-table-shell">
              <div className="creator-card__header">
                <div>
                  <div className="creator-card__title">Uploaded Documents</div>
                  <div className="creator-card__subtitle">Attached DCL and supporting uploads</div>
                </div>
              </div>
              <div className="creator-card__body">
                {uploadedRows.length > 0 ? (
                  <Table
                    size="small"
                    columns={uploadedColumns}
                    dataSource={uploadedRows}
                    pagination={false}
                  />
                ) : (
                  <div className="deferral-confirm-empty">
                    <Empty description="No uploaded documents" />
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
