// Theme Colors (same as other queues)
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const HIGHLIGHT_GOLD = "#fcb116";
export const LIGHT_YELLOW = "#fcd716";
export const SECONDARY_PURPLE = "#7e6496";
export const SUCCESS_GREEN = "#52c41a";
export const ERROR_RED = "#ff4d4f";
export const WARNING_ORANGE = "#faad14";

// Loan type filters
export const LOAN_TYPE_FILTERS = [
  { text: "Buy & Build", value: "Buy & Build" },
  { text: "Mortgage DCL", value: "Mortgage DCL" },
  { text: "Construction Loan", value: "Construction Loan" },
  { text: "Secured Loan DCL", value: "Secured Loan DCL" },
  { text: "Stock Loan DCL", value: "Stock Loan DCL" },
  { text: "Equity Release Loan", value: "Equity Release Loan" },
  { text: "Shamba Loan", value: "Shamba Loan" },
];

// Status filters
export const STATUS_FILTERS = [
  { text: "Pending", value: "deferral_requested" },
  { text: "Approved", value: "deferral_approved" },
  { text: "Rejected", value: "deferral_rejected" },
];

// Deferral status values
export const DEFERRAL_STATUS = {
  PENDING: "deferral_requested",
  PENDING_APPROVAL: "pending_approval",
  PARTIALLY_APPROVED: "partially_approved",
  APPROVED: "deferral_approved",
  APPROVED_ALT: "approved",
  REJECTED: "deferral_rejected",
  REJECTED_ALT: "rejected",
  RETURNED_FOR_REWORK: "returned_for_rework",
  RETURNED_BY_CREATOR: "returned_by_creator",
  RETURNED_BY_CHECKER: "returned_by_checker",
  CLOSED: "closed",
  DEFERRAL_CLOSED: "deferral_closed",
  CLOSED_BY_CO: "closed_by_co",
  CLOSED_BY_CREATOR: "closed_by_creator",
  WITHDRAWN: "withdrawn",
  CLOSE_REQUESTED: "close_requested",
  CLOSE_REQUESTED_ALT: "closerequested",
  CLOSE_REQUESTED_APPROVED: "close_requested_creator_approved",
  CLOSE_REQUESTED_APPROVED_ALT: "closerequestedcreatorapproved",
  IN_REVIEW: "in_review",
};

// Deferral status groups
export const DEFERRAL_STATUS_GROUPS = {
  PENDING_STATUSES: [
    DEFERRAL_STATUS.PENDING,
    DEFERRAL_STATUS.PENDING_APPROVAL,
    DEFERRAL_STATUS.IN_REVIEW,
  ],
  APPROVED_STATUSES: [
    DEFERRAL_STATUS.APPROVED,
    DEFERRAL_STATUS.APPROVED_ALT,
    DEFERRAL_STATUS.CLOSE_REQUESTED,
    DEFERRAL_STATUS.CLOSE_REQUESTED_ALT,
    DEFERRAL_STATUS.CLOSE_REQUESTED_APPROVED,
    DEFERRAL_STATUS.CLOSE_REQUESTED_APPROVED_ALT,
  ],
  RETURNED_STATUSES: [
    DEFERRAL_STATUS.RETURNED_FOR_REWORK,
    DEFERRAL_STATUS.RETURNED_BY_CREATOR,
    DEFERRAL_STATUS.RETURNED_BY_CHECKER,
  ],
  CLOSED_STATUSES: [
    DEFERRAL_STATUS.CLOSED,
    DEFERRAL_STATUS.DEFERRAL_CLOSED,
    DEFERRAL_STATUS.CLOSED_BY_CO,
    DEFERRAL_STATUS.CLOSED_BY_CREATOR,
    DEFERRAL_STATUS.WITHDRAWN,
    DEFERRAL_STATUS.REJECTED,
    DEFERRAL_STATUS.REJECTED_ALT,
  ],
};

// Pagination config
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = ["10", "20", "50"];
