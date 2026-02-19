import React, { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/api";

const OwnerPGUsers = () => {
  const [uid, setUid] = useState(null);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setError(null);
      } else {
        setUid(null);
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  /* ================= LOAD USERS ================= */
  const loadUsers = useCallback(async () => {
    if (!uid) return;

    try {
      setLoading(true);

      const res = await api.get(`/pg/owner/${uid}/users`);

      setUsers(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load PG users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* ================= STATUS COLOR ================= */
  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return { color: "green", label: "ACTIVE" };
      case "pending":
        return { color: "orange", label: "PENDING" };
      case "left":
        return { color: "red", label: "LEFT" };
      default:
        return { color: "#555", label: status };
    }
  };

  /* ================= STATES ================= */

  if (loading)
    return <h3 style={{ textAlign: "center" }}>Loading users...</h3>;

  if (error)
    return (
      <div style={{ textAlign: "center", color: "red" }}>
        {error}
      </div>
    );

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>👥 Users in Your PGs</h2>

      {users.length === 0 ? (
        <p>No users joined yet</p>
      ) : (
        users.map((u) => {
          const status = getStatusStyle(u.status);

          return (
            <div key={u.pg_user_id} style={card}>
              <h4 style={{ margin: 0 }}>
                {u.pg_name} ({u.pg_code})
              </h4>

              <p>👤 {u.user_name}</p>
              <p>📞 {u.phone || "N/A"}</p>
              <p>🏠 Room: {u.room_no || "Not assigned"}</p>

              <p>
                📌 Status:{" "}
                <b style={{ color: status.color }}>
                  {status.label}
                </b>
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const card = {
  background: "#fff",
  padding: 15,
  marginBottom: 12,
  borderRadius: 10,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

export default OwnerPGUsers;
