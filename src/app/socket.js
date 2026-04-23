
// socket.js
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/runtimeConfig";

const socket = io(SOCKET_URL, {
  autoConnect: false, // IMPORTANT
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect_error", (err) => {
  console.error("⚠️ WebSocket error:", err.message);
});

/* ===========================
   HELPERS
=========================== */
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const emitUserOnline = (user) => {
  if (!user?._id) return;

  connectSocket();

  socket.emit("userOnline", {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

export default socket;
