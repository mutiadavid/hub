// import { PRIMARY_BLUE, ACCENT_LIME, SECONDARY_PURPLE } from '../utils/constants';

import { ACCENT_LIME, PRIMARY_BLUE, SECONDARY_PURPLE } from "../../utils/constants";


export const customStyles = `
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

  .checklist-info-card .ant-card-head { 
    border-bottom: 2px solid ${ACCENT_LIME} !important; 
  }
  .checklist-info-card .ant-descriptions-item-label { 
    font-weight: 600 !important; 
    color: ${SECONDARY_PURPLE} !important; 
    padding-bottom: 4px; 
  }
  .checklist-info-card .ant-descriptions-item-content { 
    color: ${PRIMARY_BLUE} !important; 
    font-weight: 700 !important; 
    font-size: 13px !important; 
  }

  .doc-table.ant-table-wrapper table { 
    border: 1px solid #e0e0e0; 
    border-radius: 8px; 
    overflow: hidden; 
  }
  .doc-table .ant-table-thead > tr > th { 
    background-color: #f7f9fc !important; 
    color: ${PRIMARY_BLUE} !important; 
    font-weight: 600 !important; 
    padding: 12px 16px !important; 
  }
  .doc-table .ant-table-tbody > tr > td { 
    padding: 10px 16px !important; 
    border-bottom: 1px dashed #f0f0f0 !important; 
  }

  .status-tag { 
    font-weight: 600 !important; 
    border-radius: 999px !important; 
    padding: 0 8px !important; 
    text-transform: capitalize; 
    min-height: 20px;
    text-align: center; 
    display: inline-flex; 
    align-items: center; 
    gap: 4px; 
    justify-content: center; 
    border-width: 1px !important;
    border-style: solid !important;
  }

  /* Document sidebar styles */
  .doc-sidebar-toggle {
    position: absolute;
    top: 16px;
    right: 90px;
    z-index: 10;
  }
`;

export const modalStyles = {
  body: { 
    padding: "0 24px 24px",
    maxHeight: "80vh",
    overflowY: "auto"
  }
};