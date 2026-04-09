// import React from "react";
// import { Button, Select, Typography, Divider, Avatar } from "antd";
// import { PlusOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";

// const { Title, Text } = Typography;
// const { Option } = Select;

// export default function ApproverSelector({
//   slots = [],
//   availableApprovers = [],
//   updateApprover,
//   addApprover,
//   removeApprover,
//   onSubmitDeferral,
//   isSubmitting,
//   onCancel,
//   currentUser = { name: "Requestor", role: "rm" },
// }) {
//   const selectedCount = slots.filter((s) => s.userId).length;

//   const handleAdd = (afterIndex = null) => {
//     // default role when adding a custom approver
//     addApprover("Approver");
//   };

//   return (
//     <>
//       <Title level={4} style={{ color: "#2B1C67", marginBottom: 8 }}>
//         Approver Selection
//       </Title>

//       <Divider style={{ margin: "16px 0" }} />

//       {/* Sequential list: Requestor + slots */}
//       <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//         {/* Requestor (top) */}
//         <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
//           <div style={{ width: 48, display: "flex", justifyContent: "center" }}>
//             <Avatar
//               size={40}
//               icon={<UserOutlined />}
//               style={{
//                 background: "#fff",
//                 color: "#2B1C67",
//                 border: "2px solid #f0f0f0",
//               }}
//             />
//             <div
//               style={{
//                 width: 2,
//                 height: 24,
//                 background: "#eaeaea",
//                 margin: "4px auto 0",
//               }}
//             />
//           </div>
//           <div style={{ flex: 1 }}>
//             <Text strong>{currentUser.name || "Requestor"}</Text>
//             <div style={{ fontSize: 12, color: "#888" }}>Requestor</div>
//           </div>
//         </div>

//         {/* Approval slots */}
//         {slots.map((slot, idx) => (
//           <div
//             key={idx}
//             style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
//           >
//             <div
//               style={{ width: 48, display: "flex", justifyContent: "center" }}
//             >
//               <Avatar
//                 size={40}
//                 style={{
//                   background: "#fff",
//                   color: "#2B1C67",
//                   border: "2px solid #f0f0f0",
//                 }}
//                 icon={<UserOutlined />}
//               />
//               {idx < slots.length - 1 && (
//                 <div
//                   style={{
//                     width: 2,
//                     height: 24,
//                     background: "#eaeaea",
//                     margin: "4px auto 0",
//                   }}
//                 />
//               )}
//             </div>

//             <div style={{ flex: 1 }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}
//               >
//                 <Text strong style={{ fontSize: 13 }}>
//                   {slot.role}
//                 </Text>
//                 <div>
//                   {slots.length > 1 && (
//                     <Button
//                       type="text"
//                       danger
//                       size="small"
//                       icon={<DeleteOutlined />}
//                       onClick={() => removeApprover(idx)}
//                       style={{ padding: 0, fontSize: 11, color: "#ff4d4f" }}
//                     />
//                   )}
//                 </div>
//               </div>

//               <div style={{ marginTop: 8 }}>
//                 <Select
//                   value={slot.userId}
//                   onChange={(value) => updateApprover(idx, value)}
//                   style={{ width: "100%" }}
//                   placeholder={`Select ${slot.role}`}
//                   size="middle"
//                   showSearch
//                   optionFilterProp="children"
//                 >
//                   <Option value="">-- Choose Approver --</Option>
//                   {Array.isArray(availableApprovers) &&
//                   availableApprovers.length > 0 ? (
//                     (() => {
//                       const matching = availableApprovers.filter(
//                         (a) => a.position === slot.role
//                       );
//                       const others = availableApprovers.filter(
//                         (a) => a.position !== slot.role
//                       );
//                       return (
//                         <>
//                           {matching.map((a) => (
//                             <Option key={a._id} value={a._id}>
//                               {a.name} — {a.position}
//                             </Option>
//                           ))}
//                           {others.map((a) => (
//                             <Option key={a._id} value={a._id}>
//                               {a.name}
//                               {a.position ? ` — ${a.position}` : ""}
//                             </Option>
//                           ))}
//                         </>
//                       );
//                     })()
//                   ) : (
//                     <Option value="">No approvers available</Option>
//                   )}
//                 </Select>
//               </div>
//             </div>
//           </div>
//         ))}

//         {/* Add button */}
//         <div style={{ display: "flex", justifyContent: "center" }}>
//           <Button onClick={() => handleAdd()} icon={<PlusOutlined />}>
//             Add
//           </Button>
//         </div>

//         <Divider />

//         {/* Actions */}
//         <div style={{ display: "flex", gap: 8 }}>
//           <Button
//             type="default"
//             size="large"
//             onClick={onCancel}
//             style={{ flex: 1 }}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>

//           <Button
//             onClick={onSubmitDeferral}
//             loading={isSubmitting}
//             size="large"
//             type="primary"
//             style={{ flex: 1 }}
//             disabled={selectedCount === 0}
//           >
//             {isSubmitting ? "Submitting..." : "Submit Deferral"}
//           </Button>
//         </div>

//         <div style={{ fontSize: 11, color: "#999", textAlign: "center" }}>
//           <Text type="secondary">{selectedCount} approver(s) selected</Text>
//         </div>
//       </div>
//     </>
//   );
// }
import React, { useMemo } from "react";
import { Alert, Button, Divider, Select, Typography } from "antd";
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "../../styles/creatorDesignSystem.css";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ApproverSelector({
  slots = [],
  availableApprovers = [],
  updateApprover,
  addApprover,
  removeApprover,
  onSubmitDeferral,
  isSubmitting,
  selectedDocuments = [],
  loanAmount = "",
}) {
  const requiredSteps = slots.length;
  const selectedCount = slots.filter((slot) => !!slot.userId).length;
  const remainingApprovers = Math.max(requiredSteps - selectedCount, 0);
  const selectedUserIds = slots
    .filter((slot) => !!slot.userId)
    .map((slot) => String(slot.userId));
  const hasDuplicateApprovers =
    new Set(selectedUserIds).size !== selectedUserIds.length;
  const hasDocuments =
    Array.isArray(selectedDocuments) && selectedDocuments.length > 0;
  const hasLoanAmount = !!String(loanAmount || "").trim();
  const canDetermineMatrix = hasDocuments && hasLoanAmount;

  const parsedLoanAmount = useMemo(() => {
    const loanStr = String(loanAmount || "")
      .toLowerCase()
      .trim();

    // Handle predefined dropdown values
    if (loanStr === "above75") return 76000000; // Above threshold
    if (loanStr === "below75") return 74000000; // Below threshold

    // Handle numeric input (fallback for direct number entry)
    const normalized = loanStr.replace(/[^0-9.-]+/g, "");
    return parseFloat(normalized) || 0;
  }, [loanAmount]);

  const matrixLabel = useMemo(() => {
    if (!canDetermineMatrix || requiredSteps === 0) {
      return "Approver Matrix Pending";
    }

    const hasPrimary = selectedDocuments.some(
      (doc) => String(doc?.type || "").toLowerCase() === "primary",
    );
    const hasSecondary = selectedDocuments.some(
      (doc) => String(doc?.type || "").toLowerCase() === "secondary",
    );
    const amountLabel = parsedLoanAmount > 75000000 ? "Above 75M" : "Below 75M";

    if (hasPrimary) return `Primary Documents (${amountLabel})`;
    if (hasSecondary) return `Secondary Documents (${amountLabel})`;
    return `Selected Documents (${amountLabel})`;
  }, [canDetermineMatrix, requiredSteps, selectedDocuments, parsedLoanAmount]);

  const canSubmit =
    requiredSteps > 0 &&
    selectedCount === requiredSteps &&
    !hasDuplicateApprovers;

  const getApproverLabel = (index) => {
    if (index === requiredSteps - 1) return "Final Approver";
    return `Approver ${index + 1}`;
  };

  const handleSubmitClick = () => {
    if (!canSubmit || isSubmitting) return;
    if (typeof onSubmitDeferral === "function") {
      onSubmitDeferral();
    }
  };

  const handleAddApproverBetween = (insertIndex) => {
    if (typeof addApprover !== "function") return;
    addApprover(insertIndex, "Approver");
  };

  return (
    <div className="deferral-approver-selector">
      <style>{`
        .deferral-approver-selector {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 78vh;
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          padding: 0 4px 12px;
          min-height: 0;
        }
        .deferral-approver-selector-title {
          color: var(--color-text-dark) !important;
          margin-bottom: 8px !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em;
        }
        .deferral-approver-selector .ant-divider {
          border-color: rgba(214, 189, 152, 0.18) !important;
        }
        .deferral-approver-alert.ant-alert {
          border-radius: 10px !important;
          background: rgba(214, 189, 152, 0.12) !important;
          border: 1px solid rgba(214, 189, 152, 0.45) !important;
          color: var(--color-text-dark) !important;
          margin-bottom: 12px;
        }
        .deferral-approver-alert .ant-alert-message {
          color: var(--color-text-dark) !important;
          font-weight: 500;
        }
        .deferral-approver-summary {
          border: 1px solid rgba(214, 189, 152, 0.28);
          border-radius: 10px;
          padding: 12px;
          background: rgba(245, 247, 244, 0.82);
          margin-bottom: 10px;
        }
        .deferral-approver-summary-title {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-dark);
          font-weight: 600;
        }
        .deferral-approver-summary-caption {
          margin-top: 4px;
          font-size: 11px;
          color: var(--color-text-light);
        }
        .deferral-approver-summary-stats {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .deferral-approver-summary-stat {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          color: var(--color-text-light);
        }
        .deferral-approver-summary-pill {
          border: 1px solid rgba(214, 189, 152, 0.22);
          background: var(--color-white);
          color: var(--color-text-medium);
          border-radius: 999px;
          padding: 2px 8px;
          font-weight: 600;
        }
        .deferral-approver-empty {
          text-align: center;
          padding: 42px 14px;
          color: var(--color-text-light);
        }
        .deferral-approver-empty-icon {
          font-size: 64px;
          color: rgba(103, 125, 106, 0.28);
        }
        .deferral-approver-empty-dots {
          margin-top: 14px;
          color: rgba(103, 125, 106, 0.36);
          line-height: 1;
        }
        .deferral-approver-empty-title {
          margin: 12px 0 6px !important;
          color: rgba(64, 83, 76, 0.52) !important;
        }
        .deferral-approver-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .deferral-approver-slot {
          padding: 12px;
          border: 1px solid rgba(214, 189, 152, 0.18);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.92);
        }
        .deferral-approver-slot-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-dark) !important;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .deferral-approver-selector .ant-select-selector {
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          border-radius: 8px !important;
          min-height: 42px !important;
          box-shadow: none !important;
        }
        .deferral-approver-selector .ant-select-selector:hover,
        .deferral-approver-selector .ant-select-focused .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .deferral-approver-add-btn.ant-btn {
          width: 100%;
          margin-top: 10px;
          border-radius: 8px !important;
          border: 1px dashed rgba(214, 189, 152, 0.45) !important;
          background: rgba(245, 247, 244, 0.8) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
        }
        .deferral-approver-remove-btn.ant-btn {
          margin-top: 6px;
          padding-left: 0 !important;
          color: #b42318 !important;
        }
        .deferral-approver-footer {
          background: transparent;
          border-top: 1px solid rgba(214, 189, 152, 0.16);
          padding: 14px 0 10px;
          margin-top: 10px;
        }
        .deferral-approver-submit.ant-btn {
          width: 100%;
          border-radius: 8px !important;
          border: none !important;
          background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%) !important;
          color: var(--color-white) !important;
          box-shadow: 0 10px 20px rgba(26, 54, 54, 0.12) !important;
        }
        .deferral-approver-submit.ant-btn[disabled],
        .deferral-approver-submit.ant-btn:disabled {
          background: rgba(64, 83, 76, 0.35) !important;
          color: rgba(255, 255, 255, 0.9) !important;
          box-shadow: none !important;
        }
        .deferral-approver-status {
          font-size: 12px;
          text-align: center;
          min-height: 36px;
          padding-top: 10px;
        }
        .deferral-approver-status--danger {
          color: #b42318;
        }
        .deferral-approver-status--success {
          color: #166534;
          font-weight: 600;
        }
        .deferral-approver-status--warning {
          color: #b45309;
        }
        .deferral-approver-matrix-note {
          margin-top: 4px;
        }
      `}</style>
      <Title level={4} className="deferral-approver-selector-title">
        Approver Selection Matrix
      </Title>

      {!canDetermineMatrix || requiredSteps === 0 ? (
        <Alert
          className="deferral-approver-alert"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Select loan amount and documents to determine approver matrix"
        />
      ) : (
        <div className="deferral-approver-summary">
          <div className="deferral-approver-summary-title">
            Applied: {matrixLabel}
          </div>
          <div className="deferral-approver-summary-caption">
            For selected documents with current loan amount
          </div>
          <div className="deferral-approver-summary-stats">
            <Text type="secondary" className="deferral-approver-summary-stat">
              <span>Required Steps:</span>
              <span className="deferral-approver-summary-pill">
                {requiredSteps} levels
              </span>
            </Text>
            <Text type="secondary" className="deferral-approver-summary-stat">
              <span>Completed:</span>
              <span className="deferral-approver-summary-pill">
                {selectedCount}/{requiredSteps}
              </span>
            </Text>
          </div>
        </div>
      )}

      <Divider style={{ margin: "16px 0" }} />

      <div className="deferral-approver-list">
        {!canDetermineMatrix || requiredSteps === 0 ? (
          <div className="deferral-approver-empty">
            <InfoCircleOutlined className="deferral-approver-empty-icon" />
            <div className="deferral-approver-empty-dots" style={{ fontSize: 32 }}>·</div>
            <div className="deferral-approver-empty-dots" style={{ fontSize: 28 }}>·</div>
            <Title level={4} className="deferral-approver-empty-title">
              Approver Matrix Pending
            </Title>
            <Text type="secondary">
              Select loan amount and documents to determine approver matrix
            </Text>
          </div>
        ) : (
          <>
            {slots.map((slot, index) => (
              <div key={`selector-${index}`} className="deferral-approver-slot">
                <Text strong className="deferral-approver-slot-label">
                  {getApproverLabel(index)}: {slot.role || "Approver"}
                </Text>
                <Select
                  value={slot.userId || undefined}
                  onChange={(value) => {
                    const selectedApprover = availableApprovers.find(
                      (approver) =>
                        String(
                          approver.id || approver._id || approver.userId,
                        ) === String(value),
                    );
                    const selectedRole =
                      selectedApprover?.position || slot.role || "Approver";
                    updateApprover(index, value, selectedRole);
                  }}
                  onClear={() =>
                    updateApprover(index, "", slot.role || "Approver")
                  }
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="-- Select --"
                  size="middle"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                >
                  {Array.isArray(availableApprovers) &&
                  availableApprovers.length > 0 ? (
                    (() => {
                      const matching = availableApprovers.filter(
                        (approver) =>
                          String(approver.position || "").toLowerCase() ===
                          String(slot.role || "").toLowerCase(),
                      );
                      const others = availableApprovers.filter(
                        (approver) =>
                          String(approver.position || "").toLowerCase() !==
                          String(slot.role || "").toLowerCase(),
                      );

                      return (
                        <>
                          {matching.map((approver) => (
                            <Option
                              key={
                                approver.id || approver._id || approver.userId
                              }
                              value={
                                approver.id || approver._id || approver.userId
                              }
                              disabled={
                                selectedUserIds.includes(
                                  String(
                                    approver.id ||
                                      approver._id ||
                                      approver.userId,
                                  ),
                                ) &&
                                String(slot.userId || "") !==
                                  String(
                                    approver.id ||
                                      approver._id ||
                                      approver.userId,
                                  )
                              }
                            >
                              {approver.name}
                              {approver.position
                                ? ` — ${approver.position}`
                                : ""}
                            </Option>
                          ))}
                          {others.map((approver) => (
                            <Option
                              key={
                                approver.id || approver._id || approver.userId
                              }
                              value={
                                approver.id || approver._id || approver.userId
                              }
                              disabled={
                                selectedUserIds.includes(
                                  String(
                                    approver.id ||
                                      approver._id ||
                                      approver.userId,
                                  ),
                                ) &&
                                String(slot.userId || "") !==
                                  String(
                                    approver.id ||
                                      approver._id ||
                                      approver.userId,
                                  )
                              }
                            >
                              {approver.name}
                              {approver.position
                                ? ` — ${approver.position}`
                                : ""}
                            </Option>
                          ))}
                        </>
                      );
                    })()
                  ) : (
                    <Option
                      key="no-approvers"
                      value="__no_approvers__"
                      disabled
                    >
                      No approvers available
                    </Option>
                  )}
                </Select>

                {index < slots.length - 1 && (
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => handleAddApproverBetween(index + 1)}
                    className="deferral-approver-add-btn"
                    aria-label="Add approver"
                  />
                )}

                {slot.isCustom === true &&
                  typeof removeApprover === "function" && (
                    <Button
                      type="link"
                      className="deferral-approver-remove-btn"
                      onClick={() => removeApprover(index)}
                    >
                      Remove
                    </Button>
                  )}
              </div>
            ))}
          </>
        )}
      </div>
      <div className="deferral-approver-footer">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            onClick={handleSubmitClick}
            htmlType="button"
            loading={isSubmitting}
            size="large"
            type="primary"
            className="deferral-approver-submit"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Deferral"}
          </Button>
        </div>

        <div className="deferral-approver-status">
          {!canDetermineMatrix || requiredSteps === 0 ? (
            <Text type="secondary">
              Complete loan amount and document selection first
            </Text>
          ) : hasDuplicateApprovers ? (
            <div className="deferral-approver-status--danger">
              <WarningOutlined /> Same approver cannot be selected in more than
              one step
            </div>
          ) : canSubmit ? (
            <div className="deferral-approver-status--success">
              <CheckCircleOutlined /> All approvers correctly selected
            </div>
          ) : (
            <div className="deferral-approver-status--warning">
              <WarningOutlined /> Need {remainingApprovers} more approver(s)
            </div>
          )}
          {canDetermineMatrix && requiredSteps > 0 && (
            <div className="deferral-approver-matrix-note">
              <Text type="secondary" style={{ fontSize: 11 }}>
                Matrix: {matrixLabel}
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
