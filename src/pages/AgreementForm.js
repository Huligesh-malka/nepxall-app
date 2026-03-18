import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaar_last4: "",
    pan_number: "",
    checkin_date: "",
    agreement_months: "",
    rent: "",
    deposit: "",
    maintenance: "0",
  });

  const [signature, setSignature] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict Rule: Aadhaar must be exactly 4 digits, don't allow 5th number
    if (name === "aadhaar_last4") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      if (onlyNums.length > 4) return; 
      setFormData({ ...formData, [name]: onlyNums });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.aadhaar_last4.length !== 4) {
      return alert("Please enter exactly 4 digits for Aadhaar.");
    }
    if (!signature) return alert("Digital Signature is required");

    setLoading(true);
    const data = new FormData();

    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (id && id !== "undefined") data.append("booking_id", id);
    
    const userId = localStorage.getItem("user_id");
    if (userId) data.append("user_id", userId);
    
    data.append("signature", signature);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("✅ Agreement Submitted Successfully!");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Modern Styles
  const containerStyle = {
    maxWidth: "800px",
    margin: "50px auto",
    padding: "40px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    fontFamily: "'Inter', sans-serif",
  };

  const sectionTitle = {
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#6366f1",
    fontWeight: "700",
    marginBottom: "15px",
    marginTop: "25px",
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: "5px"
  };

  const inputStyle = {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    backgroundColor: "#f8fafc"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "0" }}>Rental Agreement</h2>
        <p style={{ color: "#64748b", marginTop: "8px" }}>Please provide accurate details for your digital contract.</p>
      </div>

      <form onSubmit={handleSubmit}>
        
        <div style={sectionTitle}>Personal Details</div>
        <div style={gridStyle}>
          <div style={{gridColumn: "span 2"}}>
             <label style={labelStyle}>Full Name (As per Aadhaar)</label>
             <input name="full_name" placeholder="John Doe" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
             <label style={labelStyle}>Mobile Number</label>
             <input name="mobile" placeholder="+91 0000000000" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
             <label style={labelStyle}>Email Address</label>
             <input name="email" type="email" placeholder="john@example.com" onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={sectionTitle}>Address Information</div>
        <div style={{marginBottom: "20px"}}>
          <label style={labelStyle}>Full Address</label>
          <textarea name="address" placeholder="House No, Street, Area..." onChange={handleChange} required style={{ ...inputStyle, height: "80px", resize: "none" }} />
        </div>
        <div style={gridStyle}>
          <input name="city" placeholder="City" onChange={handleChange} style={inputStyle} />
          <input name="state" placeholder="State" onChange={handleChange} style={inputStyle} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={sectionTitle}>Identity & Verification</div>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Aadhaar (Last 4 Digits Only)</label>
            <input 
              name="aadhaar_last4" 
              type="text" 
              placeholder="Ex: 5542" 
              value={formData.aadhaar_last4}
              onChange={handleChange} 
              required 
              style={{...inputStyle, borderColor: formData.aadhaar_last4.length === 4 ? "#10b981" : "#e2e8f0"}} 
            />
          </div>
          <div>
            <label style={labelStyle}>PAN Number</label>
            <input name="pan_number" placeholder="ABCDE1234F" onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={sectionTitle}>Contract Details</div>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Check-in Date</label>
            <input name="checkin_date" type="date" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Agreement Period (Months)</label>
            <input name="agreement_months" type="number" placeholder="11" onChange={handleChange} required style={inputStyle} />
          </div>
        </div>

        <div style={{...gridStyle, marginTop: "20px"}}>
          <input name="rent" type="number" placeholder="Monthly Rent" onChange={handleChange} required style={inputStyle} />
          <input name="deposit" type="number" placeholder="Security Deposit" onChange={handleChange} required style={inputStyle} />
          <input name="maintenance" type="number" placeholder="Monthly Maintenance" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ marginTop: "30px", padding: "20px", border: "2px dashed #e2e8f0", borderRadius: "12px", textAlign: "center", backgroundColor: "#fdfdfd" }}>
          <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", color: "#475569" }}>🖋️ Upload Digital Signature</label>
          <input 
             type="file" 
             name="signature" 
             accept="image/*" 
             onChange={(e) => setSignature(e.target.files[0])} 
             required 
             style={{ fontSize: "14px" }}
          />
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>Upload a clear image of your signature on white paper.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: "100%",
            marginTop: "30px",
            padding: "16px", 
            background: loading ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", 
            color: "white", 
            border: "none", 
            borderRadius: "10px", 
            fontSize: "16px",
            fontWeight: "700", 
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          {loading ? "Processing..." : "Submit Agreement"}
        </button>
      </form>
    </div>
  );
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  marginBottom: "6px",
  marginLeft: "2px"
};

export default AgreementForm;