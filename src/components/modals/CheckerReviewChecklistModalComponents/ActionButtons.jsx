import React from "react";
import { Button, Space, Tooltip, message, Upload } from "antd";
import {
  SaveOutlined,
  UploadOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PDFGenerator from "./PDFGenerator";
import "../../../styles/creatorDesignSystem.css";

const ActionButtons = ({
  checklist,
  docs,
  supportingDocs = [],
  comments,
  auth,
  effectiveReadOnly,
  isSavingDraft,
  uploadingSupportingDoc,
  isDisabled,
  canApproveChecklist,
  canReturnToCreator,
  handleSaveDraft,
  handleUploadSupportingDoc,
  setConfirmAction,
  documentStats,
  total,
  getApproveButtonTooltip,
  getReturnToCreatorTooltip,
}) => {
  const { checkerReviewed, checkerRejected, checkerApproved } = documentStats;

  // Use the passed tooltip function or create a default one
  const approveTooltipText = getApproveButtonTooltip
    ? getApproveButtonTooltip()
    : (() => {
        if (isDisabled) return "Checklist is not in review state";
        if (checkerReviewed !== total)
          return `${total - checkerReviewed} document(s) not reviewed yet`;
        if (checkerRejected > 0)
          return `${checkerRejected} document(s) rejected`;
        if (checkerApproved !== total)
          return `${total - checkerApproved} document(s) not approved`;
        return "Approve this checklist";
      })();

  // Return to creator tooltip
  const returnToCreatorTooltipText = getReturnToCreatorTooltip
    ? getReturnToCreatorTooltip()
    : (() => {
        if (isDisabled) return "Checklist is not in review state";
        if (checkerRejected === 0) return "No rejected documents to return";
        return `Return checklist to creator with ${checkerRejected} rejected document(s)`;
      })();

  const buttonDisabledStyle = {
    background: "#D1D5DB !important",
    borderColor: "#D1D5DB !important",
    color: "#FFFFFF !important",
    borderRadius: "6px",
    fontWeight: 600,
    border: "none !important",
  };

  return (
    <>
      <style>{`
        .checker-action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px 16px;
        }
        .checker-action-buttons .ant-space {
          display: flex !important;
          align-items: center !important;
          gap: 8px 8px !important;
        }
        .checker-action-buttons__group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .checker-action-buttons .ant-space-item {
          display: flex;
          align-items: center;
        }
        .checker-action-buttons .ant-upload-wrapper {
          display: inline-flex;
          align-items: center;
        }
        .checker-action-buttons .ant-upload-wrapper .ant-btn,
        .checker-action-buttons .review-action-button.ant-btn {
          min-height: 34px !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          border: none !important;
        }
        .checker-action-buttons .ant-upload-wrapper .ant-btn,
        .checker-action-buttons .pdf-generator-btn.ant-btn,
        .checker-action-buttons .review-action-button.ant-btn,
        .checker-action-buttons .ant-upload-wrapper .ant-btn:hover,
        .checker-action-buttons .ant-upload-wrapper .ant-btn:focus,
        .checker-action-buttons .ant-upload-wrapper .ant-btn:active,
        .checker-action-buttons .pdf-generator-btn.ant-btn:hover,
        .checker-action-buttons .pdf-generator-btn.ant-btn:focus,
        .checker-action-buttons .pdf-generator-btn.ant-btn:active,
        .checker-action-buttons .review-action-button.ant-btn:hover,
        .checker-action-buttons .review-action-button.ant-btn:focus,
        .checker-action-buttons .review-action-button.ant-btn:active {
          background: var(--ncb-primary-500) !important;
          border-color: transparent !important;
          color: #6B7280 !important;
        }
        .checker-action-buttons .ant-upload-wrapper .ant-btn span,
        .checker-action-buttons .pdf-generator-btn.ant-btn span,
        .checker-action-buttons .review-action-button.ant-btn span {
          color: #6B7280 !important;
        }
        .checker-action-buttons .ant-upload-wrapper .ant-btn:disabled,
        .checker-action-buttons .ant-upload-wrapper .ant-btn[disabled],
        .checker-action-buttons .pdf-generator-btn.ant-btn:disabled,
        .checker-action-buttons .pdf-generator-btn.ant-btn[disabled],
        .checker-action-buttons .review-action-button.ant-btn:disabled,
        .checker-action-buttons .review-action-button.ant-btn[disabled] {
          background: #D1D5DB !important;
          border-color: #D1D5DB !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .checker-action-buttons .ant-upload-wrapper .ant-btn:disabled span,
        .checker-action-buttons .ant-upload-wrapper .ant-btn[disabled] span,
        .checker-action-buttons .pdf-generator-btn.ant-btn:disabled span,
        .checker-action-buttons .pdf-generator-btn.ant-btn[disabled] span,
        .checker-action-buttons .review-action-button.ant-btn:disabled span,
        .checker-action-buttons .review-action-button.ant-btn[disabled] span {
          color: #FFFFFF !important;
        }
        .checker-action-buttons .ant-btn .anticon {
          font-size: 13px;
        }
        @media (max-width: 767px) {
          .checker-action-buttons {
            align-items: stretch;
          }
          .checker-action-buttons__group,
          .checker-action-buttons .ant-space {
            width: 100%;
          }
        }
      `}</style>
      <div className="checker-action-buttons" style={{ padding: 16 }}>
        {/* Left Buttons - 3 buttons */}
        <Space wrap className="checker-action-buttons__group">
          {/* Save Draft */}
          {!effectiveReadOnly && (
            <Button
              key="save-draft"
              className="review-action-button"
              onClick={handleSaveDraft}
              loading={isSavingDraft}
              disabled={isDisabled}
              icon={<SaveOutlined />}
              style={isDisabled ? buttonDisabledStyle : undefined}
            >
              Save Draft
            </Button>
          )}

          {/* Upload Supporting Doc */}
          {!effectiveReadOnly && (
            <Upload
              key="upload-support"
              showUploadList={false}
              beforeUpload={(file) => {
                handleUploadSupportingDoc(file);
                return false;
              }}
              disabled={isDisabled || uploadingSupportingDoc}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            >
              <Button
                className="review-action-button"
                icon={<UploadOutlined />}
                disabled={isDisabled}
                loading={uploadingSupportingDoc}
                style={isDisabled ? buttonDisabledStyle : undefined}
              >
                Upload Supporting Doc
              </Button>
            </Upload>
          )}

          {/* PDF Generator */}
          <PDFGenerator
            checklist={{
              ...checklist,
              dclNo: checklist?.dclNo || checklist?._id,
              rmName:
                checklist?.rmName ||
                auth?.user?.name ||
                auth?.user?.username ||
                "Relationship Manager",
            }}
            docs={docs}
            supportingDocs={supportingDocs}
            creatorComment=""
            comments={comments}
            className="review-action-button"
          />
        </Space>

        {/* Right Buttons - 2 buttons */}
        <Space wrap className="checker-action-buttons__group">
          {/* Return to Creator */}
          {!effectiveReadOnly && (
            <Tooltip title={returnToCreatorTooltipText}>
              <Button
                key="return"
                className="review-action-button"
                onClick={() => setConfirmAction("co_creator_review")}
                disabled={!canReturnToCreator() || effectiveReadOnly}
                icon={<SendOutlined />}
                style={
                  !canReturnToCreator() || effectiveReadOnly
                    ? buttonDisabledStyle
                    : undefined
                }
              >
                Return to Creator
              </Button>
            </Tooltip>
          )}

          {/* Approve Checklist */}
          {!effectiveReadOnly && (
            <Tooltip title={approveTooltipText}>
              <Button
                key="approve"
                className="review-action-button"
                type="primary"
                disabled={!canApproveChecklist() || effectiveReadOnly}
                onClick={() => {
                  if (!canApproveChecklist()) {
                    message.error(approveTooltipText);
                    return;
                  }
                  setConfirmAction("approved");
                }}
                icon={<CheckCircleOutlined />}
                style={
                  !canApproveChecklist() || effectiveReadOnly
                    ? buttonDisabledStyle
                    : undefined
                }
              >
                Approve Checklist
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>
    </>
  );
};

export default ActionButtons;
