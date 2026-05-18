import React, { useEffect, useMemo } from "react";
import { Table, Badge, Typography, Button, Tooltip, Space } from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetOnlineUsersQuery } from "../../api/userApi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { formatRoleLabel, normalizeRoleKey } from "./adminRoleUtils";
import "../../styles/creatorDesignSystem.css";

dayjs.extend(relativeTime);

const { Text } = Typography;

const ROLE_COLORS = {
  admin: "#8f1d2c",
  cocreator: "#40534C",
  cochecker: "#5E686D",
  customer: "#1A3636",
  rm: "#8B5E3C",
};

const PIE_COLORS = {
  Admin: "#1A3636",
  "CO Creator": "#40534C",
  "CO Checker": "#5E686D",
  Customer: "#D6BD98",
  RM: "#8B5E3C",
};

const LiveUsers = () => {
  const { data, isLoading, refetch } = useGetOnlineUsersQuery(undefined, {
    pollingInterval: 10000,
  });

  const onlineUsers = useMemo(() => data?.users || [], [data]);
  const onlineCount = data?.count || 0;

  useEffect(() => {
    refetch();
  }, [refetch]);

  const roleDistribution = useMemo(() => {
    const roles = {};
    onlineUsers.forEach((user) => {
      const roleKey = normalizeRoleKey(user.role);
      roles[roleKey] = (roles[roleKey] || 0) + 1;
    });
    return Object.entries(roles).map(([role, count]) => ({
      name: formatRoleLabel(role),
      users: count,
    }));
  }, [onlineUsers]);

  const activityTrendData = useMemo(() => {
    const now = dayjs();

    return Array.from({ length: 11 }, (_, index) => {
      const minute = now.subtract(10 - index, "minute");
      const users = onlineUsers.filter((user) => {
        const seenAt = user?.lastSeen ? dayjs(user.lastSeen) : null;
        return seenAt && seenAt.isValid() && !seenAt.isBefore(minute);
      }).length;

      return {
        time: minute.format("HH:mm"),
        users,
      };
    });
  }, [onlineUsers]);

  const pieData = useMemo(
    () =>
      roleDistribution.map((item) => ({
        ...item,
        fill: PIE_COLORS[item.name] || "#D6BD98",
      })),
    [roleDistribution],
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge status="success" />
          <span className="admin-page__value">{name}</span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <span className="admin-page__value admin-page__value--muted">{email}</span>,
    },
    {
      title: "Customer #",
      dataIndex: "customerNumber",
      key: "customerNumber",
      render: (customerNumber) => (
        <span className="admin-page__value admin-page__value--mono admin-page__value--muted">
          {customerNumber || "N/A"}
        </span>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      filters: [
        { text: "System Administrator", value: "admin" },
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
          style={{ color: ROLE_COLORS[roleKey] || "var(--color-text-medium)" }}
        >
          {formatRoleLabel(role)}
        </span>
        );
      },
    },
    {
      title: "Login Time",
      dataIndex: "loginTime",
      key: "loginTime",
      sorter: (a, b) => new Date(a.loginTime) - new Date(b.loginTime),
      render: (loginTime) => (
        <Tooltip title={dayjs(loginTime).format("YYYY-MM-DD HH:mm:ss")}>
          <span className="admin-page__value admin-page__value--muted">{dayjs(loginTime).fromNow()}</span>
        </Tooltip>
      ),
    },
    {
      title: "Last Activity",
      dataIndex: "lastSeen",
      key: "lastSeen",
      sorter: (a, b) => new Date(a.lastSeen) - new Date(b.lastSeen),
      render: (lastSeen) => (
        <Tooltip title={dayjs(lastSeen).format("YYYY-MM-DD HH:mm:ss")}>
          <span className="admin-page__value admin-page__value--muted">{dayjs(lastSeen).fromNow()}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <span className="admin-page__status-text" style={{ color: "#40534C" }}>
          {record.status || "Active in last 10m"}
        </span>
      ),
    },
    {
      title: "Sessions",
      dataIndex: "socketCount",
      key: "socketCount",
      render: (count) => <span className="admin-page__value">{count}</span>,
    },
  ];

  return (
    <div className="admin-page creator-theme">
      <section className="admin-page__hero">
        <div className="admin-page__hero-copy">
          <span className="admin-page__eyebrow">Realtime Monitoring</span>
          <div className="admin-page__title-row">
            <h1 className="admin-page__title">Live Users</h1>
              <span className="admin-page__count">{onlineCount} users currently online</span>
          </div>
          <p className="admin-page__subtitle">
            Monitor users who are currently online and see when they logged in and last interacted.
          </p>
        </div>

        <div className="admin-page__hero-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
            className="admin-page__action-button admin-page__action-button--ghost"
          >
            Refresh
          </Button>
        </div>
      </section>

      <section className="admin-page__stat-grid">
        <article
          className="admin-page__stat-card"
          style={{
            "--admin-stat-accent": "#40534C",
            "--admin-stat-surface": "#ffffff",
          }}
        >
          <div className="admin-page__stat-icon">
            <WifiOutlined />
          </div>
          <span className="admin-page__stat-label">Currently Online</span>
          <span className="admin-page__stat-value">{onlineCount}</span>
          <span className="admin-page__stat-note">Users currently connected</span>
        </article>
      </section>

      <section className="admin-page__section-grid">
        <article className="admin-page__chart-card">
          <div className="admin-page__card-header">
            <div className="admin-page__card-copy">
              <h2 className="admin-page__card-title">Activity Trend</h2>
              <p className="admin-page__card-subtitle">Observed active-user counts across the last 10 minutes.</p>
            </div>
          </div>
          <div className="admin-page__chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6BD98" opacity={0.45} />
                <XAxis dataKey="time" stroke="#677D6A" />
                <YAxis stroke="#677D6A" />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#1A3636"
                  dot={{ fill: "#1A3636", r: 4 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-page__chart-card">
          <div className="admin-page__card-header">
            <div className="admin-page__card-copy">
              <h2 className="admin-page__card-title">Users by Role</h2>
              <p className="admin-page__card-subtitle">Role distribution for users currently online.</p>
            </div>
          </div>
          <div className="admin-page__chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, users }) => `${name}: ${users}`}
                  outerRadius={82}
                  dataKey="users"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="admin-page__table-card">
        <div className="admin-page__table-toolbar">
          <div className="admin-page__table-toolbar-copy">
            <h2 className="admin-page__table-toolbar-title">Active Sessions</h2>
            <p className="admin-page__table-toolbar-subtitle">
              View users currently online, including when they logged in and last interacted.
            </p>
          </div>
          <Space>
            <Text type="secondary">Auto-refresh every 10s</Text>
          </Space>
        </div>
        <div className="creator-table-shell" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
              <Table
                columns={columns}
                dataSource={onlineUsers}
                rowKey="_id"
                loading={isLoading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} currently online`,
                }}
              />
        </div>
      </section>
    </div>
  );
};

export default LiveUsers;
