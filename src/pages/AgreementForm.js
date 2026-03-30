// ONLY STATUS CONDITIONS UPDATED (REST SAME)

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper, Grid, Divider 
} from "@mui/material";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAgreement, setExistingAgreement] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [manualMobile, setManualMobile] = useState(""); 
  const [confirmObj, setConfirmObj] = useState(null);
  const [otp, setOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [formData, setFormData] = useState({
    full_name: "", father_name: "", mobile: "", email: "",
    address: "", city: "", state: "", pincode: "",
    aadhaar_last4: "", pan_number: "", checkin_date: "",
    agreement_months: "11", rent: "", deposit: "", maintenance: "0",
  });

  const [signatureFile, setSignatureFile] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
          setManualMobile(res.data.data.mobile || "");
        }
      } catch (err) {
        setError("Server error. Please refresh.");
      } finally {
        setFetching(false);
      }
    };
    if (bookingId) checkStatus();
  }, [bookingId]);

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
    });
  };

  const sendOtp = async () => {
    if (manualMobile.length !== 10) return setError("Enter valid number");
    setLoading(true);
    try {
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, `+91${manualMobile}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent");
    } catch {
      setError("OTP failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmObj.confirm(otp);
      setIsVerified(true);
      setSuccess("Verified");
    } catch {
      setError("Invalid OTP");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitInitialForm = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");
    if (!signatureFile) return setError("Signature required");

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      await api.post("/agreements-form/submit", data);
      window.location.reload();
    } catch {
      setError("Submit failed");
    }
  };

  const handleFinalTenantSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return setError("Draw signature");

    try {
      const signatureDataURL = sigCanvas.current.toDataURL("image/png");

      await api.post("/agreements-form/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
        tenant_mobile: manualMobile
      });

      setSuccess("Signed successfully");
      setTimeout(() => navigate("/my-bookings"), 1500);
    } catch {
      setError("Signing failed");
    }
  };

  return (
    <Box sx={{ maxWidth: "900px", margin: "30px auto", p: 2 }}>
      {fetching ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        <>
          {/* COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5">✅ Agreement Completed</Typography>
              <Button onClick={() => window.open(existingAgreement.signed_pdf)}>
                Download Final PDF
              </Button>
            </Paper>
          )}

          {/* PENDING */}
          {existingAgreement?.agreement_status === "pending" && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography>⏳ Under Review</Typography>
            </Paper>
          )}

          {/* ✅ NEW: ADMIN UPLOADED */}
          {existingAgreement?.agreement_status === "admin_uploaded" && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6">⏳ Waiting for Owner Signature</Typography>
              <Typography>Please wait until owner signs the agreement.</Typography>
            </Paper>
          )}

          {/* ✅ UPDATED: OWNER SIGNED ONLY */}
          {(existingAgreement?.agreement_status === "owner_signed") && existingAgreement.signed_pdf && (
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6">Final Step: Digital Signature</Typography>

              <iframe
                src={existingAgreement.signed_pdf}
                width="100%"
                height="500px"
              />

              {!isVerified ? (
                <>
                  <TextField
                    fullWidth
                    label="Mobile"
                    value={manualMobile}
                    onChange={(e) => setManualMobile(e.target.value)}
                  />

                  {!confirmObj ? (
                    <Button onClick={sendOtp}>Send OTP</Button>
                  ) : (
                    <>
                      <TextField label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                      <Button onClick={verifyOtp}>Verify</Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ width: 800, height: 200 }}
                  />
                  <Button onClick={handleFinalTenantSign}>
                    Sign & Finish
                  </Button>
                </>
              )}
            </Paper>
          )}

          {/* NO AGREEMENT */}
          {!existingAgreement && (
            <Paper sx={{ p: 4 }}>
              <form onSubmit={handleSubmitInitialForm}>
                <TextField fullWidth name="full_name" label="Name" onChange={handleChange} />
                <input type="file" onChange={(e) => setSignatureFile(e.target.files[0])} />
                <Button type="submit">Submit</Button>
              </form>
            </Paper>
          )}
        </>
      )}

      <div id="recaptcha-container"></div>

      <Snackbar open={!!success} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      <Snackbar open={!!error} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AgreementForm;