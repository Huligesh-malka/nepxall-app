import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import { io } from "socket.io-client";

const SOCKET_URL = "https://nepxall-backend.onrender.com";

let socket;

export default function PrivateChat() {

  const { userId, pgId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef();

  const [messages,setMessages] = useState([]);
  const [me,setMe] = useState(null);
  const [otherUser,setOtherUser] = useState(null);
  const [text,setText] = useState("");
  const [online,setOnline] = useState(false);
  const [loading,setLoading] = useState(true);
  const [sending,setSending] = useState(false);

  /* =========================
     SCROLL
  ========================= */

  const scrollBottom = () => {
    setTimeout(()=>{
      bottomRef.current?.scrollIntoView({behavior:"smooth"});
    },100);
  };

  /* =========================
     PARAM CHECK
  ========================= */

  useEffect(()=>{
    if(!userId || !pgId){
      navigate(-1);
    }
  },[userId,pgId,navigate]);

  /* =========================
     AUTH + LOAD DATA
  ========================= */

  useEffect(()=>{

    const unsub = onAuthStateChanged(auth, async (fbUser)=>{

      if(!fbUser){
        navigate("/login");
        return;
      }

      try{

        const token = await fbUser.getIdToken();

        const config = {
          headers:{Authorization:`Bearer ${token}`}
        };

        /* LOAD ME */
        const meRes = await api.get("/private-chat/me",config);
        setMe(meRes.data);

        /* LOAD USER */
        const userRes = await api.get(
          `/private-chat/user/${userId}?pg_id=${pgId}`,
          config
        );

        setOtherUser(userRes.data);

        /* LOAD MESSAGES */
        const msgRes = await api.get(
          `/private-chat/messages/${userId}?pg_id=${pgId}`,
          config
        );

        setMessages(msgRes.data || []);

        setLoading(false);
        scrollBottom();

        /* CONNECT SOCKET */

        if(!socket){

          socket = io(SOCKET_URL,{
            transports:["websocket"],
            autoConnect:true
          });

        }

        socket.emit("register",fbUser.uid);

      }catch(err){
        console.error(err);
      }

    });

    return ()=>unsub?.();

  },[userId,pgId,navigate]);

  /* =========================
     JOIN ROOM
  ========================= */

  useEffect(()=>{

    if(!me || !socket) return;

    const roomData = {
      userA: me.id,
      userB: Number(userId),
      pg_id: Number(pgId)
    };

    socket.emit("join_private_room",roomData);

    return ()=>{
      socket.emit("leave_private_room",roomData);
    };

  },[me,userId,pgId]);

  /* =========================
     SOCKET EVENTS
  ========================= */

  useEffect(()=>{

    if(!socket) return;

    const receiveMessage = (msg)=>{

      if(msg.pg_id !== Number(pgId)) return;

      setMessages(prev=>{

        const exists = prev.some(m=>m.id === msg.id);
        if(exists) return prev;

        return [...prev,msg];

      });

      scrollBottom();

    };

    const userOnline = ()=>{
      setOnline(true);
    };

    const userOffline = ()=>{
      setOnline(false);
    };

    socket.on("receive_private_message",receiveMessage);
    socket.on("user_online",userOnline);
    socket.on("user_offline",userOffline);

    return ()=>{

      socket.off("receive_private_message",receiveMessage);
      socket.off("user_online",userOnline);
      socket.off("user_offline",userOffline);

    };

  },[pgId]);

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage = async ()=>{

    if(!text.trim() || sending) return;

    setSending(true);

    try{

      const token = await auth.currentUser.getIdToken();

      const res = await api.post(
        "/private-chat/send",
        {
          receiver_id:Number(userId),
          pg_id:Number(pgId),
          message:text.trim()
        },
        {
          headers:{Authorization:`Bearer ${token}`}
        }
      );

      socket.emit("send_private_message",res.data);

      setMessages(prev=>{

        const exists = prev.some(m=>m.id === res.data.id);
        if(exists) return prev;

        return [...prev,{...res.data,status:"sent"}];

      });

      setText("");
      scrollBottom();

    }catch(err){
      console.error(err);
    }

    setSending(false);

  };

  /* =========================
     DELETE MESSAGE
  ========================= */

  const deleteMessage = async(id)=>{

    try{

      const token = await auth.currentUser.getIdToken();

      await api.delete(`/private-chat/message/${id}`,{
        headers:{Authorization:`Bearer ${token}`}
      });

      setMessages(prev=>prev.filter(m=>m.id!==id));

      socket.emit("delete_private_message",{messageId:id});

    }catch(err){
      console.error(err);
    }

  };

  if(loading){
    return <div style={styles.loader}>Loading chat...</div>;
  }

  return(

    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <span onClick={()=>navigate(-1)} style={styles.back}>←</span>

        <div style={styles.headerInfo}>

          <div style={styles.name}>
            {me?.role === "tenant"
              ? otherUser?.pg_name || "PG"
              : otherUser?.name || "User"}
          </div>

          {me?.role !== "tenant" && (
            <div style={styles.pgName}>
              {otherUser?.pg_name}
            </div>
          )}

          <div style={styles.status}>
            {online ? "🟢 online" : "⚪ offline"}
          </div>

        </div>

      </div>

      {/* CHAT BODY */}

      <div style={styles.chatBody}>

        {messages.map((m)=>(
          <div
            key={m.id}
            style={{
              ...styles.msgRow,
              justifyContent:
                m.sender_id === me?.id
                  ? "flex-end"
                  : "flex-start"
            }}
          >

            <div style={{position:"relative"}}>

              <div
                style={{
                  ...styles.bubble,
                  background:
                    m.sender_id === me?.id
                      ? "linear-gradient(135deg,#667eea,#764ba2)"
                      : "#fff",
                  color:
                    m.sender_id === me?.id
                      ? "#fff"
                      : "#000"
                }}
              >
                {m.message}
              </div>

              {m.sender_id === me?.id && (
                <span
                  onClick={()=>deleteMessage(m.id)}
                  style={styles.deleteBtn}
                >
                  🗑
                </span>
              )}

            </div>

          </div>
        ))}

        <div ref={bottomRef}/>

      </div>

      {/* INPUT */}

      <div style={styles.inputArea}>

        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          placeholder="Type message..."
          style={styles.input}
          onKeyDown={(e)=>{
            if(e.key === "Enter"){
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button
          onClick={sendMessage}
          style={styles.sendBtn}
          disabled={sending}
        >
          ➤
        </button>

      </div>

    </div>
  );

}

/* =========================
   STYLES
========================= */

const styles = {

container:{
height:"100vh",
display:"flex",
flexDirection:"column",
background:"#f1f5f9"
},

header:{
background:"linear-gradient(135deg,#667eea,#764ba2)",
color:"#fff",
padding:12,
display:"flex",
alignItems:"center",
gap:10
},

headerInfo:{
display:"flex",
flexDirection:"column"
},

back:{
cursor:"pointer",
fontSize:20
},

name:{
fontWeight:"bold"
},

pgName:{
fontSize:12,
opacity:0.8
},

status:{
fontSize:12
},

chatBody:{
flex:1,
overflowY:"auto",
padding:15
},

msgRow:{
display:"flex",
marginBottom:10
},

bubble:{
padding:"10px 14px",
borderRadius:15,
maxWidth:"70%"
},

deleteBtn:{
position:"absolute",
top:-8,
right:-8,
cursor:"pointer",
fontSize:14
},

inputArea:{
display:"flex",
padding:10,
background:"#fff",
borderTop:"1px solid #eee"
},

input:{
flex:1,
padding:12,
borderRadius:25,
border:"1px solid #ddd",
outline:"none"
},

sendBtn:{
marginLeft:10,
background:"linear-gradient(135deg,#667eea,#764ba2)",
color:"#fff",
border:"none",
padding:"0 18px",
borderRadius:"50%",
cursor:"pointer"
},

loader:{
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center"
}

};