import React from "react";
import { Tabs } from "antd";

/**
 * DeferralTabs Component
 * Tab navigation for different deferral states
 */
const DeferralTabs = ({
  activeTab,
  onTabChange,
  pendingCount,
  approvedCount,
  closeRequestsCount,
  extensionsCount,
}) => {
  const items = [
    { key: "pending", label: `My Queue (${pendingCount})` },
    { key: "approved", label: `Approved (${approvedCount})` },
    { key: "closeRequests", label: `Close Requests (${closeRequestsCount})` },
    { key: "extensions", label: `Extensions (${extensionsCount})` },
  ];

  return (
    <div className="deferrals-tabs">
      <Tabs activeKey={activeTab} onChange={onTabChange} items={items} />
    </div>
  );
};

export default DeferralTabs;
