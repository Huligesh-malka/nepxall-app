import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const AadhaarKyc = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [aadhaar, setAadhaar] = useState("");
  const [maskedAadhaar, setMaskedAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ================= VALIDATIONS ================= */

  const isValidAadhaar = (num) => /^[0-9]{12}$/.test(num);
  const isValidOtp = (num) => /^[0-9]{6}$/.test(num);

  const maskAadhaar = (num) => `XXXX XXXX ${num.slice(-4)}`;

  /* ================= SEND OTP ================= */

  const sendOtp = async () => {
    if (!isValidAadhaar(aadhaar)) {
      return setMessage("Enter valid 12-digit Aadhaar");
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/kyc/aadhaar/send-otp", { aadhaar });

      setMaskedAadhaar(maskAadhaar(aadhaar));
      setStep(2);
      setMessage("OTP sent to Aadhaar linked mobile");

    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const verifyOtp = async () => {
    if (!isValidOtp(otp)) {
      return setMessage("Enter valid 6-digit OTP");
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/kyc/aadhaar/verify-otp", { otp });

      setMessage("✅ Aadhaar verified successfully!");

      setTimeout(() => {
        if (role === "owner") {
          navigate("/owner/dashboard");
        } else {
          navigate("/");
        }
      }, 1500);

    } catch (err) {
      setMessage(err.response?.data?.error || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */

  const resendOtp = () => {
    sendOtp();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2>🔐 Aadhaar KYC Verification</h2>

        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Enter 12-digit Aadhaar"
              value={aadhaar}
              maxLength={12}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
              style={styles.input}
            />

            <button onClick={sendOtp} style={styles.button} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ fontSize: 14 }}>
              OTP sent to <strong>{maskedAadhaar}</strong>
            </p>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={styles.input}
            />

            <button onClick={verifyOtp} style={styles.button} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <p style={styles.resend} onClick={resendOtp}>
              🔄 Resend OTP
            </p>
          </>
        )}

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f1f5f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    width: 400,
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
    textAlign: "center"
  },
  input: {
    width: "100%",
    padding: 12,
    marginTop: 15,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14
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
    cursor: "pointer"
  },
  resend: {
    marginTop: 15,
    fontSize: 13,
    color: "#0B5ED7",
    cursor: "pointer"
  },
  message: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: 500
  }
};

export default AadhaarKyc;
