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

  /* ================= FETCH STATUS ================= */
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
        setError("Server error. Please refresh.");
      } finally {
        setFetching(false);
      }
    };
    if (bookingId) checkStatus();
  }, [bookingId]);

  /* ================= FORM ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId =
      localStorage.getItem("user_id") || localStorage.getItem("userId");

    if (!userId) return alert("Session expired");
    if (!signatureFile) return alert("Signature required");

    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) =>
      data.append(key, formData[key])
    );

    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);

      if (res.data.success) {
        alert("Submitted successfully!");

        const statusRes = await api.get(
          `/agreements-form/status/${bookingId}`
        );

        if (statusRes.data.exists) {
          setExistingAgreement(statusRes.data.data);
        }
      }
    } catch (err) {
      alert("Error saving agreement");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FINAL SIGN ================= */
  const handleFinalTenantSign = async () => {
    if (sigCanvas.current.isEmpty()) {
      return alert("Please draw your signature");
    }

    setLoading(true);

    try {
      const signatureDataURL = sigCanvas.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      const res = await api.post("/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
      });

      if (res.data.success) {
        alert("✅ Agreement signed successfully!");

        // 🔥 OPEN FINAL PDF
        if (res.data.url) {
          window.open(res.data.url, "_blank");
        }

        navigate("/my-bookings");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Signing failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STYLES ================= */
  const containerStyle = {
    maxWidth: "800px",
    margin: "30px auto",
    padding: "35px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
  };

  if (fetching) return <div style={{ textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ textAlign: "center" }}>{error}</div>;

  /* ================= AGREEMENT FLOW ================= */

  if (existingAgreement) {
    const status = existingAgreement.agreement_status;

    /* ✅ COMPLETED */
    if (status === "completed") {
      return (
        <div style={containerStyle}>
          <h2>✅ Agreement Completed</h2>
          <button
            onClick={() =>
              window.open(existingAgreement.signed_pdf, "_blank")
            }
          >
            Download Final PDF
          </button>
        </div>
      );
    }

    /* ✅ OWNER SIGN DONE → USER SIGN */
    if (status === "approved") {
      if (!existingAgreement.signed_pdf) {
        return (
          <div style={containerStyle}>
            <h2>⏳ Waiting for Owner Signature</h2>
          </div>
        );
      }

      return (
        <div style={containerStyle}>
          <h2>Final Step: Sign</h2>

          <iframe
            src={existingAgreement.signed_pdf}
            width="100%"
            height="500px"
            title="Agreement"
            style={{ marginBottom: "20px" }}
          />

          <h3>Draw Signature</h3>

          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: 700,
              height: 200,
              style: { border: "1px solid #ccc" },
            }}
          />

          <br />

          <button onClick={() => sigCanvas.current.clear()}>
            Clear
          </button>

          <button
            onClick={handleFinalTenantSign}
            disabled={loading}
            style={{ marginLeft: "10px" }}
          >
            {loading ? "Signing..." : "Finish Signing"}
          </button>
        </div>
      );
    }

    /* ⏳ WAITING */
    return (
      <div style={containerStyle}>
        <h2>⏳ Waiting for Process</h2>
        <p>Admin preparing / Owner not signed</p>
      </div>
    );
  }

  /* ================= FORM ================= */

  return (
    <div style={containerStyle}>
      <h2>Agreement Form</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="full_name"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />

        <input
          name="mobile"
          placeholder="Mobile"
          onChange={handleChange}
          required
        />

        <br />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSignatureFile(e.target.files[0])}
          required
        />

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default AgreementForm;