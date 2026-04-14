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
      loadPayments();
    } catch {
      alert("❌ Failed to approve");
    }
  };

  // 🔥 STATUS UI
  const getStatus = (status) => {
    if (status === "paid") {
      return <span style={{ color: "green", fontWeight: "bold" }}>✅ Paid</span>;
    }
    if (status === "expired") {
      return <span style={{ color: "red", fontWeight: "bold" }}>❌ Expired</span>;
    }
    return <span style={{ color: "orange", fontWeight: "bold" }}>⏳ Pending</span>;
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>💰 Plan Payments</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table
          style={{
            width: "100%",
            marginTop: 20,
            borderCollapse: "collapse",
            background: "#fff",
            borderRadius: 10,
            overflow: "hidden"
          }}
        >
          <thead style={{ background: "#f3f4f6" }}>
            <tr>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Plan</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: 20 }}>
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.phone}</td>
                  <td style={tdStyle}>{p.plan.toUpperCase()}</td>
                  <td style={tdStyle}>₹{p.amount}</td>
                  <td style={tdStyle}>{p.order_id}</td>

                  {/* ✅ STATUS FIX */}
                  <td style={tdStyle}>{getStatus(p.status)}</td>

                  {/* ✅ ACTION FIX */}
                  <td style={tdStyle}>
                    {p.status === "pending" && (
                      <button
                        onClick={() => approvePayment(p.order_id)}
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const thStyle = {
  padding: "12px",
  textAlign: "left",
  fontSize: "14px"
};

const tdStyle = {
  padding: "12px",
  fontSize: "14px"
};