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

          <a href={paymentData.upiLink} style={payBtn}>
            Pay via UPI
          </a>

          <br />
          <br />

          <button onClick={() => setPaymentData(null)}>Close</button>
        </div>
      )}
    </div>
  );
};