import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const ServicesPage = () => {
  const { bookingId } = useParams(); // optional now
  const navigate = useNavigate();

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

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedService || !serviceDate || !address) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const serviceObj = services.find(s => s.id === selectedService);

      const payload = {
        serviceType: serviceObj.name,
        serviceDate,
        address,
        notes,
        amount: serviceObj.price,
      };

      // Only send bookingId if exists
      if (bookingId) {
        payload.bookingId = bookingId;
      }

      const res = await api.post("/services/book", payload);

      if (res.data.success) {
        setSuccess("Service booked successfully!");
        setSelectedService(null);
        setServiceDate("");
        setAddress("");
        setNotes("");
      } else {
        setError(res.data.message || "Booking failed");
      }

    } catch (err) {
      console.error("SERVICE BOOK ERROR:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
        "Failed to book service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2 style={title}>🚚 Move-In / Move-Out Services</h2>

      {success && <div style={successBox}>{success}</div>}
      {error && <div style={errorBox}>{error}</div>}

      {!selectedService ? (
        <div style={serviceGrid}>
          {services.map((service) => (
            <div key={service.id} style={card}>
              <h3>{service.name}</h3>
              <p style={price}>Starting at ₹{service.price}</p>
              <button
                style={bookBtn}
                onClick={() => setSelectedService(service.id)}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={formCard}>
          <h3>
            Booking: {
              services.find(s => s.id === selectedService)?.name
            }
          </h3>

          <label style={label}>Service Date *</label>
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            style={input}
            min={new Date().toISOString().split("T")[0]}
          />

          <label style={label}>Pickup / Service Address *</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={textarea}
            placeholder="Enter full address..."
          />

          <label style={label}>Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={textarea}
            placeholder="Any special instructions..."
          />

          <div style={btnRow}>
            <button
              style={submitBtn}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>

            <button
              style={cancelBtn}
              onClick={() => {
                setSelectedService(null);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        style={backBtn}
        onClick={() => navigate("/user/bookings")}
      >
        ← Back to My Bookings
      </button>
    </div>
  );
};

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const container = {
  maxWidth: 900,
  margin: "40px auto",
  padding: 20,
  fontFamily: "'Segoe UI', sans-serif"
};

const title = {
  fontSize: 28,
  marginBottom: 30,
  textAlign: "center"
};

const serviceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 20
};

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  textAlign: "center"
};

const price = {
  fontWeight: "bold",
  marginBottom: 12
};

const bookBtn = {
  padding: "10px 20px",
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const formCard = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
};

const label = {
  display: "block",
  marginTop: 12,
  marginBottom: 6,
  fontWeight: 500
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd"
};

const textarea = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  minHeight: 80
};

const btnRow = {
  marginTop: 20,
  display: "flex",
  gap: 10
};

const submitBtn = {
  padding: "10px 20px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const cancelBtn = {
  padding: "10px 20px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const backBtn = {
  marginTop: 30,
  padding: "10px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const successBox = {
  background: "#d1fae5",
  color: "#065f46",
  padding: 12,
  borderRadius: 8,
  marginBottom: 20,
  textAlign: "center"
};

const errorBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: 12,
  borderRadius: 8,
  marginBottom: 20,
  textAlign: "center"
};

export default ServicesPage;