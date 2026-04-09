// Theme colors from MyQueue
export const PRIMARY_PURPLE = "#2B1C67";
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const SECONDARY_BLUE = "#164679";
export const SUCCESS_GREEN = "#52c41a";
export const ERROR_RED = "#ff4d4f";
export const WARNING_ORANGE = "#faad14";

// Loan threshold
export const LOAN_THRESHOLD = 75000000; // 75M

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  ".pdf",
  ".PDF",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
];

// Loan type mapping
export const LOAN_TYPE_MAP = {
  "asset finance": "Asset Finance",
  "business loan": "Business Loan",
  consumer: "Consumer",
  mortgage: "Mortgage",
  construction: "Construction Loan",
  "shamba loan": "Shamba Loan",
};

// Loan type options for select
export const LOAN_TYPE_OPTIONS = [
  { value: "asset finance", label: "Asset Finance" },
  { value: "business loan", label: "Business Loan" },
  { value: "consumer", label: "Consumer" },
  { value: "mortgage", label: "Mortgage" },
  { value: "construction", label: "Construction Loan" },
  { value: "shamba loan", label: "Shamba Loan" },
];

// Approver defaults by document type and loan amount
export const APPROVER_MATRIX = {
  PRIMARY_ABOVE_THRESHOLD: [
    "Head of Business Segment",
    "Group Director of Business Unit",
    "Senior Manager, Retail & Corporate Credit Approvals / Assistant General Manager Corporate Credit Approvals / Head of Retail/Corporate Credit approvals",
  ],
  PRIMARY_BELOW_THRESHOLD: [
    "Head of Business Segment / Corporate Sector head",
    "Director of Business Unit",
    "Senior Manager, Retail & Corporate Credit Approvals / Assistant General Manager Corporate Credit Approvals / Head of Retail/Corporate Credit approvals",
  ],
  SECONDARY_ABOVE_THRESHOLD: [
    "Head of Business Segment",
    "Group Director of Business Unit",
    "Head of Credit Operations",
  ],
  SECONDARY_BELOW_THRESHOLD: [
    "Head of Business Segment",
    "Director of Business Unit",
    "Head of Credit Operations",
  ],
};

// GUID regex for user ID validation
export const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Search modes
export const SEARCH_MODE = {
  CUSTOMER: "customer",
  DCL: "dcl",
};
