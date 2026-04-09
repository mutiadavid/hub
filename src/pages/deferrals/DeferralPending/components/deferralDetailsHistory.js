import dayjs from "dayjs";

const GENERIC_ROLE_LABELS = new Set([
  "user",
  "system",
  "approver",
  "rm",
  "creator",
  "checker",
  "cocreator",
  "co creator",
  "cochecker",
  "co checker",
  "customer",
  "admin",
]);

const DUPLICATE_TIME_WINDOW_MS = 2 * 60 * 1000;

const normalizeHistoryValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getTimestampValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.valueOf();
};

const getRoleSpecificityScore = (roleLabel) => {
  const normalizedRole = normalizeHistoryValue(roleLabel);
  if (!normalizedRole) return 0;
  if (GENERIC_ROLE_LABELS.has(normalizedRole)) return 1;
  return 10 + normalizedRole.length;
};

const dedupeHistoryEntries = (entries) => {
  const deduped = [];

  entries.forEach((entry, index) => {
    const normalizedUser = normalizeHistoryValue(entry.user);
    const normalizedComment = normalizeHistoryValue(entry.comment);
    const entryTime = getTimestampValue(
      entry.date || entry.createdAt || entry.timestamp,
    );

    const current = {
      ...entry,
      __index: index,
      __score: getRoleSpecificityScore(entry.userRole || entry.role),
      __user: normalizedUser,
      __comment: normalizedComment,
      __time: entryTime,
    };

    const existingIndex = deduped.findIndex((candidate) => {
      if (
        candidate.__user !== current.__user ||
        candidate.__comment !== current.__comment
      ) {
        return false;
      }

      if (candidate.__time == null || current.__time == null) {
        return true;
      }

      return Math.abs(candidate.__time - current.__time) <= DUPLICATE_TIME_WINDOW_MS;
    });

    if (existingIndex === -1) {
      deduped.push(current);
      return;
    }

    const existing = deduped[existingIndex];
    const shouldReplace =
      current.__score > existing.__score ||
      (current.__score === existing.__score && current.__index < existing.__index);

    if (shouldReplace) {
      deduped[existingIndex] = current;
    }
  });

  return deduped
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .map((entry) => {
      const nextEntry = { ...entry };
      delete nextEntry.__index;
      delete nextEntry.__score;
      delete nextEntry.__user;
      delete nextEntry.__comment;
      delete nextEntry.__time;
      return nextEntry;
    });
};

export const buildDeferralHistory = ({
  displayDeferral,
  sourceDeferral,
  rejectionActor,
  rejectionReasonRaw,
  rejectedApprover,
  withdrawalActor,
  withdrawalReasonRaw,
}) => {
  const events = [];
  const hasMatchingHistoryEntry = (needle) =>
    events.some((event) =>
      String(event.comment || "")
        .toLowerCase()
        .includes(String(needle || "").toLowerCase()),
    );
  const findActionHistoryEntry = (keyword) =>
    events.find((event) =>
      String(event.comment || "")
        .toLowerCase()
        .includes(keyword),
    );

  if (displayDeferral?.comments && Array.isArray(displayDeferral.comments)) {
    displayDeferral.comments.forEach((comment) => {
      const commentAuthorName =
        comment.author?.name || comment.authorName || comment.userName || "User";
      const commentAuthorRole = comment.author?.role || comment.authorRole || "User";
      events.push({
        user: commentAuthorName,
        userRole: commentAuthorRole,
        date: comment.createdAt,
        comment: comment.text || "",
      });
    });
  }

  if (sourceDeferral?.history && Array.isArray(sourceDeferral.history)) {
    sourceDeferral.history.forEach((historyItem) => {
      if (historyItem.action === "moved") return;
      const userName =
        historyItem.userName || historyItem.user?.name || historyItem.user || "System";
      const userRole = historyItem.userRole || historyItem.user?.role || "System";
      events.push({
        user: userName,
        userRole,
        date: historyItem.date || historyItem.createdAt || historyItem.timestamp,
        comment: historyItem.comment || historyItem.notes || "",
      });
    });
  }

  const existingRejectionEntry = findActionHistoryEntry("reject");
  if (
    existingRejectionEntry &&
    rejectionReasonRaw &&
    !String(existingRejectionEntry.comment || "")
      .toLowerCase()
      .includes(rejectionReasonRaw.toLowerCase())
  ) {
    existingRejectionEntry.comment = `${existingRejectionEntry.comment}. Reason: ${rejectionReasonRaw}`;
  } else if (rejectionReasonRaw && !hasMatchingHistoryEntry(rejectionReasonRaw)) {
    events.push({
      user: rejectionActor,
      userRole: rejectedApprover?.role || rejectedApprover?.designation || "Approver",
      date:
        rejectedApprover?.rejectedAt ||
        displayDeferral?.updatedAt ||
        displayDeferral?.createdAt,
      comment: `Rejected deferral. Reason: ${rejectionReasonRaw}`,
    });
  }

  const existingWithdrawalEntry = findActionHistoryEntry("withdraw");
  if (
    existingWithdrawalEntry &&
    withdrawalReasonRaw &&
    !String(existingWithdrawalEntry.comment || "")
      .toLowerCase()
      .includes(withdrawalReasonRaw.toLowerCase())
  ) {
    existingWithdrawalEntry.comment = `${existingWithdrawalEntry.comment}. Reason: ${withdrawalReasonRaw}`;
  } else if (withdrawalReasonRaw && !hasMatchingHistoryEntry(withdrawalReasonRaw)) {
    events.push({
      user: withdrawalActor,
      userRole: "RM",
      date:
        displayDeferral?.closedAt ||
        displayDeferral?.updatedAt ||
        displayDeferral?.createdAt,
      comment: `Withdrew deferral. Reason: ${withdrawalReasonRaw}`,
    });
  }

  return dedupeHistoryEntries(events);
};
