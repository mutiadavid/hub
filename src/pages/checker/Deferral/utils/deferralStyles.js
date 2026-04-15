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
    border-radius: 8px;
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
    padding: 16px 12px !important;
    font-size: 12px;
    color: var(--color-text-medium);
    line-height: 1.25;
  }
  .deferrals-table .ant-table-tbody > tr.ant-table-row:hover > td {
    background-color: rgba(214, 189, 152, 0.06) !important;
    cursor: pointer;
  }
  .deferrals-table .ant-table-thead > tr > th.ant-table-cell-align-center,
  .deferrals-table .ant-table-tbody > tr > td.ant-table-cell-align-center {
    text-align: center !important;
  }
  .deferrals-table .ant-pagination {
    padding: 18px 14px 16px !important;
    margin: 0 !important;
    text-align: center;
  }
  .deferrals-table .ant-pagination .ant-pagination-item,
  .deferrals-table .ant-pagination .ant-pagination-prev,
  .deferrals-table .ant-pagination .ant-pagination-next {
    border-radius: 999px !important;
    border-color: transparent !important;
    background: transparent !important;
    min-width: 34px;
  }
  .deferrals-table .ant-pagination-item-active {
    border-color: rgba(214, 189, 152, 0.18) !important;
    background: rgba(214, 189, 152, 0.18) !important;
  }
  .deferrals-table .ant-pagination-item-active a {
    color: var(--color-text-dark) !important;
    font-weight: 500;
  }
  .deferrals-table .ant-pagination .ant-select-selector {
    border-radius: 999px !important;
  }
`;
