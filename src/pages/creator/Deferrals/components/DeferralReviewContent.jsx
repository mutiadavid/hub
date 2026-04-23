import React from "react";
import { Card, Descriptions, Table } from "antd";
import dayjs from "dayjs";
import getFacilityColumns from "../../../../utils/facilityColumns";

const sectionCardClassName = "mb-[18px] overflow-hidden rounded-xl border border-[rgba(214,189,152,0.18)] shadow-[0_8px_24px_rgba(15,23,42,0.04)] [&_.ant-card-head]:min-h-0 [&_.ant-card-head]:border-b [&_.ant-card-head]:border-[rgba(214,189,152,0.18)] [&_.ant-card-head]:bg-white [&_.ant-card-head]:px-4 [&_.ant-card-head]:py-3.5 [&_.ant-card-head-title]:p-0 [&_.ant-card-body]:bg-white [&_.ant-card-body]:p-4";
const infoCardClassName = `${sectionCardClassName} [&_.ant-card-head]:border-b-2 [&_.ant-card-head]:border-[var(--color-success-soft-border)] [&_.ant-descriptions-view]:overflow-hidden [&_.ant-descriptions-view]:rounded-lg [&_.ant-descriptions-view]:border [&_.ant-descriptions-view]:border-[rgba(214,189,152,0.2)] [&_.ant-descriptions-row>th]:border-b [&_.ant-descriptions-row>td]:border-b [&_.ant-descriptions-row>th]:border-[rgba(214,189,152,0.14)] [&_.ant-descriptions-row>td]:border-[rgba(214,189,152,0.14)] [&_.ant-descriptions-row:last-child>th]:border-b-0 [&_.ant-descriptions-row:last-child>td]:border-b-0 [&_.ant-descriptions-item-label]:min-w-[140px] [&_.ant-descriptions-item-label]:bg-white [&_.ant-descriptions-item-label]:px-[14px] [&_.ant-descriptions-item-label]:py-3 [&_.ant-descriptions-item-content]:bg-white [&_.ant-descriptions-item-content]:px-[14px] [&_.ant-descriptions-item-content]:py-3`;
const cardTitleClassName = "font-semibold text-(--color-primary-dark)";
const statsGridClassName = "grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))] max-md:grid-cols-1";
const statCardClassName = "rounded-[10px] border border-[rgba(214,189,152,0.16)] bg-white p-3";
const tableShellClassName = "mb-[18px] overflow-x-auto rounded-xl border border-[rgba(214,189,152,0.2)] bg-white [&_.ant-table]:border-none [&_.ant-table]:bg-transparent [&_.ant-table-container]:border-none [&_.ant-table-container]:bg-transparent [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.08em] [&_.ant-table-thead>tr>th]:text-(--color-text-muted) [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-body) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.14)] [&_.ant-table-tbody>tr:last-child>td]:border-b-0 [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";
const textBlockClassName = "rounded-lg border border-[rgba(214,189,152,0.2)] bg-white px-4 py-3.5 text-[13px] leading-6 text-(--color-text-body-soft) whitespace-pre-wrap";

const getStatusToneClassName = (tone) => {
  if (tone === "success") return "text-green-600";
  if (tone === "danger") return "text-red-600";
  return "text-(--color-primary-dark)";
};

const DeferralReviewContent = ({
  deferral,
  activeTab,
  isApprovedTabContext,
  creatorApproved,
  checkerApproved,
  creatorStatusLabel,
  checkerStatusLabel,
  approvedApproversCount,
  requestedDocsWithDates,
  requestedDocsColumns,
  dclDocs,
  generalUploadedDocs,
  uploadedDocumentColumns,
  isCloseRequestContext,
  closeRequestDocuments,
  closeRequestColumns,
  closeRequestDocumentColumns,
  closeRequestUploadColumns,
  approvalFlowColumns,
}) => {
  const showDetailsTab = activeTab === "details";
  const showDocumentsTab = activeTab === "documents";

  return (
    <>
      {showDetailsTab && (
        <>
          <Card
            className={infoCardClassName}
            size="small"
            title={<span className={cardTitleClassName}>Deferral Details</span>}
          >
            <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
              <Descriptions.Item label="Customer Name">
                <span className="font-semibold text-(--color-primary-dark)">{deferral.customerName}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Customer Number">
                <span className="font-semibold text-(--color-primary-dark)">{deferral.customerNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Deferral No">
                <span className="font-semibold text-(--color-primary-dark)">{deferral.deferralNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="DCL No">
                <span className="font-semibold text-(--color-primary-dark)">{deferral.dclNo || deferral.dclNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Loan Type">
                <span className="font-semibold text-(--color-primary-dark)">{deferral.loanType}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                <span className="font-semibold text-(--color-primary-dark)">{dayjs(deferral.createdAt).format("DD MMM YYYY")}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <span className={`font-semibold ${getStatusToneClassName(isApprovedTabContext || deferral.status === "approved" ? "success" : deferral.status === "rejected" ? "danger" : "primary")}`}>
                  {isApprovedTabContext
                    ? "Approved"
                    : deferral.status
                      ? deferral.status.replace(/_/g, " ").charAt(0).toUpperCase() + deferral.status.slice(1).replace(/_/g, " ")
                      : "-"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Creator Status">
                <span className={creatorApproved ? "text-green-600" : "text-(--color-primary-dark)"}>{creatorStatusLabel}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Checker Status">
                <span className={checkerApproved ? "text-green-600" : "text-(--color-primary-dark)"}>{checkerStatusLabel}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Approvers Status">
                <span className="font-semibold text-(--color-primary-dark)">
                  {approvedApproversCount} of {(deferral.approverFlow || []).length} Approved
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Loan Amount">
                <span>{deferral.loanAmount || "Below 75 million"}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className={sectionCardClassName}
            size="small"
            title={<span className={cardTitleClassName}>Review Summary</span>}
          >
            <div className={statsGridClassName}>
              <div className={statCardClassName}>
                <div className="text-[10px] font-bold tracking-[0.08em] text-(--color-text-muted) uppercase">Requested Docs</div>
                <div className="mt-2 text-[22px] font-bold text-(--color-text-dark)">{requestedDocsWithDates.length}</div>
              </div>
              <div className={statCardClassName}>
                <div className="text-[10px] font-bold tracking-[0.08em] text-(--color-text-muted) uppercase">Uploaded Docs</div>
                <div className="mt-2 text-[22px] font-bold text-(--color-text-dark)">{dclDocs.length + generalUploadedDocs.length}</div>
              </div>
              <div className={statCardClassName}>
                <div className="text-[10px] font-bold tracking-[0.08em] text-(--color-text-muted) uppercase">Approvals</div>
                <div className="mt-2 text-[22px] font-bold text-(--color-text-dark)">{approvedApproversCount}</div>
              </div>
            </div>
          </Card>

          <Card className={sectionCardClassName} size="small" title={<span className={cardTitleClassName}>Deferral Description</span>}>
            <div className={textBlockClassName}>{deferral.deferralDescription || "-"}</div>
          </Card>

          {deferral.facilities && deferral.facilities.length > 0 && (
            <Card className={sectionCardClassName} size="small" title={<span className={cardTitleClassName}>Facility Details ({deferral.facilities.length})</span>}>
              <div className={tableShellClassName}>
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
          )}

          {deferral.approverFlow && deferral.approverFlow.length > 0 && (
            <Card className={sectionCardClassName} size="small" title={<span className={cardTitleClassName}>Approval Flow</span>}>
              <div className={tableShellClassName}>
                <Table
                  dataSource={deferral.approverFlow}
                  columns={approvalFlowColumns}
                  pagination={false}
                  size="small"
                  rowKey={(approver, index) => approver._id || approver.id || `approver-${index}`}
                  scroll={{ x: 640 }}
                />
              </div>
            </Card>
          )}
        </>
      )}

      {showDocumentsTab && (
        <>
          {requestedDocsWithDates.length > 0 && (
            <Card className={sectionCardClassName} size="small" title={<span className={cardTitleClassName}>Document(s) to be deferred ({requestedDocsWithDates.length})</span>}>
              <div className={tableShellClassName}>
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
          )}

          {dclDocs.length > 0 && (
            <Card className={sectionCardClassName} size="small" title={<span className={cardTitleClassName}>Mandatory: DCL Upload ✓</span>}>
              <div className={tableShellClassName}>
                <Table
                  dataSource={dclDocs}
                  columns={uploadedDocumentColumns}
                  pagination={false}
                  size="small"
                  rowKey={(doc, index) => doc.id || doc._id || `dcl-${index}`}
                  scroll={{ x: 680 }}
                />
              </div>
            </Card>
          )}

          {generalUploadedDocs.length > 0 && (
            <Card className={sectionCardClassName} size="small" title={<span className={cardTitleClassName}>Additional Documents ({generalUploadedDocs.length})</span>}>
              <div className={tableShellClassName}>
                <Table
                  dataSource={generalUploadedDocs}
                  columns={uploadedDocumentColumns}
                  pagination={false}
                  size="small"
                  rowKey={(doc, index) => doc.id || doc._id || `upload-${index}`}
                  scroll={{ x: 680 }}
                />
              </div>
            </Card>
          )}

          {isCloseRequestContext && closeRequestDocuments.length > 0 && (
            <Card className={sectionCardClassName} size="small" title={<span className={cardTitleClassName}>Close Request Documents ({closeRequestDocuments.length})</span>}>
              <div className={tableShellClassName}>
                <Table
                  dataSource={closeRequestColumns}
                  columns={closeRequestDocumentColumns}
                  pagination={false}
                  size="small"
                  rowKey={(document) => document.key || document.documentName}
                  expandable={{
                    expandedRowRender: (document) =>
                      document.uploads?.length > 0 ? (
                        <Table
                          dataSource={document.uploads}
                          columns={closeRequestUploadColumns}
                          pagination={false}
                          size="small"
                          rowKey={(upload, index) => upload.id || upload._id || `${document.key}-upload-${index}`}
                        />
                      ) : (
                        <div className="py-1 text-xs text-[#94a3b8]">
                          No uploaded close-request evidence found for this document.
                        </div>
                      ),
                    rowExpandable: () => true,
                  }}
                  scroll={{ x: 1260 }}
                />
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export default DeferralReviewContent;