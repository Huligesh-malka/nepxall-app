import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
  withCredentials: true,
});

const PrivateChat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  /* ================= LOAD CHAT ================= */
  useEffect(() => {
    let mounted = true;

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

        if (!mounted) return;

        setMe(meRes.data);
        setOtherUser(userRes.data);
        setMessages(msgRes.data);

        /* ✅ CONNECT SOCKET */
        if (!socket.connected) socket.connect();

        /* ✅ REGISTER USER */
        socket.emit("register", fbUser.uid);

        /* ✅ JOIN ROOM WITH MYSQL IDS */
        socket.emit("join_private_room", {
          userA: meRes.data.id,
          userB: userId,
        });

        scrollBottom();
      } catch (err) {
        console.error(err);
        alert("Chat load failed");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;

      /* ✅ LEAVE ROOM ONLY */
      if (me?.id && userId) {
        socket.emit("leave_private_room", {
          userA: me.id,
          userB: userId,
        });
      }

      unsub();
    };
  }, [userId, navigate]);

  /* ================= RECEIVE REALTIME ================= */
  useEffect(() => {
    socket.on("receive_private_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollBottom();
    });

    return () => socket.off("receive_private_message");
  }, []);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const token = await auth.currentUser.getIdToken();

    const res = await api.post(
      "/private-chat/send",
      {
        receiver_id: userId,
        message: text,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    /* ✅ EMIT REALTIME */
    socket.emit("send_private_message", {
      ...res.data,
      sender_id: me.id,
      receiver_id: userId,
    });

    setMessages((prev) => [...prev, res.data]);
    setText("");
    scrollBottom();
  };

  if (loading) return <div>Loading chat...</div>;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER */}
      <div style={{ background: "#4f46e5", color: "#fff", padding: 12 }}>
        <span onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>←</span>
        <b style={{ marginLeft: 10 }}>{otherUser?.name}</b>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: 15 }}>
        {messages.map((m) => (
          <div
            key={m.id || Math.random()}
            style={{
              textAlign: m.sender_id === me.id ? "right" : "left",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                background: "#fff",
                padding: 10,
                borderRadius: 10,
                display: "inline-block",
              }}
            >
              {m.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", padding: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default PrivateChat;