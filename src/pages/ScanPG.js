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
      console.error("QR Scan fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40 }}>Loading property...</div>;
  }

  if (!pg) {
    return <div style={{ padding: 40 }}>Property not found</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 700, margin: "auto" }}>

      <h1>{pg.pg_name}</h1>

      {pg.photos && pg.photos.length > 0 && (
        <img
          src={pg.photos[0]}
          alt="PG"
          style={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 10,
            marginBottom: 20
          }}
        />
      )}

      <p>
        <strong>Location:</strong> {pg.area}, {pg.city}
      </p>

      <p>
        <strong>Available Rooms:</strong> {pg.available_rooms}
      </p>

      <p>
        <strong>Rent Starting From:</strong> ₹{pg.rent_amount}
      </p>

      <div style={{ marginTop: 20 }}>

        <button
          onClick={() => navigate(`/pg/${id}`)}
          style={{
            padding: "10px 20px",
            marginRight: 10,
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          View Full Details
        </button>

        {pg.contact_phone && (
          <a href={`tel:${pg.contact_phone}`}>
            <button
              style={{
                padding: "10px 20px",
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: 5,
                cursor: "pointer"
              }}
            >
              Call Owner
            </button>
          </a>
        )}

      </div>

    </div>
  );
};

export default ScanPG;