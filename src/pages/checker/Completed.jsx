// export default Completed;
import React, { useMemo, useState } from "react";
import {
  Button,
  Table,
  Spin,
  Empty,
  Input,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { useGetCompletedDCLsForCheckerQuery } from "../../api/checklistApi";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";

const pageRootClassName = "min-h-full w-full bg-white";
const queueCardClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName = "flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] bg-white p-4 max-md:flex-col max-md:items-stretch";
const titleClassName = "m-0 text-[15px] leading-tight font-bold tracking-[-0.02em] text-(--color-text-dark)";
const toolbarActionsClassName = "inline-flex w-full flex-wrap items-center justify-end gap-2 min-[769px]:max-w-[520px]";
const searchClassName = "w-full min-[769px]:max-w-[360px] [&_.ant-input-affix-wrapper]:rounded-md [&_.ant-input-affix-wrapper]:border-[rgba(214,189,152,0.2)] [&_.ant-input-affix-wrapper]:bg-white [&_.ant-input-affix-wrapper]:px-3 [&_.ant-input-affix-wrapper]:py-2 [&_.ant-input-affix-wrapper]:shadow-none [&_.ant-input-affix-wrapper:hover]:border-(--color-primary-dark) [&_.ant-input-affix-wrapper-focused]:border-(--color-primary-dark) [&_.ant-input]:bg-transparent [&_.ant-input]:text-xs [&_.ant-input]:text-(--color-text-medium) [&_.anticon]:text-(--color-text-light)";
const clearButtonClassName = "h-[38px]! rounded-md! border-[rgba(214,189,152,0.2)]! bg-white! px-[18px]! text-(--color-text-medium)! font-semibold! shadow-none! hover:border-(--color-primary-dark)! hover:bg-[rgba(214,189,152,0.08)]! hover:text-(--color-primary-dark)!";
const tableShellClassName = "bg-white px-4 pb-4 [&_.ant-table]:w-full [&_.ant-table]:table-fixed [&_.ant-table-wrapper]:bg-white [&_.ant-spin-nested-loading]:bg-white [&_.ant-spin-container]:bg-white [&_.ant-table-container]:bg-white [&_.ant-table-content]:overflow-x-auto [&_.ant-table-header]:bg-inherit [&_.ant-table-body]:bg-inherit [&_.ant-empty]:bg-inherit [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3.5 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-(--color-text-medium) [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr:hover>td]:bg-[rgba(245,247,244,0.9)] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active_a]:font-bold [&_.ant-pagination_.ant-pagination-item-active_a]:text-(--color-text-dark) [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";
const loadingClassName = "bg-white px-4 py-6";
const generatedAtClassName = "mt-4 text-right text-xs text-(--color-text-light)";

const getStatusBadgeClassName = (variant) => {
  if (variant === "approved") return "border-[rgba(82,196,26,0.2)] bg-[rgba(82,196,26,0.12)] text-[var(--color-status-success)]";
  return "border-[rgba(22,70,121,0.18)] bg-[rgba(22,70,121,0.1)] text-(--color-primary-dark)";
};

const getCompletedStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus === "approved_with_revisions") {
    return { label: "Approved Revised", variant: "qs-review" };
  }

  return {
    label: status || "Completed",
    variant: "approved",
  };
};

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 17;

const parseServerDate = (value) => {
  if (!value) {
    return dayjs.invalid();
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmedValue);
    const normalizedValue = hasExplicitTimezone ? trimmedValue : `${trimmedValue}Z`;
    return dayjs(normalizedValue);
  }

  return dayjs(value);
};

const isWeekend = (moment) => {
  const day = moment.day();
  return day === 0 || day === 6;
};

const calculateBusinessMilliseconds = (started, ended) => {
  if (!started?.isValid?.() || !ended?.isValid?.() || !ended.isAfter(started)) {
    return 0;
  }

  let cursor = started.clone();
  let totalMs = 0;

  while (cursor.isBefore(ended)) {
    if (isWeekend(cursor)) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_START_HOUR);
      continue;
    }

    if (cursor.hour() < BUSINESS_START_HOUR) {
      cursor = cursor.hour(BUSINESS_START_HOUR).minute(0).second(0).millisecond(0);
    } else if (cursor.hour() >= BUSINESS_END_HOUR) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_START_HOUR);
      continue;
    }

    const endOfBusinessDay = cursor
      .clone()
      .hour(BUSINESS_END_HOUR)
      .minute(0)
      .second(0)
      .millisecond(0);
    const intervalEnd = ended.isBefore(endOfBusinessDay) ? ended : endOfBusinessDay;

    if (intervalEnd.isAfter(cursor)) {
      totalMs += intervalEnd.diff(cursor);
      cursor = intervalEnd;
    }

    if (cursor.isBefore(ended)) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_START_HOUR);
    }
  }

  return totalMs;
};

const getTatSortValue = (record) => {
  const startedAt = parseServerDate(record?.createdAt);

  if (!startedAt.isValid()) {
    return 0;
  }

  return calculateBusinessMilliseconds(startedAt, dayjs());
};

const Completed = ({ userId }) => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const {
    data: checklists = [],
    isLoading,
  } = useGetCompletedDCLsForCheckerQuery(userId);

  // ✅ No filtering needed - backend already filters by checker and approved status
  const filteredData = useMemo(() => {
    if (!checklists || !userId) return [];

    return checklists.filter((c) => {
      if (!searchText) return true;

      const query = searchText.toLowerCase();

      return (
        c.dclNo?.toLowerCase().includes(query) ||
        c.customerNumber?.toLowerCase().includes(query) ||
        c.customerName?.toLowerCase().includes(query) ||
        c.loanType?.toLowerCase().includes(query) ||
        c.createdBy?.name?.toLowerCase().includes(query)
      );
    });
  }, [checklists, userId, searchText]);

  const clearFilters = () => setSearchText("");

  const columns = [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-(--color-text-dark)">{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 134,
      ellipsis: true,
      render: (text) => <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{text || "-"}</span>,
    },
    {
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 146,
      ellipsis: true,
      render: (text) => <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-(--color-text-dark)">{text || "-"}</span>,
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{text || "-"}</span>,
    },
    {
      title: "CHECKER",
      dataIndex: "assignedToCoChecker",
      width: 122,
      ellipsis: true,
      render: (checker) => {
        const checkerName = checker?.name || checker || "-";
        return <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{checkerName}</span>;
      },
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 74,
      align: "center",
      render: (documents = [], record) => {
        const mainTotal =
          (documents || []).reduce(
            (total, category) => total + (category.docList?.length || category.items?.length || 0),
            0,
          ) || 0;

        const supportingTotal = (record.supportingDocs || []).length;
        const totalDocs = mainTotal + supportingTotal;

        return (
          <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-(--color-text-dark)">
            {totalDocs}
          </span>
        );
      },
    },
    {
      title: "TIME/DATE COMPLETED",
      dataIndex: "completionDate",
      width: 142,
      ellipsis: true,
      render: (completionDate, record) => (
        <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">
          {dayjs(completionDate || record.updatedAt || record.createdAt).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "TAT CONSUMED",
      dataIndex: "slaExpiry",
      width: 116,
      ellipsis: true,
      sorter: (first, second) => getTatSortValue(first) - getTatSortValue(second),
      defaultSortOrder: "descend",
      render: (slaExpiry, record) => (
        <RealTimeSlaTag
          slaExpiry={slaExpiry}
          startedAt={record?.createdAt}
          emptyLabel="N/A"
          minWidth={60}
          fontSize={12}
          displayStyle="text"
          businessHoursOnly
        />
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 108,
      ellipsis: true,
      render: (status) => {
        const statusMeta = getCompletedStatusMeta(status);
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClassName(statusMeta.variant)}`}>
            {statusMeta.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className={pageRootClassName}>
      <div className="w-full">
        <div className={queueCardClassName}>
          <div className={toolbarClassName}>
            <h2 className={titleClassName}>Completed Checklists</h2>
            <div className={toolbarActionsClassName}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search DCL / Customer / Loan"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className={searchClassName}
              />
              <Button onClick={clearFilters} className={clearButtonClassName}>
                Clear
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className={loadingClassName}>
              <Spin tip="Loading completed checklists..." />
            </div>
          ) : filteredData.length === 0 ? (
            <div className={loadingClassName}>
              <Empty description="No completed checklists found" />
            </div>
          ) : (
            <div className={tableShellClassName}>
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey={(record) => record.id || record._id || record.dclNo}
                tableLayout="fixed"
                scroll={{ x: 980 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(record) => ({
                  onClick: () => {
                    const checklistId = record?.id || record?._id;
                    if (checklistId) {
                      navigate(`/cochecker/completed/${checklistId}`);
                    }
                  },
                  className: "cursor-pointer",
                })}
              />
            </div>
          )}
        </div>
      </div>

      <div className={generatedAtClassName}>
        Generated: {dayjs().format("DD/MM/YYYY HH:mm")}
      </div>
    </div>
  );
};

export default Completed;
