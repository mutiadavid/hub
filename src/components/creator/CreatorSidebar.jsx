import React from "react";
import SharedSidebar from "../common/SharedSidebar";
import {
  FileAddOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  BarChartOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";

const CreatorSidebar = ({
  selectedKey,
  setSelectedKey,
  collapsed,
  toggleCollapse,
  onMenuItemClick,
}) => {
  const menuItems = [
    {
      key: "creatchecklist",
      icon: <FileAddOutlined />,
      label: "Create New DCL",
    },
    {
      key: "drafts",
      icon: <SnippetsOutlined />,
      label: "Drafts",
    },
    {
      key: "myqueue",
      icon: <InboxOutlined />,
      label: "My Queue",
    },
    {
      key: "deferrals",
      icon: <ClockCircleOutlined />,
      label: "Deferrals",
    },
    {
      key: "completed",
      icon: <CheckCircleOutlined />,
      label: "Completed",
    },
    {
      key: "discarded",
      icon: <DeleteOutlined />,
      label: "Discarded DCLs",
    },
    {
      key: "report",
      icon: <BarChartOutlined />,
      label: "Reports",
    },
  ];

  return (
    <SharedSidebar
      selectedKey={selectedKey}
      setSelectedKey={setSelectedKey}
      collapsed={collapsed}
      onMenuItemClick={onMenuItemClick}
      menuItems={menuItems}
      title="CO-Creator"
    />
  );
};

export default CreatorSidebar;
