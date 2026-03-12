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
    }, 500);
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <div style={styles.headerInfo}>
          <div style={styles.avatar}>
            {otherUser?.name?.charAt(0) || "U"}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>
              {me?.role === "tenant"
                ? otherUser?.pg_name || "PG"
                : otherUser?.name || "User"}
            </div>
            <div style={styles.userStatus}>
              <span style={online ? styles.online : styles.offline}>
                {online ? "● Online" : "○ Offline"}
              </span>
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
                          background: isMine ? "#7C3AED" : "#F3F4F6",
                          color: isMine ? "#FFFFFF" : "#1F2937",
                          borderBottomRightRadius: isMine ? 4 : 16,
                          borderBottomLeftRadius: !isMine ? 4 : 16,
                        }}
                      >
                        {msg.message}
                        
                        {msg.edited && (
                          <span style={styles.editedIndicator}> • edited</span>
                        )}
                      </div>

                      <div style={styles.messageMeta}>
                        <span style={styles.messageTime}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                        
                        {isMine && (
                          <span style={{
                            ...styles.messageStatus,
                            color: msg.is_read ? "#10B981" : "#9CA3AF"
                          }}>
                            {msg.is_read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Menu - Shows on long press */}
                    {isMine && activeMessageId === msg.id && (
                      <div className="message-actions" style={styles.actionMenu}>
                        <button
                          onClick={() => startEditing(msg)}
                          style={styles.actionButton}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(msg)}
                          style={{...styles.actionButton, color: "#EF4444"}}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isMine && showAvatar && (
                    <div style={{...styles.messageAvatar, background: "#7C3AED"}}>
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
            <div style={styles.typingAvatar}>
              {otherUser?.name?.charAt(0) || "U"}
            </div>
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
          style={styles.input}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 6L9 17L4 12"/>
              </svg>
            </button>
            <button onClick={cancelEditing} style={styles.cancelButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6L18 18"/>
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
              background: !text.trim() || sending ? "#9CA3AF" : "#7C3AED"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
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
              Are you sure you want to delete this message?
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
   STYLES - Unique Modern Design
========================= */

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#FFFFFF",
    position: "relative",
  },

  header: {
    background: "#7C3AED",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    color: "#FFFFFF",
    boxShadow: "0 4px 20px rgba(124, 58, 237, 0.2)",
  },

  backButton: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#FFFFFF",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    ":hover": {
      background: "rgba(255,255,255,0.3)",
      transform: "scale(1.05)",
    }
  },

  headerInfo: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: "#FFFFFF",
    color: "#7C3AED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: 20,
    textTransform: "uppercase",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  userName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#FFFFFF",
  },

  userStatus: {
    fontSize: 13,
  },

  online: {
    color: "#A7F3D0",
  },

  offline: {
    color: "#E5E7EB",
    opacity: 0.8,
  },

  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    background: "#F9FAFB",
  },

  dateDivider: {
    display: "flex",
    justifyContent: "center",
    margin: "20px 0",
  },

  dateText: {
    background: "#E5E7EB",
    padding: "6px 16px",
    borderRadius: 30,
    fontSize: 12,
    fontWeight: "500",
    color: "#4B5563",
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
    background: "#9CA3AF",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    flexShrink: 0,
  },

  messageContent: {
    position: "relative",
    cursor: "pointer",
  },

  messageBubble: {
    padding: "12px 16px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },

  editedIndicator: {
    fontSize: 10,
    opacity: 0.7,
    fontStyle: "italic",
  },

  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    padding: "0 4px",
    justifyContent: "flex-end",
  },

  messageTime: {
    fontSize: 10,
    color: "#9CA3AF",
  },

  messageStatus: {
    fontSize: 12,
    fontWeight: "500",
  },

  actionMenu: {
    position: "absolute",
    top: -45,
    right: 0,
    background: "#FFFFFF",
    borderRadius: 30,
    padding: 4,
    display: "flex",
    gap: 4,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    border: "1px solid #F3F4F6",
    zIndex: 10,
    animation: "fadeIn 0.2s ease",
  },

  actionButton: {
    background: "none",
    border: "none",
    padding: "8px 16px",
    borderRadius: 25,
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s",
    ":hover": {
      background: "#F9FAFB",
    }
  },

  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#9CA3AF",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "600",
  },

  typingBubble: {
    background: "#F3F4F6",
    padding: "12px 16px",
    borderRadius: 16,
    display: "flex",
    gap: 4,
    borderBottomLeftRadius: 4,
  },

  typingDot: {
    width: 8,
    height: 8,
    background: "#7C3AED",
    borderRadius: "50%",
    animation: "typing 1.4s infinite",
  },

  connectionStatus: {
    textAlign: "center",
    padding: "8px",
    background: "#FEE2E2",
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
  },

  inputContainer: {
    background: "#FFFFFF",
    borderTop: "1px solid #F3F4F6",
    padding: "16px 20px",
    display: "flex",
    gap: 12,
    alignItems: "center",
    boxShadow: "0 -4px 10px rgba(0,0,0,0.02)",
  },

  input: {
    flex: 1,
    padding: "14px 18px",
    border: "2px solid #F3F4F6",
    borderRadius: 30,
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s",
    background: "#F9FAFB",
    color: "#1F2937",
    ":focus": {
      borderColor: "#7C3AED",
      background: "#FFFFFF",
    },
    "::placeholder": {
      color: "#9CA3AF",
    }
  },

  editActions: {
    display: "flex",
    gap: 8,
  },

  sendButton: {
    background: "#7C3AED",
    border: "none",
    width: 48,
    height: 48,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#FFFFFF",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
    ":hover": {
      transform: "scale(1.05)",
      background: "#6D28D9",
    },
  },

  cancelButton: {
    background: "#EF4444",
    border: "none",
    width: 48,
    height: 48,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#FFFFFF",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
    ":hover": {
      transform: "scale(1.05)",
      background: "#DC2626",
    }
  },

  loaderContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#F9FAFB",
  },

  loader: {
    width: 48,
    height: 48,
    border: "3px solid #F3F4F6",
    borderTopColor: "#7C3AED",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loaderText: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 14,
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
    backdropFilter: "blur(4px)",
  },

  modal: {
    background: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 320,
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },

  modalText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 1.5,
  },

  modalActions: {
    display: "flex",
    gap: 12,
  },

  modalCancel: {
    flex: 1,
    padding: "12px",
    background: "#F3F4F6",
    border: "none",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      background: "#E5E7EB",
    }
  },

  modalConfirm: {
    flex: 1,
    padding: "12px",
    background: "#EF4444",
    border: "none",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      background: "#DC2626",
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

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #F3F4F6;
  }

  ::-webkit-scrollbar-thumb {
    background: #9CA3AF;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #6B7280;
  }
`;
document.head.appendChild(styleSheet);