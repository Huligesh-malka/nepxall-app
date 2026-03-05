import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import api from "../api/api";

const PaymentPage = () => {

  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");

  const [paymentData, setPaymentData] = useState(null);
  const [utr, setUtr] = useState("");

  //////////////////////////////////////////////////////
  // TOKEN
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
  // LOAD BOOKINGS
  //////////////////////////////////////////////////////
  const loadBookings = useCallback(async () => {

    try {

      const token = await getToken();
      if (!token) return;

      const res = await api.get(
        "/bookings/user/history",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBookings(res.data || []);

    } catch (err) {

      console.error(err);
      setError("Failed to load bookings");

    } finally {
      setLoading(false);
    }

  }, [getToken]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  //////////////////////////////////////////////////////
  // CREATE PAYMENT
  //////////////////////////////////////////////////////
  const handlePayNow = async (booking) => {

    try {

      setPayingId(booking.id);

      const token = await getToken();

      const res = await api.post(
        "/payments/create-payment",
        {
          bookingId: booking.id,
          amount: booking.rent_amount || booking.rent || 1
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPaymentData({
        qr: res.data.qr,
        upiLink: res.data.upiLink,
        orderId: res.data.orderId,
        amount: booking.rent_amount || booking.rent
      });

    } catch (err) {

      console.error(err);
      alert("Payment initialization failed");

    } finally {
      setPayingId(null);
    }

  };

  //////////////////////////////////////////////////////
  // SUBMIT UTR
  //////////////////////////////////////////////////////
  const submitUTR = async () => {

    if (!utr) {
      alert("Enter UTR number");
      return;
    }

    try {

      const token = await getToken();

      await api.post(
        "/payments/submit-utr",
        {
          orderId: paymentData.orderId,
          utr
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Payment submitted for verification");

      setPaymentData(null);
      setUtr("");

      loadBookings();

    } catch (err) {

      console.error(err);
      alert("Failed to submit payment");

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
                : `💳 Pay ₹${b.rent_amount || b.rent || 1}`}
            </button>

          )}

          {b.status === "confirmed" && (
            <p style={{ color: "green" }}>✅ Payment completed</p>
          )}

        </div>

      ))}

      {paymentData && (

        <div style={paymentBox}>

          <h3>Scan & Pay</h3>

          <p>Amount: ₹{paymentData.amount}</p>

          <img
            src={paymentData.qr}
            alt="UPI QR"
            style={{ width: 220 }}
          />

          <br /><br />

          <a href={paymentData.upiLink} style={upiBtn}>
            Pay via UPI
          </a>

          <br /><br />

          <input
            type="text"
            placeholder="Enter UTR number"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            style={utrInput}
          />

          <br /><br />

          <button
            style={submitBtn}
            onClick={submitUTR}
          >
            Submit Payment
          </button>

          <br /><br />

          <button
            style={closeBtn}
            onClick={() => setPaymentData(null)}
          >
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

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  marginBottom: 15,
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
};

const payBtn = {
  padding: "12px 18px",
  background: "#e11d48",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const paymentBox = {
  marginTop: 40,
  padding: 25,
  textAlign: "center",
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
};

const upiBtn = {
  padding: "12px 20px",
  background: "#4CAF50",
  color: "#fff",
  borderRadius: 8,
  textDecoration: "none"
};

const utrInput = {
  padding: 10,
  width: 220,
  borderRadius: 6,
  border: "1px solid #ccc"
};

const submitBtn = {
  padding: "12px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const closeBtn = {
  padding: "10px 16px",
  border: "none",
  background: "#444",
  color: "#fff",
  borderRadius: 6,
  cursor: "pointer"
};

export default PaymentPage;