import React from "react";
import { Button } from "antd";
import { CloseOutlined, DownloadOutlined, RollbackOutlined, CheckOutlined } from "@ant-design/icons";

const PRIMARY_BLUE = "var(--color-primary-dark)";
const SUCCESS_GREEN = "var(--color-status-success)";

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
    <div className="bg-white border border-[rgba(214,189,152,0.2)] rounded-xl shadow-sm p-3 flex justify-between gap-3 flex-wrap mb-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          type="default"
          onClick={onDownloadPDF}
          className="min-h-[34px] h-[34px] px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-none border border-gray-300 hover:bg-gray-50"
          icon={<DownloadOutlined />}
        >
          Download Report
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap ml-auto">
        {canReturnForRework && (
          <Button
            onClick={onReturnForRework}
            loading={isLoading}
            className="min-h-[34px] h-[34px] px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-none border border-red-300 text-red-600 hover:bg-red-50"
            icon={<RollbackOutlined />}
          >
            Return for Rework
          </Button>
        )}

        {(sourceTab === "closeRequests" || canApprove) && (
          <Button
            type="primary"
            onClick={onApprove}
            loading={isLoading}
            className="min-h-[34px] h-[34px] px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-none bg-gradient-to-r from-[#164679] to-[#2a8cb5] border-none text-white hover:opacity-90"
            icon={<CheckOutlined />}
            style={{ background: PRIMARY_BLUE }}
          >
            {sourceTab === "closeRequests" ? "Submit Review" : "Accept Deferral"}
          </Button>
        )}

        <Button
          onClick={onClose}
          className="min-h-[34px] h-[34px] px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-none border border-gray-300 hover:bg-gray-50"
          icon={<CloseOutlined />}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default DeferralReviewFooter;