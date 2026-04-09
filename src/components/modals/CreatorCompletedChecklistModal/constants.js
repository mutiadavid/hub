// This contains ONLY static configuration data
export const COLORS = {
  PRIMARY_BLUE: "#164679",
  ACCENT_LIME: "#b5d334",
  SUCCESS_GREEN: "#52c41a",
  SECONDARY_PURPLE: "#7e6496",
  WARNING_ORANGE: "#faad14",
  ERROR_RED: "#ff4d4f",
};

export const STATUS_DISPLAY = {
  CO_STATUS: {
    SUBMITTED: { text: "Submitted", color: "green" },
    PENDING_RM: { text: "Pending RM", color: "#6E0C05" },
    PENDING_CO: { text: "Pending Co", color: "#6E0549" },
    DEFERRED: { text: "Deferred", color: "#55C41D" },
    SIGHTED: { text: "Sighted", color: "#02ECF5" },
    WAIVED: { text: "Waived", color: "#C4AA1D" },
    TBO: { text: "TBO", color: "#0F13E5" },
  },
  CHECKER_STATUS: {
    APPROVED: {
      text: "✅ Approved",
      color: "success",
      icon: "CheckCircleOutlined",
    },
    REJECTED: {
      text: "❌ Rejected",
      color: "red",
      icon: "CloseCircleOutlined",
    },
    PENDING: {
      text: "📞 Pending Review",
      color: "orange",
      icon: "ClockCircleOutlined",
    },
    REVIEWED: { text: "👁️ Reviewed", color: "blue", icon: "EyeOutlined" },
    DEFERRED: {
      text: "⏱️ Deferred",
      color: "volcano",
      icon: "ClockCircleOutlined",
    },
  },
};

export const TABLE_CONFIG = {
  COLUMNS: [
    { title: "Category", dataIndex: "category", width: 100, key: "category" },
    { title: "Document Name", dataIndex: "name", width: 180, key: "name" },
    { title: "Co Status", dataIndex: "status", width: 100, key: "status" },
    {
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 90,
      key: "deferralNo",
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 120,
      key: "checkerStatus",
    },
    { title: "Co Comment", dataIndex: "comment", width: 130, key: "comment" },
    { title: "View", key: "view", width: 70 },
  ],
};

export const REVIVE_MODAL_CONTENT = {
  TITLE: "Revive Checklist",
  DESCRIPTION: "Are you sure you want to revive this checklist?",
  BENEFITS: [
    "Create a new checklist based on this completed one",
    "Copy customer information and loan details",
    "Preserve document templates and categories",
    "Generate a new DCL number for the revived checklist",
    "Set status to 'Revived' for tracking",
    "Add it to 'Created Checklists For Review' section",
  ],
  TIP: "💡 Ideal for: Revolving facilities, follow-up loans, or similar transactions.",
};
