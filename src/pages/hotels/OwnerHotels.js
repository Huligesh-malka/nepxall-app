import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/hotels"; 
const SERVER_URL = "http://localhost:5000"; // Base URL for images

export default function OwnerHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();

      const res = await axios.get(`${API}/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Based on your backend code, data is inside res.data.data
      setHotels(res.data.data || []);
    } catch (err) {
      console.error("LOAD HOTELS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading hotels...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20 }}>🏨 My Hotels</h2>

      {hotels.length === 0 ? (
        <p>No hotels added yet</p>
      ) : (
        <div style={grid}>
          {hotels.map((h) => (
            <div key={h.id} style={card}>
              <img
                src={
                  h.photos && h.photos.length > 0
                    ? `${SERVER_URL}${h.photos[0]}` // Concatenate backend URL with path
                    : "https://via.placeholder.com/400x200?text=No+Image+Found"
                }
                alt={h.name}
                style={image}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x200?text=Image+Error";
                }}
              />

              <div style={{ padding: 15 }}>
                <h3 style={{ margin: "0 0 5px 0" }}>{h.name}</h3>
                <p style={{ color: "#666", fontSize: 14 }}>📍 {h.city}</p>

                <div style={{ margin: "10px 0" }}>
                  <span
                    style={{
                      background: h.status === "active" ? "#4CAF50" : "#9e9e9e",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      textTransform: "capitalize"
                    }}
                  >
                    {h.status || "Pending"}
                  </span>
                </div>

                <p style={{ fontSize: 14, fontWeight: "500" }}>
                  🛏 Room Types: {h.room_types_count || 0}
                </p>

                <div style={actions}>
                  <button style={btn} onClick={() => navigate(`/owner/edit-hotel/${h.id}`)}>
                    ✏ Edit
                  </button>
                  <button style={btn} onClick={() => navigate(`/owner/hotel-rooms/${h.id}`)}>
                    🛏 Rooms
                  </button>
                  <button style={btn} onClick={() => navigate(`/owner/hotel-photos/${h.id}`)}>
                    📸 Photos
                  </button>
                  <button style={btn} onClick={() => navigate(`/owner/hotel-bookings/${h.id}`)}>
                    📅 Bookings
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLE ---------------- */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 25,
};

const card = {
  background: "#fff",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  transition: "transform 0.2s",
};

const image = {
  width: "100%",
  height: 200,
  objectFit: "cover",
  backgroundColor: "#f0f0f0"
};

const actions = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 15,
};

const btn = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  background: "#f9f9f9",
  cursor: "pointer",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "5px"
};