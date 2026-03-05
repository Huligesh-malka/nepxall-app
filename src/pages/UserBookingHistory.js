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
  // CREATE PAYMENT
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
  // USER CLICKED "I HAVE PAID"
  //////////////////////////////////////////////////////
  const confirmPayment = async () => {

    try {

      await api.post("/payments/confirm-payment", {
        orderId: paymentData.orderId
      });

      alert("Payment submitted for verification");

      setPaymentData(null);

      loadBookings();

    } catch (err) {

      console.error(err);
      alert("Payment confirmation failed");

    }

  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  if (loading)
    return (
      <div style={loadingContainer}>
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
                <p>📞 {b.phone || "N/A"}</p>
                <p>
                  📅{" "}
                  {b.check_in_date
                    ? new Date(b.check_in_date).toDateString()
                    : "N/A"}
                </p>
                <p>🛏 {b.room_type || "Single Room"}</p>
              </div>

              <div style={priceBreakdown}>
                <p>💸 Rent: ₹{rent.toLocaleString()}</p>
                <p>🔐 Deposit: ₹{deposit.toLocaleString()}</p>
                <p>🧰 Maintenance: ₹{maintenance.toLocaleString()}</p>
                <p>
                  <b>🧾 Total: ₹{total.toLocaleString()}</b>
                </p>
              </div>

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
                <div style={paidBadge}>✅ Paid</div>
              )}

            </div>

          );

        })

      )}

      {/* PAYMENT MODAL */}

      {paymentData && (

        <div style={paymentModal}>

          <h3>Scan & Pay</h3>

          <p>Amount: ₹{paymentData.amount}</p>

          <img src={paymentData.qr} width="220" alt="UPI QR" />

          <br /><br />

          <a href={paymentData.upiLink} style={payBtn}>
            Pay via UPI
          </a>

          <br /><br />

          <button style={submitBtn} onClick={confirmPayment}>
            I Have Paid
          </button>

          <br /><br />

          <button onClick={() => setPaymentData(null)}>
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

const payBtn = {
  padding: "12px 20px",
  background: "#e11d48",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const submitBtn = {
  padding: "12px 20px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const container = { maxWidth: 900, margin: "40px auto", padding: 20 };
const title = { marginBottom: 30 };
const card = { background: "#fff", padding: 24, borderRadius: 16, marginBottom: 24 };
const topRow = { display: "flex", justifyContent: "space-between" };
const pgName = { margin: 0 };
const statusBadge = () => ({ background: "#6b7280", color: "#fff", padding: 6, borderRadius: 20 });
const detailsGrid = { marginTop: 12 };
const priceBreakdown = { marginTop: 12 };
const paidBadge = { background: "#16a34a", color: "#fff", padding: 10, marginTop: 10 };
const errorBox = { padding: 40, textAlign: "center" };
const retryBtn = { padding: 10 };
const emptyState = { textAlign: "center", padding: 60 };
const browseBtn = { padding: 12 };

const loadingContainer = { textAlign: "center", marginTop: 100 };

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
};

export default UserBookingHistory;