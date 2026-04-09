import dayjs from "dayjs";

export const calculateDocumentStats = (docs) => {
  const total = docs.length;

  // Count all status types from CO perspective
  const submitted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "submitted" ||
      d.action?.toLowerCase() === "submitted" ||
      d.coStatus?.toLowerCase() === "submitted",
  ).length;

  const pendingFromRM = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingrm" ||
      d.action?.toLowerCase() === "pendingrm" ||
      d.coStatus?.toLowerCase() === "pendingrm",
  ).length;

  const pendingFromCo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingco" ||
      d.action?.toLowerCase() === "pendingco" ||
      d.coStatus?.toLowerCase() === "pendingco",
  ).length;

  const deferred = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "deferred" ||
      d.action?.toLowerCase() === "deferred" ||
      d.coStatus?.toLowerCase() === "deferred",
  ).length;

  const sighted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "sighted" ||
      d.action?.toLowerCase() === "sighted" ||
      d.coStatus?.toLowerCase() === "sighted",
  ).length;

  const waived = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "waived" ||
      d.action?.toLowerCase() === "waived" ||
      d.coStatus?.toLowerCase() === "waived",
  ).length;

  const tbo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "tbo" ||
      d.action?.toLowerCase() === "tbo" ||
      d.coStatus?.toLowerCase() === "tbo",
  ).length;

  const checkerApproved = docs.filter(
    (d) =>
      d.checkerStatus &&
      (d.checkerStatus.toLowerCase().includes("approved") ||
        d.checkerStatus.toLowerCase() === "approved"),
  ).length;

  const checkerRejected = docs.filter(
    (d) =>
      d.checkerStatus &&
      (d.checkerStatus.toLowerCase().includes("rejected") ||
        d.checkerStatus.toLowerCase() === "rejected"),
  ).length;

  const checkerReviewed = docs.filter(
    (d) =>
      d.checkerStatus &&
      !["not reviewed", "pending", null, undefined].includes(
        d.checkerStatus?.toLowerCase(),
      ),
  ).length;

  const checkerPending = docs.filter(
    (d) =>
      !d.checkerStatus ||
      ["not reviewed", "pending", null, undefined].includes(
        d.checkerStatus?.toLowerCase(),
      ),
  ).length;

  // RM statuses
  const rmSubmitted = docs.filter(
    (d) =>
      d.rmStatus &&
      (d.rmStatus.toLowerCase().includes("submitted") ||
        d.rmStatus.toLowerCase().includes("approved") ||
        d.rmStatus.toLowerCase().includes("satisfactory")),
  ).length;

  const rmPending = docs.filter(
    (d) =>
      d.rmStatus &&
      (d.rmStatus.toLowerCase().includes("pending") ||
        d.rmStatus.toLowerCase().includes("awaiting")),
  ).length;

  const rmDeferred = docs.filter(
    (d) =>
      d.rmStatus &&
      (d.rmStatus.toLowerCase().includes("deferred") ||
        d.rmStatus.toLowerCase().includes("returned")),
  ).length;

  const rmCompletedDocs = docs.filter((d) => {
    const rmStatus = (d.rmStatus || "").toLowerCase();
    const coStatus = (d.status || "").toLowerCase();

    // RM has submitted these
    if (
      rmStatus.includes("submitted") ||
      rmStatus.includes("approved") ||
      rmStatus.includes("satisfactory")
    ) {
      return true;
    }

    // Documents that are already completed/processed by CO and don't need RM action
    if (
      coStatus === "sighted" ||
      coStatus === "waived" ||
      coStatus === "tbo" ||
      coStatus === "submitted" ||
      coStatus === "pendingco"
    ) {
      return true;
    }

    // Deferred documents (RM has acted on them)
    if (
      rmStatus.includes("deferred") ||
      rmStatus.includes("deferral") ||
      coStatus === "deferred"
    ) {
      return true;
    }

    return false;
  });

  const progressPercent =
    total === 0 ? 0 : Math.round((rmCompletedDocs.length / total) * 100);

  return {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
    checkerApproved,
    checkerRejected,
    checkerReviewed,
    checkerPending,
    rmSubmitted,
    rmPending,
    rmDeferred,
    progressPercent,
  };
};

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;

  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");

  return expiry.isBefore(today) ? "expired" : "current";
};
