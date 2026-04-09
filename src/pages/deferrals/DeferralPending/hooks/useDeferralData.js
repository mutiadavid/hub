import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import deferralApi from "../../../../service/deferralApi";

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

      console.log("[DEFERRAL_LOAD] ========== STARTING LOAD DEFERRALS ==========");
      console.log("[DEFERRAL_LOAD] User data from localStorage:", {
        userId,
        hasToken: !!token,
        username: stored?.user?.name || stored?.name,
      });

      if (!token) {
        console.error("[DEFERRAL_LOAD] ERROR: No authentication token found!");
        message.error("Not authenticated. Please login again.");
        setDeferrals([]);
        setLoading(false);
        return;
      }

      if (!userId) {
        console.error("[DEFERRAL_LOAD] ERROR: No user ID found!");
        message.error("User ID not found. Please login again.");
        setDeferrals([]);
        setLoading(false);
        return;
      }

      console.log("[DEFERRAL_LOAD] Calling deferralApi.getMyDeferrals(token)...");

      // Get my deferrals
      const myData = await deferralApi.getMyDeferrals(token);
      console.log("[DEFERRAL_LOAD] SUCCESS: Fetched myData:", myData);
      console.log("[DEFERRAL_LOAD] myData count:", myData?.length || 0, "deferrals");

      let approvedAssigned = [];
      try {
        console.log("[DEFERRAL_LOAD] Calling deferralApi.getApprovedDeferrals(token)...");
        const approvedData = await deferralApi.getApprovedDeferrals(token);
        console.log("[DEFERRAL_LOAD] SUCCESS: Fetched approvedData:", approvedData);
        console.log("[DEFERRAL_LOAD] approvedData count:", approvedData?.length || 0, "deferrals");

        if (Array.isArray(approvedData)) {
          approvedAssigned = approvedData.filter(
            (d) =>
              d.assignedRM &&
              (String(d.assignedRM._id) === String(userId) ||
                String(d.assignedRM) === String(userId)),
          );
          console.log(
            "[DEFERRAL_LOAD] Filtered approved deferrals for RM:",
            approvedAssigned.length,
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

      console.log("[DEFERRAL_LOAD] Final combined deferrals count:", combined.length);
      console.log("[DEFERRAL_LOAD] ========== LOAD DEFERRALS COMPLETE ==========");

      setDeferrals(combined);
    } catch (err) {
      console.error("[DEFERRAL_LOAD] ========== ERROR LOADING DEFERRALS ==========");
      console.error("[DEFERRAL_LOAD] Error object:", err);
      console.error("[DEFERRAL_LOAD] Error message:", err?.message);

      setDeferrals([]);

      if (err.message.includes("Failed to fetch") || err.message.includes("401")) {
        console.log("[DEFERRAL_LOAD] Session might have expired or token is invalid");
        message.error("Session expired. Please login again.");
      } else if (
        err.message.includes("networkerror") ||
        err.message.includes("fetch")
      ) {
        message.error("Network error. Please check your connection and try again.");
      } else {
        message.error("Failed to load deferrals: " + (err?.message || "Unknown error"));
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
