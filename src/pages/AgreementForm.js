import React, { useState } from "react";
import { useParams } from "react-router-dom"; // Add this
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams(); // Grabs '80' from the URL path
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    dob: "",
    mobile: "",
    email: "",
    occupation: "",
    company_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaar_number: "",
    aadhaar_last4: "",
    checkin_date: "",
    agreement_months: "",
    rent: "",
    deposit: "",
    maintenance: ""
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

      // Append IDs
      data.append("booking_id", id);
      // data.append("user_id", ...); // Add if you have user context

      // Append text fields
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));

      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) data.append(key, files[key]);
      });

      const res = await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 minutes for slow uploads
      });

      setSuccessMsg("Agreement submitted successfully!");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Agreement Error:", error);
      const msg = error.response?.data?.message || "Upload failed. Try smaller files.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", fontSize: "14px" };
  const fileBox = { border: "1px dashed #bbb", padding: "15px", borderRadius: "10px", textAlign: "center", background: "#fafafa" };
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };

  return (
    <div style={{ background: "#f6f8fb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "auto", background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 5px 25px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center" }}>Rental Agreement Form (Booking #{id})</h2>

        {successMsg && (
          <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3>Personal Details</h3>
          <div style={grid}>
            <input style={inputStyle} name="full_name" placeholder="Full Name" onChange={handleChange} required />
            <input style={inputStyle} name="father_name" placeholder="Father Name" onChange={handleChange} />
            <input style={inputStyle} type="date" name="dob" onChange={handleChange} />
            <input style={inputStyle} name="mobile" placeholder="Mobile" onChange={handleChange} required />
            <input style={inputStyle} name="email" placeholder="Email" onChange={handleChange} />
            <input style={inputStyle} name="city" placeholder="City" onChange={handleChange} />
            <input style={inputStyle} name="state" placeholder="State" onChange={handleChange} />
            <input style={inputStyle} name="pincode" placeholder="Pincode" onChange={handleChange} />
          </div>

          <h3 style={{ marginTop: "30px" }}>Aadhaar Verification</h3>
          <div style={grid}>
            <input style={inputStyle} name="aadhaar_number" placeholder="Aadhaar Number" onChange={handleChange} />
            <div style={fileBox}>
              <label>Aadhaar Front</label><input type="file" name="aadhaar_front" onChange={handleFileChange} />
            </div>
            <div style={fileBox}>
              <label>Aadhaar Back</label><input type="file" name="aadhaar_back" onChange={handleFileChange} />
            </div>
          </div>

          <h3 style={{ marginTop: "30px" }}>Signature</h3>
          <div style={fileBox}>
            <input type="file" name="signature" onChange={handleFileChange} />
          </div>

          <button type="submit" disabled={loading} style={{ 
            width: "100%", marginTop: "30px", padding: "14px", borderRadius: "10px",
            background: loading ? "#999" : "#4f46e5", color: "#fff", fontWeight: "bold", border: "none"
          }}>
            {loading ? "Processing Uploads..." : "Submit Agreement"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgreementForm;