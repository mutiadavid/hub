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

const TABS = [
  { key: "details", label: "Extension Details" },
  { key: "documents", label: "Documents & Facilities" },
];

const reviewShellClassName =
  "border-t border-[rgba(214,189,152)] bg-(--color-bg) [&_.ant-descriptions-item-label]:text-[11px] [&_.ant-descriptions-item-label]:font-semibold [&_.ant-descriptions-item-label]:uppercase [&_.ant-descriptions-item-label]:tracking-[0.04em] [&_.ant-descriptions-item-label]:text-(--color-text-light) [&_.ant-descriptions-item-content]:text-[13px] [&_.ant-descriptions-item-content]:font-semibold [&_.ant-descriptions-item-content]:text-(--color-text-dark) [&_.ant-input]:rounded-[10px] [&_.ant-input]:border-[rgba(214,189,152,0.22)] [&_.ant-input]:shadow-none [&_.ant-input-number]:rounded-[10px] [&_.ant-input-number]:border-[rgba(214,189,152,0.22)] [&_.ant-input-number]:shadow-none [&_.ant-upload-wrapper]:w-full [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-header]:border-b-0 [&_.ant-table-header]:shadow-none [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:border-none [&_.ant-table-content]:bg-transparent [&_table]:border-none [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_tr]:border-none [&_.ant-table-thead>tr]:border-b-0 [&_.ant-table-thead>tr>th]:!border-b-0 [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-thead>tr>th]:bg-[#fbfaf6] [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.04em] [&_.ant-table-thead>tr>th]:text-(--color-text-medium) [&_.ant-table-tbody>tr:first-child>td]:!border-t-0 [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr:last-child>td]:border-b-0 [&_.ant-table-row:hover>td]:bg-[#fcfbf8] [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";
const pageClassName = "flex flex-col gap-4 p-4";
const topbarClassName = "flex flex-wrap items-start justify-between gap-3 max-md:flex-col max-md:items-stretch";
const titleWrapClassName = "flex items-start gap-3 max-md:flex-col max-md:items-stretch";
const titleIconClassName = "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(26,54,54,0.08)] text-(--color-primary-dark) text-base font-bold";
const closeButtonClassName = "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(214,189,152,0.2)] bg-white text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.2)] hover:bg-white hover:text-(--color-text-dark)";
const shellCardClassName = "rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const sectionClassName = "rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const sectionHeadClassName = "flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5";
const sectionTitleClassName = "m-0 text-[13px] font-semibold text-(--color-text-dark)";
const sectionBodyClassName = "p-4";
const detailsLayoutClassName = "grid items-start gap-4 min-[1024px]:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]";
const detailsMainClassName = "flex min-w-0 flex-col gap-4";
const commentsClassName = "flex flex-col gap-2.5 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white p-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const tableShellClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white";
const actionBarClassName = "flex flex-wrap items-center justify-end gap-2 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)] max-sm:flex-col max-sm:items-stretch";
const primaryButtonClassName = "rounded-lg! border-0! bg-(--ncb-primary-500)! text-white! shadow-none! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-[#6b7280]! [&>span]:text-white! disabled:[&>span]:text-[#6b7280]! max-sm:w-full";
const secondaryButtonClassName = "rounded-lg! border-(--color-primary-soft)! bg-transparent! text-(--color-primary-medium)! shadow-none! hover:border-(--color-primary-soft)! hover:bg-[rgba(214,189,152,0.1)]! hover:text-(--color-primary-dark)! focus:border-(--color-primary-soft)! focus:bg-[rgba(214,189,152,0.1)]! focus:text-(--color-primary-dark)! active:border-(--color-primary-soft)! active:bg-[rgba(214,189,152,0.1)]! active:text-(--color-primary-dark)! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-[#6b7280]! disabled:[&>span]:text-[#6b7280]! max-sm:w-full";
const successPanelClassName = "rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-3 text-center shadow-[0_1px_2px_rgba(26,54,54,0.06)]";

const getStatusToneClassName = (approved) =>
  approved ? "text-[var(--color-status-success)]" : "text-(--color-primary-dark)";

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
        <span className="font-bold text-(--color-text-dark)">
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
          className="w-full"
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
        <span className="font-bold text-(--color-status-success)">
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
        <span className="font-bold text-(--color-text-dark)">
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
        <span className={`font-bold ${getStatusToneClassName(isApproverApproved(record))}`}>
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
        <span className="font-bold text-(--color-text-dark)">
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
        <span className="font-bold text-(--color-primary-dark)">
          {value}
        </span>
      ),
    },
  ];

  const detailsSubtitle = `${selectedDeferral.customerName || "Customer"} • ${selectedDeferral.deferralNumber || "No Deferral"}`;

  return (
    <div className={reviewShellClassName}>
      <div className={pageClassName}>
          <div className={topbarClassName}>
            <div className={titleWrapClassName}>
              <span className={titleIconClassName}>
                <CalendarOutlined />
              </span>
              <div>
                <h2 className="m-0 text-base font-semibold tracking-[-0.02em] text-(--color-text-dark)">
                  Apply Extension: {selectedDeferral.deferralNumber || (selectedDeferral._id || selectedDeferral.id || "").slice(-6)}
                </h2>
                <div className="mt-1 text-xs text-(--color-text-light)">{detailsSubtitle}</div>
              </div>
            </div>

            <Button
              className={closeButtonClassName}
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>

          <div className={`${shellCardClassName} px-3.5 py-3`}>
            <div className="text-[13px] font-bold text-(--color-primary-dark)">
              {extensionSubmissionSuccess ? "Extension Application Submitted" : "Prepare Extension Application"}
            </div>
            <div className="mt-1 text-xs text-(--color-text-medium)">
              {extensionSubmissionSuccess
                ? "The extension has been submitted. You can now open the extension list and track approvals."
                : "Review the deferral, assign extension days per document, and submit the application inline."}
            </div>
          </div>

          <div className={actionBarClassName}>
            <Button
              className={secondaryButtonClassName}
              onClick={onClose}
              disabled={extensionSubmitting}
            >
              Close
            </Button>
            {extensionSubmissionSuccess ? (
              <Button
                className={primaryButtonClassName}
                icon={<CheckCircleOutlined />}
                onClick={onSuccessViewExtensions}
              >
                View Extension Applications
              </Button>
            ) : (
              <Button
                className={primaryButtonClassName}
                onClick={onSubmit}
                loading={extensionSubmitting}
              >
                {extensionSubmitting ? "Submitting..." : "Submit Extension"}
              </Button>
            )}
          </div>

          {extensionSubmissionSuccess ? (
            <section className={successPanelClassName}>
              <div className="text-[42px] leading-none text-(--color-status-success)">✓</div>
              <Typography.Title level={4} className="mt-3! mb-2!">
                Extension application submitted successfully
              </Typography.Title>
              <Typography.Text type="secondary">
                Open the extension applications view to review the submitted request and its approval progress.
              </Typography.Text>
            </section>
          ) : (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-[rgba(214,189,152,0.2)]">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`whitespace-nowrap border-b-2 bg-transparent px-3 py-2.5 text-xs font-medium ${activeTab === tab.key ? "border-(--color-primary-dark) text-(--color-primary-dark)" : "border-transparent text-(--color-text-light)"}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "details" ? (
                <div className={detailsLayoutClassName}>
                  <div className={detailsMainClassName}>
                    <section className={sectionClassName}>
                      <div className={sectionHeadClassName}>
                        <h3 className={sectionTitleClassName}>Customer Information</h3>
                      </div>
                      <div className={sectionBodyClassName}>
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

                    <section className={sectionClassName}>
                      <div className={sectionHeadClassName}>
                        <h3 className={sectionTitleClassName}>Extension Summary</h3>
                      </div>
                      <div className={sectionBodyClassName}>
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

                    <section className={sectionClassName}>
                      <div className={sectionHeadClassName}>
                        <h3 className={sectionTitleClassName}>Extension Configuration</h3>
                      </div>
                      <div className={sectionBodyClassName}>
                        <Descriptions column={1}>
                          <Descriptions.Item label="Default Extension Days">
                            <div className="max-w-[280px]">
                              <InputNumber
                                min={1}
                                max={90}
                                value={extensionDays || undefined}
                                onChange={onDaysChange}
                                placeholder="Apply default days to all documents"
                                className="w-full"
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

                  <aside className={commentsClassName}>
                    <div className="font-bold text-(--color-text-dark)">
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
                <div className={detailsMainClassName}>
                  <section className={sectionClassName}>
                    <div className={sectionHeadClassName}>
                      <h3 className={sectionTitleClassName}>
                        Documents to be Deferred ({documentsToBeDeferred.length})
                      </h3>
                    </div>
                    <div className={sectionBodyClassName}>
                      <div className={tableShellClassName}>
                        {documentsToBeDeferred.length > 0 ? (
                          <Table
                            dataSource={documentsToBeDeferred}
                            columns={documentColumns}
                            pagination={false}
                            rowKey="key"
                            scroll={{ x: 900 }}
                          />
                        ) : (
                          <Empty className="p-6" description="No documents found" />
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <div className={sectionHeadClassName}>
                      <h3 className={sectionTitleClassName}>
                        Facility Details {facilities.length ? `(${facilities.length})` : ""}
                      </h3>
                    </div>
                    <div className={sectionBodyClassName}>
                      <div className={tableShellClassName}>
                        {facilities.length > 0 ? (
                          <Table
                            dataSource={facilities}
                            columns={getFacilityColumns()}
                            pagination={false}
                            rowKey={(facility) => facility.facilityNumber || facility._id || facility.id}
                            scroll={{ x: 900 }}
                          />
                        ) : (
                          <Empty className="p-6" description="No facilities information available" />
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <div className={sectionHeadClassName}>
                      <h3 className={sectionTitleClassName}>Approval Flow</h3>
                    </div>
                    <div className={sectionBodyClassName}>
                      <div className={tableShellClassName}>
                        {approvalFlow.length > 0 ? (
                          <Table
                            dataSource={approvalFlow}
                            columns={approvalColumns}
                            pagination={false}
                            rowKey={(approver, index) => approver._id || approver.id || index}
                            scroll={{ x: 700 }}
                          />
                        ) : (
                          <Empty className="p-6" description="Approval flow will appear after submission" />
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={sectionClassName}>
                    <div className={sectionHeadClassName}>
                      <h3 className={sectionTitleClassName}>Additional Documents</h3>
                    </div>
                    <div className={sectionBodyClassName}>
                      <div className={`${shellCardClassName} p-3`}>
                        <Upload
                          fileList={extensionFiles}
                          beforeUpload={() => false}
                          onChange={({ fileList }) => onFilesChange(fileList)}
                          multiple
                        >
                          <Button icon={<UploadOutlined />}>Click to Upload Additional Documents</Button>
                        </Upload>
                        <div className="mt-2 text-xs text-(--color-text-light)">
                          You can attach supporting files for the extension request before submission.
                        </div>
                      </div>

                      <div className={`mt-4 ${tableShellClassName}`}>
                        {uploadedFileRows.length > 0 ? (
                          <Table
                            dataSource={uploadedFileRows}
                            columns={uploadColumns}
                            pagination={false}
                            rowKey="key"
                            scroll={{ x: 700 }}
                          />
                        ) : (
                          <Empty className="p-6" description="No additional documents selected" />
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
  );
};

export default ExtensionApplicationModal;