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
    } catch {
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

      const amount =
        booking.total_amount ||
        booking.rent_amount +
          booking.security_deposit +
          booking.maintenance_amount ||
        booking.rent ||
        1;

      const res = await api.post("/payments/create-order", {
        bookingId: booking.id,
        amount,
      });

      const cashfree = new window.Cashfree({
        mode: API_CONFIG.CASHFREE.MODE,
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

      {bookings.map((b) => {
        const rent = b.rent_amount || b.rent || 0;
        const deposit = b.security_deposit || 0;
        const maintenance = b.maintenance_amount || 0;
        const total =
          b.total_amount || rent + deposit + maintenance;

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

            {/* 🏠 ROOM NUMBER */}
            {b.room_no && <p>🚪 Room No: {b.room_no}</p>}

            {/* 💰 AMOUNT BREAKDOWN */}
            <p>💸 Rent: ₹{rent}</p>
            <p>🔐 Deposit: ₹{deposit}</p>
            <p>🧰 Maintenance: ₹{maintenance}</p>
            <p>
              <b>🧾 Total: ₹{total}</b>
            </p>

            {/* ✅ SHOW BUTTONS FOR APPROVED + CONFIRMED */}
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

            {/* 🟡 APPROVED → PAY */}
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

            {/* 🟢 CONFIRMED */}
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

            {/* 🔴 REJECTED */}
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



//////////////////////////////////////////////////////
// 🎨 STYLES (ADD THIS BELOW YOUR COMPONENT)
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