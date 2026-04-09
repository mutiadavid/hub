
import React from "react";
import { Card, Button, Space, Tag } from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "../../../styles/creatorDesignSystem.css";

const SupportingDocsSection = ({
  supportingDocs,
  readOnly,
  isActionDisabled,
  onDeleteSupportingDoc,
  onViewSupportingDoc,
}) => {
  if (!supportingDocs || supportingDocs.length === 0) return null;

  // Function to get role display name
  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case "rm":
        return "RM Upload";
      case "co_creator":
        return "CO Upload";
      case "checker":
        return "Checker Upload";
      default:
        return "Supporting";
    }
  };

  return (
    <div className="supporting-docs-section" style={{ marginTop: 24 }}>
      <style>{`
        .supporting-docs-section .supporting-docs-card.ant-card {
          border-radius: 8px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06) !important;
        }
        .supporting-docs-section .supporting-docs-card .ant-card-body {
          padding: 12px 14px !important;
        }
        .supporting-docs-section .supporting-docs-count.ant-tag,
        .supporting-docs-section .supporting-docs-role.ant-tag {
          margin-inline-end: 0 !important;
          border: none !important;
          border-radius: 999px !important;
          padding: 0 8px !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          line-height: 18px !important;
        }
        .supporting-docs-section .supporting-docs-count.ant-tag {
          background: rgba(26, 54, 54, 0.1) !important;
          color: var(--color-text-dark) !important;
        }
        .supporting-docs-section .supporting-docs-role.ant-tag {
          background: rgba(214, 189, 152, 0.18) !important;
          color: var(--color-text-dark) !important;
        }
        .supporting-docs-section .supporting-docs-action.ant-btn,
        .supporting-docs-section .supporting-docs-action.ant-btn:hover,
        .supporting-docs-section .supporting-docs-action.ant-btn:focus,
        .supporting-docs-section .supporting-docs-action.ant-btn:active {
          min-height: 30px !important;
          height: 30px !important;
          padding: 0 12px !important;
          border-radius: 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .supporting-docs-section .supporting-docs-action--view.ant-btn,
        .supporting-docs-section .supporting-docs-action--view.ant-btn:hover,
        .supporting-docs-section .supporting-docs-action--view.ant-btn:focus,
        .supporting-docs-section .supporting-docs-action--view.ant-btn:active {
          background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
          border: none !important;
          color: #FFFFFF !important;
        }
        .supporting-docs-section .supporting-docs-action--delete.ant-btn,
        .supporting-docs-section .supporting-docs-action--delete.ant-btn:hover,
        .supporting-docs-section .supporting-docs-action--delete.ant-btn:focus,
        .supporting-docs-section .supporting-docs-action--delete.ant-btn:active {
          background: #B42318 !important;
          border: none !important;
          color: #FFFFFF !important;
        }
        .supporting-docs-section .supporting-docs-action.ant-btn .anticon,
        .supporting-docs-section .supporting-docs-action.ant-btn span {
          color: inherit !important;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <PaperClipOutlined style={{ color: "var(--color-primary-dark)" }} />
        <h4
          style={{
            color: "var(--color-text-dark)",
            fontSize: 14,
            margin: 0,
            fontWeight: 600,
          }}
        >
          Supporting Documents & Other Uploads
        </h4>
        <Tag className="supporting-docs-count">{supportingDocs.length}</Tag>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {supportingDocs.map((doc) => (
          <Card
            size="small"
            key={doc.id || doc._id}
            className="supporting-docs-card"
            style={{
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontSize: 13 }}>
                    {doc.fileName || doc.name}
                  </strong>
                  <Tag className="supporting-docs-role">
                    {getRoleDisplayName(doc.uploadedByRole)}
                  </Tag>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-light)",
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    📅 {dayjs(doc.uploadedAt).format("DD MMM YYYY HH:mm")}
                  </span>
                  {doc.fileSize && (
                    <span>📦 {(doc.fileSize / 1024).toFixed(2)} KB</span>
                  )}
                  {doc.fileType && <span>📄 {doc.fileType}</span>}
                </div>
              </div>

              <Space>
                <Button
                  size="small"
                  className="supporting-docs-action supporting-docs-action--view"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    onViewSupportingDoc && onViewSupportingDoc(doc)
                  }
                >
                  View
                </Button>
                {!readOnly && !isActionDisabled && (
                  <Button
                    size="small"
                    className="supporting-docs-action supporting-docs-action--delete"
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      onDeleteSupportingDoc &&
                      onDeleteSupportingDoc(
                        doc.id || doc._id,
                        doc.fileName || doc.name,
                      )
                    }
                  >
                    Delete
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SupportingDocsSection;
