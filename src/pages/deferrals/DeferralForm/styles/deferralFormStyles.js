import { PRIMARY_BLUE } from "../utils/constants";

export const getConfirmModalStyles = () => `
  /* Confirm Modal Overlay - Full screen with proper z-index */
  .confirm-modal-overlay {
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
    max-height: 125vh;
  }
  
  /* Confirm Modal Container - Centered */
  .confirm-modal-container {
    background: white;
    border-radius: 12px;
    overflow: visible;
    width: 1200px;
    max-width: calc(100vw - 310px);
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.15), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    margin: 0 auto;
    position: relative;
    z-index: 1001;
    display: flex;
    flex-direction: column;
  }
  
  /* Confirm Modal Header */
  .confirm-modal-header {
    background-color: ${PRIMARY_BLUE} !important;
    padding: 24px 24px !important;
    border-radius: 12px 12px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
    flex-shrink: 0;
    min-height: 70px;
  }

  .confirm-modal-header h3 {
    color: white !important;
    font-weight: 600 !important;
    margin: 0 !important;
    font-size: 1.15rem;
    letter-spacing: 0.5px;
  }

  /* Confirm Modal Body */
  .confirm-modal-body {
    padding: 24px;
    overflow: auto;
    flex: 1;
  }

  /* Confirm Modal Footer */
  .confirm-modal-footer {
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

  /* Responsive adjustments */
  @media (min-width: 768px) and (max-width: 1099px) {
    .confirm-modal-overlay {
      left: var(--sidebar-width, 40px);
      transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
    }
  }

  @media (max-width: 767px) {
    .confirm-modal-overlay {
      left: 0;
      padding-left: 0;
      padding-right: 16px;
    }
    .confirm-modal-container {
      width: calc(100vw - 32px) !important;
      max-width: calc(100vw - 32px) !important;
      margin: 0 !important;
    }
  }
`;

export const getSearchInputStyle = () => ({
  position: "relative",
});

export const getTypeaheadDropdownStyle = () => ({
  position: "absolute",
  top: "42px",
  left: 0,
  right: 0,
  zIndex: 1200,
  background: "#fff",
  border: "1px solid #eee",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  maxHeight: 240,
  overflowY: "auto",
  borderRadius: 6,
});

export const getTypeaheadItemStyle = () => ({
  padding: "10px 12px",
  borderBottom: "1px solid #f6f6f6",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const getDocumentItemStyle = () => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  border: "1px solid #f0f0f0",
  borderRadius: "6px",
  marginBottom: "8px",
  backgroundColor: "#fafafa",
});
