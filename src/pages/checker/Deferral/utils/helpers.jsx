import React from "react";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import UniformTag from "../../../../components/common/UniformTag";
import { formatCommentTimestamp } from "../../../../utils/checklistUtils";

// Helper function to get role tag with color
export const getRoleTag = (role) => {
  let color = "blue";
  const roleLower = (role || "").toLowerCase();
  switch (roleLower) {
    case "rm":
      color = "blue";
      break;
    case "deferral management":
      color = "green";
      break;
    case "creator":
      color = "green";
      break;
    case "cocreator":
      color = "green";
      break;
    case "co creator":
      color = "green";
      break;
    case "co-creator":
      color = "green";
      break;
    case "co_checker":
      color = "volcano";
      break;
    case "checker":
      color = "volcano";
      break;
    case "system":
      color = "default";
      break;
    default:
      color = "blue";
  }
  return (
    <UniformTag
      color={color}
      text={roleLower.replace(/_/g, " ")}
      uppercase
      maxChars={14}
      style={{ marginLeft: 8 }}
    />
  );
};

// Helper function to remove role from username in brackets
export const formatUsername = (username) => {
  if (!username) return "System";
  return username.replace(/\s*\([^)]*\)\s*$/, "").trim();
};

// Extract rework reason from complex nested deferral data
export const getReturnedForReworkReason = (deferral) => {
  if (!deferral) return "";

  const directReason =
    deferral.returnReason || deferral.reworkReason || deferral.reworkComment;

  if (typeof directReason === "string" && directReason.trim()) {
    return directReason.trim();
  }

  const rawReworkComments = deferral.reworkComments;
  if (typeof rawReworkComments === "string" && rawReworkComments.trim()) {
    try {
      const parsed = JSON.parse(rawReworkComments);
      if (
        parsed &&
        typeof parsed.reworkComment === "string" &&
        parsed.reworkComment.trim()
      ) {
        return parsed.reworkComment.trim();
      }
    } catch {
      return rawReworkComments.trim();
    }
  }

  if (rawReworkComments && typeof rawReworkComments === "object") {
    const objectReason = rawReworkComments.reworkComment;
    if (typeof objectReason === "string" && objectReason.trim()) {
      return objectReason.trim();
    }
  }

  if (Array.isArray(deferral.comments) && deferral.comments.length > 0) {
    const rolePriority = [
      "creator",
      "cocreator",
      "co_creator",
      "checker",
      "cochecker",
      "co_checker",
    ];
    const normalizedRole = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();
    const hasPreferredRole = (role) =>
      rolePriority.includes(normalizedRole(role));

    const preferredComment = [...deferral.comments]
      .reverse()
      .find((comment) => {
        const role =
          comment?.author?.role || comment?.authorRole || comment?.role;
        const text = comment?.text || comment?.comment;
        return (
          hasPreferredRole(role) && typeof text === "string" && text.trim()
        );
      });

    if (preferredComment) {
      return (preferredComment.text || preferredComment.comment || "").trim();
    }

    const latestComment = [...deferral.comments].reverse().find((comment) => {
      const text = comment?.text || comment?.comment;
      return typeof text === "string" && text.trim();
    });

    if (latestComment) {
      return (latestComment.text || latestComment.comment || "").trim();
    }
  }

  return "";
};

// Get file extension type for icon display
export const getFileExtension = (filename) => {
  if (!filename) return "other";

  const ext = ((filename || "").split(".").pop() || "").toLowerCase();

  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "image";

  return "other";
};

// Normalize document key for comparison
export const normalizeDocKey = (value) => {
  if (!value) return "";
  return String(value).toLowerCase().trim();
};

// Parse document section from URL
export const getDocumentSectionFromUrl = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const section = params.get("documentSection");
  return section ? decodeURIComponent(section) : null;
};

// Strip document section marker from URL
export const stripDocumentSectionMarker = (url) => {
  if (!url) return url;
  const params = new URLSearchParams(url);
  params.delete("documentSection");
  return params.toString() ? `?${params.toString()}` : "";
};

// Extract document target from URL
export const getDocumentTargetFromUrl = () => {
  if (typeof window === "undefined") return null;
  const documentSection = getDocumentSectionFromUrl();
  if (!documentSection) return null;

  const match = documentSection.match(/^([^|]*)\|/);
  return match ? match[1] : null;
};

// Format timestamp for display
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  return formatCommentTimestamp(timestamp);
};

// Check if deferral can be approved by checker
export const canApproveDeferral = (
  deferral,
  userId = null,
  userRole = null,
) => {
  if (!deferral) return false;

  const hasCreatorApproved = deferral.creatorApprovalStatus === "approved";
  const hasCheckerApproved = deferral.checkerApprovalStatus === "approved";
  const allApproversApproved = deferral.allApproversApproved === true;

  // Get current user info if not provided
  if (!userId || !userRole) {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    userId = userId || currentUser._id || currentUser.user?._id;
    userRole = userRole || currentUser.role || currentUser.user?.role;
  }

  // Checker can approve if: all approvers approved AND creator approved
  if (
    userRole === "checker" &&
    allApproversApproved &&
    hasCreatorApproved &&
    !hasCheckerApproved
  ) {
    return true;
  }

  // If explicit checker assignment, use that
  const isChecker =
    deferral.checker &&
    (deferral.checker._id === userId || deferral.checker === userId);

  if (isChecker) {
    return allApproversApproved && hasCreatorApproved && !hasCheckerApproved;
  }

  return false;
};

// Pick primary DCL with scoring logic
export const pickPrimaryDcl = (checklists = []) => {
  if (!Array.isArray(checklists) || checklists.length === 0) return null;

  return checklists.reduce((best, current) => {
    if (!best) return current;

    // Score: (1) has dclNumber, (2) non-empty deferralDocuments, (3) recent createdAt
    const bestScore =
      (best.dclNumber ? 100 : 0) +
      (Array.isArray(best.deferralDocuments) && best.deferralDocuments.length
        ? 50
        : 0) +
      (best.createdAt ? dayjs(best.createdAt).unix() : 0);

    const currentScore =
      (current.dclNumber ? 100 : 0) +
      (Array.isArray(current.deferralDocuments) &&
      current.deferralDocuments.length
        ? 50
        : 0) +
      (current.createdAt ? dayjs(current.createdAt).unix() : 0);

    return currentScore > bestScore ? current : best;
  });
};

// Get approver stats for display
export const getApproverStats = (approversFlow = []) => {
  if (!Array.isArray(approversFlow)) {
    return { total: 0, approved: 0, pending: 0, rejected: 0 };
  }

  const total = approversFlow.length;
  let approved = 0;
  let rejected = 0;

  approversFlow.forEach((approver) => {
    const status = (
      approver?.status ||
      approver?.approvalStatus ||
      ""
    ).toLowerCase();
    if (status === "approved") {
      approved++;
    } else if (status === "rejected" || status === "returned_for_rework") {
      rejected++;
    }
  });

  const pending = total - approved - rejected;

  return { total, approved, pending, rejected };
};

// Get all documents aggregated from multiple sources
export const getAllDocuments = (deferral = {}) => {
  const documents = [];

  // From deferralDocuments
  if (Array.isArray(deferral.deferralDocuments)) {
    documents.push(...deferral.deferralDocuments);
  }

  // From documents array
  if (Array.isArray(deferral.documents)) {
    documents.push(...deferral.documents);
  }

  // From nested facility documents
  if (Array.isArray(deferral.facilities)) {
    deferral.facilities.forEach((facility) => {
      if (Array.isArray(facility.documents)) {
        documents.push(
          ...facility.documents.map((doc) => ({
            ...doc,
            facilityId: facility._id,
            facilityName: facility.facilityName,
          })),
        );
      }
    });
  }

  return documents;
};
