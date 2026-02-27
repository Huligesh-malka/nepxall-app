import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";
const API = `${BACKEND_URL}/api/pg`;

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  /* ================= UPLOAD PHOTOS ================= */
  const uploadPhotos = async () => {
    if (files.length === 0) {
      alert("Please select at least one photo");
      return;
    }

    // Check file sizes (5MB max)
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 5MB limit`);
        return;
      }
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
      setUploading(true);
      
      // ✅ FIXED: Using POST instead of PUT for upload-photos endpoint
      const response = await axios.post(`${API}/${id}/upload-photos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setFiles([]);
        await loadPhotos(); // Reload to get updated list
        alert(`✅ ${response.data.message || "Photos uploaded successfully"}`);
      } else {
        alert(`❌ ${response.data.message || "Upload failed"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Photo upload failed ❌");
      
      // Clear file input on error
      setFiles([]);
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE PHOTO ================= */
  const deletePhoto = async (photoUrl) => {
    if (!window.confirm("Delete this photo?")) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Please login again");
      return;
    }

    const token = await user.getIdToken(true);

    try {
      // ✅ FIXED: Using correct endpoint for single photo deletion
      const response = await axios.delete(`${API}/${id}/photo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { photo: photoUrl },
      });

      if (response.data.success) {
        // Remove from local state immediately for better UX
        setPhotos(prev => prev.filter(p => p !== photoUrl));
        alert("✅ Photo deleted successfully");
      } else {
        alert(`❌ ${response.data.message || "Failed to delete photo"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete photo ❌");
    }
  };

  /* ================= DRAG & DROP REORDER ================= */
  const onDragStart = (index) => setDragIndex(index);

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (index) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }

    // Update local state immediately for smooth UI
    const updated = [...photos];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);
    
    setPhotos(updated);
    setDragIndex(null);

    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken(true);

    try {
      // ✅ FIXED: Using correct endpoint for photo order
      await axios.put(
        `${API}/${id}/photos/order`,
        { photos: updated },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Failed to save photo order:", err);
      alert("Failed to save photo order, but reordering is applied locally ❌");
      // Revert on error? Optional
      // loadPhotos();
    }
  };

  /* ================= HELPER: Get Image URL ================= */
  const getImageUrl = (path) => {
    if (!path) return "";
    // If it's already a full URL (Cloudinary), return as-is
    if (path.startsWith("http")) return path;
    // Otherwise, prepend backend URL for local files
    return `${BACKEND_URL}${path}`;
  };

  /* ================= CLEAR SELECTED FILES ================= */
  const clearSelectedFiles = () => {
    setFiles([]);
    // Reset file input
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
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
          id="photo-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles([...e.target.files])}
          style={{ marginBottom: 10 }}
          disabled={uploading}
        />

        {files.length > 0 && (
          <div style={{ marginTop: 10, color: "#555" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Selected files:</strong>
              <button 
                onClick={clearSelectedFiles}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc3545",
                  cursor: "pointer",
                  fontSize: 14,
                  textDecoration: "underline"
                }}
              >
                Clear all
              </button>
            </div>
            <ul style={{ margin: "5px 0", paddingLeft: 20 }}>
              {files.map((file, idx) => {
                const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                const isValid = file.type.startsWith('image/');
                return (
                  <li key={idx} style={{ fontSize: 14, color: isValid ? '#333' : '#dc3545' }}>
                    {file.name} ({fileSizeMB} MB)
                    {!isValid && " ⚠️ Invalid format"}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p style={{ fontSize: 13, color: "#666", marginTop: 5 }}>
          • Max photo size: <b>5 MB</b> <br />
          • Supported formats: JPG, PNG, JPEG, WEBP
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={uploadPhotos}
            disabled={uploading || files.length === 0}
            style={{
              padding: "10px 18px",
              background: files.length > 0 && !uploading ? "#6f42c1" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: files.length > 0 && !uploading ? "pointer" : "not-allowed",
              fontWeight: "bold",
            }}
          >
            {uploading
              ? "⏳ Uploading..."
              : `⬆ Upload ${files.length} Photo${files.length !== 1 ? "s" : ""}`}
          </button>
          
          {uploading && (
            <div style={{ display: "flex", alignItems: "center", color: "#666" }}>
              <div style={{
                width: 20,
                height: 20,
                border: "2px solid #f3f3f3",
                borderTop: "2px solid #6f42c1",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginRight: 8
              }} />
              Uploading to Cloudinary...
            </div>
          )}
        </div>
      </div>

      {/* GALLERY SECTION */}
      <div style={{ marginTop: 30 }}>
        <h3>
          📸 Uploaded Photos{" "}
          <span style={{ fontSize: 14, color: "#666", marginLeft: 10 }}>
            ({photos.length} photo{photos.length !== 1 ? "s" : ""}) • Drag to reorder
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
                onDragOver={onDragOver}
                onDrop={() => onDrop(index)}
                style={{
                  ...card,
                  cursor: "grab",
                  opacity: dragIndex === index ? 0.5 : 1,
                }}
              >
                <img
                  src={getImageUrl(photo)}
                  alt={`PG ${index + 1}`}
                  style={img}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
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
                  title="Delete photo"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
  border: "1px solid #ddd",
  background: "#fff",
  transition: "transform 0.2s",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const img = {
  width: "100%",
  height: "160px",
  objectFit: "cover",
  display: "block",
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  transition: "background 0.2s",
  ":hover": {
    background: "#dc3545",
  },
};

export default OwnerPGPhotos;