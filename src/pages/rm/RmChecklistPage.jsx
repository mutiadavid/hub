import React, { useState } from "react";
import { Button, Divider, Table, Tag, Input } from "antd";
import ChecklistsPage from "./ChecklistsPage";
import RmReviewChecklistModal from "../../components/modals/RmReviewChecklistModal";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";

const RmChecklistPage = ({ userId, mode = "queue" }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [searchText, setSearchText] = useState("");

  const { data: checklists = [], refetch } =
    useGetAllCoCreatorChecklistsQuery();

  // ------------------------------
  // Filter checklists based on RM and mode (UNCHANGED)
  // ------------------------------
  const myChecklists = checklists.filter((c) => {
    if (!c.assignedToRM || c.assignedToRM._id !== userId) return false;

    const status = (c.status || "").toLowerCase();

    if (mode === "completed") {
      return status === "approved";
    }

    return status !== "approved" && status !== "rejected";
  });

  // ------------------------------
  // Search filter (ADDED – layered on top)
  // ------------------------------
  const filteredChecklists = myChecklists.filter((c) => {
    if (!searchText) return true;

    const q = searchText.toLowerCase();

    return (
      c.dclNo?.toLowerCase().includes(q) ||
      c.CustomerNumber?.toLowerCase().includes(q) ||
      c.customerName?.toLowerCase().includes(q)
    );
  });

  // ------------------------------
  // Custom CSS for the table (UNCHANGED)
  // ------------------------------
  const customTableStyles = `
    .rmchecklist-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .rmchecklist-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      font-size: 15px;
      padding: 16px 16px !important;
      border-bottom: 3px solid #b5d334 !important;
      border-right: none !important;
    }
    .rmchecklist-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f0f0f0 !important;
      border-right: none !important;
      padding: 14px 16px !important;
      font-size: 14px;
      color: #333;
    }
    .rmchecklist-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
    .rmchecklist-table .ant-pagination .ant-pagination-item-active {
      background-color: #b5d334 !important;
      border-color: #b5d334 !important;
    }
    .rmchecklist-table .ant-pagination .ant-pagination-item-active a {
      color: ${PRIMARY_BLUE} !important;
      font-weight: 600;
    }
  `;

  // ------------------------------
  // Table Columns (UNCHANGED)
  // ------------------------------
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
      title: "Customer Number",
      dataIndex: "CustomerNumber",
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: "500", color: PRIMARY_BLUE }}>{text}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (text) => <span style={{ color: SECONDARY_PURPLE }}>{text}</span>,
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
        const s = (status || "").toLowerCase();
        let tagText = "In Progress";
        let bgColor = LIGHT_YELLOW;

        if (s === "approved") {
          tagText = "Approved";
          bgColor = ACCENT_LIME;
        } else if (s === "rejected") {
          tagText = "Rejected";
          bgColor = HIGHLIGHT_GOLD;
        }

        return (
          <Tag
            style={{
              fontSize: 12,
              borderRadius: 999,
              fontWeight: "bold",
              padding: "2px 6px",
              color: PRIMARY_BLUE,
              backgroundColor: bgColor + "40",
              borderColor: bgColor,
            }}
          >
            {tagText}
          </Tag>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 16 }} className="rmchecklist-table">
      {drawerOpen && (
        <ChecklistsPage
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            refetch();
          }}
          coCreatorId={userId}
        />
      )}

      <Divider style={{ margin: "12px 0" }}>
        {mode === "completed" ? "Completed DCLs" : "My Queue"}
      </Divider>

      {/* ✅ Search Bar */}
      <Input.Search
        placeholder="Search by DCL No, Customer Number, or Customer Name"
        allowClear
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ maxWidth: 400, marginBottom: 16 }}
      />

      <style>{customTableStyles}</style>

      <Table
        columns={columns}
        dataSource={filteredChecklists}
        rowKey="_id"
        size="large"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          position: ["bottomCenter"],
        }}
        onRow={(record) => ({
          onClick: () => setSelectedChecklist(record),
        })}
      />

      {selectedChecklist && (
        <RmReviewChecklistModal
          checklist={selectedChecklist}
          open={!!selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
        />
      )}
    </div>
  );
};

export default RmChecklistPage;
