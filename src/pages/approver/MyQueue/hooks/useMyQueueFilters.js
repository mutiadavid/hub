import { useState, useMemo, useCallback } from "react";
import { searchMatch, formatUsername } from "../utils";

/**
 * Custom hook for managing queue filters and search
 * Handles filtering, searching, sorting deferrals and extensions
 */
export const useMyQueueFilters = (deferrals = []) => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRange, setDateRange] = useState([]);

  // Filter deferrals based on current user and status
  const getFilteredDeferrals = useCallback((deferralsList = deferrals) => {
    let filtered = [...deferralsList];

    // Filter by status - only show pending approvals
    const pendingApproverStatuses = new Set([
      "pending_approval",
      "in_review",
      "deferral_requested",
    ]);
    
    filtered = filtered.filter((d) =>
      pendingApproverStatuses.has(String(d?.status || "").toLowerCase())
    );

    // Filter by current approver user
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    const currentUserId = stored?.user?._id || stored?.user?.id;

    if (currentUserId) {
      filtered = filtered.filter((d) => {
        const approvers = d.approvers || [];
        const currentApproverIndex = d.currentApproverIndex ?? 0;

        // Check if user has already approved
        const userApproval = approvers.find((a) => {
          const approverId =
            a.user?._id || a.user?.id || a.user ||
            a.userId?._id || a.userId?.id || a.userId;
          return String(approverId) === String(currentUserId);
        });

        if (userApproval && userApproval.approved === true) {
          return false;
        }

        // Check if user is current approver
        const currentApprover = approvers[currentApproverIndex];
        if (!currentApprover) return true;

        const currentApproverId =
          currentApprover.user?._id || currentApprover.user?.id || currentApprover.user ||
          currentApprover.userId?._id || currentApprover.userId?.id || currentApprover.userId;

        return String(currentApproverId) === String(currentUserId);
      });
    }

    // Search filtering
    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter((d) =>
        searchMatch(String(d.customerName || ""), q) ||
        searchMatch(String(d.dclNumber || d.dclNo || ""), q) ||
        searchMatch(String(d.deferralNumber || ""), q) ||
        searchMatch(String(d.requestedBy || d.createdBy?.name || ""), q) ||
        searchMatch(String(d.customerNumber || ""), q) ||
        searchMatch(String(d.document || ""), q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (d) => String(d.status || "").toLowerCase() === String(statusFilter).toLowerCase()
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (d) => String(d.priority || "").toLowerCase() === String(priorityFilter).toLowerCase()
      );
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter((d) => {
        const deferralDate = new Date(d.createdAt || d.createdDate);
        return deferralDate >= startDate && deferralDate <= endDate;
      });
    }

    return filtered;
  }, [searchText, statusFilter, priorityFilter, dateRange, deferrals]);

  // Memoized filtered deferrals
  const filteredDeferrals = useMemo(() => {
    return getFilteredDeferrals(deferrals);
  }, [getFilteredDeferrals, deferrals]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateRange([]);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchText !== "" ||
      statusFilter !== "all" ||
      priorityFilter !== "all" ||
      (dateRange && dateRange.length === 2)
    );
  }, [searchText, statusFilter, priorityFilter, dateRange]);

  return {
    // Filter states
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    dateRange,
    setDateRange,
    
    // Results
    filteredDeferrals,
    
    // Controls
    resetFilters,
    hasActiveFilters,
  };
};

/**
 * Custom hook for managing extension search and filtering
 */
export const useExtensionFilters = (extensions = []) => {
  const [searchText, setSearchText] = useState("");

  const filteredExtensions = useMemo(() => {
    if (!searchText) return extensions;

    const q = searchText.toLowerCase();
    return extensions.filter((ext) =>
      searchMatch(String(ext.deferralNumber || ""), q) ||
      searchMatch(String(ext.customerName || ""), q) ||
      searchMatch(String(ext.status || ""), q)
    );
  }, [extensions, searchText]);

  const resetFilters = useCallback(() => {
    setSearchText("");
  }, []);

  return {
    searchText,
    setSearchText,
    filteredExtensions,
    resetFilters,
  };
};
