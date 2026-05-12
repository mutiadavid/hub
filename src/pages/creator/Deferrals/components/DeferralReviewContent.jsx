import React from "react";
import { Card, Descriptions, Table, Typography } from "antd";
import dayjs from "dayjs";
import getFacilityColumns from "../../../../utils/facilityColumns";

const PRIMARY_BLUE = "var(--color-primary-dark)";

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

  // Apply font styles to columns
  const applyFontToColumns = (columns) => {
    if (!columns) return columns;
    return columns.map(col => ({
      ...col,
      className: "text-md font-normal",
      render: col.render ? (text, record, index) => {
        const rendered = col.render(text, record, index);
        return <span className="text-md font-normal">{rendered}</span>;
      } : (text) => <span className="text-md font-normal">{text}</span>,
    }));
  };

  const styledRequestedDocsColumns = applyFontToColumns(requestedDocsColumns);
  const styledUploadedDocumentColumns = applyFontToColumns(uploadedDocumentColumns);
  const styledApprovalFlowColumns = applyFontToColumns(approvalFlowColumns);
  const styledCloseRequestDocumentColumns = applyFontToColumns(closeRequestDocumentColumns);
  const styledCloseRequestUploadColumns = applyFontToColumns(closeRequestUploadColumns);

  return (
    <div className="text-md font-normal font-['Gothic_A1','Century_Gothic','Gill_Sans','Segoe_UI',sans-serif]">
      {showDetailsTab && (
        <>
          <Card
            className="deferral-info-card deferral-review-section mb-4"
            size="small"
            title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Deferral Details</span>}
            style={{ marginBottom: 18 }}
          >
            <Descriptions className="deferral-review-summary" size="middle" column={{ md: 1, sm: 2, lg: 3 }}>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Customer Name</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>{deferral.customerName}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Customer Number</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>{deferral.customerNumber}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Deferral No</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>{deferral.deferralNumber}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">DCL No</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>{deferral.dclNo || deferral.dclNumber}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Loan Type</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>{deferral.loanType}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Created At</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>{dayjs(deferral.createdAt).format("DD MMM YYYY")}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Status</span>}>
                <Typography.Text
                  className="text-md font-normal"
                  style={{
                    color:
                      isApprovedTabContext || deferral.status === "approved"
                        ? "green"
                        : deferral.status === "rejected"
                          ? "red"
                          : PRIMARY_BLUE,
                  }}
                >
                  {isApprovedTabContext
                    ? "Approved"
                    : deferral.status
                      ? deferral.status.replace(/_/g, " ").charAt(0).toUpperCase() + deferral.status.slice(1).replace(/_/g, " ")
                      : "-"}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Creator Status</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: creatorApproved ? "green" : PRIMARY_BLUE }}>
                  {creatorStatusLabel}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Checker Status</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: checkerApproved ? "green" : PRIMARY_BLUE }}>
                  {checkerStatusLabel}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Approvers Status</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>
                  {approvedApproversCount} of {(deferral.approverFlow || []).length} Approved
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-md font-normal text-gray-500">Loan Amount</span>}>
                <Typography.Text className="text-md font-normal" style={{ color: PRIMARY_BLUE }}>{deferral.loanAmount || "Below 75 million"}</Typography.Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="deferral-review-section mb-4"
            size="small"
            title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Review Summary</span>}
            style={{ marginBottom: 18 }}
          >
            <div className="flex gap-6">
              <div className="deferral-review-stat">
                <div className="text-md font-normal text-gray-500">Requested Docs</div>
                <div className="text-base font-medium" style={{ color: PRIMARY_BLUE }}>
                  {requestedDocsWithDates.length}
                </div>
              </div>
              <div className="deferral-review-stat">
                <div className="text-md font-normal text-gray-500">Uploaded Docs</div>
                <div className="text-base font-medium" style={{ color: PRIMARY_BLUE }}>
                  {dclDocs.length + generalUploadedDocs.length}
                </div>
              </div>
              <div className="deferral-review-stat">
                <div className="text-md font-normal text-gray-500">Approvals</div>
                <div className="text-base font-medium" style={{ color: PRIMARY_BLUE }}>
                  {approvedApproversCount}
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="deferral-review-section mb-4"
            size="small"
            title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Deferral Description</span>}
            style={{ marginBottom: 18 }}
          >
            <div className="text-md font-normal">
              {deferral.deferralDescription || "-"}
            </div>
          </Card>

          {deferral.facilities && deferral.facilities.length > 0 && (
            <Card
              className="deferral-review-section mb-4"
              size="small"
              title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Facility Details ({deferral.facilities.length})</span>}
              style={{ marginBottom: 18 }}
            >
              <div className="overflow-x-auto">
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
            <Card
              className="deferral-review-section mb-4"
              size="small"
              title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Approval Flow</span>}
              style={{ marginBottom: 18 }}
            >
              <div className="overflow-x-auto">
                <Table
                  dataSource={deferral.approverFlow}
                  columns={styledApprovalFlowColumns}
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
            <Card
              className="deferral-review-section mb-4"
              size="small"
              title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Document(s) to be deferred ({requestedDocsWithDates.length})</span>}
              style={{ marginBottom: 18 }}
            >
              <div className="overflow-x-auto">
                <Table
                  dataSource={requestedDocsWithDates}
                  columns={styledRequestedDocsColumns}
                  pagination={false}
                  size="small"
                  rowKey={(doc, index) => doc.id || doc._id || `${doc.name || "doc"}-${index}`}
                  scroll={{ x: 720 }}
                />
              </div>
            </Card>
          )}

          {dclDocs.length > 0 && (
            <Card
              className="deferral-review-section mb-4"
              size="small"
              title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Mandatory: DCL Upload ✓</span>}
              style={{ marginBottom: 18 }}
            >
              <div className="overflow-x-auto">
                <Table
                  dataSource={dclDocs}
                  columns={styledUploadedDocumentColumns}
                  pagination={false}
                  size="small"
                  rowKey={(doc, index) => doc.id || doc._id || `dcl-${index}`}
                  scroll={{ x: 680 }}
                />
              </div>
            </Card>
          )}

          {generalUploadedDocs.length > 0 && (
            <Card
              className="deferral-review-section mb-4"
              size="small"
              title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Additional Documents ({generalUploadedDocs.length})</span>}
              style={{ marginBottom: 18 }}
            >
              <div className="overflow-x-auto">
                <Table
                  dataSource={generalUploadedDocs}
                  columns={styledUploadedDocumentColumns}
                  pagination={false}
                  size="small"
                  rowKey={(doc, index) => doc.id || doc._id || `upload-${index}`}
                  scroll={{ x: 680 }}
                />
              </div>
            </Card>
          )}

          {isCloseRequestContext && closeRequestDocuments.length > 0 && (
            <Card
              className="deferral-review-section mb-4"
              size="small"
              title={<span className="text-sm font-normal" style={{ color: PRIMARY_BLUE }}>Close Request Documents ({closeRequestDocuments.length})</span>}
              style={{ marginBottom: 18 }}
            >
              <div className="overflow-x-auto">
                <Table
                  dataSource={closeRequestColumns}
                  columns={styledCloseRequestDocumentColumns}
                  pagination={false}
                  size="small"
                  rowKey={(document) => document.key || document.documentName}
                  expandable={{
                    expandedRowRender: (document) =>
                      document.uploads?.length > 0 ? (
                        <Table
                          dataSource={document.uploads}
                          columns={styledCloseRequestUploadColumns}
                          pagination={false}
                          size="small"
                          rowKey={(upload, index) => upload.id || upload._id || `${document.key}-upload-${index}`}
                        />
                      ) : (
                        <div className="text-md font-normal text-gray-400 py-1">
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
    </div>
  );
};

export default DeferralReviewContent;