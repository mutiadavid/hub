import React, { useMemo, useState } from "react";
import {
  Table,
  Space,
  Typography,
  Button,
  Select,
  message,
  Tooltip,
  Modal,
  Descriptions,
  Spin,
  Empty,
  List,
  Avatar,
  Tag as AntTag,
  Divider,
} from "antd";
import {
  DownloadOutlined,
  UserOutlined,
  FileTextOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckOutlined,
  PaperClipOutlined,
  NotificationOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useGetUsersQuery, useLazyGetUserActivityQuery } from "../../api/userApi";
import { useGetAuditLogsQuery } from "../../api/auditApi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { countUsersByRole, formatRoleLabel, normalizeRoleKey } from "./adminRoleUtils";
import { formatDateTimeDetailed, formatCommentTimestamp } from "../../utils/checklistUtils";
import "../../styles/creatorDesignSystem.css";

dayjs.extend(relativeTime);

const { Text } = Typography;

const ROLE_TEXT_COLORS = {
  admin: "#8f1d2c",
  approver: "#6D5A43",
  cocreator: "#40534C",
  cochecker: "#5E686D",
  customer: "#1A3636",
  rm: "#8B5E3C",
};

const getActivityTone = (message = "", action = "") => {
  const normalized = `${message} ${action}`.toLowerCase();

  if (
    normalized.includes("rejected") ||
    normalized.includes("returned") ||
    normalized.includes("action") ||
    normalized.includes("failed") ||
    normalized.includes("archive")
  ) {
    return {
      label: "Critical",
      tagBg: "rgba(248, 113, 113, 0.14)",
      tagColor: "#B91C1C",
      iconBg: "rgba(248, 113, 113, 0.12)",
      iconColor: "#B91C1C",
      accent: "#DC2626",
      icon: <ClockCircleOutlined />
    };
  }

  if (
    normalized.includes("approved") ||
    normalized.includes("completed") ||
    normalized.includes("login") ||
    normalized.includes("success") ||
    normalized.includes("logged in")
  ) {
    return {
      label: "Success",
      tagBg: "rgba(34, 197, 94, 0.14)",
      tagColor: "#15803D",
      iconBg: "rgba(34, 197, 94, 0.12)",
      iconColor: "#15803D",
      accent: "#65A30D",
      icon: <CheckCircleOutlined />
    };
  }

  if (
    normalized.includes("submitted") ||
    normalized.includes("create") ||
    normalized.includes("update") ||
    normalized.includes("reassign")
  ) {
    return {
      label: "Update",
      tagBg: "rgba(59, 130, 246, 0.14)",
      tagColor: "#2563EB",
      iconBg: "rgba(59, 130, 246, 0.12)",
      iconColor: "#2563EB",
      accent: "#1A3636",
      icon: <FileTextOutlined />
    };
  }

  return {
    label: "Activity",
    tagBg: "rgba(148, 163, 184, 0.18)",
    tagColor: "#475569",
    iconBg: "rgba(148, 163, 184, 0.12)",
    iconColor: "#475569",
    accent: "#D6BD98",
    icon: <HistoryOutlined />
  };
};

const HumanizeGlobalAction = (action, httpMethod, resource) => {
  const p = (resource || "").toLowerCase();
  const a = (action || httpMethod || "").toUpperCase();
  const map = {
    LOGIN: "Logged in", LOGOUT: "Logged out",
    CREATE_USER: "Created a user", TOGGLE_ACTIVE: "Toggled user status",
    CHANGE_ROLE: "Changed a user role", REASSIGN_TASKS: "Reassigned tasks",
    CREATE_DCL: "Created a DCL", UPDATE_DCL: "Updated a DCL", DELETE_DCL: "Deleted a DCL",
    APPROVE: "Approved", REJECT: "Rejected", RETURN: "Returned for rework",
    UPLOAD_DOCUMENT: "Uploaded a document", DELETE_DOCUMENT: "Deleted a document",
    ADD_DOCUMENT: "Added a document", ADD_COMMENT: "Added a comment",
    CREATE_DEFERRAL: "Created a deferral", UPDATE_DEFERRAL: "Updated a deferral",
    AD_SEARCH: "Searched Active Directory", ARCHIVE_USER: "Archived a user",
    TRANSFER_ROLE: "Transferred a role", HEARTBEAT: "Heartbeat",
    POST: p.includes("/checklist") ? "Created a DCL" : p.includes("/deferral") ? "Created a deferral" : "Created a record",
    PUT: p.includes("/active") ? "Toggled user status" : p.includes("/role") ? "Changed a role" : "Updated a record",
    DELETE: "Deleted a record",
  };
  return map[a] || a.charAt(0) + a.slice(1).toLowerCase().replace(/_/g, " ");
};

const AuditLogsPage = () => {
  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  const [selectedRole, setSelectedRole] = useState("all");
  const [downloadLoading, setDownloadLoading] = useState({});
  const [viewActivityModalOpen, setViewActivityModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserActivities, setSelectedUserActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [triggerGetUserActivity] = useLazyGetUserActivityQuery();

  const usersByRole = useMemo(() => ({ all: users.length, ...countUsersByRole(users) }), [users]);

  const { data: globalLogsData, isLoading: globalLogsLoading, refetch: refetchGlobalLogs } = useGetAuditLogsQuery({ page: 1, limit: 30 });
  const globalLogs = globalLogsData?.logs || [];

  const loadUserActivities = async (userId) => {
    if (!userId) return [];
    // preferCacheValue=false: always fetch fresh data so we never show stale per-user logs
    const response = await triggerGetUserActivity(userId, false).unwrap();
    return response?.activities || [];
  };

  const handleViewActivity = async (user) => {
    setSelectedUser(user);
    setViewActivityModalOpen(true);
    setActivityLoading(true);

    try {
      const activities = await loadUserActivities(user._id);
      setSelectedUserActivities(activities);
    } catch (error) {
      console.error("Error loading user activity:", error);
      setSelectedUserActivities([]);
      message.error("Failed to load user activity");
    } finally {
      setActivityLoading(false);
    }
  };

  const generateUserActivityPDF = async (user) => {
    try {
      setDownloadLoading((prev) => ({ ...prev, [user._id]: true }));

      const activities = await loadUserActivities(user._id);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(26, 54, 54);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("User Activity Report", 14, 20);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      let yPos = 45;
      doc.text(`User: ${user.name}`, 14, yPos);
      yPos += 8;
      doc.text(`Email: ${user.email}`, 14, yPos);
      yPos += 8;
      doc.text(`Role: ${formatRoleLabel(user.role)}`, 14, yPos);
      yPos += 8;
      doc.text(`Status: ${user.active ? "Active" : "Inactive"}`, 14, yPos);
      yPos += 8;
      doc.text(
        `Joined: ${formatDateTimeDetailed(user.createdAt)}`,
        14,
        yPos,
      );
      yPos += 8;
      doc.text(
        `Last Updated: ${formatDateTimeDetailed(user.updatedAt)}`,
        14,
        yPos,
      );
      yPos += 15;

      const activityData = activities.length
        ? activities.map((activity) => [
          formatDateTimeDetailed(activity.date),
          activity.source || activity.type || "Activity",
          activity.actionLabel || activity.action || "Activity",
          activity.summary || activity.details || "-",
        ])
        : [["-", "System", "No recorded activity", "No actions found for this user in the selected logs."]];

      autoTable(doc, {
        startY: yPos,
        head: [["Time (EAT)", "Source", "Activity", "Details"]],
        body: activityData,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 10,
        },
        headStyles: {
          fillColor: [26, 54, 54],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        margin: { left: 14, right: 14 },
      });

      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${formatDateTimeDetailed(new Date())}`,
        14,
        pageHeight - 10,
      );

      doc.save(`${user.name}_activity_${dayjs().format("YYYY-MM-DD")}.pdf`);
      message.success(`Downloaded activity report for ${user.name}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to download activity report");
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  const filteredUsers = useMemo(
    () =>
      selectedRole === "all"
        ? users
        : users.filter((user) => normalizeRoleKey(user.role) === selectedRole),
    [users, selectedRole],
  );

  const totalLogs = filteredUsers.length;
  const activeUsers = filteredUsers.filter((user) => user.active).length;
  const inactiveUsers = totalLogs - activeUsers;
  const filteredUsersByRole = useMemo(() => countUsersByRole(filteredUsers), [filteredUsers]);
  const adminUsers = filteredUsersByRole.admin;
  const approverUsers = filteredUsersByRole.approver;
  const customerUsers = filteredUsersByRole.customer;
  const coCreatorUsers = filteredUsersByRole.cocreator;
  const rmUsers = filteredUsersByRole.rm;
  const coCheckerUsers = filteredUsersByRole.cochecker;

  const statCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total",
        value: totalLogs,
        note: "Users in current view",
        accent: "#1A3636",
        surface: "linear-gradient(135deg, #ffffff 0%, #f5f7f4 100%)",
        icon: <FileTextOutlined />,
      },
      {
        key: "active",
        label: "Active",
        value: activeUsers,
        note: "Enabled accounts",
        accent: "#40534C",
        surface: "linear-gradient(135deg, #ffffff 0%, #eef5ef 100%)",
        icon: <CheckCircleOutlined />,
      },
      {
        key: "inactive",
        label: "Inactive",
        value: inactiveUsers,
        note: "Disabled accounts",
        accent: "#8B5E3C",
        surface: "linear-gradient(135deg, #ffffff 0%, #fbf2e8 100%)",
        icon: <ClockCircleOutlined />,
      },
      {
        key: "admins",
        label: "Admins",
        value: adminUsers,
        note: "Administrator accounts",
        accent: "#8f1d2c",
        surface: "linear-gradient(135deg, #ffffff 0%, #fdf0f2 100%)",
        icon: <UserOutlined />,
      },
      {
        key: "approvers",
        label: "Approvers",
        value: approverUsers,
        note: "Approver accounts",
        accent: "#6D5A43",
        surface: "linear-gradient(135deg, #ffffff 0%, #f7f1ea 100%)",
        icon: <CheckCircleOutlined />,
      },
      {
        key: "customers",
        label: "Customers",
        value: customerUsers,
        note: "Customer accounts",
        accent: "#7A5C2E",
        surface: "linear-gradient(135deg, #ffffff 0%, #fcf6ea 100%)",
        icon: <UserOutlined />,
      },
      {
        key: "cocreators",
        label: "CO Creators",
        value: coCreatorUsers,
        note: "Creator accounts",
        accent: "#5E686D",
        surface: "linear-gradient(135deg, #ffffff 0%, #eef1f2 100%)",
        icon: <UserOutlined />,
      },
      {
        key: "rm",
        label: "RMs",
        value: rmUsers,
        note: "Relationship managers",
        accent: "#6C4E31",
        surface: "linear-gradient(135deg, #ffffff 0%, #f8f1eb 100%)",
        icon: <UserOutlined />,
      },
      {
        key: "cocheckers",
        label: "CO Checkers",
        value: coCheckerUsers,
        note: "Checker accounts",
        accent: "#54656F",
        surface: "linear-gradient(135deg, #ffffff 0%, #eef2f5 100%)",
        icon: <CheckCircleOutlined />,
      },
    ],
    [
      totalLogs,
      activeUsers,
      inactiveUsers,
      adminUsers,
      approverUsers,
      customerUsers,
      coCreatorUsers,
      rmUsers,
      coCheckerUsers,
    ],
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg, #F5F7F4 0%, #D6BD98 100%)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#1A3636",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="admin-page__value">{name || "-"}</div>
            <div className="admin-page__value admin-page__value--muted">{record.email || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Approver", value: "approver" },
        { text: "CO Creator", value: "cocreator" },
        { text: "CO Checker", value: "cochecker" },
        { text: "Customer", value: "customer" },
        { text: "RM", value: "rm" },
      ],
      onFilter: (value, record) => normalizeRoleKey(record.role) === value,
      render: (role) => {
        const roleKey = normalizeRoleKey(role);

        return (
          <span
            className="admin-page__status-text"
            style={{ color: ROLE_TEXT_COLORS[roleKey] || "var(--color-text-medium)" }}
          >
            {formatRoleLabel(role)}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "status",
      render: (active) => (
        <span
          className="admin-page__status-text"
          style={{ color: active ? "#40534C" : "#8f1d2c" }}
        >
          {active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => (
        <Tooltip title={formatDateTimeDetailed(date)}>
          <span className="admin-page__value admin-page__value--muted">
            {dayjs(date).format("YYYY-MM-DD")}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Last Activity",
      dataIndex: "lastSeen",
      key: "lastActivity",
      sorter: (a, b) => new Date(b.lastSeen || b.updatedAt) - new Date(a.lastSeen || a.updatedAt),
      render: (date, record) => {
        const ts = date || record.updatedAt;
        return (
          <Tooltip title={formatDateTimeDetailed(ts)}>
            <span className="admin-page__value admin-page__value--muted">
              {dayjs(ts).fromNow()}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div className="admin-page__action-group">
          <Tooltip title="View activity details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewActivity(record)}
              className="admin-page__action-button admin-page__action-button--primary admin-page__action-button--compact"
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title="Download activity report">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              loading={downloadLoading[record._id]}
              onClick={() => generateUserActivityPDF(record)}
              className="admin-page__action-button admin-page__action-button--secondary admin-page__action-button--compact"
            >
              Download
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const activityColumns = [
    {
      title: "Time",
      dataIndex: "date",
      key: "date",
      width: 170,
      fixed: 'left',
      render: (date) => <span className="admin-page__value admin-page__value--muted" style={{ fontSize: '11px' }}>{formatDateTimeDetailed(date)}</span>,
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 100,
      render: (value) => <span className="admin-page__status-text" style={{ fontSize: '11px', opacity: 0.8 }}>{value || "Activity"}</span>,
    },
    {
      title: "Activity",
      dataIndex: "actionLabel",
      key: "actionLabel",
      width: 150,
      render: (value, record) => (
        <span className="admin-page__value" style={{ fontWeight: 600 }}>
          {value || record.action || "Activity"}
        </span>
      ),
    },
    {
      title: "Details",
      key: "summary",
      minWidth: 250,
      render: (_, record) => (
        <div style={{ maxWidth: 300 }}>
          <div className="admin-page__value" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {record.summary || record.details || "-"}
          </div>
          {record.resource && record.resource !== record.summary ? (
            <div className="admin-page__value admin-page__value--muted" style={{ fontSize: '10px', marginTop: 2 }}>
              {record.resource}
            </div>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page creator-theme">
      <section className="admin-page__hero">
        <div className="admin-page__hero-copy">
          <span className="admin-page__eyebrow">Audit Workspace</span>
          <div className="admin-page__title-row">
            <h1 className="admin-page__title">Audit Logs</h1>
            <span className="admin-page__count">{totalLogs} users in view</span>
          </div>
          <p className="admin-page__subtitle">
            Track account activity snapshots, filter by role, and generate downloadable user activity reports using the same page language as the other updated admin screens.
          </p>
        </div>

        <div className="admin-page__hero-actions">
          <Select
            value={selectedRole}
            onChange={setSelectedRole}
            className="creator-select"
            style={{ width: 200 }}
            options={[
              { value: "all", label: `All (${usersByRole.all})` },
              { value: "admin", label: `Admin (${usersByRole.admin})` },
              { value: "approver", label: `Approver (${usersByRole.approver})` },
              { value: "cocreator", label: `CO Creator (${usersByRole.cocreator})` },
              { value: "cochecker", label: `CO Checker (${usersByRole.cochecker})` },
              { value: "customer", label: `Customer (${usersByRole.customer})` },
              { value: "rm", label: `RM (${usersByRole.rm})` },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              refetch();
              message.success("Data refreshed!");
            }}
            className="admin-page__action-button admin-page__action-button--ghost"
          >
            Refresh
          </Button>
        </div>
      </section>

      {/* ── Global System Activity Feed ── */}
      <section className="admin-page__table-card admin-page__table-card--lifted" style={{ marginBottom: 24 }}>
        <div className="admin-page__table-toolbar">
          <div className="admin-page__table-toolbar-copy">
            <h2 className="admin-page__table-toolbar-title">Recent System Activity</h2>
            <p className="admin-page__table-toolbar-subtitle">
              Live feed of the latest {globalLogs.length} audit events across the entire system.
            </p>
          </div>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => refetchGlobalLogs()}
            className="admin-page__action-button admin-page__action-button--ghost"
          >
            Refresh
          </Button>
        </div>

        {globalLogsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <Spin />
          </div>
        ) : globalLogs.length === 0 ? (
          <Empty description="No system activity recorded yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: "24px 0" }} />
        ) : (
          <div style={{ maxHeight: 420, overflowY: "auto", padding: "0 4px" }}>
            <List
              dataSource={globalLogs}
              pagination={false}
              renderItem={(log) => {
                const actor = log.performedBy?.name || log.performedByName || "System";
                const target = log.targetUser?.name || log.targetName || log.resourceId || "—";
                const actionLabel = HumanizeGlobalAction(log.action, log.httpMethod, log.resource);
                const tone = getActivityTone(log.details || log.action, log.action);
                const isSuccess = log.status === "success";
                return (
                  <div
                    key={log.id}
                    style={{
                      marginBottom: 6,
                      padding: "10px 14px",
                      background: "#fff",
                      borderRadius: 10,
                      border: "1px solid #f0f0f0",
                      borderLeft: `3px solid ${tone.accent}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: tone.iconBg,
                        color: tone.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 13,
                      }}
                    >
                      {tone.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <span style={{ color: tone.accent }}>{actor}</span>
                          {" "}{actionLabel.toLowerCase()}
                          {target !== "—" && <span style={{ color: "#6b7280" }}> → {target}</span>}
                        </span>
                        <AntTag
                          style={{
                            margin: 0,
                            fontSize: 10,
                            borderRadius: 5,
                            background: isSuccess ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            color: isSuccess ? "#15803D" : "#B91C1C",
                            border: "none",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {log.status || "success"}
                        </AntTag>
                      </div>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>
                        {dayjs(log.createdAt).fromNow()}
                        {log.ipAddress ? ` · ${log.ipAddress}` : ""}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </section>

      <section className="admin-page__split">
        <div className="admin-page__split-main">
          <section className="admin-page__table-card admin-page__table-card--lifted">
            <div className="admin-page__table-toolbar">
              <div className="admin-page__table-toolbar-copy">
                <h2 className="admin-page__table-toolbar-title">User Activity Register</h2>
                <p className="admin-page__table-toolbar-subtitle">
                  Filtered user activity records with quick access to details and export.
                </p>
              </div>
              <div className="admin-page__filter-row">
                <Text type="secondary">Role filter:</Text>
                <Text className="admin-page__value">{selectedRole === "all" ? "All users" : formatRoleLabel(selectedRole)}</Text>
              </div>
            </div>

            <div className="creator-table-shell admin-page__table-shell--compact" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
              <Table
                columns={columns}
                dataSource={filteredUsers}
                rowKey="_id"
                loading={isLoading}
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (total) => `Total ${total} users`,
                }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </section>
        </div>

        <aside className="admin-page__split-side admin-page__split-side--sticky">
          <div className="admin-page__stat-rail">
            {statCards.map((card) => (
              <article
                key={card.key}
                className="admin-page__stat-card admin-page__stat-card--compact"
                style={{
                  "--admin-stat-accent": card.accent,
                  "--admin-stat-surface": card.surface,
                }}
              >
                <div className="admin-page__stat-icon">{card.icon}</div>
                <span className="admin-page__stat-label">{card.label}</span>
                <span className="admin-page__stat-value">{card.value}</span>
                <span className="admin-page__stat-note">{card.note}</span>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <Modal
        open={viewActivityModalOpen}
        onCancel={() => setViewActivityModalOpen(false)}
        footer={null}
        title={null}
        width={850}
        className="admin-page__modal"
        styles={{
          body: { padding: 0 },
          content: { padding: 0, borderRadius: 16 },
        }}
      >
        <div className="admin-page__modal-header">
          <h2 className="admin-page__modal-title">User Activity Details</h2>
          <p className="admin-page__modal-subtitle">
            Review the selected account details and the actual actions recorded for this user.
          </p>
        </div>

        <div className="admin-page__modal-body">
          {selectedUser ? (
            <>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Name">{selectedUser.name || "-"}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedUser.email || "-"}</Descriptions.Item>
                <Descriptions.Item label="Role">{formatRoleLabel(selectedUser.role)}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <span
                    className="admin-page__status-text"
                    style={{ color: selectedUser.active ? "#40534C" : "#8f1d2c" }}
                  >
                    {selectedUser.active ? "Active" : "Inactive"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Joined">
                  {selectedUser.createdAt
                    ? formatDateTimeDetailed(selectedUser.createdAt)
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {selectedUser.updatedAt
                    ? formatDateTimeDetailed(selectedUser.updatedAt)
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Number">
                  {selectedUser.customerNumber || "N/A"}
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: "18px 0 14px" }}>Recorded Activity</Divider>

              {activityLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                  <Spin />
                </div>
              ) : selectedUserActivities.length ? (
                <div style={{ maxHeight: 500, overflowY: "auto", padding: "0 4px" }}>
                  <List
                    dataSource={selectedUserActivities}
                    pagination={{ pageSize: 8, size: "small", hideOnSinglePage: true }}
                    renderItem={(item) => {
                      const tone = getActivityTone(item.summary || item.details, item.actionLabel || item.action);
                      const timestamp = formatCommentTimestamp(item.date);

                      return (
                        <div
                          style={{
                            marginBottom: 8,
                            padding: "12px 16px",
                            background: "#fff",
                            borderRadius: 12,
                            border: "1px solid #f0f0f0",
                            borderLeft: `4px solid ${tone.accent}`,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: tone.iconBg,
                                color: tone.iconColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: 16
                              }}
                            >
                              {tone.icon}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 4
                              }}>
                                <span style={{
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: "#1f2937",
                                  lineHeight: 1.4,
                                  wordBreak: "break-word",
                                  marginRight: 8
                                }}>
                                  {item.summary || item.details || "Activity recorded"}
                                </span>
                                <AntTag style={{
                                  margin: 0,
                                  fontSize: 10,
                                  borderRadius: 6,
                                  background: tone.tagBg,
                                  color: tone.tagColor,
                                  border: "none",
                                  fontWeight: 600
                                }}>
                                  {item.source || tone.label}
                                </AntTag>
                              </div>

                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                color: "#64748b",
                                fontSize: 11
                              }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <CalendarOutlined style={{ fontSize: 10 }} />
                                  {timestamp}
                                </span>
                                {item.actionLabel && (
                                  <span style={{
                                    padding: "1px 6px",
                                    background: "#f1f5f9",
                                    borderRadius: 4,
                                    fontSize: 10,
                                    color: "#475569"
                                  }}>
                                    {item.actionLabel}
                                  </span>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              ) : (
                <Empty description="No recorded activity found for this user" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}

              <div className="admin-page__modal-footer">
                <Button
                  onClick={() => {
                    setViewActivityModalOpen(false);
                    setSelectedUserActivities([]);
                  }}
                  className="admin-page__action-button admin-page__action-button--secondary"
                >
                  Close
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  loading={downloadLoading[selectedUser._id]}
                  onClick={() => generateUserActivityPDF(selectedUser)}
                  className="admin-page__action-button admin-page__action-button--primary"
                >
                  Download Report
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
