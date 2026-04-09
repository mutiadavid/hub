import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { getSidebarWidth } from "../../utils/sidebarUtils";
import "../../styles/creatorDesignSystem.css";

import DeferralForm from "../../pages/deferrals/DeferralForm";
import DeferralPending from "../../pages/deferrals/DeferralPending";
import Navbar from "../Navbar";

const deferralLayoutStyles = `
  .deferral-layout-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    background: var(--color-bg);
    border-right: 1px solid rgba(214, 189, 152, 0.2);
    display: flex;
    flex-direction: column;
    transform: translateX(0);
    transition: transform 300ms ease-in-out, width 300ms ease-in-out;
    z-index: 40;
  }

  .deferral-layout-sidebar--hidden {
    transform: translateX(-100%);
  }

  .deferral-layout-sidebar__brand {
    min-height: 64px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-bottom: 1px solid rgba(214, 189, 152, 0.2);
  }

  .deferral-layout-sidebar__brand-title {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .deferral-layout-sidebar__eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-light);
  }

  .deferral-layout-sidebar__title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--color-text-dark);
    white-space: nowrap;
  }

  .deferral-layout-sidebar__title--collapsed {
    font-size: 20px;
  }

  .deferral-layout-sidebar__back {
    margin: 12px;
  }

  .deferral-layout-sidebar__footer {
    padding: 16px 12px;
    border-top: 1px solid rgba(214, 189, 152, 0.2);
  }

  .deferral-layout-toolbar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  @media (max-width: 767px) {
    .deferral-layout-sidebar__brand {
      min-height: 56px;
      padding: 0 16px;
    }

    .deferral-layout-toolbar {
      width: 100%;
    }

    .deferral-layout-toolbar .creator-button {
      flex: 1;
    }
  }
`;

const Sidebar = ({
  activeView,
  collapsed,
  isMobile,
  navigate,
  onSelectView,
  setSidebarCollapsed,
  toggleCollapse,
}) => {
  const menuItems = [
    {
      key: "form",
      label: "Request Deferral",
      icon: <FileText size={18} />,
    },
    {
      key: "pending",
      label: "Pending Deferrals",
      icon: <ListChecks size={18} />,
    },
  ];

  return (
    <div
      className={`deferral-layout-sidebar ${isMobile && collapsed ? "deferral-layout-sidebar--hidden" : ""}`}
      style={{ width: getSidebarWidth(collapsed) }}
    >
      <div className="deferral-layout-sidebar__brand">
        {collapsed ? (
          <span className="deferral-layout-sidebar__title deferral-layout-sidebar__title--collapsed">
            D
          </span>
        ) : (
          <div className="deferral-layout-sidebar__brand-title">
            <span className="deferral-layout-sidebar__eyebrow">Relationship Manager</span>
            <span className="deferral-layout-sidebar__title">Deferrals</span>
          </div>
        )}
      </div>

      <div className="deferral-layout-sidebar__back">
        <button
          type="button"
          className="creator-sidebar__item"
          onClick={() => {
            navigate("/rm");
            if (isMobile) setSidebarCollapsed(true);
          }}
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <span className="creator-sidebar__item-icon">
            <ChevronLeft size={18} />
          </span>
          {!collapsed ? <span className="creator-sidebar__item-label">Back to Dashboard</span> : null}
        </button>
      </div>

      <div className="creator-sidebar__menu">
        {menuItems.map((item) => {
          const isActive = activeView === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={`creator-sidebar__item ${isActive ? "creator-sidebar__item--active" : ""}`}
              onClick={() => {
                onSelectView(item.key);
                if (isMobile) setSidebarCollapsed(true);
              }}
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <span className="creator-sidebar__item-icon">{item.icon}</span>
              {!collapsed ? <span className="creator-sidebar__item-label">{item.label}</span> : null}
              {isActive && !collapsed ? <span className="creator-sidebar__item-dot" /> : null}
            </button>
          );
        })}
      </div>

      <div className="deferral-layout-sidebar__footer">
        <button
          type="button"
          className="creator-button creator-button--md creator-button--outline"
          onClick={toggleCollapse}
          style={{ width: "100%" }}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>
    </div>
  );
};

const DeferralLayout = ({ userId }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("form");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 768,
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 375);

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

  const toggleSidebar = () => setSidebarCollapsed((current) => !current);

  const renderContent = () => {
    switch (activeView) {
      case "pending":
        return <DeferralPending userId={userId} />;
      case "form":
      default:
        return <DeferralForm userId={userId} />;
    }
  };

  return (
    <div
      className="creator-layout-shell creator-theme"
      style={{
        "--sidebar-width": `${getSidebarWidth(sidebarCollapsed)}px`,
      }}
    >
      <style>{deferralLayoutStyles}</style>

      {isMobile && !sidebarCollapsed ? (
        <div
          className="creator-layout-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      ) : null}

      <Sidebar
        activeView={activeView}
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        navigate={navigate}
        onSelectView={setActiveView}
        setSidebarCollapsed={setSidebarCollapsed}
        toggleCollapse={toggleSidebar}
      />

      <div
        className={`creator-layout-main ${!isMobile && !sidebarCollapsed ? "creator-layout-main--with-sidebar" : ""}`}
      >
        <Navbar
          toggleSidebar={toggleSidebar}
          additionalButtons={
            <div className="deferral-layout-toolbar">
              <button
                type="button"
                className={`creator-button creator-button--md ${activeView === "form" ? "creator-button--primary" : "creator-button--outline"}`}
                onClick={() => setActiveView("form")}
              >
                Request Deferral
              </button>
              <button
                type="button"
                className={`creator-button creator-button--md ${activeView === "pending" ? "creator-button--primary" : "creator-button--outline"}`}
                onClick={() => setActiveView("pending")}
              >
                Pending Deferrals
              </button>
            </div>
          }
        />

        <div
          className="creator-layout-content"
          style={{
            padding: isMobile ? "8px 2px" : undefined,
            overflowX: isMobile ? "auto" : "hidden",
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DeferralLayout;
