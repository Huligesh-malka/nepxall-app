import React, { useEffect, useState, useRef } from "react";
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login");

      await loadChats();

      // ✅ create socket once
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, {
          transports: ["websocket"],
        });
      }

      const socket = socketRef.current;

      // ✅ REGISTER OWNER
      socket.emit("register", user.uid);

      // ✅ when new message comes → refresh list
      socket.on("receive_private_message", loadChats);
      socket.on("message_sent_confirmation", loadChats);

      // ✅ ONLINE USERS
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
      unsubscribe();

      if (socketRef.current) {
        socketRef.current.off("receive_private_message");
        socketRef.current.off("message_sent_confirmation");
        socketRef.current.off("user_online");
        socketRef.current.off("user_offline");
      }
    };
  }, []);

  const loadChats = async () => {
    try {
      const res = await api.get("/private-chat/list");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={loaderContainer}>
        <CircularProgress sx={{ color: "#00d2ff" }} />
      </Box>
    );
  }

  return (
    <Box sx={mainContainer}>
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Typography sx={headerTitle}>Messages</Typography>
          <Typography sx={subTitle}>
            {users.length} Active Conversations
          </Typography>
        </motion.div>

        <Box sx={{ mt: 4 }}>
          <AnimatePresence>
            {users.length > 0 ? (
              users.map((u, index) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Box
                    sx={chatCard}
                    onClick={() => navigate(`/chat/private/${u.id}`)}
                  >
                    <Badge
                      overlap="circular"
                      variant="dot"
                      sx={u.online ? onlineBadge : offlineBadge}
                    >
                      <Avatar sx={avatarStyle}>
                        {u.name?.charAt(0) || "U"}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flex: 1, ml: 1 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography sx={nameText}>{u.name}</Typography>
                        <Typography sx={timeText}>
                          {u.last_time
                            ? new Date(u.last_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </Typography>
                      </Box>

                      <Typography sx={msgText} noWrap>
                        {u.last_sender === "me" && (
                          <span style={{ color: "#00d2ff", fontWeight: 700 }}>
                            You:{" "}
                          </span>
                        )}
                        {u.last_message}
                      </Typography>
                    </Box>

                    {u.unread > 0 && (
                      <Box sx={unreadBadge}>{u.unread}</Box>
                    )}
                  </Box>
                </motion.div>
              ))
            ) : (
              <Typography sx={{ textAlign: "center", color: "#fff", mt: 10 }}>
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
  pb: 10,
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
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
  },
};

const offlineBadge = {
  "& .MuiBadge-badge": {
    backgroundColor: "#999",
  },
};