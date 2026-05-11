import React, { useState } from "react";
import { getAuth } from "firebase/auth";

const AdminAICall = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Note: This must be a verified Caller ID in your MSG91 Dashboard
  const CALLER_ID = "917483090510"; 

  const startAICall = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return alert("Please enter a valid 10-digit phone number");
    }

    try {
      setLoading(true);
      setMessage("");

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
            phoneNumber: phoneNumber.trim(),
            ownerName: ownerName.trim(),
            callerId: CALLER_ID, // Passing this to backend
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ AI Call Processed Successfully!");
        console.log("API Response:", data.data);
      } else {
        // Detailed error extraction from MSG91 response
        const errorDetail = data.error?.message || data.error || data.message;
        setMessage(`❌ Error: ${errorDetail || "Failed to start call"}`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage("❌ Network error. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📞 AI Owner Call Control</h2>
      <p style={styles.subtitle}>MSG91 V5 Voice Integration</p>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>Owner Name (Variable)</label>
        <input
          type="text"
          placeholder="e.g., Huli"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Recipient Number (Client)</label>
        <div style={{ position: 'relative' }}>
          <span style={styles.prefix}>+91</span>
          <input
            type="tel"
            placeholder="7483090510"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ ...styles.input, paddingLeft: '45px' }}
          />
        </div>
      </div>

      <button 
        onClick={startAICall} 
        disabled={loading} 
        style={{ 
          ...styles.button, 
          backgroundColor: loading ? "#ccc" : "#007bff",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Processing..." : "🚀 Start AI Call"}
      </button>

      {message && (
        <div style={{ 
          ...styles.alert, 
          color: message.includes("✅") ? "#155724" : "#721c24",
          backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
          border: `1px solid ${message.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`
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
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: { textAlign: "center", color: "#1a1a1a", marginBottom: "5px", fontSize: "22px" },
  subtitle: { textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "14px" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "600", color: "#444", fontSize: "14px" },
  prefix: { position: 'absolute', left: '12px', top: '12px', color: '#888', fontWeight: '500' },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: 'none',
  },
  button: {
    width: "100%",
    padding: "15px",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "700",
    transition: "all 0.2s ease",
    marginTop: "10px",
  },
  alert: {
    marginTop: "25px",
    padding: "14px",
    textAlign: "center",
    fontWeight: "500",
    borderRadius: "10px",
    fontSize: "14px",
    lineHeight: "1.4",
  },
};

export default AdminAICall;