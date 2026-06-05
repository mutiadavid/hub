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
  message,
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
  DashboardOutlined,
  TableOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  TeamOutlined,
  FileOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ExportMenu } from "../../components/ExportMenu";
import { useGetAuditLogsQuery, useLazyGetAuditLogsQuery, useGetAuditLogStatsQuery } from "../../api/auditApi";
import { useGetUsersQuery } from "../../api/userApi";
import "../../styles/creatorDesignSystem.css";
import "./AuditLogsPage.css";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Set default timezone (adjust to your local timezone, e.g., "Africa/Nairobi" for East Africa)
const LOCAL_TIMEZONE = "Africa/Nairobi";

/** Client-side table: one API fetch loads all matching rows; table shows this many per page. */
const AUDIT_LOGS_PAGE_SIZE = 8;
const AUDIT_LOGS_FETCH_BATCH = 500;

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Business actions only - removed LOGIN/LOGOUT
const BUSINESS_ACTIONS = [
  "CREATE_DCL",
  "UPDATE_DCL",
  "DELETE_DCL",
  "REVIVE_DCL",
  "SAVE_DRAFT_DCL",
  "SUBMIT_TO_RM",
  "SUBMIT_TO_COCHECKER",
  "RM_SUBMIT_TO_COCREATOR",
  "RM_RETURN_TO_MAKER",
  "CHECKER_APPROVED",
  "CHECKER_REJECTED",
  "CHECKER_CO_CREATOR_REVIEW",
  "APPROVE",
  "REJECT",
  "RETURN",
  "CREATE_DEFERRAL",
  "UPDATE_DEFERRAL",
  "APPROVE_DEFERRAL",
  "REJECT_DEFERRAL",
  "RETURN_DEFERRAL",
  "UPDATE_DEFERRAL_APPROVER_FLOW",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "ACTIVATE_USER",
  "DEACTIVATE_USER",
  "REASSIGN_TASKS",
  "CHANGE_ROLE",
  "TOGGLE_ACTIVE",
  "CREATE_CHECKLIST",
  "UPDATE_CHECKLIST",
  "DELETE_CHECKLIST",
  "UPLOAD_DOCUMENT",
  "DELETE_DOCUMENT",
  "ADD_COMMENT",
  "UPDATE_ROLE",
];

const BUSINESS_ENTITIES = [
  "Deferral", "DCL", "User", "Document", "Checklist", "Notification", "Role",
];

const NCBA_COLORS = {
  primary: "#006a4d",
  accent: "#7AB800",
  secondary: "#164679",
  success: "#15803d",
  danger: "#b91c1c",
  warning: "#d97706",
  neutral: "#62717f",
  bg: "#ffffff",
  white: "#ffffff",
  border: "rgba(0, 106, 77, 0.08)",
};

const ACTION_STYLES = {
  CREATE: { background: "rgba(0, 106, 77, 0.06)", color: NCBA_COLORS.primary, borderColor: "rgba(0, 106, 77, 0.1)" },
  UPDATE: { background: "#ebf5ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
  APPROVE: { background: "#ecfdf3", color: "#15803d", borderColor: "#86efac" },
  REJECT: { background: "#fff1f2", color: "#b91c1c", borderColor: "#fecdd3" },
  DELETE: { background: "#fff1f2", color: "#9f1239", borderColor: "#fda4af" },
  SUBMIT: { background: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" },
  RETURN: { background: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" },
  ACTIVATE: { background: "#ecfdf5", color: "#065f46", borderColor: "#6ee7b7" },
  DEACTIVATE: { background: "#fdf2f8", color: "#86198f", borderColor: "#e879f9" },
  SEARCH: { background: "#f8fafc", color: "#475569", borderColor: "#cbd5e1" },
  OTHER: { background: "#f5f5f4", color: "#57534e", borderColor: "#d6d3d1" },
};

const ROLE_STYLES = {
  Admin: { background: "rgba(159, 18, 57, 0.06)", color: "#9f1239" },
  RM: { background: "rgba(146, 64, 14, 0.06)", color: "#92400e" },
  Approver: { background: "rgba(22, 101, 52, 0.06)", color: "#166534" },
  CoCreator: { background: "rgba(21, 94, 117, 0.06)", color: "#155e75" },
  CoChecker: { background: "rgba(29, 78, 216, 0.06)", color: "#1d4ed8" },
  Customer: { background: "rgba(109, 40, 217, 0.06)", color: "#6d28d9" },
  System: { background: "#f4f4f5", color: "#3f3f46" },
};

// Helper function to convert UTC to local timezone
const convertToLocalTime = (utcDateString) => {
  if (!utcDateString) return dayjs();
  return dayjs.utc(utcDateString).tz(LOCAL_TIMEZONE);
};

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );

const parseJsonSafely = (value) => {
  if (!value || typeof value !== "string") return null;
  try { return JSON.parse(value); } catch { return null; }
};

const titleize = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const humanizeName = (raw) => {
  if (!raw || raw === "System") return raw || "System";
  const s = String(raw).trim();
  const local = s.includes("@") ? s.split("@")[0] : s;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const formatRole = (role) => {
  const normalized = String(role || "System").trim().toLowerCase();
  const roleMap = {
    admin: "System Administrator", rm: "RM", approver: "Approver",
    cocreator: "CoCreator", cochecker: "CoChecker",
    customer: "Customer", system: "System",
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
  return titleize(normalized);
};

const getActionCategory = (action, httpMethod) => {
  const normalized = String(action || httpMethod || "OTHER").trim().toUpperCase();
  if (normalized === "ACTIVATE_USER") return "ACTIVATE";
  if (normalized === "DEACTIVATE_USER") return "DEACTIVATE";
  if (/APPROVE(?!R)/.test(normalized)) return "APPROVE";
  if (normalized.includes("REJECT")) return "REJECT";
  if (normalized.includes("DELETE") || normalized.includes("ARCHIVE")) return "DELETE";
  if (normalized.includes("RETURN")) return "RETURN";
  if (normalized.includes("SUBMIT")) return "SUBMIT";
  if (normalized.includes("CREATE") || normalized.includes("UPLOAD") || normalized.includes("ADD_")) return "CREATE";
  if (normalized.includes("UPDATE") || normalized.includes("CHANGE") ||
    normalized.includes("TOGGLE") || normalized.includes("REASSIGN")) return "UPDATE";
  return normalized || "OTHER";
};

const getActionLabel = (action, httpMethod) => titleize(action || httpMethod || "Other");

const actionPhrase = (actionCategory) => {
  switch (actionCategory) {
    case "CREATE": return "created";
    case "UPDATE": return "updated";
    case "APPROVE": return "approved";
    case "REJECT": return "rejected";
    case "DELETE": return "deleted";
    case "RETURN": return "returned";
    case "SUBMIT": return "submitted";
    case "ACTIVATE": return "activated";
    case "DEACTIVATE": return "deactivated";
    default: return "performed";
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
      if (nested !== null && nested !== undefined && nested !== "") return nested;
    }
  }
  return null;
};

const extractReferenceNumber = (log, entityLabel) => {
  const metadata = parseJsonSafely(log.metadataJson);
  const oldValues = parseJsonSafely(log.oldValuesJson);
  const newValues = parseJsonSafely(log.newValuesJson);
  const keyCandidates = ["referencenumber", "reference", "deferralnumber", "dclnumber", "dclno", "checklistnumber", "number"];

  const candidate = findCandidateValue(metadata, keyCandidates) ||
    findCandidateValue(newValues, keyCandidates) ||
    findCandidateValue(oldValues, keyCandidates);
  if (candidate && !isGuid(candidate)) return String(candidate);

  const detailText = `${log.details || ""} ${log.targetName || ""}`;
  const patterns = [
    /\b(?:Deferral(?:\s+Number)?|DEFERRAL)[:\s#-]*([A-Z]{2,4}-\d{2}-\d{3,})\b/i,
    /\b(?:DCL(?:\s+(?:No|Number))?|CHECKLIST)[:\s#-]*([A-Z]{2,4}-\d{2}-\d{3,})\b/i,
    /\b((?:DEF|DCL|REF|CHK)-\d{2}-\d{3,})\b/i,
    /\(([A-Z]{2,4}-\d{2}-\d{3,})\)/i,
    /\((\d{4}-\d{4})(?:\s+copy\s+\d+)?\)/i,
    /\b(\d{4}-\d{4})\b/,
  ];
  for (const pattern of patterns) {
    const match = detailText.match(pattern);
    if (match?.[1] && !isGuid(match[1])) return match[1].toUpperCase();
  }
  if (["DCL", "Deferral"].includes(entityLabel) && log.resourceId && !isGuid(log.resourceId)) return String(log.resourceId);
  return "-";
};

const sanitizeDescription = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/\.?\s*(?:GET|POST|PUT|PATCH|DELETE)\s+\/api\/[^.]+(?:completed\s+with\s+status\s+\d+)?\s*\.?/gi, "")
    .replace(/\.?\s*completed\s+with\s+status\s+\d+\.?/gi, "")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const buildFullDescription = (log, normalized) => {
  const { userName, actionCategory, entityLabel, referenceNumber } = normalized;
  const isDeferralOrDCL = ["Deferral", "DCL"].includes(entityLabel);
  const rawAction = String(log?.action || "").toUpperCase();
  const targetUserName = humanizeName(log?.targetName || log?.targetUser?.name || "");

  // ── User management actions: use the rich Details field from the backend ──
  // The backend already builds precise sentences like:
  //   "Eric Mewa changed roles for Antony Gitonga from CoChecker to CoCreator."
  //   "Eric Mewa created user Antony Gitonga (antony@bank.com) with role CoCreator."
  if (rawAction === "CHANGE_ROLE") {
    const details = sanitizeDescription(log?.details || "");
    if (details) return details;
    const subject = targetUserName || "a user";
    // fallback: try to pull old/new role from metadata
    const meta = parseJsonSafely(log?.metadataJson);
    if (meta?.before?.role && meta?.after?.role) {
      return `${userName} changed ${subject}'s role from ${meta.before.role} to ${meta.after.role}.`;
    }
    return `${userName} changed role for ${subject}.`;
  }

  if (rawAction === "UPDATE_ROLE") {
    const details = sanitizeDescription(log?.details || "");
    if (details) return details;
    const subject = targetUserName || "a user";
    return `${userName} updated role for ${subject}.`;
  }

  if (rawAction === "CREATE_USER" || rawAction === "CREATE_USER_FROM_AD") {
    const details = sanitizeDescription(log?.details || "");
    if (details) return details;
    const subject = targetUserName || "a user";
    return `${userName} created user account for ${subject}.`;
  }

  // Activate / Deactivate — always about a named user
  if (rawAction === "ACTIVATE_USER") {
    const details = sanitizeDescription(log?.details || "");
    if (details) return details;
    const subject = targetUserName || "a user";
    return `${userName} activated user ${subject}.`;
  }
  if (rawAction === "DEACTIVATE_USER") {
    const details = sanitizeDescription(log?.details || "");
    if (details) return details;
    const subject = targetUserName || "a user";
    return `${userName} deactivated user ${subject}.`;
  }

  if (rawAction === "TOGGLE_ACTIVE") {
    const details = sanitizeDescription(log?.details || "");
    if (details) return details;
    const subject = targetUserName || "a user";
    return `${userName} toggled active status for ${subject}.`;
  }

  if (rawAction === "REASSIGN_TASKS" || rawAction === "REASSIGN") {
    const details = sanitizeDescription(log?.details || "");
    if (details) return details;
    const subject = targetUserName || "a user";
    return `${userName} reassigned tasks for ${subject}.`;
  }

  if (rawAction === "DELETE_DOCUMENT" && isDeferralOrDCL) {
    const ref = referenceNumber && referenceNumber !== "-" ? ` ${referenceNumber}` : "";
    if (entityLabel === "Deferral") return `Deleted deferral document${ref}.`;
    return `Deleted DCL document${ref}.`;
  }

  if (isDeferralOrDCL) {
    const ref = referenceNumber && referenceNumber !== "-" ? ` ${referenceNumber}` : "";
    const phrase = actionPhrase(actionCategory);
    const Phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
    return `${Phrase} ${entityLabel}${ref}.`;
  }

  if (log.errorMessage && String(log.errorMessage).trim()) return sanitizeDescription(String(log.errorMessage).trim());

  // Generic fallback — but also try the backend details string first
  const rawDetails = sanitizeDescription(log?.details || "");
  if (rawDetails) return rawDetails;

  const subject = referenceNumber && referenceNumber !== "-" ? `${entityLabel} ${referenceNumber}` : entityLabel.toLowerCase();
  return `${userName} ${actionPhrase(actionCategory)} ${subject}.`;
};

const buildBriefDescription = (log, normalized) => {
  const { actionCategory, entityLabel, referenceNumber } = normalized;
  const rawAction = String(log?.action || "").toUpperCase();
  const targetUserName = humanizeName(log?.targetName || log?.targetUser?.name || "");

  // ── Specific concise labels for user-management actions ──
  if (rawAction === "CHANGE_ROLE" || rawAction === "UPDATE_ROLE") {
    // Try to pull before/after roles from metadata for the brief label
    const meta = parseJsonSafely(log?.metadataJson);
    if (meta?.before?.role && meta?.after?.role && targetUserName) {
      return `${targetUserName}: ${meta.before.role} → ${meta.after.role}`;
    }
    return targetUserName ? `Role changed for ${targetUserName}` : "Changed user role";
  }

  if (rawAction === "CREATE_USER" || rawAction === "CREATE_USER_FROM_AD") {
    return targetUserName ? `Created ${targetUserName}` : "Created user account";
  }

  if (rawAction === "ACTIVATE_USER") {
    return targetUserName ? `Activated ${targetUserName}` : "Activated user";
  }
  if (rawAction === "DEACTIVATE_USER") {
    return targetUserName ? `Deactivated ${targetUserName}` : "Deactivated user";
  }
  if (rawAction === "TOGGLE_ACTIVE") {
    return targetUserName ? `Toggled status for ${targetUserName}` : "Toggled user status";
  }
  if (rawAction === "REASSIGN_TASKS" || rawAction === "REASSIGN") {
    return targetUserName ? `Reassigned tasks for ${targetUserName}` : "Reassigned tasks";
  }

  const isDeferralEntity = ["Deferral", "DCL"].includes(entityLabel);
  const subject = referenceNumber && referenceNumber !== "-"
    ? `${entityLabel} ${referenceNumber}`
    : isDeferralEntity ? entityLabel : entityLabel;

  if (rawAction === "DELETE_DOCUMENT" && isDeferralEntity) {
    const ref = referenceNumber && referenceNumber !== "-" ? ` ${referenceNumber}` : "";
    return entityLabel === "Deferral"
      ? `Deleted deferral document${ref}`
      : `Deleted DCL document${ref}`;
  }

  const briefMap = {
    APPROVE: `Approved ${subject}`,
    REJECT: `Rejected ${subject}`,
    RETURN: `Returned ${subject}`,
    CREATE: `Created ${subject}`,
    UPDATE: `Updated ${subject}`,
    DELETE: `Deleted ${subject}`,
    SUBMIT: `Submitted ${subject}`,
    ACTIVATE: targetUserName ? `Activated ${targetUserName}` : `Activated ${subject}`,
    DEACTIVATE: targetUserName ? `Deactivated ${targetUserName}` : `Deactivated ${subject}`,
  };
  if (briefMap[actionCategory]) return briefMap[actionCategory];

  const full = buildFullDescription(log, normalized);
  return full.length > 60 ? full.slice(0, 57).trimEnd() + "..." : full;
};

const normalizeAuditLog = (log, index) => {
  const entityLabel = normalizeEntity(log.targetType || log.resource);
  const actionCategory = getActionCategory(log.action, log.httpMethod);
  // Convert UTC to local timezone
  const localTimestamp = convertToLocalTime(log.createdAt);
  const userName = humanizeName(log.performedBy?.name || log.performedByName || "System");
  const userRole = formatRole(log.actorRole || log.performedBy?.role || "System");
  const referenceNumber = extractReferenceNumber(log, entityLabel);
  const ipAddress = log.ipAddress || log.IpAddress || "";
  const normalized = {
    key: log.id || log._id || `${log.createdAt || "audit"}-${index}`,
    raw: log,
    userName,
    userRole,
    actionCategory,
    actionLabel: getActionLabel(log.action, log.httpMethod),
    entityLabel,
    referenceNumber,
    ipAddress: String(ipAddress || "").trim() || "-",
    createdAtMs: localTimestamp.isValid() ? localTimestamp.valueOf() : 0,
    createdAtRelative: localTimestamp.isValid() ? localTimestamp.fromNow() : "-",
    createdAtExact: localTimestamp.isValid() ? localTimestamp.format("DD MMM YYYY, hh:mm:ss A") : "-",
    createdAtDate: localTimestamp.isValid() ? localTimestamp.format("DD MMM YYYY") : "-",
    createdAtTime: localTimestamp.isValid() ? localTimestamp.format("hh:mm:ss A") : "-",
  };
  return {
    ...normalized,
    description: buildFullDescription(log, normalized),
    briefDescription: buildBriefDescription(log, normalized),
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

// Filter to only business actions (exclude login/logout)
const filterBusinessLogs = (logs) => {
  return logs.filter((log) => {
    if (log.userName === "System") return false;
    if (!BUSINESS_ENTITIES.includes(log.entityLabel)) return false;
    const rawAction = String(log.raw?.action || "").toUpperCase();
    // Exclude login/logout actions
    if (rawAction === "LOGIN" || rawAction === "LOGOUT" || rawAction === "LOGIN_ATTEMPT") return false;
    return BUSINESS_ACTIONS.includes(rawAction);
  });
};

const EXPORT_COLUMNS = [
  { header: "User", key: "userName" },
  { header: "Role", key: "userRole" },
  { header: "Action", key: "actionCategory" },
  { header: "Entity", key: "entityLabel" },
  { header: "Description", key: "description" },
  { header: "Reference No.", key: "referenceNumber" },
  { header: "IP address", key: "ipAddress" },
  { header: "Timestamp", key: "createdAtExact" },
];

// Dashboard Component with User & Role Analytics
const AuditDashboard = ({ logs, stats, users, totalCount }) => {
  // Action distribution by category - using the filtered logs
  const actionTypeData = useMemo(() => {
    const actionCounts = {};
    logs.forEach(log => {
      const action = log.actionLabel;
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    return Object.entries(actionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [logs]);

  // User activity distribution - using the filtered logs
  const userActivityData = useMemo(() => {
    const userCounts = {};
    logs.forEach(log => {
      const user = log.userName;
      userCounts[user] = (userCounts[user] || 0) + 1;
    });
    return Object.entries(userCounts)
      .map(([name, actions]) => ({ name, actions }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 8);
  }, [logs]);

  // Role distribution - using the filtered logs
  const roleDistribution = useMemo(() => {
    const roleCounts = {};
    logs.forEach(log => {
      const role = log.userRole;
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    return Object.entries(roleCounts)
      .map(([name, value]) => ({ name, value, color: ROLE_STYLES[name]?.color || NCBA_COLORS.neutral }));
  }, [logs]);

  // Activity over time - using the filtered logs with proper date handling
  const activityOverTime = useMemo(() => {
    const dailyCounts = {};
    logs.forEach(log => {
      const date = log.createdAtDate;
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);
  }, [logs]);

  // Entity distribution - using the filtered logs
  const entityData = useMemo(() => {
    const entityCounts = {};
    logs.forEach(log => {
      const entity = log.entityLabel;
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });
    return Object.entries(entityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const totalBusinessActions = totalCount || logs.length;
  const uniqueUsers = new Set(logs.map(l => l.userName)).size;

  // Calculate today's activity count from the filtered logs
  const todayStr = dayjs().tz(LOCAL_TIMEZONE).format("DD MMM YYYY");
  const todayActivity = logs.filter(l => l.createdAtDate === todayStr).length;

  return (
    <div className="audit-dashboard" style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card bordered={false} className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div className="flex justify-between items-center">
            <div>
              <Text type="secondary" className="text-xs uppercase tracking-wide">Business Actions</Text>
              <div className="text-3xl font-bold mt-2" style={{ color: NCBA_COLORS.primary }}>{totalBusinessActions.toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${NCBA_COLORS.primary}10` }}>
              <CheckSquareOutlined style={{ fontSize: 24, color: NCBA_COLORS.primary }} />
            </div>
          </div>
        </Card>
        <Card bordered={false} className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div className="flex justify-between items-center">
            <div>
              <Text type="secondary" className="text-xs uppercase tracking-wide">Active Users</Text>
              <div className="text-3xl font-bold mt-2" style={{ color: NCBA_COLORS.secondary }}>{uniqueUsers}</div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${NCBA_COLORS.secondary}10` }}>
              <TeamOutlined style={{ fontSize: 24, color: NCBA_COLORS.secondary }} />
            </div>
          </div>
        </Card>
        <Card bordered={false} className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div className="flex justify-between items-center">
            <div>
              <Text type="secondary" className="text-xs uppercase tracking-wide">Success Rate</Text>
              <div className="text-3xl font-bold mt-2" style={{ color: NCBA_COLORS.success }}>
                {logs.length > 0 ? Math.round((logs.filter(l => l.raw?.status >= 200 && l.raw?.status < 300).length / logs.length) * 100) : 0}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${NCBA_COLORS.success}10` }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: NCBA_COLORS.success }} />
            </div>
          </div>
        </Card>
        <Card bordered={false} className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div className="flex justify-between items-center">
            <div>
              <Text type="secondary" className="text-xs uppercase tracking-wide">Today's Activity</Text>
              <div className="text-3xl font-bold mt-2" style={{ color: NCBA_COLORS.accent }}>{todayActivity}</div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${NCBA_COLORS.accent}10` }}>
              <CalendarOutlined style={{ fontSize: 24, color: NCBA_COLORS.accent }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart - Actions by Type */}
        <Card bordered={false} title="Action Distribution" className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={actionTypeData} margin={{ bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, angle: -25, textAnchor: 'end' }} height={55} />
              <YAxis type="number" axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Bar dataKey="value" fill={NCBA_COLORS.primary} radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* User Activity */}
        <Card bordered={false} title="Top Users by Activity" className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={userActivityData} margin={{ bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, angle: -25, textAnchor: 'end' }} height={55} />
              <YAxis type="number" axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Bar dataKey="actions" fill={NCBA_COLORS.secondary} radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Trend */}
        <Card bordered={false} title="Activity Trend" className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border }}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={activityOverTime}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NCBA_COLORS.primary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={NCBA_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Area type="monotone" dataKey="count" stroke={NCBA_COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Role Distribution Pie */}
        <Card bordered={false} title="Role Distribution" className="rounded-2xl border" style={{ borderColor: NCBA_COLORS.border }}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || NCBA_COLORS.primary} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

// Compact Audit Table Component
const AuditTable = ({ logs, loading, columns, pagination, onChange }) => {
  return (
    <Table
      rowKey="key"
      columns={columns}
      dataSource={logs}
      loading={loading}
      scroll={{ x: 1240 }}
      onChange={onChange}
      pagination={{
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
        size: "small",
        ...pagination,
      }}
      size="small"
    />
  );
};

const AuditLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(undefined);
  const [selectedAction, setSelectedAction] = useState(undefined);
  const [selectedEntity, setSelectedEntity] = useState(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [timeSortOrder, setTimeSortOrder] = useState("descend");
  const [activeView, setActiveView] = useState("dashboard");

  const [exportModal, setExportModal] = useState({ open: false, format: null });
  const [exportScope, setExportScope] = useState("100");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const { data: usersData = [], isLoading: isUsersLoading, refetch: refetchUsers } = useGetUsersQuery();
  const { data: statsData, refetch: refetchStats } = useGetAuditLogStatsQuery();
  const [triggerFetchAuditLogs] = useLazyGetAuditLogsQuery();

  // Reset page when filters are changed
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUserId, selectedAction, selectedEntity, debouncedSearch, dateRange, activeView]);

  // Fetch up to 1000 latest audit logs in one swift query, mimicking the seamless and snappy performance of the Users page
  const {
    data: auditLogsResult,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    error: logsFetchError,
    refetch: refetchAuditLogs,
  } = useGetAuditLogsQuery({ limit: 1000 }, {
    refetchOnFocus: true,
  });

  const users = useMemo(() => getUsersArray(usersData), [usersData]);

  // Map and normalize all loaded logs
  const allNormalizedLogs = useMemo(() => {
    const raw = Array.isArray(auditLogsResult?.logs) ? auditLogsResult.logs : [];
    return raw.map((log, index) => normalizeAuditLog(log, index));
  }, [auditLogsResult]);

  // Filter to business logs only (exclude login/logout, etc.)
  const allBusinessLogs = useMemo(() => filterBusinessLogs(allNormalizedLogs), [allNormalizedLogs]);

  // Filter options: dynamic list of actions actually present in our business logs
  const actionOptions = useMemo(() => {
    const actions = [...new Set(allBusinessLogs.map((log) => log.actionCategory))];
    return actions.filter(Boolean).map((value) => ({ value, label: titleize(value) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [allBusinessLogs]);

  // Filter options: dynamic list of entities actually present in our business logs
  const entityOptions = useMemo(() => {
    const entities = [...new Set(allBusinessLogs.map((log) => log.entityLabel))];
    return entities.filter(Boolean).map((value) => ({ value, label: value })).sort((a, b) => a.label.localeCompare(b.label));
  }, [allBusinessLogs]);

  // Perform fully responsive client-side filtering, searching, and sorting
  const filteredAuditLogs = useMemo(() => {
    let result = [...allBusinessLogs];

    // User filter
    if (selectedUserId) {
      result = result.filter(log => log.raw?.performedById === selectedUserId);
    }

    // Action filter
    if (selectedAction) {
      result = result.filter(log => log.actionCategory === selectedAction);
    }

    // Entity filter
    if (selectedEntity) {
      result = result.filter(log => log.entityLabel === selectedEntity);
    }

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(log =>
        log.userName.toLowerCase().includes(query) ||
        log.userRole.toLowerCase().includes(query) ||
        log.actionLabel.toLowerCase().includes(query) ||
        log.entityLabel.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        log.referenceNumber.toLowerCase().includes(query) ||
        log.ipAddress.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startMs = dateRange[0].startOf("day").valueOf();
      const endMs = dateRange[1].endOf("day").valueOf();
      result = result.filter(log => log.createdAtMs >= startMs && log.createdAtMs <= endMs);
    }

    // Time sort ordering
    const direction = timeSortOrder === "ascend" ? 1 : -1;
    return result.sort((left, right) => (left.createdAtMs - right.createdAtMs) * direction);
  }, [allBusinessLogs, selectedUserId, selectedAction, selectedEntity, debouncedSearch, dateRange, timeSortOrder]);

  const totalCount = filteredAuditLogs.length;

  const isTableLoading = isLogsLoading || isLogsFetching;

  const userOptions = useMemo(
    () => users.filter((user) => user?._id && user?.name).map((user) => ({ label: `${user.name}`, value: user._id })).sort((a, b) => a.label.localeCompare(b.label)),
    [users],
  );

  const isBusy = isLogsLoading || isLogsFetching || isUsersLoading;
  const auditError = logsFetchError;
  const errorMessage = getErrorMessage(auditError);

  const handleRefresh = () => {
    refetchAuditLogs();
    refetchStats();
    refetchUsers();
  };
  const handleSearchChange = (event) => { setCurrentPage(1); setSearchInput(event.target.value); };
  const handleUserChange = (value) => { setCurrentPage(1); setSelectedUserId(value); };
  const handleActionChange = (value) => { setCurrentPage(1); setSelectedAction(value); };
  const handleEntityChange = (value) => { setCurrentPage(1); setSelectedEntity(value); };
  const handleDateRangeChange = (value) => { setCurrentPage(1); setDateRange(value); };
  const clearFilters = () => {
    setCurrentPage(1); setSelectedUserId(undefined); setSelectedAction(undefined);
    setSelectedEntity(undefined); setDateRange(null); setSearchInput("");
  };

  const handleExportFormat = (format) => { setExportScope("100"); setExportModal({ open: true, format }); };
  const handleExportConfirm = async () => {
    const requestedCount = exportScope === "all" ? filteredAuditLogs.length : parseInt(exportScope, 10);
    const format = exportModal.format;
    setExportModal({ open: false, format: null });
    if (!format) return;

    setIsExporting(true);
    try {
      // Export exactly the requested count from the already filtered in-memory logs
      const finalExportLogs = filteredAuditLogs.slice(0, requestedCount);
      const fn = EXPORT_DISPATCH[format];
      if (fn) fn(finalExportLogs);
    } catch (err) {
      console.error("Failed to export logs:", err);
      message.error("Failed to export logs");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      title: "User", key: "user", width: 200, render: (_, record) => {
        const roleStyle = ROLE_STYLES[record.userRole] || ROLE_STYLES.System;
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-gradient-to-br from-[#dfece6] to-[#e5cfaa]">{record.userName.charAt(0).toUpperCase()}</div>
            <div>
              <div className="font-semibold" style={{ color: "#15313a" }}>{record.userName}</div>
              <Tag className="border-none mt-0.5" style={{ background: roleStyle.background, color: roleStyle.color }}>{record.userRole}</Tag>
            </div>
          </div>
        );
      }
    },
    {
      title: "Action", key: "action", width: 175, render: (_, record) => {
        const actionStyle = ACTION_STYLES[record.actionCategory] || ACTION_STYLES.OTHER;
        return <Tag className="border-none font-semibold px-2 py-0.5 rounded" style={{ background: actionStyle.background, color: actionStyle.color }}>{record.actionLabel}</Tag>;
      }
    },
    { title: "Entity", dataIndex: "entityLabel", key: "entityLabel", width: 120, render: (value) => <Text strong>{value}</Text> },
    {
      title: "Description", dataIndex: "briefDescription", key: "description", ellipsis: true, render: (brief, record) => (
        <Tooltip title={<span className="whitespace-pre-wrap">{record.description}</span>} placement="topLeft">
          <Text style={{ color: "#223843" }}>{brief}</Text>
        </Tooltip>
      )
    },
    { title: "Reference", dataIndex: "referenceNumber", key: "referenceNumber", width: 140, render: (value) => <Text className="font-mono" style={{ color: "#1f4b57" }}>{value || "-"}</Text> },
    {
      title: "IP address",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 130,
      ellipsis: true,
      render: (value, record) => (
        <Tooltip title={record.ipAddress && record.ipAddress !== "-" ? record.ipAddress : undefined}>
          <Text className="font-mono text-xs" style={{ color: "#1f4b57" }}>{value || "-"}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Timestamp", dataIndex: "createdAtMs", key: "createdAt", width: 170, sorter: true, sortDirections: ["descend", "ascend"], sortOrder: timeSortOrder, render: (_, record) => (
        <Tooltip title={record.createdAtRelative}>
          <div>
            <div className="font-medium">{record.createdAtDate}</div>
            <div className="text-xs" style={{ color: "#62717f" }}>{record.createdAtTime}</div>
          </div>
        </Tooltip>
      )
    },
  ];

  return (
    <div className="audit-logs-container min-h-screen p-6" style={{ background: "#ffffff" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${NCBA_COLORS.primary}15` }}>
                <FileOutlined style={{ color: NCBA_COLORS.primary, fontSize: 16 }} />
              </div>
              <span className="text-xs font-extrabold tracking-wider uppercase" style={{ color: NCBA_COLORS.neutral }}>Business Activity Audit Trail</span>
            </div>
            <Title level={2} className="m-0" style={{ color: "#15313a", letterSpacing: "-0.03em" }}>Audit Trail</Title>
            <Text style={{ color: NCBA_COLORS.neutral, fontSize: 15 }}>Real-time monitoring system events, user actions, and system integrity</Text>
          </div>
          <Space size="middle">
            <div className="bg-black/5 p-1 rounded-xl flex gap-1">
              <Button
                type={activeView === "dashboard" ? "primary" : "text"}
                icon={<DashboardOutlined />}
                onClick={() => setActiveView("dashboard")}
                className="h-9 rounded-lg"
                style={{ background: activeView === "dashboard" ? NCBA_COLORS.primary : "transparent", color: activeView === "dashboard" ? "#fff" : NCBA_COLORS.neutral }}
              >
                Dashboard
              </Button>
              <Button
                type={activeView === "logs" ? "primary" : "text"}
                icon={<TableOutlined />}
                onClick={() => setActiveView("logs")}
                className="h-9 rounded-lg"
                style={{ background: activeView === "logs" ? NCBA_COLORS.primary : "transparent", color: activeView === "logs" ? "#fff" : NCBA_COLORS.neutral }}
              >
                Audit Logs
              </Button>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isBusy}
              className="rounded-xl h-11 w-11"
            />
          </Space>
        </div>
      </div>

      {activeView === "dashboard" ? (
        <AuditDashboard logs={filteredAuditLogs} stats={statsData} users={users} totalCount={totalCount} />
      ) : (
        <>
          {/* Filters */}
          <Card bordered={false} className="rounded-2xl mb-6 border" style={{ borderColor: NCBA_COLORS.border }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <Text strong className="text-xs" style={{ color: NCBA_COLORS.neutral }}>Search</Text>
                <Input allowClear value={searchInput} onChange={handleSearchChange} prefix={<SearchOutlined style={{ color: NCBA_COLORS.primary }} />} placeholder="Search logs..." className="mt-1 rounded-lg" />
              </div>
              <div>
                <Text strong className="text-xs" style={{ color: NCBA_COLORS.neutral }}>User</Text>
                <Select allowClear showSearch loading={isUsersLoading} optionFilterProp="label" placeholder="All Users" value={selectedUserId} onChange={handleUserChange} options={userOptions} className="w-full mt-1 rounded-lg" />
              </div>
              <div>
                <Text strong className="text-xs" style={{ color: NCBA_COLORS.neutral }}>Action</Text>
                <Select allowClear showSearch optionFilterProp="label" placeholder="All Actions" value={selectedAction} onChange={handleActionChange} options={actionOptions} className="w-full mt-1 rounded-lg" />
              </div>
              <div>
                <Text strong className="text-xs" style={{ color: NCBA_COLORS.neutral }}>Entity</Text>
                <Select allowClear showSearch optionFilterProp="label" placeholder="All Entities" value={selectedEntity} onChange={handleEntityChange} options={entityOptions} className="w-full mt-1 rounded-lg" />
              </div>
              <div>
                <Text strong className="text-xs" style={{ color: NCBA_COLORS.neutral }}>Date Range</Text>
                <RangePicker value={dateRange} onChange={handleDateRangeChange} className="w-full mt-1 rounded-lg" />
              </div>
              <div className="flex items-end">
                <Button block icon={<FilterOutlined />} onClick={clearFilters} className="rounded-lg h-10">Reset Filters</Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: NCBA_COLORS.border }}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <Title level={4} className="m-0" style={{ color: "#15313a" }}>Business Event Log</Title>
                <Text type="secondary" className="text-sm">Showing {totalCount} business events</Text>
              </div>
              {/* The new universal ExportMenu handles everything internally now */}
              <ExportMenu 
                data={filteredAuditLogs} 
                columns={EXPORT_COLUMNS} 
                filename="business-audit-trail" 
                title="Business Audit Trail" 
                loading={isLogsFetching} 
              />
            </div>

            {auditError ? (
              <Alert type="error" showIcon message="Sync Error" description={errorMessage} action={<Button size="small" onClick={handleRefresh}>Retry</Button>} className="rounded-xl" />
            ) : (
              <AuditTable
                logs={filteredAuditLogs}
                loading={isTableLoading}
                columns={columns}
                pagination={{
                  current: currentPage,
                  pageSize: AUDIT_LOGS_PAGE_SIZE,
                  total: totalCount,
                  showSizeChanger: false,
                }}
                onChange={(nextPagination, _filters, sorter) => {
                  setCurrentPage(nextPagination.current || 1);
                  if (!Array.isArray(sorter) && sorter?.columnKey === "createdAt") setTimeSortOrder(sorter.order || "descend");
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Export Modal */}
      <Modal
        open={exportModal.open}
        title="Export Business Audit Data"
        onCancel={() => setExportModal({ open: false, format: null })}
        onOk={handleExportConfirm}
        okText="Generate Report"
        okButtonProps={{}}
        width={420}
        className="rounded-2xl"
      >
        <p style={{ color: "#62717f", marginBottom: 16 }}>
          Select the number of business records to include in the <strong>{exportModal.format?.toUpperCase()}</strong> export.
          {totalCount > 0 && (
            <span className="block mt-2 text-sm" style={{ color: NCBA_COLORS.primary }}>
              {totalCount} total business records match your filters.
            </span>
          )}
        </p>
        <Radio.Group value={exportScope} onChange={(e) => setExportScope(e.target.value)} className="flex flex-col gap-3">
          <Radio value="50">First 50 records</Radio>
          <Radio value="100">First 100 records</Radio>
          <Radio value="500">First 500 records</Radio>
          <Radio value="all">All available records ({totalCount})</Radio>
        </Radio.Group>
      </Modal>
    </div>
  );
};

export default AuditLogsPage;