/**
 * Status Colors Configuration
 * Standardized color scheme for all status indicators across the system
 */

import { NCBA_COLORS } from "./colors";

const dangerStatus = {
  color: NCBA_COLORS.danger,
  textColor: NCBA_COLORS.danger,
  bgColor: NCBA_COLORS.dangerSoft,
  borderColor: NCBA_COLORS.dangerBorder,
};

const warningStatus = {
  color: NCBA_COLORS.warning,
  textColor: NCBA_COLORS.warning,
  bgColor: NCBA_COLORS.warningSoft,
  borderColor: NCBA_COLORS.warningBorder,
};

const successStatus = {
  color: NCBA_COLORS.success,
  textColor: NCBA_COLORS.success,
  bgColor: NCBA_COLORS.successSoft,
  borderColor: NCBA_COLORS.successBorder,
};

const infoStatus = {
  color: NCBA_COLORS.info,
  textColor: NCBA_COLORS.info,
  bgColor: NCBA_COLORS.infoSoft,
  borderColor: NCBA_COLORS.infoBorder,
};

const rmReviewStatus = {
  color: NCBA_COLORS.reviewPurple,
  textColor: NCBA_COLORS.reviewPurple,
  bgColor: NCBA_COLORS.reviewPurpleSoft,
  borderColor: NCBA_COLORS.reviewPurpleBorder,
};

const coCheckerStatus = {
  color: NCBA_COLORS.reviewTeal,
  textColor: NCBA_COLORS.reviewTeal,
  bgColor: NCBA_COLORS.reviewTealSoft,
  borderColor: NCBA_COLORS.reviewTealBorder,
};

const defaultStatus = {
  color: NCBA_COLORS.border,
  textColor: NCBA_COLORS.textMedium,
  bgColor: NCBA_COLORS.background,
  borderColor: NCBA_COLORS.border,
};

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
  pending: dangerStatus,
  pendingrm: dangerStatus,
  pendingco: dangerStatus,
  pending_rm: dangerStatus,
  pending_co: dangerStatus,
  "pending from rm": dangerStatus,
  "pending from co": dangerStatus,

  // AMBER - Deferred/Waived statuses (pending attention)
  deferred: warningStatus,
  tbo: warningStatus,
  waived: warningStatus,

  // GREEN - Completed/Approved statuses (success)
  sighted: successStatus,
  submitted: successStatus,
  approved: successStatus,
  "submitted for review": { ...successStatus, bgColor: NCBA_COLORS.surface },
  submitted_for_review: { ...successStatus, bgColor: NCBA_COLORS.surface },
  "pending from customer": dangerStatus,
  pending_from_customer: dangerStatus,
  "deferral requested": { ...warningStatus, bgColor: NCBA_COLORS.surface },
  deferral_requested: { ...warningStatus, bgColor: NCBA_COLORS.surface },
  defferal_requested: { ...warningStatus, bgColor: NCBA_COLORS.surface },
  completed: successStatus,
  sighted_and_approved: successStatus,

  // Checklist Stage Statuses - Distinct colors for each stage
  cocreatorreview: infoStatus,
  co_creator_review: infoStatus,
  rmreview: rmReviewStatus,
  rm_review: rmReviewStatus,
  cocheckerreview: coCheckerStatus,
  co_checker_review: coCheckerStatus,
  rejected: dangerStatus,
  revived: warningStatus,

  // Default fallback
  default: defaultStatus,
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
  ] : [214, 189, 152];
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
