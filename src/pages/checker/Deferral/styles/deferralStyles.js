import {
  PRIMARY_BLUE,
  ACCENT_LIME,
  SECONDARY_PURPLE,
  SUCCESS_GREEN,
  ERROR_RED,
  WARNING_ORANGE,
} from "./constants";

export const getDeferralCustomStyles = () => {
  return `
    .ant-modal-header { 
      background-color: ${PRIMARY_BLUE} !important; 
      padding: 18px 24px !important; 
    }
    .ant-modal-title { 
      color: white !important; 
      font-size: 1.15rem !important; 
      font-weight: 700 !important; 
      letter-spacing: 0.5px; 
    }
    .ant-modal-close-x { 
      color: white !important; 
    }

    .deferral-info-card .ant-card-head { 
      border-bottom: 2px solid ${ACCENT_LIME} !important; 
    }
    .deferral-info-card .ant-descriptions-item-label { 
      font-weight: 600 !important; 
      color: ${SECONDARY_PURPLE} !important; 
      padding-bottom: 4px; 
    }
    .deferral-info-card .ant-descriptions-item-content { 
      color: ${PRIMARY_BLUE} !important; 
      font-weight: 700 !important; 
      font-size: 13px !important; 
    }

    .ant-input, .ant-select-selector { 
      border-radius: 6px !important; 
      border-color: #e0e0e0 !important; 
    }
    .ant-input:focus, .ant-select-focused .ant-select-selector { 
      box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; 
      border-color: ${PRIMARY_BLUE} !important; 
    }

    .status-tag { 
      font-weight: 700 !important; 
      border-radius: 999px !important; 
      padding: 3px 8px !important; 
      text-transform: capitalize; 
      min-width: 80px; 
      text-align: center; 
      display: inline-flex; 
      align-items: center; 
      gap: 4px; 
      justify-content: center; 
    }
   
    .approved-status {
      background-color: ${SUCCESS_GREEN}15 !important;
      border: 1px solid ${SUCCESS_GREEN}40 !important;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
    }
   
    .approved-badge {
      background-color: ${SUCCESS_GREEN} !important;
      border-color: ${SUCCESS_GREEN} !important;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
   
    .rejected-badge {
      background-color: ${ERROR_RED} !important;
      border-color: ${ERROR_RED} !important;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .ant-modal-footer .ant-btn { 
      border-radius: 8px; 
      font-weight: 600; 
      height: 38px; 
      padding: 0 16px; 
    }
    .ant-modal-footer .ant-btn-primary { 
      background-color: ${PRIMARY_BLUE} !important; 
      border-color: ${PRIMARY_BLUE} !important; 
    }

    .comment-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .comment-item {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .comment-item:last-child {
      border-bottom: none;
    }

    .approval-workflow {
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .approval-step {
      display: flex;
      align-items: center;
      padding: 8px 0;
      font-size: 13px;
    }

    .approval-step.approved {
      color: ${SUCCESS_GREEN};
    }

    .approval-step.pending {
      color: #999;
    }

    .approval-step.rejected {
      color: ${ERROR_RED};
    }
  `;
};

export const getTableCustomStyles = () => {
  return `
    .defer-table-wrapper {
      background-color: white;
      padding: 0;
      border-radius: 8px;
    }

    .defer-table-wrapper .ant-table {
      border-radius: 8px;
      overflow: hidden;
    }

    .defer-table-wrapper .ant-table-thead > tr > th {
      background-color: ${PRIMARY_BLUE};
      color: white;
      font-weight: 700;
      border: none;
    }

    .defer-table-wrapper .ant-table-tbody > tr:hover > td {
      background-color: #f5f5f5;
    }

    .defer-table-wrapper .ant-table-pagination {
      padding: 16px 0;
    }

    .defer-table-wrapper .ant-pagination-item-active {
      border-color: ${PRIMARY_BLUE};
      background-color: ${PRIMARY_BLUE};
    }

    .defer-table-wrapper .ant-pagination-item-active a {
      color: white;
    }

    .defer-table-wrapper .ant-pagination-item:hover a {
      color: ${PRIMARY_BLUE};
    }

    .defer-table-wrapper .ant-table-sorter-up.active,
    .defer-table-wrapper .ant-table-sorter-down.active {
      color: ${ACCENT_LIME};
    }

    .status-badge {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .status-pending {
      background-color: ${WARNING_ORANGE}20;
      color: ${WARNING_ORANGE};
    }

    .status-approved {
      background-color: ${SUCCESS_GREEN}20;
      color: ${SUCCESS_GREEN};
    }

    .status-rejected {
      background-color: ${ERROR_RED}20;
      color: ${ERROR_RED};
    }

    .status-returned {
      background-color: ${WARNING_ORANGE}20;
      color: ${WARNING_ORANGE};
    }
  `;
};

// Create a style element and inject CSS
export const injectCustomStyles = () => {
  if (document.getElementById("deferral-checker-custom-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "deferral-checker-custom-styles";
  style.textContent =
    getDeferralCustomStyles() + "\n" + getTableCustomStyles();
  document.head.appendChild(style);
};
