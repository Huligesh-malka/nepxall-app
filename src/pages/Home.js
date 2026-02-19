import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { API_CONFIG } from "../config";

export default function Home() {
  const navigate = useNavigate();

  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= LOAD PGs ================= */
  const loadPGs = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📡 Home page loading PGs from:", API_CONFIG.API_URL);

      const res = await api.get("/pg/search/advanced");

      if (res.data?.data) {
        console.log(`✅ Loaded ${res.data.data.length} PGs`);
        setPGs(res.data.data);
      } else {
        console.log("⚠️ No PGs found");
        setPGs([]);
      }
    } catch (err) {
      console.error("❌ Failed to load PGs:", err);
      console.error("❌ API URL being used:", API_CONFIG.API_URL);
      setError("Failed to load PGs. Please check if backend is running.");
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
        return API_CONFIG.BACKEND_URL + parsed[0];
      }

      return null;
    } catch {
      return null;
    }
  };

  /* ================= FORMAT PRICE ================= */
  const formatPrice = (price) => {
    if (!price) return "0";
    return Number(price).toLocaleString('en-IN');
  };

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "20px auto"
        }} />
        <h3>Loading PGs...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: "center", 
        color: "red",
        padding: "40px",
        background: "#fee2e2",
        borderRadius: 8,
        margin: "20px"
      }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>{error}</p>
        <p style={{ fontSize: 14, color: "#666", marginTop: 10 }}>
          API URL: {API_CONFIG.API_URL}
        </p>
        <button
          onClick={loadPGs}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30 
      }}>
        <h2>🏠 Available Properties</h2>
        <div style={{ 
          background: "#e2e8f0", 
          padding: "6px 12px", 
          borderRadius: 20,
          fontSize: 14,
          color: "#334155"
        }}>
          {pgs.length} properties found
        </div>
      </div>

      {pgs.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: 60,
          background: "#f8fafc",
          borderRadius: 12,
          border: "2px dashed #cbd5e1"
        }}>
          <p style={{ fontSize: 18, color: "#64748b" }}>No properties available</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: 20
        }}>
          {pgs.map((pg) => {
            const imageUrl = getImage(pg.photos);
            const rentAmount = pg.rent_amount || pg.single_sharing || 0;

            return (
              <div
                key={pg.id}
                onClick={() => navigate(`/pg/${pg.id}`)}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, boxShadow 0.2s",
                  border: "1px solid #e2e8f0"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
              >
                {/* IMAGE */}
                <div style={{ position: "relative", height: 200 }}>
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={pg.pg_name} 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover" 
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: "100%", 
                      height: "100%", 
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      fontSize: 14
                    }}>
                      No image available
                    </div>
                  )}
                  
                  {/* TYPE BADGE */}
                  <div style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: pg.pg_category === "pg" ? "#16a34a" :
                               pg.pg_category === "coliving" ? "#8b5cf6" :
                               pg.pg_category === "to_let" ? "#f97316" : "#3b82f6",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}>
                    {pg.pg_category === "pg" ? "PG" :
                     pg.pg_category === "coliving" ? "CO-LIVING" :
                     pg.pg_category === "to_let" ? "TO-LET" : "HOSTEL"}
                  </div>
                </div>

                {/* DETAILS */}
                <div style={{ padding: 16 }}>
                  <h3 style={{ 
                    margin: "0 0 8px 0", 
                    fontSize: 18, 
                    fontWeight: 600,
                    color: "#0f172a"
                  }}>
                    {pg.pg_name}
                  </h3>

                  <p style={{ 
                    color: "#64748b", 
                    margin: "0 0 12px 0",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    📍 {pg.location || pg.area || "Location not specified"}
                  </p>

                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12
                  }}>
                    <div>
                      <p style={{ 
                        fontWeight: "bold", 
                        fontSize: 20,
                        color: "#0f172a",
                        margin: 0
                      }}>
                        ₹{formatPrice(rentAmount)}
                      </p>
                      <p style={{ 
                        fontSize: 12, 
                        color: "#64748b",
                        margin: "4px 0 0 0"
                      }}>
                        per month
                      </p>
                    </div>

                    {pg.available_beds !== undefined && pg.available_beds > 0 && (
                      <div style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        🛏 {pg.available_beds} available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}