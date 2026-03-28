import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState(null); // Track if already submitted

  const [formData, setFormData] = useState({
    full_name: "", mobile: "", email: "", address: "", city: "",
    state: "", pincode: "", aadhaar_last4: "", pan_number: "",
    checkin_date: "", agreement_months: "", rent: "", deposit: "", maintenance: "0",
  });

  const [signature, setSignature] = useState(null);

  // ✅ CHECK IF ALREADY SUBMITTED ON LOAD
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
        }
      } catch (err) {
        console.error("Error checking agreement status", err);
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
    if (!signature) return alert("Signature is required");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signature);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("✅ Submitted Successfully!");
        // Refresh to show the "Waiting" screen
        window.location.reload();
      }
    } catch (err) {
      alert("Error saving agreement.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER WAITING SCREEN ================= */
  if (existingAgreement) {
    return (
      <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center", padding: "40px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>⏳</div>
        <h2 style={{ color: "#1e293b", fontWeight: "800" }}>Agreement Submitted</h2>
        <p style={{ color: "#64748b", lineHeight: "1.6" }}>
          Your details and signature have been recorded. <br />
          <strong>Current Status:</strong> <span style={{ color: "#4f46e5", fontWeight: "700" }}>{existingAgreement.agreement_status.toUpperCase()}</span>
        </p>
        <div style={{ marginTop: "25px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
            Waiting for the property owner to review and digitally sign the document. 
            You will be notified once the final agreement is ready for download.
          </p>
        </div>
        <button onClick={() => navigate("/my-bookings")} style={{ marginTop: "30px", padding: "12px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
          Back to Bookings
        </button>
      </div>
    );
  }

  /* ================= RENDER FORM (Original Styles) ================= */
  const containerStyle = { maxWidth: "800px", margin: "30px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", fontFamily: "'Inter', sans-serif" };
  const sectionTitle = { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.2px", color: "#4f46e5", fontWeight: "800", marginBottom: "15px", marginTop: "25px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" };
  const inputStyle = { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", width: "100%", backgroundColor: "#f8fafc" };
  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px" };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', fontWeight: '800', color: '#1e293b' }}>Rental Agreement Form</h2>
      <form onSubmit={handleSubmit}>
        <div style={sectionTitle}>Tenant Information</div>
        <div style={gridStyle}>
          <input name="full_name" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />
          <input name="mobile" placeholder="Mobile" onChange={handleChange} required style={inputStyle} />
        </div>
        {/* ... Include all other input fields from your previous code here ... */}
        
        <div style={{ marginTop: "40px", padding: "30px", border: "2px dashed #cbd5e1", borderRadius: "12px", textAlign: "center" }}>
          <label style={{ display: "block", fontWeight: "800", marginBottom: "12px" }}>🖋️ Upload Digital Signature</label>
          <input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files[0])} required />
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "30px", padding: "18px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}>
          {loading ? "Processing..." : "Submit Legal Agreement"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;