import React, { useEffect, useState } from "react";
import api from "../api/api";

const UserAgreements = () => {
  const [agreements, setAgreements] = useState([]);

  useEffect(() => {
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    try {
      const res = await api.get("/user/agreements");
      setAgreements(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>📄 My Agreements</h2>

      {agreements.length === 0 ? (
        <p>No agreements found</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {agreements.map((a) => (
            <div key={a.booking_id} style={{
              padding: 20,
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
            }}>
              <h3>{a.pg_name}</h3>
              <p>Booking ID: #{a.booking_id}</p>
              <p>Status: ✅ Completed</p>

              <button
                onClick={() => window.open(a.signed_pdf, "_blank")}
                style={{
                  marginTop: 10,
                  padding: "10px 20px",
                  background: "green",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8
                }}
              >
                View Agreement
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAgreements;