import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext"; // ✅ Added AuthContext

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 1. Get Auth State
  const { user, role, loading: authLoading } = useAuth();

  // 🔹 Load data
  const loadRefunds = useCallback(async () => {
    // Only fetch if authenticated and admin
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);
      // Assuming 'api' instance handles tokens via interceptors
      const res = await api.get("/payments/admin/refunds");
      setRefunds(res.data || []);
    } catch (err) {
      console.error("❌ Error loading refunds:", err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  // ✅ 2. Handle Route Protection Logic
  if (authLoading) {
    return <p style={{ padding: 20 }}>⏳ Verifying Admin Session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // 🔹 Update Status
  const updateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this as ${status}?`)) return;

    try {
      await api.put(`/payments/admin/refunds/${id}`, { status });
      loadRefunds(); // Refresh list after update
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Failed to update status");
    }
  };

  /* ================= UI ================= */

  if (loading) return <p style={{ padding: 20 }}>⏳ Loading refunds...</p>;

  return (
    <div style={{ padding: 20, maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#333", margin: 0 }}>💸 Refund Management</h2>
        <button 
          onClick={loadRefunds}
          style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "0.85rem" }}
        >
          Refresh Data
        </button>
      </div>

      {refunds.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <p style={{ color: "#64748b" }}>No refund requests found.</p>
        </div>
      ) : (
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead>
              <tr style={headerRow}>
                <th style={th}>User / Phone</th>
                <th style={th}>PG Details</th>
                <th style={th}>IDs (Booking/Order)</th>
                <th style={th}>Amount</th>
                <th style={th}>UPI ID</th>
                <th style={th}>Reason</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} style={rowStyle}>
                  <td style={td}>
                    <div><b>{r.name}</b></div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>{r.phone}</div>
                  </td>
                  <td style={td}>{r.pg_name}</td>
                  <td style={td}>
                    <div style={{ fontSize: "0.85rem" }}><b>BK:</b> {r.booking_id}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}><b>ORD:</b> {r.order_id || "N/A"}</div>
                  </td>
                  <td style={td}><b>₹{r.amount}</b></td>
                  <td style={td}><code style={codeText}>{r.upi_id}</code></td>
                  <td style={td}>{r.reason}</td>
                  <td style={td}>
                    <span style={statusBadge(r.status)}>{r.status}</span>
                  </td>
                  <td style={td}>
                    <div style={actionGroup}>
                      {r.status === "pending" && (
                        <>
                          <button style={approveBtn} onClick={() => updateStatus(r.id, "approved")}>
                            Approve
                          </button>
                          <button style={rejectBtn} onClick={() => updateStatus(r.id, "rejected")}>
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <button style={paidBtn} onClick={() => updateStatus(r.id, "paid")}>
                          Mark Paid
                        </button>
                      )}
                      {r.status === "paid" && <span style={{ color: "#16a34a", fontSize: "0.85rem", fontWeight: "bold" }}>✅ Completed</span>}
                      {r.status === "rejected" && <span style={{ color: "#dc2626", fontSize: "0.85rem" }}>Rejected</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;

/* ===== STYLES (Kept from your original) ===== */

const tableContainer = {
  width: "100%",
  overflowX: "auto",
  background: "#fff",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
  fontFamily: "Arial, sans-serif",
};

const headerRow = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
};

const th = {
  padding: "15px",
  fontSize: "0.9rem",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const td = {
  padding: "15px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "middle",
  fontSize: "0.95rem",
};

const rowStyle = {
  transition: "background 0.2s",
};

const codeText = {
  background: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: "4px",
  fontFamily: "monospace",
};

const actionGroup = {
  display: "flex",
  gap: "8px",
};

const approveBtn = {
  background: "#16a34a",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const rejectBtn = {
  background: "#dc2626",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const paidBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "0.85rem",
};

const statusBadge = (status) => ({
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  textTransform: "uppercase",
  display: "inline-block",
  textAlign: "center",
  minWidth: "80px",
  background:
    status === "pending"
      ? "#fef9c3"
      : status === "approved"
      ? "#dcfce7"
      : status === "paid"
      ? "#dbeafe"
      : "#fee2e2",
  color:
    status === "pending"
      ? "#854d0e"
      : status === "approved"
      ? "#166534"
      : status === "paid"
      ? "#1e40af"
      : "#991b1b",
});