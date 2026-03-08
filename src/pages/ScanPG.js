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

    navigate(`/booking/${id}?room=${selectedRoom.room_number}`);
  };

  if (loading) {
    return <div style={styles.center}>Loading property...</div>;
  }

  if (!pg) {
    return <div style={styles.center}>Property not found</div>;
  }

  return (
    <div style={styles.container}>

      {/* PG NAME */}
      <h2 style={styles.title}>{pg.pg_name}</h2>

      {/* LOCATION */}
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

      <h3 style={styles.section}>Choose Room</h3>

      {/* ROOM LIST */}
      <div style={styles.roomList}>
        {pg.available_room_details?.map((room, index) => (
          <div
            key={index}
            onClick={() => setSelectedRoom(room)}
            style={{
              ...styles.roomCard,
              border:
                selectedRoom?.room_number === room.room_number
                  ? "2px solid #4f46e5"
                  : "1px solid #e5e7eb"
            }}
          >
            <div>
              <div style={styles.roomNumber}>
                Room {room.room_number}
              </div>

              <div style={styles.roomType}>
                {room.sharing_type}
              </div>

              <div style={styles.beds}>
                {room.available_beds} beds left
              </div>
            </div>

            <div style={styles.priceBox}>
              <div style={styles.price}>
                ₹ {room.price}
              </div>
              <div style={styles.perMonth}>
                /month
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOOK BUTTON */}
      <button onClick={goToPayment} style={styles.bookBtn}>
        Continue Booking
      </button>

    </div>
  );
};

const styles = {

  container: {
    maxWidth: 500,
    margin: "auto",
    padding: 20,
    fontFamily: "sans-serif"
  },

  center: {
    textAlign: "center",
    marginTop: 100
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 5
  },

  location: {
    color: "#6b7280",
    marginBottom: 15
  },

  summary: {
    display: "flex",
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

  section: {
    marginBottom: 10
  },

  roomList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  roomCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    cursor: "pointer",
    background: "#fafafa"
  },

  roomNumber: {
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

  priceBox: {
    textAlign: "right"
  },

  price: {
    fontSize: 18,
    fontWeight: 700,
    color: "#4f46e5"
  },

  perMonth: {
    fontSize: 12,
    color: "#6b7280"
  },

  bookBtn: {
    width: "100%",
    marginTop: 25,
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(90deg,#6366f1,#4f46e5)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer"
  }
};

export default ScanPG;