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
  if (loading) return (
    <div style={loadingContainer}>
      <div style={loadingSpinner}></div>
      <p>Loading your bookings...</p>
    </div>
  );

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
          <button 
            style={browseBtn}
            onClick={() => navigate("/")}
          >
            Browse Properties
          </button>
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
                <h3 style={pgName}>{b.pg_name || "Bhayana"}</h3>
                <span style={statusBadge(b.status)}>
                  {b.status?.toUpperCase() || "PENDING"}
                </span>
              </div>

              <div style={detailsGrid}>
                <p style={detailItem}>📞 {b.phone || "N/A"}</p>
                <p style={detailItem}>📅 {b.check_in_date ? new Date(b.check_in_date).toDateString() : "Fri Feb 27 2026"}</p>
                <p style={detailItem}>🛏 {b.room_type || "Single Room"}</p>
                {b.room_no && <p style={detailItem}>🚪 Room No: {b.room_no}</p>}
              </div>

              <div style={priceBreakdown}>
                <p style={priceItem}>💸 Rent: ₹{rent.toLocaleString()}</p>
                <p style={priceItem}>🔐 Deposit: ₹{deposit.toLocaleString()}</p>
                <p style={priceItem}>🧰 Maintenance: ₹{maintenance.toLocaleString()}</p>
                <p style={totalPrice}><b>🧾 Total: ₹{total.toLocaleString()}</b></p>
              </div>

              {/* PENDING STATE - WITH FULL DESIGN */}
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
                        <span style={stepText}>Request Sent</span>
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

              {/* APPROVED STATE - WITHOUT ANNOUNCEMENTS BUTTON */}
              {(b.status === "approved" || b.status === "confirmed") && (
                <div style={btnRow}>
                  <button
                    style={viewBtn}
                    onClick={() => navigate(`/pg/${b.pg_id}`)}
                  >
                    🏠 View PG
                  </button>

                 <button
  style={chatBtn}
  onClick={() => {
    console.log("OWNER ID →", b.owner_id); // 🔍 debug

    if (!b.owner_id) {
      alert("Owner not available for chat");
      return;
    }

    navigate(`/chat/private/${b.owner_id}`);
  }}
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

              {/* PAYMENT BUTTON FOR APPROVED */}
              {b.status === "approved" && (
                <button
                  style={payBtn}
                  onClick={() => handlePayNow(b)}
                  disabled={payingId === b.id}
                >
                  {payingId === b.id
                    ? "Processing..."
                    : `💳 Pay ₹${total.toLocaleString()}`}
                </button>
              )}

              {/* CONFIRMED STATE */}
              {b.status === "confirmed" && (
                <div style={confirmedContainer}>
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

              {/* REJECTED STATE */}
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

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const container = { 
  maxWidth: 900, 
  margin: "40px auto", 
  padding: "0 20px",
  fontFamily: "'Segoe UI', Roboto, sans-serif"
};

const title = { 
  marginBottom: 30,
  fontSize: 28,
  fontWeight: 600,
  color: "#1f2937",
  borderBottom: "2px solid #e5e7eb",
  paddingBottom: 12
};

const loadingContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 400,
  gap: 16
};

const loadingSpinner = {
  width: 40,
  height: 40,
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #2563eb",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};

const card = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid #f0f0f0",
  transition: "transform 0.2s, box-shadow 0.2s",
  ":hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
  }
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const pgName = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  color: "#111827"
};

const statusBadge = (status) => ({
  padding: "6px 14px",
  borderRadius: 30,
  color: "#fff",
  fontSize: 12,
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
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
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
});

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
  marginBottom: 16,
  padding: "12px 0",
  borderTop: "1px solid #f0f0f0",
  borderBottom: "1px solid #f0f0f0"
};

const detailItem = {
  margin: 0,
  fontSize: 14,
  color: "#4b5563",
  display: "flex",
  alignItems: "center",
  gap: 6
};

const priceBreakdown = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginBottom: 16,
  padding: "12px 0",
  background: "#f9fafb",
  borderRadius: 12,
  padding: "16px"
};

const priceItem = {
  margin: 0,
  fontSize: 14,
  color: "#374151"
};

const totalPrice = {
  margin: 0,
  fontSize: 16,
  color: "#111827",
  gridColumn: "1 / -1",
  marginTop: 8,
  paddingTop: 8,
  borderTop: "1px dashed #d1d5db"
};

// PENDING STATE STYLES
const pendingContainer = {
  marginTop: 16,
  padding: "20px 16px",
  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
  borderRadius: 16,
  border: "1px solid #fcd34d",
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.1)"
};

const pendingIcon = {
  fontSize: 36,
  animation: "pulse 2s infinite",
  background: "rgba(245, 158, 11, 0.1)",
  padding: 8,
  borderRadius: "50%",
  width: 52,
  height: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
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
  lineHeight: "1.6",
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
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#16a34a",
  color: "#fff",
  fontSize: 12,
  fontWeight: "bold",
};

const stepDotPending = {
  background: "#d1d5db",
  color: "#6b7280",
};

const stepText = {
  fontSize: 14,
  color: "#374151",
  fontWeight: 500
};

const stepTextPending = {
  fontSize: 14,
  color: "#9ca3af",
};

const pendingTimer = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#92400e",
  background: "rgba(251, 191, 36, 0.2)",
  padding: "8px 14px",
  borderRadius: 40,
  width: "fit-content",
};

const timerIcon = {
  fontSize: 16,
};

// BUTTON STYLES
const btnRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 16,
  paddingTop: 16,
  borderTop: "1px solid #f0f0f0"
};

const baseBtn = {
  padding: "10px 18px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 14,
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  ":hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
  },
  ":disabled": {
    opacity: 0.6,
    cursor: "not-allowed"
  }
};

const payBtn = {
  ...baseBtn,
  marginTop: 8,
  padding: "12px 24px",
  background: "#e11d48",
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
  width: "100%",
  justifyContent: "center",
};

const confirmedContainer = {
  marginTop: 16,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  paddingTop: 16,
  borderTop: "1px solid #f0f0f0"
};

const paidBadge = {
  background: "#16a34a",
  color: "#fff",
  padding: "8px 20px",
  borderRadius: 30,
  fontSize: 14,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const kycBtn = {
  ...baseBtn,
  background: "#0ea5e9",
  color: "#fff",
};

const errorBox = { 
  padding: 40, 
  color: "#dc2626", 
  fontWeight: "bold",
  textAlign: "center",
  background: "#fee2e2",
  borderRadius: 12,
  margin: 20
};

const retryBtn = {
  ...baseBtn,
  marginTop: 16,
  background: "#2563eb",
  color: "#fff",
};

const emptyState = {
  textAlign: "center",
  padding: 60,
  background: "#f9fafb",
  borderRadius: 16,
  color: "#6b7280",
  fontSize: 16
};

const browseBtn = {
  ...baseBtn,
  marginTop: 20,
  background: "#2563eb",
  color: "#fff",
  fontSize: 16,
  padding: "12px 32px"
};

const viewBtn = { ...baseBtn, background: "#2563eb", color: "#fff" };
const chatBtn = { ...baseBtn, background: "#25d366", color: "#fff" };
const agreementBtn = { ...baseBtn, background: "#7c3aed", color: "#fff" };
const rebookBtn = { ...baseBtn, background: "#16a34a", color: "#fff", marginTop: 12, width: "100%", justifyContent: "center" };

// Add global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .card {
    animation: slideIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default UserBookingHistory;