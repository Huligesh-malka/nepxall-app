import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import api from "../api/api";
import { API_CONFIG, isCashfreeLoaded } from "../config";

const UserBookingHistory = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");

  //////////////////////////////////////////////////////
  // 🔐 TOKEN
  //////////////////////////////////////////////////////
  const getToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return null;
    }
    return await user.getIdToken();
  }, [navigate]);

  //////////////////////////////////////////////////////
  // 📦 LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.get("/bookings/user/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  //////////////////////////////////////////////////////
  // 💳 PAYMENT
  //////////////////////////////////////////////////////
  const handlePayNow = async (booking) => {
    try {
      if (!isCashfreeLoaded()) {
        alert("Cashfree SDK not loaded");
        return;
      }

      setPayingId(booking.id);

      const token = await getToken();

      const res = await api.post(
        "/payments/create-order",   // ✅ FIXED
        {
          bookingId: booking.id,
          amount: booking.rent || 1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const cashfree = new window.Cashfree({
        mode: API_CONFIG.CASHFREE.MODE,
      });

      await cashfree.checkout({
        paymentSessionId: res.data.payment_session_id,
        redirectTarget: "_self",
      });

    } catch (err) {
      console.error("PAYMENT ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  if (loading) return <p style={{ padding: 30 }}>Loading...</p>;

  if (error) return <p style={{ padding: 30 }}>{error}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>📜 My Bookings</h2>

      {bookings.map((b) => (
        <div key={b.id} style={card}>
          <h3>{b.pg_name}</h3>
          <p>📞 {b.phone}</p>
          <p>📅 {new Date(b.check_in_date).toDateString()}</p>

          {b.status === "approved" && (
            <button
              style={payBtn}
              onClick={() => handlePayNow(b)}
              disabled={payingId === b.id}
            >
              {payingId === b.id
                ? "Processing..."
                : `💳 Pay ₹${b.rent || 1}`}
            </button>
          )}

          {b.status === "confirmed" && (
            <p style={{ color: "green" }}>✅ Payment completed</p>
          )}
        </div>
      ))}
    </div>
  );
};

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  marginBottom: 15,
};

const payBtn = {
  padding: "12px 18px",
  background: "#e11d48",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

export default UserBookingHistory;