import React, { useState } from "react";
import { Empty, Tabs } from "antd";
import { ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { NCBA_REPORT_THEME } from "./reportTheme";
import DeferralTATTable from "./DeferralTATTable";
import DCLTATTable from "./DCLTATTable";

export default function TATConsumedTablesView({ deferralRows = [], dclRows = [] }) {
  const [activeTab, setActiveTab] = useState("deferral");

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
        <span>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
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
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          DCL TAT
        </span>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <DCLTATTable dclRows={dclRows} />
        </div>
      ),
    });
  }

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={tabItems}
      tabBarStyle={{
        borderBottom: `2px solid ${NCBA_REPORT_THEME.brandLight}`,
        marginBottom: 0,
      }}
      tabBarGutter={32}
    />
  );
}
