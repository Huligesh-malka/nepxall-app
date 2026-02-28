import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import socketManager from "../socket";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const loadMessages = useCallback(async (token, userId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [meRes, userRes, msgRes] = await Promise.all([
        api.get("/private-chat/me", config),
        api.get(`/private-chat/user/${userId}`, config),
        api.get(`/private-chat/messages/${userId}`, config),
      ]);

      setMe(meRes.data);
      setOtherUser(userRes.data);
      setMessages(msgRes.data);
      
      return meRes.data;
    } catch (err) {
      console.error("Failed to load messages:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe;

    const initializeChat = async (fbUser) => {
      if (!fbUser) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await fbUser.getIdToken();
        const meData = await loadMessages(token, userId);

        if (!mounted) return;

        // Connect socket with both Firebase UID and database ID
        const socket = socketManager.connect(fbUser.uid, meData.id);

        // Set up socket listeners
        socketManager.on("connect", () => {
          console.log("🟢 Socket connected in private chat");
          setConnected(true);
          
          // Join room after connection
          if (meData?.id && userId) {
            console.log("🚪 Joining room:", meData.id, userId);
            socketManager.emit("join_private_room", {
              userA: meData.id,
              userB: userId,
            });
          }
        });

        socketManager.on("disconnect", () => {
          console.log("🔴 Socket disconnected in private chat");
          setConnected(false);
        });

        socketManager.on("receive_private_message", (message) => {
          console.log("📩 Received message:", message);
          if (mounted) {
            // Always add message if it's for this chat
            if (message.sender_id === parseInt(userId) || 
                message.receiver_id === parseInt(userId)) {
              setMessages(prev => [...prev, message]);
              scrollToBottom();
            }
          }
        });

        socketManager.on("message_sent_confirmation", (message) => {
          console.log("✅ Message confirmed:", message);
          if (mounted) {
            setMessages(prev =>
              prev.map(m => 
                m.id === message.id ? { ...m, status: "delivered" } : m
              )
            );
          }
        });

        socketManager.on("user_typing", ({ userId: typingUserId, isTyping }) => {
          if (mounted && typingUserId === otherUser?.id) {
            setTyping(isTyping);
          }
        });

        setLoading(false);
        scrollToBottom();

      } catch (err) {
        console.error("Chat initialization failed:", err);
        if (mounted) {
          setError("Failed to load chat. Please refresh the page.");
          setLoading(false);
        }
      }
    };

    unsubscribe = onAuthStateChanged(auth, initializeChat);

    return () => {
      mounted = false;
      unsubscribe();
      
      // Clean up socket listeners
      socketManager.off("connect");
      socketManager.off("disconnect");
      socketManager.off("receive_private_message");
      socketManager.off("message_sent_confirmation");
      socketManager.off("user_typing");
      
      // Leave room
      if (me?.id && userId) {
        socketManager.emit("leave_private_room", {
          userA: me.id,
          userB: userId,
        });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, navigate, loadMessages, scrollToBottom, otherUser?.id]);

  const sendMessage = async () => {
    if (!text.trim() || !me || sending) return;

    const messageText = text.trim();
    setText("");
    setSending(true);

    try {
      const token = await auth.currentUser.getIdToken();
      
      const res = await api.post(
        "/private-chat/send",
        { receiver_id: userId, message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Message sent:", res.data);

      // Add sender's Firebase UID and receiver's Firebase UID to the message
      const messageWithIds = {
        ...res.data,
        sender_firebase_uid: me.firebase_uid,
        receiver_firebase_uid: otherUser?.firebase_uid
      };

      // Add to local state
      const newMessage = { ...messageWithIds, status: "sent" };
      setMessages(prev => [...prev, newMessage]);

      // Emit via socket with both IDs
      socketManager.emit("send_private_message", messageWithIds);

      scrollToBottom();
    } catch (err) {
      console.error("Send failed:", err);
      setError("Failed to send message. Please try again.");
      setText(messageText); // Restore text
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value) => {
    setText(value);

    if (!me || !otherUser) return;

    socketManager.emit("typing", {
      userA: me.id,
      userB: userId,
      userId: me.id, // Add userId for typing indicator
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketManager.emit("typing", {
        userA: me.id,
        userB: userId,
        userId: me.id,
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
        <CircularProgress sx={{ color: "#667eea" }} />
        <Typography sx={{ mt: 2, color: "#667eea" }}>
          Loading chat...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={chatContainer}>
      {/* Header */}
      <Box sx={header}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff" }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={headerAvatar}>
          {otherUser?.name?.charAt(0) || "U"}
        </Avatar>
        <Box sx={{ ml: 1, flex: 1 }}>
          <Typography sx={headerName}>{otherUser?.name || "User"}</Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: connected ? "#44b700" : "#ff4d4f",
                mr: 1,
              }}
            />
            <Typography sx={headerStatus}>
              {typing ? "Typing..." : (connected ? "Online" : "Offline")}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Messages */}
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
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                <Typography variant="body1" sx={{ wordWrap: "break-word" }}>
                  {msg.message}
                </Typography>
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
            <Paper sx={{ p: 2, background: "#f0f0f0", borderRadius: "20px" }}>
              <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </Typography>
            </Paper>
          </Box>
        )}
        
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box sx={inputContainer}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={connected ? "Type a message..." : "Connecting..."}
          variant="outlined"
          size="small"
          disabled={!connected || sending}
          sx={inputField}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!text.trim() || !connected || sending}
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
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f5f5",
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
    backgroundColor: "#f5f5f5",
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