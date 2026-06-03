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
import useProtectedFileFetcher from "../../../../hooks/useProtectedFileFetcher";
import downloadDeferralPdf from "../../../../utils/deferralPdfGenerator";
import { PRIMARY_BLUE, SUCCESS_GREEN } from "../utils/constants";
import CommentTrail from "./CommentTrail";

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

      return (
        Math.abs(candidate.__time - current.__time) <= DUPLICATE_TIME_WINDOW_MS
      );
    });

    if (existingIndex === -1) {
      deduped.push(current);
      return;
    }

    const existing = deduped[existingIndex];

    const shouldReplace =
      current.__score > existing.__score ||
      (current.__score === existing.__score &&
        current.__index < existing.__index);

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

const reviewShellClassName =
  "border-t border-[rgba(214,189,152)] bg-(--color-bg) [&_.ant-descriptions-item-label]:text-[11px] [&_.ant-descriptions-item-label]:font-normal [&_.ant-descriptions-item-label]:uppercase [&_.ant-descriptions-item-label]:tracking-[0.04em] [&_.ant-descriptions-item-label]:text-(--color-text-dark) [&_.ant-descriptions-item-content]:text-[13px] [&_.ant-descriptions-item-content]:font-normal [&_.ant-descriptions-item-content]:text-(--color-text-dark) [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-header]:border-b-0 [&_.ant-table-header]:shadow-none [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:border-none [&_.ant-table-content]:bg-transparent [&_table]:border-none [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_tr]:border-none [&_.ant-table-thead>tr]:border-b-0 [&_.ant-table-thead>tr]:shadow-none [&_.ant-table-thead>tr>th]:!border-b-0 [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-thead>tr>th]:bg-[rgba(247,244,239,0.55)] [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.04em] [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-thead>tr>th]:shadow-none [&_.ant-table-tbody>tr:first-child>td]:!border-t-0 [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.1)] [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr:last-child>td]:border-b-0 [&_.ant-table-row:hover>td]:bg-[rgba(247,244,239,0.35)] [&_.ant-table-thead>tr>th::before]:hidden [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

const tableShellClassName =
  "overflow-hidden rounded-xl border border-[rgba(214,189,152,0.16)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]";

const primaryButtonClassName =
  "rounded-lg! border-0! bg-(--ncb-primary-500)! text-white! shadow-none! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-[#6b7280]! [&>span]:text-white! disabled:[&>span]:text-[#6b7280]!";

const secondaryButtonClassName =
  "rounded-lg! border-(--color-primary-soft)! bg-transparent! text-(--color-primary-medium)! shadow-none! hover:border-(--color-primary-soft)! hover:bg-[rgba(214,189,152,0.1)]! hover:text-(--color-primary-dark)! focus:border-(--color-primary-soft)! focus:bg-[rgba(214,189,152,0.1)]! focus:text-(--color-primary-dark)! active:border-(--color-primary-soft)! active:bg-[rgba(214,189,152,0.1)]! active:text-(--color-primary-dark)! disabled:bg-[#D1D5DB]! disabled:border-[#D1D5DB]! disabled:text-[#6b7280]! disabled:[&>span]:text-[#6b7280]!";

const DeferralDetailsModal = ({
  deferral,
  open,
  onClose,
  headerTag,
  overrideApprovals,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [loadingComments] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const safeDeferral = deferral || null;
  const { openFile, downloadFile: fetchDownloadFile } = useProtectedFileFetcher();
  const { dclDocs, uploadedDocs, requestedDocs } = getDeferralDocumentBuckets(
    safeDeferral || {},
  );
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

  const approvalFlow =
    (overrideApprovals && overrideApprovals.approvers) ||
    safeDeferral?.approverFlow ||
    [];

  const requestedDocumentColumns = [
    {
      title: "Document",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span className="font-normal text-(--color-text-dark)">
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
      render: (value) => (
        <span className="font-normal text-(--color-text-dark)">
          {value || "Document"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openFile(record.fileUrl || record.url).catch((err) => console.error(err))}
            disabled={!record.fileUrl && !record.url}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() =>
              fetchDownloadFile(
                record.fileUrl || record.url,
                record.name || "document",
              ).catch((err) => console.error(err))
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
      render: (_, record) => (
        <span className="font-normal text-(--color-text-dark)">
          {record.name || record.approverName || "User"}
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
      width: 140,
      render: (_, record) => {
        const approved =
          record.approved || record.approvalStatus === "approved";
        return (
          <span className="font-normal text-(--color-text-dark)">
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
      await downloadDeferralPdf(safeDeferral, {
        requestedDocsWithDates,
        history,
      });
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
      <div className={reviewShellClassName}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 max-md:flex-col max-md:items-stretch">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(26,54,54,0.08)] text-(--color-primary-dark)">
                <BankOutlined />
              </span>
              <div>
                <h2 className="m-0 text-base font-normal tracking-[-0.02em] text-(--color-text-dark)">
                  {headerTag
                    ? `${headerTag}: ${safeDeferral.deferralNumber}`
                    : `Deferral Request: ${safeDeferral.deferralNumber}`}
                </h2>
                <div className="mt-1 text-xs text-(--color-text-light)">
                  {detailsSubtitle}
                </div>
              </div>
            </div>

            <Button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(214,189,152,0.2)] bg-white text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.2)] hover:bg-white hover:text-(--color-text-dark)"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>

          {showCompletedBanner ? (
            <div className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
              <div className="text-[13px] font-normal text-(--color-text-dark)">
                Deferral Completed
              </div>
              <div className="mt-1 text-xs text-(--color-text-medium)">
                This deferral request has been fully processed and is now
                available in the actioned workspace.
              </div>
            </div>
          ) : null}

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
            <div className="grid items-start gap-4 min-[1101px]:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
              <div className="flex min-w-0 flex-col gap-4">
                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                      Customer Information
                    </h3>
                  </div>
                  <div className="p-4">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Customer Name">
                        {deferral.customerName || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Customer Number">
                        {safeDeferral.customerNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loan Type">
                        {safeDeferral.loanType || "-"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                      Deferral Summary
                    </h3>
                  </div>
                  <div className="p-4">
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                      <Descriptions.Item label="Deferral Number">
                        {safeDeferral.deferralNumber || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="DCL No">
                        {safeDeferral.dclNumber || safeDeferral.dclNo || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        {safeDeferral.status || "Completed"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Creator Status">
                        {livePartyStatuses.creatorLabel}
                      </Descriptions.Item>
                      <Descriptions.Item label="Checker Status">
                        {livePartyStatuses.checkerLabel}
                      </Descriptions.Item>
                      <Descriptions.Item label="Approver Status">{`${approvalFlow.filter((item) => item.approved || item.approvalStatus === "approved").length} of ${approvalFlow.length} Approved`}</Descriptions.Item>
                      <Descriptions.Item label="Loan Amount">
                        {safeDeferral.loanAmountCategory || "Below 75 million"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {safeDeferral.createdAt
                          ? dayjs(safeDeferral.createdAt).format("DD MMM YYYY")
                          : "-"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </section>

                <section className="rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                    <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                      Deferral Description
                    </h3>
                  </div>
                  <div className="p-4">
                    <Typography.Paragraph className="mb-0 whitespace-pre-wrap text-(--color-text-medium)">
                      {safeDeferral.deferralDescription || "-"}
                    </Typography.Paragraph>
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-2 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white p-2.5 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
                <div className="creator-caption">Comments</div>
                <CommentTrail history={history} isLoading={loadingComments} />
              </aside>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                    Documents To Be Deferred
                  </h3>
                </div>
                {requestedDocsWithDates.length > 0 ? (
                  <Table
                    columns={requestedDocumentColumns}
                    dataSource={requestedDocsWithDates}
                    pagination={false}
                    rowKey={(record, index) =>
                      record.id || record._id || `${record.name}-${index}`
                    }
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6">
                    <Empty description="No deferred documents" />
                  </div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                    Facility Details
                  </h3>
                </div>
                {facilities.length > 0 ? (
                  <Table
                    dataSource={facilities}
                    columns={getFacilityColumns()}
                    pagination={false}
                    rowKey={(record, index) =>
                      record.facilityNumber || record._id || `facility-${index}`
                    }
                    scroll={{ x: 720 }}
                  />
                ) : (
                  <div className="p-6">
                    <Empty description="No facilities available" />
                  </div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                    Mandatory DCL Upload
                  </h3>
                </div>
                {dclDocs.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={dclDocs}
                    pagination={false}
                    rowKey={(record, index) =>
                      record.id || record._id || `dcl-${index}`
                    }
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6">
                    <Empty description="No DCL document uploaded" />
                  </div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                    Additional Documents
                  </h3>
                </div>
                {uploadedDocs.length > 0 ? (
                  <Table
                    columns={uploadedDocumentColumns}
                    dataSource={uploadedDocs}
                    pagination={false}
                    rowKey={(record, index) =>
                      record.id || record._id || `uploaded-${index}`
                    }
                    scroll={{ x: 640 }}
                  />
                ) : (
                  <div className="p-6">
                    <Empty description="No additional documents" />
                  </div>
                )}
              </div>

              <div className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">
                    Approval Flow
                  </h3>
                </div>
                {approvalFlow.length > 0 ? (
                  <Table
                    columns={approvalColumns}
                    dataSource={approvalFlow}
                    pagination={false}
                    rowKey={(record, index) =>
                      record._id ||
                      `${record.name || record.approverName || "approver"}-${index}`
                    }
                    scroll={{ x: 540 }}
                  />
                ) : (
                  <div className="p-6">
                    <Empty description="No approval flow recorded" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
            <Button
              className={primaryButtonClassName}
              icon={<FilePdfOutlined />}
              onClick={downloadDeferralAsPDF}
              loading={downloadLoading}
            >
              Download PDF
            </Button>
            <Button className={secondaryButtonClassName} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeferralDetailsModal;
