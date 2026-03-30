import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";

// 🔥 ADD OTP IMPORTS
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAgreement, setExistingAgreement] = useState(null);
  const [error, setError] = useState(null);

  // 🔥 OTP STATES
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);

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

  /* ================= OTP SETUP ================= */
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  }, []);

  const sendOtp = async () => {
    if (phone.length !== 10) return alert("Enter valid number");

    const confirmation = await signInWithPhoneNumber(
      auth,
      `+91${phone}`,
      window.recaptchaVerifier
    );

    setConfirmObj(confirmation);
    alert("OTP sent");
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return alert("Invalid OTP");

    try {
      await confirmObj.confirm(otp);
      setOtpVerified(true);
      alert("OTP Verified ✅");
    } catch {
      alert("Invalid OTP");
    }
  };

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
    if (!otpVerified) return alert("Verify OTP first");

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return alert("Please draw your signature");
    }

    setLoading(true);

    try {
      const signatureDataURL = sigCanvas.current.toDataURL("image/png");

      const res = await api.post("/agreements-form/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
        tenant_mobile: phone,
      });

      if (res.data.success) {
        alert("✅ Agreement signed successfully!");

        if (res.data.url) {
          window.open(res.data.url, "_blank");
        }

        navigate("/my-bookings");
      }
    } catch (err) {
      console.error("Sign error:", err);
      alert("❌ Signing failed");
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
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
  };

  if (fetching) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  /* ================= AGREEMENT FLOW ================= */

  if (existingAgreement) {
    const status = existingAgreement.agreement_status;

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

    if (status === "approved") {
      return (
        <div style={containerStyle}>
          <h2>Final Step: Sign</h2>

          {/* ✅ PDF SHOW */}
          <iframe
            src={existingAgreement.signed_pdf}
            width="100%"
            height="500px"
          />

          {/* 🔥 OTP SECTION BELOW PDF */}
          <h3>Verify Mobile</h3>

          {!confirmObj && (
            <>
              <input
                placeholder="Enter Mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button onClick={sendOtp}>Send OTP</button>
            </>
          )}

          {confirmObj && !otpVerified && (
            <>
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={verifyOtp}>Verify OTP</button>
            </>
          )}

          {/* 🔥 SIGNATURE */}
          {otpVerified && (
            <>
              <h3>Draw Signature</h3>

              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ width: 700, height: 200 }}
              />

              <button onClick={() => sigCanvas.current.clear()}>
                Clear
              </button>

              <button onClick={handleFinalTenantSign}>
                {loading ? "Signing..." : "Finish Signing"}
              </button>
            </>
          )}

          <div id="recaptcha-container"></div>
        </div>
      );
    }

    return <div>Waiting...</div>;
  }

  return <div>No Data</div>;
};

export default AgreementForm;