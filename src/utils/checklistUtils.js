/**
 * Shared utility functions for checklist modals
 * Follows DRY principle by centralizing common logic
 */
import dayjs from "dayjs";
import { API_ORIGIN } from "../config/runtimeConfig";

const KENYA_TIMEZONE = "Africa/Nairobi";

const ISO_WITHOUT_TIMEZONE_REGEX =
    /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

export const normalizeBackendDate = (date) => {
    if (!date) return null;

    if (date instanceof Date) {
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof date === "number") {
        const parsedDate = new Date(date);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    if (typeof date === "string") {
        const trimmedDate = date.trim();
        if (!trimmedDate) return null;

        const normalizedInput = ISO_WITHOUT_TIMEZONE_REGEX.test(trimmedDate)
            ? `${trimmedDate.replace(" ", "T")}Z`
            : trimmedDate;

        const parsedDate = new Date(normalizedInput);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// API Base URL constant
export const API_BASE_URL = API_ORIGIN;

/**
 * Format date cleanly without unnecessary numbers
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (e.g., "16 Feb 2026")
 */
export const formatDate = (date) => {
    if (!date) return "";
    const normalizedDate = normalizeBackendDate(date);
    if (!normalizedDate) return "";
    return dayjs(normalizedDate).format("D MMM YYYY");
};

/**
 * Format date with time in clean format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date with time (e.g., "16 Feb 2026 14:30")
 */
export const formatDateTime = (date) => {
    if (!date) return "";
    const dateObj = normalizeBackendDate(date);

    // Check if the date is valid
    if (!dateObj) return "";

    return formatKenyaDateTime(dateObj);
};

export const formatKenyaDateTime = (date, options = {}) => {
    if (!date) return "";
    const dateObj = normalizeBackendDate(date);
    if (!dateObj) return "";

    const {
        includeSeconds = false,
        hour12 = false,
        includeTimezone = false,
    } = options;

    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: KENYA_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        hour12,
        timeZoneName: includeTimezone ? 'short' : undefined,
    });

    const parts = formatter.formatToParts(dateObj);
    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    const second = parts.find(p => p.type === 'second')?.value || '';
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || '';
    const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || '';

    const timeValue = includeSeconds
        ? `${hour}:${minute}:${second}`
        : `${hour}:${minute}`;

    const suffix = [hour12 && dayPeriod ? dayPeriod.toUpperCase() : '', includeTimezone && timeZoneName ? timeZoneName : '']
        .filter(Boolean)
        .join(' ');

    return `${day} ${month} ${year} ${timeValue}${suffix ? ` ${suffix}` : ''}`;
};

export const formatDateTimeDetailed = (date) =>
    formatKenyaDateTime(date, { includeSeconds: true, includeTimezone: true });

export const formatCommentTimestamp = (date) => {
    const normalizedDate = normalizeBackendDate(date);
    if (!normalizedDate) return "";
    return formatKenyaDateTime(normalizedDate, { hour12: true });
};

const CHECKLIST_FORWARD_LOG_PATTERNS = [
    /submitted to rm/i,
    /submitted to co-?checker/i,
    /submitted for your review/i,
    /submitted for your approval/i,
    /submitted back to co-creator/i,
    /returned to co-creator/i,
    /sent to .*review/i,
    /sent for approval/i,
];

const CHECKLIST_COMPLETION_LOG_PATTERNS = [
    /approved by co-?checker/i,
    /approved by co-creator/i,
    /checklist approved/i,
    /fully approved/i,
    /completed/i,
    /final approval/i,
];

const CHECKLIST_FINAL_STATUSES = new Set(["approved", "completed"]);

const getChecklistLogs = (checklist) => {
    const rawLogs = checklist?.logs || checklist?.Logs || [];

    if (!Array.isArray(rawLogs)) {
        return [];
    }

    return rawLogs
        .map((entry) => ({
            message: entry?.message || entry?.Message || "",
            timestamp: normalizeBackendDate(entry?.timestamp || entry?.Timestamp || entry?.createdAt || entry?.CreatedAt),
        }))
        .filter((entry) => entry.timestamp)
        .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
};

export const formatElapsedDuration = (startDate, endDate = new Date()) => {
    const start = normalizeBackendDate(startDate);
    const end = normalizeBackendDate(endDate);

    if (!start || !end) return "Not available";

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "Not available";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `${minutes}m`;
    }

    return "Under 1 min";
};

export const getChecklistTimingMetrics = (checklist) => {
    const createdAt = normalizeBackendDate(checklist?.createdAt);
    const updatedAt = normalizeBackendDate(checklist?.updatedAt);
    const completedAt = normalizeBackendDate(checklist?.completedAt);
    const logs = getChecklistLogs(checklist);
    const normalizedStatus = String(checklist?.status || "").trim().toLowerCase();
    const isFinalStatus = CHECKLIST_FINAL_STATUSES.has(normalizedStatus);

    const firstForwardLog = logs.find((entry) =>
        CHECKLIST_FORWARD_LOG_PATTERNS.some((pattern) => pattern.test(entry.message || "")),
    );

    const lastCompletionLog = [...logs]
        .reverse()
        .find((entry) =>
            CHECKLIST_COMPLETION_LOG_PATTERNS.some((pattern) => pattern.test(entry.message || "")),
        );

    const queueExitAt = firstForwardLog?.timestamp || (createdAt && updatedAt && updatedAt > createdAt ? updatedAt : null);
    const latestLogAt = logs.length ? logs[logs.length - 1].timestamp : null;
    const workflowCompletedAt = completedAt || lastCompletionLog?.timestamp || (isFinalStatus ? updatedAt : null);
    const workflowReferenceEnd = workflowCompletedAt || latestLogAt || updatedAt || new Date();

    return {
        createdAt,
        createdAtLabel: createdAt ? formatDateTime(createdAt) : "Not available",
        queueDurationLabel:
            createdAt && queueExitAt
                ? formatElapsedDuration(createdAt, queueExitAt)
                : "Not available",
        lifecycleDurationLabel:
            createdAt && workflowReferenceEnd
                ? `${formatElapsedDuration(createdAt, workflowReferenceEnd)}${workflowCompletedAt ? "" : " (in progress)"}`
                : "Not available",
    };
};

/**
 * Format time only
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatTime = (date) => {
    if (!date) return "";
    const normalizedDate = normalizeBackendDate(date);
    if (!normalizedDate) return "";
    return dayjs(normalizedDate).format("h:mm A");
};

/**
 * Format date for table display (relative or absolute)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (e.g., "16 Feb")
 */
export const formatDateShort = (date) => {
    if (!date) return "";
    const normalizedDate = normalizeBackendDate(date);
    if (!normalizedDate) return "";
    return dayjs(normalizedDate).format("D MMM");
};

// Theme colors
export const THEME = {
    PRIMARY_BLUE: "#164679",
    ACCENT_LIME: "#b5d334",
    SECONDARY_PURPLE: "#7e6496",
    GREEN: "#52c41a",
    RED: "#f5222d",
    ORANGE: "#fa8c16",
    GOLD: "#faad14",
};

/**
 * Constructs full URL from partial path
 * @param {string} url - The URL or path to process
 * @returns {string} Full URL
 */
export const getFullUrl = (url) => {
    const normalizedUrl = String(url || "").trim();
    if (!normalizedUrl) return "";
    if (
        normalizedUrl.startsWith("http") ||
        normalizedUrl.startsWith("blob:") ||
        normalizedUrl.startsWith("data:")
    ) {
        return normalizedUrl;
    }

    return `${API_ORIGIN}${normalizedUrl.startsWith("/") ? "" : "/"}${normalizedUrl}`;
};

/**
 * Calculate expiry status for a document
 * @param {string|Date} expiryDate - The document's expiry date
 * @returns {{ status: string, color: string, isExpired: boolean }}
 */
export const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: "N/A", color: "default", isExpired: false };
    const isExpired = dayjs(expiryDate).isBefore(dayjs());
    return isExpired
        ? { status: "Expired", color: "red", isExpired: true }
        : { status: "Current", color: "green", isExpired: false };
};

/**
 * Get color configuration for a given status
 * @param {string} status - Document status
 * @returns {{ color: string, bgColor: string, label: string }}
 */
export const getStatusConfig = (status) => {
    const statusLower = (status || "").toLowerCase().replace(/\s+/g, "_");

    // Consistent color codes matching user specification
    const RED = "red";          // #FF4D4F - PendingRM, PendingCo (awaiting action)
    const GREEN = "green";      // #52c41a - Approved, Submitted, Sighted (success)
    const AMBER = "warning";    // #FAAD14 - Deferred, Waived, TBO (needs attention)
    const DEFAULT = "default";  // #d9d9d9 - Draft

    const configs = {
        // Commission/Approval statuses - GREEN (Success)
        approved: { color: GREEN, bgColor: "#f6ffed", label: "Approved" },
        submitted: { color: GREEN, bgColor: "#f6ffed", label: "Submitted" },              
        submitted_for_review: { color: GREEN, bgColor: "#f6ffed", label: "Submitted for Review" },
        
        // Pending statuses - RED (Awaiting action)
        pending: { color: RED, bgColor: "#ffebe6", label: "Pending" },
        pending_from_customer: { color: RED, bgColor: "#ffebe6", label: "Pending from Customer" },
        pendingrm: { color: RED, bgColor: "#ffebe6", label: "Pending RM" },
        pendingco: { color: RED, bgColor: "#ffebe6", label: "Pending Co" },
        
        // Document review/sighting statuses - GREEN (Success)
        sighted: { color: GREEN, bgColor: "#f6ffed", label: "Sighted" },                  
        tbo: { color: AMBER, bgColor: "#fffbe6", label: "TBO" },                        
        
        // Rejection/Deferral
        rejected: { color: RED, bgColor: "#ffebe6", label: "Rejected" },
        deferred: { color: AMBER, bgColor: "#fffbe6", label: "Deferred" },
        defferal_requested: { color: AMBER, bgColor: "#fffbe6", label: "Deferral Requested" },
        
        // Miscellaneous
        waived: { color: AMBER, bgColor: "#fffbe6", label: "Waived" },
        expired: { color: RED, bgColor: "#ffebe6", label: "Expired" },
        current: { color: GREEN, bgColor: "#f6ffed", label: "Current" },
        
        // Review stages (using same color scheme)
        co_review: { color: RED, bgColor: "#ffebe6", label: "Co Review" },
        rm_review: { color: RED, bgColor: "#ffebe6", label: "RM Review" },
        co_checker_review: { color: RED, bgColor: "#ffebe6", label: "Co-Checker Review" },
        
        // Completion statuses
        completed: { color: GREEN, bgColor: "#f6ffed", label: "Completed" },
        draft: { color: DEFAULT, bgColor: "#fafafa", label: "Draft" },
    };

    return configs[statusLower] || { color: DEFAULT, bgColor: "#fafafa", label: status || "Unknown" };
};

/**
 * Calculate document statistics from a flat document array
 * @param {Array} docs - Flat array of documents
 * @returns {{ total: number, submitted: number, pending: number, approved: number, rejected: number, deferred: number, waived: number, tbo: number, sighted: number }}
 */
export const calculateDocumentStats = (docs = []) => {
    const stats = {
        total: docs.length,
        submitted: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        deferred: 0,
        waived: 0,
        tbo: 0,
        sighted: 0,
        pendingRm: 0,
        pendingCo: 0,
    };

    docs.forEach((doc) => {
        const status = (doc.action || doc.status || "pending").toLowerCase();
        switch (status) {
            case "submitted":
            case "submitted_for_review":
                stats.submitted++;
                break;
            case "approved":
                stats.approved++;
                break;
            case "pending":
                stats.pending++;
                break;
            case "pendingrm":
            case "pending_from_customer":
                stats.pendingRm++;
                break;
            case "pendingco":
                stats.pendingCo++;
                break;
            case "rejected":
                stats.rejected++;
                break;
            case "deferred":
            case "defferal_requested":
                stats.deferred++;
                break;
            case "waived":
                stats.waived++;
                break;
            case "tbo":
                stats.tbo++;
                break;
            case "sighted":
                stats.sighted++;
                break;
            default:
                stats.pending++;
        }
    });

    return stats;
};

/**
 * Format file size in bytes to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} 
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Flatten nested documents structure to flat array
 * @param {Array} documents - Nested documents array [{ category, docList: [...] }]
 * @returns {Array} Flat array of documents with category property
 */
export const flattenDocuments = (documents = []) => {
    const flatDocs = [];
    documents.forEach((cat) => {
        (cat.docList || []).forEach((doc, idx) => {
            flatDocs.push({
                ...doc,
                category: cat.category,
                docIdx: flatDocs.length,
                originalStatus: doc.status,
                action: doc.action || doc.status || "pending",
                comment: doc.comment || "",
            });
        });
    });
    return flatDocs;
};

/**
 * Convert flat documents array back to nested structure
 * @param {Array} flatDocs - Flat array of documents
 * @returns {Array} Nested documents array [{ category, docList: [...] }]
 */
export const nestDocuments = (flatDocs = []) => {
    return flatDocs.reduce((acc, doc) => {
        let categoryGroup = acc.find((c) => c.category === doc.category);
        if (!categoryGroup) {
            categoryGroup = { category: doc.category, docList: [] };
            acc.push(categoryGroup);
        }
        const { category, docIdx, originalStatus, ...docData } = doc;
        categoryGroup.docList.push(docData);
        return acc;
    }, []);
};

/**
 * Custom styles for checklist modals
 * @returns {string} CSS styles
 */
export const getModalStyles = () => `
  .ant-modal-header {
      background-color: ${THEME.PRIMARY_BLUE} !important;
      padding: 18px 24px !important;
  }
  .ant-modal-title {
      color: white !important;
      font-size: 1.15rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.5px;
  }
  .ant-modal-close-x { color: white !important; }

  .checklist-info-card .ant-card-head {
    border-bottom: 2px solid ${THEME.ACCENT_LIME} !important;
  }
  .checklist-info-card .ant-descriptions-item-label {
      font-weight: 600 !important;
      color: ${THEME.SECONDARY_PURPLE} !important;
  }
  .checklist-info-card .ant-descriptions-item-content {
      color: ${THEME.PRIMARY_BLUE} !important;
      font-weight: 700 !important;
  }

  .doc-table.ant-table-wrapper table {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }
  .doc-table .ant-table-thead > tr > th {
      background-color: #f7f9fc !important;
      color: ${THEME.PRIMARY_BLUE} !important;
      font-weight: 600 !important;
      padding: 12px 16px !important;
  }
  .doc-table .ant-table-tbody > tr > td {
      padding: 10px 16px !important;
      border-bottom: 1px dashed #f0f0f0 !important;
  }

  .status-tag {
    font-weight: 700 !important;
    border-radius: 999px !important;
    padding: 3px 4px !important;
    text-transform: capitalize;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    justify-content: center;
    min-width: 80px;
  }
`;

/**
 * Get unique categories from documents
 * @param {Array} docs - Flat array of documents
 * @returns {Array<string>} Unique category names
 */
export const getUniqueCategories = (docs = []) => {
    return [...new Set(docs.map((d) => d.category).filter(Boolean))];
};

/**
 * Validate file type for upload
 * @param {File} file - File object
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {boolean} Whether file type is valid
 */
export const isValidFileType = (file, allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]) => {
    return allowedTypes.includes(file.type);
};

/**
 * Validate file size for upload
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {boolean} Whether file size is valid
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
    return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Check if RM actions are allowed for a document
 * @param {Object} doc - Document object
 * @returns {boolean} Whether actions are allowed
 */
export const canRmActOnDoc = (doc) => {
    const status = (doc?.status || "").toLowerCase();
    const allowedStatuses = ["pendingrm", "submitted", "pending", "pending_from_customer"];
    return allowedStatuses.includes(status);
};

/**
 * Check if Co-Creator actions are allowed for a document
 * @param {Object} doc - Document object
 * @returns {boolean} Whether actions are allowed
 */
export const canCoCreatorActOnDoc = (doc) => {
    const status = (doc?.status || "").toLowerCase();
    const allowedStatuses = ["pendingco", "pending", "submitted", "pendingrm"];
    return allowedStatuses.includes(status);
};

/**
 * Check if Checker actions are allowed for a document
 * @param {Object} doc - Document object
 * @returns {boolean} Whether actions are allowed
 */
export const canCheckerActOnDoc = (doc) => {
    const status = (doc?.status || "").toLowerCase();
    const checkerStatus = (doc?.checkerStatus || "").toLowerCase();
    // Checker can act if document is submitted and not yet approved/rejected by checker
    return status === "submitted" && checkerStatus !== "approved" && checkerStatus !== "rejected";
};
