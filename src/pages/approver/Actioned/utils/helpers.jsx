/**
 * Actioned Module - Helper Functions
 * Utility functions for formatting, parsing, and data manipulation
 */

import dayjs from "dayjs";
import UniformTag from "../../../../components/common/UniformTag";

/**
 * Safely converts any value to a string representation
 * @param {*} value - Value to convert
 * @returns {string} - Safe string representation
 */
export const safe = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object")
    return value.name || value.userName || value._id || JSON.stringify(value);
  return value;
};

/**
 * Extracts display name from various object structures
 * @param {*} approver - Approver object
 * @returns {string} - Display name
 */
export const nameOf = (approver) => {
  if (!approver) return "Approver";
  if (typeof approver === "string") return approver;
  if (typeof approver === "object") {
    if (approver.name) return approver.name;
    if (approver.userName) return approver.userName;
    if (approver.user) {
      return typeof approver.user === "string"
        ? approver.user
        : approver.user.name || JSON.stringify(approver.user);
    }
    if (approver._id) return approver._id;
    return JSON.stringify(approver);
  }
  return String(approver);
};

/**
 * Removes role suffix from username (e.g., "John (RM)" -> "John")
 * @param {string} username - Username with possible role suffix
 * @returns {string} - Cleaned username
 */
export const formatUsername = (username) => {
  if (!username) return "";
  return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

/**
 * Formats date with time (MMM DD, YYYY hh:mm A)
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date with time
 */
export const formatDateTime = (date) => {
  if (!date) return "N/A";
  return dayjs(date).format("MMM DD, YYYY hh:mm A");
};

/**
 * Formats date only (MMM DD, YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatDateOnly = (date) => {
  if (!date) return "N/A";
  return dayjs(date).format("MMM DD, YYYY");
};

/**
 * Calculates days remaining until due date
 * @param {string|Date} dueDate - Due date
 * @returns {string} - Days remaining or "Overdue"
 */
export const getDaysRemaining = (dueDate) => {
  if (!dueDate) return "N/A";
  const now = dayjs();
  const due = dayjs(dueDate);
  const diff = due.diff(now, "days");
  
  if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
  if (diff === 0) return "Due Today";
  return `${diff} days remaining`;
};

/**
 * Calculates approval statistics from approval flow
 * @param {Object} deferral - Deferral object
 * @returns {Object} - {total, approved, pending}
 */
export const getApproverStats = (deferral) => {
  const approverFlow = Array.isArray(deferral?.approverFlow)
    ? deferral.approverFlow
    : Array.isArray(deferral?.approvers)
      ? deferral.approvers
      : [];

  const total = approverFlow.length;
  const approved = approverFlow.filter((a) => a.approved || a.approvedDate).length;
  const pending = total - approved;

  return { total, approved, pending };
};

/**
 * Resolves document days and due date from flexible field structure
 * @param {Object} doc - Document object
 * @param {Object} deferral - Deferral object
 * @returns {Object} - {days, date}
 */
export const resolveDocDaysAndDate = (doc, deferral) => {
  let days = doc.daysRequested || doc.days || deferral?.daysSought || 0;
  let date =
    doc.nextDueDate ||
    doc.dueDate ||
    deferral?.nextDueDate ||
    deferral?.dueDate ||
    null;

  return { days, date };
};

/**
 * Creates color-coded role tag
 * @param {string} role - User role
 * @returns {JSX.Element} - Colored tag component
 */
export const getRoleTag = (role) => {
  const roleColors = {
    RM: "blue",
    CoCreator: "green",
    CoChecker: "volcano",
    Checker: "volcano",
    Approver: "purple",
    Admin: "red",
  };

  return (
    <UniformTag color={roleColors[role] || "default"}>
      {role || "User"}
    </UniformTag>
  );
};

/**
 * Checks if a comment is system-generated
 * @param {Object} comment - Comment object
 * @returns {boolean} - True if system message
 */
export const isSystemMessage = (comment) => {
  return (
    !comment.author ||
    comment.type === "system" ||
    comment.author === "System" ||
    comment.isSystemMessage
  );
};

/**
 * Truncates text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Case-insensitive search matching
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Search term
 * @returns {boolean} - True if matches
 */
export const searchMatch = (text, searchTerm) => {
  if (!searchTerm) return true;
  return (text || "").toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Formats error message from various error formats
 * @param {*} errors - Error object, array, or string
 * @returns {string} - Formatted error message
 */
export const formatErrorMessage = (errors) => {
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return errors.join(", ");
  if (errors?.message) return errors.message;
  return "An error occurred";
};

/**
 * Extracts initials from full name
 * @param {string} name - Full name
 * @returns {string} - Initials (e.g., "JD" for "John Doe")
 */
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Gets status badge configuration
 * @param {string} status - Status value
 * @returns {Object} - {color, text, icon}
 */
export const getStatusConfig = (status) => {
  const configs = {
    approved: { color: "success", text: "Approved" },
    rejected: { color: "error", text: "Rejected" },
    returned: { color: "warning", text: "Returned" },
    pending: { color: "processing", text: "Pending" },
  };
  return configs[status] || { color: "default", text: status || "Unknown" };
};
