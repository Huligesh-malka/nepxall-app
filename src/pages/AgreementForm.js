import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef(null);

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

  // Initial Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");

    if (!userId) return alert("Session expired. Please login again.");
    if (!signatureFile) return alert("Initial Digital Signature is required");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("✅ Details Submitted Successfully!");
        // Refresh to trigger the useEffect and show the "Waiting" screen
        window.location.reload();
      }
    } catch (err) {
      alert("Error saving agreement.");
    } finally {
      setLoading(false);
    }
  };

  // FINAL SIGNATURE (After Owner has signed)
  const handleFinalTenantSign = async () => {
    if (sigCanvas.current.isEmpty()) return alert("Please provide a signature on the pad.");

    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      const res = await api.post("/agreements-form/tenant-final-sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
      });

      if (res.data.success) {
        alert("✅ Agreement Fully Signed & Completed!");
        navigate("/my-bookings");
      }
    } catch (err) {
      alert("Failed to complete signing.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading details...</div>;

  // Styles
  const containerStyle = { maxWidth: "800px", margin: "30px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", fontFamily: "'Inter', sans-serif" };
  const inputStyle = { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", width: "100%", backgroundColor: "#f8fafc" };
  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" };
  const sectionTitle = { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.2px", color: "#4f46e5", fontWeight: "800", marginBottom: "15px", marginTop: "25px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" };

  /* ================= CONDITIONAL RENDERING LOGIC ================= */

  if (existingAgreement) {
    const status = existingAgreement.agreement_status;

    // CASE 1: COMPLETED
    if (status === "completed") {
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "60px" }}>✅</div>
            <h2 style={{ color: "#1e293b" }}>Agreement Completed</h2>
            <p style={{ color: "#64748b" }}>Both you and the owner have signed the document.</p>
            <button 
               onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}
               style={{ padding: "12px 24px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginTop: "20px" }}
            >
              Download Final Agreement
            </button>
          </div>
        </div>
      );
    }

    // CASE 2: OWNER SIGNED (APPROVED) -> TENANT MUST SIGN FINAL
    if (status === "approved") {
      return (
        <div style={containerStyle}>
          <h2 style={{ textAlign: 'center', color: '#1e293b' }}>Final Step: Provide Your Signature</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>The owner has signed the agreement. Please review and provide your final digital signature below.</p>
          
          <div style={{ marginBottom: "20px", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
              <p style={{ padding: "10px", background: "#f1f5f9", fontSize: "13px", margin: 0 }}>Agreement Preview (Signed by Owner)</p>
              <iframe src={existingAgreement.signed_pdf} width="100%" height="450px" title="preview"></iframe>
          </div>

          <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "2px dashed #cbd5e1" }}>
            <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", textAlign: "center" }}>🖋️ Draw your signature below</label>
            <div style={{ background: "#fff", border: "1px solid #ddd" }}>
              <SignatureCanvas 
                 ref={sigCanvas}
                 penColor="black" 
                 canvasProps={{ width: 730, height: 200, className: "sigCanvas" }} 
              />
            </div>
            <button onClick={() => sigCanvas.current.clear()} style={{ marginTop: "10px", fontSize: "12px", color: "#ef4444", border: "none", background: "none", cursor: "pointer" }}>Clear Signature</button>
          </div>

          <button 
            onClick={handleFinalTenantSign} 
            disabled={loading}
            style={{ width: "100%", marginTop: "30px", padding: "18px", background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer" }}
          >
            {loading ? "Processing..." : "Finish & Sign Agreement"}
          </button>
        </div>
      );
    }

    // CASE 3: WAITING (PENDING or any other state after submission)
    // If the record exists but isn't 'approved' or 'completed', show this screen.
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "60px" }}>⏳</div>
          <h2 style={{ color: "#1e293b" }}>Awaiting Admin/Owner Processing</h2>
          <p style={{ color: "#64748b" }}>
            Your details are submitted. Our admin is currently preparing the stamp paper. 
            Once the owner signs, you will be notified to provide your final signature here.
          </p>
          <button onClick={() => navigate("/my-bookings")} style={{ marginTop: "20px", color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
            ← Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  /* ================= INITIAL FORM (ONLY IF NO RECORD EXISTS) ================= */
  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', fontWeight: '800', color: '#1e293b', marginBottom: '5px' }}>Rental Agreement Form</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Please fill all details as per your legal documents.</p>
      
      <form onSubmit={handleSubmit}>
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

        <div style={sectionTitle}>Permanent Address</div>
        <textarea name="address" placeholder="Full Permanent Address" onChange={handleChange} required style={{ ...inputStyle, height: '80px', resize: 'none', marginBottom: '15px' }} />
        <div style={gridStyle}>
          <input name="city" placeholder="City" onChange={handleChange} required style={inputStyle} />
          <input name="state" placeholder="State" onChange={handleChange} required style={inputStyle} />
          <input name="pincode" placeholder="Pincode" onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={sectionTitle}>Identity Verification</div>
        <div style={gridStyle}>
          <input name="aadhaar_last4" placeholder="Last 4 Digits of Aadhaar" maxLength="4" onChange={handleChange} required style={inputStyle} />
          <input name="pan_number" placeholder="PAN Card Number" onChange={handleChange} required style={inputStyle} />
        </div>

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

        <div style={{ marginTop: "40px", padding: "30px", border: "2px dashed #cbd5e1", borderRadius: "12px", textAlign: "center", backgroundColor: '#f8fafc' }}>
          <label style={{ display: "block", fontWeight: "800", marginBottom: "12px", color: '#1e293b' }}>🖋️ Initial Signature Upload</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setSignatureFile(e.target.files[0])} 
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: "100%", marginTop: "30px", padding: "18px", background: loading ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Processing..." : "Confirm & Submit Agreement Details"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;