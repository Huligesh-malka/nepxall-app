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
    // Checks every possible key your app might have used to store the ID
    const userId = localStorage.getItem("user_id") || 
                   localStorage.getItem("userId") || 
                   localStorage.getItem("id");
    
    if (!userId || userId === "null" || userId === "undefined") {
      console.error("DEBUG: LocalStorage state during failure:", localStorage);
      return alert("User session not found (ID is null). Please logout and login again to refresh your session.");
    }

    setLoading(true);
    const data = new FormData();

    // 3. Append All Data
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    // Use 'user_id' for the backend request, but the value from our recovery check
    data.append("user_id", userId);
    
    if (bookingId && bookingId !== "undefined") {
      data.append("booking_id", bookingId);
    }

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
      alert(err.response?.data?.message || "Error saving agreement.");
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
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px",
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', fontWeight: '800', color: '#1e293b' }}>Rental Agreement</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={sectionTitle}>Tenant Information</div>
        <div style={gridStyle}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Full Name</label>
            <input name="full_name" placeholder="Name as per Aadhaar" onChange={handleChange} required style={inputStyle} />
          </div>
          <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required style={inputStyle} />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={sectionTitle}>Current Address</div>
        <textarea
          name="address"
          placeholder="Complete Address..."
          onChange={handleChange}
          required
          style={{ ...inputStyle, height: "70px", resize: "none", marginBottom: '15px' }}
        />
        <div style={gridStyle}>
          <input name="city" placeholder="City" onChange={handleChange} style={inputStyle} />
          <input name="state" placeholder="State" onChange={handleChange} style={inputStyle} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={sectionTitle}>Identity Verification</div>
        <div style={gridStyle}>
          <input
            name="aadhaar_last4"
            placeholder="Aadhaar Last 4 Digits"
            value={formData.aadhaar_last4}
            onChange={handleChange}
            required
            style={{ ...inputStyle, borderColor: formData.aadhaar_last4.length === 4 ? "#10b981" : "#e2e8f0" }}
          />
          <input name="pan_number" placeholder="PAN (Optional)" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={sectionTitle}>Contract Details</div>
        <div style={gridStyle}>
          <input name="checkin_date" type="date" onChange={handleChange} required style={inputStyle} />
          <input name="agreement_months" type="number" placeholder="Months (e.g. 11)" onChange={handleChange} required style={inputStyle} />
          <input name="rent" type="number" placeholder="Monthly Rent" onChange={handleChange} required style={inputStyle} />
          <input name="deposit" type="number" placeholder="Security Deposit" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ marginTop: "30px", padding: "20px", border: "2px dashed #e2e8f0", borderRadius: "12px", textAlign: "center" }}>
          <label style={{ display: "block", fontWeight: "700", marginBottom: "8px" }}>🖋️ Digital Signature</label>
          <input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files[0])} required />
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
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          {loading ? "Submitting..." : "Submit Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;