import React from "react";
import { Button } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";

const DeferralReviewFooter = ({
  canApprove,
  canReturnForRework,
  isLoading,
  onApprove,
  onReturnForRework,
  onDownloadPDF,
  onClose,
  sourceTab,
}) => {
  return (
    <div className="deferral-review-actionbar">
      <div className="deferral-review-actionbar__group">
        <Button
          className="deferral-review-actionbar__button"
          disabled={!canApprove || isLoading}
          onClick={onApprove}
          icon={<CheckCircleOutlined />}
        >
          {sourceTab === "closeRequests" ? "Submit Review" : "Accept"}
        </Button>
        <Button
          className="deferral-review-actionbar__button"
          disabled={!canReturnForRework || isLoading}
          onClick={onReturnForRework}
          icon={<ExclamationCircleOutlined />}
        >
          Return for Rework
        </Button>
      </div>
      <div className="deferral-review-actionbar__group deferral-review-actionbar__group--end">
        <Button
          className="deferral-review-actionbar__button"
          icon={<FilePdfOutlined />}
          onClick={onDownloadPDF}
          disabled={isLoading}
        >
          Download PDF
        </Button>
        <Button
          className="deferral-review-actionbar__button"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default DeferralReviewFooter;