import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";

const AdminAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAgreements = async () => {
    try {
      // Note: Endpoint updated to match your backend router /admin/all
      const res = await api.get("/agreements-form/admin/all"); 
      if (res.data.success) {
        setAgreements(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return { bg: "#dcfce7", text: "#166534" };
      case "signed":
        return { bg: "#e0e7ff", text: "#4338ca" };
      case "rejected":
        return { bg: "#fee2e2", text: "#991b1b" };
      case "pending":
      default:
        return { bg: "#fef9c3", text: "#854d0e" };
    }
  };

  if (loading) return <p style={centered}>Loading Agreements...</p>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#1e293b" }}>
        📄 Agreement Management <span style={countBadge}>{agreements.length} Total</span>
      </h2>

      <div style={tableContainer}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={th}>ID</th>
              <th style={th}>Booking ID</th>
              <th style={th}>Applicant</th>
              <th style={th}>City</th>
              <th style={th}>Rent</th>
              <th style={th}>Status</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {agreements.length > 0 ? (
              agreements.map((item) => {
                const style = getStatusStyle(item.agreement_status);
                return (
                  <tr key={item.id} style={trHover} className="admin-tr">
                    <td style={td}>#{item.id}</td>
                    <td style={td}>
                      <span style={bookingBadge}>BK-{item.booking_id}</span>
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: "700", color: "#1e293b" }}>{item.full_name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.mobile}</div>
                    </td>
                    <td style={td}>{item.city || "N/A"}</td>
                    <td style={td}>₹{item.rent}</td>
                    <td style={td}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          backgroundColor: style.bg,
                          color: style.text,
                        }}
                      >
                        {item.agreement_status || "pending"}
                      </span>
                    </td>
                    <td style={td}>
                      <Link to={`/admin/agreement/${item.id}`} style={viewBtn}>
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ ...td, textAlign: "center", color: "#94a3b8" }}>
                  No agreements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* --- Styles --- */
const centered = { textAlign: "center", marginTop: "100px", color: "#64748b", fontFamily: "sans-serif" };
const tableContainer = { 
  background: "#fff", 
  borderRadius: "12px", 
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", 
  border: "1px solid #e2e8f0",
  overflow: "hidden" 
};
const th = { padding: "16px", textAlign: "left", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" };
const td = { padding: "16px", fontSize: "14px", borderBottom: "1px solid #f1f5f9" };
const trHover = { transition: "background 0.2s" };
const viewBtn = { color: "#4f46e5", textDecoration: "none", fontWeight: "700", fontSize: "13px" };
const countBadge = { background: "#4f46e5", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" };
const bookingBadge = { 
  background: "#f1f5f9", 
  color: "#475569", 
  padding: "4px 8px", 
  borderRadius: "6px", 
  fontSize: "12px", 
  fontWeight: "600",
  border: "1px solid #e2e8f0"
};

export default AdminAgreements;