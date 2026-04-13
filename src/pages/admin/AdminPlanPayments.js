import React, { useEffect, useState } from "react";


import api from "../../api/api";
export default function AdminPlanPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/plan/admin");
      setPayments(res.data.data || []);
    } catch (err) {
      alert("❌ Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (orderId) => {
    if (!window.confirm("Approve this payment?")) return;

    try {
      await api.post(`/plan/verify/${orderId}`);
      alert("✅ Plan Activated");
      loadPayments(); // refresh
    } catch {
      alert("❌ Failed to approve");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>💰 Plan Payments</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", marginTop: 20 }}>
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Order ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.plan}</td>
                <td>₹{p.amount}</td>
                <td>{p.order_id}</td>
                <td>
                  {p.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                </td>
                <td>
                  {p.status !== "paid" && (
                    <button
                      onClick={() => approvePayment(p.order_id)}
                      style={{
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}