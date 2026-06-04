import React, { useState } from "react";
import { Table, Button, Tooltip, Tabs, Badge, Modal, List } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { openFileInNewTab } from "../../../utils/fileUtils";
import useProtectedFileFetcher from "../../../hooks/useProtectedFileFetcher";
import {
  getCheckerStatusDisplay,
} from "../../../utils/checklistConstants.js";
import { formatStatusText } from "../../../utils/statusColors.js";
import "../../../styles/creatorDesignSystem.css";

const { TabPane } = Tabs;

const DocumentsTable = ({ docs, checklist }) => {
  const tableFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
  const [activeCategory, setActiveCategory] = useState(null);

  // Helper function to group documents by category
  const groupDocumentsByCategory = (docsData) => {
    const grouped = {};
    docsData.forEach((doc) => {
      const category = doc.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(doc);
    });
    return grouped;
  };

  // Helper function to get category badge color
  const getCategoryColor = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("compliance")) return "#10b981";
    if (categoryLower.includes("financial")) return "#3b82f6";
    if (categoryLower.includes("legal")) return "#8b5cf6";
    if (categoryLower.includes("kra")) return "#f59e0b";
    if (categoryLower.includes("identification")) return "#ec4899";
    return "#64748b";
  };

  const safeDocs = Array.isArray(docs) ? docs : [];
  const { openFile } = useProtectedFileFetcher();
  const [viewModalFiles, setViewModalFiles] = useState(null);
  const viewModalData = viewModalFiles || { files: [], record: null };
  const groupedDocs = groupDocumentsByCategory(safeDocs);
  const categories = Object.keys(groupedDocs);

  // Set initial active category
  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const getStatusColor = (status) => {
    const lowerStatus = (status || "").toLowerCase();

    if (["submitted", "approved", "sighted", "completed"].includes(lowerStatus)) {
      return "#52C41A";
    }
    if (["pending", "pendingrm", "pendingco", "rejected"].includes(lowerStatus)) {
      return "#FF4D4F";
    }
    if (["deferred", "waived", "tbo"].includes(lowerStatus)) {
      return "#FAAD14";
    }
    return "var(--color-text-medium)";
  };

  const getColumns = () => [
    {
      title: "Document Name",
      dataIndex: "name",
      width: 200,
      render: (text, record) => {
        const docName =
          text || record.documentName || `Document ${record.docIdx + 1}`;
        return (
          <Tooltip title={docName}>
            <span className="completed-doc-table-primary completed-doc-table-primary--wrap">{docName}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Co Status",
      dataIndex: "status",
      width: 130,
      render: (status, record) => {
        const statusLabel =
          status === "deferred" && record.deferralNo
            ? `Deferred (${record.deferralNo})`
            : formatStatusText(status);

        return (
          <Tooltip title={statusLabel}>
            <span
              className="completed-doc-table-status"
              style={{ color: getStatusColor(status) }}
            >
              {statusLabel}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 180,
      render: (deferralNo) => (
        <Tooltip title={deferralNo || "No deferral number"}>
          {deferralNo ? (
            <span className="completed-doc-table-status completed-doc-table-status--wrap" style={{ color: "#b45309" }}>
              {deferralNo}
            </span>
          ) : "-"}
        </Tooltip>
      ),
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 130,
      render: (finalCheckerStatus) => {
        const checklistStatus = checklist?.status;
        let displayStatus = finalCheckerStatus;

        if (checklistStatus === "approved" || checklistStatus === "completed") {
          displayStatus = "approved";
        } else if (checklistStatus === "rejected") {
          displayStatus = "rejected";
        }

        const statusDisplay = getCheckerStatusDisplay(
          displayStatus,
          checklistStatus,
        );

        return (
          <Tooltip title={statusDisplay.text}>
            <span
              className="completed-doc-table-status"
              style={{ color: getStatusColor(displayStatus) }}
            >
              {statusDisplay.text}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Creator Comment",
      dataIndex: "comment",
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text || "No comment"}>
          <span className="completed-doc-table-muted">{text || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "View",
      key: "view",
      width: 100,
      render: (_, record) => {
        const files = [];
        if (Array.isArray(record.uploads) && record.uploads.length > 0) {
          files.push(...record.uploads);
        } else if (record.fileUrl || record.uploadData?.fileUrl) {
          files.push({
            id: "legacy",
            fileUrl: record.fileUrl || record.uploadData?.fileUrl,
            fileName: record.fileName || record.name || record.documentName || "Document File",
            uploadedBy: record.uploadedBy || record.uploadData?.uploadedBy,
            uploadedByRole: record.uploadedByRole || record.uploadData?.uploadedByRole,
            createdAt: record.uploadedAt || record.uploadData?.uploadedAt,
          });
        }

        if (files.length === 0) {
          return <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: tableFontFamily }}>No files</span>;
        }

        if (files.length === 1) {
          return (
            <Tooltip title="View document">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openFile(files[0].fileUrl).catch((err) => console.error(err))}
                className="completed-modal-view-btn"
              >
                View
              </Button>
            </Tooltip>
          );
        }

        return (
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewModalFiles({ files, record })}
            className="completed-modal-view-btn"
            style={{
              borderColor: "#10b981",
              color: "#10b981",
            }}
          >
            View ({files.length} Files)
          </Button>
        );
      },
    },
  ];

  const columns = getColumns();

  const renderViewModal = () => (
    <Modal
      title={<div style={{ fontFamily: tableFontFamily, fontWeight: 600, color: "#1e293b" }}>Associated Files</div>}
      open={!!viewModalFiles}
      onCancel={() => setViewModalFiles(null)}
      footer={[
        <Button key="close" onClick={() => setViewModalFiles(null)} style={{ fontFamily: tableFontFamily }}>
          Close
        </Button>
      ]}
      width={480}
      centered
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontFamily: tableFontFamily }}>
          This document has multiple uploads. Click on any file to view it:
        </p>
        <List
          dataSource={viewModalData.files || []}
          renderItem={(file, idx) => (
            <List.Item
              style={{
                padding: "10px 12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, marginRight: 12 }}>
                  <span
                    onClick={() => openFile(file.fileUrl).catch((err) => console.error(err))}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f172a",
                    cursor: "pointer",
                    textDecoration: "underline",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: tableFontFamily,
                  }}
                  title={file.fileName}
                >
                  {file.fileName || `Attachment ${idx + 1}`}
                </span>
                {file.uploadedBy && (
                  <span style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontFamily: tableFontFamily }}>
                    Uploaded by: {file.uploadedBy} ({file.uploadedByRole || "Unknown"})
                  </span>
                )}
              </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Button
                  size="small"
                  onClick={() => openFile(file.fileUrl).catch((err) => console.error(err))}
                  style={{ fontFamily: tableFontFamily }}
                >
                  View
                </Button>
              </div>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );

  // Render table for a specific category (used for single category)
  const renderCategoryTable = (category) => {
    const categoryDocs = groupedDocs[category] || [];
    const categoryColor = getCategoryColor(category);

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `2px solid ${categoryColor}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: categoryColor,
              }}
            >
              {category}
            </span>
            <Badge
              count={categoryDocs.length}
              style={{
                backgroundColor: categoryColor,
                color: "#fff",
              }}
            />
          </div>
        </div>

        <Table
          className="completed-doc-table"
          columns={columns}
          dataSource={categoryDocs}
          pagination={false}
          rowKey="docIdx"
          size="middle"
          tableLayout="auto"
          scroll={{ x: 1100 }}
          locale={{ emptyText: "No documents" }}
        />
      </div>
    );
  };

  // If no documents, show empty state
  if (safeDocs.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          background: "var(--color-white)",
          border: "1px solid rgba(214, 189, 152, 0.2)",
          borderRadius: "12px",
          fontFamily: tableFontFamily,
        }}
      >
        <p style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>
          No documents found
        </p>
        <p style={{ fontSize: "12px", color: "#666" }}>
          Documents will appear here once added
        </p>
      </div>
    );
  }

  // If only one category or less, show single table without tabs
  if (categories.length <= 1) {
    return (
      <>
        <style>{`
          .completed-doc-table {
            background: var(--color-white);
            font-family: ${tableFontFamily};
          }
          .completed-doc-table .ant-table,
          .completed-doc-table .ant-table-wrapper,
          .completed-doc-table .ant-table-container,
          .completed-doc-table .ant-table-content,
          .completed-doc-table table,
          .completed-doc-table thead,
          .completed-doc-table tbody,
          .completed-doc-table tr {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            background: var(--color-white) !important;
          }
          .completed-doc-table .ant-table-thead > tr > th {
            background: var(--color-white) !important;
            color: var(--color-heading) !important;
            font-weight: 600 !important;
            font-size: 12px !important;
            letter-spacing: 0.08em;
            padding: 12px 16px !important;
            border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
            border-right: none !important;
            text-transform: uppercase;
            font-family: ${tableFontFamily} !important;
          }
          .completed-doc-table .ant-table-tbody > tr > td {
            background: var(--color-white) !important;
            border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
            border-top: none !important;
            border-right: none !important;
            padding: 12px 16px !important;
            font-size: 13px !important;
            color: var(--color-text-body) !important;
            line-height: 1.45;
            font-family: ${tableFontFamily} !important;
          }
          .completed-doc-table .ant-table-thead > tr > th::before,
          .completed-doc-table .ant-table-cell::before,
          .completed-doc-table .ant-table-cell::after,
          .completed-doc-table .ant-table-wrapper::before,
          .completed-doc-table .ant-table-wrapper::after,
          .completed-doc-table .ant-table-container::before,
          .completed-doc-table .ant-table-container::after,
          .completed-doc-table .ant-table-thead > tr::after,
          .completed-doc-table .ant-table-tbody > tr::after {
            display: none !important;
          }
          .completed-doc-table .ant-table-tbody > tr.ant-table-row:hover > td {
            background-color: rgba(245, 247, 244, 0.9) !important;
          }
          .completed-doc-table-primary {
            color: var(--color-text-dark);
            font-size: 13px;
            font-weight: 500;
            font-family: ${tableFontFamily};
          }
          .completed-doc-table-primary--wrap {
            display: block;
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.45;
          }
          .completed-doc-table-muted {
            color: var(--color-text-body);
            font-size: 13px;
            font-weight: 400;
            font-family: ${tableFontFamily};
          }
          .completed-doc-table-muted--wrap {
            display: block;
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.45;
          }
          .completed-doc-table-status {
            font-size: 13px;
            font-weight: 500;
            font-family: ${tableFontFamily};
          }
          .completed-doc-table-status--wrap {
            display: inline-block;
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.45;
          }
          .completed-modal-view-btn.ant-btn {
            min-height: 32px !important;
            padding: 0 12px !important;
            border-radius: 6px !important;
            border: 1px solid rgba(214, 189, 152, 0.2) !important;
            background: var(--color-white) !important;
            color: var(--color-text-dark) !important;
            box-shadow: none !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            font-family: ${tableFontFamily} !important;
          }
          .completed-modal-view-btn.ant-btn:hover,
          .completed-modal-view-btn.ant-btn:focus {
            border-color: var(--color-text-dark) !important;
            background: rgba(214, 189, 152, 0.08) !important;
          }
        `}</style>

        {categories.map((category) => renderCategoryTable(category))}
        {renderViewModal()}
      </>
    );
  }

  // Multiple categories - use tabs
  return (
    <>
      <style>{`
        .completed-doc-table {
          background: var(--color-white);
          font-family: ${tableFontFamily};
        }
        .completed-doc-table .ant-table,
        .completed-doc-table .ant-table-wrapper,
        .completed-doc-table .ant-table-container,
        .completed-doc-table .ant-table-content,
        .completed-doc-table table,
        .completed-doc-table thead,
        .completed-doc-table tbody,
        .completed-doc-table tr {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: var(--color-white) !important;
        }
        .completed-doc-table .ant-table-thead > tr > th {
          background: var(--color-white) !important;
          color: var(--color-heading) !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          letter-spacing: 0.08em;
          padding: 12px 16px !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-right: none !important;
          text-transform: uppercase;
          font-family: ${tableFontFamily} !important;
        }
        .completed-doc-table .ant-table-tbody > tr > td {
          background: var(--color-white) !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
          border-top: none !important;
          border-right: none !important;
          padding: 12px 16px !important;
          font-size: 13px !important;
          color: var(--color-text-body) !important;
          line-height: 1.45;
          font-family: ${tableFontFamily} !important;
        }
        .completed-doc-table .ant-table-thead > tr > th::before,
        .completed-doc-table .ant-table-cell::before,
        .completed-doc-table .ant-table-cell::after,
        .completed-doc-table .ant-table-wrapper::before,
        .completed-doc-table .ant-table-wrapper::after,
        .completed-doc-table .ant-table-container::before,
        .completed-doc-table .ant-table-container::after,
        .completed-doc-table .ant-table-thead > tr::after,
        .completed-doc-table .ant-table-tbody > tr::after {
          display: none !important;
        }
        .completed-doc-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background-color: rgba(245, 247, 244, 0.9) !important;
        }
        .completed-doc-table-primary {
          color: var(--color-text-dark);
          font-size: 13px;
          font-weight: 500;
          font-family: ${tableFontFamily};
        }
        .completed-doc-table-primary--wrap {
          display: block;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.45;
        }
        .completed-doc-table-muted {
          color: var(--color-text-body);
          font-size: 13px;
          font-weight: 400;
          font-family: ${tableFontFamily};
        }
        .completed-doc-table-muted--wrap {
          display: block;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.45;
        }
        .completed-doc-table-status {
          font-size: 13px;
          font-weight: 500;
          font-family: ${tableFontFamily};
        }
        .completed-doc-table-status--wrap {
          display: inline-block;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.45;
        }
        .completed-modal-view-btn.ant-btn {
          min-height: 32px !important;
          padding: 0 12px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
          color: var(--color-text-dark) !important;
          box-shadow: none !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          font-family: ${tableFontFamily} !important;
        }
        .completed-modal-view-btn.ant-btn:hover,
        .completed-modal-view-btn.ant-btn:focus {
          border-color: var(--color-text-dark) !important;
          background: rgba(214, 189, 152, 0.08) !important;
        }
        .doc-category-tab .ant-tabs-tab {
          padding: 8px 16px !important;
          margin: 0 !important;
        }
        .doc-category-tab .ant-tabs-nav {
          margin-bottom: 16px !important;
        }
        .doc-category-tab .ant-tabs-nav::before {
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
        }
        .doc-category-tab .ant-tabs-tab-active .ant-tabs-tab-btn {
          font-weight: 600 !important;
        }
        .doc-category-tab .ant-tabs-ink-bar {
          background: #164679 !important;
          height: 2px !important;
        }
      `}</style>

      <Tabs
        className="doc-category-tab"
        activeKey={activeCategory}
        onChange={setActiveCategory}
        type="line"
        style={{ padding: "0 16px", marginTop: 8 }}
      >
        {categories.map((category) => {
          const categoryColor = getCategoryColor(category);
          const categoryCount = groupedDocs[category]?.length || 0;

          return (
            <TabPane
              key={category}
              tab={
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: categoryColor }}>{category}</span>
                  <Badge
                    count={categoryCount}
                    style={{
                      backgroundColor: categoryColor,
                      color: "#fff",
                      fontSize: 10,
                      minWidth: 18,
                      height: 18,
                      lineHeight: "18px",
                    }}
                  />
                </span>
              }
            >
              <div style={{ padding: "0 0 16px 0" }}>
                <Table
                  className="completed-doc-table"
                  columns={columns}
                  dataSource={groupedDocs[category]}
                  pagination={false}
                  rowKey="docIdx"
                  size="middle"
                  tableLayout="auto"
                  scroll={{ x: 1100 }}
                  locale={{ emptyText: "No documents" }}
                />
              </div>
            </TabPane>
          );
        })}
      </Tabs>
      {renderViewModal()}
    </>
  );
};

export default DocumentsTable;