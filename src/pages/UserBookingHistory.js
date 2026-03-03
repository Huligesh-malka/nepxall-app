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

      const rent = Number(booking.rent_amount || booking.rent || 0);
      const deposit = Number(booking.security_deposit || 0);
      const maintenance = Number(booking.maintenance_amount || 0);

      const total =
        Number(booking.total_amount) || rent + deposit + maintenance;

      if (!total || total <= 0) {
        alert("Invalid payment amount");
        return;
      }

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
  if (loading)
    return (
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
          <button style={browseBtn} onClick={() => navigate("/")}>
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
                <h3 style={pgName}>{b.pg_name || "PG Name"}</h3>
                <span style={statusBadge(b.status)}>
                  {b.status?.toUpperCase() || "PENDING"}
                </span>
              </div>

              <div style={detailsGrid}>
                <p style={detailItem}>📞 {b.phone || "N/A"}</p>
                <p style={detailItem}>
                  📅{" "}
                  {b.check_in_date
                    ? new Date(b.check_in_date).toDateString()
                    : "N/A"}
                </p>
                <p style={detailItem}>🛏 {b.room_type || "Single Room"}</p>
                {b.room_no && (
                  <p style={detailItem}>🚪 Room No: {b.room_no}</p>
                )}
              </div>

              <div style={priceBreakdown}>
                <p style={priceItem}>
                  💸 Rent: ₹{rent.toLocaleString()}
                </p>
                <p style={priceItem}>
                  🔐 Deposit: ₹{deposit.toLocaleString()}
                </p>
                <p style={priceItem}>
                  🧰 Maintenance: ₹{maintenance.toLocaleString()}
                </p>
                <p style={totalPrice}>
                  <b>🧾 Total: ₹{total.toLocaleString()}</b>
                </p>
              </div>

              {/* APPROVED / CONFIRMED */}
              {(b.status === "approved" ||
                b.status === "confirmed") && (
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
                    onClick={() =>
                      navigate(`/agreement/${b.id}`)
                    }
                  >
                    📄 Preview Agreement
                  </button>

                  {/* 🚚 ADD SERVICES BUTTON */}
                  <button
                    style={serviceBtn}
                    onClick={() =>
                      navigate(`/user/services/${b.id}`)
                    }
                  >
                    🚚 Add Services
                  </button>
                </div>
              )}

              {/* PAYMENT */}
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

              {/* CONFIRMED */}
              {b.status === "confirmed" && (
                <div style={confirmedContainer}>
                  <div style={paidBadge}>✅ Paid</div>

                  {!b.kyc_verified && (
                    <button
                      style={kycBtn}
                      onClick={() =>
                        navigate("/user/aadhaar-kyc")
                      }
                    >
                      🪪 Complete KYC
                    </button>
                  )}
                </div>
              )}

              {/* REJECTED */}
              {b.status === "rejected" && (
                <button
                  style={rebookBtn}
                  onClick={() =>
                    navigate(`/pg/${b.pg_id}`)
                  }
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

const serviceBtn = {
  padding: "10px 18px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 14,
  background: "#f59e0b",
  color: "#fff",
};

const viewBtn = { ...serviceBtn, background: "#2563eb" };
const chatBtn = { ...serviceBtn, background: "#25d366" };
const agreementBtn = { ...serviceBtn, background: "#7c3aed" };
const payBtn = {
  ...serviceBtn,
  background: "#e11d48",
  width: "100%",
  marginTop: 10,
};
const kycBtn = { ...serviceBtn, background: "#0ea5e9" };
const rebookBtn = {
  ...serviceBtn,
  background: "#16a34a",
  width: "100%",
  marginTop: 10,
};

const container = { maxWidth: 900, margin: "40px auto", padding: 20 };
const title = { marginBottom: 30, fontSize: 28, fontWeight: 600 };
const loadingContainer = { textAlign: "center", marginTop: 100 };
const loadingSpinner = {
  width: 40,
  height: 40,
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #2563eb",
  borderRadius: "50%",
};
const card = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};
const topRow = { display: "flex", justifyContent: "space-between" };
const pgName = { margin: 0 };
const statusBadge = () => ({ background: "#6b7280", color: "#fff", padding: 6, borderRadius: 20 });
const detailsGrid = { marginTop: 12 };
const detailItem = { margin: 4 };
const priceBreakdown = { marginTop: 12 };
const priceItem = { margin: 4 };
const totalPrice = { marginTop: 8 };
const btnRow = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 };
const confirmedContainer = { marginTop: 16 };
const paidBadge = { background: "#16a34a", color: "#fff", padding: 8 };
const errorBox = { padding: 40, textAlign: "center" };
const retryBtn = { padding: 10 };
const emptyState = { textAlign: "center", padding: 60 };
const browseBtn = { padding: 12 };

export default UserBookingHistory;