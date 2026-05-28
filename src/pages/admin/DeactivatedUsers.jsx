import React, { useMemo, useState } from "react";
import { Table, Button, Space, Typography, Modal, message } from "antd";
import {
  PoweroffOutlined,
  SwapOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import ReassignModal from "./ReassignModal";
import { useGetUsersQuery, useReassignTasksMutation, useToggleActiveMutation } from "../../api/userApi";
import { toast } from "react-toastify";
import { formatRoleLabel, normalizeRoleKey } from "./adminRoleUtils";
import "../../styles/creatorDesignSystem.css";

const { Text } = Typography;
const { confirm } = Modal;

const ROLE_COLORS = {
  admin: "#8f1d2c",
  rm: "#8B5E3C",
  cocreator: "#40534C",
  cochecker: "#5E686D",
  customer: "#1A3636",
  approver: "#6D5A43",
};

const PIE_COLORS = {
  Admin: "#8f1d2c",
  RM: "#8B5E3C",
  "CO Creator": "#40534C",
  "CO Checker": "#5E686D",
  Customer: "#1A3636",
  Approver: "#6D5A43",
};

const DeactivatedUsers = () => {
  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  const [toggleActive] = useToggleActiveMutation();
  const [togglingIds, setTogglingIds] = useState([]);
  const [reassignTasks, { isLoading: isReassigning }] = useReassignTasksMutation();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const deactivatedUsers = users.filter((user) => !user.active);
  const inactiveCount = deactivatedUsers.length;
  const totalUsers = users.length;
  const inactivePercentage = totalUsers > 0 ? Math.round((inactiveCount / totalUsers) * 100) : 0;

  const roleDistributionData = useMemo(() => {
    const roles = {};
    deactivatedUsers.forEach((user) => {
      const roleKey = normalizeRoleKey(user.role);
      roles[roleKey] = (roles[roleKey] || 0) + 1;
    });
    return Object.entries(roles).map(([role, count]) => ({
      name: formatRoleLabel(role),
      users: count,
    }));
  }, [deactivatedUsers]);

  const pieData = useMemo(
    () =>
      roleDistributionData.map((item) => ({
        ...item,
        fill: PIE_COLORS[item.name] || "#D6BD98",
      })),
    [roleDistributionData],
  );

  const handleActivate = async (userId) => {
    console.debug("handleActivate invoked for", userId);
    confirm({
      title: "Reactivate user?",
      content: "The selected account will be re-enabled immediately.",
      okText: "Activate",
      cancelText: "Cancel",
      onOk: async () => {
        const idStr = String(userId);
        setTogglingIds((s) => [...s, idStr]);
        toast.info("Activating user...");
        try {
          await toggleActive({ id: idStr, active: true }).unwrap();
          toast.success("User activated successfully");
          await refetch();
        } catch (err) {
          // RTK mutation failed — try a fallback direct fetch to the API endpoint.
          console.warn("toggleActive mutation failed, attempting fallback fetch", err);
          try {
            const token = null;
            const base = import.meta.env.VITE_API_URL || "";
            const url = `${base}/api/users/${idStr}/active`;
            const res = await fetch(url, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ active: true }),
            });

            if (!res.ok) {
              const payload = await res.json().catch(() => ({}));
              const errMsg = payload?.message || `Failed to activate user: ${res.status}`;
              toast.error(errMsg);
              console.error("Fallback activate failed", res.status, payload);
            } else {
              toast.success("User activated successfully (fallback)");
              await refetch();
            }
          } catch (fallbackErr) {
            const errMsg = err?.data?.message || err?.message || "Failed to activate user";
            toast.error(errMsg);
            console.error("Activate error:", err, fallbackErr);
          }
        } finally {
          setTogglingIds((s) => s.filter((x) => x !== idStr));
        }
      },
    });
  };

  const handleReassign = (user) => {
    setSelectedUser(user);
    setReassignModalOpen(true);
  };

  const handleConfirmReassign = async (fromUserId, toUserId) => {
    try {
      await reassignTasks({ fromUserId, toUserId }).unwrap();
      message.success("Tasks reassigned successfully!");
      setReassignModalOpen(false);
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to reassign tasks");
    }
  };

  const getAvailableUsersForReassignment = (currentUser) => {
    if (!currentUser) {
      return [];
    }

    return users.filter(
      (user) =>
        user._id !== currentUser._id &&
        normalizeRoleKey(user.role) === normalizeRoleKey(currentUser.role) &&
        user.active,
    );
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => <span className="admin-page__value">{name}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
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
        { text: "RM", value: "rm" },
        { text: "CO Creator", value: "cocreator" },
        { text: "CO Checker", value: "cochecker" },
        { text: "Approver", value: "approver" },
        { text: "Customer", value: "customer" },
        { text: "System Administrator", value: "admin" },
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
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: () => (
        <span className="admin-page__status-text" style={{ color: "#8f1d2c" }}>
          Inactive
        </span>
      ),
    },
    {
      title: "Failed Attempts",
      dataIndex: "failedLoginAttempts",
      key: "failedLoginAttempts",
      render: (n) => (
        <span className="admin-page__value admin-page__value--muted">{n || 0}</span>
      ),
      sorter: (a, b) => (a.failedLoginAttempts || 0) - (b.failedLoginAttempts || 0),
      width: 120,
    },
    {
      title: "Deactivated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => (
        <span className="admin-page__value admin-page__value--muted">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
      sorter: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const availableUsers = getAvailableUsersForReassignment(record);
        const hasBeenReassigned = record.tasksReassigned === true;

        return (
          <Space wrap>
            <Button
              size="small"
              icon={<SwapOutlined />}
              onClick={() => handleReassign(record)}
              disabled={availableUsers.length === 0 || hasBeenReassigned}
              className="admin-page__action-button admin-page__action-button--primary"
            >
              {hasBeenReassigned ? "Reassigned" : "Reassign Tasks"}
            </Button>
            <Button
              size="small"
              icon={<PoweroffOutlined />}
              onClick={() => handleActivate(record._id || record.id)}
              className="admin-page__action-button admin-page__action-button--secondary"
              loading={togglingIds.includes(String(record._id || record.id))}
              disabled={togglingIds.includes(String(record._id || record.id))}
            >
              {togglingIds.includes(String(record._id || record.id)) ? "Activating..." : "Activate"}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="admin-page creator-theme">
      <section className="admin-page__hero">
        <div className="admin-page__hero-copy">
          <span className="admin-page__eyebrow">Account Recovery</span>
          <div className="admin-page__title-row">
            <h1 className="admin-page__title">Deactivated Users</h1>
            <span className="admin-page__count">{inactiveCount} inactive accounts</span>
          </div>
          <p className="admin-page__subtitle">
            Reactivate dormant accounts and reassign work from deactivated users while preserving the current admin flows.
          </p>
        </div>

        <div className="admin-page__hero-actions">
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

      <section className="admin-page__stat-grid">
        <article
          className="admin-page__stat-card"
          style={{
            "--admin-stat-accent": "#8f1d2c",
            "--admin-stat-surface": "#ffffff",
          }}
        >
          <div className="admin-page__stat-icon">
            <PoweroffOutlined />
          </div>
          <span className="admin-page__stat-label">Inactive Users</span>
          <span className="admin-page__stat-value">{inactiveCount}</span>
          <span className="admin-page__stat-note">Users currently disabled</span>
        </article>
        <article
          className="admin-page__stat-card"
          style={{
            "--admin-stat-accent": "#8B5E3C",
            "--admin-stat-surface": "#ffffff",
          }}
        >
          <div className="admin-page__stat-icon">%</div>
          <span className="admin-page__stat-label">Inactive Rate</span>
          <span className="admin-page__stat-value">{inactivePercentage}</span>
          <span className="admin-page__stat-note">Percentage of total accounts</span>
        </article>
      </section>

      <section className="admin-page__section-grid">
        <article className="admin-page__chart-card">
          <div className="admin-page__card-header">
            <div className="admin-page__card-copy">
              <h2 className="admin-page__card-title">Inactive Users by Role</h2>
              <p className="admin-page__card-subtitle">Breakdown of deactivated accounts.</p>
            </div>
          </div>
          <div className="admin-page__chart-body">
            {roleDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={roleDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6BD98" opacity={0.45} />
                  <XAxis dataKey="name" stroke="#677D6A" />
                  <YAxis stroke="#677D6A" />
                  <ChartTooltip />
                  <Bar dataKey="users" fill="#8f1d2c" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No inactive users data.</Text>
            )}
          </div>
        </article>

        <article className="admin-page__chart-card">
          <div className="admin-page__card-header">
            <div className="admin-page__card-copy">
              <h2 className="admin-page__card-title">Role Distribution</h2>
              <p className="admin-page__card-subtitle">Share of inactive users by role.</p>
            </div>
          </div>
          <div className="admin-page__chart-body">
            {pieData.length > 0 ? (
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
            ) : (
              <Text type="secondary">No distribution data.</Text>
            )}
          </div>
        </article>
      </section>

      <section className="admin-page__table-card">
        <div className="admin-page__table-toolbar">
          <div className="admin-page__table-toolbar-copy">
            <h2 className="admin-page__table-toolbar-title">Inactive Users List</h2>
            <p className="admin-page__table-toolbar-subtitle">
              {inactiveCount} inactive user{inactiveCount === 1 ? "" : "s"} currently recorded in the system.
            </p>
          </div>
        </div>
        <div className="creator-table-shell" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={deactivatedUsers}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} deactivated users`,
            }}
            locale={{
              emptyText: "No deactivated users found",
            }}
          />
        </div>
      </section>

      <ReassignModal
        visible={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        onConfirm={handleConfirmReassign}
        currentUser={selectedUser}
        availableUsers={getAvailableUsersForReassignment(selectedUser)}
        loading={isReassigning}
      />
    </div>
  );
};

export default DeactivatedUsers;