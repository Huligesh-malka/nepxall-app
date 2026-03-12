import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";
import {
  format,
  isToday,
  isYesterday
} from "date-fns";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function PrivateChat() {
  const { userId, pgId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const messagesContainerRef = useRef();
  const longPressTimer = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [unreadCount, setUnreadCount] = useState(0);

  const typingTimeoutRef = useRef();

  /* =========================
     UTILITY FUNCTIONS
  ========================= */

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "hh:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "hh:mm a")}`;
    } else {
      return format(date, "MMM dd, hh:mm a");
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: smooth ? "smooth" : "auto"
        });
      }
    }, 100);
  };

  /* =========================
     CHECK PARAMS
  ========================= */

  useEffect(() => {
    if (!userId || !pgId) {
      navigate(-1);
    }
  }, [userId, pgId, navigate]);

  /* =========================
     SOCKET CONNECTION MANAGEMENT
  ========================= */

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionStatus("error");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  /* =========================
     AUTH + LOAD DATA
  ========================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        navigate("/login");
        return;
      }

      try {
        const token = await fbUser.getIdToken();
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Load current user
        const meRes = await api.get("/private-chat/me", config);
        setMe(meRes.data);

        // Load other user info
        const userRes = await api.get(
          `/private-chat/user/${userId}?pg_id=${pgId}`,
          config
        );
        setOtherUser(userRes.data);

        // Load messages
        const msgRes = await api.get(
          `/private-chat/messages/${userId}?pg_id=${pgId}&limit=100`,
          config
        );
        setMessages(msgRes.data || []);
        
        // Mark messages as read
        const unreadMsgs = msgRes.data.filter(
          m => m.sender_id === Number(userId) && !m.is_read
        ).length;
        setUnreadCount(unreadMsgs);

        setLoading(false);
        scrollToBottom(false);

        // Connect socket and register
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("register", fbUser.uid);

        // Join room
        socket.emit("join_private_room", {
          userA: meRes.data.id,
          userB: Number(userId),
          pg_id: Number(pgId)
        });

        // Mark messages as read via socket
        if (unreadMsgs > 0) {
          socket.emit("mark_messages_read", {
            userA: meRes.data.id,
            userB: Number(userId),
            pg_id: Number(pgId),
            messageIds: msgRes.data.filter(m => !m.is_read).map(m => m.id)
          });
        }

      } catch (err) {
        console.error("Error loading chat:", err);
        setLoading(false);
      }
    });

    return () => {
      if (socket.connected) {
        socket.emit("leave_private_room", {
          userA: me?.id,
          userB: Number(userId),
          pg_id: Number(pgId)
        });
      }
      unsub?.();
    };
  }, [userId, pgId, navigate]);

  /* =========================
     SOCKET EVENT HANDLERS
  ========================= */

  useEffect(() => {
    // Receive new message
    const handleReceiveMessage = (msg) => {
      if (msg.pg_id !== Number(pgId)) return;

      setMessages(prev => {
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;

        // Play notification sound if not from current user
        if (msg.sender_id !== me?.id) {
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        }

        return [...prev, msg];
      });

      scrollToBottom();
    };

    // Message sent confirmation
    const handleMessageSent = (msg) => {
      setMessages(prev => 
        prev.map(m => 
          m.message_hash === msg.message_hash 
            ? { ...m, ...msg, status: msg.status }
            : m
        )
      );
    };

    // Message deleted
    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    // Typing indicator
    const handleTyping = ({ userId: typingUserId, isTyping }) => {
      if (typingUserId === Number(userId)) {
        setOtherTyping(isTyping);
      }
    };

    // Messages read
    const handleMessagesRead = ({ readerId, messageIds }) => {
      if (readerId === Number(userId)) {
        setMessages(prev =>
          prev.map(m =>
            messageIds.includes(m.id) ? { ...m, is_read: 1 } : m
          )
        );
      }
    };

    // Online status
    const handleUserOnline = (uid) => {
      if (uid === otherUser?.firebase_uid) {
        setOnline(true);
      }
    };

    const handleUserOffline = (uid) => {
      if (uid === otherUser?.firebase_uid) {
        setOnline(false);
      }
    };

    socket.on("receive_private_message", handleReceiveMessage);
    socket.on("message_sent_confirmation", handleMessageSent);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("user_typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("receive_private_message", handleReceiveMessage);
      socket.off("message_sent_confirmation", handleMessageSent);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [pgId, me?.id, userId, otherUser?.firebase_uid]);

  /* =========================
     TYPING INDICATOR
  ========================= */

  const handleTyping = useCallback((isTyping) => {
    if (!me) return;

    socket.emit("typing", {
      userA: me.id,
      userB: Number(userId),
      pg_id: Number(pgId),
      isTyping
    });
  }, [me, userId, pgId]);

  const onTextChange = (e) => {
    setText(e.target.value);

    if (!typing) {
      setTyping(true);
      handleTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      handleTyping(false);
    }, 1000);
  };

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage = async () => {
    if (!text.trim() || sending) return;

    setSending(true);

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await api.post(
        "/private-chat/send",
        {
          receiver_id: Number(userId),
          pg_id: Number(pgId),
          message: text
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Optimistically add message
      const tempMessage = {
        ...res.data,
        status: "sending",
        created_at: new Date().toISOString()
      };

      setMessages(prev => {
        const exists = prev.some(m => m.id === res.data.id);
        if (exists) return prev;
        return [...prev, tempMessage];
      });

      socket.emit("send_private_message", {
        ...res.data,
        sender_firebase_uid: auth.currentUser.uid,
        receiver_firebase_uid: otherUser?.firebase_uid
      });

      setText("");
      scrollToBottom();

      // Stop typing
      setTyping(false);
      handleTyping(false);
      clearTimeout(typingTimeoutRef.current);

    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  /* =========================
     EDIT MESSAGE
  ========================= */

  const startEditing = (message) => {
    setEditingMessage(message);
    setText(message.message);
    setActiveMessageId(null);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setText("");
  };

  const updateMessage = async () => {
    if (!editingMessage || !text.trim()) return;

    try {
      const token = await auth.currentUser.getIdToken();

      await api.put(
        `/private-chat/message/${editingMessage.id}`,
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev =>
        prev.map(m =>
          m.id === editingMessage.id ? { ...m, message: text, edited: true } : m
        )
      );

      cancelEditing();

    } catch (err) {
      console.error("Error updating message:", err);
    }
  };

  /* =========================
     DELETE MESSAGE
  ========================= */

  const confirmDelete = (message) => {
    setMessageToDelete(message);
    setShowDeleteConfirm(true);
    setActiveMessageId(null);
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const token = await auth.currentUser.getIdToken();

      await api.delete(`/private-chat/message/${messageToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      socket.emit("delete_private_message", {
        messageId: messageToDelete.id,
        sender_id: me.id,
        receiver_id: Number(userId),
        pg_id: Number(pgId),
        sender_firebase_uid: auth.currentUser.uid,
        receiver_firebase_uid: otherUser?.firebase_uid
      });

      setMessages(prev =>
        prev.filter(m => m.id !== messageToDelete.id)
      );

      setShowDeleteConfirm(false);
      setMessageToDelete(null);

    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  /* =========================
     LONG PRESS HANDLER
  ========================= */

  const handleTouchStart = (messageId) => {
    longPressTimer.current = setTimeout(() => {
      setActiveMessageId(messageId);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleMouseDown = (messageId) => {
    longPressTimer.current = setTimeout(() => {
      setActiveMessageId(messageId);
    }, 500);
  };

  const handleMouseUp = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleMouseLeave = () => {
    clearTimeout(longPressTimer.current);
  };

  /* =========================
     CLICK OUTSIDE TO CLOSE ACTIVE MENU
  ========================= */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.message-actions')) {
        setActiveMessageId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  /* =========================
     RENDER
  ========================= */

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loaderText}>Loading conversation...</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const sortedDates = Object.keys(groupedMessages).sort();

  return (
    <div style={styles.container}>
      
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={styles.headerInfo}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {otherUser?.name?.charAt(0) || "U"}
            </div>
            <div style={styles.userDetails}>
              <div style={styles.userName}>
                {me?.role === "tenant"
                  ? otherUser?.pg_name || "PG"
                  : otherUser?.name || "User"}
              </div>
              <div style={styles.userSubtitle}>
                {me?.role !== "tenant" && otherUser?.pg_name && (
                  <span style={styles.pgName}>{otherUser.pg_name} • </span>
                )}
                <span style={online ? styles.online : styles.offline}>
                  {online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} style={styles.messagesContainer}>
        {sortedDates.map(date => (
          <div key={date}>
            <div style={styles.dateDivider}>
              <span style={styles.dateText}>
                {format(new Date(date), "MMMM d, yyyy")}
              </span>
            </div>

            {groupedMessages[date].map((msg, index) => {
              const isMine = msg.sender_id === me?.id;
              const showAvatar = index === 0 || 
                groupedMessages[date][index - 1]?.sender_id !== msg.sender_id;

              return (
                <div
                  key={msg.id}
                  style={{
                    ...styles.messageWrapper,
                    justifyContent: isMine ? "flex-end" : "flex-start"
                  }}
                >
                  {!isMine && showAvatar && (
                    <div style={styles.messageAvatar}>
                      {otherUser?.name?.charAt(0) || "U"}
                    </div>
                  )}

                  <div style={{ maxWidth: "70%", position: "relative" }}>
                    <div
                      className="message-content"
                      style={styles.messageContent}
                      onTouchStart={() => isMine && handleTouchStart(msg.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                      onMouseDown={() => isMine && handleMouseDown(msg.id)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          background: isMine
                            ? "linear-gradient(135deg, #FF6B6B, #4ECDC4)"
                            : "#ffffff",
                          color: isMine ? "#ffffff" : "#2d3436",
                          borderBottomRightRadius: isMine ? 4 : 18,
                          borderBottomLeftRadius: !isMine ? 4 : 18,
                          boxShadow: isMine 
                            ? "0 4px 15px rgba(255, 107, 107, 0.2)"
                            : "0 2px 10px rgba(0,0,0,0.05)"
                        }}
                      >
                        {msg.message}
                        
                        {msg.edited && (
                          <span style={styles.editedIndicator}> (edited)</span>
                        )}
                      </div>

                      <div style={styles.messageMeta}>
                        <span style={styles.messageTime}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                        
                        {isMine && (
                          <span style={{
                            ...styles.messageStatus,
                            color: msg.is_read ? "#4ECDC4" : msg.status === "sending" ? "#FFB347" : "#95a5a6"
                          }}>
                            {msg.is_read ? "✓✓" : msg.status === "sending" ? "⌛" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Menu - Shows on long press */}
                    {isMine && activeMessageId === msg.id && (
                      <div className="message-actions" style={{
                        ...styles.actionMenu,
                        [isMine ? 'right' : 'left']: 0
                      }}>
                        <button
                          onClick={() => startEditing(msg)}
                          style={styles.actionButton}
                        >
                          <span style={styles.actionIcon}>✏️</span>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => confirmDelete(msg)}
                          style={{...styles.actionButton, color: "#FF6B6B"}}
                        >
                          <span style={styles.actionIcon}>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isMine && showAvatar && (
                    <div style={{
                      ...styles.messageAvatar,
                      background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)"
                    }}>
                      {me?.name?.charAt(0) || "M"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {otherTyping && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingBubble}>
              <span style={styles.typingDot}></span>
              <span style={styles.typingDot}></span>
              <span style={styles.typingDot}></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Connection Status */}
      {connectionStatus !== "connected" && (
        <div style={styles.connectionStatus}>
          {connectionStatus === "disconnected" 
            ? "Connecting..." 
            : "Connection lost. Reconnecting..."}
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <input
          value={text}
          onChange={onTextChange}
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          style={{
            ...styles.input,
            borderColor: editingMessage ? "#4ECDC4" : "#e2e8f0"
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              editingMessage ? updateMessage() : sendMessage();
            }
          }}
        />

        {editingMessage ? (
          <div style={styles.editActions}>
            <button onClick={updateMessage} style={styles.sendButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={cancelEditing} style={styles.cancelButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <button 
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              ...styles.sendButton,
              opacity: !text.trim() || sending ? 0.5 : 1,
              background: !text.trim() || sending 
                ? "#cbd5e0" 
                : "linear-gradient(135deg, #FF6B6B, #4ECDC4)"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Message</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                style={styles.modalCancel}
              >
                Cancel
              </button>
              <button 
                onClick={deleteMessage}
                style={styles.modalConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f7f9fc",
    position: "relative",
  },

  header: {
    background: "#ffffff",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid #eef2f6",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },

  backButton: {
    background: "none",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#4a5568",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    ":hover": {
      background: "#f7f9fc"
    }
  },

  headerInfo: {
    flex: 1,
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: 18,
    textTransform: "uppercase",
    boxShadow: "0 4px 10px rgba(255, 107, 107, 0.2)",
  },

  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  userName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#2d3748",
  },

  userSubtitle: {
    fontSize: 13,
    color: "#718096",
  },

  pgName: {
    color: "#4ECDC4",
    fontWeight: "500",
  },

  online: {
    color: "#4ECDC4",
    fontWeight: "500",
  },

  offline: {
    color: "#a0aec0",
  },

  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
  },

  dateDivider: {
    display: "flex",
    justifyContent: "center",
    margin: "24px 0",
  },

  dateText: {
    background: "#e2e8f0",
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "500",
    color: "#4a5568",
    letterSpacing: "0.3px",
  },

  messageWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 16,
  },

  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#cbd5e0",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    flexShrink: 0,
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },

  messageContent: {
    position: "relative",
    cursor: "pointer",
  },

  messageBubble: {
    padding: "12px 16px",
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
    transition: "all 0.2s",
  },

  editedIndicator: {
    fontSize: 11,
    opacity: 0.8,
    fontStyle: "italic",
    marginLeft: 4,
  },

  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    padding: "0 4px",
  },

  messageTime: {
    fontSize: 10,
    color: "#a0aec0",
    fontWeight: "500",
  },

  messageStatus: {
    fontSize: 12,
    fontWeight: "600",
    transition: "color 0.2s",
  },

  actionMenu: {
    position: "absolute",
    top: -40,
    background: "#ffffff",
    borderRadius: 30,
    padding: 4,
    display: "flex",
    gap: 4,
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    border: "1px solid #eef2f6",
    zIndex: 10,
    animation: "slideUp 0.2s ease",
  },

  actionButton: {
    background: "none",
    border: "none",
    padding: "8px 12px",
    borderRadius: 25,
    fontSize: 13,
    fontWeight: "500",
    color: "#4a5568",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s",
    ":hover": {
      background: "#f7f9fc"
    }
  },

  actionIcon: {
    fontSize: 16,
  },

  typingIndicator: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 16,
  },

  typingBubble: {
    background: "#ffffff",
    padding: "12px 16px",
    borderRadius: 20,
    display: "flex",
    gap: 4,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },

  typingDot: {
    width: 8,
    height: 8,
    background: "#4ECDC4",
    borderRadius: "50%",
    animation: "typing 1.4s infinite",
  },

  connectionStatus: {
    textAlign: "center",
    padding: "8px",
    background: "#fed7d7",
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "500",
  },

  inputContainer: {
    background: "#ffffff",
    borderTop: "1px solid #eef2f6",
    padding: "16px",
    display: "flex",
    gap: 12,
    alignItems: "center",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.02)",
  },

  input: {
    flex: 1,
    padding: "14px 18px",
    border: "2px solid #e2e8f0",
    borderRadius: 30,
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s",
    background: "#f8fafc",
    ":focus": {
      borderColor: "#4ECDC4",
      background: "#ffffff",
    }
  },

  editActions: {
    display: "flex",
    gap: 8,
  },

  sendButton: {
    background: "linear-gradient(135deg, #FF6B6B, #4ECDC4)",
    border: "none",
    width: 48,
    height: 48,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ffffff",
    transition: "all 0.2s",
    boxShadow: "0 4px 15px rgba(78, 205, 196, 0.3)",
    ":hover": {
      transform: "scale(1.05)",
    },
    ":disabled": {
      transform: "none",
    }
  },

  cancelButton: {
    background: "#f1f5f9",
    border: "none",
    width: 48,
    height: 48,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#4a5568",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    ":hover": {
      background: "#e2e8f0",
    }
  },

  loaderContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f7f9fc",
  },

  loader: {
    width: 48,
    height: 48,
    border: "3px solid #e2e8f0",
    borderTopColor: "#4ECDC4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loaderText: {
    marginTop: 16,
    color: "#718096",
    fontSize: 14,
    fontWeight: "500",
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
    backdropFilter: "blur(5px)",
  },

  modal: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 340,
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 12,
  },

  modalText: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 24,
    lineHeight: 1.6,
  },

  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
  },

  modalCancel: {
    padding: "12px 24px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: 30,
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    cursor: "pointer",
    transition: "all 0.2s",
    flex: 1,
    ":hover": {
      background: "#e2e8f0",
    }
  },

  modalConfirm: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #FF6B6B, #FF8E8E)",
    border: "none",
    borderRadius: 30,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s",
    flex: 1,
    boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
    ":hover": {
      transform: "translateY(-2px)",
    }
  },
};

// Add keyframe animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
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
  
  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  .message-content:hover .message-actions {
    opacity: 1;
  }

  .message-actions {
    opacity: 0;
    transition: opacity 0.2s;
  }

  .message-content:hover .message-actions {
    opacity: 1;
  }
`;
document.head.appendChild(styleSheet);