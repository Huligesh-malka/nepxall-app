import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Home() {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 1000;

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
          
          // ✅ Check if more data exists
          setHasMore(false);
        }
        setLoading(false);
        setLoadingMore(false);
      })
      .catch(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [page]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  if (loading && page === 1) return <div style={{ padding: 20, textAlign: "center" }}>Loading properties...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>Properties</h1>
      
      <div style={{ display: "grid", gap: 20 }}>
        {pgs.map(pg => (
          <div 
            key={pg.id} 
            onClick={() => navigate(`/pg/${pg.id}`)}
            style={{ 
              border: "1px solid #ccc", 
              padding: 15, 
              cursor: "pointer",
              borderRadius: 10,
              transition: "all 0.3s ease",
              backgroundColor: "white"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>{pg.pg_name}</h3>
            <p style={{ margin: "5px 0", color: "#666" }}>📍 {pg.location}</p>
            <p style={{ margin: "5px 0", fontSize: 18, fontWeight: "bold", color: "#2563eb" }}>
              ₹{pg.rent_amount}/month
            </p>
          </div>
        ))}
      </div>

      {/* ✅ Show count */}
      <div style={{ textAlign: "center", marginTop: 50, marginBottom: 30 }}>
        <p style={{ 
          marginTop: 15, 
          fontSize: 14, 
          color: "#666",
          fontWeight: "500"
        }}>
          Showing {pgs.length} properties
        </p>
      </div>
    </div>
  );
}