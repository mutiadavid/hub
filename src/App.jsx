
// export default App

import React, { useEffect, useRef } from "react";
import "antd/dist/reset.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";


import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useHeartbeatPresenceMutation } from "./api/userApi";
import socketService from "./service/socketService";

// Pages
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SessionTimeout from "./components/common/SessionTimeout";

// Layouts
import MainLayout from "./components/creator/COLayout";
import CheckerLayout from "./components/checker/CheckerLayout";
import AdminLayout from "./components/admin/AdminLayout";
import RmLayout from "./components/rm/RmLayout";
import ApproverLayout from "./components/approver/ApproverLayout"; // Add this import

// Styles
import "./App.css";

const App = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;
  const [heartbeatPresence] = useHeartbeatPresenceMutation();
  const lastHeartbeatAtRef = useRef(0);

  // Connect socket when user is logged in
  useEffect(() => {
    if (user) {
      socketService.connect(user);

      const sendHeartbeat = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastHeartbeatAtRef.current < 30000) {
          return;
        }

        lastHeartbeatAtRef.current = now;

        try {
          const result = await heartbeatPresence();
          // Check for error but don't treat 401 as fatal for heartbeat
          if (result?.error?.status === 401) {
            // Token might be expired, but don't logout from heartbeat
            // Logout will be handled by actual API calls
            return;
          }
        } catch {
          // Silently ignore heartbeat errors
        }

        const activeUserId = user.id || user._id;
        if (activeUserId) {
          socketService.emitUserActivity(activeUserId);
        }
      };

      const activityEvents = ["load", "mousemove", "mousedown", "click", "scroll", "keypress", "touchstart"];
      const handleActivity = () => {
        void sendHeartbeat(false);
      };

      void sendHeartbeat(true);

      // Emit user online status immediately if already connected,
      // or it will happen automatically in socketService on 'connect' event
      socketService.emitUserOnline(user);

      activityEvents.forEach((eventName) => {
        window.addEventListener(eventName, handleActivity);
      });

      return () => {
        activityEvents.forEach((eventName) => {
          window.removeEventListener(eventName, handleActivity);
        });
        socketService.disconnect();
      };
    } else {
      lastHeartbeatAtRef.current = 0;
      socketService.disconnect();
    }
  }, [heartbeatPresence, user]);

  return (
    <>
      {user ? <SessionTimeout timeoutDuration={15 * 60 * 1000} warningDuration={30 * 1000} /> : null}

      <ToastContainer newestOnTop pauseOnFocusLoss={false} />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />

        {/* PROTECTED ROUTES */}

        {/* CO-CREATOR ROUTES */}
        <Route
          path="/cocreator/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />

        {/* CHECKER ROUTES */}
        <Route
          path="/cochecker/*"
          element={
            <ProtectedRoute>
              <CheckerLayout />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* RELATIONSHIP MANAGER ROUTES */}
        <Route
          path="/rm/*"
          element={
            <ProtectedRoute>
              <RmLayout userId={userId} />
            </ProtectedRoute>
          }
        />

        {/* APPROVER ROUTES - NEW ADDITION */}
        <Route
          path="/approver/*"
          element={
            <ProtectedRoute>
              <ApproverLayout userId={userId} />
            </ProtectedRoute>
          }
        />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

export default App;