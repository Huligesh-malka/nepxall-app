import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import api from "../api/api";

const OwnerBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ================= LOAD BOOKINGS ================= */
  const loadOwnerBookings = useCallback(async () => {
    try {
      const user = auth.currentUser;

      if (!user) return navigate("/login");

      const token = await user.getIdToken();

      const res = await api.get("/owner/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data || []);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 403) {
        setError("You are not registered as an owner.");
      } else {
        setError("Failed to load bookings");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadOwnerBookings();
  }, [loadOwnerBookings]);

  /* ================= APPROVE / REJECT ================= */
  const updateStatus = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      setSuccess("");

      const token = await auth.currentUser.getIdToken();

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

      /* 🔐 OWNER NOT VERIFIED */
      if (err.response?.data?.code === "OWNER_NOT_VERIFIED") {

        alert("⚠️ Please complete owner verification before approving bookings.");

        // ✅ CORRECT ROUTE
        setTimeout(() => {
          navigate("/owner/bank");
        }, 800);

        return;
      }

      alert(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= UI ================= */

  if (loading) return <p style={{ padding: 20 }}>Loading bookings...</p>;

  if (error) return <div style={errorBox}>{error}</div>;

  return (
    <div style={container}>
      <h2>🏠 Owner Booking Requests</h2>

      {success && <div style={successBox}>{success}</div>}

      {bookings.length === 0 ? (
        <div style={emptyBox}>
          No booking requests
          <br />
          <button style={reloadBtn} onClick={loadOwnerBookings}>
            Reload
          </button>
        </div>
      ) : (
        bookings.map((b) => (
          <div key={b.id} style={card}>
            <p><b>PG:</b> {b.pg_name}</p>
            <p><b>Tenant:</b> {b.tenant_name}</p>
            <p><b>Phone:</b> {b.phone}</p>

            <p>
              <b>Check-in:</b>{" "}
              {b.check_in_date
                ? new Date(b.check_in_date).toDateString()
                : "N/A"}
            </p>

            <p><b>Room Type:</b> {b.room_type}</p>

            <p>
              <b>Status:</b>{" "}
              <span style={statusBadge(b.status)}>
                {b.status?.toUpperCase()}
              </span>
            </p>

            {b.status === "pending" && (
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
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default OwnerBookings;

/* ================= STYLES ================= */

const container = {
  maxWidth: 900,
  margin: "auto",
  padding: 20,
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
      ? "#16a34a"
      : status === "rejected"
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

const reloadBtn = {
  marginTop: 10,
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};