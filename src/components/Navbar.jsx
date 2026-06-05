import React from "react";
import {
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Dropdown } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../api/authSlice";
import { authApi, useLogoutMutation } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "../styles/creatorDesignSystem.css";
import { showAuthSuccessToast } from "../utils/authToast";
import { API_BASE_URL } from "../config/runtimeConfig";

const Navbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const [logoutMutation] = useLogoutMutation();
  // logout no longer requires email verification; keep flow simple

  // Get dashboard title and path based on user role
  const getDashboardInfo = () => {
    const role = user?.role?.toLowerCase();

    const dashboardOptions = {
      creator: { path: "/cocreator", label: "Creator Dashboard" },
      rm: { path: "/rm", label: "RM Dashboard" },
      checker: { path: "/cochecker", label: "Checker Dashboard" },
      admin: { path: "/admin", label: "System Administrator Dashboard" },
      approver: { path: "/approver", label: "Approver Dashboard" },
    };

    switch (role) {
      case "cocreator":
      case "co_creator":
      case "creator":
        return dashboardOptions.creator;
      case "rm":
        return dashboardOptions.rm;
      case "cochecker":
      case "checker":
        return dashboardOptions.checker;
      case "admin":
      case "internal control":
        return dashboardOptions.admin;
      case "approver":
        return dashboardOptions.approver;
      default:
        return null;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(authApi.util.resetApiState());
      dispatch(logout());
      showAuthSuccessToast("Logged out successfully.");
      navigate("/login", { replace: true });
    }
  };

  // verification removed — logout is immediate

  const menuItems = [
    {
      key: "profile",
      label: "Profile",
      icon: <UserOutlined />,
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const dashboardInfo = getDashboardInfo();
  const initials = (user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const formatRole = (role) => {
    if (!role) return "";
    const key = role.toLowerCase().trim();
    if (key === "admin") return "System Administrator";
    if (key === "internal control") return "Internal Control";
    if (key === "cocreator" || key === "co_creator" || key === "creator") return "CO Creator";
    if (key === "cochecker" || key === "checker") return "CO Checker";
    if (key === "rm") return "RM";
    if (key === "approver") return "Approver";
    return role;
  };

  return (
    <header className="creator-header creator-theme">
      <div className="creator-header__left">
        <button type="button" className="creator-header__menu-button" onClick={toggleSidebar}>
          <MenuOutlined style={{ fontSize: 16 }} />
        </button>

        {dashboardInfo && (
          <h1 className="creator-header__title" onClick={() => navigate(dashboardInfo.path)} style={{ cursor: "pointer" }}>
            {dashboardInfo.label}
          </h1>
        )}
      </div>

      <div className="creator-header__right">
        <div className="creator-navbar-notifications">
          <NotificationBell />
        </div>

        <Dropdown
          overlayClassName="creator-navbar-menu"
          menu={{ items: menuItems }}
          trigger={["click"]}
          placement="bottomRight"
          onOpenChange={setDropdownOpen}
        >
          <div className={`creator-header__user-trigger ${dropdownOpen ? "creator-header__user-trigger--open" : ""}`}>
            <span className="creator-header__avatar">{initials || "U"}</span>
            {!isMobile && (
              <span className="creator-header__user-meta">
                <span className="creator-header__user-name">{user?.name || "User"}</span>
                <span className="creator-header__user-role">{formatRole(user?.role)}</span>
              </span>
            )}
            <DownOutlined className="creator-header__chevron" style={{ fontSize: 10 }} />
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default Navbar;

