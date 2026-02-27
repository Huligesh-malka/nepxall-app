import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

/* ================= ENV ================= */

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://nepxall-backend.onrender.com";

const API =
  process.env.REACT_APP_API_URL ||
  "https://nepxall-backend.onrender.com/api";

const FILES_URL =
  process.env.REACT_APP_FILES_URL ||
  "https://nepxall-backend.onrender.com";

/* ================= COMPONENT ================= */

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  /* ================= LOAD PHOTOS ================= */

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📡 Fetching PG details for ID:", id);
      const res = await axios.get(`${API}/pg/${id}`);
      
      console.log("✅ API Response:", res.data);

      // Handle different response structures
      let photosArray = [];
      
      if (res.data?.success && res.data.data) {
        // Structure: { success: true, data: { photos: [...] } }
        photosArray = res.data.data.photos || [];
      } else if (res.data?.data) {
        // Structure: { data: { photos: [...] } }
        photosArray = res.data.data.photos || [];
      } else if (Array.isArray(res.data)) {
        // Structure: [...] (direct array)
        photosArray = res.data;
      } else if (res.data?.photos) {
        // Structure: { photos: [...] }
        photosArray = res.data.photos;
      }

      console.log("📸 Photos extracted:", photosArray);
      setPhotos(photosArray);

      if (photosArray.length === 0) {
        console.log("⚠️ No photos found in response");
      }

    } catch (err) {
      console.error("❌ Load error:", err);
      setError(err.response?.data?.message || "Failed to load photos");
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
    if (!files.length) {
      alert("Please select photos to upload");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please login again");
      return;
    }

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB`);
        return;
      }
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");

      const token = await user.getIdToken(true);
      console.log("🔑 Got auth token");

      const formData = new FormData();
      files.forEach((f) => formData.append("photos", f));

      console.log("📤 Uploading photos to PG ID:", id);
      
      const response = await axios.post(`${API}/pg/${id}/upload-photos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            console.log(`📊 Upload progress: ${percent}%`);
          }
        },
      });

      console.log("✅ Upload response:", response.data);

      // Clear file input
      setFiles([]);
      setUploadProgress(0);
      
      // Show success message
      alert("Photos uploaded successfully!");
      
      // Reload photos
      await loadPhotos();

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
      const token = await auth.currentUser.getIdToken(true);
      
      console.log("🗑️ Deleting photo:", photo);

      await axios.delete(`${API}/pg/${id}/photo`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photo },
      });

      console.log("✅ Photo deleted");
      
      // Update local state
      setPhotos((prev) => prev.filter((p) => p !== photo));
      
      alert("Photo deleted successfully!");

    } catch (err) {
      console.error("❌ Delete error:", err);
      alert(err.response?.data?.message || "Delete failed");
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
      const token = await auth.currentUser.getIdToken(true);

      await axios.put(
        `${API}/pg/${id}/photos/order`,
        { photos: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Order updated");

    } catch (err) {
      console.error("❌ Reorder error:", err);
      alert("Failed to update photo order");
      // Revert on error
      loadPhotos();
    }
  };

  /* ================= IMAGE URL ================= */

  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/400x300?text=No+Image";

    // If it's already a full URL (Cloudinary or other)
    if (path.startsWith("http")) return path;

    // If it's a relative path, prepend the files URL
    // Make sure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${FILES_URL}${normalizedPath}`;
  };

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>📷 Manage PG Photos</h2>

      {/* Error Display */}
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

      {/* Upload Section */}
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
            onChange={(e) => {
              setFiles([...e.target.files]);
              console.log("📁 Selected files:", e.target.files.length);
            }}
            style={{
              padding: 10,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              width: "100%",
              maxWidth: 400
            }}
          />
        </div>

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
          {uploading ? `Uploading (${uploadProgress}%)` : "Upload Photos"}
        </button>
      </div>

      {/* Gallery Section */}
      <div>
        <h3 style={{ marginBottom: 16 }}>
          Photo Gallery {photos.length > 0 && `(${photos.length})`}
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
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#f8fafc",
                  cursor: "grab",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s ease",
                  ":hover": {
                    transform: "scale(1.02)"
                  }
                }}
              >
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
                    e.target.src = "https://placehold.co/400x300?text=Image+Error";
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