import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPG();
  }, [id]);

  const fetchPG = async () => {
    try {
      const res = await axios.get(`${API_CONFIG.USER_API_URL}/scan/${id}`);

      if (res.data.success) {
        setPg(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const goToPayment = () => {
    if (!selectedRoom) {
      alert("Please select a room");
      return;
    }

    navigate(`/booking/${id}?room=${selectedRoom.room_number}&type=${selectedRoom.sharing_type}`);
  };

  if (loading) {
    return <div style={styles.center}>Loading property...</div>;
  }

  if (!pg) {
    return <div style={styles.center}>Property not found</div>;
  }

  return (
    <div style={styles.page}>

      {/* PG IMAGE */}
      <div style={styles.imageBox}>
        <img
          src={pg.photos?.[0] || "https://via.placeholder.com/800x400"}
          alt="pg"
          style={styles.image}
        />
      </div>

      {/* PG DETAILS */}
      <div style={styles.card}>

        <h2 style={styles.title}>{pg.pg_name}</h2>

        <p style={styles.location}>
          📍 {pg.area}, {pg.city}
        </p>

        {/* SUMMARY */}
        <div style={styles.summary}>
          {Object.entries(pg.availability_summary || {}).map(([type, count]) => (
            <span key={type} style={styles.badge}>
              {type} • {count} left
            </span>
          ))}
        </div>

        <h3 style={styles.sectionTitle}>Choose Room</h3>

        {/* ROOMS */}
        {pg.available_room_details?.map((room, index) => (
          <div
            key={index}
            onClick={() => setSelectedRoom(room)}
            style={{
              ...styles.roomCard,
              border:
                selectedRoom?.room_number === room.room_number
                  ? "2px solid #4f46e5"
                  : "1px solid #e5e7eb",
            }}
          >
            <div>
              <div style={styles.roomTitle}>
                Room {room.room_number}
              </div>

              <div style={styles.roomType}>
                {room.sharing_type}
              </div>

              <div style={styles.beds}>
                {room.available_beds} beds left
              </div>
            </div>

            <div style={styles.price}>
              ₹{room.price}
            </div>
          </div>
        ))}

      </div>

      {/* FOOTER BUTTON */}
      <div style={styles.bottomBar}>
        <button onClick={goToPayment} style={styles.bookBtn}>
          Continue Booking
        </button>

        {pg.contact_phone && (
          <a href={`tel:${pg.contact_phone}`} style={{ width: "40%" }}>
            <button style={styles.callBtn}>Call Owner</button>
          </a>
        )}
      </div>

    </div>
  );
};

const styles = {

  page: {
    maxWidth: 700,
    margin: "auto",
    fontFamily: "sans-serif",
    paddingBottom: 100
  },

  imageBox: {
    width: "100%",
    height: 220,
    overflow: "hidden"
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  card: {
    background: "#fff",
    marginTop: -30,
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
  },

  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 5
  },

  location: {
    color: "#6b7280",
    marginBottom: 15
  },

  summary: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20
  },

  badge: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 13
  },

  sectionTitle: {
    marginBottom: 10
  },

  roomCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    cursor: "pointer",
    transition: "0.2s",
    background: "#fafafa"
  },

  roomTitle: {
    fontWeight: 600,
    fontSize: 16
  },

  roomType: {
    fontSize: 13,
    color: "#6b7280"
  },

  beds: {
    fontSize: 12,
    color: "#16a34a"
  },

  price: {
    fontWeight: 700,
    fontSize: 18,
    color: "#4f46e5"
  },

  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    padding: 15,
    display: "flex",
    gap: 10,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.1)"
  },

  bookBtn: {
    flex: 1,
    background: "linear-gradient(90deg,#6366f1,#4f46e5)",
    color: "#fff",
    border: "none",
    padding: 14,
    borderRadius: 10,
    fontWeight: "bold",
    fontSize: 16
  },

  callBtn: {
    width: "100%",
    border: "2px solid #22c55e",
    color: "#22c55e",
    background: "#fff",
    borderRadius: 10,
    padding: 14,
    fontWeight: "bold"
  },

  center: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 18
  }
};

export default ScanPG;