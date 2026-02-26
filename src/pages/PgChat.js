import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
});

const PrivateChat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!userId) {
      alert("Invalid user ID");
      navigate("/user/bookings");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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

        if (!socket.connected) socket.connect();

        socket.emit("join_private_room", {
          userA: meRes.data.id,
          userB: userId,
        });

      } catch (err) {
        console.error(err);
        alert("Chat load failed");
      }
    });

    return () => {
      unsubscribe();
      socket.disconnect();
    };
  }, [userId, navigate]);

  useEffect(() => {
    socket.on("receive_private_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive_private_message");
  }, []);

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

    socket.emit("send_private_message", res.data);

    setMessages((prev) => [...prev, res.data]);
    setText("");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>

      <div style={{ background: "#4f46e5", color: "#fff", padding: 12 }}>
        <span onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>←</span>
        <b style={{ marginLeft: 10 }}>{otherUser?.name}</b>
      </div>

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
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

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