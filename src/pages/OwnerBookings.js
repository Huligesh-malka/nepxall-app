import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../api/api";

const OwnerBookings = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  //////////////////////////////////////////////////////
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadOwnerBookings = useCallback(async () => {
    try {
      setError("");

      const token = await user.getIdToken(true);

      const res = await api.get("/owner/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking history");
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  //////////////////////////////////////////////////////
  // AUTO REFRESH
  //////////////////////////////////////////////////////
  useEffect(() => {
    if (user && role === "owner") {
      loadOwnerBookings();
      const interval = setInterval(loadOwnerBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [user, role, loadOwnerBookings]);

  //////////////////////////////////////////////////////
  // AUTH CHECK
  //////////////////////////////////////////////////////
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  //////////////////////////////////////////////////////
  // UPDATE STATUS
  //////////////////////////////////////////////////////
  const updateStatus = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      setSuccess("");

      const token = await user.getIdToken(true);

      await api.put(
        `/owner/bookings/${bookingId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Booking ${status.toUpperCase()} successfully`);
      loadOwnerBookings();
      setTimeout(() => setSuccess(""), 2500);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  //////////////////////////////////////////////////////
  // TIME LEFT (ONLY FOR DISPLAY)
  //////////////////////////////////////////////////////
  const getRemainingTime = (createdAt) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    const diff = expiry - now;
    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${hours}h ${minutes}m left`;
  };

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////
  if (loading || pageLoading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  return (
    <div style={container}>
      <h2>🏠 Owner Booking Requests</h2>

      {success && <div style={successBox}>{success}</div>}
      {error && <div style={errorBox}>{error}</div>}

      {bookings.length === 0 ? (
        <div style={emptyBox}>No booking requests</div>
      ) : (
        bookings.map((b) => {
          // ✅ FIXED LOGIC
          const isExpired = b.status === "expired";
          const isPending = b.status === "pending";

          return (
            <div key={b.id} style={card}>
              <p><b>PG:</b> {b.pg_name}</p>
              <p><b>Tenant:</b> {b.tenant_name}</p>

              <p><b>Phone:</b> {b.tenant_phone || "🔒 Hidden"}</p>

              <p>
                <b>Check-in:</b>{" "}
                {b.check_in_date
                  ? new Date(b.check_in_date).toDateString()
                  : "N/A"}
              </p>

              <p><b>Room:</b> {b.room_type}</p>

              <p>
                <b>Status:</b>{" "}
                <span style={statusBadge(b.status)}>
                  {b.status?.toUpperCase()}
                </span>
              </p>

              //////////////////////////////////////////////////////
              // ✅ PENDING → APPROVE / REJECT
              //////////////////////////////////////////////////////
              {isPending && !isExpired && (
                <>
                  <p style={{ color: "#2563eb" }}>
                    ⏳ {getRemainingTime(b.created_at)}
                  </p>

                  <div style={{ marginTop: 12 }}>
                    <button
                      style={approveBtn}
                      disabled={actionLoading === b.id}
                      onClick={() => updateStatus(b.id, "approved")}
                    >
                      {actionLoading === b.id ? "Processing..." : "✅ Approve"}
                    </button>

                    <button
                      style={rejectBtn}
                      disabled={actionLoading === b.id}
                      onClick={() => updateStatus(b.id, "rejected")}
                    >
                      {actionLoading === b.id ? "Processing..." : "❌ Reject"}
                    </button>
                  </div>
                </>
              )}

              //////////////////////////////////////////////////////
              // ✅ APPROVED
              //////////////////////////////////////////////////////
              {b.status === "approved" && (
                <p style={{ color: "#2563eb", fontWeight: "bold" }}>
                  💳 Waiting for user payment
                </p>
              )}

              //////////////////////////////////////////////////////
              // ✅ CONFIRMED
              //////////////////////////////////////////////////////
              {b.status === "confirmed" && (
                <p style={{ color: "#16a34a", fontWeight: "bold" }}>
                  ✅ Payment done - Booking Active
                </p>
              )}

              //////////////////////////////////////////////////////
              // ✅ LEFT
              //////////////////////////////////////////////////////
              {b.status === "left" && (
                <p style={{ color: "#6b7280", fontWeight: "bold" }}>
                  🚪 User vacated - Room available
                </p>
              )}

              //////////////////////////////////////////////////////
              // ❌ EXPIRED (ONLY FROM STATUS)
              //////////////////////////////////////////////////////
              {isExpired && (
                <p style={{ color: "red", fontWeight: "bold" }}>
                  ❌ Booking expired
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default OwnerBookings;

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const container = { maxWidth: 900, margin: "auto", padding: 20 };

const card = {
  border: "1px solid #e5e7eb",
  padding: 20,
  borderRadius: 12,
  marginBottom: 16,
  background: "#fff",
};

const emptyBox = {
  padding: 30,
  textAlign: "center",
  background: "#f9fafb",
  borderRadius: 10,
};

const errorBox = {
  padding: 20,
  margin: 20,
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 8,
  fontWeight: "bold",
};

const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: 12,
  borderRadius: 8,
  marginBottom: 15,
  fontWeight: "bold",
};

const statusBadge = (status) => ({
  padding: "4px 12px",
  borderRadius: 20,
  color: "#fff",
  fontSize: 12,
  fontWeight: "bold",
  background:
    status === "approved"
      ? "#2563eb"
      : status === "confirmed"
      ? "#16a34a"
      : status === "rejected"
      ? "#dc2626"
      : status === "left"
      ? "#6b7280"
      : status === "expired"
      ? "#dc2626"
      : "#f59e0b",
});

const approveBtn = {
  padding: "10px 16px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginRight: 10,
};

const rejectBtn = {
  padding: "10px 16px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};