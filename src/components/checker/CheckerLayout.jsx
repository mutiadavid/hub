import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  InboxOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  SnippetsOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { getSidebarWidth } from "../../utils/sidebarUtils";
import "../../styles/creatorDesignSystem.css";

import Navbar from "../Navbar";
import SharedSidebar from "../common/SharedSidebar";

// Pages
import { Suspense, lazy } from "react";
const AllChecklists = lazy(() => import("../../pages/checker/myQueue"));
const CompletedChecklists = lazy(() => import("../../pages/checker/Completed"));
const Deferrals = lazy(() => import("../../pages/checker/Deferral"));
const Reportss = lazy(() => import("../../pages/creator/Reports"));
const DraftsPage = lazy(() => import("../../components/shared/DraftsPage"));
const CompletedChecklistPage = lazy(() => import("../modals/CompletedChecklistModalComponents/CompletedChecklistPage"));

const getSelectedKeyFromPath = (pathname) => {
  if (pathname.includes("/completed")) {
    return "completed";
  }
  if (pathname.includes("/deferrals")) {
    return "deferrals";
  }
  if (pathname.includes("/drafts")) {
    return "drafts";
  }
  if (pathname.includes("/reports")) {
    return "reports";
  }
  return "myQueue";
};

const CheckerLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = getSelectedKeyFromPath(location.pathname);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [draftToRestore, setDraftToRestore] = useState(null);

  // Handle restoring a draft - navigate to MyQueue and pass draft data
  const handleRestoreDraft = (draft) => {
    if (draft.data?.checklistId || draft.data?.dclNo) {
      // Set draft first, then navigate to ensure AllChecklists receives the draft
      setDraftToRestore(draft);

      // Navigate to myQueue to trigger the page load
      navigate("/cochecker/myQueue");
    }
  };

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        setCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const menuItems = [
    {
      key: "myQueue",
      icon: <InboxOutlined />,
      label: "My Queue",
    },
    {
      key: "completed",
      icon: <CheckCircleOutlined />,
      label: "Completed",
    },
    {
      key: "deferrals",
      icon: <AuditOutlined />,
      label: "Deferrals",
    },
    {
      key: "drafts",
      icon: <SnippetsOutlined />,
      label: "Drafts",
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Reports",
    },
  ];

  const handleClick = (e) => {
    navigate(`/cochecker/${e.key}`);
    // Close sidebar on mobile when menu item is clicked
    if (isMobile) setCollapsed(true);
  };

  return (
    <div
      className="creator-layout-shell creator-theme"
      style={{
        "--sidebar-width": `${getSidebarWidth(collapsed)}px`,
      }}
    >
      {/* Overlay for mobile sidebar */}
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="creator-layout-overlay"
        />
      )}

      <SharedSidebar
        selectedKey={selectedKey}
        onMenuItemClick={handleClick}
        collapsed={collapsed}
        toggleCollapse={toggleSidebar}
        menuItems={menuItems}
        title="CO Checker"
      />

      <div
        className={`creator-layout-main ${!isMobile && !collapsed ? "creator-layout-main--with-sidebar" : ""}`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="creator-layout-content">
          <Suspense fallback={<div style={{padding:24,textAlign:"center"}}>Loading...</div>}>
          <Routes>
            <Route
              path="/"
              element={
                <AllChecklists
                  userId={userId}
                  draftToRestore={draftToRestore}
                  setDraftToRestore={setDraftToRestore}
                />
              }
            />
            <Route
              path="/myQueue"
              element={
                <AllChecklists
                  userId={userId}
                  draftToRestore={draftToRestore}
                  setDraftToRestore={setDraftToRestore}
                />
              }
            />
            <Route
              path="/completed"
              element={<CompletedChecklists userId={userId} />}
            />
            <Route path="/completed/:id" element={<CompletedChecklistPage />} />
            <Route path="/deferrals" element={<Deferrals userId={userId} />} />
            <Route
              path="/drafts"
              element={
                <DraftsPage type="checker" onSelectDraft={handleRestoreDraft} />
              }
            />
            <Route path="/reports" element={<Reportss />} />
          </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default CheckerLayout;
