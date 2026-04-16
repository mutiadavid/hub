const PLACEHOLDER_NAMES = new Set(["", "user", "requester", "approver", "system"]);

const normalizeName = (value) => {
  const text = String(value || "").trim();
  return text || null;
};

const isPlaceholderName = (value) => {
  const text = normalizeName(value);
  if (!text) {
    return true;
  }

  return PLACEHOLDER_NAMES.has(text.toLowerCase());
};

const extractNameCandidate = (value) => {
  if (!value) return null;
  if (typeof value === "string") return normalizeName(value);

  return (
    normalizeName(value.name) ||
    normalizeName(value.fullName) ||
    normalizeName(value.userName) ||
    normalizeName(value.displayName) ||
    null
  );
};

export const resolveDisplayName = (...values) => {
  const candidates = values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(extractNameCandidate)
    .filter(Boolean);

  const preferredCandidate = candidates.find((candidate) => !isPlaceholderName(candidate));
  return preferredCandidate || candidates[0] || "System";
};

const getDisplayName = (...values) => resolveDisplayName(...values);

const getDisplayRole = (value, fallback = "System") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.role || value.designation || fallback;
};

const getActionLabelFromStatus = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  if (normalizedStatus === "approved") {
    return "Approved extension";
  }

  if (normalizedStatus === "rejected") {
    return "Rejected extension";
  }

  if (normalizedStatus === "returned_for_rework") {
    return "Returned extension for rework";
  }

  return `Updated extension status to ${normalizedStatus.replace(/_/g, " ")}`;
};

const getHistoryActionLabel = (historyItem) => {
  const action = String(historyItem?.action || historyItem?.Action || "")
    .trim()
    .toLowerCase();

  if (!action) {
    return "";
  }

  const actionMap = {
    extension_requested: "Submitted extension request",
    approved_by_approver: "Approved extension",
    rejected_by_approver: "Rejected extension",
    returned_for_rework: "Returned extension for rework",
    approved_by_creator: "Approved extension as creator",
    rejected_by_creator: "Rejected extension as creator",
    approved_by_checker: "Approved extension as checker",
    rejected_by_checker: "Rejected extension as checker",
  };

  return actionMap[action] || action.replace(/_/g, " ");
};

const buildHistoryComment = (historyItem) => {
  const note =
    historyItem?.notes ||
    historyItem?.Notes ||
    historyItem?.comment ||
    historyItem?.Comment ||
    historyItem?.message ||
    historyItem?.Message ||
    "";
  const actionLabel = getHistoryActionLabel(historyItem);

  if (note && actionLabel) {
    const normalizedNote = String(note).trim();
    const normalizedLabel = String(actionLabel).trim().toLowerCase();
    if (normalizedNote.toLowerCase().startsWith(normalizedLabel)) {
      return normalizedNote;
    }
    return `${actionLabel}. ${normalizedNote}`;
  }

  return note || actionLabel || "";
};

const addUniqueEntry = (entries, nextEntry) => {
  const key = [
    nextEntry.user,
    nextEntry.userRole,
    nextEntry.date,
    nextEntry.comment,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");

  if (!entries.some((entry) => [entry.user, entry.userRole, entry.date, entry.comment]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|") === key)) {
    entries.push(nextEntry);
  }
};

const getTextValue = (...values) => {
  const textValue = values.find((value) => typeof value === "string" && value.trim());
  return textValue ? textValue.trim() : "";
};

export const buildExtensionCommentEntries = (extension) => {
  const entries = [];

  if (!extension) {
    return entries;
  }

  const extensionReason = getTextValue(
    extension.extensionReason,
    extension.ExtensionReason,
    extension.reason,
    extension.Reason,
  );

  if (extension.createdAt && extensionReason) {
    addUniqueEntry(entries, {
      user: getDisplayName(
        extension.requestedByName,
        extension.requestedBy,
        extension.requestedBy?.name,
        extension.requestedBy?.fullName,
        extension.createdBy,
        extension.createdByName,
        extension.submittedBy,
        extension.submittedByName,
      ),
      userRole: getDisplayRole(extension.requestedByRole, "RM"),
      date: extension.createdAt,
      comment: extensionReason,
      isSystemComment: false,
    });
  }

  if (Array.isArray(extension.comments)) {
    extension.comments.forEach((comment) => {
      if (comment?.isSystemComment || comment?.isSystem) {
        return;
      }

      const text = getTextValue(
        comment.text,
        comment.Text,
        comment.comment,
        comment.Comment,
        comment.notes,
        comment.Notes,
      );

      if (!text) {
        return;
      }

      addUniqueEntry(entries, {
        user: getDisplayName(
          comment.userName,
          comment.UserName,
          comment.user,
          comment.author,
          comment.author?.name,
          comment.AuthorName,
          comment.createdBy,
        ),
        userRole: getDisplayRole(comment.userRole || comment.UserRole || comment.role, "User"),
        date: comment.createdAt || comment.CreatedAt || comment.timestamp || comment.date || comment.Date,
        comment: text,
        isSystemComment: false,
      });
    });
  }

  if (Array.isArray(extension.approvals)) {
    extension.approvals.forEach((approval) => {
      const note = getTextValue(
        approval.comment,
        approval.Comment,
        approval.reason,
        approval.Reason,
        approval.notes,
        approval.Notes,
      );

      if (!note) {
        return;
      }

      addUniqueEntry(entries, {
        user: getDisplayName(
          approval.userName,
          approval.UserName,
          approval.name,
          approval.Name,
          approval.user,
          approval.User,
          approval.user?.name,
          approval.user?.fullName,
        ),
        userRole: getDisplayRole(approval.userRole || approval.UserRole || approval.role || approval.Role, "Approver"),
        date: approval.approvedAt || approval.ApprovedAt || approval.rejectedAt || approval.RejectedAt || approval.createdAt || approval.CreatedAt || approval.timestamp || approval.date || approval.Date,
        comment: note,
        isSystemComment: false,
      });
    });
  }

  if (Array.isArray(extension.approvers)) {
    extension.approvers.forEach((approver) => {
      const note = getTextValue(
        approver.comment,
        approver.Comment,
        approver.approvalComment,
        approver.ApprovalComment,
        approver.reason,
        approver.Reason,
        approver.notes,
        approver.Notes,
      );

      if (!note) {
        return;
      }

      addUniqueEntry(entries, {
        user: getDisplayName(
          approver.name,
          approver.Name,
          approver.approverName,
          approver.ApproverName,
          approver.userName,
          approver.UserName,
          approver.user,
          approver.User,
          approver.user?.name,
          approver.user?.fullName,
        ),
        userRole: getDisplayRole(approver.role || approver.Role || approver.designation || approver.Designation, "Approver"),
        date: approver.approvedAt || approver.ApprovedAt || approver.approvalDate || approver.ApprovalDate || approver.rejectedAt || approver.RejectedAt || approver.updatedAt || approver.UpdatedAt || approver.createdAt || approver.CreatedAt,
        comment: note,
        isSystemComment: false,
      });
    });
  }

  return entries.sort(
    (left, right) => new Date(left.date || 0).getTime() - new Date(right.date || 0).getTime(),
  );
};

export const buildExtensionHistoryEntries = (extension) => {
  const entries = [];

  if (!extension) {
    return entries;
  }

  if (extension.createdAt || extension.extensionReason) {
    addUniqueEntry(entries, {
      user: getDisplayName(
        extension.requestedByName,
        extension.requestedBy,
        extension.requestedBy?.name,
        extension.requestedBy?.fullName,
        extension.createdBy,
        extension.createdByName,
        extension.submittedBy,
        extension.submittedByName,
        extension.customerName,
        extension.history?.find((item) => item?.action === "extension_requested")?.userName,
        extension.history?.find((item) => item?.action === "extension_requested")?.user,
      ),
      userRole: getDisplayRole(extension.requestedByRole, "Requester"),
      date: extension.createdAt,
      comment: extension.extensionReason
        ? `Submitted extension request. Reason: ${extension.extensionReason}`
        : "Submitted extension request.",
    });
  }

  if (Array.isArray(extension.comments)) {
    extension.comments.forEach((comment) => {
      addUniqueEntry(entries, {
        user: getDisplayName(
          comment.userName,
          comment.UserName,
          comment.user,
          comment.author,
          comment.author?.name,
          comment.AuthorName,
          comment.createdBy,
        ),
        userRole: getDisplayRole(comment.userRole || comment.UserRole || comment.role, "User"),
        date: comment.createdAt || comment.CreatedAt || comment.timestamp || comment.date || comment.Date,
        comment: comment.text || comment.Text || comment.comment || comment.Comment || comment.notes || comment.Notes || "",
      });
    });
  }

  if (Array.isArray(extension.history)) {
    extension.history.forEach((historyItem) => {
      addUniqueEntry(entries, {
        user: getDisplayName(
          historyItem.userName,
          historyItem.UserName,
          historyItem.user,
          historyItem.User,
          historyItem.user?.name,
          historyItem.user?.fullName,
        ),
        userRole: getDisplayRole(historyItem.userRole || historyItem.UserRole || historyItem.role || historyItem.Role, "System"),
        date: historyItem.timestamp || historyItem.createdAt || historyItem.date || historyItem.Date || historyItem.CreatedAt,
        comment: buildHistoryComment(historyItem),
      });
    });
  }

  if (Array.isArray(extension.approvals)) {
    extension.approvals.forEach((approval) => {
      const status = String(approval.approvalStatus || approval.ApprovalStatus || approval.status || approval.Status || "pending").toLowerCase();
      const actionLabel = getActionLabelFromStatus(status);
      const note = approval.comment || approval.Comment || approval.reason || approval.Reason || approval.notes || approval.Notes || "";

      addUniqueEntry(entries, {
        user: getDisplayName(
          approval.userName,
          approval.UserName,
          approval.name,
          approval.Name,
          approval.user,
          approval.User,
          approval.user?.name,
          approval.user?.fullName,
        ),
        userRole: getDisplayRole(approval.userRole || approval.UserRole || approval.role || approval.Role, "Approver"),
        date: approval.approvedAt || approval.ApprovedAt || approval.rejectedAt || approval.RejectedAt || approval.createdAt || approval.CreatedAt || approval.timestamp || approval.date || approval.Date,
        comment: note ? `${actionLabel}. ${note}` : `${actionLabel}.`,
      });
    });
  }

  if (Array.isArray(extension.approvers)) {
    extension.approvers.forEach((approver) => {
      const status = String(approver.approvalStatus || approver.ApprovalStatus || approver.status || approver.Status || "").toLowerCase();
      if (!status || status === "pending") {
        return;
      }

      const actionLabel = getActionLabelFromStatus(status);
      const note = approver.comment || approver.Comment || approver.approvalComment || approver.ApprovalComment || approver.reason || approver.Reason || approver.notes || approver.Notes || "";

      addUniqueEntry(entries, {
        user: getDisplayName(
          approver.name,
          approver.Name,
          approver.approverName,
          approver.ApproverName,
          approver.userName,
          approver.UserName,
          approver.user,
          approver.User,
          approver.user?.name,
          approver.user?.fullName,
        ),
        userRole: getDisplayRole(approver.role || approver.Role || approver.designation || approver.Designation, "Approver"),
        date: approver.approvedAt || approver.ApprovedAt || approver.approvalDate || approver.ApprovalDate || approver.rejectedAt || approver.RejectedAt || approver.updatedAt || approver.UpdatedAt || approver.createdAt || approver.CreatedAt,
        comment: note ? `${actionLabel}. ${note}` : `${actionLabel}.`,
      });
    });
  }

  return entries.sort(
    (left, right) => new Date(left.date || 0).getTime() - new Date(right.date || 0).getTime(),
  );
};