// src/components/completedChecklistModal/hooks/useChecklistDocuments.js
import { useMemo } from "react";
import { getDocumentStatusCounts } from "../utils/checklistConstants";

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const isApprovedChecklistStatus = (status) =>
  ["approved", "completed", "approvedandcompleted"].includes(
    normalizeStatus(status),
  );

const isReturnedChecklistStatus = (status) => {
  const normalized = normalizeStatus(status);
  return (
    normalized === "rejected" ||
    normalized === "co_creator_review" ||
    normalized === "cocreatorreview" ||
    normalized.includes("returned to co-creator") ||
    normalized.includes("returned_to_co_creator") ||
    normalized.includes("returned")
  );
};

const resolveCheckerStatus = (doc, checklistStatus) => {
  const explicitStatus =
    doc?.checkerStatus ||
    doc?.finalCheckerStatus ||
    doc?.coCheckerStatus ||
    doc?.co_checker_status ||
    null;

  if (explicitStatus) {
    return explicitStatus;
  }

  if (isApprovedChecklistStatus(checklistStatus)) {
    return "approved";
  }

  if (isReturnedChecklistStatus(checklistStatus)) {
    return "co_creator_review";
  }

  return "pending";
};

export const useChecklistDocuments = (checklist) => {
  const docs = useMemo(() => {
    if (!checklist || !checklist.documents) return [];

    const flatDocs = checklist.documents.reduce((acc, item) => {
      if (item.docList && Array.isArray(item.docList) && item.docList.length) {
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          status: doc.status || doc.action || "pending",
          coStatus: doc.coStatus || doc.status || doc.action || "pending",
          checkerStatus: resolveCheckerStatus(doc, checklist?.status),
        }));
        return acc.concat(nestedDocs);
      }
      if (item.category) {
        return acc.concat({
          ...item,
          status: item.status || item.action || "pending",
          coStatus: item.coStatus || item.status || item.action || "pending",
          checkerStatus: resolveCheckerStatus(item, checklist?.status),
        });
      }
      return acc;
    }, []);

    // Filter out documents that are still pending with RM or Co-Creator
    // These shouldn't appear in completed/approved checklists
    const filteredDocs = flatDocs.filter((doc) => {
      const coStatusLower = (doc.coStatus || "").toLowerCase();
      if (isApprovedChecklistStatus(checklist?.status)) {
        return coStatusLower !== "pendingrm" && coStatusLower !== "pendingco";
      }
      return true;
    });

    return filteredDocs.map((doc, idx) => {
      const resolvedCheckerStatus = resolveCheckerStatus(doc, checklist?.status);

      return {
        ...doc,
        docIdx: idx,
        status: doc.status || doc.action || "pending",
        coStatus: doc.coStatus || doc.status || doc.action || "pending",
        action: doc.action || doc.status || "pending",
        comment: doc.comment || "",
        fileUrl: doc.fileUrl || null,
        expiryDate: doc.expiryDate || doc.ExpiryDate || null,
        deferralNo: doc.deferralNo || doc.deferralNumber || null,
        checkerStatus: resolvedCheckerStatus,
        finalCheckerStatus: resolvedCheckerStatus,
        name: doc.name || doc.documentName || `Document ${idx + 1}`,
      };
    });
  }, [checklist]);

  const documentCounts = useMemo(
    () => getDocumentStatusCounts(docs),
    [docs],
  );

  return { docs, documentCounts };
};
