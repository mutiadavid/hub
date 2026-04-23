import { useState } from "react";
import { message } from "antd";

export const useReviveChecklist = (
  checklist,
  onRevive,
  onRefreshData,
  onClose,
) => {
  const [isReviving, setIsReviving] = useState(false);
  const [showReviveConfirm, setShowReviveConfirm] = useState(false);

  const handleReviveChecklist = () => {
    if (!checklist?._id && !checklist?.id) {
      console.error("❌ Checklist ID missing:", checklist);
      message.error("Cannot revive: Checklist ID is missing");
      return;
    }

    if (!onRevive || typeof onRevive !== "function") {
      console.error("❌ onRevive is not a function:", onRevive);
      message.error("Cannot revive: Missing revive function");
      return;
    }

    setShowReviveConfirm(true);
  };

  const handleConfirmRevive = async () => {
    setShowReviveConfirm(false);

    setIsReviving(true);

    const checklistId = checklist?.id || checklist?._id;

    try {
      message.loading({
        content: "Creating new checklist from template...",
        duration: 0,
        key: "revive",
      });

      const result = await onRevive(checklistId);

      message.success({
        content:
          result?.message ||
          "New checklist created successfully! It will appear in Created Checklists For Review section.",
        duration: 4,
        key: "revive",
      });

      onRefreshData?.();

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("❌ Error in handleConfirmRevive:", error);
      console.error("   Error type:", error?.constructor?.name);
      console.error("   Error status:", error?.status);
      console.error("   Error message:", error?.message);
      console.error("   Error data:", error?.data);

      let errorMessage = "Failed to revive checklist. Please try again.";

      if (error?.status === 500) {
        if (
          error?.data?.error?.includes("REVIVED") &&
          error?.data?.error?.includes("not a valid enum value")
        ) {
          errorMessage =
            "Notification system error: 'REVIVED' is not configured as a valid notification type. Please contact the development team to update the notification schema.";
        } else {
          errorMessage =
            "Server error occurred while reviving checklist. This might be a temporary issue. Please try again later or contact support.";
        }
      } else if (
        error?.status === 400 &&
        error?.data?.message?.includes("revived")
      ) {
        errorMessage =
          "This checklist has already been revived. Please refresh the page to see the updated status.";
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      console.error("   Final error message:", errorMessage);
      message.error({
        content: errorMessage,
        duration: 5,
        key: "revive",
      });

      onRefreshData?.();

      if (error?.status === 400 && error?.data?.message?.includes("revived")) {
        setTimeout(() => onClose(), 100);
      }
    } finally {
      setIsReviving(false);
    }
  };

  const handleCancelRevive = () => {
    setShowReviveConfirm(false);
  };

  return {
    isReviving,
    showReviveConfirm,
    handleReviveChecklist,
    handleConfirmRevive,
    handleCancelRevive,
  };
};
