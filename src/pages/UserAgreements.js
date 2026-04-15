import React, { useEffect, useState } from "react";
import api from "../api/api";

const UserAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    try {
      setLoading(true);

      // ✅ FIXED API PATH
      const res = await api.get("/agreements-form/user/agreements");

      if (res.data.success) {
        setAgreements(res.data.data || []);
      }

    } catch (err) {
      console.error("Fetch Agreements Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20 }}>📄 My Agreements</h2>

      {/* 🔄 Loading */}
      {loading ? (
        <p>Loading agreements...</p>
      ) : agreements.length === 0 ? (
        <p>No agreements found</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {agreements.map((a) => (
            <div
              key={a.booking_id}
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#fff",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              }}
            >
              <h3>{a.pg_name}</h3>

              <p><b>Booking ID:</b> #{a.booking_id}</p>
              <p><b>Status:</b> ✅ Completed</p>

              {/* 📄 View PDF */}
              <button
                onClick={() => window.open(a.signed_pdf, "_blank")}
                style={{
                  marginTop: 10,
                  padding: "10px 20px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer"
                }}
              >
                👁 View Agreement
              </button>

              {/* ⬇ Download PDF */}
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = a.signed_pdf;
                  link.download = `agreement-${a.booking_id}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{
                  marginTop: 10,
                  marginLeft: 10,
                  padding: "10px 20px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer"
                }}
              >
                ⬇ Download
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAgreements;