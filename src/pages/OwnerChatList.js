import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Badge,
  CircularProgress,
  Container,
  IconButton,
  Tooltip,
  Zoom,
  Paper,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chat as ChatIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  DoneAll as ReadIcon,
  Done as DeliveredIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

export default function OwnerChatList() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread, online

  const navigate = useNavigate();
  const socketRef = useRef(null);
  const searchInputRef = useRef(null);

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
        socketRef.current = io(SOCKET_URL, { 
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

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

      socket.on("typing_indicator", ({ userId, isTyping }) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.firebase_uid === userId ? { ...u, isTyping } : u
          )
        );
      });
    });

    return () => unsubscribe();
  }, [loadChats, navigate]);

  /* ================= FILTER & SEARCH ================= */

  const filteredUsers = users.filter((user) => {
    const title = me?.role === "owner" ? user.name : user.pg_name || user.name;
    
    // Search filter
    const matchesSearch = title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filters
    if (filter === "unread") return matchesSearch && user.unread > 0;
    if (filter === "online") return matchesSearch && user.online;
    
    return matchesSearch;
  });

  /* ================= TIME FORMAT ================= */

  const formatTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  /* ================= MESSAGE STATUS ICON ================= */

  const getMessageStatusIcon = (status) => {
    switch(status) {
      case 'read':
        return <ReadIcon sx={{ fontSize: 14, color: "#4caf50" }} />;
      case 'delivered':
        return <DeliveredIcon sx={{ fontSize: 14, color: "#00d2ff" }} />;
      default:
        return <ScheduleIcon sx={{ fontSize: 14, color: "#999" }} />;
    }
  };

  /* ================= LOADER ================= */

  if (loading) {
    return (
      <Box sx={loaderContainer}>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChatIcon sx={{ fontSize: 60, color: "#00d2ff", mb: 2 }} />
        </motion.div>
        <CircularProgress sx={{ color: "#00d2ff" }} />
        <Typography sx={{ color: "#fff", mt: 2, fontSize: "0.9rem", opacity: 0.7 }}>
          Loading conversations...
        </Typography>
      </Box>
    );
  }

  /* ================= UI ================= */

  return (
    <Box sx={mainContainer}>
      {/* Animated Background Elements */}
      <Box sx={backgroundOverlay} />
      <Box sx={floatingOrb1} />
      <Box sx={floatingOrb2} />
      
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 2 }}>
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={headerSection}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography sx={headerTitle}>Messages</Typography>
                <Typography sx={subTitle}>
                  {users.length} {users.length === 1 ? 'Conversation' : 'Conversations'}
                </Typography>
              </Box>
              
              <Tooltip title={connected ? "Connected" : "Disconnected"} TransitionComponent={Zoom}>
                <Box sx={connectionStatus}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: connected ? "#4caf50" : "#ff4d4f",
                    animation: connected ? "pulse 2s infinite" : "none",
                    mr: 1
                  }} />
                  <Typography sx={{ fontSize: 12, color: "#fff", opacity: 0.8 }}>
                    {connected ? "Live" : "Offline"}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            {/* Search Bar */}
            <Paper elevation={0} sx={searchBar}>
              <SearchIcon sx={{ color: "rgba(255,255,255,0.5)", mr: 1 }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInput}
              />
            </Paper>

            {/* Filter Chips */}
            <Box sx={filterChips}>
              <Chip
                label="All"
                onClick={() => setFilter("all")}
                sx={filterChip(filter === "all")}
              />
              <Chip
                label="Unread"
                onClick={() => setFilter("unread")}
                sx={filterChip(filter === "unread")}
              />
              <Chip
                label="Online"
                onClick={() => setFilter("online")}
                sx={filterChip(filter === "online")}
              />
            </Box>
          </Box>
        </motion.div>

        {/* Chat List */}
        <Box sx={{ mt: 2, pb: 4 }}>
          <AnimatePresence mode="wait">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u, index) => {
                const title = me?.role === "owner" ? u.name : u.pg_name || u.name;
                const isTyping = u.isTyping;

                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Paper elevation={0} sx={chatCard}>
                      <Box sx={chatCardContent} onClick={() => navigate(`/owner/chat/private/${u.id}`)}>
                        {/* Avatar with Status */}
                        <Badge
                          overlap="circular"
                          variant="dot"
                          sx={u.online ? onlineBadge : offlineBadge}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar sx={avatarStyle}>
                            {title?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>

                        <Box sx={{ flex: 1, ml: 2 }}>
                          {/* Name and Time */}
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography sx={nameText}>
                              {title}
                              {u.online && (
                                <Box component="span" sx={onlineIndicator}>
                                  • Online
                                </Box>
                              )}
                            </Typography>
                            <Typography sx={timeText}>
                              {formatTime(u.last_time)}
                            </Typography>
                          </Box>

                          {/* Last Message with Status */}
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography sx={isTyping ? typingText : msgText} noWrap>
                              {isTyping ? (
                                <motion.span
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  typing...
                                </motion.span>
                              ) : (
                                <>
                                  {u.last_sender === "me" && (
                                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", mr: 0.5 }}>
                                      {getMessageStatusIcon(u.last_status)}
                                    </Box>
                                  )}
                                  {u.last_message || "No messages yet"}
                                </>
                              )}
                            </Typography>

                            {/* Unread Badge */}
                            {u.unread > 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <Box sx={unreadBadge}>
                                  {u.unread > 99 ? "99+" : u.unread}
                                </Box>
                              </motion.div>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Quick Actions */}
                      <Tooltip title="More options" TransitionComponent={Zoom}>
                        <IconButton 
                          size="small" 
                          sx={moreButton}
                          onClick={() => {/* Add menu functionality */}}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Paper elevation={0} sx={emptyState}>
                  <ChatIcon sx={{ fontSize: 60, color: "rgba(255,255,255,0.2)", mb: 2 }} />
                  <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                    {searchTerm ? "No results found" : "No conversations yet"}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                    {searchTerm ? "Try a different search term" : "Start chatting with property owners or tenants"}
                  </Typography>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Container>

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </Box>
  );
}

/* ================= STYLES ================= */

const mainContainer = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  pt: 4,
};

const backgroundOverlay = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
  zIndex: 1,
};

const floatingOrb1 = {
  position: "absolute",
  top: "10%",
  right: "5%",
  width: "300px",
  height: "300px",
  background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
  borderRadius: "50%",
  animation: "float 20s infinite ease-in-out",
  zIndex: 1,
};

const floatingOrb2 = {
  position: "absolute",
  bottom: "10%",
  left: "5%",
  width: "250px",
  height: "250px",
  background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
  borderRadius: "50%",
  animation: "float 15s infinite ease-in-out reverse",
  zIndex: 1,
};

const loaderContainer = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  position: "relative",
};

const headerSection = {
  position: "relative",
  zIndex: 3,
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "30px 30px 30px 30px",
  padding: "20px 24px",
  mb: 3,
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const headerTitle = {
  fontSize: "2rem",
  fontWeight: 800,
  color: "#fff",
  letterSpacing: "-0.5px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
};

const subTitle = {
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.7)",
  mt: 0.5,
};

const connectionStatus = {
  display: "flex",
  alignItems: "center",
  background: "rgba(0,0,0,0.2)",
  padding: "4px 12px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.1)",
};

const searchBar = {
  display: "flex",
  alignItems: "center",
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(10px)",
  borderRadius: "15px",
  padding: "8px 16px",
  mt: 3,
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "all 0.3s ease",
  "&:focus-within": {
    background: "rgba(255,255,255,0.2)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
};

const searchInput = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#fff",
  fontSize: "1rem",
  "::placeholder": {
    color: "rgba(255,255,255,0.5)",
  },
};

const filterChips = {
  display: "flex",
  gap: 1,
  mt: 2,
};

const filterChip = (active) => ({
  background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
  color: "#fff",
  border: active ? "1px solid #fff" : "1px solid rgba(255,255,255,0.2)",
  borderRadius: "20px",
  backdropFilter: "blur(10px)",
  cursor: "pointer",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(255,255,255,0.3)",
  },
});

const chatCard = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  p: "12px 16px",
  mb: 2,
  borderRadius: "20px",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "all 0.3s ease",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
  "&:hover::before": {
    opacity: 1,
  },
};

const chatCardContent = {
  display: "flex",
  alignItems: "center",
  flex: 1,
  position: "relative",
  zIndex: 2,
};

const avatarStyle = {
  width: 60,
  height: 60,
  fontSize: "1.5rem",
  fontWeight: 700,
  background: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
  border: "3px solid rgba(255,255,255,0.3)",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
};

const nameText = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#fff",
  letterSpacing: "-0.3px",
};

const onlineIndicator = {
  fontSize: "0.7rem",
  color: "#4caf50",
  ml: 1,
  fontWeight: 400,
};

const msgText = {
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.7)",
  maxWidth: "200px",
};

const typingText = {
  fontSize: "0.9rem",
  color: "#00d2ff",
  fontStyle: "italic",
  maxWidth: "200px",
};

const timeText = {
  fontSize: "0.7rem",
  color: "rgba(255,255,255,0.5)",
  fontWeight: 500,
};

const unreadBadge = {
  background: "linear-gradient(135deg, #ff4d4f 0%, #f9a826 100%)",
  minWidth: "24px",
  height: "24px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.7rem",
  fontWeight: 800,
  color: "#fff",
  boxShadow: "0 4px 10px rgba(255,77,79,0.3)",
  ml: 2,
};

const onlineBadge = {
  "& .MuiBadge-badge": { 
    backgroundColor: "#44b700",
    boxShadow: "0 0 0 2px rgba(255,255,255,0.2)",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
  },
};

const offlineBadge = {
  "& .MuiBadge-badge": { 
    backgroundColor: "#999",
    boxShadow: "0 0 0 2px rgba(255,255,255,0.2)",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
  },
};

const moreButton = {
  color: "rgba(255,255,255,0.5)",
  zIndex: 3,
  "&:hover": {
    color: "#fff",
    background: "rgba(255,255,255,0.1)",
  },
};

const emptyState = {
  textAlign: "center",
  color: "#fff",
  mt: 4,
  p: 6,
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(10px)",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.1)",
};

// Add keyframes for floating animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
`;
document.head.appendChild(style);