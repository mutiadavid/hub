import { useState, useCallback, useEffect } from "react";
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
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = stored?.token;
      const userId = stored?.user?._id || stored?.id;

      if (!token) {
        console.error("[DEFERRAL_LOAD] ERROR: No authentication token found!");
        showErrorToast("Not authenticated. Please login again.");
        setDeferrals([]);
        setLoading(false);
        return;
      }

      if (!userId) {
        console.error("[DEFERRAL_LOAD] ERROR: No user ID found!");
        showErrorToast("User ID not found. Please login again.");
        setDeferrals([]);
        setLoading(false);
        return;
      }

      // Get my deferrals
      const myData = await deferralApi.getMyDeferrals(token);

      let approvedAssigned = [];
      try {
        const approvedData = await deferralApi.getApprovedDeferrals(token);

        if (Array.isArray(approvedData)) {
          approvedAssigned = approvedData.filter(
            (d) =>
              d.assignedRM &&
              (String(d.assignedRM._id) === String(userId) ||
                String(d.assignedRM) === String(userId)),
          );
        }
      } catch (e) {
        console.warn(
          "[DEFERRAL_LOAD] WARNING: Failed to load approved deferrals for RM",
          e,
        );
      }

      // Combine data
      const combined = Array.isArray(myData) ? [...myData] : [];
      const existingIds = new Set(combined.map((d) => d._id));
      for (const a of approvedAssigned) {
        if (!existingIds.has(a._id)) combined.push(a);
      }

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
