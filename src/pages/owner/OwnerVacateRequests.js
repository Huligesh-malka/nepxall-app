import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { auth } from "../../firebase";

const OwnerVacateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [damage, setDamage] = useState({});
  const [dues, setDues] = useState({});

  const loadRequests = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

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

  const handleApprove = async (bookingId) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

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
      console.error(err);
      alert("Approval failed");
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
          <p>📅 Move Out: {item.move_out_date || "Not given"}</p>

          {/* 💰 REFUND BOX */}
          <div style={refundBox}>
            <p><b>💳 Deposit:</b> ₹{item.security_deposit}</p>
            <p><b>💰 Refund Amount:</b> ₹{item.refund_amount || 0}</p>

            <p>
              <b>Status:</b>{" "}
              {item.refund_status === "pending" && "⏳ Pending"}
              {item.refund_status === "approved" && "✅ Approved"}
              {item.refund_status === "paid" && "💸 Paid"}
              {item.refund_status === "rejected" && "❌ Rejected"}
            </p>

            {/* 👤 USER ACTION */}
            {item.user_approval === "accepted" && (
              <p style={{ color: "green" }}>✅ User Accepted</p>
            )}

            {item.user_approval === "rejected" && (
              <p style={{ color: "red" }}>❌ User Rejected</p>
            )}
          </div>

          {/* 🔥 SHOW INPUT ONLY IF PENDING */}
          {item.refund_status === "pending" && (
            <>
              <input
                type="number"
                placeholder="Damage ₹"
                value={damage[item.booking_id] || ""}
                onChange={(e) =>
                  setDamage({ ...damage, [item.booking_id]: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                placeholder="Pending Dues ₹"
                value={dues[item.booking_id] || ""}
                onChange={(e) =>
                  setDues({ ...dues, [item.booking_id]: e.target.value })
                }
                style={input}
              />

              <button
                style={approveBtn}
                onClick={() => handleApprove(item.booking_id)}
              >
                ✅ Approve Vacate
              </button>
            </>
          )}

          {/* 🔥 AFTER APPROVED */}
          {item.refund_status === "approved" && (
            <div style={approvedBox}>
              <p>✅ Waiting for user confirmation...</p>
            </div>
          )}

          {/* 🔥 FINAL PAID */}
          {item.refund_status === "paid" && (
            <div style={paidBox}>
              <p>💸 Refund Completed</p>
            </div>
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

const refundBox = {
  background: "#f9fafb",
  padding: 12,
  borderRadius: 8,
  marginTop: 10,
  marginBottom: 10
};

const approvedBox = {
  background: "#e6f7ff",
  padding: 10,
  borderRadius: 6,
  marginTop: 10
};

const paidBox = {
  background: "#e8f5e9",
  padding: 10,
  borderRadius: 6,
  marginTop: 10,
  color: "green",
  fontWeight: "bold"
};