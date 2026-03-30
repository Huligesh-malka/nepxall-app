import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper, Grid 
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

  /* ================= RECAPTCHA & TIMER ================= */
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          console.log("Recaptcha resolved");
        }
      });
    }
  };

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  /* ================= OTP FUNCTIONS ================= */
  const sendOtp = async () => {
    // We use the mobile number that was stored in the database during form submission
    const phone = existingAgreement?.mobile;
    if (!phone || phone.length < 10) return setError("Valid phone number not found in record.");

    try {
      setLoading(true);
      setError(null);
      setupRecaptcha();
      
      const appVerifier = window.recaptchaVerifier;
      const formatPh = `+91${phone}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formatPh, appVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent successfully!");
    } catch (err) {
      console.error("SMS Error:", err);
      setError("Failed to send OTP. Try again later.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
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
      setSuccess("Identity Verified!");
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
    if (!userId) return setError("Session expired. Please login again.");
    if (!signatureFile) return setError("Please upload your draft signature photo.");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        setSuccess("Details submitted successfully!");
        setTimeout(() => window.location.reload(), 1500);
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
        // Passing the mobile from database to ensure consistency in the stamped PDF
        tenant_mobile: existingAgreement.mobile 
      });

      if (res.data.success) {
        setSuccess("Agreement signed and completed!");
        setTimeout(() => navigate("/my-bookings"), 2000);
      }
    } catch (err) {
      setError("Failed to process signature. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "900px", margin: "auto", p: { xs: 2, md: 4 } }}>
      {fetching ? (
        <Box textAlign="center" mt={10}><CircularProgress /></Box>
      ) : (
        <>
          {/* 1. COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
              <Typography variant="h4" color="success.main" gutterBottom fontWeight="bold">Agreement Completed</Typography>
              <Typography variant="body1" mb={4}>Your signed agreement is ready for download.</Typography>
              <Button variant="contained" size="large" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                View / Download PDF
              </Button>
            </Paper>
          )}

          {/* 2. APPROVED BY ADMIN - WAITING FOR OWNER */}
          {existingAgreement?.agreement_status === "approved" && !existingAgreement.signed_pdf && (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
              <Typography variant="h5" color="warning.main" fontWeight="bold">Waiting for Owner Signature</Typography>
              <Typography mt={2}>We have approved your details. The property owner will sign shortly.</Typography>
              <Box mt={4}><CircularProgress size={30} /></Box>
            </Paper>
          )}

          {/* 3. READY FOR FINAL TENANT SIGN */}
          {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
            <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h5" mb={3} fontWeight="bold">Final Review & Verification</Typography>
              
              <Box sx={{ width: '100%', height: '500px', border: '1px solid #ddd', mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                 <iframe src={existingAgreement.signed_pdf} width="100%" height="100%" title="Owner Signed Agreement" />
              </Box>

              {!isVerified ? (
                <Box sx={{ bgcolor: '#f0f4f8', p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" gutterBottom>Verify Mobile to Sign</Typography>
                  <Typography variant="body2" mb={2}>An OTP will be sent to <b>+91 {existingAgreement.mobile}</b></Typography>
                  
                  {!confirmObj ? (
                    <Button variant="contained" onClick={sendOtp} disabled={loading}>
                      {loading ? "Processing..." : "Send OTP"}
                    </Button>
                  ) : (
                    <Box>
                      <TextField 
                        label="6-Digit OTP" 
                        fullWidth 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        sx={{ mb: 2, bgcolor: 'white' }}
                      />
                      <Button variant="contained" fullWidth onClick={verifyOtp} disabled={loading}>
                        Verify OTP
                      </Button>
                      {otpTimer > 0 ? (
                        <Typography variant="caption" mt={1} display="block">Resend in {otpTimer}s</Typography>
                      ) : (
                        <Button size="small" onClick={sendOtp} sx={{ mt: 1 }}>Resend OTP</Button>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>Draw your Signature</Typography>
                  <Box border="2px dashed #94a3b8" borderRadius={2} bgcolor="#fff">
                    <SignatureCanvas
                      ref={sigCanvas}
                      penColor="black"
                      canvasProps={{ width: 750, height: 200, className: "sigCanvas" }}
                    />
                  </Box>
                  <Box mt={2} display="flex" gap={2}>
                    <Button variant="outlined" onClick={() => sigCanvas.current.clear()}>Clear</Button>
                    <Button variant="contained" color="success" onClick={handleFinalTenantSign} disabled={loading}>
                      {loading ? "Processing..." : "Finish & Save Agreement"}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* 4. PENDING ADMIN APPROVAL */}
          {existingAgreement?.agreement_status === "pending" && (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
              <Typography variant="h5" color="primary" fontWeight="bold">Details Under Review</Typography>
              <Typography mt={2}>The admin is checking your documents. Check back soon!</Typography>
            </Paper>
          )}

          {/* 5. INITIAL FORM SUBMISSION */}
          {!existingAgreement && (
            <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h5" mb={4} fontWeight="bold">Rent Agreement Details</Typography>
              <form onSubmit={handleSubmitInitialForm}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="full_name" label="Full Name (as per Aadhaar)" required onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="mobile" label="Mobile Number" required onChange={handleChange} inputProps={{ maxLength: 10 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="father_name" label="Father's Name" required onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="email" label="Email Address" type="email" onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth name="address" label="Permanent Address" multiline rows={2} onChange={handleChange} required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth name="city" label="City" onChange={handleChange} required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth name="state" label="State" onChange={handleChange} required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth name="pincode" label="Pincode" onChange={handleChange} required />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="aadhaar_last4" label="Last 4 Digits of Aadhaar" onChange={handleChange} inputProps={{ maxLength: 4 }} required />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="pan_number" label="PAN Number" onChange={handleChange} />
                  </Grid>
                </Grid>

                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>Upload Photo of your Signature (For Draft):</Typography>
                  <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} required />
                </Box>

                <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5 }} disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Submit for Approval"}
                </Button>
              </form>
            </Paper>
          )}
        </>
      )}

      {/* RECAPTCHA HIDDEN CONTAINER */}
      <div id="recaptcha-container"></div>

      {/* FEEDBACK */}
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
        <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AgreementForm;