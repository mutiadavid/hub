import dayjs from "dayjs";
import { DEFERRAL_STATUS_GROUPS } from "./constants";
import {
  hasAnyCloseRequestDocumentState,
  hasCheckerCloseRequestDocuments,
} from "../../../../utils/deferralDocuments";

// Filter deferrals by active tab
export const filterDeferralsByTab = (deferrals, activeTab) => {
  if (!Array.isArray(deferrals)) return [];

  const pendingStatuses = DEFERRAL_STATUS_GROUPS.PENDING;
  const approvedStatuses = DEFERRAL_STATUS_GROUPS.APPROVED;
  const closeWorkflowStatuses = DEFERRAL_STATUS_GROUPS.CLOSE_WORKFLOW;
  const rejectedStatuses = DEFERRAL_STATUS_GROUPS.REJECTED;
  const closeRequestStatuses = DEFERRAL_STATUS_GROUPS.CLOSE_REQUEST;
  const closedStatuses = DEFERRAL_STATUS_GROUPS.CLOSED;
  const returnedStatuses = DEFERRAL_STATUS_GROUPS.RETURNED;

  return deferrals.filter((d) => {
    const s = (d.status || "").toString().toLowerCase();

    if (activeTab === "pending") {
      // PENDING tab: awaiting checker approval
      const hasCreatorApproved = d.creatorApprovalStatus === "approved";
      const hasCheckerApproved = d.checkerApprovalStatus === "approved";

      // Exclude terminal statuses
      if (
        approvedStatuses.includes(s) ||
        rejectedStatuses.includes(s) ||
        closedStatuses.includes(s) ||
        closeWorkflowStatuses.includes(s) ||
        returnedStatuses.includes(s)
      ) {
        return false;
      }

      // Keep pending if creator has approved but checker hasn't
      // or if still awaiting approvals
      return hasCreatorApproved && !hasCheckerApproved;
    }

    if (activeTab === "approved") {
      // APPROVED tab: final checker-approved deferrals
      return (
        approvedStatuses.includes(s) &&
        d.checkerApprovalStatus === "approved"
      );
    }

    if (activeTab === "closeRequests") {
      // CLOSE REQUESTS tab: creator-approved close requests awaiting checker
      return hasCheckerCloseRequestDocuments(d) ||
        (closeWorkflowStatuses.includes(s) && !hasAnyCloseRequestDocumentState(d));
    }

    return true;
  });
};

// Filter by search query
export const filterBySearch = (deferrals, searchText) => {
  if (!searchText || searchText.trim() === "") {
    return deferrals;
  }

  const searchLower = searchText.toLowerCase();
  return deferrals.filter(
    (d) =>
      (d.customerNumber || "").toLowerCase().includes(searchLower) ||
      (d.dclNo || d.dclNumber || "").toLowerCase().includes(searchLower) ||
      (d.customerName || "").toLowerCase().includes(searchLower) ||
      (d.deferralNumber || "").toLowerCase().includes(searchLower),
  );
};

// Filter by priority
export const filterByPriority = (deferrals, priority) => {
  if (!priority || priority === "all") {
    return deferrals;
  }
  return deferrals.filter((d) => d.priority === priority);
};

// Filter by date range
export const filterByDateRange = (deferrals, dateRange) => {
  if (!dateRange || !dateRange[0] || !dateRange[1]) {
    return deferrals;
  }

  return deferrals.filter((d) => {
    const createdDate = dayjs(d.createdAt);
    return (
      createdDate.isAfter(dateRange[0]) && createdDate.isBefore(dateRange[1])
    );
  });
};

// Apply all filters
export const applyAllFilters = (deferrals, filters, activeTab) => {
  let result = deferrals;

  // First filter by tab
  result = filterDeferralsByTab(result, activeTab);

  // Then apply other filters
  result = filterBySearch(result, filters.search);
  result = filterByPriority(result, filters.priority);
  result = filterByDateRange(result, filters.dateRange);

  return result;
};

// Get tab counts based on current deferrals
export const getTabCounts = (deferrals) => {
  const pendingCount = filterDeferralsByTab(deferrals, "pending").length;
  const approvedCount = filterDeferralsByTab(deferrals, "approved").length;
  const closeRequestsCount = filterDeferralsByTab(
    deferrals,
    "closeRequests",
  ).length;

  return {
    pending: pendingCount,
    approved: approvedCount,
    closeRequests: closeRequestsCount,
  };
};
