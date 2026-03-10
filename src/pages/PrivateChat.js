import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
});

export default function PrivateChat() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const pgId = searchParams.get("pgId");
  
  const navigate = useNavigate();
  const bottomRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  /* ================= LOAD CHAT ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return navigate("/login");

      const token = await fbUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        // Load current user
        const meRes = await api.get("/private-chat/me", config);
        setMe(meRes.data);

        // Load other user info with optional pgId as query param
        const userUrl = pgId 
          ? `/private-chat/user/${userId}?pgId=${pgId}`
          : `/private-chat/user/${userId}`;
        
        console.log("Fetching user from:", userUrl);
        const userRes = await api.get(userUrl, config);
        setOtherUser(userRes.data);

        // Load messages with optional pgId as query param
        const messagesUrl = pgId
          ? `/private-chat/messages/${userId}?pgId=${pgId}`
          : `/private-chat/messages/${userId}`;
        
        console.log("Fetching messages from:", messagesUrl);
        const msgRes = await api.get(messagesUrl, config);
        setMessages(msgRes.data);

        // Connect socket
        if (!socket.connected) {
          socket.connect();
          socket.emit("register", fbUser.uid);
        }

        scrollBottom();
      } catch (err) {
        console.error("Chat load error:", err);
        if (err.response?.status === 404) {
          navigate("/owner/chat");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [userId, pgId, navigate]);

  /* ================= JOIN ROOM ================= */
  useEffect(() => {
    if (!me || !otherUser) return;

    const roomData = {
      userA: me.id,
      userB: Number(userId),
      pgId: pgId ? Number(pgId) : otherUser.pg_id
    };

    console.log("Joining room:", roomData);
    socket.emit("join_private_room", roomData);

    return () => {
      socket.emit("leave_private_room", roomData);
    };
  }, [me, userId, otherUser, pgId]);

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {
    const receiveMessage = (msg) => {
      console.log("Received message:", msg);
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

  /* ================= AUTO READ ================= */
  useEffect(() => {
    if (!me || !otherUser) return;

    const hasUnread = messages.some(
      m => m.sender_id !== me.id && !m.is_read
    );

    if (hasUnread) {
      socket.emit("mark_messages_read", {
        userA: me.id,
        userB: Number(userId),
        pgId: pgId ? Number(pgId) : otherUser.pg_id
      });
    }
  }, [messages, me, userId, otherUser, pgId]);

  /* ================= TYPING INDICATOR ================= */
  useEffect(() => {
    if (!me || !otherUser) return;

    const typingTimeout = setTimeout(() => {
      socket.emit("typing", {
        userA: me.id,
        userB: Number(userId),
        pgId: pgId ? Number(pgId) : otherUser.pg_id,
        isTyping: false
      });
    }, 1000);

    return () => clearTimeout(typingTimeout);
  }, [text, me, userId, otherUser, pgId]);

  const handleTyping = (e) => {
    setText(e.target.value);
    
    if (!typing && me && otherUser) {
      socket.emit("typing", {
        userA: me.id,
        userB: Number(userId),
        pgId: pgId ? Number(pgId) : otherUser.pg_id,
        isTyping: true
      });
    }
  };

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!text.trim() || sending || !me || !otherUser) return;

    setSending(true);
    
    try {
      const token = await auth.currentUser.getIdToken();
      
      const messageData = {
        receiver_id: Number(userId),
        message: text,
        pg_id: pgId ? Number(pgId) : otherUser.pg_id
      };

      console.log("Sending message:", messageData);

      const res = await api.post(
        "/private-chat/send",
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send_private_message", res.data);
      setMessages(prev => [...prev, { ...res.data, status: "sent" }]);
      setText("");
      scrollBottom();
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteMessage = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken();
      
      await api.delete(`/private-chat/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => prev.filter(m => m.id !== id));

      socket.emit("delete_private_message", {
        messageId: id,
        sender_id: me.id,
        receiver_id: Number(userId),
      });
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  /* ================= HEADER TITLE ================= */
  const getHeaderTitle = () => {
    if (!otherUser) return "Chat";

    if (otherUser.pg_name) {
      return (
        <div>
          <div>{otherUser.name}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {otherUser.pg_name}
          </div>
        </div>
      );
    }

    return otherUser.name || "Chat";
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div style={styles.loader}>
        Loading chat...
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span onClick={() => navigate(-1)} style={styles.back}>
          ←
        </span>
        <div style={styles.headerInfo}>
          <div style={styles.name}>
            {getHeaderTitle()}
          </div>
          <div style={styles.status}>
            {online ? "🟢 online" : "⚪ offline"}
          </div>
        </div>
      </div>

      <div style={styles.chatBody}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...styles.msgRow,
              justifyContent: m.sender_id === me?.id ? "flex-end" : "flex-start"
            }}
          >
            <div style={styles.bubble}>
              {m.message}
              {m.sender_id === me?.id && (
                <span
                  onClick={() => deleteMessage(m.id)}
                  style={styles.deleteBtn}
                >
                  🗑
                </span>
              )}
              {m.sender_id === me?.id && m.status && (
                <span style={styles.statusIcon}>
                  {m.status === "sent" && "✓"}
                  {m.status === "delivered" && "✓✓"}
                  {m.status === "read" && "✓✓"}
                </span>
              )}
            </div>
          </div>
        ))}
        
        {typing && (
          <div style={styles.typingIndicator}>
            {otherUser?.name} is typing...
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <input
          value={text}
          onChange={handleTyping}
          placeholder="Type message..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          style={{
            ...styles.sendBtn,
            opacity: sending ? 0.5 : 1,
            cursor: sending ? "not-allowed" : "pointer"
          }}
          disabled={sending}
        >
          {sending ? "..." : "➤"}
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
    background: "#f1f5f9"
  },
  header: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    padding: "12px 15px",
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  back: {
    cursor: "pointer",
    fontSize: 20
  },
  headerInfo: {
    flex: 1
  },
  name: {
    fontWeight: "bold",
    fontSize: 16
  },
  status: {
    fontSize: 12
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
    background: "#fff",
    position: "relative"
  },
  deleteBtn: {
    marginLeft: 10,
    cursor: "pointer",
    opacity: 0.6,
    fontSize: 12
  },
  statusIcon: {
    marginLeft: 5,
    fontSize: 12,
    color: "#4a90e2"
  },
  typingIndicator: {
    padding: "5px 10px",
    color: "#666",
    fontStyle: "italic",
    fontSize: 12
  },
  inputArea: {
    display: "flex",
    padding: 10,
    background: "#fff"
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "1px solid #ddd",
    outline: "none"
  },
  sendBtn: {
    marginLeft: 10,
    padding: "0 16px",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    cursor: "pointer"
  },
  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
};