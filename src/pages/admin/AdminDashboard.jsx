import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Button, message, Modal } from "antd";
import {
  UserAddOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import UserTable from "./UserTable";
import PendingActionsQueue from "./PendingActionsQueue";
// import CreateUserDrawer from "./CreateUserModal";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useChangeRoleMutation,
  useToggleActiveMutation,
} from "../../api/userApi";
import { useApproveActionMutation, useRejectActionMutation, useRecordUserCreationActionMutation, useRecordActionMutation } from "../../api/adminActionsApi";
import { countUsersByRole } from "./adminRoleUtils";
import { downloadCSV } from "../../utils/csvExport";
import { ExportMenu } from "../../components/ExportMenu";
import "../../styles/creatorDesignSystem.css";
import CreateUserDrawer from "./createUserDrawer";

const ROLE_PERMISSIONS = {
  admins: {
    title: "System Administrators",
    description: "Full system control over settings, configuration, and user management.",
    permissions: [
      "Add new users directly from the Active Directory",
      "Deactivate or reactivate user accounts system-wide",
      "Modify and promote user roles (e.g., promote a Customer to RM)",
      "Access global audit logs and administrative dashboards",
      "Review and approve/reject actions initiated by other admins (Maker-Checker)"
    ]
  },
  approvers: {
    title: "Approvers",
    description: "Key personnel responsible for making critical decisions on deferral requests.",
    permissions: [
      "Review incoming deferral applications from Relationship Managers",
      "Approve deferral requests (with optional justification comments)",
      "Reject deferral requests and return them to the RM",
      "View detailed deferral history and all attached client documents"
    ]
  },
  customers: {
    title: "Customers",
    description: "Client accounts linked to their own credit facilities.",
    permissions: [
      "View their own active and historical deferrals",
      "Track the live status of their checklist documents",
      "Receive automated updates and notifications regarding their accounts"
    ]
  },
  cocreators: {
    title: "CO Creators",
    description: "Frontline staff responsible for preparing and initiating checklists and DCLs.",
    permissions: [
      "Create new checklists originating from standardized templates",
      "Upload mandatory DCL and additional supporting documents",
      "Submit fully prepared checklists to CO Checkers for secondary review",
      "Track the lifecycle and status of their initiated checklists"
    ]
  },
  rm: {
    title: "Relationship Managers (RMs)",
    description: "Managers responsible for specific client portfolios and deferral initiations.",
    permissions: [
      "Initiate new deferral requests on behalf of their assigned customers",
      "Upload deferral justifications and supporting DCL files",
      "Set document-specific 'days sought' extensions (up to 90 days)",
      "Configure the multi-level approval matrix required for a deferral",
      "Track the approval status of pending deferrals across their portfolio"
    ]
  },
  cocheckers: {
    title: "CO Checkers",
    description: "Reviewers responsible for validating checklists before final submission.",
    permissions: [
      "Review checklists and documents submitted by CO Creators",
      "Approve valid checklists to proceed to the next system stage",
      "Return incomplete or invalid checklists back to CO Creators for amendments",
      "Add review comments directly to specific document categories"
    ]
  }
};

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
  const location = useLocation();
  const currentUser = useSelector((state) => state.auth?.user);
  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [recordUserCreationAction] = useRecordUserCreationActionMutation();
  const [changeRole] = useChangeRoleMutation();
  const [toggleActive] = useToggleActiveMutation();
  const [recordAction] = useRecordActionMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [roleModalInfo, setRoleModalInfo] = useState(null);



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
      // Use maker-checker pattern: record the action instead of creating immediately
      await recordUserCreationAction({
        name: formData.name,
        email: formData.email,
        password: "", // Password will be sent separately or generated
        samAccountName: formData.samAccountName,
        department: formData.department,
        title: formData.title,
        phone: formData.phone,
        role: formData.role,
      }).unwrap();

      message.success(
        `User creation request submitted. Pending approval by another admin.`
      );
      closeDrawer();
      // Refetch to update pending actions count
      refetch();
    } catch (err) {
      const errMsg =
        err?.data?.message ||
        err?.error ||
        "Failed to submit user creation request. Please try again.";
      message.error(errMsg);
    }
  };

  const handleToggleActive = async (id, user) => {
    const isCurrentlyActive = user?.active;
    const actionType = isCurrentlyActive ? "DeactivateUser" : "ActivateUser";
    const label = isCurrentlyActive ? "Deactivate" : "Activate";
    try {
      await recordAction({
        actionType,
        description: `${label} user: ${user?.name || id} (${user?.email || ""})`,
        affectedUserId: id,
        payload: { userId: id, targetActive: !isCurrentlyActive },
      }).unwrap();
      message.success(`${label} request submitted for approval by another admin.`);
      refetch();
    } catch (err) {
      message.error(err?.data?.message || err?.data?.error || `Failed to submit ${label.toLowerCase()} request.`);
    }
  };

  const handleChangeRole = async (id, role, user) => {
    try {
      await recordAction({
        actionType: "ChangeRole",
        description: `Change role for ${user?.name || id} (${user?.email || ""}) to: ${role}`,
        affectedUserId: id,
        payload: { userId: id, newRole: role },
      }).unwrap();
      message.success(`Role change request submitted for approval by another admin.`);
      refetch();
      return true;
    } catch (err) {
      message.error(
        err?.data?.message || err?.data?.error || "Failed to submit role change request."
      );
      return false;
    }
  };

  // If on pending-items route, show only the queue
  if (location.pathname.includes("/pending-items")) {
    return (
      <div className="admin-page creator-theme">
        <section className="admin-page__hero">
          <div className="admin-page__hero-copy">
            <span className="admin-page__eyebrow">Administration</span>
            <div className="admin-page__title-row">
              <h1 className="admin-page__title">Pending Actions</h1>
            </div>
            <p className="admin-page__subtitle">
              Review and manage pending admin actions that require approval.
            </p>
          </div>
        </section>
        <div style={{ padding: "24px" }}>
          <PendingActionsQueue refreshTrigger={users.length} />
        </div>
      </div>
    );
  }

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
          <ExportMenu
            data={users}
            columns={[
              { header: "Name", key: "name" },
              { header: "Email", key: "email" },
              { header: "Department", key: "department" },
              { header: "Role", key: "role" },
              { header: "Status", key: "active", accessor: (u) => u.active ? "Active" : "Inactive" },
              { header: "Last Login", key: "lastLoginAt", accessor: (u) => u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-GB") : "Never" },
              { header: "Created By", key: "createdByName", accessor: (u) => u.createdByName || "N/A" },
              { header: "Approved By (Checker)", key: "approvedByName", accessor: (u) => u.approvedByName || "Pending / N/A" },
            ]}
            filename="all-users"
            title="System Users Directory"
            loading={isLoading}
            buttonText="Export Users"
          />
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
            {statCards.map((card) => {
              const permissionsData = ROLE_PERMISSIONS[card.key];
              const isClickable = !!permissionsData;

              return (
              <article
                key={card.key}
                onClick={isClickable ? () => setRoleModalInfo(permissionsData) : undefined}
                className={`admin-page__stat-card admin-page__stat-card--compact ${isClickable ? "admin-page__stat-card--clickable" : ""}`}
                style={{
                  "--admin-stat-accent": card.accent,
                  "--admin-stat-surface": card.surface,
                  cursor: isClickable ? "pointer" : "default",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(22, 70, 121, 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <div className="admin-page__stat-icon">{card.icon}</div>
                <span className="admin-page__stat-label">{card.label}</span>
                <span className="admin-page__stat-value">{card.value}</span>
                <span className="admin-page__stat-note">{card.note}</span>
              </article>
              );
            })}
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

      {/* Role Permissions Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, background: 'rgba(22, 70, 121, 0.08)', borderRadius: 8, color: 'var(--color-primary-dark)' }}>
              <SafetyCertificateOutlined style={{ fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-dark)' }}>{roleModalInfo?.title}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-light)', fontWeight: 400 }}>Role Permissions & Capabilities</div>
            </div>
          </div>
        }
        open={!!roleModalInfo}
        onCancel={() => setRoleModalInfo(null)}
        footer={[
          <Button key="close" onClick={() => setRoleModalInfo(null)} type="primary" style={{ backgroundColor: 'var(--color-primary-dark)', borderColor: 'var(--color-primary-dark)' }}>
            Got it
          </Button>
        ]}
        width={500}
        centered
        className="role-permissions-modal"
      >
        {roleModalInfo && (
          <div style={{ padding: '16px 0 8px 0' }}>
            <p style={{ color: 'var(--color-text-medium)', marginBottom: 24, fontSize: 14, lineHeight: '1.6' }}>
              {roleModalInfo.description}
            </p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--color-text-dark)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Capabilities</h4>
              <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {roleModalInfo.permissions.map((perm, idx) => (
                  <li key={idx} style={{ color: 'var(--color-text-medium)', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                    <CheckCircleOutlined style={{ color: '#10b981', marginTop: 4, fontSize: 14 }} />
                    <span style={{ flex: 1 }}>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;