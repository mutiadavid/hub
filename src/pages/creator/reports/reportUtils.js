import dayjs from "dayjs";
import { normalizeBackendDate } from "../../../utils/checklistUtils";

const RISK_PRIORITY_ORDER = [
  "Primary Allowable",
  "Primary Non Allowable",
  "Secondary Allowable",
  "Secondary Non Allowable",
];

const ALLOWABLE_NAME_KEYWORDS = [
  "share certificate",
  "search",
  "clean title",
  "valuation",
  "offer letter",
  "land rates",
  "deeds",
  "certificate",
  "title",
  "annual returns",
  "corporate guarantee",
  "personal guarantee",
  "tcc",
];

export const formatNumber = (value) => Number(value || 0).toLocaleString();

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const safeLower = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const parseLoanAmount = (value) => {
  if (typeof value === "number") return value;
  const numeric = String(value || "").replace(/[^\d.-]/g, "");
  return Number(numeric || 0);
};

export const getDueDate = (deferral) => {
  if (deferral?.nextDueDate) return dayjs(deferral.nextDueDate);
  if (deferral?.nextDocumentDueDate) return dayjs(deferral.nextDocumentDueDate);
  if (deferral?.expiryDate) return dayjs(deferral.expiryDate);

  const createdAt = deferral?.createdAt ? dayjs(deferral.createdAt) : null;
  const daysSought = Number(deferral?.daysSought || 0);
  if (
    createdAt &&
    createdAt.isValid() &&
    Number.isFinite(daysSought) &&
    daysSought > 0
  ) {
    return createdAt.add(daysSought, "day");
  }

  return createdAt && createdAt.isValid() ? createdAt : null;
};

export const getOverdueDays = (deferral) => {
  const dueDate = getDueDate(deferral);
  if (!dueDate || !dueDate.isValid()) return 0;
  const diff = dayjs().startOf("day").diff(dueDate.startOf("day"), "day");
  return diff > 0 ? diff : 0;
};

export const classifyOverdueBucket = (days) => {
  if (days <= 0) return "Not Overdue";
  if (days < 30) return "Less than 30 days";
  if (days <= 90) return "30 to 90 days";
  if (days <= 180) return "91 to 180 days";
  return "Over 180 Days";
};

export const classifyExposureRisk = (overdueDays) => {
  if (overdueDays > 180) return "NPL";
  if (overdueDays >= 30) return "WATCH";
  return "NORMAL";
};

export const classifyItemCategory = (doc) => {
  const type = safeLower(doc?.type);
  const category = safeLower(doc?.category);
  const name = safeLower(doc?.name);
  const combined = `${type} ${category} ${name}`;

  if (combined.includes("primary")) return "Primary";
  if (combined.includes("secondary")) return "Secondary";
  return "Secondary";
};

export const classifyAllowability = (doc) => {
  const type = safeLower(doc?.type);
  const category = safeLower(doc?.category);
  const name = safeLower(doc?.name);
  const combined = `${type} ${category} ${name}`;

  if (
    combined.includes("non allowable") ||
    combined.includes("non-allowable") ||
    combined.includes("not allowable")
  ) {
    return "Non Allowable";
  }

  if (combined.includes("allowable")) {
    return "Allowable";
  }

  const isAllowableByName = ALLOWABLE_NAME_KEYWORDS.some((keyword) =>
    name.includes(keyword),
  );
  return isAllowableByName ? "Allowable" : "Non Allowable";
};

export const getDocumentEntries = (deferral) => {
  const docs = [];

  if (Array.isArray(deferral?.documents)) {
    deferral.documents.forEach((doc) => {
      if (!doc) return;
      docs.push({
        name: doc.name || doc.documentName || doc.title || "Unnamed Document",
        type: doc.type || doc.documentType || "",
        category: doc.category || doc.documentCategory || "",
      });
    });
  }

  if (Array.isArray(deferral?.selectedDocuments)) {
    deferral.selectedDocuments.forEach((doc) => {
      if (!doc) return;
      docs.push({
        name: doc.name || doc.title || "Unnamed Document",
        type: doc.type || "",
        category: doc.category || "",
      });
    });
  }

  if (!docs.length) {
    docs.push({
      name: deferral?.deferralDescription || "Unspecified Item",
      type: "",
      category: "",
    });
  }

  return docs;
};

export function buildDclAnalytics(rows, statusColors) {
  const statusMap = new Map();
  const loanTypeMap = new Map();
  const rmMap = new Map();
  const branchMap = new Map();
  const segmentMap = new Map();

  rows.forEach((row) => {
    const statusLabel = String(row?.status || "Unknown")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ");
    statusMap.set(statusLabel, (statusMap.get(statusLabel) || 0) + 1);

    const loanType = row?.loanType || "Unspecified";
    loanTypeMap.set(loanType, (loanTypeMap.get(loanType) || 0) + 1);

    const rmName = row?.assignedToRM?.name || "Unassigned RM";
    rmMap.set(rmName, (rmMap.get(rmName) || 0) + 1);

    const branchName = row?.customerBranchName || "Unspecified Branch";
    branchMap.set(branchName, (branchMap.get(branchName) || 0) + 1);

    const segment = row?.businessSegmentDesc || row?.businessSegment || "Unspecified Segment";
    segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1);
  });

  const statusRows = Array.from(statusMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      color:
        statusColors[
        String(name || "unknown")
          .replace(/\s+/g, "")
          .replace(/_/g, "")
          .toLowerCase()
        ] || statusColors.unknown,
    }))
    .sort((a, b) => b.value - a.value);

  const loanTypeRows = Array.from(loanTypeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const rmRows = Array.from(rmMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const branchRows = Array.from(branchMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const segmentRows = Array.from(segmentMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    total: rows.length,
    statusRows,
    loanTypeRows,
    rmRows,
    branchRows,
    segmentRows,
  };
}

export function buildDeferralsAnalytics(rows) {
  if (!rows.length) {
    return {
      total: 0,
      overdueCount: 0,
      overdueRate: 0,
      totalExposure: 0,
      watchAndNplExposure: 0,
      averageDaysSought: 0,
      topRm: null,
      topDeferredItem: null,
      topRiskGroup: null,
      topOverdueBucket: null,
      movementData: [],
      overduePieData: [],
      overdueBucketChartData: [],
      riskClassificationChartData: [],
      rmChartData: [],
      deferredItemChartData: [],
    };
  }

  const overdueBucketOrder = [
    "Not Overdue",
    "Less than 30 days",
    "30 to 90 days",
    "91 to 180 days",
    "Over 180 Days",
  ];

  const overdueBucketMap = new Map(overdueBucketOrder.map((bucket) => [bucket, 0]));
  const overdueStatusMap = new Map([
    ["Not Overdue", 0],
    ["Over Due", 0],
  ]);
  const riskExposureMap = new Map([
    ["NORMAL", 0],
    ["NPL", 0],
    ["WATCH", 0],
  ]);

  let totalDaysSought = 0;
  const rmCountMap = new Map();
  const deferredItemMap = new Map();
  const itemDeferredGroupMap = new Map();
  const riskMatrixMap = new Map();
  const branchMap = new Map();
  const segmentMap = new Map();

  rows.forEach((deferral) => {
    const overdueDays = getOverdueDays(deferral);
    const overdueBucket = classifyOverdueBucket(overdueDays);
    const overdueStatus = overdueDays > 0 ? "Over Due" : "Not Overdue";
    totalDaysSought += Number(deferral?.daysSought || 0);

    overdueBucketMap.set(overdueBucket, (overdueBucketMap.get(overdueBucket) || 0) + 1);
    overdueStatusMap.set(overdueStatus, (overdueStatusMap.get(overdueStatus) || 0) + 1);

    const loanAmount = parseLoanAmount(deferral.loanAmount);
    const riskClass = classifyExposureRisk(overdueDays);
    riskExposureMap.set(riskClass, (riskExposureMap.get(riskClass) || 0) + loanAmount);

    const rmName =
      deferral?.createdBy?.name ||
      deferral?.requestor?.name ||
      deferral?.requestedBy?.name ||
      "Unassigned RM";

    if (!rmCountMap.has(rmName)) {
      rmCountMap.set(rmName, { rm: rmName, notOverdue: 0, overDue: 0, total: 0 });
    }

    const rmStats = rmCountMap.get(rmName);
    rmStats.total += 1;
    if (overdueStatus === "Over Due") rmStats.overDue += 1;
    else rmStats.notOverdue += 1;

    const branchName = deferral?.customerBranchName || "Unspecified Branch";
    if (!branchMap.has(branchName)) {
      branchMap.set(branchName, { branch: branchName, notOverdue: 0, overDue: 0, total: 0 });
    }
    const branchStats = branchMap.get(branchName);
    branchStats.total += 1;
    if (overdueStatus === "Over Due") branchStats.overDue += 1;
    else branchStats.notOverdue += 1;

    const segmentName = deferral?.businessSegmentDesc || deferral?.businessSegment || "Unspecified Segment";
    if (!segmentMap.has(segmentName)) {
      segmentMap.set(segmentName, { segment: segmentName, notOverdue: 0, overDue: 0, total: 0 });
    }
    const segmentStats = segmentMap.get(segmentName);
    segmentStats.total += 1;
    if (overdueStatus === "Over Due") segmentStats.overDue += 1;
    else segmentStats.notOverdue += 1;

    getDocumentEntries(deferral).forEach((doc) => {
      const itemName = doc.name || "Unspecified Item";
      const primarySecondary = classifyItemCategory(doc);
      const allowability = classifyAllowability(doc);
      const riskGroup = `${primarySecondary} ${allowability}`;

      if (!deferredItemMap.has(itemName)) {
        deferredItemMap.set(itemName, {
          item: itemName,
          notOverdue: 0,
          overDue: 0,
          total: 0,
        });
      }
      const itemStats = deferredItemMap.get(itemName);
      itemStats.total += 1;
      if (overdueStatus === "Over Due") itemStats.overDue += 1;
      else itemStats.notOverdue += 1;

      const groupKey = `${riskGroup}::${itemName}`;
      if (!itemDeferredGroupMap.has(groupKey)) {
        itemDeferredGroupMap.set(groupKey, {
          group: riskGroup,
          risk: riskGroup,
          item: itemName,
          notOverdue: 0,
          overDue: 0,
          total: 0,
        });
      }
      const groupStats = itemDeferredGroupMap.get(groupKey);
      groupStats.total += 1;
      if (overdueStatus === "Over Due") groupStats.overDue += 1;
      else groupStats.notOverdue += 1;

      if (!riskMatrixMap.has(riskGroup)) {
        riskMatrixMap.set(riskGroup, {
          group: riskGroup,
          total: 0,
          overDue: 0,
          notOverdue: 0,
        });
      }
      const riskStats = riskMatrixMap.get(riskGroup);
      riskStats.total += 1;
      if (overdueStatus === "Over Due") riskStats.overDue += 1;
      else riskStats.notOverdue += 1;
    });
  });

  const overdueTimeRows = overdueBucketOrder
    .map((bucket, idx) => ({
      key: `${idx}-${bucket}`,
      bucket,
      count: overdueBucketMap.get(bucket) || 0,
    }))
    .filter((row) => row.count > 0 || row.bucket === "Not Overdue")
    .map((row) => ({
      ...row,
      pct: rows.length ? Math.round((row.count / rows.length) * 100) : 0,
    }));

  const riskClassificationRows = ["NORMAL", "NPL", "WATCH"].map((classification) => ({
    key: classification,
    classification,
    exposure: Math.round(riskExposureMap.get(classification) || 0),
  }));

  const rmCountRows = Array.from(rmCountMap.values())
    .sort((a, b) => b.total - a.total)
    .map((row, idx) => ({ key: `rm-${idx}`, ...row }));

  const branchCountRows = Array.from(branchMap.values())
    .sort((a, b) => b.total - a.total)
    .map((row, idx) => ({ key: `branch-${idx}`, ...row }));

  const segmentCountRows = Array.from(segmentMap.values())
    .sort((a, b) => b.total - a.total)
    .map((row, idx) => ({ key: `seg-${idx}`, ...row }));

  const deferredItemRows = Array.from(deferredItemMap.values())
    .sort((a, b) => b.total - a.total)
    .map((row, idx) => ({ key: `item-${idx}`, ...row }));

  const orderIndex = (group) => {
    const idx = RISK_PRIORITY_ORDER.indexOf(group);
    return idx === -1 ? 999 : idx;
  };

  const itemDeferredGroupRows = Array.from(itemDeferredGroupMap.values())
    .sort((a, b) => {
      const orderDiff = orderIndex(a.group) - orderIndex(b.group);
      if (orderDiff !== 0) return orderDiff;
      return b.total - a.total;
    })
    .map((row, idx) => ({ key: `group-${idx}`, ...row }));

  const monthMap = new Map();
  rows.forEach((row) => {
    const created = row.createdAt ? dayjs(row.createdAt) : null;
    if (!created || !created.isValid()) return;
    const key = created.startOf("month").format("YYYY-MM");
    const monthLabel = created.format("MMM YYYY");
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        key,
        month: monthLabel,
        newDeferred: 0,
        overdue: 0,
      });
    }
    const monthRow = monthMap.get(key);
    monthRow.newDeferred += 1;
    if (getOverdueDays(row) > 0) monthRow.overdue += 1;
  });

  const monthRows = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  let runningTotal = 0;
  let runningOverdue = 0;
  const movementData = monthRows.map((row) => {
    runningTotal += row.newDeferred;
    runningOverdue += row.overdue;
    return {
      month: row.month,
      total: runningTotal,
      historical: runningOverdue,
      newlyDeferred: runningTotal - runningOverdue,
    };
  });

  const overduePieData = [
    { name: "Not Overdue", value: overdueStatusMap.get("Not Overdue") || 0 },
    { name: "Over Due", value: overdueStatusMap.get("Over Due") || 0 },
  ];

  const totalExposure = riskClassificationRows.reduce((sum, row) => sum + row.exposure, 0);
  const overdueCount = overdueStatusMap.get("Over Due") || 0;
  const topRm = rmCountRows[0] || null;
  const topDeferredItem = deferredItemRows[0] || null;
  const topRiskGroup = itemDeferredGroupRows[0] || null;
  const topOverdueBucket =
    [...overdueTimeRows].filter((row) => row.bucket !== "Not Overdue").sort((a, b) => b.count - a.count)[0] ||
    overdueTimeRows[0] ||
    null;

  return {
    total: rows.length,
    overdueCount,
    overdueRate: rows.length ? (overdueCount / rows.length) * 100 : 0,
    totalExposure,
    watchAndNplExposure: (riskExposureMap.get("WATCH") || 0) + (riskExposureMap.get("NPL") || 0),
    averageDaysSought: rows.length ? totalDaysSought / rows.length : 0,
    topRm,
    topDeferredItem,
    topRiskGroup,
    topOverdueBucket,
    movementData,
    overduePieData,
    overdueBucketChartData: overdueTimeRows,
    riskClassificationChartData: riskClassificationRows,
    rmChartData: rmCountRows.slice(0, 6),
    branchChartData: branchCountRows.slice(0, 6),
    segmentChartData: segmentCountRows.slice(0, 6),
    deferredItemChartData: deferredItemRows.slice(0, 6),
  };
}

// TAT (Turnaround Time) Utilities
// Business hours: 8am-5pm (9 hours per day), Monday-Friday only

// EXACT LOG MESSAGES FROM CONTROLLERS - DO NOT CHANGE THESE PATTERNS
// See CoCreatorController.cs, RMController.cs, CheckerController.cs for source

// Stage 1: CO Creator Initial ends when submitted to RM
// CoCreatorController.cs line 2033: "Submitted to RM for review"
const CHECKLIST_CO_CREATOR_INITIAL_SUBMIT_PATTERNS = [
  /submitted to rm for review/i,
  /submitted to rm/i,
];

// Stage 2: RM Review ends when returned to CO Creator
// RMController.cs line 368: "Checklist submitted back to Co-Creator by RM"
const CHECKLIST_RM_EXIT_PATTERNS = [
  /checklist submitted back to co-?creator by rm/i,
  /submitted back to co-?creator/i,
  /returned to co-?creator/i,
];

// Stage 3: CO Creator Revision ends when submitted to Checker
// CoCreatorController.cs line 2162: "Submitted to Co-Checker for final approval"
const CHECKLIST_CO_CREATOR_EXIT_PATTERNS = [
  /submitted to co-?checker for final approval/i,
  /submitted to co-?checker/i,
  /sent for approval/i,
];

// Stage 4: CO Checker Final - completion when approved
// CheckerController.cs line 954: "DCL approved by checker"
const CHECKLIST_CO_CHECKER_EXIT_PATTERNS = [
  /dcl approved by checker/i,
  /dcl approved/i,
  /approved/i,
  /fully approved/i,
  /completed/i,
];

const CHECKLIST_FINAL_STATUSES = new Set([
  "approved",
  "completed",
  "rejected",
  "deferred",
  "revived",
  "discarded",
]);

const DEFERRAL_FINAL_STATUSES = new Set([
  "approved",
  "rejected",
  "returned_for_rework",
  "closed",
  "deferral_closed",
  "close_requested",
  "close_requested_creator_approved",
]);

const toMoment = (value) => {
  if (!value) return null;
  const normalized = normalizeBackendDate(value);
  if (!normalized) return null;
  return dayjs(normalized);
};

const momentMax = (...values) => {
  const valid = values.filter(Boolean);
  if (!valid.length) return null;
  return valid.reduce((highest, current) => (current.isAfter(highest) ? current : highest));
};

const momentMin = (...values) => {
  const valid = values.filter(Boolean);
  if (!valid.length) return null;
  return valid.reduce((lowest, current) => (current.isBefore(lowest) ? current : lowest));
};

const normalizeStageBoundary = (value, minimum) => {
  if (!value) return null;
  if (!minimum) return value;
  return value.isBefore(minimum) ? minimum : value;
};

const resolveStageBoundary = (explicitBoundary, fallbackCandidates = [], minimum = null) =>
  normalizeStageBoundary(explicitBoundary || momentMin(...fallbackCandidates), minimum);

// Business hours TAT calculation: 8am-5pm (9 hours/day), Monday-Friday only
const calculateBusinessHoursTAT = (start, end) => {
  if (!start || !end) return null;

  const BUSINESS_HOUR_START = 8; // 8am
  const BUSINESS_HOUR_END = 17; // 5pm
  const BUSINESS_HOURS_PER_DAY = BUSINESS_HOUR_END - BUSINESS_HOUR_START; // 9 hours

  let current = start.clone();
  let totalMinutes = 0;

  while (current.isBefore(end)) {
    // Skip weekends (Saturday=6, Sunday=0)
    if (current.day() === 0 || current.day() === 6) {
      current = current.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
      continue;
    }

    // Get current time's hour
    const currentHour = current.hour();

    // If before business hours, jump to business start
    if (currentHour < BUSINESS_HOUR_START) {
      current = current.hour(BUSINESS_HOUR_START).minute(0).second(0);
    }
    // If after business hours, jump to next day's business start
    else if (currentHour >= BUSINESS_HOUR_END) {
      current = current.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
      continue;
    }

    // Calculate time until end of business hours or until end timestamp
    const endOfBusinessToday = current.clone().hour(BUSINESS_HOUR_END).minute(0).second(0);
    const timeToUse = end.isBefore(endOfBusinessToday) ? end : endOfBusinessToday;

    if (current.isBefore(timeToUse)) {
      totalMinutes += timeToUse.diff(current, "minute", true);
      current = timeToUse;
    }

    // If we haven't reached end, move to next business day
    if (current.isBefore(end)) {
      current = current.add(1, "day").startOf("day").hour(BUSINESS_HOUR_START);
    } else {
      break;
    }
  }

  return totalMinutes > 0 ? totalMinutes : 0;
};

const minutesBetween = (start, end) => {
  if (!start || !end) return null;
  // Use business hours calculation instead of 24-hour
  const businessMinutes = calculateBusinessHoursTAT(start, end);
  return businessMinutes >= 0 ? businessMinutes : null;
};

const elapsedMinutesBetween = (start, end) => {
  if (!start || !end) return null;
  const elapsedMinutes = end.diff(start, "minute", true);
  return elapsedMinutes >= 0 ? elapsedMinutes : null;
};

const toDayValue = (minutes) => {
  // Convert business hours to business days (9 hours per day)
  const businessHoursPerDay = 9;
  const minutesPerBusinessDay = businessHoursPerDay * 60;
  return Number(((minutes || 0) / minutesPerBusinessDay).toFixed(2));
};

export const formatTatDuration = (minutes, fallback = "-") => {
  if (minutes == null) return fallback;
  if (minutes < 0) return fallback;

  // Business hours: 9 hours per day
  const BUSINESS_HOURS_PER_DAY = 9;
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const secondsPerBusinessDay = BUSINESS_HOURS_PER_DAY * 60 * 60;
  const businessDays = Math.floor(totalSeconds / secondsPerBusinessDay);
  const remainingDaySeconds = totalSeconds % secondsPerBusinessDay;
  const hours = Math.floor(remainingDaySeconds / 3600);
  const remainingHourSeconds = remainingDaySeconds % 3600;
  const mins = Math.floor(remainingHourSeconds / 60);
  const seconds = remainingHourSeconds % 60;

  const parts = [];
  if (businessDays > 0) parts.push(`${businessDays}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);

  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
};

const createStageMetric = ({ startAt, completedAt, nowAt = dayjs(), liveWhenInProgress = true }) => {
  const hasStarted = Boolean(startAt);
  const hasCompleted = Boolean(completedAt);
  const effectiveEnd = hasCompleted ? completedAt : hasStarted ? nowAt : null;
  const minutes = !hasStarted
    ? 0
    : minutesBetween(startAt, effectiveEnd) ?? 0;
  const state = !hasStarted ? "not_started" : hasCompleted ? "completed" : "in_progress";

  return {
    startAt: startAt || null,
    endAt: hasCompleted ? completedAt : null,
    minutes,
    days: toDayValue(minutes),
    state,
    label: `${formatTatDuration(minutes, "0m")}${state === "in_progress" ? " (in progress)" : ""}`,
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

const resolveFirstMoment = (...values) => {
  for (const value of values) {
    const parsed = toMoment(value);
    if (parsed) return parsed;
  }
  return null;
};

const getChecklistLogs = (checklist) => {
  const logs = Array.isArray(checklist?.logs)
    ? checklist.logs
    : Array.isArray(checklist?.Logs)
      ? checklist.Logs
      : [];

  return logs
    .map((entry) => ({
      message: entry?.message || entry?.Message || "",
      timestamp: toMoment(entry?.timestamp || entry?.Timestamp || entry?.createdAt || entry?.CreatedAt),
    }))
    .filter((entry) => entry.timestamp)
    .sort((left, right) => left.timestamp.valueOf() - right.timestamp.valueOf());
};

const findFirstLogTimestamp = (logs, patterns) => {
  const match = logs.find((entry) => patterns.some((pattern) => pattern.test(entry.message || "")));
  return match?.timestamp || null;
};

const getChecklistCurrentStage = (checklist, logs = getChecklistLogs(checklist)) => {
  const status = safeLower(checklist?.status);

  // Match against exact enum values in various formats: PascalCase, camelCase, lowercase, snake_case
  if (["approved", "rejected", "completed", "discarded"].includes(status)) return "done";
  if (["cocheckerreview", "cochecker_review", "co_checker_review"].includes(status)) return "coChecker";
  if (["pending", "active", "", null, undefined].includes(checklist?.status) || ["pending", "active"].includes(status)) {
    const hasCoCheckerBoundary = Boolean(
      resolveFirstMoment(
        checklist?.coCheckerCompletedAt,
        checklist?.CoCheckerCompletedAt,
        checklist?.completedAt,
        checklist?.CompletedAt,
      ) || findFirstLogTimestamp(logs, CHECKLIST_CO_CHECKER_EXIT_PATTERNS),
    );
    const hasCoCreatorRevisionBoundary = Boolean(
      resolveFirstMoment(
        checklist?.coCreatorCompletedAt,
        checklist?.CoCreatorCompletedAt,
        checklist?.sentToCheckerAt,
        checklist?.SentToCheckerAt,
        checklist?.submittedToCoCheckerAt,
        checklist?.SubmittedToCoCheckerAt,
      ) || findFirstLogTimestamp(logs, CHECKLIST_CO_CREATOR_EXIT_PATTERNS),
    );
    const hasRmBoundary = Boolean(
      resolveFirstMoment(
        checklist?.rmCompletedAt,
        checklist?.RmCompletedAt,
        checklist?.returnedByRMAt,
        checklist?.ReturnedByRMAt,
      ) || findFirstLogTimestamp(logs, CHECKLIST_RM_EXIT_PATTERNS),
    );
    const hasRmEntryBoundary = Boolean(
      resolveFirstMoment(
        checklist?.sentToRMAt,
        checklist?.SentToRMAt,
        checklist?.submittedToRMAt,
        checklist?.SubmittedToRMAt,
      ) || findFirstLogTimestamp(logs, CHECKLIST_CO_CREATOR_INITIAL_SUBMIT_PATTERNS),
    );

    if (hasCoCheckerBoundary) return "done";
    if (hasCoCreatorRevisionBoundary) return "coChecker";
    if (hasRmBoundary) return "coCreator";
    if (hasRmEntryBoundary) return "rm";
    return "coCreator";
  }

  if (["cocreatorreview", "cocreator_review", "co_creator_review", "active"].includes(status)) return "coCreator";
  if (["rmreview", "rm_review"].includes(status)) return "rm";
  return "coCreator";
};

const getChecklistTerminalTimestamp = (checklist, logs) => {
  const completedAt = toMoment(checklist?.completedAt);
  const updatedAt = toMoment(checklist?.updatedAt);
  const lastLogAt = logs.length ? logs[logs.length - 1].timestamp : null;
  const status = safeLower(checklist?.status);
  return CHECKLIST_FINAL_STATUSES.has(status)
    ? momentMax(completedAt, updatedAt, lastLogAt)
    : momentMax(updatedAt, lastLogAt);
};

const buildChecklistTatBreakdown = (checklist, nowAt = dayjs()) => {
  // Extract createdAt with proper normalization - try multiple common fields
  const createdAt = toMoment(
    checklist?.createdAt ||
    checklist?.CreatedAt ||
    checklist?.created_at ||
    checklist?.timestamp
  );
  const logs = getChecklistLogs(checklist);
  const terminalAt = getChecklistTerminalTimestamp(checklist, logs) || nowAt;
  const currentStageKey = getChecklistCurrentStage(checklist, logs);
  const checklistStatus = safeLower(checklist?.status);

  // DCL workflow source of truth: createdAt -> sentToRMAt -> rmCompletedAt -> coCreatorCompletedAt -> coCheckerCompletedAt
  const coCreatorInitialSubmitLog = findFirstLogTimestamp(logs, CHECKLIST_CO_CREATOR_INITIAL_SUBMIT_PATTERNS);
  const rmExitLog = findFirstLogTimestamp(logs, CHECKLIST_RM_EXIT_PATTERNS);
  const coCreatorExitLog = findFirstLogTimestamp(logs, CHECKLIST_CO_CREATOR_EXIT_PATTERNS);
  const coCheckerExitLog = findFirstLogTimestamp(logs, CHECKLIST_CO_CHECKER_EXIT_PATTERNS);

  const explicitCoCreatorInitialCompletedAt =
    resolveFirstMoment(
      checklist?.sentToRMAt,
      checklist?.SentToRMAt,
      checklist?.submittedToRMAt,
      checklist?.SubmittedToRMAt,
    ) || coCreatorInitialSubmitLog;

  const explicitRmReviewCompletedAt =
    resolveFirstMoment(
      checklist?.rmCompletedAt,
      checklist?.RmCompletedAt,
      checklist?.returnedByRMAt,
      checklist?.ReturnedByRMAt,
    ) || rmExitLog;

  const explicitCoCreatorRevisionCompletedAt =
    resolveFirstMoment(
      checklist?.coCreatorCompletedAt,
      checklist?.CoCreatorCompletedAt,
      checklist?.sentToCheckerAt,
      checklist?.SentToCheckerAt,
      checklist?.submittedToCoCheckerAt,
      checklist?.SubmittedToCoCheckerAt,
    ) || coCreatorExitLog;

  const explicitCoCheckerCompletedAt =
    resolveFirstMoment(
      checklist?.coCheckerCompletedAt,
      checklist?.CoCheckerCompletedAt,
      checklist?.completedAt,
      checklist?.CompletedAt,
    ) ||
    coCheckerExitLog;

  let coCheckerCompletedAt = CHECKLIST_FINAL_STATUSES.has(checklistStatus)
    ? resolveStageBoundary(explicitCoCheckerCompletedAt, [terminalAt])
    : normalizeStageBoundary(explicitCoCheckerCompletedAt, null);

  let coCreatorRevisionCompletedAt = resolveStageBoundary(
    explicitCoCreatorRevisionCompletedAt,
    [coCheckerCompletedAt],
  );

  let rmReviewCompletedAt = resolveStageBoundary(
    explicitRmReviewCompletedAt,
    [coCreatorRevisionCompletedAt, coCheckerCompletedAt],
  );

  let coCreatorInitialCompletedAt = resolveStageBoundary(
    explicitCoCreatorInitialCompletedAt,
    [rmReviewCompletedAt, coCreatorRevisionCompletedAt, coCheckerCompletedAt],
    createdAt,
  );

  // Trust the workflow status over stale downstream timestamps so the active stage
  // is rendered in the correct column when historical fields/logs are inconsistent.
  if (currentStageKey === "rm") {
    rmReviewCompletedAt = null;
    coCreatorRevisionCompletedAt = null;
    coCheckerCompletedAt = null;
  } else if (currentStageKey === "coCreator") {
    coCreatorRevisionCompletedAt = null;
    coCheckerCompletedAt = null;
  } else if (currentStageKey === "coChecker") {
    coCheckerCompletedAt = null;
  }

  if (!coCreatorInitialCompletedAt && currentStageKey !== "coCreator" && createdAt) {
    coCreatorInitialCompletedAt = createdAt;
  }

  rmReviewCompletedAt = normalizeStageBoundary(rmReviewCompletedAt, coCreatorInitialCompletedAt);
  coCreatorRevisionCompletedAt = normalizeStageBoundary(coCreatorRevisionCompletedAt, rmReviewCompletedAt);
  coCheckerCompletedAt = normalizeStageBoundary(coCheckerCompletedAt, coCreatorRevisionCompletedAt);

  if (currentStageKey === "rm" && !coCreatorInitialCompletedAt && createdAt) {
    coCreatorInitialCompletedAt = createdAt;
  }

  if (currentStageKey === "coChecker" && !coCreatorRevisionCompletedAt) {
    coCreatorRevisionCompletedAt = rmReviewCompletedAt || coCreatorInitialCompletedAt || createdAt;
  }

  const coCreatorInitialTat = createStageMetric({
    startAt: createdAt,
    completedAt: coCreatorInitialCompletedAt,
    nowAt,
  });

  const rmReviewTat = createStageMetric({
    startAt: coCreatorInitialCompletedAt,
    completedAt: rmReviewCompletedAt,
    nowAt,
  });

  const coCreatorRevisionTat = createStageMetric({
    startAt: rmReviewCompletedAt,
    completedAt: coCreatorRevisionCompletedAt,
    nowAt,
  });

  const coCheckerTat = createStageMetric({
    startAt: coCreatorRevisionCompletedAt,
    completedAt: coCheckerCompletedAt,
    nowAt,
  });

  const totalTat = combineStageMetrics([
    coCreatorInitialTat,
    rmReviewTat,
    coCreatorRevisionTat,
    coCheckerTat,
  ]);
  const totalTatMinutes = totalTat.minutes;

  return {
    workflowType: "DCL",
    createdAt,
    coCreatorInitialCompletedAt,
    rmReviewCompletedAt,
    coCreatorRevisionCompletedAt,
    coCheckerCompletedAt,
    terminalAt,
    currentStageKey,
    coCreatorInitialTat,
    rmReviewTat,
    coCreatorRevisionTat,
    coCheckerTat,
    totalTatMinutes,
    totalTatDays: toDayValue(totalTatMinutes),
    totalTatLabel: totalTat.label,
  };
};

const getOrderedDeferralApprovers = (deferral) => {
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

const getDeferralCurrentStage = (deferral, rmCompletedAt, firstApproverAt, lastApproverAt, creatorCompletedAt, checkerCompletedAt) => {
  const status = safeLower(deferral?.status);
  if (checkerCompletedAt || DEFERRAL_FINAL_STATUSES.has(status)) return "done";
  if (creatorCompletedAt || safeLower(deferral?.creatorApprovalStatus) === "approved") return "creator";
  if (lastApproverAt || safeLower(deferral?.allApproversApproved) === "true") return "coCreator";
  if (firstApproverAt) return "approvers";
  return "rm";
};

const getDeferralTerminalTimestamp = (deferral, approverDates) => {
  const creatorApprovalAt = toMoment(deferral?.creatorApprovalDate || deferral?.creatorApprovedAt);
  const checkerApprovalAt = toMoment(deferral?.checkerApprovalDate || deferral?.checkerApprovedAt);
  const updatedAt = toMoment(deferral?.updatedAt);
  const lastApproverAt = approverDates.length ? approverDates[approverDates.length - 1] : null;
  // Use the latest known action time; if all are null, use updatedAt; don't default to now()
  return momentMax(checkerApprovalAt, creatorApprovalAt, lastApproverAt, updatedAt) || updatedAt || null;
};

const buildDeferralTatBreakdown = (deferral, nowAt = dayjs()) => {
  // Extract createdAt with proper normalization - try multiple common fields
  const createdAt = toMoment(
    deferral?.createdAt ||
    deferral?.CreatedAt ||
    deferral?.created_at ||
    deferral?.timestamp
  );
  const orderedApprovers = getOrderedDeferralApprovers(deferral);
  const explicitFirstApproverAssignedAt = resolveFirstMoment(
    deferral?.firstApproverAssignedAt,
    deferral?.FirstApproverAssignedAt,
    deferral?.sentToApproversAt,
    deferral?.SentToApproversAt,
  );
  const creatorApprovalAt = resolveFirstMoment(
    deferral?.coCreatorAcceptedAt,
    deferral?.CoCreatorAcceptedAt,
    deferral?.creatorApprovalDate,
    deferral?.creatorApprovedAt,
    deferral?.CreatorApprovalDate,
  );
  const checkerApprovalAt = resolveFirstMoment(
    deferral?.coCheckerAcceptedAt,
    deferral?.CoCheckerAcceptedAt,
    deferral?.checkerApprovalDate,
    deferral?.checkerApprovedAt,
    deferral?.CheckerApprovalDate,
    deferral?.closedAt,
    deferral?.ClosedAt,
  );
  const approverTimeline = [];

  orderedApprovers.forEach((approver, index) => {
    const previousDecisionAt = index > 0 ? approverTimeline[index - 1]?.decisionAt : null;
    const assignedAt =
      getApproverAssignedAt(approver) ||
      previousDecisionAt ||
      (index === 0 ? explicitFirstApproverAssignedAt || createdAt : null);

    approverTimeline.push({
      approver,
      assignedAt,
      explicitDecisionAt: getApproverDecisionAt(approver),
      decisionAt: null,
      metric: null,
    });
  });

  for (let index = approverTimeline.length - 1; index >= 0; index -= 1) {
    const entry = approverTimeline[index];
    const nextAssignedAt = approverTimeline[index + 1]?.assignedAt || null;
    entry.decisionAt = resolveStageBoundary(
      entry.explicitDecisionAt,
      [nextAssignedAt, creatorApprovalAt, checkerApprovalAt],
      entry.assignedAt,
    );
  }

  approverTimeline.forEach((entry) => {
    entry.metric = createStageMetric({
      startAt: entry.assignedAt,
      completedAt: entry.decisionAt,
      nowAt,
    });
  });

  const approverDates = approverTimeline.map((entry) => entry.decisionAt).filter(Boolean);
  const firstApproverAt = approverTimeline[0]?.assignedAt || explicitFirstApproverAssignedAt || null;
  const lastApproverAt = approverTimeline.length
    ? approverTimeline[approverTimeline.length - 1]?.decisionAt || null
    : null;
  const sentToCoCreatorAt =
    resolveFirstMoment(
      deferral?.sentToCoCreatorAt,
      deferral?.SentToCoCreatorAt,
      deferral?.submittedToCoCreatorAt,
      deferral?.SubmittedToCoCreatorAt,
      deferral?.creatorAssignedAt,
      deferral?.CreatorAssignedAt,
    ) ||
    (orderedApprovers.length ? lastApproverAt : createdAt);
  const terminalAt = getDeferralTerminalTimestamp(deferral, approverDates) || nowAt;

  const rmCompletedAt = firstApproverAt || sentToCoCreatorAt || creatorApprovalAt || checkerApprovalAt;
  const approvingCompletedAt = lastApproverAt;
  const coCreatorCompletedAt = creatorApprovalAt;
  const creatorCompletedAt = checkerApprovalAt;
  const currentStageKey = getDeferralCurrentStage(deferral, rmCompletedAt, firstApproverAt, lastApproverAt, coCreatorCompletedAt, creatorCompletedAt);

  const normalizedSentToCoCreatorAt = sentToCoCreatorAt || approvingCompletedAt || rmCompletedAt || createdAt;
  const normalizedCoCreatorCompletedAt = coCreatorCompletedAt || (currentStageKey === "creator" ? normalizedSentToCoCreatorAt : null);

  const rmTat = createStageMetric({
    startAt: createdAt,
    completedAt: rmCompletedAt,
    nowAt,
  });

  const approversTat = combineStageMetrics(approverTimeline.map((entry) => entry.metric));

  const coCreatorTat = createStageMetric({
    startAt: normalizedSentToCoCreatorAt,
    completedAt: normalizedCoCreatorCompletedAt,
    nowAt,
  });

  const creatorTat = createStageMetric({
    startAt: normalizedCoCreatorCompletedAt,
    completedAt: creatorCompletedAt,
    nowAt,
  });

  const totalTat = combineStageMetrics([
    rmTat,
    approversTat,
    coCreatorTat,
    creatorTat,
  ]);
  const totalTatMinutes = totalTat.minutes;

  return {
    workflowType: "Deferral",
    createdAt,
    rmCompletedAt,
    firstApproverAt,
    lastApproverAt,
    approvingCompletedAt,
    coCreatorCompletedAt,
    creatorCompletedAt,
    terminalAt,
    approverCount: approverDates.length,
    currentStageKey,
    rmTat,
    approversTat,
    approverTatEntries: approverTimeline,
    coCreatorTat,
    creatorTat,
    totalTatMinutes,
    totalTatDays: toDayValue(totalTatMinutes),
    totalTatLabel: totalTat.label,
  };
};

export const calculateTATConsumed = (item, workflowType = "DCL", nowAt = dayjs()) =>
  buildTatBreakdown(item, workflowType, nowAt).totalTatDays;

export const classifyTATBucket = (tatDays) => {
  if (tatDays <= 7) return "Excellent (≤7 days)";
  if (tatDays <= 14) return "Good (8-14 days)";
  if (tatDays <= 21) return "Average (15-21 days)";
  if (tatDays <= 30) return "Slow (22-30 days)";
  return "Very Slow (>30 days)";
};

export const buildTatBreakdown = (item, workflowType, nowAt = dayjs()) =>
  workflowType === "DCL" ? buildChecklistTatBreakdown(item, nowAt) : buildDeferralTatBreakdown(item, nowAt);

export const buildTATTableRows = (deferralRows = [], dclRows = [], nowAt = dayjs()) => {
  const mappedDeferrals = (deferralRows || []).map((item, index) => {
    const breakdown = buildDeferralTatBreakdown(item, nowAt);

    return {
      key: `deferral-${item?._id || item?.id || index}`,
      itemId: item?.deferralNumber || item?.id || item?._id || `DEF-${index + 1}`,
      workflowType: "Deferral",
      status: item?.status || "pending",
      createdAt: breakdown.createdAt?.toISOString() || item?.createdAt || null,
      customerName: item?.customerName || "Unknown Customer",
      rmTat: breakdown.rmTat,
      approversTat: breakdown.approversTat,
      coCreatorTat: breakdown.coCreatorTat,
      creatorTat: breakdown.creatorTat,
      // Analytics backward compatibility
      coCheckerTat: breakdown.creatorTat,
      totalTatMinutes: breakdown.totalTatMinutes,
      totalTatDays: breakdown.totalTatDays,
      totalTatLabel: breakdown.totalTatLabel,
      rmCompletedAt: breakdown.rmCompletedAt?.toISOString() || null,
      firstApproverAt: breakdown.firstApproverAt?.toISOString() || null,
      lastApproverAt: breakdown.lastApproverAt?.toISOString() || null,
      approverCount: breakdown.approverCount || 0,
      coCreatorCompletedAt: breakdown.coCreatorCompletedAt?.toISOString() || null,
      creatorCompletedAt: breakdown.creatorCompletedAt?.toISOString() || null,
      finalApprovedAt: breakdown.creatorCompletedAt?.toISOString() || null,
    };
  });

  const mappedDcls = (dclRows || []).map((item, index) => {
    const breakdown = buildChecklistTatBreakdown(item, nowAt);
    const aggregateRmTat = breakdown.rmReviewTat;
    const aggregateCoCreatorTat = combineStageMetrics([
      breakdown.coCreatorInitialTat,
      breakdown.coCreatorRevisionTat,
    ]);

    return {
      key: `dcl-${item?._id || item?.id || index}`,
      itemId: item?.dclNo || item?.dclNumber || item?.id || item?._id || `DCL-${index + 1}`,
      workflowType: "DCL",
      currentStageKey: breakdown.currentStageKey,
      status: item?.status || "pending",
      createdAt: breakdown.createdAt?.toISOString() || item?.createdAt || null,
      customerName: item?.customerName || "Unknown Customer",
      coCreatorInitialTat: breakdown.coCreatorInitialTat,
      rmReviewTat: breakdown.rmReviewTat,
      coCreatorRevisionTat: breakdown.coCreatorRevisionTat,
      coCheckerTat: breakdown.coCheckerTat,
      // Analytics aggregates for backward compatibility
      rmTat: aggregateRmTat,
      coCreatorTat: aggregateCoCreatorTat,
      totalTatMinutes: breakdown.totalTatMinutes,
      totalTatDays: breakdown.totalTatDays,
      totalTatLabel: breakdown.totalTatLabel,
      coCreatorInitialCompletedAt: breakdown.coCreatorInitialCompletedAt?.toISOString() || null,
      rmReviewCompletedAt: breakdown.rmReviewCompletedAt?.toISOString() || null,
      coCreatorRevisionCompletedAt: breakdown.coCreatorRevisionCompletedAt?.toISOString() || null,
      coCheckerCompletedAt: breakdown.coCheckerCompletedAt?.toISOString() || null,
      finalApprovedAt: breakdown.coCheckerCompletedAt?.toISOString() || null,
    };
  });

  return [...mappedDeferrals, ...mappedDcls].sort((left, right) => right.totalTatMinutes - left.totalTatMinutes);
};

export function buildTATAnalytics(deferralRows, dclRows, nowAt = dayjs()) {
  const rows = buildTATTableRows(deferralRows, dclRows, nowAt);

  if (!rows.length) {
    return {
      totalItems: 0,
      totalTATConsumed: 0,
      averageTAT: 0,
      averageRmTat: 0,
      averageCoCreatorTat: 0,
      averageCoCheckerTat: 0,
      deferralMetrics: { count: 0, totalTAT: 0, averageTAT: 0, averageRmTat: 0, averageCoCreatorTat: 0, averageCoCheckerTat: 0 },
      dclMetrics: { count: 0, totalTAT: 0, averageTAT: 0, averageRmTat: 0, averageCoCreatorTat: 0, averageCoCheckerTat: 0 },
      tatBucketData: [],
      stageComparisonData: [],
      tatTrendData: [],
      typeComparisonData: [],
      totalComparisonData: [],
    };
  }

  const tatBucketMap = new Map([
    ["Excellent (≤7 days)", 0],
    ["Good (8-14 days)", 0],
    ["Average (15-21 days)", 0],
    ["Slow (22-30 days)", 0],
    ["Very Slow (>30 days)", 0],
  ]);

  const typeMetrics = {
    Deferral: { count: 0, totalTatMinutes: 0, rmMinutes: 0, coCreatorMinutes: 0, coCheckerMinutes: 0 },
    DCL: { count: 0, totalTatMinutes: 0, rmMinutes: 0, coCreatorMinutes: 0, coCheckerMinutes: 0 },
  };

  let totalTatMinutes = 0;
  let rmMinutes = 0;
  let coCreatorMinutes = 0;
  let coCheckerMinutes = 0;
  const trendMap = new Map();

  rows.forEach((row) => {
    tatBucketMap.set(classifyTATBucket(row.totalTatDays), (tatBucketMap.get(classifyTATBucket(row.totalTatDays)) || 0) + 1);
    totalTatMinutes += row.totalTatMinutes || 0;
    rmMinutes += row.rmTat.minutes || 0;
    coCreatorMinutes += row.coCreatorTat.minutes || 0;
    coCheckerMinutes += row.coCheckerTat.minutes || 0;

    const bucket = typeMetrics[row.workflowType];
    bucket.count += 1;
    bucket.totalTatMinutes += row.totalTatMinutes || 0;
    bucket.rmMinutes += row.rmTat.minutes || 0;
    bucket.coCreatorMinutes += row.coCreatorTat.minutes || 0;
    bucket.coCheckerMinutes += row.coCheckerTat.minutes || 0;

    const createdAt = row.createdAt ? dayjs(row.createdAt) : null;
    if (createdAt && createdAt.isValid()) {
      const key = createdAt.startOf("month").format("YYYY-MM");
      if (!trendMap.has(key)) {
        trendMap.set(key, {
          key,
          month: createdAt.format("MMM-YY"),
          DCL: { count: 0, totalTatMinutes: 0 },
          Deferral: { count: 0, totalTatMinutes: 0 },
        });
      }
      const monthBucket = trendMap.get(key);
      monthBucket[row.workflowType].count += 1;
      monthBucket[row.workflowType].totalTatMinutes += row.totalTatMinutes || 0;
    }
  });

  const avgFor = (minutes, count) => (count ? toDayValue(Math.round(minutes / count)) : 0);

  const tatBucketData = Array.from(tatBucketMap.entries())
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  const stageComparisonData = [
    { stage: "RM", DCL: avgFor(typeMetrics.DCL.rmMinutes, typeMetrics.DCL.count), Deferral: avgFor(typeMetrics.Deferral.rmMinutes, typeMetrics.Deferral.count) },
    { stage: "CO Creator", DCL: avgFor(typeMetrics.DCL.coCreatorMinutes, typeMetrics.DCL.count), Deferral: avgFor(typeMetrics.Deferral.coCreatorMinutes, typeMetrics.Deferral.count) },
    { stage: "CO Checker", DCL: avgFor(typeMetrics.DCL.coCheckerMinutes, typeMetrics.DCL.count), Deferral: avgFor(typeMetrics.Deferral.coCheckerMinutes, typeMetrics.Deferral.count) },
    { stage: "Total", DCL: avgFor(typeMetrics.DCL.totalTatMinutes, typeMetrics.DCL.count), Deferral: avgFor(typeMetrics.Deferral.totalTatMinutes, typeMetrics.Deferral.count) },
  ];

  const totalComparisonData = [
    { name: "DCL", count: typeMetrics.DCL.count, avgTotalTat: avgFor(typeMetrics.DCL.totalTatMinutes, typeMetrics.DCL.count) },
    { name: "Deferral", count: typeMetrics.Deferral.count, avgTotalTat: avgFor(typeMetrics.Deferral.totalTatMinutes, typeMetrics.Deferral.count) },
  ];

  const tatTrendData = Array.from(trendMap.values())
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((entry) => ({
      month: entry.month,
      dclAvgTat: avgFor(entry.DCL.totalTatMinutes, entry.DCL.count),
      deferralAvgTat: avgFor(entry.Deferral.totalTatMinutes, entry.Deferral.count),
      totalCount: entry.DCL.count + entry.Deferral.count,
    }));

  const typeComparisonData = [
    { name: "DCL", value: typeMetrics.DCL.count, totalTAT: avgFor(typeMetrics.DCL.totalTatMinutes, 1) },
    { name: "Deferral", value: typeMetrics.Deferral.count, totalTAT: avgFor(typeMetrics.Deferral.totalTatMinutes, 1) },
  ];

  return {
    totalItems: rows.length,
    totalTATConsumed: toDayValue(totalTatMinutes),
    averageTAT: avgFor(totalTatMinutes, rows.length),
    averageRmTat: avgFor(rmMinutes, rows.length),
    averageCoCreatorTat: avgFor(coCreatorMinutes, rows.length),
    averageCoCheckerTat: avgFor(coCheckerMinutes, rows.length),
    deferralMetrics: {
      count: typeMetrics.Deferral.count,
      totalTAT: toDayValue(typeMetrics.Deferral.totalTatMinutes),
      averageTAT: avgFor(typeMetrics.Deferral.totalTatMinutes, typeMetrics.Deferral.count),
      averageRmTat: avgFor(typeMetrics.Deferral.rmMinutes, typeMetrics.Deferral.count),
      averageCoCreatorTat: avgFor(typeMetrics.Deferral.coCreatorMinutes, typeMetrics.Deferral.count),
      averageCoCheckerTat: avgFor(typeMetrics.Deferral.coCheckerMinutes, typeMetrics.Deferral.count),
    },
    dclMetrics: {
      count: typeMetrics.DCL.count,
      totalTAT: toDayValue(typeMetrics.DCL.totalTatMinutes),
      averageTAT: avgFor(typeMetrics.DCL.totalTatMinutes, typeMetrics.DCL.count),
      averageRmTat: avgFor(typeMetrics.DCL.rmMinutes, typeMetrics.DCL.count),
      averageCoCreatorTat: avgFor(typeMetrics.DCL.coCreatorMinutes, typeMetrics.DCL.count),
      averageCoCheckerTat: avgFor(typeMetrics.DCL.coCheckerMinutes, typeMetrics.DCL.count),
    },
    tatBucketData,
    stageComparisonData,
    tatTrendData,
    typeComparisonData,
    totalComparisonData,
  };
}
