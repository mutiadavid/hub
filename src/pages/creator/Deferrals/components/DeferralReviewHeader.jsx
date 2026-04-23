import React from "react";
import { Button } from "antd";
import { LeftOutlined, UnorderedListOutlined } from "@ant-design/icons";

const headerClassName = "mb-4 flex flex-wrap items-start justify-between gap-3";
const mainClassName = "flex flex-wrap items-start gap-2";
const backButtonClassName = "rounded-md border-[rgba(214,189,152,0.35)] bg-white px-3 py-2 text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.45)] hover:bg-white hover:text-(--color-text-dark)";
const docsButtonClassName = "inline-flex items-center gap-2 rounded-lg border-[rgba(214,189,152,0.2)] bg-white px-3 py-2 text-(--color-text-medium) shadow-none hover:border-[rgba(214,189,152,0.32)] hover:bg-[#faf7f2] hover:text-(--color-text-dark) max-md:w-full";
const countClassName = "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[rgba(214,189,152,0.2)] px-[5px] text-[9px] font-semibold text-(--color-text-dark)";

const DeferralReviewHeader = ({ deferral, onClose, onViewDocuments, documentCount }) => {
  return (
    <div className={headerClassName}>
      <div className={mainClassName}>
        <Button className={backButtonClassName} onClick={onClose}>
          <LeftOutlined />
          Back
        </Button>

        <div className="min-w-0">
          <div className="text-base font-bold text-(--color-primary-dark)">{deferral?.deferralNumber || "Deferral Review"}</div>
          <div className="mt-1 text-xs text-(--color-text-subtle)">{deferral?.customerName || "Deferral workspace"}</div>
        </div>
      </div>

      <Button className={docsButtonClassName} onClick={onViewDocuments}>
        <UnorderedListOutlined />
        View Documents
        <span className={countClassName}>{documentCount}</span>
      </Button>
    </div>
  );
};

export default DeferralReviewHeader;