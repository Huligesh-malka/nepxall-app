import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";
import {
  FiArrowLeft,
  FiSend,
  FiMoreVertical,
  FiTrash2,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiPhone,
  FiVideo,
  FiImage,
  FiSmile,
  FiPaperclip,
  FiX,
  FiUser,
  FiHome,
} from "react-icons/fi";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from "framer-motion";

const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function PrivateChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const inputRef = useRef();
  const fileInputRef = useRef();
  const chatContainerRef = useRef();
  const typingTimeoutRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [messageGroups, setMessageGroups] = useState({});

  const scrollBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 100);
  }, []);

  /* ================= GROUP MESSAGES BY DATE ================= */
  useEffect(() => {
    const groups = {};
    messages.forEach(msg => {
      const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    setMessageGroups(groups);
  }, [messages]);

  /* ================= AUTH LOAD ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return navigate("/login");

      try {
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
        setLoading(false);

        if (!socket.connected) {
          socket.connect();
          socket.on("connect", () => {
            setConnectionStatus("connected");
            socket.emit("register", fbUser.uid);
          });
          
          socket.on("disconnect", () => setConnectionStatus("disconnected"));
          socket.on("reconnecting", () => setConnectionStatus("reconnecting"));
        }
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/login");
      }
    });

    return () => {
      unsub?.();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
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
        prev.map(m =>
          m.sender_id === me?.id ? { ...m, status: "read" } : m
        )
      );
    };

    const deleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const typingHandler = ({ isTyping, userId: typingUserId }) => {
      if (typingUserId !== me?.id) {
        setTyping(isTyping);
      }
    };

    socket.on("receive_private_message", receiveMessage);
    socket.on("message_sent_confirmation", delivered);
    socket.on("messages_read", read);
    socket.on("message_deleted", deleted);
    socket.on("user_online", () => setOnline(true));
    socket.on("user_offline", () => setOnline(false));
    socket.on("user_typing", typingHandler);

    return () => {
      socket.off("receive_private_message", receiveMessage);
      socket.off("message_sent_confirmation", delivered);
      socket.off("messages_read", read);
      socket.off("message_deleted", deleted);
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("user_typing", typingHandler);
    };
  }, [me, scrollBottom]);

  /* ================= TYPING INDICATOR ================= */
  const handleTyping = (e) => {
    setText(e.target.value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socket.emit("typing", {
      sender_id: me?.id,
      receiver_id: Number(userId),
      isTyping: true,
    });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        sender_id: me?.id,
        receiver_id: Number(userId),
        isTyping: false,
      });
    }, 1000);
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() && !uploading) return;

    const token = await auth.currentUser.getIdToken();

    try {
      const res = await api.post(
        "/private-chat/send",
        { 
          receiver_id: Number(userId), 
          message: text,
          reply_to: replyTo?.id || null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send_private_message", res.data);
      setMessages(prev => [...prev, { ...res.data, status: "sent" }]);
      setText("");
      setReplyTo(null);
      scrollBottom();
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  /* ================= UPLOAD FILE ================= */
  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiver_id", userId);

    setUploading(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.post("/private-chat/upload", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages(prev => [...prev, res.data]);
      socket.emit("send_private_message", res.data);
      scrollBottom();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE MESSAGE ================= */
  const deleteMessage = async (id) => {
    const token = await auth.currentUser.getIdToken();

    try {
      await api.delete(`/private-chat/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(prev => prev.filter(m => m.id !== id));
      socket.emit("delete_private_message", {
        messageId: id,
        sender_id: me.id,
        receiver_id: Number(userId),
      });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /* ================= FORMAT DATE HEADER ================= */
  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  /* ================= GET MESSAGE TIME ================= */
  const getMessageTime = (timestamp) => {
    return format(new Date(timestamp), "h:mm a");
  };

  /* ================= RENDER STATUS ICON ================= */
  const renderStatusIcon = (status) => {
    switch(status) {
      case "sent": return <FiClock size={12} color="#94a3b8" />;
      case "delivered": return <FiCheck size={12} color="#94a3b8" />;
      case "read": return <FiCheckCircle size={12} color="#3b82f6" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}>
          <div style={styles.loaderSpinner}></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  const headerTitle = me?.role === "owner"
    ? otherUser?.name || "User"
    : otherUser?.pg_name || otherUser?.name || "PG";

  return (
    <div style={styles.container}>
      {/* Header */}
      <motion.div 
        style={styles.header}
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div style={styles.headerLeft}>
          <motion.div 
            style={styles.backButton}
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiArrowLeft size={24} />
          </motion.div>
          
          <motion.div 
            style={styles.userAvatar}
            whileHover={{ scale: 1.05 }}
          >
            {me?.role === "owner" ? <FiUser size={24} /> : <FiHome size={24} />}
          </motion.div>
          
          <div style={styles.userInfo}>
            <div style={styles.userName}>{headerTitle}</div>
            <div style={styles.userStatus}>
              <span style={{
                ...styles.statusDot,
                background: online ? "#10b981" : "#94a3b8"
              }} />
              <span>{online ? "Online" : "Offline"}</span>
              {typing && (
                <motion.span 
                  style={styles.typingIndicator}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  typing...
                </motion.span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <motion.button 
            style={styles.iconButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiPhone size={20} />
          </motion.button>
          <motion.button 
            style={styles.iconButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiVideo size={20} />
          </motion.button>
          <motion.button 
            style={styles.iconButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiMoreVertical size={20} />
          </motion.button>
        </div>
      </motion.div>

      {/* Connection Status */}
      {connectionStatus !== "connected" && (
        <motion.div 
          style={{
            ...styles.connectionStatus,
            background: connectionStatus === "reconnecting" ? "#f59e0b" : "#ef4444"
          }}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
        >
          {connectionStatus === "reconnecting" ? "Reconnecting..." : "Disconnected"}
        </motion.div>
      )}

      {/* Chat Body */}
      <div style={styles.chatBody} ref={chatContainerRef}>
        <AnimatePresence>
          {Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              <motion.div 
                style={styles.dateHeader}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span style={styles.dateHeaderText}>{formatDateHeader(date)}</span>
              </motion.div>

              {msgs.map((m, index) => {
                const isMe = m.sender_id === me?.id;
                const showAvatar = index === 0 || msgs[index - 1]?.sender_id !== m.sender_id;

                return (
                  <motion.div
                    key={m.id}
                    style={{
                      ...styles.messageRow,
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}
                    initial={{ opacity: 0, x: isMe ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    onHoverStart={() => setSelectedMessage(m.id)}
                    onHoverEnd={() => setSelectedMessage(null)}
                  >
                    {!isMe && showAvatar && (
                      <div style={styles.messageAvatar}>
                        {me?.role === "owner" ? <FiUser size={16} /> : <FiHome size={16} />}
                      </div>
                    )}

                    <div style={{ maxWidth: "70%" }}>
                      {m.reply_to && (
                        <div style={styles.replyPreview}>
                          <div style={styles.replyText}>
                            Replying to: {m.reply_to.message}
                          </div>
                        </div>
                      )}

                      <div style={{
                        ...styles.messageBubble,
                        background: isMe 
                          ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                          : "#ffffff",
                        color: isMe ? "#ffffff" : "#1e293b",
                        marginLeft: !isMe && !showAvatar ? 40 : 0,
                      }}>
                        {m.message}
                        
                        {m.file_url && (
                          <div style={styles.fileAttachment}>
                            <FiImage size={20} />
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                              Attachment
                            </a>
                          </div>
                        )}
                      </div>

                      <div style={{
                        ...styles.messageMeta,
                        justifyContent: isMe ? "flex-end" : "flex-start",
                      }}>
                        <span style={styles.messageTime}>
                          {getMessageTime(m.created_at)}
                        </span>
                        {isMe && (
                          <span style={styles.messageStatus}>
                            {renderStatusIcon(m.status)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isMe && (
                      <AnimatePresence>
                        {selectedMessage === m.id && (
                          <motion.div 
                            style={styles.messageActions}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <motion.button
                              style={styles.actionButton}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteMessage(m.id)}
                            >
                              <FiTrash2 size={14} color="#ef4444" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div 
            style={styles.replyContainer}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
          >
            <div style={styles.replyContent}>
              <div style={styles.replyTo}>Replying to message</div>
              <div style={styles.replyMessage}>{replyTo.message}</div>
            </div>
            <motion.button
              style={styles.closeReply}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setReplyTo(null)}
            >
              <FiX size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div 
        style={styles.inputArea}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div style={styles.inputWrapper}>
          <motion.button
            style={styles.attachButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <FiPaperclip size={20} color="#64748b" />
          </motion.button>
          
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={uploadFile}
            accept="image/*,.pdf,.doc,.docx"
          />

          <motion.button
            style={styles.emojiButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FiSmile size={20} color="#64748b" />
          </motion.button>

          <input
            ref={inputRef}
            value={text}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            style={styles.input}
          />

          <motion.button
            onClick={sendMessage}
            style={{
              ...styles.sendButton,
              background: text.trim() ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "#e2e8f0",
            }}
            whileHover={text.trim() ? { scale: 1.1 } : {}}
            whileTap={text.trim() ? { scale: 0.9 } : {}}
            disabled={!text.trim()}
          >
            <FiSend size={20} color={text.trim() ? "#ffffff" : "#94a3b8"} />
          </motion.button>
        </div>

        {uploading && (
          <div style={styles.uploading}>
            <div style={styles.uploadingSpinner}></div>
            <span>Uploading...</span>
          </div>
        )}

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              style={styles.emojiPicker}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <EmojiPicker
                onEmojiClick={(emoji) => setText(prev => prev + emoji.emoji)}
                theme="light"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

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
    justifyContent: "space-between",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    zIndex: 10,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  backButton: {
    cursor: "pointer",
    color: "#2563eb",
    padding: 8,
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
  },

  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },

  userStatus: {
    fontSize: 13,
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
  },

  typingIndicator: {
    color: "#2563eb",
    fontSize: 12,
    marginLeft: 8,
    fontStyle: "italic",
  },

  headerRight: {
    display: "flex",
    gap: 8,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    color: "#2563eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },

  connectionStatus: {
    textAlign: "center",
    padding: "8px",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    scrollBehavior: "smooth",
  },

  dateHeader: {
    textAlign: "center",
    margin: "20px 0",
  },

  dateHeaderText: {
    background: "#e2e8f0",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },

  messageRow: {
    display: "flex",
    marginBottom: 16,
    position: "relative",
    alignItems: "flex-end",
    gap: 8,
  },

  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: 14,
    flexShrink: 0,
  },

  messageBubble: {
    padding: "12px 16px",
    borderRadius: 18,
    fontSize: 15,
    lineHeight: 1.5,
    wordWrap: "break-word",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },

  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    fontSize: 11,
    color: "#94a3b8",
  },

  messageTime: {
    fontSize: 11,
  },

  messageStatus: {
    display: "flex",
    alignItems: "center",
  },

  messageActions: {
    position: "absolute",
    right: -40,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    gap: 4,
  },

  actionButton: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "none",
    background: "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },

  fileAttachment: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    cursor: "pointer",
  },

  replyPreview: {
    marginBottom: 4,
    padding: "8px 12px",
    background: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    fontSize: 12,
    color: "#64748b",
    borderLeft: "3px solid #2563eb",
  },

  replyText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  replyContainer: {
    background: "#ffffff",
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  replyContent: {
    flex: 1,
  },

  replyTo: {
    fontSize: 12,
    color: "#2563eb",
    marginBottom: 4,
  },

  replyMessage: {
    fontSize: 14,
    color: "#1e293b",
  },

  closeReply: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  inputArea: {
    padding: "16px 20px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    position: "relative",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f1f5f9",
    borderRadius: 30,
    padding: "4px 4px 4px 16px",
  },

  attachButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emojiButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    padding: "12px 8px",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 15,
    color: "#1e293b",
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },

  uploading: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
  },

  uploadingSpinner: {
    width: 16,
    height: 16,
    border: "2px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  emojiPicker: {
    position: "absolute",
    bottom: 80,
    right: 20,
    zIndex: 20,
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
    color: "#2563eb",
  },

  loaderSpinner: {
    width: 40,
    height: 40,
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },
};

// Add keyframe animation to your global CSS
// @keyframes spin {
//   to { transform: rotate(360deg); }
// }