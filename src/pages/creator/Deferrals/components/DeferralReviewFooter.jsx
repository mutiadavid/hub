import React from "react";
import { Button } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";

const actionBarClassName = "mb-3.5 flex flex-wrap justify-between gap-3 rounded-xl border border-[rgba(214,189,152,0.2)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(26,54,54,0.06)] max-md:flex-col max-md:items-stretch";
const actionGroupClassName = "flex flex-wrap gap-2";
const actionGroupEndClassName = "ml-auto flex flex-wrap gap-2 max-md:ml-0";
const actionButtonClassName = "h-[34px]! rounded-md! border-0! bg-(--ncb-primary-500)! px-3.5! text-xs! font-semibold! text-white! shadow-none! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! disabled:bg-[var(--color-disabled)]! disabled:border-[var(--color-disabled)]! disabled:text-white! [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:text-white! max-md:w-full";

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
    <div className={actionBarClassName}>
      <div className={actionGroupClassName}>
        <Button
          className={actionButtonClassName}
          disabled={!canApprove || isLoading}
          onClick={onApprove}
          icon={<CheckCircleOutlined />}
        >
          {sourceTab === "closeRequests" ? "Submit Review" : "Accept"}
        </Button>
        <Button
          className={actionButtonClassName}
          disabled={!canReturnForRework || isLoading}
          onClick={onReturnForRework}
          icon={<ExclamationCircleOutlined />}
        >
          Return for Rework
        </Button>
      </div>
      <div className={actionGroupEndClassName}>
        <Button
          className={actionButtonClassName}
          icon={<FilePdfOutlined />}
          onClick={onDownloadPDF}
          disabled={isLoading}
        >
          Download PDF
        </Button>
        <Button
          className={actionButtonClassName}
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default DeferralReviewFooter;