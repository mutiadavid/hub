import { API_ORIGIN } from "../config/runtimeConfig";

// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const SECONDARY_PURPLE = "#7e6496";
export const API_BASE_URL = API_ORIGIN;

// Status Colors Mapping - Consistent across all modals
export const STATUS_COLORS = {
  // GREEN - Success/Approved/Submitted/Sighted
// PROFESSIONAL MUTED PALETTE - Corporate friendly, less shouting

// GREEN STATUSES - Success/Completed (softened/muted green)
submitted: { bg: "#f1f8f1", color: "#5a9a6d", tag: "#5a9a6d" },
approved: { bg: "#f1f8f1", color: "#5a9a6d", tag: "#5a9a6d" },
sighted: { bg: "#f1f8f1", color: "#5a9a6d", tag: "#5a9a6d" },

// RED STATUSES - Pending/Action needed (softened/muted red)
pendingrm: { bg: "#fdf3f3", color: "#d17676", tag: "#d17676" },
pendingco: { bg: "#fdf3f3", color: "#d17676", tag: "#d17676" },
  
  // AMBER - Deferred/Waived/TBO (softened/muted amber)
  deferred: { bg: "#fffbe6", color: "#d9a84d", tag: "#d9a84d" },
  deferral_requested: { bg: "#fffbe6", color: "#d9a84d", tag: "#d9a84d" },
  waived: { bg: "#fffbe6", color: "#d9a84d", tag: "#d9a84d" },
  tbo: { bg: "#fffbe6", color: "#d9a84d", tag: "#d9a84d" },
  
  // Default
  default: { bg: "#fafafa", color: "#d9d9d9", tag: "default" }
};

// Allowed Document Actions
export const ALLOWED_DOC_ACTIONS = [
  "submitted_for_review",
  "sighted",
  "waived",
  "deferred",
  "tbo",
  "approved",
  "submitted",
];

// API Endpoints
export const API_ENDPOINTS = {
  UPLOADS: "/api/uploads",
  CHECKLIST_COMMENTS: "/api/checklist/comments",
};