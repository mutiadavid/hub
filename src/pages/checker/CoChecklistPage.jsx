import React, { useMemo, useState } from "react";
import { Button, Divider, Table, Tag, Spin, Empty } from "antd";
import ChecklistsPage from "./ChecklistsPage";
import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
import { useGetChecklistsQuery } from "../../api/checklistApi";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";

const Myqueue = ({ userId }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const {
    data: rawData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetChecklistsQuery();

  // Normalize API response
  const checklists = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData.checklists)) return rawData.checklists;
    if (Array.isArray(rawData.data)) return rawData.data;
    if (Array.isArray(rawData.items)) return rawData.items;
    return [];
  }, [rawData]);

  // Only checklists assigned to user and NOT approved
  const myChecklists = useMemo(() => {
    return checklists.filter((c) => {
      const isAssigned =
        c.assignedToCoChecker?._id === userId ||
        c.assignedToCoChecker === userId ||
        c.createdBy?._id === userId ||
        c.createdBy === userId ||
        c.assignedToChecker?._id === userId ||
        c.assignedToChecker === userId;

      return isAssigned && c.status !== "approved"; // exclude approved
    });
  }, [checklists, userId]);

  const customTableStyles = `
    .ant-table-wrapper { border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08); border: 1px solid #e0e0e0; }
    .ant-table-thead > tr > th { background-color: #f7f7f7 !important; color: var(--color-heading) !important; font-weight: 700; font-size: 15px; padding: 16px 16px !important; border-bottom: 3px solid rgba(57, 32, 48, 0.18) !important; border-right: none !important; }
    .ant-table-tbody > tr > td { border-bottom: 1px solid #f0f0f0 !important; border-right: none !important; padding: 14px 16px !important; font-size: 14px; color: var(--color-heading-light); }
    .ant-table-tbody > tr.ant-table-row:hover > td { background-color: rgba(181, 211, 52, 0.1) !important; cursor: pointer; }
    .ant-table-bordered .ant-table-container, .ant-table-bordered .ant-table-tbody > tr > td, .ant-table-bordered .ant-table-thead > tr > th { border: none !important; }
    .ant-pagination .ant-pagination-item-active { background-color: ${ACCENT_LIME} !important; border-color: ${ACCENT_LIME} !important; }
    .ant-pagination .ant-pagination-item-active a { color: ${PRIMARY_BLUE} !important; font-weight: 600; }
    .ant-pagination .ant-pagination-item:hover { border-color: ${ACCENT_LIME} !important; }
    .ant-pagination .ant-pagination-prev:hover .ant-pagination-item-link, .ant-pagination .ant-pagination-next:hover .ant-pagination-item-link { color: ${ACCENT_LIME} !important; }
    .ant-pagination .ant-pagination-options .ant-select-selector { border-radius: 8px !important; }
  `;

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 200,
      render: (text) => (
        <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</span>
      ),
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 180,
      render: (text) => <span style={{ color: SECONDARY_PURPLE }}>{text}</span>,
    },

    { title: "Loan Type", dataIndex: "loanType", width: 140 },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 120,
      render: (rm) => (
        <span style={{ color: PRIMARY_BLUE, fontWeight: 500 }}>
          {rm?.name || "Not Assigned"}
        </span>
      ),
    },
    {
      title: "# Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs) => (
        <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
          {Array.isArray(docs) ? docs.length : 0}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status) => {
        let tagColor, tagText, bgColor;
        if (status === "approved") {
          tagText = "Approved";
          tagColor = ACCENT_LIME;
          bgColor = ACCENT_LIME;
        } else if (status === "rejected") {
          tagText = "Rejected";
          tagColor = HIGHLIGHT_GOLD;
          bgColor = HIGHLIGHT_GOLD;
        } else {
          tagText = "In Progress";
          tagColor = SECONDARY_PURPLE;
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
    {
      title: "Actions",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          onClick={() => setSelectedChecklist(record)}
          style={{
            color: SECONDARY_PURPLE,
            fontWeight: "bold",
            fontSize: 13,
            borderRadius: 6,
            "--antd-wave-shadow-color": ACCENT_LIME,
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const dataSource = Array.isArray(myChecklists) ? myChecklists : [];

  return (
    <div style={{ padding: 16 }}>
      <style>{customTableStyles}</style>
      <style>{`
        .checker-cochecklist-inline-review {
          width: 100%;
          min-height: 100%;
          padding: 0;
          margin: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }
      `}</style>

      {selectedChecklist ? (
        <section className="checker-cochecklist-inline-review">
          <CheckerReviewChecklistModal
            checklist={selectedChecklist}
            embedded
            open={!!selectedChecklist}
            onClose={() => {
              setSelectedChecklist(null);
              refetch && refetch();
            }}
          />
        </section>
      ) : (
        <>
          {drawerOpen && (
            <ChecklistsPage
              open={drawerOpen}
              onClose={() => {
                setDrawerOpen(false);
                refetch && refetch();
              }}
              coCreatorId={userId}
            />
          )}

          <Divider style={{ margin: "12px 0" }}>Assigned Checklists</Divider>

          {isLoading || isFetching ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 24,
              }}
            >
              <Spin tip="Loading checklists...">
                <div style={{ height: 40 }} />
              </Spin>
            </div>
          ) : error ? (
            <Empty
              description="Failed to load checklists. Check console for details."
              style={{ padding: 24 }}
            />
          ) : dataSource.length === 0 ? (
            <Empty
              description="No active checklists assigned."
              style={{ padding: 24 }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey={(record) => record._id || record.id}
              size="large"
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
                position: ["bottomCenter"],
              }}
              rowClassName={(record, index) =>
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default Myqueue;
