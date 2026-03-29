import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas"; 
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

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
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

  // INITIAL SUBMISSION (Tenant fills details for the first time)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");
    if (!userId) return alert("Session expired. Please login again.");
    if (!signature) return alert("Initial Signature photo is required");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signature);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("✅ Details Submitted Successfully!");
        window.location.reload();
      }
    } catch (err) {
      alert("Error saving agreement.");
    } finally {
      setLoading(false);
    }
  };

  // FINAL SIGNING (Tenant draws signature on owner-signed document)
  const handleFinalTenantSign = async () => {
    if (sigPad.current.isEmpty()) return alert("Please draw your signature");
    
    setLoading(true);
    // Convert drawing to Base64 image
    const signatureData = sigPad.current.getTrimmedCanvas().toDataURL("image/png");

    try {
      const res = await api.post("/agreements-form/tenant-final-sign", {
        booking_id: bookingId,
        tenant_final_signature: signatureData, // Matches your DB column name
        mobile: tenantMobile
      });

      if (res.data.success) {
        alert("✅ Agreement Fully Completed!");
        navigate("/my-bookings");
      }
    } catch (err) {
      alert("Final signing failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading agreement data...</div>;

  /* ================= CASE 1: OWNER HAS SIGNED (SHOW PDF & DRAWING PAD) ================= */
  // Based on your DB: we look for 'approved' status and 'signed_pdf' existence
  if (existingAgreement?.signed_pdf && existingAgreement.agreement_status === 'approved') {
    return (
      <div style={{ maxWidth: "850px", margin: "30px auto", padding: "30px", backgroundColor: "#fff", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>OWNER SIGNED ✅</span>
            <h2 style={{ marginTop: '10px', fontWeight: '800' }}>Finalize Agreement</h2>
            <p style={{ color: '#64748b' }}>Please review the document and draw your signature below to complete.</p>
        </div>

        {/* The Document Preview */}
        <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px' }}>
            <img 
              src={existingAgreement.signed_pdf} 
              alt="Agreement for review" 
              style={{ width: '100%', height: 'auto' }} 
            />
        </div>

        <div style={{ backgroundColor: '#f1f5f9', padding: '25px', borderRadius: '15px' }}>
            <label style={{ fontWeight: '700', display: 'block', marginBottom: '10px' }}>Draw Your Signature Here</label>
            <div style={{ background: '#fff', border: '2px dashed #cbd5e1', borderRadius: '10px' }}>
                <SignatureCanvas 
                  ref={sigPad}
                  penColor="black"
                  canvasProps={{ width: 750, height: 200, className: "sigCanvas" }} 
                />
            </div>
            <button 
              onClick={() => sigPad.current.clear()} 
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '10px', fontWeight: '600' }}
            >
              Clear & Redraw
            </button>
        </div>

        <button 
          onClick={handleFinalTenantSign} 
          disabled={loading}
          style={{ width: '100%', marginTop: '30px', padding: '20px', borderRadius: '12px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: '800', fontSize: '18px', cursor: 'pointer' }}
        >
          {loading ? "Generating Final Document..." : "Sign & Finish Agreement"}
        </button>
      </div>
    );
  }

  /* ================= CASE 2: WAITING FOR OWNER / COMPLETED ================= */
  if (existingAgreement) {
    const isCompleted = existingAgreement.agreement_status === 'completed';
    return (
      <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center", padding: "40px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: "60px" }}>{isCompleted ? "🎉" : "⏳"}</div>
        <h2 style={{ color: "#1e293b", fontWeight: "800" }}>
            {isCompleted ? "Agreement Completed" : "Waiting for Owner"}
        </h2>
        <p style={{ color: "#64748b" }}>
          Current Status: <strong style={{ color: "#4f46e5" }}>{existingAgreement.agreement_status.toUpperCase()}</strong>
        </p>
        <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "14px", color: "#475569" }}>
            {isCompleted 
              ? "Your final signed agreement is ready. You can download it from your dashboard."
              : "The owner has received your details. Please check back in a while to provide your final signature."}
          </p>
        </div>
        <button 
          onClick={() => navigate("/my-bookings")} 
          style={{ marginTop: "30px", padding: "12px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  /* ================= CASE 3: INITIAL FORM (Same as your original) ================= */
  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: 'center', fontWeight: '800' }}>Rental Agreement Form</h2>
      <form onSubmit={handleSubmit}>
        {/* ... Include all your existing input fields here ... */}
        
        {/* Simplified display for brevity, use your full grid here */}
        <div style={{ marginTop: '20px' }}>
            <label>Full Name</label>
            <input name="full_name" onChange={handleChange} required style={{ width: '100%', padding: '12px', margin: '10px 0' }} />
        </div>

        <div style={{ marginTop: "40px", padding: "30px", border: "2px dashed #cbd5e1", borderRadius: "12px", textAlign: "center" }}>
          <label style={{ display: "block", fontWeight: "800" }}>🖋️ Upload Signature Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setSignature(e.target.files[0])} required />
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "30px", padding: "18px", background: "#4f46e5", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}>
          {loading ? "Submitting..." : "Submit Details"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;