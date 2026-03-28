import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";

const AdminAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAgreements = async () => {
    try {
      const res = await api.get("/agreements/admin/all");
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
    switch (status) {
      case "approved": return { bg: "#dcfce7", text: "#166534" };
      case "signed": return { bg: "#e0e7ff", text: "#4338ca" }; // Indigo for owner signed
      case "rejected": return { bg: "#fee2e2", text: "#991b1b" };
      default: return { bg: "#fef9c3", text: "#854d0e" };
    }
  };

  if (loading) return <p style={centered}>Loading Agreements...</p>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        📄 Agreement Management <span style={countBadge}>{agreements.length} Total</span>
      </h2>

      <div style={tableContainer}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={th}>ID</th>
              <th style={th}>Applicant</th>
              <th style={th}>City</th>
              <th style={th}>Rent</th>
              <th style={th}>Status</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((item) => {
              const style = getStatusStyle(item.status);
              return (
                <tr key={item.id} style={trHover}>
                  <td style={td}>#{item.id}</td>
                  <td style={td}>
                    <div style={{ fontWeight: "700" }}>{item.full_name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{item.mobile}</div>
                  </td>
                  <td style={td}>{item.city || "N/A"}</td>
                  <td style={td}>₹{item.rent}</td>
                  <td style={td}>
                    <span style={{ 
                      padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", 
                      textTransform: "uppercase", backgroundColor: style.bg, color: style.text 
                    }}>
                      {item.status || "pending"}
                    </span>
                  </td>
                  <td style={td}>
                    <Link to={`/admin/agreement/${item.id}`} style={viewBtn}>View Details →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* --- Styles --- */
const centered = { textAlign: "center", marginTop: "50px", color: "#64748b" };
const tableContainer = { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" };
const th = { padding: "16px", textAlign: "left", fontSize: "13px", color: "#64748b", textTransform: "uppercase" };
const td = { padding: "16px", fontSize: "14px", borderBottom: "1px solid #f1f5f9" };
const trHover = { transition: "background 0.2s" };
const viewBtn = { color: "#2563eb", textDecoration: "none", fontWeight: "700" };
const countBadge = { background: "#3b82f6", color: "#fff", padding: "2px 10px", borderRadius: "12px", fontSize: "12px" };

export default AdminAgreements;