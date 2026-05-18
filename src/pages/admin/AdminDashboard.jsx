import React, { useMemo, useState } from "react";
import { Button, message } from "antd";
import {
  UserAddOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import UserTable from "./UserTable";
// import CreateUserDrawer from "./CreateUserModal";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useChangeRoleMutation,
  useToggleActiveMutation,
} from "../../api/userApi";
import { countUsersByRole } from "./adminRoleUtils";
import "../../styles/creatorDesignSystem.css";
import CreateUserDrawer from "./createUserDrawer";

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  samAccountName: "",
  department: "",
  title: "",
  phone: "",
  role: "customer",
};

const AdminDashboard = () => {
  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [changeRole] = useChangeRoleMutation();
  const [toggleActive] = useToggleActiveMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const usersByRole = useMemo(() => countUsersByRole(users), [users]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminUsers = usersByRole.admin;
  const customerUsers = usersByRole.customer;
  const approverUsers = usersByRole.approver;
  const coCreatorUsers = usersByRole.cocreator;
  const rmUsers = usersByRole.rm;
  const coCheckerUsers = usersByRole.cochecker;

  const statCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total Users",
        value: totalUsers,
        note: "All registered accounts",
        accent: "#1A3636",
        surface: "#ffffff",
        icon: <UserOutlined />,
      },
      {
        key: "active",
        label: "Active",
        value: activeUsers,
        note: "Currently enabled users",
        accent: "#40534C",
        surface: "#ffffff",
        icon: <CheckCircleOutlined />,
      },
      {
        key: "inactive",
        label: "Inactive",
        value: inactiveUsers,
        note: "Accounts awaiting reactivation",
        accent: "#8B5E3C",
        surface: "#ffffff",
        icon: <ClockCircleOutlined />,
      },
      {
        key: "admins",
        label: "System Administrators",
        value: adminUsers,
        note: "System administrators",
        accent: "#8f1d2c",
        surface: "#ffffff",
        icon: <UserAddOutlined />,
      },
      {
        key: "approvers",
        label: "Approvers",
        value: approverUsers,
        note: "Approval workflow users",
        accent: "#6D5A43",
        surface: "#ffffff",
        icon: <CheckCircleOutlined />,
      },
      {
        key: "customers",
        label: "Customers",
        value: customerUsers,
        note: "Customer-facing accounts",
        accent: "#7A5C2E",
        surface: "#ffffff",
        icon: <UserOutlined />,
      },
      {
        key: "cocreators",
        label: "CO Creators",
        value: coCreatorUsers,
        note: "Checklist creators",
        accent: "#5E686D",
        surface: "#ffffff",
        icon: <UserOutlined />,
      },
      {
        key: "rm",
        label: "RMs",
        value: rmUsers,
        note: "Relationship managers",
        accent: "#6C4E31",
        surface: "#ffffff",
        icon: <UserAddOutlined />,
      },
      {
        key: "cocheckers",
        label: "CO Checkers",
        value: coCheckerUsers,
        note: "Checklist reviewers",
        accent: "#54656F",
        surface: "#ffffff",
        icon: <CheckCircleOutlined />,
      },
    ],
    [
      totalUsers,
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

  const openDrawer = () => {
    setFormData(INITIAL_FORM_DATA);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleCreateUser = async () => {
    if (!formData.samAccountName) {
      message.warning("Please select a user from the directory first");
      return;
    }

    try {
      await createUser({
        name: formData.name,
        email: formData.email,
        samAccountName: formData.samAccountName,
        department: formData.department,
        title: formData.title,
        phone: formData.phone,
        role: formData.role,
      }).unwrap();

      message.success(`${formData.name} added successfully`);
      closeDrawer();
      // refetch() not strictly needed because userApi.createUser
      // invalidates the "User" tag, but kept for explicitness.
      refetch();
    } catch (err) {
      const errMsg =
        err?.data?.message ||
        err?.error ||
        "Failed to add user. Please try again.";
      message.error(errMsg);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleActive({ id, active: false }).unwrap();
      message.success("User status updated");
      refetch();
    } catch (err) {
      message.error(err?.data?.message || err?.data?.error || "Failed to update status");
    }
  };

  const handleChangeRole = async (id, role) => {
    try {
      await changeRole({ id, role }).unwrap();
      message.success("User role updated");
      refetch();
      return true;
    } catch (err) {
      message.error(
        err?.data?.message || err?.data?.error || "Failed to update role"
      );
      return false;
    }
  };

  return (
    <div className="admin-page creator-theme">
      <section className="admin-page__hero">
        <div className="admin-page__hero-copy">
          <span className="admin-page__eyebrow">Administration</span>
          <div className="admin-page__title-row">
            <h1 className="admin-page__title">Admin Dashboard</h1>
            <span className="admin-page__count">
              {totalUsers} users tracked
            </span>
          </div>
          <p className="admin-page__subtitle">
            Review account coverage, manage active users, and keep the
            administration workspace aligned with the newer RM page system.
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
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={openDrawer}
            className="admin-page__action-button admin-page__action-button--primary"
          >
            Add User from Directory
          </Button>
        </div>
      </section>

      <section className="admin-page__split">
        <div className="admin-page__split-main">
          <section className="admin-page__toolbar">
            <div className="admin-page__toolbar-copy">
              <h2 className="admin-page__toolbar-title">User Management</h2>
              <p className="admin-page__toolbar-subtitle">
                View, filter, and deactivate active accounts from the same
                table surface.
              </p>
            </div>
          </section>

          <UserTable
            users={users}
            onToggleActive={handleToggleActive}
            onChangeRole={handleChangeRole}
            loading={isLoading}
          />
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

      <CreateUserDrawer
        visible={drawerOpen}
        onClose={closeDrawer}
        formData={formData}
        setFormData={setFormData}
        loading={creating}
        onCreate={handleCreateUser}
      />
    </div>
  );
};

export default AdminDashboard;