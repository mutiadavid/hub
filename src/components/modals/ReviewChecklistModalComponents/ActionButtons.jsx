import React from "react";
import { Button, Space, Upload, message } from "antd";
import {
  SaveOutlined,
  UploadOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PDFGenerator from "./PDFGenerator";
import dayjs from "dayjs";
import {
  getComplianceDocumentsMissingResolvedExpiry,
  getExpiryMeta,
  getNaReasonMissingDocs,
} from "../../../utils/documentUtils";
import "../../../styles/creatorDesignSystem.css";

const ActionButtons = ({
  readOnly,
  isActionDisabled,
  shouldGrayOut = false,
  isSubmittingToRM,
  isCheckerSubmitting,
  isSavingDraft,
  uploadingSupportingDoc = false,
  checklist,
  docs,
  supportingDocs,
  creatorComment,
  auth,
  onSaveDraft,
  onSubmitToRM,
  onSubmitToCheckers,
  onUploadSupportingDoc,
  onClose,
  comments,
  isLockedBySomeoneElse = false,
  lockedByUserName = "",
}) => {
  // Check if any compliance document has expired
  const hasExpiredDocuments = React.useMemo(() => {
    return docs.some((doc) => {
      const expiryMeta = getExpiryMeta(doc.expiryDate);
      return expiryMeta?.status === "expired";
    });
  }, [docs]);

  // Check if any compliance document is missing expiry date
  const complianceDocsMissingExpiry = React.useMemo(
    () => getComplianceDocumentsMissingResolvedExpiry(docs),
    [docs],
  );

  const hasComplianceDocsMissingExpiry = complianceDocsMissingExpiry.length > 0;
  const naReasonMissingDocs = React.useMemo(() => getNaReasonMissingDocs(docs), [docs]);
  const hasNaReasonMissingDocs = naReasonMissingDocs.length > 0;
  const requiresComplianceExpiryForRmSubmission = ["cocreatorreview", "co_creator_review"].includes(
    checklist?.status?.toLowerCase(),
  );

  // Submit to CoChecker: All documents must have final status (tbo, sighted, deferred, submitted, etc.)
  const canSubmitToCoChecker =
    checklist?.status?.toLowerCase() === "cocreatorreview" &&
    docs.length > 0 &&
    !hasExpiredDocuments && // Block submission if any document is expired
    !hasComplianceDocsMissingExpiry && // Block submission if compliance docs don't have expiry set
    !hasNaReasonMissingDocs &&
    docs.every((doc) => {
      const docStatus = (doc.action || doc.status || "").toLowerCase();
      return [
        "submitted_for_review",
        "sighted",
        "waived",
        "deferred",
        "tbo",
        "approved",
        "submitted",
      ].includes(docStatus);
    });

  // const allDocsApproved = docs.length > 0 && docs.every((doc) => doc.action === "submitted"); // Unused

  const canSubmitToRM =
    ["pending", "cocreatorreview", "co_creator_review"].includes(
      checklist?.status?.toLowerCase(),
    ) &&
    docs.length > 0 &&
    (!requiresComplianceExpiryForRmSubmission || !hasComplianceDocsMissingExpiry) &&
    docs.some((doc) => (doc.status || "").toLowerCase() === "pendingrm");

  // Fixed: Wrapper functions that handle close after submission
  const handleSubmitToRM = async () => {
    if (requiresComplianceExpiryForRmSubmission && hasComplianceDocsMissingExpiry) {
      message.error(
        `Cannot submit to RM: ${complianceDocsMissingExpiry.length} compliance document(s) missing a valid expiry date. Set the expiry date so the document shows Current or Expired before submission.`,
      );
      return false;
    }

    if (onSubmitToRM) {
      const result = await onSubmitToRM();
      // If submission was successful, close the modal
      if (result !== false) {
        // Assuming the function returns false on error
        onClose();
      }
    }
  };

  // Fixed: Wrapper functions that handle close after submission
  const handleSubmitToCheckers = async () => {
    // Check for expired documents before submission
    if (hasExpiredDocuments) {
      const expiredDocs = docs.filter(
        (doc) => doc.expiryDate && dayjs(doc.expiryDate).isBefore(dayjs()),
      );
      message.error(
        `Cannot submit to checker: ${expiredDocs.length} expired document(s) found. Please update expired documents before submission.`,
      );
      return false;
    }

    // Check for compliance documents missing expiry date
    if (hasComplianceDocsMissingExpiry) {
      message.error(
        `Cannot submit to Co-Checker: ${complianceDocsMissingExpiry.length} compliance document(s) missing a valid expiry date. Set the expiry date so the document shows Current or Expired before submission.`,
      );
      return false;
    }

    if (hasNaReasonMissingDocs) {
      message.error(
        `Cannot submit to Co-Checker: ${naReasonMissingDocs.length} N/A document(s) are missing a valid reason. Enter a reason in the Creator Comment column for each waived document before submission.`,
      );
      return false;
    }

    if (onSubmitToCheckers) {
      const result = await onSubmitToCheckers();
      // If submission was successful, close the modal
      if (result !== false) {
        // Assuming the function returns false on error
        onClose();
      }
    }
  };

  const buttonDisabledStyle = {
    background: "#CCCCCC !important",
    borderColor: "#CCCCCC !important",
    color: "#FFFFFF !important",
    borderRadius: "6px",
    fontWeight: 600,
    border: "none !important",
  };

  return (
    <>
      <style>{`
        .review-action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 16px;
        }
        .review-action-buttons .ant-space {
          display: flex !important;
          align-items: center !important;
          gap: 8px 8px !important;
        }
        .review-action-buttons .ant-space-item {
          display: flex;
          align-items: center;
        }
        .review-action-buttons .ant-upload-wrapper {
          display: inline-flex;
          align-items: center;
        }
        .review-action-buttons .ant-upload-wrapper .ant-btn,
        .review-action-buttons .pdf-generator-btn.ant-btn,
        .review-action-buttons .review-action-button.ant-btn {
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
        .review-action-buttons .ant-upload-wrapper .ant-btn,
        .review-action-buttons .pdf-generator-btn.ant-btn,
        .review-action-buttons .review-action-button.ant-btn,
        .review-action-buttons .ant-upload-wrapper .ant-btn:hover,
        .review-action-buttons .ant-upload-wrapper .ant-btn:focus,
        .review-action-buttons .ant-upload-wrapper .ant-btn:active,
        .review-action-buttons .pdf-generator-btn.ant-btn:hover,
        .review-action-buttons .pdf-generator-btn.ant-btn:focus,
        .review-action-buttons .pdf-generator-btn.ant-btn:active,
        .review-action-buttons .review-action-button.ant-btn:hover,
        .review-action-buttons .review-action-button.ant-btn:focus,
        .review-action-buttons .review-action-button.ant-btn:active {
          background: linear-gradient(135deg, #1A3636 0%, #40534C 100%) !important;
          border-color: transparent !important;
          color: #FFFFFF !important;
        }
        .review-action-buttons .ant-upload-wrapper .ant-btn span,
        .review-action-buttons .pdf-generator-btn.ant-btn span,
        .review-action-buttons .review-action-button.ant-btn span {
          color: #FFFFFF !important;
        }
        .review-action-buttons .ant-upload-wrapper .ant-btn:disabled,
        .review-action-buttons .ant-upload-wrapper .ant-btn[disabled],
        .review-action-buttons .pdf-generator-btn.ant-btn:disabled,
        .review-action-buttons .pdf-generator-btn.ant-btn[disabled],
        .review-action-buttons .review-action-button.ant-btn:disabled,
        .review-action-buttons .review-action-button.ant-btn[disabled] {
          background: #D1D5DB !important;
          border-color: #D1D5DB !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        .review-action-buttons .ant-upload-wrapper .ant-btn:disabled span,
        .review-action-buttons .ant-upload-wrapper .ant-btn[disabled] span,
        .review-action-buttons .pdf-generator-btn.ant-btn:disabled span,
        .review-action-buttons .pdf-generator-btn.ant-btn[disabled] span,
        .review-action-buttons .review-action-button.ant-btn:disabled span,
        .review-action-buttons .review-action-button.ant-btn[disabled] span {
          color: #FFFFFF !important;
        }
        .review-action-buttons .ant-btn .anticon {
          font-size: 13px;
        }
      `}</style>
      <div
        className="review-action-buttons"
        style={{
          padding: "16px",
        }}
      >
        {/* Left Buttons - 3 buttons */}
        <Space wrap>
          {/* Save Draft */}
          {!readOnly && (
            <Button
              key="save-draft"
              className="review-action-button"
              onClick={onSaveDraft}
              loading={isSavingDraft}
              disabled={shouldGrayOut}
              icon={<SaveOutlined />}
              style={shouldGrayOut ? buttonDisabledStyle : undefined}
            >
              Save Draft
            </Button>
          )}

          {/* Upload Supporting Doc */}
          {!readOnly && (
            <Upload
              key="upload-support"
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadSupportingDoc(file);
                return false;
              }}
              disabled={
                isActionDisabled || shouldGrayOut || uploadingSupportingDoc
              }
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            >
              <Button
                className="review-action-button"
                icon={<UploadOutlined />}
                disabled={shouldGrayOut}
                loading={uploadingSupportingDoc}
                style={shouldGrayOut ? buttonDisabledStyle : undefined}
              >
                Upload Supporting Doc
              </Button>
            </Upload>
          )}

          {/* PDF Generator */}
          <PDFGenerator
            checklist={{
              ...checklist,
              rmName:
                checklist?.assignedToRM?.name ||
                checklist?.rmName ||
                auth?.user?.name ||
                auth?.user?.username ||
                "Relationship Manager",
            }}
            docs={docs}
            supportingDocs={supportingDocs}
            creatorComment={creatorComment}
            comments={comments}
            size="small"
            className="review-action-button"
          />
        </Space>

        {/* Right Buttons - 2 buttons */}
        <Space wrap>
          {/* Submit to RM */}
          {!readOnly && (
            <Button
              key="submit"
              className="review-action-button"
              type="primary"
              disabled={
                isActionDisabled ||
                !canSubmitToRM ||
                shouldGrayOut ||
                isLockedBySomeoneElse
              }
              loading={isSubmittingToRM}
              onClick={handleSubmitToRM}
              icon={<SendOutlined />}
              title={
                isLockedBySomeoneElse
                  ? `Locked by ${lockedByUserName}`
                  : undefined
              }
              style={
                isActionDisabled ||
                !canSubmitToRM ||
                shouldGrayOut ||
                isLockedBySomeoneElse
                  ? buttonDisabledStyle
                  : undefined
              }
            >
              Submit to RM{" "}
              {isLockedBySomeoneElse && `(Locked by ${lockedByUserName})`}
            </Button>
          )}

          {/* Submit to Co-Checker */}
          {!readOnly && (
            <Button
              key="submit-checker"
              className="review-action-button"
              type="primary"
              loading={isCheckerSubmitting}
              onClick={handleSubmitToCheckers}
              disabled={
                !canSubmitToCoChecker || shouldGrayOut || isLockedBySomeoneElse
              }
              icon={<CheckCircleOutlined />}
              title={
                isLockedBySomeoneElse
                  ? `Locked by ${lockedByUserName}`
                  : undefined
              }
              style={
                !canSubmitToCoChecker || shouldGrayOut || isLockedBySomeoneElse
                  ? buttonDisabledStyle
                  : undefined
              }
            >
              Submit to Co-Checker{" "}
              {isLockedBySomeoneElse && `(Locked by ${lockedByUserName})`}
            </Button>
          )}
        </Space>
      </div>
    </>
  );
};

export default ActionButtons;
