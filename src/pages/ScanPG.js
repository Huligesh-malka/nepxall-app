import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";

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
        `${API_CONFIG.USER_API_URL}/scan/${id}`
      );

      if (res.data.success) {
        setPg(res.data.data);
      }

    } catch (err) {
      console.error("Scan error:", err);
    }

    setLoading(false);
  };

  const callOwner = () => {
    if (pg?.contact_phone) {
      window.location.href = `tel:${pg.contact_phone}`;
    }
  };

  if (loading) {
    return (
      <div style={{padding:40,textAlign:"center"}}>
        Loading PG details...
      </div>
    );
  }

  if (!pg) {
    return (
      <div style={{padding:40,textAlign:"center"}}>
        PG not found
      </div>
    );
  }

  return (
    <div style={{
      maxWidth:500,
      margin:"40px auto",
      background:"#fff",
      padding:25,
      borderRadius:12,
      boxShadow:"0 10px 30px rgba(0,0,0,0.1)"
    }}>

      {/* PG NAME */}
      <h2 style={{marginBottom:10}}>
        {pg.pg_name}
      </h2>

      {/* LOCATION */}
      <p>
        📍 {pg.area}, {pg.city}
      </p>

      {/* MAIN PRICE */}
      <h3 style={{marginTop:15}}>
        Starting Rent: ₹{pg.rent_amount}
      </h3>

      {/* AVAILABLE ROOMS */}
      <p style={{marginTop:10}}>
        🏠 Available Rooms: <b>{pg.available_rooms}</b>
      </p>

      <hr/>

      <h3>Available Room Types</h3>

      {pg.single_sharing && (
        <p>🛏 Single Sharing – ₹{pg.single_sharing}</p>
      )}

      {pg.double_sharing && (
        <p>🛏 Double Sharing – ₹{pg.double_sharing}</p>
      )}

      {pg.triple_sharing && (
        <p>🛏 Triple Sharing – ₹{pg.triple_sharing}</p>
      )}

      {pg.four_sharing && (
        <p>🛏 Four Sharing – ₹{pg.four_sharing}</p>
      )}

      <div style={{marginTop:25,display:"flex",gap:10}}>

        <button
          onClick={() => navigate(`/pg/${id}`)}
          style={{
            flex:1,
            padding:12,
            background:"#4f46e5",
            color:"#fff",
            border:"none",
            borderRadius:8,
            cursor:"pointer"
          }}
        >
          View Full Details
        </button>

        {pg.contact_phone && (
          <button
            onClick={callOwner}
            style={{
              flex:1,
              padding:12,
              background:"#22c55e",
              color:"#fff",
              border:"none",
              borderRadius:8,
              cursor:"pointer"
            }}
          >
            Call Owner
          </button>
        )}

      </div>

    </div>
  );
};

export default ScanPG;