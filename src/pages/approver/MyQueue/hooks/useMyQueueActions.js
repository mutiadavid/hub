import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import deferralApi from "../../../../service/deferralApi";
import { API_BASE_URL } from "../../../../config/runtimeConfig";

/**
 * Custom hook for managing deferral actions (approve, reject, return for rework)
 */
export const useMyQueueActions = (onActionComplete) => {
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectingLoading, setRejectingLoading] = useState(false);
  const [returnReworkLoading, setReturnReworkLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [reworkComment, setReworkComment] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showReworkConfirm, setShowReworkConfirm] = useState(false);

  const token = useSelector((state) => state.auth.token);

  // Approve deferral
  const handleApprove = useCallback(async (deferral, isExtensionModal = false, extension = null) => {
    if (!deferral || (!deferral._id && !deferral.id)) {
      message.error("Invalid deferral selected");
      return;
    }

    setApproveLoading(true);
    try {
      // Handle extension approval
      if (isExtensionModal && extension && (extension._id || extension.id)) {
        const extId = extension._id || extension.id;
        console.debug("Approving extension", { extId, approvalComment });

        // Try with absolute URL first
        let res = await fetch(`${API_BASE_URL}/extensions/${extId}/approve`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ comment: approvalComment }),
        });

        // Try relative URL fallback if absolute fails
        if (!res.ok) {
          try {
            res = await fetch(`/api/extensions/${extId}/approve`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ comment: approvalComment }),
            });
          } catch (e) {
            console.error("Fallback fetch failed:", e);
          }
        }

        if (!res.ok) {
          let errorMsg = "Failed to approve extension";
          try {
            const body = await res.json();
            errorMsg = body?.message || body?.error || errorMsg;
          } catch (e) {
            try {
              errorMsg = await res.text();
            } catch (e2) {
              // ignore
            }
          }

          if (res.status === 403) {
            throw new Error(
              "Forbidden: you are not authorized to approve this extension or you are not the current approver"
            );
          }
          throw new Error(errorMsg);
        }

        const updated = await res.json();
        
        // Dispatch event for UI update
        try {
          window.dispatchEvent(
            new CustomEvent("extension:updated", { detail: updated })
          );
        } catch (e) {
          console.debug("Failed to dispatch extension:updated", e);
        }

        message.success("Extension approved successfully");
      } else {
        // Handle regular deferral approval
        const updated = await deferralApi.approveDeferral(
          deferral._id || deferral.id,
          approvalComment,
          token
        );

        message.success("Deferral approved successfully");

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updated })
          );
        } catch (e) {
          console.debug("Failed to dispatch deferral:updated", e);
        }
      }

      setApprovalComment("");
      setShowApproveConfirm(false);
      if (onActionComplete) onActionComplete("approved", deferral);
    } catch (err) {
      console.error("Approval error:", err);
      message.error(err.message || "Failed to approve");
    } finally {
      setApproveLoading(false);
    }
  }, [token, approvalComment, onActionComplete]);

  // Reject deferral
  const handleReject = useCallback(async (deferral, isExtensionModal = false, extension = null) => {
    if (!rejectComment || rejectComment.trim() === "") {
      message.error("Please provide a rejection reason");
      return;
    }

    if (!deferral || (!deferral._id && !deferral.id)) {
      message.error("Invalid deferral selected");
      return;
    }

    setRejectingLoading(true);
    try {
      // Handle extension rejection
      if (isExtensionModal && extension && (extension._id || extension.id)) {
        const extId = extension._id || extension.id;
        console.debug("Rejecting extension", { extId, rejectComment });

        let res = await fetch(`${API_BASE_URL}/extensions/${extId}/reject`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ reason: rejectComment }),
        });

        // Try relative URL fallback
        if (!res.ok) {
          try {
            res = await fetch(`/api/extensions/${extId}/reject`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ reason: rejectComment }),
            });
          } catch (e) {
            console.error("Fallback fetch failed:", e);
          }
        }

        if (!res.ok) {
          let errorMsg = "Failed to reject extension";
          try {
            const body = await res.json();
            errorMsg = body?.message || body?.error || errorMsg;
          } catch (e) {
            try {
              errorMsg = await res.text();
            } catch (e2) {
              // ignore
            }
          }
          throw new Error(errorMsg);
        }

        const updated = await res.json();
        try {
          window.dispatchEvent(
            new CustomEvent("extension:updated", { detail: updated })
          );
        } catch (e) {
          console.debug("Failed to dispatch extension:updated", e);
        }

        message.success("Extension rejected successfully");
      } else {
        // Handle regular deferral rejection
        const updated = await deferralApi.rejectDeferral(
          deferral._id || deferral.id,
          rejectComment,
          token
        );

        message.success("Deferral rejected successfully");

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updated })
          );
        } catch (e) {
          console.debug("Failed to dispatch deferral:updated", e);
        }
      }

      setRejectComment("");
      setShowRejectConfirm(false);
      if (onActionComplete) onActionComplete("rejected", deferral);
    } catch (err) {
      console.error("Rejection error:", err);
      message.error(err.message || "Failed to reject");
    } finally {
      setRejectingLoading(false);
    }
  }, [token, rejectComment, onActionComplete]);

  // Return for rework
  const handleReturnForRework = useCallback(
    async (deferral, isExtensionModal = false, extension = null) => {
      if (!reworkComment || reworkComment.trim() === "") {
        message.error("Please provide rework instructions");
        return;
      }

      if (!deferral || (!deferral._id && !deferral.id)) {
        message.error("Invalid deferral selected");
        return;
      }

      setReturnReworkLoading(true);
      try {
        // Verify current approver
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        const currentUserId = stored?.user?._id || stored?.user?.id;
        const approvers = deferral.approvers || [];
        const currentApproverIndex = deferral.currentApproverIndex ?? 0;
        const currentApprover = approvers[currentApproverIndex];

        if (currentApprover) {
          const currentApproverId =
            currentApprover.user?._id ||
            currentApprover.user?.id ||
            currentApprover.user ||
            currentApprover.userId?._id ||
            currentApprover.userId?.id ||
            currentApprover.userId;

          const isCurrentApprover = String(currentApproverId) === String(currentUserId);

          if (!isCurrentApprover) {
            const currentApproverEmail = currentApprover.user?.email || "Unknown";
            message.error(
              `You are not the current approver. Current approver is: ${currentApproverEmail}`
            );
            setReturnReworkLoading(false);
            return;
          }
        }

        const updated = await deferralApi.returnForRework(deferral._id || deferral.id, {
          comment: reworkComment,
          reworkInstructions: reworkComment,
        });

        message.success(
          "Deferral returned for rework. Relationship Manager has been notified."
        );

        try {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updated })
          );
        } catch (e) {
          console.debug("Failed to dispatch deferral:updated", e);
        }

        setReworkComment("");
        setShowReworkConfirm(false);
        if (onActionComplete) onActionComplete("returned", deferral);
      } catch (err) {
        console.error("Return for rework error:", err);
        message.error(err.message || "Failed to return for rework");
      } finally {
        setReturnReworkLoading(false);
      }
    },
    [token, reworkComment, onActionComplete]
  );

  // Open confirmation dialogs
  const openApproveConfirm = useCallback(() => {
    if (!approvalComment) {
      message.warning("Please add an approval comment");
      return;
    }
    setShowApproveConfirm(true);
  }, [approvalComment]);

  const openRejectConfirm = useCallback(() => {
    setShowRejectConfirm(true);
  }, []);

  const openReworkConfirm = useCallback(() => {
    setShowReworkConfirm(true);
  }, []);

  // Close confirmation dialogs
  const closeConfirmDialogs = useCallback(() => {
    setShowApproveConfirm(false);
    setShowRejectConfirm(false);
    setShowReworkConfirm(false);
  }, []);

  // Send reminder to current approver
  const handleSendReminder = useCallback(async (deferral) => {
    if (!deferral || (!deferral._id && !deferral.id)) {
      message.error("Invalid deferral selected");
      return;
    }

    try {
      const result = await deferralApi.sendReminder(deferral._id || deferral.id, token);
      if (result && result.success) {
        message.success(`Reminder sent to ${result.email || "approver"}`);
        return true;
      } else {
        message.error("Failed to send reminder");
        return false;
      }
    } catch (err) {
      console.error("sendReminder error", err);
      message.error(err.message || "Failed to send reminder");
      return false;
    }
  }, [token]);

  return {
    // Action handlers
    handleApprove,
    handleReject,
    handleReturnForRework,
    handleSendReminder,
    
    // State
    approveLoading,
    rejectingLoading,
    returnReworkLoading,
    
    // Comment states
    approvalComment,
    setApprovalComment,
    rejectComment,
    setRejectComment,
    reworkComment,
    setReworkComment,
    
    // Dialog states
    showApproveConfirm,
    showRejectConfirm,
    showReworkConfirm,
    
    // Dialog controls
    openApproveConfirm,
    openRejectConfirm,
    openReworkConfirm,
    closeConfirmDialogs,
  };
};
