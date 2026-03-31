import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper, Grid, Divider, IconButton
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

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

  const [formData, setFormData] = useState({
    full_name: "", mobile: "", email: "",
    address: "", city: "", state: "", pincode: "",
    aadhaar_last4: "", pan_number: "", checkin_date: "",
    agreement_months: "11", rent: "", deposit: "", maintenance: "0",
  });

  /* ================= HELPER: PHONE CLEANER ================= */
  const cleanPhoneNumber = (phone) => {
    if (!phone) return "";
    // Removes all non-digits and takes the last 10 numbers
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  /* ================= FETCH STATUS & REGISTRATION DATA ================= */
  useEffect(() => {
    const checkStatus = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
          
          // Clean the incoming phone number to remove redundant +91+91
          const rawPhone = res.data.data.registered_phone || res.data.data.mobile || "";
          setManualMobile(cleanPhoneNumber(rawPhone));
        }
      } catch (err) {
        setError("Server error. Please refresh the page.");
      } finally {
        setFetching(false);
      }
    };
    if (bookingId) checkStatus();
  }, [bookingId]);

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
    if (manualMobile.length < 10) return setError("Enter a valid 10-digit mobile number.");
    
    setLoading(true);
    try {
      // Backend check against user table
      const verifyRes = await api.post("/agreements-form/tenant/verify", {
        booking_id: bookingId,
        mobile: manualMobile
      });

      if (!verifyRes.data.success) {
        throw new Error("This number does not match your registered account.");
      }

      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // We add the prefix back just for the Firebase call
      const confirmation = await signInWithPhoneNumber(auth, `+91${manualMobile}`, appVerifier);
      
      setConfirmObj(confirmation);
      setSuccess("Account Verified. OTP sent! ✅");
    } catch (err) {
      console.error("OTP Error:", err);
      const msg = err.response?.data?.message || err.message || "Verification failed.";
      setError(msg);
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
      setSuccess("Identity Confirmed! ✅");
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
    const userId = localStorage.getItem("user_id");

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("user_id", userId);
    data.append("booking_id", bookingId);

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        setSuccess("Details submitted!");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      setError("Submission failed.");
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
        setSuccess("Agreement finalized! ✅");
        setTimeout(() => navigate("/my-bookings"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Final signing failed.");
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
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <Typography variant="h5" color="success.main" fontWeight="bold">✅ Agreement Finalized</Typography>
              <Button sx={{ mt: 3 }} variant="contained" color="success" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                Download PDF
              </Button>
            </Paper>
          )}

          {/* CASE 2 & 3: PROGRESS STATES */}
          {(existingAgreement?.agreement_status === "pending" || 
            (existingAgreement?.agreement_status === "approved" && !existingAgreement.signed_pdf)) && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" color="info.main" fontWeight="bold">⏳ Processing</Typography>
              <Typography mt={2}>We are preparing your document or waiting for the owner's signature.</Typography>
            </Paper>
          )}

          {/* CASE 4: READY FOR TENANT SIGNATURE */}
          {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" fontWeight="bold">Digital Signing</Typography>
              <Divider sx={{ my: 2 }} />
              
              <iframe 
                src={`${existingAgreement.signed_pdf}#toolbar=0`} 
                width="100%" 
                height="500px" 
                style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }} 
                title="Agreement Preview" 
              />

              {!isVerified ? (
                <Box sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #eee' }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    {confirmObj && (
                        <IconButton size="small" onClick={() => setConfirmObj(null)} sx={{ mr: 1 }}>
                            <ArrowBack fontSize="small" />
                        </IconButton>
                    )}
                    <Typography variant="subtitle1" fontWeight="bold">Verify Account Mobile</Typography>
                  </Box>
                  
                  <TextField 
                    fullWidth 
                    label="Registered Mobile Number" 
                    value={manualMobile} 
                    onChange={(e) => setManualMobile(cleanPhoneNumber(e.target.value))}
                    disabled={!!confirmObj || loading}
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>+91</Typography> }}
                    sx={{ mb: 2 }}
                    helperText="OTP will be sent to your registered 10-digit number."
                  />

                  {!confirmObj ? (
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={sendOtp} 
                      disabled={loading || manualMobile.length < 10}
                      sx={{ py: 1.2 }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : "Send OTP"}
                    </Button>
                  ) : (
                    <>
                      <TextField 
                        fullWidth 
                        label="6-Digit OTP" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        sx={{ mb: 2 }}
                        autoFocus
                      />
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        onClick={verifyOtp} 
                        disabled={loading || otp.length < 6}
                        sx={{ py: 1.2 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Confirm OTP"}
                      </Button>
                    </>
                  )}
                </Box>
              ) : (
                <Box mt={2}>
                  <Alert severity="success" sx={{ mb: 2 }}>Verified! Please sign below.</Alert>
                  <Box border="2px dashed #999" borderRadius={2} bgcolor="#fff">
                    <SignatureCanvas 
                      ref={sigCanvas} 
                      penColor="black" 
                      canvasProps={{ 
                        width: 830, 
                        height: 200, 
                        className: "sigCanvas",
                        style: { width: '100%', height: '200px' }
                      }} 
                    />
                  </Box>
                  <Box mt={2} display="flex" gap={2}>
                    <Button variant="outlined" color="error" onClick={() => sigCanvas.current.clear()} sx={{ flex: 1 }}>Clear</Button>
                    <Button variant="contained" color="success" fullWidth onClick={handleFinalTenantSign} disabled={loading} sx={{ flex: 3 }}>
                      {loading ? <CircularProgress size={24} /> : "Apply Signature & Finish"}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* CASE 5: INITIAL FORM */}
          {!existingAgreement && (
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" fontWeight="bold" mb={3}>Agreement Details</Typography>
              <form onSubmit={handleSubmitInitialForm}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><TextField fullWidth name="full_name" label="Full Name" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="mobile" label="Mobile" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="email" label="Email" type="email" required onChange={handleChange} /></Grid>
                  <Grid item xs={12}><TextField fullWidth name="address" label="Address" multiline rows={2} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="city" label="City" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="state" label="State" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="pincode" label="Pincode" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="aadhaar_last4" label="Aadhaar (Last 4)" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="pan_number" label="PAN" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="checkin_date" label="Check-in" type="date" InputLabelProps={{ shrink: true }} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="rent" label="Rent" type="number" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="deposit" label="Deposit" type="number" required onChange={handleChange} /></Grid>
                </Grid>
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5 }} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "Submit Details"}
                </Button>
              </form>
            </Paper>
          )}
        </>
      )}
      <div id="recaptcha-container"></div>
      
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AgreementForm;