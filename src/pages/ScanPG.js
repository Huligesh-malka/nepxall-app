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
      setLoading(true);
      const res = await axios.get(
        `${API_CONFIG.USER_API_URL}/scan/${id}`
      );

      if (res.data.success) {
        setPg(res.data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToPayment = () => {
    if (!selectedRoom) {
      alert("Please select a room to proceed");
      return;
    }
    // Passing the room ID and price to the booking page
    navigate(`/booking/${id}?roomId=${selectedRoom.id}&type=${selectedRoom.sharing_type}`);
  };

  if (loading) {
    return <div style={styles.center}>Loading property details...</div>;
  }

  if (!pg) {
    return <div style={styles.center}>Property not found or link expired.</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{pg.pg_name}</h2>
      <p style={styles.address}>📍 {pg.area}, {pg.city}</p>

      {/* Summary of availability */}
      <div style={styles.summaryBox}>
        <p><b>Quick Summary:</b></p>
        {Object.entries(pg.availability_summary || {}).map(([type, count]) => (
          <span key={type} style={styles.badge}>
            {type}: {count} Left
          </span>
        ))}
      </div>

      <hr style={styles.divider}/>

      <h3 style={styles.sectionTitle}>Select an Available Room</h3>
      
      {pg.available_room_details && pg.available_room_details.length > 0 ? (
        <div style={styles.roomList}>
          {pg.available_room_details.map((room, index) => (
            <label key={index} style={{
              ...styles.roomItem,
              borderColor: selectedRoom?.room_number === room.room_number ? "#4f46e5" : "#ddd",
              backgroundColor: selectedRoom?.room_number === room.room_number ? "#f5f3ff" : "#fff"
            }}>
              <input
                type="radio"
                name="room"
                style={styles.radio}
                onChange={() => setSelectedRoom(room)}
              />
              <div style={styles.roomInfo}>
                <span style={styles.roomNo}>Room {room.room_number}</span>
                <span style={styles.roomType}>{room.sharing_type}</span>
              </div>
              <div style={styles.priceInfo}>
                <span style={styles.price}>₹{room.price}</span>
                <span style={styles.beds}>{room.available_beds} beds left</span>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <p style={{ color: "#dc2626" }}>Sorry, no rooms are currently available.</p>
      )}

      <div style={styles.footer}>
        <button onClick={goToPayment} style={styles.payBtn}>
          Continue to Booking
        </button>

        {pg.contact_phone && (
          <a href={`tel:${pg.contact_phone}`} style={{ textDecoration: 'none' }}>
            <button style={styles.callBtn}>📞 Contact Owner</button>
          </a>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: 500, margin: "20px auto", padding: "0 20px" },
  center: { textAlign: "center", marginTop: 100, fontSize: "18px" },
  title: { marginBottom: 5, color: "#1f2937" },
  address: { color: "#6b7280", marginBottom: 20 },
  summaryBox: { background: "#f3f4f6", padding: 12, borderRadius: 8, marginBottom: 20 },
  badge: { display: "inline-block", background: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, marginRight: 8, border: "1px solid #e5e7eb" },
  divider: { margin: "20px 0", border: "0.5px solid #eee" },
  sectionTitle: { fontSize: 18, marginBottom: 15 },
  roomList: { display: "flex", flexDirection: "column", gap: 12 },
  roomItem: {
    display: "flex",
    alignItems: "center",
    padding: 15,
    border: "2px solid #ddd",
    borderRadius: 12,
    cursor: "pointer",
    transition: "0.2s"
  },
  radio: { marginRight: 15, transform: "scale(1.2)" },
  roomInfo: { flex: 1 },
  roomNo: { display: "block", fontWeight: "bold", fontSize: 16 },
  roomType: { fontSize: 13, color: "#6b7280" },
  priceInfo: { textAlign: "right" },
  price: { display: "block", fontWeight: "bold", color: "#4f46e5", fontSize: 16 },
  beds: { fontSize: 12, color: "#16a34a" },
  footer: { marginTop: 30, display: "flex", flexDirection: "column", gap: 10 },
  payBtn: { width: "100%", padding: 14, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer" },
  callBtn: { width: "100%", padding: 14, background: "#fff", color: "#22c55e", border: "2px solid #22c55e", borderRadius: 10, fontWeight: "bold", cursor: "pointer" }
};

export default ScanPG;