import { Table, Tag, Spin, Empty } from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "../../styles/creatorTableOverrides.css";
import {
  FileTextOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import { formatDate } from "../../utils/checklistUtils";
import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import ReviewChecklistPage from "../../components/modals/ReviewChecklistModalComponents/ReviewChecklistPage";
import RmReviewChecklistModal from "../../components/modals/RmReviewChecklistModalComponents/RmReviewChecklistModal";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";
import CompletedChecklistModal from "../../components/modals/CompletedChecklistModalComponents/CompletedChecklistModal";
import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal/CreatorCompletedChecklistModal";
import RealTimeSlaTag from "../../components/common/RealTimeSlaTag";

const CHECKLIST_STATUS_META = {
  co_creator_review: {
    label: "Co-Creator Review",
    color: "#1890FF", // Bright Blue - distinct for Co-Creator stage
    bgColor: "#E6F7FF",
    borderColor: "#1890FF",
    icon: <SyncOutlined />,
  },
  rm_review: {
    label: "RM Review",
    color: "#722ED1", // Purple - distinct for RM Review stage
    bgColor: "#F9F0FF",
    borderColor: "#722ED1",
    icon: <ClockCircleOutlined />,
  },
  revived: {
    label: "Revived",
    color: "#FA8C16", // Orange - for revived items
    bgColor: "#FFF7E6",
    borderColor: "#FA8C16",
    icon: <ClockCircleOutlined />,
  },
  co_checker_review: {
    label: "Co-Checker Review",
    color: "#13C2C2", // Cyan/Teal - distinct for Checker Review stage
    bgColor: "#E6FFFB",
    borderColor: "#13C2C2",
    icon: <SyncOutlined />,
  },
  approved: {
    label: "Approved",
    color: "#52C41A", // Green - success state
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: "Rejected",
    color: "#FF4D4F", // Red - rejection state
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
    icon: <CloseCircleOutlined />,
  },
  active: {
    label: "Active",
    color: "#1677FF", // Primary blue - active state
    bgColor: "#E6F7FF",
    borderColor: "#1677FF",
    icon: <SyncOutlined />,
  },
  completed: {
    label: "Completed",
    color: "#52C41A", // Green - completion state
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
    icon: <CheckCircleOutlined />,
  },
  pending: {
    label: "Pending",
    color: "#FF4D4F", // Red - pending state (consistent with other pending statuses)
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
    icon: <ClockCircleOutlined />,
  },
  closed: {
    label: "Revived",
    color: "#FA8C16", // Orange - same as revived
    bgColor: "#FFF7E6",
    borderColor: "#FA8C16",
    icon: <ClockCircleOutlined />,
  },
};

const getReportStatusMeta = (status) => {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "approved" || normalizedStatus === "completed") {
    return { label: normalizedStatus === "completed" ? "Completed" : "Approved", variant: "approved" };
  }

  if (normalizedStatus === "rejected") {
    return { label: "Rejected", variant: "rework" };
  }

  if (["pending", "active"].includes(normalizedStatus)) {
    return { label: normalizedStatus === "active" ? "Active" : "Pending", variant: "pending" };
  }

  if (["rm_review", "rmreview"].includes(normalizedStatus)) {
    return { label: "RM Review", variant: "qs-review" };
  }

  if (["co_checker_review", "cocheckerreview"].includes(normalizedStatus)) {
    return { label: "Checker Review", variant: "qs-review" };
  }

  if (["co_creator_review", "cocreatorreview"].includes(normalizedStatus)) {
    return { label: "Co-Creator Review", variant: "pending" };
  }

  if (["revived", "closed"].includes(normalizedStatus)) {
    return { label: normalizedStatus === "closed" ? "Closed" : "Revived", variant: "qs-review" };
  }

  return {
    label: (status || "In Progress").replace(/_/g, " "),
    variant: "qs-review",
  };
};

const renderChecklistStatus = (status) => {
  const statusMeta = getReportStatusMeta(status);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClassName(statusMeta.variant)}`}>
      {statusMeta.label}
    </span>
  );
};

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

/* ---------------- THEME COLORS ---------------- */
const PRIMARY_BLUE = "#164679";
const SECONDARY_PURPLE = "#2B1C67";
const LIGHT_YELLOW = "#FFF7CC";
const HIGHLIGHT_GOLD = "#E6C200";
const SUCCESS_GREEN = "#52c41a";

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 17;

const reviewSurfaceClassName = "w-full";
const tableShellClassName = "bg-white [&_.ant-table]:w-full [&_.ant-table]:table-fixed [&_.ant-table-wrapper]:bg-white [&_.ant-spin-nested-loading]:bg-white [&_.ant-spin-container]:bg-white [&_.ant-table-container]:bg-white [&_.ant-table-content]:overflow-x-auto [&_.ant-table-header]:bg-inherit [&_.ant-table-body]:bg-inherit [&_.ant-empty]:bg-inherit [&_.ant-table-thead>tr>th]:bg-white [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-3.5 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:text-(--color-text-medium) [&_.ant-table-thead>tr>th]:border-r-0 [&_.ant-table-tbody>tr>td]:bg-white [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-(--color-text-medium) [&_.ant-table-tbody>tr>td]:border-b [&_.ant-table-tbody>tr>td]:border-[rgba(214,189,152,0.12)] [&_.ant-table-tbody>tr>td]:border-r-0 [&_.ant-table-tbody>tr:hover>td]:bg-[rgba(245,247,244,0.9)] [&_.ant-table-tbody>tr>td:first-child]:pl-0 [&_.ant-table-thead>tr>th:first-child]:pl-0 [&_.ant-table-tbody>tr>td:last-child]:pr-0 [&_.ant-table-thead>tr>th:last-child]:pr-0 [&_.ant-pagination]:mt-[18px] [&_.ant-pagination]:mb-0 [&_.ant-pagination_.ant-pagination-item]:rounded-full [&_.ant-pagination_.ant-pagination-prev]:rounded-full [&_.ant-pagination_.ant-pagination-next]:rounded-full [&_.ant-pagination_.ant-pagination-item]:border-transparent [&_.ant-pagination_.ant-pagination-prev]:border-transparent [&_.ant-pagination_.ant-pagination-next]:border-transparent [&_.ant-pagination_.ant-pagination-item-active]:border-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active]:bg-[rgba(214,189,152,0.18)] [&_.ant-pagination_.ant-pagination-item-active_a]:font-medium [&_.ant-pagination_.ant-pagination-item-active_a]:text-(--color-text-dark) [&_.ant-table-cell::before]:hidden [&_.ant-table-cell::after]:hidden";

const getStatusBadgeClassName = (variant) => {
  if (variant === "approved") return "border-[rgba(82,196,26,0.24)] bg-[rgba(82,196,26,0.12)] text-[#365314]";
  if (variant === "rework") return "border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.12)] text-[#b45309]";
  if (variant === "pending") return "border-[rgba(214,189,152,0.24)] bg-[rgba(214,189,152,0.14)] text-(--color-primary-dark)";
  return "border-[rgba(22,70,121,0.18)] bg-[rgba(22,70,121,0.1)] text-(--color-primary-dark)";
};

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

export default function AllDCLsTable({ filters, onDataLoaded }) {
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const { data = [], isLoading, refetch } = useGetAllCoCreatorChecklistsQuery();

  // 🔍 Debug logging to identify data structure from API
  useEffect(() => {
    if (data?.length > 0) {
      // Notify parent of loaded data
      if (onDataLoaded) {
        onDataLoaded(data);
      }
    }
  }, [data, onDataLoaded]);

  const filtered = data.filter((d) => {
    // Filter by search text
    const searchMatch = !filters.searchText
      ? true
      : d.dclNo?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        d.customerName
          ?.toLowerCase()
          .includes(filters.searchText.toLowerCase());

    // Filter by status
    const statusMatch = !filters.status
      ? true
      : String(d.status).toLowerCase() === String(filters.status).toLowerCase();

    return searchMatch && statusMatch;
  });

  // Handle row click to open modal
  const handleRowClick = (record) => {
    setSelectedChecklist(record);
  };

  const handleCloseModal = () => {
    setSelectedChecklist(null);
    refetch();
  };

  if (isLoading) return <Spin />;
  if (!filtered.length) return <Empty />;

  /* ---------------- COLUMNS ---------------- */
  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div className="creator-table-primary-cell">
          <span className="creator-table-primary-value">{text || "-"}</span>
        </div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 110,
      render: (text) => <span className="creator-table-muted">{text || "—"}</span>,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 160,
      render: (text) => <span className="creator-table-primary-value">{text || "-"}</span>,
    },
    {
      title: "IBPS No",
      dataIndex: "ibpsNo",
      width: 140,
      render: (text) => (
        <span className="truncate whitespace-nowrap font-mono text-xs font-normal text-(--color-text-medium)">
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (text) => <span className="creator-table-muted">{text || "-"}</span>,
    },
    {
      title: "Checker - Approver",
      dataIndex: "assignedToCoChecker", // primary field to check for checker info
      width: 160,
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
          <span className="creator-table-muted">{checkerName}</span>
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

        return (
          <span className="creator-table-primary-value">{totalDocs}</span>
        );
      },
    },
    {
      title: "Completed Date",
      dataIndex: "updatedAt",
      width: 120,
      render: (date) => <span className="creator-table-muted">{date ? formatDate(date) : "—"}</span>,
    },
    {
      title: "TAT Consumed",
      dataIndex: "slaExpiry",
      width: 116,
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

    {
      title: "Status",
      dataIndex: "status",
      width: 150,
      fixed: "right",
      render: (status) => renderChecklistStatus(status),
    },
  ];

  const renderSelectedChecklist = () => {
    if (!selectedChecklist) {
      return null;
    }

    const normalizedStatus = String(selectedChecklist.status || "").toLowerCase();

    if (["rm_review", "rmreview"].includes(normalizedStatus)) {
      return (
        <RmReviewChecklistModal
          open
          checklist={selectedChecklist}
          onClose={handleCloseModal}
          readOnly={true}
        />
      );
    }

    if (["co_checker_review", "cocheckerreview"].includes(normalizedStatus)) {
      return (
        <CheckerReviewChecklistModal
          open
          embedded
          checklist={selectedChecklist}
          onClose={handleCloseModal}
          readOnly={true}
        />
      );
    }

    if (["approved", "completed"].includes(normalizedStatus)) {
      return (
        <CompletedChecklistModal
          open
          embedded
          checklist={selectedChecklist}
          onClose={handleCloseModal}
          readOnly={true}
        />
      );
    }

    if (["closed", "revived"].includes(normalizedStatus)) {
      return (
        <CreatorCompletedChecklistModal
          open
          embedded
          checklist={selectedChecklist}
          onClose={handleCloseModal}
          readOnly={true}
        />
      );
    }

    return (
      <ReviewChecklistPage
        embedded
        readOnly={true}
        checklistId={selectedChecklist.id || selectedChecklist._id}
        initialChecklist={selectedChecklist}
        onClose={handleCloseModal}
      />
    );
  };

  return (
    <>
      {selectedChecklist ? (
        <div className={reviewSurfaceClassName}>
          {renderSelectedChecklist()}
        </div>
      ) : (
        <div className={`${tableShellClassName} creator-table-header-clean`}>
          <Table
            rowKey="_id"
            dataSource={filtered}
            columns={columns}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              position: ["bottomCenter"],
            }}
            scroll={{ x: 1400 }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              className: "cursor-pointer",
            })}
          />
        </div>
      )}
    </>
  );
}
