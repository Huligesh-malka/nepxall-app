import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Badge, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api"; // 🔥 Using your custom API instance
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("http://localhost:5000", { autoConnect: false });

export default function OwnerChatList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 🔥 Persistence Fix: Ensure Auth is ready
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        init(user);
      } else {
        navigate("/login");
      }
    });

    return () => {
      unsubscribe();
      socket.off("chat_list_update");
    };
  }, []);

  const init = async (user) => {
    await loadChats();
    if (!socket.connected) socket.connect();
    socket.emit("register", user.uid); // Register to receive live list updates
    socket.on("chat_list_update", loadChats);
  };

  const loadChats = async () => {
    try {
      // 🔥 Changed path to match common router patterns
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box sx={chatCard} onClick={() => navigate(`/chat/private/${u.id}`)}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      sx={u.online ? onlineBadge : offlineBadge}
                    >
                      <Avatar sx={avatarStyle}>{u.name?.charAt(0) || "U"}</Avatar>
                    </Badge>

                    <Box sx={{ flex: 1, ml: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={nameText}>{u.name || "User"}</Typography>
                        <Typography sx={timeText}>
                          {u.last_time ? new Date(u.last_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                        </Typography>
                      </Box>
                      <Typography sx={msgText} noWrap>
                        {u.last_sender === "me" && (
                          <span style={{ color: "#00d2ff", fontWeight: 700 }}>You: </span>
                        )}
                        {u.last_message}
                      </Typography>
                    </Box>

                    {u.unread > 0 && <Box sx={unreadBadge}>{u.unread}</Box>}
                  </Box>
                </motion.div>
              ))
            ) : (
              <Typography sx={{ textAlign: "center", color: "#fff", opacity: 0.5, mt: 10 }}>
                No conversations yet.
              </Typography>
            )}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  );
}

// ... (Your existing styles remain exactly the same)
const mainContainer = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, #1a2a6c, #b21f1f, #fdbb2d)", 
  backgroundAttachment: "fixed",
  pt: 6,
  pb: 10,
  px: 2,
};
const loaderContainer = { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#0f0c29" };
const headerTitle = { fontSize: "2.2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" };
const subTitle = { fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 };
const chatCard = { display: "flex", alignItems: "center", gap: 2, p: "18px", mb: 2, borderRadius: "20px", cursor: "pointer", background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)", transition: "all 0.3s ease", "&:hover": { background: "rgba(255, 255, 255, 0.15)", boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.2)" } };
const avatarStyle = { width: 55, height: 55, fontSize: "1.2rem", fontWeight: 700, background: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)", boxShadow: "0 4px 15px rgba(0, 210, 255, 0.3)" };
const nameText = { fontSize: "1.05rem", fontWeight: 700, color: "#fff" };
const msgText = { fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", maxWidth: "220px" };
const timeText = { fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 };
const unreadBadge = { background: "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)", minWidth: "22px", height: "22px", borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#fff", boxShadow: "0 4px 10px rgba(221, 36, 118, 0.4)" };
const onlineBadge = { "& .MuiBadge-badge": { backgroundColor: "#44b700", color: "#44b700", boxShadow: "0 0 0 2px #fff", "&::after": { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "50%", animation: "ripple 1.2s infinite ease-in-out", border: "1px solid currentColor", content: '""' } }, "@keyframes ripple": { "0%": { transform: "scale(.8)", opacity: 1 }, "100%": { transform: "scale(2.4)", opacity: 0 } } };
const offlineBadge = { "& .MuiBadge-badge": { backgroundColor: "#999" } };