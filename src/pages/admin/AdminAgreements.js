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

  if (loading) return <p style={centered}>Loading Agreements...</p>;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        📄 All Agreements <span style={countBadge}>{agreements.length}</span>
      </h2>

      <div style={tableContainer}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={th}>ID</th>
              <th style={th}>Applicant Name</th>
              <th style={th}>Mobile</th>
              <th style={th}>City</th>
              <th style={th}>Rent</th>
              <th style={th}>Status</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {agreements.length > 0 ? (
              agreements.map((item) => (
                <tr key={item.id} style={trHover}>
                  <td style={td}>#{item.id}</td>
                  <td style={td}><strong>{item.full_name}</strong></td>
                  <td style={td}>{item.mobile}</td>
                  <td style={td}>{item.city || "N/A"}</td>
                  <td style={td}>₹{item.rent}</td>
                  <td style={td}>
                    <span style={statusBadge(item.status)}>
                      {item.status || "pending"}
                    </span>
                  </td>
                  <td style={td}>
                    <Link to={`/admin/agreement/${item.id}`} style={viewBtn}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
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
const centered = { textAlign: "center", marginTop: "50px", fontSize: "18px", color: "#64748b" };
const tableContainer = { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" };
const th = { padding: "16px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#475569" };
const td = { padding: "16px", fontSize: "14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" };
const trHover = { transition: "background 0.2s" };
const viewBtn = { color: "#3b82f6", textDecoration: "none", fontWeight: "600", fontSize: "13px" };
const countBadge = { background: "#e2e8f0", padding: "2px 10px", borderRadius: "12px", fontSize: "14px" };

const statusBadge = (status) => ({
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "capitalize",
  background: status === "approved" ? "#dcfce7" : status === "pending" ? "#fef9c3" : "#f1f5f9",
  color: status === "approved" ? "#166534" : status === "pending" ? "#854d0e" : "#475569",
});

export default AdminAgreements;