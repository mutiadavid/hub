#!/usr/bin/env node

import http from "http";
import { Server } from "socket.io";

const PORT = process.env.SOCKET_PORT || 5001;

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("user-online", async (userData) => {
    try {
      const { userId, name, email, role } = userData;

      onlineUsers.set(userId, {
        socketId: socket.id,
        userId,
        name,
        email,
        role,
        loginTime: new Date(),
        lastSeen: new Date(),
      });

      console.log(`👤 ${name} (${email}) is now online`);

      // Broadcast updated online users
      io.emit("online-users-updated", {
        count: onlineUsers.size,
        users: Array.from(onlineUsers.values()),
      });

      // Note: Backend API endpoint for online status not implemented yet
      // Socket tracking is handled on the frontend
    } catch (error) {
      console.error("Error handling user-online:", error);
    }
  });

  socket.on("user-activity", (data) => {
    const user = Array.from(onlineUsers.values()).find(
      (u) => u.socketId === socket.id,
    );
    if (user) {
      user.lastSeen = new Date();
      io.emit("user-activity-updated", { userId: user.userId, ...data });
    }
  });

  socket.on("getOnlineUsers", () => {
    socket.emit("online-users", {
      count: onlineUsers.size,
      users: Array.from(onlineUsers.values()),
    });
  });

  socket.on("disconnect", async () => {
    const user = Array.from(onlineUsers.entries()).find(
      ([_, u]) => u.socketId === socket.id,
    );
    if (user) {
      const [userId, userData] = user;
      onlineUsers.delete(userId);

      console.log(`👤 ${userData.name} went offline`);

      // Broadcast updated online users
      io.emit("online-users-updated", {
        count: onlineUsers.size,
        users: Array.from(onlineUsers.values()),
      });

      // Note: Backend API endpoint for offline status not implemented yet
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`📡 Ready for WebSocket connections`);
});