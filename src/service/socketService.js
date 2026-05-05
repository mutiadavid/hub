import { io } from "socket.io-client";
import { SOCKET_ENABLED, SOCKET_URL } from "../config/runtimeConfig";

class SocketService {
  constructor() {
    this.socket = null;
    this._disabledLogged = false;
  }

  connect(userData = null) {
    if (userData) this.lastUserData = userData;

    if (!SOCKET_ENABLED) {
      if (!this._disabledLogged) {
        console.info("Socket.IO disabled. Using polling/API fallbacks for presence updates.");
        this._disabledLogged = true;
      }
      return null;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: false,
        timeout: 5000,
      });

      this.socket.on("connect", () => {
        // Automatically emit user online status on connection
        if (this.lastUserData) {
          this.emitUserOnline(this.lastUserData);
        }
      });

      this.socket.on("connect_error", () => {
        // Only log on first attempt to avoid spamming console
        if (!this._errorLogged) {
          console.warn("⚠️ Socket server unavailable - real-time features disabled. The app will continue to work normally.");
          console.info("💡 To enable real-time features, ensure the socket server is running on:", SOCKET_URL);
          this._errorLogged = true;
        }
      });

      this.socket.on("disconnect", (reason) => {
      });

      this.socket.on("online-users-updated", (data) => {
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitUserOnline(userData) {
    if (!userData || !SOCKET_ENABLED) return;

    // Save for reconnection attempts
    this.lastUserData = userData;

    if (this.socket?.connected) {
      const userPayload = {
        _id: userData.id || userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };
      this.socket.emit("user-online", userPayload);
    } else {
      console.warn(
        "⚠️ Socket not connected, will emit user-online when connected",
      );
    }
  }

  emitUserActivity(userId) {
    if (this.socket && userId && SOCKET_ENABLED) {
      this.socket.emit("user-activity", userId);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
