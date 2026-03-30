import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper 
} from "@mui/material";

const AgreementForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef(null);

  /* ================= STATES ================= */
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAgreement, setExistingAgreement] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  // OTP Logic States
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

  /* ================= RECAPTCHA & TIMER ================= */
  useEffect(() => {
    // Initialize reCAPTCHA only if the container exists and it hasn't been initialized yet
    const initRecaptcha = () => {
      if (!window.recaptchaVerifier) {
        const container = document.getElementById("recaptcha-container");
        if (container) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
          });
        }
      }
    };

    initRecaptcha();

    // Cleanup on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [fetching]); // Re-run once fetching finishes to ensure DOM is ready

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  /* ================= FETCH STATUS ================= */
  useEffect(() => {
    const checkStatus = async () => {
      setFetching(true);
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

  /* ================= OTP FUNCTIONS ================= */
  const sendOtp = async () => {
    const phone = existingAgreement?.mobile;
    if (!phone || phone.length !== 10) return setError("Invalid phone number in record.");

    try {
      setLoading(true);
      setError(null);
      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent to your registered mobile.");
    } catch (err) {
      console.error("SMS Error:", err);
      setError("Failed to send OTP. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter 6-digit OTP");
    try {
      setLoading(true);
      await confirmObj.confirm(otp);
      setIsVerified(true);
      setSuccess("Mobile Verified! Please sign below.");
    } catch (err) {
      setError("Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORM ACTIONS ================= */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitInitialForm = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("user_id") || localStorage.getItem("userId");
    if (!userId) return alert("Session expired");
    if (!signatureFile) return alert("Initial signature photo required");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("Form submitted! Waiting for approval.");
        window.location.reload();
      }
    } catch (err) {
      alert("Error saving agreement");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalTenantSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return alert("Please draw signature");
    
    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.toDataURL("image/png");
      const res = await api.post("/agreements-form/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
        tenant_mobile: existingAgreement.mobile
      });

      if (res.data.success) {
        alert("✅ Agreement signed successfully!");
        navigate("/my-bookings");
      }
    } catch (err) {
      alert("❌ Signing failed");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: "800px", margin: "30px auto", padding: "30px", borderRadius: "16px",
  };

  /* ================= RENDER LOGIC ================= */
  return (
    <Box>
      <div style={containerStyle}>
        {fetching ? (
          <Box textAlign="center" mt={10}><CircularProgress /></Box>
        ) : (
          <>
            {/* 1. COMPLETED STATUS */}
            {existingAgreement?.agreement_status === "completed" && (
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="success.main" mb={2}>✅ Agreement Completed</Typography>
                <Button variant="contained" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                  Download Final PDF
                </Button>
              </Paper>
            )}

            {/* 2. APPROVED BY OWNER - READY FOR OTP & SIGN */}
            {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" mb={3} fontWeight="bold">Final Step: Verify & Sign</Typography>
                <iframe src={existingAgreement.signed_pdf} width="100%" height="450px" style={{ marginBottom: "20px", border: '1px solid #ddd' }} title="Agreement" />

                {!isVerified ? (
                  <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle1" mb={2}>Verify identity via <b>+91 {existingAgreement.mobile}</b></Typography>
                    {!confirmObj ? (
                      <Button variant="contained" onClick={sendOtp} disabled={loading}>
                        {loading ? "Sending..." : "Send OTP to Sign"}
                      </Button>
                    ) : (
                      <Box>
                        <TextField 
                          fullWidth label="6-Digit OTP" value={otp} 
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} 
                          sx={{ mb: 2 }} 
                        />
                        <Button variant="contained" fullWidth onClick={verifyOtp} disabled={loading}>
                          {loading ? "Verifying..." : "Verify OTP"}
                        </Button>
                        {otpTimer > 0 ? (
                          <Typography variant="caption" display="block" mt={1}>Resend in {otpTimer}s</Typography>
                        ) : (
                          <Button size="small" onClick={sendOtp} sx={{ mt: 1 }}>Resend OTP</Button>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box mt={3}>
                    <Alert severity="success" sx={{ mb: 2 }}>Verification Successful. Please Draw Signature below.</Alert>
                    <Box border="1px dashed #ccc" borderRadius={1} bgcolor="#fff">
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{ width: 700, height: 200, className: "sigCanvas" }}
                      />
                    </Box>
                    <Box mt={2} display="flex" gap={2}>
                      <Button variant="outlined" onClick={() => sigCanvas.current.clear()}>Clear</Button>
                      <Button variant="contained" color="success" onClick={handleFinalTenantSign} disabled={loading}>
                        {loading ? "Saving..." : "Finish & Download"}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {/* 3. PENDING STATUS */}
            {existingAgreement?.agreement_status === "pending" && (
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" mb={2}>⏳ Under Review</Typography>
                <Typography color="textSecondary">Admin is reviewing your details. Once approved, you will be able to sign.</Typography>
              </Paper>
            )}

            {/* 4. INITIAL FORM (If no agreement exists yet) */}
            {!existingAgreement && (
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" mb={3} fontWeight="bold">Agreement Form</Typography>
                <form onSubmit={handleSubmitInitialForm}>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <TextField name="full_name" label="Full Name" required onChange={handleChange} />
                    <TextField name="mobile" label="Mobile Number" required onChange={handleChange} inputProps={{ maxLength: 10 }} />
                    <TextField name="father_name" label="Father's Name" onChange={handleChange} />
                    <TextField name="email" label="Email Address" type="email" onChange={handleChange} />
                    <TextField name="address" label="Permanent Address" multiline rows={2} sx={{ gridColumn: 'span 2' }} onChange={handleChange} />
                  </Box>
                  <Typography variant="subtitle2" mt={3} mb={1}>Upload Signature Image (Initial):</Typography>
                  <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} required />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5 }} disabled={loading}>
                    {loading ? "Submitting..." : "Submit Agreement Details"}
                  </Button>
                </form>
              </Paper>
            )}
          </>
        )}

        {/* --- GLOBAL COMPONENTS --- */}
        <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")}>
          <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>
        </Snackbar>
        
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* CRITICAL: This must ALWAYS be in the DOM to avoid auth/argument-error */}
        <div id="recaptcha-container"></div>
      </div>
    </Box>
  );
};

export default AgreementForm;