import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Badge,
  CircularProgress,
  Container,
  Alert,
  Snackbar,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";
import socketManager from "../socket";
import { motion, AnimatePresence } from "framer-motion";

export default function OwnerChatList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📋 Loading chat list...");
      const res = await api.get("/private-chat/list");
      
      console.log("📋 Chat list loaded:", res.data);
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
      setError("Failed to load conversations. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    let mounted = true;

    const initializeChat = async (fbUser) => {
      if (!fbUser) {
        navigate("/login");
        return;
      }

      try {
        await loadChats();

        const socket = socketManager.connect(fbUser.uid);

        socketManager.on("connect", () => {
          console.log("🟢 Socket connected in chat list");
          setConnected(true);
        });

        socketManager.on("disconnect", () => {
          console.log("🔴 Socket disconnected in chat list");
          setConnected(false);
        });

        socketManager.on("receive_private_message", (message) => {
          console.log("📩 New message received in chat list:", message);
          if (mounted) {
            loadChats();
          }
        });

        socketManager.on("message_sent_confirmation", (message) => {
          console.log("✅ Message sent confirmation:", message);
          if (mounted) {
            loadChats();
          }
        });

        socketManager.on("chat_list_update", () => {
          console.log("📋 Chat list update received");
          if (mounted) {
            loadChats();
          }
        });

        socketManager.on("user_online", ({ userId }) => {
          console.log("🟢 User online:", userId);
          if (mounted) {
            setOnlineStatus(prev => ({ ...prev, [userId]: true }));
          }
        });

        socketManager.on("user_offline", ({ userId }) => {
          console.log("🔴 User offline:", userId);
          if (mounted) {
            setOnlineStatus(prev => ({ ...prev, [userId]: false }));
          }
        });

      } catch (err) {
        console.error("Failed to initialize chat:", err);
        setError("Failed to connect to chat service. Please refresh the page.");
      }
    };

    unsubscribe = onAuthStateChanged(auth, initializeChat);

    return () => {
      mounted = false;
      unsubscribe();
      
      socketManager.off("connect");
      socketManager.off("disconnect");
      socketManager.off("receive_private_message");
      socketManager.off("message_sent_confirmation");
      socketManager.off("chat_list_update");
      socketManager.off("user_online");
      socketManager.off("user_offline");
    };
  }, [navigate, loadChats]);

  const isUserOnline = (user) => {
    return onlineStatus[user.firebase_uid] || false;
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleRetry = () => {
    loadChats();
    if (auth.currentUser) {
      socketManager.connect(auth.currentUser.uid);
    }
  };

  if (loading) {
    return (
      <Box sx={loaderContainer}>
        <CircularProgress sx={{ color: "#00d2ff" }} />
        <Typography sx={{ color: "#fff", mt: 2 }}>
          Loading conversations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={mainContainer}>
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography sx={headerTitle}>Messages</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: connected ? "#44b700" : "#ff4d4f",
                  mr: 1,
                }}
              />
              <Typography sx={{ color: "#fff", fontSize: "0.8rem" }}>
                {connected ? "Connected" : "Disconnected"}
              </Typography>
            </Box>
          </Box>
          
          <Typography sx={subTitle}>
            {users.length} {users.length === 1 ? "Conversation" : "Conversations"}
          </Typography>
        </motion.div>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2, mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 4 }}>
          <AnimatePresence>
            {users.length > 0 ? (
              users.map((u, index) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Box
                    sx={chatCard}
                    onClick={() => navigate(`/chat/private/${u.id}`)}
                  >
                    <Badge
                      overlap="circular"
                      variant="dot"
                      sx={isUserOnline(u) ? onlineBadge : offlineBadge}
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
                        {u.last_message || "No messages yet"}
                      </Typography>
                    </Box>

                    {u.unread_count > 0 && (
                      <Box sx={unreadBadge}>{u.unread_count}</Box>
                    )}
                  </Box>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Box sx={emptyState}>
                  <Typography sx={emptyStateText}>
                    No conversations yet.
                  </Typography>
                  <Typography sx={emptyStateSubText}>
                    When tenants message you, they'll appear here.
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Container>

      <Snackbar
        open={!connected && !loading}
        autoHideDuration={6000}
        onClose={() => {}}
        message="Connecting to chat server..."
      />
    </Box>
  );
}

/* ================= STYLES ================= */

const mainContainer = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  pt: 6,
  pb: 10,
};

const loaderContainer = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
};

const headerTitle = {
  fontSize: "2.2rem",
  fontWeight: 800,
  color: "#fff",
  textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
};

const subTitle = {
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.8)",
};

const chatCard = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  p: "18px",
  mb: 2,
  borderRadius: "20px",
  cursor: "pointer",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(255,255,255,0.15)",
    transform: "translateX(5px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
};

const avatarStyle = {
  width: 55,
  height: 55,
  fontSize: "1.2rem",
  fontWeight: 700,
  background: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
  border: "2px solid #fff",
};

const nameText = {
  fontSize: "1.05rem",
  fontWeight: 700,
  color: "#fff",
};

const msgText = {
  fontSize: "0.85rem",
  color: "rgba(255,255,255,0.9)",
  maxWidth: "200px",
};

const timeText = {
  fontSize: "0.7rem",
  color: "rgba(255,255,255,0.6)",
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
  ml: 1,
  boxShadow: "0 2px 5px rgba(255,77,79,0.3)",
};

const emptyState = {
  textAlign: "center",
  mt: 10,
  p: 4,
  background: "rgba(255,255,255,0.1)",
  borderRadius: "20px",
  backdropFilter: "blur(10px)",
};

const emptyStateText = {
  color: "#fff",
  fontSize: "1.2rem",
  fontWeight: 600,
  mb: 1,
};

const emptyStateSubText = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "0.9rem",
};

const onlineBadge = {
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: "0 0 0 2px #fff",
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
};

const offlineBadge = {
  "& .MuiBadge-badge": {
    backgroundColor: "#999",
    color: "#999",
  },
};