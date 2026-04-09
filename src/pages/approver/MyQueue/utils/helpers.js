import dayjs from "dayjs";

/**
 * Formats username by removing role suffix in parentheses
 * @param {string} username - Username with optional role suffix (e.g., "John Doe (RM)")
 * @returns {string} Formatted username
 */
export const formatUsername = (username) => {
  if (!username) return "";
  return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

/**
 * Gets color-coded role tag configuration
 * @param {string} role - User role
 * @returns {object} Configuration with color and background
 */
export const getRoleTag = (role) => {
  const roleConfigs = {
    Admin: { color: "#164679", bgColor: "#e6f7ff" },
    RM: { color: "#d48806", bgColor: "#fff7e6" },
    CoCreator: { color: "#389e0d", bgColor: "#f6ffed" },
    CoChecker: { color: "#ad2102", bgColor: "#fff1f0" },
    Customer: { color: "#262626", bgColor: "#f5f5f5" },
    Approver: { color: "#7e0991", bgColor: "#ffe7e7" },
  };

  return roleConfigs[role] || { color: "#595959", bgColor: "#fafafa" };
};

/**
 * Formats date and time for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  return dayjs(date).format("MMM DD, YYYY hh:mm A");
};

/**
 * Formats date only for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (date) => {
  if (!date) return "";
  return dayjs(date).format("MMM DD, YYYY");
};

/**
 * Checks if a message is from the system (no author)
 * @param {object} comment - Comment object
 * @returns {boolean} True if system message
 */
export const isSystemMessage = (comment) => {
  return !comment.author || comment.author.trim() === "";
};

/**
 * Gets status badge color configuration
 * @param {string} status - Status value
 * @returns {object} Configuration with color and label
 */
export const getStatusConfig = (status) => {
  const configs = {
    pending_approval: { color: "warning", label: "Pending Approval" },
    in_review: { color: "processing", label: "In Review" },
    approved: { color: "success", label: "Approved" },
    rejected: { color: "error", label: "Rejected" },
    deferral_requested: { color: "processing", label: "Deferral Requested" },
    returned_for_rework: { color: "warning", label: "Returned for Rework" },
    under_review: { color: "processing", label: "Under Review" },
  };

  return configs[status] || { color: "default", label: status };
};

/**
 * Calculates days remaining or overdue
 * @param {string|Date} dueDate - Due date
 * @returns {string} Display string
 */
export const getDaysRemaining = (dueDate) => {
  if (!dueDate) return "";
  const due = dayjs(dueDate);
  const today = dayjs();
  const diff = due.diff(today, "days");

  if (diff < 0) {
    return `${Math.abs(diff)} days overdue`;
  } else if (diff === 0) {
    return "Due today";
  } else {
    return `${diff} days remaining`;
  }
};

/**
 * Truncates text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Searches text with highlighting support
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Search term
 * @returns {boolean} True if found (case-insensitive)
 */
export const searchMatch = (text, searchTerm) => {
  if (!text || !searchTerm) return true;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Converts array of errors to readable message
 * @param {array|string} errors - Error array or message
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (errors) => {
  if (!errors) return "An error occurred";
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) {
    return errors.map((e) => (typeof e === "string" ? e : e.message)).join(", ");
  }
  return "An error occurred";
};

/**
 * Gets initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};
