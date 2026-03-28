import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { bookingId } = useParams();
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

    // 1. Validation
    if (formData.aadhaar_last4.length !== 4) {
      return alert("Please enter exactly 4 digits for Aadhaar.");
    }
    if (!signature) {
      return alert("Digital Signature image is required");
    }

    // 2. UNIVERSAL ID RECOVERY
    const rawUserId = localStorage.getItem("user_id") || 
                      localStorage.getItem("userId") || 
                      localStorage.getItem("id");
    
    // Safety check for common storage glitches
    const userId = (rawUserId === "null" || rawUserId === "undefined" || !rawUserId) ? null : rawUserId;

    if (!userId) {
      return alert("User session not found. Please logout and login again.");
    }

    setLoading(true);
    const data = new FormData();

    // 3. Append Text Data
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    data.append("user_id", userId);
    
    if (bookingId && bookingId !== "undefined") {
      data.append("booking_id", bookingId);
    }

    // 4. Append Signature (This must match backend req.files['signature'])
    data.append("signature", signature);

    try {
      const res = await api.post("/agreements-form/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("✅ Agreement Submitted Successfully!");
        navigate("/my-bookings"); 
      }
    } catch (err) {
      console.error("Submission Error:", err.response?.data || err.message);
      // Backend error "Unknown column" will show here if DB isn't updated
      alert(err.response?.data?.message || "Error saving agreement. Please check if Database columns match.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STYLES ================= */
  const containerStyle = {
    maxWidth: "800px",
    margin: "30px auto",
    padding: "35px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    fontFamily: "'Inter', sans-serif",
  };

  const sectionTitle = {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    color: "#4f46e5",
    fontWeight: "800",
    marginBottom: "15px",
    marginTop: "25px",
    borderBottom: "2px solid #f1f5f9",
    paddingBottom: "8px",
  };

  const inputStyle = {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "15px",
    width: "100%",
    backgroundColor: "#f8fafc",
    outline: "none"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px",
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>Rental Agreement Form</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Please fill all details as per your legal documents.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={sectionTitle}>Tenant Information</div>
        <div style={gridStyle}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>FULL NAME</label>
            <input name="full_name" placeholder="Name as per Aadhaar" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>MOBILE</label>
            <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>EMAIL</label>
            <input name="email" type="email" placeholder="Email Address" onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={sectionTitle}>Current Address</div>
        <textarea
          name="address"
          placeholder="Complete Permanent Address..."
          onChange={handleChange}
          required
          style={{ ...inputStyle, height: "80px", resize: "none", marginBottom: '15px' }}
        />
        <div style={gridStyle}>
          <input name="city" placeholder="City" onChange={handleChange} style={inputStyle} />
          <input name="state" placeholder="State" onChange={handleChange} style={inputStyle} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={sectionTitle}>Identity Verification</div>
        <div style={gridStyle}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>AADHAAR (LAST 4 DIGITS)</label>
            <input
              name="aadhaar_last4"
              placeholder="0000"
              value={formData.aadhaar_last4}
              onChange={handleChange}
              required
              style={{ ...inputStyle, borderColor: formData.aadhaar_last4.length === 4 ? "#10b981" : "#e2e8f0" }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>PAN NUMBER (OPTIONAL)</label>
            <input name="pan_number" placeholder="ABCDE1234F" onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={sectionTitle}>Contract Details</div>
        <div style={gridStyle}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>CHECK-IN DATE</label>
            <input name="checkin_date" type="date" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>TENURE (MONTHS)</label>
            <input name="agreement_months" type="number" placeholder="11" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>MONTHLY RENT</label>
            <input name="rent" type="number" placeholder="₹" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>SECURITY DEPOSIT</label>
            <input name="deposit" type="number" placeholder="₹" onChange={handleChange} required style={inputStyle} />
          </div>
        </div>

        <div style={{ 
            marginTop: "40px", 
            padding: "30px", 
            border: "2px dashed #cbd5e1", 
            borderRadius: "12px", 
            textAlign: "center",
            backgroundColor: signature ? "#f0fdf4" : "#ffffff"
        }}>
          <label style={{ display: "block", fontWeight: "800", marginBottom: "12px", color: "#1e293b" }}>
            {signature ? "✅ Signature Attached" : "🖋️ Upload Digital Signature"}
          </label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setSignature(e.target.files[0])} 
            required 
            style={{ fontSize: '14px' }}
          />
          {signature && <p style={{ fontSize: '12px', color: '#15803d', marginTop: '10px' }}>Selected: {signature.name}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "30px",
            padding: "18px",
            background: loading ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "800",
            fontSize: "16px",
            letterSpacing: "0.5px",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)"
          }}
        >
          {loading ? "Processing..." : "Submit Legal Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;