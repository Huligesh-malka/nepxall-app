import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas"; // For drawing
import api from "../api/api";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const sigPad = useRef(null); // Ref for drawing pad

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

  const [signatureFile, setSignatureFile] = useState(null);

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

  // ✅ 2. INITIAL SUBMISSION (Form + File Upload)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");

    if (!userId) return alert("Session expired. Please login again.");
    if (!signatureFile) return alert("Digital Signature photo is required");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("✅ Submitted Successfully!");
        window.location.reload();
      }
    } catch (err) {
      alert("Error saving agreement.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. FINAL SIGNING (Drawing on Owner-Signed PDF)
  const handleFinalSign = async () => {
    if (sigPad.current.isEmpty()) return alert("Please draw your signature");

    setLoading(true);
    // Get drawing as Base64
    const signatureData = sigPad.current.getTrimmedCanvas().toDataURL("image/png");

    try {
      const res = await api.post("/agreements-form/tenant-final-sign", {
        booking_id: bookingId,
        tenant_final_signature: signatureData,
        mobile: existingAgreement.mobile,
      });

      if (res.data.success) {
        alert("✅ Agreement Fully Signed!");
        navigate("/my-bookings");
      }
    } catch (err) {
      alert("Final signing failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading details...</div>;
  }

  /* ================= CASE 1: OWNER HAS SIGNED (FINAL STEP) ================= */
  if (existingAgreement?.signed_pdf && existingAgreement.agreement_status === "approved") {
    return (
      <div style={{ maxWidth: "850px", margin: "30px auto", padding: "35px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontFamily: "'Inter', sans-serif" }}>
        <h2 style={{ textAlign: "center", color: "#1e293b", fontWeight: "800" }}>Final Signing</h2>
        <p style={{ textAlign: "center", color: "#64748b" }}>The owner has signed. Please review and draw your signature below.</p>

        <div style={{ margin: "20px 0", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
          <img src={existingAgreement.signed_pdf} alt="Agreement Preview" style={{ width: "100%" }} />
        </div>

        <div style={{ backgroundColor: "#f8fafc", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", color: "#4f46e5" }}>Draw Your Signature Here</label>
          <div style={{ border: "2px dashed #cbd5e1", background: "#fff", borderRadius: "8px" }}>
            <SignatureCanvas 
              ref={sigPad}
              penColor="black"
              canvasProps={{ width: 750, height: 200, className: "sigCanvas" }} 
            />
          </div>
          <button onClick={() => sigPad.current.clear()} style={{ marginTop: "10px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>RESET SIGNATURE</button>
        </div>

        <button 
          onClick={handleFinalSign} 
          disabled={loading}
          style={{ width: "100%", marginTop: "30px", padding: "18px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}
        >
          {loading ? "Completing Agreement..." : "Finalize & Sign Agreement"}
        </button>
      </div>
    );
  }

  /* ================= CASE 2: WAITING FOR OWNER ================= */
  if (existingAgreement && existingAgreement.agreement_status === "pending") {
    return (
      <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center", padding: "40px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>⏳</div>
        <h2 style={{ color: "#1e293b", fontWeight: "800" }}>Waiting for Owner</h2>
        <p style={{ color: "#64748b", lineHeight: "1.6" }}>
          Your details are recorded. <br />
          <strong>Current Status:</strong> <span style={{ color: "#4f46e5", fontWeight: "700" }}>PENDING OWNER REVIEW</span>
        </p>
        <button onClick={() => navigate("/my-bookings")} style={{ marginTop: "30px", padding: "12px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Back to Bookings</button>
      </div>
    );
  }

  /* ================= CASE 3: RENDER INITIAL FORM ================= */
  const containerStyle = { maxWidth: "800px", margin: "30px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", fontFamily: "'Inter', sans-serif" };
  const sectionTitle = { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.2px", color: "#4f46e5", fontWeight: "800", marginBottom: "15px", marginTop: "25px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" };
  const inputStyle = { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", width: "100%", backgroundColor: "#f8fafc" };
  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', fontWeight: '800', color: '#1e293b' }}>Rental Agreement Form</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Fill details and upload signature to start.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={sectionTitle}>Tenant Information</div>
        <div style={gridStyle}>
          <input name="full_name" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />
          <input name="father_name" placeholder="Father's Name" onChange={handleChange} required style={inputStyle} />
          <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required style={inputStyle} />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={sectionTitle}>Address</div>
        <textarea name="address" placeholder="Permanent Address" onChange={handleChange} required style={{ ...inputStyle, height: '80px', marginBottom: '15px' }} />
        <div style={gridStyle}>
          <input name="city" placeholder="City" onChange={handleChange} required style={inputStyle} />
          <input name="state" placeholder="State" onChange={handleChange} required style={inputStyle} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={sectionTitle}>Identity</div>
        <div style={gridStyle}>
          <input name="aadhaar_last4" placeholder="Aadhaar (Last 4)" maxLength="4" onChange={handleChange} required style={inputStyle} />
          <input name="pan_number" placeholder="PAN Card" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={sectionTitle}>Terms</div>
        <div style={gridStyle}>
          <input name="checkin_date" type="date" onChange={handleChange} required style={inputStyle} />
          <input name="rent" type="number" placeholder="Rent Amount" onChange={handleChange} required style={inputStyle} />
          <input name="deposit" type="number" placeholder="Deposit" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ marginTop: "40px", padding: "30px", border: "2px dashed #cbd5e1", borderRadius: "12px", textAlign: "center", backgroundColor: '#f8fafc' }}>
          <label style={{ display: "block", fontWeight: "800", marginBottom: "12px" }}>🖋️ Upload Signature Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} required />
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "30px", padding: "18px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}>
          {loading ? "Submitting..." : "Submit for Owner Review"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;