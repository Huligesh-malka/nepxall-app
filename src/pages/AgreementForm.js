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

  // OTP & Manual Mobile States
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
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible"
      });
    }
  };

  /* ================= OTP FUNCTIONS ================= */
  const sendOtp = async () => {
    if (manualMobile.length !== 10) return setError("Please enter a valid 10-digit mobile number.");
    try {
      setLoading(true);
      setError(null);
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
    if (!userId) return setError("Session expired");
    if (!signatureFile) return setError("Initial signature photo required");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);
    data.append("signature", signatureFile);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        alert("Form submitted successfully!");
        window.location.reload();
      }
    } catch (err) {
      setError("Error saving agreement");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalTenantSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return setError("Please draw signature");
    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.toDataURL("image/png");
      const res = await api.post("/agreements-form/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
        tenant_mobile: manualMobile 
      });
      if (res.data.success) {
        alert("✅ Agreement signed successfully!");
        navigate("/my-bookings");
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
          {/* 1. COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" color="success.main" mb={2} fontWeight="bold">✅ Agreement Completed</Typography>
              <Button variant="contained" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>Download Final PDF</Button>
            </Paper>
          )}

          {/* 2. WAITING FOR OWNER/ADMIN */}
          {existingAgreement?.agreement_status === "pending" && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" color="info.main" fontWeight="bold">⏳ Under Review</Typography>
              <Typography mt={1}>We are checking your documents. Once approved, you can sign the final agreement.</Typography>
            </Paper>
          )}

          {/* 3. SIGNING AREA */}
          {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" mb={2} fontWeight="bold">Final Step: Digital Signature</Typography>
              <iframe src={existingAgreement.signed_pdf} width="100%" height="500px" style={{ marginBottom: "20px", borderRadius: '8px', border: '1px solid #ddd' }} title="Agreement" />
              {!isVerified ? (
                <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle1" mb={2} fontWeight="bold">Verify Mobile for Digital Stamp</Typography>
                  <TextField fullWidth label="Enter Mobile Number" value={manualMobile} onChange={(e) => setManualMobile(e.target.value.replace(/\D/g, ""))} disabled={!!confirmObj} sx={{ mb: 2, bgcolor: 'white' }} inputProps={{ maxLength: 10 }} />
                  {!confirmObj ? (
                    <Button variant="contained" fullWidth onClick={sendOtp} disabled={loading || manualMobile.length !== 10}>Send OTP</Button>
                  ) : (
                    <Box>
                      <TextField fullWidth label="Enter 6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} sx={{ mb: 2, bgcolor: 'white' }} inputProps={{ maxLength: 6 }} />
                      <Button variant="contained" fullWidth onClick={verifyOtp} disabled={loading}>Verify & Unlock Signature</Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box mt={3}>
                  <Alert severity="success" sx={{ mb: 2 }}>Verified: {manualMobile}. Draw your signature below.</Alert>
                  <Box border="2px dashed #ccc" borderRadius={2} bgcolor="#fff"><SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ width: 830, height: 200, className: "sigCanvas" }} /></Box>
                  <Box mt={2} display="flex" gap={2}>
                    <Button variant="outlined" onClick={() => sigCanvas.current.clear()}>Clear</Button>
                    <Button variant="contained" color="success" onClick={handleFinalTenantSign} disabled={loading}>Apply Signature & Finish</Button>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* 4. INITIAL FORM - FULL FIELDS */}
          {!existingAgreement && (
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h5" mb={3} fontWeight="bold" color="primary">Agreement Details Form</Typography>
              <form onSubmit={handleSubmitInitialForm}>
                <Grid container spacing={3}>
                  {/* Section: Personal Info */}
                  <Grid item xs={12}><Typography variant="button" color="textSecondary">1. Personal Information</Typography><Divider /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="full_name" label="Full Name (As per Aadhaar)" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="father_name" label="Father's Name" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="mobile" label="Mobile Number" required onChange={handleChange} inputProps={{ maxLength: 10 }} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="email" label="Email Address" type="email" required onChange={handleChange} /></Grid>
                  
                  {/* Section: Address Info */}
                  <Grid item xs={12} mt={2}><Typography variant="button" color="textSecondary">2. Permanent Address</Typography><Divider /></Grid>
                  <Grid item xs={12}><TextField fullWidth name="address" label="Full House Address" multiline rows={2} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="city" label="City" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="state" label="State" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="pincode" label="Pincode" required onChange={handleChange} /></Grid>

                  {/* Section: Identity Info */}
                  <Grid item xs={12} mt={2}><Typography variant="button" color="textSecondary">3. Identity Details</Typography><Divider /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="aadhaar_last4" label="Aadhaar Number (Last 4 digits)" required onChange={handleChange} inputProps={{ maxLength: 4 }} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="pan_number" label="PAN Card Number" required onChange={handleChange} /></Grid>

                  {/* Section: Agreement Info */}
                  <Grid item xs={12} mt={2}><Typography variant="button" color="textSecondary">4. Rental Details</Typography><Divider /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="checkin_date" label="Check-in Date" type="date" InputLabelProps={{ shrink: true }} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="rent" label="Monthly Rent" type="number" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="deposit" label="Security Deposit" type="number" required onChange={handleChange} /></Grid>
                </Grid>

                <Box mt={4} sx={{ p: 3, border: '1px dashed #90caf9', borderRadius: 2, bgcolor: '#e3f2fd' }}>
                  <Typography variant="subtitle2" mb={1} fontWeight="bold">Upload Draft Signature (Photo):</Typography>
                  <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} required />
                  <Typography variant="caption" display="block" mt={1}>Take a clear photo of your signature on white paper.</Typography>
                </Box>

                <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5, fontSize: '1.1rem' }} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "SUBMIT FORM FOR REVIEW"}
                </Button>
              </form>
            </Paper>
          )}
        </>
      )}
      <div id="recaptcha-container"></div>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")}><Alert severity="success">{success}</Alert></Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError(null)}><Alert severity="error">{error}</Alert></Snackbar>
    </Box>
  );
};

export default AgreementForm;