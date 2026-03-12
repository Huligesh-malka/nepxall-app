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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
                  <span style={styles.pgName}>{otherUser.pg_name}</span>
                )}
                <span style={online ? styles.online : styles.offline}>
                  • {online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.headerAction}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 5H21M3 12H21M3 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
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
              const showName = !isMine && showAvatar && otherUser?.name;

              return (
                <div
                  key={msg.id}
                  style={{
                    ...styles.messageWrapper,
                    justifyContent: isMine ? "flex-end" : "flex-start"
                  }}
                >
                  {!isMine && (
                    <div style={styles.messageAvatar}>
                      {otherUser?.name?.charAt(0) || "U"}
                    </div>
                  )}

                  <div style={{ maxWidth: "70%", position: "relative" }}>
                    {showName && (
                      <div style={styles.senderName}>{otherUser.name}</div>
                    )}
                    
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
                            ? "#dcf8c6"
                            : "#ffffff",
                          color: "#111111",
                          borderBottomRightRadius: isMine ? 4 : 18,
                          borderBottomLeftRadius: !isMine ? 4 : 18,
                        }}
                      >
                        {msg.message}
                        
                        {msg.edited && (
                          <span style={styles.editedIndicator}> edited</span>
                        )}
                      </div>

                      <div style={styles.messageMeta}>
                        <span style={styles.messageTime}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                        
                        {isMine && (
                          <span style={{
                            ...styles.messageStatus,
                            color: msg.is_read ? "#34b7f1" : msg.status === "sending" ? "#999" : "#999"
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
                        top: -45,
                        [isMine ? 'right' : 'left']: 0
                      }}>
                        <button
                          onClick={() => startEditing(msg)}
                          style={styles.actionButton}
                        >
                          <span style={styles.actionIcon}>✏️</span>
                          <span style={styles.actionText}>Edit</span>
                        </button>
                        <button
                          onClick={() => confirmDelete(msg)}
                          style={{...styles.actionButton, color: "#f44336"}}
                        >
                          <span style={styles.actionIcon}>🗑️</span>
                          <span style={styles.actionText}>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isMine && (
                    <div style={styles.messageAvatar}>
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

      {/* Input Area - WhatsApp Style */}
      <div style={styles.inputContainer}>
        <button 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={styles.emojiButton}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <input
          value={text}
          onChange={onTextChange}
          placeholder="Type a message"
          style={styles.input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              editingMessage ? updateMessage() : sendMessage();
            }
          }}
        />

        <button 
          onClick={() => {/* Attachment functionality */}}
          style={styles.attachButton}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16.5 6.5V16C16.5 18.5 14.5 20.5 12 20.5C9.5 20.5 7.5 18.5 7.5 16V6C7.5 4.5 8.5 3.5 10 3.5C11.5 3.5 12.5 4.5 12.5 6V15.5C12.5 16 12 16.5 11.5 16.5C11 16.5 10.5 16 10.5 15.5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

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
              background: !text.trim() || sending ? "#e0e0e0" : "#25d366",
              cursor: !text.trim() || sending ? "not-allowed" : "pointer"
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
   STYLES - WhatsApp Inspired
========================= */

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#e5ded8",
    position: "relative",
  },

  header: {
    background: "#075e54",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    color: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  backButton: {
    background: "none",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
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
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#128c7e",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: 18,
    textTransform: "uppercase",
  },

  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },

  userName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#ffffff",
  },

  userSubtitle: {
    fontSize: 13,
    color: "#dcf8c6",
    opacity: 0.9,
  },

  pgName: {
    color: "#ffffff",
    fontWeight: "500",
    marginRight: 4,
  },

  online: {
    color: "#dcf8c6",
  },

  offline: {
    color: "#b0b0b0",
  },

  headerActions: {
    display: "flex",
    gap: 8,
  },

  headerAction: {
    background: "none",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },

  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 12px",
    background: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b4080c59a.png')",
    backgroundSize: "cover",
  },

  dateDivider: {
    display: "flex",
    justifyContent: "center",
    margin: "16px 0",
  },

  dateText: {
    background: "rgba(225, 245, 254, 0.92)",
    padding: "6px 12px",
    borderRadius: 16,
    fontSize: 12,
    fontWeight: "500",
    color: "#1f7a6b",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },

  messageWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 12,
  },

  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#128c7e",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    flexShrink: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f7a6b",
    marginBottom: 2,
    marginLeft: 4,
  },

  messageContent: {
    position: "relative",
    cursor: "pointer",
  },

  messageBubble: {
    padding: "8px 12px",
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },

  editedIndicator: {
    fontSize: 10,
    color: "#888",
    fontStyle: "italic",
    marginLeft: 4,
  },

  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    padding: "0 4px",
    justifyContent: "flex-end",
  },

  messageTime: {
    fontSize: 11,
    color: "#999",
  },

  messageStatus: {
    fontSize: 12,
    fontWeight: "500",
  },

  actionMenu: {
    position: "absolute",
    background: "#ffffff",
    borderRadius: 8,
    padding: 4,
    display: "flex",
    gap: 2,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    border: "none",
    zIndex: 10,
    animation: "fadeIn 0.2s ease",
  },

  actionButton: {
    background: "none",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: 13,
    color: "#333",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s",
    minWidth: 90,
    ":hover": {
      background: "#f5f5f5",
    },
  },

  actionIcon: {
    fontSize: 16,
  },

  actionText: {
    fontSize: 13,
  },

  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#128c7e",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  typingBubble: {
    background: "#ffffff",
    padding: "12px 16px",
    borderRadius: 18,
    display: "flex",
    gap: 4,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    borderBottomLeftRadius: 4,
  },

  typingDot: {
    width: 8,
    height: 8,
    background: "#128c7e",
    borderRadius: "50%",
    animation: "typing 1.4s infinite",
  },

  connectionStatus: {
    textAlign: "center",
    padding: "8px",
    background: "#fff3cd",
    color: "#856404",
    fontSize: 12,
    fontWeight: "500",
  },

  inputContainer: {
    background: "#f0f2f5",
    padding: "10px 16px",
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  emojiButton: {
    background: "none",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#54656f",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    ":hover": {
      background: "#e9edf0",
    },
  },

  attachButton: {
    background: "none",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#54656f",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    ":hover": {
      background: "#e9edf0",
    },
  },

  input: {
    flex: 1,
    padding: "12px 16px",
    border: "none",
    borderRadius: 24,
    fontSize: 14,
    outline: "none",
    background: "#ffffff",
    color: "#111",
    ":focus": {
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    "::placeholder": {
      color: "#999",
    },
  },

  editActions: {
    display: "flex",
    gap: 8,
  },

  sendButton: {
    border: "none",
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ffffff",
    transition: "all 0.2s",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    ":hover": {
      transform: "scale(1.05)",
    },
  },

  cancelButton: {
    background: "#f44336",
    border: "none",
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ffffff",
    transition: "all 0.2s",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    ":hover": {
      background: "#d32f2f",
    },
  },

  loaderContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#e5ded8",
  },

  loader: {
    width: 48,
    height: 48,
    border: "3px solid #e0e0e0",
    borderTopColor: "#075e54",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loaderText: {
    marginTop: 16,
    color: "#075e54",
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
  },

  modal: {
    background: "#ffffff",
    borderRadius: 8,
    padding: 24,
    width: "90%",
    maxWidth: 320,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#075e54",
    marginBottom: 12,
  },

  modalText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 1.5,
  },

  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
  },

  modalCancel: {
    padding: "10px 20px",
    background: "#f0f2f5",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#075e54",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      background: "#e5e5e5",
    },
  },

  modalConfirm: {
    padding: "10px 20px",
    background: "#f44336",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      background: "#d32f2f",
    },
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

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #f0f2f5;
  }

  ::-webkit-scrollbar-thumb {
    background: #c0c0c0;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }
`;
document.head.appendChild(styleSheet);