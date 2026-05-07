// export default Myqueue;
import { useMemo, useState, useEffect } from "react";
import { Table, Spin, Empty, Tabs, Input } from "antd";
import "../../styles/creatorTableOverrides.css";
import { useNavigate } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import {
  useGetChecklistsByCreatorQuery,
  useGetAllCoCreatorChecklistsQuery,
  useLockDclMutation,
} from "../../api/checklistApi";
import { useSelector } from "react-redux";
import { formatCommentTimestamp } from "../../utils/checklistUtils";
import { deleteDraft } from "../../utils/draftsUtils";
import { showLockToast } from "../../utils/authToast";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";

const { TabPane } = Tabs;

const pageRootClassName =
  "min-h-full w-full box-border bg-white [font-family:'Century_Gothic','CenturyGothic','AppleGothic',sans-serif]";
const shellClassName = "w-full";
const cardClassName =
  "overflow-hidden rounded-lg border border-[#d6bd9833] bg-white shadow-[0_1px_2px_rgba(26,54,54,0.06)]";
const toolbarClassName =
  "flex flex-col gap-3 border-b border-[#d6bd9833] bg-white p-4 md:flex-row md:flex-wrap md:items-center md:justify-between";
const titleClassName = "m-0 text-[15px] font-bold leading-tight tracking-[-0.02em] text-[#1f2933]";
const searchClassName =
  "w-full md:w-[min(360px,100%)] [&_.anticon]:text-[#6b7280] [&.ant-input-affix-wrapper]:rounded-md [&.ant-input-affix-wrapper]:border-[#d6bd9833] [&.ant-input-affix-wrapper]:bg-white [&.ant-input-affix-wrapper]:px-3 [&.ant-input-affix-wrapper]:py-2 [&.ant-input-affix-wrapper]:shadow-none hover:[&.ant-input-affix-wrapper]:border-[#3ab3e5] [&.ant-input-affix-wrapper-focused]:border-[#3ab3e5] [&.ant-input-affix-wrapper-focused]:shadow-none [&_input]:bg-transparent [&_input]:text-xs [&_input]:text-[#4b5563]";
const tabsClassName =
  "[&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav]:border-b [&_.ant-tabs-nav]:border-[#d6bd9833] [&_.ant-tabs-nav]:bg-white [&_.ant-tabs-nav]:px-4 max-md:[&_.ant-tabs-nav]:px-0 [&_.ant-tabs-nav-wrap]:overflow-auto [&_.ant-tabs-nav:before]:block [&_.ant-tabs-nav:before]:border-b [&_.ant-tabs-nav:before]:border-[#d6bd9833] [&_.ant-tabs-tab]:mr-6 [&_.ant-tabs-tab]:rounded-none [&_.ant-tabs-tab]:border-0 [&_.ant-tabs-tab]:bg-transparent [&_.ant-tabs-tab]:px-2 [&_.ant-tabs-tab]:pb-3 [&_.ant-tabs-tab]:pt-3.5 [&_.ant-tabs-tab]:text-xs [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-[#6b7280] max-md:[&_.ant-tabs-tab]:mr-[22px] max-md:[&_.ant-tabs-tab]:pb-2.5 max-md:[&_.ant-tabs-tab]:pt-3 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:font-semibold [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-[#3ab3e5] [&_.ant-tabs-ink-bar]:h-0.5 [&_.ant-tabs-ink-bar]:rounded-none [&_.ant-tabs-ink-bar]:bg-[#3ab3e5]";
const tabLabelClassName = "inline-flex items-center gap-1.5";
const tabCountClassName =
  "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d6bd982e] px-[5px] text-[10px] font-bold text-[#1f2933]";
const stateClassName = "bg-white px-4 py-6";
const tableShellClassName =
  "rounded-lg bg-white px-4 pb-4 [&_.ant-table]:table-fixed [&_.ant-table]:w-full [&_.ant-table-cell]:before:hidden [&_.ant-table-cell]:after:hidden [&_.ant-table-container]:before:hidden [&_.ant-table-container]:after:hidden [&_.ant-table-content]:overflow-x-hidden [&_.ant-table-header]:bg-white [&_.ant-table-placeholder]:bg-white [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[#d6bd981f] [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:leading-[1.25] [&_.ant-table-tbody>tr>td]:text-[#4b5563] max-md:[&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-tbody>tr:hover>td]:bg-[#f5f7f4] [&_.ant-table-thead>tr:after]:hidden [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-[14px] [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:leading-tight [&_.ant-table-thead>tr>th]:text-[#6b7280] max-md:[&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:min-w-[34px] [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-item]:bg-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[#d6bd982e] [&_.ant-pagination_.ant-pagination-item-active]:bg-[#d6bd982e] [&_.ant-pagination_.ant-pagination-item-active_a]:font-medium [&_.ant-pagination_.ant-pagination-item-active_a]:text-[#1f2933] [&_.ant-pagination_.ant-pagination-next]:min-w-[34px] [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-next]:bg-transparent [&_.ant-pagination_.ant-pagination-prev]:min-w-[34px] [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:bg-transparent [&_.ant-spin-container]:bg-white";
const primaryCellClassName = "flex min-w-0 flex-col gap-[3px]";
const primaryValueClassName = "truncate text-[13px] font-normal tracking-[-0.01em] text-[#1f2933]";
const mutedClassName = "truncate text-xs font-normal text-[#4b5563]";

const getStatusBadgeClassName = (variant) => {
  switch (variant) {
    case "approved":
      return "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-emerald-800";
    case "rework":
      return "inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-red-700";
    case "pending":
      return "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-amber-700";
    default:
      return "inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium leading-tight text-sky-800";
  }
};

const getLockBadgeClassName = (state) => {
  switch (state) {
    case "mine":
      return "inline-flex min-h-6 max-w-full items-center overflow-hidden rounded-full border border-[#1a363629] bg-[#1a36361f] px-2.5 text-[11px] font-medium leading-none text-[#164679] text-ellipsis whitespace-nowrap";
    case "locked":
      return "inline-flex min-h-6 max-w-full items-center overflow-hidden rounded-full border border-[#b91c1c24] bg-[#b91c1c14] px-2.5 text-[11px] font-medium leading-none text-[#991b1b] text-ellipsis whitespace-nowrap";
    default:
      return "inline-flex min-h-6 max-w-full items-center overflow-hidden rounded-full border border-[#40534c1f] bg-[#40534c14] px-2.5 text-[11px] font-medium leading-none text-[#4b5563] text-ellipsis whitespace-nowrap";
  }
};

const getQueueStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (["cocreatorreview", "co_creator_review"].includes(normalizedStatus)) {
    return { label: "Co-Creator Review", variant: "pending" };
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

  if (normalizedStatus === "rmreview") {
    return { label: "RM Review", variant: "qs-review" };
  }

  if (normalizedStatus === "cocheckerreview") {
    return { label: "Checker Review", variant: "qs-review" };
  }

  return {
    label: (status || "In Progress").replace(/_/g, " "),
    variant: "qs-review",
  };
};

const Myqueue = ({ draftToRestore = null, setDraftToRestore = null }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("co_creator_review"); // Default to CO Creator Review tab
  const [searchText, setSearchText] = useState("");

  const { user } = useSelector((state) => state.auth);
  const creatorId = user?.id || user?._id;

  const getLockMeta = (checklist) => {
    const lockedByUserId = checklist?.lockedByUserId || checklist?.lockedBy?.id;
    const lockedByUserName = checklist?.lockedBy?.name || checklist?.lockedByUserName;
    const isLockedBySomeoneElse = !!lockedByUserId && lockedByUserId !== creatorId;
    const isLockedByMe = !!lockedByUserId && lockedByUserId === creatorId;

    return {
      lockedByUserId,
      lockedByUserName,
      isLockedBySomeoneElse,
      isLockedByMe,
    };
  };

  // Fetch creator's checklists (with polling to keep lock status fresh)
  const {
    data: allChecklists = [],
    isLoading: isLoadingCreator,
    refetch: refetchCreatorChecklists,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
    // Poll every 2 seconds to keep lock badges fresh across sessions
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Fetch ALL DCLs in the system (for Active DCLs tab)
  const {
    data: allSystemDcls = [],
    isLoading: isLoadingUnassigned,
    refetch: refetchSystemDcls,
  } = useGetAllCoCreatorChecklistsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    // Poll every 2 seconds to keep lock badges fresh across sessions
    pollingInterval: 2000,
    refetchOnFocus: true,
  });

  // Lock DCL mutation
  const [lockDcl] = useLockDclMutation();

  // Restore drafts by opening the routed review page for the checklist.
  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      const checklistId = draftToRestore.data.checklistId || draftToRestore.id;

      if (checklistId) {
        deleteDraft(draftToRestore.id);
        navigate(`/cocreator/review/${checklistId}`, {
          state: {
            initialTab: "documents",
            source: "drafts",
            restoredDraft: draftToRestore,
          },
        });
      }

      if (setDraftToRestore) {
        setDraftToRestore(null);
      }
    }
  }, [draftToRestore, navigate, setDraftToRestore]);

  // Lock when needed, then open the routed review page.
  const handleSelectChecklist = async (checklist) => {
    const checklistId = checklist?.id || checklist?._id;
    const { isLockedBySomeoneElse, lockedByUserName } = getLockMeta(checklist);

    if (!checklistId) {
      return;
    }

    if (isLockedBySomeoneElse) {
      showLockToast(lockedByUserName || "another user");
      return;
    }

    // Lock DCL for both active/unassigned and co-creator review tabs
    if (activeTab === "unassigned" || activeTab === "co_creator_review") {
      try {
        await lockDcl(checklistId).unwrap();

        // Refetch data to update lock status across all tabs
        refetchCreatorChecklists();
        refetchSystemDcls();
      } catch (error) {
        console.error("Failed to lock DCL:", error);
        if (error?.data?.lockedByUserId) {
          showLockToast(error?.data?.lockedByUserName || "another user");
          refetchCreatorChecklists();
          refetchSystemDcls();
          return;
        }
      }
    }

    navigate(`/cocreator/review/${checklistId}`, {
      state: { initialTab: "documents", source: "myqueue" },
    });
  };

  /* ---------------- UNASSIGNED DCLS QUEUE (NEW TAB) ---------------- */
  const unassignedQueue = useMemo(() => {
    let filtered = allSystemDcls.filter((c) => {
      const status = (c.status || "").toLowerCase();
      return status === "cocreatorreview";
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [allSystemDcls, searchText]);

  /* ---------------- CO_CREATOR_REVIEW QUEUE ---------------- */
  const coCreatorReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "cocreatorreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  /* ---------------- RM_REVIEW QUEUE ---------------- */
  const rmReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "rmreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  /* ---------------- CO_CHECKER_REVIEW QUEUE ---------------- */
  const coCheckerReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "cocheckerreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  const tabCounts = useMemo(
    () => ({
      co_creator_review: allChecklists.filter(
        (c) => (c.status || "").toLowerCase() === "cocreatorreview",
      ).length,
      rm_review: allChecklists.filter(
        (c) => (c.status || "").toLowerCase() === "rmreview",
      ).length,
      co_checker_review: allChecklists.filter(
        (c) => (c.status || "").toLowerCase() === "cocheckerreview",
      ).length,
      unassigned: allSystemDcls.filter(
        (c) => (c.status || "").toLowerCase() === "cocreatorreview",
      ).length,
    }),
    [allChecklists, allSystemDcls],
  );

  const renderTabLabel = (label, count) => (
    <span className={tabLabelClassName}>
      <span>{label}</span>
      <span className={tabCountClassName}>{count}</span>
    </span>
  );

  /* ---------------- TABLE COLUMNS ---------------- */
  const getColumns = () => [
    {
      title: "DCL NO",
      dataIndex: "dclNo",
      width: 124,
      ellipsis: true,
      render: (text) => (
        <div className={primaryCellClassName}>
          <span className={primaryValueClassName}>{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "CUSTOMER NAME",
      dataIndex: "customerName",
      width: 146,
      ellipsis: true,
      render: (text) => <span className={primaryValueClassName}>{text || "-"}</span>,
    },
    {
      title: "CUSTOMER NUMBER",
      dataIndex: "customerNumber",
      width: 134,
      ellipsis: true,
      render: (text) => <span className={mutedClassName}>{text || "-"}</span>,
    },
    {
      title: "TIME/DATE CREATED",
      dataIndex: "createdAt",
      width: 142,
      ellipsis: true,
      render: (value, record) => (
        <span className={mutedClassName}>
          {formatCommentTimestamp(value || record.createdAt || record.updatedAt) || "-"}
        </span>
      ),
    },
    {
      title: "IBPS NO",
      dataIndex: "ibpsNo",
      width: 98,
      ellipsis: true,
      render: (text) => (
        <span className={`${mutedClassName} font-mono`}>
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "LOAN TYPE",
      dataIndex: "loanType",
      width: 118,
      ellipsis: true,
      render: (text) => <span className={mutedClassName}>{text || "-"}</span>,
    },
    {
      title: "ASSIGNED RM",
      dataIndex: "assignedToRM",
      width: 122,
      ellipsis: true,
      render: (rm) => <span className={mutedClassName}>{rm?.name || "Not Assigned"}</span>,
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 74,
      align: "center",
      render: (docs = []) => {
        const total = docs.reduce((sum, documentItem) => {
          if (Array.isArray(documentItem?.docList)) {
            return sum + documentItem.docList.length;
          }

          return sum + 1;
        }, 0);

        return <span className={primaryValueClassName}>{total}</span>;
      },
    },
    {
      title: "STATUS",
      width: 96,
      ellipsis: true,
      render: (_, record) => {
        const statusMeta = getQueueStatusMeta(record.status);

        return (
          <span className={getStatusBadgeClassName(statusMeta.variant)}>
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
          return <span className={getLockBadgeClassName("mine")}>Locked by you</span>;
        }

        if (isLockedBySomeoneElse) {
          return (
            <span className={getLockBadgeClassName("locked")} title={lockedByUserName || "Locked"}>
              {`Locked by ${lockedByUserName || "user"}`}
            </span>
          );
        }

        return <span className={getLockBadgeClassName("open")}>Available</span>;
      },
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
          businessHoursOnly
        />
      ),
    },
  ];

  return (
    <div className={pageRootClassName}>
      <div className={`${shellClassName} creator-table-header-clean`}>
        <div className={cardClassName}>
          <div className={toolbarClassName}>
            <h2 className={titleClassName}>My Queue</h2>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search DCL / Customer / Loan"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className={searchClassName}
            />
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} className={tabsClassName}>
        {/* NEW TAB: Unassigned DCLs */}

        <TabPane tab={renderTabLabel("My Queue", tabCounts.co_creator_review)} key="co_creator_review">
          {isLoadingCreator ? (
            <div className={stateClassName}>
              <Spin className="block" />
            </div>
          ) : coCreatorReviewQueue.length === 0 ? (
            <div className={stateClassName}>
              <Empty description="No pending items" />
            </div>
          ) : (
            <div className={tableShellClassName}>
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={coCreatorReviewQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                  className: "cursor-pointer",
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab={renderTabLabel("RM Review", tabCounts.rm_review)} key="rm_review">
          {isLoadingCreator ? (
            <div className={stateClassName}>
              <Spin className="block" />
            </div>
          ) : rmReviewQueue.length === 0 ? (
            <div className={stateClassName}>
              <Empty description="No RM review items" />
            </div>
          ) : (
            <div className={tableShellClassName}>
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={rmReviewQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                  className: "cursor-pointer",
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab={renderTabLabel("CO Checker Review", tabCounts.co_checker_review)} key="co_checker_review">
          {isLoadingCreator ? (
            <div className={stateClassName}>
              <Spin className="block" />
            </div>
          ) : coCheckerReviewQueue.length === 0 ? (
            <div className={stateClassName}>
              <Empty description="No approved items" />
            </div>
          ) : (
            <div className={tableShellClassName}>
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={coCheckerReviewQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                  className: "cursor-pointer",
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane
          tab={renderTabLabel("All DCLs(Creator Review)", tabCounts.unassigned)}
          key="unassigned"
        >
          {isLoadingUnassigned ? (
            <div className={stateClassName}>
              <Spin className="block" />
            </div>
          ) : unassignedQueue.length === 0 ? (
            <div className={stateClassName}>
              <Empty description="No unassigned DCLs available" />
            </div>
          ) : (
            <div className={tableShellClassName}>
              <Table
                rowKey={(record) => record.id || record._id || record.dclNo}
                columns={getColumns()}
                dataSource={unassignedQueue}
                tableLayout="fixed"
                scroll={{ x: 1160 }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  position: ["bottomCenter"],
                }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                  className: "cursor-pointer",
                })}
              />
            </div>
          )}
        </TabPane>
      </Tabs>
        </div>
      </div>

    </div>
  );
};

export default Myqueue;
