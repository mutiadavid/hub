
// socket.js
import { io } from "socket.io-client";
import { SOCKET_ENABLED, SOCKET_URL } from "../config/runtimeConfig";

const createNoopSocket = () => ({
  connected: false,
  connect() {},
  disconnect() {},
  emit() {},
  on() {},
  off() {},
});

let socketInstance = null;
let socketWarningShown = false;

const getSocketInstance = () => {
  if (!SOCKET_ENABLED) {
    if (!socketWarningShown) {
      console.info("Socket.IO disabled. Set VITE_SOCKET_ENABLED=true to enable realtime features.");
      socketWarningShown = true;
    }
    return createNoopSocket();
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: false,
      timeout: 5000,
    });

    socketInstance.on("connect_error", (err) => {
      if (!socketWarningShown) {
        console.warn(`Socket.IO unavailable at ${SOCKET_URL}. Realtime features are disabled until the socket server is started.`);
        console.debug("Socket connect error:", err.message);
        socketWarningShown = true;
      }
    });
  }

  return socketInstance;
};

export const socket = {
  get connected() {
    return getSocketInstance().connected;
  },
  connect() {
    return getSocketInstance().connect();
  },
  disconnect() {
    return getSocketInstance().disconnect();
  },
  emit(...args) {
    return getSocketInstance().emit(...args);
  },
  on(...args) {
    return getSocketInstance().on(...args);
  },
  off(...args) {
    return getSocketInstance().off(...args);
  },
};

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
