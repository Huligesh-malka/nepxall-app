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

      const total =
        Number(booking.total_amount) ||
        Number(booking.rent_amount || 0) +
          Number(booking.security_deposit || 0) +
          Number(booking.maintenance_amount || 0);

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
    } catch {
      alert("Payment failed");
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
        <button style={retryBtn} onClick={loadBookings}>
          Retry
        </button>
      </div>
    );

  return (
    <div style={container}>
      <h2>📜 My Bookings</h2>

      {bookings.map((b) => {
        const total =
          Number(b.total_amount) ||
          Number(b.rent_amount || 0) +
            Number(b.security_deposit || 0) +
            Number(b.maintenance_amount || 0);

        return (
          <div key={b.id} style={card}>
            <div style={topRow}>
              <h3>{b.pg_name}</h3>
              <span style={statusBadge(b.status)}>
                {b.status?.toUpperCase()}
              </span>
            </div>

            <p>📅 {new Date(b.check_in_date).toDateString()}</p>
            <p><b>🧾 Total: ₹{total}</b></p>

            {(b.status === "approved" || b.status === "confirmed") && (
              <div style={btnRow}>
                <button style={viewBtn} onClick={() => navigate(`/pg/${b.pg_id}`)}>
                  🏠 View PG
                </button>

                <button
                  style={announcementBtn}
                  onClick={() => navigate(`/user/pg-announcements/${b.pg_id}`)}
                >
                  📢 Announcements
                </button>

                <button
                  style={chatBtn}
                  onClick={() => navigate(`/chat/private/${b.owner_id}`)}
                >
                  💬 Chat Owner
                </button>

                {/* ⭐ MAIN CHAT BUTTON */}
                <button
                  style={mainChatBtn}
                  onClick={() => navigate(`/chat/pg/${b.pg_id}`)}
                >
                  🏘 PG Group Chat
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
                💳 Pay ₹{total}
              </button>
            )}

            {b.status === "confirmed" && <div style={paidBadge}>✅ Paid</div>}
          </div>
        );
      })}
    </div>
  );
};

export default UserBookingHistory;

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const container = { maxWidth: 900, margin: "auto", padding: 20 };

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 14,
  marginBottom: 18,
};

const topRow = { display: "flex", justifyContent: "space-between" };

const statusBadge = (status) => ({
  padding: "6px 14px",
  borderRadius: 20,
  color: "#fff",
  background:
    status === "approved"
      ? "#2563eb"
      : status === "confirmed"
      ? "#16a34a"
      : "#6b7280",
});

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
};

const paidBadge = {
  background: "#16a34a",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 20,
  marginTop: 10,
};

const errorBox = { padding: 30, color: "red" };

const retryBtn = {
  marginTop: 10,
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
};

const viewBtn = btn("#2563eb");
const announcementBtn = btn("#f59e0b");
const chatBtn = btn("#25d366");
const mainChatBtn = btn("#0ea5e9");
const agreementBtn = btn("#7c3aed");

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