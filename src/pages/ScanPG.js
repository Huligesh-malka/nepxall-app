import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

const ScanPG = () => {

  const { id } = useParams();

  const [pg, setPg] = useState(null);

  useEffect(() => {

    api.get(`/scan/pg/${id}`)
      .then(res => {
        setPg(res.data.data || res.data);
      })
      .catch(err => {
        console.error(err);
      });

  }, [id]);

  if (!pg) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (

    <div style={{ padding: 40, maxWidth: 600, margin: "auto" }}>

      <h1>{pg.pg_name}</h1>

      <h3>Available Rooms</h3>

      <p>Single Sharing: {pg.single_sharing}</p>
      <p>Double Sharing: {pg.double_sharing}</p>
      <p>Triple Sharing: {pg.triple_sharing}</p>
      <p>Four Sharing: {pg.four_sharing}</p>

      <h2>Rent: ₹{pg.rent_amount}</h2>

      <a
        href={`tel:${pg.contact_phone}`}
        style={{
          display: "inline-block",
          padding: "12px 20px",
          background: "#2563eb",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          marginTop: 20
        }}
      >
        📞 Call Owner
      </a>

    </div>

  );

};

export default ScanPG;