import { Table, Tag, Spin, Empty } from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
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
    <span className={`creator-badge creator-badge--${statusMeta.variant}`}>
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
      const firstItem = data[0];
      console.log("📊 AllDCLsTable API Response (First Item):", {
        keys: Object.keys(firstItem),
        data: firstItem,
        checkerFields: {
          approvedBy: firstItem?.approvedBy,
          assignedChecker: firstItem?.assignedChecker,
          checkerAssigned: firstItem?.checkerAssigned,
          checker: firstItem?.checker,
        },
        status: firstItem?.status,
        statusType: typeof firstItem?.status,
      });
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
        <span className="creator-table-muted" style={{ fontFamily: "monospace" }}>
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
        // 🔍 Debug: Log what we're getting
        console.log("🔍 Checker Column Debug:", {
          checkerValue,
          record_assignedToCoChecker: record?.assignedToCoChecker,
          record_assignedChecker: record?.assignedChecker,
          record_approvedBy: record?.approvedBy,
          record_checkerAssigned: record?.checkerAssigned,
          record_checker: record?.checker,
          allKeys: Object.keys(record || {}),
        });

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
      {/* Custom styles */}
      <style>{customTableStyles}</style>

      {selectedChecklist ? (
        <div className="reports-review-surface creator-theme">
          {renderSelectedChecklist()}
        </div>
      ) : (
        <Table
          className="creator-completed-table"
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
          })}
        />
      )}
    </>
  );
}

const customTableStyles = `
.reports-review-surface {
  width: 100%;
}
.creator-completed-table,
.creator-completed-table .ant-table-wrapper,
.creator-completed-table .ant-spin-nested-loading,
.creator-completed-table .ant-spin-container,
.creator-completed-table .ant-table-container,
.creator-completed-table .ant-table-content,
.creator-completed-table table,
.creator-completed-table thead,
.creator-completed-table tbody,
.creator-completed-table tr {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: var(--color-white) !important;
}
.creator-completed-table .ant-table {
  table-layout: fixed;
  width: 100%;
}
.creator-completed-table .ant-table-content {
  overflow-x: auto;
}
.creator-completed-table .ant-table-header,
.creator-completed-table .ant-table-body,
.creator-completed-table .ant-table-placeholder,
.creator-completed-table .ant-empty,
.creator-completed-table .ant-empty-normal {
  background: inherit !important;
}
.creator-completed-table .ant-table-thead > tr > th {
  background: var(--color-white) !important;
  color: var(--color-text-medium) !important;
  font-weight: 600;
  font-size: 12px;
  padding: 14px 12px !important;
  border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
  border-right: none !important;
  line-height: 1.2;
  text-transform: uppercase;
}
.creator-completed-table .ant-table-tbody > tr > td {
  background: var(--color-white) !important;
  border-bottom: 1px solid rgba(214, 189, 152, 0.12) !important;
  border-top: none !important;
  border-right: none !important;
  padding: 16px 12px !important;
  font-size: 12px;
  color: var(--color-text-medium);
  line-height: 1.25;
  vertical-align: middle;
}
.creator-completed-table .ant-table-thead > tr > th::before,
.creator-completed-table .ant-table-cell::before,
.creator-completed-table .ant-table-cell::after,
.creator-completed-table .ant-table-wrapper::before,
.creator-completed-table .ant-table-wrapper::after,
.creator-completed-table .ant-table-container::before,
.creator-completed-table .ant-table-container::after,
.creator-completed-table .ant-table-thead > tr::after,
.creator-completed-table .ant-table-tbody > tr::after {
  display: none !important;
}
.creator-completed-table .ant-table-tbody > tr:hover > td {
  background-color: rgba(245, 247, 244, 0.9) !important;
  cursor: pointer;
}
.creator-completed-table .ant-table-tbody > tr > td:first-child,
.creator-completed-table .ant-table-thead > tr > th:first-child {
  padding-left: 0 !important;
}
.creator-completed-table .ant-table-tbody > tr > td:last-child,
.creator-completed-table .ant-table-thead > tr > th:last-child {
  padding-right: 0 !important;
}
.creator-completed-table .ant-pagination {
  margin-top: 18px !important;
  margin-bottom: 0 !important;
}
.creator-completed-table .ant-pagination .ant-pagination-item,
.creator-completed-table .ant-pagination .ant-pagination-prev,
.creator-completed-table .ant-pagination .ant-pagination-next {
  border-radius: 999px !important;
  border-color: transparent !important;
  background: transparent !important;
  min-width: 34px;
}
.creator-completed-table .ant-pagination .ant-pagination-item-active {
  background: rgba(214, 189, 152, 0.18) !important;
  border-color: rgba(214, 189, 152, 0.18) !important;
}
.creator-completed-table .ant-pagination .ant-pagination-item-active a {
  color: var(--color-text-dark) !important;
  font-weight: 500;
}
.creator-table-primary-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.creator-table-primary-value {
  color: var(--color-text-dark);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.creator-table-secondary-value {
  color: var(--color-text-light);
  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.creator-table-muted {
  color: var(--color-text-medium);
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.creator-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.creator-badge--approved {
  background: rgba(21, 128, 61, 0.12);
  color: #166534;
}
.creator-badge--rework {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}
.creator-badge--pending {
  background: rgba(180, 83, 9, 0.12);
  color: #b45309;
}
.creator-badge--qs-review {
  background: rgba(22, 70, 121, 0.1);
  color: var(--color-primary-dark);
}
`;
