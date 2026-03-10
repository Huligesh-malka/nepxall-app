import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { auth } from "../firebase";

const API =
  process.env.REACT_APP_API_URL ||
  "https://nepxall-backend.onrender.com/api";

const MAX_PHOTOS = 15;

const OwnerPGPhotos = () => {
  const { id } = useParams();

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replaceFirst, setReplaceFirst] = useState(false);

  /* ================= LOAD PHOTOS ================= */

  const loadPhotos = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/pg/${id}/photos`);

      let list = [];

      if (res.data?.photos) list = res.data.photos;
      if (Array.isArray(res.data)) list = res.data;

      setPhotos(list);
    } catch (err) {
      console.error("Load photos error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadPhotos();
  }, [id]);

  /* ================= UPLOAD ================= */

  const uploadPhotos = async () => {
    if (!files.length) return alert("Select photos");

    if (!replaceFirst && photos.length + files.length > MAX_PHOTOS) {
      return alert(`Maximum ${MAX_PHOTOS} photos allowed`);
    }

    const user = auth.currentUser;
    if (!user) return alert("Login again");

    try {
      setUploading(true);
      setUploadProgress(0);

      const token = await user.getIdToken(true);

      const formData = new FormData();

      files.forEach((f) => formData.append("photos", f));

      formData.append("replaceFirst", replaceFirst ? "true" : "false");

      const res = await axios.post(
        `${API}/pg/${id}/upload-photos`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (p) => {
            const percent = Math.round((p.loaded * 100) / p.total);
            setUploadProgress(percent);
          },
        }
      );

      setFiles([]);
      setReplaceFirst(false);
      setUploadProgress(0);

      alert(res.data.message || "Photos uploaded");

      loadPhotos();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE ================= */

  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete photo?")) return;

    try {
      const token = await auth.currentUser.getIdToken(true);

      await axios.delete(`${API}/pg/${id}/photo`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photo },
      });

      setPhotos((prev) => prev.filter((p) => p !== photo));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
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
    } catch (err) {
      alert("Reorder failed");
      loadPhotos();
    }
  };

  /* ================= IMAGE URL ================= */

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x300";

    if (path.startsWith("http")) return path;

    return `${API.replace("/api", "")}${path}`;
  };

  /* ================= UI ================= */

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
      <h2>📷 Manage PG Photos</h2>

      {/* Upload Section */}

      <div style={{ marginTop: 20 }}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles([...e.target.files])}
        />

        <div style={{ marginTop: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={replaceFirst}
              onChange={(e) => setReplaceFirst(e.target.checked)}
            />
            Replace first image
          </label>
        </div>

        {uploading && (
          <p>Uploading {uploadProgress}%</p>
        )}

        <button
          onClick={uploadPhotos}
          disabled={uploading || files.length === 0}
        >
          Upload Photos
        </button>
      </div>

      {/* Gallery */}

      <div style={{ marginTop: 40 }}>
        {loading ? (
          <p>Loading...</p>
        ) : photos.length === 0 ? (
          <p>No photos uploaded</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
              gap: 20,
            }}
          >
            {photos.map((photo, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(index)}
                style={{
                  border: index === 0 ? "3px solid blue" : "1px solid #ccc",
                  borderRadius: 10,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {index === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "blue",
                      color: "#fff",
                      padding: "4px 8px",
                      fontSize: 12,
                    }}
                  >
                    Cover
                  </div>
                )}

                <img
                  src={getImageUrl(photo)}
                  alt=""
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                  }}
                />

                <button
                  onClick={() => deletePhoto(photo)}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerPGPhotos;