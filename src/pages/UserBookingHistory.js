import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const UserBookingHistory = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  const [paymentData, setPaymentData] = useState(null);

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
  // CREATE UPI PAYMENT
  //////////////////////////////////////////////////////
  const handlePayNow = async (booking) => {
    try {
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

      const res = await api.post("/payments/create-payment", {
        bookingId: booking.id,
        amount: total,
      });

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: total,
      });

    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      alert("Payment initialization failed");
    } finally {
      setPayingId(null);
    }
  };

  //////////////////////////////////////////////////////
  // SUBMIT PAYMENT CONFIRMATION
  //////////////////////////////////////////////////////
  //////////////////////////////////////////////////////
// SUBMIT PAYMENT CONFIRMATION
//////////////////////////////////////////////////////
const submitPayment = async () => {
  try {
    await api.post("/payments/confirm-payment", {
      orderId: paymentData.orderId,
    });

    alert("Payment submitted successfully");

    setPaymentData(null);
    loadBookings();
  } catch (err) {
    console.error(err);
    alert("Failed to submit payment");
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
                <p style={priceItem}>💸 Rent: ₹{rent.toLocaleString()}</p>
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
                    onClick={() => navigate(`/chat/private/${b.owner_id}`)}
                  >
                    💬 Chat Owner
                  </button>

                  <button
                    style={agreementBtn}
                    onClick={() => navigate(`/agreement/${b.id}`)}
                  >
                    📄 Preview Agreement
                  </button>

                  <button
                    style={serviceBtn}
                    onClick={() => navigate(`/user/services/${b.id}`)}
                  >
                    🚚 Add Services
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
                    : `💳 Pay ₹${total.toLocaleString()}`}
                </button>
              )}

              {b.status === "confirmed" && (
                <div style={confirmedContainer}>
                  <div style={paidBadge}>✅ Paid</div>
                </div>
              )}
            </div>
          );
        })
      )}

      {paymentData && (
        <div style={paymentModal}>
          <h3>Scan & Pay</h3>

          <p>Amount: ₹{paymentData.amount}</p>

          <img src={paymentData.qr} width="220" alt="UPI QR" />

          <br />
          <br />

          <a href={paymentData.upiLink} style={upiLinkStyle}>
            Pay via UPI
          </a>

          <br />
          <br />

          <button style={paidButton} onClick={submitPayment}>
            ✅ I have paid
          </button>

          <br />

          <button style={closeButton} onClick={() => setPaymentData(null)}>
            Close
          </button>
        </div>
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
const payBtn = { ...serviceBtn, background: "#e11d48", width: "100%", marginTop: 10 };
const paidButton = { ...serviceBtn, background: "#16a34a", marginTop: 10, width: "80%" };
const closeButton = { ...serviceBtn, background: "#6b7280", marginTop: 10, width: "80%" };

const container = { maxWidth: 900, margin: "40px auto", padding: 20 };
const title = { marginBottom: 30, fontSize: 28, fontWeight: 600 };
const loadingContainer = { textAlign: "center", marginTop: 100 };
const loadingSpinner = { width: 40, height: 40, border: "4px solid #f3f3f3", borderTop: "4px solid #2563eb", borderRadius: "50%", margin: "0 auto 20px" };
const card = { background: "#fff", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" };
const topRow = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const pgName = { margin: 0 };
const statusBadge = () => ({ background: "#6b7280", color: "#fff", padding: "6px 12px", borderRadius: 20, fontSize: 12 });
const detailsGrid = { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 };
const detailItem = { margin: 0 };
const priceBreakdown = { marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8 };
const priceItem = { margin: 4, fontSize: 14 };
const totalPrice = { marginTop: 8, fontSize: 16 };
const btnRow = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 };
const confirmedContainer = { marginTop: 16 };
const paidBadge = { background: "#16a34a", color: "#fff", padding: "8px 16px", borderRadius: 20, display: "inline-block" };
const errorBox = { padding: 40, textAlign: "center" };
const retryBtn = { padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const emptyState = { textAlign: "center", padding: 60 };
const browseBtn = { padding: "12px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };

const paymentModal = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
  padding: 30,
  borderRadius: 12,
  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  textAlign: "center",
  width: "90%",
  maxWidth: 400,
};

const upiLinkStyle = {
  ...serviceBtn,
  background: "#2563eb",
  textDecoration: "none",
  display: "inline-block",
  width: "80%",
};

export default UserBookingHistory;