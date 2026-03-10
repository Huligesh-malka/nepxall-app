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

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationContext, setConversationContext] = useState(null);
  const [propertyId, setPropertyId] = useState(null);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  /* ================= AUTH LOAD ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return navigate("/login");

      const token = await fbUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        // Get current user info
        const meRes = await api.get("/private-chat/me", config);
        setMe(meRes.data);

        // Check if we have property ID from navigation state
        const navigationState = window.history.state?.usr;
        const contextPropertyId = navigationState?.propertyId;
        
        if (contextPropertyId) {
          setPropertyId(contextPropertyId);
        }

        // Get other user info with context
        let url = `/private-chat/user/${userId}?currentUserId=${meRes.data.id}`;
        if (contextPropertyId) {
          url += `&contextId=${contextPropertyId}`;
        }
        
        const userRes = await api.get(url, config);
        setOtherUser(userRes.data);

        // Store conversation context
        if (userRes.data.conversation_context) {
          setConversationContext(userRes.data.conversation_context);
        } else if (userRes.data.pg_name) {
          // Create context from pg_name if available
          setConversationContext({
            property_name: userRes.data.pg_name,
            property_id: userRes.data.property_id
          });
        }

        // Get messages
        const msgRes = await api.get(`/private-chat/messages/${userId}`, config);
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
      context: conversationContext
    });
  }, [me, userId, conversationContext]);

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
        prev.map(m =>
          m.id === msg.id ? { ...m, status: "delivered" } : m
        )
      );
    };

    const read = () => {
      setMessages(prev =>
        prev.map(m =>
          m.sender_id === me.id ? { ...m, status: "read" } : m
        )
      );
    };

    const deleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
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
    if (!text.trim()) return;

    const token = await auth.currentUser.getIdToken();

    const res = await api.post(
      "/private-chat/send",
      { 
        receiver_id: Number(userId), 
        message: text,
        context: conversationContext
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    socket.emit("send_private_message", res.data);
    setMessages(prev => [...prev, { ...res.data, status: "sent" }]);
    setText("");
    scrollBottom();
  };

  /* ================= DELETE ================= */
  const deleteMessage = async (id) => {
    const token = await auth.currentUser.getIdToken();

    await api.delete(`/private-chat/message/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setMessages(prev => prev.filter(m => m.id !== id));

    socket.emit("delete_private_message", {
      messageId: id,
      sender_id: me.id,
      receiver_id: Number(userId),
    });
  };

  const getStatusDot = (status) => {
    if (status === "sent")
      return <span style={{ ...styles.dot, background: "red" }} />;
    if (status === "delivered")
      return <span style={{ ...styles.dot, background: "gold" }} />;
    if (status === "read")
      return <span style={{ ...styles.dot, background: "limegreen" }} />;
    return null;
  };

  if (loading) return <div style={styles.loader}>Loading chat...</div>;

  // Determine the correct header title based on roles and conversation context
  const getHeaderTitle = () => {
    if (!me || !otherUser) return "Chat";

    // If current user is owner and other user is a regular user
    if (me.role === "owner" && otherUser.role === "user") {
      // Show user's name and the property they're interested in
      if (conversationContext?.property_name) {
        return (
          <div style={styles.headerTitleWithSub}>
            <div style={styles.name}>{otherUser.name || "User"}</div>
            <div style={styles.propertySubtext}>
              regarding {conversationContext.property_name}
            </div>
          </div>
        );
      }
      return <div style={styles.name}>{otherUser.name || "User"}</div>;
    }
    
    // If current user is user and other user is owner
    if (me.role === "user" && otherUser.role === "owner") {
      // Show owner's name and which property they own
      if (conversationContext?.property_name) {
        return (
          <div style={styles.headerTitleWithSub}>
            <div style={styles.name}>{conversationContext.property_name}</div>
            <div style={styles.propertySubtext}>
              Owner: {otherUser.name || "Owner"}
            </div>
          </div>
        );
      }
      
      // Try to get from otherUser.pg_name
      if (otherUser.pg_name) {
        return (
          <div style={styles.headerTitleWithSub}>
            <div style={styles.name}>{otherUser.pg_name}</div>
            <div style={styles.propertySubtext}>
              Owner: {otherUser.name || "Owner"}
            </div>
          </div>
        );
      }
      
      return <div style={styles.name}>{otherUser.name || "Owner"}</div>;
    }

    // Fallback
    return <div style={styles.name}>{otherUser.name || "Chat"}</div>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span onClick={() => navigate(-1)} style={styles.back}>←</span>
        <div style={styles.headerInfo}>
          {getHeaderTitle()}
          <div style={styles.status}>
            {online ? "🟢 online" : "⚪ offline"}
          </div>
        </div>
      </div>

      <div style={styles.chatBody}>
        {messages.map((m) => (
          <div key={m.id}
               style={{
                 ...styles.msgRow,
                 justifyContent: m.sender_id === me?.id ? "flex-end" : "flex-start",
               }}>
            <div style={{ position: "relative" }}>
              <div style={{
                ...styles.bubble,
                background: m.sender_id === me?.id
                  ? "linear-gradient(135deg,#667eea,#764ba2)"
                  : "#fff",
                color: m.sender_id === me?.id ? "#fff" : "#000",
              }}>
                {m.message}

                {m.sender_id === me?.id &&
                  <div style={styles.tick}>
                    {getStatusDot(m.status)}
                  </div>
                }
              </div>

              {m.sender_id === me?.id &&
                <span 
                  onClick={() => deleteMessage(m.id)} 
                  style={styles.deleteBtn}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  🗑
                </span>
              }
            </div>
          </div>
        ))}

        {typing && <div style={styles.typing}>Typing...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={styles.sendBtn}>➤</button>
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
    background: "#f1f5f9" 
  },

  header: {
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    color: "#fff",
    padding: "12px 15px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },

  back: { 
    cursor: "pointer", 
    fontSize: 24,
    padding: "5px 10px",
    borderRadius: "50%",
    transition: "background 0.3s",
    ':hover': {
      background: "rgba(255,255,255,0.1)"
    }
  },

  headerInfo: {
    flex: 1,
  },

  headerTitleWithSub: {
    display: "flex",
    flexDirection: "column",
  },

  propertySubtext: {
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
    fontStyle: "italic",
  },

  name: { 
    fontWeight: "bold",
    fontSize: 16,
  },

  status: { 
    fontSize: 12, 
    opacity: 0.9,
    marginTop: 2,
  },

  chatBody: { 
    flex: 1, 
    overflowY: "auto", 
    padding: 15,
    background: "#f1f5f9",
  },

  msgRow: { 
    display: "flex", 
    marginBottom: 10,
    animation: "fadeIn 0.3s ease",
  },

  bubble: {
    padding: "10px 14px",
    borderRadius: 15,
    maxWidth: "70%",
    position: "relative",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    wordWrap: "break-word",
  },

  tick: { 
    marginTop: 5, 
    textAlign: "right",
    fontSize: 10,
  },

  dot: {
    height: 8,
    width: 8,
    borderRadius: "50%",
    display: "inline-block",
    marginLeft: 2,
  },

  typing: { 
    fontSize: 12, 
    marginLeft: 10, 
    color: "#555",
    fontStyle: "italic",
    padding: "5px 10px",
  },

  deleteBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    cursor: "pointer",
    fontSize: 14,
    background: "#fff",
    borderRadius: "50%",
    padding: "2px 5px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    opacity: 0,
    transition: "opacity 0.2s",
    zIndex: 10,
  },

  inputArea: {
    display: "flex",
    padding: 10,
    background: "#fff",
    borderTop: "1px solid #eee",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 14,
    transition: "border-color 0.3s",
    ':focus': {
      borderColor: "#667eea",
    }
  },

  sendBtn: {
    marginLeft: 10,
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    color: "#fff",
    border: "none",
    padding: "0 18px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 16,
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 5px rgba(102,126,234,0.3)",
    ':hover': {
      transform: "scale(1.05)",
      boxShadow: "0 4px 10px rgba(102,126,234,0.4)",
    }
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 18,
    color: "#667eea",
    background: "#f1f5f9",
  },
};

// Add global styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);