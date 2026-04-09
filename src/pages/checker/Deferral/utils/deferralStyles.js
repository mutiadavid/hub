import { PRIMARY_BLUE, SUCCESS_GREEN, ERROR_RED } from "../utils/constants";

export const customModalStyles = `
  .ant-input,
  .ant-select-selector,
  .ant-picker {
    border-radius: 6px !important;
    border-color: rgba(214, 189, 152, 0.2) !important;
    box-shadow: none !important;
  }
  .ant-input:focus,
  .ant-input-focused,
  .ant-select-focused .ant-select-selector,
  .ant-picker-focused {
    box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.12) !important;
    border-color: var(--color-primary-dark) !important;
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
`;

export const customTableStyles = `
  .deferrals-table .ant-table-wrapper {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: none;
    border: none;
  }
  .deferrals-table .ant-table-thead > tr > th {
    background-color: #ffffff !important;
    color: var(--color-text-medium) !important;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    padding: 12px 14px !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
    border-right: none !important;
  }
  .deferrals-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(241, 245, 249, 0.95) !important;
    border-right: none !important;
    padding: 12px 14px !important;
    font-size: 12px;
    color: #333;
  }
  .deferrals-table .ant-table-tbody > tr.ant-table-row:hover > td {
    background-color: rgba(214, 189, 152, 0.08) !important;
    cursor: pointer;
  }
  .deferrals-table .ant-pagination {
    padding: 16px 14px !important;
  }
  .deferrals-table .ant-pagination-item-active {
    border-color: var(--color-primary-dark) !important;
    background: var(--color-primary-dark) !important;
  }
  .deferrals-table .ant-pagination-item-active a {
    color: #fff !important;
  }
`;
