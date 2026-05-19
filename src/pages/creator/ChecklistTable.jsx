// ChecklistTable.jsx
import React from "react";
import { Table, Button } from "antd";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";

const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";

const tableShellClassName = "bg-white [&_.ant-table]:w-full [&_.ant-table-wrapper]:bg-white [&_.ant-table-container]:bg-white [&_.ant-table-content]:overflow-x-auto [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3.5 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-(--color-text-medium) [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr:hover>td]:bg-[rgba(245,247,244,0.9)] [&_.ant-pagination]:mt-4 [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

const getStatusBadgeClassName = (status) => {
  const normalizedStatus = status ? status.toLowerCase() : "";

  switch (normalizedStatus) {
    case "co_creator_review":
    case "rm_review":
      return "border-[rgba(181,211,52,0.24)] bg-[rgba(181,211,52,0.14)] text-[#5f0707]";
    case "co_checker_review":
      return "border-[rgba(252,209,22,0.3)] bg-[rgba(252,209,22,0.18)] text-(--color-primary-dark)";
    case "approved":
      return "border-[rgba(181,211,52,0.24)] bg-[rgba(181,211,52,0.14)] text-[#365314]";
    case "rejected":
      return "border-[rgba(252,177,22,0.3)] bg-[rgba(252,177,22,0.18)] text-[#92400e]";
    default:
      return "border-[rgba(252,209,22,0.3)] bg-[rgba(252,209,22,0.18)] text-(--color-primary-dark)";
  }
};

const ChecklistTable = ({ data, onView, showTat = false }) => {
  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 180,
      render: (text) => (
        <span className="truncate whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-(--color-primary-dark)">{text}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (text) => <span className="truncate whitespace-nowrap text-[13px] font-normal text-[#7e6496]">{text}</span>,
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 150,
      render: (text) => (
        <span className="truncate whitespace-nowrap text-[13px] font-medium text-(--color-primary-dark)">{text}</span>
      ),
    },
    { title: "Loan Type", dataIndex: "loanType", width: 140 },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 120,
      render: (rm) => (
        <span className="truncate whitespace-nowrap text-[13px] font-medium text-(--color-primary-dark)">
          {rm?.name || "Not Assigned"}
        </span>
      ),
    },
    {
      title: "# Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs = []) => {
        const totalDocCount = docs.reduce((total, category) => {
          const docListCount = category.docList ? category.docList.length : 0;
          return total + docListCount;
        }, 0);
        return (
          <span className="truncate whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-(--color-primary-dark)">
            {totalDocCount}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status) => {
        let tagText;
        const normalizedStatus = status ? status.toLowerCase() : "";

        switch (normalizedStatus) {
          case "co_creator_review":
            tagText = "Co-Creator Review";
            break;
          case "rm_review":
            tagText = "RM Review";
            break;
          case "co_checker_review":
            tagText = "Co-Checker Review";
            break;
          case "approved":
            tagText = "Approved";
            break;
          case "rejected":
            tagText = "Rejected";
            break;
          default:
            tagText = "In Progress";
        }

        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClassName(status)}`}>
            {tagText}
          </span>
        );
      },
    },
    ...(showTat
      ? [
          {
            title: "TAT Consumed",
            dataIndex: "slaExpiry",
            width: 120,
            render: (date, record) => (
              <RealTimeSlaTag
                slaExpiry={date}
                startedAt={record?.createdAt}
                endedAt={["approved", "rejected", "completed", "discarded"].includes(String(record?.status).toLowerCase()) ? (record?.updatedAt || record?.approvedAt || null) : null}
                emptyLabel="N/A"
                minWidth={60}
                fontSize={12}
                displayStyle="text"
              />
            ),
          },
        ]
      : []),
    {
      title: "Actions",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          onClick={() => onView(record)}
          className="rounded-md p-0 text-[13px] font-bold text-[#7e6496]"
        >
          View
        </Button>
      ),
    },
  ];
  return (
    <div className={tableShellClassName}>
      <Table columns={columns} dataSource={data} rowKey="_id" />
    </div>
  );
};

export default ChecklistTable;
