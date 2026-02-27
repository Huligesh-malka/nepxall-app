import React, { useEffect, useState, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/api";

const NotificationBell = () => {
  const [uid, setUid] = useState(null);
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef();

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
      else setUid(null);
    });

    return unsub;
  }, []);

  /* ================= LOAD ================= */
  const loadNotifications = useCallback(async () => {
    if (!uid) return;

    try {
      const res = await api.get(`/notifications/${uid}`);
      setList(res.data.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    loadNotifications();

    const timer = setInterval(loadNotifications, 5000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= ACTIONS ================= */
  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setList((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: 1 } : n
        )
      );
    } catch {}
  };

  const unreadCount = list.filter((n) => !n.is_read).length;

  /* ================= UI ================= */

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button style={bellBtn} onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && <span style={badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div style={dropdown}>
          <div style={header}>
            <b>Notifications</b>
          </div>

          {loading ? (
            <p style={{ padding: 10 }}>Loading...</p>
          ) : list.length === 0 ? (
            <p style={{ padding: 10 }}>No notifications</p>
          ) : (
            list.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  padding: 10,
                  background: n.is_read ? "#fff" : "#eef6ff",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                <b>{n.title}</b>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const badge = {
  background: "red",
  color: "#fff",
  borderRadius: "50%",
  padding: "2px 6px",
  fontSize: 12,
  position: "absolute",
  top: -5,
  right: -5,
};

const bellBtn = {
  background: "transparent",
  border: "none",
  fontSize: 22,
  cursor: "pointer",
  position: "relative",
};

const dropdown = {
  position: "absolute",
  right: 0,
  top: 35,
  width: 320,
  background: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,.15)",
  borderRadius: 8,
  zIndex: 999,
  maxHeight: 400,
  overflowY: "auto",
};

const header = {
  padding: 10,
  borderBottom: "1px solid #eee",
  fontWeight: "bold",
};

export default NotificationBell;
