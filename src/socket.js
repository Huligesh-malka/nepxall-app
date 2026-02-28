// src/socket.js - CREATE THIS NEW FILE
import { io } from "socket.io-client";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.eventHandlers = new Map();
  }

  connect(userId) {
    if (this.socket?.connected && this.userId === userId) {
      console.log("🟢 Socket already connected");
      return this.socket;
    }

    this.userId = userId;

    if (this.socket) {
      this.socket.disconnect();
    }

    console.log("🔌 Connecting socket for user:", userId);

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true
    });

    this.setupListeners();
    
    return this.socket;
  }

  setupListeners() {
    this.socket.on("connect", () => {
      console.log("🟢 Socket connected successfully:", this.socket.id);
      this.connected = true;
      
      if (this.userId) {
        console.log("📝 Registering user:", this.userId);
        this.socket.emit("register", this.userId);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
      
      if (this.socket.io.opts.transports[0] === "websocket") {
        console.log("🔄 Falling back to polling transport");
        this.socket.io.opts.transports = ["polling", "websocket"];
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      this.connected = false;
      
      if (reason === "io server disconnect" || reason === "transport close") {
        setTimeout(() => {
          if (this.userId) {
            this.socket.connect();
          }
        }, 1000);
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("🟢 Socket reconnected after", attemptNumber, "attempts");
      this.connected = true;
      
      if (this.userId) {
        this.socket.emit("register", this.userId);
      }
    });
  }

  on(event, callback) {
    if (!this.socket) return;
    
    if (this.eventHandlers.has(event)) {
      this.socket.off(event, this.eventHandlers.get(event));
    }
    
    this.eventHandlers.set(event, callback);
    this.socket.on(event, callback);
  }

  off(event) {
    if (!this.socket) return;
    
    if (this.eventHandlers.has(event)) {
      this.socket.off(event, this.eventHandlers.get(event));
      this.eventHandlers.delete(event);
    }
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn("⚠️ Socket not connected, cannot emit:", event);
      return false;
    }
    
    console.log("📤 Emitting:", event, data);
    this.socket.emit(event, data);
    return true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
      this.eventHandlers.clear();
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

const socketManager = new SocketManager();
export default socketManager;