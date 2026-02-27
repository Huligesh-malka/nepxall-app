import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

// ✅ PRODUCTION URL CONFIGURATION
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://your-backend.com";
const API = `${BACKEND_URL}/api/pg`;

// ✅ CLOUDINARY BASE URL (for production)
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/your-cloud-name/image/upload/";

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ================= LOAD PHOTOS ================= */
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/${id}`);
      if (res.data?.success) {
        // ✅ Ensure we have an array of photo URLs
        setPhotos(res.data.data.photos || []);
      }
    } catch (err) {
      console.error("Error loading photos:", err);
      setPhotos([]);
    } finally {
      setLoading(false);
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
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        alert(`File "${file.name}" exceeds 5MB limit`);
        return;
      }
      
      // Check file type
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

    const token = await user.getIdToken(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // ✅ Upload with progress tracking
      const response = await axios.post(`${API}/${id}/upload-photos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        setFiles([]);
        setUploadProgress(0);
        await loadPhotos(); // Reload to get updated list
        alert(`✅ ${response.data.message || "Photos uploaded successfully"}`);
      } else {
        alert(`❌ ${response.data.message || "Upload failed"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      
      // ✅ Better error messages
      let errorMessage = "Photo upload failed ❌";
      if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (err.response?.status === 413) {
        errorMessage = "Files too large. Maximum total size is 50MB.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      alert(errorMessage);
      
      // Clear file input on error
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

    const token = await user.getIdToken(true);

    try {
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
      // Revert on error? Optional
      // loadPhotos();
    }
  };

  /* ================= HELPER: Get Optimized Image URL ================= */
  const getOptimizedImageUrl = (path, options = {}) => {
    if (!path) return "";
    
    // If it's already a full URL (Cloudinary), optimize it
    if (path.includes('cloudinary.com')) {
      // Add Cloudinary transformations for optimization
      const transformations = [];
      
      // Resize to appropriate dimensions
      if (options.width) {
        transformations.push(`w_${options.width}`);
      }
      if (options.height) {
        transformations.push(`h_${options.height}`);
      }
      
      // Maintain aspect ratio and auto-optimize
      transformations.push('c_fill');
      transformations.push('f_auto'); // Automatic format (WebP if supported)
      transformations.push('q_auto'); // Automatic quality
      
      const transformationString = transformations.join(',');
      
      // Insert transformations into Cloudinary URL
      // Format: https://res.cloudinary.com/cloud-name/image/upload/v12345/path
      return path.replace('/upload/', `/upload/${transformationString}/`);
    }
    
    // For local files (development), return as-is
    return `${BACKEND_URL}${path}`;
  };

  /* ================= CLEAR SELECTED FILES ================= */
  const clearSelectedFiles = () => {
    setFiles([]);
    setUploadProgress(0);
    // Reset file input
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
        <span style={progressText}>{uploadProgress}% Uploaded</span>
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
                const fileStatus = !isValid ? 'invalid' : isOverSize ? 'oversize' : 'valid';
                
                return (
                  <li key={idx} style={{
                    ...fileListItem,
                    color: fileStatus === 'valid' ? '#333' : 
                           fileStatus === 'invalid' ? '#dc3545' : '#ff9800'
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
                  src={getOptimizedImageUrl(photo, { width: 400, height: 300 })}
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
const container = {
  maxWidth: 1000,
  margin: "auto",
  padding: 20,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  background: "linear-gradient(145deg, #f9f7ff 0%, #ffffff 100%)",
  boxShadow: "0 4px 12px rgba(111, 66, 193, 0.1)",
};

const fileListContainer = {
  marginTop: 15,
  padding: 15,
  background: "#f8f9fa",
  borderRadius: 8,
  border: "1px solid #e9ecef",
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
  padding: "4px 8px",
  borderRadius: 4,
  transition: "all 0.2s",
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
  padding: "2px 0",
};

const uploadNote = {
  fontSize: 13,
  color: "#666",
  marginTop: 10,
  padding: "8px 12px",
  background: "#e9ecef",
  borderRadius: 6,
  display: "inline-block",
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
  transition: "all 0.2s",
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
  background: "linear-gradient(90deg, #6f42c1, #9b7bff)",
  transition: "width 0.3s ease",
};

const progressText = {
  fontSize: 14,
  color: "#666",
  minWidth: 80,
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
  transition: "transform 0.2s, box-shadow 0.2s",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  ":hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  },
};

const img = {
  width: "100%",
  height: "180px",
  objectFit: "cover",
  display: "block",
  transition: "transform 0.3s",
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
  backdropFilter: "blur(4px)",
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
  transition: "all 0.2s",
  opacity: 0.9,
  ":hover": {
    opacity: 1,
    transform: "scale(1.1)",
    background: "#dc3545",
  },
};

export default OwnerPGPhotos;