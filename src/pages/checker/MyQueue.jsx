import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { Table, Button, Tag, Spin, Empty, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";
import { useGetCheckerMyQueueQuery, useLockDclMutation } from "../../api/checklistApi.js";
import { showLockToast } from "../../utils/authToast";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";

const pageRootClassName = "min-h-full w-full bg-white";
const inlineReviewClassName = "w-full min-h-full border-0 bg-transparent p-0 shadow-none";
const queueCardClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName = "flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] bg-white p-4 max-md:flex-col max-md:items-stretch";
const titleClassName = "m-0 text-[15px] leading-tight font-bold tracking-[-0.02em] text-(--color-text-dark)";
const searchClassName = "w-full min-[769px]:max-w-[360px] [&_.ant-input-affix-wrapper]:rounded-md [&_.ant-input-affix-wrapper]:border-[rgba(214,189,152,0.2)] [&_.ant-input-affix-wrapper]:bg-white [&_.ant-input-affix-wrapper]:px-3 [&_.ant-input-affix-wrapper]:py-2 [&_.ant-input-affix-wrapper]:shadow-none [&_.ant-input-affix-wrapper:hover]:border-(--color-primary-dark) [&_.ant-input-affix-wrapper-focused]:border-(--color-primary-dark) [&_.ant-input]:bg-transparent [&_.ant-input]:text-xs [&_.ant-input]:text-(--color-text-medium) [&_.anticon]:text-(--color-text-light)";
const filtersClassName = "grid gap-3 border-b border-[rgba(214,189,152,0.2)] bg-white p-4 min-[1025px]:grid-cols-[minmax(0,1.5fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(120px,160px)] md:grid-cols-2 max-md:grid-cols-1 [&_.ant-select-selector]:h-[38px]! [&_.ant-select-selector]:rounded-md! [&_.ant-select-selector]:border-[rgba(214,189,152,0.2)]! [&_.ant-select-selector]:shadow-none! [&_.ant-select-selector]:px-3! [&_.ant-select-selector]:py-1! [&_.ant-btn]:h-[38px]! [&_.ant-btn]:rounded-md! [&_.ant-btn]:border-[rgba(214,189,152,0.2)]! [&_.ant-btn]:text-(--color-text-medium)! [&_.ant-btn]:font-semibold! [&_.ant-btn]:shadow-none!";
const filterSelectClassName = "w-full";
const tableShellClassName = "bg-white px-4 pb-4 [&_.ant-table]:w-full [&_.ant-table]:table-fixed [&_.ant-table-wrapper]:bg-white [&_.ant-spin-nested-loading]:bg-white [&_.ant-spin-container]:bg-white [&_.ant-table-container]:bg-white [&_.ant-table-content]:overflow-x-auto [&_.ant-table-header]:bg-inherit [&_.ant-table-body]:bg-inherit [&_.ant-empty]:bg-inherit [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3.5 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-(--color-text-medium) [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr:hover>td]:bg-[rgba(245,247,244,0.9)] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active_a]:font-bold [&_.ant-pagination_.ant-pagination-item-active_a]:text-(--color-text-dark) [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";
const loadingClassName = "flex min-h-full items-center justify-center p-6";
const emptyClassName = "bg-white px-4 py-6";

const getLockBadgeClassName = (variant) => {
  if (variant === "mine") return "border-[rgba(26,54,54,0.16)] bg-[rgba(26,54,54,0.12)] text-(--color-primary-dark)";
  if (variant === "locked") return "border-[rgba(185,28,28,0.14)] bg-[rgba(185,28,28,0.08)] text-[#991b1b]";
  return "border-[rgba(64,83,76,0.12)] bg-[rgba(64,83,76,0.08)] text-(--color-text-medium)";
};

const getStatusBadgeClassName = (variant) => {
  if (variant === "approved") return "border-[rgba(82,196,26,0.2)] bg-[rgba(82,196,26,0.12)] text-[var(--color-status-success)]";
  if (variant === "pending") return "border-[rgba(214,189,152,0.24)] bg-[rgba(214,189,152,0.14)] text-(--color-primary-dark)";
  return "border-[rgba(22,70,121,0.18)] bg-[rgba(22,70,121,0.1)] text-(--color-primary-dark)";
};

const getQueueStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (["cocheckerreview", "co_checker_review"].includes(normalizedStatus)) {
    return { label: "Checker Review", variant: "qs-review" };
  }

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  return {
    label: (status || "In Progress").replace(/_/g, " "),
    variant: "pending",
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

const MyQueuePage = () => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");

  // Get checker ID from Redux auth
  const auth = useSelector((state) => state.auth);
  const checkerId = auth?.user?.id || auth?.user?._id || auth?.id || auth?._id;
  const checkerName = auth?.user?.name || auth?.user?.username || auth?.name || auth?.username || "Current User";
  const [lockDcl] = useLockDclMutation();

  const getLockMeta = (checklist) => {
    const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
    const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
    const isLockedBySomeoneElse = !!lockedByUserId && lockedByUserId !== checkerId;
    const isLockedByMe = !!lockedByUserId && lockedByUserId === checkerId;

    return {
      lockedByUserId,
      lockedByUserName,
      isLockedBySomeoneElse,
      isLockedByMe,
    };
  };

  const openChecklist = async (checklist) => {
    const checklistId = checklist?.id || checklist?._id;
    const { isLockedBySomeoneElse, isLockedByMe, lockedByUserName } = getLockMeta(checklist);

    if (!checklistId) {
      return;
    }

    if (isLockedBySomeoneElse) {
      showLockToast(lockedByUserName || "another user");
      return;
    }

    if (!isLockedByMe) {
      try {
        await lockDcl(checklistId).unwrap();
      } catch (error) {
        if (error?.data?.lockedByUserId) {
          showLockToast(error?.data?.lockedByUserName || "another user");
          return;
        }

        console.error("Failed to lock checker checklist before opening:", error);
        return;
      }
    }

    setSelectedChecklist({
      ...checklist,
      lockedByUserId: checkerId,
      lockedByUserName: checkerName,
      lockedBy: { id: checkerId, name: checkerName },
    });
  };

  // Fetch checklists assigned to this checker for review
  const {
    data: myQueue = [],
    isLoading,
    refetch,
  } = useGetCheckerMyQueueQuery(checkerId, {
    skip: !checkerId, // Skip query if no checkerId
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  /**
   * ✅ PENDING CHECKLISTS FOR THIS CHECKER
   * These are checklists in CoCheckerReview status assigned to this specific checker
   */
  const pendingChecklists = useMemo(() => {
    const filtered = myQueue.filter((c) => {
      const isPendingReview =
        c.status?.toLowerCase() === "cocheckerreview" ||
        c.status?.toLowerCase() === "co_checker_review";

      if (!isPendingReview) {
        return false;
      }

      const searchTarget = [
        c.dclNo,
        c.customerName,
        c.customerNumber,
        c.loanType,
        c.createdBy?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchText || searchTarget.includes(searchText.toLowerCase());
      const matchesLoanType =
        loanTypeFilter === "all" ||
        (c.loanType || "").toLowerCase() === loanTypeFilter;
      const matchesCreator =
        creatorFilter === "all" ||
        (c.createdBy?.name || "").toLowerCase() === creatorFilter;

      return matchesSearch && matchesLoanType && matchesCreator;
    });
    return filtered;
  }, [creatorFilter, loanTypeFilter, myQueue, searchText]);

  const loanTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myQueue
            .map((item) => item.loanType)
            .filter(Boolean)
            .map((value) => value.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [myQueue],
  );

  const creatorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myQueue
            .map((item) => item.createdBy?.name)
            .filter(Boolean)
            .map((value) => value.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [myQueue],
  );

  const clearFilters = () => {
    setSearchText("");
    setLoanTypeFilter("all");
    setCreatorFilter("all");
  };

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
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 146,
      ellipsis: true,
      render: (text) => (
        <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-(--color-text-dark)">{text || "-"}</span>
      ),
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 134,
      ellipsis: true,
      render: (text) => (
        <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{text || "-"}</span>
      ),
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => (
        <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{text || "-"}</span>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 74,
      align: "center",
      render: (docs) => {
        const totalDocs =
          docs?.reduce((sum, cat) => sum + (cat.docList?.length || 0), 0) || 0;
        return <span className="creator-table-primary-value">{totalDocs}</span>;
      },
    },
    {
      title: "CO CREATOR",
      dataIndex: "createdBy",
      width: 122,
      ellipsis: true,
      render: (creator) => (
        <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{creator?.name || "Not Assigned"}</span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 96,
      ellipsis: true,
      render: (status) => {
        const statusMeta = getQueueStatusMeta(status);
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClassName(statusMeta.variant)}`}>
            {statusMeta.label}
          </span>
        );
      },
    },
    {
      title: "LOCK",
      width: 136,
      ellipsis: true,
      render: (_, record) => {
        const { isLockedByMe, isLockedBySomeoneElse, lockedByUserName } = getLockMeta(record);

        if (isLockedByMe) {
          return <span className={`inline-flex min-h-6 max-w-full items-center truncate rounded-full border px-2.5 text-[11px] font-bold ${getLockBadgeClassName("mine")}`}>Locked by you</span>;
        }

        if (isLockedBySomeoneElse) {
          return (
            <span className={`inline-flex min-h-6 max-w-full items-center truncate rounded-full border px-2.5 text-[11px] font-bold ${getLockBadgeClassName("locked")}`} title={lockedByUserName || "Locked"}>
              {`Locked by ${lockedByUserName || "user"}`}
            </span>
          );
        }

        return <span className={`inline-flex min-h-6 max-w-full items-center truncate rounded-full border px-2.5 text-[11px] font-bold ${getLockBadgeClassName("open")}`}>Available</span>;
      },
    },
    {
      title: "TAT CONSUMED",
      dataIndex: "slaExpiry",
      width: 116,
      sorter: (a, b) => getTatSortValue(a) - getTatSortValue(b),
      defaultSortOrder: "descend",
      fixed: "right",
      ellipsis: true,
      render: (date, record) => (
        <RealTimeSlaTag
          slaExpiry={date}
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
      title: "ACTION",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          className="p-0 text-(--color-primary-medium) font-semibold"
          onClick={() => openChecklist(record)}
        >
          Review
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className={loadingClassName}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={pageRootClassName}>
      <div className="flex flex-col gap-4 bg-white">
        {selectedChecklist ? (
          <section className={inlineReviewClassName}>
            <CheckerReviewChecklistModal
              checklist={selectedChecklist}
              embedded
              open={!!selectedChecklist}
              onClose={() => {
                setSelectedChecklist(null);
                refetch();
              }}
            />
          </section>
        ) : (
          <div className="w-full">
            <div className={queueCardClassName}>
              <div className={toolbarClassName}>
                <h2 className={titleClassName}>My Queue</h2>
                <Input
                  className={searchClassName}
                  placeholder="Search DCL, Customer, Loan, Co-Creator"
                  prefix={<SearchOutlined />}
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className={filtersClassName}>
                <Select
                  value={loanTypeFilter}
                  onChange={setLoanTypeFilter}
                  className={filterSelectClassName}
                  options={[
                    { value: "all", label: "All loan types" },
                    ...loanTypeOptions.map((value) => ({
                      value: value.toLowerCase(),
                      label: value,
                    })),
                  ]}
                />
                <Select
                  value={creatorFilter}
                  onChange={setCreatorFilter}
                  className={filterSelectClassName}
                  options={[
                    { value: "all", label: "All co-creators" },
                    ...creatorOptions.map((value) => ({
                      value: value.toLowerCase(),
                      label: value,
                    })),
                  ]}
                />
                <Button block onClick={clearFilters}>
                  Clear
                </Button>
              </div>

              {pendingChecklists.length === 0 ? (
                <div className={emptyClassName}>
                  <Empty description="No checklists pending review" />
                </div>
              ) : (
                <div className={tableShellClassName}>
                  <Table
                    columns={columns}
                    dataSource={pendingChecklists}
                    rowKey={(record) => record.id || record._id || record.dclNo}
                    tableLayout="fixed"
                    scroll={{ x: 1180 }}
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20", "50"],
                      position: ["bottomCenter"],
                    }}
                    onRow={(record) => ({
                      onClick: () => openChecklist(record),
                      className: "cursor-pointer",
                    })}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQueuePage;
