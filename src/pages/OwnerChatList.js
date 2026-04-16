import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Badge,
  CircularProgress,
  Container,
} from "@mui/material";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

export default function OwnerChatList() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const navigate = useNavigate();
  const socketRef = useRef(null);
  const { user, loading } = useAuth();

  /* ================= JOIN ROOM FUNCTION WITH SELF-CHAT BLOCK ================= */
  const joinAllRooms = useCallback(() => {
    if (!me || !socketRef.current || !connected) {
      console.log("Cannot join rooms - missing:", { me: !!me, socket: !!socketRef.current, connected });
      return;
    }
    
    console.log("Joining rooms for all chats...");
    users.forEach((u) => {
      // 🔥 CRITICAL FIX: Skip if trying to chat with self
      if (u.id === me.id) {
        console.warn("⚠️ Skipping self room - user ID matches owner:", { userId: u.id, ownerId: me.id, userName: u.name });
        return;
      }
      
      const roomData = {
        userA: me.id,
        userB: u.id,
        pg_id: u.pg_id,
      };
      console.log(`✅ Joining room with data:`, roomData);
      socketRef.current.emit("join_private_room", roomData);
    });
  }, [me, users, connected]);

  /* ================= LOAD CHATS ================= */
  const loadChats = useCallback(async () => {
    try {
      if (!user) return;

      const token = await user.getIdToken();

      const [meRes, listRes] = await Promise.all([
        api.get("/private-chat/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/private-chat/list", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setMe(meRes.data);
      
      // 🔥 DEBUG: Log the API response to verify data
      console.log("📊 API Response - /private-chat/list:", listRes.data);
      console.log("📊 Current user (me):", meRes.data);
      
      // 🔥 Filter out self from the list just in case API returns it
      const filteredUsers = (listRes.data || []).filter(u => u.id !== meRes.data.id);
      
      if (filteredUsers.length !== (listRes.data || []).length) {
        console.warn("⚠️ Filtered out self from user list");
      }
      
      setUsers(filteredUsers);
      
      console.log("✅ Loaded user data:", { 
        me: meRes.data.id, 
        usersCount: filteredUsers.length,
        users: filteredUsers.map(u => ({ id: u.id, name: u.name, pg_id: u.pg_id }))
      });
    } catch (err) {
      console.error("Chat list error:", err);
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  /* ================= SOCKET SETUP ================= */
  useEffect(() => {
    if (!user) return;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected → registering and joining rooms");
        setConnected(true);
        
        socketRef.current.emit("register", user.uid);
        
        setTimeout(() => {
          joinAllRooms();
        }, 100);
      });
      
      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });
      
      socketRef.current.on("reconnect", () => {
        console.log("Socket reconnected → rejoining rooms");
        setConnected(true);
        socketRef.current.emit("register", user.uid);
        setTimeout(() => {
          joinAllRooms();
        }, 100);
      });
    }

    const socket = socketRef.current;

    socket.off("receive_private_message");
    socket.off("message_sent_confirmation");
    socket.off("chat_list_update");
    socket.off("user_online");
    socket.off("user_offline");
    socket.off("room_joined");

    socket.on("receive_private_message", (msg) => {
      console.log("🔥 MESSAGE RECEIVED in OwnerChatList:", msg);
      loadChats();
    });
    
    socket.on("message_sent_confirmation", (data) => {
      console.log("✅ Message confirmation:", data);
      loadChats();
    });
    
    socket.on("chat_list_update", () => {
      console.log("🔄 Chat list update requested");
      loadChats();
    });

    socket.on("user_online", (firebase_uid) => {
      console.log("User online:", firebase_uid);
      setUsers(prev =>
        prev.map(u =>
          u.firebase_uid === firebase_uid
            ? { ...u, online: true }
            : u
        )
      );
    });

    socket.on("user_offline", (firebase_uid) => {
      console.log("User offline:", firebase_uid);
      setUsers(prev =>
        prev.map(u =>
          u.firebase_uid === firebase_uid
            ? { ...u, online: false }
            : u
        )
      );
    });

    socket.on("room_joined", (data) => {
      console.log("✅ Successfully joined room:", data);
    });

    return () => {
      socket.off("receive_private_message");
      socket.off("message_sent_confirmation");
      socket.off("chat_list_update");
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("room_joined");
    };
  }, [user, loadChats, joinAllRooms]);

  useEffect(() => {
    if (me && users.length > 0 && socketRef.current && connected) {
      console.log("🔄 Data loaded, forcing room joins...");
      joinAllRooms();
    }
  }, [me, users, connected, joinAllRooms]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }

    if (user) {
      loadChats();
    }
  }, [user, loading, navigate, loadChats]);

  const formatTime = (time) => {
    if (!time) return "";

    const date = new Date(time);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString();
  };

  if (loading || pageLoading) {
    return (
      <Box sx={loaderContainer}>
        <CircularProgress sx={{ color: "#00d2ff" }} />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box sx={mainContainer}>
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography sx={headerTitle}>
            Messages
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              sx={{ fontSize: 12, color: connected ? "#4caf50" : "#ff4d4f" }}
            >
              {connected ? "● Online" : "● Offline"}
            </Typography>
            {connected && (
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                Real-time
              </Typography>
            )}
          </Box>
        </Box>

        <Typography sx={subTitle}>
          {users.length} Active {users.length === 1 ? 'Conversation' : 'Conversations'}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <AnimatePresence>
            {users.length > 0 ? (
              users.map((u, index) => {
                const title = u.name || u.pg_name || "User";
                return (
                  <motion.div
                    key={`${u.id}_${u.pg_id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Box
                      sx={chatCard}
                      onClick={() => {
                        // 🔥 FIX: Block self-chat navigation
                        if (u.id === me?.id) {
                          console.error("❌ Self chat blocked - cannot chat with yourself");
                          return;
                        }
                        navigate(`/chat/private/${u.id}/${u.pg_id}`);
                      }}
                    >
                      <Badge
                        overlap="circular"
                        variant="dot"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        sx={u.online ? onlineBadge : offlineBadge}
                      >
                        <Avatar sx={avatarStyle}>
                          {title?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>

                      <Box sx={{ flex: 1, ml: 1 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography sx={nameText}>
                            {title}
                          </Typography>
                          <Typography sx={timeText}>
                            {formatTime(u.last_time)}
                          </Typography>
                        </Box>

                        <Typography sx={msgText} noWrap>
                          {u.last_sender === "me" && (
                            <span style={{ color: "#00d2ff", fontWeight: 600 }}>
                              You: 
                            </span>
                          )}
                          {u.last_message || "No messages yet"}
                        </Typography>
                      </Box>

                      {u.unread > 0 && (
                        <Box sx={unreadBadge}>
                          {u.unread > 99 ? '99+' : u.unread}
                        </Box>
                      )}
                    </Box>
                  </motion.div>
                );
              })
            ) : (
              <Typography sx={emptyState}>
                No conversations yet.
                <br />
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                  When users message you, they'll appear here
                </span>
              </Typography>
            )}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  );
}

const mainContainer = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, #1a2a6c, #b21f1f, #fdbb2d)",
  pt: 6,
  pb: 4,
};

const loaderContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f0c29",
};

const headerTitle = {
  fontSize: "2.2rem",
  fontWeight: 800,
  color: "#fff",
  letterSpacing: "-0.5px",
};

const subTitle = {
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.6)",
  mt: 1,
};

const chatCard = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  p: "18px",
  mb: 2,
  borderRadius: "20px",
  cursor: "pointer",
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(10px)",
  transition: "0.3s",
  "&:hover": {
    transform: "translateY(-4px)",
    background: "rgba(255,255,255,0.12)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  },
};

const avatarStyle = {
  width: 55,
  height: 55,
  fontSize: "1.2rem",
  fontWeight: 700,
  background: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
};

const nameText = {
  fontSize: "1.05rem",
  fontWeight: 700,
  color: "#fff",
};

const msgText = {
  fontSize: "0.85rem",
  color: "rgba(255,255,255,0.7)",
};

const timeText = {
  fontSize: "0.7rem",
  color: "rgba(255,255,255,0.4)",
};

const unreadBadge = {
  background: "#ff4d4f",
  minWidth: "22px",
  height: "22px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.7rem",
  fontWeight: 800,
  color: "#fff",
  padding: "0 6px",
};

const onlineBadge = {
  "& .MuiBadge-badge": { 
    backgroundColor: "#44b700",
    boxShadow: "0 0 0 2px rgba(68, 183, 0, 0.2)",
  },
};

const offlineBadge = {
  "& .MuiBadge-badge": { 
    backgroundColor: "#999",
  },
};

const emptyState = {
  textAlign: "center",
  color: "#fff",
  mt: 10,
  opacity: 0.8,
};