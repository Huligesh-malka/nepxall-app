import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
});

export default function PrivateChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  /* ================= AUTH LOAD ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return navigate("/login");

      const token = await fbUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [meRes, userRes, msgRes] = await Promise.all([
        api.get("/private-chat/me", config),
        api.get(`/private-chat/user/${userId}`, config),
        api.get(`/private-chat/messages/${userId}`, config),
      ]);

      setMe(meRes.data);
      setOtherUser(userRes.data);
      setMessages(msgRes.data);
      setFilteredMessages(msgRes.data);
      setLoading(false);

      if (!socket.connected) socket.connect();
      socket.emit("register", fbUser.uid);
    });

    return () => unsub?.();
  }, [userId, navigate]);

  /* ================= JOIN ROOM ================= */
  useEffect(() => {
    if (!me) return;
    socket.emit("join_private_room", {
      userA: me.id,
      userB: Number(userId),
    });
  }, [me, userId]);

  /* ================= AUTO MARK READ ================= */
  useEffect(() => {
    if (!me) return;

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

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {
    const receiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setFilteredMessages((prev) => [...prev, msg]);
      scrollBottom();
    };

    const delivered = (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m))
      );
      setFilteredMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m))
      );
    };

    const read = () => {
      setMessages((prev) =>
        prev.map((m) => (m.sender_id === me.id ? { ...m, status: "read" } : m))
      );
      setFilteredMessages((prev) =>
        prev.map((m) => (m.sender_id === me.id ? { ...m, status: "read" } : m))
      );
    };

    const deleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setFilteredMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socket.on("receive_private_message", receiveMessage);
    socket.on("message_sent_confirmation", delivered);
    socket.on("messages_read", read);
   socket.on("message_deleted", deleted);  // ✅ Properly formatted

    socket.on("user_online", () => setOnline(true));
    socket.on("user_offline", () => setOnline(false));
    socket.on("user_typing", ({ isTyping }) => setTyping(isTyping));

    return () => {
      socket.off("receive_private_message", receiveMessage);
      socket.off("message_sent_confirmation", delivered);
      socket.off("messages_read", read);
      socket.off("message_deleted", deleted);
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("user_typing");
    };
  }, [me]);

  /* ================= TYPING INDICATOR ================= */
  const handleTyping = () => {
    if (!me) return;

    socket.emit("typing", {
      userA: me.id,
      userB: Number(userId),
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        userA: me.id,
        userB: Number(userId),
        isTyping: false,
      });
    }, 1000);
  };

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    const token = await auth.currentUser.getIdToken();

    try {
      const res = await api.post(
        "/private-chat/send",
        { receiver_id: Number(userId), message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send_private_message", res.data);
      setMessages((prev) => [...prev, { ...res.data, status: "sent" }]);
      setFilteredMessages((prev) => [...prev, { ...res.data, status: "sent" }]);
      setText("");
      scrollBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteMessage = async (id) => {
    const token = await auth.currentUser.getIdToken();

    try {
      await api.delete(`/private-chat/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) => prev.filter((m) => m.id !== id));
      setFilteredMessages((prev) => prev.filter((m) => m.id !== id));

      socket.emit("delete_private_message", {
        messageId: id,
        sender_id: me.id,
        receiver_id: Number(userId),
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter((msg) =>
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchTerm, messages]);

  /* ================= EMOJI PICKER ================= */
  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setEmojiPicker(false);
    inputRef.current?.focus();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <span style={styles.statusIcon}>✓</span>;
      case "delivered":
        return <span style={styles.statusIcon}>✓✓</span>;
      case "read":
        return <span style={{ ...styles.statusIcon, color: "#4CAF50" }}>✓✓</span>;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading)
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}>
          <div style={styles.loaderSpinner}></div>
          <p style={styles.loaderText}>Loading conversation...</p>
        </div>
      </div>
    );

  const headerTitle =
    me?.role === "owner"
      ? otherUser?.name || "User"
      : otherUser?.pg_name || otherUser?.name || "PG";

  return (
    <div style={styles.container}>
      {/* Glassmorphism Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {otherUser?.name?.charAt(0) || "U"}
              <span style={{ ...styles.onlineDot, backgroundColor: online ? "#4CAF50" : "#9e9e9e" }} />
            </div>
            <div style={styles.userDetails}>
              <div style={styles.userName}>{headerTitle}</div>
              <div style={styles.userStatus}>
                {online ? "Online" : "Offline"}
                {typing && <span style={styles.typingIndicator}> • typing...</span>}
              </div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <button onClick={() => setShowSearch(!showSearch)} style={styles.iconButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>
            <button style={styles.iconButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        </div>

        {showSearch && (
          <div style={styles.searchBar}>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
            <button onClick={() => setShowSearch(false)} style={styles.searchClose}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div style={styles.chatBody}>
        {filteredMessages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>💬</div>
            <h3 style={styles.emptyStateTitle}>No messages yet</h3>
            <p style={styles.emptyStateText}>Send a message to start the conversation</p>
          </div>
        ) : (
          filteredMessages.map((m, index) => {
            const isMe = m.sender_id === me?.id;
            const showDate = index === 0 || 
              new Date(m.created_at).toDateString() !== new Date(filteredMessages[index - 1]?.created_at).toDateString();

            return (
              <React.Fragment key={m.id}>
                {showDate && (
                  <div style={styles.dateDivider}>
                    <span style={styles.dateText}>
                      {new Date(m.created_at).toLocaleDateString([], { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                <div style={{ ...styles.msgRow, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  {!isMe && (
                    <div style={styles.otherAvatar}>
                      {otherUser?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div style={isMe ? styles.myMessageWrapper : styles.otherMessageWrapper}>
                    <div
                      style={{
                        ...styles.bubble,
                        background: isMe
                          ? "linear-gradient(135deg, #667eea, #764ba2)"
                          : "rgba(255, 255, 255, 0.95)",
                        color: isMe ? "#fff" : "#333",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <div style={styles.messageText}>{m.message}</div>
                      <div style={styles.messageMeta}>
                        <span style={styles.messageTime}>{formatTime(m.created_at)}</span>
                        {isMe && (
                          <span style={styles.messageStatus}>
                            {getStatusIcon(m.status)}
                          </span>
                        )}
                      </div>
                    </div>
                    {isMe && (
                      <button onClick={() => deleteMessage(m.id)} style={styles.deleteBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          <path d="M10 11v5M14 11v5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        {typing && !searchTerm && (
          <div style={styles.typingBubble}>
            <div style={styles.typingDots}>
              <span style={styles.dot1}>.</span>
              <span style={styles.dot2}>.</span>
              <span style={styles.dot3}>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <button onClick={() => setEmojiPicker(!emojiPicker)} style={styles.emojiButton}>
          😊
        </button>
        
        {emojiPicker && (
          <div style={styles.emojiPicker}>
            {["😊", "😂", "❤️", "👍", "🎉", "🔥", "✨", "💯", "🙏", "😢"].map((emoji) => (
              <button key={emoji} onClick={() => addEmoji(emoji)} style={styles.emojiItem}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          style={styles.input}
          disabled={sending}
        />

        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          style={{
            ...styles.sendBtn,
            opacity: !text.trim() || sending ? 0.5 : 1,
            cursor: !text.trim() || sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? (
            <div style={styles.sendingSpinner} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ================= MODERN STYLES ================= */
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  header: {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "12px 16px",
  },

  headerContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    transition: "all 0.3s ease",
    ":hover": {
      background: "rgba(255, 255, 255, 0.3)",
      transform: "scale(1.1)",
    },
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    marginLeft: "12px",
  },

  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ff6b6b, #feca57)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "20px",
    fontWeight: "bold",
    position: "relative",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  },

  onlineDot: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "2px solid #fff",
  },

  userDetails: {
    display: "flex",
    flexDirection: "column",
  },

  userName: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "4px",
  },

  userStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
  },

  typingIndicator: {
    color: "#4CAF50",
    fontStyle: "italic",
    marginLeft: "4px",
  },

  headerActions: {
    display: "flex",
    gap: "8px",
  },

  iconButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    transition: "all 0.3s ease",
    ":hover": {
      background: "rgba(255, 255, 255, 0.3)",
    },
  },

  searchBar: {
    marginTop: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  searchInput: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "25px",
    border: "none",
    background: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    "::placeholder": {
      color: "rgba(255, 255, 255, 0.6)",
    },
  },

  searchClose: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    fontSize: "16px",
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#fff",
  },

  emptyStateIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.8,
  },

  emptyStateTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
  },

  emptyStateText: {
    fontSize: "14px",
    opacity: 0.8,
  },

  dateDivider: {
    textAlign: "center",
    margin: "16px 0",
    position: "relative",
  },

  dateText: {
    background: "rgba(255, 255, 255, 0.2)",
    padding: "6px 12px",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "500",
    backdropFilter: "blur(5px)",
  },

  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  },

  otherAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #48c6ef, #6f86d6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "bold",
    flexShrink: 0,
  },

  myMessageWrapper: {
    maxWidth: "70%",
    position: "relative",
  },

  otherMessageWrapper: {
    maxWidth: "70%",
    position: "relative",
  },

  bubble: {
    padding: "12px 16px",
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
    animation: "slideIn 0.3s ease",
    wordWrap: "break-word",
  },

  messageText: {
    fontSize: "15px",
    lineHeight: "1.4",
    marginBottom: "4px",
  },

  messageMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    fontSize: "11px",
    opacity: 0.7,
  },

  messageTime: {
    color: "inherit",
  },

  messageStatus: {
    display: "inline-flex",
    alignItems: "center",
  },

  statusIcon: {
    fontSize: "14px",
    marginLeft: "4px",
  },

  deleteBtn: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    background: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ff4757",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    transition: "all 0.3s ease",
    opacity: 0,
    ":hover": {
      transform: "scale(1.1)",
      background: "#ff4757",
      color: "#fff",
    },
  },

  myMessageWrapper: {
    maxWidth: "70%",
    position: "relative",
    ":hover button": {
      opacity: 1,
    },
  },

  typingBubble: {
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
    width: "fit-content",
    marginTop: "8px",
  },

  typingDots: {
    display: "flex",
    gap: "4px",
    fontSize: "24px",
    color: "#fff",
    lineHeight: "12px",
  },

  dot1: {
    animation: "bounce 1.4s infinite",
    animationDelay: "0s",
  },

  dot2: {
    animation: "bounce 1.4s infinite",
    animationDelay: "0.2s",
  },

  dot3: {
    animation: "bounce 1.4s infinite",
    animationDelay: "0.4s",
  },

  inputArea: {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
    position: "relative",
  },

  emojiButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "#fff",
    ":hover": {
      background: "rgba(255, 255, 255, 0.3)",
      transform: "scale(1.1)",
    },
  },

  emojiPicker: {
    position: "absolute",
    bottom: "80px",
    left: "16px",
    background: "#fff",
    borderRadius: "25px",
    padding: "12px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    animation: "slideUp 0.3s ease",
    zIndex: 10,
  },

  emojiItem: {
    background: "none",
    border: "none",
    fontSize: "24px",
    padding: "8px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":hover": {
      background: "#f0f0f0",
      transform: "scale(1.2)",
    },
  },

  input: {
    flex: 1,
    padding: "14px 20px",
    borderRadius: "30px",
    border: "none",
    background: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
    "::placeholder": {
      color: "rgba(255, 255, 255, 0.6)",
    },
    ":focus": {
      background: "rgba(255, 255, 255, 0.25)",
      boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.3)",
    },
  },

  sendBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    border: "none",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
    transition: "all 0.3s ease",
    ":hover": {
      transform: "scale(1.1)",
      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
    },
  },

  sendingSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #fff",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loaderContainer: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },

  loader: {
    textAlign: "center",
    color: "#fff",
  },

  loaderSpinner: {
    width: "50px",
    height: "50px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },

  loaderText: {
    fontSize: "16px",
    opacity: 0.9,
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .my-message-wrapper:hover .delete-btn {
    opacity: 1;
  }
`;
document.head.appendChild(styleSheet);