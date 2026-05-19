import React from "react";
import { Table, Tabs, Tag, Empty, Spin } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PRIMARY_BLUE } from "../utils/constants";

const tableShellClassName =
  "rounded-2xl border border-[rgba(214,189,152,0.18)] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)] [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:border-b [&_.ant-tabs-nav]:border-[rgba(214,189,152,0.18)] [&_.ant-tabs-nav]:bg-[#f8f5ee] [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-nav]:pt-3 [&_.ant-tabs-nav]:rounded-t-2xl [&_.ant-tabs-tab]:px-0 [&_.ant-tabs-tab]:pb-3 [&_.ant-tabs-tab]:pt-0 [&_.ant-tabs-tab]:text-xs [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-(--color-text-light) [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-(--color-primary-dark)! [&_.ant-tabs-ink-bar]:bg-(--color-primary-dark) [&_.ant-table-wrapper]:rounded-b-2xl [&_.ant-table]:bg-transparent [&_.ant-table-container]:border-none [&_.ant-table-thead>tr>th]:bg-[#fbfaf6] [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.04em] [&_.ant-table-thead>tr>th]:text-(--color-text-dark) [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.16)] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-sm [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.1)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-row:hover>td]:bg-[#fcfbf8] [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden [&_.ant-pagination]:px-4 [&_.ant-pagination]:py-4";

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
        <span className="font-bold text-(--color-primary-dark)">
          <FileTextOutlined className="mr-1.5" />
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
            <Tag color="warning" className="ml-2">
              Missing
            </Tag>
          </span>
        ) : (
          <span className="font-bold text-(--color-primary-dark)">{dclNo}</span>
        );
      },
      width: 130,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => (
        <span className="font-semibold text-(--color-primary-dark)">{text || "N/A"}</span>
      ),
      ellipsis: true,
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      key: "loanType",
      render: (text) => (
        <span className="block truncate whitespace-nowrap">
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
      title: "TAT Consumed",
      dataIndex: "dueDate",
      key: "TAT",
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
      <div className="flex justify-center rounded-2xl border border-[rgba(214,189,152,0.18)] bg-white p-12 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <Spin />
      </div>
    );
  }

  if (!currentData || currentData.length === 0) {
    return (
      <div className={tableShellClassName}>
        <Tabs activeKey={activeTab} onChange={onTabChange} items={tabItems} />
        <div className="bg-white p-12">
          <Empty description="No deferrals found" />
        </div>
      </div>
    );
  }

  return (
    <div className={tableShellClassName}>
      <Tabs activeKey={activeTab} onChange={onTabChange} items={tabItems} />
      <Table
        columns={columns}
        dataSource={currentData}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          position: ["bottomCenter"],
        }}
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          className: "cursor-pointer",
        })}
        size="middle"
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default DeferralTable;
