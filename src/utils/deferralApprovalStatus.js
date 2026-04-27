const normalizeApprovalValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

// Only statuses where BOTH creator AND checker have definitely approved
const BOTH_APPROVED_STATUSES = new Set([
  "approved",
  "deferral_approved",
  "close_requested",
  "close_requested_creator_approved",
  "closed",
  "deferral_closed",
  "closed_by_co",
  "closed_by_creator",
]);

// Only statuses where creator has definitely approved but checker may not have yet
const CREATOR_APPROVED_STATUSES = new Set([
  "partially_approved",
  ...BOTH_APPROVED_STATUSES,
]);

export const getLivePartyApprovalStatuses = (deferral) => {
  const normalizedStatus = normalizeApprovalValue(deferral?.status).replace(/\s+/g, "_");
  const creatorStatus = normalizeApprovalValue(
    deferral?.creatorApprovalStatus || deferral?.creatorStatus,
  );
  const checkerStatus = normalizeApprovalValue(
    deferral?.checkerApprovalStatus || deferral?.checkerStatus,
  );

  // Prefer the explicit field from the backend; fall back to status-based inference
  const creatorApproved =
    creatorStatus === "approved" || CREATOR_APPROVED_STATUSES.has(normalizedStatus);
  const checkerApproved =
    checkerStatus === "approved" || BOTH_APPROVED_STATUSES.has(normalizedStatus);

  return {
    creatorApproved,
    checkerApproved,
    creatorLabel: creatorApproved ? "Approved" : "Pending",
    checkerLabel: checkerApproved ? "Approved" : "Pending",
  };
};