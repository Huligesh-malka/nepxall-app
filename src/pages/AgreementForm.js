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
    pan_card: null, // Added to match backend
    signature: null
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const data = new FormData();
      data.append("booking_id", id);
      
      // Append text data
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      
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
      const errorMsg = error.response?.data?.message || "Submission failed.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%" };
  const fileBox = { border: "1px dashed #bbb", padding: "10px", borderRadius: "8px", background: "#f9f9f9" };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h2>Submit Agreement (Booking #{id})</h2>
      {successMsg && <div style={{ color: "green", padding: "10px", border: "1px solid green" }}>{successMsg}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        <input style={inputStyle} name="full_name" placeholder="Full Name" onChange={handleChange} required />
        <input style={inputStyle} name="mobile" placeholder="Mobile" onChange={handleChange} required />
        <input style={inputStyle} name="pan_number" placeholder="PAN Card Number" onChange={handleChange} />
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div style={fileBox}>
            <label>Aadhaar Front</label>
            <input type="file" name="aadhaar_front" onChange={handleFileChange} />
          </div>
          <div style={fileBox}>
            <label>PAN Card</label>
            <input type="file" name="pan_card" onChange={handleFileChange} />
          </div>
          <div style={fileBox}>
            <label>Signature Image</label>
            <input type="file" name="signature" onChange={handleFileChange} />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ background: loading ? "#ccc" : "#4f46e5", color: "#fff", padding: "15px", cursor: "pointer" }}
        >
          {loading ? "Uploading..." : "Submit Form"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;