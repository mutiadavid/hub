
// export default App

import React, { useEffect, useRef } from "react";
import "antd/dist/reset.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useHeartbeatPresenceMutation } from "./api/userApi";
import { useGetMeQuery } from "./api/authApi";
import { setCredentials } from "./api/authSlice";
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

const HEARTBEAT_MIN_INTERVAL_MS = 25000;

const AppShell = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;
  const location = useLocation();
  const [heartbeatPresence] = useHeartbeatPresenceMutation();
  const lastHeartbeatAtRef = useRef(0);

  // Restore session from HttpOnly cookie on page load/reload.
  // If the cookie is valid the backend returns the user; if not,
  // the query returns 401 and we stay on the login page.
  const { data: meData, isLoading: meLoading, isError: meError } = useGetMeQuery(undefined, {
    // Only call /me when Redux has no user yet (i.e. fresh page load)
    skip: !!user,
  });

  useEffect(() => {
    if (meData?.user && meData?.token) {
      dispatch(setCredentials({ user: meData.user, token: meData.token }));
    }
  }, [meData, dispatch]);

  // Connect socket when user is logged in
  useEffect(() => {
    if (user) {
      socketService.connect(user);

      const sendHeartbeat = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastHeartbeatAtRef.current < HEARTBEAT_MIN_INTERVAL_MS) {
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

      const activityEvents = [
        "load",
        "mousemove",
        "mousedown",
        "click",
        "scroll",
        "keydown",
        "touchstart",
        "visibilitychange",
        "focus",
      ];
      const handleActivity = () => {
        if (document.visibilityState === "hidden") return;
        void sendHeartbeat(false);
      };

      void sendHeartbeat(true);

      // Emit user online status immediately if already connected,
      // or it will happen automatically in socketService on 'connect' event
      socketService.emitUserOnline(user);

      activityEvents.forEach((eventName) => {
        window.addEventListener(eventName, handleActivity, { passive: true });
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

  // Route changes count as activity for server-side idle tracking (no click on SPA transition).
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const result = await heartbeatPresence();
        if (!cancelled && result?.error?.status !== 401) {
          lastHeartbeatAtRef.current = Date.now();
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [heartbeatPresence, location.pathname, user]);

  // While /me is in flight on first load, show a loading indicator
  // instead of flashing the login page.
  if (meLoading && !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center", color: "#164679" }}>
          <div className="ant-spin ant-spin-lg ant-spin-spinning" style={{ marginBottom: 16 }}>
            <span className="ant-spin-dot ant-spin-dot-spin" />
          </div>
          <p style={{ fontSize: 14, margin: 0 }}>Restoring session…</p>
        </div>
      </div>
    );
  }

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
            <ProtectedRoute role="cocreator">
              <MainLayout />
            </ProtectedRoute>
          }
        />

        {/* CHECKER ROUTES */}
        <Route
          path="/cochecker/*"
          element={
            <ProtectedRoute role="cochecker">
              <CheckerLayout />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={["admin", "internal control"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* RELATIONSHIP MANAGER ROUTES */}
        <Route
          path="/rm/*"
          element={
            <ProtectedRoute role="rm">
              <RmLayout userId={userId} />
            </ProtectedRoute>
          }
        />

        {/* APPROVER ROUTES - NEW ADDITION */}
        <Route
          path="/approver/*"
          element={
            <ProtectedRoute role="approver">
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

const App = () => <AppShell />;

export default App;