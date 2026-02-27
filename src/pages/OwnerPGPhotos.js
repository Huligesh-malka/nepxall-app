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
  const [previewUrls, setPreviewUrls] = useState([]);

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
        photosArray = res.data.data.photos || [];
      } else if (res.data?.data) {
        photosArray = res.data.data.photos || [];
      } else if (Array.isArray(res.data)) {
        photosArray = res.data;
      } else if (res.data?.photos) {
        photosArray = res.data.photos;
      }

      console.log("📸 Photos extracted:", photosArray);
      setPhotos(photosArray);

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

  /* ================= FILE HANDLING ================= */

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    // Create preview URLs
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

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
          }
        },
      });

      console.log("✅ Upload response:", response.data);

      // Clear preview URLs to avoid memory leaks
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      setFiles([]);
      setPreviewUrls([]);
      setUploadProgress(0);
      alert("Photos uploaded successfully!");
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

  const deletePhoto = async (photoUrl) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please login again");
        return;
      }

      const token = await user.getIdToken(true);
      
      console.log("🗑️ Deleting photo:", photoUrl);

      await axios.delete(`${API}/pg/${id}/photo`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoUrl }, // Send as photoUrl to match backend expectation
      });

      setPhotos((prev) => prev.filter((p) => p !== photoUrl));
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
      const user = auth.currentUser;
      if (!user) {
        alert("Please login again");
        return;
      }

      const token = await user.getIdToken(true);

      await axios.put(
        `${API}/pg/${id}/photos/order`,
        { photos: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Photo order updated");

    } catch (err) {
      console.error("❌ Reorder error:", err);
      alert("Failed to update photo order");
      loadPhotos(); // Revert on error
    }
  };

  /* ================= IMAGE URL ================= */
  // UPDATED: Simplified for Cloudinary - just return the URL as-is since it's already a full Cloudinary URL
  const getImageUrl = (photoUrl) => {
    if (!photoUrl) {
      return "https://via.placeholder.com/400x300?text=No+Image";
    }

    // Cloudinary URLs are already full HTTPS URLs, so return them directly
    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }

    // Fallback for any non-URL strings (shouldn't happen with Cloudinary)
    console.warn("Unexpected photo format:", photoUrl);
    return "https://via.placeholder.com/400x300?text=Invalid+Image+Format";
  };

  /* ================= CLEANUP ================= */
  useEffect(() => {
    // Cleanup preview URLs when component unmounts
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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
            onChange={handleFileSelect}
            style={{
              padding: 10,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              width: "100%",
              maxWidth: 400
            }}
          />
        </div>

        {/* Preview Section */}
        {previewUrls.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#4b5563", marginBottom: 12 }}>
              Preview ({previewUrls.length} file(s)):
            </p>
            <div style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap"
            }}>
              {previewUrls.map((url, index) => (
                <div key={index} style={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  overflow: "hidden"
                }}>
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    color: "white",
                    fontSize: 10,
                    padding: "2px 4px",
                    textAlign: "center"
                  }}>
                    {Math.round(files[index]?.size / 1024)} KB
                  </div>
                </div>
              ))}
            </div>
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
            opacity: files.length === 0 ? 0.5 : 1,
            transition: "background-color 0.2s"
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
            <div style={{
              width: 40,
              height: 40,
              border: "4px solid #e5e7eb",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }} />
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
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
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
                    console.error("Image failed to load:", photo);
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
                    fontSize: 18,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    transition: "background-color 0.2s",
                    zIndex: 2
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ef4444";
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
                  background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  color: "white",
                  padding: "8px",
                  fontSize: 12,
                  textAlign: "center",
                  pointerEvents: "none"
                }}>
                  Drag to reorder
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OwnerPGPhotos;