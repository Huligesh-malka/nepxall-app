import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const [formData, setFormData] = useState({
    full_name: "", father_name: "", dob: "", mobile: "", email: "",
    occupation: "", company_name: "", address: "", city: "", state: "", pincode: "",
    aadhaar_number: "", pan_number: "", checkin_date: "",
    agreement_months: "", rent: "", deposit: "", maintenance: ""
  });

  const [files, setFiles] = useState({
    aadhaar_front: null, aadhaar_back: null, pan_card: null, signature: null
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) return alert("File under 5MB only");
    setFiles({ ...files, [e.target.name]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgress("📤 Submitting Agreement...");

    try {
      const data = new FormData();
      // Append all text fields
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      
      // Append ID and Files
      if (id && id !== "undefined") data.append("booking_id", id);
      const userId = localStorage.getItem("user_id");
      if (userId) data.append("user_id", userId);

      data.append("aadhaar_front", files.aadhaar_front);
      data.append("aadhaar_back", files.aadhaar_back);
      data.append("pan_card", files.pan_card);
      data.append("signature", files.signature);

      const response = await api.post("/agreements-form/submit", data);
      if (response.data.success) {
        alert("✅ Submitted Successfully!");
        navigate("/");
      }
    } catch (err) {
      alert("Submission failed");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const inputStyle = { padding: "10px", border: "1px solid #ccc", borderRadius: "5px" };

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px", background: "#f9f9f9" }}>
      <h2>Complete Agreement Form</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
        <input name="full_name" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />
        <input name="father_name" placeholder="Father's Name" onChange={handleChange} style={inputStyle} />
        <input name="dob" type="date" placeholder="DOB" onChange={handleChange} style={inputStyle} />
        <input name="mobile" placeholder="Mobile" onChange={handleChange} required style={inputStyle} />
        <input name="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
        <input name="occupation" placeholder="Occupation" onChange={handleChange} style={inputStyle} />
        <input name="company_name" placeholder="Company/College" onChange={handleChange} style={inputStyle} />
        <input name="address" placeholder="Full Address" onChange={handleChange} style={{...inputStyle, gridColumn: "span 2"}} />
        <input name="city" placeholder="City" onChange={handleChange} style={inputStyle} />
        <input name="state" placeholder="State" onChange={handleChange} style={inputStyle} />
        <input name="pincode" placeholder="Pincode" onChange={handleChange} style={inputStyle} />
        <input name="aadhaar_number" placeholder="Aadhaar Number" onChange={handleChange} style={inputStyle} />
        <input name="pan_number" placeholder="PAN Number" onChange={handleChange} style={inputStyle} />
        <input name="checkin_date" type="date" onChange={handleChange} style={inputStyle} />
        
        <div style={{gridColumn: "span 2", display: "flex", gap: "10px"}}>
          <input name="rent" type="number" placeholder="Rent" onChange={handleChange} style={inputStyle} />
          <input name="deposit" type="number" placeholder="Deposit" onChange={handleChange} style={inputStyle} />
          <input name="agreement_months" type="number" placeholder="Months" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{gridColumn: "span 2"}}>
          <label>Aadhaar Front</label><input type="file" name="aadhaar_front" onChange={handleFileChange} required />
          <label>Aadhaar Back</label><input type="file" name="aadhaar_back" onChange={handleFileChange} required />
          <label>PAN Card</label><input type="file" name="pan_card" onChange={handleFileChange} required />
          <label>Signature</label><input type="file" name="signature" onChange={handleFileChange} required />
        </div>

        <button disabled={loading} style={{ gridColumn: "span 2", padding: "15px", background: "blue", color: "white" }}>
          {loading ? "Processing..." : "Submit Full Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;