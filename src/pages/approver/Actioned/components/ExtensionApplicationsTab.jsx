import React, { useMemo, useState } from "react";
import { Button, Descriptions, Empty, Spin, Table, Typography } from "antd";
import { useSelector } from "react-redux";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { getActionedColumns } from "../utils";
import RealTimeSlaTag from "../../../../components/common/RealTimeSlaTag";
import dayjs from "dayjs";
import deferralApi from "../../../../service/deferralApi";
import getFacilityColumns from "../../../../utils/facilityColumns";
import {
  getDeferralDocumentBuckets,
  resolveDocumentDaysAndDateWithExtension,
} from "../../../../utils/deferralDocuments";
import { getLivePartyApprovalStatuses } from "../../../../utils/deferralApprovalStatus";
import { buildExtensionHistoryEntries, resolveDisplayName } from "../../../../utils/extensionHistory";
import { downloadFile, openFileInNewTab } from "../../../../utils/fileUtils";
import useProtectedFileFetcher from "../../../../hooks/useProtectedFileFetcher";
import { PRIMARY_BLUE, SUCCESS_GREEN } from "../utils/constants";
import CommentTrail from "./CommentTrail";

const TABS = [
  { key: "details", label: "Extension Details" },
  { key: "documents", label: "Documents & Flow" },
];

const reviewShellClassName = "border-t border-[rgba(214,189,152,0.2)] bg-[rgba(245,247,244,0.85)] p-4 [&_.ant-descriptions-item-label]:text-[11px] [&_.ant-descriptions-item-label]:font-normal [&_.ant-descriptions-item-label]:uppercase [&_.ant-descriptions-item-label]:text-(--color-text-dark) [&_.ant-descriptions-item-content]:text-[13px] [&_.ant-descriptions-item-content]:font-normal [&_.ant-descriptions-item-content]:text-(--color-text-dark) [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:border-none [&_.ant-table-content]:bg-transparent [&_table]:border-none [&_thead]:bg-transparent [&_tbody]:bg-transparent [&_tr]:border-none [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-thead>tr>th]:bg-transparent [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-normal [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-thead>tr>th::before]:hidden [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

const tableShellClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";

const loadingStateClassName = "flex min-h-[220px] items-center justify-center rounded-lg border border-[rgba(214,189,152,0.2)] bg-white";

const ExtensionApplicationsTab = ({
  extensions = [],
  loading = false,
  tableClassName = "actioned-table",
  onOpenExtensionDetails,
}) => {
  const token = useSelector((state) => state.auth.token);
  // Use actioned deferral columns so extension list matches deferral table
  const setActiveTab = (key, tab) => {
    // placeholder for tab state if needed in future
  };

  const columns = getActionedColumns();
  const { openFile, downloadFile: fetchDownloadFile } = useProtectedFileFetcher();

  // map extensions into deferral-like rows so the deferral columns render correctly
  const tableData = (extensions || []).map((ext, idx) => ({
    ...(ext.deferral || {}),
    _extensionId: ext._id || ext.id || `ext-${idx}`,
    __extension: ext,
  }));

  const uploadedDocumentColumns = useMemo(
    () => [
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
                fetchDownloadFile(record.fileUrl || record.url, record.name || record.originalName || "document").catch((err) => console.error(err))
              }
              disabled={!record.fileUrl && !record.url}
            >
              Download
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const requestedDocumentColumns = useMemo(
    () => [
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
    ],
    [],
  );

  const approvalColumns = useMemo(
    () => [
      {
        title: "Approver",
        key: "approver",
        render: (_, record, index) => (
          <span className="font-bold text-(--color-text-dark)">
            {resolveDisplayName(
              record?.user?.name,
              record?.user?.fullName,
              record?.userName,
              record?.name,
              record?.approverName,
              record?.email,
              `Approver ${index + 1}`,
            )}
          </span>
        ),
      },
      {
        title: "Role",
        key: "role",
        render: (_, record) => record.designation || record.role || "-",
      },
      {
        title: "Status",
        key: "status",
        width: 140,
        render: (_, record) => {
          const approved =
            record.approved === true ||
            String(record.approvalStatus || record.status || "").toLowerCase() === "approved";
          return (
            <span className={`font-bold ${approved ? "text-[#52c41a]" : "text-[#164679]"}`}>
              {approved ? "Approved" : "Pending Approval"}
            </span>
          );
        },
      },
    ],
    [],
  );

  const renderExpandedRow = (record) => {
    const rowKey = record._id || record.id;
    const detailRecord = hydratedExtensions[rowKey] || record;
    const activeTab = tabState[rowKey] || "details";
    const linkedDeferral = detailRecord?.deferral || detailRecord?.linkedDeferral || {};
    const livePartyStatuses = getLivePartyApprovalStatuses(detailRecord);
    const { requestedDocs = [] } = getDeferralDocumentBuckets(detailRecord);
    const { dclDocs = [], uploadedDocs = [] } = getDeferralDocumentBuckets(linkedDeferral);
    const documentsToBeDeferred = requestedDocs.map((doc) => {
      const { days, nextDate } = resolveDocumentDaysAndDateWithExtension(doc, linkedDeferral, detailRecord);
      return {
        ...doc,
        requestedDays: days,
        newDueDate: nextDate,
      };
    });
    const facilities = Array.isArray(linkedDeferral?.facilities)
      ? linkedDeferral.facilities
      : Array.isArray(linkedDeferral?.Facilities)
        ? linkedDeferral.Facilities
        : [];
    const extensionAdditionalFiles = Array.isArray(detailRecord?.additionalFiles)
      ? detailRecord.additionalFiles
      : Array.isArray(detailRecord?.AdditionalFiles)
        ? detailRecord.AdditionalFiles
        : [];
    const additionalDocuments = [...uploadedDocs, ...extensionAdditionalFiles];
    const extensionHistory = buildExtensionHistoryEntries(detailRecord);
    const approvalFlow = detailRecord.approvers || detailRecord.Approvers || [];
    const detailsLoading = loadingDetailsByKey[rowKey] === true;

    return (
      <div className={reviewShellClassName}>
        {detailsLoading ? (
          <div className={`${loadingStateClassName} p-6`}>
            <Spin />
          </div>
        ) : null}

        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[rgba(214,189,152,0.2)]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`whitespace-nowrap border-b-2 bg-transparent px-3 py-2.5 text-xs font-medium ${activeTab === tab.key ? "border-(--color-primary-dark) text-(--color-primary-dark)" : "border-transparent text-(--color-text-light)"}`}
              onClick={() => setActiveTab(rowKey, tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <div className="grid items-start gap-4 min-[1024px]:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <section className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Customer Information</h3>
                </div>
                <div className="p-4">
                  <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                    <Descriptions.Item label="Customer Name">
                      {detailRecord.customerName || linkedDeferral.customerName || linkedDeferral.CustomerName || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer Number">
                      {detailRecord.customerNumber || linkedDeferral.customerNumber || linkedDeferral.CustomerNumber || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loan Type">
                      {linkedDeferral.loanType || linkedDeferral.LoanType || "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </section>

              <section className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Extension Summary</h3>
                </div>
                <div className="p-4">
                  <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                    <Descriptions.Item label="Extension Number">
                      {detailRecord.extensionNumber
                        || detailRecord.ExtensionNumber
                        || (detailRecord.deferralNumber || linkedDeferral.deferralNumber || linkedDeferral.DeferralNumber || "").replace(/^DEF-/i, "EXT-")
                        || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Deferral Number">
                      {detailRecord.deferralNumber || linkedDeferral.deferralNumber || linkedDeferral.DeferralNumber || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {detailRecord.status || detailRecord.Status || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Creator Status">{livePartyStatuses.creatorLabel}</Descriptions.Item>
                    <Descriptions.Item label="Checker Status">{livePartyStatuses.checkerLabel}</Descriptions.Item>
                    <Descriptions.Item label="Approver Status">
                      {`${approvalFlow.filter((item) => item.approved === true || String(item.approvalStatus || item.status || "").toLowerCase() === "approved").length} of ${approvalFlow.length} Approved`}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loan Amount">
                      {linkedDeferral.loanAmountCategory || linkedDeferral.LoanAmountCategory || "Below 75 million"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                      {detailRecord.createdAt || detailRecord.CreatedAt
                        ? dayjs(detailRecord.createdAt || detailRecord.CreatedAt).format("DD MMM YYYY")
                        : "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </section>

              <section className={tableShellClassName}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] px-4 py-3.5">
                  <h3 className="m-0 text-[13px] font-normal text-(--color-text-dark)">Extension Reason</h3>
                </div>
                <div className="p-4">
                  <Typography.Paragraph className="mb-0 whitespace-pre-wrap text-(--color-text-medium)">
                    {detailRecord.extensionReason || detailRecord.ExtensionReason || detailRecord.reason || detailRecord.Reason || "-"}
                  </Typography.Paragraph>
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-3 rounded-lg border border-[rgba(214,189,152,0.2)] bg-white p-3 shadow-[0_1px_2px_rgba(26,54,54,0.06)]">
              <div className="creator-caption">History</div>
              <CommentTrail history={extensionHistory} isLoading={false} />
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
                  columns={requestedDocumentColumns}
                  dataSource={documentsToBeDeferred}
                  pagination={false}
                  rowKey={(item, index) => item.id || item._id || `${item.name}-${index}`}
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
              {facilities.length > 0 ? (
                <Table
                  dataSource={facilities}
                  columns={getFacilityColumns()}
                  pagination={false}
                  rowKey={(item, index) => item.facilityNumber || item._id || `facility-${index}`}
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
                  rowKey={(item, index) => item.id || item._id || `dcl-${index}`}
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
                  rowKey={(item, index) => item.id || item._id || `additional-${index}`}
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
              {approvalFlow.length > 0 ? (
                <Table
                  columns={approvalColumns}
                  dataSource={approvalFlow}
                  pagination={false}
                  rowKey={(item, index) => item._id || `${item.name || item.approverName || "approver"}-${index}`}
                  scroll={{ x: 540 }}
                />
              ) : (
                <div className="p-6"><Empty description="No approval flow recorded" /></div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={loadingStateClassName}>
        <Spin />
      </div>
    );
  }

  if (extensions.length === 0) {
    return (
      <div className={loadingStateClassName}>
        <Empty description="No extension applications" />
      </div>
    );
  }

  return (
    <div className={tableClassName}>
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey={(record) => record._id || record.id || record._extensionId}
        tableLayout="fixed"
        size="middle"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          position: ["bottomCenter"],
        }}
        scroll={{ x: 600 }}
        onRow={(record) => ({
          onClick: () => {
            if (typeof onOpenExtensionDetails === "function") {
              onOpenExtensionDetails(record.__extension || record);
            }
          },
          className: "cursor-pointer",
        })}
      />
    </div>
  );
};

export default ExtensionApplicationsTab;