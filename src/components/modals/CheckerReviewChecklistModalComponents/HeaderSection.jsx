import React from "react";
import { Button, Typography } from "antd";
import { CloseOutlined, FileTextOutlined } from "@ant-design/icons";
import "../../../styles/creatorDesignSystem.css";

const { Title } = Typography;

const HeaderSection = ({
  checklist,
  onClose,
  showDocumentSidebar,
  setShowDocumentSidebar,
  uploadedDocsCount,
}) => {
  return (
    <>
      <style>{`
        .checker-close-button {
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-radius: 6px !important;
          padding: 0 !important;
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .checker-close-button:hover {
          background: var(--color-white) !important;
          color: var(--color-primary-dark) !important;
        }
        .checker-close-button:active {
          background: var(--color-white) !important;
          color: var(--color-primary-dark) !important;
        }
        .checker-close-button .anticon {
          color: currentColor !important;
          font-size: 14px !important;
        }
        .checker-docs-button {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          background: var(--color-white) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-medium) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
        }
        .checker-docs-button:hover,
        .checker-docs-button:focus {
          background: var(--color-white) !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: none !important;
          color: var(--color-primary-dark) !important;
        }
        .checker-docs-button .anticon {
          color: currentColor !important;
          font-size: 13px !important;
        }
        .checker-docs-button .checker-docs-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-dark) !important;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
        }

        .checker-docs-button:hover .checker-docs-count,
        .checker-docs-button:focus .checker-docs-count {
          background: #f6f8ef !important;
          color: #164679 !important;
        }
      `}</style>
      <div
        className="modal-header"
        style={{
          background:
            "linear-gradient(180deg, rgba(245, 240, 231, 0.72) 0%, rgba(255, 255, 255, 0.98) 100%)",
          color: "var(--color-text-dark)",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(214, 189, 152, 0.2)",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Title
              level={4}
              style={{ color: "var(--color-text-dark)", margin: 0, fontWeight: 700, fontSize: 18 }}
            >
              Review Checklist
            </Title>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-light)",
                padding: 0,
                borderRadius: "12px",
                fontWeight: 500,
              }}
            >
              DCL: {checklist?.dclNo || "N/A"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              className="checker-docs-button"
              onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
              icon={<FileTextOutlined />}
            >
              <span>View Documents</span>
              {uploadedDocsCount > 0 && (
                <span className="checker-docs-count">
                  {uploadedDocsCount}
                </span>
              )}
            </Button>
            <Button
              className="checker-close-button"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderSection;
