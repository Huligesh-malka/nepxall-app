import React, { useState } from "react";
import { getAuth } from "firebase/auth";

const AdminAICall = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const startAICall = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return alert("Please enter a valid 10-digit phone number");
    }

    try {
      setLoading(true);
      setMessage("");

      // Get Firebase Token for backend middleware
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      console.log("🚀 Sending request to Nepxall Backend...");

      const response = await fetch(
        "https://nepxall-backend.onrender.com/api/ai-call/call-owner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
          },
          body: JSON.stringify({
            phoneNumber,
            ownerName,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ AI Call Initiated successfully!");
      } else {
        // Display the specific error from MSG91 if available
        const errorMsg = typeof data.error === 'string' ? data.error : (data.message || "Failed to start call");
        setMessage(`❌ Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage("❌ Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📞 AI Owner Call Control</h2>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Owner Name</label>
        <input
          type="text"
          placeholder="e.g., Huli"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Recipient Number</label>
        <input
          type="tel"
          placeholder="10-digit number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={styles.input}
        />
      </div>

      <button onClick={startAICall} disabled={loading} style={styles.button}>
        {loading ? "Connecting..." : "🚀 Start AI Call"}
      </button>

      {message && (
        <div style={{ 
          ...styles.alert, 
          color: message.includes("✅") ? "#155724" : "#721c24",
          backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da"
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "40px",
    maxWidth: "400px",
    margin: "40px auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: { textAlign: "center", color: "#333", marginBottom: "25px" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "600", color: "#555" },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  alert: {
    marginTop: "20px",
    padding: "12px",
    textAlign: "center",
    fontWeight: "500",
    borderRadius: "6px",
    fontSize: "14px",
  },
};

export default AdminAICall;