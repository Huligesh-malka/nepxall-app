import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

/* ================= CONFIG ================= */
const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_BASE.replace("/api", "");
const API = `${API_BASE}/pg`;

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  /* ================= LOAD PHOTOS ================= */
  const loadPhotos = async () => {
    try {
      const res = await axios.get(`${API}/${id}`);
      if (res.data?.success) {
        setPhotos(res.data.data.photos || []);
      }
    } catch (err) {
      console.error("Error loading photos:", err);
      setPhotos([]);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [id]);

  /* ================= IMAGE URL FIX ================= */
  const getImageUrl = (path) => {
    if (!path) return "";

    // Cloudinary → already full URL
    if (path.startsWith("http")) return path;

    // remove old localhost if stored in DB
    path = path.replace("http://localhost:5000", "");

    return `${BACKEND_URL}${path}`;
  };

  /* ================= UPLOAD ================= */
  const uploadPhotos = async () => {
    if (!files.length) return alert("Select photos");

    const user = auth.currentUser;
    if (!user) return alert("Login again");

    const token = await user.getIdToken(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));

    try {
      setUploading(true);

      const res = await axios.post(
        `${API}/${id}/upload-photos`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setFiles([]);
        loadPhotos();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE ================= */
  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete photo?")) return;

    const token = await auth.currentUser.getIdToken(true);

    await axios.delete(`${API}/${id}/photo`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { photo },
    });

    setPhotos((prev) => prev.filter((p) => p !== photo));
  };

  /* ================= DRAG ================= */
  const onDrop = async (index) => {
    if (dragIndex === null) return;

    const updated = [...photos];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);

    setPhotos(updated);
    setDragIndex(null);

    const token = await auth.currentUser.getIdToken(true);

    await axios.put(
      `${API}/${id}/photos/order`,
      { photos: updated },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  /* ================= UI ================= */
  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h2>📷 Manage PG Photos</h2>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setFiles([...e.target.files])}
      />

      <button onClick={uploadPhotos} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

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
              src={getImageUrl(photo)}
              alt=""
              style={img}
              onError={(e) =>
                (e.target.src =
                  "https://via.placeholder.com/400x300?text=No+Image")
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