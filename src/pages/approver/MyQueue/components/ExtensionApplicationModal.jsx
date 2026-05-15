import React, { useState } from "react";
import {
  Button,
  Descriptions,
  Empty,
  Input,
  Modal,
  Table,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getDeferralDocumentBuckets,
  resolveDocumentDaysAndDateWithExtension,
} from "../../../../utils/deferralDocuments";
import { getLivePartyApprovalStatuses } from "../../../../utils/deferralApprovalStatus";
import {
  buildExtensionCommentEntries,
  resolveDisplayName,
} from "../../../../utils/extensionHistory";
import { downloadFile, openFileInNewTab } from "../../../../utils/fileUtils";
import { PRIMARY_BLUE, SUCCESS_GREEN, ERROR_RED } from "../utils/constants";
import CommentTrail from "./CommentTrail";
import DeferralDecisionModal from "../../../../components/deferrals/DeferralDecisionModal";

 

const TABS = [
  { key: "details", label: "Extension Details" },
  { key: "documents", label: "Documents & Flow" },
];

const reviewShellClassName = "border-t border-[rgba(214,189,152,0.2)] bg-(--color-bg) [&_.ant-descriptions-item-label]:text-[11px] [&_.ant-descriptions-item-label]:font-normal [&_.ant-descriptions-item-label]:uppercase [&_.ant-descriptions-item-label]:tracking-[0.04em] [&_.ant-descriptions-item-label]:text-(--color-text-dark) [&_.ant-descriptions-item-content]:text-[13px] [&_.ant-descriptions-item-content]:font-normal [&_.ant-descriptions-item-content]:text-(--color-text-dark) [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:border-none [&_.ant-table-content]:bg-transparent [&_table]:border-none [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_tr]:border-none [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-thead>tr>th]:bg-transparent [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-normal [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-thead>tr>th::before]:hidden [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden max-[1023px]:[&_.extension-details-layout]:grid-cols-1 max-md:[&_.ant-descriptions-view]:block max-md:[&_.ant-descriptions-view_table]:block max-md:[&_.ant-descriptions-view_tbody]:block max-md:[&_.ant-descriptions-row]:block max-md:[&_.ant-descriptions-item]:block max-md:[&_.ant-descriptions-item]:w-full max-md:[&_.ant-descriptions-item-label]:block max-md:[&_.ant-descriptions-item-content]:block";

const tableShellClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white";

const primaryButtonClassName = "rounded-lg! border-0! bg-(--ncb-primary-500)! text-white! shadow-none! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-white! [&>span]:text-white!";

const secondaryButtonClassName = "rounded-lg! border-(--color-primary-soft)! bg-transparent! text-(--color-primary-medium)! shadow-none! hover:border-(--color-primary-soft)! hover:bg-[rgba(214,189,152,0.1)]! hover:text-(--color-primary-dark)! focus:border-(--color-primary-soft)! focus:bg-[rgba(214,189,152,0.1)]! focus:text-(--color-primary-dark)! active:border-(--color-primary-soft)! active:bg-[rgba(214,189,152,0.1)]! active:text-(--color-primary-dark)! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-white! disabled:[&>span]:text-white!";


const getNormalizedApprovalStatus = (approver) =>
  String(
    approver?.approvalStatus || approver?.ApprovalStatus || approver?.status || "pending",
  )
    .trim()
    .toLowerCase();

const isApproverApproved = (approver) =>
  approver?.approved === true || getNormalizedApprovalStatus(approver) === "approved";

const getApproverDisplayName = (approver, index) =>
  resolveDisplayName(
    approver?.user?.name,
    approver?.user?.fullName,
    approver?.userName,
    approver?.name,
    approver?.approverName,
    approver?.email,
    `Approver ${index + 1}`,
  );

const buildAdditionalDocuments = (uploadedDocs, extensionFiles) => {
  const combined = [...(uploadedDocs || []), ...(extensionFiles || [])];
  const seen = new Set();

  return combined.filter((doc) => {
    const key = `${doc?.id || doc?._id || ""}|${doc?.name || doc?.originalName || ""}|${doc?.url || doc?.fileUrl || ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getExtensionLabel = (extension) => {
  const explicitNumber = extension?.extensionNumber || extension?.ExtensionNumber;
  if (explicitNumber) {
    return explicitNumber;
  }

  const deferralNumber = extension?.deferralNumber || extension?.DeferralNumber || "";
  if (!deferralNumber) {
    return "";
  }

  if (/^DEF-/i.test(deferralNumber)) {
    return deferralNumber.replace(/^DEF-/i, "EXT-");
  }

  return /^EXT-/i.test(deferralNumber) ? deferralNumber : `EXT-${deferralNumber}`;
};

const renderStatusLabel = (status) =>
  String(status || "pending")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const ExtensionApplicationModal = ({
  selectedExtension,
  open = false,
  onClose,
  onApprove,
  onReject,
  onReturnForRework,
  approveLoading = false,
  rejectLoading = false,
  reworkLoading = false,
  showActions = true,
  approveText = "Approve",
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reworkModalVisible, setReworkModalVisible] = useState(false);
  const [reworkReason, setReworkReason] = useState("");

  const currentExtension = selectedExtension || null;

  if (!open || !currentExtension) {
    return null;
  }

  const extensionLabel = getExtensionLabel(currentExtension);
  const linkedDeferral = currentExtension.deferral || currentExtension.linkedDeferral || {};
  const livePartyStatuses = getLivePartyApprovalStatuses(currentExtension);
  const { requestedDocs = [] } = getDeferralDocumentBuckets(currentExtension);
  const { dclDocs = [], uploadedDocs = [] } = getDeferralDocumentBuckets(linkedDeferral);
  const approvalFlow = currentExtension.approvers || [];
  const documentsToBeDeferred = requestedDocs.map((doc) => {
    const { days, nextDate } = resolveDocumentDaysAndDateWithExtension(
      doc,
      linkedDeferral,
      currentExtension,
    );

    return {
      ...doc,
      requestedDays: days,
      newDueDate: nextDate,
    };
  });
  const additionalDocuments = buildAdditionalDocuments(
    uploadedDocs,
    currentExtension.additionalFiles,
  );
  const extensionComments = buildExtensionCommentEntries(currentExtension);

  const approvalFlowWithCurrent = approvalFlow.map((approver, index) => {
    const approved = isApproverApproved(approver);
    const previousApprovalsComplete = approvalFlow.slice(0, index).every(isApproverApproved);

    return {
      ...approver,
      current: !approved && previousApprovalsComplete,
    };
  });


  const handleReject = () => {
    if (!rejectReason.trim()) {
      message.error("Please provide a rejection reason");
      return;
    }

    onReject?.(rejectReason);
    setRejectReason("");
    setRejectModalVisible(false);
  };

  const handleApprove = () => {
    onApprove?.(approveComment);
    setApproveComment("");
    setApproveModalVisible(false);
  };

  const handleReturnForRework = () => {
    if (!reworkReason.trim()) {
      message.error("Please provide rework instructions");
      return;
    }

    onReturnForRework?.(reworkReason);
    setReworkReason("");
    setReworkModalVisible(false);
  };

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
      render: (value, record) => (
        <span className="font-bold text-(--color-text-dark)">
          {value || record.originalName || "Document"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
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
            onClick={() =>
              downloadFile(record.fileUrl || record.url, record.name || record.originalName || "document")
            }
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
      render: (_, record, index) => (
        <span className="font-normal text-(--color-text-dark)">
          {getApproverDisplayName(record, index)}
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
      render: (_, record) => {
        const approved = isApproverApproved(record);
        const reviewState = String(record.approvalStatus || "pending").trim().toLowerCase();
        const returnedForRework = reviewState === "returnedforrework" || reviewState === "returned_for_rework";
        const rejected = reviewState === "rejected";
        return (
          <span className="font-normal text-(--color-text-dark)">
            {approved
              ? "Approved"
              : returnedForRework
                ? "Returned for Rework"
                : rejected
                  ? "Rejected"
                  : record.current
                    ? "Current Reviewer"
                    : "Pending Approval"}
          </span>
        );
      },
    },
  ];

  const detailsSubtitle = `${currentExtension.customerName || linkedDeferral.customerName || "Customer"} • ${currentExtension.deferralNumber || linkedDeferral.deferralNumber || "No Deferral"}`;


  return (
    <>
      <div className={reviewShellClassName}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 max-md:flex-col max-md:items-stretch">
            <div className="flex items-start gap-3 max-md:flex-col max-md:items-stretch">
              <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(26,54,54,0.08)] text-(--color-primary-dark)">
                <CalendarOutlined />
              </span>
              <div>
                <h2 className="m-0 text-base font-bold tracking-[-0.02em] text-(--color-text-dark)">
                  Extension Request: {extensionLabel || "-"}
                </h2>
                <div className="mt-1 text-xs text-(--color-text-light)">{detailsSubtitle}</div>
              </div>
            </div>

            <Button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(214,189,152,0.2)] bg-white text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.2)] hover:bg-white hover:text-(--color-text-dark)"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>

          <div className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
            <div className="text-[13px] font-bold text-(--ncb-primary-500)">Under Review by Approvers</div>
            <div className="mt-1 text-xs text-(--color-text-medium)">
              This extension request is currently undergoing approval from the designated approvers.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)] max-md:flex-col max-md:items-stretch">
            <Button
              className={secondaryButtonClassName}
              onClick={onClose}
              disabled={approveLoading || rejectLoading || reworkLoading}
            >
              Close
            </Button>
            {showActions ? (
              <>
                <Button
                  className={primaryButtonClassName}
                  icon={<RedoOutlined />}
                  onClick={() => setReworkModalVisible(true)}
                  loading={reworkLoading}
                >
                  Return for Rework
                </Button>
                <Button
                  className={primaryButtonClassName}
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  loading={rejectLoading}
                >
                  Reject
                </Button>
                <Button
                  className={primaryButtonClassName}
                  icon={<CheckOutlined />}
                  onClick={() => setApproveModalVisible(true)}
                  loading={approveLoading}
                >
                  {approveText || "Approve"}
                </Button>
              </>
            ) : null}
          </div>

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
            <div className="extension-details-layout grid items-start gap-4 min-[1024px]:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
              <div className="flex min-w-0 flex-col gap-4">
                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Customer Information</h3>
                  </div>
                  <div className="p-4">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Customer Name">
                        {currentExtension.customerName || linkedDeferral.customerName || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Customer Number">
                        {currentExtension.customerNumber || linkedDeferral.customerNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loan Type">{linkedDeferral.loanType || "-"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Extension Summary</h3>
                  </div>
                  <div className="p-4">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Deferral Number">
                        {currentExtension.deferralNumber || linkedDeferral.deferralNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="DCL No">
                        {linkedDeferral.dclNumber || linkedDeferral.dclNo || currentExtension.dclNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        {renderStatusLabel(currentExtension.status)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Creator Status">{livePartyStatuses.creatorLabel}</Descriptions.Item>
                      <Descriptions.Item label="Checker Status">{livePartyStatuses.checkerLabel}</Descriptions.Item>
                      <Descriptions.Item label="Approver Status">
                        {`${approvalFlowWithCurrent.filter(isApproverApproved).length} of ${approvalFlowWithCurrent.length} Approved`}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loan Amount">
                        {linkedDeferral.loanAmountCategory || "Below 75 million"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {currentExtension.createdAt ? dayjs(currentExtension.createdAt).format("DD MMM YYYY") : "-"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Extension Reason</h3>
                  </div>
                  <div className="p-4">
                    <Typography.Paragraph
                      className="mb-0 whitespace-pre-wrap text-(--color-text-medium)"
                    >
                      {currentExtension.extensionReason || currentExtension.reason || "-"}
                    </Typography.Paragraph>
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-2 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white p-2.5 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                <div className="creator-caption">Comments</div>
                <CommentTrail history={extensionComments} isLoading={false} />
              </aside>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Documents To Be Deferred</h3>
                </div>
                {documentsToBeDeferred.length > 0 ? (
                  <Table
                    columns={documentColumns}
                    dataSource={documentsToBeDeferred}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `${record.name}-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No deferred documents" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Facility Details</h3>
                </div>
                {linkedDeferral.facilities?.length > 0 ? (
                  <Table
                    dataSource={linkedDeferral.facilities}
                    columns={getFacilityColumns()}
                    pagination={false}
                    rowKey={(record, index) => record.facilityNumber || record._id || `facility-${index}`}
                    scroll={{ x: 720 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No facilities available" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Mandatory DCL Upload</h3>
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
                  <div className="p-6"><Empty description="No DCL document uploaded" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Additional Documents</h3>
                </div>
                {additionalDocuments.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={additionalDocuments}
                    pagination={false}
                    rowKey={(record, index) => record.id || record._id || `${record.name || record.originalName || "uploaded"}-${index}`}
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No additional documents" /></div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Approval Flow</h3>
                </div>
                {approvalFlowWithCurrent.length > 0 ? (
                  <Table
                    columns={approvalColumns}
                    dataSource={approvalFlowWithCurrent}
                    pagination={false}
                    rowKey={(record, index) => record._id || `${getApproverDisplayName(record, index)}-${index}`}
                    scroll={{ x: 540 }}
                  />
                ) : (
                  <div className="p-6"><Empty description="No approval flow recorded" /></div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      <DeferralDecisionModal
        title={`Confirm ${approveText || "Approval"}`}
        subtitle="Confirm the request and advance it to the next workflow stage."
        titleIcon={<CheckOutlined />}
        open={approveModalVisible}
        onCancel={() => {
          setApproveModalVisible(false);
          setApproveComment("");
        }}
        onConfirm={handleApprove}
        confirmText={approveText || "Approve"}
        confirmLoading={approveLoading}
        summaryCopy={`Approving this request will move the extension forward in the workflow and capture your comments in context.`}
        inputLabel="Approval comments"
        inputValue={approveComment}
        onInputChange={setApproveComment}
        inputPlaceholder="Enter approval comments..."
        deferralNumber={extensionLabel}
        customerName={currentExtension.customerName || linkedDeferral.customerName}
      />

      <DeferralDecisionModal
        title="Return for Rework"
        subtitle="Send the request back with clear corrective instructions."
        titleIcon={<RedoOutlined />}
        open={reworkModalVisible}
        onCancel={() => {
          setReworkModalVisible(false);
          setReworkReason("");
        }}
        onConfirm={handleReturnForRework}
        confirmText="Return for Rework"
        confirmLoading={reworkLoading}
        confirmDisabled={!reworkReason.trim()}
        summaryCopy="Returning for rework pauses the current extension review and routes the resubmission back to you after the RM corrects it."
        inputLabel="Rework instructions"
        inputRequired
        inputValue={reworkReason}
        onInputChange={setReworkReason}
        inputPlaceholder="Enter rework instructions..."
        deferralNumber={extensionLabel}
        customerName={currentExtension.customerName || linkedDeferral.customerName}
      />

      <DeferralDecisionModal
        title="Confirm Rejection"
        subtitle="Provide a concise rationale before rejecting this extension request."
        titleIcon={<ExclamationCircleOutlined />}
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason("");
        }}
        onConfirm={handleReject}
        confirmText="Reject"
        confirmLoading={rejectLoading}
        confirmDisabled={!rejectReason.trim()}
        summaryCopy="Rejecting this request will stop the extension review and record your reason for the originating team."
        inputLabel="Rejection reason"
        inputRequired
        inputValue={rejectReason}
        onInputChange={setRejectReason}
        inputPlaceholder="Enter rejection reason..."
        deferralNumber={extensionLabel}
        customerName={currentExtension.customerName || linkedDeferral.customerName}
      />
    </>
  );
};

export default ExtensionApplicationModal;

