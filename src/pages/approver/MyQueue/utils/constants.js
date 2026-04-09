// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const SUCCESS_GREEN = "#52c41a";
export const ERROR_RED = "#ff4d4f";
export const WARNING_ORANGE = "#faad14";
export const PROCESSING_BLUE = "#1890ff";

// Status Configuration
export const STATUS_CONFIG = {
  pending_approval: {
    color: WARNING_ORANGE,
    text: "Pending",
    icon: "ClockCircleOutlined",
  },
  in_review: {
    color: PROCESSING_BLUE,
    text: "In Review",
    icon: "ClockCircleOutlined",
  },
  approved: {
    color: SUCCESS_GREEN,
    text: "Approved",
    icon: "CheckCircleOutlined",
  },
  rejected: {
    color: ERROR_RED,
    text: "Rejected",
    icon: "CloseCircleOutlined",
  },
};

// Pending Approver Status Filter
export const PENDING_STATUSES = [
  "pending_approval",
  "in_review",
  "deferral_requested",
];

// CSS Styles
export const TABLE_STYLES = `
  .myqueue-table .ant-table-wrapper {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
    border: 1px solid #e0e0e0;
  }
  .myqueue-table .ant-table-thead > tr > th {
    background-color: #f7f7f7 !important;
    color: ${PRIMARY_BLUE} !important;
    font-weight: 700;
    border-bottom: 3px solid ${ACCENT_LIME} !important;
  }
  .myqueue-table .ant-table-tbody > tr:hover > td {
    background-color: rgba(181, 211, 52, 0.1) !important;
    cursor: pointer;
  }

  .deferral-pending-table .ant-table-wrapper {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
    border: 1px solid #e0e0e0;
  }
  .deferral-pending-table .ant-table-thead > tr > th {
    background-color: #f7f7f7 !important;
    color: ${PRIMARY_BLUE} !important;
    font-weight: 700;
    font-size: 13px;
    padding: 14px 12px !important;
    border-bottom: 3px solid ${ACCENT_LIME} !important;
    border-right: none !important;
    cursor: default !important;
  }
  .deferral-pending-table .ant-table-thead > tr > th:hover {
    background-color: #f7f7f7 !important;
  }
  .deferral-pending-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f0f0f0 !important;
    border-right: none !important;
    padding: 12px 12px !important;
    font-size: 13px;
    color: #333;
  }
  .deferral-pending-table .ant-table-tbody > tr.ant-table-row:hover > td {
    background-color: rgba(181, 211, 52, 0.1) !important;
    cursor: pointer;
  }
  .deferral-pending-table .ant-table-row:hover .ant-table-cell:last-child {
    background-color: rgba(181, 211, 52, 0.1) !important;
  }
  .deferral-pending-table .ant-pagination .ant-pagination-item-active {
    background-color: ${ACCENT_LIME} !important;
    borderColor: ${ACCENT_LIME} !important;
  }
  .deferral-pending-table .ant-pagination .ant-pagination-item-active a {
    color: ${PRIMARY_BLUE} !important;
    font-weight: 600;
  }
  .deferral-pending-table .ant-table-column-sorter {
    display: none !important;
  }
  .deferral-pending-table .ant-table-column-sorters {
    cursor: default !important;
  }
  .deferral-pending-table .ant-table-column-sorters:hover {
    background: none !important;
  }
`;

// Modal Custom Styles
export const MODAL_STYLES = `
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }

  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: #7e6496 !important; padding-bottom: 4px; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
  .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

  .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }

  .ant-modal-footer .ant-btn { border-radius: 8px; font-weight: 600; height: 38px; padding: 0 16px; }
  .ant-modal-footer .ant-btn-primary { background-color: ${PRIMARY_BLUE} !important; border-color: ${PRIMARY_BLUE} !important; }
`;
