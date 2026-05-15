import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  InputNumber,
  Spin,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import deferralApi from "../../../../service/deferralApi";
import RMEditApproversModal from "./RMEditApproversModal";
import { showErrorToast, showSuccessToast } from "../../../../utils/authToast";

const toNullableIsoDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const MIN_DOCUMENT_DAYS = 1;
const MAX_DOCUMENT_DAYS = 90;

const toNullablePositiveInteger = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const isGuid = (value) => {
  if (!value || typeof value !== "string") return false;
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(value.trim());
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
          const role = String(approver?.role || approver?.designation || approver?.Role || "").trim();
          const name = String(
            approver?.name ||
              approver?.Name ||
              approver?.userName ||
              approver?.UserName ||
              approver?.displayName ||
              approver?.DisplayName ||
              approver?.approverName ||
              approver?.ApproverName ||
              approver?.fullName ||
              approver?.FullName ||
              approver?.user?.name ||
              approver?.User?.Name ||
              approver?.user?.userName ||
              approver?.User?.UserName ||
              approver?.user?.displayName ||
              approver?.User?.DisplayName ||
              "",
          ).trim();
          const userId = String(
            approver?.userId ||
              approver?.UserId ||
              approver?.user?.id ||
              approver?.User?.Id ||
              approver?.user?.userId ||
              approver?.User?.UserId ||
              approver?.id ||
              approver?.Id ||
              (typeof approver?.user === "string" ? approver?.user : "") ||
              "",
          ).trim();

          const validUserId = isGuid(userId) ? userId : null;
          if (!role || !name || !validUserId) return null;

          return {
            Role: role,
            role: role,
            UserName: name,
            userName: name,
            name: name,
            UserId: validUserId,
            userId: validUserId,
            Email: String(approver?.email || approver?.Email || approver?.userEmail || approver?.UserEmail || "").trim() || null,
            UserEmail: String(approver?.email || approver?.Email || approver?.userEmail || approver?.UserEmail || "").trim() || null,
            userEmail: String(approver?.email || approver?.Email || approver?.userEmail || approver?.UserEmail || "").trim() || null,
            SamAccountName: String(approver?.samAccountName || "").trim() || null,
            Department: String(approver?.department || "").trim() || null,
            Position: String(approver?.position || "").trim() || null,
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
    background: rgba(214, 189, 152, 0.12);
    border-radius: 12px;
    color: var(--color-text-dark);
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .rm-resubmit-modal-doc-body {
    flex-grow: 1;
  }
  .rm-resubmit-modal-doc-name {
    color: var(--color-text-dark);
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .rm-resubmit-modal-doc-meta {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  .rm-resubmit-modal-label {
    display: block;
    color: #667085;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .rm-resubmit-modal-days-input {
    width: 120px !important;
  }
  .rm-resubmit-modal-remove {
    color: #f04438 !important;
    font-size: 13px !important;
    padding: 4px 8px !important;
  }
  .rm-resubmit-modal-remove:hover {
    background: #fef3f2 !important;
  }
  .rm-resubmit-modal-note {
    margin-top: 16px;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 10px;
    color: #475467;
    font-size: 12px;
    line-height: 1.5;
  }
  .rm-resubmit-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 26px;
    background: #fcfcfd;
    border-top: 1px solid rgba(214, 189, 152, 0.18);
  }
  .rm-resubmit-modal-confirm {
    height: 44px !important;
    padding: 0 24px !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    background: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
  }
  .rm-resubmit-modal-cancel {
    height: 44px !important;
    padding: 0 20px !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    color: #344054 !important;
    background: white !important;
    border: 1px solid #d0d5dd !important;
  }
`;

const ExtensionReturnForReworkModal = ({ open, deferral, onClose, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [editedApprovers, setEditedApprovers] = useState([]);
  const [editingApprovers, setEditingApprovers] = useState(false);
  const [confirmingApprovers, setConfirmingApprovers] = useState(false);
  const [currentExtension, setCurrentExtension] = useState(null);

  const currentDeferralDays = Number(deferral?.daysSought || deferral?.DaysSought || 0);
  const MIN_DAYS = 1;
  const MAX_DAYS = Math.max(0, Math.min(90, 180 - currentDeferralDays));

  useEffect(() => {
    if (open && deferral) {
      // Find the extension in rework status
      const extensionRecords = Array.isArray(deferral.extensions) ? deferral.extensions : [];
      const extension = [...extensionRecords].reverse().find(ext => {
        const status = String(ext.status || ext.Status || "").toLowerCase();
        return status === "returnedforrework" || status === "returned_for_rework";
      }) || extensionRecords[extensionRecords.length - 1];

      setCurrentExtension(extension);

      if (extension) {
        form.setFieldsValue({
          comments: extension.extensionReason || extension.reason || "",
        });

        // Initialize documents from extension
        if (extension.selectedDocuments) {
          setSelectedDocuments(extension.selectedDocuments);
        } else if (extension.requestedDocuments) {
          setSelectedDocuments(extension.requestedDocuments);
        } else if (extension.extensionDaysByDoc) {
          // Fallback if we only have the map
          const docs = Object.entries(extension.extensionDaysByDoc).map(([name, days]) => ({
            name,
            daysSought: days
          }));
          setSelectedDocuments(docs);
        }

        // Initialize approvers from extension
        const initialApprovers = (extension.approvers || extension.Approvers || extension.approverFlow || extension.extensionApprovers || []).map(a => ({
          ...a,
          userId: a.userId || a.UserId || a.user?.id || a.User?.Id || a.user?.userId || a.User?.UserId || a.id || a.Id || (typeof a.user === 'string' ? a.user : ""),
          name: a.name || a.Name || a.userName || a.UserName || a.displayName || a.DisplayName || a.approverName || a.ApproverName || a.user?.name || a.User?.Name || a.user?.displayName || a.User?.DisplayName || ""
        }));
       
        // Populate comments from previous extension reason
        form.setFieldsValue({
          comments: extension.extensionReason || extension.ExtensionReason || ""
        });

        setEditedApprovers(initialApprovers);
      }
    }
  }, [open, deferral, form]);

  const handleDocumentDaysChange = (index, value) => {
    const newDocs = [...selectedDocuments];
    newDocs[index] = { ...newDocs[index], daysSought: value, requestedDaysSought: value };
    setSelectedDocuments(newDocs);
  };

  const getDocumentDaysValidationMessage = (doc) => {
    const days = normalizeDocumentDays(doc);
    if (days === null) return "Days required";
    if (days < MIN_DAYS) return `Min ${MIN_DAYS} days`;
    if (days > MAX_DAYS) return `Max ${MAX_DAYS} days`;
    return null;
  };

  const handleApproverChange = (index, field, value) => {
    const next = [...editedApprovers];
    next[index] = { ...next[index], [field]: value };
    setEditedApprovers(next);
  };

  const handleApproverSelection = (index, user) => {
    const next = [...editedApprovers];
    next[index] = {
      ...next[index],
      userId: user._id || user.id,
      name: user.name,
      email: user.email,
      samAccountName: user.samAccountName,
      department: user.department,
      position: user.position || user.role,
    };
    setEditedApprovers(next);
  };

  const handleRemoveApprover = (index) => {
    const next = editedApprovers.filter((_, i) => i !== index);
    setEditedApprovers(next);
  };

  const handleAddApprover = (afterIndex) => {
    const newApprover = { role: "", name: "", userId: "", email: "" };
   
    if (afterIndex === undefined || afterIndex === -1) {
      // Add at the end
      setEditedApprovers([...editedApprovers, newApprover]);
    } else {
      // Add after specific index
      const updated = [...editedApprovers];
      updated.splice(afterIndex + 1, 0, newApprover);
      setEditedApprovers(updated);
    }
  };

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
      const sanitizedApproverFlow = sanitizeApproverFlow(editedApprovers);

      const extensionDaysByDoc = {};
      sanitizedSelectedDocuments.forEach(doc => {
        extensionDaysByDoc[doc.name.toLowerCase()] = Number(doc.daysSought) || 0;
      });

      const extensionRecords = Array.isArray(deferral?.extensions) ? deferral.extensions : [];
      const extension = [...extensionRecords].reverse().find(ext => {
        const status = String(ext.status || ext.Status || "").toLowerCase();
        return status === "returnedforrework" || status === "returned_for_rework";
      }) || extensionRecords[extensionRecords.length - 1];

      const currentExtensionDays = Number(extension?.requestedDaysSought || extension?.RequestedDaysSought) || 0;
      const calculatedMaxDays = sanitizedSelectedDocuments.length > 0
        ? Math.max(...sanitizedSelectedDocuments.map(d => Number(d.daysSought) || 0))
        : 0;
     
      const maxDays = calculatedMaxDays > 0 ? calculatedMaxDays : currentExtensionDays;

      const extensionData = {
        // Redundant keys to handle various backend serialization settings (PascalCase and camelCase)
        DeferralId: deferral.id || deferral._id || deferral.Id,
        deferralId: deferral.id || deferral._id || deferral.Id,
        RequestedDaysSought: maxDays,
        requestedDaysSought: maxDays,
        ExtensionReason: values.comments || "",
        extensionReason: values.comments || "",
        Comment: values.comments || "",
        comment: values.comments || "",
        ExtensionDaysByDoc: Object.keys(extensionDaysByDoc).length > 0 ? extensionDaysByDoc : null,
        extensionDaysByDoc: Object.keys(extensionDaysByDoc).length > 0 ? extensionDaysByDoc : null,
        ApproverFlow: sanitizedApproverFlow,
        approverFlow: sanitizedApproverFlow,
      };

      const response = await deferralApi.submitExtension(
        deferral.id || deferral._id || deferral.Id,
        extensionData
      );

      if (response) {
        showSuccessToast("Extension resubmitted successfully");
        onUpdate?.(response.deferral || response);
        onClose?.();
      }
    } catch (error) {
      console.error("Failed to resubmit extension:", error);
      const detail = error.data?.message || error.message || "Unknown error";
      showErrorToast(`Failed to resubmit: ${detail}`);
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
        <h2>Resubmit Extension for Review</h2>
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
              Review the extension days per document, confirm the approval flow, and add any
              updates before routing this extension back for review.
            </p>
          </div>

          <div className="rm-resubmit-modal-section">
            <div className="rm-resubmit-modal-section-head">
              <h4>Documents Requested for Extension</h4>
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
                          <span className="rm-resubmit-modal-label">Extension Days Requested</span>
                          <InputNumber
                            min={MIN_DAYS}
                            max={MAX_DAYS}
                            precision={0}
                            className="rm-resubmit-modal-days-input"
                            value={normalizeDocumentDays(doc)}
                            onChange={(value) => handleDocumentDaysChange(idx, value)}
                            placeholder={`1-${MAX_DAYS} days`}
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

            {editedApprovers.length > 0 ? (
              <RMEditApproversModal
                open={open}
                embedded
                suppressIntro
                suppressFooter
                suppressNote
                showTrailingInsert
                editedApprovers={editedApprovers}
                handleApproverChange={handleApproverChange}
                handleApproverSelection={handleApproverSelection}
                handleRemoveApprover={handleRemoveApprover}
                handleAddApprover={handleAddApprover}
                approversFromDb={[]}
                loadingApprovers={false}
                confirmingApprovers={false}
                onCancel={() => {}}
                onConfirm={() => {}}
              />
            ) : (
              <div className="rm-resubmit-modal-empty">No approvers defined</div>
            )}

            <div className="rm-resubmit-modal-note">
              <strong>Note:</strong> You can modify the approval flow for this extension resubmission. Any changes here will only apply to this extension request.
            </div>
          </div>

          <div className="rm-resubmit-modal-section">
            <div className="rm-resubmit-modal-section-head">
              <h4>Comments for Resubmission</h4>
            </div>
            <Form.Item
              name="comments"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: "Please provide a reason for resubmission" }]}
            >
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
          Resubmit Extension
        </Button>
      </div>
    </Modal>
    </>
  );
};

export default ExtensionReturnForReworkModal;