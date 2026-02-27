import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { API_CONFIG, isCashfreeLoaded } from "../config";

const UserBookingHistory = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  //////////////////////////////////////////////////////
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/user/history");
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  //////////////////////////////////////////////////////
  // 💳 PAY
  //////////////////////////////////////////////////////
  const handlePayNow = async (booking) => {
    try {
      if (!isCashfreeLoaded()) {
        alert("Cashfree SDK not loaded");
        return;
      }

      setPayingId(booking.id);

      // ✅ SAFE AMOUNT CALCULATION
      const rent = Number(booking.rent_amount || booking.rent || 0);
      const deposit = Number(booking.security_deposit || 0);
      const maintenance = Number(booking.maintenance_amount || 0);

      const total =
        Number(booking.total_amount) ||
        rent + deposit + maintenance;

      if (!total || total <= 0) {
        alert("Invalid payment amount");
        return;
      }

      // 🔥 CREATE ORDER FROM BACKEND
      const res = await api.post("/payments/create-order", {
        bookingId: booking.id,
        amount: total,
      });

      if (!res.data?.payment_session_id) {
        alert("Failed to initialize payment session");
        return;
      }

      const cashfree = new window.Cashfree({
        mode:
          API_CONFIG.CASHFREE.MODE === "production"
            ? "production"
            : "sandbox",
      });

      await cashfree.checkout({
        paymentSessionId: res.data.payment_session_id,
        redirectTarget: "_self",
      });

    } catch (err) {
      console.error("PAYMENT ERROR:", err.response?.data || err);
      alert(
        err.response?.data?.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setPayingId(null);
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  if (loading) return <p style={{ padding: 30 }}>Loading...</p>;

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

      {bookings.length === 0 ? (
        <div style={emptyState}>
          <p>No bookings found</p>
        </div>
      ) : (
        bookings.map((b) => {
          const rent = Number(b.rent_amount || b.rent || 0);
          const deposit = Number(b.security_deposit || 0);
          const maintenance = Number(b.maintenance_amount || 0);
          const total =
            Number(b.total_amount) || rent + deposit + maintenance;

          return (
            <div key={b.id} style={card}>
              <div style={topRow}>
                <h3>{b.pg_name}</h3>
                <span style={statusBadge(b.status)}>
                  {b.status?.toUpperCase()}
                </span>
              </div>

              <p>📞 {b.phone || "N/A"}</p>
              <p>📅 {new Date(b.check_in_date).toDateString()}</p>
              <p>🛏 {b.room_type}</p>

              {b.room_no && <p>🚪 Room No: {b.room_no}</p>}

              <p>💸 Rent: ₹{rent}</p>
              <p>🔐 Deposit: ₹{deposit}</p>
              <p>🧰 Maintenance: ₹{maintenance}</p>
              <p><b>🧾 Total: ₹{total}</b></p>

              {/* PENDING STATE - NEW DESIGN */}
              {b.status === "pending" && (
                <div style={pendingContainer}>
                  <div style={pendingIcon}>⏳</div>
                  <div style={pendingContent}>
                    <h4 style={pendingTitle}>Waiting for Owner Approval</h4>
                    <p style={pendingMessage}>
                      Your booking request has been sent to the owner. You'll receive a notification once they respond.
                    </p>
                    <div style={pendingSteps}>
                      <div style={stepItem}>
                        <span style={stepDot}>✓</span>
                        <span>Request Sent</span>
                      </div>
                      <div style={stepItem}>
                        <span style={{...stepDot, ...stepDotPending}}>○</span>
                        <span style={stepTextPending}>Owner Review</span>
                      </div>
                      <div style={stepItem}>
                        <span style={{...stepDot, ...stepDotPending}}>○</span>
                        <span style={stepTextPending}>Confirmation</span>
                      </div>
                    </div>
                    <div style={pendingTimer}>
                      <span style={timerIcon}>🕒</span>
                      <span>Typically responds within 24 hours</span>
                    </div>
                  </div>
                </div>
              )}

              {(b.status === "approved" || b.status === "confirmed") && (
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

                  <button
                    style={chatBtn}
                    onClick={() =>
                      navigate(`/chat/private/${b.owner_id}`)
                    }
                  >
                    💬 Chat Owner
                  </button>

                  <button
                    style={agreementBtn}
                    onClick={() => navigate(`/agreement/${b.id}`)}
                  >
                    📄 Preview Agreement
                  </button>
                </div>
              )}

              {b.status === "approved" && (
                <button
                  style={payBtn}
                  onClick={() => handlePayNow(b)}
                  disabled={payingId === b.id}
                >
                  {payingId === b.id
                    ? "Processing..."
                    : `💳 Pay ₹${total}`}
                </button>
              )}

              {b.status === "confirmed" && (
                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <div style={paidBadge}>✅ Paid</div>

                  {!b.kyc_verified && (
                    <button
                      style={kycBtn}
                      onClick={() => navigate("/user/aadhaar-kyc")}
                    >
                      🪪 Complete KYC
                    </button>
                  )}
                </div>
              )}

              {b.status === "rejected" && (
                <button
                  style={rebookBtn}
                  onClick={() => navigate(`/pg/${b.pg_id}`)}
                >
                  🔄 Re-Book
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default UserBookingHistory;

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const container = { maxWidth: 900, margin: "auto", padding: 20 };
const title = { marginBottom: 20 };

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
      ? "#2563eb"
      : status === "confirmed"
      ? "#16a34a"
      : status === "rejected"
      ? "#dc2626"
      : status === "pending"
      ? "#f59e0b"
      : "#6b7280",
});

// PENDING STATE STYLES
const pendingContainer = {
  marginTop: 16,
  padding: "20px 16px",
  background: "linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)",
  borderRadius: 16,
  border: "1px solid #fbbf24",
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
  position: "relative",
  overflow: "hidden",
};

const pendingIcon = {
  fontSize: 32,
  animation: "pulse 2s infinite",
};

const pendingContent = {
  flex: 1,
};

const pendingTitle = {
  margin: "0 0 8px 0",
  fontSize: 16,
  fontWeight: "600",
  color: "#92400e",
};

const pendingMessage = {
  margin: "0 0 16px 0",
  fontSize: 14,
  color: "#b45309",
  lineHeight: "1.5",
};

const pendingSteps = {
  display: "flex",
  gap: 24,
  marginBottom: 16,
  flexWrap: "wrap",
};

const stepItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const stepDot = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#16a34a",
  color: "#fff",
  fontSize: 12,
};

const stepDotPending = {
  background: "#d1d5db",
  color: "#6b7280",
};

const stepTextPending = {
  color: "#6b7280",
};

const pendingTimer = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#92400e",
  background: "rgba(251, 191, 36, 0.2)",
  padding: "8px 12px",
  borderRadius: 40,
  width: "fit-content",
};

const timerIcon = {
  fontSize: 16,
};

const btnRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 15,
};

const payBtn = {
  marginTop: 14,
  padding: "12px 18px",
  background: "#e11d48",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: "bold",
  cursor: "pointer",
};

const paidBadge = {
  background: "#16a34a",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 20,
};

const kycBtn = {
  background: "#0ea5e9",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
};

const errorBox = { padding: 30, color: "red", fontWeight: "bold" };

const retryBtn = {
  marginTop: 10,
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
};

const emptyState = {
  textAlign: "center",
  padding: 40,
  background: "#f9fafb",
  borderRadius: 12,
  color: "#6b7280",
};

const viewBtn = btn("#2563eb");
const announcementBtn = btn("#f59e0b");
const chatBtn = btn("#25d366");
const agreementBtn = btn("#7c3aed");
const rebookBtn = { ...btn("#16a34a"), marginTop: 12 };

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

// Add this CSS to your global styles or create a style tag
const globalStyles = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
`;