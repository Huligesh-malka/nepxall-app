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

  /* ================= STATES ================= */
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

  /* ================= FETCH STATUS ================= */
  useEffect(() => {
    const checkStatus = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
          // Pre-fill mobile from existing record if available
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

  /* ================= RECAPTCHA & TIMER ================= */
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
      callback: () => { console.log("Captcha Solved"); },
      'expired-callback': () => {
        if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      }
    });
  };

  /* ================= OTP FUNCTIONS ================= */
  const sendOtp = async () => {
    if (manualMobile.length !== 10) return setError("Please enter a valid 10-digit mobile number.");
    setLoading(true);
    setError(null);
    try {
      setupRecaptcha();
      const formatPh = `+91${manualMobile}`;
      const confirmation = await signInWithPhoneNumber(auth, formatPh, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent to " + manualMobile);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
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
      setSuccess("Mobile Verified!");
    } catch (err) {
      setError("Invalid OTP code or session expired.");
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
    if (!userId) return setError("Session expired. Please login again.");
    if (!signatureFile) return setError("Draft signature photo required.");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        setSuccess("Form submitted! Waiting for Admin approval.");
        window.location.reload();
      }
    } catch (err) {
      setError("Error saving agreement details.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalTenantSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return setError("Please draw your signature.");
    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.toDataURL("image/png");
      
      const res = await api.post("/agreements-form/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
        tenant_mobile: manualMobile 
      });
      
      if (res.data.success) {
        setSuccess("Agreement signed successfully!");
        setTimeout(() => navigate("/my-bookings"), 1500);
      }
    } catch (err) {
      setError("❌ Signing failed: " + (err.response?.data?.message || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "900px", margin: "30px auto", p: 2 }}>
      {fetching ? (
        <Box textAlign="center" mt={10}><CircularProgress /></Box>
      ) : (
        <>
          {/* CASE 1: AGREEMENT IS FULLY SIGNED AND COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h5" color="success.main" mb={2} fontWeight="bold">✅ Agreement Completed</Typography>
              <Typography mb={3}>Your rent agreement has been digitally signed by both parties.</Typography>
              <Button variant="contained" size="large" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                Download Final PDF
              </Button>
            </Paper>
          )}

          {/* CASE 2: FORM SUBMITTED BUT ADMIN HASN'T UPLOADED PDF YET */}
          {existingAgreement?.agreement_status === "pending" && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <CircularProgress size={50} sx={{ mb: 2 }} />
              <Typography variant="h5" color="info.main" fontWeight="bold">⏳ Document Under Review</Typography>
              <Typography mt={2} color="text.secondary">
                We have received your details. Our admin is currently preparing your legal draft. 
                Once the PDF is uploaded, you will be able to sign it here.
              </Typography>
            </Paper>
          )}

          {/* CASE 3: ADMIN UPLOADED PDF - WAITING FOR TENANT SIGNATURE */}
          {existingAgreement?.agreement_status === "approved" && (
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" mb={1} fontWeight="bold">Action Required: Digital Signature</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                The admin has approved your details. Please review the document and sign below.
              </Typography>

              {existingAgreement.signed_pdf && (
                <iframe 
                  src={`${existingAgreement.signed_pdf}#toolbar=0`} 
                  width="100%" 
                  height="500px" 
                  style={{ marginBottom: "20px", borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                  title="Agreement Preview" 
                />
              )}
              
              {!isVerified ? (
                <Box sx={{ bgcolor: '#f0f4f8', p: 3, borderRadius: 2, border: '1px solid #d1d5db' }}>
                  <Typography variant="subtitle1" mb={2} fontWeight="bold">Step 1: Mobile Verification</Typography>
                  <TextField 
                    fullWidth label="Mobile Number" 
                    value={manualMobile} 
                    onChange={(e) => setManualMobile(e.target.value.replace(/\D/g, ""))} 
                    disabled={!!confirmObj} 
                    sx={{ mb: 2, bgcolor: 'white' }} 
                    inputProps={{ maxLength: 10 }} 
                    InputProps={{ startAdornment: <Typography mr={1} fontWeight="bold">+91</Typography> }}
                  />
                  {!confirmObj ? (
                    <Button variant="contained" fullWidth onClick={sendOtp} disabled={loading || manualMobile.length !== 10}>
                      {loading ? <CircularProgress size={24} /> : "Send OTP to Verify"}
                    </Button>
                  ) : (
                    <Box>
                      <TextField 
                        fullWidth label="Enter 6-Digit OTP" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} 
                        sx={{ mb: 2, bgcolor: 'white' }} 
                        inputProps={{ maxLength: 6 }} 
                      />
                      <Button variant="contained" color="secondary" fullWidth onClick={verifyOtp} disabled={loading || otp.length < 6}>
                        {loading ? <CircularProgress size={24} /> : "Verify & Unlock Signature"}
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box mt={3}>
                  <Alert severity="success" sx={{ mb: 2 }}>✓ Mobile {manualMobile} Verified. Please draw your signature.</Alert>
                  <Typography variant="subtitle2" mb={1}>Draw Signature:</Typography>
                  <Box border="2px dashed #94a3b8" borderRadius={2} bgcolor="#fff" sx={{ cursor: 'crosshair' }}>
                    <SignatureCanvas 
                      ref={sigCanvas} 
                      penColor="black" 
                      canvasProps={{ width: 830, height: 200, className: "sigCanvas" }} 
                    />
                  </Box>
                  <Box mt={2} display="flex" gap={2}>
                    <Button variant="outlined" color="error" onClick={() => sigCanvas.current.clear()}>Clear</Button>
                    <Button variant="contained" color="success" onClick={handleFinalTenantSign} disabled={loading} sx={{ flexGrow: 1 }}>
                      {loading ? <CircularProgress size={24} /> : "Confirm & Apply Digital Signature"}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* CASE 4: NO AGREEMENT EXISTS - SHOW INITIAL FORM */}
          {!existingAgreement && (
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" mb={3} fontWeight="800">Agreement Details Form</Typography>
              <form onSubmit={handleSubmitInitialForm}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}><TextField fullWidth name="full_name" label="Full Name" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="father_name" label="Father's Name" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="mobile" label="Mobile" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="email" label="Email" type="email" required onChange={handleChange} /></Grid>
                  <Grid item xs={12}><TextField fullWidth name="address" label="Permanent Address" multiline rows={2} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="city" label="City" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="state" label="State" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="pincode" label="Pincode" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="aadhaar_last4" label="Aadhaar (Last 4 digits)" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="pan_number" label="PAN Number" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="checkin_date" label="Check-in Date" type="date" InputLabelProps={{ shrink: true }} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="rent" label="Monthly Rent" type="number" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="deposit" label="Security Deposit" type="number" required onChange={handleChange} /></Grid>
                </Grid>
                <Box mt={4} sx={{ p: 3, border: '1px dashed #94a3b8', borderRadius: 2, bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle2" mb={1} fontWeight="bold">Upload Signature (Photo for Draft):</Typography>
                  <Typography variant="caption" display="block" mb={1} color="text.secondary">Upload a clear photo of your signature on white paper.</Typography>
                  <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} required />
                </Box>
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5, fontWeight: 'bold' }} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "SUBMIT FOR REVIEW"}
                </Button>
              </form>
            </Paper>
          )}
        </>
      )}
      <div id="recaptcha-container"></div>
      
      {/* Notifications */}
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" variant="filled">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AgreementForm;