import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
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

  if (normalized.includes("APPROVE")) return "APPROVE";
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

  const detailText = `${log.details || ""} ${log.targetName || ""}`;
  const patterns = [
    /\b(?:Deferral(?:\s+Number)?|DEFERRAL)[:\s#-]*([A-Z0-9][A-Z0-9./-]*)\b/i,
    /\b(?:DCL(?:\s+(?:No|Number))?|CHECKLIST)[:\s#-]*([A-Z0-9][A-Z0-9./-]*)\b/i,
  ];

  for (const pattern of patterns) {
    const match = detailText.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  if (["DCL", "Deferral"].includes(entityLabel)) {
    if (log.targetName && !isGuid(log.targetName)) return String(log.targetName);
    if (log.resourceId && !isGuid(log.resourceId)) return String(log.resourceId);
  }

  return "-";
};

const buildDescription = (log, normalized) => {
  if (log.details && String(log.details).trim()) {
    return String(log.details).trim();
  }

  if (log.errorMessage && String(log.errorMessage).trim()) {
    return String(log.errorMessage).trim();
  }

  const subject =
    normalized.entityLabel === "User"
      ? normalized.targetName || "a user"
      : normalized.referenceNumber !== "-"
        ? `${normalized.entityLabel} ${normalized.referenceNumber}`
        : normalized.entityLabel.toLowerCase();

  return `${normalized.userName} ${actionPhrase(normalized.actionCategory)} ${subject}.`;
};

const normalizeAuditLog = (log, index) => {
  const entityLabel = normalizeEntity(log.targetType || log.resource);
  const actionCategory = getActionCategory(log.action, log.httpMethod);
  const timestamp = dayjs(log.createdAt);
  const userName = log.performedBy?.name || log.performedByName || "System";
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
    createdAtExact: timestamp.isValid() ? timestamp.format("DD MMM YYYY, HH:mm:ss") : "-",
  };

  return {
    ...normalized,
    description: buildDescription(log, normalized),
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

  const users = useMemo(() => getUsersArray(usersData), [usersData]);
  const rawLogs = useMemo(() => (Array.isArray(auditData?.logs) ? auditData.logs : []), [auditData]);
  const total = Number(auditData?.total || 0);

  const auditLogs = useMemo(
    () => rawLogs.map((log, index) => normalizeAuditLog(log, index)),
    [rawLogs],
  );

  const sortedAuditLogs = useMemo(() => {
    const direction = timeSortOrder === "ascend" ? 1 : -1;
    return [...auditLogs].sort((left, right) => (left.createdAtMs - right.createdAtMs) * direction);
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
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value, record) => (
        <Tooltip title={value}>
          <div className="audit-trail-description-cell">
            <Text className="audit-trail-description-text">{value}</Text>
            <Text type="secondary" className="audit-trail-description-meta">
              {record.raw.endpoint || record.raw.status || "Audit event"}
            </Text>
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
      width: 190,
      sorter: true,
      sortDirections: ["descend", "ascend"],
      sortOrder: timeSortOrder,
      render: (_, record) => (
        <Tooltip title={record.createdAtExact}>
          <div className="audit-trail-time-cell">
            <Text strong>{record.createdAtRelative}</Text>
            <Text type="secondary">{record.createdAtExact}</Text>
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
    </div>
  );
};

export default AuditLogsPage;
