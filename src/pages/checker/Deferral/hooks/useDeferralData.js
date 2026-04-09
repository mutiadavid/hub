import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import deferralApi from "../../../../service/deferralApi";

export const useDeferralData = (token) => {
  const [deferrals, setDeferrals] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDeferrals = useCallback(async () => {
    if (!token) {
      message.error("Authentication token not found");
      return;
    }

    setLoading(true);
    try {
      // Get pending deferrals (awaiting checker approval)
      const pending = await deferralApi.getPendingDeferrals(token);
      const allPending = Array.isArray(pending) ? pending : [];

      // Get user's own deferrals (approved by checker, rejected, closed)
      const myDeferrals = await deferralApi.getMyDeferrals(token);
      const allMy = Array.isArray(myDeferrals) ? myDeferrals : [];

      // Get approved deferrals
      const approvedDeferrals = await deferralApi.getApprovedDeferrals(token);
      const allApproved = Array.isArray(approvedDeferrals)
        ? approvedDeferrals
        : [];

      // Get close workflow deferrals
      const closeWorkflowDeferrals = await deferralApi
        .getCloseWorkflowDeferrals(token)
        .catch(() => []);
      const closeWorkflow = Array.isArray(closeWorkflowDeferrals)
        ? closeWorkflowDeferrals
        : [];

      // Separate by status from myDeferrals
      const approved = allMy.filter((d) =>
        ["approved", "deferral_approved"].includes(
          (d.status || "").toLowerCase(),
        ),
      );
      const rejected = allMy.filter((d) =>
        ["rejected", "deferral_rejected"].includes(
          (d.status || "").toLowerCase(),
        ),
      );
      const closed = allMy.filter((d) =>
        [
          "closed",
          "deferral_closed",
          "closed_by_co",
          "closed_by_creator",
        ].includes((d.status || "").toLowerCase()),
      );

      // Merge approved deferrals from both sources and deduplicate
      const allApprovedMerged = [...approved, ...allApproved];
      const uniqueApproved = Array.from(
        new Map(allApprovedMerged.map((item) => [item._id, item])).values(),
      );

      // Combine all data and deduplicate
      const combined = [
        ...allPending,
        ...uniqueApproved,
        ...rejected,
        ...closed,
        ...closeWorkflow,
      ];
      const uniqueMap = new Map();

      combined.forEach((d) => {
        if (!uniqueMap.has(d._id)) {
          uniqueMap.set(d._id, d);
        }
      });

      const uniqueDeferrals = Array.from(uniqueMap.values());
      setDeferrals(uniqueDeferrals);
    } catch (error) {
      console.error("Error loading deferrals:", error);
      message.error("Failed to load deferrals");
      setDeferrals([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    deferrals,
    setDeferrals,
    loading,
    loadDeferrals,
  };
};
