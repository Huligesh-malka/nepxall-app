import React, { useEffect, useRef, useState, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";
import { format, isToday, isYesterday } from "date-fns";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/* ── Inject premium global CSS ── */
const styleTag = document.createElement("style");
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Premium Animations */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes fadeDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes blink {
    0%, 80%, 100% {
      opacity: 0.2;
      transform: scale(0.7);
    }
    40% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(24px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
  
  @keyframes glowPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
    }
  }

  .chat-root {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* Message Row Animation */
  .msg-row {
    animation: fadeUp 0.28s cubic-bezier(0.2, 0.9, 0.4, 1.1) both;
  }
  
  .action-popup {
    animation: fadeDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  
  /* Typing Dots */
  .dot-1 { animation: blink 1.4s infinite 0s; }
  .dot-2 { animation: blink 1.4s infinite 0.2s; }
  .dot-3 { animation: blink 1.4s infinite 0.4s; }
  
  /* Input Focus State */
  .chat-input:focus {
    border-color: #8b5cf6 !important;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12) !important;
    background: #ffffff !important;
    transform: translateY(-1px);
  }
  
  /* Bubble Premium Effects */
  .bubble-mine {
    transition: all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  }
  
  .bubble-mine:hover {
    background: linear-gradient(135deg, #7c3aed, #a855f7) !important;
    transform: translateY(-1px) scale(1.01);
    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35) !important;
  }
  
  .bubble-theirs {
    transition: all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  }
  
  .bubble-theirs:hover {
    background: #ffffff !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1) !important;
  }
  
  /* Premium Scrollbar */
  .msg-area::-webkit-scrollbar {
    width: 4px;
  }
  
  .msg-area::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .msg-area::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 20px;
    transition: background 0.2s;
  }
  
  .msg-area::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
  }
  
  /* Send Button Premium Effects */
  .send-btn:not(:disabled) {
    transition: all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  }
  
  .send-btn:not(:disabled):hover {
    transform: scale(1.08);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5) !important;
    animation: pulse 0.4s ease;
  }
  
  .send-btn:not(:disabled):active {
    transform: scale(0.95);
  }
  
  /* Action Buttons Premium */
  .action-btn {
    transition: all 0.15s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  }
  
  .action-btn:hover {
    background: linear-gradient(135deg, #f3e8ff, #faf5ff) !important;
    transform: translateY(-1px);
  }
  
  .action-del:hover {
    background: linear-gradient(135deg, #fee2e2, #fef2f2) !important;
    transform: translateY(-1px);
  }
  
  /* Glassmorphism Elements */
  .glass-header {
    backdrop-filter: blur(20px);
    background: linear-gradient(135deg, rgba(109, 40, 217, 0.95), rgba(147, 51, 234, 0.95));
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  /* Loading Skeleton */
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  /* Hover Effects */
  .hover-lift {
    transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  }
  
  .hover-lift:hover {
    transform: translateY(-2px);
  }
  
  /* Focus Rings for Accessibility */
  button:focus-visible,
  textarea:focus-visible {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
  }
  
  /* Connection Banner Premium */
  .connection-banner {
    background: linear-gradient(135deg, #fef9c3, #fef3c7);
    border-top: 1px solid rgba(245, 158, 11, 0.3);
  }
  
  /* Modal Premium */
  .premium-modal {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  /* Date Chip Premium */
  .date-chip {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    transition: all 0.2s;
  }
  
  .date-chip:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
  }
`;
if (!document.head.querySelector("style[data-chat]")) {
  styleTag.setAttribute("data-chat", "1");
  document.head.appendChild(styleTag);
}

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
const fmtTime = (ts) => {
  const d = new Date(ts);
  if (isToday(d)) return format(d, "hh:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "hh:mm a");
  return format(d, "MMM dd, hh:mm a");
};

const fmtDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
};

const groupByDate = (msgs) => {
  const g = {};
  msgs.forEach((m) => {
    const k = format(new Date(m.created_at), "yyyy-MM-dd");
    (g[k] = g[k] || []).push(m);
  });
  return g;
};

/* ══════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════ */
export default function PrivateChat() {
  const { userId, pgId } = useParams();
  const navigate = useNavigate();
  const areaRef = useRef();
  const inputRef = useRef();
  const pressTimer = useRef();

  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [delConfirm, setDelConfirm] = useState(false);
  const [msgToDel, setMsgToDel] = useState(null);
  const [connStatus, setConnStatus] = useState("connected");
  const typingTimer = useRef();
  const [socketConnected, setSocketConnected] = useState(false);

  const scrollBottom = (smooth = true) => {
    setTimeout(() => {
      areaRef.current?.scrollTo({
        top: areaRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }, 80);
  };

  // 🔥 FIX 1: Join room function with self-chat prevention
  const joinRoom = useCallback(() => {
    if (!me || !userId || !pgId || !socketConnected) {
      console.log("Cannot join room - missing:", { me: !!me, userId, pgId, socketConnected });
      return;
    }
    
    // 🔥 CRITICAL: Prevent joining self room
    if (Number(userId) === me.id) {
      console.error("❌ SELF CHAT BLOCKED - Cannot join room with yourself");
      console.error(`UserA: ${me.id}, UserB: ${userId} (same user)`);
      navigate("/owner/chats");
      return;
    }
    
    const roomData = {
      userA: me.id,
      userB: Number(userId),
      pg_id: Number(pgId),
    };
    
    console.log("✅ Joining room with data:", roomData);
    socket.emit("join_private_room", roomData);
  }, [me, userId, pgId, socketConnected, navigate]);

  // Mark messages as read when they come into view
  const markMessagesAsRead = useCallback(() => {
    if (!me || !messages.length) return;
    
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== me.id && !msg.is_read
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      socket.emit("mark_messages_read", {
        userA: Number(userId),
        userB: me.id,
        pg_id: Number(pgId),
        messageIds
      });
      
      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg.id) ? { ...msg, is_read: 1 } : msg
        )
      );
    }
  }, [messages, me, userId, pgId]);

  // Trigger mark as read when messages change or component mounts
  useEffect(() => {
    markMessagesAsRead();
  }, [messages, markMessagesAsRead]);

  /* ── params guard ── */
  useEffect(() => {
    if (!userId || !pgId) navigate(-1);
  }, [userId, pgId]);

  // 🔥 FIX 2: Self-chat detection on component mount
  useEffect(() => {
    if (me && Number(userId) === me.id) {
      console.error("❌ SELF CHAT DETECTED - Cannot chat with yourself");
      console.error(`Redirecting from /chat/private/${userId}/${pgId}`);
      navigate("/owner/chats");
    }
  }, [me, userId, pgId, navigate]);

  /* ── socket lifecycle ── */
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Socket connected in PrivateChat");
      setConnStatus("connected");
      setSocketConnected(true);
    });
    
    socket.on("disconnect", () => {
      console.log("Socket disconnected in PrivateChat");
      setConnStatus("disconnected");
      setSocketConnected(false);
    });
    
    socket.on("connect_error", () => {
      console.log("Socket connection error");
      setConnStatus("error");
      setSocketConnected(false);
    });
    
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  /* ── auth + load ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        navigate("/login");
        return;
      }
      try {
        const token = await fbUser.getIdToken();
        const cfg = { headers: { Authorization: `Bearer ${token}` } };
        const meRes = await api.get("/private-chat/me", cfg);
        
        // 🔥 FIX 3: Check for self-chat before loading other data
        if (Number(userId) === meRes.data.id) {
          console.error("❌ SELF CHAT BLOCKED - Redirecting to chat list");
          navigate("/owner/chats");
          return;
        }
        
        const urRes = await api.get(
          `/private-chat/user/${userId}?pg_id=${pgId}`,
          cfg
        );
        const msgRes = await api.get(
          `/private-chat/messages/${userId}?pg_id=${pgId}&limit=100`,
          cfg
        );
        setMe(meRes.data);
        setOtherUser(urRes.data);
        setMessages(msgRes.data || []);
        setLoading(false);
        scrollBottom(false);
        
        if (!socket.connected) {
          console.log("Connecting socket...");
          socket.connect();
        } else {
          console.log("Socket already connected, registering...");
          socket.emit("register", fbUser.uid);
          
          // Request online status for the other user
          if (urRes.data?.firebase_uid) {
            socket.emit("get_online_status", urRes.data.firebase_uid);
          }
          
          setTimeout(() => {
            joinRoom();
          }, 100);
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    });
    return () => {
      if (socket.connected && me?.id) {
        socket.emit("leave_private_room", {
          userA: me.id,
          userB: Number(userId),
          pg_id: Number(pgId),
        });
      }
      unsub?.();
    };
  }, [userId, pgId, joinRoom, navigate]);

  // Force join after data load and socket connection
  useEffect(() => {
    if (me && userId && pgId && socketConnected) {
      // 🔥 FIX 4: Double-check self-chat before joining
      if (Number(userId) === me.id) {
        console.error("❌ SELF CHAT BLOCKED - Will not join room");
        navigate("/owner/chats");
        return;
      }
      console.log("✅ Force joining room after data load");
      joinRoom();
    }
  }, [me, userId, pgId, socketConnected, joinRoom, navigate]);

  /* ── socket events ── */
  useEffect(() => {
    const onMsg = (m) => {
      console.log("🔥 MESSAGE RECEIVED in PrivateChat:", m);
      if (m.pg_id !== Number(pgId)) {
        console.log("Message pg_id mismatch, ignoring:", m.pg_id, "!=", Number(pgId));
        return;
      }
      setMessages((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
      scrollBottom();
    };
    
    const onSent = (m) => {
      console.log("Message sent confirmation:", m);
      setMessages((p) =>
        p.map((x) =>
          x.message_hash === m.message_hash ? { ...x, ...m } : x
        )
      );
    };
    
    const onDel = ({ messageId }) => {
      console.log("Message deleted:", messageId);
      setMessages((p) => p.filter((x) => x.id !== messageId));
    };
    
    const onType = ({ userId: uid, isTyping }) => {
      if (uid === Number(userId)) setOtherTyping(isTyping);
    };
    
    const onRead = ({ readerId, messageIds }) => {
      if (readerId === Number(userId)) {
        setMessages((p) =>
          p.map((x) =>
            messageIds.includes(x.id) ? { ...x, is_read: 1 } : x
          )
        );
      }
    };
    
    const onOn = (uid) => {
      console.log("Received user_online event for:", uid, "Current other user UID:", otherUser?.firebase_uid);
      if (uid === otherUser?.firebase_uid) {
        console.log("Setting online to true");
        setOnline(true);
      }
    };
    
    const onOff = (uid) => {
      console.log("Received user_offline event for:", uid, "Current other user UID:", otherUser?.firebase_uid);
      if (uid === otherUser?.firebase_uid) {
        console.log("Setting online to false");
        setOnline(false);
      }
    };
    
    const onEdit = ({ messageId, newMessage }) => {
      console.log("Message edited:", messageId, newMessage);
      setMessages((p) =>
        p.map((x) =>
          x.id === messageId ? { ...x, message: newMessage, edited: true } : x
        )
      );
    };
    
    const onOnlineStatus = ({ firebase_uid, isOnline }) => {
      console.log("Received online status for:", firebase_uid, "isOnline:", isOnline);
      if (firebase_uid === otherUser?.firebase_uid) {
        setOnline(isOnline);
      }
    };

    const onRoomJoined = (data) => {
      console.log("✅ Successfully joined room:", data);
    };

    socket.on("receive_private_message", onMsg);
    socket.on("message_sent_confirmation", onSent);
    socket.on("message_deleted", onDel);
    socket.on("user_typing", onType);
    socket.on("messages_read", onRead);
    socket.on("user_online", onOn);
    socket.on("user_offline", onOff);
    socket.on("message_edited", onEdit);
    socket.on("user_online_status", onOnlineStatus);
    socket.on("room_joined", onRoomJoined);
    
    return () => {
      socket.off("receive_private_message", onMsg);
      socket.off("message_sent_confirmation", onSent);
      socket.off("message_deleted", onDel);
      socket.off("user_typing", onType);
      socket.off("messages_read", onRead);
      socket.off("user_online", onOn);
      socket.off("user_offline", onOff);
      socket.off("message_edited", onEdit);
      socket.off("user_online_status", onOnlineStatus);
      socket.off("room_joined", onRoomJoined);
    };
  }, [pgId, me?.id, userId, otherUser?.firebase_uid]);

  /* ── typing ── */
  const emitTyping = useCallback(
    (val) => {
      if (!me) return;
      // 🔥 FIX 5: Don't emit typing for self-chat
      if (Number(userId) === me.id) return;
      socket.emit("typing", {
        userA: me.id,
        userB: Number(userId),
        pg_id: Number(pgId),
        isTyping: val,
      });
    },
    [me, userId, pgId]
  );

  const onTextChange = (e) => {
    setText(e.target.value);
    if (!typing) {
      setTyping(true);
      emitTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      emitTyping(false);
    }, 1000);
  };

  /* ── send ── */
  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    
    // 🔥 FIX 6: Prevent sending messages to self
    if (Number(userId) === me?.id) {
      console.error("❌ Cannot send message to yourself");
      return;
    }
    
    setSending(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.post(
        "/private-chat/send",
        { receiver_id: Number(userId), pg_id: Number(pgId), message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tmp = {
        ...res.data,
        status: "sending",
        created_at: new Date().toISOString(),
      };
      setMessages((p) => (p.some((x) => x.id === res.data.id) ? p : [...p, tmp]));
      socket.emit("send_private_message", {
        ...res.data,
        sender_firebase_uid: auth.currentUser.uid,
        receiver_firebase_uid: otherUser?.firebase_uid,
      });
      setText("");
      scrollBottom();
      setTyping(false);
      emitTyping(false);
      clearTimeout(typingTimer.current);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  /* ── edit ── */
  const startEdit = (msg) => {
    setEditingMsg(msg);
    setText(msg.message);
    setActiveId(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const cancelEdit = () => {
    setEditingMsg(null);
    setText("");
  };
  const updateMsg = async () => {
    if (!editingMsg || !text.trim()) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await api.put(
        `/private-chat/message/${editingMsg.id}`,
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state immediately
      setMessages((p) =>
        p.map((x) =>
          x.id === editingMsg.id ? { ...x, message: text, edited: true } : x
        )
      );
      
      // Emit edit event to socket for real-time update
      socket.emit("edit_private_message", {
        messageId: editingMsg.id,
        newMessage: text,
        sender_id: me.id,
        receiver_id: Number(userId),
        pg_id: Number(pgId),
        sender_firebase_uid: auth.currentUser.uid,
        receiver_firebase_uid: otherUser?.firebase_uid,
      });
      
      cancelEdit();
    } catch (e) {
      console.error(e);
    }
  };

  /* ── delete ── */
  const confirmDel = (msg) => {
    setMsgToDel(msg);
    setDelConfirm(true);
    setActiveId(null);
  };
  const deleteMsg = async () => {
    if (!msgToDel) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await api.delete(`/private-chat/message/${msgToDel.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit("delete_private_message", {
        messageId: msgToDel.id,
        sender_id: me.id,
        receiver_id: Number(userId),
        pg_id: Number(pgId),
        sender_firebase_uid: auth.currentUser.uid,
        receiver_firebase_uid: otherUser?.firebase_uid,
      });
      setMessages((p) => p.filter((x) => x.id !== msgToDel.id));
      setDelConfirm(false);
      setMsgToDel(null);
    } catch (e) {
      console.error(e);
    }
  };

  /* ── long press ── */
  const pressStart = (id) => {
    pressTimer.current = setTimeout(() => setActiveId(id), 480);
  };
  const pressEnd = () => clearTimeout(pressTimer.current);

  /* ── close popup on outside click ── */
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest(".msg-popup")) setActiveId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ══════ RENDER ══════ */
  if (loading)
    return (
      <div style={s.loadWrap} className="chat-root">
        <div style={s.spinner} />
        <p style={s.loadTxt}>Loading conversation...</p>
      </div>
    );

  const grouped = groupByDate(messages);
  const sortedDays = Object.keys(grouped).sort();
  const otherInitial = (otherUser?.name || otherUser?.pg_name || "U")[0].toUpperCase();

  return (
    <div style={s.root} className="chat-root">
      {/* ══ PREMIUM HEADER WITH GLASSMORPHISM ══ */}
      <div style={s.header} className="glass-header">
        <button onClick={() => navigate(-1)} style={s.backBtn} className="hover-lift" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div style={s.hdrAvatar}>
          {otherInitial}
          {online && <span style={s.onlineDot}></span>}
        </div>

        <div style={s.hdrMeta}>
          <span style={s.hdrName}>
            {me?.role === "tenant" ? otherUser?.pg_name || "PG" : otherUser?.name || "User"}
          </span>
          <span style={s.hdrStatus}>
            <span style={{ ...s.statusDot, background: online ? "#22c55e" : "#94a3b8" }} />
            {online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* ══ MESSAGES AREA ══ */}
      <div ref={areaRef} style={s.area} className="msg-area">
        {/* Premium background pattern */}
        <div style={s.bgPattern} />

        <div style={{ position: "relative", zIndex: 1, padding: "24px 16px 12px" }}>
          {sortedDays.map((day) => (
            <div key={day}>
              <div style={s.dateRow}>
                <span style={s.dateChip} className="date-chip">
                  {fmtDateHeader(day)}
                </span>
              </div>

              {grouped[day].map((msg, idx) => {
                const isMine = msg.sender_id === me?.id;
                const nextMsg = grouped[day][idx + 1];
                const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                const myRadius = `24px 8px ${isLast ? "8px" : "24px"} 24px`;
                const theirRadius = `8px 24px 24px ${isLast ? "8px" : "24px"}`;

                return (
                  <div
                    key={msg.id}
                    className="msg-row"
                    style={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      marginBottom: isLast ? 14 : 4,
                      paddingLeft: isMine ? 48 : 0,
                      paddingRight: isMine ? 0 : 48,
                    }}
                  >
                    <div style={{ position: "relative", maxWidth: "84%" }}>
                      <div
                        className={isMine ? "bubble-mine" : "bubble-theirs"}
                        style={{
                          background: isMine
                            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                            : "rgba(255, 255, 255, 0.95)",
                          color: isMine ? "#fff" : "#1e293b",
                          borderRadius: isMine ? myRadius : theirRadius,
                          padding: "12px 18px",
                          fontSize: 14.5,
                          lineHeight: 1.55,
                          wordBreak: "break-word",
                          boxShadow: isMine
                            ? "0 4px 16px rgba(124, 58, 237, 0.25)"
                            : "0 2px 12px rgba(0, 0, 0, 0.06)",
                          cursor: "pointer",
                          transition: "all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
                          position: "relative",
                          fontWeight: 500,
                          backdropFilter: isMine ? "none" : "blur(2px)",
                          border: isMine ? "none" : "1px solid rgba(255, 255, 255, 0.3)",
                        }}
                        onMouseDown={() => isMine && pressStart(msg.id)}
                        onMouseUp={pressEnd}
                        onMouseLeave={pressEnd}
                        onTouchStart={() => isMine && pressStart(msg.id)}
                        onTouchEnd={pressEnd}
                        onTouchMove={pressEnd}
                      >
                        {msg.message}
                        {msg.edited && (
                          <span
                            style={{
                              fontSize: 10,
                              opacity: 0.65,
                              marginLeft: 10,
                              fontStyle: "italic",
                              fontWeight: 500,
                            }}
                          >
                            edited
                          </span>
                        )}
                      </div>

                      {isLast && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 6,
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            padding: "0 4px",
                          }}
                        >
                          <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>
                            {fmtTime(msg.created_at)}
                          </span>
                          {isMine && (
                            <span
                              style={{
                                fontSize: 12,
                                color: msg.is_read ? "#22c55e" : "#cbd5e1",
                                fontWeight: 700,
                                transition: "color 0.2s",
                              }}
                            >
                              {msg.is_read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      )}

                      {isMine && activeId === msg.id && (
                        <div
                          className="msg-popup action-popup"
                          style={{
                            position: "absolute",
                            top: -52,
                            right: 0,
                            background: "rgba(255, 255, 255, 0.98)",
                            borderRadius: 24,
                            padding: "6px",
                            display: "flex",
                            gap: 8,
                            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12)",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            zIndex: 20,
                            whiteSpace: "nowrap",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <button className="action-btn" onClick={() => startEdit(msg)} style={s.popBtn}>
                            ✏️ Edit
                          </button>
                          <div style={{ width: 1, background: "#e2e8f0" }} />
                          <button
                            className="action-btn action-del"
                            onClick={() => confirmDel(msg)}
                            style={{ ...s.popBtn, color: "#ef4444" }}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {otherTyping && (
            <div style={{ display: "flex", marginBottom: 16, paddingRight: 48 }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px 24px 24px 24px",
                  padding: "12px 20px",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span className="dot-1" style={s.typDot} />
                <span className="dot-2" style={s.typDot} />
                <span className="dot-3" style={s.typDot} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ CONNECTION BANNER PREMIUM ══ */}
      {connStatus !== "connected" && (
        <div style={s.connBanner} className="connection-banner">
          <span style={s.connDot}>●</span>
          {connStatus === "disconnected" ? "Reconnecting..." : "Connection lost. Retrying..."}
        </div>
      )}

      {/* ══ EDIT BANNER PREMIUM ══ */}
      {editingMsg && (
        <div style={s.editBanner}>
          <div>
            <span style={s.editLabel}>✏️ Editing message</span>
            <p style={s.editPreview}>
              {editingMsg.message.slice(0, 70)}
              {editingMsg.message.length > 70 ? "…" : ""}
            </p>
          </div>
          <button onClick={cancelEdit} style={s.editClose}>
            ✕
          </button>
        </div>
      )}

      {/* ══ INPUT AREA PREMIUM ══ */}
      <div style={s.inputWrap}>
        <div style={s.inputRow}>
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={onTextChange}
            placeholder={editingMsg ? "Edit your message…" : "Type a message..."}
            className="chat-input"
            style={s.textarea}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                editingMsg ? updateMsg() : sendMessage();
              }
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 110) + "px";
            }}
          />

          {editingMsg ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={updateMsg} style={s.sendBtn} className="send-btn" title="Save">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  ...s.sendBtn,
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 4px 16px rgba(239, 68, 68, 0.35)",
                }}
                className="send-btn"
                title="Cancel"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="send-btn"
              style={{
                ...s.sendBtn,
                opacity: !text.trim() || sending ? 0.5 : 1,
                cursor: !text.trim() || sending ? "not-allowed" : "pointer",
              }}
              title="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ══ DELETE MODAL PREMIUM ══ */}
      {delConfirm && (
        <div style={s.overlay}>
          <div style={s.modal} className="premium-modal">
            <div style={s.modalIcon}>🗑</div>
            <h3 style={s.modalTitle}>Delete message?</h3>
            <p style={s.modalSub}>This message will be permanently removed for everyone.</p>
            <div style={s.modalBtns}>
              <button onClick={() => setDelConfirm(false)} style={s.modalCancel}>
                Cancel
              </button>
              <button onClick={deleteMsg} style={s.modalDel}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   PREMIUM STYLES - UNICORN LEVEL
══════════════════════════════════ */
const s = {
  root: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: "hidden",
    position: "relative",
  },

  /* Premium Loader */
  loadWrap: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
  },
  spinner: {
    width: 48,
    height: 48,
    border: "3px solid rgba(139, 92, 246, 0.2)",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadTxt: {
    marginTop: 20,
    color: "#64748b",
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "-0.2px",
  },

  /* Premium Header - Glassmorphism */
  header: {
    background: "linear-gradient(135deg, rgba(109, 40, 217, 0.98), rgba(147, 51, 234, 0.98))",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
    flexShrink: 0,
    zIndex: 12,
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(255, 255, 255, 0.15)",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
    flexShrink: 0,
    backdropFilter: "blur(4px)",
  },
  hdrAvatar: {
    width: 48,
    height: 48,
    borderRadius: 20,
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 20,
    flexShrink: 0,
    border: "2px solid rgba(255, 255, 255, 0.4)",
    position: "relative",
    backdropFilter: "blur(4px)",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    background: "#22c55e",
    border: "2px solid #7c3aed",
    borderRadius: "50%",
    boxShadow: "0 0 0 2px rgba(34, 197, 94, 0.2)",
  },
  hdrMeta: { display: "flex", flexDirection: "column", gap: 4 },
  hdrName: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: "-0.3px",
  },
  hdrStatus: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: 600,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },

  /* Messages Area */
  area: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
  },
  bgPattern: {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.04) 0%, transparent 60%),
      radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.04) 0%, transparent 60%),
      repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.01) 0px, rgba(0, 0, 0, 0.01) 2px, transparent 2px, transparent 8px)
    `,
    pointerEvents: "none",
  },

  /* Date Chip */
  dateRow: { display: "flex", justifyContent: "center", margin: "20px 0 16px" },
  dateChip: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    color: "#475569",
    fontSize: 11.5,
    fontWeight: 700,
    padding: "6px 18px",
    borderRadius: 40,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    letterSpacing: "-0.2px",
  },

  /* Typing Dots */
  typDot: {
    width: 8,
    height: 8,
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    borderRadius: "50%",
    display: "inline-block",
  },

  /* Popup Buttons */
  popBtn: {
    background: "none",
    border: "none",
    padding: "8px 16px",
    borderRadius: 40,
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  /* Connection Banner */
  connBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 20px",
    background: "linear-gradient(135deg, #fef9c3, #fef3c7)",
    color: "#b45309",
    fontSize: 12.5,
    fontWeight: 700,
    flexShrink: 0,
    borderTop: "1px solid rgba(245, 158, 11, 0.3)",
  },
  connDot: { color: "#f59e0b", fontSize: 10 },

  /* Edit Banner */
  editBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #f3e8ff, #faf5ff)",
    borderTop: "3px solid #8b5cf6",
    flexShrink: 0,
  },
  editLabel: {
    fontSize: 11.5,
    fontWeight: 800,
    color: "#7c3aed",
    display: "block",
    marginBottom: 4,
    letterSpacing: "-0.2px",
    textTransform: "uppercase",
  },
  editPreview: { fontSize: 13, color: "#4c1d95", fontWeight: 500 },
  editClose: {
    background: "none",
    border: "none",
    color: "#7c3aed",
    fontSize: 20,
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: 30,
    transition: "all 0.2s",
  },

  /* Input Area */
  inputWrap: {
    background: "rgba(255, 255, 255, 0.95)",
    borderTop: "1px solid rgba(203, 213, 225, 0.3)",
    padding: "14px 20px 18px",
    flexShrink: 0,
    backdropFilter: "blur(10px)",
  },
  inputRow: { display: "flex", alignItems: "flex-end", gap: 12 },
  textarea: {
    flex: 1,
    resize: "none",
    border: "1.5px solid #e2e8f0",
    borderRadius: 32,
    padding: "12px 20px",
    fontSize: 14.5,
    lineHeight: 1.5,
    fontFamily: "'Inter', sans-serif",
    color: "#1e293b",
    background: "#fefefe",
    outline: "none",
    transition: "all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
    maxHeight: 110,
    overflowY: "auto",
    fontWeight: 500,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 6px 20px rgba(124, 58, 237, 0.4)",
    transition: "all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
  },

  /* Premium Modal */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "rgba(255, 255, 255, 0.98)",
    borderRadius: 40,
    padding: "32px 28px",
    width: "90%",
    maxWidth: 360,
    textAlign: "center",
    boxShadow: "0 40px 80px rgba(0, 0, 0, 0.2)",
    animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  modalIcon: { fontSize: 48, marginBottom: 16 },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: "-0.3px",
  },
  modalSub: {
    fontSize: 13.5,
    color: "#64748b",
    lineHeight: 1.5,
    marginBottom: 28,
  },
  modalBtns: { display: "flex", gap: 12 },
  modalCancel: {
    flex: 1,
    padding: "14px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: 28,
    fontSize: 14,
    fontWeight: 700,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  modalDel: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    border: "none",
    borderRadius: 28,
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(239, 68, 68, 0.35)",
    transition: "all 0.2s",
  },
};