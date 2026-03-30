import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper, InputAdornment 
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

  // OTP & Manual Phone Logic
  const [manualPhone, setManualPhone] = useState(""); 
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
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [fetching]);

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
          // Set manualPhone from backend record if it exists
          if (res.data.data.mobile) {
            setManualPhone(res.data.data.mobile);
          }
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
    if (!manualPhone || manualPhone.length !== 10) {
      return setError("Please enter a valid 10-digit mobile number.");
    }

    try {
      setLoading(true);
      setError(null);
      // Ensure recaptcha is ready
      if (!window.recaptchaVerifier) {
         window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      
      const confirmation = await signInWithPhoneNumber(auth, `+91${manualPhone}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent successfully!");
    } catch (err) {
      console.error("SMS Error:", err);
      setError("Failed to send OTP. Check if your number is correct.");
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
      setSuccess("Mobile Verified! You can now sign.");
    } catch (err) {
      setError("Invalid OTP code. Please try again.");
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
    if (!signatureFile) return alert("Signature photo required");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
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
        tenant_mobile: manualPhone // Use the verified manual phone
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
    maxWidth: "850px", margin: "20px auto", padding: "25px", borderRadius: "12px",
  };

  return (
    <Box>
      <div style={containerStyle}>
        {fetching ? (
          <Box textAlign="center" mt={10}><CircularProgress /></Box>
        ) : (
          <>
            {/* 1. COMPLETED */}
            {existingAgreement?.agreement_status === "completed" && (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="success.main" gutterBottom>✅ Agreement Completed</Typography>
                <Button variant="contained" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                  Download Final PDF
                </Button>
              </Paper>
            )}

            {/* 2. APPROVED - OTP & SIGNING FLOW */}
            {existingAgreement?.agreement_status === "approved" && (
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" mb={2} fontWeight="bold">Digital Signature Verification</Typography>
                
                {/* PDF Preview */}
                <iframe 
                  src={existingAgreement.signed_pdf} 
                  width="100%" 
                  height="450px" 
                  style={{ marginBottom: "20px", border: '1px solid #ddd', borderRadius: '8px' }} 
                  title="Agreement Preview" 
                />

                {!isVerified ? (
                  <Box sx={{ bgcolor: '#fdfdfd', p: 3, borderRadius: 2, border: '1px solid #eee' }}>
                    <Typography variant="subtitle2" color="textSecondary" mb={1}>Enter Mobile Number for OTP Verification</Typography>
                    
                    <Box display="flex" gap={1} mb={2}>
                      <TextField 
                        fullWidth 
                        variant="outlined"
                        placeholder="Enter 10 digit mobile"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, ""))}
                        disabled={!!confirmObj || loading}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                        }}
                      />
                      {!confirmObj && (
                        <Button 
                          variant="contained" 
                          onClick={sendOtp} 
                          disabled={loading || manualPhone.length !== 10}
                          sx={{ whiteSpace: 'nowrap', px: 3 }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : "Get OTP"}
                        </Button>
                      )}
                    </Box>

                    {confirmObj && (
                      <Box>
                        <TextField 
                          fullWidth 
                          label="Enter 6-Digit OTP" 
                          value={otp} 
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} 
                          sx={{ mb: 2 }} 
                        />
                        <Button variant="contained" fullWidth onClick={verifyOtp} disabled={loading}>
                          {loading ? "Verifying..." : "Verify & Unlock Signature"}
                        </Button>
                        <Box mt={1} textAlign="center">
                           {otpTimer > 0 ? (
                             <Typography variant="caption">Resend OTP in {otpTimer}s</Typography>
                           ) : (
                             <Button size="small" onClick={sendOtp}>Resend OTP</Button>
                           )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box mt={3} sx={{ animation: 'fadeIn 0.5s' }}>
                    <Alert severity="success" sx={{ mb: 2 }}>Mobile Verified! Please Draw your Signature below.</Alert>
                    <Box border="2px dashed #90caf9" borderRadius={2} bgcolor="#fff" overflow="hidden">
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{ width: 750, height: 200, className: "sigCanvas" }}
                      />
                    </Box>
                    <Box mt={2} display="flex" gap={2} justifyContent="flex-end">
                      <Button variant="text" color="error" onClick={() => sigCanvas.current.clear()}>Clear Canvas</Button>
                      <Button variant="contained" color="success" onClick={handleFinalTenantSign} disabled={loading}>
                        {loading ? "Signing..." : "Apply Signature & Finish"}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {/* 3. PENDING */}
            {existingAgreement?.agreement_status === "pending" && (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="warning.main">⏳ Approval Pending</Typography>
                <Typography mt={1} color="textSecondary">The property owner is reviewing your details. Please check back later.</Typography>
              </Paper>
            )}

            {/* 4. INITIAL FORM */}
            {!existingAgreement && (
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" mb={3} fontWeight="bold">New Rent Agreement Details</Typography>
                <form onSubmit={handleSubmitInitialForm}>
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                    <TextField name="full_name" label="Full Name" required onChange={handleChange} />
                    <TextField name="mobile" label="Mobile Number" required onChange={handleChange} inputProps={{ maxLength: 10 }} />
                    <TextField name="father_name" label="Father's Name" onChange={handleChange} />
                    <TextField name="email" label="Email Address" type="email" onChange={handleChange} />
                    <TextField name="address" label="Permanent Address" multiline rows={2} sx={{ gridColumn: { md: 'span 2' } }} onChange={handleChange} />
                  </Box>
                  <Typography variant="subtitle2" mt={3} mb={1}>Signature Photo (For Initial Draft):</Typography>
                  <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} required />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5 }} disabled={loading}>
                    Submit for Approval
                  </Button>
                </form>
              </Paper>
            )}
          </>
        )}

        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
          <Alert severity="success">{success}</Alert>
        </Snackbar>
        
        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <div id="recaptcha-container"></div>
      </div>
    </Box>
  );
};

export default AgreementForm;