import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Home() {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setLoading(true);

    api.get(`/pg/search/advanced?page=${page}&limit=${limit}`)
      .then(res => {
        if (res.data?.data) {
          if (page === 1) {
            setPgs(res.data.data);
          } else {
            setPgs(prev => [...prev, ...res.data.data]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  if (loading && page === 1) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Properties</h1>
      
      <div style={{ display: "grid", gap: 20 }}>
        {pgs.map(pg => (
          <div 
            key={pg.id} 
            onClick={() => navigate(`/pg/${pg.id}`)}
            style={{ 
              border: "1px solid #ccc", 
              padding: 15, 
              cursor: "pointer",
              borderRadius: 10
            }}
          >
            <h3>{pg.pg_name}</h3>
            <p>{pg.location}</p>
            <p>₹{pg.rent_amount}</p>
          </div>
        ))}
      </div>

      {/* ✅ View More Button */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          onClick={() => setPage(prev => prev + 1)}
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          {loading ? "Loading..." : "View More"}
        </button>
      </div>
    </div>
  );
}