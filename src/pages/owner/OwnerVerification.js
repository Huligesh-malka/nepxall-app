import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../../config";   // ✅ USE CONFIG

const API = `${API_CONFIG.USER_API_URL}/owner`;  // ✅ AUTO SWITCH LOCAL/PROD

export default function OwnerVerification() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [aadhaar, setAadhaar] = useState("");
  const [maskedAadhaar, setMaskedAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);

  /* ================= TOKEN ================= */

  const getHeaders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Login required");

    const token = await user.getIdToken(true);

    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  /* ================= STATUS CHECK ================= */

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const config = await getHeaders();

      const res = await axios.get(
        `${API}/verification/status`,
        config
      );

      if (res.data.aadhaar_verified) {
        setVerified(true);
        setStep(3);
        setTimeout(() => navigate("/owner/bank"), 2000);
      }
    } catch {
      console.log("Not verified yet");
    } finally {
      setInitialLoading(false);
    }
  };

  /* ================= SEND OTP ================= */

  const sendOtp = async () => {
    if (aadhaar.length !== 12) return alert("Enter valid Aadhaar");

    try {
      setLoading(true);
      const config = await getHeaders();

      const res = await axios.post(
        `${API}/verification/aadhaar/send-otp`,
        { aadhaar_number: aadhaar },
        config
      );

      setMaskedAadhaar(`XXXX XXXX ${aadhaar.slice(-4)}`);
      setStep(2);
      alert(res.data.message || "OTP sent successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "OTP send failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const verifyOtp = async () => {
    if (otp.length < 4) return alert("Enter valid OTP");

    try {
      setLoading(true);
      const config = await getHeaders();

      const res = await axios.post(
        `${API}/verification/aadhaar/verify-otp`,
        { otp },
        config
      );

      setVerified(true);
      setStep(3);

      alert(res.data.message || "Verification successful");

      setTimeout(() => navigate("/owner/bank"), 2000);
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */

  if (initialLoading) {
    return (
      <div className="text-center py-20 font-semibold text-gray-500">
        Checking verification status...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Owner KYC Verification</h2>
        <p className="text-sm text-gray-500">
          Required to add PG & receive payments
        </p>
      </div>

      <StepIndicator step={step} />

      {step === 1 && (
        <>
          <Input
            value={aadhaar}
            maxLength={12}
            placeholder="Enter Aadhaar Number"
            onChange={(v) => setAadhaar(v.replace(/\D/g, ""))}
          />

          <Button
            onClick={sendOtp}
            loading={loading}
            disabled={aadhaar.length !== 12}
          >
            Send OTP
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-sm text-gray-500 text-center">
            OTP sent to Aadhaar linked mobile <br />
            <b>{maskedAadhaar}</b>
          </p>

          <Input
            value={otp}
            maxLength={6}
            placeholder="Enter OTP"
            onChange={(v) => setOtp(v.replace(/\D/g, ""))}
          />

          <Button onClick={verifyOtp} loading={loading}>
            Verify Aadhaar
          </Button>

          <button
            className="text-blue-600 text-xs underline w-full"
            onClick={() => setStep(1)}
          >
            Change Aadhaar Number
          </button>
        </>
      )}

      {step === 3 && (
        <div className="text-center text-green-600 font-semibold">
          ✅ Aadhaar Verified <br />
          Redirecting to Bank setup...
        </div>
      )}
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

const Input = ({ value, onChange, ...props }) => (
  <input
    {...props}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full border p-3 rounded-lg text-center tracking-widest"
  />
);

const Button = ({ children, loading, ...props }) => (
  <button
    {...props}
    className="w-full bg-blue-600 text-white py-3 rounded-lg"
  >
    {loading ? "Please wait..." : children}
  </button>
);

const StepIndicator = ({ step }) => {
  const steps = ["Aadhaar", "OTP", "Done"];

  return (
    <div className="flex justify-between">
      {steps.map((s, i) => (
        <div key={i} className={`text-xs ${step >= i + 1 && "text-blue-600"}`}>
          {s}
        </div>
      ))}
    </div>
  );
};