import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    pan_number: "",
  });

  const [files, setFiles] = useState({
    aadhaar_front: null,
    pan_card: null,
    signature: null,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      return;
    }
    setFiles({ ...files, [e.target.name]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!files.aadhaar_front || !files.pan_card || !files.signature) {
      alert("Please upload all documents.");
      return;
    }

    setLoading(true);
    setProgress("📤 Uploading & Saving...");

    try {
      // Create FormData to send REAL files to the backend
      const data = new FormData();
      data.append("booking_id", id);
      data.append("full_name", formData.full_name);
      data.append("mobile", formData.mobile);
      data.append("email", formData.email);
      data.append("pan_number", formData.pan_number);

      // Append the actual file objects
      data.append("aadhaar_front", files.aadhaar_front);
      data.append("pan_card", files.pan_card);
      data.append("signature", files.signature);

      // Single API call: Backend middleware handles Cloudinary + SQL
      const response = await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLoading(false);
      setProgress("");

      if (response?.data?.success) {
        alert("✅ Agreement submitted successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("❌ ERROR:", error);
      setLoading(false);
      setProgress("");
      alert("❌ Submission failed. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "30px", background: "#fff", borderRadius: "10px" }}>
      <h2>Submit Agreement (Booking #{id})</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        <input name="full_name" placeholder="Full Name" onChange={handleChange} required />
        <input name="mobile" placeholder="Mobile" onChange={handleChange} required />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="pan_number" placeholder="PAN Number" onChange={handleChange} />

        <label>Aadhaar Front</label>
        <input type="file" name="aadhaar_front" accept="image/*" onChange={handleFileChange} />

        <label>PAN Card</label>
        <input type="file" name="pan_card" accept="image/*" onChange={handleFileChange} />

        <label>Signature</label>
        <input type="file" name="signature" accept="image/*" onChange={handleFileChange} />

        <button type="submit" disabled={loading} style={{ padding: "12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold" }}>
          {loading ? "Processing..." : "Submit Agreement"}
        </button>

        {progress && <p style={{ fontSize: "14px", color: "#555" }}>{progress}</p>}
      </form>
    </div>
  );
};

export default AgreementForm;