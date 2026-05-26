// src/utils/deferralDocumentValidation.js
const normalizeDeferralLookupValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const pickFirstNormalizedValue = (...values) => {
  for (const value of values) {
    const normalized = normalizeDeferralLookupValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const getChecklistDocumentName = (document) =>
  String(document?.name || document?.documentName || document?.label || "").trim();

const getChecklistDocumentCategory = (document) =>
  String(
    document?.category ||
      document?.documentCategory ||
      document?.classification ||
      document?.type ||
      document?.documentType ||
      "",
  ).trim();

const getNormalizedDeferralDocuments = (deferral) => {
  const sources = [
    ...(Array.isArray(deferral?.selectedDocuments) ? deferral.selectedDocuments : []),
    ...(Array.isArray(deferral?.documents) ? deferral.documents : []),
  ];

  return sources
    .map((document) => {
      const name = pickFirstNormalizedValue(
        document?.name,
        document?.documentName,
        document?.label,
      );

      const categoryCandidates = [
        document?.category,
        document?.documentCategory,
        document?.classification,
        document?.type,
        document?.documentType,
      ]
        .map((value) => normalizeDeferralLookupValue(value))
        .filter(Boolean);

      return {
        raw: document,
        name,
        categories: new Set(categoryCandidates),
      };
    })
    .filter((document) => document.name);
};

export const validateDeferralDocumentCoverage = (deferral, checklistDocument) => {
  const checklistName = normalizeDeferralLookupValue(
    getChecklistDocumentName(checklistDocument),
  );
  const checklistCategory = normalizeDeferralLookupValue(
    getChecklistDocumentCategory(checklistDocument),
  );

  if (!checklistName) {
    return {
      matches: false,
      reason: "document_missing",
    };
  }

  const deferralDocuments = getNormalizedDeferralDocuments(deferral);
  const documentsWithSameName = deferralDocuments.filter(
    (document) => document.name === checklistName,
  );

  const matchedDocument = documentsWithSameName.find(
    (document) => !checklistCategory || document.categories.has(checklistCategory),
  );

  if (matchedDocument) {
    return {
      matches: true,
      matchedDocument: matchedDocument.raw,
    };
  }

  return {
    matches: false,
    reason: documentsWithSameName.length ? "category_mismatch" : "document_missing",
  };
};

export const buildDeferralDocumentCoverageMessage = (checklistDocument) => {
  const name = getChecklistDocumentName(checklistDocument) || "this document";
  const category = getChecklistDocumentCategory(checklistDocument);

  if (category) {
    return `This deferral does not cover document "${name}" under category "${category}".`;
  }

  return `This deferral does not cover document "${name}".`;
};