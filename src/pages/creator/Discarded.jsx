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
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const pageRootClassName = "min-h-full w-full bg-white";
const queueCardClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName = "flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] bg-white p-4 max-md:flex-col max-md:items-stretch";
const titleClassName = "m-0 text-xs font-bold leading-tight tracking-[-0.02em] text-[#374151]";
const toolbarActionsClassName = "flex flex-wrap items-center gap-2 max-md:w-full";
const countPillClassName = "inline-flex items-center gap-2 rounded-full border border-[rgba(214,189,152,0.2)] bg-white px-3.5 py-2 text-xs font-medium text-[#374151]";
const searchClassName = "w-full min-[769px]:max-w-[380px] [&_.ant-input-affix-wrapper]:rounded-md [&_.ant-input-affix-wrapper]:border-[rgba(214,189,152,0.2)] [&_.ant-input-affix-wrapper]:bg-white [&_.ant-input-affix-wrapper]:px-2.5 [&_.ant-input-affix-wrapper]:py-1.5 [&_.ant-input-affix-wrapper]:shadow-none [&_.ant-input]:bg-transparent [&_.ant-input]:text-xs [&_.ant-input]:text-[#374151] [&_.anticon]:text-(--color-text-light)";
const tableShellClassName = "bg-white px-4 pb-4 [&_.ant-table]:w-full [&_.ant-table]:table-fixed [&_.ant-table-wrapper]:bg-white [&_.ant-spin-nested-loading]:bg-white [&_.ant-spin-container]:bg-white [&_.ant-table-container]:bg-white [&_.ant-table-content]:overflow-x-auto [&_.ant-table-header]:bg-inherit [&_.ant-table-body]:bg-inherit [&_.ant-empty]:bg-inherit [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-[#374151] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-[#374151] [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr:hover>td]:bg-[rgba(245,247,244,0.9)] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active_a]:font-medium [&_.ant-pagination_.ant-pagination-item-active_a]:text-(--color-text-dark) [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";
const stateClassName = "bg-white px-4 py-6";
const discardedBadgeClassName = "inline-flex items-center rounded-full border border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.12)] px-2.5 py-1 text-[11px] font-semibold text-[#EF4444]";

const DiscardedDclsPage = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const creatorId = user?.id || user?._id;

  const {
    data: allChecklists = [],
    isLoading,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
  });

  /* ---------------- FILTER DISCARDED ---------------- */
  const filteredData = useMemo(() => {
    let filtered = allChecklists.filter((c) => {
      const statusLower = c.status?.toLowerCase() || "";
      return statusLower === "discarded";
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [allChecklists, searchText]);

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
      width: 160,
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
      width: 130,
      ellipsis: true,
      render: (text) => <div className="truncate whitespace-nowrap text-[13px] font-normal text-[#374151]">{text || "-"}</div>,
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
      title: "DISCARDED DATE",
      dataIndex: "updatedAt",
      width: 124,
      ellipsis: true,
      render: (date) => (
        <div className="truncate whitespace-nowrap text-[13px] font-medium text-(--color-text-medium)">
          {date ? formatDate(date) : "—"}
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 100,
      ellipsis: true,
      render: () => (
        <span className={discardedBadgeClassName}>
          Discarded
        </span>
      ),
    },
  ];

  return (
    <div className={pageRootClassName}>
      <div className="w-full">
        <div className={`${queueCardClassName} creator-table-header-clean`}>
          <div className={toolbarClassName}>
            <h2 className={titleClassName}>Discarded DCLs</h2>
            <div className={toolbarActionsClassName}>
              <span className={countPillClassName}>
                Total
                <strong>{filteredData.length}</strong>
              </span>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search by DCL, Customer or Loan Type"
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
              <Empty description="No discarded DCLs found" />
            </div>
          ) : (
            <div className={tableShellClassName}>
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={columns}
                dataSource={filteredData}
                tableLayout="fixed"
                scroll={{ x: 900 }}
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
                      navigate(`/cocreator/discarded/${checklistId}`);
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

export default DiscardedDclsPage;
