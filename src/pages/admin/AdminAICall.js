import React, { useState } from "react";
import { getAuth } from "firebase/auth";

const AdminWhatsApp = () => {

  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");

  const [propertyName, setPropertyName] = useState("");
  const [area, setArea] = useState("");
  const [rent, setRent] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  //////////////////////////////////////////////////////
  // SEND WHATSAPP
  //////////////////////////////////////////////////////
  const sendWhatsApp = async () => {

    if (!ownerPhone || ownerPhone.length < 10) {
      return alert("Enter valid owner number");
    }

    try {

      setLoading(true);
      setMessage("");

      const auth = getAuth();
      const user = auth.currentUser;

      const token =
        user ? await user.getIdToken() : null;

      //////////////////////////////////////////////////////
      // BACKEND API
      //////////////////////////////////////////////////////
      const response = await fetch(
        "https://nepxall-backend.onrender.com/api/send-booking-whatsapp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },

          body: JSON.stringify({
            ownerPhone,
            ownerName,
            userName,
            userPhone,
            propertyName,
            area,
            rent,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

        setMessage(
          "✅ WhatsApp notification sent successfully"
        );

      } else {

        setMessage(
          `❌ ${data.message || "Failed"}`
        );

      }

    } catch (err) {

      console.log(err);

      setMessage(
        "❌ Network Error"
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div style={styles.container}>

      <h2 style={styles.header}>
        📲 Nepxall WhatsApp Notification
      </h2>

      <p style={styles.subtitle}>
        MSG91 WhatsApp API Integration
      </p>

      {/* OWNER */}

      <input
        type="text"
        placeholder="Owner Name"
        value={ownerName}
        onChange={(e) => setOwnerName(e.target.value)}
        style={styles.input}
      />

      <input
        type="tel"
        placeholder="Owner Phone"
        value={ownerPhone}
        onChange={(e) => setOwnerPhone(e.target.value)}
        style={styles.input}
      />

      {/* USER */}

      <input
        type="text"
        placeholder="User Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        style={styles.input}
      />

      <input
        type="tel"
        placeholder="User Phone"
        value={userPhone}
        onChange={(e) => setUserPhone(e.target.value)}
        style={styles.input}
      />

      {/* PROPERTY */}

      <input
        type="text"
        placeholder="Property Name"
        value={propertyName}
        onChange={(e) => setPropertyName(e.target.value)}
        style={styles.input}
      />

      <input
        type="text"
        placeholder="Area"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        style={styles.input}
      />

      <input
        type="number"
        placeholder="Rent"
        value={rent}
        onChange={(e) => setRent(e.target.value)}
        style={styles.input}
      />

      <button
        onClick={sendWhatsApp}
        disabled={loading}
        style={{
          ...styles.button,
          backgroundColor: loading
            ? "#999"
            : "#25D366",
        }}
      >
        {loading
          ? "Sending..."
          : "📲 Send WhatsApp"}
      </button>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

    </div>
  );
};

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const styles = {

  container: {
    maxWidth: "450px",
    margin: "40px auto",
    padding: "30px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    fontFamily: "Arial",
  },

  header: {
    textAlign: "center",
    marginBottom: "5px",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: "20px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "15px",
  },

  button: {
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
  },

  message: {
    marginTop: "10px",
    textAlign: "center",
    fontWeight: "bold",
  },

};

export default AdminWhatsApp;