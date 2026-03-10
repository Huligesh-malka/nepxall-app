import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Badge,
  CircularProgress,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

export default function OwnerChatList() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const navigate = useNavigate();
  const socketRef = useRef(null);

  /* ================= LOAD CHATS ================= */
  const loadChats = useCallback(async () => {
    try {
      if (!auth.currentUser) return;

      const token = await auth.currentUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [meRes, listRes] = await Promise.all([
        api.get("/private-chat/me", config),
        api.get("/private-chat/list", config),
      ]);

      setMe(meRes.data);
      setUsers(listRes.data || []);
    } catch (err) {
      console.error("Chat list error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= AUTH + SOCKET ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login");

      await loadChats();

      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, { 
          transports: ["websocket"],
          autoConnect: true
        });

        socketRef.current.on("connect", () => {
          setConnected(true);
          socketRef.current.emit("register", user.uid);
        });
        
        socketRef.current.on("disconnect", () => setConnected(false));
      }

      const socket = socketRef.current;

      socket.on("receive_private_message", loadChats);
      socket.on("message_sent_confirmation", loadChats);
      socket.on("chat_list_update", loadChats);

      socket.on("user_online", ({ userId }) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.firebase_uid === userId ? { ...u, online: true } : u
          )
        );
      });

      socket.on("user_offline", ({ userId }) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.firebase_uid === userId ? { ...u, online: false } : u
          )
        );
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      unsubscribe();
    };
  }, [loadChats, navigate]);

  /* ================= TIME FORMAT ================= */
  const formatTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString();
  };

  /* ================= HANDLE CHAT CLICK ================= */
  const handleChatClick = (user) => {
    navigate(`/owner/chat/private/${user.id}?pgId=${user.pg_id}`);
  };

  /* ================= LOADER ================= */
  if (loading) {
    return (
      <Box sx={loaderContainer}>
        <CircularProgress sx={{ color: "#00d2ff" }} />
      </Box>
    );
  }

  /* ================= UI ================= */
  return (
    <Box sx={mainContainer}>
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography sx={headerTitle}>Messages</Typography>
          <Typography
            sx={{ fontSize: 12, color: connected ? "#4caf50" : "#ff4d4f" }}
          >
            {connected ? "● Online" : "● Offline"}
          </Typography>
        </Box>

        <Typography sx={subTitle}>
          {users.length} Active Conversation{users.length !== 1 ? 's' : ''}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <AnimatePresence>
            {users.length > 0 ? (
              users.map((user, index) => (
                <motion.div
                  key={`${user.id}-${user.pg_id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Box
                    sx={chatCard}
                    onClick={() => handleChatClick(user)}
                  >
                    <Badge
                      overlap="circular"
                      variant="dot"
                      sx={user.online ? onlineBadge : offlineBadge}
                    >
                      <Avatar sx={avatarStyle}>
                        {user.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flex: 1, ml: 1 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography sx={nameText}>
                          {user.name}
                        </Typography>
                        <Typography sx={timeText}>
                          {formatTime(user.last_time)}
                        </Typography>
                      </Box>

                      <Typography sx={msgText} noWrap>
                        {user.last_sender === "me" && (
                          <span style={{ color: "#00d2ff" }}>You: </span>
                        )}
                        {user.last_message}
                      </Typography>
                    </Box>

                    {user.unread > 0 && (
                      <Box sx={unreadBadge}>{user.unread}</Box>
                    )}
                  </Box>
                </motion.div>
              ))
            ) : (
              <Typography sx={emptyState}>
                No conversations yet.
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
  maxWidth: "200px",
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
};

const onlineBadge = {
  "& .MuiBadge-badge": { 
    backgroundColor: "#44b700",
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      content: '""',
    }
  },
};

const offlineBadge = {
  "& .MuiBadge-badge": { backgroundColor: "#999" },
};

const emptyState = {
  textAlign: "center",
  color: "#fff",
  mt: 10,
};