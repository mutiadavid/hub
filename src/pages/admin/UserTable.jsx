import React, { useMemo, useState } from "react";
import { Table, Button, Input, Select, Space, Typography } from "antd";
import {
  SearchOutlined,
  PoweroffOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  ADMIN_ASSIGNABLE_ROLE_OPTIONS,
  formatRoleLabel,
  normalizeRoleKey,
} from "./adminRoleUtils";
import "../../styles/creatorDesignSystem.css";

const { Text } = Typography;

const ROLE_COLORS = {
  admin: "#8f1d2c",
  cocreator: "#40534C",
  cochecker: "#5E686D",
  customer: "#1A3636",
  rm: "#8B5E3C",
  approver: "#6D5A43",
};

const UserTable = ({
  users,
  onToggleActive,
  onChangeRole,
  loading = false,
}) => {
  const [searchText, setSearchText] = useState("");
  const [pendingRoles, setPendingRoles] = useState({});
  const [updatingRoleIds, setUpdatingRoleIds] = useState({});

  const activeUsers = useMemo(() => users.filter((user) => user.active), [users]);

  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) {
      return activeUsers;
    }

    const query = searchText.toLowerCase();

    return activeUsers.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const department = (user.department || "").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        department.includes(query)
      );
    });
  }, [activeUsers, searchText]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined style={{ color: "var(--color-text-light)", fontSize: 12 }} />
          <span className="admin-page__value">{name || "-"}</span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (email) => (
        <span className="admin-page__value admin-page__value--muted">{email || "-"}</span>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      sorter: (a, b) =>
        (a.department || "").localeCompare(b.department || ""),
      render: (department) => (
        <span className="admin-page__value admin-page__value--muted">
          {department || "N/A"}
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
        { text: "System Administrator", value: "admin" },
        { text: "Customer", value: "customer" },
        { text: "Approver", value: "approver" },
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
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.active === value,
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
      title: "Change Role",
      key: "changeRole",
      render: (_, record) => {
        const userId = record._id;
        const currentRole = normalizeRoleKey(record.role);
        const selectedRole = pendingRoles[userId] || currentRole;
        const isUpdating = Boolean(updatingRoleIds[userId]);
        const canApply =
          typeof onChangeRole === "function" &&
          selectedRole &&
          selectedRole !== currentRole;

        return (
          <div className="admin-page__action-group" style={{ gap: 8, flexWrap: "nowrap" }}>
            <Select
              size="small"
              value={selectedRole}
              onChange={(value) => {
                setPendingRoles((prev) => ({ ...prev, [userId]: value }));
              }}
              options={ADMIN_ASSIGNABLE_ROLE_OPTIONS}
              style={{ minWidth: 148 }}
              disabled={isUpdating}
            />
            <Button
              size="small"
              icon={<SwapOutlined />}
              className="admin-page__action-button admin-page__action-button--secondary admin-page__action-button--compact"
              disabled={!canApply || isUpdating}
              loading={isUpdating}
              onClick={async () => {
                setUpdatingRoleIds((prev) => ({ ...prev, [userId]: true }));
                const succeeded = await onChangeRole(userId, selectedRole);
                setUpdatingRoleIds((prev) => ({ ...prev, [userId]: false }));
                if (succeeded) {
                  setPendingRoles((prev) => {
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                  });
                }
              }}
            >
              Apply
            </Button>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="admin-page__action-group">
          <Button
            size="small"
            icon={<PoweroffOutlined />}
            onClick={() => onToggleActive(record._id)}
            className="admin-page__action-button admin-page__action-button--secondary admin-page__action-button--compact"
            danger
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page__table-shell">
      <div className="admin-page__table-toolbar">
        <div className="admin-page__table-toolbar-copy">
          <h3 className="admin-page__table-toolbar-title">Active Users</h3>
          <p className="admin-page__table-toolbar-subtitle">
            Search and manage live accounts without leaving the dashboard.
          </p>
        </div>

        <Space wrap>
          <Input
            prefix={<SearchOutlined style={{ color: "var(--color-text-light)" }} />}
            placeholder="Search name, email, or department"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            className="creator-input"
            style={{ width: 300, maxWidth: "100%" }}
          />
        </Space>
      </div>

      <div className="creator-table-shell admin-page__table-shell--compact" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          pagination={{
            pageSize: 6,
            showSizeChanger: false,
            showTotal: (total) => `${total} active user${total === 1 ? "" : "s"}`,
          }}
          locale={{
            emptyText: (
              <Text type="secondary">No active users match the current search.</Text>
            ),
          }}
        />
      </div>

      <div className="admin-page__table-footer">
        Showing {filteredUsers.length} active user{filteredUsers.length === 1 ? "" : "s"}.
      </div>
    </div>
  );
};

export default UserTable;