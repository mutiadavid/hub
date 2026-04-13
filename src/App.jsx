
// export default App

import React, { useEffect } from "react";
import "antd/dist/reset.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";


import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useHeartbeatPresenceMutation } from "./api/userApi";
import socketService from "./service/socketService";

// Pages
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatBot from "./components/common/ChatBot";
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

  // Connect socket when user is logged in
  useEffect(() => {
    if (user) {
      console.log("👤 User logged in, connecting socket:", user);
      socketService.connect(user);

      const sendHeartbeat = async () => {
        try {
          await heartbeatPresence().unwrap();
        } catch (error) {
          console.warn("Presence heartbeat failed", error);
        }
      };

      void sendHeartbeat();

      // Emit user online status immediately if already connected,
      // or it will happen automatically in socketService on 'connect' event
      socketService.emitUserOnline(user);

      // Emit activity and refresh persisted presence while the app stays open.
      const activityInterval = setInterval(() => {
        const userId = user.id || user._id;
        socketService.emitUserActivity(userId);
        void sendHeartbeat();
      }, 60000);

      return () => {
        console.log("🔌 Cleaning up socket connection");
        clearInterval(activityInterval);
        socketService.disconnect();
      };
    } else {
      console.log("👤 No user, disconnecting socket");
      socketService.disconnect();
    }
  }, [heartbeatPresence, user]);

  return (
    <>
      {user ? <SessionTimeout timeoutDuration={10 * 60 * 1000} warningDuration={30 * 1000} /> : null}

      <ToastContainer newestOnTop pauseOnFocusLoss={false} />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

      {user ? <ChatBot title="DCL Assistant" /> : null}
    </>
  );
};

export default App;