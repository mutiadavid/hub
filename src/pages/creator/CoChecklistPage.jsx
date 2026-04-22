
import React, { useState, useMemo } from "react";
import { Button, Select, Table } from "antd";
import { useNavigate } from "react-router-dom";
import ChecklistsPage from "./ChecklistsPageCreator";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";
import { formatCommentTimestamp } from "../../utils/checklistUtils";
import "../../styles/creatorDesignSystem.css";

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
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [loanTypeFilter, setLoanTypeFilter] = useState(undefined);
  const [rmFilter, setRmFilter] = useState(undefined);
  const restoredDraftId =
    typeof draftToRestore === "string"
      ? draftToRestore
      : draftToRestore?.id || null;
  const isDrawerOpen = drawerOpen || Boolean(restoredDraftId);

  const { data: checklists = [], refetch } =
    useGetAllCoCreatorChecklistsQuery();

  // Filter checklists: Only show Pending checklists and Revived checklists
  // EXCLUDE coCreatorReview status checklists (non-revived)
  const myChecklists = useMemo(() => {
    return checklists.filter((c) => {
      const statusLower = (c.status || "").toLowerCase();
      const isRevived = c.dclNo?.toLowerCase().includes("copy");
      if (isRevived) {
        return statusLower === "cocreatorreview";
      }
      return statusLower === "pending";
    });
  }, [checklists]);

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myChecklists
            .map((checklist) => getChecklistStatusMeta(checklist.status, checklist.dclNo).label)
            .filter(Boolean)
        )
      ).map((value) => ({ label: value, value })),
    [myChecklists]
  );

  const loanTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(myChecklists.map((checklist) => checklist.loanType).filter(Boolean))
      ).map((value) => ({ label: value, value })),
    [myChecklists]
  );

  const rmOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myChecklists
            .map((checklist) => checklist.assignedToRM?.name)
            .filter(Boolean)
        )
      ).map((value) => ({ label: value, value })),
    [myChecklists]
  );

  const filteredChecklists = useMemo(
    () =>
      myChecklists.filter((checklist) => {
        const checklistStatus = getChecklistStatusMeta(
          checklist.status,
          checklist.dclNo
        ).label;

        if (statusFilter && checklistStatus !== statusFilter) {
          return false;
        }

        if (loanTypeFilter && checklist.loanType !== loanTypeFilter) {
          return false;
        }

        if (rmFilter && checklist.assignedToRM?.name !== rmFilter) {
          return false;
        }

        return true;
      }),
    [myChecklists, statusFilter, loanTypeFilter, rmFilter]
  );

  const customTableStyles = `
      .cochecklist-page {
        min-height: 100%;
        width: 100%;
        background: var(--color-white);
        font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
      }
      .cochecklist-shell {
        width: 100%;
      }
      .cochecklist-card {
        background: var(--color-white);
        border: 1px solid rgba(214, 189, 152, 0.2);
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
        overflow: hidden;
      }
      .cochecklist-toolbar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid rgba(214, 189, 152, 0.2);
        background: var(--color-white);
      }
      .cochecklist-toolbar-left {
        display: flex;
        align-items: center;
        width: 100%;
      }
      .cochecklist-toolbar-center {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
      }
      .cochecklist-title {
        color: var(--color-text-dark);
        font-size: 16px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.02em;
        margin: 0;
        text-align: center;
      }
      .cochecklist-actions {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        flex-wrap: wrap;
        width: 100%;
      }
      .cochecklist-filter {
        min-width: 160px;
      }
      .cochecklist-filter .ant-select-selector {
        padding: 8px !important;
        min-height: 36px !important;
        border: 1px solid rgba(214, 189, 152, 0.2) !important;
        border-radius: 6px !important;
        background: var(--color-white) !important;
        box-shadow: none !important;
      }
      .cochecklist-filter .ant-select-selection-placeholder,
      .cochecklist-filter .ant-select-selection-item {
        color: var(--color-text-light) !important;
        font-size: 12px;
        font-weight: 500;
        font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
      }
      .cochecklist-filter .ant-select-arrow {
        color: var(--color-text-light);
      }
      .cochecklist-filter.ant-select-focused .ant-select-selector,
      .cochecklist-filter:hover .ant-select-selector {
        border-color: var(--color-primary-dark) !important;
      }
      .cochecklist-create {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: auto !important;
        padding: 8px 16px !important;
        border: none !important;
        border-radius: 8px !important;
        background: var(--ncb-primary-500) !important;
        color: var(--color-white) !important;
        font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
        font-size: 13px !important;
        font-weight: 600 !important;
        box-shadow: none !important;
      }
      .cochecklist-create:hover,
      .cochecklist-create:focus {
        box-shadow: 0 4px 8px rgba(26, 54, 54, 0.12) !important;
      }
      .cochecklist-table-shell {
        background: var(--color-white);
        border-radius: 8px;
      }
      .cochecklist-table-shell .ant-table-tbody > tr:hover > td {
        cursor: pointer;
      }
      .cochecklist-primary-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .cochecklist-primary-value {
        color: var(--color-text-dark);
        font-size: 13px;
        font-weight: 400;
        letter-spacing: -0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cochecklist-secondary-value {
        color: var(--color-text-light);
        font-size: 12px;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cochecklist-created-cell {
        display: flex;
        align-items: center;
        min-width: 0;
      }
      .cochecklist-created-date {
        color: var(--color-text-medium);
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cochecklist-muted {
        color: var(--color-text-medium);
        font-size: 13px;
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cochecklist-table-shell .ant-table-thead > tr > th {
        font-size: 12px;
        font-weight: 600;
        font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
      }
      .cochecklist-table-shell .ant-table-tbody > tr > td {
        font-size: 13px;
        font-family: 'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif;
      }
      .cochecklist-table-shell .creator-badge {
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
      }
      .cochecklist-table-shell .ant-pagination {
        align-items: center;
        gap: 6px;
      }
      .cochecklist-table-shell .ant-pagination .ant-pagination-item,
      .cochecklist-table-shell .ant-pagination .ant-pagination-prev,
      .cochecklist-table-shell .ant-pagination .ant-pagination-next,
      .cochecklist-table-shell .ant-pagination .ant-pagination-jump-prev,
      .cochecklist-table-shell .ant-pagination .ant-pagination-jump-next,
      .cochecklist-table-shell .ant-pagination .ant-pagination-item-link {
        font-size: 13px;
        color: var(--color-text-dark) !important;
      }
      .cochecklist-table-shell .ant-pagination .ant-pagination-item a,
      .cochecklist-table-shell .ant-pagination .ant-pagination-prev button,
      .cochecklist-table-shell .ant-pagination .ant-pagination-next button,
      .cochecklist-table-shell .ant-pagination .ant-pagination-jump-prev button,
      .cochecklist-table-shell .ant-pagination .ant-pagination-jump-next button {
        font-size: 12px;
        font-weight: 500;
        color: var(--color-text-dark) !important;
      }
      .cochecklist-table-shell .ant-pagination .ant-pagination-options,
      .cochecklist-table-shell .ant-pagination .ant-pagination-total-text {
        color: var(--color-text-dark) !important;
        font-size: 12px;
        font-weight: 500;
      }
      .cochecklist-table-shell .ant-pagination .ant-select-selector,
      .cochecklist-table-shell .ant-pagination .ant-select-selection-item,
      .cochecklist-table-shell .ant-pagination .ant-select-selection-placeholder {
        font-size: 12px !important;
        color: var(--color-text-dark) !important;
      }
      .cochecklist-table-shell .ant-pagination .ant-select-arrow {
        color: var(--color-text-dark) !important;
      }
      @media (min-width: 768px) {
        .cochecklist-toolbar {
          display: grid;
          grid-template-columns: auto 1fr auto;
        }
        .cochecklist-title {
          font-size: 17px;
        }
        .cochecklist-actions {
          justify-content: flex-end;
        }
      }
      @media (min-width: 1024px) {
        .cochecklist-title {
          font-size: 18px;
        }
      }
      @media (max-width: 767px) {
        .cochecklist-card {
          border-radius: 8px;
        }
        .cochecklist-filter {
          min-width: 100%;
        }
      }
  `;

  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 120,
      ellipsis: true,
      render: (text) => (
        <div className="cochecklist-primary-cell">
          <span className="cochecklist-primary-value">{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 140,
      ellipsis: true,
      render: (text) => (
        <span className="cochecklist-primary-value">{text || "-"}</span>
      ),
    },
    {
      title: "Customer Number",
      dataIndex: "customerNumber",
      width: 130,
      ellipsis: true,
      render: (text) => (
        <span className="cochecklist-muted">{text || "-"}</span>
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
          <div className="cochecklist-created-cell">
            <span className="cochecklist-created-date">
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
        <span className="cochecklist-muted" style={{ fontFamily: "monospace" }}>
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
      render: (text) => <span className="cochecklist-muted">{text || "-"}</span>,
    },
    {
      title: "Assigned RM",
      dataIndex: "assignedToRM",
      width: 110,
      ellipsis: true,
      filters: rmOptions,
      onFilter: (value, record) => record.assignedToRM?.name === value,
      render: (rm) => (
        <span className="cochecklist-muted">
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
        return <span className="cochecklist-primary-value">{totalDocCount}</span>;
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
          <span className={`creator-badge creator-badge--${statusMeta.variant}`}>
            {statusMeta.label}
          </span>
        );
      },
    },
    // Removed the "Actions" column since we're making the entire row clickable
  ];

  return (
    <div
      style={{
        padding: 0,
        boxSizing: "border-box",
        minHeight: "100%",
      }}
      className="cochecklist-page creator-theme"
    >
      <style>{customTableStyles}</style>

      {isDrawerOpen ? (
        <ChecklistsPage
          open={isDrawerOpen}
          draftId={restoredDraftId}
          onClose={() => {
            setDrawerOpen(false);
            setDraftToRestore?.(null);
            refetch();
          }}
          coCreatorId={userId}
        />
      ) : (
      <div className="cochecklist-shell">
        <div className="cochecklist-card">
          <div className="cochecklist-toolbar">
            <div className="cochecklist-toolbar-left">
              <Button
                type="default"
                onClick={() => setDrawerOpen(true)}
                className="cochecklist-create"
              >
                + Create New DCL
              </Button>
            </div>

            <div className="cochecklist-toolbar-center">
              <h2 className="cochecklist-title">Created Checklists</h2>
            </div>

            <div className="cochecklist-actions">
              <Select
                allowClear
                placeholder="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                className="cochecklist-filter creator-select"
              />
              <Select
                allowClear
                placeholder="Loan Type"
                options={loanTypeOptions}
                value={loanTypeFilter}
                onChange={setLoanTypeFilter}
                className="cochecklist-filter creator-select"
              />
              <Select
                allowClear
                placeholder="Assigned RM"
                options={rmOptions}
                value={rmFilter}
                onChange={setRmFilter}
                className="cochecklist-filter creator-select"
              />
            </div>
          </div>

          <div className="creator-table-shell cochecklist-table-shell">
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
                  if (checklistId) {
                    navigate(`/cocreator/review/${checklistId}`);
                  }
                },
                style: { cursor: "pointer" },
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
