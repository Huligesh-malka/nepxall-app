import React, { useState } from "react";

const AdminAICall = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const startAICall = async () => {
    try {
      setLoading(true);
      setMessage("");

      console.log("📞 Starting AI Call...");

      const response = await fetch(
        "https://nepxall-backend.onrender.com/api/ai-call/call-owner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber,
            ownerName,
          }),
        }
      );

      const data = await response.json();

      console.log("✅ API RESPONSE:", data);

      // =====================================
      // SUCCESS CHECK
      // =====================================

      if (
        data.success &&
        data.data &&
        data.data.status !== "fail"
      ) {
        setMessage("✅ AI Call Started Successfully");
      } else {
        setMessage(
          `❌ ${data?.data?.errors || data?.error || "Failed to start call"}`
        );
      }

    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Server Error / Network Error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 500,
        margin: "30px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2>📞 Admin AI Owner Call</h2>

      <input
        type="text"
        placeholder="Owner Name"
        value={ownerName}
        onChange={(e) => setOwnerName(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 15,
        }}
      />

      <input
        type="text"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 15,
        }}
      />

      <button
        onClick={startAICall}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          background: "#0B5ED7",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
          fontWeight: "bold",
        }}
      >
        {loading ? "Calling..." : "📞 Start AI Call"}
      </button>

      {message && (
        <p
          style={{
            marginTop: 20,
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default AdminAICall;