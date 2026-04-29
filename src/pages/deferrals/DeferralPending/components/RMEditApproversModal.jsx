import React from "react";
import { Button, Input, Select } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { WARNING_ORANGE } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

const RMEditApproversModal = ({
  open,
  embedded = false,
  editedApprovers,
  handleApproverChange,
  handleApproverSelection,
  handleRemoveApprover,
  handleAddApprover,
  approversFromDb,
  loadingApprovers,
  confirmingApprovers,
  onCancel,
  onConfirm,
}) => {
  if (!open) {
    return null;
  }

  return (
    <>
      <style>{`
        .rm-edit-approvers-panel {
          background: var(--color-white);
          border: 1px solid rgba(214, 189, 152, 0.2);
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(26, 54, 54, 0.06);
          padding: 24px;
        }
        .rm-edit-approvers-modal-hero {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding-right: 0;
          margin-bottom: 24px;
        }
        .rm-edit-approvers-modal-hero-copy h2 {
          margin: 0;
          color: var(--color-heading);
          font-size: 16px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }
        .rm-edit-approvers-modal-hero-copy p {
          margin: 6px 0 0;
          color: var(--color-text-light);
          font-size: 13px;
          line-height: 1.45;
        }
        .rm-edit-approvers-modal-shell {
          margin-bottom: 26px;
        }
        .rm-edit-approvers-modal-heading {
          margin-bottom: 20px;
        }
        .rm-edit-approvers-modal-heading h3 {
          margin: 0;
          color: var(--color-text-dark);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .rm-edit-approvers-modal-heading p {
          margin: 10px 0 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.55;
        }
        .rm-edit-approvers-modal-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .rm-edit-approvers-modal-step {
          display: flex;
          gap: 16px;
          padding: 18px 18px 16px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 14px;
          border: 1px solid rgba(214, 189, 152, 0.18);
          align-items: flex-start;
          box-shadow: 0 10px 28px rgba(26, 54, 54, 0.06);
        }
        .rm-edit-approvers-modal-step--locked {
          background: #f2f4f7;
          border-color: rgba(208, 213, 221, 0.9);
        }
        .rm-edit-approvers-modal-step-index {
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
        .rm-edit-approvers-modal-step-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .rm-edit-approvers-modal-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rm-edit-approvers-modal-label {
          color: var(--color-text-medium);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .rm-edit-approvers-modal-step-fields .ant-input,
        .rm-edit-approvers-modal-step-fields .ant-select-selector {
          border: 1px solid #eaecf0 !important;
          border-radius: 10px !important;
          box-shadow: none !important;
          min-height: 46px !important;
          background: var(--color-white) !important;
          padding-inline: 14px !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-input {
          color: var(--color-text-dark);
          font-size: 13px;
        }
        .rm-edit-approvers-modal-step-fields .ant-input::placeholder,
        .rm-edit-approvers-modal-step-fields .ant-select-selection-placeholder {
          color: #98a2b3 !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-select-selection-item,
        .rm-edit-approvers-modal-step-fields .ant-select-selection-placeholder,
        .rm-edit-approvers-modal-step-fields .ant-input,
        .rm-edit-approvers-modal-note {
          font-size: 13px !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-select-selection-item {
          color: var(--color-text-dark) !important;
          line-height: 44px !important;
        }
        .rm-edit-approvers-modal-step-fields .ant-input:hover,
        .rm-edit-approvers-modal-step-fields .ant-input:focus,
        .rm-edit-approvers-modal-step-fields .ant-select-selector:hover,
        .rm-edit-approvers-modal-step-fields .ant-select-focused .ant-select-selector {
          border-color: var(--color-primary-dark) !important;
          box-shadow: 0 0 0 2px rgba(26, 54, 54, 0.08) !important;
        }
        .rm-edit-approvers-modal-delete.ant-btn {
          color: #b42318 !important;
          border-radius: 10px !important;
          margin-top: 24px;
          border: 1px solid transparent !important;
        }
        .rm-edit-approvers-modal-delete.ant-btn:hover,
        .rm-edit-approvers-modal-delete.ant-btn:focus {
          background: rgba(180, 35, 24, 0.06) !important;
          border-color: rgba(180, 35, 24, 0.12) !important;
        }
        .rm-edit-approvers-modal-insert {
          display: flex;
          justify-content: center;
          padding: 0;
        }
        .rm-edit-approvers-modal-insert-btn.ant-btn {
          width: 38px;
          height: 38px;
          border-radius: 999px !important;
          border: 1px dashed rgba(52, 80, 76, 0.3) !important;
          background: transparent !important;
          color: var(--color-primary-medium) !important;
          box-shadow: none !important;
        }
        .rm-edit-approvers-modal-note {
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
        .rm-edit-approvers-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 0;
          padding-top: 20px;
          border-top: 1px solid rgba(214, 189, 152, 0.16);
        }
        .rm-edit-approvers-modal-cancel.ant-btn {
          min-width: 92px;
          height: 44px;
          border-radius: 10px !important;
          border: 1px solid #d0d5dd !important;
          background: var(--color-white) !important;
          color: var(--color-text-medium) !important;
          box-shadow: none !important;
          font-weight: 600 !important;
        }
        .rm-edit-approvers-modal-cancel.ant-btn:disabled,
        .rm-edit-approvers-modal-cancel.ant-btn[disabled] {
          background: #d1d5db !important;
          border-color: #d1d5db !important;
          color: #374151 !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn {
          min-width: 156px;
          height: 44px;
          border-radius: 10px !important;
          border: none !important;
          background: var(--ncb-primary-500) !important;
          color: var(--color-white) !important;
          box-shadow: 0 10px 20px rgba(58, 179, 229, 0.18) !important;
          font-weight: 700 !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn,
        .rm-edit-approvers-modal-confirm.ant-btn span,
        .rm-edit-approvers-modal-confirm.ant-btn .anticon,
        .rm-edit-approvers-modal-confirm.ant-btn * {
          color: #ffffff !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn:disabled,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] {
          background: #d1d5db !important;
          border-color: #d1d5db !important;
          box-shadow: none !important;
          color: #374151 !important;
        }
        .rm-edit-approvers-modal-confirm.ant-btn:disabled span,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] span,
        .rm-edit-approvers-modal-confirm.ant-btn:disabled .anticon,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] .anticon,
        .rm-edit-approvers-modal-confirm.ant-btn:disabled *,
        .rm-edit-approvers-modal-confirm.ant-btn[disabled] * {
          color: #374151 !important;
        }
        @media (max-width: 640px) {
          .rm-edit-approvers-panel {
            padding: 18px;
          }
          .rm-edit-approvers-modal-step {
            flex-direction: column;
          }
          .rm-edit-approvers-modal-delete.ant-btn {
            margin-top: 0;
            align-self: flex-end;
          }
          .rm-edit-approvers-modal-actions {
            flex-direction: column-reverse;
          }
          .rm-edit-approvers-modal-cancel.ant-btn,
          .rm-edit-approvers-modal-confirm.ant-btn {
            width: 100%;
          }
        }
      `}</style>
      <div className={`rm-edit-approvers-panel ${embedded ? "rm-edit-approvers-panel--embedded" : ""}`}>
      <div className="rm-edit-approvers-modal-hero">
        <div className="rm-edit-approvers-modal-hero-copy">
          <h2>Edit Approvers</h2>
          <p>Review each step below, assign the right approver, and keep the existing sequence intact.</p>
        </div>
      </div>
      <div className="rm-edit-approvers-modal-shell">
        <div className="rm-edit-approvers-modal-heading">
          <h3>Approval Flow Setup</h3>
          <p>
            Review each step below, assign the right approver, and keep the
            existing sequence intact.
          </p>
        </div>

        <div className="rm-edit-approvers-modal-list">
          {editedApprovers.map((approver, idx) => {
            const hasApproved = approver.approved || approver.approvalStatus === "approved";
            const nextApproverApproved =
              editedApprovers[idx + 1]?.approved ||
              editedApprovers[idx + 1]?.approvalStatus === "approved";

            return (
              <div key={approver._id || idx}>
                <div
                  className={`rm-edit-approvers-modal-step ${hasApproved ? "rm-edit-approvers-modal-step--locked" : ""}`}
                >
                  <div className="rm-edit-approvers-modal-step-index">
                    {idx + 1}
                  </div>

                  <div className="rm-edit-approvers-modal-step-fields">
                    <div className="rm-edit-approvers-modal-field">
                      <span className="rm-edit-approvers-modal-label">Role</span>
                      <Input
                        placeholder="Role/Designation"
                        value={approver.role || ""}
                        onChange={(e) => handleApproverChange(idx, "role", e.target.value)}
                        disabled={hasApproved}
                      />
                    </div>
                    <div className="rm-edit-approvers-modal-field">
                      <span className="rm-edit-approvers-modal-label">Approver</span>
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
                        {(() => {
                          const availableApprovers = approversFromDb.filter(user => {
                            const userId = user._id || user.id;
                            if (userId === approver.userId) return true;
                            return !editedApprovers.some(a => a.userId === userId);
                          });

                          return availableApprovers.length > 0 ? (
                            availableApprovers.map((user) => (
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
                              No other approvers available
                            </Select.Option>
                          );
                        })()}
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="text"
                    className="rm-edit-approvers-modal-delete"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveApprover(idx)}
                    disabled={hasApproved || editedApprovers.length <= 1}
                  />
                </div>

                {idx < editedApprovers.length - 1 && (
                  <div className="rm-edit-approvers-modal-insert">
                    <Button
                      type="text"
                      shape="circle"
                      icon={<PlusOutlined />}
                      className="rm-edit-approvers-modal-insert-btn"
                      onClick={() => handleAddApprover(idx)}
                      disabled={nextApproverApproved}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rm-edit-approvers-modal-note">
          <strong>Note:</strong> Any approver who has already approved is locked,
          greyed out, and cannot be removed or replaced. You also cannot insert a
          new approver before an already-approved step.
        </div>
      </div>

      <div className="rm-edit-approvers-modal-actions">
        <Button className="rm-edit-approvers-modal-cancel" onClick={onCancel} disabled={confirmingApprovers}>
          Cancel
        </Button>
        <Button
          type="primary"
          className="rm-edit-approvers-modal-confirm"
          onClick={onConfirm}
          loading={confirmingApprovers}
          disabled={confirmingApprovers}
        >
          Confirm Approvers
        </Button>
      </div>
    </div>
    </>
  );
};

export default RMEditApproversModal;