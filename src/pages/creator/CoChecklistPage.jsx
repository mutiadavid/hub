import React, { useState, useMemo } from "react";
import { Button, Select, Table } from "antd";
import { useNavigate } from "react-router-dom";
import ChecklistsPage from "./ChecklistsPageCreator";
import { useGetSpecificChecklistsByCreatorQuery } from "../../api/checklistApi";
import { formatCommentTimestamp } from "../../utils/checklistUtils";
import "../../styles/creatorTableOverrides.css";

const pageRootClassName =
  "min-h-full w-full bg-white px-0 [font-family:'Century_Gothic','CenturyGothic','AppleGothic',sans-serif]";

const shellClassName = "w-full";

const cardClassName =
  "overflow-hidden rounded-lg border border-[#d6bd9833] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";

const toolbarClassName =
  "grid gap-3 border-b border-[#d6bd9833] bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-center";

const titleClassName =
  "m-0 text-center text-base font-bold leading-tight tracking-[-0.02em] text-[#1f2933] md:text-[17px] lg:text-lg";

const actionsClassName = "flex flex-wrap items-center justify-start gap-2 md:justify-end";

const filterClassName =
  "min-w-full md:min-w-[160px] [&_.ant-select-selector]:min-h-9 [&_.ant-select-selector]:rounded-md [&_.ant-select-selector]:border-[#d6bd9833] [&_.ant-select-selector]:bg-white [&_.ant-select-selector]:px-2 [&_.ant-select-selector]:py-2 [&_.ant-select-selector]:shadow-none [&_.ant-select-selection-item]:text-xs [&_.ant-select-selection-item]:font-medium [&_.ant-select-selection-item]:text-[#6b7280] [&_.ant-select-selection-placeholder]:text-xs [&_.ant-select-selection-placeholder]:font-medium [&_.ant-select-selection-placeholder]:text-[#6b7280] [&_.ant-select-arrow]:text-[#6b7280] hover:[&_.ant-select-selector]:border-[#164679] [&_.ant-select-focused_.ant-select-selector]:border-[#164679]";

const createButtonClassName =
  "inline-flex h-auto items-center justify-center gap-2 rounded-lg border-0 bg-[#3ab3e5] px-4 py-2 text-[13px] font-semibold text-white shadow-none hover:shadow-[0_4px_8px_rgba(26,54,54,0.12)] focus:shadow-[0_4px_8px_rgba(26,54,54,0.12)] !bg-[#3ab3e5] !text-white [&:hover]:!bg-[#2a8cb5] [&:focus]:!bg-[#2a8cb5]";

const tableShellClassName =
  "rounded-lg bg-white [&_.ant-table]:table-fixed [&_.ant-table]:w-full [&_.ant-table-cell]:before:hidden [&_.ant-table-cell]:after:hidden [&_.ant-table-cell]:align-middle [&_.ant-table-container]:before:hidden [&_.ant-table-container]:after:hidden [&_.ant-table-content]:overflow-x-auto [&_.ant-table-placeholder]:bg-white [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[#d6bd981f] [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-[13px] [&_.ant-table-tbody>tr>td]:text-[#4b5563] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-tbody>tr:hover>td]:bg-[#f5f7f4] [&_.ant-table-thead>tr]:border-b-0 [&_.ant-table-thead>tr:after]:hidden [&_.ant-table-thead>tr:before]:hidden [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:border-b-0 [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-[14px] [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.02em] [&_.ant-table-thead>tr>th]:text-[#6b7280] [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination]:items-center [&_.ant-pagination]:gap-1.5 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-item]:bg-transparent [&_.ant-pagination_.ant-pagination-item]:text-[13px] [&_.ant-pagination_.ant-pagination-item-active]:border-[#d6bd982e] [&_.ant-pagination_.ant-pagination-item-active]:bg-[#d6bd982e] [&_.ant-pagination_.ant-pagination-item-active_a]:font-medium [&_.ant-pagination_.ant-pagination-item-active_a]:text-[#1f2933] [&_.ant-pagination_.ant-pagination-item-link]:text-[13px] [&_.ant-pagination_.ant-pagination-item-link]:text-[#1f2933] [&_.ant-pagination_.ant-pagination-item_a]:text-xs [&_.ant-pagination_.ant-pagination-item_a]:font-medium [&_.ant-pagination_.ant-pagination-item_a]:text-[#1f2933] [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-next]:bg-transparent [&_.ant-pagination_.ant-pagination-next]:min-w-[34px] [&_.ant-pagination_.ant-pagination-options]:text-xs [&_.ant-pagination_.ant-pagination-options]:font-medium [&_.ant-pagination_.ant-pagination-options]:text-[#1f2933] [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:bg-transparent [&_.ant-pagination_.ant-pagination-prev]:min-w-[34px] [&_.ant-pagination_.ant-select-arrow]:text-[#1f2933] [&_.ant-pagination_.ant-select-selection-item]:text-xs [&_.ant-pagination_.ant-select-selection-item]:text-[#1f2933] [&_.ant-pagination_.ant-select-selection-placeholder]:text-xs [&_.ant-pagination_.ant-select-selection-placeholder]:text-[#1f2933] [&_.ant-pagination_.ant-select-selector]:text-xs [&_.ant-pagination_.ant-select-selector]:text-[#1f2933] [&_.ant-spin-container]:bg-white";

const primaryCellClassName = "creator-table-primary-cell";
const primaryValueClassName = "creator-table-primary-value";
const createdCellClassName = "creator-table-primary-cell";
const createdDateClassName = "creator-table-muted";
const mutedClassName = "creator-table-muted";

const getStatusBadgeClassName = (variant) => {
  switch (variant) {
    case "approved":
      return "inline-flex min-h-[22px] items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-emerald-800";
    case "rework":
      return "inline-flex min-h-[22px] items-center justify-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-red-700";
    case "pending":
      return "inline-flex min-h-[22px] items-center justify-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-amber-700";
    default:
      return "inline-flex min-h-[22px] items-center justify-center rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-sky-800";
  }
};

const getChecklistStatusMeta = (status, dclNo) => {
  const normalizedStatus = (status || "").toLowerCase();
  const isRevived = dclNo?.toLowerCase().includes("copy");

  if (isRevived) {
    return { label: "Revived", variant: "draft" };
  }

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus === "rejected") {
    return { label: "Rejected", variant: "rework" };
  }

  if (normalizedStatus === "pending") {
    return { label: "Pending", variant: "pending" };
  }

  return { label: "In Progress", variant: "qs-review" };
};

/* -------------------------------------------------------------------
   ⭐ MAIN PAGE: CoChecklistPage
------------------------------------------------------------------- */
const CoChecklistPage = ({
  userId,
  draftToRestore = null,
  setDraftToRestore = null,
}) => {
  console.log("=== CoChecklistPage RENDER START ===");
  console.log("userId:", userId);
  console.log("draftToRestore:", draftToRestore);
  
  const navigate = useNavigate();

  // Style to remove table header border separator
  const headerBorderRemovalStyle = `
    .cochecklist-page,
    .cochecklist-page * {
      font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif !important;
    }
    .cochecklist-page .ant-table-thead > tr > th {
      border-bottom: none !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 12px 12px !important;
      text-transform: uppercase;
      color: var(--color-text-medium, #6b7280) !important;
      letter-spacing: 0.02em;
    }
    .cochecklist-page .ant-table-thead {
      border-bottom: none !important;
    }
    .cochecklist-page .ant-table-header {
      border-bottom: none !important;
    }
    .cochecklist-page .ant-table-tbody > tr > td {
      font-size: 12px !important;
      padding: 12px 12px !important;
    }
  `;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [loanTypeFilter, setLoanTypeFilter] = useState(undefined);
  const [rmFilter, setRmFilter] = useState(undefined);
  
  const restoredDraftId =
    typeof draftToRestore === "string"
      ? draftToRestore
      : draftToRestore?.id || null;
      
  const isDrawerOpen = drawerOpen || Boolean(restoredDraftId);
  
  console.log("restoredDraftId:", restoredDraftId);
  console.log("isDrawerOpen:", isDrawerOpen);

  console.log("Calling useGetSpecificChecklistsByCreatorQuery with userId:", userId);
  const { data: checklists = [], refetch, isLoading, error } =
    useGetSpecificChecklistsByCreatorQuery(userId, { skip: !userId });
    
  console.log("useGetSpecificChecklistsByCreatorQuery results:");
  console.log("  checklists:", checklists);
  console.log("  isLoading:", isLoading);
  console.log("  error:", error);
  console.log("  checklists length:", checklists.length);

  // Filter checklists: Only show Pending checklists and Revived checklists
  // EXCLUDE coCreatorReview status checklists (non-revived)
  const myChecklists = useMemo(() => {
    console.log("Computing myChecklists from", checklists.length, "items");
    const filtered = checklists.filter((c) => {
      const statusLower = (c.status || "").toLowerCase();
      const isRevived = c.dclNo?.toLowerCase().includes("copy");
      const include = isRevived ? statusLower === "cocreatorreview" : statusLower === "pending";
      console.log(`  Checklist ${c.dclNo}: status=${c.status}, isRevived=${isRevived}, include=${include}`);
      return include;
    });
    console.log("myChecklists result:", filtered);
    return filtered;
  }, [checklists]);

  const statusOptions = useMemo(
    () => {
      const options = Array.from(
        new Set(
          myChecklists
            .map((checklist) => getChecklistStatusMeta(checklist.status, checklist.dclNo).label)
            .filter(Boolean)
        )
      ).map((value) => ({ label: value, value }));
      console.log("statusOptions:", options);
      return options;
    },
    [myChecklists]
  );

  const loanTypeOptions = useMemo(
    () => {
      const options = Array.from(
        new Set(myChecklists.map((checklist) => checklist.loanType).filter(Boolean))
      ).map((value) => ({ label: value, value }));
      console.log("loanTypeOptions:", options);
      return options;
    },
    [myChecklists]
  );

  const rmOptions = useMemo(
    () => {
      const options = Array.from(
        new Set(
          myChecklists
            .map((checklist) => checklist.assignedToRM?.name)
            .filter(Boolean)
        )
      ).map((value) => ({ label: value, value }));
      console.log("rmOptions:", options);
      return options;
    },
    [myChecklists]
  );

  const filteredChecklists = useMemo(
    () => {
      let filtered = myChecklists;
      console.log("Applying filters - initial filtered count:", filtered.length);
      
      if (statusFilter) {
        filtered = filtered.filter((checklist) => {
          const checklistStatus = getChecklistStatusMeta(
            checklist.status,
            checklist.dclNo
          ).label;
          const matches = checklistStatus === statusFilter;
          console.log(`  Filter by status: ${checklistStatus} === ${statusFilter} = ${matches}`);
          return matches;
        });
        console.log("  After status filter:", filtered.length);
      }

      if (loanTypeFilter) {
        filtered = filtered.filter((checklist) => {
          const matches = checklist.loanType === loanTypeFilter;
          console.log(`  Filter by loanType: ${checklist.loanType} === ${loanTypeFilter} = ${matches}`);
          return matches;
        });
        console.log("  After loanType filter:", filtered.length);
      }

      if (rmFilter) {
        filtered = filtered.filter((checklist) => {
          const matches = checklist.assignedToRM?.name === rmFilter;
          console.log(`  Filter by rm: ${checklist.assignedToRM?.name} === ${rmFilter} = ${matches}`);
          return matches;
        });
        console.log("  After rm filter:", filtered.length);
      }
      
      console.log("filteredChecklists result:", filtered);
      return filtered;
    },
    [myChecklists, statusFilter, loanTypeFilter, rmFilter]
  );

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 120,
      ellipsis: true,
      render: (text) => (
        <div className={primaryCellClassName}>
          <span className={primaryValueClassName}>{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 140,
      ellipsis: true,
      render: (text) => (
        <span className={primaryValueClassName}>{text || "-"}</span>
      ),
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 130,
      ellipsis: true,
      render: (text) => (
        <span className={mutedClassName}>{text || "-"}</span>
      ),
    },
    {
      title: "Time/Date Created",
      dataIndex: "createdAt",
      width: 130,
      ellipsis: true,
      render: (value, record) => {
        const createdTimestamp = formatCommentTimestamp(
          value || record.createdAt || record.timestamp || record.updatedAt
        );

        return (
          <div className={createdCellClassName}>
            <span className={createdDateClassName}>
              {createdTimestamp || "-"}
            </span>
          </div>
        );
      },
    },
    {
      title: "IBPS No",
      dataIndex: "ibpsNo",
      width: 95,
      ellipsis: true,
      render: (text) => (
        <span className={`${mutedClassName} font-mono`}>
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 105,
      ellipsis: true,
      filters: loanTypeOptions,
      onFilter: (value, record) => record.loanType === value,
      render: (text) => <span className={mutedClassName}>{text || "-"}</span>,
    },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 110,
      ellipsis: true,
      filters: rmOptions,
      onFilter: (value, record) => record.assignedToRM?.name === value,
      render: (rm) => (
        <span className={mutedClassName}>
          {rm?.name || "Not Assigned"}
        </span>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs = []) => {
        const totalDocCount = docs.reduce((total, category) => {
          const docListCount = category.docList ? category.docList.length : 0;
          return total + docListCount;
        }, 0);
        return <span className={primaryValueClassName}>{totalDocCount}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 90,
      ellipsis: true,
      filters: statusOptions,
      onFilter: (value, record) =>
        getChecklistStatusMeta(record.status, record.dclNo).label === value,
      render: (status, record) => {
        const statusMeta = getChecklistStatusMeta(status, record.dclNo);

        return (
          <span className={getStatusBadgeClassName(statusMeta.variant)}>
            {statusMeta.label}
          </span>
        );
      },
    },
    // Removed the "Actions" column since we're making the entire row clickable
  ];

  return (
    <div className={pageRootClassName}>
      <style>{headerBorderRemovalStyle}</style>
      {isDrawerOpen ? (
        <ChecklistsPage
          open={isDrawerOpen}
          draftId={restoredDraftId}
          onClose={() => {
            console.log("ChecklistsPage onClose called");
            setDrawerOpen(false);
            setDraftToRestore?.(null);
            console.log("Refetching checklists...");
            refetch();
          }}
          coCreatorId={userId}
        />
      ) : (
        <div className={`${shellClassName} cochecklist-page`}>
          <div className={cardClassName}>
            <div className={toolbarClassName}>
              <div className="flex w-full items-center">
                <Button
                  onClick={() => {
                    console.log("Create New DCL button clicked");
                    setDrawerOpen(true);
                  }}
                  className={createButtonClassName}
                >
                  + Create New DCL
                </Button>
              </div>

              <div className="flex w-full items-center justify-center">
                <h2 className={titleClassName}>Created Checklists</h2>
              </div>

              <div className={actionsClassName}>
                <Select
                  allowClear
                  placeholder="Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(value) => {
                    console.log("Status filter changed to:", value);
                    setStatusFilter(value);
                  }}
                  className={filterClassName}
                />
                <Select
                  allowClear
                  placeholder="Loan Type"
                  options={loanTypeOptions}
                  value={loanTypeFilter}
                  onChange={(value) => {
                    console.log("Loan type filter changed to:", value);
                    setLoanTypeFilter(value);
                  }}
                  className={filterClassName}
                />
                <Select
                  allowClear
                  placeholder="Assigned RM"
                  options={rmOptions}
                  value={rmFilter}
                  onChange={(value) => {
                    console.log("RM filter changed to:", value);
                    setRmFilter(value);
                  }}
                  className={filterClassName}
                />
              </div>
            </div>

            <div className={tableShellClassName}>
              <Table
                columns={columns}
                dataSource={filteredChecklists}
                rowKey={(record) => record.id || record._id || record.dclNo}
                size="middle"
                tableLayout="fixed"
                scroll={{ x: 1280 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                locale={{ emptyText: "No checklists available" }}
                onRow={(record) => ({
                  onClick: () => {
                    const checklistId = record.id || record._id;
                    console.log("Row clicked for checklist:", record.dclNo, "id:", checklistId);
                    if (checklistId) {
                      navigate(`/cocreator/review/${checklistId}`);
                    }
                  },
                  className: "cursor-pointer",
                })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoChecklistPage;