import React, { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "", mobile: "", email: "", pan_number: "", dob: "", city: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null, aadhaar_back: null, pan_card: null, signature: null
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const data = new FormData();
      // FIX: Ensure ID is a number and not the string "undefined"
      data.append("booking_id", Number(id) || "");
      
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key]);
      });

      await api.post("/agreements-form/submit", data);
      setSuccessMsg("Submitted successfully!");
      window.scrollTo(0, 0);
    } catch (error) {
      const msg = error.response?.data?.message || "Check your internet or file sizes.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "auto" }}>
      <h2>Submit Agreement (Booking #{id})</h2>
      {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        <input placeholder="Full Name" name="full_name" onChange={handleChange} required />
        <input placeholder="Mobile" name="mobile" onChange={handleChange} required />
        <input placeholder="PAN Number" name="pan_number" onChange={handleChange} />
        
        <label>Aadhaar Front (Image/PDF)</label>
        <input type="file" name="aadhaar_front" accept="image/*,application/pdf" onChange={handleFileChange} />
        
        <label>PAN Card (Image/PDF)</label>
        <input type="file" name="pan_card" accept="image/*,application/pdf" onChange={handleFileChange} />
        
        <label>Signature</label>
        <input type="file" name="signature" accept="image/*,application/pdf" onChange={handleFileChange} />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Submit Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;