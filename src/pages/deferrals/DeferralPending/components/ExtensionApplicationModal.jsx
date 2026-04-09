import React from "react";
import {
  Modal,
  Button,
  Card,
  Descriptions,
  Form,
  InputNumber,
  Input,
  Table,
  Upload,
  Divider,
  Row,
  Col,
  Typography,
} from "antd";
import { CalendarOutlined, UploadOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PRIMARY_BLUE, SUCCESS_GREEN } from "../utils/constants";
import ExtensionWorkflowProgress from "../../../../components/common/ExtensionWorkflowProgress";
import { getDeferralDocumentBuckets } from "../../../../utils/deferralDocuments";

const MODAL_STYLES = `
  .extension-review-summary .ant-descriptions-view {
    border: 1px solid rgba(214, 189, 152, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .extension-review-summary .ant-descriptions-row > th,
  .extension-review-summary .ant-descriptions-row > td {
    border-bottom: 1px solid rgba(214, 189, 152, 0.14);
  }

  .extension-review-summary .ant-descriptions-row:last-child > th,
  .extension-review-summary .ant-descriptions-row:last-child > td {
    border-bottom: none;
  }

  .extension-review-summary .ant-descriptions-item-label {
    background: var(--color-bg, #f5f7f4);
    min-width: 140px;
    padding: 12px 14px !important;
  }

  .extension-review-summary .ant-descriptions-item-content {
    padding: 12px 14px !important;
    background: #fff;
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

  const wrapperProps = embedded
    ? {
        className: "creator-theme",
        style: { width: "100%", marginTop: 16 },
      }
    : null;

  const containerStyle = embedded
    ? {
        width: "100%",
        border: "1px solid rgba(214, 189, 152, 0.2)",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(26, 54, 54, 0.06)",
        background: "#fff",
      }
    : undefined;

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
            max={365}
            value={extensionDaysForDoc}
            onChange={(val) =>
              onDaysByDocChange({
                ...extensionDaysByDoc,
                [key]: typeof val === "number" ? val : 0,
              })
            }
            style={{ width: "100%" }}
            placeholder="Days"
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

  const content = (
    <div style={containerStyle}>
      <style>{MODAL_STYLES}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px",
          background: embedded ? "#f5f7f4" : "#fff",
          borderBottom: "1px solid rgba(214, 189, 152, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarOutlined style={{ color: PRIMARY_BLUE }} />
          <div>
            <div style={{ color: PRIMARY_BLUE, fontWeight: 700, fontSize: 16 }}>
              Apply Extension
            </div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              Review deferral details and submit an extension request in-place.
            </div>
          </div>
        </div>
        <Button onClick={onClose}>Close</Button>
      </div>

      <div style={{ padding: 20 }}>
        {extensionSubmissionSuccess ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div
              style={{ fontSize: 48, marginBottom: 16, color: PRIMARY_BLUE }}
            >
              ✓
            </div>
            <Typography.Text strong style={{ fontSize: 18 }}>
              Extension application submitted successfully!
            </Typography.Text>
            <div style={{ marginTop: 16, color: "#999" }}>
              Click "View Extension Applications" below to see your submission
              and track its approval status.
            </div>
          </div>
        ) : (
          selectedDeferral && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <Card
                size="small"
                title={
                  <span style={{ color: PRIMARY_BLUE }}>
                    Deferral Details
                  </span>
                }
                style={{ borderTop: `3px solid ${PRIMARY_BLUE}` }}
              >
                <Descriptions className="extension-review-summary" size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
                  <Descriptions.Item label="Deferral Number">
                    <Typography.Text strong>{selectedDeferral.deferralNumber}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="DCL No">
                    <Typography.Text strong>{selectedDeferral.dclNumber || selectedDeferral.dclNo || "-"}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Extension Status">
                    <Typography.Text strong style={{ color: "#b45309" }}>
                      {currentExtension?.status || selectedDeferral.extensionStatus || "Pending"}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Creator Status">
                    <Typography.Text strong style={{ color: SUCCESS_GREEN }}>
                      {creatorStatus ? 
                        (creatorStatus === "Approved" || creatorStatus === "approved" ? "Approved" : creatorStatus)
                        : "Pending"
                      }
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Checker Status">
                    <Typography.Text strong style={{ color: SUCCESS_GREEN }}>
                      {checkerStatus ?
                        (checkerStatus === "Approved" || checkerStatus === "approved" ? "Approved" : checkerStatus)
                        : "Pending"
                      }
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Approvers Status">
                    <Typography.Text strong style={{ color: SUCCESS_GREEN }}>
                      {totalApproverCount > 0
                        ? `${approvedApproverCount} of ${totalApproverCount} Approved`
                        : "Pending"}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Loan Amount">
                    <Typography.Text strong>
                      {selectedDeferral.loanAmount ? (
                        selectedDeferral.loanAmount > 75000000 ? "Above 75 million" : "Below 75 million"
                      ) : "-"}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    <Typography.Text strong>
                      {selectedDeferral.createdAt ? dayjs(selectedDeferral.createdAt).format("DD MMM YYYY") : "-"}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Customer">
                    <Typography.Text strong>{selectedDeferral.customerName}</Typography.Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {currentExtension && (
                <Card
                  size="small"
                  title={
                    <span style={{ color: PRIMARY_BLUE }}>
                      Extension Workflow
                    </span>
                  }
                >
                  <ExtensionWorkflowProgress
                    approvers={currentExtension?.approvers || []}
                    approvals={currentExtension?.approvals || []}
                    allApproversApproved={currentExtension?.allApproversApproved}
                    creatorApprovalStatus={currentExtension?.creatorApprovalStatus}
                    checkerApprovalStatus={currentExtension?.checkerApprovalStatus}
                  />
                </Card>
              )}

              <Card
                size="small"
                title={
                  <span style={{ color: PRIMARY_BLUE }}>
                    Extension Details
                  </span>
                }
              >
                <Form layout="vertical">
                  <Form.Item label="Default Extension Days (optional)">
                    <InputNumber
                      min={1}
                      max={365}
                      value={extensionDays || undefined}
                      onChange={onDaysChange}
                      placeholder="Enter number of days and apply to all"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  <Form.Item label="Per-document Extension Days">
                    <Typography.Text type="secondary">
                      Adjust days per document if needed. New due dates will
                      update automatically.
                    </Typography.Text>
                  </Form.Item>
                </Form>
              </Card>

              <Card
                size="small"
                title={
                  <span style={{ color: PRIMARY_BLUE }}>
                    Documents to be Deferred ({requestedDocs.length})
                  </span>
                }
              >
                <div className="extension-review-table-shell">
                  <Table
                    dataSource={requestedDocs}
                    columns={requestedDocsColumns}
                    pagination={false}
                    size="small"
                    rowKey={(doc, index) => doc.id || doc._id || `${doc.name || "doc"}-${index}`}
                    scroll={{ x: 760 }}
                  />
                </div>
              </Card>

              <Card
                size="small"
                title={
                  <span style={{ color: PRIMARY_BLUE }}>
                    Extension Comment
                  </span>
                }
              >
                <Input.TextArea
                  rows={4}
                  value={extensionComment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="Provide reasons for the extension request..."
                />
              </Card>

              <Card
                size="small"
                title={
                  <span style={{ color: PRIMARY_BLUE }}>
                    Upload Additional Documents
                  </span>
                }
              >
                <Upload
                  fileList={extensionFiles}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => onFilesChange(fileList)}
                  multiple
                >
                  <Button icon={<UploadOutlined />}>
                    Click to Upload Additional Documents
                  </Button>
                </Upload>
                <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                  You can upload additional supporting documents for this
                  extension request
                </div>
              </Card>
            </div>
          )
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: "16px 20px",
          borderTop: "1px solid rgba(214, 189, 152, 0.2)",
          background: "#fafafa",
        }}
      >
        {extensionSubmissionSuccess ? (
          <Button
            key="view"
            type="primary"
            onClick={onSuccessViewExtensions}
            style={{
              backgroundColor: PRIMARY_BLUE,
              borderColor: PRIMARY_BLUE,
              color: "#FFFFFF !important",
            }}
          >
            View Extension Applications
          </Button>
        ) : (
          <>
            <Button key="cancel" onClick={onClose} disabled={extensionSubmitting}>
              Cancel
            </Button>
            <Button
              key="submit"
              type="primary"
              loading={extensionSubmitting}
              onClick={onSubmit}
              style={{
                backgroundColor: PRIMARY_BLUE,
                borderColor: PRIMARY_BLUE,
                color: "#FFFFFF !important",
              }}
            >
              {extensionSubmitting ? "Submitting..." : "Submit Extension"}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    embedded ? (
      <div {...wrapperProps}>{content}</div>
    ) : (
      <Modal
        title={null}
        open={open}
        zIndex={2000}
        onCancel={onClose}
        width={900}
        styles={{
          body: { maxHeight: "80vh", overflowY: "auto", padding: 0 },
        }}
        footer={null}
      >
        {content}
      </Modal>
    )
  );
};

export default ExtensionApplicationModal;
