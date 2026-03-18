import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", father_name: "", mobile: "", email: "",
    address: "", city: "", state: "", pincode: "",
    aadhaar_last4: "", pan_number: "",
    checkin_date: "", agreement_months: "",
    rent: "", deposit: "", maintenance: "0"
  });

  const [signature, setSignature] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Limit Aadhaar to 4 digits
    if (name === "aadhaar_last4" && value.length > 4) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signature) return alert("Signature is required");

    setLoading(true);
    const data = new FormData();
    
    // Append all text fields
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Metadata
    if (id && id !== "undefined") data.append("booking_id", id);
    const userId = localStorage.getItem("user_id");
    if (userId) data.append("user_id", userId);

    // Signature File
    data.append("signature", signature);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("✅ Agreement Saved!");
        navigate("/");
      }
    } catch (err) {
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: "12px", border: "1px solid #ddd", borderRadius: "6px", width: "100%" };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "30px", background: "white", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center" }}>Rental Agreement Form</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <input name="full_name" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />
          <input name="father_name" placeholder="Father's Name" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input name="mobile" placeholder="Mobile" onChange={handleChange} required style={inputStyle} />
          <input name="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
        </div>

        <textarea name="address" placeholder="Current Full Address" onChange={handleChange} required style={{ ...inputStyle, height: "80px" }} />

        <div style={{ display: "flex", gap: "10px" }}>
          <input name="city" placeholder="City" onChange={handleChange} style={inputStyle} />
          <input name="state" placeholder="State" onChange={handleChange} style={inputStyle} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input name="aadhaar_last4" placeholder="Aadhaar (Last 4 Digits)" type="number" onChange={handleChange} required style={inputStyle} />
          <input name="pan_number" placeholder="PAN Number" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ flex: 1 }}>Check-in Date: <input name="checkin_date" type="date" onChange={handleChange} required style={inputStyle} /></label>
          <input name="agreement_months" type="number" placeholder="Months (e.g. 11)" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input name="rent" type="number" placeholder="Rent Amount" onChange={handleChange} required style={inputStyle} />
          <input name="deposit" type="number" placeholder="Deposit Amount" onChange={handleChange} required style={inputStyle} />
          <input name="maintenance" type="number" placeholder="Maintenance" onChange={handleChange} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontWeight: "bold" }}>Digital Signature (Image):</label>
          <input type="file" name="signature" accept="image/*" onChange={(e) => setSignature(e.target.files[0])} required />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "15px", background: "#4f46e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          {loading ? "Saving..." : "Submit Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;