import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userData = null) {
    if (userData) this.lastUserData = userData;

    if (!this.socket) {
      const socketURL =
        import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:5001";
      this.socket = io(socketURL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 20,
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
          console.info("💡 To enable real-time features, ensure the socket server is running on:", socketURL);
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
    if (!userData) return;

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
    if (this.socket && userId) {
      this.socket.emit("user-activity", userId);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
