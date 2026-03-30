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
    full_name: "", mobile: "", email: "",
    address: "", city: "", state: "", pincode: "",
    aadhaar_last4: "", pan_number: "", checkin_date: "",
    agreement_months: "11", rent: "", deposit: "", maintenance: "0",
  });

  /* ================= FETCH STATUS ================= */
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
        setError("Server error. Please refresh the page.");
      } finally {
        setFetching(false);
      }
    };
    if (bookingId) checkStatus();
  }, [bookingId]);

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  };

  /* ================= OTP FUNCTIONS ================= */
  const sendOtp = async () => {
    if (manualMobile.length !== 10) return setError("Enter a valid 10-digit mobile number.");
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, `+91${manualMobile}`, appVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent successfully!");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter 6-digit OTP");
    setLoading(true);
    try {
      await confirmObj.confirm(otp);
      setIsVerified(true);
      setSuccess("Mobile Verified! You can now sign.");
    } catch (err) {
      setError("Invalid OTP. Please try again.");
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
    const userId = localStorage.getItem("user_id");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        setSuccess("Submitted! Please wait for Admin approval.");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      setError("Submission failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalTenantSign = async () => {
    if (sigCanvas.current.isEmpty()) return setError("Please draw your signature.");
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
        setTimeout(() => navigate("/my-bookings"), 2000);
      }
    } catch (err) {
      setError("Failed to save digital signature.");
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
          {/* CASE 1: COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" color="success.main" fontWeight="bold">✅ Agreement Finalized</Typography>
              <Typography mt={1} mb={3}>Both parties have digitally signed the document.</Typography>
              <Button variant="contained" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                View / Download Final PDF
              </Button>
            </Paper>
          )}

          {/* CASE 2: PENDING ADMIN UPLOAD */}
          {existingAgreement?.agreement_status === "pending" && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" color="info.main" fontWeight="bold">⏳ Review in Progress</Typography>
              <Typography mt={2}>Admin is preparing your draft. You will be notified once it's ready for signing.</Typography>
            </Paper>
          )}

          {/* CASE 3: ADMIN UPLOADED BUT OWNER HASN'T SIGNED YET */}
          {existingAgreement?.agreement_status === "approved" && !existingAgreement.signed_pdf && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" color="warning.main" fontWeight="bold">⏳ Waiting for Owner's Signature</Typography>
              <Typography mt={2}>The draft is ready. We are currently getting the document signed by the owner.</Typography>
            </Paper>
          )}

          {/* CASE 4: OWNER SIGNED - TENANT'S TURN */}
          {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" fontWeight="bold">Final Step: Sign Your Agreement</Typography>
              <Divider sx={{ my: 2 }} />
              
              <iframe 
                src={`${existingAgreement.signed_pdf}#toolbar=0`} 
                width="100%" 
                height="500px" 
                style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }} 
                title="Preview" 
              />

              {!isVerified ? (
                <Box sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>Verify Identity via OTP</Typography>
                  <TextField 
                    fullWidth 
                    label="Mobile Number" 
                    value={manualMobile} 
                    onChange={(e) => setManualMobile(e.target.value.replace(/\D/g, ""))}
                    disabled={!!confirmObj}
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>+91</Typography> }}
                    sx={{ mb: 2 }}
                  />
                  {!confirmObj ? (
                    <Button variant="contained" fullWidth onClick={sendOtp} disabled={loading || manualMobile.length !== 10}>
                      {loading ? <CircularProgress size={24} /> : "Send OTP"}
                    </Button>
                  ) : (
                    <>
                      <TextField 
                        fullWidth 
                        label="Enter 6-Digit OTP" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        sx={{ mb: 2 }}
                      />
                      <Button variant="contained" color="secondary" fullWidth onClick={verifyOtp} disabled={loading || otp.length < 6}>
                        {loading ? <CircularProgress size={24} /> : "Verify OTP"}
                      </Button>
                    </>
                  )}
                </Box>
              ) : (
                <Box mt={2}>
                  <Alert severity="success" sx={{ mb: 2 }}>Identity Verified. Please sign below.</Alert>
                  <Box border="2px dashed #ccc" borderRadius={2} bgcolor="#fff">
                    <SignatureCanvas 
                      ref={sigCanvas} 
                      penColor="black" 
                      canvasProps={{ width: 830, height: 200, className: "sigCanvas" }} 
                    />
                  </Box>
                  <Box mt={2} display="flex" gap={2}>
                    <Button variant="outlined" color="error" onClick={() => sigCanvas.current.clear()}>Clear</Button>
                    <Button variant="contained" color="success" fullWidth onClick={handleFinalTenantSign} disabled={loading}>
                      {loading ? <CircularProgress size={24} /> : "Apply Digital Signature & Finish"}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* CASE 5: NEW FORM */}
          {!existingAgreement && (
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" fontWeight="bold" mb={3}>Agreement Details Form</Typography>
              <form onSubmit={handleSubmitInitialForm}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><TextField fullWidth name="full_name" label="Full Name" required onChange={handleChange} /></Grid>
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
                
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1.5 }} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "Submit Details for Review"}
                </Button>
              </form>
            </Paper>
          )}
        </>
      )}
      <div id="recaptcha-container"></div>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}><Alert severity="success">{success}</Alert></Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}><Alert severity="error">{error}</Alert></Snackbar>
    </Box>
  );
};

export default AgreementForm;