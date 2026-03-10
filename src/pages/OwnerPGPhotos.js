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
  const [replaceFirst, setReplaceFirst] = useState(false);

  /* ================= LOAD PHOTOS ================= */

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📡 Fetching PG photos for ID:", id);
      
      // Use the dedicated photos endpoint
      const res = await axios.get(`${API}/pg/${id}/photos`);
      
      console.log("✅ API Response:", res.data);

      // Handle response structure
      let photosArray = [];
      
      if (res.data?.success && res.data.photos) {
        photosArray = res.data.photos;
      } else if (Array.isArray(res.data)) {
        photosArray = res.data;
      } else if (res.data?.photos) {
        photosArray = res.data.photos;
      }

      console.log("📸 Photos extracted:", photosArray);
      setPhotos(photosArray);

    } catch (err) {
      console.error("❌ Load error:", err);
      
      // Fallback to PG details endpoint
      try {
        console.log("📡 Falling back to PG details endpoint");
        const res = await axios.get(`${API}/pg/${id}`);
        
        let photosArray = [];
        if (res.data?.success && res.data.data) {
          photosArray = res.data.data.photos || [];
        } else if (res.data?.data) {
          photosArray = res.data.data.photos || [];
        } else if (res.data?.photos) {
          photosArray = res.data.photos;
        }
        
        setPhotos(photosArray);
      } catch (fallbackErr) {
        console.error("❌ Fallback also failed:", fallbackErr);
        setError(err.response?.data?.message || "Failed to load photos");
        setPhotos([]);
      }
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
      
      // Append all photos
      files.forEach((f) => formData.append("photos", f));
      
      // IMPORTANT: Send replaceFirst as a string 'true' or 'false'
      // This is crucial for the backend to parse it correctly
      formData.append("replaceFirst", replaceFirst ? "true" : "false");

      console.log("📤 Uploading photos to PG ID:", id);
      console.log("🔄 Replace first image:", replaceFirst ? "true" : "false");
      console.log("📦 Number of files:", files.length);
      
      const response = await axios.post(`${API}/pg/${id}/upload-photos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
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
      setReplaceFirst(false);
      alert(response.data.message || "Photos uploaded successfully!");
      
      // Reload photos to show updated list
      await loadPhotos();

    } catch (err) {
      console.error("❌ Upload error:", err);
      
      // Detailed error logging
      if (err.response) {
        console.error("Error response:", err.response.data);
        console.error("Error status:", err.response.status);
      }
      
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

      console.log("✅ Photos reordered successfully");

    } catch (err) {
      console.error("❌ Reorder error:", err);
      alert("Failed to update photo order");
      loadPhotos(); // Revert on error
    }
  };

  /* ================= IMAGE URL ================= */

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300?text=No+Image";

    // If it's already a full URL (Cloudinary URL)
    if (path.startsWith("http")) return path;

    // Handle paths that contain /uploads/
    if (path.includes('/uploads/')) {
      const uploadsIndex = path.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        const relativePath = path.substring(uploadsIndex);
        return `${BACKEND_URL}${relativePath}`;
      }
    }

    // Handle relative paths
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${normalizedPath}`;
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
            onChange={(e) => setFiles([...e.target.files])}
            style={{
              padding: 10,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              width: "100%",
              maxWidth: 400
            }}
          />
        </div>

        {/* Checkbox for replace first image option */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
          <input
            type="checkbox"
            id="replaceFirst"
            checked={replaceFirst}
            onChange={(e) => setReplaceFirst(e.target.checked)}
            disabled={uploading || photos.length === 0}
            style={{ marginRight: 8, width: 16, height: 16 }}
          />
          <label htmlFor="replaceFirst" style={{ color: "#4b5563" }}>
            Replace the first image only (other uploaded images will be appended)
          </label>
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
        
        {replaceFirst && photos.length > 0 && (
          <p style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
            ⚠️ The first image will be replaced. All other uploaded images will be added to the end.
          </p>
        )}
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
                  border: index === 0 ? "3px solid #3b82f6" : "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#f8fafc",
                  cursor: "grab",
                  boxShadow: index === 0 ? "0 4px 6px rgba(59, 130, 246, 0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s ease"
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