import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import api from "../api/api";

const ServicesPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  // ✅ USE AUTH CONTEXT
  const { user, role, loading: authLoading } = useAuth();

  const [selectedService, setSelectedService] = useState(null);
  const [serviceDate, setServiceDate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const services = [
    { id: "packers", name: "🚚 Packers & Movers", price: 1500 },
    { id: "cleaning", name: "🧹 Cleaning Service", price: 499 },
    { id: "mattress", name: "🛏 Mattress Rental", price: 400 },
    { id: "furniture", name: "🪑 Furniture Rental", price: 800 },
    { id: "wifi", name: "📶 WiFi Setup Help", price: 999 },
  ];

  // ✅ PROTECTION - AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div style={container}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading authentication...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedService || !serviceDate || !address) {
      setError("Please fill all required fields (Date and Address)");
      return;
    }

    try {
      setLoading(true);

      const serviceObj = services.find((s) => s.id === selectedService);

      const payload = {
        serviceType: serviceObj.name,
        serviceDate,
        address,
        notes,
        amount: serviceObj.price,
      };

      if (bookingId) {
        payload.bookingId = bookingId;
      }

      const res = await api.post("/services/book", payload);

      if (res.data.success) {
        setSuccess("Service booked successfully! Redirecting...");
        
        setTimeout(() => {
          setSuccess("");
          setSelectedService(null);
          setServiceDate("");
          setAddress("");
          setNotes("");
        }, 2500);
      }
    } catch (err) {
      console.error("SERVICE BOOK ERROR:", err.response?.data || err);
      setError(
        err.response?.data?.message || "Failed to book service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={title}>🚚 Move-In / Move-Out Services</h2>
        <p style={{ color: "#666" }}>Select a service to help make your transition smoother.</p>
      </header>

      {success && <div style={successBox}>{success}</div>}
      {error && <div style={errorBox}>{error}</div>}

      {!selectedService ? (
        <div style={serviceGrid}>
          {services.map((service) => (
            <div key={service.id} style={card}>
              <div style={iconCircle}>{service.name.split(" ")[0]}</div>
              <h3 style={{ margin: "10px 0" }}>{service.name.split(" ").slice(1).join(" ")}</h3>
              <p style={price}>Starting at ₹{service.price}</p>
              <button
                style={bookBtn}
                onClick={() => setSelectedService(service.id)}
              >
                Select Service
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={formCard}>
          <div style={{ borderBottom: "1px solid #eee", marginBottom: "20px", paddingBottom: "10px" }}>
             <h3 style={{ color: "#f59e0b" }}>
               Confirming: {services.find((s) => s.id === selectedService)?.name}
             </h3>
          </div>

          <div style={formGroup}>
            <label style={label}>Service Date *</label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              style={input}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Pickup / Service Address *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={textarea}
              placeholder="Enter full address where service is needed..."
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Additional Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={textarea}
              placeholder="e.g. Floor number, landmark, specific timing..."
            />
          </div>

          <div style={btnRow}>
            <button
              style={submitBtn}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm & Book"}
            </button>

            <button
              style={cancelBtn}
              onClick={() => {
                setSelectedService(null);
                setError("");
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button
          style={backBtn}
          onClick={() => navigate("/user/bookings")}
        >
          ← Back to My Bookings
        </button>
      </div>
    </div>
  );
};

const container = {
  maxWidth: 1000,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
};

const title = {
  fontSize: "2rem",
  fontWeight: "700",
  color: "#1f2937",
  marginBottom: "10px",
};

const serviceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "25px",
};

const card = {
  background: "#fff",
  padding: "30px 20px",
  borderRadius: "20px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
  textAlign: "center",
  transition: "transform 0.2s ease",
  border: "1px solid #f3f4f6",
};

const iconCircle = {
  fontSize: "40px",
  background: "#fff7ed",
  width: "80px",
  height: "80px",
  lineHeight: "80px",
  borderRadius: "50%",
  margin: "0 auto 15px",
};

const price = {
  fontSize: "1.2rem",
  fontWeight: "600",
  color: "#059669",
  marginBottom: "20px",
};

const bookBtn = {
  width: "100%",
  padding: "12px",
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "600",
  cursor: "pointer",
};

const formCard = {
  background: "#fff",
  padding: "30px",
  borderRadius: "20px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  maxWidth: "600px",
  margin: "0 auto",
};

const formGroup = {
  marginBottom: "15px",
};

const label = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#374151",
};

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const textarea = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  minHeight: "100px",
  resize: "vertical",
  boxSizing: "border-box",
};

const btnRow = {
  marginTop: "30px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const submitBtn = {
  padding: "14px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "600",
  cursor: "pointer",
  fontSize: "1rem",
};

const cancelBtn = {
  padding: "14px",
  background: "#f3f4f6",
  color: "#4b5563",
  border: "none",
  borderRadius: "10px",
  fontWeight: "600",
  cursor: "pointer",
};

const backBtn = {
  background: "none",
  border: "none",
  color: "#2563eb",
  fontWeight: "600",
  cursor: "pointer",
  fontSize: "1rem",
  textDecoration: "underline",
};

const successBox = {
  background: "#ecfdf5",
  color: "#065f46",
  padding: "15px",
  borderRadius: "12px",
  marginBottom: "25px",
  textAlign: "center",
  border: "1px solid #a7f3d0",
};

const errorBox = {
  background: "#fef2f2",
  color: "#991b1b",
  padding: "15px",
  borderRadius: "12px",
  marginBottom: "25px",
  textAlign: "center",
  border: "1px solid #fecaca",
};

export default ServicesPage;