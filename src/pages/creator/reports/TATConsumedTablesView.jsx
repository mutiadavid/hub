import React, { useState } from "react";
import { Empty, Tabs } from "antd";
import { ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { DCL_DISPLAY_NAME, NCBA_REPORT_THEME } from "./reportTheme";
import DeferralTATTable from "./DeferralTATTable";
import DCLTATTable from "./DCLTATTable";

export default function TATConsumedTablesView({
  deferralRows = [],
  dclRows = [],
  activeKey,
  onActiveKeyChange,
}) {
  const [internalActiveTab, setInternalActiveTab] = useState(activeKey || "deferral");

  const tabLabelStyles = `
    .tat-consumed-tabs .ant-tabs-tab-btn {
      color: var(--color-text-medium) !important;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
    }

    .tat-consumed-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: var(--color-primary-dark) !important;
    }

    .tat-consumed-tabs__label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .tat-consumed-tabs__icon {
      font-size: 14px;
    }
  `;

  if (!deferralRows.length && !dclRows.length) {
    return (
      <Empty
        description="No TAT data available for the selected filters"
        style={{ marginTop: 24 }}
      />
    );
  }

  const tabItems = [];

  if (deferralRows.length > 0) {
    tabItems.push({
      key: "deferral",
      label: (
        <span className="tat-consumed-tabs__label">
          <ClockCircleOutlined className="tat-consumed-tabs__icon" />
          Deferral TAT
        </span>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <DeferralTATTable deferralRows={deferralRows} />
        </div>
      ),
    });
  }

  if (dclRows.length > 0) {
    tabItems.push({
      key: "dcl",
      label: (
        <span className="tat-consumed-tabs__label">
          <FileTextOutlined className="tat-consumed-tabs__icon" />
          {DCL_DISPLAY_NAME} TAT
        </span>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <DCLTATTable dclRows={dclRows} />
        </div>
      ),
    });
  }

  const availableTabKeys = tabItems.map((item) => item.key);
  const requestedTab = activeKey || internalActiveTab;
  const activeTab = availableTabKeys.includes(requestedTab)
    ? requestedTab
    : availableTabKeys[0] || "deferral";

  return (
    <>
      <style>{tabLabelStyles}</style>
      <Tabs
        className="tat-consumed-tabs"
        activeKey={activeTab}
        onChange={(key) => {
          setInternalActiveTab(key);
          onActiveKeyChange?.(key);
        }}
        items={tabItems}
        tabBarStyle={{
          borderBottom: `2px solid ${NCBA_REPORT_THEME.brandLight}`,
          marginBottom: 0,
        }}
        tabBarGutter={32}
      />
    </>
  );
}
