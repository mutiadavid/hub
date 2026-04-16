import React, { useMemo } from "react";
import { Empty, Table, Tooltip } from "antd";
import dayjs from "dayjs";
import { buildTATTableRows } from "./reportUtils";
import styles from "./TATTableStyles.module.css";
import useReportNow from "./useReportNow";

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_CONFIG = {
  PAGE_SIZE: 15,
  SORT_KEY: "key",
  EMPTY_MESSAGE: "No DCL TAT data available for the selected filters",
};

const COLUMN_WIDTH = {
  DCL_NUMBER: 160,
  CREATED: 140,
  CO_CREATOR_TAT: 140,
  RM_TAT: 120,
  CHECKER_TAT: 130,
  TOTAL_TAT: 130,
  STATUS: 120,
};

const DATE_FORMAT = {
  FULL: "DD/MM/YYYY HH:mm",
  SHORT: "DD/MM HH:mm",
};

const BUSINESS_HOUR_START = 8;
const BUSINESS_HOUR_END = 17;
const LIVE_SECONDS_PER_BUSINESS_DAY = 9 * 60 * 60;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format date with fallback for null/undefined
 */
const formatDate = (date, format = DATE_FORMAT.FULL) => {
  return date ? dayjs(date).format(format) : "N/A";
};

const isWeekend = (value) => {
  const day = value.day();
  return day === 0 || day === 6;
};

const calculateBusinessSeconds = (startAt, endAt) => {
  const start = startAt ? dayjs(startAt) : null;
  const end = endAt ? dayjs(endAt) : null;

  if (!start?.isValid() || !end?.isValid() || !end.isAfter(start)) {
    return 0;
  }

  let cursor = start.clone();
  let totalSeconds = 0;

  while (cursor.isBefore(end)) {
    if (isWeekend(cursor)) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
      continue;
    }

    if (cursor.hour() < BUSINESS_HOUR_START) {
      cursor = cursor.hour(BUSINESS_HOUR_START).minute(0).second(0).millisecond(0);
    } else if (cursor.hour() >= BUSINESS_HOUR_END) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
      continue;
    }

    const endOfBusinessDay = cursor
      .clone()
      .hour(BUSINESS_HOUR_END)
      .minute(0)
      .second(0)
      .millisecond(0);
    const intervalEnd = end.isBefore(endOfBusinessDay) ? end : endOfBusinessDay;

    if (intervalEnd.isAfter(cursor)) {
      totalSeconds += Math.max(0, Math.ceil(intervalEnd.diff(cursor, "second", true)));
      cursor = intervalEnd;
    }

    if (cursor.isBefore(end)) {
      cursor = cursor.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
    }
  }

  return totalSeconds;
};

const formatLiveDuration = (startAt, endAt) => {
  const totalSeconds = calculateBusinessSeconds(startAt, endAt);

  if (totalSeconds <= 0) {
    return "0s";
  }

  const days = Math.floor(totalSeconds / LIVE_SECONDS_PER_BUSINESS_DAY);
  const dayRemainder = totalSeconds % LIVE_SECONDS_PER_BUSINESS_DAY;
  const hours = Math.floor(dayRemainder / 3600);
  const hourRemainder = dayRemainder % 3600;
  const minutes = Math.floor(hourRemainder / 60);
  const seconds = hourRemainder % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
};

const formatAggregateDuration = (totalSeconds) => {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const days = Math.floor(safeSeconds / LIVE_SECONDS_PER_BUSINESS_DAY);
  const dayRemainder = safeSeconds % LIVE_SECONDS_PER_BUSINESS_DAY;
  const hours = Math.floor(dayRemainder / 3600);
  const hourRemainder = dayRemainder % 3600;
  const minutes = Math.floor(hourRemainder / 60);
  const seconds = hourRemainder % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
};

const getStageDisplaySeconds = (stage, now) => {
  if (!stage?.state || stage.state === "not_started") {
    return 0;
  }

  if (stage.state === "in_progress" && stage.startAt) {
    const totalSeconds = calculateBusinessSeconds(stage.startAt, now);

    if (totalSeconds > 0) {
      return totalSeconds;
    }
  }

  return Math.max(0, Math.round((stage?.minutes || 0) * 60));
};

const buildAggregateStageLabel = (stages, now) => {
  const validStages = (stages || []).filter(Boolean);
  const totalSeconds = validStages.reduce((sum, stage) => sum + getStageDisplaySeconds(stage, now), 0);
  const hasInProgress = validStages.some((stage) => stage?.state === "in_progress");

  return `${formatAggregateDuration(totalSeconds)}${hasInProgress ? " (in progress)" : ""}`;
};

const getLiveStageLabel = (stage, now) => {
  if (!stage) return "0m";
  if (stage.state !== "in_progress" || !stage.startAt) {
    return stage.label || "0m";
  }

  return `${formatLiveDuration(stage.startAt, now)} (in progress)`;
};

const getDclCurrentStageKey = (status) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (["approved", "rejected", "completed"].includes(normalizedStatus)) {
    return "done";
  }

  if (["cocheckerreview", "cochecker_review", "co_checker_review"].includes(normalizedStatus)) {
    return "coChecker";
  }

  if (["rmreview", "rm_review"].includes(normalizedStatus)) {
    return "rm";
  }

  if (["cocreatorreview", "cocreator_review", "co_creator_review", "active"].includes(normalizedStatus)) {
    return "coCreator";
  }

  return "coCreator";
};

const createLiveStageFallback = (stage, startAt) => ({
  ...(stage || {}),
  startAt,
  endAt: null,
  state: startAt ? "in_progress" : stage?.state || "not_started",
});

const getEffectiveRmStage = (record) => {
  if (record?.rmReviewTat?.state === "in_progress") {
    return record.rmReviewTat;
  }

  if (getDclCurrentStageKey(record?.status) === "rm" && !record?.rmReviewCompletedAt) {
    return createLiveStageFallback(
      record?.rmReviewTat,
      record?.coCreatorInitialCompletedAt || record?.createdAt || null,
    );
  }

  return record?.rmReviewTat;
};

const getEffectiveCoCreatorStages = (record) => {
  const currentStage = getDclCurrentStageKey(record?.status);
  const initialStage =
    currentStage === "coCreator" && !record?.coCreatorInitialCompletedAt && !record?.rmReviewCompletedAt
      ? createLiveStageFallback(record?.coCreatorInitialTat, record?.createdAt || null)
      : record?.coCreatorInitialTat;
  const revisionStage =
    currentStage === "coCreator" && record?.rmReviewCompletedAt && !record?.coCreatorRevisionCompletedAt
      ? createLiveStageFallback(record?.coCreatorRevisionTat, record?.rmReviewCompletedAt || null)
      : record?.coCreatorRevisionTat;

  return [initialStage, revisionStage].filter(Boolean);
};

const getEffectiveCheckerStage = (record) => {
  if (record?.coCheckerTat?.state === "in_progress") {
    return record.coCheckerTat;
  }

  if (getDclCurrentStageKey(record?.status) === "coChecker" && !record?.coCheckerCompletedAt) {
    return createLiveStageFallback(
      record?.coCheckerTat,
      record?.coCreatorRevisionCompletedAt ||
        record?.rmReviewCompletedAt ||
        record?.coCreatorInitialCompletedAt ||
        record?.createdAt ||
        null,
    );
  }

  return record?.coCheckerTat;
};

const getLiveTotalLabel = (record, now) => {
  return buildAggregateStageLabel(
    [
      ...getEffectiveCoCreatorStages(record),
      getEffectiveRmStage(record),
      getEffectiveCheckerStage(record),
    ],
    now,
  );
};

const getStatusMeta = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("approved") || normalizedStatus.includes("completed")) {
    return { label: "Approved", className: styles.tatStatusBadgeApproved };
  }

  if (normalizedStatus.includes("rejected") || normalizedStatus.includes("returned")) {
    return { label: normalizedStatus.includes("returned") ? "Returned" : "Rejected", className: styles.tatStatusBadgeRework };
  }

  if (normalizedStatus.includes("review") || normalizedStatus.includes("checker") || normalizedStatus.includes("creator")) {
    return {
      label: String(status || "In Progress").replace(/_/g, " "),
      className: styles.tatStatusBadgeReview,
    };
  }

  return {
    label: String(status || "Pending").replace(/_/g, " "),
    className: styles.tatStatusBadgePending,
  };
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Renders a TAT stage value with consistent styling
 */
const TATStageValue = React.memo(({ stage, now }) => (
  <span className={styles.tatStageMetric}>
    {getLiveStageLabel(stage, now)}
  </span>
));

TATStageValue.displayName = "TATStageValue";

/**
 * Renders DCL number with customer info
 */
const DCLNumberCell = React.memo(({ dclNumber, customerName }) => (
  <Tooltip title={dclNumber}>
    <div>
      <div className={styles.tatItemName}>{dclNumber}</div>
      <div className={styles.tatItemMeta}>{customerName}</div>
    </div>
  </Tooltip>
));

DCLNumberCell.displayName = "DCLNumberCell";

/**
 * Renders co-creator TAT with combined initial and revision stages
 */
const CoCreatorTATCell = React.memo(({ record, now }) => {
  const displayStages = getEffectiveCoCreatorStages(record);
  const tooltipTitle = record.coCreatorRevisionCompletedAt
    ? `Resubmitted: ${formatDate(record.coCreatorRevisionCompletedAt, DATE_FORMAT.SHORT)}`
    : record.coCreatorRevisionTat?.state === "in_progress"
      ? "CO Creator revision in progress"
      : record.coCreatorInitialTat?.state === "in_progress"
        ? "CO Creator initial review in progress"
    : record.coCreatorInitialCompletedAt
      ? "Awaiting checker or creator action"
      : "Awaiting first creator submission";

  return (
    <Tooltip title={tooltipTitle}>
      <span className={styles.tatStageMetric}>
        {buildAggregateStageLabel(displayStages, now)}
      </span>
    </Tooltip>
  );
});

CoCreatorTATCell.displayName = "CoCreatorTATCell";

/**
 * Renders generic TAT stage with tooltip
 */
const TATStageCell = React.memo(({ stage, record, completedAtKey, tooltipLabel, now }) => {
  const completedAt = record?.[completedAtKey];
  const tooltipTitle = completedAt
    ? `${tooltipLabel}: ${formatDate(completedAt, DATE_FORMAT.SHORT)}`
    : `Awaiting ${tooltipLabel}`;

  return (
    <Tooltip title={tooltipTitle}>
      <TATStageValue stage={stage} now={now} />
    </Tooltip>
  );
});

TATStageCell.displayName = "TATStageCell";

/**
 * Renders total TAT with days approximation
 */
const TotalTATCell = React.memo(({ record, now, days }) => (
  <Tooltip title={`≈ ${days} days`}>
    <div className={styles.tatCellCenter}>
      <div className={styles.tatStageMetric}>
      {getLiveTotalLabel(record, now)}
      </div>
    </div>
  </Tooltip>
));

TotalTATCell.displayName = "TotalTATCell";

/**
 * Renders status as uppercase text
 */
const StatusCell = React.memo(({ status }) => (
  <span className={styles.tatCellCenter}>
    <span className={`${styles.tatStatusBadge} ${getStatusMeta(status).className}`}>
      {getStatusMeta(status).label}
    </span>
  </span>
));

StatusCell.displayName = "StatusCell";

// ============================================================================
// TABLE COLUMNS FACTORY
// ============================================================================

/**
 * Create table columns with optimized render functions
 */
const createTableColumns = (now) => [
  {
    title: "DCL Number",
    dataIndex: "itemId",
    key: "itemId",
    width: COLUMN_WIDTH.DCL_NUMBER,
    render: (_, record) => (
      <DCLNumberCell
        dclNumber={record.itemId}
        customerName={record.customerName}
      />
    ),
  },
  {
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    width: COLUMN_WIDTH.CREATED,
    render: (date) => (
      <span className={styles.tatItemMeta}>
        {formatDate(date)}
      </span>
    ),
  },
  {
    title: <span className={styles.tatHeaderCenter}>CO Creator TAT</span>,
    dataIndex: "coCreatorTat",
    key: "coCreatorTat",
    width: COLUMN_WIDTH.CO_CREATOR_TAT,
    align: "center",
    render: (_, record) => <CoCreatorTATCell record={record} now={now} />,
    sorter: (a, b) => (a.coCreatorTat?.minutes || 0) - (b.coCreatorTat?.minutes || 0),
  },
  {
    title: <span className={styles.tatHeaderCenter}>RM TAT</span>,
    dataIndex: "rmReviewTat",
    key: "rmReviewTat",
    width: COLUMN_WIDTH.RM_TAT,
    align: "center",
    render: (_, record) => (
      <TATStageCell
        stage={getEffectiveRmStage(record)}
        record={record}
        completedAtKey="rmReviewCompletedAt"
        tooltipLabel="Reviewed"
        now={now}
      />
    ),
    sorter: (a, b) => (a.rmReviewTat?.minutes || 0) - (b.rmReviewTat?.minutes || 0),
  },
  {
    title: <span className={styles.tatHeaderCenter}>Checker TAT</span>,
    dataIndex: "coCheckerTat",
    key: "coCheckerTat",
    width: COLUMN_WIDTH.CHECKER_TAT,
    align: "center",
    render: (_, record) => (
      <TATStageCell
        stage={getEffectiveCheckerStage(record)}
        record={record}
        completedAtKey="coCheckerCompletedAt"
        tooltipLabel="✓ Approved"
        now={now}
      />
    ),
    sorter: (a, b) => (a.coCheckerTat?.minutes || 0) - (b.coCheckerTat?.minutes || 0),
  },
  {
    title: <span className={styles.tatHeaderCenter}>Total TAT</span>,
    dataIndex: "totalTatLabel",
    key: "totalTatLabel",
    width: COLUMN_WIDTH.TOTAL_TAT,
    align: "center",
    render: (_, record) => (
      <TotalTATCell record={record} now={now} days={record.totalTatDays} />
    ),
    sorter: (a, b) => (a.totalTatMinutes || 0) - (b.totalTatMinutes || 0),
  },
  {
    title: <span className={styles.tatHeaderCenter}>Status</span>,
    dataIndex: "status",
    key: "status",
    width: COLUMN_WIDTH.STATUS,
    align: "center",
    render: (status) => <StatusCell status={status} />,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * DCLTATTable - Displays turnaround time metrics for DCL checklists
 * @param {Object} props
 * @param {Array} props.dclRows - Array of DCL records to display
 * @returns {React.ReactElement}
 */
function DCLTATTable({ dclRows = [] }) {
  const now = useReportNow();
  // Process and filter data
  const tableData = useMemo(() => {
    return buildTATTableRows([], dclRows, now).filter(
      (row) => row.workflowType === "DCL"
    );
  }, [dclRows, now]);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => createTableColumns(now), [now]);

  // Memoize pagination config
  const paginationConfig = useMemo(
    () => ({
      pageSize: TABLE_CONFIG.PAGE_SIZE,
      total: tableData.length,
      showSizeChanger: true,
      showQuickJumper: true,
      position: ["bottomCenter"],
    }),
    [tableData.length]
  );

  // Handle empty state
  if (!tableData.length) {
    return (
      <Empty
        description={TABLE_CONFIG.EMPTY_MESSAGE}
        style={{ marginTop: 24 }}
      />
    );
  }

  return (
    <div className={styles.tatTable}>
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey={TABLE_CONFIG.SORT_KEY}
        pagination={paginationConfig}
        size="small"
        bordered={false}
      />
    </div>
  );
}

export default DCLTATTable;
