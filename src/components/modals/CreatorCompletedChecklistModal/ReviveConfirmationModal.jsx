import React from "react";
import { Modal, Button, Typography } from "antd";
import { RedoOutlined } from "@ant-design/icons";
// import { REVIVE_MODAL_CONTENT } from "../CreatorCompletedChecklistModalComponent/constants";
import { REVIVE_MODAL_CONTENT } from "./constants";
import "../../../styles/creatorDesignSystem.css";

const { Text } = Typography;

const ReviveConfirmationModal = ({ open, onCancel, onConfirm, loading }) => {
  const handleConfirmClick = () => {
    onConfirm?.();
  };

  const handleCancelClick = () => {
    onCancel?.();
  };

  return (
    <>
      <style>{`
        .creator-revive-modal .ant-modal-content {
          border-radius: 12px !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          box-shadow: 0 12px 32px rgba(26, 54, 54, 0.14) !important;
          overflow: hidden;
          padding: 0 !important;
          background: var(--color-bg) !important;
        }
        .creator-revive-modal .ant-modal-header {
          margin: 0 !important;
          padding: 18px 20px 12px !important;
          background: var(--color-bg) !important;
          border-bottom: 1px solid rgba(214, 189, 152, 0.2) !important;
        }
        .creator-revive-modal .ant-modal-title {
          color: var(--color-text-dark) !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em;
        }
        .creator-revive-modal .ant-modal-body {
          padding: 20px !important;
        }
        .creator-revive-modal .ant-modal-footer {
          margin: 0 !important;
          padding: 16px 20px 20px !important;
          border-top: 1px solid rgba(214, 189, 152, 0.2) !important;
          background: var(--color-white) !important;
        }
        .creator-revive-modal .ant-modal-footer .ant-btn {
          min-height: 34px !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
        }
        .creator-revive-modal .ant-modal-footer .ant-btn-default {
          background: transparent !important;
          border: 1px solid rgba(214, 189, 152, 0.2) !important;
          color: var(--color-text-medium) !important;
        }
        .creator-revive-modal .ant-modal-footer .ant-btn-primary,
        .creator-revive-modal .ant-modal-footer .ant-btn-primary:hover,
        .creator-revive-modal .ant-modal-footer .ant-btn-primary:focus,
        .creator-revive-modal .ant-modal-footer .ant-btn-primary:active {
          background: var(--ncb-primary-500) !important;
          border: none !important;
          color: #FFFFFF !important;
        }
      `}</style>
      <Modal
      title={REVIVE_MODAL_CONTENT.TITLE}
      open={open}
      onCancel={handleCancelClick}
      centered
      className="creator-revive-modal"
      footer={[
        <Button key="cancel" onClick={handleCancelClick}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={loading}
          onClick={handleConfirmClick}
          icon={<RedoOutlined />}
        >
          Revive Checklist
        </Button>,
      ]}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: "var(--color-text-medium)" }}>
          {REVIVE_MODAL_CONTENT.DESCRIPTION}
        </p>
        <div
          style={{
            background: "var(--color-white)",
            border: "1px solid rgba(214, 189, 152, 0.2)",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Text strong style={{ fontSize: 14, color: "var(--color-text-dark)", marginBottom: 8, display: "block" }}>
            This action will:
          </Text>
          <ul style={{ margin: "0 0 12px 16px", padding: 0, fontSize: 12, lineHeight: 1.6, color: "var(--color-text-medium)" }}>
            {REVIVE_MODAL_CONTENT.BENEFITS.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
          <Text
            type="secondary"
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--color-text-medium)",
              padding: 10,
              background: "rgba(214, 189, 152, 0.1)",
              borderRadius: 6,
              border: "1px solid rgba(214, 189, 152, 0.2)",
            }}
          >
            {REVIVE_MODAL_CONTENT.TIP}
          </Text>
        </div>
      </div>
      </Modal>
    </>
  );
};

export default ReviveConfirmationModal;
