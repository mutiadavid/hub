import { DEFERRAL_STATUS_GROUPS } from "./constants";
import { getDocumentSearchText } from "./helpers";
import {
  hasAnyCloseRequestDocumentState,
  hasCheckerCloseRequestDocuments,
  hasPendingCreatorCloseRequestDocuments,
  hasReturnedCloseRequestDocumentsForRm,
} from "../../../../utils/deferralDocuments";

/**
 * Filter deferrals by search text
 * @param {array} deferrals - Array of deferrals
 * @param {string} searchText - Search term
 * @returns {array} Filtered deferrals
 */
export const filterBySearch = (deferrals, searchText) => {
  if (!searchText || !searchText.trim()) return deferrals;

  const q = searchText.toLowerCase();
  const toText = (value) => String(value || "").toLowerCase();

  return deferrals.filter((d) => {
    const searchable = [
      d.deferralNumber,
      d.deferralNo,
      d.dclNumber,
      d.dclNo,
      d.customerNumber,
      d.customerNo,
      d.customerName,
      d.customerBranchName,
      d.businessSegment,
      d.businessSegmentDesc,
      d.businessName,
      d.loanType,
      d.status,
      d.requestedByName,
      d.createdByName,
    ]
      .map(toText)
      .join(" ");

    return (
      searchable.includes(q) || getDocumentSearchText(d).includes(q)
    );
  });
};

/**
 * Filter deferrals for pending tab
 * Excludes: rejected, returned, withdrawn, closed, approved, close-request statuses
 * @param {array} deferrals - Array of deferrals
 * @returns {array} Filtered deferrals
 */
export const filterPendingDeferrals = (deferrals) => {
  return deferrals.filter((d) => {
    const s = (d.status || "").toLowerCase();
    const excludedStatuses = [
      ...DEFERRAL_STATUS_GROUPS.RETURNED_STATUSES,
      ...DEFERRAL_STATUS_GROUPS.CLOSED_STATUSES,
      ...DEFERRAL_STATUS_GROUPS.APPROVED_STATUSES,
    ].map((status) => status.toLowerCase());

    return !excludedStatuses.includes(s);
  });
};

/**
 * Filter deferrals for approved tab
 * @param {array} deferrals - Array of deferrals
 * @returns {array} Filtered deferrals
 */
export const filterApprovedDeferrals = (deferrals) => {
  return deferrals.filter((d) => {
    const s = (d.status || "").toLowerCase();
    return (
      DEFERRAL_STATUS_GROUPS.APPROVED_STATUSES.some(
        (status) => status.toLowerCase() === s
      ) || hasReturnedCloseRequestDocumentsForRm(d)
    );
  });
};

/**
 * Filter deferrals for rejected/rework tab
 * @param {array} deferrals - Array of deferrals
 * @returns {array} Filtered deferrals
 */
export const filterRejectedDeferrals = (deferrals) => {
  return deferrals.filter((d) => {
    const s = (d.status || "").toLowerCase();
    return DEFERRAL_STATUS_GROUPS.RETURNED_STATUSES.some(
      (status) => status.toLowerCase() === s
    );
  });
};

/**
 * Filter deferrals for close requests tab
 * @param {array} deferrals - Array of deferrals
 * @returns {array} Filtered deferrals
 */
export const filterCloseRequestDeferrals = (deferrals) => {
  return deferrals.filter((d) => {
    const s = (d.status || "").toLowerCase();
    return (
      hasPendingCreatorCloseRequestDocuments(d) ||
      hasCheckerCloseRequestDocuments(d) ||
      ([
        "close_requested",
        "closerequested",
        "close_requested_creator_approved",
        "closerequestedcreatorapproved",
      ].includes(s) && !hasAnyCloseRequestDocumentState(d))
    );
  });
};

/**
 * Filter deferrals for extensions tab
 * @param {array} deferrals - Array of deferrals
 * @returns {array} Filtered deferrals
 */
export const filterExtensionsDeferrals = (deferrals) => {
  return deferrals.filter((d) => {
    const normalizedExtensionStatus = String(d.extensionStatus || "")
      .trim()
      .toLowerCase();
    const hasActiveExtensionStatus =
      normalizedExtensionStatus &&
      !["approved", "rejected", "withdrawn", ""].includes(normalizedExtensionStatus);
    const hasActiveExtensionRecord = Array.isArray(d.extensions)
      ? d.extensions.some((extension) => {
          const status = String(extension?.status || extension?.Status || "")
            .trim()
            .toLowerCase();
          return status && !["approved", "rejected", "withdrawn"].includes(status);
        })
      : false;

    return hasActiveExtensionStatus || hasActiveExtensionRecord;
  });
};

/**
 * Get all filtered data based on search and apply specific tab filter
 * @param {array} deferrals - Array of all deferrals
 * @param {string} searchText - Search term
 * @param {string} activeTab - Active tab name
 * @returns {object} Filtered data for all tabs
 */
export const getFilteredDeferralData = (deferrals, searchText, activeTab) => {
  const filtered = filterBySearch(deferrals, searchText);

  return {
    pending: filterPendingDeferrals(filtered),
    approved: filterApprovedDeferrals(filtered),
    rejected: filterRejectedDeferrals(filtered),
    closeRequests: filterCloseRequestDeferrals(filtered),
    extensions: filterExtensionsDeferrals(filtered),
  };
};

/**
 * Get the current tab data
 * @param {object} dataByTab - Data grouped by tab (from getFilteredDeferralData)
 * @param {string} activeTab - Active tab name
 * @returns {array} Data for active tab
 */
export const getCurrentTabData = (dataByTab, activeTab) => {
  const tabMap = {
    pending: dataByTab.pending,
    approved: dataByTab.approved,
    rejected: dataByTab.rejected,
    closeRequests: dataByTab.closeRequests,
    extensions: dataByTab.extensions,
  };

  return tabMap[activeTab] || [];
};
