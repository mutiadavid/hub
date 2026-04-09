import React from "react";
import { Button, message } from "antd";
import "../../../styles/creatorDesignSystem.css";

const ConfirmationModal = ({
  confirmAction,
  setConfirmAction,
  loading,
  submitCheckerAction,
  canApproveChecklist,
  checkerRejected,
  total,
  checkerReviewed,
  checkerApproved,
}) => {
  const buttonStyle = {
    borderRadius: "6px",
    fontWeight: 600,
    fontSize: "14px",
    height: "36px",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #1a5fa3 0%, #003d6b 100%)",
    borderColor: "transparent",
    color: "#FFFFFF",
    border: "none",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: "#ffffff",
    borderColor: "#d9d9d9",
    color: "#595959",
  };

  return (
    <div
      className="absolute inset-0 flex justify-center items-center"
      style={{ background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="bg-white p-6 rounded-lg w-96 shadow-lg text-center"
        style={{
          borderRadius: "12px",
          border: "1px solid rgba(214, 189, 152, 0.2)",
          boxShadow: "0 18px 45px rgba(26, 54, 54, 0.18)",
        }}
      >
        <h3
          className="text-lg font-bold mb-4"
          style={{ color: "var(--color-text-dark)", marginBottom: 10 }}
        >
          {confirmAction === "approved"
            ? "Approve Checklist?"
            : "Return to Creator?"}
        </h3>
        <div
          style={{
            fontSize: 12,
            color: "var(--color-text-light)",
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          {confirmAction === "approved"
            ? "This will finalize the checker review and mark the checklist as approved."
            : "This will send the checklist back to the creator with the current review decisions."}
        </div>
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setConfirmAction(null)}
            style={cancelButtonStyle}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => {
              if (confirmAction === "approved" && !canApproveChecklist()) {
                message.error(
                  "Cannot approve checklist: All documents must be approved",
                );
                setConfirmAction(null);
                return;
              }
              submitCheckerAction(confirmAction);
            }}
            disabled={confirmAction === "approved" && !canApproveChecklist()}
            style={{
              ...primaryButtonStyle,
              background:
                confirmAction === "approved" && !canApproveChecklist()
                  ? "#CCCCCC"
                  : "linear-gradient(135deg, #1a5fa3 0%, #003d6b 100%)",
              borderColor:
                confirmAction === "approved" && !canApproveChecklist()
                  ? "#CCCCCC"
                  : "transparent",
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
