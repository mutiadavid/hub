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
} from "@ant-design/icons";
import { useGetUsersQuery, useLazyGetUserActivityQuery } from "../../api/userApi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { countUsersByRole, formatRoleLabel, normalizeRoleKey } from "./adminRoleUtils";
import { formatDateTimeDetailed } from "../../utils/checklistUtils";
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

  const loadUserActivities = async (userId) => {
    const response = await triggerGetUserActivity(userId, true).unwrap();
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
      dataIndex: "updatedAt",
      key: "lastActivity",
      sorter: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      render: (date) => (
        <Tooltip title={formatDateTimeDetailed(date)}>
          <span className="admin-page__value admin-page__value--muted">
            {dayjs(date).fromNow()}
          </span>
        </Tooltip>
      ),
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
      width: 180,
      render: (date) => <span className="admin-page__value admin-page__value--muted">{formatDateTimeDetailed(date)}</span>,
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (value) => <span className="admin-page__status-text">{value || "Activity"}</span>,
    },
    {
      title: "Activity",
      dataIndex: "actionLabel",
      key: "actionLabel",
      width: 160,
      render: (value, record) => <span className="admin-page__value">{value || record.action || "Activity"}</span>,
    },
    {
      title: "Details",
      key: "summary",
      render: (_, record) => (
        <div>
          <div className="admin-page__value">{record.summary || record.details || "-"}</div>
          {record.resource ? (
            <div className="admin-page__value admin-page__value--muted">{record.resource}</div>
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
        width={720}
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
                <div className="creator-table-shell" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
                  <Table
                    columns={activityColumns}
                    dataSource={selectedUserActivities}
                    rowKey={(record) => record.id || `${record.date}-${record.action}`}
                    pagination={{ pageSize: 5, showSizeChanger: false }}
                    scroll={{ x: "max-content" }}
                    size="small"
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
