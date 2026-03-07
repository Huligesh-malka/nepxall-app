import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ScanPG = () => {

  const { id } = useParams();
  const [pg, setPg] = useState(null);

  useEffect(() => {
    fetchPG();
  }, []);

  const fetchPG = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/pg/${id}`
      );
      setPg(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!pg) return <div>Loading property...</div>;

  return (
    <div style={{ padding: 40 }}>

      <h1>{pg.name}</h1>

      <img
        src={pg.image}
        alt="pg"
        style={{ width: "300px", borderRadius: 10 }}
      />

      <p>Location: {pg.location}</p>
      <p>Rooms: {pg.totalRooms}</p>

      <button
        onClick={() =>
          window.location.href = `/pg/${id}`
        }
      >
        View Full Details
      </button>

    </div>
  );
};

export default ScanPG;