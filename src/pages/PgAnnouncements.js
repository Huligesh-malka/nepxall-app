import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { autoConnect: false });

const PgAnnouncements = () => {
  const { pgId } = useParams();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [pg, setPg] = useState(null);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const init = useCallback(async (firebaseUser) => {
    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Fetch User and PG data
      const [meRes, pgRes, annRes] = await Promise.all([
        api.get(`/pg/user/${firebaseUser.uid}`, config),
        api.get(`/pg/${pgId}`, config),
        api.get(`/announcements/pg/${pgId}`, config),
      ]);

      // FIX: Ensure we extract the data correctly based on your API response structure
      const userData = meRes.data.data || meRes.data;
      setUser(userData);
      setPg(pgRes.data.data || pgRes.data);
      setAnnouncements(annRes.data || []);

      if (!socket.connected) socket.connect();
      socket.emit("join_pg_room", pgId);

    } catch (err) {
      console.error("INIT ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [pgId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) return navigate("/login");
      init(firebaseUser);
    });
    return () => { unsub(); socket.disconnect(); };
  }, [init, navigate]);

  useEffect(() => {
    const handleIncoming = (data) => {
      if (String(data.pg_id) === String(pgId)) {
        setAnnouncements((prev) => {
          if (prev.find((a) => a.id === data.id)) return prev;
          return [data, ...prev];
        });
      }
    };
    socket.on("receive_announcement", handleIncoming);
    return () => socket.off("receive_announcement", handleIncoming);
  }, [pgId]);

  const postAnnouncement = async () => {
    if (!text.trim() || user?.role !== "owner") return;

    try {
      const res = await api.post("/announcements", {
        pg_id: pgId,
        message: text.trim(),
      });

      // Emit to others via socket
      socket.emit("send_announcement", res.data);
      // Update local state immediately
      setAnnouncements((prev) => [res.data, ...prev]);
      setText("");
    } catch (err) {
      console.error("POST ERROR:", err);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Community Updates...</div>;

  const isOwner = user?.role === "owner";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span onClick={() => navigate(-1)} style={{ cursor: "pointer", marginRight: 10 }}>←</span>
        {pg?.pg_name || "Community Announcements"}
      </div>

      <div style={styles.body}>
        {announcements.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>No announcements yet.</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} style={styles.card}>
              <div style={styles.cardTag}>OFFICIAL</div>
              <p style={styles.cardText}>{a.message}</p>
              <small style={styles.cardDate}>{new Date(a.created_at).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>

      <div style={styles.footer}>
        {isOwner ? (
          <div style={styles.inputContainer}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write an official update..."
              style={styles.textarea}
            />
            <button onClick={postAnnouncement} style={styles.btn}>Post Update</button>
          </div>
        ) : (
          <div style={styles.readOnly}>🔒 Only the PG Owner can post updates here.</div>
        )}
      </div>
    </div>
  );
};

export default PgAnnouncements;

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" },
  header: { padding: 16, fontWeight: "bold", background: "#4f46e5", color: "#fff", display: "flex", alignItems: "center" },
  body: { flex: 1, overflowY: "auto", padding: 15 },
  card: { background: "#fff", padding: 15, borderRadius: 12, marginBottom: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "4px solid #4f46e5" },
  cardTag: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', marginBottom: 5 },
  cardText: { margin: 0, fontSize: 15, color: '#1e293b' },
  cardDate: { fontSize: 11, color: '#94a3b8', marginTop: 8, display: 'block' },
  footer: { padding: 15, background: "#fff", borderTop: "1px solid #e2e8f0" },
  inputContainer: { display: 'flex', flexDirection: 'column' },
  textarea: { width: "100%", height: 80, padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', resize: 'none' },
  btn: { marginTop: 10, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },
  readOnly: { textAlign: "center", color: "#64748b", fontSize: 13, padding: 10 }
};