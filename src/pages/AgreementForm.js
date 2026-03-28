import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAgreement, setExistingAgreement] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaar_last4: "",
    pan_number: "",
    checkin_date: "",
    agreement_months: "11",
    rent: "",
    deposit: "",
    maintenance: "0",
  });

  const [signature, setSignature] = useState(null);

  // ✅ 1. CHECK IF ALREADY SUBMITTED ON LOAD
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
        }
      } catch (err) {
        console.error("Error checking agreement status", err);
      } finally {
        setFetching(false);
      }
    };
    if (bookingId) checkStatus();
  }, [bookingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");

    if (!userId) return alert("Session expired. Please login again.");
    if (!signature) return alert("Digital Signature is required");

    setLoading(true);
    const data = new FormData();
    
    // Append all text fields
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    
    // Append hidden system fields
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    
    // Append File
    data.append("signature", signature);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("✅ Submitted Successfully!");
        window.location.reload(); // Refresh to show the Waiting screen
      }
    } catch (err) {
      console.error("Submission error", err);
      alert("Error saving agreement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading details...</div>;
  }

  /* ================= RENDER WAITING SCREEN (SUBMITTED STATE) ================= */
  if (existingAgreement) {
    return (
      <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center", padding: "40px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>⏳</div>
        <h2 style={{ color: "#1e293b", fontWeight: "800" }}>Agreement Submitted</h2>
        <p style={{ color: "#64748b", lineHeight: "1.6" }}>
          Your details and signature have been recorded successfully. <br />
          <strong>Current Status:</strong> <span style={{ color: "#4f46e5", fontWeight: "700" }}>{existingAgreement.agreement_status.toUpperCase()}</span>
        </p>
        
        <div style={{ marginTop: "25px", padding: "20px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "14px", color: "#475569", margin: 0, fontWeight: "500" }}>
            {existingAgreement.agreement_status === 'pending' 
              ? "The property owner is currently reviewing your document. Once they sign it, you will find the final agreement in 'My Bookings'."
              : "Your agreement has been processed. Please check your dashboard."}
          </p>
        </div>

        <button 
          onClick={() => navigate("/my-bookings")} 
          style={{ marginTop: "30px", padding: "12px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  /* ================= RENDER FORM (INPUT STATE) ================= */
  const containerStyle = { maxWidth: "800px", margin: "30px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", fontFamily: "'Inter', sans-serif" };
  const sectionTitle = { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.2px", color: "#4f46e5", fontWeight: "800", marginBottom: "15px", marginTop: "25px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" };
  const inputStyle = { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", width: "100%", backgroundColor: "#f8fafc" };
  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', fontWeight: '800', color: '#1e293b', marginBottom: '5px' }}>Rental Agreement Form</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Please fill all details as per your legal documents.</p>
      
      <form onSubmit={handleSubmit}>
        {/* SECTION 1: PERSONAL */}
        <div style={sectionTitle}>Tenant Information</div>
        <div style={gridStyle}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Full Name</label>
            <input name="full_name" placeholder="As per Aadhaar" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Father's Name</label>
            <input name="father_name" placeholder="Father's Full Name" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Mobile Number</label>
            <input name="mobile" placeholder="10-digit mobile" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Email Address</label>
            <input name="email" type="email" placeholder="example@mail.com" onChange={handleChange} required style={inputStyle} />
          </div>
        </div>

        {/* SECTION 2: ADDRESS */}
        <div style={sectionTitle}>Permanent Address</div>
        <textarea name="address" placeholder="Full Permanent Address" onChange={handleChange} required style={{ ...inputStyle, height: '80px', resize: 'none', marginBottom: '15px' }} />
        <div style={gridStyle}>
          <input name="city" placeholder="City" onChange={handleChange} required style={inputStyle} />
          <input name="state" placeholder="State" onChange={handleChange} required style={inputStyle} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} required style={inputStyle} />
        </div>

        {/* SECTION 3: LEGAL ID */}
        <div style={sectionTitle}>Identity Verification</div>
        <div style={gridStyle}>
          <input name="aadhaar_last4" placeholder="Last 4 Digits of Aadhaar" maxLength="4" onChange={handleChange} required style={inputStyle} />
          <input name="pan_number" placeholder="PAN Card Number" onChange={handleChange} required style={inputStyle} />
        </div>

        {/* SECTION 4: RENTAL TERMS */}
        <div style={sectionTitle}>Agreement & Rental Terms</div>
        <div style={gridStyle}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Check-in Date</label>
            <input name="checkin_date" type="date" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Agreement Period (Months)</label>
            <input name="agreement_months" type="number" defaultValue="11" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Monthly Rent (₹)</label>
            <input name="rent" type="number" placeholder="0.00" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Security Deposit (₹)</label>
            <input name="deposit" type="number" placeholder="0.00" onChange={handleChange} required style={inputStyle} />
          </div>
        </div>

        {/* SECTION 5: SIGNATURE */}
        <div style={{ marginTop: "40px", padding: "30px", border: "2px dashed #cbd5e1", borderRadius: "12px", textAlign: "center", backgroundColor: '#f8fafc' }}>
          <label style={{ display: "block", fontWeight: "800", marginBottom: "12px", color: '#1e293b' }}>🖋️ Upload Digital Signature</label>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>Please upload a clear photo of your signature on white paper.</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setSignature(e.target.files[0])} 
            required 
            style={{ fontSize: '14px' }}
          />
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
            cursor: loading ? "not-allowed" : "pointer",
            transition: 'transform 0.2s'
          }}
        >
          {loading ? "Processing Submission..." : "Confirm & Submit Legal Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;