import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  CircularProgress,
  Fade,
  Slide,
  Zoom,
  Tooltip,
  useTheme,
  alpha
} from "@mui/material";
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  AccessTime as PendingIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const socket = io("https://nepxall-backend.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
});

// Styled Components
const ChatContainer = styled(Box)(({ theme }) => ({
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
  position: "relative",
  overflow: "hidden"
}));

const Header = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: "#fff",
  borderRadius: 0,
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  zIndex: 10
}));

const ChatBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  "&::-webkit-scrollbar": {
    width: "6px"
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent"
  },
  "&::-webkit-scrollbar-thumb": {
    background: alpha(theme.palette.primary.main, 0.3),
    borderRadius: "3px"
  }
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "isOwn"
})(({ theme, isOwn }) => ({
  padding: theme.spacing(1.5, 2),
  maxWidth: "70%",
  wordWrap: "break-word",
  position: "relative",
  background: isOwn
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
    : theme.palette.background.paper,
  color: isOwn ? "#fff" : theme.palette.text.primary,
  borderRadius: isOwn ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
  }
}));

const StatusDot = styled(Box)(({ theme, status }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  display: "inline-block",
  marginLeft: theme.spacing(0.5),
  backgroundColor: 
    status === "online" ? "#4caf50" :
    status === "offline" ? "#9e9e9e" :
    status === "typing" ? "#ff9800" :
    status === "sent" ? "#ff6b6b" :
    status === "delivered" ? "#ffd93d" :
    status === "read" ? "#6bcf7f" : "#9e9e9e",
  animation: status === "typing" ? "pulse 1.5s infinite" : "none",
  "@keyframes pulse": {
    "0%": { opacity: 0.6, transform: "scale(1)" },
    "50%": { opacity: 1, transform: "scale(1.2)" },
    "100%": { opacity: 0.6, transform: "scale(1)" }
  }
}));

const InputArea = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.paper,
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
  zIndex: 10
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
  background: alpha(theme.palette.primary.main, 0.1),
  borderRadius: 20,
  width: "fit-content",
  marginLeft: theme.spacing(1),
  marginBottom: theme.spacing(1)
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: -10,
  right: -10,
  background: theme.palette.error.main,
  color: "#fff",
  padding: 4,
  opacity: 0,
  transition: "opacity 0.2s ease",
  "&:hover": {
    background: theme.palette.error.dark,
    transform: "scale(1.1)"
  }
}));

const MessageWrapper = styled(Box)({
  position: "relative",
  "&:hover .delete-btn": {
    opacity: 1
  }
});

export default function PrivateChat() {
  const theme = useTheme();
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const inputRef = useRef();
  const typingTimeoutRef = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (!me) return;
    
    if (isTyping) {
      socket.emit("typing", {
        userId: me.id,
        receiverId: Number(userId),
        isTyping: true
      });
    } else {
      socket.emit("typing", {
        userId: me.id,
        receiverId: Number(userId),
        isTyping: false
      });
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    if (!typingTimeoutRef.current) {
      handleTyping(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  /* ================= AUTH LOAD ================= */
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
        
        scrollBottom();
      } catch (error) {
        console.error("Error loading chat:", error);
        setLoading(false);
      }
    });

    return () => {
      unsub?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, navigate]);

  /* ================= JOIN ROOM ================= */
  useEffect(() => {
    if (!me) return;

    socket.emit("join_private_room", {
      userA: me.id,
      userB: Number(userId),
    });
  }, [me, userId]);

  /* ================= AUTO MARK READ ================= */
  useEffect(() => {
    if (!me) return;

    const hasUnread = messages.some(
      m => m.sender_id !== me.id && !m.is_read
    );

    if (hasUnread) {
      socket.emit("mark_messages_read", {
        userA: me.id,
        userB: Number(userId),
      });
    }
  }, [messages, me, userId]);

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {
    const receiveMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollBottom();
    };

    const delivered = (msg) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === msg.id ? { ...m, status: "delivered" } : m
        )
      );
    };

    const read = () => {
      setMessages(prev =>
        prev.map(m =>
          m.sender_id === me?.id ? { ...m, status: "read", is_read: true } : m
        )
      );
    };

    const deleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    socket.on("receive_private_message", receiveMessage);
    socket.on("message_sent_confirmation", delivered);
    socket.on("messages_read", read);
    socket.on("message_deleted", deleted);

    socket.on("user_online", () => setOnline(true));
    socket.on("user_offline", () => setOnline(false));
    socket.on("user_typing", ({ isTyping }) => setTyping(isTyping));

    return () => {
      socket.off("receive_private_message", receiveMessage);
      socket.off("message_sent_confirmation", delivered);
      socket.off("messages_read", read);
      socket.off("message_deleted", deleted);
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("user_typing");
    };
  }, [me]);

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    handleTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await api.post(
        "/private-chat/send",
        { receiver_id: Number(userId), message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send_private_message", res.data);
      setMessages(prev => [...prev, { ...res.data, status: "sent" }]);
      setText("");
      scrollBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteMessage = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken();

      await api.delete(`/private-chat/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(prev => prev.filter(m => m.id !== id));

      socket.emit("delete_private_message", {
        messageId: id,
        sender_id: me.id,
        receiver_id: Number(userId),
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const getMessageStatusIcon = (status) => {
    switch(status) {
      case "sent":
        return <CheckIcon sx={{ fontSize: 14, color: "#ff6b6b" }} />;
      case "delivered":
        return <DoneAllIcon sx={{ fontSize: 14, color: "#ffd93d" }} />;
      case "read":
        return <DoneAllIcon sx={{ fontSize: 14, color: "#6bcf7f" }} />;
      default:
        return <PendingIcon sx={{ fontSize: 14, color: "#9e9e9e" }} />;
    }
  };

  if (loading) {
    return (
      <ChatContainer>
        <Box sx={{ 
          height: "100%", 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          flexDirection: "column",
          gap: 2
        }}>
          <CircularProgress />
          <Typography variant="body1" color="textSecondary">
            Loading chat...
          </Typography>
        </Box>
      </ChatContainer>
    );
  }

  const headerTitle = me?.role === "owner"
    ? otherUser?.name || "User"
    : otherUser?.pg_name || otherUser?.name || "PG";

  const getAvatarText = () => {
    if (headerTitle) {
      return headerTitle.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <ChatContainer>
      <Header elevation={3}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ color: "#fff" }}
          size="large"
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <StatusDot 
              status={online ? "online" : "offline"} 
              sx={{ 
                border: "2px solid #fff",
                width: 12,
                height: 12
              }} 
            />
          }
        >
          <Avatar 
            sx={{ 
              bgcolor: alpha("#fff", 0.2),
              color: "#fff",
              fontWeight: "bold"
            }}
          >
            {getAvatarText()}
          </Avatar>
        </Badge>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {headerTitle}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 0.5 }}>
            {typing ? (
              <>
                <StatusDot status="typing" />
                Typing...
              </>
            ) : (
              <>
                <StatusDot status={online ? "online" : "offline"} />
                {online ? "Online" : "Offline"}
              </>
            )}
          </Typography>
        </Box>
      </Header>

      <ChatBody>
        {messages.map((m, index) => {
          const isOwn = m.sender_id === me?.id;
          const showAvatar = index === 0 || messages[index - 1]?.sender_id !== m.sender_id;
          
          return (
            <Slide 
              direction={isOwn ? "left" : "right"} 
              in={true} 
              key={m.id}
              timeout={300}
            >
              <Box sx={{
                display: "flex",
                justifyContent: isOwn ? "flex-end" : "flex-start",
                mb: 1
              }}>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                  {!isOwn && showAvatar && (
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.secondary.main
                      }}
                    >
                      {otherUser?.name?.charAt(0) || "U"}
                    </Avatar>
                  )}
                  
                  <MessageWrapper>
                    <MessageBubble isOwn={isOwn}>
                      <Typography variant="body1">
                        {m.message}
                      </Typography>
                      
                      <Box sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.5
                      }}>
                        <Typography variant="caption" sx={{
                          color: isOwn ? alpha("#fff", 0.7) : alpha("#000", 0.5)
                        }}>
                          {new Date(m.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                        
                        {isOwn && getMessageStatusIcon(m.status)}
                      </Box>
                    </MessageBubble>

                    {isOwn && (
                      <Zoom in={true}>
                        <DeleteButton
                          className="delete-btn"
                          size="small"
                          onClick={() => deleteMessage(m.id)}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </DeleteButton>
                      </Zoom>
                    )}
                  </MessageWrapper>

                  {isOwn && showAvatar && (
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.primary.main
                      }}
                    >
                      {me?.name?.charAt(0) || "M"}
                    </Avatar>
                  )}
                </Box>
              </Box>
            </Slide>
          );
        })}

        {typing && (
          <Fade in={true}>
            <TypingIndicator>
              <StatusDot status="typing" />
              <StatusDot status="typing" sx={{ animationDelay: "0.2s" }} />
              <StatusDot status="typing" sx={{ animationDelay: "0.4s" }} />
              <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
                {otherUser?.name?.split(' ')[0] || "User"} is typing...
              </Typography>
            </TypingIndicator>
          </Fade>
        )}
        
        <div ref={bottomRef} />
      </ChatBody>

      <InputArea elevation={3}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            multiline
            maxRows={4}
            inputRef={inputRef}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                },
                "&.Mui-focused": {
                  backgroundColor: "#fff",
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                }
              }
            }}
          />
          
          <Tooltip title="Send message" arrow>
            <IconButton
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: "#fff",
                width: 48,
                height: 48,
                "&:hover": {
                  transform: "scale(1.1)",
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                },
                "&.Mui-disabled": {
                  background: alpha(theme.palette.grey[500], 0.3),
                  color: alpha("#fff", 0.5)
                }
              }}
            >
              {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </InputArea>
    </ChatContainer>
  );
}