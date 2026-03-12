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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [e.target.name]: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setSuccessMsg("");

    try {
      const data = new FormData();
      
      // 1. Essential IDs
      data.append("booking_id", id);
      
      // 2. Append Text Fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) data.append(key, formData[key]);
      });

      // 3. Append Files
      Object.keys(files).forEach((key) => {
        if (files[key]) data.append(key, files[key]);
      });

      // 4. API Request
      await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 minutes for Cloudinary uploads
      });

      setSuccessMsg("Agreement submitted successfully!");
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error("Agreement Error:", error);
      const msg = error.response?.data?.message || "Network Error. Please try again later.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", fontSize: "14px" };
  const fileBox = { border: "1px dashed #bbb", padding: "15px", borderRadius: "10px", textAlign: "center", background: "#fafafa" };
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };

  return (
    <div style={{ background: "#f6f8fb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "auto", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 5px 25px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center" }}>Rental Agreement Form (Booking #{id})</h2>

        {successMsg && (
          <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3>Personal Details</h3>
          <div style={grid}>
            <input style={inputStyle} name="full_name" placeholder="Full Name" onChange={handleChange} required />
            <input style={inputStyle} name="mobile" placeholder="Mobile" onChange={handleChange} required />
            <input style={inputStyle} name="email" placeholder="Email" onChange={handleChange} />
            <input style={inputStyle} type="date" name="dob" onChange={handleChange} />
            <input style={inputStyle} name="pan_number" placeholder="PAN Number" onChange={handleChange} />
            <input style={inputStyle} name="city" placeholder="City" onChange={handleChange} />
          </div>

          <h3 style={{ marginTop: "30px" }}>Document Verification (Images or PDF)</h3>
          <div style={grid}>
            <div style={fileBox}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Aadhaar Front</label>
              <input type="file" name="aadhaar_front" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
            <div style={fileBox}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Aadhaar Back</label>
              <input type="file" name="aadhaar_back" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
            <div style={fileBox}>
              <label style={{ display: 'block', marginBottom: '10px' }}>PAN Card</label>
              <input type="file" name="pan_card" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
            <div style={fileBox}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Signature</label>
              <input type="file" name="signature" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ 
            width: "100%", marginTop: "30px", padding: "16px", borderRadius: "10px",
            background: loading ? "#999" : "#4f46e5", color: "#fff", fontWeight: "bold", border: "none",
            cursor: loading ? "not-allowed" : "pointer"
          }}>
            {loading ? "Uploading Documents..." : "Submit Agreement"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgreementForm;