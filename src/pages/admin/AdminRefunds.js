import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const { user, role, loading: authLoading } = useAuth();

  const loadRefunds = useCallback(async () => {
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);
      const res = await api.get("/admin/refunds");
      setRefunds(res.data || []);
    } catch (err) {
      console.error("❌ Error loading refunds:", err);
      alert("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this refund as ${status.toUpperCase()}?`)) return;

    setLoadingId(id);
    try {
      if (status === "approved") {
        await api.post(`/admin/refunds/${id}/approve`);
      } else if (status === "rejected") {
        await api.post(`/admin/refunds/${id}/reject`);
      } else if (status === "completed") {
        await api.post(`/admin/refunds/${id}/complete`);
      }

      await loadRefunds();
      alert(`✅ Refund ${status} successfully!`);
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>⏳ Verifying Admin Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>⏳ Loading refunds...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ color: "#333", margin: 0 }}>💸 Refund Management</h2>
        <button
          onClick={loadRefunds}
          style={{
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            padding: "5px 12px",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {refunds.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          }}
        >
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
              {refunds.map((r) => {
                // 🔥 FIX 1 & 2: Normalize status and handle old "paid" data
                const rawStatus = (r.status || "").toLowerCase();
                const normalizedStatus = rawStatus === "paid" ? "completed" : rawStatus;

                return (
                  <tr key={r.id} style={rowStyle}>
                    <td style={td}>
                      <div>
                        <b>{r.name}</b>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {r.phone}
                      </div>
                    </td>
                    <td style={td}>{r.pg_name}</td>
                    <td style={td}>
                      <div style={{ fontSize: "0.85rem" }}>
                        <b>BK:</b> {r.booking_id}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        <b>ORD:</b> {r.order_id || "N/A"}
                      </div>
                    </td>
                    <td style={td}>
                      <b>₹{r.amount}</b>
                    </td>
                    <td style={td}>
                      <code style={codeText}>{r.upi_id}</code>
                    </td>
                    <td style={td}>{r.reason}</td>
                    <td style={td}>
                      {/* Use normalized status for consistent display */}
                      <span style={statusBadge(normalizedStatus)}>
                        {normalizedStatus.toUpperCase()}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={actionGroup}>
                        {normalizedStatus === "pending" && (
                          <>
                            <button
                              style={approveBtn}
                              onClick={() => updateStatus(r.id, "approved")}
                              disabled={loadingId === r.id}
                            >
                              {loadingId === r.id ? "⏳" : "✅ Approve"}
                            </button>
                            <button
                              style={rejectBtn}
                              onClick={() => updateStatus(r.id, "rejected")}
                              disabled={loadingId === r.id}
                            >
                              {loadingId === r.id ? "⏳" : "❌ Reject"}
                            </button>
                          </>
                        )}
                        {/* 🔥 FIX 3: Prevent double click with disabled state */}
                        {normalizedStatus === "approved" && (
                          <button
                            style={paidBtn}
                            onClick={() => updateStatus(r.id, "completed")}
                            disabled={loadingId === r.id || normalizedStatus === "completed"}
                          >
                            {loadingId === r.id ? "⏳ Processing..." : "💰 Mark Completed"}
                          </button>
                        )}
                        {normalizedStatus === "completed" && (
                          <span
                            style={{
                              color: "#16a34a",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                            }}
                          >
                            ✅ Completed
                          </span>
                        )}
                        {normalizedStatus === "rejected" && (
                          <span style={{ color: "#dc2626", fontSize: "0.85rem" }}>
                            ❌ Rejected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;

/* ===== STYLES ===== */

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
  transition: "opacity 0.2s",
};

const rejectBtn = {
  background: "#dc2626",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "0.85rem",
  transition: "opacity 0.2s",
};

const paidBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "0.85rem",
  transition: "opacity 0.2s",
};

// Status badge with support for normalized status (including "completed")
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
      : status === "completed"
      ? "#dbeafe"
      : "#fee2e2",
  color:
    status === "pending"
      ? "#854d0e"
      : status === "approved"
      ? "#166534"
      : status === "completed"
      ? "#1e40af"
      : "#991b1b",
});