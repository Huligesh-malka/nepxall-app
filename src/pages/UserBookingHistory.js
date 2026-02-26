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

      const data = res.data || [];

      // 🔥 IMPORTANT: filter invalid bookings
      const cleaned = data.map((b) => ({
        ...b,
        owner_id: b.owner_id || null,
      }));

      setBookings(cleaned);
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
      console.error(err);
      alert("Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  //////////////////////////////////////////////////////
  // 💬 CHAT NAVIGATION
  //////////////////////////////////////////////////////
  const openChat = (booking) => {
    if (!booking.owner_id) {
      alert("Owner not available for chat");
      return;
    }

    navigate(`/chat/private/${booking.owner_id}`);
  };

  //////////////////////////////////////////////////////
  // UI STATES
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

  if (!bookings.length)
    return <p style={{ padding: 30 }}>No bookings found</p>;

  //////////////////////////////////////////////////////
  // MAIN UI
  //////////////////////////////////////////////////////
  return (
    <div style={container}>
      <h2 style={title}>📜 My Bookings</h2>

      {bookings.map((b) => {
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

            {(b.status === "approved" || b.status === "confirmed") && (
              <div style={btnRow}>
                <button style={viewBtn} onClick={() => navigate(`/pg/${b.pg_id}`)}>
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
                  style={{
                    ...chatBtn,
                    opacity: !b.owner_id ? 0.6 : 1,
                    cursor: !b.owner_id ? "not-allowed" : "pointer",
                  }}
                  onClick={() => openChat(b)}
                  disabled={!b.owner_id}
                >
                  💬 Chat Owner
                </button>

                <button
                  style={agreementBtn}
                  onClick={() => navigate(`/agreement/${b.id}`)}
                >
                  📄 Agreement
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
      })}
    </div>
  );
};

export default UserBookingHistory;