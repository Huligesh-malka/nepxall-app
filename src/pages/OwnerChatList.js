import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Badge, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
});

export default function OwnerChatList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) init(user);
      else navigate("/login");
    });

    return () => {
      unsubscribe();
      socket.disconnect();
    };
  }, []);

  const init = async (firebaseUser) => {
    await loadChats();

    if (!socket.connected) socket.connect();

    // ⭐ REGISTER OWNER
    socket.emit("register", firebaseUser.uid);

    // ⭐ LIVE CHAT LIST UPDATE
    socket.on("chat_list_update", loadChats);

    // ⭐ ONLINE USERS
    socket.on("user_online", ({ userId }) => {
      setUsers((prev) =>
        prev.map((u) => (u.firebase_uid === userId ? { ...u, online: true } : u))
      );
    });

    socket.on("user_offline", ({ userId }) => {
      setUsers((prev) =>
        prev.map((u) => (u.firebase_uid === userId ? { ...u, online: false } : u))
      );
    });
  };

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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography sx={headerTitle}>Messages</Typography>
          <Typography sx={subTitle}>{users.length} Active Conversations</Typography>
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
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      sx={u.online ? onlineBadge : offlineBadge}
                    >
                      <Avatar sx={avatarStyle}>
                        {u.name?.charAt(0) || "U"}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flex: 1, ml: 1 }}>
                      <Box display="flex" justifyContent="space-between">
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

                    {u.unread > 0 && <Box sx={unreadBadge}>{u.unread}</Box>}
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