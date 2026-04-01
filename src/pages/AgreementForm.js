import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper, Grid, Divider, IconButton, 
  FormControlLabel, Checkbox, Container, Stack, Card, CardContent
} from "@mui/material";
import { 
  ArrowBack, Gavel, AssignmentTurnedIn, CloudDownload, 
  VerifiedUser, EditNote, Description, Security 
} from "@mui/icons-material";

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
    aadhaar_last4: "", checkin_date: "",
    agreement_months: "11", rent: "", deposit: "", maintenance: "0",
  });

  /* ================= HELPER: PHONE CLEANER ================= */
  const cleanPhoneNumber = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  /* ================= FETCH STATUS FUNCTION ================= */
  const fetchAgreementStatus = async () => {
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

  useEffect(() => {
    if (bookingId) fetchAgreementStatus();
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
        fetchAgreementStatus(); 
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
        accepted_terms: true 
      });

      if (res.data.success) {
        setSuccess("Agreement finalized! ✅");
        await fetchAgreementStatus(); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Final signing failed.");
    } finally { setLoading(false); }
  };

  /* ================= LEGAL TEXT COMPONENT ================= */
  const LegalDeclaration = () => (
    <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderRadius: 2, border: '1px solid #e0e0e0', mb: 3, maxHeight: '200px', overflowY: 'auto' }}>
      <Typography variant="subtitle2" fontWeight="800" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Gavel fontSize="small" /> LEGAL DECLARATION
      </Typography>
      <Divider sx={{ mb: 1 }} />
      <Typography variant="caption" display="block" sx={{ whiteSpace: 'pre-line', color: '#555', lineHeight: 1.5 }}>
        {`1. Agreement Understanding: I have carefully read and understood all terms.
        2. Factual Accuracy: I confirm all personal details provided are true and correct.
        3. E-Sign Validity: This agreement is executed electronically under the IT Act, 2000.
        4. Identity Authentication: OTP verification serves as valid identity authentication.
        5. Digital Signature Consent: I consent to using my drawn signature as legally valid.
        6. IP & Device Logging: I consent to the logging of my IP address and device information for legal audit trails.
        7. Non-Repudiation: I shall not deny this agreement once digitally signed.
        8. Legal Jurisdiction: Governed by the laws of India and respective state jurisdiction.
        9. Physical Equivalent: This digital agreement holds the same value as a physical one.
        10. Lawful Use: I shall use the property strictly for residential purposes.
        11. Rent Payment: I agree to pay rent on time as per the agreed schedule.
        12. Security Deposit: I understand and agree to security deposit terms.
        13. Maintenance: I shall maintain the property in good condition.
        14. Damage Liability: I am responsible for damages caused by me or my guests.
        15. No Illegal Activities: I shall not engage in illegal activities on premises.
        16. Subletting: I shall not sublet without owner's written permission.
        17. Compliance: I shall follow all society rules and local laws.
        18. Utility Payments: I am responsible for utility bills as agreed.
        19. Identity Proof: I confirm I have provided valid Aadhaar details.
        20. Police Verification: I agree to comply with police verification if required.
        21. Notice Period: I agree to provide prior notice before vacating.
        22. Vacating Condition: I shall return the property in good condition.
        23. Overstay: Staying beyond the period may result in penalties.
        24. Execution: Enforceable under Indian Contract Act, 1872.
        25. Platform Role: Platform is an intermediary only; no liability for disputes.
        26. Acceptance: I accept full legal responsibility for complying with this agreement.`}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      {fetching ? (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
          <CircularProgress thickness={5} size={50} sx={{ mb: 2 }} />
          <Typography color="text.secondary" variant="body2">Loading Secure Document...</Typography>
        </Box>
      ) : (
        <Stack spacing={4}>
          
          {/* CASE 1: COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'success.main', py: 4, textAlign: 'center', color: 'white' }}>
                <AssignmentTurnedIn sx={{ fontSize: 60, mb: 1 }} />
                <Typography variant="h4" fontWeight="800">Finalized!</Typography>
              </Box>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" mb={4}>
                  Your rental agreement is legally active. A secure digital audit trail (IP: {existingAgreement.ip_address || 'Logged'}) has been attached.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button 
                    size="large" variant="contained" color="success" 
                    startIcon={<CloudDownload />}
                    onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}
                    sx={{ borderRadius: 3, px: 4, fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Download Agreement
                  </Button>
                  <Button variant="outlined" sx={{ borderRadius: 3, textTransform: 'none' }} onClick={() => navigate("/my-bookings")}>
                    Back to Bookings
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* CASE 2 & 3: PROGRESS */}
          {(existingAgreement?.agreement_status === "pending" || 
            (existingAgreement?.agreement_status === "approved" && !existingAgreement.signed_pdf)) && (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: 'none', border: '1px solid #eee' }}>
              <CircularProgress size={60} thickness={2} sx={{ mb: 3 }} />
              <Typography variant="h5" fontWeight="800" gutterBottom>Review in Progress</Typography>
              <Typography color="text.secondary">
                The landlord is reviewing your details. You will be notified once the document is ready for your digital signature.
              </Typography>
            </Paper>
          )}

          {/* CASE 4: READY FOR TENANT SIGNATURE */}
          {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
            <Box>
              <Box mb={3} display="flex" alignItems="center" gap={1.5}>
                <VerifiedUser color="primary" />
                <Typography variant="h5" fontWeight="800">Review & Sign Agreement</Typography>
              </Box>

              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
                <iframe 
                  src={`${existingAgreement.signed_pdf}#toolbar=0`} 
                  width="100%" 
                  height="500px" 
                  style={{ border: 'none' }} 
                  title="Agreement Preview" 
                />
              </Card>

              <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 4 }}>
                  {!isVerified ? (
                    <Box>
                       <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                        {confirmObj && (
                            <IconButton onClick={() => setConfirmObj(null)} size="small" sx={{ border: '1px solid #eee' }}>
                                <ArrowBack fontSize="small" />
                            </IconButton>
                        )}
                        <Typography variant="h6" fontWeight="700">Step 1: Identity Verification</Typography>
                      </Stack>
                      
                      <TextField 
                        fullWidth label="Mobile Number" value={manualMobile} 
                        onChange={(e) => setManualMobile(cleanPhoneNumber(e.target.value))}
                        disabled={!!confirmObj || loading}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 'bold' }}>+91</Typography> }}
                        sx={{ mb: 2 }}
                      />

                      {!confirmObj ? (
                        <Button 
                          variant="contained" fullWidth size="large" onClick={sendOtp} 
                          disabled={loading || manualMobile.length < 10}
                          sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold', textTransform: 'none' }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : "Verify via OTP"}
                        </Button>
                      ) : (
                        <Stack spacing={2}>
                          <TextField 
                            fullWidth label="Enter 6-Digit OTP" value={otp} 
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            autoFocus
                          />
                          <Button 
                            variant="contained" color="primary" fullWidth size="large" onClick={verifyOtp} 
                            disabled={loading || otp.length < 6}
                            sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold', textTransform: 'none' }}
                          >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Confirm & Unlock Signature"}
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Alert icon={<Security fontSize="inherit" />} severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                        Identity verified. Please provide your digital signature to finalize.
                      </Alert>
                      
                      <LegalDeclaration />

                      <FormControlLabel
                        control={<Checkbox checked={hasAcceptedTerms} onChange={(e) => setHasAcceptedTerms(e.target.checked)} />}
                        label={<Typography variant="body2">I accept the terms and consent to the digital audit trail.</Typography>}
                        sx={{ mb: 3 }}
                      />

                      <Box sx={{ opacity: hasAcceptedTerms ? 1 : 0.4, transition: '0.3s' }}>
                        <Typography variant="subtitle2" gutterBottom fontWeight="700">DRAW YOUR SIGNATURE</Typography>
                        <Box border="2px dashed #ddd" borderRadius={3} bgcolor="#fff" sx={{ overflow: 'hidden' }}>
                          <SignatureCanvas 
                            ref={sigCanvas} penColor="black" 
                            canvasProps={{ width: 800, height: 180, className: "sigCanvas", style: { width: '100%', height: '180px' } }} 
                          />
                        </Box>
                        <Stack direction="row" spacing={2} mt={3}>
                          <Button variant="text" color="error" onClick={() => sigCanvas.current.clear()} sx={{ fontWeight: 'bold' }}>Clear</Button>
                          <Button 
                            variant="contained" color="success" fullWidth onClick={handleFinalTenantSign} 
                            disabled={loading || !hasAcceptedTerms}
                            sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold', textTransform: 'none' }}
                          >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign & Finalize Agreement"}
                          </Button>
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {/* CASE 5: INITIAL FORM */}
          {!existingAgreement && (
            <Card sx={{ borderRadius: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <Description color="primary" />
                  <Typography variant="h5" fontWeight="800">Agreement Details</Typography>
                </Stack>
                
                <form onSubmit={handleSubmitInitialForm}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={6}><TextField fullWidth variant="outlined" name="full_name" label="Legal Full Name" required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth variant="outlined" name="mobile" label="Mobile Number" required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={8}><TextField fullWidth variant="outlined" name="email" label="Email Address" type="email" required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth variant="outlined" name="aadhaar_last4" label="Aadhaar (Last 4 Digits)" required onChange={handleChange} /></Grid>
                    <Grid item xs={12}><TextField fullWidth variant="outlined" name="address" label="Permanent Address" multiline rows={2} required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth variant="outlined" name="city" label="City" required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth variant="outlined" name="state" label="State" required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth variant="outlined" name="pincode" label="Pincode" required onChange={handleChange} /></Grid>
                    
                    <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary" fontWeight="bold">RENTAL TERMS</Typography></Divider></Grid>
                    
                    <Grid item xs={12} md={4}><TextField fullWidth variant="outlined" name="checkin_date" label="Check-in Date" type="date" InputLabelProps={{ shrink: true }} required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth variant="outlined" name="rent" label="Monthly Rent (₹)" type="number" required onChange={handleChange} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth variant="outlined" name="deposit" label="Security Deposit (₹)" type="number" required onChange={handleChange} /></Grid>
                  </Grid>
                  
                  <Button 
                    type="submit" variant="contained" fullWidth 
                    sx={{ mt: 5, py: 2, borderRadius: 3, fontWeight: 'bold', fontSize: '1rem', textTransform: 'none', boxShadow: '0 4px 14px rgba(25, 118, 210, 0.39)' }} 
                    disabled={loading}
                    startIcon={<EditNote />}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Generate Draft Agreement"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      <div id="recaptcha-container"></div>
      
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
        <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AgreementForm;