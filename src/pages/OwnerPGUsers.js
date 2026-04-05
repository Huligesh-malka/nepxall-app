import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../api/api";

const OwnerPGUsers = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= LOAD USERS ================= */
  const loadUsers = useCallback(async () => {
    if (!user) return;

    try {
      setPageLoading(true);

      const res = await api.get(`/pg/owner/${user.uid}/users`);

      setUsers(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load PG users");
      setUsers([]);
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  /* ================= AUTH + LOAD ================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }

    if (user && role === "owner") {
      loadUsers();
    }
  }, [user, role, authLoading, navigate, loadUsers]);

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

  /* ================= PROTECTION ================= */
  if (authLoading || pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  if (error) {
    return (
      <div style={{ textAlign: "center", color: "red", padding: 20 }}>
        {error}
      </div>
    );
  }

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