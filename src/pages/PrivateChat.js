import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

const PrivateChat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const socketRef = useRef();
  const [isConnected, setIsConnected] = useState(false);

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef();

  // Initialize socket connection
  const initSocket = useCallback(async (token, userId) => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      
      // Register user
      socketRef.current.emit("register", userId);
      
      // Join private room if we have both users
      if (me?.id && userId) {
        socketRef.current.emit("join_private_room", {
          userA: me.id,
          userB: parseInt(userId)
        });
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketRef.current.on("receive_private_message", (message) => {
      console.log("Received message:", message);
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    });

    socketRef.current.on("message_sent_confirmation", (message) => {
      console.log("Message sent confirmation:", message);
      // Update message status if needed
    });

    socketRef.current.on("user_typing", ({ userId: typingUserId, isTyping: typing }) => {
      if (typingUserId !== me?.id) {
        setOtherUserTyping(typing);
      }
    });

    socketRef.current.on("user_joined_private", ({ userId: joinedUserId }) => {
      console.log(`User ${joinedUserId} joined the chat`);
    });

    socketRef.current.on("user_left_private", ({ userId: leftUserId }) => {
      console.log(`User ${leftUserId} left the chat`);
    });

    socketRef.current.on("messages_read", ({ userId: readerId, messageIds }) => {
      // Update message status if needed
    });

    socketRef.current.on("message_error", ({ error }) => {
      console.error("Socket error:", error);
      alert("Failed to send message: " + error);
    });

    socketRef.current.connect();
  }, [me, userId]);

  // Load initial data
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
        // Load user data and messages
        const [meRes, userRes, msgRes] = await Promise.all([
          api.get("/private-chat/me", config),
          api.get(`/private-chat/user/${userId}`, config),
          api.get(`/private-chat/messages/${userId}`, config),
        ]);

        setMe(meRes.data);
        setOtherUser(userRes.data);
        setMessages(msgRes.data);

        // Initialize socket after we have user data
        await initSocket(token, fbUser.uid);
        
      } catch (err) {
        console.error("Error loading chat:", err);
        alert("Failed to load chat");
        navigate("/user/bookings");
      }
    });

    return () => {
      unsubscribe();
      if (socketRef.current) {
        // Leave private room before disconnecting
        if (me?.id && userId) {
          socketRef.current.emit("leave_private_room", {
            userA: me.id,
            userB: parseInt(userId)
          });
        }
        socketRef.current.disconnect();
      }
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, navigate, initSocket, me?.id]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleTyping = (e) => {
    setText(e.target.value);
    
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      if (socketRef.current?.connected && me?.id && userId) {
        socketRef.current.emit("typing", {
          userA: me.id,
          userB: parseInt(userId),
          isTyping: true
        });
      }
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        if (socketRef.current?.connected && me?.id && userId) {
          socketRef.current.emit("typing", {
            userA: me.id,
            userB: parseInt(userId),
            isTyping: false
          });
        }
      }
    }, 1000);
  };

  // Send message
  const sendMessage = async () => {
    if (!text.trim() || !me?.id || !userId) return;

    try {
      const token = await auth.currentUser.getIdToken();
      
      // First save to database
      const res = await api.post(
        "/private-chat/send",
        {
          receiver_id: userId,
          message: text.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Then emit via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit("send_private_message", res.data);
      }

      // Add to local state
      setMessages((prev) => [...prev, res.data]);
      setText("");
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketRef.current?.emit("typing", {
          userA: me.id,
          userB: parseInt(userId),
          isTyping: false
        });
      }
      
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && me?.id && userId && socketRef.current?.connected) {
      const unreadMessages = messages
        .filter(m => m.sender_id === parseInt(userId) && !m.is_read)
        .map(m => m.id);
      
      if (unreadMessages.length > 0) {
        socketRef.current.emit("mark_messages_read", {
          userA: me.id,
          userB: parseInt(userId),
          messageIds: unreadMessages
        });
      }
    }
  }, [messages, me?.id, userId]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5" }}>
      {/* Header */}
      <div style={{ 
        background: "#4f46e5", 
        color: "#fff", 
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
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
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: "18px" }}>{otherUser?.name || "Loading..."}</b>
          {otherUserTyping && (
            <div style={{ fontSize: "12px", opacity: 0.8 }}>typing...</div>
          )}
        </div>
        {!isConnected && (
          <div style={{ fontSize: "12px", opacity: 0.8 }}>Connecting...</div>
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
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.sender_id === me?.id ? "right" : "left",
              marginBottom: "10px",
              maxWidth: "70%",
              alignSelf: m.sender_id === me?.id ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                background: m.sender_id === me?.id ? "#4f46e5" : "#fff",
                color: m.sender_id === me?.id ? "#fff" : "#000",
                padding: "10px 15px",
                borderRadius: "15px",
                borderBottomRightRadius: m.sender_id === me?.id ? "5px" : "15px",
                borderBottomLeftRadius: m.sender_id === me?.id ? "15px" : "5px",
                display: "inline-block",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                wordBreak: "break-word"
              }}
            >
              {m.message}
            </div>
            <div style={{ 
              fontSize: "11px", 
              color: "#666",
              marginTop: "4px",
              padding: "0 5px"
            }}>
              {new Date(m.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
              {m.sender_id === me?.id && m.is_read && (
                <span style={{ marginLeft: "5px" }}>✓✓</span>
              )}
            </div>
          </div>
        ))}
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
          onChange={handleTyping}
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
          disabled={!text.trim() || !isConnected}
          style={{
            padding: "12px 24px",
            backgroundColor: text.trim() && isConnected ? "#4f46e5" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: text.trim() && isConnected ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default PrivateChat;