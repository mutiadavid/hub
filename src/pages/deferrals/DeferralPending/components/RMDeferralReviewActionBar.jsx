import React from "react";
import { Button } from "antd";
import { FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";

const RMDeferralReviewActionBar = ({
  activeTab,
  readOnly = false,
  confirmingApprovers,
  onEditApprovers,
  withdrawLoading,
  onWithdraw,
  onResubmit,
  resubmitLoading,
  extensionSubmissionSuccess,
  hasOpenExtensionRequest,
  onApplyExtension,
  closeLoading,
  onOpenCloseRequest,
  normalizedStatus,
  onDownloadPDF,
  downloadLoading,
  onClose,
}) => {
  return (
    <div className="deferral-review-actionbar">
      <div className="deferral-review-actionbar__group">
        {!readOnly && activeTab === "pending" && (
          <Button
            className="deferral-review-actionbar__button"
            icon={<FileTextOutlined />}
            onClick={onEditApprovers}
            disabled={confirmingApprovers}
          >
            Edit Approvers
          </Button>
        )}

        {!readOnly && activeTab === "pending" && (
          <Button
            className="deferral-review-actionbar__button"
            loading={withdrawLoading}
            onClick={onWithdraw}
          >
            Withdraw
          </Button>
        )}

        {!readOnly && activeTab === "rejected" && (
          <Button
            className="deferral-review-actionbar__button"
            onClick={onResubmit}
            loading={resubmitLoading}
          >
            Resubmit Deferral
          </Button>
        )}

        {!readOnly && activeTab === "approved" && !extensionSubmissionSuccess && !hasOpenExtensionRequest && (
          <>
            <Button
              className="deferral-review-actionbar__button"
              onClick={onApplyExtension}
            >
              Apply Extension
            </Button>
            <Button
              className="deferral-review-actionbar__button"
              loading={closeLoading}
              onClick={onOpenCloseRequest}
            >
              Close Deferral
            </Button>
          </>
        )}

      </div>

      <div className="deferral-review-actionbar__group deferral-review-actionbar__group--end">
        <Button
          className="deferral-review-actionbar__button"
          icon={<FilePdfOutlined />}
          onClick={onDownloadPDF}
          loading={downloadLoading}
        >
          Download PDF
        </Button>
        <Button className="deferral-review-actionbar__button" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default RMDeferralReviewActionBar;