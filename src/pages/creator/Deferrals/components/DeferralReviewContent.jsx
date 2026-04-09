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

  return (
    <>
      {showDetailsTab && (
        <>
          <Card
            className="deferral-info-card deferral-review-section"
            size="small"
            title={<span style={{ color: PRIMARY_BLUE }}>Deferral Details</span>}
            style={{ marginBottom: 18 }}
          >
            <Descriptions className="deferral-review-summary" size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
              <Descriptions.Item label="Customer Name">
                <Typography.Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerName}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Customer Number">
                <Typography.Text strong style={{ color: PRIMARY_BLUE }}>{deferral.customerNumber}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Deferral No">
                <Typography.Text strong style={{ color: PRIMARY_BLUE }}>{deferral.deferralNumber}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="DCL No">
                <Typography.Text strong style={{ color: PRIMARY_BLUE }}>{deferral.dclNo || deferral.dclNumber}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Loan Type">
                <Typography.Text strong style={{ color: PRIMARY_BLUE }}>{deferral.loanType}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                <Typography.Text strong style={{ color: PRIMARY_BLUE }}>{dayjs(deferral.createdAt).format("DD MMM YYYY")}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Typography.Text
                  strong
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
              <Descriptions.Item label="Creator Status">
                <Typography.Text style={{ color: creatorApproved ? "green" : PRIMARY_BLUE }}>{creatorStatusLabel}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Checker Status">
                <Typography.Text style={{ color: checkerApproved ? "green" : PRIMARY_BLUE }}>{checkerStatusLabel}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Approvers Status">
                <Typography.Text strong style={{ color: PRIMARY_BLUE }}>
                  {approvedApproversCount} of {(deferral.approverFlow || []).length} Approved
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Loan Amount">
                <Typography.Text>{deferral.loanAmount || "Below 75 million"}</Typography.Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="deferral-review-section"
            size="small"
            title={<span style={{ color: PRIMARY_BLUE }}>Review Summary</span>}
            style={{ marginBottom: 18 }}
          >
            <div className="deferral-review-stats">
              <div className="deferral-review-stat">
                <div className="deferral-review-stat__label">Requested Docs</div>
                <div className="deferral-review-stat__value">{requestedDocsWithDates.length}</div>
              </div>
              <div className="deferral-review-stat">
                <div className="deferral-review-stat__label">Uploaded Docs</div>
                <div className="deferral-review-stat__value">{dclDocs.length + generalUploadedDocs.length}</div>
              </div>
              <div className="deferral-review-stat">
                <div className="deferral-review-stat__label">Approvals</div>
                <div className="deferral-review-stat__value">{approvedApproversCount}</div>
              </div>
            </div>
          </Card>

          <Card className="deferral-review-section" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Deferral Description</span>} style={{ marginBottom: 18 }}>
            <div className="deferral-review-text-block">{deferral.deferralDescription || "-"}</div>
          </Card>

          {deferral.facilities && deferral.facilities.length > 0 && (
            <Card className="deferral-review-section" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Facility Details ({deferral.facilities.length})</span>} style={{ marginBottom: 18 }}>
              <div className="deferral-review-table-shell">
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
            <Card className="deferral-review-section" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Approval Flow</span>} style={{ marginBottom: 18 }}>
              <div className="deferral-review-table-shell">
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
            <Card className="deferral-review-section" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Document(s) to be deferred ({requestedDocsWithDates.length})</span>} style={{ marginBottom: 18 }}>
              <div className="deferral-review-table-shell">
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
            <Card className="deferral-review-section" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Mandatory: DCL Upload ✓</span>} style={{ marginBottom: 18 }}>
              <div className="deferral-review-table-shell">
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
            <Card className="deferral-review-section" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Additional Documents ({generalUploadedDocs.length})</span>} style={{ marginBottom: 18 }}>
              <div className="deferral-review-table-shell">
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
            <Card className="deferral-review-section" size="small" title={<span style={{ color: PRIMARY_BLUE }}>Close Request Documents ({closeRequestDocuments.length})</span>} style={{ marginBottom: 18 }}>
              <div className="deferral-review-table-shell">
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
                        <div style={{ color: "#94a3b8", fontSize: 12, padding: "4px 0" }}>
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