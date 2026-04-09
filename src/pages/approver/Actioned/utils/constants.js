/**
 * Actioned Module - Constants and Configuration
 * Centralized theme colors, status configs, and styling
 */

// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const SUCCESS_GREEN = "#52c41a";
export const ERROR_RED = "#ff4d4f";
export const WARNING_ORANGE = "#faad14";
export const PROCESSING_BLUE = "#1890ff";

// RGB Versions for PDF Generation
export const PRIMARY_BLUE_RGB = [22, 70, 121];
export const SECONDARY_PURPLE_RGB = [126, 100, 150];
export const SUCCESS_GREEN_RGB = [82, 196, 26];
export const WARNING_ORANGE_RGB = [250, 173, 20];
export const ERROR_RED_RGB = [255, 77, 79];
export const DARK_GRAY = [51, 51, 51];
export const LIGHT_GRAY = [102, 102, 102];

// Status Configuration
export const STATUS_CONFIG = {
  approved: {
    color: SUCCESS_GREEN,
    rgb: SUCCESS_GREEN_RGB,
    text: "Approved",
  },
  rejected: {
    color: ERROR_RED,
    rgb: ERROR_RED_RGB,
    text: "Rejected",
  },
  returned: {
    color: WARNING_ORANGE,
    rgb: WARNING_ORANGE_RGB,
    text: "Returned",
  },
  pending: {
    color: PROCESSING_BLUE,
    rgb: [24, 144, 255],
    text: "Pending",
  },
};

// Table Styling CSS
export const customTableStyles = `
  .actioned-table .ant-table-wrapper {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
    border: 1px solid #e0e0e0;
  }
  .actioned-table .ant-table-thead > tr > th {
    background-color: #f7f7f7 !important;
    color: ${PRIMARY_BLUE} !important;
    font-weight: 700;
    font-size: 13px;
    padding: 14px 12px !important;
    border-bottom: 3px solid ${ACCENT_LIME} !important;
    border-right: none !important;
  }
  .actioned-table .ant-table-body > tr:hover > td {
    background-color: rgba(181, 211, 52, 0.08) !important;
  }
  .actioned-table .ant-table-cell {
    padding: 12px !important;
    font-size: 12px;
  }
`;

// Modal Styling
export const modalHeaderStyle = {
  background: PRIMARY_BLUE,
  color: "white",
  padding: "16px 24px",
  fontSize: "18px",
  fontWeight: "700",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderRadius: "12px 12px 0 0",
};

// Card Styling
export const cardHeaderStyle = {
  background: `linear-gradient(90deg, ${PRIMARY_BLUE} 0%, ${PROCESSING_BLUE} 100%)`,
  color: "white",
  padding: "12px 16px",
  fontWeight: "700",
  borderRadius: "8px 8px 0 0",
  marginBottom: 0,
};

// Button Styling
export const primaryButtonStyle = {
  background: PRIMARY_BLUE,
  borderColor: PRIMARY_BLUE,
  color: "white",
};

export const successButtonStyle = {
  background: SUCCESS_GREEN,
  borderColor: SUCCESS_GREEN,
  color: "white",
};

// File Type Colors
export const FILE_TYPE_COLORS = {
  pdf: ERROR_RED,
  word: PRIMARY_BLUE,
  excel: SUCCESS_GREEN,
  image: "#7e6496",
  default: PRIMARY_BLUE,
};
