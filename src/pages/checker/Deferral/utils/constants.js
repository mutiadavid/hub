// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const HIGHLIGHT_GOLD = "#fcb116";
export const SECONDARY_PURPLE = "#7e6496";
export const SUCCESS_GREEN = "#52c41a";
export const ERROR_RED = "#ff4d4f";
export const WARNING_ORANGE = "#faad14";
export const LIGHT_YELLOW = "#fcd716";

// Status Enums - Checker-specific statuses
export const DEFERRAL_STATUS = {
  PENDING_APPROVAL: "pending_approval",
  IN_REVIEW: "in_review",
  DEFERRAL_REQUESTED: "deferral_requested",
  PARTIALLY_APPROVED: "partially_approved",
  APPROVED: "approved",
  DEFERRAL_APPROVED: "deferral_approved",
  RETURNED_FOR_REWORK: "returned_for_rework",
  RETURNED_BY_CREATOR: "returned_by_creator",
  RETURNED_BY_CHECKER: "returned_by_checker",
  REJECTED: "rejected",
  DEFERRAL_REJECTED: "deferral_rejected",
  CLOSE_REQUESTED: "close_requested",
  CLOSE_REQUESTED_CREATOR_APPROVED: "close_requested_creator_approved",
  CLOSED: "closed",
  DEFERRAL_CLOSED: "deferral_closed",
  CLOSED_BY_CO: "closed_by_co",
  CLOSED_BY_CREATOR: "closed_by_creator",
};

// Status Groups for filtering
export const DEFERRAL_STATUS_GROUPS = {
  PENDING: [
    "pending_approval",
    "in_review",
    "deferral_requested",
    "partially_approved",
  ],
  RETURNED: [
    "returned_for_rework",
    "returned_by_creator",
    "returned_by_checker",
  ],
  APPROVED: ["approved", "deferral_approved"],
  REJECTED: ["rejected", "deferral_rejected"],
  CLOSE_REQUEST: ["close_requested", "close_requested_creator_approved"],
  CLOSE_WORKFLOW: ["close_requested", "close_requested_creator_approved"],
  CLOSED: [
    "closed",
    "deferral_closed",
    "closed_by_co",
    "closed_by_creator",
  ],
};

// Tabs Configuration - Checker specific
export const DEFERRAL_TABS = {
  PENDING: "pending",
  APPROVED: "approved",
  CLOSE_REQUESTS: "closeRequests",
  COMPLETED: "closed",
  EXTENSIONS: "extensions",
};

// Pagination
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50],
  POSITION: "bottomCenter",
};

// Priority filter options
export const PRIORITY_OPTIONS = [
  { label: "All Priorities", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

// Approval Status
export const APPROVAL_STATUS = {
  APPROVED: "approved",
  PENDING: "pending",
  REJECTED: "rejected",
};

// File type extensions
export const FILE_TYPES = {
  PDF: "pdf",
  WORD: "word",
  EXCEL: "excel",
  IMAGE: "image",
  OTHER: "other",
};

// Role-based access
export const ROLE_CHECKER = "checker";
export const ROLE_CO_CHECKER = "co_checker";
export const ROLE_COCHECKER = "cochecker";
