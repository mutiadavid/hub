
// src/utils/checklistConstants.js
import dayjs from "dayjs";
import { API_ORIGIN } from "../config/runtimeConfig";

// Theme Colors
export const PRIMARY_BLUE = "#164679";
export const ACCENT_LIME = "#b5d334";
export const SECONDARY_PURPLE = "#7e6496";

// API Base URL
export const API_BASE_URL = API_ORIGIN;

// Helper function to get role tag - RETURN OBJECT instead of JSX
export const getRoleTag = (role) => {
  let color = "blue";
  const roleLower = (role || "").toLowerCase();
  switch (roleLower) {
    case "rm":
      color = "purple";
      break;
    case "creator":
      color = "green";
      break;
    case "co_checker":
      color = "volcano";
      break;
    case "system":
      color = "default";
      break;
    default:
      color = "blue";
  }
  
  // Return plain object, not JSX
  return {
    color,
    text: roleLower.replace(/_/g, " "),
    style: { marginLeft: 8, textTransform: "uppercase" }
  };
};

// Helper function to get checker status display
export const getCheckerStatusDisplay = (checkerStatus, checklistStatus) => {
  const normalizedChecklistStatus = String(checklistStatus || "")
    .trim()
    .toLowerCase();
  const normalizedCheckerStatus = String(checkerStatus || "")
    .trim()
    .toLowerCase();

  if (["approved", "completed", "approvedandcompleted"].includes(normalizedChecklistStatus)) {
    return {
      color: "green",
      text: "Approved",
      tagColor: "#52c41a",
    };
  }

  if (
    normalizedChecklistStatus === "rejected" ||
    normalizedChecklistStatus === "co_creator_review" ||
    normalizedChecklistStatus === "cocreatorreview" ||
    normalizedChecklistStatus.includes("returned to co-creator") ||
    normalizedChecklistStatus.includes("returned_to_co_creator") ||
    normalizedChecklistStatus.includes("returned")
  ) {
    return {
      color: "red",
      text: "Returned to Creator",
      tagColor: "#f5222d",
    };
  }

  if (!checkerStatus) {
    return {
      color: "orange",
      text: "Pending Review",
      tagColor: "#fa8c16",
    };
  }

  switch (normalizedCheckerStatus) {
    case "approved":
      return {
        color: "green",
        text: "Approved",
        tagColor: "#52c41a",
      };
    case "rejected":
      return {
        color: "red",
        text: "Rejected",
        tagColor: "#f5222d",
      };
    case "co_creator_review":
    case "cocreatorreview":
    case "returned":
    case "returned_to_creator":
      return {
        color: "red",
        text: "Returned to Creator",
        tagColor: "#f5222d",
      };
    case "pending":
      return {
        color: "orange",
        text: "Pending Review",
        tagColor: "#fa8c16",
      };
    case "reviewed":
      return {
        color: "blue",
        text: "Reviewed",
        tagColor: "#1890ff",
      };
    case "deferred":
      return {
        color: "warning",
        text: "Deferred",
        tagColor: "#FAAD14",
      };
    default:
      return {
        color: "default",
        text: checkerStatus,
        tagColor: "#d9d9d9",
      };
  }
};

// Function to get expiry status
export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");
  return expiry.isBefore(today) ? "expired" : "current";
};

// Helper function to get document status count
export const getDocumentStatusCounts = (docs) => {
  const counts = {
    submitted: 0,
    waived: 0,
    deferred: 0,
    sighted: 0,
    tbo: 0,
    pendingrm: 0,
    pendingco: 0,
    approved: 0,
    total: docs.length,
  };

  docs.forEach((doc) => {
    const status = (doc.status || doc.action || "").toLowerCase().trim();

    if (status === "submitted") {
      counts.submitted++;
    } else if (status === "waived") {
      counts.waived++;
    } else if (status === "deferred") {
      counts.deferred++;
    } else if (status === "sighted") {
      counts.sighted++;
    } else if (status === "tbo") {
      counts.tbo++;
    } else if (status === "approved") {
      counts.approved++;
    } else if (status === "pendingrm") {
      counts.pendingrm++;
    } else if (status === "pendingco") {
      counts.pendingco++;
    } else if (status === "pending") {
      if (doc.category && doc.category.toLowerCase().includes("rm")) {
        counts.pendingrm++;
      } else {
        counts.pendingco++;
      }
    }
  });

  counts.pending = counts.pendingrm + counts.pendingco;
  counts.completed = counts.total - counts.pending;
  return counts;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};