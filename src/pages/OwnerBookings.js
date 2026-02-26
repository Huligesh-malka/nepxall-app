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
      setLoading(true);
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      const token = await user.getIdToken(true);

      const res = await api.get("/owner/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(res.data || []);
    } catch (err) {
      console.error("❌ LOAD BOOKINGS ERROR:", err);

      if (err.response?.status === 403) {
        setError("You are not registered as an owner.");
      } else {
        setError("Failed to load booking history");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) loadOwnerBookings();
      else navigate("/login");
    });

    return unsubscribe;
  }, [loadOwnerBookings, navigate]);

  /* ================= APPROVE / REJECT ================= */
  const updateStatus = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      setSuccess("");

      const token = await auth.currentUser.getIdToken(true);

      await api.put(
        `/owner/bookings/${bookingId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(`Booking ${status.toUpperCase()} successfully`);
      loadOwnerBookings();

      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("❌ UPDATE STATUS ERROR:", err);

      /* 🔐 ONBOARDING NOT COMPLETE */
      if (err.response?.data?.code === "ONBOARDING_PENDING") {
        alert("⚠️ Please complete owner verification first");
        navigate("/owner/bank");
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