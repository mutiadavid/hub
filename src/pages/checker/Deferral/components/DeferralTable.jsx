import React from "react";
import { Table, Tabs, Tag, Empty, Spin } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  PRIMARY_BLUE,
  ACCENT_LIME,
  WARNING_ORANGE,
  SUCCESS_GREEN,
  ERROR_RED,
} from "../utils/constants";

const DeferralTable = ({
  activeTab,
  onTabChange,
  tabCounts,
  isLoading,
  currentData,
  onRowClick,
}) => {
  const columns = [
    {
      title: "Deferral No",
      dataIndex: "deferralNumber",
      key: "deferralNumber",
      render: (text) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 700 }}>
          <FileTextOutlined style={{ marginRight: 6 }} />
          {text || "N/A"}
        </span>
      ),
      width: 120,
    },
    {
      title: "DCL No",
      dataIndex: "dclNo",
      key: "dclNo",
      render: (text, record) => {
        const dclNo = text || record.dclNumber || "N/A";
        return !text && !record.dclNumber ? (
          <span>
            {dclNo}
            <Tag color="warning" style={{ marginLeft: 8 }}>
              Missing
            </Tag>
          </span>
        ) : (
          <span style={{ color: PRIMARY_BLUE, fontWeight: 700 }}>{dclNo}</span>
        );
      },
      width: 130,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 600 }}>{text || "N/A"}</span>
      ),
      ellipsis: true,
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      key: "loanType",
      render: (text) => (
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text || "N/A"}
        </span>
      ),
      width: 110,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const normalizedStatus = (status || "").toLowerCase();
        const isPending =
          normalizedStatus.includes("pending") ||
          normalizedStatus.includes("requested") ||
          normalizedStatus.includes("review");
        const isApproved = normalizedStatus.includes("approved");
        const isRejected = normalizedStatus.includes("rejected");
        const isReturned = normalizedStatus.includes("returned");

        let color = "default";
        if (isApproved) color = "success";
        else if (isRejected) color = "error";
        else if (isReturned) color = "warning";
        else if (isPending) color = "processing";

        return <Tag color={color}>{status || "N/A"}</Tag>;
      },
      width: 130,
    },
    {
      title: "SLA",
      dataIndex: "dueDate",
      key: "sla",
      render: (dueDate) => {
        if (!dueDate) return <span>N/A</span>;
        const days = dayjs(dueDate).diff(dayjs(), "days");
        const isExpired = days < 0;
        return (
          <Tag color={isExpired ? "Error" : days < 3 ? "warning" : "default"}>
            {isExpired ? "Expired" : `${days}d`}
          </Tag>
        );
      },
      width: 80,
    },
  ];

  const tabItems = [
    {
      key: "pending",
      label: `Pending (${tabCounts.pending || 0})`,
      children: null,
    },
    {
      key: "approved",
      label: `Approved (${tabCounts.approved || 0})`,
      children: null,
    },
    {
      key: "closeRequests",
      label: `Close Requests (${tabCounts.closeRequests || 0})`,
      children: null,
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin />
      </div>
    );
  }

  if (!currentData || currentData.length === 0) {
    return (
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={tabItems}
        tabBarStyle={{
          backgroundColor: "#f5f5f5",
          padding: "16px 24px",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <div style={{ padding: "50px", backgroundColor: "white" }}>
          <Empty description="No deferrals found" />
        </div>
      </Tabs>
    );
  }

  return (
    <div className="defer-table-wrapper checker-deferrals-table-card">
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={tabItems}
      />
      <Table
        columns={columns}
        dataSource={currentData}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          position: ["bottomCenter"],
          style: { padding: "16px 0" },
        }}
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          style: { cursor: "pointer" },
        })}
        size="middle"
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default DeferralTable;
