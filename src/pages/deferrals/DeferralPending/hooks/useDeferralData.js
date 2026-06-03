import { useState, useCallback} from "react";
import deferralApi from "../../../../service/deferralApi";
import { showErrorToast } from "../../../../utils/authToast";

/**
 * Custom hook for loading and managing deferral data
 * @param {string} userId - Current user ID
 * @returns {object} Deferral data and loading state
 */
export const useDeferralData = (userId) => {
  const [deferrals, setDeferrals] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDeferrals = useCallback(async () => {
    setLoading(true);
    try {
      const { store } = await import("../../../../app/store");
      const authState = store.getState().auth;
      const token = authState?.token;
      const currentUserId = authState?.user?._id || authState?.user?.id || userId;

      if (!token) {
        console.error("[DEFERRAL_LOAD] ERROR: No authentication token found!");
        showErrorToast("Not authenticated. Please login again.");
        setDeferrals([]);
        setLoading(false);
        return;
      }

      if (!currentUserId) {
        console.error("[DEFERRAL_LOAD] ERROR: No user ID found!");
        showErrorToast("User ID not found. Please login again.");
        setDeferrals([]);
        setLoading(false);
        return;
      }

      // Get my deferrals (this includes all pending, approved, and actioned deferrals created by the RM)
      const myData = await deferralApi.getMyDeferrals(token);

      const combined = Array.isArray(myData) ? myData : [];
      setDeferrals(combined);
    } catch (err) {
      console.error("[DEFERRAL_LOAD] ========== ERROR LOADING DEFERRALS ==========");
      console.error("[DEFERRAL_LOAD] Error object:", err);
      console.error("[DEFERRAL_LOAD] Error message:", err?.message);

      setDeferrals([]);

      if (err.message.includes("Failed to fetch") || err.message.includes("401")) {
        showErrorToast("Session expired. Please login again.");
      } else if (
        err.message.includes("networkerror") ||
        err.message.includes("fetch")
      ) {
        showErrorToast("Network error. Please check your connection and try again.");
      } else {
        showErrorToast("Failed to load deferrals: " + (err?.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    deferrals,
    setDeferrals,
    loading,
    loadDeferrals,
  };
};