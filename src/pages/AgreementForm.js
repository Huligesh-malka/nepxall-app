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
    if (e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
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
      
      // Append text fields
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

      setSuccessMsg("Success! Your agreement has been submitted.");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Agreement Error:", error);
      // Enhanced error reporting
      const msg = error.response?.data?.message || "Upload failed. Please check file types and sizes.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", fontSize: "14px" };
  const fileBox = { border: "1px dashed #bbb", padding: "15px", borderRadius: "10px", textAlign: "center", background: "#fcfcfc" };
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };

  return (
    <div style={{ background: "#f6f8fb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "850px", margin: "auto", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Rental Agreement Form (Booking #{id})</h2>

        {successMsg && (
          <div style={{ background: "#d1fae5", color: "#065f46", padding: "15px", borderRadius: "8px", marginBottom: "25px", textAlign: "center", fontWeight: "bold" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3>Personal Information</h3>
          <div style={grid}>
            <input style={inputStyle} name="full_name" placeholder="Full Name" onChange={handleChange} required />
            <input style={inputStyle} name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
            <input style={inputStyle} name="email" placeholder="Email Address" onChange={handleChange} />
            <input style={inputStyle} name="pan_number" placeholder="PAN Card Number" onChange={handleChange} />
          </div>

          <h3 style={{ marginTop: "30px" }}>KYC Documents (Images or PDF)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={fileBox}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>Aadhaar Front</label>
              <input type="file" name="aadhaar_front" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
            
            <div style={fileBox}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>PAN Card</label>
              <input type="file" name="pan_card" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>

            <div style={fileBox}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>Aadhaar Back</label>
              <input type="file" name="aadhaar_back" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>

            <div style={fileBox}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>Signature Image</label>
              <input type="file" name="signature" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: "100%", marginTop: "35px", padding: "16px", borderRadius: "10px",
              background: loading ? "#999" : "#4f46e5", color: "#fff", fontWeight: "bold", 
              border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: "16px"
            }}
          >
            {loading ? "Uploading to Cloudinary..." : "Submit Agreement"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgreementForm;