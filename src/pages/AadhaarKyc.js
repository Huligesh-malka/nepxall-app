import React, { useState } from "react";
import api from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";

const AadhaarKyc = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const bookingId = state?.bookingId;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ✅ CONSENTS
  const [consentAadhaar, setConsentAadhaar] = useState(false);
  const [consentPolicy, setConsentPolicy] = useState(false);
  const [consentPolice, setConsentPolice] = useState(false);

  //////////////////////////////////////////////////////
  // VALIDATIONS
  //////////////////////////////////////////////////////
  const isValidPhone = /^[6-9]\d{9}$/.test(phone);
  const isValidAadhaar = /^\d{12}$/.test(aadhaar);

  //////////////////////////////////////////////////////
  // SEND OTP
  //////////////////////////////////////////////////////
  const sendOtp = async () => {
    if (!name || !isValidPhone || !isValidAadhaar) {
      return alert("Enter valid details");
    }

    if (!consentAadhaar || !consentPolicy || !consentPolice) {
      return alert("Please accept all consents");
    }

    try {
      setLoading(true);

      await api.post("/kyc/aadhaar/send-otp", {
        aadhaar,
        name,
        phone,
      });

      setStep(2);
    } catch {
      alert("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // VERIFY OTP
  //////////////////////////////////////////////////////
  const verifyOtp = async () => {
    try {
      setLoading(true);

      await api.post("/kyc/aadhaar/verify-otp", {
        otp,
        bookingId,
        name,
        phone,
      });

      alert("KYC Completed ✅");

      navigate("/user/active-stay");
    } catch {
      alert("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>KYC Verification</h2>

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Mobile Number"
          value={phone}
          maxLength={10}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          style={styles.input}
        />

        {step === 1 && (
          <>
            <input
              placeholder="Aadhaar Number"
              value={aadhaar}
              maxLength={12}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
              style={styles.input}
            />

            {/* ✅ CONSENTS */}
            <div style={styles.checkboxContainer}>
              <label>
                <input
                  type="checkbox"
                  checked={consentAadhaar}
                  onChange={() => setConsentAadhaar(!consentAadhaar)}
                />
                I confirm this Aadhaar belongs to me
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={consentPolicy}
                  onChange={() => setConsentPolicy(!consentPolicy)}
                />
                I agree to Terms & Privacy Policy
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={consentPolice}
                  onChange={() => setConsentPolice(!consentPolice)}
                />
                I consent for Police Verification
              </label>
            </div>

            <button onClick={sendOtp} style={styles.button}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              placeholder="Enter OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={styles.input}
            />

            <button onClick={verifyOtp} style={styles.button}>
              {loading ? "Verifying..." : "Verify & Complete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AadhaarKyc;

//////////////////////////////////////////////////////
// 🎨 STYLES
//////////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f1f5f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 420,
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  },
  input: {
    width: "100%",
    padding: 12,
    marginTop: 15,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
  },
  button: {
    width: "100%",
    padding: 12,
    marginTop: 20,
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(90deg, #0B5ED7, #4CAF50)",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  checkboxContainer: {
    marginTop: 15,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: 14,
  },
};