import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

// Create socket instance outside component to prevent reconnection issues
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

const PrivateChat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
      }
    }, 100);
  }, []);

  // Load more messages (for infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !me?.id || !userId) return;

    try {
      setLoadingMore(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await api.get(`/private-chat/messages/${userId}?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.length === 0 || response.data.length < 50) {
        setHasMore(false);
      }

      if (response.data.length > 0) {
        setMessages(prev => [...response.data, ...prev]);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, me?.id, page, hasMore, loadingMore]);

  // Handle scroll to load more messages
  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.target;
    if (scrollTop < 50 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loadMoreMessages]);

  useEffect(() => {
    // Validate userId
    if (!userId || userId === "undefined" || userId === "null" || isNaN(parseInt(userId))) {
      alert("Invalid user ID");
      navigate("/user/bookings");
      return;
    }

    const parsedUserId = parseInt(userId);

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
        
        if (!meRes.data || !meRes.data.id) {
          throw new Error("Failed to get user info");
        }
        
        setMe(meRes.data);

        // Then get other user info
        let userRes;
        try {
          userRes = await api.get(`/private-chat/user/${parsedUserId}`, config);
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
        const msgRes = await api.get(`/private-chat/messages/${parsedUserId}`, config);
        setMessages(msgRes.data);

        // Setup socket connection
        if (!socket.connected) {
          socket.connect();
        }

        // Socket event listeners
        const handleConnect = () => {
          console.log("Socket connected");
          setSocketConnected(true);
          
          // Register user with socket after connection
          socket.emit("register", fbUser.uid);
          
          // Join private room
          socket.emit("join_private_room", {
            userA: meRes.data.id,
            userB: parsedUserId,
          });
        };

        const handleDisconnect = () => {
          console.log("Socket disconnected");
          setSocketConnected(false);
        };

        const handleReceiveMessage = (msg) => {
          // Check if message belongs to this conversation
          if ((msg.sender_id === meRes.data.id && msg.receiver_id === parsedUserId) ||
              (msg.sender_id === parsedUserId && msg.receiver_id === meRes.data.id)) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
          }
        };

        const handleConnectError = (err) => {
          console.error("Socket connection error:", err);
          setSocketConnected(false);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("receive_private_message", handleReceiveMessage);
        socket.on("connect_error", handleConnectError);

        // Cleanup function
        return () => {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
          socket.off("receive_private_message", handleReceiveMessage);
          socket.off("connect_error", handleConnectError);
          
          if (socket.connected) {
            socket.emit("leave_private_room", {
              userA: meRes.data.id,
              userB: parsedUserId,
            });
          }
        };

      } catch (err) {
        console.error("Error loading chat:", err);
        setError(err.message || "Failed to load chat. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [userId, navigate, scrollToBottom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!text.trim() || !me?.id || !userId || sending) return;

    const parsedUserId = parseInt(userId);
    const messageText = text.trim();

    setSending(true);

    try {
      const token = await auth.currentUser.getIdToken();
      
      const res = await api.post(
        "/private-chat/send",
        {
          receiver_id: parsedUserId,
          message: messageText,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emit via socket if connected
      if (socket.connected) {
        socket.emit("send_private_message", res.data);
      }

      // Add to local state
      setMessages((prev) => [...prev, res.data]);
      setText("");
      
    } catch (err) {
      console.error("Error sending message:", err);
      
      let errorMessage = "Failed to send message. ";
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += "Please login again.";
        } else if (err.response.status === 403) {
          errorMessage += "You don't have permission to send messages.";
        } else if (err.response.status === 404) {
          errorMessage += "User not found.";
        } else {
          errorMessage += "Please try again.";
        }
      } else if (err.request) {
        errorMessage += "Network error. Please check your connection.";
      } else {
        errorMessage += "Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #4f46e5",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 10px"
          }} />
          <div>Loading chat...</div>
        </div>
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
        backgroundColor: "#f0f2f5",
        padding: "20px"
      }}>
        <div style={{ 
          color: "#dc2626", 
          marginBottom: "20px",
          textAlign: "center",
          maxWidth: "400px"
        }}>
          {error}
        </div>
        <button 
          onClick={() => navigate("/user/bookings")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#4338ca"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#4f46e5"}
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
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            background: "none",
            border: "none",
            cursor: "pointer", 
            fontSize: "24px",
            marginRight: "12px",
            color: "#fff",
            padding: "0 8px",
            display: "flex",
            alignItems: "center"
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: "18px" }}>
            {otherUser?.name || "User"}
          </b>
        </div>
        {!socketConnected && (
          <span style={{ 
            fontSize: "12px", 
            background: "rgba(255,255,255,0.2)",
            padding: "4px 8px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <span style={{ 
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#fbbf24",
              animation: "pulse 1.5s infinite"
            }} />
            Reconnecting...
          </span>
        )}
      </div>

      {/* Messages Container */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "20px 15px",
          display: "flex",
          flexDirection: "column"
        }}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div style={{ textAlign: "center", padding: "10px" }}>
            <span style={{ color: "#666" }}>Loading older messages...</span>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            color: "#666",
            marginTop: "40px",
            padding: "20px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>💬</div>
            <div>No messages yet. Start a conversation!</div>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMe = m.sender_id === me?.id;
            const showAvatar = index === 0 || messages[index - 1]?.sender_id !== m.sender_id;
            
            return (
              <div
                key={m.id || `msg-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  marginBottom: showAvatar ? "15px" : "5px",
                  maxWidth: "80%",
                  alignSelf: isMe ? "flex-end" : "flex-start"
                }}
              >
                {showAvatar && !isMe && (
                  <span style={{ 
                    fontSize: "12px", 
                    color: "#666",
                    marginBottom: "4px",
                    marginLeft: "8px"
                  }}>
                    {otherUser?.name || "User"}
                  </span>
                )}
                <div
                  style={{
                    position: "relative",
                    maxWidth: "100%"
                  }}
                >
                  <span
                    style={{
                      background: isMe ? "#4f46e5" : "#fff",
                      color: isMe ? "#fff" : "#000",
                      padding: "10px 15px",
                      borderRadius: "18px",
                      borderBottomRightRadius: isMe ? "4px" : "18px",
                      borderBottomLeftRadius: isMe ? "18px" : "4px",
                      display: "inline-block",
                      wordBreak: "break-word",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                    }}
                  >
                    {m.message}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    color: "#666",
                    marginTop: "4px",
                    display: "block",
                    textAlign: isMe ? "right" : "left"
                  }}>
                    {new Date(m.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        display: "flex", 
        padding: "15px",
        backgroundColor: "#fff",
        borderTop: "1px solid #e0e0e0",
        gap: "10px"
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={sending}
          rows="1"
          style={{ 
            flex: 1,
            padding: "12px 16px",
            border: "1px solid #e0e0e0",
            borderRadius: "24px",
            outline: "none",
            fontSize: "16px",
            resize: "none",
            fontFamily: "inherit",
            maxHeight: "100px",
            transition: "border-color 0.2s"
          }}
          onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
          onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
        />
        <button 
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          style={{
            padding: "12px 24px",
            backgroundColor: text.trim() && !sending ? "#4f46e5" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "24px",
            cursor: text.trim() && !sending ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "500",
            transition: "background-color 0.2s",
            minWidth: "80px"
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>

      {/* Global Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          textarea::-webkit-scrollbar {
            width: 4px;
          }
          textarea::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          textarea::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 2px;
          }
          textarea::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
    </div>
  );
};

export default PrivateChat;