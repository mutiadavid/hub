import { useMemo } from "react";
// import { calculateDocumentStats } from "../utils/checklistUtils";
// import { calculateDocumentStats } from '../utils/documentUtils';

export const useDocumentStats = (docs) => {
  return useMemo(() => {
    if (!docs || docs.length === 0) {
      return {
        total: 0,
        submitted: 0,
        pendingFromRM: 0,
        pendingFromCo: 0,
        deferred: 0,
        sighted: 0,
        waived: 0,
        tbo: 0,
        progressPercent: 0,
        completedDocs: 0,
        incompleteDocs: 0,
        totalRelevantDocs: 0,
      };
    }

    const total = docs.length;

    // Count each status
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

    // ✅ CORRECT PROGRESS CALCULATION:
    // Documents that are considered "completed" for progress
    const completedDocs = docs.filter((d) => {
      const status = (d.status || d.action || "").toLowerCase();
      return (
        status === "submitted" ||
        status === "sighted" ||
        status === "waived" ||
        status === "tbo" ||
        status === "deferred"
      );
    }).length;

    // Documents that are "incomplete" (should reduce progress)
    const incompleteDocs = docs.filter((d) => {
      const status = (d.status || d.action || "").toLowerCase();
      return status === "pendingrm" || status === "pendingco";
    }).length;

    // Calculate progress percentage
    // Formula: (completed / total) * 100
    const progressPercent =
      total === 0 ? 0 : Math.round((completedDocs / total) * 100);

    return {
      total,
      submitted,
      pendingFromRM,
      pendingFromCo,
      deferred,
      sighted,
      waived,
      tbo,
      progressPercent,
      completedDocs, // For debugging
      incompleteDocs, // For debugging
      totalRelevantDocs: total, // All docs are relevant for progress
    };
  }, [docs]);
};
