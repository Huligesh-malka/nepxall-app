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

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  /* ================= LOAD ================= */
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

        if (!socket.connected) socket.connect();

        socket.emit("register", fbUser.uid);

        socket.emit("join_private_room", {
          userA: meRes.data.id,
          userB: userId,
        });

        scrollBottom();
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      unsub?.();
      socket.disconnect();
    };
  }, [userId]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    socket.on("receive_private_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollBottom();
    });

    socket.on("message_sent_confirmation", (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "✔✔" } : m))
      );
    });

    socket.on("user_typing", ({ isTyping }) => setTyping(isTyping));
    socket.on("user_online", () => setOnline(true));
    socket.on("user_offline", () => setOnline(false));

    return () => {
      socket.off("receive_private_message");
      socket.off("message_sent_confirmation");
      socket.off("user_typing");
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, []);

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const token = await auth.currentUser.getIdToken();

    const res = await api.post(
      "/private-chat/send",
      { receiver_id: userId, message: text },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    socket.emit("send_private_message", res.data);

    setMessages((prev) => [...prev, { ...res.data, status: "✔" }]);
    setText("");
    scrollBottom();
  };

  /* ================= TYPING ================= */
  const handleTyping = (value) => {
    setText(value);

    socket.emit("typing", {
      userA: me?.id,
      userB: userId,
      isTyping: true,
    });

    setTimeout(() => {
      socket.emit("typing", {
        userA: me?.id,
        userB: userId,
        isTyping: false,
      });
    }, 800);
  };

  if (loading) return <div style={styles.loader}>Loading chat...</div>;

  /* ================= UI ================= */
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <span onClick={() => navigate(-1)} style={styles.back}>←</span>

        <div>
          <div style={styles.name}>
            {otherUser?.pg_name
              ? `${otherUser.pg_name} • ${otherUser.name}`
              : otherUser?.name}
          </div>

          <div style={styles.status}>
            {online ? "🟢 online" : "⚪ offline"}
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div style={styles.chatBody}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...styles.msgRow,
              justifyContent:
                m.sender_id === me?.id ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.bubble,
                background:
                  m.sender_id === me?.id
                    ? "linear-gradient(135deg,#667eea,#764ba2)"
                    : "#fff",
                color: m.sender_id === me?.id ? "#fff" : "#000",
              }}
            >
              {m.message}

              {m.sender_id === me?.id && (
                <div style={styles.tick}>{m.status || "✔"}</div>
              )}
            </div>
          </div>
        ))}

        {typing && <div style={styles.typing}>Typing...</div>}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputArea}>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
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
  container: { height: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" },

  header: {
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    color: "#fff",
    padding: "12px 15px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  back: { cursor: "pointer", fontSize: 20 },

  name: { fontWeight: "bold" },
  status: { fontSize: 12, opacity: 0.9 },

  chatBody: { flex: 1, overflowY: "auto", padding: 15 },

  msgRow: { display: "flex", marginBottom: 10 },

  bubble: {
    padding: "10px 14px",
    borderRadius: 15,
    maxWidth: "70%",
    position: "relative",
  },

  tick: { fontSize: 10, marginTop: 5, textAlign: "right", opacity: 0.8 },

  typing: { fontSize: 12, marginLeft: 10, color: "#555" },

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
  },

  sendBtn: {
    marginLeft: 10,
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    color: "#fff",
    border: "none",
    padding: "0 18px",
    borderRadius: "50%",
    cursor: "pointer",
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};