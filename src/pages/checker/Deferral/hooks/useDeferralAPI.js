import { useState, useCallback } from "react";
import deferralApi from "../../../../service/deferralApi.js";
import { message } from "antd";

/**
 * Custom hook for Deferral API operations
 * Handles all API calls and data fetching
 */
export const useDeferralAPI = (token) => {
  const [loading, setLoading] = useState(false);

  const fetchDeferrals = useCallback(async () => {
    setLoading(true);
    try {
      const pending = await deferralApi.getPendingDeferrals(token).catch(() => []);
      const all = Array.isArray(pending) ? pending : [];

      const my = await deferralApi.getMyDeferrals(token).catch(() => []);
      const myDeferrals = Array.isArray(my) ? my : [];

      const approvedDeferrals = await deferralApi
        .getApprovedDeferrals(token)
        .catch(() => []);
      const allApproved = Array.isArray(approvedDeferrals) ? approvedDeferrals : [];

      const closeWorkflowDeferrals = await deferralApi
        .getCloseWorkflowDeferrals(token)
        .catch(() => []);
      const closeWorkflow = Array.isArray(closeWorkflowDeferrals)
        ? closeWorkflowDeferrals
        : [];

      const approved = myDeferrals.filter((d) =>
        ["approved", "deferral_approved"].includes((d.status || "").toLowerCase()),
      );
      const rejected = myDeferrals.filter((d) =>
        ["rejected", "deferral_rejected"].includes((d.status || "").toLowerCase()),
      );
      const closed = myDeferrals.filter((d) =>
        [
          "closed",
          "deferral_closed",
          "closed_by_co",
          "closed_by_creator",
        ].includes((d.status || "").toLowerCase()),
      );

      const allApprovedMerged = [...approved, ...allApproved];
      const uniqueApproved = Array.from(
        new Map(allApprovedMerged.map((d) => [d._id, d])).values(),
      );

      const combined = [
        ...all,
        ...uniqueApproved,
        ...rejected,
        ...closed,
        ...closeWorkflow,
      ];

      const uniqueCombined = Array.from(
        new Map(combined.map((d) => [d._id, d])).values(),
      );

      return uniqueCombined;
    } catch (error) {
      console.error("Error fetching deferrals:", error);
      message.error("Failed to load deferrals");
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadPendingExtensions = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userToken = user?.token;
      if (!userToken) {
        message.error("Authentication token not found");
        return [];
      }

      const extensions = await deferralApi.getCheckerPendingExtensions(userToken);
      return extensions || [];
    } catch (error) {
      console.error("Error loading pending extensions:", error);
      message.error("Failed to load extension applications");
      return [];
    }
  }, []);

  const approveExtension = useCallback(async (extensionId, comment) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userToken = user?.token;
      if (!userToken) {
        message.error("Authentication token not found");
        return null;
      }

      const response = await deferralApi.approveExtensionAsChecker(
        extensionId,
        comment,
        userToken,
      );
      const updatedExtension = response?.extension || response;
      const updatedDeferral =
        response?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      try {
        window.dispatchEvent(
          new CustomEvent("extension:updated", { detail: updatedExtension }),
        );
        if (updatedDeferral?._id || updatedDeferral?.id) {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
        }
      } catch (eventError) {
        console.debug("Failed to dispatch checker extension approval events", eventError);
      }

      message.success(response?.message || "Extension approved successfully");
      return response;
    } catch (error) {
      console.error("Error approving extension:", error);
      message.error(error.message || "Failed to approve extension");
      return false;
    }
  }, []);

  const returnExtension = useCallback(async (extensionId, reason) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userToken = user?.token;
      if (!userToken) {
        message.error("Authentication token not found");
        return null;
      }

      const response = await deferralApi.returnExtensionAsChecker(
        extensionId,
        reason,
        userToken,
      );
      const updatedExtension = response?.extension || response;
      const updatedDeferral =
        response?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      try {
        window.dispatchEvent(
          new CustomEvent("extension:updated", { detail: updatedExtension }),
        );
        if (updatedDeferral?._id || updatedDeferral?.id) {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
        }
      } catch (eventError) {
        console.debug("Failed to dispatch checker extension return events", eventError);
      }

      message.success(response?.message || "Extension returned for rework successfully");
      return response;
    } catch (error) {
      console.error("Error returning extension:", error);
      message.error(error.message || "Failed to return extension for rework");
      return false;
    }
  }, []);

  const rejectExtension = useCallback(async (extensionId, reason) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const userToken = user?.token;
      if (!userToken) {
        message.error("Authentication token not found");
        return null;
      }

      const response = await deferralApi.rejectExtensionAsChecker(
        extensionId,
        reason,
        userToken,
      );
      const updatedExtension = response?.extension || response;
      const updatedDeferral =
        response?.deferral ||
        updatedExtension?.deferral ||
        updatedExtension?.linkedDeferral ||
        null;

      try {
        window.dispatchEvent(
          new CustomEvent("extension:updated", { detail: updatedExtension }),
        );
        if (updatedDeferral?._id || updatedDeferral?.id) {
          window.dispatchEvent(
            new CustomEvent("deferral:updated", { detail: updatedDeferral }),
          );
        }
      } catch (eventError) {
        console.debug("Failed to dispatch checker extension rejection events", eventError);
      }

      message.success(response?.message || "Extension rejected successfully");
      return response;
    } catch (error) {
      console.error("Error rejecting extension:", error);
      message.error(error.message || "Failed to reject extension");
      return false;
    }
  }, []);

  return { loading, fetchDeferrals, loadPendingExtensions, approveExtension, rejectExtension, returnExtension };
};

export default useDeferralAPI;
