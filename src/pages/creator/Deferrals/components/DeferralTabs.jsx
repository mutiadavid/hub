import React from "react";
import { Tabs } from "antd";

const tabsClassName = "rounded-2xl border border-[rgba(214,189,152,0.18)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:border-b [&_.ant-tabs-nav]:border-[rgba(214,189,152,0.18)] [&_.ant-tabs-nav]:bg-[#f8f5ee] [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-nav]:py-1 [&_.ant-tabs-nav]:rounded-t-2xl [&_.ant-tabs-tab]:px-0 [&_.ant-tabs-tab]:pb-3 [&_.ant-tabs-tab]:pt-3 [&_.ant-tabs-tab]:text-xs [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-(--color-text-light) [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-(--color-primary-dark)! [&_.ant-tabs-ink-bar]:bg-(--color-primary-dark)";

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
    <div className={tabsClassName}>
      <Tabs activeKey={activeTab} onChange={onTabChange} items={items} />
    </div>
  );
};

export default DeferralTabs;
