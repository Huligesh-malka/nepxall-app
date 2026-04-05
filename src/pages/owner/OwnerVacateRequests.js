import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { auth } from "../../firebase";

const OwnerVacateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [damage, setDamage] = useState({});
  const [dues, setDues] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  /* ================= MASK FUNCTIONS ================= */

  const maskAccount = (acc) => {
    if (!acc) return "N/A";
    return "XXXX XXXX " + acc.slice(-4);
  };

  const maskIFSC = (ifsc) => {
    if (!ifsc) return "N/A";
    return "XXXX" + ifsc.slice(-3);
  };

  const maskUPI = (upi) => {
    if (!upi) return "N/A";
    const parts = upi.split("@");
    return parts[0].slice(0, 2) + "***@" + parts[1];
  };

  /* ================= LOAD ================= */

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

  /* ================= ACTIONS ================= */

  const handleApprove = async (bookingId) => {
    if (!window.confirm("Are you sure to approve vacate?")) return;

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

  const handleReject = async (bookingId) => {
    if (!window.confirm("Reject this refund request?")) return;

    try {
      const token = await auth.currentUser.getIdToken();

      await api.post(`/owner/refund/reject/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("❌ Refund Rejected");
      loadRequests();
    } catch (err) {
      alert("Reject failed");
    }
  };

  const handleMarkPaid = async (bookingId) => {
    if (!window.confirm("Mark this as paid?")) return;

    try {
      setLoadingId(bookingId);

      const token = await auth.currentUser.getIdToken();

      await api.post(`/owner/refund/mark-paid/${bookingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("💸 Payment Completed");
      loadRequests();
    } catch (err) {
      alert("Payment failed");
    } finally {
      setLoadingId(null);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={container}>
      <h2>🚪 Vacate & Refund Requests</h2>

      {requests.length === 0 && <p>No requests found</p>}

      {requests.map((item) => {
        const finalRefund =
          (item.security_deposit || 0) -
          (item.damage_amount || 0) -
          (item.pending_dues || 0);

        return (
          <div key={item.booking_id} style={card}>
            <h3>{item.pg_name}</h3>

            {/* USER DETAILS */}
            <p>👤 {item.user_name}</p>
            <p>📞 {item.phone}</p>
            <p>🆔 Booking: {item.booking_id}</p>
            <p>📅 Move Out: {item.move_out_date || "Not provided"}</p>

            {/* REFUND BOX */}
            <div style={refundBox}>
              <p>💳 Deposit: ₹{item.security_deposit}</p>
              <p>⚒ Damage: ₹{item.damage_amount || 0}</p>
              <p>📉 Dues: ₹{item.pending_dues || 0}</p>
              <hr />
              <p><b>💰 Final Refund: ₹{finalRefund}</b></p>

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

                {item.user_approval === "rejected" &&
                  "❌ User Rejected"}

                {item.refund_status === "rejected" &&
                  "❌ Rejected by Owner"}

                {item.refund_status === "paid" &&
                  "💸 Paid"}
              </p>
            </div>

            {/* MASKED BANK DETAILS */}
            <div style={detailsBox}>
              <p>🏦 Account: {maskAccount(item.account_number)}</p>
              <p>🔢 IFSC: {maskIFSC(item.ifsc_code)}</p>
              <p>💸 UPI: {maskUPI(item.upi_id)}</p>
              <p>📝 Reason: {item.reason}</p>
            </div>

            {/* APPROVE / REJECT */}
            {item.refund_status !== "approved" &&
              item.refund_status !== "paid" && (
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

                  <button
                    style={rejectBtn}
                    onClick={() => handleReject(item.booking_id)}
                  >
                    ❌ Reject Refund
                  </button>
                </>
            )}

            {/* MARK PAID ONLY WHEN READY */}
            {item.refund_status === "pending" &&
              item.user_approval === "accepted" && (
                <button
                  style={paidBtn}
                  onClick={() => handleMarkPaid(item.booking_id)}
                  disabled={loadingId === item.booking_id}
                >
                  💸 Mark as Paid
                </button>
            )}

            {item.refund_status === "paid" && (
              <p style={{ color: "green", fontWeight: "bold" }}>
                ✅ Payment Completed
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OwnerVacateRequests;

/* ================= STYLES ================= */

const container = {
  maxWidth: 650,
  margin: "40px auto",
  padding: 20,
  fontFamily: "sans-serif"
};

const card = {
  background: "#fff",
  padding: 20,
  marginBottom: 20,
  borderRadius: 12,
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
  borderRadius: 8
};

const rejectBtn = {
  marginTop: 10,
  padding: 12,
  width: "100%",
  background: "#f44336",
  color: "#fff",
  border: "none",
  borderRadius: 8
};

const paidBtn = {
  marginTop: 15,
  padding: 12,
  width: "100%",
  background: "#ff9800",
  color: "#fff",
  border: "none",
  borderRadius: 8
};

const refundBox = {
  background: "#f9fafb",
  padding: 12,
  borderRadius: 8,
  marginTop: 10,
  marginBottom: 10
};

const detailsBox = {
  background: "#eef6ff",
  padding: 12,
  borderRadius: 8,
  marginTop: 10
};