import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

/* ================= ENV CONFIG ================= */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BACKEND_URL = API_URL.replace("/api", "");

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: API_URL,
});

/* ================= COMPONENT ================= */

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState(null);

  /* ================= GET TOKEN ================= */

  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Login required");
    return await user.getIdToken();
  };

  /* ================= LOAD PHOTOS ================= */

  const loadPhotos = useCallback(async () => {
    try {
      setPageLoading(true);
      const res = await api.get(`/pg/${id}`);

      if (res.data?.success) {
        setPhotos(res.data.data.photos || []);
      }
    } catch {
      setPhotos([]);
    } finally {
      setPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  /* ================= UPLOAD ================= */

  const uploadPhotos = async () => {
    if (!files.length) return alert("Select photos");

    try {
      setLoading(true);
      const token = await getToken();

      const formData = new FormData();
      files.forEach((f) => formData.append("photos", f));

      await api.put(`/pg/${id}/photos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFiles([]);
      loadPhotos();
      alert("✅ Uploaded");
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;

    try {
      const token = await getToken();

      await api.delete(`/pg/${id}/photo`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photo },
      });

      loadPhotos();
    } catch {
      alert("Delete failed");
    }
  };

  /* ================= DRAG ================= */

  const onDrop = async (index) => {
    if (dragIndex === null) return;

    const updated = [...photos];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);

    setPhotos(updated);
    setDragIndex(null);

    try {
      const token = await getToken();

      await api.put(
        `/pg/${id}/photos/order`,
        { photos: updated },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch {
      alert("Order save failed");
    }
  };

  /* ================= UI ================= */

  if (pageLoading) return <h3>Loading photos...</h3>;

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h2>📷 Manage PG Photos</h2>

      {/* UPLOAD */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setFiles([...e.target.files])}
      />

      <button onClick={uploadPhotos} disabled={loading}>
        {loading ? "Uploading..." : `Upload (${files.length})`}
      </button>

      {/* GALLERY */}
      <div style={grid}>
        {photos.map((photo, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(index)}
            style={card}
          >
            <img
              src={`${BACKEND_URL}${photo}`}
              alt=""
              style={img}
              onError={(e) =>
                (e.target.src =
                  "https://via.placeholder.com/300x200?text=No+Image")
              }
            />

            <button onClick={() => deletePhoto(photo)} style={deleteBtn}>
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
  gap: 16,
  marginTop: 20,
};

const card = {
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid #ddd",
};

const img = {
  width: "100%",
  height: 160,
  objectFit: "cover",
};

const deleteBtn = {
  position: "absolute",
  top: 8,
  right: 8,
  background: "red",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: 30,
  height: 30,
  cursor: "pointer",
};

export default OwnerPGPhotos;