import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/pg";

function UserJoinPG() {
  const userId = 1;
  const [pgs, setPgs] = useState([]);
  const [selectedPG, setSelectedPG] = useState(null);
  const [roomNo, setRoomNo] = useState("");

  useEffect(() => {
    axios.get(`${API}/search?q=`).then(res => setPgs(res.data));
  }, []);

  const joinPG = async () => {
    await axios.post(`${API}/join`, {
      user_id: userId,
      pg_id: selectedPG.id,
      room_no: roomNo,
    });
    alert("Joined PG ✅");
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Join PG</h2>

      {pgs.map(pg => (
        <div key={pg.id} onClick={() => setSelectedPG(pg)} style={styles.card}>
          <b>{pg.pg_name}</b>
          <p>₹{pg.rent_amount}</p>
        </div>
      ))}

      {selectedPG && (
        <div style={styles.card}>
          <h3>{selectedPG.pg_name}</h3>
          <input
            placeholder="Room No"
            value={roomNo}
            onChange={e => setRoomNo(e.target.value)}
          />
          <button onClick={joinPG}>Join</button>
        </div>
      )}
    </div>
  );
}

export default UserJoinPG;

const styles = {
  card: { background: "#fff", padding: 15, marginBottom: 10 },
};
