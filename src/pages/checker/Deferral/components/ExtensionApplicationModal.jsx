import React, { useState } from "react";
import {
  Button,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Table,
  Typography,
  Upload,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import getFacilityColumns from "../../../../utils/facilityColumns";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";
import { PRIMARY_BLUE, SUCCESS_GREEN } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

const TABS = [
  { key: "details", label: "Extension Details" },
  { key: "documents", label: "Documents & Facilities" },
];

const REVIEW_STYLES = `
  .checker-extension-review {
    border-top: 1px solid rgba(214, 189, 152, 0.2);
    background: var(--color-bg);
  }

  .checker-extension-review__page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .checker-extension-review__topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .checker-extension-review__title-wrap {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .checker-extension-review__title-icon {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 54, 54, 0.08);
    color: var(--color-primary-dark);
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 700;
  }

  .checker-extension-review__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text-dark);
  }

  .checker-extension-review__subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-light);
  }

  .checker-extension-review__close {
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

  .checker-extension-review__banner,
  .checker-extension-review__section,
  .checker-extension-review__comments,
  .checker-extension-review__upload-shell,
  .checker-extension-review__success {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
  }

  .checker-extension-review__banner,
  .checker-extension-review__actionbar,
  .checker-extension-review__success {
    padding: 12px 14px;
  }

  .checker-extension-review__banner-title {
    color: ${PRIMARY_BLUE};
    font-weight: 700;
    font-size: 13px;
  }

  .checker-extension-review__banner-copy {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-medium);
  }

  .checker-extension-review__actionbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
  }

  .checker-extension-review__tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
    overflow-x: auto;
  }

  .checker-extension-review__tab {
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

  .checker-extension-review__tab--active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary-dark);
  }

  .checker-extension-review__details-layout {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
    gap: 16px;
    align-items: start;
  }

  .checker-extension-review__details-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .checker-extension-review__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }

  .checker-extension-review__section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-dark);
  }

  .checker-extension-review__section-body {
    padding: 16px;
  }

  .checker-extension-review__comments {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .checker-extension-review__table-shell {
    background: var(--color-white);
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .checker-extension-review__table-shell + .checker-extension-review__table-shell {
    margin-top: 16px;
  }

  .checker-extension-review__primary-btn.ant-btn {
    border: none !important;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
    color: var(--color-white) !important;
    border-color: transparent !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .checker-extension-review__secondary-btn.ant-btn {
    border: 1px solid var(--color-primary-soft) !important;
    background: transparent !important;
    color: var(--color-primary-medium) !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .checker-extension-review__primary-btn.ant-btn:disabled,
  .checker-extension-review__primary-btn.ant-btn[disabled],
  .checker-extension-review__secondary-btn.ant-btn:disabled,
  .checker-extension-review__secondary-btn.ant-btn[disabled] {
    background: #D1D5DB !important;
    border-color: #D1D5DB !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  .checker-extension-review__primary-btn.ant-btn:disabled span,
  .checker-extension-review__primary-btn.ant-btn[disabled] span,
  .checker-extension-review__secondary-btn.ant-btn:disabled span,
  .checker-extension-review__secondary-btn.ant-btn[disabled] span {
    color: #fff !important;
  }

  .checker-extension-review .ant-descriptions-item-label {
    font-weight: 700 !important;
    color: var(--color-text-light) !important;
    font-size: 11px !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .checker-extension-review .ant-descriptions-item-content {
    color: var(--color-text-dark) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
  }

  .checker-extension-review .ant-table,
  .checker-extension-review .ant-table-wrapper,
  .checker-extension-review .ant-spin-nested-loading,
  .checker-extension-review .ant-spin-container,
  .checker-extension-review .ant-table-container,
  .checker-extension-review .ant-table-content,
  .checker-extension-review table,
  .checker-extension-review thead,
  .checker-extension-review tbody,
  .checker-extension-review tr {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .checker-extension-review .ant-table-thead > tr > th {
    background: transparent !important;
    color: var(--color-text-medium) !important;
    font-size: 11px;
    font-weight: 600;
    padding: 12px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    text-transform: uppercase;
    border-right: none !important;
  }

  .checker-extension-review .ant-table-tbody > tr > td {
    padding: 14px 16px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
    border-right: none !important;
    color: var(--color-text-medium);
    font-size: 12px;
    vertical-align: top;
  }

  .checker-extension-review .ant-table-thead > tr > th::before,
  .checker-extension-review .ant-table-cell::before,
  .checker-extension-review .ant-table-cell::after {
    display: none !important;
  }

  .checker-extension-review__empty {
    padding: 24px;
  }

  .checker-extension-review__upload-shell {
    padding: 12px;
  }

  .checker-extension-review__upload-copy {
    margin-top: 8px;
    font-size: 12px;
    color: var(--color-text-light);
  }

  .checker-extension-review__success {
    text-align: center;
  }

  .checker-extension-review__success-icon {
    font-size: 42px;
    color: ${SUCCESS_GREEN};
    line-height: 1;
  }

  @media (max-width: 1023px) {
    .checker-extension-review__details-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 767px) {
    .checker-extension-review__topbar,
    .checker-extension-review__title-wrap,
    .checker-extension-review__actionbar {
      flex-direction: column;
      align-items: stretch;
    }

    .checker-extension-review__actionbar .ant-btn {
      width: 100%;
    }
  }
`;

const normalizeStatusLabel = (value, fallback = "Pending") =>
  String(value || fallback)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getApproverStatus = (approver) =>
  String(approver?.approvalStatus || approver?.ApprovalStatus || "pending")
    .trim()
    .toLowerCase();

const isApproverApproved = (approver) =>
  approver?.approved === true || getApproverStatus(approver) === "approved";

const getApproverName = (approver, index) =>
  approver?.user?.fullName ||
  approver?.user?.name ||
  approver?.userName ||
  approver?.name ||
  approver?.approverName ||
  approver?.email ||
  `Approver ${index + 1}`;

const buildUploadedFileRows = (fileList) =>
  (fileList || []).map((file, index) => ({
    key: file.uid || file.name || index,
    name: file.name || `Document ${index + 1}`,
    size: typeof file.size === "number" ? `${Math.round(file.size / 1024)} KB` : "-",
    status: normalizeStatusLabel(file.status || "selected", "Selected"),
  }));

const ExtensionApplicationModal = ({
  open = false,
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
  const facilities = selectedDeferral?.facilities || selectedDeferral?.Facilities || [];
  const approvalFlow = currentExtension?.approvers || [];
  const approvedApproverCount = approvalFlow.filter(isApproverApproved).length;
  const uploadedFileRows = buildUploadedFileRows(extensionFiles);

  const documentsToBeDeferred = requestedDocs.map((doc, index) => {
    const documentKey = String((doc && (doc.name || doc.label)) || doc || "")
      .trim()
      .toLowerCase();
    const requestedDays =
      typeof extensionDaysByDoc[documentKey] !== "undefined"
        ? Number(extensionDaysByDoc[documentKey]) || 0
        : Number(extensionDays) || 0;
    const currentDueDate = doc.nextDocumentDueDate
      ? dayjs(doc.nextDocumentDueDate)
      : selectedDeferral?.nextDocumentDueDate
        ? dayjs(selectedDeferral.nextDocumentDueDate)
        : null;
    const newDueDate =
      requestedDays > 0 && currentDueDate ? currentDueDate.add(requestedDays, "day") : currentDueDate;

    return {
      key: doc.id || doc._id || `${doc.name || "doc"}-${index}`,
      ...doc,
      documentKey,
      requestedDays,
      currentDueDate,
      newDueDate,
    };
  });

  if (!open || !selectedDeferral) {
    return null;
  }

  const documentColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {value || "Untitled document"}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (value, record) => value || record.documentType || "-",
    },
    {
      title: "Current Due Date",
      dataIndex: "currentDueDate",
      key: "currentDueDate",
      width: 150,
      render: (value) => (value ? value.format("DD MMM YYYY") : "-"),
    },
    {
      title: "Extension Days",
      dataIndex: "requestedDays",
      key: "requestedDays",
      width: 170,
      render: (value, record) => (
        <InputNumber
          min={0}
          max={90}
          value={value}
          onChange={(nextValue) =>
            onDaysByDocChange({
              ...extensionDaysByDoc,
              [record.documentKey]: typeof nextValue === "number" ? nextValue : 0,
            })
          }
          style={{ width: "100%" }}
          placeholder="Days (max 90)"
        />
      ),
    },
    {
      title: "New Due Date",
      dataIndex: "newDueDate",
      key: "newDueDate",
      width: 150,
      render: (value) => (
        <span style={{ fontWeight: 700, color: SUCCESS_GREEN }}>
          {value ? value.format("DD MMM YYYY") : "-"}
        </span>
      ),
    },
  ];

  const approvalColumns = [
    {
      title: "Approver",
      key: "approver",
      render: (_, record, index) => (
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {getApproverName(record, index)}
        </span>
      ),
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
      width: 180,
      render: (_, record) => (
        <span style={{ fontWeight: 700, color: isApproverApproved(record) ? SUCCESS_GREEN : PRIMARY_BLUE }}>
          {isApproverApproved(record) ? "Approved" : normalizeStatusLabel(record?.approvalStatus, "Pending")}
        </span>
      ),
    },
  ];

  const uploadColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
          {value}
        </span>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value) => (
        <span style={{ fontWeight: 700, color: PRIMARY_BLUE }}>
          {value}
        </span>
      ),
    },
  ];

  const detailsSubtitle = `${selectedDeferral.customerName || "Customer"} • ${selectedDeferral.deferralNumber || "No Deferral"}`;

  return (
    <>
      <style>{REVIEW_STYLES}</style>

      <div className="checker-extension-review creator-theme">
        <div className="checker-extension-review__page">
          <div className="checker-extension-review__topbar">
            <div className="checker-extension-review__title-wrap">
              <span className="checker-extension-review__title-icon">
                <CalendarOutlined />
              </span>
              <div>
                <h2 className="checker-extension-review__title">
                  Apply Extension: {selectedDeferral.deferralNumber || (selectedDeferral._id || selectedDeferral.id || "").slice(-6)}
                </h2>
                <div className="checker-extension-review__subtitle">{detailsSubtitle}</div>
              </div>
            </div>

            <Button
              className="checker-extension-review__close"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>

          <div className="checker-extension-review__banner">
            <div className="checker-extension-review__banner-title">
              {extensionSubmissionSuccess ? "Extension Application Submitted" : "Prepare Extension Application"}
            </div>
            <div className="checker-extension-review__banner-copy">
              {extensionSubmissionSuccess
                ? "The extension has been submitted. You can now open the extension list and track approvals."
                : "Review the deferral, assign extension days per document, and submit the application inline."}
            </div>
          </div>

          <div className="checker-extension-review__actionbar">
            <Button
              className="checker-extension-review__secondary-btn"
              onClick={onClose}
              disabled={extensionSubmitting}
            >
              Close
            </Button>
            {extensionSubmissionSuccess ? (
              <Button
                className="checker-extension-review__primary-btn"
                icon={<CheckCircleOutlined />}
                onClick={onSuccessViewExtensions}
              >
                View Extension Applications
              </Button>
            ) : (
              <Button
                className="checker-extension-review__primary-btn"
                onClick={onSubmit}
                loading={extensionSubmitting}
              >
                {extensionSubmitting ? "Submitting..." : "Submit Extension"}
              </Button>
            )}
          </div>

          {extensionSubmissionSuccess ? (
            <section className="checker-extension-review__success">
              <div className="checker-extension-review__success-icon">✓</div>
              <Typography.Title level={4} style={{ marginTop: 12, marginBottom: 8 }}>
                Extension application submitted successfully
              </Typography.Title>
              <Typography.Text type="secondary">
                Open the extension applications view to review the submitted request and its approval progress.
              </Typography.Text>
            </section>
          ) : (
            <>
              <div className="checker-extension-review__tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`checker-extension-review__tab ${activeTab === tab.key ? "checker-extension-review__tab--active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "details" ? (
                <div className="checker-extension-review__details-layout">
                  <div className="checker-extension-review__details-main">
                    <section className="checker-extension-review__section">
                      <div className="checker-extension-review__section-head">
                        <h3 className="checker-extension-review__section-title">Customer Information</h3>
                      </div>
                      <div className="checker-extension-review__section-body">
                        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                          <Descriptions.Item label="Customer Name">
                            {selectedDeferral.customerName || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Customer Number">
                            {selectedDeferral.customerNumber || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Type">
                            {selectedDeferral.loanType || "-"}
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    </section>

                    <section className="checker-extension-review__section">
                      <div className="checker-extension-review__section-head">
                        <h3 className="checker-extension-review__section-title">Extension Summary</h3>
                      </div>
                      <div className="checker-extension-review__section-body">
                        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                          <Descriptions.Item label="Deferral Number">
                            {selectedDeferral.deferralNumber || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="DCL No">
                            {selectedDeferral.dclNumber || selectedDeferral.dclNo || "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Extension Status">
                            {normalizeStatusLabel(currentExtension?.status || selectedDeferral.extensionStatus, "Pending")}
                          </Descriptions.Item>
                          <Descriptions.Item label="Creator Status">
                            {normalizeStatusLabel(currentExtension?.creatorApprovalStatus, "Pending")}
                          </Descriptions.Item>
                          <Descriptions.Item label="Checker Status">
                            {normalizeStatusLabel(currentExtension?.checkerApprovalStatus, "Pending")}
                          </Descriptions.Item>
                          <Descriptions.Item label="Approver Status">
                            {approvalFlow.length > 0
                              ? `${approvedApproverCount} of ${approvalFlow.length} Approved`
                              : "Pending"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Loan Amount">
                            {selectedDeferral.loanAmount
                              ? selectedDeferral.loanAmount > 75000000
                                ? "Above 75 million"
                                : "Below 75 million"
                              : "-"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Created At">
                            {selectedDeferral.createdAt
                              ? dayjs(selectedDeferral.createdAt).format("DD MMM YYYY")
                              : "-"}
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    </section>

                    <section className="checker-extension-review__section">
                      <div className="checker-extension-review__section-head">
                        <h3 className="checker-extension-review__section-title">Extension Configuration</h3>
                      </div>
                      <div className="checker-extension-review__section-body">
                        <Descriptions column={1}>
                          <Descriptions.Item label="Default Extension Days">
                            <div style={{ maxWidth: 280 }}>
                              <InputNumber
                                min={1}
                                max={90}
                                value={extensionDays || undefined}
                                onChange={onDaysChange}
                                placeholder="Apply default days to all documents"
                                style={{ width: "100%" }}
                              />
                            </div>
                          </Descriptions.Item>
                        </Descriptions>
                        <Typography.Text type="secondary">
                          Set a default number of days up to 90, then fine-tune any document row under the documents tab.
                        </Typography.Text>
                      </div>
                    </section>
                  </div>

                  <aside className="checker-extension-review__comments">
                    <div style={{ fontWeight: 700, color: "var(--color-text-dark)" }}>
                      Extension Comment
                    </div>
                    <Input.TextArea
                      rows={8}
                      value={extensionComment}
                      onChange={(event) => onCommentChange(event.target.value)}
                      placeholder="Provide reasons for the extension request..."
                    />
                    <Typography.Text type="secondary">
                      This comment will accompany the extension application through the approval flow.
                    </Typography.Text>
                  </aside>
                </div>
              ) : (
                <div className="checker-extension-review__details-main">
                  <section className="checker-extension-review__section">
                    <div className="checker-extension-review__section-head">
                      <h3 className="checker-extension-review__section-title">
                        Documents to be Deferred ({documentsToBeDeferred.length})
                      </h3>
                    </div>
                    <div className="checker-extension-review__section-body">
                      <div className="checker-extension-review__table-shell">
                        {documentsToBeDeferred.length > 0 ? (
                          <Table
                            dataSource={documentsToBeDeferred}
                            columns={documentColumns}
                            pagination={false}
                            rowKey="key"
                            scroll={{ x: 900 }}
                          />
                        ) : (
                          <Empty className="checker-extension-review__empty" description="No documents found" />
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="checker-extension-review__section">
                    <div className="checker-extension-review__section-head">
                      <h3 className="checker-extension-review__section-title">
                        Facility Details {facilities.length ? `(${facilities.length})` : ""}
                      </h3>
                    </div>
                    <div className="checker-extension-review__section-body">
                      <div className="checker-extension-review__table-shell">
                        {facilities.length > 0 ? (
                          <Table
                            dataSource={facilities}
                            columns={getFacilityColumns()}
                            pagination={false}
                            rowKey={(facility) => facility.facilityNumber || facility._id || facility.id}
                            scroll={{ x: 900 }}
                          />
                        ) : (
                          <Empty className="checker-extension-review__empty" description="No facilities information available" />
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="checker-extension-review__section">
                    <div className="checker-extension-review__section-head">
                      <h3 className="checker-extension-review__section-title">Approval Flow</h3>
                    </div>
                    <div className="checker-extension-review__section-body">
                      <div className="checker-extension-review__table-shell">
                        {approvalFlow.length > 0 ? (
                          <Table
                            dataSource={approvalFlow}
                            columns={approvalColumns}
                            pagination={false}
                            rowKey={(approver, index) => approver._id || approver.id || index}
                            scroll={{ x: 700 }}
                          />
                        ) : (
                          <Empty className="checker-extension-review__empty" description="Approval flow will appear after submission" />
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="checker-extension-review__section">
                    <div className="checker-extension-review__section-head">
                      <h3 className="checker-extension-review__section-title">Additional Documents</h3>
                    </div>
                    <div className="checker-extension-review__section-body">
                      <div className="checker-extension-review__upload-shell">
                        <Upload
                          fileList={extensionFiles}
                          beforeUpload={() => false}
                          onChange={({ fileList }) => onFilesChange(fileList)}
                          multiple
                        >
                          <Button icon={<UploadOutlined />}>Click to Upload Additional Documents</Button>
                        </Upload>
                        <div className="checker-extension-review__upload-copy">
                          You can attach supporting files for the extension request before submission.
                        </div>
                      </div>

                      <div className="checker-extension-review__table-shell" style={{ marginTop: 16 }}>
                        {uploadedFileRows.length > 0 ? (
                          <Table
                            dataSource={uploadedFileRows}
                            columns={uploadColumns}
                            pagination={false}
                            rowKey="key"
                            scroll={{ x: 700 }}
                          />
                        ) : (
                          <Empty className="checker-extension-review__empty" description="No additional documents selected" />
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ExtensionApplicationModal;