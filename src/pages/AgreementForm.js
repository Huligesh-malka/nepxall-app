import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams(); // Get booking_id from URL
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      return;
    }
    setFiles({ ...files, [e.target.name]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!files.aadhaar_front || !files.pan_card || !files.signature) {
      alert("Please upload Aadhaar Front, PAN Card, and Signature.");
      return;
    }

    setLoading(true);
    setProgress("📤 Uploading & Saving...");

    try {
      const data = new FormData();
      
      // text fields
      data.append("full_name", formData.full_name);
      data.append("mobile", formData.mobile);
      data.append("email", formData.email);
      data.append("pan_number", formData.pan_number);
      
      // ✅ Safety check: Only append booking_id if it's a real value
      if (id && id !== "undefined") {
        data.append("booking_id", id);
      }

      // Grab user_id from localStorage if you use it
      const userId = localStorage.getItem("user_id");
      if (userId) data.append("user_id", userId);

      // Files
      data.append("aadhaar_front", files.aadhaar_front);
      data.append("pan_card", files.pan_card);
      data.append("signature", files.signature);

      const response = await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response?.data?.success) {
        alert("✅ Agreement submitted successfully!");
        navigate("/");
      }
    } catch (error) {
      console.error("❌ Submission error:", error);
      alert(error.response?.data?.message || "Server Error. Please try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", color: "#333" }}>Agreement Submission</h2>
      <p style={{ textAlign: "center", color: "#666" }}>Booking ID: {id || "N/A"}</p>
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        <input name="full_name" placeholder="Full Name (as per Aadhaar)" onChange={handleChange} required style={inputStyle} />
        <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required style={inputStyle} />
        <input name="email" placeholder="Email Address" onChange={handleChange} style={inputStyle} />
        <input name="pan_number" placeholder="PAN Number" onChange={handleChange} style={inputStyle} />

        <div style={fileBoxStyle}>
          <label>Aadhaar Front</label>
          <input type="file" name="aadhaar_front" accept="image/*" onChange={handleFileChange} required />
        </div>

        <div style={fileBoxStyle}>
          <label>PAN Card</label>
          <input type="file" name="pan_card" accept="image/*" onChange={handleFileChange} required />
        </div>

        <div style={fileBoxStyle}>
          <label>Digital Signature</label>
          <input type="file" name="signature" accept="image/*" onChange={handleFileChange} required />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: "12px", 
            background: "#4f46e5", 
            color: "white", 
            border: "none", 
            borderRadius: "6px", 
            fontWeight: "bold", 
            cursor: loading ? "not-allowed" : "pointer" 
          }}
        >
          {loading ? "Processing..." : "Submit Agreement"}
        </button>
        {progress && <p style={{ textAlign: "center", color: "#6366f1" }}>{progress}</p>}
      </form>
    </div>
  );
};

const inputStyle = { padding: "12px", border: "1px solid #ddd", borderRadius: "6px" };
const fileBoxStyle = { display: "flex", flexDirection: "column", gap: "5px", fontSize: "14px", fontWeight: "bold" };

export default AgreementForm;