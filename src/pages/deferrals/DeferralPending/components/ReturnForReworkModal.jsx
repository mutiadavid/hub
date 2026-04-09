import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  message,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  UploadOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import deferralApi from "../../../../service/deferralApi";
import {
  PRIMARY_BLUE,
  WARNING_ORANGE,
  SUCCESS_GREEN,
} from "../utils/constants";

const toNullableIsoDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const toNullablePositiveInteger = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

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

const ReturnForReworkModal = ({ open, onClose, deferral, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [editingApprovers, setEditingApprovers] = useState(false);
  const [editedApprovers, setEditedApprovers] = useState([]);
  const [approversFromDb, setApproversFromDb] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [confirmingApprovers, setConfirmingApprovers] = useState(false);

  useEffect(() => {
    if (open && deferral) {
      // Initialize form with deferral data
      form.setFieldsValue({
        deferralDescription: deferral?.deferralDescription || "",
        comments: "",
      });

      // Initialize selected documents
      if (deferral?.selectedDocuments) {
        setSelectedDocuments(deferral.selectedDocuments);
      }
    }
  }, [open, deferral, form]);

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
      message.error("Failed to load approvers from database");
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
      message.error("Approved approvers cannot be removed");
      return;
    }

    if (editedApprovers.length <= 1) {
      message.error("At least one approver is required");
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
      message.error("Please select a valid approver and role for every step");
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
        message.error("No deferral selected");
        return;
      }

      // Call API to update deferral approvers
      const result = await deferralApi.updateApprovers(
        deferral._id,
        approversToSave,
        token
      );

      const updatedDeferral = result?.deferral || result;

      message.success("Approvers updated successfully");
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
      message.error(error.message || "Failed to update approvers");
    } finally {
      setConfirmingApprovers(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

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
        message.success("Deferral resubmitted successfully to reviewer");
        onUpdate?.(updatedDeferral || updateData);
        onClose?.();
      } else {
        throw new Error(response?.message || "Failed to resubmit deferral");
      }
    } catch (error) {
      console.error("Failed to resubmit deferral:", error);
      message.error(error.message || "Failed to resubmit deferral");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = (index) => {
    const newDocs = selectedDocuments.filter((_, i) => i !== index);
    setSelectedDocuments(newDocs);
  };

  return (
    <Modal
      title="Resubmit Deferral for Review"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderColor: PRIMARY_BLUE,
          }}
        >
          Resubmit for Review
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "12px" }}
        >
          {/* Documents Requested for Deferrals */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ color: PRIMARY_BLUE, marginBottom: "12px" }}>
              Documents Requested for Deferrals
            </h3>
            {selectedDocuments.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px",
                      border: "1px solid #d9d9d9",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>
                      {doc.name || `Document ${idx + 1}`}
                    </span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveDocument(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fafafa",
                  borderRadius: "4px",
                  border: "1px dashed #d9d9d9",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                No documents requested
              </div>
            )}
          </div>

          {/* Approval Flow */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ color: PRIMARY_BLUE, margin: 0 }}>Approval Flow</h3>
              {!editingApprovers && (
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={handleEditApproversClick}
                  style={{
                    backgroundColor: PRIMARY_BLUE,
                    borderColor: PRIMARY_BLUE,
                  }}
                >
                  Edit Approvers
                </Button>
              )}
            </div>

            {editingApprovers ? (
              // Edit Mode
              <Spin spinning={loadingApprovers}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {editedApprovers.map((approver, idx) => {
                    const hasApproved =
                      approver.approved || approver.approvalStatus === "approved";

                    return (
                      <div
                        key={approver._id || idx}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "16px",
                          backgroundColor: hasApproved ? "#f3f4f6" : "#f9f9f9",
                          borderRadius: "8px",
                          border: hasApproved ? "1px solid #d1d5db" : "1px solid #e5e7eb",
                          alignItems: "flex-start",
                          opacity: hasApproved ? 0.85 : 1,
                        }}
                      >
                        {/* Step Number */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            minWidth: "32px",
                            borderRadius: "50%",
                            backgroundColor: PRIMARY_BLUE,
                            color: "white",
                            fontWeight: "700",
                            fontSize: "14px",
                          }}
                        >
                          {idx + 1}
                        </div>

                        {/* Approver Fields */}
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <Input
                            placeholder="Role/Designation"
                            value={approver.role || ""}
                            onChange={(e) =>
                              handleApproverChange(idx, "role", e.target.value)
                            }
                            disabled={hasApproved}
                          />
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
                              approversFromDb.map((user) => (
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

                        {/* Delete Button */}
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveApprover(idx)}
                          disabled={hasApproved || editedApprovers.length === 1}
                        />
                      </div>
                    );
                  })}

                  {/* Add Approver Button */}
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => handleAddApprover()}
                    style={{ marginTop: "12px" }}
                  >
                    Add Approver
                  </Button>

                  {/* Confirm/Cancel Buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                      marginTop: "12px",
                    }}
                  >
                    <Button onClick={() => setEditingApprovers(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      loading={confirmingApprovers}
                      onClick={handleConfirmApprovers}
                      style={{
                        backgroundColor: PRIMARY_BLUE,
                        borderColor: PRIMARY_BLUE,
                      }}
                    >
                      Confirm Approvers
                    </Button>
                  </div>
                </div>
              </Spin>
            ) : (
              // View Mode
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {deferral?.approverFlow && deferral.approverFlow.length > 0 ? (
                  deferral.approverFlow.map((approver, idx) => (
                    <div
                      key={approver._id || idx}
                      style={{
                        display: "flex",
                        gap: "12px",
                        padding: "12px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        border: "1px solid #d9d9d9",
                        alignItems: "flex-start",
                      }}
                    >
                      {/* Step Number */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          borderRadius: "50%",
                          backgroundColor:
                            approver.approved ||
                            approver.approvalStatus === "approved"
                              ? SUCCESS_GREEN
                              : PRIMARY_BLUE,
                          color: "white",
                          fontWeight: "700",
                          fontSize: "14px",
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Approver Details */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500" }}>
                          {approver.role || approver.designation || "-"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {approver.name || approver.approverName || "User"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                          {approver.approved ||
                          approver.approvalStatus === "approved"
                            ? "✓ Approved"
                            : "Pending Approval"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#fafafa",
                      borderRadius: "4px",
                      border: "1px dashed #d9d9d9",
                      textAlign: "center",
                      color: "#999",
                      fontSize: "12px",
                    }}
                  >
                    No approvers defined
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deferral Description */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ color: PRIMARY_BLUE, margin: 0, marginBottom: "8px" }}>
              Deferral Description
            </h3>
            <Form.Item name="deferralDescription">
              <Input.TextArea
                rows={3}
                placeholder="Enter deferral description"
              />
            </Form.Item>
          </div>

          {/* Comments for Resubmission */}
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ color: PRIMARY_BLUE, margin: 0, marginBottom: "8px" }}>
              Comments for Resubmission
            </h3>
            <Form.Item name="comments">
              <Input.TextArea
                rows={3}
                placeholder="Enter any additional comments or instructions"
              />
            </Form.Item>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ReturnForReworkModal;
