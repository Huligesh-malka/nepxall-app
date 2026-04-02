import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import SignatureCanvas from "react-signature-canvas";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { 
  Box, TextField, Button, Typography, CircularProgress, 
  Alert, Snackbar, Paper, Grid, Divider, IconButton, 
  FormControlLabel, Checkbox
} from "@mui/material";
import { ArrowBack, Gavel, AssignmentTurnedIn, CloudDownload } from "@mui/icons-material";

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
    full_name: "", 
    mobile: "", 
    address: "", 
    city: "", 
    state: "", 
    pincode: "",
    aadhaar_last4: "",
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
      // Even if res.data.exists is false, the backend might send partial booking info
      setExistingAgreement(res.data.data || null);
      
      if (res.data.exists) {
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "aadhaar_last4") {
      const onlyNums = value.replace(/\D/g, "");
      if (onlyNums.length <= 4) {
        setFormData({ ...formData, [name]: onlyNums });
      }
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitInitialForm = async (e) => {
    e.preventDefault();
    if (formData.aadhaar_last4.length !== 4) {
        return setError("Aadhaar must be exactly 4 digits.");
    }
    setLoading(true);
    
    const userId = localStorage.getItem("user_id");

    // FIX: Include missing database fields from existingAgreement
    const data = { 
      ...formData, 
      user_id: userId, 
      booking_id: bookingId,
      // Fallback values from the booking if the user didn't enter them
      checkin_date: existingAgreement?.checkin_date || null,
      rent: existingAgreement?.rent || 0,
      deposit: existingAgreement?.deposit || 0,
      agreement_months: existingAgreement?.agreement_months || 11,
      maintenance: existingAgreement?.maintenance || 0
    };

    try {
      const res = await api.post("/agreements-form/submit", data);
      if (res.data.success) {
        setSuccess("Details submitted!");
        fetchAgreementStatus(); 
      }
    } catch (err) { 
      const msg = err.response?.data?.message || "Submission failed.";
      setError(msg); 
    }
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
    <Box sx={{ bgcolor: '#fdfdfd', p: 3, borderRadius: 2, border: '1px solid #ddd', mb: 3, maxHeight: '250px', overflowY: 'auto' }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
        <Gavel sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
        TENANT LEGAL DECLARATION & TERMS
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="caption" display="block" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
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
        19. Identity Proof: I confirm I have provided valid Aadhaar/PAN.
        20. Police Verification: I agree to comply with police verification if required.
        21. Notice Period: I agree to provide prior notice before vacating.
        22. Vacating Condition: I shall return the property in good condition.
        23. Overstay: Staying beyond the period may result in penalties.
        24. Execution: Enforceable under Indian Contract Act, 1872.
        25. Platform Role: Platform is an intermediary only; no liability for disputes.
        26. Agreement Duration: This agreement is valid for 11 (Eleven) months from the date of execution.
        27. Acceptance: I accept full legal responsibility for complying with this agreement.`}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: "700px", margin: "30px auto", p: 2 }}>
      {fetching ? (
        <Box textAlign="center" mt={10}><CircularProgress /></Box>
      ) : (
        <>
          {/* CASE 1: COMPLETED */}
          {existingAgreement?.agreement_status === "completed" && (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '2px solid #4caf50', bgcolor: '#f8fff8' }}>
              <AssignmentTurnedIn sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" color="success.main" fontWeight="bold" gutterBottom>
                Agreement Finalized!
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>
                Your rental agreement has been digitally signed and stored with your IP/Device audit trail.
              </Typography>
              <Button 
                size="large"
                variant="contained" 
                color="success" 
                startIcon={<CloudDownload />}
                onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}
                sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              >
                Download Signed PDF
              </Button>
              <Box mt={4}>
                <Button variant="text" color="primary" onClick={() => navigate("/my-bookings")}>
                  Go to My Bookings
                </Button>
              </Box>
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
              <Typography variant="h6" fontWeight="bold">Step 2: Review & Finalize Signature</Typography>
              <Typography variant="caption" color="text.secondary">Your IP address and device info will be logged for legal validity.</Typography>
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
                    <Typography variant="subtitle1" fontWeight="bold">Identity Verification</Typography>
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
                  <Alert severity="success" sx={{ mb: 2 }}>Verification Successful! Please sign below.</Alert>
                  
                  <LegalDeclaration />

                  <FormControlLabel
                    control={<Checkbox checked={hasAcceptedTerms} onChange={(e) => setHasAcceptedTerms(e.target.checked)} />}
                    label="I agree to the terms and conditions and consent to electronic logging of my signature details."
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ opacity: hasAcceptedTerms ? 1 : 0.5, pointerEvents: hasAcceptedTerms ? 'auto' : 'none' }}>
                    <Box border="2px dashed #ccc" borderRadius={2} bgcolor="#fff">
                      <SignatureCanvas 
                        ref={sigCanvas} penColor="black" 
                        canvasProps={{ width: 830, height: 180, className: "sigCanvas", style: { width: '100%', height: '180px' } }} 
                      />
                    </Box>
                    <Box mt={2} display="flex" gap={2}>
                      <Button variant="outlined" color="error" onClick={() => sigCanvas.current.clear()} sx={{ flex: 1 }}>Clear</Button>
                      <Button variant="contained" color="success" fullWidth onClick={handleFinalTenantSign} disabled={loading || !hasAcceptedTerms} sx={{ flex: 3 }}>
                        {loading ? <CircularProgress size={24} /> : "Apply Signature & Finalize"}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* CASE 5: INITIAL FORM */}
          {(!existingAgreement || existingAgreement?.agreement_status === null) && (
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" fontWeight="bold" mb={3}>Draft Rental Agreement</Typography>
              <form onSubmit={handleSubmitInitialForm}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField fullWidth name="full_name" label="Full Name" required onChange={handleChange} value={formData.full_name} />
                  <TextField fullWidth name="mobile" label="Mobile" required onChange={handleChange} value={formData.mobile} />
                  <TextField fullWidth name="address" label="Current Address" multiline rows={2} required onChange={handleChange} value={formData.address} />
                  <TextField fullWidth name="city" label="City" required onChange={handleChange} value={formData.city} />
                  <TextField fullWidth name="state" label="State" required onChange={handleChange} value={formData.state} />
                  <TextField fullWidth name="pincode" label="Pincode" required onChange={handleChange} value={formData.pincode} />
                  <TextField 
                    fullWidth 
                    name="aadhaar_last4" 
                    label="Aadhaar (Last 4 Digits Only)" 
                    required 
                    onChange={handleChange} 
                    value={formData.aadhaar_last4}
                    helperText={`${formData.aadhaar_last4.length}/4 digits`}
                  />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Submit Details for Review"}
                  </Button>
                </Box>
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