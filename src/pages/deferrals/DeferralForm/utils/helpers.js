import dayjs from "dayjs";
import {
  LOAN_THRESHOLD,
  APPROVER_MATRIX,
  LOAN_TYPE_MAP,
  ALLOWED_FILE_TYPES,
} from "./constants";

/**
 * Parse loan amount from string or predefined dropdown values
 */
export const parseLoanAmount = (loanAmount) => {
  if (!loanAmount) return 0;
  try {
    const loanStr = String(loanAmount).toLowerCase().trim();

    if (loanStr === "above75") return 76000000;
    if (loanStr === "below75") return 74000000;

    const normalized = loanStr.replace(/[^0-9.-]+/g, "");
    return parseFloat(normalized) || 0;
  } catch (e) {
    return 0;
  }
};

/**
 * Format loan type for display
 */
export const formatLoanType = (loanType) => {
  if (!loanType) return "Not selected";
  return (
    LOAN_TYPE_MAP[loanType.toLowerCase()] ||
    loanType.charAt(0).toUpperCase() + loanType.slice(1)
  );
};

/**
 * Compute default approver roles based on document type and loan amount
 */
export const computeDefaultRoles = (selectedDocuments, loanAmount) => {
  // Guard against undefined or empty selectedDocuments
  if (!selectedDocuments || !Array.isArray(selectedDocuments) || selectedDocuments.length === 0) {
    return [];
  }

  const hasPrimary = selectedDocuments.some(
    (d) => String(d?.type || "").toLowerCase() === "primary"
  );
  const hasSecondary = selectedDocuments.some(
    (d) => String(d?.type || "").toLowerCase() === "secondary"
  );
  const isAboveThreshold = parseLoanAmount(loanAmount) > LOAN_THRESHOLD;

  if (hasPrimary) {
    return isAboveThreshold
      ? APPROVER_MATRIX.PRIMARY_ABOVE_THRESHOLD
      : APPROVER_MATRIX.PRIMARY_BELOW_THRESHOLD;
  }

  if (hasSecondary) {
    return isAboveThreshold
      ? APPROVER_MATRIX.SECONDARY_ABOVE_THRESHOLD
      : APPROVER_MATRIX.SECONDARY_BELOW_THRESHOLD;
  }

  return [];
};

/**
 * Determine document category based on selected documents
 */
export const getDocumentCategory = (selectedDocuments) => {
  return selectedDocuments.some((d) => d.type === "Primary")
    ? "Primary"
    : "Secondary";
};

/**
 * Normalize document type
 */
export const normalizeDocumentType = (doc, defaultCategory) => {
  const rawType = String(doc?.type || "")
    .trim()
    .toLowerCase();
  if (rawType === "primary") return "Primary";
  if (rawType === "secondary") return "Secondary";
  return defaultCategory === "Primary" ? "Primary" : "Secondary";
};

/**
 * Validate file type
 */
export const isValidFileType = (fileName) => {
  const fileExtension = "." + fileName.split(".").pop().toLowerCase();
  return ALLOWED_FILE_TYPES.includes(fileExtension);
};

/**
 * Compute facilities by normalizing data
 */
export const normalizeFacilities = (facilities) => {
  return (facilities || []).map((facility) => ({
    type: facility?.type || facility?.facilityType || facility?.name || "",
    sanctioned: Number(facility?.sanctioned ?? facility?.amount ?? 0) || 0,
    balance: Number(facility?.balance ?? 0) || 0,
    headroom:
      Number(
        facility?.headroom ??
          Math.max(
            0,
            (Number(facility?.amount ?? facility?.sanctioned ?? 0) || 0) -
              (Number(facility?.balance ?? 0) || 0)
          )
      ) || 0,
  }));
};

/**
 * Validate approver IDs are valid GUIDs
 */
export const areApproverIdsValid = (approvers, guidRegex) => {
  return approvers.every((approver) =>
    guidRegex.test(String(approver.userId || ""))
  );
};

/**
 * Check if approver roles match required matrix
 */
export const validateApproverSequence = (selectedRoles, expectedRoles) => {
  const normalizedExpectedRoles = expectedRoles.map((role) =>
    String(role || "")
      .trim()
      .toLowerCase()
  );
  const normalizedSelectedRoles = selectedRoles.map((role) =>
    String(role || "")
      .trim()
      .toLowerCase()
  );

  if (normalizedSelectedRoles.length < normalizedExpectedRoles.length) {
    return { valid: false, message: "Not enough approvers assigned" };
  }

  const firstRoleMismatch =
    normalizedSelectedRoles[0] !== normalizedExpectedRoles[0];
  const lastRoleMismatch =
    normalizedSelectedRoles[normalizedSelectedRoles.length - 1] !==
    normalizedExpectedRoles[normalizedExpectedRoles.length - 1];

  if (firstRoleMismatch || lastRoleMismatch) {
    return {
      valid: false,
      message: "First and final approvers must match the required approval matrix",
    };
  }

  let expectedIndex = 0;
  for (const role of normalizedSelectedRoles) {
    if (role === normalizedExpectedRoles[expectedIndex]) {
      expectedIndex += 1;
    }
    if (expectedIndex >= normalizedExpectedRoles.length) break;
  }

  if (expectedIndex < normalizedExpectedRoles.length) {
    return {
      valid: false,
      message: "Required approval matrix order must be preserved",
    };
  }

  return { valid: true };
};

/**
 * Check for duplicate approvers
 */
export const hasDuplicateApprovers = (approvers) => {
  const ids = approvers
    .filter((a) => a.userId)
    .map((a) => String(a.userId));
  return new Set(ids).size !== ids.length;
};

/**
 * Format a date for display
 */
export const formatDate = (date, format = "DD MMM YYYY") => {
  return dayjs(date).format(format);
};

/**
 * Get current date and time formatted
 */
export const getCurrentDateTime = () => {
  return {
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};
