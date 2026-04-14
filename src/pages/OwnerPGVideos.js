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
  
  // 🔥 NEW: Plan state for premium lock
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  /* ================= LOAD PLAN ================= */
  const loadUserPlan = useCallback(async () => {
    try {
      setPlanLoading(true);
     const response = await pgAPI.get("/plan");
      console.log("📊 User plan loaded:", response.data);
      setPlan(response.data);
    } catch (err) {
      console.error("Failed to load plan:", err);
      setPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }, []);

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
      loadUserPlan();
      loadVideos();
    }
  }, [user, role, loading, id, navigate, loadVideos, loadUserPlan]);

  /* ================= FILE SELECT ================= */
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    
    // 🔥 NEW: Check video limit against plan
    if (plan && videos.length + selected.length > plan.max_videos_per_pg) {
      alert(`❌ Your ${plan.name} plan allows only ${plan.max_videos_per_pg} videos per PG. Upgrade to upload more!`);
      return;
    }

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
    
    // 🔥 NEW: Double-check limit before upload
    if (plan && videos.length + files.length > plan.max_videos_per_pg) {
      alert(`❌ Cannot upload. Your ${plan.name} plan allows only ${plan.max_videos_per_pg} videos. You have ${videos.length}/${plan.max_videos_per_pg}. Upgrade to upload more!`);
      return;
    }

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
        if (response.data.videos.length === files.length) {
          console.log("⚠️ Backend returned only new videos, appending manually");
          setVideos([...videos, ...response.data.videos]);
        } else {
          setVideos(response.data.videos);
        }
      } else {
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

      setVideos((prev) => prev.filter((v) => v !== videoPath));
      alert("Video deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Delete failed");
      alert("Delete failed ❌");
      await loadVideos();
    }
  };

  /* ================= GET VIDEO URL ================= */
  const getVideoUrl = (path) => {
    if (!path) return "";
    
    if (path.startsWith("http")) return path;
    
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${normalizedPath}`;
  };

  // Check if limit is reached
  const isLimitReached = plan && videos.length >= plan.max_videos_per_pg;

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
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>📹 Manage PG Videos</h2>

      {/* 🔥 NEW: Plan Info Card */}
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
                🎬 Videos: {videos.length} / {plan.max_videos_per_pg} used
              </p>
              <p style={{ margin: "4px 0", fontSize: 12, opacity: 0.9 }}>
                📅 Expires: {new Date(plan.expiry_date).toLocaleDateString()}
              </p>
            </div>
            <button 
              onClick={() => navigate("/plans")}
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
              width: `${(videos.length / plan.max_videos_per_pg) * 100}%`,
              height: "100%",
              backgroundColor: videos.length >= plan.max_videos_per_pg ? "#ef4444" : "#4ade80",
              borderRadius: 3
            }} />
          </div>
        </div>
      )}

      {/* 🔥 NEW: Limit reached warning */}
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
            🚫 Your {plan?.name} plan limit of {plan?.max_videos_per_pg} videos has been reached.
          </p>
          <button 
            onClick={() => navigate("/plans")}
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
            🚀 Upgrade Plan for More Videos
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

      {/* UPLOAD */}
      <div style={{ marginBottom: 20 }}>
        <input 
          type="file" 
          multiple 
          accept="video/*" 
          onChange={handleFileChange}
          disabled={isLimitReached}
          style={{
            padding: 10,
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            width: "100%",
            maxWidth: 400,
            cursor: isLimitReached ? "not-allowed" : "pointer"
          }}
        />

        <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
          • Max size: <b>50MB</b> per video<br />
          • MP4, WebM, MOV<br />
          • Maximum videos: <b>{plan?.max_videos_per_pg || 5}</b> per PG
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
          disabled={uploading || !files.length || isLimitReached}
          style={{
            marginTop: 10,
            padding: "10px 18px",
            background: (files.length && !isLimitReached) ? "#3b82f6" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            cursor: (files.length && !isLimitReached) ? "pointer" : "not-allowed",
            opacity: (files.length && !isLimitReached) ? 1 : 0.5
          }}
        >
          {isLimitReached ? "⚠️ Limit Reached - Upgrade" : (uploading ? "Uploading..." : "⬆ Upload Videos")}
        </button>
      </div>

      {/* LIST */}
      <h3>🎥 Uploaded Videos {videos.length > 0 && `(${videos.length}/${plan?.max_videos_per_pg || 5})`}</h3>

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