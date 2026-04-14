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

  const rejectPayment = async (orderId) => {
    if (!window.confirm("Reject this payment?")) return;

    try {
      await api.post(`/plan/reject/${orderId}`);
      alert("❌ Payment Rejected");
      loadPayments();
    } catch {
      alert("❌ Failed to reject");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "paid":
        return { background: "#10b981", color: "#fff" };
      case "submitted":
        return { background: "#f59e0b", color: "#fff" };
      case "pending":
        return { background: "#6b7280", color: "#fff" };
      case "rejected":
        return { background: "#ef4444", color: "#fff" };
      case "expired":
        return { background: "#374151", color: "#fff" };
      default:
        return {};
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>💰 Plan Payments (Admin Panel)</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111", color: "#fff" }}>
              <th>User</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Order ID</th>
              <th>Screenshot</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr key={p.id} style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>
                <td>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.plan}</td>
                <td>₹{p.amount}</td>
                <td style={{ fontSize: 12 }}>{p.order_id}</td>

                {/* 📸 Screenshot Preview */}
                <td>
                  {p.screenshot ? (
                    <a href={p.screenshot} target="_blank" rel="noreferrer">
                      <img
                        src={p.screenshot}
                        alt="proof"
                        style={{ width: 60, borderRadius: 6 }}
                      />
                    </a>
                  ) : (
                    "—"
                  )}
                </td>

                {/* 🟢 Status Badge */}
                <td>
                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      ...getStatusStyle(p.status),
                    }}
                  >
                    {p.status}
                  </span>
                </td>

                {/* ⚙️ Actions */}
                <td>
                  {p.status === "submitted" && (
                    <>
                      <button
                        onClick={() => approvePayment(p.order_id)}
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          padding: "6px 10px",
                          marginRight: 5,
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => rejectPayment(p.order_id)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {p.status === "pending" && <span>Waiting user</span>}
                  {p.status === "paid" && <span>✅ Done</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}