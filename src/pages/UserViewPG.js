import React, { useState } from "react";
import api from "../api/api";

const BACKEND_URL = "http://localhost:5000";

export default function UserViewPG() {
  const [code, setCode] = useState("");
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================= SEARCH ================= */
  const search = async () => {
    if (!code.trim()) return alert("Enter PG code");

    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/pg/${code}`);

      if (res.data) {
        setPg(res.data);
      } else {
        setPg(null);
        setError("PG not found");
      }
    } catch {
      setPg(null);
      setError("PG not found");
    } finally {
      setLoading(false);
    }
  };

  /* ================= HELPERS ================= */

  const parseMedia = (data) => {
    try {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === "string") return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  };

  const photos = parseMedia(pg?.photos);
  const videos = parseMedia(pg?.videos);

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h2>🔍 Find PG</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Enter PG Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button onClick={search} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* PG DETAILS */}
      {pg && (
        <div style={card}>
          <h3>{pg.pg_name}</h3>
          <p>📍 {pg.location}</p>
          <p>
            💰 ₹{pg.rent_amount} | Deposit ₹{pg.deposit_amount}
          </p>

          {/* PHOTOS */}
          <h4>📷 Photos</h4>

          {photos.length === 0 ? (
            <p>No photos available</p>
          ) : (
            <div style={mediaGrid}>
              {photos.map((p, i) => (
                <img
                  key={i}
                  src={BACKEND_URL + p}
                  alt=""
                  style={img}
                />
              ))}
            </div>
          )}

          {/* VIDEOS */}
          <h4>🎥 Videos</h4>

          {videos.length === 0 ? (
            <p>No videos available</p>
          ) : (
            <div style={mediaGrid}>
              {videos.map((v, i) => (
                <video
                  key={i}
                  src={BACKEND_URL + v}
                  style={video}
                  controls
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const mediaGrid = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 20,
};

const img = {
  width: 140,
  height: 100,
  objectFit: "cover",
  borderRadius: 6,
};

const video = {
  width: 200,
  borderRadius: 6,
};
