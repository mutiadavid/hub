import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { message } from "antd";
import "../../styles/creatorDesignSystem.css";

// Pages
import CoChecklistPage from "../../pages/creator/CoChecklistPage";
import Reportss from "../../pages/creator/Reports";
import MyQueue from "../../pages/creator/MyQueue";
import ReviewChecklistPage from "../modals/ReviewChecklistModalComponents/ReviewChecklistPage";
import CreatorCompletedChecklistPage from "../modals/CreatorCompletedChecklistModal/CreatorCompletedChecklistPage";
import Completed from "../../pages/creator/Completed";
// import Deferrals from "../../pages/creator/Deferrals.jsx"; // ❌ DEPRECATED: Old monolithic component
import Deferrals from "../../pages/creator/Deferrals/index.jsx"; // ✅ REFACTORED: New modularized architecture
import StatsReportModal from "../modals/StatsReportModal";
import CreatorSidebar from "./CreatorSidebar";
import Navbar from "../Navbar";
import Queue from "../../pages/creator/Queue";
import CompletedQueue from "../../pages/creator/CompletedQueue";
import DraftsPage from "../shared/DraftsPage";
// import CheckerSidebar from "./CheckerSidebar";
// import CheckerNavbar from "./CheckerAdmin";

const getSelectedKeyFromPath = (pathname) => {
  if (pathname.includes("/drafts")) {
    return "drafts";
  }
  if (pathname.includes("/myqueue") || pathname.includes("/review/")) {
    return "myqueue";
  }
  if (pathname.includes("/deferrals")) {
    return "deferrals";
  }
  if (pathname.includes("/completed")) {
    return "completed";
  }
  if (pathname.includes("/reports")) {
    return "report";
  }
  return "creatchecklist";
};

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 768,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState(null);
  const [reviewChecklistToRestore, setReviewChecklistToRestore] =
    useState(null);
  const selectedKey = getSelectedKeyFromPath(location.pathname);

  // Handle restoring a draft - check if it's a new checklist or editing existing one
  const handleRestoreDraft = (draft) => {
    // If draft has a checklistId, it's for editing an existing checklist
    if (draft.data?.checklistId || draft.data?.dclNo) {
      // This is an edit draft - should open ReviewChecklistModal
      // Navigate to My Queue first, then the modal will open with the draft data
      setReviewChecklistToRestore(draft);
      navigate("/cocreator/myqueue");
      message.info("Opening draft for editing...");
    } else {
      // This is a new checklist draft - should open Create DCL form
      setDraftToRestore(draft.id);
      navigate("/cocreator");
    }
  };

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="creator-layout-shell creator-theme">
      {isMobile && !sidebarCollapsed && (
        <div className="creator-layout-overlay" onClick={() => setSidebarCollapsed(true)} />
      )}

      <CreatorSidebar
        selectedKey={selectedKey}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        onMenuItemClick={(e) => {
          const routeMap = {
            creatchecklist: "/cocreator",
            drafts: "/cocreator/drafts",
            myqueue: "/cocreator/myqueue",
            completed: "/cocreator/completed",
            deferrals: "/cocreator/deferrals",
            report: "/cocreator/reports",
          };

          navigate(routeMap[e.key] || "/cocreator");
          // Close sidebar on mobile when menu item is clicked
          if (isMobile) setSidebarCollapsed(true);
        }}
      />

      <div className={`creator-layout-main ${!isMobile && !sidebarCollapsed ? "creator-layout-main--with-sidebar" : ""}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="creator-layout-content">
          <Routes>
            <Route
              path="/"
              element={
                <CoChecklistPage
                  userId={userId}
                  draftToRestore={draftToRestore}
                  setDraftToRestore={setDraftToRestore}
                />
              }
            />
            <Route
              path="/drafts"
              element={
                <DraftsPage type="cocreator" onSelectDraft={handleRestoreDraft} />
              }
            />
            <Route
              path="/myqueue"
              element={
                <MyQueue
                  draftToRestore={reviewChecklistToRestore}
                  setDraftToRestore={setReviewChecklistToRestore}
                />
              }
            />
            <Route path="/completed" element={<Completed />} />
            <Route path="/deferrals" element={<Deferrals />} />
            <Route path="/reports" element={<Reportss userId={userId} />} />
            <Route path="review/:id" element={<ReviewChecklistPage />} />
            <Route path="completed/:id" element={<CreatorCompletedChecklistPage />} />
            <Route
              path="/reports/stats"
              element={
                <>
                  <button onClick={() => setModalOpen(true)}>
                    Open Stats Report
                  </button>
                  <StatsReportModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                  />
                </>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
