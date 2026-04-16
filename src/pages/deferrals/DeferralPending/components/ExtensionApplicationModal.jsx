import React, { useState } from "react";
import {
  Modal,
  Button,
  InputNumber,
  Input,
  Table,
  Upload,
  Typography,
} from "antd";
import {
  CheckCircleFilled,
  LeftOutlined,
  UnorderedListOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { PRIMARY_BLUE, SUCCESS_GREEN } from "../utils/constants";
import ExtensionWorkflowProgress from "../../../../components/common/ExtensionWorkflowProgress";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";

const TABS = [
  { key: "request", label: "Extension Request" },
];

const MODAL_STYLES = `
  .extension-review-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .extension-review-page[data-embedded="true"] {
    min-height: 100%;
  }

  .extension-review-topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .extension-review-topbar-main {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .extension-review-back {
    padding: 8px 12px !important;
    border-radius: 6px !important;
    border: 1px solid var(--color-primary-soft, rgba(214, 189, 152, 0.4)) !important;
    color: var(--color-primary-medium, ${PRIMARY_BLUE}) !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .extension-review-back:hover,
  .extension-review-back:focus {
    background: rgba(214, 189, 152, 0.1) !important;
  }

  .extension-review-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text-dark, #1f2937);
  }

  .extension-review-subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-light, #64748b);
  }

  .extension-review-topbar-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .extension-review-viewdocs {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px !important;
    border-radius: 6px !important;
    border: 1px solid rgba(214, 189, 152, 0.2) !important;
    background: var(--color-white, #fff) !important;
    color: var(--color-text-medium, #475569) !important;
    box-shadow: none !important;
  }

  .extension-review-viewdocs-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(214, 189, 152, 0.2);
    color: var(--color-text-dark, #1f2937);
    font-size: 9px;
    font-weight: 600;
  }

  .extension-review-actionbar {
    background: var(--color-white, #fff);
    border-radius: 8px;
    border: 1px solid rgba(214, 189, 152, 0.2);
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .extension-review-actiontext {
    min-width: 220px;
  }

  .extension-review-actiontitle {
    color: var(--color-text-dark, #1f2937);
    font-size: 13px;
    font-weight: 700;
  }

  .extension-review-actionsubtitle {
    color: var(--color-text-light, #64748b);
    font-size: 11px;
    margin-top: 2px;
  }

  .extension-review-actionbuttons {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  .extension-review-layout {
    display: block;
  }

  .extension-review-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .extension-review-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    overflow-x: auto;
  }

  .extension-review-tab {
    padding: 6px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-text-light, #64748b);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: color 150ms, border-color 150ms;
    white-space: nowrap;
    font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
  }

  .extension-review-tab:hover {
    color: var(--color-primary-medium, ${PRIMARY_BLUE});
  }

  .extension-review-tab--active {
    color: var(--color-primary-dark, ${PRIMARY_BLUE});
    border-bottom-color: var(--color-primary-dark, ${PRIMARY_BLUE});
  }

  .extension-review-card {
    background: var(--color-white, #fff);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
    overflow: hidden;
  }

  .extension-review-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.16);
    background: linear-gradient(180deg, rgba(245, 247, 244, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
  }

  .extension-review-card__title {
    color: var(--color-text-dark, #1f2937);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .extension-review-card__subtitle {
    color: var(--color-text-light, #64748b);
    font-size: 11px;
    margin-top: 2px;
  }

  .extension-review-card__body {
    padding: 16px;
  }

  .extension-review-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .extension-review-summary-item {
    display: flex;
    min-height: 72px;
    border-right: 1px solid rgba(214, 189, 152, 0.14);
    border-bottom: 1px solid rgba(214, 189, 152, 0.14);
  }

  .extension-review-summary-item:nth-child(3n) {
    border-right: none;
  }

  .extension-review-summary-item:nth-last-child(-n + 3) {
    border-bottom: none;
  }

  .extension-review-summary-label {
    width: 42%;
    min-width: 120px;
    padding: 14px 16px;
    background: var(--color-bg, #f5f7f4);
    color: #7c8b86;
    font-size: 11px;
    font-weight: 600;
  }

  .extension-review-summary-value {
    flex: 1;
    padding: 14px 16px;
    background: #fff;
    color: #334155;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
  }

  .extension-review-formgrid {
    display: grid;
    grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .extension-review-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .extension-review-fieldlabel {
    color: var(--color-text-dark, #1f2937);
    font-size: 12px;
    font-weight: 600;
  }

  .extension-review-fieldhint {
    color: var(--color-text-light, #64748b);
    font-size: 11px;
    line-height: 1.45;
  }

  .extension-review-uploadbox {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px dashed rgba(214, 189, 152, 0.4);
    border-radius: 8px;
    background: rgba(245, 247, 244, 0.6);
  }

  .extension-review-uploadsummary {
    font-size: 11px;
    color: var(--color-text-light, #64748b);
  }

  .extension-review-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 320px;
    text-align: center;
    padding: 24px;
  }

  .extension-review-successicon {
    font-size: 42px;
    color: ${SUCCESS_GREEN};
  }

  .extension-review-table-shell .ant-table {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .extension-review-table-shell .ant-table-thead > tr > th {
    background: var(--color-bg, #f5f7f4) !important;
    color: #64748b !important;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
  }

  .extension-review-table-shell .ant-table-tbody > tr > td {
    color: #334155;
    font-size: 12px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.14) !important;
    vertical-align: top;
  }

  .extension-review-table-shell .ant-input-number,
  .extension-review-field .ant-input-number,
  .extension-review-field .ant-input,
  .extension-review-field .ant-input-affix-wrapper,
  .extension-review-field .ant-input-textarea textarea {
    border-radius: 6px !important;
    box-shadow: none !important;
  }

  .extension-review-table-shell .ant-input-number:hover,
  .extension-review-field .ant-input-number:hover,
  .extension-review-field .ant-input:hover,
  .extension-review-field .ant-input-affix-wrapper:hover,
  .extension-review-field .ant-input-textarea textarea:hover,
  .extension-review-table-shell .ant-input-number-focused,
  .extension-review-field .ant-input-number-focused,
  .extension-review-field .ant-input:focus,
  .extension-review-field .ant-input-affix-wrapper-focused,
  .extension-review-field .ant-input-textarea textarea:focus {
    border-color: var(--color-primary-dark, ${PRIMARY_BLUE}) !important;
  }

  @media (min-width: 768px) {
    .extension-review-title {
      font-size: 17px;
    }
  }

  @media (min-width: 1024px) {
    .extension-review-title {
      font-size: 19px;
    }
  }

  @media (max-width: 1023px) {
    .extension-review-summary-grid,
    .extension-review-formgrid {
      grid-template-columns: 1fr;
    }

    .extension-review-summary-item,
    .extension-review-summary-item:nth-child(3n) {
      border-right: none;
    }

    .extension-review-summary-item:not(:last-child) {
      border-bottom: 1px solid rgba(214, 189, 152, 0.14);
    }

    .extension-review-summary-item:nth-last-child(-n + 3) {
      border-bottom: 1px solid rgba(214, 189, 152, 0.14);
    }

    .extension-review-summary-item:last-child {
      border-bottom: none;
    }
  }

  @media (max-width: 767px) {
    .extension-review-actionbar {
      align-items: stretch;
    }

    .extension-review-actionbuttons,
    .extension-review-topbar-actions {
      width: 100%;
      justify-content: stretch;
    }

    .extension-review-actionbuttons .ant-btn,
    .extension-review-topbar-actions .ant-btn {
      flex: 1;
    }

    .extension-review-summary-item {
      flex-direction: column;
    }

    .extension-review-summary-label {
      width: 100%;
      min-width: 0;
      border-bottom: 1px solid rgba(214, 189, 152, 0.14);
    }
  }
`;

/**
 * ExtensionApplicationModal Component
 * Modal for applying extensions to approved deferrals
 */
const ExtensionApplicationModal = ({
  open = false,
  embedded = false,
  selectedDeferral = null,
  extensionDays = "",
  extensionDaysByDoc = {},
  extensionComment = "",
  extensionFiles = [],
  extensionSubmitting = false,
  extensionSubmissionSuccess = false,
  onDaysChange,
  onDaysByDocChange,
  onCommentChange,
  onFilesChange,
  onClose,
  onSubmit,
  onSuccessViewExtensions,
}) => {
  const [activeTab, setActiveTab] = useState("details");

  if (!selectedDeferral) return null;

  const { requestedDocs = [] } = getDeferralDocumentBuckets(selectedDeferral) || {};
  const extensionRecords = Array.isArray(selectedDeferral?.extensions)
    ? selectedDeferral.extensions
    : [];
  const currentExtension =
    [...extensionRecords]
      .reverse()
      .find((extension) => {
        const status = String(extension?.status || "")
          .trim()
          .toLowerCase();
        return status && !["approved", "rejected", "withdrawn"].includes(status);
      }) || extensionRecords[extensionRecords.length - 1] || null;
  const creatorStatus = currentExtension?.creatorApprovalStatus || "Pending";
  const checkerStatus = currentExtension?.checkerApprovalStatus || "Pending";
  const approvedApproverCount = (currentExtension?.approvers || []).filter(
    (approver) => approver?.approved || approver?.approvalStatus === "approved",
  ).length;
  const totalApproverCount = (currentExtension?.approvers || []).length;

  const extensionStatus = currentExtension?.status || selectedDeferral.extensionStatus || "Pending";
  const summaryItems = [
    {
      label: "Deferral Number",
      value: selectedDeferral.deferralNumber || "-",
    },
    {
      label: "DCL No",
      value: selectedDeferral.dclNumber || selectedDeferral.dclNo || "-",
    },
    {
      label: "Extension Status",
      value: extensionStatus,
      color: "#b45309",
    },
    {
      label: "Creator Status",
      value: creatorStatus || "Pending",
      color: SUCCESS_GREEN,
    },
    {
      label: "Checker Status",
      value: checkerStatus || "Pending",
      color: SUCCESS_GREEN,
    },
    {
      label: "Approvers Status",
      value:
        totalApproverCount > 0
          ? `${approvedApproverCount} of ${totalApproverCount} Approved`
          : "Pending",
      color: SUCCESS_GREEN,
    },
    {
      label: "Created At",
      value: selectedDeferral.createdAt
        ? dayjs(selectedDeferral.createdAt).format("DD MMM YYYY")
        : "-",
    },
    {
      label: "Customer",
      value: selectedDeferral.customerName || "-",
    },
  ];

  const wrapperProps = embedded
    ? {
        className: "creator-theme",
        style: { width: "100%", marginTop: 16 },
      }
    : null;

  const requestedDocsColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <Typography.Text strong style={{ color: PRIMARY_BLUE }}>
          {value || "-"}
        </Typography.Text>
      ),
    },
    {
      title: "Current Due Date",
      key: "currentDueDate",
      render: (_, doc) => {
        const currentDueDate = doc.nextDocumentDueDate
          ? dayjs(doc.nextDocumentDueDate)
          : selectedDeferral?.nextDocumentDueDate
            ? dayjs(selectedDeferral.nextDocumentDueDate)
            : null;

        return currentDueDate ? currentDueDate.format("DD MMM YYYY") : "-";
      },
    },
    {
      title: "Extension Days",
      key: "extensionDays",
      width: 180,
      render: (_, doc) => {
        const key = String((doc && (doc.name || doc.label)) || doc || "")
          .trim()
          .toLowerCase();
        const extensionDaysForDoc =
          typeof extensionDaysByDoc[key] !== "undefined"
            ? Number(extensionDaysByDoc[key])
            : 0;

        return (
          <InputNumber
            min={0}
            max={90}
            value={extensionDaysForDoc}
            onChange={(val) =>
              onDaysByDocChange({
                ...extensionDaysByDoc,
                [key]: typeof val === "number" ? val : 0,
              })
            }
            style={{ width: "100%" }}
            placeholder="Days (max 90)"
          />
        );
      },
    },
    {
      title: "New Due Date",
      key: "newDueDate",
      render: (_, doc) => {
        const key = String((doc && (doc.name || doc.label)) || doc || "")
          .trim()
          .toLowerCase();
        const extensionDaysForDoc =
          typeof extensionDaysByDoc[key] !== "undefined"
            ? Number(extensionDaysByDoc[key])
            : 0;
        const currentDueDate = doc.nextDocumentDueDate
          ? dayjs(doc.nextDocumentDueDate)
          : selectedDeferral?.nextDocumentDueDate
            ? dayjs(selectedDeferral.nextDocumentDueDate)
            : null;
        const newDueDate =
          extensionDaysForDoc > 0 && currentDueDate
            ? currentDueDate.add(extensionDaysForDoc, "day")
            : currentDueDate;

        return (
          <Typography.Text strong style={{ color: SUCCESS_GREEN }}>
            {newDueDate ? newDueDate.format("DD MMM YYYY") : "-"}
          </Typography.Text>
        );
      },
    },
  ];

  const renderCard = (title, subtitle, content, extra = null) => (
    <section className="extension-review-card">
      <div className="extension-review-card__header">
        <div>
          <div className="extension-review-card__title">{title}</div>
          {subtitle ? <div className="extension-review-card__subtitle">{subtitle}</div> : null}
        </div>
        {extra}
      </div>
      <div className="extension-review-card__body">{content}</div>
    </section>
  );

  const pageContent = extensionSubmissionSuccess ? (
    <div className="extension-review-success">
      <CheckCircleFilled className="extension-review-successicon" />
      <Typography.Text strong style={{ fontSize: 18 }}>
        Extension application submitted successfully
      </Typography.Text>
      <Typography.Text type="secondary">
        Open the extension applications tab to review the submitted request and track each approval stage.
      </Typography.Text>
    </div>
  ) : (
    <div className="extension-review-layout">
      <div className="extension-review-main">
        <div className="extension-review-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`extension-review-tab ${activeTab === tab.key ? "extension-review-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === "details" || activeTab === "request") &&
          renderCard(
            "Deferral Snapshot",
            "Core deferral information aligned in a single review matrix.",
            <div className="extension-review-summary-grid">
              {summaryItems.map((item) => (
                <div className="extension-review-summary-item" key={item.label}>
                  <div className="extension-review-summary-label">{item.label}</div>
                  <div className="extension-review-summary-value" style={item.color ? { color: item.color } : undefined}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>,
          )}

        {activeTab === "details" && currentExtension
          ? renderCard(
              "Extension Workflow",
              "Current approval progress for the latest extension request.",
              <ExtensionWorkflowProgress
                approvers={currentExtension?.approvers || []}
                approvals={currentExtension?.approvals || []}
                allApproversApproved={currentExtension?.allApproversApproved}
                creatorApprovalStatus={currentExtension?.creatorApprovalStatus}
                checkerApprovalStatus={currentExtension?.checkerApprovalStatus}
              />,
            )
          : null}

        {(activeTab === "request" || activeTab === "details") &&
          renderCard(
            "Extension Request Setup",
            "Add the overall extension comment, attach supporting context, and set the requested days per document below.",
            <div className="extension-review-formgrid">
              <div className="extension-review-field" style={{ gridColumn: "1 / -1" }}>
                <div className="extension-review-fieldlabel">Extension Comment</div>
                <Input.TextArea
                  rows={5}
                  value={extensionComment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="Provide reasons for the extension request and any reviewer guidance"
                />
                <div className="extension-review-fieldhint">
                  Keep this focused on the overall request. Document-specific day changes belong in the requested documents table.
                </div>
              </div>

              <div className="extension-review-field" style={{ gridColumn: "1 / -1" }}>
                <div className="extension-review-fieldlabel">Supporting Files</div>
                <div className="extension-review-uploadbox">
                  <Upload
                    fileList={extensionFiles}
                    beforeUpload={() => false}
                    onChange={({ fileList }) => onFilesChange(fileList)}
                    multiple
                  >
                    <Button icon={<UploadOutlined />}>Upload Supporting Files</Button>
                  </Upload>
                  <div className="extension-review-uploadsummary">
                    {extensionFiles.length > 0
                      ? `${extensionFiles.length} file${extensionFiles.length === 1 ? "" : "s"} attached to this request.`
                      : "No supporting files attached yet."}
                  </div>
                </div>
              </div>
            </div>,
          )}

        {(activeTab === "documents" || activeTab === "request") &&
          renderCard(
            `Requested Documents (${requestedDocs.length})`,
            "Each document can carry its own extension days and recalculated due date.",
            <div className="extension-review-table-shell">
              <Table
                dataSource={requestedDocs}
                columns={requestedDocsColumns}
                pagination={false}
                size="small"
                rowKey={(doc, index) => doc.id || doc._id || `${doc.name || "doc"}-${index}`}
                scroll={{ x: 760 }}
              />
            </div>,
          )}
      </div>
    </div>
  );

  const content = (
    <div className="extension-review-page" data-embedded={embedded ? "true" : "false"}>
      <style>{MODAL_STYLES}</style>
      <div className="extension-review-topbar">
        <div className="extension-review-topbar-main">
          <Button icon={<LeftOutlined />} className="extension-review-back" onClick={onClose}>
            Back
          </Button>
          <div>
            <h1 className="extension-review-title">Apply Extension</h1>
            <div className="extension-review-subtitle">
              DCL: {selectedDeferral.dclNumber || selectedDeferral.dclNo || "N/A"} · Deferral: {selectedDeferral.deferralNumber || "-"}
            </div>
          </div>
        </div>

        <div className="extension-review-topbar-actions">
          <Button className="extension-review-viewdocs" onClick={() => setActiveTab("request")}>
            <UnorderedListOutlined />
            View Requested Documents
            <span className="extension-review-viewdocs-count">{requestedDocs.length}</span>
          </Button>
        </div>
      </div>

      <div className="extension-review-actionbar">
        <div className="extension-review-actiontext">
          <div className="extension-review-actiontitle">Extension Request Workspace</div>
          <div className="extension-review-actionsubtitle">
            Align the summary, set extension days, and submit from the same review surface.
          </div>
        </div>

        <div className="extension-review-actionbuttons">
          {extensionSubmissionSuccess ? (
            <Button
              type="primary"
              onClick={onSuccessViewExtensions}
              style={{
                backgroundColor: PRIMARY_BLUE,
                borderColor: PRIMARY_BLUE,
                color: "#FFFFFF",
              }}
            >
              View Extension Applications
            </Button>
          ) : (
            <>
              <Button onClick={onClose} disabled={extensionSubmitting}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={extensionSubmitting}
                onClick={onSubmit}
                style={{
                  backgroundColor: PRIMARY_BLUE,
                  borderColor: PRIMARY_BLUE,
                  color: "#FFFFFF",
                }}
              >
                {extensionSubmitting ? "Submitting..." : "Submit Extension"}
              </Button>
            </>
          )}
        </div>
      </div>

      {pageContent}
    </div>
  );

  return embedded ? (
    <div {...wrapperProps}>{content}</div>
  ) : (
    <Modal
      title={null}
      open={open}
      zIndex={2000}
      onCancel={onClose}
      width={1120}
      styles={{
        body: { maxHeight: "84vh", overflowY: "auto", padding: 24, background: "#f5f7f4" },
      }}
      footer={null}
    >
      {content}
    </Modal>
  );
};

export default ExtensionApplicationModal;