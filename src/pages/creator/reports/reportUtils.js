import dayjs from "dayjs";

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

  rows.forEach((row) => {
    const statusLabel = String(row?.status || "Unknown")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ");
    statusMap.set(statusLabel, (statusMap.get(statusLabel) || 0) + 1);

    const loanType = row?.loanType || "Unspecified";
    loanTypeMap.set(loanType, (loanTypeMap.get(loanType) || 0) + 1);

    const rmName = row?.assignedToRM?.name || "Unassigned RM";
    rmMap.set(rmName, (rmMap.get(rmName) || 0) + 1);
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

  return {
    total: rows.length,
    statusRows,
    loanTypeRows,
    rmRows,
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
    const monthLabel = created.format("MMM-YY");
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
    deferredItemChartData: deferredItemRows.slice(0, 6),
  };
}