import React from "react";
import { Table, Tag, Button, Tooltip } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { openFileInNewTab } from "../../../utils/fileUtils";
import { formatStatusForSnakeCase } from "../../../utils/statusColors";
import "../../../styles/creatorDesignSystem.css";

const cardFontFamily = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif";
const gray700 = "#374151";

const getStatusTextColor = (status) => {
  const normalizedStatus = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "");

  if (
    normalizedStatus.includes("submitted") ||
    normalizedStatus.includes("approved") ||
    normalizedStatus.includes("sighted")
  ) {
    return "#52C41A";
  }

  if (
    normalizedStatus.includes("deferred") ||
    normalizedStatus.includes("waived") ||
    normalizedStatus.includes("tbo") ||
    normalizedStatus.includes("deferralrequested")
  ) {
    return "#FAAD14";
  }

  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("rejected")
  ) {
    return "#FF4D4F";
  }

  return gray700;
};

const DocumentTable = ({
  docs,
  isDisabled,
  onViewFile,
  effectiveReadOnly,
  handleDocApprove,
  handleDocReject,
  handleDocReset,
}) => {
  const rowButtonBaseStyle = {
    minWidth: 84,
    borderRadius: 6,
    fontWeight: 600,
    boxShadow: "none",
    height: 28,
    fontSize: 12,
    fontFamily: cardFontFamily,
  };

  const approveButtonStyle = {
    ...rowButtonBaseStyle,
    backgroundColor: "#F6FBF7",
    borderColor: "#B7E4C7",
    color: "#1F7A3D",
  };

  const rejectButtonStyle = {
    ...rowButtonBaseStyle,
    backgroundColor: "#FFF5F5",
    borderColor: "#F8B4B4",
    color: "#C53030",
  };

  const neutralButtonStyle = {
    ...rowButtonBaseStyle,
    backgroundColor: "#FFFFFF",
    borderColor: "#D6BD98",
    color: "#40534C",
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 150,
      render: (text) => (
        <span
          style={{
            fontSize: 12,
            color: gray700,
            fontWeight: 500,
            lineHeight: 1.45,
            display: "block",
            whiteSpace: "normal",
            wordBreak: "break-word",
            fontFamily: cardFontFamily,
          }}
        >
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 240,
      render: (text, record) => {
        const docName =
          text || record.documentName || `Document ${record.docIdx + 1}`;
        return (
          <Tooltip title={docName}>
            <span
              style={{
                fontSize: 12,
                color: gray700,
                lineHeight: 1.45,
                display: "block",
                whiteSpace: "normal",
                wordBreak: "break-word",
                fontFamily: cardFontFamily,
              }}
            >
              {docName}
            </span>
          </Tooltip>
        );
      },
    },

    {
      title: "CO Status",
      dataIndex: "coStatus",
      width: 112,
      render: (status, record) => {
        const actualStatus = status || record.status || "pending";
        const displayText = formatStatusForSnakeCase(actualStatus || "pending");

        return (
          <Tooltip title={displayText}>
            <span
              className="doc-table-status-text"
              style={{
                color: getStatusTextColor(actualStatus),
                fontWeight: 600,
                fontSize: 12,
                textTransform: "capitalize",
                fontFamily: cardFontFamily,
              }}
            >
              {displayText}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "CO Comment",
      dataIndex: "comment",
      width: 180,
      render: (text, record) => {
        const comment = text || record.coComment;
        const hasComment = comment && comment.trim() !== "";

        return (
          <Tooltip title={hasComment ? comment : "No comment"}>
            <span
              style={{
                display: "block",
                fontSize: 12,
                color: hasComment ? gray700 : "#6b7280",
                fontStyle: hasComment ? "normal" : "italic",
                lineHeight: 1.45,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: cardFontFamily,
              }}
            >
              {hasComment ? comment : "-"}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 170,
      render: (deferralNo) => (
        <Tooltip title={deferralNo || "No deferral number"}>
          <span
            style={{
              fontSize: 12,
              color: "#b45309",
              fontWeight: 600,
              whiteSpace: "nowrap",
              wordBreak: "normal",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "inline-block",
              maxWidth: "100%",
              fontFamily: cardFontFamily,
            }}
          >
            {deferralNo || "-"}
          </span>
        </Tooltip>
      ),
    },

    {
      title: "Checker Status",
      dataIndex: "checkerStatus",
      width: 112,
      render: (status) => {
        const lowerStatus = status?.toLowerCase() || "pending";
        let color = "#FF4D4F";
        let label = "Pending";

        if (lowerStatus === "approved") {
          color = "#52C41A";
          label = "Approved";
        } else if (lowerStatus === "rejected") {
          color = "#FF4D4F";
          label = "Rejected";
        }

        return (
          <Tooltip title={label}>
            <span
              className="doc-table-status-text"
              style={{
                color,
                fontWeight: 600,
                fontSize: 12,
                textTransform: "capitalize",
                fontFamily: cardFontFamily,
              }}
            >
              {label}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record, index) => {
        const isApproved = record.checkerStatus === "approved";
        const isRejected = record.checkerStatus === "rejected";

        if (effectiveReadOnly || isDisabled) {
          return (
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
                fontStyle: "italic",
                fontFamily: cardFontFamily,
              }}
            >
              {isApproved
                ? "Approved"
                : isRejected
                  ? "Rejected"
                  : "Pending review"}
            </span>
          );
        }

        return (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Button
              size="small"
              type="default"
              icon={<CheckOutlined />}
              onClick={() => handleDocApprove(index)}
              style={isApproved ? approveButtonStyle : neutralButtonStyle}
            >
              {isApproved ? "Approved" : "Approve"}
            </Button>
            <Button
              size="small"
              type="default"
              icon={<CloseOutlined />}
              onClick={() => handleDocReject(index)}
              style={isRejected ? rejectButtonStyle : neutralButtonStyle}
            >
              {isRejected ? "Rejected" : "Reject"}
            </Button>
            {(isApproved || isRejected) && (
              <Tooltip title="Reset to pending">
                <Button
                  size="small"
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    handleDocReset(index);
                  }}
                  style={{
                    ...neutralButtonStyle,
                    padding: "0 6px",
                    minWidth: "auto",
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "View",
      key: "view",
      width: 60,
      render: (_, record) =>
        record.fileUrl || record.uploadData?.fileUrl ? (
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              if (typeof onViewFile === "function") {
                onViewFile(record);
              } else {
                const fileUrl = record.fileUrl || record.uploadData?.fileUrl;
                if (fileUrl) {
                  openFileInNewTab(fileUrl);
                }
              }
            }}
            size="small"
            className="checker-modal-action"
            style={neutralButtonStyle}
          >
            View
          </Button>
        ) : (
          <Tooltip title="No file uploaded">
            <Tag color="default" style={{ backgroundColor: "#F3F4F6", color: "#6B7280", borderColor: "#E5E7EB" }}>
              No File
            </Tag>
          </Tooltip>
        ),
    },
  ];

  return (
    <div
      className="creator-card checker-review-docs-card"
      style={{
        marginBottom: 0,
        overflow: "hidden",
        borderColor: "rgba(226, 232, 240, 0.9)",
      }}
    >
      <style>{`
        .checker-review-docs-card .creator-card__header {
          border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
        }
        .checker-review-docs-card .creator-card__body {
          display: flex;
          flex-direction: column;
        }
        .checker-review-docs-card .ant-table-wrapper .ant-table-thead,
        .checker-review-docs-card .ant-table-wrapper .ant-table-thead > tr,
        .checker-review-docs-card .ant-table-wrapper .ant-table-thead > tr > th {
          border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
          box-shadow: none !important;
        }
        .checker-doc-table.ant-table .ant-table-container,
        .checker-doc-table.ant-table .ant-table-content,
        .checker-doc-table.ant-table .ant-table-body,
        .checker-doc-table.ant-table .ant-table-cell {
          background: var(--color-white) !important;
        }
        .checker-doc-table table {
          width: 100% !important;
          table-layout: auto !important;
        }
        .checker-doc-table.ant-table .ant-table-thead > tr > th {
          padding: 9px 12px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: var(--color-text-medium) !important;
          background: var(--color-white) !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9) !important;
          text-transform: uppercase;
          font-family: ${cardFontFamily} !important;
        }
        .checker-doc-table.ant-table .ant-table-tbody > tr > td {
          padding: 8px 12px !important;
          font-size: 12px !important;
          color: var(--color-text-body) !important;
          line-height: 1.45 !important;
          vertical-align: middle !important;
          border-bottom: 1px solid rgba(226, 232, 240, 0.75) !important;
          font-family: ${cardFontFamily} !important;
        }
        .checker-doc-table .ant-table-cell {
          background: var(--color-white) !important;
        }
        .checker-doc-table .ant-tag {
          font-size: 11px !important;
          padding: 0 4px !important;
          height: 22px !important;
          line-height: 20px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 120px !important;
          font-family: ${cardFontFamily} !important;
        }
        .checker-doc-table .ant-btn-sm {
          font-size: 12px !important;
          padding: 0 8px !important;
          height: 28px !important;
          font-family: ${cardFontFamily} !important;
        }
        .checker-doc-table .ant-btn-sm .anticon {
          font-size: 12px !important;
        }
        .checker-doc-table .ant-btn-dangerous .anticon {
          font-size: 12px !important;
        }
        .checker-doc-table .checker-modal-action.ant-btn {
          background: #ffffff !important;
          border-color: #d6bd98 !important;
          color: #40534c !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          height: 28px !important;
          padding: 0 10px !important;
          font-family: ${cardFontFamily} !important;
        }
        .checker-doc-table .ant-btn[disabled],
        .checker-doc-table .ant-btn:disabled {
          background: #D1D5DB !important;
          border-color: #D1D5DB !important;
          color: #FFFFFF !important;
        }
        .checker-doc-table .ant-table-body {
          overflow-x: auto !important;
          overflow-y: auto !important;
        }
        .checker-doc-table .ant-table-placeholder .ant-table-cell {
          padding: 0 !important;
          border-bottom: none !important;
        }
        .checker-doc-table.ant-table .ant-table-tbody > tr:hover > td {
          background: rgba(148, 163, 184, 0.06) !important;
        }
      `}</style>
      <div className="creator-card__header">Required Documents</div>
      <div
        className="creator-card__body"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <Table
          className="checker-doc-table"
          columns={columns}
          dataSource={docs.map((doc, idx) => ({
            ...doc,
            key: doc.key || doc.id || doc._id || idx,
          }))}
          pagination={false}
          size="small"
          tableLayout="auto"
          scroll={{ x: 1450 }}
          locale={{
            emptyText: (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "var(--color-text-light)",
                }}
              >
                No documents found in this checklist
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default DocumentTable;
