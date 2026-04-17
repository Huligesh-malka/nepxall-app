import React, { useState } from "react";

const API_URL = "https://nepxall-backend.onrender.com/api";

const BecomeOwner = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/owner/become-owner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      // 🔥 handle error response properly
      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);

        // 🔥 update role instantly (important)
        localStorage.setItem("role", "pending_owner");
      } else {
        alert(data.message || "Something went wrong");
      }

    } catch (err) {
      console.error("Become Owner Error:", err);
      alert("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 500, 
      margin: "auto", 
      padding: 20 
    }}>
      
      <h2>Become an Owner</h2>

      {!submitted ? (
        <>
          <p>
            Start listing your PG or property and earn money.
          </p>

          <ul>
            <li>✔ Add your PG or hotel</li>
            <li>✔ Accept bookings</li>
            <li>✔ Earn monthly income</li>
          </ul>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 20,
              padding: "12px 20px",
              background: loading ? "#94a3b8" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%"
            }}
          >
            {loading ? "Submitting..." : "Request Access"}
          </button>
        </>
      ) : (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: "#16a34a" }}>
            ✅ Request Submitted
          </h3>
          <p>
            Your request is under review. We will notify you soon.
          </p>

          {/* 🔥 optional refresh button */}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 10,
              padding: "10px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              width: "100%"
            }}
          >
            Refresh Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default BecomeOwner;