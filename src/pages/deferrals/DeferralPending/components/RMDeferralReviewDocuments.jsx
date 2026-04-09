import React from "react";
import { Card, Table } from "antd";

const RMDeferralReviewDocuments = ({
  primaryBlue,
  requestedDocsWithDates,
  requestedDocsColumns,
  dclDocs,
  uploadedDocumentColumns,
  isCloseRequestContext,
  closeRequestDocuments,
  closeRequestColumns,
  closeRequestUploadColumns,
  generalUploadedDocs,
}) => {
  return (
    <>
      {requestedDocsWithDates.length > 0 && (
        <Card
          className="deferral-review-section"
          size="small"
          title={<span style={{ color: primaryBlue }}>Document(s) to be deferred ({requestedDocsWithDates.length})</span>}
          style={{ marginBottom: 18 }}
        >
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

      <Card
        className="deferral-review-section"
        size="small"
        title={<span style={{ color: primaryBlue }}>Mandatory: DCL Upload {dclDocs.length > 0 ? "✓" : ""}</span>}
        style={{ marginBottom: 18 }}
      >
        {dclDocs.length > 0 ? (
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
        ) : (
          <div style={{ padding: "12px 16px", color: "#999", textAlign: "center" }}>
            Auto-generated DCL document - pending upload
          </div>
        )}
      </Card>

      {isCloseRequestContext && closeRequestDocuments.length > 0 && (
        <Card
          className="deferral-review-section"
          size="small"
          title={<span style={{ color: primaryBlue }}>Close Request Documents ({closeRequestDocuments.length})</span>}
          style={{ marginBottom: 18 }}
        >
          <div className="deferral-review-table-shell">
            <Table
              dataSource={closeRequestDocuments}
              columns={closeRequestColumns}
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
              scroll={{ x: 940 }}
            />
          </div>
        </Card>
      )}

      <Card
        className="deferral-review-section"
        size="small"
        title={<span style={{ color: primaryBlue }}>Additional Documents ({generalUploadedDocs.length})</span>}
        style={{ marginBottom: 18 }}
      >
        {generalUploadedDocs.length > 0 ? (
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
        ) : (
          <div style={{ padding: "12px 16px", color: "#999", textAlign: "center" }}>
            No additional supporting documents
          </div>
        )}
      </Card>
    </>
  );
};

export default RMDeferralReviewDocuments;