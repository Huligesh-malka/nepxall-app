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

  /* IMPORTANT: add pgId */
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

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  /* ================= AUTH LOAD ================= */
  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (fbUser) => {

      if (!fbUser) return navigate("/login");

      const token = await fbUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {

        const meRes = await api.get("/private-chat/me", config);
        setMe(meRes.data);

        /* get user + pg info */
        const userRes = await api.get(
          `/private-chat/user/${userId}/${pgId}`,
          config
        );

        setOtherUser(userRes.data);

        /* load messages using pgId */
        const msgRes = await api.get(
          `/private-chat/messages/${userId}/${pgId}`,
          config
        );

        setMessages(msgRes.data);

        setLoading(false);

        if (!socket.connected) socket.connect();
        socket.emit("register", fbUser.uid);

      } catch (err) {
        console.error(err);
        setLoading(false);
      }

    });

    return () => unsub?.();

  }, [userId, pgId, navigate]);

  /* ================= JOIN ROOM ================= */
  useEffect(() => {

    if (!me) return;

    socket.emit("join_private_room", {
      userA: me.id,
      userB: Number(userId),
      pg_id: Number(pgId)
    });

  }, [me, userId, pgId]);

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {

    const receiveMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollBottom();
    };

    const read = () => {
      setMessages(prev =>
        prev.map(m =>
          m.sender_id === me.id
            ? { ...m, status: "read" }
            : m
        )
      );
    };

    const deleted = ({ messageId }) => {
      setMessages(prev =>
        prev.filter(m => m.id !== messageId)
      );
    };

    socket.on("receive_private_message", receiveMessage);
    socket.on("messages_read", read);
    socket.on("message_deleted", deleted);

    socket.on("user_online", () => setOnline(true));
    socket.on("user_offline", () => setOnline(false));

    socket.on("user_typing", ({ isTyping }) => setTyping(isTyping));

    return () => {
      socket.off("receive_private_message");
      socket.off("messages_read");
      socket.off("message_deleted");
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
        pg_id: Number(pgId),  // IMPORTANT
        message: text
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
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
      pg_id: Number(pgId)
    });

  };

  if (loading) return <div>Loading chat...</div>;

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <span onClick={() => navigate(-1)} style={styles.back}>←</span>

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

        {messages.map(m => (

          <div
            key={m.id}
            style={{
              ...styles.msgRow,
              justifyContent:
                m.sender_id === me.id
                  ? "flex-end"
                  : "flex-start"
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

        {typing && <div>Typing...</div>}

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

        <button
          onClick={sendMessage}
          style={styles.sendBtn}
        >
          ➤
        </button>

      </div>

    </div>
  );
}

/* styles unchanged */