import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams(); // Gets '80' from the URL /agreement-form/80
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "", father_name: "", dob: "", mobile: "", email: "",
    occupation: "", company_name: "", address: "", city: "",
    state: "", pincode: "", aadhaar_number: "", aadhaar_last4: "",
    checkin_date: "", agreement_months: "", rent: "", deposit: "", maintenance: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    signature: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setSuccessMsg("");

    try {
      const data = new FormData();
      
      // 1. Add IDs (CRITICAL)
      data.append("booking_id", id);
      // If you have user info in localStorage, add it here:
      // data.append("user_id", JSON.parse(localStorage.getItem("user")).id);

      // 2. Add text fields
      Object.keys(formData).forEach(key => data.append(key, formData[key]));

      // 3. Add files
      if (files.aadhaar_front) data.append("aadhaar_front", files.aadhaar_front);
      if (files.aadhaar_back) data.append("aadhaar_back", files.aadhaar_back);
      if (files.signature) data.append("signature", files.signature);

      // 4. API CALL
      const res = await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000 // 2 minutes
      });

      setSuccessMsg("Form submitted successfully!");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Submission Error:", error);
      // This helps diagnose if it's CORS or something else
      const errorMsg = error.response?.data?.message || "Network Error: Check file sizes or connection.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      {successMsg ? (
        <div style={{ color: "green", fontWeight: "bold" }}>{successMsg}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2>Agreement Form for Booking #{id}</h2>
          {/* ... all your inputs here ... */}
          <button type="submit" disabled={loading} style={{ background: loading ? "#ccc" : "#4f46e5", color: "#fff", padding: "10px 20px", cursor: "pointer" }}>
            {loading ? "Uploading (Please wait...)" : "Submit Agreement"}
          </button>
        </form>
      )}
    </div>
  );
};

export default AgreementForm;