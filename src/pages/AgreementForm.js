import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import imageCompression from "browser-image-compression";

const CLOUDINARY_URL =
  "https://api.cloudinary.com/v1_1/dgr4iqtng/image/upload";

const CLOUDINARY_UPLOAD_PRESET = "nepxall_unsigned";

const AgreementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    pan_number: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null,
    pan_card: null,
    signature: null
  });

  /* ================= TEXT INPUT ================= */

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= FILE INPUT ================= */

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0]
    });
  };

  /* ================= CLOUDINARY UPLOAD ================= */

  const uploadToCloudinary = async (file, label) => {
    if (!file) return null;

    try {

      setProgress(`Compressing ${label}...`);

      /* Compress image */

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      });

      setProgress(`Uploading ${label}...`);

      const data = new FormData();
      data.append("file", compressedFile);
      data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: data
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
        throw new Error(result.error.message);
      }

      return result.secure_url;

    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error;
    }
  };

  /* ================= FORM SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {

      setProgress("Uploading documents...");

      /* Upload all images in parallel */

      const [aadhaar_url, pan_url, sign_url] = await Promise.all([
        uploadToCloudinary(files.aadhaar_front, "Aadhaar"),
        uploadToCloudinary(files.pan_card, "PAN Card"),
        uploadToCloudinary(files.signature, "Signature")
      ]);

      setProgress("Saving agreement data...");

      /* Send URLs to backend */

      await api.post("/agreements-form/submit", {
        booking_id: id,
        ...formData,
        aadhaar_front: aadhaar_url,
        pan_card: pan_url,
        signature: sign_url
      });

      alert("✅ Agreement submitted successfully");

      navigate("/");

    } catch (error) {
      console.error("Submission Error:", error);
      alert("❌ Upload failed. Please try again.");
    }

    setLoading(false);
    setProgress("");
  };

  /* ================= UI ================= */

  return (
    <div style={{
      maxWidth: "600px",
      margin: "auto",
      padding: "30px",
      background: "#fff",
      borderRadius: "10px"
    }}>

      <h2>Submit Agreement (Booking #{id})</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>

        <input
          name="full_name"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />

        <input
          name="mobile"
          placeholder="Mobile"
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          name="pan_number"
          placeholder="PAN Number"
          onChange={handleChange}
        />

        <label>Aadhaar Front</label>
        <input
          type="file"
          name="aadhaar_front"
          accept="image/*"
          onChange={handleFileChange}
        />

        <label>PAN Card</label>
        <input
          type="file"
          name="pan_card"
          accept="image/*"
          onChange={handleFileChange}
        />

        <label>Signature</label>
        <input
          type="file"
          name="signature"
          accept="image/*"
          onChange={handleFileChange}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Uploading..." : "Submit Agreement"}
        </button>

        {progress && (
          <p style={{ color: "#555", fontSize: "14px" }}>
            {progress}
          </p>
        )}

      </form>
    </div>
  );
};

export default AgreementForm;