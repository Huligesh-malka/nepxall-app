import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

// ✅ FIXED: Using your actual backend URL from .env
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";
const API = `${BACKEND_URL}/api/pg`;

// ✅ Debug log to verify correct URL
console.log("🔧 Backend URL:", BACKEND_URL);
console.log("🔧 API URL:", API);

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  /* ================= LOAD PHOTOS ================= */
  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📸 Loading photos for PG ID:", id);
      console.log("📡 Fetching from:", `${API}/${id}`);
      
      const res = await axios.get(`${API}/${id}`);
      console.log("📥 Load response:", res.data);
      
      if (res.data?.success) {
        setPhotos(res.data.data.photos || []);
      }
    } catch (err) {
      console.error("❌ Error loading photos:", err);
      setError(err.message);
      
      if (err.code === 'ERR_NETWORK') {
        console.error("🔴 Network error - Cannot reach backend at:", BACKEND_URL);
        console.error("💡 Make sure your backend is running and CORS is enabled");
      }
      
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadPhotos();
    }
  }, [id]);

  /* ================= UPLOAD PHOTOS ================= */
  const uploadPhotos = async () => {
    if (files.length === 0) {
      alert("Please select at least one photo");
      return;
    }

    // Check file sizes (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        alert(`File "${file.name}" exceeds 5MB limit`);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert(`File "${file.name}" is not an image`);
        return;
      }
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please login again");
      return;
    }

    try {
      const token = await user.getIdToken(true);
      console.log("🔑 Got auth token");

      const formData = new FormData();
      files.forEach((f) => formData.append("photos", f));

      setUploading(true);
      setUploadProgress(0);
      
      console.log("📤 Uploading to:", `${API}/${id}/upload-photos`);
      
      const response = await axios.post(`${API}/${id}/upload-photos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      console.log("📥 Upload response:", response.data);

      if (response.data.success) {
        setFiles([]);
        setUploadProgress(0);
        await loadPhotos();
        alert(`✅ ${response.data.message || "Photos uploaded successfully"}`);
      } else {
        alert(`❌ ${response.data.message || "Upload failed"}`);
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      
      let errorMessage = "Photo upload failed ❌";
      if (err.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to server at ${BACKEND_URL}. Is your backend running?`;
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (err.response?.status === 413) {
        errorMessage = "Files too large. Maximum total size is 50MB.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(errorMessage);
      setFiles([]);
      setUploadProgress(0);
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

    try {
      const token = await user.getIdToken(true);
      
      const response = await axios.delete(`${API}/${id}/photo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { photo: photoUrl },
      });

      if (response.data.success) {
        setPhotos(prev => prev.filter(p => p !== photoUrl));
        alert("✅ Photo deleted successfully");
      } else {
        alert(`❌ ${response.data.message || "Failed to delete photo"}`);
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
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

    const updated = [...photos];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);
    
    setPhotos(updated);
    setDragIndex(null);

    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken(true);

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
      console.error("❌ Failed to save photo order:", err);
    }
  };

  /* ================= HELPER: Get Image URL ================= */
  const getImageUrl = (path) => {
    if (!path) return "";
    
    // If it's already a full URL (Cloudinary), return as-is
    if (path.startsWith("http")) return path;
    
    // For local files (development), prepend backend URL
    return `${BACKEND_URL}${path}`;
  };

  /* ================= CLEAR SELECTED FILES ================= */
  const clearSelectedFiles = () => {
    setFiles([]);
    setUploadProgress(0);
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
  };

  /* ================= RENDER UPLOAD PROGRESS ================= */
  const renderUploadProgress = () => {
    if (!uploading) return null;
    
    return (
      <div style={progressContainer}>
        <div style={progressBarContainer}>
          <div 
            style={{
              ...progressBarFill,
              width: `${uploadProgress}%`
            }}
          />
        </div>
        <span style={progressText}>{uploadProgress}%</span>
      </div>
    );
  };

  return (
    <div style={container}>
      <h2 style={title}>📷 Manage PG Photos</h2>

      {/* UPLOAD SECTION */}
      <div style={uploadSection}>
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
          <div style={fileListContainer}>
            <div style={fileListHeader}>
              <strong>Selected files:</strong>
              <button 
                onClick={clearSelectedFiles}
                style={clearButton}
                disabled={uploading}
              >
                Clear all
              </button>
            </div>
            <ul style={fileList}>
              {files.map((file, idx) => {
                const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                const isValid = file.type.startsWith('image/');
                const isOverSize = file.size > 5 * 1024 * 1024;
                
                return (
                  <li key={idx} style={{
                    ...fileListItem,
                    color: !isValid || isOverSize ? '#dc3545' : '#333'
                  }}>
                    {file.name} ({fileSizeMB} MB)
                    {!isValid && " ⚠️ Invalid format"}
                    {isOverSize && " ⚠️ Exceeds 5MB"}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p style={uploadNote}>
          • Max photo size: <b>5 MB</b> <br />
          • Supported formats: JPG, PNG, JPEG, WEBP
        </p>

        <div style={uploadActions}>
          <button
            onClick={uploadPhotos}
            disabled={uploading || files.length === 0}
            style={{
              ...uploadButton,
              background: files.length > 0 && !uploading ? "#6f42c1" : "#ccc",
              cursor: files.length > 0 && !uploading ? "pointer" : "not-allowed",
            }}
          >
            {uploading
              ? "⏳ Uploading..."
              : `⬆ Upload ${files.length} Photo${files.length !== 1 ? "s" : ""}`}
          </button>
          
          {renderUploadProgress()}
        </div>
      </div>

      {/* GALLERY SECTION */}
      <div style={{ marginTop: 30 }}>
        <h3 style={galleryTitle}>
          📸 Uploaded Photos{" "}
          <span style={photoCount}>
            ({photos.length} photo{photos.length !== 1 ? "s" : ""}) • Drag to reorder
          </span>
        </h3>

        {loading ? (
          <div style={loadingContainer}>
            <div style={spinner}></div>
            <p>Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div style={emptyState}>
            <div style={emptyStateIcon}>📷</div>
            <h4>No photos uploaded yet</h4>
            <p>Upload photos using the form above</p>
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
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />

                <div style={photoIndex}>
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
const container = {
  maxWidth: 1000,
  margin: "auto",
  padding: 20,
};

const title = {
  fontSize: "28px",
  fontWeight: 600,
  color: "#333",
  marginBottom: 24,
  borderBottom: "2px solid #6f42c1",
  paddingBottom: 10,
};

const uploadSection = {
  border: "2px dashed #6f42c1",
  borderRadius: 12,
  padding: 24,
  marginBottom: 30,
  background: "#f9f7ff",
};

const fileListContainer = {
  marginTop: 15,
  padding: 15,
  background: "#f8f9fa",
  borderRadius: 8,
};

const fileListHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const clearButton = {
  background: "none",
  border: "none",
  color: "#dc3545",
  cursor: "pointer",
  fontSize: 14,
  textDecoration: "underline",
};

const fileList = {
  margin: 0,
  paddingLeft: 20,
  maxHeight: 150,
  overflowY: "auto",
};

const fileListItem = {
  fontSize: 14,
  marginBottom: 4,
};

const uploadNote = {
  fontSize: 13,
  color: "#666",
  marginTop: 10,
  padding: "8px 12px",
  background: "#e9ecef",
  borderRadius: 6,
};

const uploadActions = {
  display: "flex",
  gap: 15,
  marginTop: 15,
  alignItems: "center",
  flexWrap: "wrap",
};

const uploadButton = {
  padding: "12px 24px",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: "bold",
  fontSize: "16px",
};

const progressContainer = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: 1,
};

const progressBarContainer = {
  flex: 1,
  height: 8,
  background: "#e9ecef",
  borderRadius: 4,
  overflow: "hidden",
};

const progressBarFill = {
  height: "100%",
  background: "#6f42c1",
  transition: "width 0.3s ease",
};

const progressText = {
  fontSize: 14,
  color: "#666",
  minWidth: 45,
};

const galleryTitle = {
  fontSize: "20px",
  fontWeight: 500,
  color: "#444",
  marginBottom: 16,
};

const photoCount = {
  fontSize: 14,
  color: "#666",
  marginLeft: 10,
  fontWeight: "normal",
};

const loadingContainer = {
  textAlign: "center",
  padding: "60px 20px",
  background: "#f8f9fa",
  borderRadius: 12,
};

const spinner = {
  width: 40,
  height: 40,
  border: "3px solid #f3f3f3",
  borderTop: "3px solid #6f42c1",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto 16px",
};

const emptyState = {
  textAlign: "center",
  padding: "60px 20px",
  border: "2px dashed #ddd",
  borderRadius: 12,
  color: "#888",
  background: "#fafafa",
};

const emptyStateIcon = {
  fontSize: 48,
  marginBottom: 16,
  opacity: 0.5,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: 20,
  marginTop: 20,
};

const card = {
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid #e0e0e0",
  background: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const img = {
  width: "100%",
  height: "180px",
  objectFit: "cover",
  display: "block",
};

const photoIndex = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(0,0,0,0.7)",
  color: "#fff",
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: "bold",
};

const deleteBtn = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "rgba(220, 53, 69, 0.9)",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: 36,
  height: 36,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
};

export default OwnerPGPhotos;