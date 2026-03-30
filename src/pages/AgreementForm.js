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
  const [error, setError] = useState(null);

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
      setFetching(true);
      setError(null);
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
        }
      } catch (err) {
        console.error("Error checking agreement status", err);
        setError("Failed to connect to server. Please refresh the page.");
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
        const statusRes = await api.get(`/agreements-form/status/${bookingId}`);
        if (statusRes.data.exists) setExistingAgreement(statusRes.data.data);
      }
    } catch (err) {
      alert("Error saving agreement. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalTenantSign = async () => {
    if (sigCanvas.current.isEmpty()) return alert("Please provide a signature on the pad.");

    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      const res = await api.post("/agreements-form/tenant/sign", {
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

  // Styles
  const containerStyle = { maxWidth: "800px", margin: "30px auto", padding: "35px", backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", fontFamily: "'Inter', sans-serif" };
  const inputStyle = { padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "15px", width: "100%", backgroundColor: "#f8fafc", marginBottom: "10px" };
  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" };
  const sectionTitle = { fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.2px", color: "#4f46e5", fontWeight: "800", marginBottom: "15px", marginTop: "25px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" };

  if (fetching) return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading details...</div>;

  if (error) return (
    <div style={containerStyle}>
        <div style={{ textAlign: "center", color: "#ef4444" }}>
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>Retry</button>
        </div>
    </div>
  );

  /* ================= CONDITIONAL RENDERING LOGIC ================= */

  if (existingAgreement) {
    const status = existingAgreement.agreement_status;

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

    if (status === "approved") {
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#1e293b', fontWeight: '800', marginBottom: '10px' }}>Final Step: Provide Your Signature</h2>
            <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
              The owner has signed the agreement. Please review and provide your final digital signature below.
            </p>
          </div>
          
          <div style={{ backgroundColor: "#f8fafc", padding: "30px", borderRadius: "16px", border: "2px dashed #4f46e5" }}>
            <label style={{ display: "block", fontWeight: "700", marginBottom: "15px", textAlign: "center", color: '#1e293b' }}>🖋️ Draw your signature on the pad below</label>
            <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: '8px', overflow: 'hidden' }}>
              <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="black" 
                  canvasProps={{ width: 730, height: 200, className: "sigCanvas" }} 
              />
            </div>
            <div style={{ textAlign: 'center' }}>
                <button onClick={() => sigCanvas.current.clear()} style={{ marginTop: "15px", fontSize: "14px", color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: '600' }}>
                    Clear Signature & Try Again
                </button>
            </div>
          </div>

          <button 
            onClick={handleFinalTenantSign} 
            disabled={loading}
            style={{ width: "100%", marginTop: "30px", padding: "20px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "white", border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer", fontSize: "16px", boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
          >
            {loading ? "Processing..." : "Complete & Sign Agreement"}
          </button>
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "60px" }}>⏳</div>
          <h2 style={{ color: "#1e293b" }}>Awaiting Owner Signature</h2>
          <p style={{ color: "#64748b" }}>
            Your details have been submitted. We are currently processing the document. 
            Once the owner has signed, you will be able to provide your final signature here.
          </p>
          <button onClick={() => navigate("/my-bookings")} style={{ marginTop: "20px", color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
            ← Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

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
        <textarea name="address" placeholder="Full Permanent Address" onChange={handleChange} required style={{ ...inputStyle, height: '80px', resize: 'none' }} />
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