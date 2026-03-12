import React, { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "", father_name: "", dob: "", mobile: "", email: "",
    occupation: "", company_name: "", address: "", city: "", state: "",
    pincode: "", aadhaar_number: "", aadhaar_last4: "", pan_number: "",
    checkin_date: "", agreement_months: "", rent: "", deposit: "", maintenance: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    pan_card: null,
    signature: null
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFiles({ ...files, [e.target.name]: selectedFile });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSuccessMsg("");

    try {
      const data = new FormData();
      data.append("booking_id", id);
      
      // Append text data
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      
      // Append files
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key]);
      });

      await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccessMsg("Success! Your agreement documents have been uploaded.");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Upload Error:", error);
      const errorMsg = error.response?.data?.message || "Upload failed. Ensure files are under 10MB.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%" };
  const fileBox = { border: "1px dashed #bbb", padding: "15px", borderRadius: "8px", background: "#f9f9f9", textAlign: 'center' };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto", fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Rental Agreement Documents (Booking #{id})</h2>
      
      {successMsg && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "15px", borderRadius: "8px", marginBottom: "20px", textAlign: 'center' }}>
          {successMsg}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <input style={inputStyle} name="full_name" placeholder="Full Name" onChange={handleChange} required />
          <input style={inputStyle} name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
        </div>

        <input style={inputStyle} name="pan_number" placeholder="PAN Card Number" onChange={handleChange} />
        
        <h3 style={{ margin: "10px 0 0 0" }}>Upload Documents (JPG, PNG, or PDF)</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div style={fileBox}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Aadhaar Front</label>
            <input type="file" name="aadhaar_front" accept="image/*,application/pdf" onChange={handleFileChange} />
          </div>
          
          <div style={fileBox}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Aadhaar Back</label>
            <input type="file" name="aadhaar_back" accept="image/*,application/pdf" onChange={handleFileChange} />
          </div>

          <div style={fileBox}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>PAN Card</label>
            <input type="file" name="pan_card" accept="image/*,application/pdf" onChange={handleFileChange} />
          </div>

          <div style={fileBox}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Signature</label>
            <input type="file" name="signature" accept="image/*,application/pdf" onChange={handleFileChange} />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            background: loading ? "#94a3b8" : "#4f46e5", 
            color: "#fff", 
            padding: "16px", 
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer" 
          }}
        >
          {loading ? "Uploading to Cloudinary..." : "Submit Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;