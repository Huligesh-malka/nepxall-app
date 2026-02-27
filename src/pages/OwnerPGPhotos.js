import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

/* ================= ENV ================= */
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://nepxall-backend.onrender.com";

const API = process.env.REACT_APP_API_URL || `${BACKEND_URL}/api`;

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ================= LOAD ================= */
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/pg/${id}`);
      if (res.data?.success) {
        setPhotos(res.data.data.photos || []);
      }
    } catch (err) {
      console.error("Load error:", err);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadPhotos();
  }, [id]);

  /* ================= UPLOAD ================= */
  const uploadPhotos = async () => {
    if (!files.length) return alert("Select photos");

    const user = auth.currentUser;
    if (!user) return alert("Login again");

    for (const file of files) {
      if (!file.type.startsWith("image/"))
        return alert(`${file.name} is not an image`);
      if (file.size > 5 * 1024 * 1024)
        return alert(`${file.name} > 5MB`);
    }

    const token = await user.getIdToken(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));

    try {
      setUploading(true);

      await axios.post(`${API}/pg/${id}/upload-photos`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percent);
        },
      });

      setFiles([]);
      setUploadProgress(0);
      loadPhotos();
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

    try {
      await axios.delete(`${API}/pg/${id}/photo`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photo },
      });

      setPhotos((prev) => prev.filter((p) => p !== photo));
    } catch {
      alert("Delete failed");
    }
  };

  /* ================= REORDER ================= */
  const onDrop = async (index) => {
    if (dragIndex === null) return;

    const updated = [...photos];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);

    setPhotos(updated);
    setDragIndex(null);

    const token = await auth.currentUser.getIdToken(true);

    await axios.put(
      `${API}/pg/${id}/photos/order`,
      { photos: updated },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  /* ================= IMAGE URL ================= */
  const getImageUrl = (path) => {
    if (!path) return "/no-image.png";

    if (path.startsWith("http")) return path;

    return `${process.env.REACT_APP_FILES_URL}${path}`;
  };

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h2>📷 Manage PG Photos</h2>

      <input
        type="file"
        multiple
        accept="image/*"
        disabled={uploading}
        onChange={(e) => setFiles([...e.target.files])}
      />

      <br />

      <button onClick={uploadPhotos} disabled={uploading}>
        {uploading ? `Uploading ${uploadProgress}%` : "Upload"}
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : photos.length === 0 ? (
        <p>No photos</p>
      ) : (
        <div style={grid}>
          {photos.map((p, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              style={card}
            >
              <img
                src={getImageUrl(p)}
                alt=""
                style={img}
                onError={(e) => (e.target.src = "/no-image.png")}
              />

              <button onClick={() => deletePhoto(p)} style={deleteBtn}>
                ❌
              </button>
            </div>
          ))}
        </div>
      )}
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
  border: "1px solid #ddd",
  borderRadius: 10,
  overflow: "hidden",
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