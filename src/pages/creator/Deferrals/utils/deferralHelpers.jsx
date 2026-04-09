import React from "react";
import dayjs from "dayjs";
import UniformTag from "../../../../components/common/UniformTag";

/**
 * Get role tag with appropriate color
 * @param {string} role - User role
 * @returns {JSX.Element} Colored role tag
 */
export const getRoleTag = (role) => {
  let color = "blue";
  const roleLower = (role || "").toLowerCase();

  switch (roleLower) {
    case "rm":
      color = "blue";
      break;
    case "deferral management":
    case "creator":
    case "cocreator":
    case "co creator":
    case "co-creator":
      color = "green";
      break;
    case "co_checker":
    case "checker":
      color = "volcano";
      break;
    case "system":
      color = "default";
      break;
    default:
      color = "blue";
  }

  return (
    <UniformTag
      color={color}
      text={roleLower.replace(/_/g, " ")}
      uppercase
      maxChars={14}
      style={{ marginLeft: 8 }}
    />
  );
};

/**
 * Format username by removing role in brackets
 * @param {string} username - Username with possible role appended
 * @returns {string} Cleaned username
 */
export const formatUsername = (username) => {
  if (!username) return "System";
  return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

/**
 * Get reason text for returned-for-rework status with multiple fallbacks
 * @param {Object} deferral - Deferral object
 * @returns {string} Rework reason or empty string
 */
export const getReturnedForReworkReason = (deferral) => {
  if (!deferral) return "";

  // Direct reason fields
  const directReason =
    deferral.returnReason || deferral.reworkReason || deferral.reworkComment;

  if (typeof directReason === "string" && directReason.trim()) {
    return directReason.trim();
  }

  // Try parsing JSON rework comments
  const rawReworkComments = deferral.reworkComments;
  if (typeof rawReworkComments === "string" && rawReworkComments.trim()) {
    try {
      const parsed = JSON.parse(rawReworkComments);
      if (
        parsed &&
        typeof parsed.reworkComment === "string" &&
        parsed.reworkComment.trim()
      ) {
        return parsed.reworkComment.trim();
      }
    } catch {
      return rawReworkComments.trim();
    }
  }

  // Check if rework comments is an object
  if (rawReworkComments && typeof rawReworkComments === "object") {
    const objectReason = rawReworkComments.reworkComment;
    if (typeof objectReason === "string" && objectReason.trim()) {
      return objectReason.trim();
    }
  }

  // Fall back to latest comment with role priority
  if (Array.isArray(deferral.comments) && deferral.comments.length > 0) {
    const rolePriority = [
      "creator",
      "cocreator",
      "co_creator",
      "checker",
      "cochecker",
      "co_checker",
    ];
    const normalizedRole = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();
    const hasPreferredRole = (role) =>
      rolePriority.includes(normalizedRole(role));

    // Find comment from preferred roles first (reversed for latest)
    const preferredComment = [...deferral.comments]
      .reverse()
      .find((comment) => {
        const role =
          comment?.author?.role || comment?.authorRole || comment?.role;
        const text = comment?.text || comment?.comment;
        return (
          hasPreferredRole(role) && typeof text === "string" && text.trim()
        );
      });

    if (preferredComment) {
      return (preferredComment.text || preferredComment.comment || "").trim();
    }

    // Fall back to any latest comment
    const latestComment = [...deferral.comments].reverse().find((comment) => {
      const text = comment?.text || comment?.comment;
      return typeof text === "string" && text.trim();
    });

    if (latestComment) {
      return (latestComment.text || latestComment.comment || "").trim();
    }
  }

  return "";
};

/**
 * Check if deferral can be approved by current user
 * @param {Object} deferral - Deferral object
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {boolean} True if can approve
 */
export const canApproveDeferral = (deferral, userId, userRole) => {
  if (!deferral) return false;

  const allApproversApproved = deferral.allApproversApproved === true;
  const hasCreatorApproved = deferral.creatorApprovalStatus === "approved";
  const hasCheckerApproved = deferral.checkerApprovalStatus === "approved";

  const isCreator =
    deferral.creator &&
    (deferral.creator._id === userId || deferral.creator === userId);
  const isChecker =
    deferral.checker &&
    (deferral.checker._id === userId || deferral.checker === userId);

  // If creator/checker aren't explicitly set, allow approval based on role
  if (!isCreator && !isChecker) {
    if (userRole === "creator" && allApproversApproved && !hasCreatorApproved) {
      return true;
    }
    if (
      userRole === "checker" &&
      allApproversApproved &&
      hasCreatorApproved &&
      !hasCheckerApproved
    ) {
      return true;
    }
    return false;
  }

  // If all approvers have approved, creator and checker can approve
  if (allApproversApproved) {
    if (isCreator && !hasCreatorApproved) {
      return true;
    }
    if (isChecker && !hasCheckerApproved && hasCreatorApproved) {
      return true;
    }
  }

  return false;
};

/**
 * Get status for given tab
 * @param {string} activeTab - Current active tab
 * @returns {Array<string>} Array of status values relevant to tab
 */
export const getStatusesForTab = (activeTab) => {
  const statuses = {
    pending: [
      "pending_approval",
      "in_review",
      "deferral_requested",
      "partially_approved",
    ],
    approved: ["approved", "deferral_approved"],
    rejected: ["rejected", "deferral_rejected"],
    closed: ["closed", "deferral_closed", "closed_by_co", "closed_by_creator"],
    returned: [
      "returned_for_rework",
      "returned_by_creator",
      "returned_by_checker",
    ],
    closeRequests: ["close_requested", "close_requested_creator_approved"],
  };

  return statuses[activeTab] || [];
};

/**
 * Get current user from localStorage
 * @returns {Object} User object with _id, role, name, etc.
 */
export const getCurrentUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    return {
      _id: stored?._id || stored?.user?._id,
      role: stored?.role || stored?.user?.role,
      name: stored?.name || stored?.user?.name,
      email: stored?.email || stored?.user?.email,
    };
  } catch {
    return { _id: null, role: null, name: null, email: null };
  }
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - dayjs format string
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = "DD MMM YYYY HH:mm") => {
  if (!date) return "";
  return dayjs(date).format(format);
};

/**
 * Check if deferral is in a final state (cannot be modified)
 * @param {string} status - Deferral status
 * @returns {boolean} True if in final state
 */
export const isFinalStatus = (status) => {
  const finalStatuses = [
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
    "rejected",
    "deferral_rejected",
  ];
  return finalStatuses.includes((status || "").toLowerCase());
};
