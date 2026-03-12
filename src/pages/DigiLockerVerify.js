import React, { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function DigiLockerVerify() {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startVerification = async () => {
    try {

      setLoading(true);

      const res = await axios.get(`${API}/api/digilocker/link`, {
        withCredentials: true
      });

      const url = res.data?.data?.data?.url || res.data?.data?.url;

      if (!url) {
        throw new Error("Invalid DigiLocker response");
      }

      window.location.href = url;

    } catch (err) {

      console.error("DigiLocker error:", err);

      setError("Failed to start verification");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>

      <h2>DigiLocker Verification</h2>

      <p>Verify your identity securely using DigiLocker.</p>

      <button
        onClick={startVerification}
        disabled={loading}
        style={{
          padding: "12px 20px",
          background: "#2d7df6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        {loading ? "Starting..." : "Verify with DigiLocker"}
      </button>

      {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}

    </div>
  );
}