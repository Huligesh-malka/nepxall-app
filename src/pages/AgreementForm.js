import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

/* ================= CLOUDINARY CONFIG ================= */

const CLOUDINARY_URL =
  "https://api.cloudinary.com/v1_1/dgr4iqtng/auto/upload"; // change cloud name if needed

const CLOUDINARY_UPLOAD_PRESET = "nepxall_unsigned"; // your unsigned preset

const AgreementForm = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

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

  /* ================= INPUT HANDLER ================= */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /* ================= FILE HANDLER ================= */

  const handleFileChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    // optional size limit
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      return;
    }

    setFiles({
      ...files,
      [e.target.name]: file
    });

  };

  /* ================= CLOUDINARY UPLOAD ================= */

  const uploadToCloudinary = async (file) => {

    if (!file) return null;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: data
    });

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const result = await res.json();

    return result.secure_url;
  };

  /* ================= SUBMIT FORM ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!files.aadhaar_front || !files.pan_card || !files.signature) {
      alert("Please upload all required documents");
      return;
    }

    setLoading(true);

    try {

      /* Upload files to Cloudinary in parallel */

      const [aadhaar_url, pan_url, sign_url] = await Promise.all([
        uploadToCloudinary(files.aadhaar_front),
        uploadToCloudinary(files.pan_card),
        uploadToCloudinary(files.signature)
      ]);

      /* Send URLs to backend */

      await api.post("/agreements-form/submit", {

        booking_id: id,
        ...formData,

        aadhaar_front: aadhaar_url,
        pan_card: pan_url,
        signature: sign_url

      });

      alert("Agreement submitted successfully");

      navigate("/");

    } catch (err) {

      console.error("Upload Error:", err);
      alert("Upload failed. Please try again.");

    }

    setLoading(false);

  };

  /* ================= UI ================= */

  return (

    <div style={{ maxWidth: "500px", margin: "auto", padding: "20px" }}>

      <h2>Submit Agreement (Booking #{id})</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>

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
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />

        <label>PAN Card</label>
        <input
          type="file"
          name="pan_card"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />

        <label>Signature</label>
        <input
          type="file"
          name="signature"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />

        <button type="submit" disabled={loading}>

          {loading ? "Uploading Documents..." : "Submit Agreement"}

        </button>

      </form>

    </div>

  );

};

export default AgreementForm;