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
  const [me, setMe] = useState(null);   // ⭐ NEW
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const navigate = useNavigate();
  const socketRef = useRef(null);

  /* ================= LOAD CHATS ================= */

  const loadChats = useCallback(async () => {
    try {
      if (!auth.currentUser) return;

      const token = await auth.currentUser.getIdToken();

      const [meRes, listRes] = await Promise.all([
        api.get("/private-chat/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/private-chat/list", {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
        socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

        socketRef.current.on("connect", () => setConnected(true));
        socketRef.current.on("disconnect", () => setConnected(false));
      }

      const socket = socketRef.current;

      socket.emit("register", user.uid);

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

    return () => unsubscribe();
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

        <Box display="flex" justifyContent="space-between">
          <Typography sx={headerTitle}>Messages</Typography>

          <Typography
            sx={{ fontSize: 12, color: connected ? "#4caf50" : "#ff4d4f" }}
          >
            {connected ? "● Online" : "● Offline"}
          </Typography>
        </Box>

        <Typography sx={subTitle}>
          {users.length} Active Conversations
        </Typography>

        <Box sx={{ mt: 4 }}>
          <AnimatePresence>
            {users.length > 0 ? (
              users.map((u, index) => {

                /* 🎯 ROLE BASED NAME */
                const title =
                  me?.role === "owner"
                    ? u.name          // 👑 OWNER → USER NAME
                    : u.pg_name || u.name;  // 👤 TENANT → PG NAME

                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Box
                      sx={chatCard}
                      onClick={() => navigate(`/owner/chat/private/${u.id}`)}
                    >

                      <Badge
                        overlap="circular"
                        variant="dot"
                        sx={u.online ? onlineBadge : offlineBadge}
                      >
                        <Avatar sx={avatarStyle}>
                          {title?.charAt(0)}
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
                            <span style={{ color: "#00d2ff" }}>You: </span>
                          )}
                          {u.last_message}
                        </Typography>

                      </Box>

                      {u.unread > 0 && (
                        <Box sx={unreadBadge}>{u.unread}</Box>
                      )}
                    </Box>
                  </motion.div>
                );
              })
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