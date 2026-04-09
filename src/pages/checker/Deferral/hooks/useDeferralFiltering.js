import { useState, useEffect, useMemo } from "react";
import { applyAllFilters, getTabCounts } from "../utils/filters";

export const useDeferralFiltering = (deferrals) => {
  const [filters, setFilters] = useState({
    priority: "all",
    search: "",
    dateRange: null,
  });
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL parameters to preserve tab state
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "pending";
    }
    return "pending";
  });

  // Update URL when tab changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", activeTab);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    }
  }, [activeTab]);

  // Memoize filtered data to prevent unnecessary recalculations
  const filteredDeferrals = useMemo(() => {
    return applyAllFilters(deferrals, filters, activeTab);
  }, [deferrals, filters, activeTab]);

  // Get tab counts
  const tabCounts = useMemo(() => {
    return getTabCounts(deferrals);
  }, [deferrals]);

  const handleSearchChange = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handlePriorityChange = (value) => {
    setFilters((prev) => ({ ...prev, priority: value }));
  };

  const handleDateRangeChange = (dates) => {
    setFilters((prev) => ({ ...prev, dateRange: dates }));
  };

  const handleClearFilters = () => {
    setFilters({
      priority: "all",
      search: "",
      dateRange: null,
    });
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return {
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    filteredDeferrals,
    tabCounts,
    handleSearchChange,
    handlePriorityChange,
    handleDateRangeChange,
    handleClearFilters,
    handleTabChange,
  };
};
