import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase"; // ✅ ADD THIS

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";
const API = `${BACKEND_URL}/api/pg`;

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  /* ================= LOAD PHOTOS ================= */
  const loadPhotos = async () => {
    try {
      const res = await axios.get(`${API}/${id}`);
      if (res.data?.success) {
        setPhotos(res.data.data.photos || []);
      }
    } catch {
      setPhotos([]);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [id]);

  /* ================= UPLOAD PHOTOS ================= */
  const uploadPhotos = async () => {
    if (files.length === 0) {
      alert("Please select at least one photo");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please login again");
      return;
    }

    const token = await user.getIdToken(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));

    try {
      setLoading(true);
      await axios.put(`${API}/${id}/photos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // ✅ FIX
        },
      });

      setFiles([]);
      loadPhotos();
      alert("Photos uploaded successfully ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Photo upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE PHOTO ================= */
  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Please login again");
      return;
    }

    const token = await user.getIdToken(true);

    try {
      await axios.delete(`${API}/${id}/photo`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ FIX
        },
        data: { photo },
      });
      loadPhotos();
    } catch {
      alert("Failed to delete photo ❌");
    }
  };

  /* ================= DRAG & DROP ================= */
  const onDragStart = (index) => setDragIndex(index);

  const onDrop = async (index) => {
    if (dragIndex === null) return;

    const updated = [...photos];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);

    setPhotos(updated);
    setDragIndex(null);

    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken(true);

    try {
      await axios.put(
        `${API}/${id}/photos/order`,
        { photos: updated },
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ FIX
          },
        }
      );
    } catch {
      alert("Failed to save photo order ❌");
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h2>📷 Manage PG Photos</h2>

      {/* UPLOAD SECTION */}
      <div
        style={{
          border: "2px dashed #6f42c1",
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
          background: "#f9f7ff",
        }}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles([...e.target.files])}
          style={{ marginBottom: 10 }}
        />

        {files.length > 0 && (
          <div style={{ marginTop: 10, color: "#555" }}>
            <strong>Selected files:</strong>
            <ul style={{ margin: "5px 0", paddingLeft: 20 }}>
              {files.map((file, idx) => (
                <li key={idx} style={{ fontSize: 14 }}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <p style={{ fontSize: 13, color: "#666", marginTop: 5 }}>
          • Max photo size: <b>5 MB</b> <br />
          • Supported formats: JPG, PNG, JPEG, WEBP
        </p>

        <button
          onClick={uploadPhotos}
          disabled={loading || files.length === 0}
          style={{
            marginTop: 10,
            padding: "10px 18px",
            background: files.length > 0 ? "#6f42c1" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: files.length > 0 ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          {loading
            ? "⏳ Uploading..."
            : `⬆ Upload ${files.length} Photo${
                files.length !== 1 ? "s" : ""
              }`}
        </button>
      </div>

      {/* GALLERY SECTION */}
      <div style={{ marginTop: 30 }}>
        <h3>
          📸 Uploaded Photos{" "}
          <span style={{ fontSize: 14, color: "#666", marginLeft: 10 }}>
            ({photos.length} photos) • Drag to reorder
          </span>
        </h3>

        {photos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              border: "2px dashed #ddd",
              borderRadius: 8,
              color: "#888",
            }}
          >
            No photos uploaded yet
          </div>
        ) : (
          <div style={grid}>
            {photos.map((photo, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(index)}
                style={card}
              >
                <img
                  src={`${BACKEND_URL}${photo}`}
                  alt={`PG ${index + 1}`}
                  style={img}
                />

                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "rgba(0,0,0,0.7)",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {index + 1}
                </div>

                <button
                  onClick={() => deletePhoto(photo)}
                  style={deleteBtn}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 20,
};

const card = {
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  cursor: "grab",
  border: "1px solid #ddd",
  background: "#fff",
};

const img = {
  width: "100%",
  height: "160px",
  objectFit: "cover",
};

const deleteBtn = {
  position: "absolute",
  top: 8,
  right: 8,
  background: "rgba(220, 53, 69, 0.9)",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: 30,
  height: 30,
  cursor: "pointer",
};

export default OwnerPGPhotos;
