import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import api from "../api/api";

const UserBookingHistory = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= GET TOKEN ================= */
  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return null;
    }
    return await user.getIdToken();
  };

  /* ================= LOAD BOOKINGS ================= */
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();
      if (!token) return;

      const res = await api.get("/bookings/user/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data || []);
    } catch (err) {
      console.error("BOOKING LOAD ERROR 👉", err.response?.data || err);
      setError("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  /* ================= UI ================= */

  if (loading) return <p style={{ padding: 30 }}>Loading bookings...</p>;

  if (error)
    return (
      <div style={errorBox}>
        {error}
        <br />
        <button style={retryBtn} onClick={loadBookings}>
          Retry
        </button>
      </div>
    );

  return (
    <div style={container}>
      <h2 style={title}>📜 My Bookings</h2>

      {bookings.length === 0 && (
        <div style={emptyBox}>No bookings yet</div>
      )}

      {bookings.map((b) => (
        <div key={b.id} style={card}>
          <div style={topRow}>
            <h3>{b.pg_name}</h3>
            <span style={statusBadge(b.status)}>
              {b.status?.toUpperCase()}
            </span>
          </div>

          <p>📞 {b.phone || "N/A"}</p>

          <p>
            📅{" "}
            {b.check_in_date
              ? new Date(b.check_in_date).toDateString()
              : "N/A"}
          </p>

          <p>🛏 {b.room_type}</p>

          {/* ❌ REJECT REASON */}
          {b.status === "rejected" && b.reject_reason && (
            <p style={rejectText}>❌ {b.reject_reason}</p>
          )}

          {/* ✅ APPROVED ACTIONS */}
          {b.status === "approved" && (
            <div style={btnRow}>
              <button
                style={viewBtn}
                onClick={() => navigate(`/pg/${b.pg_id}`)}
              >
                🏠 View PG
              </button>

              <button
                style={announcementBtn}
                onClick={() =>
                  navigate(`/user/pg-announcements/${b.pg_id}`)
                }
              >
                📢 Announcements
              </button>

              {b.owner_id ? (
                <button
                  style={chatBtn}
                  onClick={() =>
                    navigate(`/chat/private/${b.owner_id}`)
                  }
                >
                  💬 Chat Owner
                </button>
              ) : (
                <button style={disabledBtn} disabled>
                  ❌ Owner Missing
                </button>
              )}

              {b.agreement_available && (
                <button
                  style={agreementBtn}
                  onClick={() => navigate(`/agreement/${b.id}`)}
                >
                  📄 Agreement
                </button>
              )}
            </div>
          )}

          {/* 🔄 REBOOK */}
          {b.status === "rejected" && (
            <button
              style={rebookBtn}
              onClick={() => navigate(`/pg/${b.pg_id}`)}
            >
              🔄 Re-Book
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserBookingHistory;

/* ================= STYLES ================= */

const container = {
  maxWidth: 900,
  margin: "auto",
  padding: 20,
};

const title = { marginBottom: 20 };

const emptyBox = {
  background: "#f9fafb",
  padding: 30,
  textAlign: "center",
  borderRadius: 10,
};

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 14,
  marginBottom: 18,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const statusBadge = (status) => ({
  padding: "6px 14px",
  borderRadius: 20,
  color: "#fff",
  fontSize: 12,
  fontWeight: "bold",
  background:
    status === "approved"
      ? "#16a34a"
      : status === "rejected"
      ? "#dc2626"
      : "#f59e0b",
});

const rejectText = {
  color: "#dc2626",
  marginTop: 8,
};

const btnRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 15,
};

const errorBox = {
  padding: 30,
  color: "red",
  fontWeight: "bold",
};

const retryBtn = {
  marginTop: 10,
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const viewBtn = btn("#2563eb");
const announcementBtn = btn("#f59e0b");
const chatBtn = btn("#25d366");
const agreementBtn = btn("#7c3aed");
const rebookBtn = { ...btn("#16a34a"), marginTop: 12 };

const disabledBtn = {
  padding: "10px 16px",
  background: "#9ca3af",
  color: "#fff",
  border: "none",
  borderRadius: 8,
};

function btn(color) {
  return {
    padding: "10px 16px",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  };
}
