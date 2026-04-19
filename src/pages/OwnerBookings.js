import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../api/api";

const OwnerBookings = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOwnerBookings = useCallback(async () => {
    try {
      setError("");
      const token = await user.getIdToken(true);
      const res = await api.get("/owner/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking history");
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && role === "owner") {
      loadOwnerBookings();
      const interval = setInterval(loadOwnerBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [user, role, loadOwnerBookings]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const updateStatus = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      setSuccess("");
      
      const token = await user.getIdToken(true);

      // 🔥 CHECK: If approving, verify bank details first
      if (status === "approved") {
        try {
          const bankRes = await api.get("/owner/bank", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const hasBank = bankRes.data?.account_number && bankRes.data?.ifsc;

          if (!hasBank) {
            // Redirect to bank details page with message
            navigate("/owner/bank", {
              state: {
                message: "⚠️ Please complete your bank details to continue onboarding tenants.",
              },
            });
            return;
          }
        } catch (bankErr) {
          // If bank endpoint returns 404 or error, assume no bank details
          if (bankErr.response?.status === 404) {
            navigate("/owner/bank", {
              state: {
                message: "⚠️ Please add your bank details before approving bookings.",
              },
            });
            return;
          }
          throw bankErr; // Re-throw other errors
        }
      }

      // ✅ Proceed with approval/rejection
      await api.put(
        `/owner/bookings/${bookingId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Booking ${status.toUpperCase()} successfully`);
      loadOwnerBookings();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const getRemainingTime = (createdAt) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + 86400000);
    const now = new Date();
    const diff = expiry - now;
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m left`;
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "pending") return b.status === "pending";
    if (filter === "active") return b.status === "confirmed";
    if (filter === "expired") return b.status === "expired";
    if (filter === "history") return b.status === "left";
    return true;
  });

  if (loading || pageLoading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  return (
    <div style={container}>
      <h2>🏠 Owner Booking Requests</h2>

      <div style={filterBar}>
        <button onClick={() => setFilter("all")} style={filterBtn}>All</button>
        <button onClick={() => setFilter("pending")} style={filterBtn}>Pending</button>
        <button onClick={() => setFilter("active")} style={filterBtn}>Active</button>
        <button onClick={() => setFilter("expired")} style={filterBtn}>Expired</button>
        <button onClick={() => setFilter("history")} style={filterBtn}>History</button>
      </div>

      {success && <div style={successBox}>{success}</div>}
      {error && <div style={errorBox}>{error}</div>}

      {filteredBookings.length === 0 ? (
        <div style={emptyBox}>No bookings</div>
      ) : (
        filteredBookings.map((b) => {
          const isExpired = b.status === "expired";
          const isPending = b.status === "pending";

          return (
            <div key={b.id} style={card}>
              <p><b>PG:</b> {b.pg_name}</p>
              <p><b>Tenant:</b> {b.tenant_name}</p>
              <p><b>Phone:</b> {b.tenant_phone || "🔒 Hidden"}</p>
              <p><b>Check-in:</b> {b.check_in_date ? new Date(b.check_in_date).toDateString() : "N/A"}</p>
              <p><b>Room:</b> {b.room_type}</p>

              <p>
                <b>Status:</b>{" "}
                <span style={statusBadge(b.status)}>
                  {b.status?.toUpperCase()}
                </span>
              </p>

              {isPending && (
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
                      {actionLoading === b.id ? "..." : "Approve"}
                    </button>
                    <button
                      style={rejectBtn}
                      disabled={actionLoading === b.id}
                      onClick={() => updateStatus(b.id, "rejected")}
                    >
                      {actionLoading === b.id ? "..." : "Reject"}
                    </button>
                  </div>
                </>
              )}

              {b.status === "approved" && <p style={{ color: "#2563eb" }}>Waiting for payment</p>}
              {b.status === "confirmed" && <p style={{ color: "#16a34a" }}>Active</p>}
              {b.status === "left" && <p style={{ color: "#6b7280" }}>Vacated</p>}
              {isExpired && <p style={{ color: "red" }}>Expired</p>}
            </div>
          );
        })
      )}
    </div>
  );
};

export default OwnerBookings;

const container = { maxWidth: 900, margin: "auto", padding: 20 };

const filterBar = {
  display: "flex",
  gap: 10,
  marginBottom: 20,
  flexWrap: "wrap",
};

const filterBtn = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 20,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
};

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
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 8,
};

const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: 12,
  borderRadius: 8,
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
  padding: "8px 14px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  marginRight: 8,
  cursor: "pointer",
};

const rejectBtn = {
  padding: "8px 14px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};