import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  DownloadOutlined,
  FilterOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useGetAuditLogsQuery, useGetAuditLogStatsQuery } from "../../api/auditApi";
import { useGetUsersQuery } from "../../api/userApi";
import "../../styles/creatorDesignSystem.css";

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const COMMON_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "RETURN",
  "AD_SEARCH",
  "CREATE_USER",
  "TOGGLE_ACTIVE",
  "CHANGE_ROLE",
  "REASSIGN_TASKS",
  "CREATE_DCL",
  "UPDATE_DCL",
  "DELETE_DCL",
  "CREATE_DEFERRAL",
  "UPDATE_DEFERRAL",
  "UPLOAD_DOCUMENT",
  "DELETE_DOCUMENT",
  "ADD_COMMENT",
];

const COMMON_ENTITIES = [
  "User",
  "Checklist",
  "Deferral",
  "Document",
  "Auth",
  "Notification",
  "Role",
  "Session",
];

const ACTION_STYLES = {
  CREATE: { background: "#e7f6ec", color: "#166534", borderColor: "#bbf7d0" },
  UPDATE: { background: "#ebf5ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
  APPROVE: { background: "#ecfdf3", color: "#15803d", borderColor: "#86efac" },
  REJECT: { background: "#fff1f2", color: "#b91c1c", borderColor: "#fecdd3" },
  DELETE: { background: "#fff1f2", color: "#9f1239", borderColor: "#fda4af" },
  LOGIN: { background: "#e0f2fe", color: "#075985", borderColor: "#7dd3fc" },
  LOGOUT: { background: "#f3f4f6", color: "#4b5563", borderColor: "#d1d5db" },
  RETURN: { background: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" },
  SEARCH: { background: "#f8fafc", color: "#475569", borderColor: "#cbd5e1" },
  OTHER: { background: "#f5f5f4", color: "#57534e", borderColor: "#d6d3d1" },
};

const ROLE_STYLES = {
  Admin: { background: "#fff1f2", color: "#9f1239", borderColor: "#fecdd3" },
  RM: { background: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" },
  Approver: { background: "#eefbf3", color: "#166534", borderColor: "#bbf7d0" },
  CoCreator: { background: "#ecfeff", color: "#155e75", borderColor: "#a5f3fc" },
  CoChecker: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
  Customer: { background: "#f5f3ff", color: "#6d28d9", borderColor: "#ddd6fe" },
  System: { background: "#f4f4f5", color: "#3f3f46", borderColor: "#d4d4d8" },
};

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );

const parseJsonSafely = (value) => {
  if (!value || typeof value !== "string") return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const titleize = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());

/**
 * Converts an email address into a human-readable name.
 * e.g. "tabitha.mwangi@ncbagroup.com" → "Tabitha Mwangi"
 * Plain names are returned as-is.
 */
const humanizeName = (raw) => {
  if (!raw || raw === "System") return raw || "System";
  const s = String(raw).trim();
  // Looks like an email – take only the local part
  const local = s.includes("@") ? s.split("@")[0] : s;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)                           // at most two words (first + last)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const formatRole = (role) => {
  const normalized = String(role || "System").trim().toLowerCase();
  const roleMap = {
    admin: "Admin",
    rm: "RM",
    approver: "Approver",
    cocreator: "CoCreator",
    cochecker: "CoChecker",
    customer: "Customer",
    system: "System",
  };

  return roleMap[normalized] || titleize(normalized);
};

const normalizeEntity = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return "System";
  if (["checklist", "dcl"].includes(normalized)) return "DCL";
  if (normalized === "deferral") return "Deferral";
  if (normalized === "user") return "User";
  if (["document", "file", "upload"].includes(normalized)) return "Document";
  if (["auth", "authentication", "login"].includes(normalized)) return "Authentication";
  if (["notification", "email"].includes(normalized)) return "Notification";
  if (normalized === "role") return "Role";
  if (normalized === "session") return "Session";

  return titleize(normalized);
};

const getActionCategory = (action, httpMethod) => {
  const normalized = String(action || httpMethod || "OTHER").trim().toUpperCase();

  // Use negative-lookahead so "APPROVER" (a person) does NOT trigger the APPROVE category.
  // e.g. UPDATE_DEFERRAL_APPROVER_FLOW → UPDATE, not APPROVE.
  if (/APPROVE(?!R)/.test(normalized)) return "APPROVE";
  if (normalized.includes("REJECT")) return "REJECT";
  if (normalized.includes("DELETE") || normalized.includes("ARCHIVE")) return "DELETE";
  if (normalized.includes("LOGIN") || normalized.includes("SIGN_IN")) return "LOGIN";
  if (normalized.includes("LOGOUT") || normalized.includes("SIGN_OUT")) return "LOGOUT";
  if (normalized.includes("RETURN")) return "RETURN";
  if (normalized.includes("SEARCH") || normalized.includes("QUERY")) return "SEARCH";
  if (
    normalized === "POST" ||
    normalized.includes("CREATE") ||
    normalized.includes("UPLOAD") ||
    normalized.includes("ADD_")
  ) {
    return "CREATE";
  }

  if (
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized.includes("UPDATE") ||
    normalized.includes("CHANGE") ||
    normalized.includes("TOGGLE") ||
    normalized.includes("REASSIGN")
  ) {
    return "UPDATE";
  }

  return normalized || "OTHER";
};

const getActionLabel = (action, httpMethod) => titleize(action || httpMethod || "Other");

const actionPhrase = (actionCategory) => {
  switch (actionCategory) {
    case "CREATE":
      return "created";
    case "UPDATE":
      return "updated";
    case "APPROVE":
      return "approved";
    case "REJECT":
      return "rejected";
    case "DELETE":
      return "deleted";
    case "LOGIN":
      return "logged in to";
    case "LOGOUT":
      return "logged out of";
    case "RETURN":
      return "returned";
    case "SEARCH":
      return "searched";
    default:
      return "performed";
  }
};

const findCandidateValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;

  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined || value === "") continue;

    const normalizedKey = key.toLowerCase();
    if (keys.some((candidate) => normalizedKey === candidate || normalizedKey.endsWith(`.${candidate}`))) {
      return value;
    }

    if (typeof value === "object") {
      const nested = findCandidateValue(value, keys);
      if (nested !== null && nested !== undefined && nested !== "") {
        return nested;
      }
    }
  }

  return null;
};

const extractReferenceNumber = (log, entityLabel) => {
  const metadata = parseJsonSafely(log.metadataJson);
  const oldValues = parseJsonSafely(log.oldValuesJson);
  const newValues = parseJsonSafely(log.newValuesJson);
  const keyCandidates = [
    "referencenumber",
    "reference",
    "deferralnumber",
    "dclnumber",
    "dclno",
    "checklistnumber",
    "number",
  ];

  const candidate =
    findCandidateValue(metadata, keyCandidates) ||
    findCandidateValue(newValues, keyCandidates) ||
    findCandidateValue(oldValues, keyCandidates);

  if (candidate && !isGuid(candidate)) {
    return String(candidate);
  }

  // Search the full details text for known reference number formats:
  // e.g. DEF-26-0019, DCL-25-001, (DEF-26-0019) etc.
  const detailText = `${log.details || ""} ${log.targetName || ""}`;
  const patterns = [
    // Explicit label prefix: "deferral DEF-26-009" or "Deferral Number: DEF-26-009"
    /\b(?:Deferral(?:\s+Number)?|DEFERRAL)[:\s#-]*([A-Z]{2,4}-\d{2}-\d{3,})\b/i,
    // Explicit label prefix: "DCL-26-009" / "DCL No. 26-009"
    /\b(?:DCL(?:\s+(?:No|Number))?|CHECKLIST)[:\s#-]*([A-Z]{2,4}-\d{2}-\d{3,})\b/i,
    // Bare reference anywhere: DEF-26-0019, DCL-25-001
    /\b((?:DEF|DCL|REF|CHK)-\d{2}-\d{3,})\b/i,
    // Parenthesised letter-dash reference: (DEF-26-0019)
    /\(([A-Z]{2,4}-\d{2}-\d{3,})\)/i,
    // Parenthesised year-based DCL/Deferral ref: (2026-0007) or (2026-0007 copy 1)
    /\((\d{4}-\d{4})(?:\s+copy\s+\d+)?\)/i,
    // Bare year-based ref in details text: 2026-0007, 2026-0010
    /\b(\d{4}-\d{4})\b/,
  ];

  for (const pattern of patterns) {
    const match = detailText.match(pattern);
    if (match?.[1] && !isGuid(match[1])) {
      return match[1].toUpperCase();
    }
  }

  // For Deferral/DCL: only use resourceId if it's not a GUID — never use targetName (person)
  if (["DCL", "Deferral"].includes(entityLabel)) {
    if (log.resourceId && !isGuid(log.resourceId)) return String(log.resourceId);
  }

  return "-";
};

/**
 * Strips API endpoint noise from a description string.
 * Removes patterns like:
 *   - "POST /api/deferrals/... completed with status 201."
 *   - "GET /api/... with status 200"
 *   - GUIDs embedded in paths
 */
const sanitizeDescription = (text) => {
  if (!text) return text;
  return String(text)
    // Remove entire sentences/clauses that contain an API path
    .replace(/\.?\s*(?:GET|POST|PUT|PATCH|DELETE)\s+\/api\/[^.]+(?:completed\s+with\s+status\s+\d+)?\s*\.?/gi, "")
    // Remove any remaining standalone "completed with status NNN" fragment
    .replace(/\.?\s*completed\s+with\s+status\s+\d+\.?/gi, "")
    // Remove raw GUIDs
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "")
    // Collapse multiple spaces and leading/trailing whitespace
    .replace(/\s{2,}/g, " ")
    .trim();
};

const buildFullDescription = (log, normalized) => {
  const { userName, actionCategory, entityLabel, referenceNumber } = normalized;
  const isDeferralOrDCL = ["Deferral", "DCL"].includes(entityLabel);

  // ── Deferral / DCL ──────────────────────────────────────────────────────────
  // Build a clean sentence with NO person names — neither performer nor customer.
  if (isDeferralOrDCL) {
    const ref = referenceNumber && referenceNumber !== "-" ? ` ${referenceNumber}` : "";
    const isFlowUpdate = /approver.*flow|flow.*approver|approval.*flow/i.test(
      String(log.action || ""),
    );
    if (isFlowUpdate) {
      return `Updated approval flow for ${entityLabel}${ref}.`;
    }
    const phrase = actionPhrase(actionCategory);
    const Phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
    return `${Phrase} ${entityLabel}${ref}.`;
  }

  // ── Authentication ───────────────────────────────────────────────────────────
  // Keep sanitized details so we get the failure reason (e.g. "no provisioned account").
  if (entityLabel === "Authentication") {
    const raw = log.details || log.errorMessage || "";
    if (raw.trim()) return sanitizeDescription(String(raw).trim());
    const failed = /reject|fail|error|attempt|no provision|not found|not exist|unauthori|no account|invalid|denied|401|403/i.test(
      raw,
    );
    return failed ? `${userName} failed to log in.` : `${userName} logged in successfully.`;
  }

  // ── Everything else ──────────────────────────────────────────────────────────
  if (log.errorMessage && String(log.errorMessage).trim()) {
    return sanitizeDescription(String(log.errorMessage).trim());
  }

  const subject =
    referenceNumber && referenceNumber !== "-"
      ? `${entityLabel} ${referenceNumber}`
      : entityLabel.toLowerCase();

  return `${userName} ${actionPhrase(actionCategory)} ${subject}.`;
};

/**
 * Builds a short, human-readable brief (≤ ~60 chars) for the Description column.
 * Examples: "Logged in successfully", "Approved DCL-26-009", "Failed to log in"
 */
const buildBriefDescription = (log, normalized) => {
  const { actionCategory, entityLabel, referenceNumber } = normalized;

  // Auth / login events — detect failure from status code OR description keywords
  if (actionCategory === "LOGIN") {
    const detailsText = String(log.details || log.errorMessage || "");
    const failed =
      (log.status != null && log.status >= 400) ||
      /reject|fail|error|attempt|no provision|not found|not exist|unauthori[sz]|no account|invalid|denied|401|403/i.test(
        detailsText,
      );
    return failed ? "Failed login attempt" : "Logged in successfully";
  }
  if (actionCategory === "LOGOUT") {
    return "Logged out";
  }

  // For Deferral / DCL: always use the reference number — never a person's name.
  // For User entity: show the target user name.
  // For anything else without a reference: just show the entity label.
  const isDeferralEntity = ["Deferral", "DCL"].includes(entityLabel);
  const subject =
    referenceNumber && referenceNumber !== "-"
      ? `${entityLabel} ${referenceNumber}`
      : isDeferralEntity
        ? entityLabel                                      // e.g. "Approved Deferral" — no name
        : entityLabel === "User"
          ? normalized.targetName || "user account"
          : entityLabel;

  const briefMap = {
    APPROVE: `Approved ${subject}`,
    REJECT:  `Rejected ${subject}`,
    RETURN:  `Returned ${subject}`,
    CREATE:  `Created ${subject}`,
    // For UPDATE: check if this is an approval-flow change specifically
    UPDATE:  /approver.*flow|flow.*approver|approval.*flow|flow.*approval/i.test(
               String(log.action || ""),
             )
             ? `Updated approval flow for ${subject}`
             : `Updated ${subject}`,
    DELETE:  `Deleted ${subject}`,
    SEARCH:  `Searched ${entityLabel}`,
  };

  if (briefMap[actionCategory]) return briefMap[actionCategory];

  // Fallback: shorten the full description to 60 chars
  const full = buildFullDescription(log, normalized);
  return full.length > 60 ? full.slice(0, 57).trimEnd() + "..." : full;
};

const normalizeAuditLog = (log, index) => {
  const entityLabel = normalizeEntity(log.targetType || log.resource);
  const actionCategory = getActionCategory(log.action, log.httpMethod);
  const timestamp = dayjs(log.createdAt);
  const userName = humanizeName(log.performedBy?.name || log.performedByName || "System");
  const userRole = formatRole(log.actorRole || log.performedBy?.role || "System");
  const referenceNumber = extractReferenceNumber(log, entityLabel);
  const targetName = log.targetUser?.name || log.targetName || null;
  const normalized = {
    key: log.id || log._id || `${log.createdAt || "audit"}-${index}`,
    raw: log,
    userName,
    userRole,
    actionCategory,
    actionLabel: getActionLabel(log.action, log.httpMethod),
    entityLabel,
    referenceNumber,
    targetName,
    createdAtMs: timestamp.isValid() ? timestamp.valueOf() : 0,
    createdAtRelative: timestamp.isValid() ? timestamp.fromNow() : "-",
    // dayjs formats in the browser's local timezone by default.
    // Using 12-hour clock (hh:mm:ss A) so the user sees e.g. "10:22:50 AM".
    createdAtExact: timestamp.isValid()
      ? timestamp.format("DD MMM YYYY, hh:mm:ss A")
      : "-",
    createdAtDate: timestamp.isValid() ? timestamp.format("DD MMM YYYY") : "-",
    createdAtTime: timestamp.isValid() ? timestamp.format("hh:mm:ss A") : "-",
  };

  const fullDescription = buildFullDescription(log, normalized);
  const briefDescription = buildBriefDescription(log, { ...normalized });

  return {
    ...normalized,
    description: fullDescription,
    briefDescription,
  };
};

const getUsersArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getErrorMessage = (error) => {
  if (!error) return "";
  if (typeof error?.data === "string") return error.data;
  if (error?.data?.message) return error.data.message;
  if (error?.error) return error.error;
  return "Unable to load audit trail.";
};

/**
 * Entities that should ALWAYS be visible regardless of other filters.
 * Everything else is silently excluded.
 */
const ALLOWED_ENTITIES = new Set(["Deferral", "DCL", "Authentication"]);

/**
 * Filter logs to DCL/Deferral flow + login events, strip System rows,
 * and remove back-to-back duplicates.
 */
const filterAndDedupe = (logs) => {
  // 1. Keep only meaningful, user-generated events
  const kept = logs.filter((log) => {
    if (log.userName === "System") return false;               // system-internal noise
    if (!ALLOWED_ENTITIES.has(log.entityLabel)) return false; // no notifications, admin, session etc.
    return true;
  });

  // 2. Remove consecutive duplicates (same user + action + entity + brief)
  return kept.filter((log, idx, arr) => {
    if (idx === 0) return true;
    const prev = arr[idx - 1];
    return !(
      log.userName        === prev.userName &&
      log.actionCategory  === prev.actionCategory &&
      log.entityLabel     === prev.entityLabel &&
      log.briefDescription === prev.briefDescription
    );
  });
};

const metricCards = (stats, filteredTotal) => [
  {
    key: "total",
    label: "Total Logs",
    value: stats?.totalLogs ?? filteredTotal ?? 0,
    note: "All recorded audit events",
  },
  {
    key: "today",
    label: "Today",
    value: stats?.todayLogs ?? 0,
    note: "Events captured since midnight",
  },
  {
    key: "success",
    label: "Successful",
    value: stats?.successLogs ?? 0,
    note: "Completed without failure",
  },
  {
    key: "failure",
    label: "Failed",
    value: stats?.failureLogs ?? 0,
    note: "Rejected or unsuccessful attempts",
  },
];

/* ─── helpers shared by export functions ──────────────────────────────────── */
const EXPORT_COLUMNS = [
  { header: "User",           key: "userName" },
  { header: "Role",           key: "userRole" },
  { header: "Action",         key: "actionCategory" },
  { header: "Entity",         key: "entityLabel" },
  { header: "Description",    key: "description" },
  { header: "Reference No.",  key: "referenceNumber" },
  { header: "Timestamp",      key: "createdAtExact" },
];

const logsToRows = (logs) =>
  logs.map((log) =>
    EXPORT_COLUMNS.reduce((row, col) => {
      row[col.header] = log[col.key] ?? "-";
      return row;
    }, {}),
  );

/* ─── Standalone export utilities ─────────────────────────────────────────── */
const runExportCSV = (logs) => {
  const headers = EXPORT_COLUMNS.map((c) => c.header);
  const rows = logs.map((log) =>
    EXPORT_COLUMNS.map((col) => {
      const value = String(log[col.key] ?? "-").replace(/"/g, '""');
      return `"${value}"`;
    }).join(","),
  );
  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `audit-logs-${dayjs().format("YYYY-MM-DD")}.csv`);
};

const runExportExcel = (logs) => {
  const rows = logsToRows(logs);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const colWidths = EXPORT_COLUMNS.map((col) => ({
    wch: Math.max(col.header.length, ...logs.map((log) => String(log[col.key] ?? "-").length)),
  }));
  worksheet["!cols"] = colWidths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    `audit-logs-${dayjs().format("YYYY-MM-DD")}.xlsx`,
  );
};

const runExportPDF = (logs) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.setTextColor(21, 49, 58);
  doc.text("Enterprise Audit Trail", 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(98, 113, 127);
  doc.text(
    `Exported on ${dayjs().format("DD MMM YYYY, HH:mm:ss")}  •  ${logs.length} record(s)`,
    14, 22,
  );
  autoTable(doc, {
    startY: 28,
    head: [EXPORT_COLUMNS.map((c) => c.header)],
    body: logs.map((log) => EXPORT_COLUMNS.map((col) => log[col.key] ?? "-")),
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [244, 241, 232], textColor: [21, 49, 58], fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 249] },
    columnStyles: { 4: { cellWidth: 60 } },
    margin: { top: 28, left: 14, right: 14 },
  });
  doc.save(`audit-logs-${dayjs().format("YYYY-MM-DD")}.pdf`);
};

const runExportWebView = (logs) => {
  const headers = EXPORT_COLUMNS.map((c) => `<th>${c.header}</th>`).join("");
  const bodyRows = logs
    .map((log) => {
      const cells = EXPORT_COLUMNS.map((col) => `<td>${log[col.key] ?? "-"}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Audit Logs — ${dayjs().format("DD MMM YYYY")}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#f6f8f6;color:#15313a;margin:0;padding:24px}
  h1{font-size:22px;margin-bottom:4px} p{color:#62717f;font-size:13px;margin:0 0 20px}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06)}
  th{background:#f4f1e8;color:#15313a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:10px 12px;text-align:left}
  td{padding:9px 12px;font-size:13px;border-bottom:1px solid rgba(21,49,58,.06);vertical-align:top}
  tr:last-child td{border-bottom:none} tr:nth-child(even) td{background:#f8faf9}
  @media print{body{padding:0}}
</style></head><body>
<h1>Enterprise Audit Trail</h1>
<p>Exported ${dayjs().format("DD MMM YYYY, HH:mm:ss")} &nbsp;•&nbsp; ${logs.length} record(s)</p>
<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>
</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.addEventListener("load", () => URL.revokeObjectURL(url));
};

const EXPORT_DISPATCH = {
  pdf:   runExportPDF,
  excel: runExportExcel,
  csv:   runExportCSV,
  web:   runExportWebView,
};

/* ─── ExportMenu — just opens the scope modal ─────────────────────────────── */
const ExportMenu = ({ onExport }) => {
  const menuItems = [
    {
      key: "pdf",
      label: "Export as PDF",
      icon: <FilePdfOutlined style={{ color: "#dc2626" }} />,
      onClick: () => onExport("pdf"),
    },
    {
      key: "excel",
      label: "Export as Excel",
      icon: <FileExcelOutlined style={{ color: "#16a34a" }} />,
      onClick: () => onExport("excel"),
    },
    {
      key: "csv",
      label: "Export as CSV",
      icon: <FileTextOutlined style={{ color: "#0284c7" }} />,
      onClick: () => onExport("csv"),
    },
    { type: "divider" },
    {
      key: "web",
      label: "Open Web View",
      icon: <GlobalOutlined style={{ color: "#7c3aed" }} />,
      onClick: () => onExport("web"),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
      <Button icon={<DownloadOutlined />} type="primary" ghost>
        Export
      </Button>
    </Dropdown>
  );
};

const AuditLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUserId, setSelectedUserId] = useState(undefined);
  const [selectedAction, setSelectedAction] = useState(undefined);
  const [selectedEntity, setSelectedEntity] = useState(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [timeSortOrder, setTimeSortOrder] = useState("descend");

  // Export scope modal state
  const [exportModal, setExportModal] = useState({ open: false, format: null });
  const [exportScope, setExportScope] = useState("100");
  // exportQueryParams is set when the user confirms — triggers the export fetch
  const [exportQueryParams, setExportQueryParams] = useState(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const { data: usersData = [], isLoading: isUsersLoading, refetch: refetchUsers } = useGetUsersQuery();
  const { data: statsData, refetch: refetchStats } = useGetAuditLogStatsQuery();

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      userId: selectedUserId,
      action: selectedAction,
      resource: selectedEntity,
      search: debouncedSearch || undefined,
      startDate: dateRange?.[0] ? dateRange[0].startOf("day").toISOString() : undefined,
      endDate: dateRange?.[1] ? dateRange[1].endOf("day").toISOString() : undefined,
    }),
    [currentPage, pageSize, selectedUserId, selectedAction, selectedEntity, debouncedSearch, dateRange],
  );

  const {
    data: auditData,
    isLoading: isAuditLoading,
    isFetching: isAuditFetching,
    error: auditError,
    refetch: refetchAudit,
  } = useGetAuditLogsQuery(queryParams, { refetchOnMountOrArgChange: true });

  // Separate query fired only when user confirms an export scope
  const {
    data: exportRawData,
    isFetching: isExportFetching,
  } = useGetAuditLogsQuery(exportQueryParams ?? queryParams, {
    skip: exportQueryParams === null,
  });

  // Fire the actual export as soon as the export data arrives
  useEffect(() => {
    if (!exportQueryParams || isExportFetching || !exportRawData) return;

    // Normalize, sort, and filter the raw records
    const allFiltered = filterAndDedupe(
      (exportRawData.logs || []).map((log, i) => normalizeAuditLog(log, i))
        .sort((a, b) => b.createdAtMs - a.createdAtMs),
    );

    // Slice to the user's chosen count (null = all)
    const { _requestedCount } = exportQueryParams;
    const logs = _requestedCount ? allFiltered.slice(0, _requestedCount) : allFiltered;

    const fn = EXPORT_DISPATCH[exportQueryParams._format];
    if (fn) fn(logs);
    setExportQueryParams(null); // reset so query is skipped again
  }, [exportRawData, isExportFetching, exportQueryParams]);

  const users = useMemo(() => getUsersArray(usersData), [usersData]);
  const rawLogs = useMemo(() => (Array.isArray(auditData?.logs) ? auditData.logs : []), [auditData]);
  const total = Number(auditData?.total || 0);

  const auditLogs = useMemo(
    () => rawLogs.map((log, index) => normalizeAuditLog(log, index)),
    [rawLogs],
  );

  const sortedAuditLogs = useMemo(() => {
    const direction = timeSortOrder === "ascend" ? 1 : -1;
    const sorted = [...auditLogs].sort((left, right) => (left.createdAtMs - right.createdAtMs) * direction);
    return filterAndDedupe(sorted);
  }, [auditLogs, timeSortOrder]);

  const userOptions = useMemo(
    () =>
      users
        .filter((user) => user?._id && user?.name)
        .map((user) => ({
          label: `${user.name} (${formatRole(user.role)})`,
          value: user._id,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [users],
  );

  const actionOptions = useMemo(() => {
    const dynamicActions = auditLogs.map((log) => log.raw.action).filter(Boolean);
    const values = [...new Set([...COMMON_ACTIONS, ...dynamicActions])];

    return values
      .filter(Boolean)
      .map((value) => ({ value, label: titleize(value) }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [auditLogs]);

  const entityOptions = useMemo(() => {
    const dynamicEntities = auditLogs.map((log) => log.raw.targetType || log.raw.resource).filter(Boolean);
    const values = [...new Set([...COMMON_ENTITIES, ...dynamicEntities.map((value) => normalizeEntity(value))])];

    return values
      .filter(Boolean)
      .map((value) => ({ value, label: normalizeEntity(value) }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [auditLogs]);

  const cards = metricCards(statsData, total);
  const isBusy = isAuditLoading || isAuditFetching;
  const errorMessage = getErrorMessage(auditError);

  const handleRefresh = () => {
    refetchAudit();
    refetchStats();
    refetchUsers();
  };

  const handleSearchChange = (event) => {
    setCurrentPage(1);
    setSearchInput(event.target.value);
  };

  const handleUserChange = (value) => {
    setCurrentPage(1);
    setSelectedUserId(value);
  };

  const handleActionChange = (value) => {
    setCurrentPage(1);
    setSelectedAction(value);
  };

  const handleEntityChange = (value) => {
    setCurrentPage(1);
    setSelectedEntity(value);
  };

  const handleDateRangeChange = (value) => {
    setCurrentPage(1);
    setDateRange(value);
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setSelectedUserId(undefined);
    setSelectedAction(undefined);
    setSelectedEntity(undefined);
    setDateRange(null);
    setSearchInput("");
  };

  // Opens the scope-selection modal when a format is chosen from ExportMenu
  const handleExportFormat = (format) => {
    setExportScope("100");
    setExportModal({ open: true, format });
  };

  // Triggers the export fetch with the chosen scope
  const handleExportConfirm = () => {
    const requestedCount = exportScope === "all" ? null : parseInt(exportScope, 10);
    // Fetch up to 10× more raw rows from the backend so that, after filterAndDedupe
    // removes Notification/System/duplicate rows, we still have enough to fill the
    // user's chosen count. Cap at total to avoid pointless over-fetching.
    const fetchLimit =
      requestedCount === null
        ? 99999
        : Math.min(requestedCount * 10, total > 0 ? total : 99999);

    setExportModal({ open: false, format: null });
    setExportQueryParams({
      ...queryParams,
      page: 1,
      limit: fetchLimit,
      _format: exportModal.format,
      _requestedCount: requestedCount, // null means "all"
    });
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 240,
      render: (_, record) => {
        const roleStyle = ROLE_STYLES[record.userRole] || ROLE_STYLES.System;

        return (
          <div className="audit-trail-user-cell">
            <div className="audit-trail-user-avatar">{record.userName.charAt(0).toUpperCase()}</div>
            <div className="audit-trail-user-meta">
              <Text strong className="audit-trail-user-name">{record.userName}</Text>
              <Tag
                bordered
                className="audit-trail-role-tag"
                style={roleStyle}
              >
                {record.userRole}
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 165,
      render: (_, record) => {
        const actionStyle = ACTION_STYLES[record.actionCategory] || ACTION_STYLES.OTHER;

        return (
          <div className="audit-trail-action-cell">
            <Tag bordered className="audit-trail-action-tag" style={actionStyle}>
              {record.actionCategory}
            </Tag>
            <Text type="secondary" className="audit-trail-action-detail">
              {record.actionLabel}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Entity",
      dataIndex: "entityLabel",
      key: "entityLabel",
      width: 150,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Description",
      dataIndex: "briefDescription",
      key: "description",
      ellipsis: true,
      render: (brief, record) => (
        <Tooltip
          title={
            <span style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
              {record.description}
            </span>
          }
          placement="topLeft"
          overlayStyle={{ maxWidth: 420 }}
        >
          <div className="audit-trail-description-cell">
            <Text className="audit-trail-description-text">{brief}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Reference No.",
      dataIndex: "referenceNumber",
      key: "referenceNumber",
      width: 170,
      render: (value) => (
        <Text className="audit-trail-reference">{value || "-"}</Text>
      ),
    },
    {
      title: "Timestamp",
      dataIndex: "createdAtMs",
      key: "createdAt",
      width: 200,
      sorter: true,
      sortDirections: ["descend", "ascend"],
      sortOrder: timeSortOrder,
      render: (_, record) => (
        <Tooltip title={record.createdAtRelative}>
          <div className="audit-trail-time-cell">
            <Text strong style={{ fontSize: 13 }}>{record.createdAtDate}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.createdAtTime}</Text>
          </div>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="audit-trail-page">
      <style>
        {`
          .audit-trail-page {
            --audit-ink: #15313a;
            --audit-muted: #62717f;
            --audit-border: rgba(21, 49, 58, 0.1);
            --audit-panel: rgba(255, 255, 255, 0.92);
            min-height: 100%;
            padding: 24px;
            background:
              radial-gradient(circle at top left, rgba(180, 210, 197, 0.32), transparent 28%),
              radial-gradient(circle at top right, rgba(232, 214, 178, 0.3), transparent 32%),
              linear-gradient(180deg, #f6f8f6 0%, #eef2ef 100%);
          }

          .audit-trail-hero {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            align-items: flex-start;
            margin-bottom: 20px;
          }

          .audit-trail-kicker {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid rgba(21, 49, 58, 0.1);
            background: rgba(255, 255, 255, 0.66);
            color: #1f4b57;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 12px;
          }

          .audit-trail-title.ant-typography {
            margin-bottom: 6px;
            color: var(--audit-ink);
          }

          .audit-trail-subtitle.ant-typography {
            max-width: 760px;
            color: var(--audit-muted);
            font-size: 15px;
          }

          .audit-trail-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 14px;
            margin-bottom: 18px;
          }

          .audit-trail-metric {
            border: 1px solid var(--audit-border);
            border-radius: 18px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 249, 0.88) 100%);
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
          }

          .audit-trail-metric .ant-card-body {
            padding: 18px;
          }

          .audit-trail-metric-value {
            display: block;
            color: var(--audit-ink);
            font-size: 28px;
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 8px;
          }

          .audit-trail-panel {
            border: 1px solid var(--audit-border);
            border-radius: 20px;
            background: var(--audit-panel);
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
            backdrop-filter: blur(10px);
          }

          .audit-trail-panel + .audit-trail-panel {
            margin-top: 16px;
          }

          .audit-trail-toolbar {
            display: grid;
            grid-template-columns: minmax(240px, 1.4fr) repeat(4, minmax(180px, 1fr));
            gap: 12px;
            align-items: center;
          }

          .audit-trail-toolbar-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            flex-wrap: wrap;
          }

          .audit-trail-table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
            flex-wrap: wrap;
          }

          .audit-trail-table-title.ant-typography {
            margin-bottom: 0;
            color: var(--audit-ink);
          }

          .audit-trail-table-subtitle.ant-typography {
            color: var(--audit-muted);
          }

          .audit-trail-page .ant-table-wrapper .ant-table {
            background: transparent;
          }

          .audit-trail-page .ant-table-wrapper .ant-table-thead > tr > th {
            background: #f4f1e8;
            color: var(--audit-ink);
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid rgba(21, 49, 58, 0.08);
          }

          .audit-trail-page .ant-table-wrapper .ant-table-tbody > tr > td {
            vertical-align: top;
            border-bottom: 1px solid rgba(21, 49, 58, 0.06);
          }

          .audit-trail-page .ant-table-wrapper .ant-table-tbody > tr:hover > td {
            background: rgba(236, 242, 239, 0.62);
          }

          .audit-trail-user-cell {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .audit-trail-user-avatar {
            flex: 0 0 38px;
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #dfece6 0%, #e5cfaa 100%);
            color: #17353e;
            font-weight: 700;
          }

          .audit-trail-user-meta {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
          }

          .audit-trail-user-name.ant-typography {
            color: var(--audit-ink);
          }

          .audit-trail-role-tag,
          .audit-trail-action-tag {
            width: fit-content;
            border-radius: 999px;
            padding-inline: 10px;
            font-weight: 700;
          }

          .audit-trail-action-cell,
          .audit-trail-time-cell,
          .audit-trail-description-cell {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .audit-trail-action-detail.ant-typography,
          .audit-trail-description-meta.ant-typography,
          .audit-trail-time-cell .ant-typography-secondary {
            font-size: 12px;
          }

          .audit-trail-description-text.ant-typography {
            color: #223843;
            line-height: 1.5;
          }

          .audit-trail-reference.ant-typography {
            font-family: Consolas, Monaco, monospace;
            color: #1f4b57;
          }

          .audit-trail-state {
            padding: 36px 0 12px;
          }

          @media (max-width: 1280px) {
            .audit-trail-toolbar {
              grid-template-columns: repeat(3, minmax(180px, 1fr));
            }
          }

          @media (max-width: 900px) {
            .audit-trail-page {
              padding: 16px;
            }

            .audit-trail-toolbar {
              grid-template-columns: 1fr;
            }

            .audit-trail-toolbar-actions {
              justify-content: flex-start;
            }
          }
        `}
      </style>

      <div className="audit-trail-hero">
        <div>
          <div className="audit-trail-kicker">
            <CalendarOutlined />
            Enterprise Audit Trail
          </div>
          <Title level={2} className="audit-trail-title">
            Professional audit log viewer
          </Title>
          <Text className="audit-trail-subtitle">
            Monitor every critical action across users, DCLs, deferrals, approvals, and authentication events with searchable, time-aware, human-readable records.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isBusy}>
            Refresh
          </Button>
        </Space>
      </div>

      <div className="audit-trail-metrics">
        {cards.map((card) => (
          <Card key={card.key} className="audit-trail-metric" bordered={false}>
            <Text type="secondary">{card.label}</Text>
            <span className="audit-trail-metric-value">{card.value}</span>
            <Text type="secondary">{card.note}</Text>
          </Card>
        ))}
      </div>

      <Card className="audit-trail-panel" bordered={false}>
        <div className="audit-trail-toolbar">
          <Input
            allowClear
            value={searchInput}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            placeholder="Search by description, reference number, or user"
          />

          <Select
            allowClear
            showSearch
            loading={isUsersLoading}
            optionFilterProp="label"
            placeholder="Filter by user"
            value={selectedUserId}
            onChange={handleUserChange}
            options={userOptions}
          />

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Filter by action"
            value={selectedAction}
            onChange={handleActionChange}
            options={actionOptions}
          />

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Filter by entity"
            value={selectedEntity}
            onChange={handleEntityChange}
            options={entityOptions}
          />

          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: "100%" }}
          />
        </div>

        <div className="audit-trail-toolbar-actions" style={{ marginTop: 12 }}>
          <Button icon={<FilterOutlined />} onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </Card>

      <Card className="audit-trail-panel" bordered={false}>
        <div className="audit-trail-table-header">
          <div>
            <Title level={4} className="audit-trail-table-title">
              Audit Events
            </Title>
            <Text className="audit-trail-table-subtitle">
              {total} matching log{total === 1 ? "" : "s"} across the selected criteria.
            </Text>
          </div>

          <ExportMenu onExport={handleExportFormat} />
        </div>

        {auditError ? (
          <div className="audit-trail-state">
            <Alert
              type="error"
              showIcon
              message="Failed to load audit logs"
              description={errorMessage}
              action={
                <Button size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            />
          </div>
        ) : null}

        <Table
          rowKey="key"
          columns={columns}
          dataSource={sortedAuditLogs}
          loading={isBusy}
          scroll={{ x: 1180 }}
          onChange={(nextPagination, _filters, sorter) => {
            setCurrentPage(nextPagination.current || 1);
            setPageSize(nextPagination.pageSize || 20);

            if (!Array.isArray(sorter) && sorter?.columnKey === "createdAt") {
              setTimeSortOrder(sorter.order || "descend");
            }
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (value, range) => `${range[0]}-${range[1]} of ${value} logs`,
          }}
          locale={{
            emptyText: isBusy ? (
              <Empty description="Loading audit trail..." />
            ) : (
              <Empty
                description={
                  debouncedSearch || selectedUserId || selectedAction || selectedEntity || dateRange
                    ? "No audit logs match the selected filters."
                    : "No audit logs available yet."
                }
              />
            ),
          }}
        />
      </Card>

      {/* ─── Export scope-selection modal ──────────────────────────────── */}
      <Modal
        open={exportModal.open}
        title="Choose export scope"
        onCancel={() => setExportModal({ open: false, format: null })}
        onOk={handleExportConfirm}
        okText={isExportFetching ? <Spin size="small" /> : "Generate"}
        okButtonProps={{ disabled: isExportFetching }}
        width={400}
      >
        <p style={{ color: "#62717f", marginBottom: 16 }}>
          How many records would you like to include in the{" "}
          <strong>{exportModal.format?.toUpperCase()}</strong> export?
          {total > 0 && (
            <span style={{ display: "block", marginTop: 4, fontSize: 12 }}>
              {total} total record{total === 1 ? "" : "s"} match your current filters.
            </span>
          )}
        </p>

        <Radio.Group
          value={exportScope}
          onChange={(e) => setExportScope(e.target.value)}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Radio value="50">First 50 records</Radio>
          <Radio value="100">First 100 records</Radio>
          <Radio value="500">First 500 records</Radio>
          <Radio value="all">
            All records{total > 0 ? ` (${total})` : ""}
          </Radio>
        </Radio.Group>
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
