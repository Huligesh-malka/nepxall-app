import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

// Use environment variable directly with fallback
const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

export default function Home() {
  const navigate = useNavigate();

  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= LOAD PGs ================= */
  const loadPGs = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📡 Loading PGs from:", import.meta.env.VITE_API_URL || "http://localhost:5000/api");

      const res = await api.get("/pg/search/advanced");

      if (res.data?.data) {
        setPGs(res.data.data);
      } else {
        setPGs([]);
      }
    } catch (err) {
      console.error("Failed to load PGs:", err);
      setError("Failed to load PGs");
      setPGs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPGs();
  }, [loadPGs]);

  /* ================= HELPERS ================= */
  const getImage = (photos) => {
    try {
      let parsed = photos;

      if (typeof photos === "string") {
        parsed = JSON.parse(photos);
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        return BACKEND_URL + parsed[0];
      }

      return null;
    } catch {
      return null;
    }
  };

  /* ================= STATES ================= */

  if (loading) {
    return <h3 style={{ textAlign: "center", padding: "40px" }}>Loading properties...</h3>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "red" }}>
        <p>{error}</p>
        <button 
          onClick={loadPGs}
          style={{
            padding: "8px 16px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            marginTop: 16
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>🏠 Available Properties</h1>
        <span style={{ background: "#e5e7eb", padding: "4px 12px", borderRadius: 16 }}>
          {pgs.length} properties
        </span>
      </div>

      {pgs.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>
          No properties available
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px"
        }}>
          {pgs.map((pg) => {
            const imageUrl = getImage(pg.photos);

            return (
              <div
                key={pg.id}
                onClick={() => navigate(`/pg/${pg.id}`)}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "white",
                  transition: "transform 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={pg.pg_name} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: 180, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    No image
                  </div>
                )}
                
                <div style={{ padding: 16 }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>{pg.pg_name}</h3>
                  <p style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: 14 }}>
                    📍 {pg.location || pg.area || "Location not specified"}
                  </p>
                  <p style={{ fontWeight: "bold", fontSize: 18, margin: 0 }}>
                    ₹{pg.rent_amount || 0}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}