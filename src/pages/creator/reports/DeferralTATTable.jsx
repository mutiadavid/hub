import React, { useMemo } from "react";
import { Empty, Table, Tooltip } from "antd";
import dayjs from "dayjs";
import { formatTatDuration } from "./reportUtils";
import styles from "./TATTableStyles.module.css";
import useReportNow from "./useReportNow";

const DEFERRAL_FINAL_STATUSES = new Set([
  "approved",
  "rejected",
  "returned_for_rework",
  "closed",
  "deferral_closed",
  "close_requested",
  "close_requested_creator_approved",
]);

const BUSINESS_HOUR_START = 8;
const BUSINESS_HOUR_END = 17;
const BUSINESS_MINUTES_PER_DAY = (BUSINESS_HOUR_END - BUSINESS_HOUR_START) * 60;
const LIVE_SECONDS_PER_BUSINESS_DAY = (BUSINESS_HOUR_END - BUSINESS_HOUR_START) * 60 * 60;

const safeLower = (value) => String(value || "").trim().toLowerCase();

const toMoment = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const resolveFirstMoment = (...values) => {
  for (const value of values) {
    const parsed = toMoment(value);
    if (parsed) return parsed;
  }
  return null;
};

const momentMax = (...values) => {
  const valid = values.filter(Boolean);
  if (!valid.length) return null;
  return valid.reduce((highest, current) => (current.isAfter(highest) ? current : highest));
};

const normalizeStageBoundary = (value, minimum = null) => {
  if (!value) return null;
  if (!minimum) return value;
  return value.isBefore(minimum) ? minimum : value;
};

const calculateBusinessMinutes = (start, end) => {
  if (!start || !end || !start.isValid() || !end.isValid() || !end.isAfter(start)) {
    return 0;
  }

  let current = start.clone();
  let totalMinutes = 0;

  while (current.isBefore(end)) {
    if (current.day() === 0 || current.day() === 6) {
      current = current.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
      continue;
    }

    if (current.hour() < BUSINESS_HOUR_START) {
      current = current.hour(BUSINESS_HOUR_START).minute(0).second(0).millisecond(0);
    } else if (current.hour() >= BUSINESS_HOUR_END) {
      current = current.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
      continue;
    }

    const endOfBusinessDay = current
      .clone()
      .hour(BUSINESS_HOUR_END)
      .minute(0)
      .second(0)
      .millisecond(0);
    const sliceEnd = end.isBefore(endOfBusinessDay) ? end : endOfBusinessDay;

    if (sliceEnd.isAfter(current)) {
      totalMinutes += sliceEnd.diff(current, "minute");
      current = sliceEnd;
    }

    if (current.isBefore(end)) {
      current = current.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
    }
  }

  return totalMinutes;
};

const toDayValue = (minutes) => Number(((minutes || 0) / BUSINESS_MINUTES_PER_DAY).toFixed(2));

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

const getStageDisplaySeconds = (stage, nowAt) => {
  if (!stage?.state || stage.state === "not_started") {
    return 0;
  }

  if (stage.state === "in_progress" && stage.startAt) {
    const totalSeconds = calculateBusinessSeconds(stage.startAt, nowAt);

    if (totalSeconds > 0) {
      return totalSeconds;
    }
  }

  return Math.max(0, Math.round((stage?.minutes || 0) * 60));
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

const buildAggregateStageLabel = (stages, nowAt) => {
  const validStages = (stages || []).filter(Boolean);
  const totalSeconds = validStages.reduce((sum, stage) => sum + getStageDisplaySeconds(stage, nowAt), 0);
  const hasInProgress = validStages.some((stage) => stage?.state === "in_progress");

  return `${formatAggregateDuration(totalSeconds)}${hasInProgress ? " (in progress)" : ""}`;
};

const createLiveStageFallback = (stage, startAt) => ({
  ...(stage || {}),
  startAt,
  endAt: null,
  state: startAt ? "in_progress" : stage?.state || "not_started",
});

const getLiveStageLabel = (stage, nowAt) => {
  if (!stage) return "0m";
  if (stage.state !== "in_progress" || !stage.startAt) {
    return stage.label || "0m";
  }

  return `${formatLiveDuration(stage.startAt, nowAt)} (in progress)`;
};

const getEffectiveRmStage = (record) => {
  if (record?.rmTat?.state === "in_progress") {
    return record.rmTat;
  }

  if (record?.currentStageKey === "rm" && !record?.rmCompletedAt) {
    return createLiveStageFallback(record?.rmTat, record?.createdAt || null);
  }

  return record?.rmTat;
};

const getEffectiveApproverStages = (record) => {
  if (record?.approverTatEntries?.some((entry) => entry?.metric?.state === "in_progress")) {
    return record.approverTatEntries.map((entry) => entry?.metric).filter(Boolean);
  }

  if (record?.currentStageKey === "approvers") {
    const approverStartAt = record?.firstApproverAt || record?.rmCompletedAt || record?.createdAt || null;
    return [createLiveStageFallback(record?.approversTat, approverStartAt)].filter(Boolean);
  }

  return record?.approverTatEntries?.map((entry) => entry?.metric).filter(Boolean) || [record?.approversTat].filter(Boolean);
};

const getEffectiveCoCreatorStage = (record) => {
  if (record?.coCreatorTat?.state === "in_progress") {
    return record.coCreatorTat;
  }

  if (record?.currentStageKey === "coCreator" && !record?.coCreatorCompletedAt) {
    return createLiveStageFallback(
      record?.coCreatorTat,
      record?.lastApproverAt || record?.rmCompletedAt || record?.createdAt || null,
    );
  }

  return record?.coCreatorTat;
};

const getEffectiveCoCheckerStage = (record) => {
  if (record?.coCheckerTat?.state === "in_progress") {
    return record.coCheckerTat;
  }

  if (record?.currentStageKey === "coChecker" && !record?.coCheckerCompletedAt) {
    return createLiveStageFallback(
      record?.coCheckerTat,
      record?.coCreatorCompletedAt || record?.lastApproverAt || record?.rmCompletedAt || record?.createdAt || null,
    );
  }

  return record?.coCheckerTat;
};

const getLiveTotalLabel = (record, nowAt) => {
  return buildAggregateStageLabel(
    [
      getEffectiveRmStage(record),
      ...getEffectiveApproverStages(record),
      getEffectiveCoCreatorStage(record),
      getEffectiveCoCheckerStage(record),
    ],
    nowAt,
  );
};

const createStageMetric = ({ startAt, completedAt, nowAt = dayjs(), liveWhenInProgress = true }) => {
  const hasStarted = Boolean(startAt);
  const hasCompleted = Boolean(completedAt);
  const effectiveEnd = hasCompleted ? completedAt : hasStarted ? nowAt : null;
  const minutes = !hasStarted
    ? 0
    : hasCompleted || !liveWhenInProgress
      ? calculateBusinessMinutes(startAt, effectiveEnd)
      : Math.max(0, effectiveEnd.diff(startAt, "minute", true));
  const roundedMinutes = Math.round(minutes);
  const state = !hasStarted ? "not_started" : hasCompleted ? "completed" : "in_progress";

  return {
    startAt: startAt || null,
    endAt: hasCompleted ? completedAt : null,
    minutes: roundedMinutes,
    days: toDayValue(roundedMinutes),
    state,
    label: `${formatTatDuration(roundedMinutes, "0m")}${state === "in_progress" ? " (in progress)" : ""}`,
  };
};

const combineStageMetrics = (stages = []) => {
  const validStages = stages.filter(Boolean);
  const minutes = validStages.reduce((sum, stage) => sum + (stage?.minutes || 0), 0);
  const hasStarted = validStages.some((stage) => stage?.state && stage.state !== "not_started");
  const hasInProgress = validStages.some((stage) => stage?.state === "in_progress");
  const state = hasInProgress ? "in_progress" : hasStarted ? "completed" : "not_started";

  return {
    minutes,
    days: toDayValue(minutes),
    state,
    label: `${formatTatDuration(minutes, "0m")}${state === "in_progress" ? " (in progress)" : ""}`,
  };
};

const getOrderedApprovers = (deferral) => {
  const approvalFlow = Array.isArray(deferral?.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral?.approvers)
      ? deferral.approvers
      : [];

  return [...approvalFlow].sort((left, right) => {
    const leftOrder = Number(
      left?.approvalOrder ?? left?.order ?? left?.orderIndex ?? left?.sequence ?? left?.flowIndex ?? 0,
    );
    const rightOrder = Number(
      right?.approvalOrder ?? right?.order ?? right?.orderIndex ?? right?.sequence ?? right?.flowIndex ?? 0,
    );

    return leftOrder - rightOrder;
  });
};

const getApproverAssignedAt = (approver) =>
  resolveFirstMoment(
    approver?.assignedAt,
    approver?.AssignedAt,
    approver?.assignmentAt,
    approver?.AssignmentAt,
    approver?.createdAt,
    approver?.CreatedAt,
  );

const getApproverDecisionAt = (approver) =>
  resolveFirstMoment(
    approver?.approvedAt,
    approver?.ApprovedAt,
    approver?.approvedDate,
    approver?.ApprovedDate,
    approver?.approvalDate,
    approver?.ApprovalDate,
    approver?.rejectedAt,
    approver?.RejectedAt,
    approver?.returnedAt,
    approver?.ReturnedAt,
    approver?.updatedAt,
    approver?.UpdatedAt,
  );

const isApprovedValue = (value) => safeLower(value) === "approved";

const getDeferralTerminalAt = (deferral, approverDecisionDates = []) =>
  momentMax(
    resolveFirstMoment(
      deferral?.checkerApprovalDate,
      deferral?.checkerApprovedAt,
      deferral?.CheckerApprovalDate,
      deferral?.coCheckerAcceptedAt,
      deferral?.CoCheckerAcceptedAt,
      deferral?.closedAt,
      deferral?.ClosedAt,
    ),
    resolveFirstMoment(
      deferral?.creatorApprovalDate,
      deferral?.creatorApprovedAt,
      deferral?.CreatorApprovalDate,
      deferral?.coCreatorAcceptedAt,
      deferral?.CoCreatorAcceptedAt,
    ),
    ...approverDecisionDates,
    resolveFirstMoment(deferral?.updatedAt, deferral?.UpdatedAt),
  );

const getDeferralCurrentStage = ({
  deferral,
  rmCompletedAt,
  lastApproverAt,
  coCreatorCompletedAt,
  coCheckerCompletedAt,
}) => {
  const status = safeLower(deferral?.status);

  if (coCheckerCompletedAt || DEFERRAL_FINAL_STATUSES.has(status)) return "done";
  if (coCreatorCompletedAt || safeLower(deferral?.creatorApprovalStatus) === "approved") return "coChecker";
  if (lastApproverAt) return "coCreator";
  if (rmCompletedAt) return "approvers";
  return "rm";
};

const buildDeferralTatRow = (deferral, index, nowAt = dayjs()) => {
  const createdAt = resolveFirstMoment(
    deferral?.createdAt,
    deferral?.CreatedAt,
    deferral?.created_at,
    deferral?.timestamp,
  );

  const orderedApprovers = getOrderedApprovers(deferral);
  const explicitRmQueueExitAt = resolveFirstMoment(
    deferral?.firstApproverAssignedAt,
    deferral?.FirstApproverAssignedAt,
    deferral?.sentToApproversAt,
    deferral?.SentToApproversAt,
  );
  const explicitCoCreatorQueueStartAt = resolveFirstMoment(
    deferral?.sentToCoCreatorAt,
    deferral?.SentToCoCreatorAt,
    deferral?.submittedToCoCreatorAt,
    deferral?.SubmittedToCoCreatorAt,
    deferral?.creatorAssignedAt,
    deferral?.CreatorAssignedAt,
  );
  const explicitCoCreatorQueueExitAt = resolveFirstMoment(
    deferral?.sentToCoCheckerAt,
    deferral?.SentToCoCheckerAt,
    deferral?.submittedToCoCheckerAt,
    deferral?.SubmittedToCoCheckerAt,
    deferral?.checkerAssignedAt,
    deferral?.CheckerAssignedAt,
    deferral?.coCreatorAcceptedAt,
    deferral?.CoCreatorAcceptedAt,
    deferral?.creatorApprovalDate,
    deferral?.creatorApprovedAt,
    deferral?.CreatorApprovalDate,
  );
  let coCheckerCompletedAt = resolveFirstMoment(
    deferral?.coCheckerAcceptedAt,
    deferral?.CoCheckerAcceptedAt,
    deferral?.checkerApprovalDate,
    deferral?.checkerApprovedAt,
    deferral?.CheckerApprovalDate,
    deferral?.closedAt,
    deferral?.ClosedAt,
  );
  const isFinalStatus = DEFERRAL_FINAL_STATUSES.has(safeLower(deferral?.status));
  const creatorApproved =
    isApprovedValue(deferral?.creatorApprovalStatus) ||
    Boolean(resolveFirstMoment(deferral?.creatorApprovalDate, deferral?.creatorApprovedAt, deferral?.CreatorApprovalDate));
  const checkerApproved =
    isApprovedValue(deferral?.checkerApprovalStatus) ||
    Boolean(resolveFirstMoment(deferral?.checkerApprovalDate, deferral?.checkerApprovedAt, deferral?.CheckerApprovalDate));
  const hasApproverQueueEvidence =
    Boolean(explicitRmQueueExitAt) ||
    creatorApproved ||
    checkerApproved ||
    isFinalStatus ||
    safeLower(deferral?.status).includes("approval");

  const approverTimeline = [];

  orderedApprovers.forEach((approver, approverIndex) => {
    const previousDecisionAt = approverIndex > 0 ? approverTimeline[approverIndex - 1]?.decisionAt : null;
    const assignedAt =
      getApproverAssignedAt(approver) ||
      previousDecisionAt ||
      (approverIndex === 0
        ? explicitRmQueueExitAt || (hasApproverQueueEvidence ? createdAt : null)
        : null);

    approverTimeline.push({
      approver,
      assignedAt,
      explicitDecisionAt: getApproverDecisionAt(approver),
      decisionAt: null,
      metric: null,
    });
  });

  let rmCompletedAt =
    explicitRmQueueExitAt ||
    approverTimeline[0]?.assignedAt ||
    (orderedApprovers.length === 0
      ? explicitCoCreatorQueueStartAt || (creatorApproved || checkerApproved || isFinalStatus ? createdAt : null)
      : null);

  const approverQueueExitFallback = explicitCoCreatorQueueStartAt || explicitCoCreatorQueueExitAt || coCheckerCompletedAt;

  for (let approverIndex = approverTimeline.length - 1; approverIndex >= 0; approverIndex -= 1) {
    const entry = approverTimeline[approverIndex];
    const nextAssignedAt = approverTimeline[approverIndex + 1]?.assignedAt || null;

    entry.decisionAt = normalizeStageBoundary(
      entry.explicitDecisionAt || nextAssignedAt || approverQueueExitFallback,
      entry.assignedAt,
    );
  }

  const lastApproverAt = approverTimeline.length
    ? approverTimeline[approverTimeline.length - 1]?.decisionAt || null
    : null;

  const coCreatorStartedAt =
    explicitCoCreatorQueueStartAt ||
    (orderedApprovers.length === 0 ? rmCompletedAt : lastApproverAt);
  let coCreatorCompletedAt = normalizeStageBoundary(explicitCoCreatorQueueExitAt, coCreatorStartedAt);
  const coCheckerStartedAt = explicitCoCreatorQueueExitAt || coCreatorCompletedAt || null;

  const approverDecisionDates = approverTimeline.map((entry) => entry.decisionAt).filter(Boolean);
  const terminalAt = getDeferralTerminalAt(deferral, approverDecisionDates);

  if (isFinalStatus) {
    if (coCheckerStartedAt && !coCheckerCompletedAt) {
      coCheckerCompletedAt = normalizeStageBoundary(terminalAt, coCheckerStartedAt);
    } else if (coCreatorStartedAt && !coCreatorCompletedAt) {
      coCreatorCompletedAt = normalizeStageBoundary(terminalAt, coCreatorStartedAt);
    } else if (approverTimeline.length) {
      const lastPendingApprover = [...approverTimeline].reverse().find((entry) => entry.assignedAt && !entry.decisionAt);
      if (lastPendingApprover) {
        lastPendingApprover.decisionAt = normalizeStageBoundary(terminalAt, lastPendingApprover.assignedAt);
      }
    } else if (createdAt && !rmCompletedAt) {
      rmCompletedAt = normalizeStageBoundary(terminalAt, createdAt);
    }
  }

  approverTimeline.forEach((entry) => {
    entry.metric = createStageMetric({
      startAt: entry.assignedAt,
      completedAt: entry.decisionAt,
      nowAt,
    });
  });

  const currentStageKey = getDeferralCurrentStage({
    deferral,
    rmCompletedAt,
    lastApproverAt: approverTimeline.length
      ? approverTimeline[approverTimeline.length - 1]?.decisionAt || null
      : null,
    coCreatorCompletedAt,
    coCheckerCompletedAt,
  });

  const rmTat = createStageMetric({
    startAt: createdAt,
    completedAt: rmCompletedAt,
    nowAt,
  });

  const approversTat = combineStageMetrics(approverTimeline.map((entry) => entry.metric));

  const coCreatorTat = createStageMetric({
    startAt: coCreatorStartedAt,
    completedAt: coCreatorCompletedAt,
    nowAt,
  });

  const coCheckerTat = createStageMetric({
    startAt: coCheckerStartedAt,
    completedAt: coCheckerCompletedAt,
    nowAt,
  });

  const totalTat = combineStageMetrics([rmTat, approversTat, coCreatorTat, coCheckerTat]);

  return {
    key: `deferral-${deferral?._id || deferral?.id || index}`,
    itemId: deferral?.deferralNumber || deferral?.id || deferral?._id || `DEF-${index + 1}`,
    workflowType: "Deferral",
    status: deferral?.status || "pending",
    createdAt: createdAt?.toISOString() || deferral?.createdAt || null,
    customerName: deferral?.customerName || "Unknown Customer",
    currentStageKey,
    rmTat,
    approversTat,
    approverTatEntries: approverTimeline,
    coCreatorTat,
    coCheckerTat,
    totalTatMinutes: totalTat.minutes,
    totalTatDays: totalTat.days,
    totalTatLabel: totalTat.label,
    rmCompletedAt: rmCompletedAt?.toISOString() || null,
    firstApproverAt: approverTimeline[0]?.assignedAt?.toISOString() || null,
    lastApproverAt:
      (approverTimeline.length ? approverTimeline[approverTimeline.length - 1]?.decisionAt : null)?.toISOString() ||
      null,
    approverCount: approverTimeline.length,
    coCreatorCompletedAt: coCreatorCompletedAt?.toISOString() || null,
    coCheckerCompletedAt: coCheckerCompletedAt?.toISOString() || null,
    finalApprovedAt: coCheckerCompletedAt?.toISOString() || null,
  };
};

const buildDeferralTATRows = (deferralRows = [], nowAt = dayjs()) =>
  (deferralRows || [])
    .map((deferral, index) => buildDeferralTatRow(deferral, index, nowAt))
    .sort((left, right) => (right.totalTatMinutes || 0) - (left.totalTatMinutes || 0));

const getStatusMeta = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("approved") || normalizedStatus.includes("closed")) {
    return { label: "Approved", className: styles.tatStatusBadgeApproved };
  }

  if (normalizedStatus.includes("rejected") || normalizedStatus.includes("returned")) {
    return { label: normalizedStatus.includes("returned") ? "Returned" : "Rejected", className: styles.tatStatusBadgeRework };
  }

  if (normalizedStatus.includes("review") || normalizedStatus.includes("approval")) {
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

const renderStageValue = (stage, nowAt) => {
  return (
    <span className={styles.tatStageMetric}>
      {getLiveStageLabel(stage, nowAt)}
    </span>
  );
};

function DeferralTATTable({ deferralRows = [] }) {
  const now = useReportNow();
  const allRows = useMemo(
    () => buildDeferralTATRows(deferralRows, now),
    [deferralRows, now],
  );

  const columns = [
    {
      title: "Deferral ID",
      dataIndex: "itemId",
      key: "itemId",
      width: 180,
      render: (text, record) => (
        <Tooltip title={record.itemId}>
          <div>
            <div className={styles.tatItemName}>{text}</div>
            <div className={styles.tatItemMeta}>{record.customerName}</div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => (
        <span className={styles.tatItemMeta}>
          {date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "N/A"}
        </span>
      ),
    },
    {
      title: <span className={styles.tatHeaderCenter}>RM TAT</span>,
      dataIndex: "rmTat",
      key: "rmTat",
      width: 130,
      align: "center",
      render: (stage, record) => (
        <Tooltip
          title={record.rmCompletedAt ? `First Approver: ${dayjs(record.rmCompletedAt).format("DD/MM HH:mm")}` : "Awaiting RM Action"}
        >
          {renderStageValue(getEffectiveRmStage(record), now)}
        </Tooltip>
      ),
      sorter: (a, b) => (a.rmTat.minutes || 0) - (b.rmTat.minutes || 0),
    },
    {
      title: <span className={styles.tatHeaderCenter}>Approvers TAT</span>,
      dataIndex: "approversTat",
      key: "approversTat",
      width: 130,
      align: "center",
      render: (stage, record) => (
        <Tooltip
          title={record.approverCount ? `${record.approverCount} Approver(s) - Last acted: ${record.lastApproverAt ? dayjs(record.lastApproverAt).format("DD/MM HH:mm") : "Pending"}` : "No Approvers"}
        >
          <span className={styles.tatStageMetric}>
            {buildAggregateStageLabel(getEffectiveApproverStages(record), now)}
          </span>
        </Tooltip>
      ),
      sorter: (a, b) => (a.approversTat.minutes || 0) - (b.approversTat.minutes || 0),
    },
    {
      title: <span className={styles.tatHeaderCenter}>CO Creator TAT</span>,
      dataIndex: "coCreatorTat",
      key: "coCreatorTat",
      width: 130,
      align: "center",
      render: (stage, record) => (
        <Tooltip
          title={record.coCreatorCompletedAt ? `Approved: ${dayjs(record.coCreatorCompletedAt).format("DD/MM HH:mm")}` : "Awaiting CO Creator"}
        >
          {renderStageValue(getEffectiveCoCreatorStage(record), now)}
        </Tooltip>
      ),
      sorter: (a, b) => (a.coCreatorTat.minutes || 0) - (b.coCreatorTat.minutes || 0),
    },
    {
      title: <span className={styles.tatHeaderCenter}>CO Checker TAT</span>,
      dataIndex: "coCheckerTat",
      key: "coCheckerTat",
      width: 130,
      align: "center",
      render: (stage, record) => (
        <Tooltip
          title={record.coCheckerCompletedAt ? `Approved: ${dayjs(record.coCheckerCompletedAt).format("DD/MM HH:mm")}` : "Awaiting CO Checker"}
        >
          {renderStageValue(getEffectiveCoCheckerStage(record), now)}
        </Tooltip>
      ),
      sorter: (a, b) => (a.coCheckerTat?.minutes || 0) - (b.coCheckerTat?.minutes || 0),
    },
    {
      title: <span className={styles.tatHeaderCenter}>Total TAT</span>,
      dataIndex: "totalTatLabel",
      key: "totalTatLabel",
      width: 130,
      align: "center",
      render: (value, record) => (
        <Tooltip title={`≈ ${record.totalTatDays} days`}>
          <div className={styles.tatStageMetric}>
            {getLiveTotalLabel(record, now)}
          </div>
        </Tooltip>
      ),
      sorter: (a, b) => (a.totalTatMinutes || 0) - (b.totalTatMinutes || 0),
    },
    {
      title: <span className={styles.tatHeaderCenter}>Status</span>,
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <span className={styles.tatCellCenter}>
          <span className={`${styles.tatStatusBadge} ${getStatusMeta(status).className}`}>
            {getStatusMeta(status).label}
          </span>
        </span>
      ),
    },
  ];

  if (!allRows.length) {
    return (
      <Empty
        description="No deferral TAT data available for the selected filters"
        style={{ marginTop: 24 }}
      />
    );
  }

  return (
    <div className={styles.tatTable}>
      <Table
        columns={columns}
        dataSource={allRows}
        rowKey="key"
        pagination={{
          pageSize: 15,
          total: allRows.length,
          showSizeChanger: true,
          showQuickJumper: true,
          position: ["bottomCenter"],
        }}
        size="small"
        bordered={false}
      />
    </div>
  );
}

DeferralTATTable.buildRows = buildDeferralTATRows;

export default DeferralTATTable;
