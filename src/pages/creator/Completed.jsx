import React, { useMemo, useState } from "react";
import {
  Table,
  Spin,
  Empty,
  Input,
} from "antd";
import "../../styles/creatorTableOverrides.css";
import {
  SearchOutlined,
} from "@ant-design/icons";
import {
  useGetChecklistsByCreatorQuery,
} from "../../api/checklistApi";
import { formatDate } from "../../utils/checklistUtils";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const pageRootClassName = "min-h-full w-full bg-white";
const queueCardClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName = "flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] bg-white p-4 max-md:flex-col max-md:items-stretch";
const titleClassName = "m-0 text-xs font-bold leading-tight tracking-[-0.02em] text-[#374151]";
const toolbarActionsClassName = "flex flex-wrap items-center gap-2 max-md:w-full";
const countPillClassName = "inline-flex items-center gap-2 rounded-full border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-2 text-xs font-medium text-[#374151]";
const searchClassName = "w-full min-[769px]:max-w-[380px] [&_.ant-input-affix-wrapper]:rounded-md [&_.ant-input-affix-wrapper]:border-[rgba(214,189,152,0.2)] [&_.ant-input-affix-wrapper]:bg-white [&_.ant-input-affix-wrapper]:px-2.5 [&_.ant-input-affix-wrapper]:py-1.5 [&_.ant-input-affix-wrapper]:shadow-none [&_.ant-input-affix-wrapper:hover]:border-(--color-primary-dark) [&_.ant-input-affix-wrapper-focused]:border-(--color-primary-dark) [&_.ant-input]:bg-transparent [&_.ant-input]:text-xs [&_.ant-input]:text-[#374151] [&_.anticon]:text-(--color-text-light)";
const tableShellClassName = "bg-white px-4 pb-4 [&_.ant-table]:w-full [&_.ant-table]:table-fixed [&_.ant-table-wrapper]:bg-white [&_.ant-spin-nested-loading]:bg-white [&_.ant-spin-container]:bg-white [&_.ant-table-container]:bg-white [&_.ant-table-content]:overflow-x-auto [&_.ant-table-header]:bg-inherit [&_.ant-table-body]:bg-inherit [&_.ant-empty]:bg-inherit [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-[#374151] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-[#374151] [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr:hover>td]:bg-[rgba(245,247,244,0.9)] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active_a]:font-medium [&_.ant-pagination_.ant-pagination-item-active_a]:text-(--color-text-dark) [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";
const stateClassName = "bg-white px-4 py-6";
const approvedBadgeClassName = "inline-flex items-center rounded-full border border-[rgba(82,196,26,0.24)] bg-[rgba(82,196,26,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[#365314]";

const Completed = () => {
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  /* ---------------- FETCH DATA ---------------- */
  // const {
  //   data: allChecklists = [],
  //   isLoading,
  //   refetch,
  // } = useGetChecklistsByCreatorQuery();

  const { user } = useSelector((state) => state.auth);

  const creatorId = user?.id || user?._id;

  const {
    data: allChecklists = [],
    isLoading,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
  });

  /* ---------------- FILTER APPROVED ---------------- */
  const filteredData = useMemo(() => {
    let filtered = allChecklists.filter((c) => {
      const statusLower = c.status?.toLowerCase() || "";
      // Show completed/approved checklists
      // Exclude revived copies (co_creator_review status) as those go to CoChecklistPage
      const isCompletedOrApproved =
        statusLower === "approved" || statusLower === "completed";
      const isNotRevived = statusLower !== "co_creator_review";

      return isCompletedOrApproved && isNotRevived;
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q) ||
          c.approvedBy?.name?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allChecklists, searchText]);


  // ✅ Helper function to get assigned checker info
  const getCheckerInfo = (record) => {
    // Priority: assignedToCoChecker → assignedChecker → checkerAssigned → coChecker
    return (
      record.assignedToCoChecker ||
      record.assignedChecker ||
      record.checkerAssigned ||
      record.coChecker ||
      null
    );
  };

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-[#374151]">{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 146,
      ellipsis: true,
      render: (text) => <div className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-[#374151]">{text || "-"}</div>,
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 132,
      ellipsis: true,
      render: (text) => <div className="truncate whitespace-nowrap text-[13px] font-normal text-[#374151]">{text || "-"}</div>,
    },
    {
      title: "IBPS NO",
      dataIndex: "ibpsNo",
      width: 98,
      ellipsis: true,
      render: (text) => (
        <span className="truncate whitespace-nowrap font-mono text-[13px] font-normal text-[#374151]">
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => <div className="truncate whitespace-nowrap text-[13px] font-normal text-[#374151]">{text || "-"}</div>,
    },
    {
      title: "CHECKER/APPROVER",
      dataIndex: "assignedToCoChecker", // primary field to check for checker info
      width: 138,
      ellipsis: true,
      render: (checkerValue, record) => {
        // ✅ Use helper to get assigned checker info from various field names
        const approver = getCheckerInfo(record);

        // ✅ Handle different possible name field variations
        const checkerName =
          approver?.name ||
          approver?.checkerName ||
          approver?.fullName ||
          approver?.userName ||
          "Not Assigned";

        return (
          <div className="truncate whitespace-nowrap text-[13px] font-medium text-(--color-text-medium)">
            {checkerName}
          </div>
        );
      },
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs = []) => {
        const totalDocs =
          docs.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;
        return <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-[#374151]">{totalDocs}</span>;
      },
    },
    {
      title: "COMPLETED DATE",
      dataIndex: "updatedAt",
      width: 118,
      ellipsis: true,
      render: (date) => (
        <div className="truncate whitespace-nowrap text-[13px] font-medium text-(--color-text-medium)">
          {date ? formatDate(date) : "—"}
        </div>
      ),
    },
    {
      title: "TAT CONSUMED",
      dataIndex: "slaExpiry",
      width: 116,
      ellipsis: true,
      render: (date, record) => (
        <RealTimeSlaTag
          slaExpiry={date}
          startedAt={record?.createdAt}
          emptyLabel="N/A"
          minWidth={60}
          fontSize={12}
          displayStyle="text"
        />
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 92,
      ellipsis: true,
      render: () => (
        <span className={approvedBadgeClassName}>
          Approved
        </span>
      ),
    },
  ];

  return (
    <div className={pageRootClassName}>
      <div className="w-full">
        <div className={`${queueCardClassName} creator-table-header-clean`}>
          <div className={toolbarClassName}>
            <h2 className={titleClassName}>Approved Checklists</h2>
            <div className={toolbarActionsClassName}>
              <span className={countPillClassName}>
                Total
                <strong>{filteredData.length}</strong>
              </span>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search by DCL, Customer, Loan Type or Checker"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={searchClassName}
              />
            </div>
          </div>

          {isLoading ? (
            <div className={stateClassName}>
              <Spin />
            </div>
          ) : filteredData.length === 0 ? (
            <div className={stateClassName}>
              <Empty description="No approved checklists found" />
            </div>
          ) : (
            <div className={tableShellClassName}>
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={columns}
                dataSource={filteredData}
                tableLayout="fixed"
                scroll={{ x: 1120 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(record) => ({
                  onClick: () => {
                    const checklistId = record.id || record._id;
                    if (checklistId) {
                      navigate(`/cocreator/completed/${checklistId}`);
                    }
                  },
                  className: "cursor-pointer",
                })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Completed;
