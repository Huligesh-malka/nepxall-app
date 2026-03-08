import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/api";

const OwnerRooms = () => {
  const { pgId } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [roomNo, setRoomNo] = useState("");
  const [totalSeats, setTotalSeats] = useState("");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD ROOMS ================= */
  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📡 Fetching rooms for PG:", pgId);
      const res = await api.get(`/rooms/${pgId}`);

      console.log("✅ Rooms response:", res.data);

      if (res.data?.data) {
        setRooms(res.data.data);
      } else if (Array.isArray(res.data)) {
        setRooms(res.data);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error("❌ Rooms load error:", err);
      
      // Handle the 2-minute timeout specifically
      if (err.code === "ECONNABORTED") {
        setError("The server is taking too long to wake up. Please click 'Retry'.");
      } else {
        setError("Failed to load rooms. The server might be offline.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD ON MOUNT ================= */
  useEffect(() => {
    if (pgId) loadRooms();
  }, [pgId]);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });
    return () => unsub();
  }, [navigate]);

  /* ================= ADD ROOM ================= */
  const addRoom = async () => {
    if (!roomNo || !totalSeats) {
      alert("Enter room number and seats");
      return;
    }

    try {
      setAdding(true);
      await api.post("/rooms/add", {
        pg_id: pgId,
        room_no: roomNo,
        total_seats: totalSeats
      });

      setRoomNo("");
      setTotalSeats("");
      loadRooms();
    } catch (err) {
      console.error("Add room error:", err);
      alert("Failed to add room. Server might be sleeping.");
    } finally {
      setAdding(false);
    }
  };

  const getStatus = (room) => {
    if (room.occupied_seats === 0) return { label: "EMPTY", color: "#16a34a" };
    if (room.occupied_seats >= room.total_seats) return { label: "FULL", color: "#dc2626" };
    return { label: "PARTIAL", color: "#f59e0b" };
  };

  /* ================= LOADING UI ================= */
  if (loading) {
    return (
      <div style={styles.center}>
        <div className="spinner"></div> {/* You can add CSS for a spinner here */}
        <h3>Loading rooms...</h3>
        <p style={{ color: "#666" }}>Server may take a moment to wake up (Render Free Tier)</p>
        <button onClick={loadRooms} style={{...styles.addButton, marginTop: 15}}>
          🔄 Force Refresh
        </button>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🛏 Room Management</h2>
        <button onClick={loadRooms} style={styles.refreshBtn}>🔄 Refresh List</button>
      </div>

      {/* ERROR MESSAGE WITH RETRY */}
      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
          <button onClick={loadRooms} style={styles.retryBtn}>Retry Now</button>
        </div>
      )}

      {/* ADD ROOM FORM */}
      <div style={styles.addRoomBox}>
        <input
          style={styles.input}
          placeholder="Room Number"
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value)}
        />
        <input
          style={styles.input}
          type="number"
          placeholder="Total Seats"
          value={totalSeats}
          onChange={(e) => setTotalSeats(e.target.value)}
        />
        <button style={styles.addButton} onClick={addRoom} disabled={adding}>
          {adding ? "Adding..." : "➕ Add Room"}
        </button>
      </div>

      {/* ROOM LIST */}
      {rooms.length === 0 && !error ? (
        <p>No rooms added yet for this PG.</p>
      ) : (
        <div style={styles.roomGrid}>
          {rooms.map((room) => {
            const status = getStatus(room);
            return (
              <div key={room.id} style={styles.card}>
                <h3>Room {room.room_no}</h3>
                <p>🪑 Seats: {room.occupied_seats}/{room.total_seats}</p>
                <p>Status: 
                  <span style={{ color: status.color, fontWeight: "bold", marginLeft: 6 }}>
                    {status.label}
                  </span>
                </p>
                <p>Available Beds: 
                  <b style={{ marginLeft: 5 }}>{room.total_seats - room.occupied_seats}</b>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: 900, margin: "auto", padding: 20 },
  center: { textAlign: "center", marginTop: 100 },
  addRoomBox: { display: "flex", gap: 10, marginBottom: 30, flexWrap: "wrap" },
  input: { padding: 10, border: "1px solid #ccc", borderRadius: 6, flex: 1, minWidth: '150px' },
  addButton: { background: "#4f46e5", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 6, cursor: "pointer" },
  refreshBtn: { background: "none", border: "1px solid #4f46e5", color: "#4f46e5", padding: "5px 10px", borderRadius: 5, cursor: "pointer" },
  retryBtn: { background: "#dc2626", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 5, marginTop: 10, cursor: "pointer" },
  errorBox: { padding: 15, background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#991b1b", marginBottom: 20 },
  roomGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 },
  card: { border: "1px solid #ddd", padding: 20, borderRadius: 12, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }
};

export default OwnerRooms;