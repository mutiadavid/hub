import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  InputNumber,
  Select,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import deferralApi from "../../../../service/deferralApi";
import { showErrorToast, showSuccessToast } from "../../../../utils/authToast";
import {
  WARNING_ORANGE,
  SUCCESS_GREEN,
} from "../utils/constants";

const toNullableIsoDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const MIN_DOCUMENT_DAYS = 10;
const MAX_DOCUMENT_DAYS = 90;

const toNullablePositiveInteger = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeDocumentDays = (document) =>
  toNullablePositiveInteger(document?.daysSought ?? document?.requestedDaysSought);

const sanitizeSelectedDocuments = (documents) =>
  Array.isArray(documents)
    ? documents
        .map((document) => {
          const name = String(document?.name || document?.label || "").trim();
          if (!name) return null;

          return {
            name,
            type: String(document?.type || document?.documentType || "").trim() || null,
            category:
              String(
                document?.category ||
                  document?.documentCategory ||
                  document?.classification ||
                  "",
              ).trim() || null,
            daysSought: toNullablePositiveInteger(
              document?.daysSought ?? document?.requestedDaysSought,
            ),
            nextDocumentDueDate: toNullableIsoDate(
              document?.nextDocumentDueDate ?? document?.nextDueDate,
            ),
          };
        })
        .filter(Boolean)
    : [];

const sanitizeApproverFlow = (approvers) =>
  Array.isArray(approvers)
    ? approvers
        .map((approver) => {
          const role = String(approver?.role || approver?.designation || "").trim();
          const name = String(approver?.name || approver?.approverName || "").trim();
          const userId = String(approver?.userId || approver?.user || "").trim();

          if (!role || !name || !userId) return null;

          return {
            role,
            name,
            userId,
          };
        })
        .filter(Boolean)
    : [];

const MODAL_STYLES = `
  .rm-resubmit-modal .ant-modal-content {
    border-radius: 0 !important;
    overflow: hidden;
    padding: 0 !important;
    background: var(--color-white) !important;
    border: none !important;
    box-shadow: 0 32px 72px rgba(18, 36, 36, 0.24) !important;
  }
  .rm-resubmit-modal .ant-modal-header {
    margin-bottom: 0 !important;
    padding: 22px 26px 18px !important;
    background: var(--color-white) !important;
    border-bottom: 1px solid rgba(214, 189, 152, 0.18) !important;
  }
  .rm-resubmit-modal .ant-modal-title {
    color: var(--color-text-dark) !important;
  }
  .rm-resubmit-modal .ant-modal-close {
    top: 20px !important;
    inset-inline-end: 20px !important;
    color: var(--color-text-medium) !important;
    width: 32px !important;
    height: 32px !important;
  }
  .rm-resubmit-modal .ant-modal-close:hover {
    color: var(--color-text-dark) !important;
    background: rgba(214, 189, 152, 0.12) !important;
  }
  .rm-resubmit-modal .ant-modal-body {
    max-height: 70vh;
    overflow-y: auto;
    padding: 28px 26px 24px !important;
    background: var(--color-white) !important;
  }
  .rm-resubmit-modal-hero {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding-right: 36px;
  }
  .rm-resubmit-modal-hero-copy h2 {
    margin: 0;
    color: var(--color-text-dark);
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
  }
  .rm-resubmit-modal-shell {
    margin-bottom: 26px;
  }
  .rm-resubmit-modal-heading {
    margin-bottom: 20px;
  }
  .rm-resubmit-modal-heading h3 {
    margin: 0;
    color: var(--color-text-dark);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .rm-resubmit-modal-heading p {
    margin: 10px 0 0;
    color: #667085;
    font-size: 13px;
    line-height: 1.55;
  }
  .rm-resubmit-modal-section + .rm-resubmit-modal-section {
    margin-top: 24px;
  }
  .rm-resubmit-modal-section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .rm-resubmit-modal-section-head h4 {
    margin: 0;
    color: var(--color-text-dark);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .rm-resubmit-modal-doc-list,
  .rm-resubmit-modal-flow-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rm-resubmit-modal-doc-item,
  .rm-resubmit-modal-flow-card {
    display: flex;
    gap: 16px;
    padding: 18px 18px 16px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 14px;
    border: 1px solid rgba(214, 189, 152, 0.18);
    align-items: flex-start;
    box-shadow: 0 10px 28px rgba(26, 54, 54, 0.06);
  }
  .rm-resubmit-modal-flow-card--locked {
    background: #f2f4f7;
    border-color: rgba(208, 213, 221, 0.9);
  }
  .rm-resubmit-modal-step-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    min-width: 42px;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%);
    color: var(--color-white);
    font-weight: 700;
    font-size: 14px;
    box-shadow: 0 8px 18px rgba(26, 54, 54, 0.16);
  }
  .rm-resubmit-modal-step-index--approved {
    background: linear-gradient(180deg, ${SUCCESS_GREEN} 0%, #3d9c1b 100%);
  }
  .rm-resubmit-modal-doc-body,
  .rm-resubmit-modal-flow-fields,
  .rm-resubmit-modal-flow-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rm-resubmit-modal-doc-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
  }
  .rm-resubmit-modal-doc-days {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
  }
  .rm-resubmit-modal-days-input.ant-input-number {
    width: 100%;
    border-radius: 10px !important;
    border: 1px solid #eaecf0 !important;
    box-shadow: none !important;
    background: var(--color-white) !important;
  }
  .rm-resubmit-modal-days-input.ant-input-number:hover,
  .rm-resubmit-modal-days-input.ant-input-number-focused {
    border-color: var(--color-primary-dark) !important;
    box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
  }
  .rm-resubmit-modal-days-input .ant-input-number-input {
    height: 44px;
    color: var(--color-text-dark) !important;
  }
  .rm-resubmit-modal-doc-hint,
  .rm-resubmit-modal-doc-error {
    font-size: 12px;
    line-height: 1.4;
  }
  .rm-resubmit-modal-doc-hint {
    color: #667085;
  }
  .rm-resubmit-modal-doc-error {
    color: #b42318;
  }
  .rm-resubmit-modal-doc-name,
  .rm-resubmit-modal-flow-role {
    color: var(--color-text-dark);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
  }
  .rm-resubmit-modal-flow-name,
  .rm-resubmit-modal-flow-state {
    color: #667085;
    font-size: 13px;
    line-height: 1.5;
  }
  .rm-resubmit-modal-flow-state {
    color: #98a2b3;
  }
  .rm-resubmit-modal-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rm-resubmit-modal-label {
    color: var(--color-text-medium);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .rm-resubmit-modal .ant-input,
  .rm-resubmit-modal .ant-select-selector,
  .rm-resubmit-modal .ant-input-textarea textarea {
    border: 1px solid #eaecf0 !important;
    border-radius: 10px !important;
    box-shadow: none !important;
    background: var(--color-white) !important;
    color: var(--color-text-dark) !important;
  }
  .rm-resubmit-modal .ant-input,
  .rm-resubmit-modal .ant-select-selector {
    min-height: 46px !important;
    padding-inline: 14px !important;
  }
  .rm-resubmit-modal .ant-select-selection-item {
    line-height: 44px !important;
    color: var(--color-text-dark) !important;
  }
  .rm-resubmit-modal .ant-input::placeholder,
  .rm-resubmit-modal .ant-select-selection-placeholder,
  .rm-resubmit-modal .ant-input-textarea textarea::placeholder {
    color: #98a2b3 !important;
  }
  .rm-resubmit-modal .ant-input:hover,
  .rm-resubmit-modal .ant-input:focus,
  .rm-resubmit-modal .ant-input-textarea textarea:hover,
  .rm-resubmit-modal .ant-input-textarea textarea:focus,
  .rm-resubmit-modal .ant-select-selector:hover,
  .rm-resubmit-modal .ant-select-focused .ant-select-selector {
    border-color: var(--color-primary-dark) !important;
    box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
  }
  .rm-resubmit-modal-remove.ant-btn,
  .rm-resubmit-modal-delete.ant-btn {
    color: #b42318 !important;
    border-radius: 10px !important;
    border: 1px solid transparent !important;
    box-shadow: none !important;
  }
  .rm-resubmit-modal-remove.ant-btn:hover,
  .rm-resubmit-modal-remove.ant-btn:focus,
  .rm-resubmit-modal-delete.ant-btn:hover,
  .rm-resubmit-modal-delete.ant-btn:focus {
    background: rgba(180, 35, 24, 0.06) !important;
    border-color: rgba(180, 35, 24, 0.12) !important;
  }
  .rm-resubmit-modal-edit.ant-btn,
  .rm-resubmit-modal-insert-btn.ant-btn {
    border-radius: 10px !important;
    box-shadow: none !important;
  }
  .rm-resubmit-modal-edit.ant-btn {
    border: none !important;
    background: var(--ncb-primary-500) !important;
    color: #ffffff !important;
    font-weight: 600 !important;
  }
  .rm-resubmit-modal-insert {
    display: flex;
    justify-content: center;
    padding: 0;
  }
  .rm-resubmit-modal-insert-btn.ant-btn {
    width: 38px;
    height: 38px;
    border-radius: 999px !important;
    border: 1px dashed rgba(52, 80, 76, 0.3) !important;
    background: transparent !important;
    color: var(--color-primary-medium) !important;
  }
  .rm-resubmit-modal-empty {
    padding: 18px 20px;
    background: rgba(255, 255, 255, 0.86);
    border: 1px dashed rgba(208, 213, 221, 0.9);
    border-radius: 12px;
    text-align: center;
    color: #98a2b3;
    font-size: 13px;
  }
  .rm-resubmit-modal-note {
    margin-top: 24px;
    padding: 15px 16px;
    background: #fffaf0;
    border: 1px solid rgba(214, 189, 152, 0.42);
    border-left: 4px solid ${WARNING_ORANGE};
    border-radius: 12px;
    font-size: 12px;
    color: var(--color-text-medium);
    line-height: 1.6;
  }
  .rm-resubmit-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 0;
  }
  .rm-resubmit-modal-cancel.ant-btn {
    min-width: 92px;
    height: 44px;
    border-radius: 10px !important;
    border: 1px solid #d0d5dd !important;
    background: var(--color-white) !important;
    color: var(--color-text-medium) !important;
    box-shadow: none !important;
    font-weight: 600 !important;
  }
  .rm-resubmit-modal-confirm.ant-btn {
    min-width: 176px;
    height: 44px;
    border-radius: 10px !important;
    border: none !important;
    background: var(--ncb-primary-500) !important;
    color: var(--color-white) !important;
    box-shadow: 0 10px 20px rgba(58, 179, 229, 0.18) !important;
    font-weight: 700 !important;
  }
  @media (max-width: 640px) {
    .rm-resubmit-modal .ant-modal {
      max-width: calc(100vw - 24px) !important;
      margin: 12px auto !important;
    }
    .rm-resubmit-modal .ant-modal-header {
      padding: 18px 18px 16px !important;
    }
    .rm-resubmit-modal .ant-modal-body {
      padding: 20px 18px !important;
    }
    .rm-resubmit-modal-doc-item,
    .rm-resubmit-modal-flow-card {
      flex-direction: column;
    }
    .rm-resubmit-modal-delete.ant-btn,
    .rm-resubmit-modal-remove.ant-btn {
      align-self: flex-end;
    }
    .rm-resubmit-modal-actions {
      flex-direction: column-reverse;
    }
    .rm-resubmit-modal-cancel.ant-btn,
    .rm-resubmit-modal-confirm.ant-btn,
    .rm-resubmit-modal-edit.ant-btn {
      width: 100%;
    }
  }
`;

const ReturnForReworkModal = ({ open, onClose, deferral, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [editingApprovers, setEditingApprovers] = useState(false);
  const [editedApprovers, setEditedApprovers] = useState([]);
  const [approversFromDb, setApproversFromDb] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [confirmingApprovers, setConfirmingApprovers] = useState(false);

  const getDocumentDaysValidationMessage = (document) => {
    const documentName = String(document?.name || document?.label || "Document").trim() || "Document";
    const daysSought = normalizeDocumentDays(document);

    if (!Number.isInteger(daysSought)) {
      return `${documentName}: days requested is required`;
    }

    if (daysSought < MIN_DOCUMENT_DAYS || daysSought > MAX_DOCUMENT_DAYS) {
      return `${documentName}: days requested must be between ${MIN_DOCUMENT_DAYS} and ${MAX_DOCUMENT_DAYS}`;
    }

    return null;
  };

  useEffect(() => {
    if (open && deferral) {
      // Initialize form with deferral data
      form.setFieldsValue({
        deferralDescription: deferral?.deferralDescription || "",
        comments: "",
      });

      // Initialize selected documents
      if (deferral?.selectedDocuments) {
        setSelectedDocuments(
          deferral.selectedDocuments.map((document) => ({
            ...document,
            daysSought: normalizeDocumentDays(document),
          })),
        );
      } else {
        setSelectedDocuments([]);
      }

      // Initialize edited approvers
      setEditedApprovers(deferral.approverFlow ? [...deferral.approverFlow] : []);
    }
  }, [open, deferral, form]);

  const handleDocumentDaysChange = (index, value) => {
    setSelectedDocuments((prev) =>
      prev.map((document, currentIndex) =>
        currentIndex === index
          ? {
              ...document,
              daysSought: value === null || typeof value === "undefined" ? null : Number(value),
            }
          : document,
      ),
    );
  };

  const handleEditApproversClick = async () => {
    setEditedApprovers(deferral.approverFlow ? [...deferral.approverFlow] : []);
    setEditingApprovers(true);

    // Fetch approvers from database
    setLoadingApprovers(true);
    try {
      const token = localStorage.getItem("token");
      const users = await deferralApi.getApprovers(token);
      setApproversFromDb(users || []);
    } catch (error) {
      console.error("Error loading approvers:", error);
      showErrorToast("Failed to load approvers from database");
      setApproversFromDb([]);
    } finally {
      setLoadingApprovers(false);
    }
  };

  const handleAddApprover = (afterIndex) => {
    const newApprover = {
      _id: `temp-${Date.now()}`,
      role: "",
      name: "",
      userId: "",
      approved: false,
      approvalStatus: "pending",
    };

    if (afterIndex === undefined || afterIndex === -1) {
      setEditedApprovers((prev) => [...prev, newApprover]);
    } else {
      setEditedApprovers((prev) => {
        const updated = [...prev];
        updated.splice(afterIndex + 1, 0, newApprover);
        return updated;
      });
    }
  };

  const handleRemoveApprover = (idx) => {
    if (editedApprovers[idx]?.approved || editedApprovers[idx]?.approvalStatus === "approved") {
      showErrorToast("Approved approvers cannot be removed");
      return;
    }

    if (editedApprovers.length <= 1) {
      showErrorToast("At least one approver is required");
      return;
    }
    setEditedApprovers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleApproverChange = (idx, field, value) => {
    if (editedApprovers[idx]?.approved || editedApprovers[idx]?.approvalStatus === "approved") {
      return;
    }

    setEditedApprovers((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleApproverSelection = (idx, option) => {
    if (!option || editedApprovers[idx]?.approved || editedApprovers[idx]?.approvalStatus === "approved") return;

    setEditedApprovers((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        userId: option.value,
        name: typeof option.label === "string"
          ? option.label
          : updated[idx]?.name || "",
      };
      return updated;
    });
  };

  const handleConfirmApprovers = async () => {
    // Validate that all approvers have role, name, and a selected user
    const allValid = editedApprovers.every(
      (approver) => approver.role && approver.name && approver.userId,
    );

    if (!allValid) {
      showErrorToast("Please select a valid approver and role for every step");
      return;
    }

    setConfirmingApprovers(true);

    try {
      const approversToSave = editedApprovers.map((approver) => ({
        userId: approver.userId,
        role: approver.role,
        name: approver.name,
        approved: false,
        approvalStatus: "pending",
      }));

      const token = localStorage.getItem("token");

      if (!deferral || !deferral._id) {
        showErrorToast("No deferral selected");
        return;
      }

      // Call API to update deferral approvers
      const result = await deferralApi.updateApprovers(
        deferral._id,
        approversToSave,
        token
      );

      const updatedDeferral = result?.deferral || result;

      showSuccessToast("Approvers updated successfully");
      setEditingApprovers(false);

      if (updatedDeferral && (updatedDeferral._id || updatedDeferral.id)) {
        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
        } catch (eventError) {
          console.debug("Failed to dispatch deferral:updated", eventError);
        }
      }
      
      // Trigger parent refresh to sync approvers across all pages
      if (onUpdate) {
        onUpdate(updatedDeferral || {
          approverFlow: editedApprovers,
        });
      }
    } catch (error) {
      console.error("Error updating approvers:", error);
      showErrorToast(error.message || "Failed to update approvers");
    } finally {
      setConfirmingApprovers(false);
    }
  };

  // Automatically load approvers on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingApprovers(true);
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        const token = stored?.token;
        const users = await deferralApi.getApprovers(token);
        setApproversFromDb(users || []);
      } catch (error) {
        console.error("Error loading approvers:", error);
      } finally {
        setLoadingApprovers(false);
      }
    };
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const invalidDocumentMessage = selectedDocuments
        .map(getDocumentDaysValidationMessage)
        .find(Boolean);

      if (invalidDocumentMessage) {
        showErrorToast(invalidDocumentMessage);
        return;
      }

      const sanitizedSelectedDocuments = sanitizeSelectedDocuments(selectedDocuments);
      const sanitizedApproverFlow = sanitizeApproverFlow(
        editedApprovers.length > 0 ? editedApprovers : deferral.approverFlow,
      );

      const updateData = {
        deferralDescription: values.deferralDescription,
        resubmissionComments: values.comments,
        selectedDocuments: sanitizedSelectedDocuments,
        approverFlow: sanitizedApproverFlow,
        status: "Pending", // Change status back to Pending to route back to person who returned it
      };

      // Call API to update deferral with filtered documents
      const response = await deferralApi.updateDeferral?.(
        deferral._id,
        updateData
      );

      const updatedDeferral = response?.deferral || response;

      if (response?.success || response?.status === 200 || updatedDeferral?._id || updatedDeferral?.id) {
        showSuccessToast("Deferral resubmitted successfully to reviewer");
        onUpdate?.(updatedDeferral || updateData);
        onClose?.();
      } else {
        throw new Error(response?.message || "Failed to resubmit deferral");
      }
    } catch (error) {
      console.error("Failed to resubmit deferral:", error);
      showErrorToast(error.message || "Failed to resubmit deferral");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = (index) => {
    const newDocs = selectedDocuments.filter((_, i) => i !== index);
    setSelectedDocuments(newDocs);
  };

  const modalTitle = (
    <div className="rm-resubmit-modal-hero">
      <div className="rm-resubmit-modal-hero-copy">
        <h2>Resubmit Deferral for Review</h2>
      </div>
    </div>
  );

  return (
    <>
      <style>{MODAL_STYLES}</style>
      <Modal
        className="rm-resubmit-modal"
        title={modalTitle}
        open={open}
        onCancel={onClose}
        width={760}
        footer={null}
        zIndex={1400}
      >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="rm-resubmit-modal-shell"
        >
          <div className="rm-resubmit-modal-heading">
            <h3>Resubmission Review</h3>
            <p>
              Review the requested documents, confirm the approval flow, and add any
              updates before routing this deferral back for review.
            </p>
          </div>

          <div className="rm-resubmit-modal-section">
            <div className="rm-resubmit-modal-section-head">
              <h4>Documents Requested for Deferrals</h4>
            </div>
            {selectedDocuments.length > 0 ? (
              <div className="rm-resubmit-modal-doc-list">
                {selectedDocuments.map((doc, idx) => (
                  <div key={idx} className="rm-resubmit-modal-doc-item">
                    <div className="rm-resubmit-modal-doc-body">
                      <div className="rm-resubmit-modal-doc-name">
                        {doc.name || `Document ${idx + 1}`}
                      </div>
                      <div className="rm-resubmit-modal-doc-meta">
                        <div className="rm-resubmit-modal-doc-days">
                          <span className="rm-resubmit-modal-label">Days Requested</span>
                          <InputNumber
                            min={MIN_DOCUMENT_DAYS}
                            max={MAX_DOCUMENT_DAYS}
                            precision={0}
                            className="rm-resubmit-modal-days-input"
                            value={normalizeDocumentDays(doc)}
                            onChange={(value) => handleDocumentDaysChange(idx, value)}
                            placeholder="Enter days"
                          />
                          {getDocumentDaysValidationMessage(doc) ? (
                            <span className="rm-resubmit-modal-doc-error">
                              {getDocumentDaysValidationMessage(doc)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="text"
                      className="rm-resubmit-modal-remove"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveDocument(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rm-resubmit-modal-empty">
                No documents requested
              </div>
            )}
          </div>

          <div className="rm-resubmit-modal-section">
            <div className="rm-resubmit-modal-section-head">
              <h4>Approval Flow</h4>
            </div>

            <Spin spinning={loadingApprovers}>
              <div className="rm-resubmit-modal-flow-list">
                {editedApprovers.length > 0 ? (
                  editedApprovers.map((approver, idx) => {
                    const hasApproved =
                      approver.approved || approver.approvalStatus === "approved";

                    return (
                      <React.Fragment key={approver._id || idx}>
                        <div
                          className={`rm-resubmit-modal-flow-card ${hasApproved ? "rm-resubmit-modal-flow-card--locked" : ""}`}
                        >
                          <div className="rm-resubmit-modal-step-index">
                            {idx + 1}
                          </div>

                          <div className="rm-resubmit-modal-flow-fields">
                            <div className="rm-resubmit-modal-field">
                              <span className="rm-resubmit-modal-label">Role</span>
                              <Input
                                placeholder="Role/Designation"
                                value={approver.role || ""}
                                onChange={(e) =>
                                  handleApproverChange(idx, "role", e.target.value)
                                }
                                disabled={hasApproved}
                              />
                            </div>
                            <div className="rm-resubmit-modal-field">
                              <span className="rm-resubmit-modal-label">Approver</span>
                              <Select
                                labelInValue
                                placeholder="Select Approver"
                                value={
                                  approver.userId
                                    ? {
                                        label: approver.name,
                                        value: approver.userId,
                                      }
                                    : undefined
                                }
                                onChange={(option) => {
                                  handleApproverSelection(idx, option);
                                }}
                                style={{ width: "100%" }}
                                loading={loadingApprovers}
                                disabled={hasApproved}
                              >
                                {approversFromDb.length > 0 ? (
                                  approversFromDb
                                    .filter((user) => {
                                      const userId = user._id || user.id;
                                      // Allow if it's the current user for this specific step
                                      if (userId === approver.userId) return true;
                                      // Otherwise, check if this user is already selected in any other step
                                      return !editedApprovers.some((ea) => ea.userId === userId);
                                    })
                                    .map((user) => (
                                      <Select.Option
                                        key={user._id || user.id}
                                        value={user._id || user.id}
                                        label={user.name}
                                      >
                                        {user.name}
                                      </Select.Option>
                                    ))
                                ) : (
                                  <Select.Option disabled>
                                    No approvers available
                                  </Select.Option>
                                )}
                              </Select>
                            </div>
                          </div>

                          <Button
                            type="text"
                            className="rm-resubmit-modal-delete"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveApprover(idx)}
                            disabled={hasApproved || editedApprovers.length === 1}
                          />
                        </div>
                        
                        {/* Insert button between steps */}
                        {idx < editedApprovers.length - 1 && (
                          <div className="rm-resubmit-modal-insert">
                            <Button
                              type="text"
                              shape="circle"
                              icon={<PlusOutlined />}
                              className="rm-resubmit-modal-insert-btn"
                              onClick={() => handleAddApprover(idx)}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <div className="rm-resubmit-modal-empty">
                    No approvers defined
                  </div>
                )}

                <div className="rm-resubmit-modal-insert">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<PlusOutlined />}
                    className="rm-resubmit-modal-insert-btn"
                    onClick={() => handleAddApprover()}
                  />
                </div>
              </div>
            </Spin>

            <div className="rm-resubmit-modal-note">
              <strong>Note:</strong> Any approver who has already approved is locked,
              greyed out, and cannot be removed or replaced. Keep the review flow
              aligned to the intended approval sequence before resubmitting.
            </div>
          </div>

          <div className="rm-resubmit-modal-section">
            <div className="rm-resubmit-modal-section-head">
              <h4>Deferral Description</h4>
            </div>
            <Form.Item name="deferralDescription" style={{ marginBottom: 0 }}>
              <Input.TextArea
                rows={3}
                placeholder="Enter deferral description"
              />
            </Form.Item>
          </div>

          <div className="rm-resubmit-modal-section">
            <div className="rm-resubmit-modal-section-head">
              <h4>Comments for Resubmission</h4>
            </div>
            <Form.Item name="comments" style={{ marginBottom: 0 }}>
              <Input.TextArea
                rows={3}
                placeholder="Enter any additional comments or instructions"
              />
            </Form.Item>
          </div>
        </Form>
      </Spin>
      <div className="rm-resubmit-modal-actions">
        <Button className="rm-resubmit-modal-cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          className="rm-resubmit-modal-confirm"
          loading={loading}
          onClick={() => form.submit()}
        >
          Resubmit for Review
        </Button>
      </div>
    </Modal>
    </>
  );
};

export default ReturnForReworkModal;