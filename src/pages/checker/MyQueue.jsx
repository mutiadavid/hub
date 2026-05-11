// export default AllChecklists;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Button, Input, Select, Tabs, Spin, Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ChecklistsPage from "./ChecklistsPage.jsx";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal.jsx";
import {
  useGetAllCoCreatorChecklistsQuery,
  useGetCheckerMyQueueQuery,
  useLockDclMutation,
} from "../../api/checklistApi.js";
import { showLockToast } from "../../utils/authToast.js";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag.jsx";

const pageRootClassName = "min-h-full w-full bg-(--color-bg)";
const inlineReviewClassName = "w-full min-h-full border-0 bg-transparent p-0 shadow-none";
const queueCardClassName = "overflow-hidden rounded-lg border border-[rgba(214,189,152,0.2)] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName = "flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(214,189,152,0.2)] bg-(--color-bg) p-4 max-md:flex-col max-md:items-stretch";
const titleClassName = "m-0 text-[15px] leading-tight font-bold tracking-[-0.02em] text-(--color-text-dark)";
const toolbarActionsClassName = "flex flex-1 flex-wrap items-center justify-end gap-2.5";
const searchClassName = "w-full min-[769px]:max-w-[360px] [&_.ant-input-affix-wrapper]:rounded-md [&_.ant-input-affix-wrapper]:border-[rgba(214,189,152,0.2)] [&_.ant-input-affix-wrapper]:bg-white [&_.ant-input-affix-wrapper]:px-3 [&_.ant-input-affix-wrapper]:py-2 [&_.ant-input-affix-wrapper]:shadow-none [&_.ant-input-affix-wrapper:hover]:border-(--color-primary-dark) [&_.ant-input-affix-wrapper-focused]:border-(--color-primary-dark) [&_.ant-input]:bg-transparent [&_.ant-input]:text-xs [&_.ant-input]:text-(--color-text-medium) [&_.anticon]:text-(--color-text-light)";
const filterClassName = "min-w-[180px] [&_.ant-select-selector]:h-[38px]! [&_.ant-select-selector]:rounded-md! [&_.ant-select-selector]:border-[rgba(214,189,152,0.2)]! [&_.ant-select-selector]:bg-white! [&_.ant-select-selector]:px-3! [&_.ant-select-selector]:py-1! [&_.ant-select-selector]:shadow-none! [&_.ant-select-arrow]:text-(--color-text-light)";
const clearButtonClassName = "h-[38px]! rounded-md! border-[rgba(214,189,152,0.28)]! bg-white! text-(--color-text-medium)! text-xs! font-semibold! shadow-none! hover:border-(--color-primary-dark)! hover:bg-[rgba(214,189,152,0.08)]! hover:text-(--color-primary-dark)!";
const tabsClassName = "[&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:border-b [&_.ant-tabs-nav]:border-[rgba(214,189,152,0.2)] [&_.ant-tabs-nav]:bg-white [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-nav::before]:border-b-[rgba(214,189,152,0.2)] [&_.ant-tabs-tab]:m-0! [&_.ant-tabs-tab]:mr-6! [&_.ant-tabs-tab]:rounded-none! [&_.ant-tabs-tab]:border-0! [&_.ant-tabs-tab]:bg-transparent! [&_.ant-tabs-tab]:px-2! [&_.ant-tabs-tab]:pb-3! [&_.ant-tabs-tab]:pt-3.5! [&_.ant-tabs-tab]:text-xs [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-(--color-text-light) [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-(--color-primary-dark)! [&_.ant-tabs-ink-bar]:h-0.5 [&_.ant-tabs-ink-bar]:bg-(--color-primary-dark)";
const tabLabelClassName = "inline-flex items-center gap-1.5";
const tabCountClassName = "inline-flex min-w-[18px] items-center justify-center rounded-full bg-[rgba(214,189,152,0.18)] px-[5px] text-[10px] font-bold text-(--color-text-dark)";
const tableShellClassName = "bg-white px-4 pb-4 [&_.ant-table]:w-full [&_.ant-table]:table-fixed [&_.ant-table-wrapper]:bg-transparent [&_.ant-spin-nested-loading]:bg-transparent [&_.ant-spin-container]:bg-transparent [&_.ant-table-container]:bg-transparent [&_.ant-table-content]:overflow-x-hidden [&_.ant-table-header]:bg-inherit [&_.ant-table-body]:bg-inherit [&_.ant-empty]:bg-inherit [&_.ant-table-thead>tr>th]:bg-transparent [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3.5 [&_.ant-table-thead>tr>th]:text-[11px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-(--color-text-medium) [&_.ant-table-thead>tr>th]:border-b [&_.ant-table-thead>tr>th]:border-[rgba(214,189,152,0.2)] [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:bg-transparent [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr:hover>td]:bg-[rgba(214,189,152,0.06)] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active_a]:font-bold [&_.ant-pagination_.ant-pagination-item-active_a]:text-(--color-text-dark) [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";
const contentStateClassName = "bg-white px-4 py-6";

const getLockBadgeClassName = (variant) => {
  if (variant === "mine") return "border-[rgba(26,54,54,0.16)] bg-[rgba(26,54,54,0.12)] text-(--color-primary-dark)";
  if (variant === "locked") return "border-[rgba(185,28,28,0.14)] bg-[rgba(185,28,28,0.08)] text-[#991b1b]";
  return "border-[rgba(64,83,76,0.12)] bg-[rgba(64,83,76,0.08)] text-(--color-text-medium)";
};

const getStatusBadgeClassName = (variant) => {
  if (variant === "approved") return "border-[rgba(82,196,26,0.2)] bg-[rgba(82,196,26,0.12)] text-[var(--color-status-success)]";
  if (variant === "rework") return "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.12)] text-[#b45309]";
  if (variant === "pending") return "border-[rgba(214,189,152,0.24)] bg-[rgba(214,189,152,0.14)] text-(--color-primary-dark)";
  return "border-[rgba(22,70,121,0.18)] bg-[rgba(22,70,121,0.1)] text-(--color-primary-dark)";
};

const { TabPane } = Tabs;

const getQueueStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "approved") {
    return { label: "Approved", variant: "approved" };
  }

  if (normalizedStatus === "rejected") {
    return { label: "Rejected", variant: "rework" };
  }

  if (["cocreatorreview", "co_creator_review", "pending"].includes(normalizedStatus)) {
    return { label: "Pending", variant: "pending" };
  }

  if (["rmreview", "rm_review"].includes(normalizedStatus)) {
    return { label: "RM Review", variant: "qs-review" };
  }

  if (["cocheckerreview", "co_checker_review"].includes(normalizedStatus)) {
    return { label: "Checker Review", variant: "qs-review" };
  }

  return {
    label: (status || "In Progress").replace(/_/g, " "),
    variant: "qs-review",
  };
};

const matchesActiveTab = (status, activeTab) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (activeTab === "assigned" || activeTab === "all") {
    return normalizedStatus === "co_checker_review" || normalizedStatus === "cocheckerreview";
  }

  return normalizedStatus === activeTab;
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

const AllChecklists = ({ userId, draftToRestore = null, setDraftToRestore = null }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("assigned");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [lockDcl] = useLockDclMutation();

  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      const draftChecklist = {
        id: draftToRestore.data.checklistId || draftToRestore.id,
        _id: draftToRestore.data.checklistId || draftToRestore.id,
        dclNo: draftToRestore.data.dclNo,
        title: draftToRestore.data.title,
        customerName: draftToRestore.data.customerName,
        customerNumber: draftToRestore.data.customerNumber,
        loanType: draftToRestore.data.loanType,
        status: draftToRestore.data.status,
        documents: draftToRestore.data.documents || [],
        supportingDocs: draftToRestore.data.supportingDocs || [],
        checkerComment:
          draftToRestore.data.checkerComment ||
          draftToRestore.data.creatorComment ||
          "",
        _checkerComment:
          draftToRestore.data.checkerComment ||
          draftToRestore.data.creatorComment ||
          "",
        commentTrail: draftToRestore.data.commentTrail || [],
        _draftCommentTrail: draftToRestore.data.commentTrail || [],
        _draftRestored: true,
      };

      const restoreId = window.setTimeout(() => {
        setSelectedChecklist(draftChecklist);
      }, 0);

      if (setDraftToRestore) {
        setDraftToRestore(null);
      }

      return () => window.clearTimeout(restoreId);
    }

    return undefined;
  }, [draftToRestore, setDraftToRestore]);

  const { data: myChecklists = [], refetch, isLoading } =
    useGetCheckerMyQueueQuery(userId, {
      skip: !userId,
      pollingInterval: 2000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    });
  const { data: allChecklists = [], isLoading: isLoadingAllChecklists } =
    useGetAllCoCreatorChecklistsQuery(undefined, {
      pollingInterval: 2000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    });

  const getLockMeta = useCallback(
    (checklist) => {
      const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
      const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
      const isLockedBySomeoneElse = !!lockedByUserId && lockedByUserId !== userId;
      const isLockedByMe = !!lockedByUserId && lockedByUserId === userId;

      return {
        lockedByUserId,
        lockedByUserName,
        isLockedBySomeoneElse,
        isLockedByMe,
      };
    },
    [userId],
  );

  const openChecklist = useCallback(
    async (checklist) => {
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
        lockedByUserId: userId,
        lockedByUserName: "Current User",
        lockedBy: { id: userId, name: "Current User" },
      });
    },
    [getLockMeta, lockDcl, userId],
  );

  const applyCommonFilters = useCallback(
    (checklists) =>
      checklists.filter((checklist) => {
      const searchTarget = [
        checklist.dclNo,
        checklist.customerName,
        checklist.customerNumber,
        checklist.loanType,
        checklist.assignedToChecker?.name,
        checklist.assignedToRM?.name,
        checklist.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchText || searchTarget.includes(searchText.toLowerCase());

      const normalizedStatus = String(checklist.status || "")
        .trim()
        .toLowerCase();
      const matchesStatus = matchesActiveTab(normalizedStatus, activeTab);

      const normalizedLoanType = String(checklist.loanType || "")
        .trim()
        .toLowerCase();
      const matchesLoanType =
        loanTypeFilter === "all" || normalizedLoanType === loanTypeFilter;

        return matchesSearch && matchesStatus && matchesLoanType;
      }),
    [activeTab, loanTypeFilter, searchText],
  );

  const assignedReviewChecklists = useMemo(
    () => applyCommonFilters(myChecklists),
    [applyCommonFilters, myChecklists],
  );

  const allReviewChecklists = useMemo(
    () => applyCommonFilters(allChecklists),
    [allChecklists, applyCommonFilters],
  );

  const statusCounts = useMemo(
    () => ({
      assigned: myChecklists.filter((item) => {
        const value = String(item.status || "").trim().toLowerCase();
        return value === "co_checker_review" || value === "cocheckerreview";
      }).length,
      all: allChecklists.filter((item) => {
        const value = String(item.status || "").trim().toLowerCase();
        return value === "co_checker_review" || value === "cocheckerreview";
      }).length,
    }),
    [allChecklists, myChecklists],
  );

  const loanTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          myChecklists
            .map((item) => item.loanType)
            .filter(Boolean)
            .map((value) => value.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [myChecklists],
  );

  const clearFilters = () => {
    setSearchText("");
    setActiveTab("assigned");
    setLoanTypeFilter("all");
  };

  const renderTabLabel = (label, count) => (
    <span className={tabLabelClassName}>
      <span>{label}</span>
      <span className={tabCountClassName}>{count}</span>
    </span>
  );

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
      render: (text) => <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-(--color-text-dark)">{text || "-"}</span>,
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 134,
      ellipsis: true,
      render: (text) => <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{text || "-"}</span>,
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{text || "-"}</span>,
    },
    {
      title: "ASSIGNED RM",
      dataIndex: "assignedToRM",
      width: 122,
      ellipsis: true,
      render: (rm) => <span className="truncate whitespace-nowrap text-xs font-normal text-(--color-text-medium)">{rm?.name || "Not Assigned"}</span>,
    },
    {
      title: "DOCS",
      dataIndex: "documents",
      width: 74,
      align: "center",
      render: (docs = [], record) => {
        const mainTotal = (docs || []).reduce((sum, documentItem) => {
          if (Array.isArray(documentItem?.docList)) {
            return sum + documentItem.docList.length;
          }
          return sum + 1;
        }, 0);

        const supportingTotal = (record.supportingDocs || []).length;
        const total = mainTotal + supportingTotal;

        return (
          <span className="truncate whitespace-nowrap text-[13px] font-normal tracking-[-0.01em] text-(--color-text-dark)">
            {total}
          </span>
        );
      },
    },
    {
      title: "STATUS",
      width: 96,
      ellipsis: true,
      render: (_, record) => {
        const statusMeta = getQueueStatusMeta(record.status);

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
      ellipsis: true,
      sorter: (a, b) => getTatSortValue(a) - getTatSortValue(b),
      defaultSortOrder: "descend",
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
  ];

  return (
    <div className={pageRootClassName}>
      {/* Drawer for creating new DCL */}
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
        <>
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

          <div className="w-full">
            <div className={queueCardClassName}>
              <div className={toolbarClassName}>
                <h2 className={titleClassName}>My Queue</h2>
                <div className={toolbarActionsClassName}>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search DCL / Customer / Loan"
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className={searchClassName}
                  />
                  <Select
                    value={loanTypeFilter}
                    onChange={setLoanTypeFilter}
                    className={filterClassName}
                    options={[
                      { value: "all", label: "All loan types" },
                      ...loanTypeOptions.map((value) => ({
                        value: value.toLowerCase(),
                        label: value,
                      })),
                    ]}
                  />
                  <Button className={clearButtonClassName} onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>

              <Tabs activeKey={activeTab} onChange={setActiveTab} className={tabsClassName}>
                <TabPane tab={renderTabLabel("My Queue", statusCounts.assigned)} key="assigned">
                  {isLoading ? (
                    <div className={contentStateClassName}>
                      <Spin />
                    </div>
                  ) : assignedReviewChecklists.length === 0 ? (
                    <div className={contentStateClassName}>
                      <Empty description="No assigned co-checker review items" />
                    </div>
                  ) : (
                    <div className={tableShellClassName}>
                      <Table
                        columns={columns}
                        dataSource={assignedReviewChecklists}
                        rowKey={(record) => record.id || record._id || record.dclNo}
                        tableLayout="fixed"
                        scroll={{ x: 1040 }}
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
                </TabPane>
                <TabPane tab={renderTabLabel("All DCLs(Checker Review)", statusCounts.all)} key="all">
                  {isLoadingAllChecklists ? (
                    <div className={contentStateClassName}>
                      <Spin />
                    </div>
                  ) : allReviewChecklists.length === 0 ? (
                    <div className={contentStateClassName}>
                      <Empty description="No co-checker review items in the system" />
                    </div>
                  ) : (
                    <div className={tableShellClassName}>
                      <Table
                        columns={columns}
                        dataSource={allReviewChecklists}
                        rowKey={(record) => record.id || record._id || record.dclNo}
                        tableLayout="fixed"
                        scroll={{ x: 1040 }}
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
                </TabPane>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AllChecklists;
