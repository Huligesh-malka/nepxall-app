import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserBookingHistory = () => {
  const userId = 1; // 🔒 TEMP (replace after login)
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/bookings/user/${userId}`
      );
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading booking history...</p>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>📜 My Booking History</h2>

      {bookings.length === 0 && <p>No bookings yet</p>}

      {bookings.map((b) => (
        <div key={b.id} style={card}>
          <p><b>PG:</b> {b.pg_name}</p>
          <p><b>Phone:</b> {b.phone}</p>
          <p>
            <b>Move-in:</b>{" "}
            {b.move_in_date
              ? new Date(b.move_in_date).toDateString()
              : "-"}
          </p>

          <p>
            <b>Status:</b>{" "}
            {b.status === "pending" && "⏳ Pending approval"}
            {b.status === "approved" && "✅ Approved"}
            {b.status === "paid" && "💳 Paid"}
          </p>

          {b.room_no && (
            <p style={{ color: "green" }}>
              🏠 Room: <b>{b.room_no}</b>
            </p>
          )}

          {/* PAYMENT SECTION */}
          {b.status === "approved" && (
            <>
              <p>💵 <b>Rent:</b> ₹{b.rent_amount}</p>
              <p>🔐 <b>Deposit:</b> ₹{b.deposit_amount}</p>

              <button
                style={payBtn}
                onClick={() => {
                  if (!b.id) {
                    alert("Invalid booking ID");
                    return;
                  }

                  navigate(`/payment/${b.id}`, {
                    state: {
                      booking_id: b.id,
                      pg_id: b.pg_id,
                      pg_name: b.pg_name,
                      room_no: b.room_no,
                      rent_amount: b.rent_amount,
                      deposit_amount: b.deposit_amount,
                    },
                  });
                }}
              >
                💳 Pay ₹{b.rent_amount + b.deposit_amount}
              </button>
            </>
          )}

          {/* ALREADY PAID */}
          {b.status === "paid" && (
            <p style={{ color: "#16a34a", fontWeight: "bold" }}>
              ✅ Payment completed
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ===============================
   STYLES
================================ */
const card = {
  border: "1px solid #ddd",
  padding: 20,
  borderRadius: 10,
  marginBottom: 16,
  background: "#fff",
};

const payBtn = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginTop: 10,
};

export default UserBookingHistory;
