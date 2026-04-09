// src/hooks/useAuditSocket.js
import { useEffect, useState } from "react";
import { useSocket } from "../components/SocketProvider";

export const useAuditSocket = (currentUser) => {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      console.log("⚠️ Socket not available in useAuditSocket");
      return;
    }

    console.log("🔌 useAuditSocket: Socket available, setting up listeners...");

    // Listen for connection status
    const handleConnect = () => {
      console.log("✅ useAuditSocket: Socket connected");
      setSocketConnected(true);

      // Join admin room if admin
      if (currentUser?.role === "admin") {
        console.log(`👑 Admin ${currentUser.name} joining admin room`);
        socket.emit("joinAdminRoom", currentUser._id);
      }
    };

    const handleDisconnect = () => {
      console.log("🔴 useAuditSocket: Socket disconnected");
      setSocketConnected(false);
    };

    // Listen for online users
    const handleOnlineUsers = (users) => {
      console.log("👥 Online users update:", users?.length || 0);
      setOnlineUsers(users || []);
    };

    // Listen for new audit logs
    const handleNewAuditLog = (log) => {
      console.log("📋 New audit log received:", log.action);
      setLiveLogs((prev) => {
        // Keep only last 100 logs to prevent memory issues
        const newLogs = [log, ...prev];
        return newLogs.slice(0, 99);
      });
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("online-users", handleOnlineUsers);
    socket.on("new-audit-log", handleNewAuditLog);

    // Request initial online users if connected
    if (socket.connected) {
      console.log("📡 useAuditSocket: Requesting online users...");
      socket.emit("getOnlineUsers");
      handleConnect(); // Manually trigger connection handler
    }

    // Cleanup function
    return () => {
      console.log("🧹 useAuditSocket: Cleaning up event listeners");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("online-users", handleOnlineUsers);
      socket.off("new-audit-log", handleNewAuditLog);
    };
  }, [socket, currentUser]);

  // Function to emit user activity (optional, can be used for manual activity tracking)
  const emitActivity = (action, details = {}) => {
    if (socket && socketConnected && currentUser?._id) {
      const activityData = {
        userId: currentUser._id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        details,
        timestamp: new Date().toISOString(),
      };

      console.log("📤 Emitting activity:", activityData);
      socket.emit("userActivity", activityData);
    } else {
      console.warn(
        "⚠️ Cannot emit activity: Socket not ready or user not logged in"
      );
    }
  };

  // Function to request specific user's logs
  const requestUserLogs = (userId) => {
    if (socket && socketConnected) {
      socket.emit("requestUserLogs", { userId });
    }
  };

  return {
    onlineUsers,
    liveLogs,
    isConnected: socketConnected || isConnected,
    emitActivity,
    requestUserLogs,
  };
};
