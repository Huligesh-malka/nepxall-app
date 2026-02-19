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
  const [error, setError] = useState(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
      else loadRooms();
    });

    return unsub;
  }, [pgId]);

  /* ================= LOAD ROOMS ================= */
  const loadRooms = useCallback(async () => {
    if (!pgId) return;

    try {
      setLoading(true);
      const res = await api.get(`/rooms/${pgId}`);
      setRooms(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [pgId]);

  /* ================= ADD ROOM ================= */
  const addRoom = async () => {
    if (!roomNo || !totalSeats) {
      return alert("Enter room no & seats");
    }

    try {
      setAdding(true);

      await api.post("/rooms/add", {
        pg_id: pgId,
        room_no: roomNo,
        total_seats: totalSeats,
      });

      setRoomNo("");
      setTotalSeats("");

      loadRooms();
    } catch (err) {
      console.error(err);
      alert("Failed to add room");
    } finally {
      setAdding(false);
    }
  };

  /* ================= HELPERS ================= */
  const getStatus = (room) => {
    if (room.occupied_seats === 0) return { label: "EMPTY", color: "green" };
    if (room.occupied_seats === room.total_seats)
      return { label: "FULL", color: "red" };
    return { label: "PARTIAL", color: "orange" };
  };

  /* ================= STATES ================= */

  if (loading) return <h3 style={{ textAlign: "center" }}>Loading rooms...</h3>;

  if (error)
    return (
      <div style={{ textAlign: "center", color: "red" }}>
        {error}
      </div>
    );

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>🛏 Room Management</h2>

      {/* ADD ROOM */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Room No"
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value)}
        />

        <input
          type="number"
          placeholder="Total Seats"
          value={totalSeats}
          onChange={(e) => setTotalSeats(e.target.value)}
        />

        <button onClick={addRoom} disabled={adding}>
          {adding ? "Adding..." : "➕ Add Room"}
        </button>
      </div>

      {/* ROOMS LIST */}
      {rooms.length === 0 ? (
        <p>No rooms added yet</p>
      ) : (
        rooms.map((r) => {
          const status = getStatus(r);

          return (
            <div key={r.id} style={card}>
              <h4>Room {r.room_no}</h4>

              <p>
                🪑 Seats: {r.occupied_seats}/{r.total_seats}
              </p>

              <p>
                Status:{" "}
                <b style={{ color: status.color }}>{status.label}</b>
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const card = {
  border: "1px solid #ddd",
  padding: 12,
  marginBottom: 12,
  borderRadius: 8,
  background: "#fff",
};

export default OwnerRooms;
