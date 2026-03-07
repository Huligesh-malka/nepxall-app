import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ScanPG = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPG();
  }, [id]);

  const fetchPG = async () => {
    try {

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/scan/${id}`
      );

      if (res.data.success) {
        setPg(res.data.data);
      }

    } catch (err) {
      console.error("Scan fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading property...</div>;

  if (!pg) return <div style={{ padding: 40 }}>Property not found</div>;

  return (
    <div style={{ padding: 40 }}>

      <h2>{pg.pg_name}</h2>

      {pg.photos && pg.photos.length > 0 && (
        <img
          src={pg.photos[0]}
          alt="pg"
          style={{ width: 300, borderRadius: 10 }}
        />
      )}

      <p><b>Location:</b> {pg.area}, {pg.city}</p>

      <p><b>Available Rooms:</b> {pg.available_rooms}</p>

      <p><b>Rent Starting:</b> ₹{pg.rent_amount}</p>

      <br/>

      <button
        onClick={() => navigate(`/pg/${id}`)}
      >
        View Full Details
      </button>

      <br/><br/>

      {pg.contact_phone && (
        <a href={`tel:${pg.contact_phone}`}>
          <button>Call Owner</button>
        </a>
      )}

    </div>
  );
};

export default ScanPG;