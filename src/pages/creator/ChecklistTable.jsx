// ChecklistTable.jsx
import React from "react";
import { Table, Tag, Button } from "antd";

const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";

const ChecklistTable = ({ data, onView }) => {
  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (text) => <span style={{ color: SECONDARY_PURPLE }}>{text}</span>,
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 150,
      render: (text) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{text}</span>
      ),
    },
    { title: "Loan Type", dataIndex: "loanType", width: 140 },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 120,
      render: (rm) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: "500" }}>
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
          <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
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
        let tagColor, tagText, bgColor;
        const normalizedStatus = status ? status.toLowerCase() : "";

        switch (normalizedStatus) {
          case "co_creator_review":
            tagText = "Co-Creator Review";
            tagColor = ACCENT_LIME;
            bgColor = ACCENT_LIME;
            break;
          case "rm_review":
            tagText = "RM Review";
            tagColor = ACCENT_LIME;
            bgColor = ACCENT_LIME;
            break;
          case "co_checker_review":
            tagText = "Co-Checker Review";
            tagColor = PRIMARY_BLUE;
            bgColor = LIGHT_YELLOW;
            break;
          case "approved":
            tagText = "Approved";
            tagColor = ACCENT_LIME;
            bgColor = ACCENT_LIME;
            break;
          case "rejected":
            tagText = "Rejected";
            tagColor = HIGHLIGHT_GOLD;
            bgColor = HIGHLIGHT_GOLD;
            break;
          default:
            tagText = "In Progress";
            tagColor = PRIMARY_BLUE;
            bgColor = LIGHT_YELLOW;
        }

        return (
          <Tag
            color={tagColor}
            style={{
              fontSize: 12,
              borderRadius: 999,
              fontWeight: "bold",
              padding: "2px 6px",
              color: "#5F0707",
              backgroundColor: `${bgColor}40`,
              borderColor: bgColor,
            }}
          >
            {tagText}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          onClick={() => onView(record)}
          style={{
            color: SECONDARY_PURPLE,
            fontWeight: "bold",
            fontSize: 13,
            borderRadius: 6,
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} rowKey="_id" />;
};

export default ChecklistTable;
