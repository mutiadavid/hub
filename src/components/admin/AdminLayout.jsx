import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import {
  TeamOutlined,
  UserDeleteOutlined,
  UserOutlined,
  AuditOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import "../../styles/creatorDesignSystem.css";

import AdminDashboard from "../../pages/admin/AdminDashboard.jsx";
import CreateUserDrawer from "../../pages/admin/createUserDrawer.jsx";
import LiveUsers from "../../pages/admin/LiveUsers.jsx";
import AuditLogsPage from "../../pages/admin/AuditLogsPage";
import Navbar from "../Navbar.jsx";
import SharedSidebar from "../common/SharedSidebar";
import DeactivatedUsers from "../../pages/admin/DeactivatedUsers.jsx";
import DraftsPage from "../../components/shared/DraftsPage";
import { getSidebarWidth } from "../../utils/sidebarUtils";

const getSelectedKeyFromPath = (pathname) => {
  if (pathname.includes("/deactivated-users")) {
    return "deactivated-users";
  }
  if (pathname.includes("/live-users")) {
    return "live-users";
  }
  if (pathname.includes("/audit-logs")) {
    return "audit-logs";
  }
  if (pathname.includes("/drafts")) {
    return "drafts";
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
    {
      key: "drafts",
      label: "Drafts",
      icon: <SnippetsOutlined />,
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
      />

      <div className={`creator-layout-main ${!isMobile && !sidebarCollapsed ? "creator-layout-main--with-sidebar" : ""}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="creator-layout-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/all-users" element={<AdminDashboard />} />
            <Route path="/live-users" element={<LiveUsers />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/deactivated-users" element={<DeactivatedUsers />} />
            <Route path="/drafts" element={<DraftsPage type="admin" />} />
          </Routes>
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
