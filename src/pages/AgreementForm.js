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

    if (!userId) return alert("Session expired.");
    if (!signatureFile) return alert("Signature required");

    setLoading(true);
    const data = new FormData();

    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("Submitted!");
        const statusRes = await api.get(`/agreements-form/status/${bookingId}`);
        if (statusRes.data.exists) setExistingAgreement(statusRes.data.data);
      }
    } catch {
      alert("Error saving agreement");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalTenantSign = async () => {
    if (sigCanvas.current.isEmpty()) return alert("Draw signature");

    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");

      const res = await api.post("/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
      });

      if (res.data.success) {
        alert("Agreement completed!");
        navigate("/my-bookings");
      }
    } catch {
      alert("Failed signing");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: "800px",
    margin: "30px auto",
    padding: "35px",
    backgroundColor: "#fff",
    borderRadius: "16px",
  };

  if (fetching) return <div style={{ textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ textAlign: "center" }}>{error}</div>;

  /* ================= FIXED LOGIC ================= */

  if (existingAgreement) {
    const status = existingAgreement.agreement_status;

    /* ✅ COMPLETED */
    if (status === "completed") {
      return (
        <div style={containerStyle}>
          <h2>✅ Agreement Completed</h2>
          <button onClick={() => window.open(existingAgreement.signed_pdf)}>
            Download PDF
          </button>
        </div>
      );
    }

    /* ✅ OWNER SIGN STEP */
    if (status === "approved") {
      // 🔥 FIX: Don't show PDF until ready
      if (!existingAgreement.signed_pdf) {
        return (
          <div style={containerStyle}>
            <h2>⏳ Waiting for Owner Signature</h2>
            <p>Please wait. Owner is signing the agreement.</p>
          </div>
        );
      }

      return (
        <div style={containerStyle}>
          <h2>Final Step: Sign</h2>

          {/* ✅ SHOW PDF ONLY HERE */}
          <iframe
            src={existingAgreement.signed_pdf}
            width="100%"
            height="500px"
            title="Agreement"
          />

          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ width: 700, height: 200 }}
          />

          <button onClick={handleFinalTenantSign}>
            Finish Signing
          </button>
        </div>
      );
    }

    /* ✅ DEFAULT WAITING */
    return (
      <div style={containerStyle}>
        <h2>⏳ Waiting for Process</h2>
        <p>Admin preparing stamp paper / Owner not signed yet</p>
      </div>
    );
  }

  /* ================= FORM ================= */

  return (
    <div style={containerStyle}>
      <h2>Agreement Form</h2>

      <form onSubmit={handleSubmit}>
        <input name="full_name" placeholder="Full Name" onChange={handleChange} required />
        <input name="mobile" placeholder="Mobile" onChange={handleChange} required />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSignatureFile(e.target.files[0])}
          required
        />

        <button type="submit" disabled={loading}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;