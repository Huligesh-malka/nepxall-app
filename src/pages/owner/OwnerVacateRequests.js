import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { auth } from "../../firebase";

const OwnerVacateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [damage, setDamage] = useState({});
  const [dues, setDues] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const loadRequests = async () => {
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await api.get("/owner/vacate/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // ✅ APPROVE
  const handleApprove = async (bookingId) => {
    try {
      setLoadingId(bookingId);

      const token = await auth.currentUser.getIdToken();

      const res = await api.post(
        `/owner/vacate/approve/${bookingId}`,
        {
          damage_amount: Number(damage[bookingId]) || 0,
          pending_dues: Number(dues[bookingId]) || 0
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(`✅ Approved! Refund: ₹${res.data.refundAmount}`);
      loadRequests();
    } catch (err) {
      alert("Approval failed");
    } finally {
      setLoadingId(null);
    }
  };

  // ✅ MARK PAID
  const handleMarkPaid = async (bookingId) => {
    try {
      setLoadingId(bookingId);

      const token = await auth.currentUser.getIdToken();

      await api.post(
        `/owner/refund/mark-paid/${bookingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("💸 Payment Completed");
      loadRequests();
    } catch (err) {
      alert("Payment failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={container}>
      <h2>🚪 Vacate & Refund Requests</h2>

      {requests.length === 0 && <p>No requests found</p>}

      {requests.map((item) => (
        <div key={item.booking_id} style={card}>
          <h3>{item.pg_name}</h3>
          <p>👤 Tenant: {item.user_name}</p>
          <p>📅 Move Out: {item.move_out_date || "Not provided"}</p>

          <div style={refundBox}>
            <p><b>💳 Deposit:</b> ₹{item.security_deposit}</p>
            <p><b>💰 Refund:</b> ₹{item.refund_amount || 0}</p>

            {/* ✅ STATUS */}
            <p>
              <b>Status:</b>{" "}

              {item.refund_status === "pending" &&
                item.user_approval === "pending" &&
                "📝 Awaiting Owner Approval"}

              {item.refund_status === "approved" &&
                "⏳ Waiting for User"}

              {item.refund_status === "pending" &&
                item.user_approval === "accepted" &&
                "💰 Ready to Pay"}

              {item.refund_status === "pending" &&
                item.user_approval === "rejected" &&
                "❌ User Rejected"}

              {item.refund_status === "paid" &&
                "💸 Paid"}
            </p>

            {item.user_approval === "accepted" && (
              <p style={{ color: "green" }}>🙋 User Accepted</p>
            )}
            {item.user_approval === "rejected" && (
              <p style={{ color: "red" }}>❌ User Rejected</p>
            )}
          </div>

          {/* ✅ APPROVE BUTTON */}
          {item.refund_status === "pending" &&
            item.user_approval === "pending" && (
              <>
                <input
                  type="number"
                  placeholder="Damage ₹"
                  value={damage[item.booking_id] || ""}
                  onChange={(e) =>
                    setDamage({
                      ...damage,
                      [item.booking_id]: e.target.value
                    })
                  }
                  style={input}
                />

                <input
                  type="number"
                  placeholder="Pending Dues ₹"
                  value={dues[item.booking_id] || ""}
                  onChange={(e) =>
                    setDues({
                      ...dues,
                      [item.booking_id]: e.target.value
                    })
                  }
                  style={input}
                />

                <button
                  style={approveBtn}
                  onClick={() => handleApprove(item.booking_id)}
                  disabled={loadingId === item.booking_id}
                >
                  {loadingId === item.booking_id
                    ? "Processing..."
                    : "✅ Approve Vacate"}
                </button>
              </>
          )}

          {/* 💰 MARK PAID */}
          {item.refund_status === "pending" &&
            item.user_approval === "accepted" && (
              <button
                style={paidBtn}
                onClick={() => handleMarkPaid(item.booking_id)}
                disabled={loadingId === item.booking_id}
              >
                {loadingId === item.booking_id
                  ? "Processing..."
                  : "💸 Mark as Paid"}
              </button>
          )}

          {/* ✅ FINAL */}
          {item.refund_status === "paid" && (
            <p style={{ color: "green", fontWeight: "bold" }}>
              ✅ Payment Completed
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default OwnerVacateRequests;

/* ================= STYLES ================= */

const container = {
  maxWidth: 600,
  margin: "40px auto",
  padding: 20,
  fontFamily: "sans-serif"
};

const card = {
  background: "#fff",
  padding: 20,
  marginBottom: 20,
  borderRadius: 10,
  boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ccc"
};

const approveBtn = {
  marginTop: 15,
  padding: 12,
  width: "100%",
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
};

const paidBtn = {
  marginTop: 15,
  padding: 12,
  width: "100%",
  background: "#ff9800",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
};

const refundBox = {
  background: "#f9fafb",
  padding: 12,
  borderRadius: 8,
  marginTop: 10,
  marginBottom: 10
};