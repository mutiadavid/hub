const normalizeApprovalValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const CREATOR_APPROVED_STATUSES = new Set([
  "partially_approved",
  "approved",
  "deferral_approved",
  "close_requested",
  "close_requested_creator_approved",
  "closed",
  "deferral_closed",
  "closed_by_co",
  "closed_by_creator",
]);

const CHECKER_APPROVED_STATUSES = new Set([
  "approved",
  "deferral_approved",
  "close_requested",
  "close_requested_creator_approved",
  "closed",
  "deferral_closed",
  "closed_by_co",
  "closed_by_creator",
]);

export const getLivePartyApprovalStatuses = (deferral) => {
  const normalizedStatus = normalizeApprovalValue(deferral?.status).replace(/\s+/g, "_");
  const creatorStatus = normalizeApprovalValue(
    deferral?.creatorApprovalStatus || deferral?.creatorStatus,
  );
  const checkerStatus = normalizeApprovalValue(
    deferral?.checkerApprovalStatus || deferral?.checkerStatus,
  );

  const creatorApproved =
    creatorStatus === "approved" || CREATOR_APPROVED_STATUSES.has(normalizedStatus);
  const checkerApproved =
    checkerStatus === "approved" || CHECKER_APPROVED_STATUSES.has(normalizedStatus);

  return {
    creatorApproved,
    checkerApproved,
    creatorLabel: creatorApproved ? "Approved" : "Pending",
    checkerLabel: checkerApproved ? "Approved" : "Pending",
  };
};