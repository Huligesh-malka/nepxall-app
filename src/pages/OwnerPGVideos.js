import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import api from "../api/api";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

export default function OwnerPGVideos() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  /* ================= INIT ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadVideos();
      } else {
        navigate("/login");
      }
    });

    return unsubscribe;
  }, [id]);

  /* ================= LOAD VIDEOS ================= */
  const loadVideos = useCallback(async () => {
    try {
      setPageLoading(true);

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

        setVideos(parsed);
      }
    } catch (err) {
      console.error("Load videos error:", err);
      setVideos([]);
    } finally {
      setPageLoading(false);
    }
  }, [id]);

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
      setLoading(true);

      const formData = new FormData();
      files.forEach((file) => formData.append("videos", file));

      await api.post(`/pg/${id}/videos`, formData);

      setFiles([]);
      loadVideos();

      alert("Videos uploaded ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteVideo = async (videoPath) => {
    if (!window.confirm("Delete this video?")) return;

    try {
      await api.delete(`/pg/${id}/video`, {
        data: { video: videoPath },
      });

      loadVideos();
    } catch (err) {
      alert("Delete failed ❌");
    }
  };

  /* ================= UI ================= */
  if (pageLoading) return <h3 style={{ textAlign: "center" }}>Loading...</h3>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>📹 Manage PG Videos</h2>

      {/* UPLOAD */}
      <div style={{ marginBottom: 20 }}>
        <input type="file" multiple accept="video/*" onChange={handleFileChange} />

        <p style={{ fontSize: 13, color: "#666" }}>
          • Max size: <b>50MB</b> <br />
          • MP4, WebM, MOV
        </p>

        <button
          onClick={uploadVideos}
          disabled={loading || !files.length}
          style={{
            marginTop: 10,
            padding: "10px 18px",
            background: files.length ? "#fd7e14" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: files.length ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Uploading..." : "⬆ Upload Videos"}
        </button>
      </div>

      {/* LIST */}
      <h3>🎥 Uploaded Videos</h3>

      {videos.length === 0 ? (
        <p>No videos uploaded yet</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 15,
            marginTop: 15,
          }}
        >
          {videos.map((video, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 8,
                background: "#fff",
              }}
            >
              <video
                src={`${BACKEND_URL}${video}`}
                controls
                style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 6,
                  objectFit: "cover",
                }}
              />

              <button
                onClick={() => deleteVideo(video)}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "6px",
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                ❌ Delete Video
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
