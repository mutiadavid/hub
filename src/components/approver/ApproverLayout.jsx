import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { InboxOutlined, FileDoneOutlined } from "@ant-design/icons";
import "../../styles/creatorDesignSystem.css";
import SharedSidebar from "../common/SharedSidebar";

// Import available Approver page components
import { MyQueue } from "../../pages/approver/MyQueue";
import Actioned from "../../pages/approver/Actioned/Actioned";
// import Reports from "../../pages/approver/Reports"; // TODO: Create Reports page
import Navbar from "../Navbar";
import { getSidebarWidth } from "../../utils/sidebarUtils";

const getSelectedKeyFromPath = (pathname) => {
  if (pathname.includes("/approver/actioned")) return "actioned";
  return "queue";
};

const ApproverLayout = ({ userId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 768,
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
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

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const menuItems = [
    {
      key: "queue",
      label: "My Queue",
      icon: <InboxOutlined />,
    },
    {
      key: "actioned",
      label: "Actioned",
      icon: <FileDoneOutlined />,
    },
  ];

  const handleClick = (e) => {
    navigate(`/approver/${e.key}`);
    if (isMobile) setSidebarCollapsed(true);
  };

  return (
    <div
      className="creator-layout-shell creator-theme"
      style={{
        "--sidebar-width": `${getSidebarWidth(sidebarCollapsed)}px`,
      }}
    >
      {isMobile && !sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="creator-layout-overlay"
        />
      )}

      <SharedSidebar
        selectedKey={selectedKey}
        onMenuItemClick={handleClick}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        menuItems={menuItems}
        brandLabel="DCL & DEFERRAL"
      />

      <div
        className={`creator-layout-main ${!isMobile && !sidebarCollapsed ? "creator-layout-main--with-sidebar" : ""}`}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        <div
          className="creator-layout-content"
          style={{
            padding: isMobile ? "16px 8px 20px" : "24px 16px 16px",
            overflowX: isMobile ? "auto" : "hidden",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={<MyQueue userId={userId || "approver_current"} />}
            />
            <Route
              path="/queue"
              element={<MyQueue userId={userId || "approver_current"} />}
            />
            <Route
              path="/queue/*"
              element={<MyQueue userId={userId || "approver_current"} />}
            />
            <Route
              path="/actioned"
              element={<Actioned userId={userId || "approver_current"} />}
            />
            {/* <Route
              path="/reports"
              element={<Reports userId={userId || "approver_current"} />}
            /> */}
            <Route
              path="*"
              element={<MyQueue userId={userId || "approver_current"} />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ApproverLayout;
