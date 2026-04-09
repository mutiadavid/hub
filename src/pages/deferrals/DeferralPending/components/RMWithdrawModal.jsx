import React from "react";
import { WarningOutlined } from "@ant-design/icons";
import { Button, Input, Modal } from "antd";
import "../../../../styles/creatorDesignSystem.css";

const RMWithdrawModal = ({ open, withdrawReason, withdrawLoading, onReasonChange, onCancel, onConfirm }) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={550}
      className="admin-page__modal"
      styles={{
        body: { padding: 0 },
        content: { padding: 0, borderRadius: 16 },
      }}
      title={null}
    >
      <div className="admin-page__modal-header">
        <div
          style={{
            width: 44,
            height: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <WarningOutlined style={{ color: "white", fontSize: 24 }} />
        </div>
        <h2 className="admin-page__modal-title">Withdraw Deferral Request</h2>
      </div>

      <div className="admin-page__modal-body">
        <div style={{ marginBottom: 20, color: "var(--color-text-medium)", fontSize: 14, lineHeight: 1.6 }}>
          Are you sure you want to withdraw this deferral request? This action cannot be undone.
        </div>

        <div>
          <label
            className="admin-page__field-label"
            style={{ display: "block", marginBottom: 8 }}
          >
            Reason for Withdrawal *
          </label>
          <Input.TextArea
            placeholder="Please provide the reason for withdrawing this deferral..."
            value={withdrawReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={5}
            className="creator-input"
          />
        </div>

        <div className="admin-page__modal-footer" style={{ marginTop: 24 }}>
          <Button
            onClick={onCancel}
            className="admin-page__action-button admin-page__action-button--secondary"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={withdrawLoading}
            onClick={onConfirm}
            disabled={!withdrawReason.trim()}
            className="admin-page__action-button admin-page__action-button--primary"
            style={{
              background: "linear-gradient(135deg, #1A3636 0%, #40534C 100%)",
              borderColor: "transparent",
              boxShadow: "none",
            }}
          >
            Withdraw Deferral
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RMWithdrawModal;
