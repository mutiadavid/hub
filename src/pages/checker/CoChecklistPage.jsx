import React, { useMemo, useState } from "react";
import { Button, Divider, Table, Tag, Spin, Empty } from "antd";
import ChecklistsPage from "./ChecklistsPage";
import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
import { useGetChecklistsQuery } from "../../api/checklistApi";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";

const tableShellClassName =
  "overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-[0_10px_30px_rgba(22,70,121,0.08)] [&_.ant-table]:bg-transparent [&_.ant-table-container]:border-none [&_.ant-table-thead>tr>th]:bg-[#f7f7f7] [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-4 [&_.ant-table-thead>tr>th]:text-[15px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-(--color-heading) [&_.ant-table-thead>tr>th]:border-b-[3px] [&_.ant-table-thead>tr>th]:border-[rgba(57,32,48,0.18)] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3.5 [&_.ant-table-tbody>tr>td]:text-sm [&_.ant-table-tbody>tr>td]:text-(--color-heading-light) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[#f0f0f0] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-row:hover>td]:bg-[rgba(181,211,52,0.1)] [&_.ant-table-row:hover>td]:cursor-pointer [&_.ant-pagination_.ant-pagination-item-active]:border-[#b5d334] [&_.ant-pagination_.ant-pagination-item-active]:bg-[#b5d334] [&_.ant-pagination_.ant-pagination-item-active_a]:font-semibold [&_.ant-pagination_.ant-pagination-item-active_a]:text-[#164679] [&_.ant-pagination_.ant-pagination-item:hover]:border-[#b5d334] [&_.ant-pagination_.ant-pagination-prev:hover_.ant-pagination-item-link]:text-[#b5d334] [&_.ant-pagination_.ant-pagination-next:hover_.ant-pagination-item-link]:text-[#b5d334] [&_.ant-pagination_.ant-pagination-options_.ant-select-selector]:rounded-lg [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

const getStatusClassName = (statusClassName) => {
  if (statusClassName === "checker-cochecklist-status--approved") {
    return "border-[#b5d334] bg-[rgba(181,211,52,0.25)]";
  }
  if (statusClassName === "checker-cochecklist-status--rejected") {
    return "border-[#fcb116] bg-[rgba(252,177,22,0.25)]";
  }
  return "border-[#fcd716] bg-[rgba(252,215,22,0.25)]";
};

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

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 200,
      render: (text) => (
        <span className="checker-cochecklist-cell-primary">{text}</span>
      ),
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 180,
      render: (text) => <span className="checker-cochecklist-cell-secondary">{text}</span>,
    },

    { title: "Loan Type", dataIndex: "loanType", width: 140 },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 120,
      render: (rm) => (
        <span className="checker-cochecklist-cell-strong">
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
        <span className="checker-cochecklist-cell-primary">
          {Array.isArray(docs) ? docs.length : 0}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status) => {
        let tagText;
        let statusClassName;

        if (status === "approved") {
          tagText = "Approved";
          statusClassName = "checker-cochecklist-status--approved";
        } else if (status === "rejected") {
          tagText = "Rejected";
          statusClassName = "checker-cochecklist-status--rejected";
        } else {
          tagText = "In Progress";
          statusClassName = "checker-cochecklist-status--inprogress";
        }
        return <Tag className={`checker-cochecklist-status ${statusClassName}`}>{tagText}</Tag>;
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
          className="checker-cochecklist-action"
        >
          View
        </Button>
      ),
    },
  ];

  const dataSource = Array.isArray(myChecklists) ? myChecklists : [];

  return (
    <div className="p-4">

      {selectedChecklist ? (
        <section className="w-full min-h-full border-0 bg-transparent p-0 shadow-none">
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

          <Divider className="my-3">Assigned Checklists</Divider>

          {isLoading || isFetching ? (
            <div className="flex items-center justify-center p-6">
              <Spin tip="Loading checklists...">
                <div className="h-10" />
              </Spin>
            </div>
          ) : error ? (
            <Empty
              description="Failed to load checklists. Check console for details."
              className="p-6"
            />
          ) : dataSource.length === 0 ? (
            <Empty
              description="No active checklists assigned."
              className="p-6"
            />
          ) : (
            <div className={tableShellClassName}>
              <Table
                columns={columns.map((column) => {
                  if (column.dataIndex === "dclNo") {
                    return {
                      ...column,
                      render: (text) => (
                        <span className="font-bold text-[#164679]">{text}</span>
                      ),
                    };
                  }
                  if (column.dataIndex === "customerNumber") {
                    return {
                      ...column,
                      render: (text) => (
                        <span className="text-[#7e6496]">{text}</span>
                      ),
                    };
                  }
                  if (column.dataIndex === "assignedToRM") {
                    return {
                      ...column,
                      render: (rm) => (
                        <span className="font-medium text-[#164679]">
                          {rm?.name || "Not Assigned"}
                        </span>
                      ),
                    };
                  }
                  if (column.dataIndex === "documents") {
                    return {
                      ...column,
                      render: (docs) => (
                        <span className="font-bold text-[#164679]">
                          {Array.isArray(docs) ? docs.length : 0}
                        </span>
                      ),
                    };
                  }
                  if (column.dataIndex === "status") {
                    return {
                      ...column,
                      render: (status) => {
                        let tagText;
                        let statusClassName;

                        if (status === "approved") {
                          tagText = "Approved";
                          statusClassName = "checker-cochecklist-status--approved";
                        } else if (status === "rejected") {
                          tagText = "Rejected";
                          statusClassName = "checker-cochecklist-status--rejected";
                        } else {
                          tagText = "In Progress";
                          statusClassName = "checker-cochecklist-status--inprogress";
                        }

                        return (
                          <Tag className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-bold text-[#164679] ${getStatusClassName(statusClassName)}`}>
                            {tagText}
                          </Tag>
                        );
                      },
                    };
                  }
                  if (column.title === "Actions") {
                    return {
                      ...column,
                      render: (_, record) => (
                        <Button
                          size="small"
                          type="link"
                          onClick={() => setSelectedChecklist(record)}
                          className="rounded-md px-0 text-[13px] font-bold text-[#7e6496]"
                        >
                          View
                        </Button>
                      ),
                    };
                  }
                  return column;
                })}
                dataSource={dataSource}
                rowKey={(record) => record._id || record.id}
                size="large"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Myqueue;
