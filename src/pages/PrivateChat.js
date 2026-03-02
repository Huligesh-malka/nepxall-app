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
  const chatBodyRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        scrollBottom();
      } catch (error) {
        console.error("Error loading chat:", error);
        navigate("/dashboard");
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
          m.sender_id === me.id ? { ...m, status: "read" } : m
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

  /* ================= TYPING INDICATOR ================= */
  useEffect(() => {
    let typingTimer;
    if (text && me) {
      socket.emit("typing", {
        senderId: me.id,
        receiverId: Number(userId),
        isTyping: true,
      });

      typingTimer = setTimeout(() => {
        socket.emit("typing", {
          senderId: me.id,
          receiverId: Number(userId),
          isTyping: false,
        });
      }, 1000);
    }

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
      if (me) {
        socket.emit("typing", {
          senderId: me.id,
          receiverId: Number(userId),
          isTyping: false,
        });
      }
    };
  }, [text, me, userId]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() && !imagePreview) return;

    setSending(true);
    const token = await auth.currentUser.getIdToken();

    try {
      const res = await api.post(
        "/private-chat/send",
        { 
          receiver_id: Number(userId), 
          message: text,
          reply_to: replyingTo?.id,
          image: imagePreview 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send_private_message", res.data);
      setMessages((prev) => [...prev, { ...res.data, status: "sent" }]);
      setText("");
      setReplyingTo(null);
      setImagePreview(null);
      scrollBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  /* ================= DELETE MESSAGE ================= */
  const deleteMessage = async (id) => {
    const token = await auth.currentUser.getIdToken();

    try {
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

  /* ================= HANDLE IMAGE UPLOAD ================= */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /* ================= FILTER MESSAGES ================= */
  const filteredMessages = messages.filter((msg) =>
    msg.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= RENDER MESSAGE BUBBLE ================= */
  const MessageBubble = ({ message }) => {
    const isMe = message.sender_id === me?.id;

    return (
      <div
        style={{
          ...styles.msgRow,
          justifyContent: isMe ? "flex-end" : "flex-start",
        }}
      >
        <div style={{ position: "relative", maxWidth: "70%" }}>
          {!isMe && (
            <div style={styles.otherUserAvatar}>
              {otherUser?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div
            style={{
              ...styles.bubble,
              background: isMe
                ? "linear-gradient(135deg, #667eea, #764ba2)"
                : "#ffffff",
              color: isMe ? "#fff" : "#2d3748",
              boxShadow: isMe
                ? "0 4px 15px rgba(102, 126, 234, 0.3)"
                : "0 2px 5px rgba(0,0,0,0.05)",
              marginLeft: isMe ? "auto" : "40px",
              marginRight: isMe ? "0" : "auto",
            }}
          >
            {message.reply_to && (
              <div style={styles.replyPreview}>
                Replying to: {message.reply_to.message?.substring(0, 30)}...
              </div>
            )}
            
            {message.image && (
              <img
                src={message.image}
                alt="attachment"
                style={styles.messageImage}
              />
            )}
            
            <div style={styles.messageContent}>{message.message}</div>
            
            <div style={styles.messageFooter}>
              <span style={styles.messageTime}>
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              
              {isMe && (
                <div style={styles.statusIndicator}>
                  {message.status === "sent" && (
                    <span style={{ ...styles.dot, background: "#9ca3af" }} />
                  )}
                  {message.status === "delivered" && (
                    <span style={{ ...styles.dot, background: "#fbbf24" }} />
                  )}
                  {message.status === "read" && (
                    <span style={{ ...styles.dot, background: "#34d399" }} />
                  )}
                </div>
              )}
            </div>
          </div>

          {isMe && (
            <div style={styles.messageActions}>
              <span
                onClick={() => deleteMessage(message.id)}
                style={styles.actionBtn}
                title="Delete"
              >
                🗑️
              </span>
              <span
                onClick={() => setReplyingTo(message)}
                style={styles.actionBtn}
                title="Reply"
              >
                ↩️
              </span>
            </div>
          )}
        </div>
      </div>
    );
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19L5 12L12 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {otherUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.userName}>{headerTitle}</div>
            <div style={styles.userStatus}>
              <span
                style={{
                  ...styles.statusDot,
                  background: online ? "#34d399" : "#9ca3af",
                }}
              />
              {online ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => setSearchTerm("")}
            style={styles.headerActionBtn}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2" />
              <path
                d="M21 21L17 17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {searchTerm !== "" && (
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            autoFocus
          />
          <button
            onClick={() => setSearchTerm("")}
            style={styles.searchClose}
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Body */}
      <div style={styles.chatBody} ref={chatBodyRef}>
        {filteredMessages.length === 0 ? (
          <div style={styles.emptyChat}>
            <div style={styles.emptyIcon}>💬</div>
            <h3 style={styles.emptyTitle}>No messages yet</h3>
            <p style={styles.emptyText}>
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {typing && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingDots}>
              <span style={styles.dot1}>.</span>
              <span style={styles.dot2}>.</span>
              <span style={styles.dot3}>.</span>
            </div>
            <span style={styles.typingText}>{otherUser?.name} is typing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div style={styles.replyContainer}>
          <div style={styles.replyContent}>
            <span style={styles.replyLabel}>Replying to:</span>
            <p style={styles.replyMessage}>
              {replyingTo.message?.substring(0, 50)}...
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            style={styles.replyClose}
          >
            ✕
          </button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div style={styles.imagePreviewContainer}>
          <img src={imagePreview} alt="preview" style={styles.imagePreview} />
          <button
            onClick={() => setImagePreview(null)}
            style={styles.imagePreviewClose}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputArea}>
        <div style={styles.inputActions}>
          <label htmlFor="image-upload" style={styles.actionButton}>
            📎
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={sending}
        />

        <button
          onClick={sendMessage}
          disabled={(!text.trim() && !imagePreview) || sending}
          style={{
            ...styles.sendBtn,
            opacity: (!text.trim() && !imagePreview) || sending ? 0.6 : 1,
          }}
        >
          {sending ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}

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
    color: "#fff",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },

  backBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.3s",
    ":hover": {
      background: "rgba(255, 255, 255, 0.1)",
    },
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
  },

  userName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },

  userStatus: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.8)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },

  headerActions: {
    display: "flex",
    gap: "8px",
  },

  headerActionBtn: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.3s",
    ":hover": {
      background: "rgba(255, 255, 255, 0.2)",
    },
  },

  searchBar: {
    background: "#fff",
    padding: "10px",
    display: "flex",
    gap: "10px",
    borderBottom: "1px solid #e2e8f0",
  },

  searchInput: {
    flex: 1,
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
  },

  searchClose: {
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    padding: "0 10px",
    fontSize: "18px",
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.95)",
  },

  emptyChat: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#a0aec0",
  },

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },

  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: "8px",
  },

  emptyText: {
    fontSize: "14px",
    color: "#718096",
  },

  msgRow: {
    display: "flex",
    marginBottom: "20px",
    animation: "fadeIn 0.3s ease",
  },

  otherUserAvatar: {
    position: "absolute",
    left: "-40px",
    bottom: "0",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
  },

  bubble: {
    padding: "12px 16px",
    borderRadius: "18px",
    maxWidth: "100%",
    position: "relative",
    transition: "transform 0.2s",
    ":hover": {
      transform: "scale(1.02)",
    },
  },

  replyPreview: {
    fontSize: "12px",
    padding: "4px 8px",
    background: "rgba(0, 0, 0, 0.05)",
    borderRadius: "8px",
    marginBottom: "8px",
    color: "#666",
  },

  messageImage: {
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
  },

  messageContent: {
    fontSize: "14px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },

  messageFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "6px",
    marginTop: "4px",
  },

  messageTime: {
    fontSize: "10px",
    opacity: 0.7,
  },

  statusIndicator: {
    display: "flex",
    gap: "2px",
  },

  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block",
  },

  messageActions: {
    position: "absolute",
    top: "-10px",
    right: "0",
    display: "flex",
    gap: "5px",
    opacity: 0,
    transition: "opacity 0.2s",
    ":hover": {
      opacity: 1,
    },
  },

  actionBtn: {
    background: "#fff",
    borderRadius: "50%",
    padding: "4px",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    fontSize: "12px",
    transition: "transform 0.2s",
    ":hover": {
      transform: "scale(1.1)",
    },
  },

  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px",
    marginLeft: "40px",
  },

  typingDots: {
    display: "flex",
    gap: "3px",
  },

  dot1: {
    animation: "typing 1.4s infinite",
    animationDelay: "0s",
  },

  dot2: {
    animation: "typing 1.4s infinite",
    animationDelay: "0.2s",
  },

  dot3: {
    animation: "typing 1.4s infinite",
    animationDelay: "0.4s",
  },

  typingText: {
    fontSize: "12px",
    color: "#718096",
  },

  replyContainer: {
    background: "#fff",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #e2e8f0",
  },

  replyContent: {
    flex: 1,
  },

  replyLabel: {
    fontSize: "12px",
    color: "#718096",
    marginRight: "8px",
  },

  replyMessage: {
    fontSize: "13px",
    color: "#2d3748",
    marginTop: "2px",
  },

  replyClose: {
    background: "none",
    border: "none",
    color: "#a0aec0",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
    ":hover": {
      color: "#4a5568",
    },
  },

  imagePreviewContainer: {
    position: "relative",
    padding: "10px 20px",
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
  },

  imagePreview: {
    maxWidth: "100px",
    maxHeight: "100px",
    borderRadius: "8px",
  },

  imagePreviewClose: {
    position: "absolute",
    top: "5px",
    right: "25px",
    background: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    fontSize: "14px",
  },

  inputArea: {
    display: "flex",
    padding: "15px 20px",
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
    gap: "10px",
  },

  inputActions: {
    display: "flex",
    gap: "5px",
  },

  actionButton: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px",
    transition: "transform 0.2s",
    ":hover": {
      transform: "scale(1.1)",
    },
  },

  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "25px",
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.3s",
    ":focus": {
      borderColor: "#667eea",
    },
  },

  sendBtn: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "45px",
    height: "45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px",
    transition: "transform 0.2s",
    ":hover": {
      transform: "scale(1.1)",
    },
    ":disabled": {
      cursor: "not-allowed",
    },
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
  },

  loaderSpinner: {
    width: "50px",
    height: "50px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },

  loaderText: {
    color: "#fff",
    fontSize: "16px",
  },
};

// Add keyframes for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }
`;
document.head.appendChild(style);