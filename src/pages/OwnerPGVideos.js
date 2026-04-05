import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../api/api";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

export default function OwnerPGVideos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= LOAD VIDEOS ================= */
  const loadVideos = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const res = await api.get(`/pg/${id}`);

      if (res.data?.success) {
        let rawVideos = res.data.data.videos;

        let parsed = [];

        if (Array.isArray(rawVideos)) parsed = rawVideos;
        else if (typeof rawVideos === "string") {
          try {
            parsed = JSON.parse(rawVideos);
          } catch {
            parsed = [];
          }
        }

        console.log("📹 Loaded videos:", parsed);
        setVideos(parsed);
      }
    } catch (err) {
      console.error("Load videos error:", err);
      setError("Failed to load videos");
      setVideos([]);
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
      loadVideos();
    }
  }, [user, role, loading, id, navigate, loadVideos]);

  /* ================= FILE SELECT ================= */
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);

    const valid = selected.filter((file) => {
      const isVideo = file.type.startsWith("video/");
      const isSizeOk = file.size <= 50 * 1024 * 1024;

      if (!isVideo) alert(`${file.name} not a video`);
      if (!isSizeOk) alert(`${file.name} exceeds 50MB`);

      return isVideo && isSizeOk;
    });

    setFiles(valid);
  };

  /* ================= UPLOAD ================= */
  const uploadVideos = async () => {
    if (!files.length) return alert("Select at least one video");

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      files.forEach((file) => formData.append("videos", file));

      const response = await api.post(`/pg/${id}/videos`, formData);
      
      console.log("✅ Upload response:", response.data);

      setFiles([]);
      
      // Update videos based on response
      if (response.data.videos && Array.isArray(response.data.videos)) {
        // If backend returns only new videos, append them
        if (response.data.videos.length === files.length) {
          console.log("⚠️ Backend returned only new videos, appending manually");
          setVideos([...videos, ...response.data.videos]);
        } else {
          // Backend returned full list
          setVideos(response.data.videos);
        }
      } else {
        // Fallback to reload
        await loadVideos();
      }

      alert("Videos uploaded ✅");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Upload failed ❌");
      alert(err.response?.data?.message || "Upload failed ❌");
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteVideo = async (videoPath) => {
    if (!window.confirm("Delete this video?")) return;

    try {
      await api.delete(`/pg/${id}/video`, {
        data: { video: videoPath },
      });

      // Update local state
      setVideos((prev) => prev.filter((v) => v !== videoPath));
      alert("Video deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Delete failed");
      alert("Delete failed ❌");
      await loadVideos(); // Reload on error
    }
  };

  /* ================= GET VIDEO URL ================= */
  const getVideoUrl = (path) => {
    if (!path) return "";
    
    // If it's already a full URL (Cloudinary URL)
    if (path.startsWith("http")) return path;
    
    // Handle relative paths
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${normalizedPath}`;
  };

  /* ================= PROTECTION ================= */
  if (loading || pageLoading) {
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
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>📹 Manage PG Videos</h2>

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

      {/* UPLOAD */}
      <div style={{ marginBottom: 20 }}>
        <input 
          type="file" 
          multiple 
          accept="video/*" 
          onChange={handleFileChange}
          style={{
            padding: 10,
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            width: "100%",
            maxWidth: 400
          }}
        />

        <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
          • Max size: <b>50MB</b> <br />
          • MP4, WebM, MOV
        </p>

        {files.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#4b5563", marginBottom: 8 }}>
              Selected: {files.length} file(s)
            </p>
            <ul style={{ fontSize: 14, color: "#6b7280" }}>
              {Array.from(files).map((file, i) => (
                <li key={i}>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={uploadVideos}
          disabled={uploading || !files.length}
          style={{
            marginTop: 10,
            padding: "10px 18px",
            background: files.length ? "#3b82f6" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            cursor: files.length ? "pointer" : "not-allowed",
            opacity: files.length ? 1 : 0.5
          }}
        >
          {uploading ? "Uploading..." : "⬆ Upload Videos"}
        </button>
      </div>

      {/* LIST */}
      <h3>🎥 Uploaded Videos {videos.length > 0 && `(${videos.length})`}</h3>

      {videos.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          backgroundColor: "#f8fafc",
          borderRadius: 12,
          border: "2px dashed #cbd5e1"
        }}>
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            No videos uploaded yet
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 15,
            marginTop: 15,
          }}
        >
          {videos.map((video, index) => {
            const videoUrl = getVideoUrl(video);
            console.log(`🎬 Video ${index + 1} URL:`, videoUrl);
            
            return (
              <div
                key={index}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 8,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
              >
                <video
                  src={videoUrl}
                  controls
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 8,
                    objectFit: "cover",
                    backgroundColor: "#f1f5f9"
                  }}
                  onError={(e) => {
                    console.error("❌ Video failed to load:", videoUrl);
                    e.target.onerror = null;
                  }}
                >
                  Your browser does not support the video tag.
                </video>

                <button
                  onClick={() => deleteVideo(video)}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    padding: "8px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  🗑️ Delete Video
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}