import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  ChevronLeft, 
  MoreVertical, 
  Trash2, 
  Check, 
  CheckCheck, 
  Image as ImageIcon, 
  Paperclip,
  Smile,
  ShieldCheck,
  Clock
} from "lucide-react";
import { format, isSameDay } from "date-fns";

// Initialize Socket outside or in a provider to prevent multiple connections
const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
  reconnectionAttempts: 5,
});

/**
 * Modern Private Chat Component
 * Features:
 * - Real-time status updates (Online/Offline/Typing)
 * - Message read/delivery receipts with visual icons
 * - Grouped messages by date
 * - Smooth framer-motion animations
 * - Responsive glassmorphism design
 * - Optimized message rendering
 */

/* ================= SUB-COMPONENTS ================= */

const MessageStatus = ({ status }) => {
  switch (status) {
    case "sent":
      return <Check size={14} className="text-gray-400" />;
    case "delivered":
      return <CheckCheck size={14} className="text-gray-400" />;
    case "read":
      return <CheckCheck size={14} className="text-blue-400" />;
    default:
      return <Clock size={12} className="text-gray-300" />;
  }
};

const DateSeparator = ({ date }) => (
  <div style={styles.dateSeparator}>
    <span>{format(new Date(date), "MMMM dd, yyyy")}</span>
  </div>
);

/* ================= MAIN COMPONENT ================= */

export default function PrivateChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // State Management
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(null); // Track which message ID shows delete

  // Auto-scroll logic
  const scrollBottom = useCallback((behavior = "smooth") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    }
  }, []);

  /* ================= AUTH & INITIALIZATION ================= */
  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        return navigate("/login");
      }

      try {
        const token = await fbUser.getIdToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [meRes, userRes, msgRes] = await Promise.all([
          api.get("/private-chat/me", config),
          api.get(`/private-chat/user/${userId}`, config),
          api.get(`/private-chat/messages/${userId}`, config),
        ]);

        if (isMounted) {
          setMe(meRes.data);
          setOtherUser(userRes.data);
          setMessages(msgRes.data);
          setLoading(false);

          if (!socket.connected) socket.connect();
          socket.emit("register", fbUser.uid);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load conversation. Please try again.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsub?.();
    };
  }, [userId, navigate]);

  /* ================= ROOM LOGIC ================= */
  useEffect(() => {
    if (me && userId) {
      socket.emit("join_private_room", {
        userA: me.id,
        userB: Number(userId),
      });
    }
  }, [me, userId]);

  /* ================= MESSAGE READ LOGIC ================= */
  useEffect(() => {
    if (!me || messages.length === 0) return;

    const hasUnread = messages.some(
      (m) => m.sender_id !== me.id && !m.is_read
    );

    if (hasUnread) {
      socket.emit("mark_messages_read", {
        userA: me.id,
        userB: Number(userId),
      });
    }
  }, [messages, me, userId]);

  /* ================= SOCKET EVENT LISTENERS ================= */
  useEffect(() => {
    const handleReceive = (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollBottom();
    };

    const handleDelivered = (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m))
      );
    };

    const handleRead = () => {
      setMessages((prev) =>
        prev.map((m) => (m.sender_id === me?.id ? { ...m, status: "read" } : m))
      );
    };

    const handleDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleTyping = ({ isTyping: typingStatus, senderId }) => {
      if (Number(senderId) === Number(userId)) {
        setRemoteTyping(typingStatus);
      }
    };

    socket.on("receive_private_message", handleReceive);
    socket.on("message_sent_confirmation", handleDelivered);
    socket.on("messages_read", handleRead);
    socket.on("message_deleted", handleDeleted);
    socket.on("user_online", ({ userId: id }) => Number(id) === Number(userId) && setIsOnline(true));
    socket.on("user_offline", ({ userId: id }) => Number(id) === Number(userId) && setIsOnline(false));
    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("receive_private_message", handleReceive);
      socket.off("message_sent_confirmation", handleDelivered);
      socket.off("messages_read", handleRead);
      socket.off("message_deleted", handleDeleted);
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("user_typing");
    };
  }, [me, userId, scrollBottom]);

  /* ================= ACTIONS ================= */

  const handleTypingIndicator = (e) => {
    setText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: userId, isTyping: true });
    }

    // Debounce typing stop
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { receiverId: userId, isTyping: false });
    }, 2000);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    const messageContent = text;
    setText(""); // Optimistic clear
    
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.post(
        "/private-chat/send",
        { receiver_id: Number(userId), message: messageContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send_private_message", res.data);
      setMessages((prev) => [...prev, { ...res.data, status: "sent" }]);
      scrollBottom();
    } catch (err) {
      console.error("Send failed", err);
      // Revert text on failure
      setText(messageContent);
    }
  };

  const deleteMessage = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await api.delete(`/private-chat/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) => prev.filter((m) => m.id !== id));
      socket.emit("delete_private_message", {
        messageId: id,
        sender_id: me.id,
        receiver_id: Number(userId),
      });
      setShowOptions(null);
    } catch (err) {
      alert("Failed to delete message");
    }
  };

  /* ================= HELPERS ================= */

  const groupedMessages = useMemo(() => {
    const groups = [];
    messages.forEach((msg, idx) => {
      const prevMsg = messages[idx - 1];
      const showDate = !prevMsg || !isSameDay(new Date(msg.created_at), new Date(prevMsg.created_at));
      
      if (showDate) groups.push({ type: "date", date: msg.created_at });
      groups.push({ type: "message", ...msg });
    });
    return groups;
  }, [messages]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={styles.spinner} 
        />
        <p>Securing connection...</p>
      </div>
    );
  }

  const headerTitle = me?.role === "owner" 
    ? otherUser?.name || "Guest User" 
    : otherUser?.pg_name || otherUser?.name || "Property Manager";

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate(-1)} style={styles.iconBtn}>
            <ChevronLeft size={24} />
          </button>
          <div style={styles.avatar}>
            {headerTitle.charAt(0).toUpperCase()}
            {isOnline && <div style={styles.onlineBadge} />}
          </div>
          <div style={styles.headerInfo}>
            <h3 style={styles.headerName}>{headerTitle}</h3>
            <span style={styles.headerStatus}>
              {isOnline ? "Active now" : "Offline"}
            </span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn}><ShieldCheck size={20} /></button>
          <button style={styles.iconBtn}><MoreVertical size={20} /></button>
        </div>
      </header>

      {/* CHAT BODY */}
      <div style={styles.chatBody}>
        <div style={styles.safetyNotice}>
          🔒 Messages are encrypted. Keep your payments within NepXall for safety.
        </div>

        {groupedMessages.map((item, index) => {
          if (item.type === "date") {
            return <DateSeparator key={`date-${index}`} date={item.date} />;
          }

          const isMe = item.sender_id === me?.id;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={item.id}
              style={{
                ...styles.msgRow,
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              <div 
                style={styles.bubbleContainer}
                onMouseEnter={() => setShowOptions(item.id)}
                onMouseLeave={() => setShowOptions(null)}
              >
                {!isMe && <div style={styles.smallAvatar}>{headerTitle.charAt(0)}</div>}
                
                <div style={{
                  ...styles.bubble,
                  background: isMe ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "#ffffff",
                  color: isMe ? "#ffffff" : "#1e293b",
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  boxShadow: isMe ? "0 4px 15px rgba(99, 102, 241, 0.2)" : "0 2px 8px rgba(0,0,0,0.05)",
                }}>
                  <p style={styles.msgText}>{item.message}</p>
                  
                  <div style={styles.msgMeta}>
                    <span style={{...styles.msgTime, color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8"}}>
                      {format(new Date(item.created_at), "HH:mm")}
                    </span>
                    {isMe && <MessageStatus status={item.status} />}
                  </div>
                </div>

                {/* Context Actions */}
                <AnimatePresence>
                  {showOptions === item.id && isMe && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => deleteMessage(item.id)}
                      style={styles.deleteAction}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}

        {remoteTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.typingIndicator}>
            <div className="dot-pulse" />
            <span>{headerTitle} is typing...</span>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div style={styles.footer}>
        <div style={styles.inputWrapper}>
          <button style={styles.footerIconBtn}><Smile size={22} /></button>
          <input
            ref={inputRef}
            value={text}
            onChange={handleTypingIndicator}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Write a message..."
            style={styles.input}
          />
          <button style={styles.footerIconBtn}><Paperclip size={22} /></button>
          <button 
            onClick={sendMessage} 
            disabled={!text.trim()}
            style={{
              ...styles.sendBtn,
              opacity: text.trim() ? 1 : 0.6,
              transform: text.trim() ? "scale(1)" : "scale(0.9)",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= THEME & STYLES ================= */

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
  },

  header: {
    height: "70px",
    background: "#ffffff",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e2e8f0",
    zIndex: 10,
  },

  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
    position: "relative",
  },

  onlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#22c55e",
    border: "2px solid #fff",
  },

  headerInfo: { display: "flex", flexDirection: "column" },
  headerName: { margin: 0, fontSize: "16px", color: "#1e293b", fontWeight: 600 },
  headerStatus: { fontSize: "12px", color: "#64748b" },

  iconBtn: {
    background: "none",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    transition: "background 0.2s",
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  safetyNotice: {
    textAlign: "center",
    fontSize: "12px",
    color: "#94a3b8",
    background: "#f1f5f9",
    padding: "8px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  dateSeparator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px 0",
    fontSize: "12px",
    color: "#94a3b8",
    position: "relative",
  },

  msgRow: { display: "flex", width: "100%", marginBottom: "2px" },

  bubbleContainer: {
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    maxWidth: "80%",
  },

  smallAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#e2e8f0",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "4px",
  },

  bubble: {
    padding: "12px 16px",
    borderRadius: "16px",
    position: "relative",
  },

  msgText: { margin: 0, fontSize: "15px", lineHeight: "1.5" },

  msgMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    marginTop: "4px",
  },

  msgTime: { fontSize: "10px" },

  deleteAction: {
    position: "absolute",
    right: "-35px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "#fff",
    border: "1px solid #fee2e2",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },

  footer: {
    padding: "15px 20px 25px 20px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#f1f5f9",
    borderRadius: "24px",
    padding: "6px 12px",
    gap: "8px",
  },

  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "10px",
    fontSize: "15px",
    outline: "none",
    color: "#1e293b",
  },

  footerIconBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },

  sendBtn: {
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    color: "#fff",
    border: "none",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 10px rgba(99, 102, 241, 0.3)",
  },

  typingIndicator: {
    fontSize: "12px",
    color: "#64748b",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  loadingContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
    color: "#64748b",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
  },
};