import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Home() {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/pg/search/advanced")
      .then(res => {
        if (res.data?.data) setPgs(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Properties</h1>
      <div style={{ display: "grid", gap: 20 }}>
        {pgs.map(pg => (
          <div 
            key={pg.id} 
            onClick={() => navigate(`/pg/${pg.id}`)}
            style={{ border: "1px solid #ccc", padding: 15, cursor: "pointer" }}
          >
            <h3>{pg.pg_name}</h3>
            <p>{pg.location}</p>
            <p>₹{pg.rent_amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}