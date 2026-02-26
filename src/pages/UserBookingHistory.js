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
      })}
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