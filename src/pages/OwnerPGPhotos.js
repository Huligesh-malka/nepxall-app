import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api, { pgAPI } from "../api/api";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const OwnerPGPhotos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  
  // Plan state for premium lock
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  /* ================= LOAD PLAN ================= */
  const loadUserPlan = useCallback(async () => {
    try {
      setPlanLoading(true);
      const response = await pgAPI.getPlan();
      console.log("📊 User plan loaded:", response.data);
      setPlan(response.data);
    } catch (err) {
      console.error("Failed to load plan:", err);
      setPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }, []);

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

  /* ================= AUTH + LOAD ================= */
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }

    if (user && role === "owner") {
      loadUserPlan();
      loadPhotos();
    }
  }, [user, role, loading, id, navigate, loadPhotos, loadUserPlan]);

  /* ================= FILE SELECT ================= */
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    
    // Check photo limit against plan
    if (plan && photos.length + selected.length > plan.max_photos_per_pg) {
      alert(`❌ Your ${plan.name} plan allows only ${plan.max_photos_per_pg} photos per PG. Upgrade to upload more!`);
      return;
    }

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

    // Double-check limit before upload
    if (plan && photos.length + files.length > plan.max_photos_per_pg) {
      alert(`❌ Cannot upload. Your ${plan.name} plan allows only ${plan.max_photos_per_pg} photos. You have ${photos.length}/${plan.max_photos_per_pg}. Upgrade to upload more!`);
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
      
      // 🔥 FIXED: Always trust backend response
      if (response.data.photos && Array.isArray(response.data.photos)) {
        // ALWAYS use the backend response - no manual appending!
        const updatedPhotos = response.data.photos;
        console.log("📸 Updated photos from backend:", updatedPhotos);
        console.log("✅ Backend returned", updatedPhotos.length, "total photos");
        
        setPhotos(updatedPhotos);
        alert(response.data.message || "Photos uploaded successfully!");
      } else {
        // Fallback: reload from PG details if response format is unexpected
        console.log("⚠️ Unexpected response format, reloading from PG details");
        await loadPhotos();
        alert(response.data.message || "Photos uploaded successfully!");
      }

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

  // Check if limit is reached
  const isLimitReached = plan && photos.length >= plan.max_photos_per_pg;

  /* ================= PROTECTION ================= */
  if (loading || pageLoading || planLoading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  /* ================= UI ================= */
  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>📷 Manage PG Photos</h2>

      {/* Plan Info Card */}
      {plan && (
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          color: "white"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>💎 Current Plan: {plan.name}</h3>
              <p style={{ margin: "4px 0", fontSize: 14 }}>
                📸 Photos: {photos.length} / {plan.max_photos_per_pg} used
              </p>
              <p style={{ margin: "4px 0", fontSize: 12, opacity: 0.9 }}>
                📅 Expires: {new Date(plan.expiry_date).toLocaleDateString("en-IN")}
              </p>
            </div>
            <button 
              onClick={() => navigate("/owner/premium")}
              style={{
                backgroundColor: "white",
                color: "#667eea",
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              🚀 Upgrade Plan
            </button>
          </div>
          
          {/* Progress bar */}
          <div style={{
            marginTop: 12,
            height: 6,
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: 3,
            overflow: "hidden"
          }}>
            <div style={{
              width: `${(photos.length / plan.max_photos_per_pg) * 100}%`,
              height: "100%",
              backgroundColor: photos.length >= plan.max_photos_per_pg ? "#ef4444" : "#4ade80",
              borderRadius: 3
            }} />
          </div>
        </div>
      )}

      {/* Limit reached warning */}
      {isLimitReached && (
        <div style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          textAlign: "center"
        }}>
          <p style={{ color: "#856404", marginBottom: 12, fontSize: 16 }}>
            🚫 Your {plan?.name} plan limit of {plan?.max_photos_per_pg} photos has been reached.
          </p>
          <button 
            onClick={() => navigate("/owner/premium")}
            style={{
              backgroundColor: "#ffc107",
              color: "#333",
              border: "none",
              padding: "10px 24px",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 14
            }}
          >
            🚀 Upgrade Plan for More Photos
          </button>
        </div>
      )}

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
            disabled={uploading || isLimitReached}
            onChange={handleFileChange}
            style={{
              padding: 10,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              width: "100%",
              maxWidth: 400,
              cursor: isLimitReached ? "not-allowed" : "pointer"
            }}
          />
        </div>

        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          • Max size: <b>5MB</b> per image<br />
          • Supported formats: JPG, PNG, GIF, WEBP<br />
          • Maximum photos: <b>{plan?.max_photos_per_pg || 10}</b> per PG
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
          disabled={uploading || files.length === 0 || isLimitReached}
          style={{
            backgroundColor: (files.length === 0 || isLimitReached) ? "#9ca3af" : "#3b82f6",
            color: "white",
            padding: "10px 24px",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 500,
            cursor: (files.length === 0 || isLimitReached) ? "not-allowed" : "pointer",
            opacity: (files.length === 0 || isLimitReached) ? 0.5 : 1
          }}
        >
          {isLimitReached ? "⚠️ Limit Reached - Upgrade" : (uploading ? `Uploading (${uploadProgress}%)` : "⬆ Upload Photos")}
        </button>
      </div>

      <div>
        <h3 style={{ marginBottom: 16 }}>
          🖼️ Photo Gallery {photos.length > 0 && `(${photos.length}/${plan?.max_photos_per_pg || 10})`}
        </h3>

        {photos.length === 0 ? (
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
                draggable={!isLimitReached}
                onDragStart={() => !isLimitReached && setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => !isLimitReached && onDrop(index)}
                style={{
                  position: "relative",
                  border: index === 0 ? "3px solid #3b82f6" : "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#f8fafc",
                  cursor: isLimitReached ? "default" : "grab",
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

                {!isLimitReached && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerPGPhotos;