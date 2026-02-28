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

  /* ================= SCROLL ================= */
  const scrollBottom = () =>
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    let unsubscribe;

    unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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

        /* SOCKET CONNECT */
        if (!socket.connected) socket.connect();

        /* REGISTER USER */
        socket.emit("register", fbUser.uid);

        /* JOIN ROOM */
        socket.emit("join_private_room", {
          userA: meRes.data.id,
          userB: userId,
        });

        /* MARK AS READ */
        socket.emit("mark_messages_read", {
          userA: meRes.data.id,
          userB: userId,
        });

        scrollBottom();
      } catch (err) {
        console.error("Chat load failed", err);
      }
    });

    return () => {
      unsubscribe?.();
      socket.emit("leave_private_room", {
        userA: me?.id,
        userB: userId,
      });
      socket.disconnect();
    };
  }, [userId]);

  /* ================= SOCKET LISTENERS ================= */
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

    socket.on("user_typing", ({ isTyping }) => {
      setTyping(isTyping);
    });

    return () => {
      socket.off("receive_private_message");
      socket.off("message_sent_confirmation");
      socket.off("user_typing");
    };
  }, []);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
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
    } catch (err) {
      console.error("Send failed", err);
    }
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
    }, 1000);
  };

  /* ================= UI ================= */
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div style={{ background: "#4f46e5", color: "#fff", padding: 12 }}>
        <span onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
          ←
        </span>
        <b style={{ marginLeft: 10 }}>{otherUser?.name}</b>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: 15 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.sender_id === me?.id ? "right" : "left",
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
              {m.sender_id === me?.id && (
                <div style={{ fontSize: 10 }}>{m.status || "✔"}</div>
              )}
            </span>
          </div>
        ))}

        {typing && <div>Typing...</div>}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", padding: 10 }}>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}