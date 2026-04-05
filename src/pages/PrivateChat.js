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
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blink   { 0%,80%,100% { opacity:.25; transform:scale(.75); } 40% { opacity:1; transform:scale(1); } }
  @keyframes pulse   { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(18px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes shine   { to { background-position: 200% center; } }

  .chat-root { font-family:'Plus Jakarta Sans',sans-serif; }

  .msg-row      { animation: fadeUp .22s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }
  .action-popup { animation: fadeDown .18s ease both; }

  .dot-1 { animation: blink 1.3s infinite .0s; }
  .dot-2 { animation: blink 1.3s infinite .2s; }
  .dot-3 { animation: blink 1.3s infinite .4s; }

  .chat-input:focus { border-color: #a855f7 !important; box-shadow: 0 0 0 3px rgba(168,85,247,.15) !important; background: #fff !important; }

  /* bubble hover */
  .bubble-mine:hover { background: linear-gradient(135deg, #7c3aed, #a855f7) !important; transform: scale(1.01); transition: all 0.12s ease; }
  .bubble-theirs:hover { background: #fdfdfd !important; box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }

  /* scrollbar */
  .msg-area::-webkit-scrollbar { width: 5px; }
  .msg-area::-webkit-scrollbar-track { background: transparent; }
  .msg-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .msg-area::-webkit-scrollbar-thumb:hover { background: #a855f7; }

  /* send button glow */
  .send-btn:not(:disabled):hover { transform: scale(1.08); box-shadow: 0 8px 22px rgba(168,85,247,.5) !important; }
  .send-btn:not(:disabled):active { transform: scale(.94); }

  .action-btn:hover { background: #f3e8ff !important; color: #9333ea !important; }
  .action-del:hover { background: #fee2e2 !important; color: #dc2626 !important; }
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
      if (socket.connected && me?.id) socket.emit("leave_private_room", { userA: me.id, userB: Number(userId), pg_id: Number(pgId) });
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

        {/* chat background pattern */}
        <div style={s.bgPattern} />

        <div style={{ position:"relative", zIndex:1, padding:"20px 14px 8px" }}>
          {sortedDays.map((day) => (
            <div key={day}>
              <div style={s.dateRow}>
                <span style={s.dateChip}>{fmtDateHeader(day)}</span>
              </div>

              {grouped[day].map((msg, idx) => {
                const isMine   = msg.sender_id === me?.id;
                const prevMsg  = grouped[day][idx - 1];
                const nextMsg  = grouped[day][idx + 1];
                const isFirst  = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isLast   = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                const myRadius   = `20px 6px ${isLast?"6px":"20px"} 20px`;
                const theirRadius = `6px 20px 20px ${isLast?"6px":"20px"}`;

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
                    <div style={{ position:"relative", maxWidth:"82%" }}>
                      <div
                        className={isMine ? "bubble-mine" : "bubble-theirs"}
                        style={{
                          background:    isMine ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#ffffff",
                          color:         isMine ? "#fff" : "#1e293b",
                          borderRadius:  isMine ? myRadius : theirRadius,
                          padding:       "10px 16px",
                          fontSize:      14.5,
                          lineHeight:    1.55,
                          wordBreak:     "break-word",
                          boxShadow:     isMine
                            ? "0 4px 12px rgba(124,58,237,.3)"
                            : "0 2px 12px rgba(0,0,0,.06)",
                          cursor:        "pointer",
                          transition:    "all 0.2s ease",
                          position:      "relative",
                          fontWeight:    500,
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
                          <span style={{ fontSize:10, opacity:.65, marginLeft:8, fontStyle:"italic", fontWeight:400 }}>edited</span>
                        )}
                      </div>

                      {isLast && (
                        <div style={{
                          display:"flex", alignItems:"center", gap:5,
                          marginTop:5,
                          justifyContent: isMine ? "flex-end" : "flex-start",
                          padding:"0 3px",
                        }}>
                          <span style={{ fontSize:10.5, color:"#94a3b8", fontWeight:500 }}>{fmtTime(msg.created_at)}</span>
                          {isMine && (
                            <span style={{ fontSize:12, color: msg.is_read ? "#22c55e" : "#cbd5e1", fontWeight:700 }}>
                              {msg.is_read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      )}

                      {isMine && activeId === msg.id && (
                        <div className="msg-popup action-popup" style={{
                          position:"absolute",
                          top:-48,
                          right:0,
                          background:"#ffffff",
                          borderRadius:20,
                          padding:"6px",
                          display:"flex",
                          gap:6,
                          boxShadow:"0 12px 32px rgba(0,0,0,.12)",
                          border:"1px solid #f1f5f9",
                          zIndex:20,
                          whiteSpace:"nowrap",
                          backdropFilter:"blur(4px)",
                        }}>
                          <button className="action-btn" onClick={()=>startEdit(msg)} style={s.popBtn}>
                            ✏️ Edit
                          </button>
                          <div style={{ width:1, background:"#e2e8f0" }} />
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

          {otherTyping && (
            <div style={{ display:"flex", marginBottom:14, paddingRight:48 }}>
              <div style={{
                background:"#ffffff",
                borderRadius:"8px 20px 20px 20px",
                padding:"12px 18px",
                display:"flex", gap:7, alignItems:"center",
                boxShadow:"0 2px 12px rgba(0,0,0,.06)",
                border:"1px solid #f1f5f9",
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
          {connStatus === "disconnected" ? "Reconnecting..." : "Connection lost. Retrying..."}
        </div>
      )}

      {/* ══ EDIT BANNER ══ */}
      {editingMsg && (
        <div style={s.editBanner}>
          <div>
            <span style={s.editLabel}>✏️ Editing message</span>
            <p style={s.editPreview}>{editingMsg.message.slice(0, 65)}{editingMsg.message.length>65?"…":""}</p>
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
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              <button onClick={updateMsg} style={s.sendBtn} className="send-btn" title="Save">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>
              <button onClick={cancelEdit} style={{...s.sendBtn, background:"#f43f5e", boxShadow:"0 4px 14px rgba(244,63,94,.3)"}} className="send-btn" title="Cancel">
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
                opacity: !text.trim() || sending ? .5 : 1,
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
    background: "#f4f6fb",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    overflow: "hidden",
  },

  /* loader */
  loadWrap: { height:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#f8fafc" },
  spinner:  { width:44, height:44, border:"3px solid #e2e8f0", borderTopColor:"#a855f7", borderRadius:"50%", animation:"spin 0.9s linear infinite" },
  loadTxt:  { marginTop:16, color:"#94a3b8", fontSize:15, fontWeight:600, letterSpacing:"-0.2px" },

  /* header */
  header: {
    background: "linear-gradient(105deg, #6d28d9 0%, #9333ea 100%)",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "0 6px 20px rgba(109,40,217,.25)",
    flexShrink: 0,
    zIndex: 12,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 14,
    background: "rgba(255,255,255,.12)",
    border: "none",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    transition: "all .2s",
    flexShrink: 0,
    backdropFilter: "blur(2px)",
  },
  hdrAvatar: {
    width: 44, height: 44,
    borderRadius: 16,
    background: "rgba(255,255,255,.2)",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 19,
    flexShrink: 0,
    border: "2px solid rgba(255,255,255,.4)",
    position: "relative",
  },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 11, height: 11,
    background: "#22c55e",
    border: "2px solid #6d28d9",
    borderRadius: "50%",
  },
  hdrMeta: { display:"flex", flexDirection:"column", gap:3 },
  hdrName: { color:"#fff", fontWeight:800, fontSize:16.5, letterSpacing:"-0.3px" },
  hdrStatus: { display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(255,255,255,.85)", fontWeight:600 },
  statusDot: { width:8, height:8, borderRadius:"50%", flexShrink:0 },

  /* messages */
  area: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
  },
  bgPattern: {
    position: "absolute", inset: 0,
    background: `
      radial-gradient(circle at 15% 25%, rgba(139,92,246,.05) 0%, transparent 55%),
      radial-gradient(circle at 85% 75%, rgba(168,85,247,.05) 0%, transparent 55%)
    `,
    pointerEvents: "none",
  },

  /* date */
  dateRow:  { display:"flex", justifyContent:"center", margin:"18px 0 14px" },
  dateChip: {
    background: "rgba(255,255,255,.7)",
    backdropFilter: "blur(8px)",
    color: "#475569",
    fontSize: 11.5,
    fontWeight: 700,
    padding: "5px 16px",
    borderRadius: 40,
    boxShadow: "0 1px 3px rgba(0,0,0,.04)",
    border: "1px solid rgba(255,255,255,.8)",
  },

  /* typing */
  typDot: {
    width: 8, height: 8,
    background: "#a855f7",
    borderRadius: "50%",
    display: "inline-block",
  },

  /* popup action button */
  popBtn: {
    background: "none",
    border: "none",
    padding: "7px 14px",
    borderRadius: 40,
    fontSize: 12.5,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
    transition: "all .15s",
    display: "flex", alignItems: "center", gap: 6,
  },

  /* connection */
  connBanner: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"8px 18px",
    background:"#fef9c3",
    color:"#b45309",
    fontSize:12.5, fontWeight:700,
    flexShrink:0,
    borderTop:"1px solid #fde047",
  },
  connDot: { color:"#f59e0b", fontSize:10 },

  /* edit banner */
  editBanner: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"10px 20px",
    background:"#f3e8ff",
    borderTop:"3px solid #a855f7",
    flexShrink:0,
  },
  editLabel:   { fontSize:11.5, fontWeight:800, color:"#9333ea", display:"block", marginBottom:3, letterSpacing:"-0.2px" },
  editPreview: { fontSize:13, color:"#4c1d95", fontWeight:500 },
  editClose: {
    background:"none", border:"none",
    color:"#9333ea", fontSize:20, cursor:"pointer",
    padding:"4px 8px", borderRadius:30,
  },

  /* input */
  inputWrap: {
    background:"#ffffff",
    borderTop:"1px solid #eef2ff",
    padding:"12px 16px 14px",
    flexShrink:0,
    boxShadow:"0 -4px 20px rgba(0,0,0,.02)",
  },
  inputRow: { display:"flex", alignItems:"flex-end", gap:12 },
  textarea: {
    flex:1,
    resize:"none",
    border:"1.5px solid #e2e8f0",
    borderRadius:28,
    padding:"11px 18px",
    fontSize:14.5,
    lineHeight:1.5,
    fontFamily:"'Plus Jakarta Sans',sans-serif",
    color:"#1e293b",
    background:"#fefefe",
    outline:"none",
    transition:"all .2s",
    maxHeight:110,
    overflowY:"auto",
    fontWeight:500,
  },
  sendBtn: {
    width:46, height:46,
    borderRadius:"50%",
    background:"linear-gradient(135deg,#7c3aed,#a855f7)",
    border:"none",
    display:"flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer",
    flexShrink:0,
    boxShadow:"0 6px 18px rgba(124,58,237,.4)",
    transition:"all .18s",
  },

  /* modal */
  overlay: {
    position:"fixed", inset:0,
    background:"rgba(0,0,0,.5)",
    backdropFilter:"blur(8px)",
    display:"flex", alignItems:"center", justifyContent:"center",
    zIndex:1000,
  },
  modal: {
    background:"#fff",
    borderRadius:32,
    padding:"30px 26px",
    width:"88%", maxWidth:340,
    textAlign:"center",
    boxShadow:"0 32px 64px rgba(0,0,0,.2)",
    animation:"slideUp .22s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  modalIcon:   { fontSize:42, marginBottom:14 },
  modalTitle:  { fontSize:19, fontWeight:800, color:"#0f172a", marginBottom:8, letterSpacing:"-0.3px" },
  modalSub:    { fontSize:13.5, color:"#64748b", lineHeight:1.5, marginBottom:28 },
  modalBtns:   { display:"flex", gap:12 },
  modalCancel: { flex:1, padding:"12px", background:"#f1f5f9", border:"none", borderRadius:24, fontSize:14, fontWeight:700, color:"#475569", cursor:"pointer", transition:"background .15s" },
  modalDel:    { flex:1, padding:"12px", background:"linear-gradient(135deg,#ef4444,#e11d48)", border:"none", borderRadius:24, fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer", boxShadow:"0 6px 18px rgba(239,68,68,.35)", transition:"all .15s" },
};