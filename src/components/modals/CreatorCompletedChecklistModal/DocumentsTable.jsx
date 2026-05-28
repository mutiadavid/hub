import React, { useState } from "react";
import { Table, Button, Tooltip, Tabs, Badge } from "antd";
import { TABLE_CONFIG } from "./constants";
import { getCheckerStatusDisplay } from "../../../utils/checklistConstants";
import { getFullUrl as getFullUrlUtil } from "../../../utils/checklistUtils";
import { formatStatusText } from "../../../utils/statusColors";
import "../../../styles/creatorDesignSystem.css";
import { openFileInNewTab } from "../../../utils/fileUtils";

const { TabPane } = Tabs;

// Helper function to group documents by category
const groupDocumentsByCategory = (docs) => {
  const grouped = {};
  docs.forEach((doc) => {
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

const DocumentsTable = ({ docs, checklist }) => {
  // FIX: Ensure docs is always an array
  const safeDocs = Array.isArray(docs) ? docs : [];
  const pageSize = 6;
  const [activeCategory, setActiveCategory] = useState(null);

  // Group documents by category
  const groupedDocs = groupDocumentsByCategory(safeDocs);
  const categories = Object.keys(groupedDocs);

  // Set initial active category
  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Show debug info if no documents
  if (safeDocs.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          background: "var(--color-white)",
          border: "1px solid rgba(214, 189, 152, 0.2)",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <p style={{ fontSize: "16px", color: "#999", marginBottom: "8px" }}>
          No documents found
        </p>
        <p style={{ fontSize: "12px", color: "#666" }}>
          Documents array: {docs ? "Exists" : "Null/Undefined"} | Length:{" "}
          {docs?.length || 0} | Type: {typeof docs}
        </p>
        {checklist && (
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            Checklist: {checklist.title} | Status: {checklist.status}
          </p>
        )}
      </div>
    );
  }

  // FIX: Use TABLE_CONFIG.COLUMNS instead of TABLE_COLUMNS
  const getColumns = () => TABLE_CONFIG.COLUMNS.map((col) => {
    if (col.key === "category") {
      return {
        ...col,
        width: 150,
        render: (text) => (
          <span
            style={{
              fontSize: 12,
              color: "var(--color-text-body)",
              fontWeight: 500,
              display: "block",
              whiteSpace: "normal",
              wordBreak: "break-word",
              lineHeight: 1.45,
            }}
          >
            {text || "N/A"}
          </span>
        ),
      };
    }

    if (col.key === "status") {
      return {
        ...col,
        width: 118,
        render: (status, record) => {
          const statusLabel =
            status === "deferred" && record.deferralNo
              ? `Deferred (${record.deferralNo})`
              : formatStatusText(status || "Pending");

          let textColor = "#000";

          const normalizedStatus = String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "");

          if (
            normalizedStatus.includes("submitted") ||
            normalizedStatus.includes("sighted")
          ) {
            textColor = "#52C41A";
          } else if (
            normalizedStatus.includes("deferred") ||
            normalizedStatus.includes("waived") ||
            normalizedStatus.includes("tbo")
          ) {
            textColor = "#FAAD14";
          } else if (normalizedStatus.includes("pending")) {
            textColor = "#FF4D4F";
          } else if (normalizedStatus.includes("approved")) {
            textColor = "#52C41A";
          } else if (normalizedStatus.includes("rejected")) {
            textColor = "#FF4D4F";
          }

          return (
            <Tooltip title={statusLabel}>
              <span
                style={{
                  color: textColor,
                  fontWeight: "600",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
              >
                {statusLabel}
              </span>
            </Tooltip>
          );
        },
      };
    }

    if (col.key === "deferralNo") {
      return {
        ...col,
        width: 180,
        render: (text) => (
          <Tooltip title={text || "No deferral number"}>
            <span style={{ fontSize: 12, color: "#b45309", whiteSpace: "normal", wordBreak: "break-word" }}>{text || "-"}</span>
          </Tooltip>
        ),
      };
    }

    if (col.key === "checkerStatus") {
      return {
        ...col,
        width: 112,
        render: (finalCheckerStatus) => {
          const checklistStatus = checklist?.status;
          let displayStatus = finalCheckerStatus;

          // Always prioritize checklist status
          if (
            checklistStatus === "approved" ||
            checklistStatus === "completed"
          ) {
            displayStatus = "approved";
          } else if (checklistStatus === "rejected") {
            displayStatus = "rejected";
          }

          const statusDisplay = getCheckerStatusDisplay(
            displayStatus,
            checklistStatus,
          );

          let textColor = "#000";
          let displayText = statusDisplay.text || "Pending";

          const normalizedStatus = String(displayStatus || "")
            .toLowerCase()
            .replace(/\s+/g, "");

          if (
            normalizedStatus.includes("approved") ||
            normalizedStatus.includes("sighted")
          ) {
            textColor = "#52C41A";
            displayText = normalizedStatus.includes("approved")
              ? "approved"
              : "sighted";
          } else if (
            normalizedStatus.includes("waived") ||
            normalizedStatus.includes("tbo") ||
            normalizedStatus.includes("deferred")
          ) {
            textColor = "#FAAD14";
            displayText = normalizedStatus.includes("waived")
              ? "waived"
              : normalizedStatus.includes("tbo")
                ? "tbo"
                : "deferred";
          } else if (normalizedStatus.includes("rejected")) {
            textColor = "#FF4D4F";
            displayText = "rejected";
          } else {
            textColor = "#FF4D4F";
            displayText = "pending";
          }

          return (
            <Tooltip title={displayText}>
              <span
                style={{
                  fontWeight: "600",
                  fontSize: 12,
                  color: textColor,
                  textTransform: "capitalize",
                }}
              >
                {displayText}
              </span>
            </Tooltip>
          );
        },
      };
    }

    if (col.key === "comment") {
      return {
        ...col,
        width: 180,
        ellipsis: true,
        render: (text) => (
          <Tooltip title={text || "No comment"}>
            <span style={{ fontSize: 12, color: "var(--color-text-medium)" }}>{text || "-"}</span>
          </Tooltip>
        ),
      };
    }

    if (col.key === "view") {
      return {
        ...col,
        width: 88,
        render: (_, record) => {
          const url = record.fileUrl || record.uploadData?.fileUrl;
          if (!url) {
            return <span style={{ color: "var(--color-text-light)", fontSize: 12 }}>No file</span>;
          }

          return (
            <Tooltip title="View">
              <Button
                size="small"
                onClick={() => openFileInNewTab(url)}
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#d9d9d9",
                  color: "#333",
                  borderRadius: 6,
                  fontSize: 12,
                  height: 28,
                  padding: "0 12px",
                }}
              >
                View
              </Button>
            </Tooltip>
          );
        },
      };
    }

    return col;
  });

  const columns = getColumns();

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
          className="doc-table"
          columns={columns}
          dataSource={categoryDocs}
          pagination={{
            pageSize,
            hideOnSinglePage: false,
            size: "small",
            position: ["bottomRight"],
            showSizeChanger: false,
          }}
          rowKey="docIdx"
          size="small"
          tableLayout="auto"
          scroll={{ x: 1180 }}
          locale={{
            emptyText: "No documents available",
          }}
        />
      </div>
    );
  };

  // If only one category or less, show single table without tabs
  if (categories.length <= 1) {
    return (
      <div
        className="creator-card creator-completed-docs-card"
        style={{
          marginBottom: 0,
          overflow: "hidden",
          borderColor: "rgba(214, 189, 152, 0.2)",
          boxShadow: "0 1px 2px rgba(26, 54, 54, 0.06)",
        }}
      >
        <div className="creator-card__header">Required Documents</div>
        <div
          className="creator-card__body"
          style={{
            padding: 0,
            overflow: "hidden",
          }}
        >
          <style>{`
            .creator-completed-docs-card .creator-card__header {
              border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
            }
            .creator-completed-docs-card .creator-card__body {
              display: flex;
              flex-direction: column;
            }
            .creator-completed-docs-card .ant-table-wrapper .ant-table-thead,
            .creator-completed-docs-card .ant-table-wrapper .ant-table-thead > tr,
            .creator-completed-docs-card .ant-table-wrapper .ant-table-thead > tr > th {
              background: var(--color-white) !important;
              border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
              box-shadow: none !important;
            }
            .creator-completed-docs-card .ant-table-wrapper .ant-table-header,
            .creator-completed-docs-card .ant-table-wrapper .ant-table-container {
              background: var(--color-white) !important;
            }
            .doc-table.ant-table .ant-table-thead > tr > th {
              padding: 9px 12px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
              color: var(--color-heading) !important;
              background: var(--color-white) !important;
              border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              line-height: 1.2 !important;
            }
            .doc-table.ant-table .ant-table-tbody > tr > td {
              padding: 8px 12px !important;
              font-size: 12px !important;
              color: var(--color-heading-light) !important;
              line-height: 1.45 !important;
              vertical-align: middle !important;
              border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
              background: var(--color-white) !important;
            }
            .doc-table .ant-table-container,
            .doc-table .ant-table-content,
            .doc-table .ant-table-body,
            .doc-table .ant-table-cell {
              background: var(--color-white) !important;
            }
            .doc-table table {
              width: 100% !important;
              table-layout: auto !important;
            }
            .doc-table .ant-input,
            .doc-table .ant-input-textarea {
              font-size: 12px !important;
            }
            .doc-table .ant-btn-sm {
              font-size: 12px !important;
              height: 28px !important;
              padding: 0 8px !important;
            }
            .doc-table .ant-input-affix-wrapper,
            .doc-table .ant-input,
            .doc-table .ant-input-textarea textarea {
              padding-top: 4px !important;
              padding-bottom: 4px !important;
            }
            .doc-table .ant-btn-sm .anticon {
              font-size: 12px !important;
            }
            .doc-table .ant-pagination {
              margin: 12px 16px 14px !important;
              justify-content: flex-end;
            }
            .doc-table .ant-table-tbody > tr:hover > td {
              background: rgba(214, 189, 152, 0.05) !important;
            }
          `}</style>

          {categories.map((category) => renderCategoryTable(category))}
        </div>
      </div>
    );
  }

  // Multiple categories - use tabs
  return (
    <div
      className="creator-card creator-completed-docs-card"
      style={{
        marginBottom: 0,
        overflow: "hidden",
        borderColor: "rgba(214, 189, 152, 0.2)",
        boxShadow: "0 1px 2px rgba(26, 54, 54, 0.06)",
      }}
    >
      <div className="creator-card__header">Required Documents</div>
      <div
        className="creator-card__body"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <style>{`
          .creator-completed-docs-card .creator-card__header {
            border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
          }
          .creator-completed-docs-card .creator-card__body {
            display: flex;
            flex-direction: column;
          }
          .creator-completed-docs-card .ant-table-wrapper .ant-table-thead,
          .creator-completed-docs-card .ant-table-wrapper .ant-table-thead > tr,
          .creator-completed-docs-card .ant-table-wrapper .ant-table-thead > tr > th {
            background: var(--color-white) !important;
            border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
            box-shadow: none !important;
          }
          .creator-completed-docs-card .ant-table-wrapper .ant-table-header,
          .creator-completed-docs-card .ant-table-wrapper .ant-table-container {
            background: var(--color-white) !important;
          }
          .doc-table.ant-table .ant-table-thead > tr > th {
            padding: 9px 12px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--color-heading) !important;
            background: var(--color-white) !important;
            border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            line-height: 1.2 !important;
          }
          .doc-table.ant-table .ant-table-tbody > tr > td {
            padding: 8px 12px !important;
            font-size: 12px !important;
            color: var(--color-heading-light) !important;
            line-height: 1.45 !important;
            vertical-align: middle !important;
            border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
            background: var(--color-white) !important;
          }
          .doc-table .ant-table-container,
          .doc-table .ant-table-content,
          .doc-table .ant-table-body,
          .doc-table .ant-table-cell {
            background: var(--color-white) !important;
          }
          .doc-table table {
            width: 100% !important;
            table-layout: auto !important;
          }
          .doc-table .ant-input,
          .doc-table .ant-input-textarea {
            font-size: 12px !important;
          }
          .doc-table .ant-btn-sm {
            font-size: 12px !important;
            height: 28px !important;
            padding: 0 8px !important;
          }
          .doc-table .ant-input-affix-wrapper,
          .doc-table .ant-input,
          .doc-table .ant-input-textarea textarea {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }
          .doc-table .ant-btn-sm .anticon {
            font-size: 12px !important;
          }
          .doc-table .ant-pagination {
            margin: 12px 16px 14px !important;
            justify-content: flex-end;
          }
          .doc-table .ant-table-tbody > tr:hover > td {
            background: rgba(214, 189, 152, 0.05) !important;
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
                    className="doc-table"
                    columns={columns}
                    dataSource={groupedDocs[category]}
                    pagination={{
                      pageSize,
                      hideOnSinglePage: false,
                      size: "small",
                      position: ["bottomRight"],
                      showSizeChanger: false,
                    }}
                    rowKey="docIdx"
                    size="small"
                    tableLayout="auto"
                    scroll={{ x: 1180 }}
                    locale={{
                      emptyText: "No documents available",
                    }}
                  />
                </div>
              </TabPane>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default DocumentsTable;