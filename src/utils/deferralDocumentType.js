const ALLOWABLE_NAME_KEYWORDS = [
  "share certificate",
  "search",
  "clean title",
  "valuation",
  "offer letter",
  "land rates",
  "deeds",
  "certificate",
  "title",
  "annual returns",
  "corporate guarantee",
  "personal guarantee",
  "tcc",
];

const PRIMARY_NAME_KEYWORDS = [
  "offer letter",
  "facility letter",
  "loan agreement",
  "security document",
  "charge",
  "title deed",
  "valuation",
];

const SECONDARY_NAME_KEYWORDS = [
  "id",
  "passport",
  "kra",
  "pin",
  "utility bill",
  "bank statement",
  "photo",
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const hasAny = (text, tokens) => tokens.some((token) => text.includes(token));

const detectTier = (text, nameText) => {
  if (text.includes("primary")) return "Primary";
  if (text.includes("secondary")) return "Secondary";
  if (hasAny(nameText, PRIMARY_NAME_KEYWORDS)) return "Primary";
  if (hasAny(nameText, SECONDARY_NAME_KEYWORDS)) return "Secondary";
  return "Secondary";
};

const detectAllowability = (text, nameText) => {
  if (
    text.includes("non allowable") ||
    text.includes("nonallowable") ||
    text.includes("not allowable")
  ) {
    return "Non-Allowable";
  }

  if (text.includes("allowable")) return "Allowable";

  if (hasAny(nameText, ALLOWABLE_NAME_KEYWORDS)) return "Allowable";
  return "Non-Allowable";
};

/**
 * Format deferral document type with tier and allowability
 * @param {Object} doc - Document object with type properties
 * @returns {string} - Formatted document type (e.g., "Primary Allowable")
 */
const formatDeferralDocumentType = (doc) => {
  const raw = [
    doc?.documentType,
    doc?.type,
    doc?.category,
    doc?.documentCategory,
    doc?.classification,
    doc?.allowability,
    doc?.allowableType,
  ]
    .map(normalize)
    .join(" ");

  const nameText = normalize(doc?.name);
  const tier = detectTier(raw, nameText);
  const allowability = detectAllowability(raw, nameText);

  return `${tier} ${allowability}`;
};

export { formatDeferralDocumentType };