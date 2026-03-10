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

  const { userId, pgId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  /* ================= AUTH + LOAD DATA ================= */

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (fbUser) => {

      if (!fbUser) {
        navigate("/login");
        return;
      }

      const token = await fbUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {

        const meRes = await api.get("/private-chat/me", config);
        setMe(meRes.data);

        const userRes = await api.get(
          `/private-chat/user/${userId}/${pgId}`,
          config
        );

        setOtherUser(userRes.data);

        const msgRes = await api.get(
          `/private-chat/messages/${userId}/${pgId}`,
          config
        );

        setMessages(msgRes.data);

        setLoading(false);

        scrollBottom();

        if (!socket.connected) socket.connect();

        socket.emit("register", fbUser.uid);

      } catch (err) {

        console.error("Chat load error:", err);
        setLoading(false);

      }

    });

    return () => unsub?.();

  }, [userId, pgId, navigate]);

  /* ================= JOIN SOCKET ROOM ================= */

  useEffect(() => {

    if (!me) return;

    socket.emit("join_private_room", {
      userA: me.id,
      userB: Number(userId),
      pg_id: Number(pgId),
    });

  }, [me, userId, pgId]);

  /* ================= SOCKET EVENTS ================= */

  useEffect(() => {

    const receiveMessage = (msg) => {

      if (msg.pg_id !== Number(pgId)) return;

      setMessages((prev) => [...prev, msg]);
      scrollBottom();

    };

    const deletedMessage = ({ messageId }) => {

      setMessages((prev) =>
        prev.filter((m) => m.id !== messageId)
      );

    };

    const readMessages = () => {

      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id === me?.id
            ? { ...m, status: "read" }
            : m
        )
      );

    };

    socket.on("receive_private_message", receiveMessage);
    socket.on("message_deleted", deletedMessage);
    socket.on("messages_read", readMessages);

    socket.on("user_online", () => setOnline(true));
    socket.on("user_offline", () => setOnline(false));

    socket.on("user_typing", ({ isTyping }) => setTyping(isTyping));

    return () => {

      socket.off("receive_private_message", receiveMessage);
      socket.off("message_deleted", deletedMessage);
      socket.off("messages_read", readMessages);
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("user_typing");

    };

  }, [me, pgId]);

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {

    if (!text.trim()) return;

    try {

      const token = await auth.currentUser.getIdToken();

      const res = await api.post(
        "/private-chat/send",
        {
          receiver_id: Number(userId),
          pg_id: Number(pgId),
          message: text,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      socket.emit("send_private_message", res.data);

      setMessages((prev) => [
        ...prev,
        { ...res.data, status: "sent" },
      ]);

      setText("");

      scrollBottom();

    } catch (err) {

      console.error("Send message error:", err);

    }

  };

  /* ================= DELETE MESSAGE ================= */

  const deleteMessage = async (id) => {

    try {

      const token = await auth.currentUser.getIdToken();

      await api.delete(`/private-chat/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) =>
        prev.filter((m) => m.id !== id)
      );

      socket.emit("delete_private_message", {
        messageId: id,
        sender_id: me.id,
        receiver_id: Number(userId),
        pg_id: Number(pgId),
      });

    } catch (err) {

      console.error("Delete message error:", err);

    }

  };

  if (loading) {
    return <div style={styles.loader}>Loading chat...</div>;
  }

  return (

    <div style={styles.container}>

      <div style={styles.header}>

        <span onClick={() => navigate(-1)} style={styles.back}>
          ←
        </span>

        <div style={styles.headerInfo}>

          <div style={styles.name}>
            {otherUser?.pg_name || otherUser?.name}
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
              justifyContent:
                m.sender_id === me.id
                  ? "flex-end"
                  : "flex-start",
            }}
          >

            <div style={styles.bubble}>

              {m.message}

              {m.sender_id === me.id && (
                <span
                  onClick={() => deleteMessage(m.id)}
                  style={styles.deleteBtn}
                >
                  🗑
                </span>
              )}

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
          placeholder="Type message..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage} style={styles.sendBtn}>
          ➤
        </button>

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
    background: "#f1f5f9",
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
  },

  headerInfo: {
    flex: 1,
  },

  name: {
    fontWeight: "bold",
    fontSize: 16,
  },

  status: {
    fontSize: 12,
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: 15,
  },

  msgRow: {
    display: "flex",
    marginBottom: 10,
  },

  bubble: {
    padding: "10px 14px",
    borderRadius: 15,
    maxWidth: "70%",
    background: "#fff",
    position: "relative",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },

  deleteBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    cursor: "pointer",
  },

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
  },

  sendBtn: {
    marginLeft: 10,
    background: "#667eea",
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

  typing: {
    fontSize: 12,
    color: "#555",
  },
};