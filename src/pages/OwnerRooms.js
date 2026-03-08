import React, { useEffect, useState, useCallback } from "react";
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

  /* ================= LOAD ROOMS ================= */

  const loadRooms = useCallback(async (retry = true) => {

    try {

      console.log("Fetching rooms for PG:", pgId);

      const res = await api.get(`/rooms/${pgId}`);

      console.log("Rooms response:", res.data);

      if (Array.isArray(res.data)) {
        setRooms(res.data);
      } else if (res.data?.data) {
        setRooms(res.data.data);
      } else {
        setRooms([]);
      }

    } catch (err) {

      console.error("Load rooms error:", err);

      // Retry once if backend sleeping
      if (retry) {
        console.log("Retrying rooms API...");
        setTimeout(() => loadRooms(false), 3000);
        return;
      }

      setRooms([]);

    } finally {

      setLoading(false);

    }

  }, [pgId]);

  /* ================= LOAD ROOMS ON PAGE LOAD ================= */

  useEffect(() => {

    loadRooms();

  }, [loadRooms]);

  /* ================= AUTH CHECK ================= */

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (user) => {

      if (!user) {
        navigate("/login");
      }

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
      alert("Failed to add room");

    } finally {

      setAdding(false);

    }

  };

  /* ================= ROOM STATUS ================= */

  const getStatus = (room) => {

    if (room.occupied_seats === 0)
      return { label: "EMPTY", color: "#16a34a" };

    if (room.occupied_seats === room.total_seats)
      return { label: "FULL", color: "#dc2626" };

    return { label: "PARTIAL", color: "#f59e0b" };

  };

  /* ================= LOADING ================= */

  if (loading) {

    return (
      <div style={styles.center}>
        <h3>Loading rooms...</h3>
      </div>
    );

  }

  /* ================= UI ================= */

  return (

    <div style={styles.container}>

      <h2>🛏 Room Management</h2>

      {/* ADD ROOM */}

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

        <button
          style={styles.addButton}
          onClick={addRoom}
          disabled={adding}
        >
          {adding ? "Adding..." : "➕ Add Room"}
        </button>

      </div>

      {/* ROOM LIST */}

      {rooms.length === 0 ? (

        <p>No rooms added yet</p>

      ) : (

        <div style={styles.roomGrid}>

          {rooms.map((room) => {

            const status = getStatus(room);

            return (

              <div key={room.id} style={styles.card}>

                <h3>Room {room.room_no}</h3>

                <p>
                  🪑 Seats: {room.occupied_seats}/{room.total_seats}
                </p>

                <p>
                  Status:
                  <span style={{ color: status.color, fontWeight: "bold", marginLeft: 6 }}>
                    {status.label}
                  </span>
                </p>

                <p>
                  Available Beds:
                  <b style={{ marginLeft: 5 }}>
                    {room.total_seats - room.occupied_seats}
                  </b>
                </p>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

};

/* ================= STYLES ================= */

const styles = {

  container: {
    maxWidth: 900,
    margin: "auto",
    padding: 20
  },

  center: {
    textAlign: "center",
    marginTop: 50
  },

  addRoomBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20
  },

  input: {
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 6
  },

  addButton: {
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: 6,
    cursor: "pointer"
  },

  roomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
    gap: 15
  },

  card: {
    border: "1px solid #ddd",
    padding: 16,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 3px 8px rgba(0,0,0,0.08)"
  }

};

export default OwnerRooms;