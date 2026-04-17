import React, { useState } from "react";

const BecomeOwner = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch("/api/owner/become-owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      
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
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer"
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
        </div>
      )}
    </div>
  );
};

export default BecomeOwner;