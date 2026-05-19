import { useState, useMemo } from "react";
import {
  getFilteredDeferralData,
  getCurrentTabData,
} from "../utils/deferralFilters";

/**
 * Custom hook for managing deferral filtering and search
 * @param {array} deferrals - Array of all deferrals
 * @returns {object} Filtered data, search text, active tab, and control functions
 */
export const useDeferralFiltering = (deferrals) => {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const a = q.get("active");
      if (
        a === "rejected" ||
        a === "approved" ||
        a === "pending" ||
        a === "closeRequests" ||
        a === "extensions" ||
        a === "extensionRework"
      )
        return a;
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // Ignore any errors
    }
    return "pending";
  });

  // Memoized filtered data
  const dataByTab = useMemo(
    () => getFilteredDeferralData(deferrals, searchText, activeTab),
    [deferrals, searchText, activeTab],
  );

  // Get current tab data
  const currentData = useMemo(
    () => getCurrentTabData(dataByTab, activeTab),
    [dataByTab, activeTab],
  );

  return {
    searchText,
    setSearchText,
    activeTab,
    setActiveTab,
    dataByTab,
    currentData,
    pendingData: dataByTab.pending,
    approvedData: dataByTab.approved,
    rejectedData: dataByTab.rejected,
    closeRequestsData: dataByTab.closeRequests,
    extensionsData: dataByTab.extensions,
    extensionReworkData: dataByTab.extensionRework,
  };
};
