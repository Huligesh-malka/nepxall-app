import React, { useState } from "react";
import { getAuth } from "firebase/auth"; // Assuming you are using Firebase

const AdminAICall = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const startAICall = async () => {
    if (!phoneNumber) return alert("Please enter a phone number");

    try {
      setLoading(true);
      setMessage("");

      // Get current Firebase User Token
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      console.log("📞 Initiating AI Call request...");

      const response = await fetch(
        "https://nepxall-backend.onrender.com/api/ai-call/call-owner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "", // Include token here
          },
          body: JSON.stringify({
            phoneNumber,
            ownerName,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("✅ AI Call Started Successfully!");
      } else {
        setMessage(`❌ Error: ${data.error || data.message || "Failed to start call"}`);
      }
    } catch (error) {
      console.error("Request Error:", error);
      setMessage("❌ Network error. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center" }}>📞 Admin AI Owner Call</h2>

      <div style={styles.formGroup}>
        <label>Owner Name</label>
        <input
          type="text"
          placeholder="Enter name"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Phone Number (without +91)</label>
        <input
          type="text"
          placeholder="74830..."
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={styles.input}
        />
      </div>

      <button onClick={startAICall} disabled={loading} style={styles.button}>
        {loading ? "Processing..." : "🚀 Start AI Call"}
      </button>

      {message && (
        <div style={{ ...styles.alert, color: message.includes("✅") ? "green" : "red" }}>
          {message}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "450px",
    margin: "50px auto",
    backgroundColor: "#f9f9f9",
    borderRadius: "15px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  },
  formGroup: { marginBottom: "15px" },
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "5px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#0B5ED7",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  alert: {
    marginTop: "20px",
    padding: "10px",
    textAlign: "center",
    fontWeight: "bold",
    borderRadius: "5px",
    background: "#fff",
    border: "1px solid #eee",
  },
};

export default AdminAICall;