import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const normalizeAllowedRoles = ({ role, roles }) => {
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.map((value) => value.toLowerCase());
  }

  if (role) {
    return [role.toLowerCase()];
  }

  return null;
};

const ProtectedRoute = ({ children, role, roles }) => {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const allowedRoles = normalizeAllowedRoles({ role, roles });
  const userRole = user.role?.toLowerCase();

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace state={{ status: "You are not authorized to access that page." }} />;
  }

  return children;
};

export default ProtectedRoute;