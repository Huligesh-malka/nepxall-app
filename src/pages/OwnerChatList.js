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

  /* ================= LOAD CHAT LIST ================= */

  const loadChats = useCallback(async () => {
    try {

      if (!auth.currentUser) return;

      const token = await auth.currentUser.getIdToken();

      const meRes = await api.get("/private-chat/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const listRes = await api.get("/private-chat/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMe(meRes.data || null);
      setUsers(listRes.data || []);

    } catch (err) {

      console.error("Chat list error:", err?.response?.data || err.message);

      /* prevent UI crash */
      setUsers([]);

    } finally {
      setLoading(false);
    }

  }, []);

  /* ================= AUTH + SOCKET ================= */

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        navigate("/login");
        return;
      }

      await loadChats();

      if (!socketRef.current) {

        socketRef.current = io(SOCKET_URL, {
          transports: ["websocket"],
          reconnection: true,
        });

        socketRef.current.on("connect", () => {
          console.log("🟢 Socket connected");
          setConnected(true);
        });

        socketRef.current.on("disconnect", () => {
          console.log("🔴 Socket disconnected");
          setConnected(false);
        });

      }

      const socket = socketRef.current;

      socket.emit("register", user.uid);

      /* refresh chat list on events */

      socket.on("receive_private_message", loadChats);
      socket.on("message_sent_confirmation", loadChats);
      socket.on("chat_list_update", loadChats);

      socket.on("user_online", (uid) => {

        setUsers(prev =>
          prev.map(u =>
            u.firebase_uid === uid
              ? { ...u, online: true }
              : u
          )
        );

      });

      socket.on("user_offline", (uid) => {

        setUsers(prev =>
          prev.map(u =>
            u.firebase_uid === uid
              ? { ...u, online: false }
              : u
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

  /* ================= LOADING ================= */

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

          <Typography sx={headerTitle}>
            Messages
          </Typography>

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

                const title =
                  me?.role === "owner"
                    ? u.name
                    : u.pg_name || u.name;

                return (

                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >

                    <Box
                      sx={chatCard}
                      onClick={() =>
                        navigate(`/chat/private/${u.id}`)
                      }
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
                            <span style={{ color: "#00d2ff" }}>
                              You:
                            </span>
                          )}

                          {" "}{u.last_message}

                        </Typography>

                      </Box>

                      {u.unread > 0 && (
                        <Box sx={unreadBadge}>
                          {u.unread}
                        </Box>
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


/* ================= STYLES ================= */

const mainContainer = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, #1a2a6c, #b21f1f, #fdbb2d)",
  pt: 6,
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
  "& .MuiBadge-badge": { backgroundColor: "#44b700" },
};

const offlineBadge = {
  "& .MuiBadge-badge": { backgroundColor: "#999" },
};

const emptyState = {
  textAlign: "center",
  color: "#fff",
  mt: 10,
};