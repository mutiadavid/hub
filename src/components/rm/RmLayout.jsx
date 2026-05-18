import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import "../../styles/creatorDesignSystem.css";
import {
  CheckCircleOutlined,
  InboxOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";

// Import your RM components
import { Suspense, lazy } from "react";
const MyQueue = lazy(() => import("../../pages/rm/MyQueue"));
const Completed = lazy(() => import("../../pages/rm/Completed"));
const ReportsPage = lazy(() => import("../../pages/rm/Reports"));
import Navbar from "../Navbar";
import SharedSidebar from "../common/SharedSidebar";
const DraftsPage = lazy(() => import("../shared/DraftsPage"));
const CompletedChecklistPage = lazy(() => import("../modals/CompletedChecklistModalComponents/CompletedChecklistPage"));
import { getSidebarWidth } from "../../utils/sidebarUtils";

// Import Deferral Components
const DeferralForm = lazy(() => import("../../pages/deferrals/DeferralForm"));
const DeferralPending = lazy(() => import("../../pages/deferrals/DeferralPending"));
const Reports = lazy(() => import("../../pages/creator/Reports"));

const getSelectedKeyFromPath = (pathname) => {
  if (pathname.includes("/deferrals")) {
    return "deferral";
  }
  if (pathname.includes("/completed")) {
    return "completed";
  }
  if (pathname.includes("/reports")) {
    return "reports";
  }
  if (pathname.includes("/drafts")) {
    return "drafts";
  }
  return "myqueue";
};

const RmLayout = ({ userId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 768,
  );
  const [draftToRestore, setDraftToRestore] = useState(null);
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

  // Handle restoring a draft - route checklist drafts to My Queue and deferral drafts to the deferral form.
  const handleRestoreDraft = (draft) => {
    if (!draft) {
      return;
    }

    if (draft.type === "deferral") {
      navigate(`/rm/deferrals/request?draftId=${encodeURIComponent(draft.id)}`);
      return;
    }

    if (draft.data?.checklistId || draft.data?.dclNo) {
      setDraftToRestore(draft);
      navigate("/rm/myqueue");
    }
  };

  const menuItems = [
    {
      key: "myqueue",
      label: "My Queue",
      icon: <InboxOutlined />,
    },
    {
      key: "drafts",
      label: "Drafts",
      icon: <SnippetsOutlined />,
    },
    {
      key: "completed",
      label: "Completed",
      icon: <CheckCircleOutlined />,
    },
    {
      key: "deferral",
      label: "Deferrals",
      icon: <ClockCircleOutlined />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <BarChartOutlined />,
    },
  ];

  const handleClick = (e) => {
    // Handle special routes
    if (e.key === "deferral") {
      navigate("/rm/deferrals/pending");
    } else {
      navigate(`/rm/${e.key}`);
    }

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
        title="RM Workspace"
      />

      <div className={`creator-layout-main ${!isMobile && !sidebarCollapsed ? "creator-layout-main--with-sidebar" : ""}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="creator-layout-content">
          <Suspense fallback={<div style={{padding:24,textAlign:"center"}}>Loading...</div>}>
          <Routes>
            <Route
              path="/"
              element={
                <MyQueue
                  userId={userId || "rm_current"}
                  draftToRestore={draftToRestore}
                  setDraftToRestore={setDraftToRestore}
                />
              }
            />
            <Route
              path="/myqueue"
              element={
                <MyQueue
                  userId={userId || "rm_current"}
                  draftToRestore={draftToRestore}
                  setDraftToRestore={setDraftToRestore}
                />
              }
            />
            <Route
              path="/drafts"
              element={
                <DraftsPage type={["rm", "deferral"]} onSelectDraft={handleRestoreDraft} />
              }
            />
            <Route
              path="/completed"
              element={<Completed userId={userId || "rm_current"} />}
            />
            <Route path="/completed/:id" element={<CompletedChecklistPage />} />
            <Route
              path="/reports"
              element={<Reports userId={userId || "rm_current"} />}
            />

            {/* Deferral Routes */}
            <Route path="/deferrals">
              <Route
                path="request"
                element={<DeferralForm userId={userId || "rm_current"} />}
              />
              <Route
                path="pending"
                element={<DeferralPending userId={userId || "rm_current"} />}
              />
            </Route>
          </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default RmLayout;
