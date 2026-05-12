import React from "react";
import { Button } from "antd";
import { BankOutlined, LeftOutlined, UnorderedListOutlined } from "@ant-design/icons";

const PRIMARY_BLUE = "var(--color-primary-dark)";

const DeferralReviewHeader = ({ deferral, onClose, onViewDocuments, documentCount }) => {
  return (
    <div className="flex justify-between items-start gap-3 flex-wrap mb-4">
      <div className="flex items-start gap-2 flex-wrap">
        <Button 
          className="px-3 py-2 rounded-md border border-[rgba(214,189,152,0.35)] text-gray-600 bg-white shadow-none hover:bg-gray-50"
          onClick={onClose}
        >
          <LeftOutlined className="text-sm" />
          <span className="text-xs font-semibold">Back</span>
        </Button>

        <div style={{ minWidth: 0 }}>
          <div className="text-base font-bold text-[#164679]">
            {deferral?.deferralNumber || "Deferral Review"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {deferral?.customerName || "Deferral workspace"}
          </div>
        </div>
      </div>

      <Button 
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[rgba(214,189,152,0.2)] bg-white text-gray-600 shadow-none hover:bg-gray-50"
        onClick={onViewDocuments}
      >
        <UnorderedListOutlined className="text-sm" />
        <span className="text-xs font-semibold">View Documents</span>
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[rgba(214,189,152,0.2)] text-gray-800 text-[9px] font-semibold">
          {documentCount}
        </span>
      </Button>
    </div>
  );
};

export default DeferralReviewHeader;