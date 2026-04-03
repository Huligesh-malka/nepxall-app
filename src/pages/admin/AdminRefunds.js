import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { auth } from "../../firebase";

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRefunds = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await api.get("/payments/admin/refunds", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRefunds(res.data);
    } catch (err) {
      console.error("❌ Error loading refunds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      await api.put(
        `/payments/admin/refunds/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      loadRefunds(); // refresh
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Failed to update status");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>⏳ Loading refunds...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>💸 Refund Requests</h2>

      {refunds.length === 0 && <p>No refund requests</p>}

      {refunds.map((r) => (
        <div key={r.id} style={card}>
          <p><b>👤 User:</b> {r.name}</p>
          <p><b>📞 Phone:</b> {r.phone}</p>
          <p><b>🏠 PG:</b> {r.pg_name}</p>
          <p><b>💰 Amount:</b> ₹{r.amount}</p>
          <p><b>🏦 UPI ID:</b> {r.upi_id}</p>
          <p><b>📝 Reason:</b> {r.reason}</p>

          <p>
            <b>Status:</b>
            <span style={statusStyle(r.status)}> {r.status}</span>
          </p>

          {/* ACTION BUTTONS */}
          <div style={{ marginTop: 10 }}>
            {r.status === "pending" && (
              <>
                <button
                  style={approveBtn}
                  onClick={() => updateStatus(r.id, "approved")}
                >
                  ✅ Approve
                </button>

                <button
                  style={rejectBtn}
                  onClick={() => updateStatus(r.id, "rejected")}
                >
                  ❌ Reject
                </button>
              </>
            )}

            {r.status === "approved" && (
              <button
                style={paidBtn}
                onClick={() => updateStatus(r.id, "paid")}
              >
                💸 Mark Paid
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRefunds;

/* ===== STYLES ===== */

const card = {
  border: "1px solid #e5e7eb",
  padding: 15,
  marginBottom: 15,
  borderRadius: 10,
  background: "#ffffff",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const approveBtn = {
  marginRight: 10,
  background: "#16a34a",
  color: "#fff",
  padding: "8px 12px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const rejectBtn = {
  marginRight: 10,
  background: "#dc2626",
  color: "#fff",
  padding: "8px 12px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const paidBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "8px 12px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const statusStyle = (status) => ({
  marginLeft: 10,
  padding: "4px 8px",
  borderRadius: 6,
  fontWeight: "bold",
  background:
    status === "pending"
      ? "#facc15"
      : status === "approved"
      ? "#22c55e"
      : status === "paid"
      ? "#3b82f6"
      : "#ef4444",
});