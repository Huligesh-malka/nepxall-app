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

  // ✅ FORCE DOWNLOAD FUNCTION (BEST METHOD)
  const handleDownload = async (url, bookingId) => {
    try {
      // 🔥 Force download using fetch
      const response = await fetch(url + "?fl_attachment=true");
      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Agreement_${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("Download error:", err);
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

              {/* 👁 VIEW */}
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

              {/* ⬇ DOWNLOAD */}
              <button
                onClick={() => handleDownload(a.signed_pdf, a.booking_id)}
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