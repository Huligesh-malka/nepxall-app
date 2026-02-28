import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const SOCKET_URL = "https://nepxall-backend.onrender.com";
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
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
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validate userId
    if (!userId || userId === "undefined" || userId === "null") {
      alert("Invalid user ID");
      navigate("/user/bookings");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await fbUser.getIdToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // First get current user info
        const meRes = await api.get("/private-chat/me", config);
        setMe(meRes.data);

        // Then get other user info
        let userRes;
        try {
          userRes = await api.get(`/private-chat/user/${userId}`, config);
        } catch (err) {
          console.error("User not found:", err);
          alert("User not found");
          navigate("/user/bookings");
          return;
        }

        if (!userRes.data) {
          alert("User not found");
          navigate("/user/bookings");
          return;
        }

        setOtherUser(userRes.data);

        // Load messages
        const msgRes = await api.get(`/private-chat/messages/${userId}`, config);
        setMessages(msgRes.data);

        // Setup socket connection
        if (!socket.connected) {
          socket.connect();
          
          // Register user with socket
          socket.emit("register", fbUser.uid);
          
          // Join private room
          socket.emit("join_private_room", {
            userA: meRes.data.id,
            userB: parseInt(userId),
          });
        }

      } catch (err) {
        console.error("Error loading chat:", err);
        setError("Failed to load chat. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    // Socket event listeners
    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("receive_private_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      unsubscribe();
      if (socket.connected) {
        socket.emit("leave_private_room", {
          userA: me?.id,
          userB: parseInt(userId),
        });
        socket.disconnect();
      }
      socket.off("receive_private_message");
    };
  }, [userId, navigate]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !me?.id || !userId) return;

    try {
      const token = await auth.currentUser.getIdToken();
      
      const res = await api.post(
        "/private-chat/send",
        {
          receiver_id: userId,
          message: text.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emit via socket
      if (socket.connected) {
        socket.emit("send_private_message", res.data);
      }

      // Add to local state
      setMessages((prev) => [...prev, res.data]);
      setText("");
      
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "#f0f2f5"
      }}>
        <div>Loading chat...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "#f0f2f5"
      }}>
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
        <button 
          onClick={() => navigate("/user/bookings")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Go Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      backgroundColor: "#f0f2f5" 
    }}>
      {/* Header */}
      <div style={{ 
        background: "#4f46e5", 
        color: "#fff", 
        padding: "12px 16px",
        display: "flex",
        alignItems: "center"
      }}>
        <span 
          onClick={() => navigate(-1)} 
          style={{ 
            cursor: "pointer", 
            fontSize: "24px",
            marginRight: "12px"
          }}
        >
          ←
        </span>
        <b style={{ fontSize: "18px" }}>
          {otherUser?.name || "User"}
        </b>
        {!socket.connected && (
          <span style={{ 
            marginLeft: "auto", 
            fontSize: "12px", 
            background: "rgba(255,255,255,0.2)",
            padding: "4px 8px",
            borderRadius: "4px"
          }}>
            Reconnecting...
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        padding: "15px",
        display: "flex",
        flexDirection: "column"
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            color: "#666",
            marginTop: "20px"
          }}>
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                textAlign: m.sender_id === me?.id ? "right" : "left",
                marginBottom: "10px",
                maxWidth: "70%",
                alignSelf: m.sender_id === me?.id ? "flex-end" : "flex-start"
              }}
            >
              <span
                style={{
                  background: m.sender_id === me?.id ? "#4f46e5" : "#fff",
                  color: m.sender_id === me?.id ? "#fff" : "#000",
                  padding: "10px 15px",
                  borderRadius: "15px",
                  borderBottomRightRadius: m.sender_id === me?.id ? "5px" : "15px",
                  borderBottomLeftRadius: m.sender_id === me?.id ? "15px" : "5px",
                  display: "inline-block",
                  wordBreak: "break-word"
                }}
              >
                {m.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ 
        display: "flex", 
        padding: "10px",
        backgroundColor: "#fff",
        borderTop: "1px solid #e0e0e0"
      }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ 
            flex: 1,
            padding: "12px",
            border: "1px solid #e0e0e0",
            borderRadius: "25px",
            outline: "none",
            fontSize: "16px",
            marginRight: "10px"
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={!text.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: text.trim() ? "#4f46e5" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: text.trim() ? "pointer" : "not-allowed",
            fontSize: "16px"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default PrivateChat;