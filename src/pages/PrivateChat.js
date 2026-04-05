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

/* ── Inject global CSS ── */
const styleTag = document.createElement("style");
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blink   { 0%,80%,100% { opacity:.2; transform:scale(.8); } 40% { opacity:1; transform:scale(1); } }
  @keyframes pulse   { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }

  .chat-root { font-family:'Plus Jakarta Sans',sans-serif; }

  .msg-row      { animation: fadeUp .18s ease both; }
  .action-popup { animation: slideUp .15s ease both; }

  .dot-1 { animation: blink 1.2s infinite .0s; }
  .dot-2 { animation: blink 1.2s infinite .2s; }
  .dot-3 { animation: blink 1.2s infinite .4s; }

  .chat-input:focus { border-color: #6c5ce7 !important; box-shadow: 0 0 0 3px rgba(108,92,231,.12) !important; }

  /* bubble hover */
  .bubble:hover { filter: brightness(.97); }

  /* scrollbar */
  .msg-area::-webkit-scrollbar { width:4px; }
  .msg-area::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:4px; }

  /* input area shine */
  .send-btn:not(:disabled):hover { transform:scale(1.06); box-shadow:0 6px 20px rgba(108,92,231,.45) !important; }
  .send-btn:not(:disabled):active { transform:scale(.96); }

  .action-btn:hover { background:#f3f0ff !important; color:#6c5ce7 !important; }
  .action-del:hover { background:#fff0f0 !important; color:#ef4444 !important; }
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
  if (isToday(d))     return format(d, "hh:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "hh:mm a");
  return format(d, "MMM dd, hh:mm a");
};

const fmtDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  if (isToday(d))     return "Today";
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
  const areaRef      = useRef();
  const inputRef     = useRef();
  const pressTimer   = useRef();

  const [messages,         setMessages]         = useState([]);
  const [me,               setMe]               = useState(null);
  const [otherUser,        setOtherUser]        = useState(null);
  const [text,             setText]             = useState("");
  const [typing,           setTyping]           = useState(false);
  const [otherTyping,      setOtherTyping]      = useState(false);
  const [online,           setOnline]           = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [sending,          setSending]          = useState(false);
  const [editingMsg,       setEditingMsg]       = useState(null);
  const [activeId,         setActiveId]         = useState(null);
  const [delConfirm,       setDelConfirm]       = useState(false);
  const [msgToDel,         setMsgToDel]         = useState(null);
  const [connStatus,       setConnStatus]       = useState("connected");
  const typingTimer = useRef();

  const scrollBottom = (smooth = true) => {
    setTimeout(() => {
      areaRef.current?.scrollTo({
        top: areaRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }, 80);
  };

  /* ── params guard ── */
  useEffect(() => { if (!userId || !pgId) navigate(-1); }, [userId, pgId]);

  /* ── socket lifecycle ── */
  useEffect(() => {
    socket.on("connect",       () => setConnStatus("connected"));
    socket.on("disconnect",    () => setConnStatus("disconnected"));
    socket.on("connect_error", () => setConnStatus("error"));
    return () => { socket.off("connect"); socket.off("disconnect"); socket.off("connect_error"); };
  }, []);

  /* ── auth + load ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { navigate("/login"); return; }
      try {
        const token  = await fbUser.getIdToken();
        const cfg    = { headers: { Authorization: `Bearer ${token}` } };
        const meRes  = await api.get("/private-chat/me", cfg);
        const urRes  = await api.get(`/private-chat/user/${userId}?pg_id=${pgId}`, cfg);
        const msgRes = await api.get(`/private-chat/messages/${userId}?pg_id=${pgId}&limit=100`, cfg);
        setMe(meRes.data);
        setOtherUser(urRes.data);
        setMessages(msgRes.data || []);
        setLoading(false);
        scrollBottom(false);
        if (!socket.connected) socket.connect();
        socket.emit("register", fbUser.uid);
        socket.emit("join_private_room", { userA: meRes.data.id, userB: Number(userId), pg_id: Number(pgId) });
      } catch (e) { console.error(e); setLoading(false); }
    });
    return () => {
      if (socket.connected) socket.emit("leave_private_room", { userA: me?.id, userB: Number(userId), pg_id: Number(pgId) });
      unsub?.();
    };
  }, [userId, pgId]);

  /* ── socket events ── */
  useEffect(() => {
    const onMsg  = (m) => { if (m.pg_id !== Number(pgId)) return; setMessages(p => p.some(x=>x.id===m.id)?p:[...p,m]); scrollBottom(); };
    const onSent = (m) => setMessages(p => p.map(x => x.message_hash===m.message_hash ? {...x,...m} : x));
    const onDel  = ({messageId}) => setMessages(p => p.filter(x=>x.id!==messageId));
    const onType = ({userId:uid,isTyping}) => { if(uid===Number(userId)) setOtherTyping(isTyping); };
    const onRead = ({readerId,messageIds}) => { if(readerId===Number(userId)) setMessages(p=>p.map(x=>messageIds.includes(x.id)?{...x,is_read:1}:x)); };
    const onOn   = (uid) => { if(uid===otherUser?.firebase_uid) setOnline(true); };
    const onOff  = (uid) => { if(uid===otherUser?.firebase_uid) setOnline(false); };

    socket.on("receive_private_message",  onMsg);
    socket.on("message_sent_confirmation",onSent);
    socket.on("message_deleted",          onDel);
    socket.on("user_typing",              onType);
    socket.on("messages_read",            onRead);
    socket.on("user_online",              onOn);
    socket.on("user_offline",             onOff);
    return () => {
      socket.off("receive_private_message",  onMsg);
      socket.off("message_sent_confirmation",onSent);
      socket.off("message_deleted",          onDel);
      socket.off("user_typing",              onType);
      socket.off("messages_read",            onRead);
      socket.off("user_online",              onOn);
      socket.off("user_offline",             onOff);
    };
  }, [pgId, me?.id, userId, otherUser?.firebase_uid]);

  /* ── typing ── */
  const emitTyping = useCallback((val) => {
    if (!me) return;
    socket.emit("typing", { userA: me.id, userB: Number(userId), pg_id: Number(pgId), isTyping: val });
  }, [me, userId, pgId]);

  const onTextChange = (e) => {
    setText(e.target.value);
    if (!typing) { setTyping(true); emitTyping(true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { setTyping(false); emitTyping(false); }, 1000);
  };

  /* ── send ── */
  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await api.post("/private-chat/send",
        { receiver_id: Number(userId), pg_id: Number(pgId), message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tmp = { ...res.data, status: "sending", created_at: new Date().toISOString() };
      setMessages(p => p.some(x=>x.id===res.data.id)?p:[...p,tmp]);
      socket.emit("send_private_message", { ...res.data, sender_firebase_uid: auth.currentUser.uid, receiver_firebase_uid: otherUser?.firebase_uid });
      setText("");
      scrollBottom();
      setTyping(false); emitTyping(false); clearTimeout(typingTimer.current);
    } catch(e) { console.error(e); }
    finally { setSending(false); }
  };

  /* ── edit ── */
  const startEdit = (msg) => { setEditingMsg(msg); setText(msg.message); setActiveId(null); setTimeout(()=>inputRef.current?.focus(),50); };
  const cancelEdit = () => { setEditingMsg(null); setText(""); };
  const updateMsg = async () => {
    if (!editingMsg || !text.trim()) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await api.put(`/private-chat/message/${editingMsg.id}`, { message: text }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(p => p.map(x => x.id===editingMsg.id ? {...x,message:text,edited:true} : x));
      cancelEdit();
    } catch(e) { console.error(e); }
  };

  /* ── delete ── */
  const confirmDel = (msg) => { setMsgToDel(msg); setDelConfirm(true); setActiveId(null); };
  const deleteMsg = async () => {
    if (!msgToDel) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await api.delete(`/private-chat/message/${msgToDel.id}`, { headers: { Authorization: `Bearer ${token}` } });
      socket.emit("delete_private_message", { messageId:msgToDel.id, sender_id:me.id, receiver_id:Number(userId), pg_id:Number(pgId), sender_firebase_uid:auth.currentUser.uid, receiver_firebase_uid:otherUser?.firebase_uid });
      setMessages(p => p.filter(x=>x.id!==msgToDel.id));
      setDelConfirm(false); setMsgToDel(null);
    } catch(e) { console.error(e); }
  };

  /* ── long press ── */
  const pressStart = (id) => { pressTimer.current = setTimeout(()=>setActiveId(id), 480); };
  const pressEnd   = ()    => clearTimeout(pressTimer.current);

  /* ── close popup on outside click ── */
  useEffect(() => {
    const h = (e) => { if (!e.target.closest(".msg-popup")) setActiveId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ══════ RENDER ══════ */
  if (loading) return (
    <div style={s.loadWrap} className="chat-root">
      <div style={s.spinner} />
      <p style={s.loadTxt}>Loading conversation…</p>
    </div>
  );

  const grouped    = groupByDate(messages);
  const sortedDays = Object.keys(grouped).sort();
  const otherInitial = (otherUser?.name || otherUser?.pg_name || "U")[0].toUpperCase();

  return (
    <div style={s.root} className="chat-root">

      {/* ══ HEADER ══ */}
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn} title="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* compact avatar in header only */}
        <div style={s.hdrAvatar}>{otherInitial}</div>

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

        {/* chat background pattern */}
        <div style={s.bgPattern} />

        <div style={{ position:"relative", zIndex:1, padding:"20px 16px 8px" }}>
          {sortedDays.map((day) => (
            <div key={day}>
              {/* date chip */}
              <div style={s.dateRow}>
                <span style={s.dateChip}>{fmtDateHeader(day)}</span>
              </div>

              {grouped[day].map((msg, idx) => {
                const isMine   = msg.sender_id === me?.id;
                const prevMsg  = grouped[day][idx - 1];
                const nextMsg  = grouped[day][idx + 1];
                const isFirst  = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isLast   = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                /* bubble corner shaping */
                const myRadius   = `18px 4px ${isLast?"4px":"18px"} 18px`;
                const theirRadius = `4px 18px 18px ${isLast?"4px":"18px"}`;

                return (
                  <div
                    key={msg.id}
                    className="msg-row"
                    style={{
                      display:"flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      marginBottom: isLast ? 12 : 3,
                      paddingLeft: isMine ? 48 : 0,
                      paddingRight: isMine ? 0 : 48,
                    }}
                  >
                    <div style={{ position:"relative", maxWidth:"78%" }}>
                      {/* bubble */}
                      <div
                        className="bubble"
                        style={{
                          background:    isMine ? "linear-gradient(135deg,#6c5ce7,#8b5cf6)" : "#ffffff",
                          color:         isMine ? "#fff" : "#1e293b",
                          borderRadius:  isMine ? myRadius : theirRadius,
                          padding:       "10px 14px",
                          fontSize:      14,
                          lineHeight:    1.55,
                          wordBreak:     "break-word",
                          boxShadow:     isMine
                            ? "0 2px 12px rgba(108,92,231,.28)"
                            : "0 2px 8px rgba(0,0,0,.07)",
                          cursor:        "pointer",
                          transition:    "filter .15s",
                          position:      "relative",
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
                          <span style={{ fontSize:10, opacity:.6, marginLeft:6, fontStyle:"italic" }}>edited</span>
                        )}
                      </div>

                      {/* meta: time + read */}
                      {isLast && (
                        <div style={{
                          display:"flex", alignItems:"center", gap:4,
                          marginTop:4,
                          justifyContent: isMine ? "flex-end" : "flex-start",
                          padding:"0 2px",
                        }}>
                          <span style={{ fontSize:10, color:"#94a3b8" }}>{fmtTime(msg.created_at)}</span>
                          {isMine && (
                            <span style={{ fontSize:11, color: msg.is_read ? "#22c55e" : "#94a3b8", fontWeight:600 }}>
                              {msg.is_read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      )}

                      {/* action popup — long press */}
                      {isMine && activeId === msg.id && (
                        <div className="msg-popup action-popup" style={{
                          position:"absolute",
                          top:-46,
                          right:0,
                          background:"#fff",
                          borderRadius:14,
                          padding:"5px",
                          display:"flex",
                          gap:4,
                          boxShadow:"0 8px 30px rgba(0,0,0,.14)",
                          border:"1px solid #f1f5f9",
                          zIndex:20,
                          whiteSpace:"nowrap",
                        }}>
                          <button className="action-btn" onClick={()=>startEdit(msg)} style={s.popBtn}>
                            ✏️ Edit
                          </button>
                          <div style={{ width:1, background:"#f1f5f9" }} />
                          <button className="action-btn action-del" onClick={()=>confirmDel(msg)} style={{...s.popBtn, color:"#ef4444"}}>
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

          {/* typing indicator */}
          {otherTyping && (
            <div style={{ display:"flex", marginBottom:12, paddingRight:48 }}>
              <div style={{
                background:"#fff",
                borderRadius:"4px 18px 18px 18px",
                padding:"12px 16px",
                display:"flex", gap:5, alignItems:"center",
                boxShadow:"0 2px 8px rgba(0,0,0,.07)",
              }}>
                <span className="dot-1" style={s.typDot} />
                <span className="dot-2" style={s.typDot} />
                <span className="dot-3" style={s.typDot} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ CONNECTION BANNER ══ */}
      {connStatus !== "connected" && (
        <div style={s.connBanner}>
          <span style={s.connDot}>●</span>
          {connStatus === "disconnected" ? "Reconnecting…" : "Connection lost. Retrying…"}
        </div>
      )}

      {/* ══ EDIT BANNER ══ */}
      {editingMsg && (
        <div style={s.editBanner}>
          <div>
            <span style={s.editLabel}>✏️ Editing message</span>
            <p style={s.editPreview}>{editingMsg.message.slice(0, 60)}{editingMsg.message.length>60?"…":""}</p>
          </div>
          <button onClick={cancelEdit} style={s.editClose}>✕</button>
        </div>
      )}

      {/* ══ INPUT AREA ══ */}
      <div style={s.inputWrap}>
        <div style={s.inputRow}>
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={onTextChange}
            placeholder={editingMsg ? "Edit your message…" : "Message…"}
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
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />

          {editingMsg ? (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <button onClick={updateMsg} style={s.sendBtn} className="send-btn" title="Save">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>
              <button onClick={cancelEdit} style={{...s.sendBtn, background:"#ef4444", boxShadow:"0 4px 14px rgba(239,68,68,.3)"}} className="send-btn" title="Cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
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
                opacity: !text.trim() || sending ? .45 : 1,
                cursor:  !text.trim() || sending ? "not-allowed" : "pointer",
              }}
              title="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ══ DELETE MODAL ══ */}
      {delConfirm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}>🗑</div>
            <h3 style={s.modalTitle}>Delete message?</h3>
            <p style={s.modalSub}>This message will be permanently removed for everyone.</p>
            <div style={s.modalBtns}>
              <button onClick={() => setDelConfirm(false)} style={s.modalCancel}>Cancel</button>
              <button onClick={deleteMsg}                  style={s.modalDel}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   STYLES
══════════════════════════════════ */
const s = {
  root: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    background: "#f0f2f5",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    overflow: "hidden",
  },

  /* loader */
  loadWrap: { height:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#f8fafc" },
  spinner:  { width:40, height:40, border:"3px solid #e2e8f0", borderTopColor:"#6c5ce7", borderRadius:"50%", animation:"spin 0.9s linear infinite" },
  loadTxt:  { marginTop:14, color:"#94a3b8", fontSize:14, fontWeight:500 },

  /* header */
  header: {
    background: "linear-gradient(135deg, #5b4fcf 0%, #7c5cbf 100%)",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 2px 16px rgba(91,79,207,.25)",
    flexShrink: 0,
    zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    background: "rgba(255,255,255,.15)",
    border: "none",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    transition: "background .15s",
    flexShrink: 0,
  },
  hdrAvatar: {
    width: 40, height: 40,
    borderRadius: 12,
    background: "rgba(255,255,255,.22)",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 17,
    flexShrink: 0,
    border: "2px solid rgba(255,255,255,.3)",
  },
  hdrMeta: { display:"flex", flexDirection:"column", gap:2 },
  hdrName: { color:"#fff", fontWeight:700, fontSize:15.5, letterSpacing:"-0.2px" },
  hdrStatus: { display:"flex", alignItems:"center", gap:5, fontSize:11.5, color:"rgba(255,255,255,.8)", fontWeight:500 },
  statusDot: { width:7, height:7, borderRadius:"50%", flexShrink:0 },

  /* messages */
  area: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
  },
  bgPattern: {
    position: "absolute", inset: 0,
    background: `
      radial-gradient(circle at 20% 20%, rgba(108,92,231,.04) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(139,92,246,.04) 0%, transparent 50%)
    `,
    pointerEvents: "none",
  },

  /* date */
  dateRow:  { display:"flex", justifyContent:"center", margin:"16px 0 10px" },
  dateChip: {
    background: "rgba(0,0,0,.06)",
    backdropFilter: "blur(4px)",
    color: "#64748b",
    fontSize: 11.5,
    fontWeight: 600,
    padding: "4px 14px",
    borderRadius: 20,
  },

  /* typing */
  typDot: {
    width: 7, height: 7,
    background: "#6c5ce7",
    borderRadius: "50%",
    display: "inline-block",
  },

  /* popup action button */
  popBtn: {
    background: "none",
    border: "none",
    padding: "7px 12px",
    borderRadius: 9,
    fontSize: 12.5,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    transition: "background .12s, color .12s",
    display: "flex", alignItems: "center", gap: 5,
  },

  /* connection */
  connBanner: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    padding:"7px 16px",
    background:"#fef9c3",
    color:"#92400e",
    fontSize:12, fontWeight:600,
    flexShrink:0,
  },
  connDot: { color:"#f59e0b" },

  /* edit banner */
  editBanner: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"10px 16px",
    background:"#eef2ff",
    borderTop:"2px solid #6c5ce7",
    flexShrink:0,
  },
  editLabel:   { fontSize:11, fontWeight:700, color:"#6c5ce7", display:"block", marginBottom:2 },
  editPreview: { fontSize:12.5, color:"#475569" },
  editClose: {
    background:"none", border:"none",
    color:"#6c5ce7", fontSize:18, cursor:"pointer",
    padding:"4px 6px", borderRadius:6,
  },

  /* input */
  inputWrap: {
    background:"#fff",
    borderTop:"1px solid #f1f5f9",
    padding:"10px 14px 12px",
    flexShrink:0,
    boxShadow:"0 -2px 16px rgba(0,0,0,.04)",
  },
  inputRow: { display:"flex", alignItems:"flex-end", gap:10 },
  textarea: {
    flex:1,
    resize:"none",
    border:"1.5px solid #e2e8f0",
    borderRadius:20,
    padding:"11px 16px",
    fontSize:14,
    lineHeight:1.5,
    fontFamily:"'Plus Jakarta Sans',sans-serif",
    color:"#1e293b",
    background:"#f8fafc",
    outline:"none",
    transition:"border-color .2s, box-shadow .2s",
    maxHeight:120,
    overflowY:"auto",
  },
  sendBtn: {
    width:44, height:44,
    borderRadius:"50%",
    background:"linear-gradient(135deg,#6c5ce7,#8b5cf6)",
    border:"none",
    display:"flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer",
    flexShrink:0,
    boxShadow:"0 4px 14px rgba(108,92,231,.35)",
    transition:"transform .15s, box-shadow .15s, opacity .15s",
  },

  /* modal */
  overlay: {
    position:"fixed", inset:0,
    background:"rgba(0,0,0,.45)",
    backdropFilter:"blur(6px)",
    display:"flex", alignItems:"center", justifyContent:"center",
    zIndex:1000,
  },
  modal: {
    background:"#fff",
    borderRadius:24,
    padding:"28px 24px",
    width:"88%", maxWidth:320,
    textAlign:"center",
    boxShadow:"0 24px 60px rgba(0,0,0,.18)",
    animation:"slideUp .2s ease both",
  },
  modalIcon:   { fontSize:36, marginBottom:12 },
  modalTitle:  { fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:8 },
  modalSub:    { fontSize:13, color:"#64748b", lineHeight:1.55, marginBottom:24 },
  modalBtns:   { display:"flex", gap:10 },
  modalCancel: { flex:1, padding:"12px", background:"#f1f5f9", border:"none", borderRadius:12, fontSize:14, fontWeight:600, color:"#475569", cursor:"pointer" },
  modalDel:    { flex:1, padding:"12px", background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:12, fontSize:14, fontWeight:600, color:"#fff", cursor:"pointer", boxShadow:"0 4px 12px rgba(239,68,68,.3)" },
};