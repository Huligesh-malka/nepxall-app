import React, { useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;

export default function DigiLockerVerify() {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startVerification = async () => {

    try {

      setLoading(true);
      setError("");

      console.log("API:", API);

      const res = await axios.get(`${API}/digilocker/link`, {
        withCredentials: true
      });

      console.log("Digilocker response:", res.data);

      const url =
        res?.data?.url ||
        res?.data?.data?.url ||
        res?.data?.data?.data?.url;

      if (!url) {
        throw new Error("Invalid DigiLocker response");
      }

      console.log("Redirecting to:", url);

      window.location.href = url;

    } catch (err) {

      console.error("DigiLocker error:", err);

      setError(
        err?.response?.data?.message ||
        "Failed to start DigiLocker verification"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div style={{ padding: 40, textAlign: "center" }}>

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

      {error && (
        <p style={{ color: "red", marginTop: 15 }}>
          {error}
        </p>
      )}

    </div>

  );

}