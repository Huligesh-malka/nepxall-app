import React, { useEffect, useState } from "react";
import api from "../../api/api";

const AdminAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all agreements
  const fetchAgreements = async () => {
    try {
      const res = await api.get("/agreements/admin/all");
      if (res.data.success) {
        setAgreements(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching agreements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2 style={{ marginBottom: "20px" }}>📄 All Agreements</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Mobile</th>
            <th style={th}>City</th>
            <th style={th}>Rent</th>
            <th style={th}>Status</th>
            <th style={th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {agreements.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={td}>{item.id}</td>
              <td style={td}>{item.full_name}</td>
              <td style={td}>{item.mobile}</td>
              <td style={td}>{item.city}</td>
              <td style={td}>₹{item.rent}</td>
              <td style={td}>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background:
                    item.status === "pending"
                      ? "#facc15"
                      : item.status === "approved"
                      ? "#4ade80"
                      : "#e2e8f0"
                }}>
                  {item.status || "pending"}
                </span>
              </td>
              <td style={td}>
                <a href={`/admin/agreement/${item.id}`}>
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const th = {
  padding: "12px",
  textAlign: "left"
};

const td = {
  padding: "12px"
};

export default AdminAgreements;