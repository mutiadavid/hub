// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const HIGHLIGHT_GOLD = "#fcb116";
export const LIGHT_YELLOW = "#fcd716";
export const SECONDARY_PURPLE = "#7e6496";
export const SUCCESS_GREEN = "#52c41a";
export const ERROR_RED = "#ff4d4f";
export const WARNING_ORANGE = "#faad14";

// Status colors mapping
export const STATUS_COLORS = {
  approved: SUCCESS_GREEN,
  rejected: ERROR_RED,
  pending: WARNING_ORANGE,
  returned: WARNING_ORANGE,
  closed: ACCENT_LIME,
};

// Ant Design component customizations
export const getCustomStyles = () => `
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }

  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: ${SECONDARY_PURPLE} !important; padding-bottom: 4px; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
  .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

  .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }
 
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

  .ant-modal-footer .ant-btn { border-radius: 8px; font-weight: 600; height: 38px; padding: 0 16px; }
  .ant-modal-footer .ant-btn-primary { background-color: ${PRIMARY_BLUE} !important; border-color: ${PRIMARY_BLUE} !important; }
`;
