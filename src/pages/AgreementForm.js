import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams(); // This is the booking_id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    pan_number: "",
    user_id: localStorage.getItem("user_id") || "" // Grab user_id if stored
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
    setProgress("📤 Uploading documents and saving agreement...");

    try {
      const data = new FormData();
      // Append text fields
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      data.append("booking_id", id);

      // Append files
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
      const errorMsg = error.response?.data?.message || "Server Error. The database might be down.";
      alert(errorMsg);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "#fff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
      <h2 style={{ marginBottom: "20px", color: "#1e293b" }}>Agreement Form (Booking #{id})</h2>
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Full Name</label>
          <input name="full_name" placeholder="As per Aadhaar" onChange={handleChange} required style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Mobile Number</label>
          <input name="mobile" placeholder="10-digit mobile" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Email</label>
            <input name="email" type="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>PAN Number</label>
            <input name="pan_number" placeholder="PAN Number" onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Aadhaar Front</label>
          <input type="file" name="aadhaar_front" accept="image/*" onChange={handleFileChange} required />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>PAN Card</label>
          <input type="file" name="pan_card" accept="image/*" onChange={handleFileChange} required />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Signature</label>
          <input type="file" name="signature" accept="image/*" onChange={handleFileChange} required />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: "14px", 
            background: loading ? "#94a3b8" : "#4f46e5", 
            color: "#fff", 
            border: "none", 
            borderRadius: "8px", 
            fontWeight: "bold", 
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {loading ? "Processing..." : "Submit Agreement"}
        </button>

        {progress && (
          <p style={{ fontSize: "14px", color: "#6366f1", textAlign: "center", fontWeight: "500" }}>
            {progress}
          </p>
        )}
      </form>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box"
};

export default AgreementForm;