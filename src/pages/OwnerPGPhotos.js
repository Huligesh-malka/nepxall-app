import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const OwnerPGPhotos = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  /* ================= INIT ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadPhotos();
      } else {
        navigate("/login");
      }
    });

    return unsubscribe;
  }, [id, navigate]);

  /* ================= LOAD PHOTOS ================= */
  const loadPhotos = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      console.log("📡 Fetching PG details for ID:", id);
      
      const res = await api.get(`/pg/${id}`);
      
      console.log("✅ API Response:", res.data);

      let photosArray = [];
      
      if (res.data?.success && res.data.data) {
        photosArray = res.data.data.photos || [];
      } else if (res.data?.data?.photos) {
        photosArray = res.data.data.photos;
      } else if (res.data?.photos) {
        photosArray = res.data.photos;
      } else if (Array.isArray(res.data)) {
        photosArray = res.data;
      }

      console.log("📸 Photos extracted:", photosArray);
      setPhotos(photosArray);

    } catch (err) {
      console.error("❌ Load error:", err);
      setError(err.response?.data?.message || "Failed to load photos");
      setPhotos([]);
    } finally {
      setPageLoading(false);
    }
  }, [id]);

  /* ================= FILE SELECT ================= */
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);

    const valid = selected.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isSizeOk = file.size <= 5 * 1024 * 1024;

      if (!isImage) alert(`${file.name} is not an image`);
      if (!isSizeOk) alert(`${file.name} exceeds 5MB`);

      return isImage && isSizeOk;
    });

    setFiles(valid);
  };

  /* ================= UPLOAD ================= */
  const uploadPhotos = async () => {
    if (!files.length) {
      alert("Please select photos to upload");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");

      const formData = new FormData();
      files.forEach((f) => formData.append("photos", f));

      console.log("📤 Uploading photos to PG ID:", id);
      console.log("📦 Number of files:", files.length);
      console.log("Current photos before upload:", photos);
      
      const response = await api.post(`/pg/${id}/upload-photos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      console.log("✅ Upload response:", response.data);

      setFiles([]);
      setUploadProgress(0);
      
      // FIX: Manually append new photos to existing ones
      let updatedPhotos = [];
      
      if (response.data.photos && Array.isArray(response.data.photos)) {
        // If backend returns only the new photos (which seems to be the case)
        if (response.data.photos.length === files.length) {
          // Backend returned only new photos, so append them manually
          console.log("⚠️ Backend returned only new photos, appending manually");
          updatedPhotos = [...photos, ...response.data.photos];
        } else {
          // Backend returned full list
          updatedPhotos = response.data.photos;
        }
      } else {
        // No photos in response, reload from server
        console.log("📡 Reloading photos from PG details");
        await loadPhotos();
        setUploading(false);
        alert(response.data.message || "Photos uploaded successfully!");
        return;
      }
      
      console.log("📸 Updated photos:", updatedPhotos);
      setPhotos(updatedPhotos);
      
      alert(response.data.message || "Photos uploaded successfully!");

    } catch (err) {
      console.error("❌ Upload error:", err);
      
      const errorMsg = err.response?.data?.message || err.message || "Upload failed";
      setError(errorMsg);
      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE ================= */
  const deletePhoto = async (photo) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      console.log("🗑️ Deleting photo:", photo);

      await api.delete(`/pg/${id}/photo`, {
        data: { photo },
      });

      setPhotos((prev) => prev.filter((p) => p !== photo));
      alert("Photo deleted successfully!");

    } catch (err) {
      console.error("❌ Delete error:", err);
      alert(err.response?.data?.message || "Delete failed");
      await loadPhotos();
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

    try {
      await api.put(
        `/pg/${id}/photos/order`,
        { photos: updated }
      );

      console.log("✅ Photos reordered successfully");

    } catch (err) {
      console.error("❌ Reorder error:", err);
      alert("Failed to update photo order");
      loadPhotos();
    }
  };

  /* ================= IMAGE URL ================= */
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=No+Image";

    if (path.startsWith("http")) return path;

    if (path.includes('/uploads/')) {
      const uploadsIndex = path.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        const relativePath = path.substring(uploadsIndex);
        return `${BACKEND_URL}${relativePath}`;
      }
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${normalizedPath}`;
  };

  /* ================= UI ================= */
  if (pageLoading) return <h3 style={{ textAlign: "center" }}>Loading...</h3>;

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>📷 Manage PG Photos</h2>

      {error && (
        <div style={{
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          border: "1px solid #fecaca"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{
        backgroundColor: "#f8fafc",
        padding: 24,
        borderRadius: 12,
        marginBottom: 30,
        border: "1px solid #e2e8f0"
      }}>
        <h3 style={{ marginBottom: 16 }}>Upload New Photos</h3>
        
        <div style={{ marginBottom: 16 }}>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploading}
            onChange={handleFileChange}
            style={{
              padding: 10,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              width: "100%",
              maxWidth: 400
            }}
          />
        </div>

        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          • Max size: <b>5MB</b> per image<br />
          • Supported formats: JPG, PNG, GIF, WEBP
        </p>

        {files.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#4b5563", marginBottom: 8 }}>
              Selected: {files.length} file(s)
            </p>
            <ul style={{ fontSize: 14, color: "#6b7280" }}>
              {Array.from(files).map((file, i) => (
                <li key={i}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              width: "100%",
              height: 8,
              backgroundColor: "#e2e8f0",
              borderRadius: 4,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: "100%",
                backgroundColor: "#3b82f6",
                transition: "width 0.3s ease"
              }} />
            </div>
            <p style={{ fontSize: 14, color: "#4b5563", marginTop: 4 }}>
              Uploading: {uploadProgress}%
            </p>
          </div>
        )}

        <button
          onClick={uploadPhotos}
          disabled={uploading || files.length === 0}
          style={{
            backgroundColor: files.length === 0 ? "#9ca3af" : "#3b82f6",
            color: "white",
            padding: "10px 24px",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 500,
            cursor: files.length === 0 ? "not-allowed" : "pointer",
            opacity: files.length === 0 ? 0.5 : 1
          }}
        >
          {uploading ? `Uploading (${uploadProgress}%)` : "⬆ Upload Photos"}
        </button>
      </div>

      <div>
        <h3 style={{ marginBottom: 16 }}>
          🖼️ Photo Gallery {photos.length > 0 && `(${photos.length})`}
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <p>Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: 60,
            backgroundColor: "#f8fafc",
            borderRadius: 12,
            border: "2px dashed #cbd5e1"
          }}>
            <p style={{ color: "#6b7280", fontSize: 16 }}>
              No photos yet. Upload some photos to get started!
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 20
          }}>
            {photos.map((photo, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(index)}
                style={{
                  position: "relative",
                  border: index === 0 ? "3px solid #3b82f6" : "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#f8fafc",
                  cursor: "grab",
                  boxShadow: index === 0 ? "0 4px 6px rgba(59, 130, 246, 0.3)" : "0 1px 3px rgba(0,0,0,0.1)"
                }}
              >
                {index === 0 && (
                  <div style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: "bold",
                    zIndex: 1
                  }}>
                    First Image
                  </div>
                )}
                
                <img
                  src={getImageUrl(photo)}
                  alt={`PG photo ${index + 1}`}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    display: "block"
                  }}
                  onError={(e) => {
                    console.error("Image failed to load:", getImageUrl(photo));
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Error";
                  }}
                />
                
                <button
                  onClick={() => deletePhoto(photo)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }}
                  title="Delete photo"
                >
                  ×
                </button>

                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "white",
                  padding: "4px 8px",
                  fontSize: 12,
                  textAlign: "center"
                }}>
                  Drag to reorder
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerPGPhotos;