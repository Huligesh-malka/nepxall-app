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

  /* ================= INPUT HANDLERS ================= */

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    /* Validate file size (max 5MB) */

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB");
      return;
    }

    setFiles(prev => ({
      ...prev,
      [e.target.name]: file
    }));
  };

  /* ================= CLOUDINARY UPLOAD ================= */

  const uploadToCloudinary = async (file, label) => {

    if (!file) return null;

    try {

      setProgress(`Compressing ${label}...`);

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
        throw new Error(result.error?.message || "Cloudinary upload failed");
      }

      return result.secure_url;

    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (loading) return;

    if (!files.aadhaar_front || !files.pan_card || !files.signature) {
      alert("Please upload all required documents.");
      return;
    }

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

    } finally {

      setLoading(false);
      setProgress("");

    }

  };

  /* ================= UI ================= */

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "auto",
        padding: "30px",
        background: "#fff",
        borderRadius: "10px"
      }}
    >

      <h2>Submit Agreement (Booking #{id})</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "15px" }}
      >

        <input
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          required
        />

        <input
          name="mobile"
          placeholder="Mobile"
          value={formData.mobile}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          name="pan_number"
          placeholder="PAN Number"
          value={formData.pan_number}
          onChange={handleChange}
        />

        <label>Aadhaar Front</label>
        <input
          type="file"
          name="aadhaar_front"
          accept="image/*"
          onChange={handleFileChange}
          required
        />

        <label>PAN Card</label>
        <input
          type="file"
          name="pan_card"
          accept="image/*"
          onChange={handleFileChange}
          required
        />

        <label>Signature</label>
        <input
          type="file"
          name="signature"
          accept="image/*"
          onChange={handleFileChange}
          required
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
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {loading ? "Uploading..." : "Submit Agreement"}
        </button>

        {progress && (
          <p style={{ fontSize: "14px", color: "#555" }}>
            {progress}
          </p>
        )}

      </form>
    </div>
  );
};

export default AgreementForm;