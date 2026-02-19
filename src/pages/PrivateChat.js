import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { io } from "socket.io-client";
import api from "../api/api";
import { Box, Typography, IconButton, Avatar, InputBase, Paper } from "@mui/material";
import { DeleteOutline, Send, ArrowBackIosNew, Edit, Close } from "@mui/icons-material";

const socket = io("http://localhost:5000", { autoConnect: false });

export default function PrivateChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();

  const [me, setMe] = useState(null);
  const [otherUser, setOtherUser] = useState({});
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        init(user);
      } else {
        navigate("/login");
      }
    });

    // Listeners
    socket.on("receive_private_message", (msg) => {
      setMessages((prev) => {
        // Prevent duplicate messages if sender also receives the broadcast
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollBottom();
    });

    socket.on("private_message_updated", ({ id, message }) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, message } : m)));
    });

    socket.on("private_message_deleted", ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    return () => {
      unsubscribeAuth();
      socket.off("receive_private_message");
      socket.off("private_message_updated");
      socket.off("private_message_deleted");
    };
  }, [userId]);

  const init = async (firebaseUser) => {
    try {
      const [meRes, userRes, msgRes] = await Promise.all([
        api.get("/private-chat/me"),
        api.get(`/private-chat/user/${userId}`),
        api.get(`/private-chat/messages/${userId}`)
      ]);

      setMe(meRes.data);
      setOtherUser(userRes.data);
      setMessages(msgRes.data);

      if (!socket.connected) socket.connect();
      
      socket.emit("register", firebaseUser.uid);
      
      // ✅ Critical: Join the room with BOTH IDs
      socket.emit("join_private_room", { 
        userA: meRes.data.id, 
        userB: userId 
      });

      scrollBottom();
    } catch (err) {
      console.error("Init Error:", err);
    }
  };

  const scrollBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSendOrUpdate = async () => {
    if (!text.trim()) return;

    try {
      if (editingId) {
        await api.put(`/private-chat/update/${editingId}`, { message: text });
        
        socket.emit("edit_private_message", {
          sender_id: me.id,
          receiver_id: userId,
          id: editingId,
          message: text
        });

        setMessages((prev) => prev.map(m => m.id === editingId ? { ...m, message: text } : m));
        setEditingId(null);
      } else {
        const res = await api.post("/private-chat/send", {
          receiver_id: userId,
          message: text,
        });

        // ✅ Emit to socket so the owner/tenant sees it live
        socket.emit("send_private_message", res.data);
        setMessages((prev) => [...prev, res.data]);
      }
      setText("");
      scrollBottom();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Action failed"));
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/private-chat/delete/${messageId}`);
      socket.emit("delete_private_message", {
        sender_id: me.id,
        receiver_id: userId,
        id: messageId
      });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f5f5f5" }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "#1976d2", color: "#fff" }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff" }}><ArrowBackIosNew /></IconButton>
        <Avatar sx={{ bgcolor: "#ff9800" }}>{otherUser?.name?.charAt(0)}</Avatar>
        <Typography fontWeight={700}>{otherUser?.name || "Chat"}</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {messages.map((m) => {
          const isMe = Number(m.sender_id) === Number(me?.id);
          return (
            <Box key={m.id} sx={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
              <Paper sx={{ p: 1.5, bgcolor: isMe ? "#1976d2" : "#fff", color: isMe ? "#fff" : "#000", borderRadius: 2 }}>
                <Typography variant="body1">{m.message}</Typography>
                {isMe && (
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                    <IconButton size="small" onClick={() => { setEditingId(m.id); setText(m.message); }} sx={{ color: "inherit", opacity: 0.6 }}><Edit fontSize="inherit" /></IconButton>
                    <IconButton size="small" onClick={() => deleteMessage(m.id)} sx={{ color: "inherit", opacity: 0.6 }}><DeleteOutline fontSize="inherit" /></IconButton>
                  </Box>
                )}
              </Paper>
            </Box>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ p: 2, bgcolor: "#fff" }}>
        {editingId && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="caption" color="orange">Editing...</Typography>
            <IconButton size="small" onClick={() => { setEditingId(null); setText(""); }}><Close fontSize="inherit" /></IconButton>
          </Box>
        )}
        <Paper component="form" onSubmit={(e) => { e.preventDefault(); handleSendOrUpdate(); }} sx={{ display: "flex", p: 1, borderRadius: 5, bgcolor: "#f0f2f5" }}>
          <InputBase sx={{ ml: 1, flex: 1 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
          <IconButton color="primary" onClick={handleSendOrUpdate}><Send /></IconButton>
        </Paper>
      </Box>
    </Box>
  );
}