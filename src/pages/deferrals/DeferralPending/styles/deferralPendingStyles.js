import { PRIMARY_BLUE, ACCENT_LIME, SECONDARY_PURPLE } from "../utils/constants";

/**
 * Generate custom styles for deferral modals and components
 * @returns {string} CSS string
 */
export const getDeferralCustomStyles = () => `
  /* Core Modal Styling */
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }

  /* Deferral Info Card Styling */
  .deferral-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .deferral-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: ${SECONDARY_PURPLE} !important; padding-bottom: 4px; }
  .deferral-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  /* Form Controls */
  .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
  .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

  /* Status Tags */
  .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }

  /* Deferral Modal Overlay - Full Screen */
  .deferral-modal-overlay {
    position: fixed;
    top: 65px;
    left: var(--sidebar-width, 150px);
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 990;
    overflow: auto;
    padding-top: 20px;
    padding-bottom: 20px;
    transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
    max-height: 100vh;
  }

  /* Deferral Modal Container - Centered with uniform margins */
  .deferral-modal-container {
    background: white;
    border-radius: 12px;
    overflow: visible;
    width: 1200px;
    max-width: calc(100vw - 310px);
    box-shadow: none;
    border: 1px solid #e5e7eb;
    margin: 0 auto;
    position: relative;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    max-height: auto;
  }

  /* Deferral Modal Header */
  .deferral-modal-header {
    background-color: ${PRIMARY_BLUE} !important;
    padding: 18px 24px !important;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    flex-shrink: 0;
  }

  .deferral-modal-header h3 {
    color: white !important;
    font-weight: 700 !important;
    margin: 0 !important;
  }

  /* Deferral Modal Body - Uniform content margins */
  .deferral-modal-body {
    padding: 24px 0 24px 0;
    overflow: auto;
    flex: 1;
    min-height: 0;
  }

  /* Ensure all direct children of modal body have consistent horizontal margins */
  .deferral-modal-body > * {
    margin-left: 24px !important;
    margin-right: 24px !important;
  }

  /* Deferral Modal Footer - Uniform horizontal padding */
  .deferral-modal-footer {
    padding: 16px 24px 24px 24px;
    background: #fafafa;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    border-radius: 0 0 12px 12px;
    flex-shrink: 0;
  }

  .deferral-modal-footer .ant-btn {
    height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .deferral-modal-footer .ant-btn-primary {
    background-color: #164679 !important;
    border-color: #164679 !important;
    color: #ffffff !important;
  }

  .deferral-modal-footer .ant-btn-primary:hover {
    background-color: #0f3a5f !important;
    border-color: #0f3a5f !important;
    color: #ffffff !important;
  }

  .deferral-modal-footer .ant-btn-default {
    background-color: #ffffff !important;
    border-color: #d9d9d9 !important;
    color: #000000 !important;
  }

  .deferral-modal-footer .ant-btn-default:hover {
    background-color: #fafafa !important;
    border-color: #b3b3b3 !important;
    color: #000000 !important;
  }

  /* Comment List Styling - Compact Horizontal Layout */
  .deferral-comments-list .ant-list-item {
    padding: 8px 0 !important;
    border-bottom: 1px solid #f0f0f0 !important;
  }

  .deferral-comments-list .ant-list-item:last-child {
    border-bottom: none !important;
  }

  .deferral-comments-list .ant-list-item-meta {
    align-items: flex-start !important;
    margin-bottom: 0 !important;
  }

  .deferral-comments-list .ant-list-item-meta-content {
    flex: 1;
    min-width: 0;
  }

  .deferral-comments-list .ant-avatar {
    flex-shrink: 0;
  }

  /* Comment content row layout */
  .comment-content-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    line-height: 1.4;
  }

  .comment-author {
    font-weight: 600;
    color: ${PRIMARY_BLUE} !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    font-size: 13px;
  }

  .comment-text {
    color: #4a4a4a;
    font-size: 13px;
    flex: 1;
    min-width: 200px;
  }

  .comment-timestamp {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Responsive adjustments */
  @media (min-width: 768px) and (max-width: 1099px) {
    .deferral-modal-overlay {
      left: var(--sidebar-width, 40px);
    }
  }

  @media (max-width: 767px) {
    .deferral-modal-overlay {
      left: 0;
      padding-left: 0;
      padding-right: 16px;
    }
    .deferral-modal-container {
      width: calc(100vw - 32px) !important;
      max-width: calc(100vw - 32px) !important;
      margin: 0 !important;
    }
    .comment-content-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

/**
 * Generate custom table styles
 * @returns {string} CSS string
 */
export const getTableCustomStyles = () => `
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
 
  /* Remove sorting icons completely */
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
