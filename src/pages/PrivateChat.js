import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const SOCKET_URL = "https://nepxall-backend.onrender.com";
const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default function PrivateChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const typingTimeoutRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ================= SCROLL ================= */
  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    let unsubscribe;

    unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return navigate("/login");

      try {
        const token = await fbUser.getIdToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log("Loading chat data for user:", userId);

        const [meRes, userRes, msgRes] = await Promise.all([
          api.get("/private-chat/me", config),
          api.get(`/private-chat/user/${userId}`, config),
          api.get(`/private-chat/messages/${userId}`, config),
        ]);

        console.log("Me:", meRes.data);
        console.log("Other user:", userRes.data);
        console.log("Messages:", msgRes.data);

        setMe(meRes.data);
        setOtherUser(userRes.data);
        setMessages(msgRes.data);
        setLoading(false);

        /* SOCKET CONNECT */
        if (!socket.connected) {
          socket.connect();
        }

        /* REGISTER USER */
        socket.emit("register", fbUser.uid);

        /* JOIN ROOM */
        setTimeout(() => {
          socket.emit("join_private_room", {
            userA: meRes.data.id,
            userB: userId,
          });
          console.log("Joined room with:", meRes.data.id, userId);
        }, 500);

        scrollToBottom();
      } catch (err) {
        console.error("Chat load failed", err);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe?.();
      if (me) {
        socket.emit("leave_private_room", {
          userA: me.id,
          userB: userId,
        });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [userId]);

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      console.log("📩 Received message:", msg);
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    };

    const handleMessageConfirmation = (msg) => {
      console.log("✅ Message sent confirmation:", msg);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "delivered" } : m))
      );
    };

    const handleTyping = ({ isTyping }) => {
      setTyping(isTyping);
    };

    socket.on("receive_private_message", handleReceiveMessage);
    socket.on("message_sent_confirmation", handleMessageConfirmation);
    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("receive_private_message", handleReceiveMessage);
      socket.off("message_sent_confirmation", handleMessageConfirmation);
      socket.off("user_typing", handleTyping);
    };
  }, []);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !me) return;

    const messageText = text.trim();
    setText("");

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await api.post(
        "/private-chat/send",
        { receiver_id: userId, message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Message sent:", res.data);

      // Emit via socket
      socket.emit("send_private_message", res.data);

      // Add to local state
      setMessages((prev) => [...prev, { ...res.data, status: "sent" }]);
      scrollToBottom();
    } catch (err) {
      console.error("Send failed", err);
      setText(messageText); // Restore text on error
    }
  };

  /* ================= TYPING ================= */
  const handleTyping = (value) => {
    setText(value);

    if (!me || !otherUser) return;

    socket.emit("typing", {
      userA: me.id,
      userB: userId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        userA: me.id,
        userB: userId,
        isTyping: false,
      });
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box sx={loaderContainer}>
        <CircularProgress />
      </Box>
    );
  }

  /* ================= UI ================= */
  return (
    <Box sx={chatContainer}>
      {/* HEADER */}
      <Box sx={header}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff" }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={headerAvatar}>
          {otherUser?.name?.charAt(0) || "U"}
        </Avatar>
        <Box sx={{ ml: 1 }}>
          <Typography sx={headerName}>{otherUser?.name || "User"}</Typography>
          <Typography sx={headerStatus}>
            {typing ? "Typing..." : "Online"}
          </Typography>
        </Box>
      </Box>

      {/* MESSAGES */}
      <Box sx={messagesContainer}>
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === me?.id;
          return (
            <Box
              key={msg.id || index}
              sx={{
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
                mb: 2,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: "70%",
                  background: isMe
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#fff",
                  color: isMe ? "#fff" : "#000",
                  borderRadius: isMe
                    ? "20px 20px 5px 20px"
                    : "20px 20px 20px 5px",
                }}
              >
                <Typography variant="body1">{msg.message}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "right",
                    mt: 0.5,
                    opacity: 0.8,
                  }}
                >
                  {formatTime(msg.created_at)}
                  {isMe && (
                    <span style={{ marginLeft: 5 }}>
                      {msg.status === "delivered" ? "✓✓" : "✓"}
                    </span>
                  )}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        {typing && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Paper sx={{ p: 2, background: "#f0f0f0" }}>
              <Typography>Typing...</Typography>
            </Paper>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* INPUT */}
      <Box sx={inputContainer}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          variant="outlined"
          size="small"
          sx={inputField}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!text.trim()}
          sx={sendButton}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

/* ================= STYLES ================= */

const chatContainer = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f5f5f5",
};

const loaderContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const header = {
  display: "flex",
  alignItems: "center",
  p: 2,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const headerAvatar = {
  width: 40,
  height: 40,
  ml: 1,
  background: "#fff",
  color: "#667eea",
};

const headerName = {
  fontWeight: 600,
  fontSize: "1rem",
};

const headerStatus = {
  fontSize: "0.75rem",
  opacity: 0.9,
};

const messagesContainer = {
  flex: 1,
  overflowY: "auto",
  p: 3,
  background: "#f5f5f5",
};

const inputContainer = {
  display: "flex",
  p: 2,
  gap: 1,
  background: "#fff",
  borderTop: "1px solid #e0e0e0",
};

const inputField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "25px",
  },
};

const sendButton = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  "&:hover": {
    background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
  },
  "&:disabled": {
    background: "#ccc",
  },
  borderRadius: "50%",
  width: 48,
  height: 48,
};