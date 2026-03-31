import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper, Grid, Divider, IconButton, 
  FormControlLabel, Checkbox, List, ListItem, ListItemText
} from "@mui/material";
import { ArrowBack, Gavel, AssignmentTurnedIn } from "@mui/icons-material";

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
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", mobile: "", email: "",
    address: "", city: "", state: "", pincode: "",
    aadhaar_last4: "", pan_number: "", checkin_date: "",
    agreement_months: "11", rent: "", deposit: "", maintenance: "0",
  });

  /* ================= HELPER: PHONE CLEANER ================= */
  const cleanPhoneNumber = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  /* ================= FETCH STATUS ================= */
  useEffect(() => {
    const checkStatus = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/agreements-form/status/${bookingId}`);
        if (res.data.exists) {
          setExistingAgreement(res.data.data);
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
    if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  };

  /* ================= OTP FUNCTIONS ================= */
  const sendOtp = async () => {
    if (manualMobile.length < 10) return setError("Enter a valid 10-digit mobile number.");
    setLoading(true);
    try {
      const verifyRes = await api.post("/agreements-form/tenant/verify", {
        booking_id: bookingId,
        mobile: manualMobile
      });
      if (!verifyRes.data.success) throw new Error("Number mismatch.");

      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, `+91${manualMobile}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      setSuccess("OTP sent! ✅");
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter 6-digit OTP");
    setLoading(true);
    try {
      await confirmObj.confirm(otp);
      setIsVerified(true);
      setSuccess("Identity Confirmed! ✅");
    } catch (err) { setError("Invalid OTP code."); }
    finally { setLoading(false); }
  };

  /* ================= FORM ACTIONS ================= */
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmitInitialForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userId = localStorage.getItem("user_id");
    const data = { ...formData, user_id: userId, booking_id: bookingId };

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        setSuccess("Details submitted!");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) { setError("Submission failed."); }
    finally { setLoading(false); }
  };

  const handleFinalTenantSign = async () => {
    if (!hasAcceptedTerms) return setError("You must accept the legal declaration first.");
    if (sigCanvas.current.isEmpty()) return setError("Please draw your signature.");
    
    setLoading(true);
    try {
      const signatureDataURL = sigCanvas.current.toDataURL("image/png");
      const res = await api.post("/agreements-form/tenant/sign", {
        booking_id: bookingId,
        tenant_signature: signatureDataURL,
        tenant_mobile: manualMobile,
        accepted_terms: true // Log acceptance
      });

      if (res.data.success) {
        setSuccess("Agreement finalized! ✅");
        setTimeout(() => navigate("/my-bookings"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Final signing failed.");
    } finally { setLoading(false); }
  };

  /* ================= LEGAL TEXT COMPONENT ================= */
  const LegalDeclaration = () => (
    <Box sx={{ bgcolor: '#fdfdfd', p: 3, borderRadius: 2, border: '1px solid #ddd', mb: 3, maxHeight: '300px', overflowY: 'auto' }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
        <Gavel sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
        TENANT LEGAL DECLARATION & TERMS
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="body2" fontWeight="bold">General Declaration</Typography>
      <Typography variant="caption" display="block" mb={1}>
        1. Understanding: I have reviewed all clauses.<br/>
        2. Accuracy: Personal details provided are true.<br/>
        3. E-Sign Validity: Executed under IT Act, 2000.<br/>
        4. Authentication: OTP serves as valid identity proof.<br/>
        5. Consent: I consent to use my electronic signature.<br/>
        6. Non-Repudiation: I will not deny this agreement once signed.<br/>
        7. Jurisdiction: Governed by Indian Law.<br/>
        8. Physical Equivalent: Digital agreement holds same value as physical.
      </Typography>

      <Typography variant="body2" fontWeight="bold" mt={2}>Tenant Responsibilities</Typography>
      <Typography variant="caption" display="block" mb={1}>
        9. Lawful Use: Residential purposes only.<br/>
        10. Rent: Payment on time as per schedule.<br/>
        11. Deposit: Comply with security deposit terms.<br/>
        12. Maintenance: Maintain property in good condition.<br/>
        13. Damages: Responsible for damages caused by self/guests.<br/>
        14. No Illegal Activities: No unlawful behavior on premises.<br/>
        15. Subletting: No transfer without owner's permission.<br/>
        16. Compliance: Follow society/local building rules.<br/>
        17. Utilities: Pay electricity/water/internet bills.
      </Typography>

      <Typography variant="body2" fontWeight="bold" mt={2}>Legal Obligations & Disclaimer</Typography>
      <Typography variant="caption" display="block" mb={1}>
        18-22. Identity/Verification: Aadhaar/PAN provided; will comply with police verification.<br/>
        23-25. Binding Nature: Enforceable under Indian Contract Act, 1872.<br/>
        26-28. Platform Role: Platform is an intermediary only; no liability for property/payment disputes.<br/>
        29-30. Full Acceptance: I accept full legal responsibility.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: "900px", margin: "30px auto", p: 2 }}>
      {fetching ? (
        <Box textAlign="center" mt={10}><CircularProgress /></Box>
      ) : (
        <>
          {/* CASE 1: COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <AssignmentTurnedIn sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" color="success.main" fontWeight="bold">Agreement Finalized</Typography>
              <Button sx={{ mt: 3 }} variant="contained" color="success" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                Download Signed PDF
              </Button>
            </Paper>
          )}

          {/* CASE 2 & 3: PROGRESS */}
          {(existingAgreement?.agreement_status === "pending" || 
            (existingAgreement?.agreement_status === "approved" && !existingAgreement.signed_pdf)) && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="h5" color="info.main" fontWeight="bold">Processing Document</Typography>
              <Typography mt={2}>We are generating your legal document or waiting for the landlord to approve.</Typography>
            </Paper>
          )}

          {/* CASE 4: READY FOR TENANT SIGNATURE */}
          {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" fontWeight="bold">Review & Digital Signing</Typography>
              <Divider sx={{ my: 2 }} />
              
              <iframe 
                src={`${existingAgreement.signed_pdf}#toolbar=0`} 
                width="100%" 
                height="450px" 
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
                    <Typography variant="subtitle1" fontWeight="bold">Step 1: Identity Verification</Typography>
                  </Box>
                  
                  <TextField 
                    fullWidth label="Registered Mobile" value={manualMobile} 
                    onChange={(e) => setManualMobile(cleanPhoneNumber(e.target.value))}
                    disabled={!!confirmObj || loading}
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>+91</Typography> }}
                    sx={{ mb: 2 }}
                  />

                  {!confirmObj ? (
                    <Button variant="contained" fullWidth onClick={sendOtp} disabled={loading || manualMobile.length < 10}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : "Send OTP"}
                    </Button>
                  ) : (
                    <>
                      <TextField fullWidth label="6-Digit OTP" value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        sx={{ mb: 2 }} autoFocus
                      />
                      <Button variant="contained" color="primary" fullWidth onClick={verifyOtp} disabled={loading || otp.length < 6}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Confirm OTP"}
                      </Button>
                    </>
                  )}
                </Box>
              ) : (
                <Box mt={2}>
                  <Alert severity="success" sx={{ mb: 2 }}>Mobile Verified. Please read and sign.</Alert>
                  
                  <LegalDeclaration />

                  <FormControlLabel
                    control={<Checkbox checked={hasAcceptedTerms} onChange={(e) => setHasAcceptedTerms(e.target.checked)} />}
                    label="I hereby declare that I have read, understood, and agree to all the Terms & Conditions mentioned above."
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ opacity: hasAcceptedTerms ? 1 : 0.5, pointerEvents: hasAcceptedTerms ? 'auto' : 'none' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Draw your signature below:</Typography>
                    <Box border="2px dashed #999" borderRadius={2} bgcolor="#fff">
                      <SignatureCanvas 
                        ref={sigCanvas} penColor="black" 
                        canvasProps={{ width: 830, height: 180, className: "sigCanvas", style: { width: '100%', height: '180px' } }} 
                      />
                    </Box>
                    <Box mt={2} display="flex" gap={2}>
                      <Button variant="outlined" color="error" onClick={() => sigCanvas.current.clear()} sx={{ flex: 1 }}>Clear</Button>
                      <Button variant="contained" color="success" fullWidth onClick={handleFinalTenantSign} disabled={loading || !hasAcceptedTerms} sx={{ flex: 3 }}>
                        {loading ? <CircularProgress size={24} /> : "Finalize & Sign Agreement"}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* CASE 5: INITIAL FORM */}
          {!existingAgreement && (
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" fontWeight="bold" mb={3}>Draft Rental Agreement</Typography>
              <form onSubmit={handleSubmitInitialForm}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><TextField fullWidth name="full_name" label="Full Name" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="mobile" label="Mobile" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="email" label="Email" type="email" required onChange={handleChange} /></Grid>
                  <Grid item xs={12}><TextField fullWidth name="address" label="Current Address" multiline rows={2} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="city" label="City" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="state" label="State" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="pincode" label="Pincode" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="aadhaar_last4" label="Aadhaar (Last 4)" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth name="pan_number" label="PAN" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="checkin_date" label="Check-in Date" type="date" InputLabelProps={{ shrink: true }} required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="rent" label="Monthly Rent" type="number" required onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth name="deposit" label="Security Deposit" type="number" required onChange={handleChange} /></Grid>
                </Grid>
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5 }} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "Submit Details for Review"}
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