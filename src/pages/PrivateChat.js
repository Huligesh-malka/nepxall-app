import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";
import {
  format,
  isToday,
  isYesterday,
  formatDistanceToNow
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
  const fileInputRef = useRef();
  const messagesContainerRef = useRef();

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInfo, setChatInfo] = useState(null);

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

    // Chat list update
    const handleChatListUpdate = () => {
      // Refresh chat list if needed
    };

    socket.on("receive_private_message", handleReceiveMessage);
    socket.on("message_sent_confirmation", handleMessageSent);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("user_typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("chat_list_update", handleChatListUpdate);

    return () => {
      socket.off("receive_private_message", handleReceiveMessage);
      socket.off("message_sent_confirmation", handleMessageSent);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("chat_list_update", handleChatListUpdate);
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
      // Show error toast
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
     BULK DELETE
  ========================= */

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return;

    try {
      const token = await auth.currentUser.getIdToken();

      await Promise.all(
        selectedMessages.map(id =>
          api.delete(`/private-chat/message/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      setMessages(prev =>
        prev.filter(m => !selectedMessages.includes(m.id))
      );

      setSelectedMessages([]);
      setSelectionMode(false);

    } catch (err) {
      console.error("Error deleting messages:", err);
    }
  };

  /* =========================
     FILE UPLOAD
  ========================= */

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiver_id", userId);
    formData.append("pg_id", pgId);

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await api.post("/private-chat/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        }
      });

      setUploadProgress(0);
      setShowAttachments(false);

      // Message will be added via socket

    } catch (err) {
      console.error("Error uploading file:", err);
      setUploadProgress(0);
    }
  };

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

        <div style={styles.headerActions}>
          {selectionMode ? (
            <>
              <button 
                onClick={deleteSelectedMessages}
                style={styles.headerAction}
                disabled={selectedMessages.length === 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19ZM8 4V2H16V4H8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button 
                onClick={() => {
                  setSelectedMessages([]);
                  setSelectionMode(false);
                }}
                style={styles.headerAction}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowAttachments(!showAttachments)}
              style={styles.headerAction}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Attachments Menu */}
      {showAttachments && (
        <div style={styles.attachmentsMenu}>
          <button 
            onClick={() => fileInputRef.current.click()}
            style={styles.attachmentItem}
          >
            <span style={styles.attachmentIcon}>📎</span>
            <span>Document</span>
          </button>
          <button style={styles.attachmentItem}>
            <span style={styles.attachmentIcon}>📷</span>
            <span>Image</span>
          </button>
          <button style={styles.attachmentItem}>
            <span style={styles.attachmentIcon}>📍</span>
            <span>Location</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${uploadProgress}%`}}>
            {uploadProgress}%
          </div>
        </div>
      )}

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

                  <div style={{ maxWidth: "70%" }}>
                    <div
                      style={{
                        ...styles.messageContent,
                        ...(selectionMode && styles.selectableMessage),
                        ...(selectedMessages.includes(msg.id) && styles.selectedMessage)
                      }}
                      onClick={() => selectionMode && toggleMessageSelection(msg.id)}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          background: isMine
                            ? "linear-gradient(135deg, #667eea, #764ba2)"
                            : "#ffffff",
                          color: isMine ? "#ffffff" : "#1a1a1a",
                          borderBottomRightRadius: isMine ? 4 : 18,
                          borderBottomLeftRadius: !isMine ? 4 : 18,
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
                          <>
                            <span style={styles.messageStatus}>
                              {msg.is_read ? "✓✓" : msg.status === "sending" ? "..." : "✓"}
                            </span>
                            
                            {!selectionMode && (
                              <div style={styles.messageActions}>
                                <button
                                  onClick={() => startEditing(msg)}
                                  style={styles.messageAction}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => confirmDelete(msg)}
                                  style={styles.messageAction}
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isMine && showAvatar && (
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
        <button 
          onClick={() => setSelectionMode(!selectionMode)}
          style={styles.inputAction}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <input
          value={text}
          onChange={onTextChange}
          placeholder="Type a message..."
          style={styles.input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              editingMessage ? updateMessage() : sendMessage();
            }
          }}
          disabled={selectionMode}
        />

        {editingMessage ? (
          <>
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
          </>
        ) : (
          <button 
            onClick={sendMessage}
            disabled={!text.trim() || sending || selectionMode}
            style={{
              ...styles.sendButton,
              opacity: !text.trim() || sending || selectionMode ? 0.5 : 1
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
    background: "#f8fafc",
    position: "relative",
  },

  header: {
    background: "#ffffff",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },

  backButton: {
    background: "none",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#64748b",
    borderRadius: 8,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
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
    gap: 4,
  },

  userName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1e293b",
  },

  userSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },

  pgName: {
    color: "#667eea",
  },

  online: {
    color: "#10b981",
  },

  offline: {
    color: "#94a3b8",
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
    color: "#64748b",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },

  attachmentsMenu: {
    position: "absolute",
    top: 80,
    right: 16,
    background: "#ffffff",
    borderRadius: 12,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: 8,
    zIndex: 10,
    border: "1px solid #e2e8f0",
  },

  attachmentItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    width: "100%",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#334155",
    fontSize: 14,
    borderRadius: 8,
    transition: "all 0.2s",
  },

  attachmentIcon: {
    fontSize: 18,
  },

  progressBar: {
    height: 4,
    background: "#e2e8f0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    transition: "width 0.3s ease",
    fontSize: 10,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: "4px",
  },

  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
  },

  dateDivider: {
    display: "flex",
    justifyContent: "center",
    margin: "20px 0",
  },

  dateText: {
    background: "#e2e8f0",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    color: "#475569",
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
    background: "#cbd5e1",
    color: "#475569",
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

  selectableMessage: {
    cursor: "pointer",
  },

  selectedMessage: {
    opacity: 0.7,
  },

  messageBubble: {
    padding: "10px 14px",
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },

  editedIndicator: {
    fontSize: 11,
    opacity: 0.7,
    fontStyle: "italic",
  },

  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    padding: "0 4px",
  },

  messageTime: {
    fontSize: 11,
    color: "#94a3b8",
  },

  messageStatus: {
    fontSize: 12,
    color: "#667eea",
  },

  messageActions: {
    display: "flex",
    gap: 4,
    marginLeft: 8,
  },

  messageAction: {
    background: "none",
    border: "none",
    padding: 4,
    cursor: "pointer",
    fontSize: 12,
    opacity: 0.5,
    transition: "opacity 0.2s",
  },

  typingIndicator: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 16,
  },

  typingBubble: {
    background: "#e2e8f0",
    padding: "12px 16px",
    borderRadius: 20,
    display: "flex",
    gap: 4,
  },

  typingDot: {
    width: 8,
    height: 8,
    background: "#64748b",
    borderRadius: "50%",
    animation: "typing 1.4s infinite",
  },

  connectionStatus: {
    textAlign: "center",
    padding: "8px",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 12,
  },

  inputContainer: {
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    padding: "16px",
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  inputAction: {
    background: "none",
    border: "none",
    padding: 8,
    cursor: "pointer",
    color: "#64748b",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },

  input: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s",
    background: "#f8fafc",
  },

  sendButton: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    border: "none",
    width: 44,
    height: 44,
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ffffff",
    transition: "all 0.2s",
    boxShadow: "0 4px 6px rgba(102, 126, 234, 0.25)",
  },

  cancelButton: {
    background: "#f1f5f9",
    border: "none",
    width: 44,
    height: 44,
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
    transition: "all 0.2s",
  },

  loaderContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
  },

  loader: {
    width: 48,
    height: 48,
    border: "3px solid #e2e8f0",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loaderText: {
    marginTop: 16,
    color: "#64748b",
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
  },

  modal: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },

  modalText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
    lineHeight: 1.6,
  },

  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
  },

  modalCancel: {
    padding: "10px 20px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  modalConfirm: {
    padding: "10px 20px",
    background: "#ef4444",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    color: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s",
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
  
  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
`;
document.head.appendChild(styleSheet);