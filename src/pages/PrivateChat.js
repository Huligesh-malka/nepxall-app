import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const messageRefs = useRef({});
  const longPressTimer = useRef(null);

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

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
        setLoading(false);
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
      m => m.sender_id !== me.id && !m.is_read
    );

    if (hasUnread) {
      socket.emit("mark_messages_read", {
        userA: me.id,
        userB: Number(userId),
      });
    }
  }, [messages, me, userId]);

  /* ================= TYPING INDICATOR ================= */
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { 
        room: `private_${Math.min(me?.id, Number(userId))}_${Math.max(me?.id, Number(userId))}`,
        isTyping: true 
      });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { 
        room: `private_${Math.min(me?.id, Number(userId))}_${Math.max(me?.id, Number(userId))}`,
        isTyping: false 
      });
    }, 1000);
  }, [isTyping, me?.id, userId]);

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {
    const receiveMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollBottom();
    };

    const delivered = (msg) => {
      setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, status: "delivered" } : m)
      );
    };

    const read = () => {
      setMessages(prev =>
        prev.map(m => m.sender_id === me?.id ? { ...m, status: "read" } : m)
      );
    };

    const deleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const reactionUpdate = ({ messageId, reactions }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, reactions } : m)
      );
    };

    socket.on("receive_private_message", receiveMessage);
    socket.on("message_sent_confirmation", delivered);
    socket.on("messages_read", read);
    socket.on("message_deleted", deleted);
    socket.on("message_reaction_updated", reactionUpdate);
    socket.on("user_online", () => setOnline(true));
    socket.on("user_offline", () => setOnline(false));
    socket.on("user_typing", ({ isTyping }) => setTyping(isTyping));

    return () => {
      socket.off("receive_private_message", receiveMessage);
      socket.off("message_sent_confirmation", delivered);
      socket.off("messages_read", read);
      socket.off("message_deleted", deleted);
      socket.off("message_reaction_updated", reactionUpdate);
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("user_typing");
    };
  }, [me]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const token = await auth.currentUser.getIdToken();
    const messageData = {
      receiver_id: Number(userId),
      message: text,
      reply_to: replyingTo?.id || null
    };

    try {
      const res = await api.post("/private-chat/send", messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      socket.emit("send_private_message", res.data);
      setMessages(prev => [...prev, { ...res.data, status: "sent" }]);
      setText("");
      setReplyingTo(null);
      scrollBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  /* ================= DELETE MESSAGE ================= */
  const deleteMessage = async (id) => {
    const token = await auth.currentUser.getIdToken();

    try {
      await api.delete(`/private-chat/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => prev.filter(m => m.id !== id));
      socket.emit("delete_private_message", {
        messageId: id,
        sender_id: me.id,
        receiver_id: Number(userId),
      });
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  /* ================= ADD REACTION ================= */
  const addReaction = async (messageId, emoji) => {
    const token = await auth.currentUser.getIdToken();

    try {
      const res = await api.post(`/private-chat/message/${messageId}/react`, 
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("message_reaction", {
        messageId,
        reactions: res.data.reactions,
        room: `private_${Math.min(me.id, Number(userId))}_${Math.max(me.id, Number(userId))}`
      });
      
      setShowEmojiPicker(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  /* ================= LONG PRESS HANDLERS ================= */
  const handleTouchStart = (e, message) => {
    if (message.sender_id !== me?.id) return;
    
    longPressTimer.current = setTimeout(() => {
      setSelectedMessage(message);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    if (message.sender_id === me?.id) {
      setSelectedMessage(message);
    }
  };

  /* ================= FORMAT TIME ================= */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "sent": return "✓";
      case "delivered": return "✓✓";
      case "read": return "✓✓";
      default: return "";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "sent": return "#94a3b8";
      case "delivered": return "#fbbf24";
      case "read": return "#22c55e";
      default: return "#94a3b8";
    }
  };

  if (loading) return (
    <div style={styles.loaderContainer}>
      <div style={styles.loader}>
        <div style={styles.loaderSpinner}></div>
        <p>Loading chat...</p>
      </div>
    </div>
  );

  const headerTitle =
    me?.role === "owner"
      ? otherUser?.name || "User"
      : otherUser?.pg_name || otherUser?.name || "PG";

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {otherUser?.name?.charAt(0) || "U"}
          </div>
          <div>
            <div style={styles.userName}>{headerTitle}</div>
            <div style={styles.userStatus}>
              <span style={{
                ...styles.statusDot,
                background: online ? "#22c55e" : "#94a3b8"
              }} />
              {online ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <div style={styles.chatBody}>
        {messages.map((m, index) => {
          const isMyMessage = m.sender_id === me?.id;
          const showAvatar = index === 0 || 
            messages[index - 1]?.sender_id !== m.sender_id;
          
          return (
            <div
              key={m.id}
              ref={el => messageRefs.current[m.id] = el}
              style={{
                ...styles.messageWrapper,
                justifyContent: isMyMessage ? "flex-end" : "flex-start",
              }}
              onTouchStart={(e) => handleTouchStart(e, m)}
              onTouchEnd={handleTouchEnd}
              onContextMenu={(e) => handleContextMenu(e, m)}
            >
              {!isMyMessage && showAvatar && (
                <div style={styles.messageAvatar}>
                  {otherUser?.name?.charAt(0) || "U"}
                </div>
              )}
              
              <div style={{
                ...styles.messageContainer,
                maxWidth: isMyMessage ? "70%" : "calc(70% - 40px)",
                marginLeft: !isMyMessage && !showAvatar ? "40px" : 0,
              }}>
                {m.reply_to && (
                  <div style={styles.replyPreview}>
                    <small>Replying to: {m.reply_to.message.substring(0, 30)}...</small>
                  </div>
                )}
                
                <div style={{
                  ...styles.messageBubble,
                  background: isMyMessage 
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "#ffffff",
                  color: isMyMessage ? "#ffffff" : "#1e293b",
                  borderBottomRightRadius: isMyMessage ? 4 : 18,
                  borderBottomLeftRadius: !isMyMessage ? 4 : 18,
                }}>
                  <p style={styles.messageText}>{m.message}</p>
                  
                  <div style={styles.messageMeta}>
                    <span style={styles.messageTime}>{formatTime(m.created_at)}</span>
                    {isMyMessage && (
                      <span style={{
                        ...styles.messageStatus,
                        color: getStatusColor(m.status)
                      }}>
                        {getStatusIcon(m.status)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reactions */}
                {m.reactions && Object.keys(m.reactions).length > 0 && (
                  <div style={styles.reactions}>
                    {Object.entries(m.reactions).map(([emoji, users]) => (
                      <span key={emoji} style={styles.reaction}>
                        {emoji} {users.length}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typing && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingAvatar}>
              {otherUser?.name?.charAt(0) || "U"}
            </div>
            <div style={styles.typingBubble}>
              <div style={styles.typingDots}>
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div style={styles.replyBar}>
          <div style={styles.replyContent}>
            <small>Replying to: {replyingTo.message.substring(0, 50)}</small>
          </div>
          <button 
            onClick={() => setReplyingTo(null)}
            style={styles.closeReply}
          >
            ×
          </button>
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputArea}>
        <button style={styles.attachButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        
        <button 
          onClick={sendMessage}
          style={{
            ...styles.sendButton,
            background: text.trim() 
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "#e2e8f0",
          }}
          disabled={!text.trim()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      {/* Message Actions Modal */}
      {selectedMessage && (
        <div style={styles.modalOverlay} onClick={() => setSelectedMessage(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4 style={styles.modalTitle}>Message Actions</h4>
            
            <button
              style={styles.modalButton}
              onClick={() => {
                setReplyingTo(selectedMessage);
                setSelectedMessage(null);
              }}
            >
              <span>💬</span> Reply
            </button>
            
            <button
              style={styles.modalButton}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
              }}
            >
              <span>😊</span> Add Reaction
            </button>
            
            {selectedMessage.sender_id === me?.id && (
              <button
                style={{...styles.modalButton, ...styles.deleteButton}}
                onClick={() => deleteMessage(selectedMessage.id)}
              >
                <span>🗑️</span> Delete Message
              </button>
            )}
            
            {showEmojiPicker && (
              <div style={styles.emojiPicker}>
                {["👍", "❤️", "😂", "😮", "😢", "👏"].map(emoji => (
                  <button
                    key={emoji}
                    style={styles.emojiButton}
                    onClick={() => addReaction(selectedMessage.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  header: {
    background: "#ffffff",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    borderBottom: "1px solid #e2e8f0",
    zIndex: 10,
  },

  backButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "12px",
    color: "#64748b",
    transition: "all 0.2s",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },

  userAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  userName: {
    fontWeight: "600",
    fontSize: "16px",
    color: "#1e293b",
    marginBottom: "4px",
  },

  userStatus: {
    fontSize: "13px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  messageWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    animation: "fadeIn 0.3s ease",
  },

  messageAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    background: "#e2e8f0",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    flexShrink: 0,
  },

  messageContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  replyPreview: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
    padding: "6px 10px",
    background: "#f1f5f9",
    borderRadius: "12px 12px 4px 12px",
    maxWidth: "200px",
  },

  messageBubble: {
    padding: "12px 16px",
    borderRadius: "18px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
  },

  messageText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },

  messageMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    marginTop: "4px",
  },

  messageTime: {
    fontSize: "11px",
    opacity: 0.7,
  },

  messageStatus: {
    fontSize: "12px",
    fontWeight: "500",
  },

  reactions: {
    display: "flex",
    gap: "4px",
    marginTop: "4px",
    flexWrap: "wrap",
  },

  reaction: {
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "16px",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },

  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
  },

  typingAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "10px",
    background: "#e2e8f0",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
  },

  typingBubble: {
    background: "#ffffff",
    padding: "12px 16px",
    borderRadius: "18px 18px 18px 4px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },

  typingDots: {
    display: "flex",
    gap: "4px",
    fontSize: "20px",
    lineHeight: 0,
    color: "#64748b",
    animation: "pulse 1.5s infinite",
  },

  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px 20px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.02)",
  },

  attachButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "12px",
    color: "#64748b",
    transition: "all 0.2s",
  },

  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: "25px",
    border: "2px solid #e2e8f0",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.2s",
    background: "#f8fafc",
  },

  sendButton: {
    border: "none",
    cursor: "pointer",
    padding: "12px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    width: "48px",
    height: "48px",
  },

  replyBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#f1f5f9",
    borderTop: "1px solid #e2e8f0",
  },

  replyContent: {
    fontSize: "13px",
    color: "#1e293b",
  },

  closeReply: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#64748b",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease",
    backdropFilter: "blur(4px)",
  },

  modalContent: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "20px",
    width: "300px",
    maxWidth: "90%",
    animation: "slideUp 0.3s ease",
  },

  modalTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
  },

  modalButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    background: "none",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "16px",
    color: "#1e293b",
    cursor: "pointer",
    borderRadius: "14px",
    transition: "background 0.2s",
    marginBottom: "8px",
  },

  deleteButton: {
    color: "#ef4444",
    borderTop: "1px solid #e2e8f0",
    marginTop: "8px",
    paddingTop: "14px",
  },

  emojiPicker: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "8px",
    marginTop: "12px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "16px",
  },

  emojiButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "12px",
    transition: "background 0.2s",
  },

  loaderContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
  },

  loader: {
    textAlign: "center",
    color: "#64748b",
  },

  loaderSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },
};

// Add global styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  
  .typing-dots span {
    animation: pulse 1.5s infinite;
  }
  
  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  button:hover {
    background: #f1f5f9 !important;
  }
  
  .sendButton:hover:not(:disabled) {
    transform: scale(1.05);
  }
  
  .messageBubble:hover {
    transform: translateY(-1px);
  }
`;
document.head.appendChild(style);