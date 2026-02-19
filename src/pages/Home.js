import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

export default function Home() {
  const navigate = useNavigate();

  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= LOAD PGs ================= */
  const loadPGs = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/pg/search/advanced");

      if (res.data?.data) {
        setPGs(res.data.data);
      } else {
        setPGs([]);
      }
    } catch (err) {
      console.error(err);
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
    return <h3 style={{ textAlign: "center" }}>Loading PGs...</h3>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", color: "red" }}>
        {error}
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h2>Available PGs</h2>

      {pgs.length === 0 ? (
        <p>No PGs available</p>
      ) : (
        pgs.map((pg) => {
          const imageUrl = getImage(pg.photos);

          return (
            <div
              key={pg.id}
              onClick={() => navigate(`/pg/${pg.id}`)}
              style={card}
            >
              {/* IMAGE */}
              {imageUrl ? (
                <img src={imageUrl} alt={pg.pg_name} style={img} />
              ) : (
                <div style={noImg}>No image</div>
              )}

              {/* DETAILS */}
              <div>
                <h3 style={{ margin: 0 }}>{pg.pg_name}</h3>

                <p style={muted}>📍 {pg.location}</p>

                <p style={{ fontWeight: "bold" }}>
                  💰 ₹{pg.rent_amount}
                </p>

                {pg.available_beds !== undefined && (
                  <p style={{ color: "green" }}>
                    🛏 {pg.available_beds} beds available
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  display: "flex",
  gap: 15,
  background: "#fff",
  padding: 15,
  marginBottom: 15,
  borderRadius: 10,
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  transition: "0.2s",
};

const img = {
  width: 150,
  height: 100,
  objectFit: "cover",
  borderRadius: 6,
};

const noImg = {
  width: 150,
  height: 100,
  background: "#f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  borderRadius: 6,
};

const muted = {
  color: "#64748b",
  margin: "4px 0",
};
