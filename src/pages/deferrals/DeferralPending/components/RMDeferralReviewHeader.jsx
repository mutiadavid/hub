import React from "react";
import { Button } from "antd";
import { LeftOutlined, UnorderedListOutlined } from "@ant-design/icons";

const RMDeferralReviewHeader = ({ deferral, headerTag, documentCount, onClose, onViewDocuments }) => {
  return (
    <div className="deferral-review-topbar">
      <div className="deferral-review-topbar__main">
        <Button className="deferral-review-topbar__back" onClick={onClose}>
          <LeftOutlined />
          Back
        </Button>

        <div style={{ minWidth: 0 }}>
          <div className="deferral-review-topbar__title">
            {headerTag
              ? `${headerTag}: ${deferral?.deferralNumber}`
              : deferral?.deferralNumber || "Deferral Review"}
          </div>
          <div className="deferral-review-topbar__subtitle">
            {deferral?.customerName || "Deferral workspace"}
          </div>
        </div>
      </div>

      <Button className="deferral-review-topbar__docs" onClick={onViewDocuments}>
        <UnorderedListOutlined />
        View Documents
        <span className="deferral-review-topbar__count">{documentCount}</span>
      </Button>
    </div>
  );
};

export default RMDeferralReviewHeader;