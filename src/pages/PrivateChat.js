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
  const inputRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  /* ================= AUTH LOAD ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return navigate("/login");

      const token = await fbUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [meRes, userRes, msgRes] = await Promise.all([
          api.get("/private-chat/me", config),
          api.get(`/private-chat/user/${userId}`, config),
          api.get(`/private-chat/messages/${userId}`, config),
        ]);

        setMe(meRes.data);
        setOtherUser(userRes.data);
        setMessages(msgRes.data);
        setLoading(false);

        if (!socket.connected) socket.connect();
        socket.emit("register", fbUser.uid);
      } catch (error) {
        console.error("Error loading chat:", error);
        navigate(-1);
      }
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
      scrollBottom();
    };

    const delivered = (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m))
      );
    };

    const read = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id === me?.id ? { ...m, status: "read" } : m
        )
      );
    };

    const deleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socket.on("receive_private_message", receiveMessage);
    socket.on("message_sent_confirmation", delivered);
    socket.on("messages_read", read);
    socket.on("message_deleted", deleted);
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

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.post(
        "/private-chat/send",
        { receiver_id: Number(userId), message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send_private_message", res.data);
      setMessages((prev) => [...prev, { ...res.data, status: "sent" }]);
      setText("");
      scrollBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  /* ================= DELETE ================= */
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
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  /* ================= TYPING ================= */
  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit("typing", {
      userA: me?.id,
      userB: Number(userId),
      isTyping: e.target.value.length > 0,
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <span style={styles.statusIcon}>✓</span>;
      case "delivered":
        return <span style={{ ...styles.statusIcon, color: "#FFC107" }}>✓✓</span>;
      case "read":
        return (
          <span style={{ ...styles.statusIcon, color: "#4CAF50" }}>
            <span style={styles.doubleTick}>✓✓</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}>
          <div style={styles.loaderSpinner}></div>
          <p style={styles.loaderText}>Loading chat...</p>
        </div>
      </div>
    );
  }

  const headerTitle =
    me?.role === "owner"
      ? otherUser?.name || "User"
      : otherUser?.pg_name || otherUser?.name || "PG";

  const headerSubtitle = otherUser?.email || otherUser?.phone || "";

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div style={styles.headerAvatar}>
          {otherUser?.name?.charAt(0) || "U"}
        </div>
        
        <div style={styles.headerInfo}>
          <div style={styles.headerName}>{headerTitle}</div>
          <div style={styles.headerSubtitle}>
            {headerSubtitle && <span style={styles.headerEmail}>{headerSubtitle}</span>}
            <span style={styles.headerStatus}>
              <span style={{ ...styles.statusDot, backgroundColor: online ? "#4CAF50" : "#9E9E9E" }} />
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <div style={styles.chatBody}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>💬</div>
            <p style={styles.emptyStateText}>No messages yet</p>
            <p style={styles.emptyStateSubtext}>Say hello to start chatting!</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMe = m.sender_id === me?.id;
            const showDate = index === 0 || 
              new Date(m.created_at).toDateString() !== new Date(messages[index - 1]?.created_at).toDateString();

            return (
              <React.Fragment key={m.id}>
                {showDate && (
                  <div style={styles.dateDivider}>
                    <span style={styles.dateText}>
                      {new Date(m.created_at).toLocaleDateString([], { 
                        weekday: "long", 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric" 
                      })}
                    </span>
                  </div>
                )}
                
                <div style={{ ...styles.messageRow, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  {!isMe && (
                    <div style={styles.otherAvatar}>
                      {otherUser?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  
                  <div style={{ maxWidth: "70%" }}>
                    <div style={styles.messageContainer}>
                      <div style={{ ...styles.messageBubble, ...(isMe ? styles.myMessage : styles.otherMessage) }}>
                        <p style={styles.messageText}>{m.message}</p>
                        <div style={styles.messageFooter}>
                          <span style={styles.messageTime}>{formatTime(m.created_at)}</span>
                          {isMe && getStatusIcon(m.status)}
                        </div>
                      </div>
                      
                      {isMe && (
                        <button
                          onClick={() => deleteMessage(m.id)}
                          style={styles.deleteButton}
                          title="Delete message"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {typing && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingAvatar}>{otherUser?.name?.charAt(0) || "U"}</div>
            <div style={styles.typingDots}>
              <span style={styles.dot}></span>
              <span style={styles.dot}></span>
              <span style={styles.dot}></span>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          style={{ ...styles.sendButton, opacity: text.trim() && !sending ? 1 : 0.5 }}
          disabled={!text.trim() || sending}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // Header Styles
  header: {
    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    color: "#fff",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
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
    transition: "background 0.2s",
    outline: "none",
  },

  headerAvatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
    border: "2px solid rgba(255, 255, 255, 0.5)",
  },

  headerInfo: {
    flex: 1,
  },

  headerName: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
  },

  headerSubtitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "12px",
    opacity: 0.9,
  },

  headerEmail: {
    fontSize: "12px",
  },

  headerStatus: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "4px",
  },

  // Chat Body Styles
  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    background: "#f8fafc",
  },

  emptyState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
  },

  emptyStateIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },

  emptyStateText: {
    fontSize: "16px",
    fontWeight: "500",
    marginBottom: "8px",
  },

  emptyStateSubtext: {
    fontSize: "14px",
  },

  dateDivider: {
    display: "flex",
    justifyContent: "center",
    margin: "20px 0",
  },

  dateText: {
    background: "#e2e8f0",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#64748b",
  },

  messageRow: {
    display: "flex",
    marginBottom: "16px",
    alignItems: "flex-end",
  },

  otherAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
    marginRight: "8px",
    flexShrink: 0,
  },

  messageContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  messageBubble: {
    padding: "12px 16px",
    borderRadius: "20px",
    position: "relative",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  myMessage: {
    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    color: "#fff",
    borderBottomRightRadius: "4px",
  },

  otherMessage: {
    background: "#fff",
    color: "#1e293b",
    borderBottomLeftRadius: "4px",
  },

  messageText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },

  messageFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    marginTop: "4px",
    fontSize: "10px",
  },

  messageTime: {
    opacity: 0.7,
  },

  statusIcon: {
    fontSize: "12px",
    marginLeft: "4px",
  },

  doubleTick: {
    fontSize: "12px",
  },

  deleteButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    color: "#94a3b8",
    transition: "color 0.2s",
    opacity: 0,
    visibility: "hidden",
  },

  // Typing Indicator
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },

  typingAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
  },

  typingDots: {
    background: "#fff",
    padding: "12px 16px",
    borderRadius: "20px",
    display: "flex",
    gap: "4px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#94a3b8",
    animation: "typing 1.4s infinite ease-in-out",
  },

  // Input Area Styles
  inputContainer: {
    background: "#fff",
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.02)",
  },

  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: "30px",
    border: "2px solid #e2e8f0",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },

  sendButton: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    outline: "none",
  },

  // Loader Styles
  loaderContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
  },

  loader: {
    textAlign: "center",
  },

  loaderSpinner: {
    width: "48px",
    height: "48px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#6366F1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },

  loaderText: {
    color: "#64748b",
    fontSize: "14px",
    margin: 0,
  },
};

// Add keyframes animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  button:hover {
    transform: scale(1.05);
  }
  input:focus {
    border-color: #6366F1 !important;
  }
  .message-container:hover .delete-button {
    opacity: 1;
    visibility: visible;
  }
`;
document.head.appendChild(styleSheet);