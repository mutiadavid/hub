/**
 * Status Colors Configuration
 * Standardized color scheme for all status indicators across the system
 */

/**
 * Format status text for display - converts snake_case to readable format
 * @param {string} status - Status string (can be snake_case or spaced)
 * @returns {string} - Formatted status text with proper capitalization
 */
export const formatStatusText = (status) => {
  if (!status) return "Unknown";
  
  // Replace underscores with spaces and capitalize each word
  return status
    .replace(/_/g, " ")                    // Replace _ with space
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Format status for snake_case display in UI
 * Converts camelCase "DeferralRequested" or spaced format to "deferral_requested"
 * @param {string} status - Status string (can be camelCase, title case or spaced)
 * @returns {string} - Formatted status in snake_case (all lowercase with underscores)
 */
export const formatStatusForSnakeCase = (status) => {
  if (!status) return "unknown";

  // First, handle common camelCase patterns
  // Convert "DeferralRequested" to "deferral_requested"
  const camelCaseMap = {
    "DeferralRequested": "deferral_requested",
    "SubmittedForReview": "submitted_for_review",
    "PendingFromCustomer": "pending_from_customer",
    "PendingRM": "pending_rm",
    "PendingCO": "pending_co",
    "deferredrequested": "deferral_requested",
    "submittedforreview": "submitted_for_review",
    "pendingfromcustomer": "pending_from_customer",
  };

  // Check for exact match in map (case-insensitive)
  const lowerStatus = status.toLowerCase().replace(/\s+/g, "");
  if (camelCaseMap[status] || camelCaseMap[lowerStatus]) {
    return camelCaseMap[status] || camelCaseMap[lowerStatus];
  }

  // Handle camelCase by inserting underscore before uppercase letters
  const withUnderscores = status
    .replace(/([a-z])([A-Z])/g, '$1_$2')  // Insert underscore before uppercase letters
    .replace(/\s+/g, "_");                 // Replace spaces with underscores

  // Convert to lowercase and clean up multiple underscores
  return withUnderscores
    .toLowerCase()
    .replace(/__+/g, "_");   // Replace multiple underscores with single
};

export const STATUS_COLORS = {
  // RED - Pending statuses (action required)
  pending: {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pendingrm: {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pendingco: {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pending_rm: {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pending_co: {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  "pending from rm": {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  "pending from co": {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },

  // AMBER - Deferred/Waived statuses (pending attention)
  deferred: {
    color: "#FAAD14",      // Amber
    textColor: "#FAAD14",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },
  tbo: {
    color: "#FAAD14",      // Amber (To Be Obtained)
    textColor: "#FAAD14",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },
  waived: {
    color: "#FAAD14",      // Amber
    textColor: "#FAAD14",
    bgColor: "#FFFBE6",
    borderColor: "#FAAD14",
  },

  // GREEN - Completed/Approved statuses (success)
  sighted: {
    color: "#52C41A",      // Green
    textColor: "#52C41A",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  submitted: {
    color: "#52C41A",      // Green
    textColor: "#52C41A",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  approved: {
    color: "#52C41A",      // Green
    textColor: "#52C41A",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  "submitted for review": {
    color: "#52C41A",      // Green
    textColor: "#52C41A",
    bgColor: "#FFF",
    borderColor: "#52C41A",
  },
  submitted_for_review: {
    color: "#52C41A",      // Green
    textColor: "#52C41A",
    bgColor: "#FFF",
    borderColor: "#52C41A",
  },
  "pending from customer": {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  pending_from_customer: {
    color: "#FF4D4F",      // Red
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  "deferral requested": {
    color: "#FAAD14",      // Amber
    textColor: "#FAAD14",
    bgColor: "#FFF",
    borderColor: "#FAAD14",
  },
  deferral_requested: {
    color: "#FAAD14",      // Amber
    textColor: "#FAAD14",
    bgColor: "#FFF",
    borderColor: "#FAAD14",
  },
  defferal_requested: {
    color: "#FAAD14",      // Amber (typo variant)
    textColor: "#FAAD14",
    bgColor: "#FFF",
    borderColor: "#FAAD14",
  },
  completed: {
    color: "#52C41A",      // Green
    textColor: "#52C41A",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },
  sighted_and_approved: {
    color: "#52C41A",      // Green
    textColor: "#52C41A",
    bgColor: "#F6FFED",
    borderColor: "#52C41A",
  },

  // Checklist Stage Statuses - Distinct colors for each stage
  cocreatorreview: {
    color: "#1890FF",      // Bright Blue - Co-Creator Review stage
    textColor: "#0958D9",
    bgColor: "#E6F7FF",
    borderColor: "#1890FF",
  },
  co_creator_review: {
    color: "#1890FF",      // Bright Blue - Co-Creator Review stage
    textColor: "#0958D9",
    bgColor: "#E6F7FF",
    borderColor: "#1890FF",
  },
  rmreview: {
    color: "#722ED1",      // Purple - RM Review stage
    textColor: "#531DAB",
    bgColor: "#F9F0FF",
    borderColor: "#722ED1",
  },
  rm_review: {
    color: "#722ED1",      // Purple - RM Review stage
    textColor: "#531DAB",
    bgColor: "#F9F0FF",
    borderColor: "#722ED1",
  },
  cocheckerreview: {
    color: "#13C2C2",      // Cyan/Teal - Co-Checker Review stage
    textColor: "#08979C",
    bgColor: "#E6FFFB",
    borderColor: "#13C2C2",
  },
  co_checker_review: {
    color: "#13C2C2",      // Cyan/Teal - Co-Checker Review stage
    textColor: "#08979C",
    bgColor: "#E6FFFB",
    borderColor: "#13C2C2",
  },
  rejected: {
    color: "#FF4D4F",      // Red - Rejected
    textColor: "#CF1322",
    bgColor: "#FFEBE6",
    borderColor: "#FF4D4F",
  },
  revived: {
    color: "#FA8C16",      // Orange - Revived
    textColor: "#D46B08",
    bgColor: "#FFF7E6",
    borderColor: "#FA8C16",
  },

  // Default fallback
  default: {
    color: "#D9D9D9",      // Gray
    textColor: "#595959",
    bgColor: "#FAFAFA",
    borderColor: "#D9D9D9",
  },
};

/**
 * Get status color configuration
 * @param {string} status - The status value (case-insensitive)
 * @returns {object} Color configuration object
 */
export const getStatusColor = (status) => {
  if (!status) return STATUS_COLORS.default;
  
  const normalizedStatus = String(status).toLowerCase().trim();
  
  // Exact match first
  if (STATUS_COLORS[normalizedStatus]) {
    return STATUS_COLORS[normalizedStatus];
  }

  // Partial match for common variations
  if (normalizedStatus.includes("sighted")) return STATUS_COLORS.sighted;
  if (normalizedStatus.includes("tbo")) return STATUS_COLORS.tbo;
  if (normalizedStatus.includes("waived")) return STATUS_COLORS.waived;
  if (normalizedStatus.includes("pending") && normalizedStatus.includes("rm")) return STATUS_COLORS.pendingrm;
  if (normalizedStatus.includes("pending") && normalizedStatus.includes("co")) return STATUS_COLORS.pendingco;
  if (normalizedStatus.includes("deferred")) return STATUS_COLORS.deferred;
  if (normalizedStatus.includes("submitted")) return STATUS_COLORS.submitted;
  if (normalizedStatus.includes("approved")) return STATUS_COLORS.approved;
  if (normalizedStatus.includes("completed")) return STATUS_COLORS.completed;

  // Checklist stage statuses - check for exact matches first
  if (normalizedStatus === "cocreatorreview" || normalizedStatus === "co_creator_review") return STATUS_COLORS.cocreatorreview;
  if (normalizedStatus === "rmreview" || normalizedStatus === "rm_review") return STATUS_COLORS.rmreview;
  if (normalizedStatus === "cocheckerreview" || normalizedStatus === "co_checker_review") return STATUS_COLORS.cocheckerreview;
  if (normalizedStatus === "revived") return STATUS_COLORS.revived;
  if (normalizedStatus === "rejected") return STATUS_COLORS.rejected;

  return STATUS_COLORS.default;
};

/**
 * Get HTML color code for a status (for PDF and display)
 * @param {string} status - The status value
 * @returns {Array} RGB array [r, g, b] for jsPDF
 */
export const getStatusColorRGB = (status) => {
  const colorHex = getStatusColor(status).color;
  return hexToRGB(colorHex);
};

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color (e.g., "#FF6B6B")
 * @returns {Array} RGB array [r, g, b]
 */
export const hexToRGB = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [217, 217, 217]; // Default gray if parsing fails
};

/**
 * Get inline style object for a status
 * @param {string} status - The status value
 * @returns {object} React style object
 */
export const getStatusStyle = (status) => {
  const colorConfig = getStatusColor(status);
  return {
    color: colorConfig.textColor,
    backgroundColor: colorConfig.bgColor,
    borderColor: colorConfig.borderColor,
    border: `1px solid ${colorConfig.borderColor}`,
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
    fontWeight: "500",
  };
};

/**
 * Get Ant Design Tag props for a status
 * @param {string} status - The status value
 * @returns {object} Tag component props
 */
export const getStatusTagProps = (status) => {
  const colorConfig = getStatusColor(status);
  return {
    color: colorConfig.color,
    style: {
      borderColor: colorConfig.borderColor,
    },
  };
};

export default STATUS_COLORS;
