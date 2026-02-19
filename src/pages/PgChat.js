import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

// Initialize socket outside or in a useMemo to prevent multiple connections
const socket = io("http://localhost:5000", { autoConnect: false });

const PgChat = () => {
  const { pgId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();

  const [messages, setMessages] = useState([]);
  const [pg, setPg] = useState(null);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  /* ================= LOAD DATA & AUTH ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return navigate("/login");

      try {
        const token = await firebaseUser.getIdToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch User Info, PG Details, and Message History
        const [meRes, pgRes, msgRes] = await Promise.all([
          api.get("/private-chat/me", config),
          api.get(`/pg/${pgId}`, config),
          api.get(`/pg-chat/messages/${pgId}`, config),
        ]);

        // FIX: Extract user data properly to ensure role is caught
        const userData = meRes.data.data || meRes.data;
        setUser(userData);
        setPg(pgRes.data.data || pgRes.data);

        // Load messages from DB for persistence
        const dbMessages = msgRes.data?.data || msgRes.data || [];
        setMessages(dbMessages);

        /* SOCKET CONNECTION */
        if (!socket.connected) socket.connect();
        socket.emit("join_pg_room", pgId);

        scrollBottom();
      } catch (err) {
        console.error("INIT ERROR", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      socket.disconnect();
    };
  }, [pgId, navigate, scrollBottom]);

  /* ================= SOCKET LISTENER ================= */
  useEffect(() => {
    socket.on("receive_pg_message", (msg) => {
      if (String(msg.pg_id) === String(pgId)) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === msg.id);
          return exists ? prev : [...prev, msg];
        });
        scrollBottom();
      }
    });

    return () => socket.off("receive_pg_message");
  }, [pgId, scrollBottom]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const token = await auth.currentUser.getIdToken();

      // 1. Save to Database first (Persistence)
      const res = await api.post(
        "/pg-chat/send",
        { pg_id: pgId, message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newMessage = res.data.data || res.data;

      // 2. Emit to others
      socket.emit("send_pg_message", newMessage);

      // 3. Update local UI
      setMessages((prev) => [...prev, newMessage]);
      setText("");
      scrollBottom();
    } catch (err) {
      console.error("SEND ERROR", err);
    }
  };

  if (loading) return <div style={styles.loading}>Loading community chat...</div>;

  // Crucial role check
  const isOwner = user?.role === "owner";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span onClick={() => navigate(-1)} style={styles.backArrow}>←</span>
        <div>
          <div style={{ fontSize: 16 }}>{pg?.pg_name || "Community Chat"}</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>PG ID: {pgId}</div>
        </div>
      </div>

      <div style={styles.body}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8' }}>No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={styles.msgCard}>
              <div style={styles.msgHeader}>
                <span style={styles.senderName}>{msg.sender_name}</span>
                {msg.sender_role === "owner" && <span style={styles.ownerBadge}>OWNER</span>}
              </div>
              <p style={styles.msgText}>{msg.message}</p>
              <span style={styles.msgTime}>{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* FOOTER LOGIC */}
      <div style={styles.footer}>
        {isOwner ? (
          <div style={styles.inputBox}>
            <input
              style={styles.input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message to tenants..."
            />
            <button style={styles.sendBtn} onClick={sendMessage}>Send</button>
          </div>
        ) : (
          <div style={styles.readOnly}>
            <span role="img" aria-label="lock">🔒</span> Read only – Only the owner can post here.
          </div>
        )}
      </div>
    </div>
  );
};

export default PgChat;

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" },
  header: { padding: "12px 16px", background: "#4f46e5", color: "#fff", fontWeight: "bold", display: "flex", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  backArrow: { cursor: "pointer", marginRight: 15, fontSize: 20 },
  body: { flex: 1, overflowY: "auto", padding: "15px 15px" },
  msgCard: { background: "#fff", padding: "10px 12px", borderRadius: "12px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", maxWidth: "85%" },
  msgHeader: { display: "flex", alignItems: "center", marginBottom: "4px" },
  senderName: { fontSize: "13px", fontWeight: "bold", color: "#4f46e5" },
  ownerBadge: { marginLeft: "6px", background: "#fef3c7", color: "#92400e", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "800" },
  msgText: { margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.4" },
  msgTime: { fontSize: "10px", color: "#94a3b8", display: "block", textAlign: "right", marginTop: "4px" },
  footer: { background: "#fff", borderTop: "1px solid #e2e8f0" },
  inputBox: { display: "flex", padding: "12px" },
  input: { flex: 1, padding: "10px 16px", borderRadius: "20px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" },
  sendBtn: { marginLeft: "10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "20px", padding: "0 20px", cursor: "pointer", fontWeight: "600" },
  readOnly: { padding: "15px", textAlign: "center", background: "#f1f5f9", color: "#64748b", fontSize: "13px" },
  loading: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontWeight: "bold" }
};