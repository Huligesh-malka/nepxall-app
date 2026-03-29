import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas"; // For drawing
import api from "../api/api";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const sigPad = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAgreement, setExistingAgreement] = useState(null);
  const [tenantMobile, setTenantMobile] = useState("");

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

  // 1. Check status on load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
          // Pre-fill mobile if available
          if (res.data.data.mobile) setTenantMobile(res.data.data.mobile);
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

  // Submission for Initial Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");
    if (!userId) return alert("Session expired. Please login again.");
    if (!signature) return alert("Digital Signature is required");

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
        window.location.reload();
      }
    } catch (err) {
      alert("Error saving agreement.");
    } finally {
      setLoading(false);
    }
  };

  // Submission for Final Tenant Signature (Drawing)
  const handleFinalSign = async () => {
    if (sigPad.current.isEmpty()) return alert("Please draw your signature");
    if (!tenantMobile) return alert("Please enter your mobile number");

    setLoading(true);
    const signatureData = sigPad.current.getTrimmedCanvas().toDataURL("image/png");

    try {
      const res = await api.post("/agreements-form/tenant-final-sign", {
        booking_id: bookingId,
        tenant_signature: signatureData,
        mobile: tenantMobile,
      });

      if (res.data.success) {
        alert("✅ Agreement Signed Successfully!");
        navigate("/my-bookings");
      }
    } catch (err) {
      alert("Final signing failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading details...</div>;

  /* ================= CASE 1: OWNER HAS SIGNED (FINAL TENANT SIGNING) ================= */
  if (existingAgreement?.signed_pdf && existingAgreement.agreement_status !== "completed") {
    return (
      <div style={{ maxWidth: "800px", margin: "30px auto", padding: "30px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", color: "#1e293b" }}>Review & Final Sign</h2>
        <p style={{ textAlign: "center", color: "#64748b" }}>Owner has signed the document. Please add your signature to complete.</p>

        <div style={{ margin: "20px 0", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
          <img src={existingAgreement.signed_pdf} alt="Agreement Preview" style={{ width: "100%" }} />
        </div>

        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <label style={{ display: "block", fontWeight: "700", marginBottom: "10px" }}>Confirm Mobile Number</label>
          <input 
            type="text" 
            value={tenantMobile} 
            onChange={(e) => setTenantMobile(e.target.value)} 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "20px" }}
          />

          <label style={{ display: "block", fontWeight: "700", marginBottom: "10px" }}>Draw Signature Below (Left Side)</label>
          <div style={{ border: "2px dashed #cbd5e1", background: "#fff", borderRadius: "8px" }}>
            <SignatureCanvas 
              ref={sigPad}
              penColor="black"
              canvasProps={{ width: 700, height: 200, className: "sigCanvas" }} 
            />
          </div>
          <button onClick={() => sigPad.current.clear()} style={{ marginTop: "10px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Clear Signature</button>
        </div>

        <button 
          onClick={handleFinalSign} 
          disabled={loading}
          style={{ width: "100%", marginTop: "30px", padding: "18px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}
        >
          {loading ? "Processing..." : "Complete & Sign Agreement"}
        </button>
      </div>
    );
  }

  /* ================= CASE 2: WAITING FOR OWNER ================= */
  if (existingAgreement && existingAgreement.agreement_status === "pending") {
    return (
      <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center", padding: "40px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: "60px" }}>⏳</div>
        <h2>Waiting for Owner</h2>
        <p>The property owner is currently reviewing your document. Once they sign it, you will be notified here to provide your final signature.</p>
        <button onClick={() => navigate("/my-bookings")} style={{ marginTop: "20px", padding: "12px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px" }}>Back to Dashboard</button>
      </div>
    );
  }

  /* ================= CASE 3: INITIAL FORM SUBMISSION ================= */
  const containerStyle = { maxWidth: "800px", margin: "30px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" };
  const sectionTitle = { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.2px", color: "#4f46e5", fontWeight: "800", marginBottom: "15px", marginTop: "25px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" };
  const inputStyle = { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", width: "100%", backgroundColor: "#f8fafc" };
  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", fontWeight: "800" }}>Rental Agreement Form</h2>
      <form onSubmit={handleSubmit}>
        <div style={sectionTitle}>Tenant Information</div>
        <div style={gridStyle}>
          <input name="full_name" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />
          <input name="mobile" placeholder="Mobile" onChange={handleChange} required style={inputStyle} />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={inputStyle} />
        </div>
        
        {/* ... Include other address/identity fields same as your original code ... */}

        <div style={{ marginTop: "40px", padding: "30px", border: "2px dashed #cbd5e1", textAlign: "center" }}>
          <label style={{ display: "block", fontWeight: "800" }}>🖋️ Upload Initial Signature</label>
          <input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files[0])} required />
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "30px", padding: "18px", backgroundColor: "#4f46e5", color: "white", borderRadius: "12px", border: "none" }}>
          {loading ? "Submitting..." : "Submit for Owner Review"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;