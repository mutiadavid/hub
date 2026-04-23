// src/components/SocketProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { message } from "antd";
import { useSelector } from "react-redux";
import { API_ORIGIN } from "../config/runtimeConfig";

// Create context
const SocketContext = createContext();

// ✅ FIX: Make sure useSocket is exported as a named export
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// ✅ FIX: Export SocketProvider as a named export
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Get user from Redux store
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Function to initialize socket for logged-in users
    const initializeSocket = () => {
      // Check if user exists in Redux store
      if (!user || (!user.id && !user._id)) {
        return null;
      }

      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");

        // Create socket connection
        const socketInstance = io(API_ORIGIN, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: {
              token: token,
            },
          },
        );

        socketInstance.on("connect", () => {
          setIsConnected(true);

          // Emit userOnline event with user data
          socketInstance.emit("userOnline", {
            _id: user.id || user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          });

          // Join admin room if admin
          if (user.role === "admin") {
            socketInstance.emit("joinAdminRoom", user.id || user._id);
          }
        });

        socketInstance.on("disconnect", () => {
          setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error);
          setIsConnected(false);
        });

        socketInstance.on("forcedLogout", (data) => {
          message.warning(
            `You have been logged out: ${data.reason || "Admin action"}`,
          );
          localStorage.removeItem("token");
          window.location.href = "/login";
        });

        // Track user activity
        const trackActivity = () => {
          if (user && socketInstance.connected) {
            socketInstance.emit("trackActivity", {
              userId: user.id || user._id,
              page: window.location.pathname,
              action: "page_view",
            });
          }
        };

        // Track initial activity
        trackActivity();

        // Track every 30 seconds
        const activityInterval = setInterval(trackActivity, 30000);

        // Track on route changes
        const handleRouteChange = () => {
          setTimeout(trackActivity, 100);
        };

        window.addEventListener("popstate", handleRouteChange);

        setSocket(socketInstance);

        // Store interval ID for cleanup
        socketInstance.activityInterval = activityInterval;
        socketInstance.handleRouteChange = handleRouteChange;

        return socketInstance;
      } catch (error) {
        console.error("Error initializing socket:", error);
        return null;
      }
    };

    // Initialize socket only if user exists
    const socketInstance = user ? initializeSocket() : null;

    // Cleanup
    return () => {
      if (socketInstance) {
        if (socketInstance.activityInterval) {
          clearInterval(socketInstance.activityInterval);
        }
        if (socketInstance.handleRouteChange) {
          window.removeEventListener(
            "popstate",
            socketInstance.handleRouteChange,
          );
        }
        socketInstance.disconnect();
      }
    };
  }, [user]); // Re-run when user changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// ✅ FIX: Export as default for the main export
export default SocketProvider;
