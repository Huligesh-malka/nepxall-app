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

        // Get other user info with context (includes property info if owner is chatting)
        const userRes = await api.get(`/private-chat/user/${userId}?currentUserId=${meRes.data.id}`, config);
        setOtherUser(userRes.data);

        // Store conversation context (which property we're talking about)
        if (userRes.data.conversation_context) {
          setConversationContext(userRes.data.conversation_context);
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
      context: conversationContext // Include context when joining room
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
        context: conversationContext // Include context when sending message
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
      // Show user's name and the property they're interested in (if any)
      if (conversationContext?.property_name) {
        return (
          <div style={styles.headerTitleWithSub}>
            <div>{otherUser.name}</div>
            <div style={styles.propertySubtext}>
              regarding {conversationContext.property_name}
            </div>
          </div>
        );
      }
      return otherUser.name || "User";
    }
    
    // If current user is user and other user is owner
    if (me.role === "user" && otherUser.role === "owner") {
      // Show owner's name and which property they own (if we're chatting about a specific one)
      if (conversationContext?.property_name) {
        return (
          <div style={styles.headerTitleWithSub}>
            <div>{otherUser.pg_name || otherUser.name}</div>
            <div style={styles.propertySubtext}>
              {conversationContext.property_name}
            </div>
          </div>
        );
      }
      return otherUser.pg_name || otherUser.name || "Owner";
    }

    // Fallback
    return otherUser.name || "Chat";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span onClick={() => navigate(-1)} style={styles.back}>←</span>
        <div style={styles.headerInfo}>
          {typeof getHeaderTitle() === "string" ? (
            <div style={styles.name}>{getHeaderTitle()}</div>
          ) : (
            getHeaderTitle()
          )}
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
                <span onClick={() => deleteMessage(m.id)} style={styles.deleteBtn}>
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
  },

  back: { 
    cursor: "pointer", 
    fontSize: 20,
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
    padding: 15 
  },

  msgRow: { 
    display: "flex", 
    marginBottom: 10 
  },

  bubble: {
    padding: "10px 14px",
    borderRadius: 15,
    maxWidth: "70%",
    position: "relative",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },

  tick: { 
    marginTop: 5, 
    textAlign: "right" 
  },

  dot: {
    height: 8,
    width: 8,
    borderRadius: "50%",
    display: "inline-block",
  },

  typing: { 
    fontSize: 12, 
    marginLeft: 10, 
    color: "#555",
    fontStyle: "italic",
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
    ':hover': {
      opacity: 1,
    }
  },

  // Show delete button on hover of message bubble
  // This requires additional CSS but we'll handle it with inline styles limitation
  // You might want to add this in a CSS file

  inputArea: {
    display: "flex",
    padding: 10,
    background: "#fff",
    borderTop: "1px solid #eee",
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 14,
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
    transition: "transform 0.2s",
    ':hover': {
      transform: "scale(1.05)",
    }
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 18,
    color: "#667eea",
  },
};