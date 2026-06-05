import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import {
  TeamOutlined,
  UserDeleteOutlined,
  UserOutlined,
  AuditOutlined,
  BellOutlined,
} from "@ant-design/icons";
import "../../styles/creatorDesignSystem.css";

import { Suspense, lazy } from "react";
const AdminDashboard = lazy(() => import("../../pages/admin/AdminDashboard.jsx"));
const CreateUserDrawer = lazy(() => import("../../pages/admin/createUserDrawer.jsx"));
const LiveUsers = lazy(() => import("../../pages/admin/LiveUsers.jsx"));
const AuditLogsPage = lazy(() => import("../../pages/admin/AuditLogsPage"));
const DeactivatedUsers = lazy(() => import("../../pages/admin/DeactivatedUsers.jsx"));
import Navbar from "../Navbar.jsx";
import SharedSidebar from "../common/SharedSidebar";
import { getSidebarWidth } from "../../utils/sidebarUtils";
import { PlaySquareOutlined } from "@ant-design/icons";

const InitiatedActions = lazy(() => import("../../pages/admin/InitiatedActions.jsx"));

const getSelectedKeyFromPath = (pathname) => {
  if (pathname.includes("/pending-items")) {
    return "pending-items";
  }
  if (pathname.includes("/deactivated-users")) {
    return "deactivated-users";
  }
  if (pathname.includes("/live-users")) {
    return "live-users";
  }
  if (pathname.includes("/audit-logs")) {
    return "audit-logs";
  }
  if (pathname.includes("/initiated-actions")) {
    return "initiated-actions";
  }
  return "all-users";
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selectedKey = getSelectedKeyFromPath(location.pathname);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 375;
      const tablet = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarCollapsed(tablet);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep form data state for the drawer
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "rm",
  });

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const menuItems = [
    {
      key: "pending-items",
      label: "Pending Items",
      icon: <BellOutlined />,
    },
    {
      key: "initiated-actions",
      label: "Initiated Actions",
      icon: <PlaySquareOutlined />,
    },
    {
      key: "all-users",
      label: "All Users",
      icon: <TeamOutlined />,
    },

    {
      key: "deactivated-users",
      label: "Deactivated Users",
      icon: <UserDeleteOutlined />,
    },

    {
      key: "live-users",
      label: "Live Users",
      icon: <UserOutlined />,
    },
    {
      key: "audit-logs",
      label: "Audit Logs",
      icon: <AuditOutlined />,
    },
  ];

  const handleClick = (e) => {
    navigate(`/admin/${e.key}`);
    // Close sidebar on mobile when menu item is clicked
    if (isMobile) setSidebarCollapsed(true);
  };

  return (
    <div
      className="creator-layout-shell creator-layout-shell--white-surface creator-theme"
      style={{
        "--sidebar-width": `${getSidebarWidth(sidebarCollapsed)}px`,
      }}
    >
      {isMobile && !sidebarCollapsed && (
        <div className="creator-layout-overlay" onClick={() => setSidebarCollapsed(true)} />
      )}
      
      <SharedSidebar
        selectedKey={selectedKey}
        onMenuItemClick={handleClick}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        menuItems={menuItems}
        title="Admin Workspace"
      />

      <div className={`creator-layout-main ${!isMobile && !sidebarCollapsed ? "creator-layout-main--with-sidebar" : ""}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="creator-layout-content">
          <Suspense fallback={<div style={{padding:24,textAlign:"center"}}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/all-users" element={<AdminDashboard />} />
            <Route path="/pending-items" element={<AdminDashboard />} />
            <Route path="/initiated-actions" element={<InitiatedActions />} />
            <Route path="/live-users" element={<LiveUsers />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/deactivated-users" element={<DeactivatedUsers />} />
          </Routes>
          </Suspense>
        </div>

        {/* Drawer for creating users - kept from original layout */}
        <CreateUserDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          formData={formData}
          setFormData={setFormData}
          loading={false}
          onCreate={() => {
            setFormData({ name: "", email: "", password: "", role: "rm" });
            setDrawerOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default AdminLayout;
