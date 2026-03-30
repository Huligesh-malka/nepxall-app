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

  // ✅ NEW STATES
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);

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
        setError("Failed to connect to server. Please refresh.");
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

    if (!userId) return alert("Login again");
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
        alert("✅ Submitted!");
        const statusRes = await api.get(`/agreements-form/status/${bookingId}`);
        if (statusRes.data.exists) setExistingAgreement(statusRes.data.data);
      }
    } catch {
      alert("Error saving");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalTenantSign = async () => {
    if (sigCanvas.current.isEmpty()) return alert("Please sign");

    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");

      const res = await api.post("/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
      });

      if (res.data.success) {
        alert("✅ Completed!");
        navigate("/my-bookings");
      }
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: "800px",
    margin: "30px auto",
    padding: "35px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
  };

  if (fetching) return <div style={{ textAlign: "center" }}>Loading...</div>;

  if (error) return <div>{error}</div>;

  /* ================= STATUS FLOW ================= */

  if (existingAgreement) {
    const status = existingAgreement.agreement_status;

    // ✅ COMPLETED
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

    // ✅ APPROVED (MAIN FIX HERE)
    if (status === "approved") {
      return (
        <div style={containerStyle}>
          <h2 style={{ textAlign: "center" }}>Final Step: Signature</h2>

          {/* PDF */}
          <div style={{ marginBottom: "20px" }}>
            <iframe
              src={existingAgreement.signed_pdf}
              width="100%"
              height="450px"
              title="preview"
              onLoad={() => {
                setPdfLoaded(true);
                setTimeout(() => setShowSignaturePad(true), 1000);
              }}
            ></iframe>
          </div>

          {/* Show loading until PDF loads */}
          {!pdfLoaded && (
            <p style={{ textAlign: "center" }}>📄 Loading agreement...</p>
          )}

          {/* ✅ SIGNATURE ONLY AFTER PDF LOAD */}
          {showSignaturePad && (
            <div style={{ padding: "20px", border: "2px dashed gray" }}>
              <p style={{ textAlign: "center" }}>Draw Signature</p>

              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ width: 700, height: 200 }}
              />

              <button onClick={() => sigCanvas.current.clear()}>
                Clear
              </button>
            </div>
          )}

          <button
            onClick={handleFinalTenantSign}
            disabled={!showSignaturePad || loading}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "15px",
              background: showSignaturePad ? "green" : "gray",
              color: "#fff",
            }}
          >
            {loading ? "Processing..." : "Finish Signing"}
          </button>
        </div>
      );
    }

    return <div>Waiting for owner...</div>;
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

        <button type="submit">{loading ? "Saving..." : "Submit"}</button>
      </form>
    </div>
  );
};

export default AgreementForm;