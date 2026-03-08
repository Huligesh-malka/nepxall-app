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

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (!pg) return <div style={styles.center}>Property not found</div>;

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>{pg.pg_name}</h2>
      <p style={styles.location}>📍 {pg.area}, {pg.city}</p>

      {/* PRICE SUMMARY */}
      <div style={styles.priceBox}>

        {pg.single_sharing && (
          <div style={styles.priceItem}>
            <span>Single Sharing</span>
            <b>₹{pg.single_sharing}/month</b>
          </div>
        )}

        {pg.double_sharing && (
          <div style={styles.priceItem}>
            <span>Double Sharing</span>
            <b>₹{pg.double_sharing}/month</b>
          </div>
        )}

        {pg.triple_sharing && (
          <div style={styles.priceItem}>
            <span>Triple Sharing</span>
            <b>₹{pg.triple_sharing}/month</b>
          </div>
        )}

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

            <div style={styles.roomNumber}>
              Room {room.room_number}
            </div>

            <div style={styles.beds}>
              {room.available_beds} beds left
            </div>

          </div>
        ))}
      </div>

      <button onClick={goToPayment} style={styles.bookBtn}>
        Continue Booking
      </button>

    </div>
  );
};

const styles = {

  container: {
    maxWidth: 520,
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
    fontWeight: 700
  },

  location: {
    color: "#6b7280",
    marginBottom: 20
  },

  priceBox: {
    background: "#f9fafb",
    borderRadius: 10,
    padding: 15,
    marginBottom: 25
  },

  priceItem: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 15
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
    padding: 15,
    borderRadius: 10,
    cursor: "pointer",
    background: "#fafafa"
  },

  roomNumber: {
    fontWeight: 600
  },

  beds: {
    fontSize: 13,
    color: "#16a34a"
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
    fontSize: 16
  }

};

export default ScanPG;