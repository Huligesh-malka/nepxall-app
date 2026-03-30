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
                <Typography variant="h5" color="success.main" mb={2} fontWeight="bold">✅ Agreement Completed</Typography>
                <Typography color="textSecondary" mb={3}>You have successfully verified and signed the agreement.</Typography>
                <Button variant="contained" size="large" onClick={() => window.open(existingAgreement.signed_pdf, "_blank")}>
                  Download Final PDF
                </Button>
              </Paper>
            )}

            {/* 2. APPROVED BY ADMIN BUT NOT YET SIGNED BY OWNER */}
            {existingAgreement?.agreement_status === "approved" && !existingAgreement.signed_pdf && (
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="warning.main" mb={2} fontWeight="bold">⏳ Waiting for Owner Signature</Typography>
                <Typography color="textSecondary">
                  Your details have been approved! We are now waiting for the property owner to sign the document. 
                  Once they sign, you will be able to complete the final verification here.
                </Typography>
                <Box mt={3}>
                    <CircularProgress size={24} sx={{ mb: 1 }} />
                    <Typography variant="body2" display="block">Checking for updates...</Typography>
                </Box>
              </Paper>
            )}

            {/* 3. APPROVED BY OWNER - READY FOR TENANT OTP & SIGN */}
            {existingAgreement?.agreement_status === "approved" && existingAgreement.signed_pdf && (
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" mb={3} fontWeight="bold">Final Step: Verify & Sign</Typography>
                <Typography variant="body2" color="textSecondary" mb={2}>Please review the document signed by the owner before proceeding.</Typography>
                <iframe src={existingAgreement.signed_pdf} width="100%" height="450px" style={{ marginBottom: "20px", border: '1px solid #ddd', borderRadius: '8px' }} title="Agreement" />

                {!isVerified ? (
                  <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle1" mb={2}>Verify identity via <b>+91 {existingAgreement.mobile}</b></Typography>
                    {!confirmObj ? (
                      <Button variant="contained" onClick={sendOtp} disabled={loading} size="large">
                        {loading ? "Sending..." : "Send OTP to Sign"}
                      </Button>
                    ) : (
                      <Box>
                        <TextField 
                          fullWidth label="6-Digit OTP" value={otp} 
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} 
                          sx={{ mb: 2, bgcolor: 'white' }} 
                        />
                        <Button variant="contained" fullWidth onClick={verifyOtp} disabled={loading} size="large">
                          {loading ? "Verifying..." : "Verify OTP"}
                        </Button>
                        {otpTimer > 0 ? (
                          <Typography variant="caption" display="block" mt={1}>Resend available in {otpTimer}s</Typography>
                        ) : (
                          <Button size="small" onClick={sendOtp} sx={{ mt: 1 }}>Resend OTP</Button>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box mt={3}>
                    <Alert severity="success" sx={{ mb: 2 }}>Verification Successful. Please Draw your Signature below.</Alert>
                    <Box border="2px dashed #cbd5e1" borderRadius={2} bgcolor="#fff" overflow="hidden">
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{ width: 740, height: 200, className: "sigCanvas" }}
                      />
                    </Box>
                    <Box mt={2} display="flex" gap={2}>
                      <Button variant="outlined" onClick={() => sigCanvas.current.clear()}>Clear Signature</Button>
                      <Button variant="contained" color="success" onClick={handleFinalTenantSign} disabled={loading}>
                        {loading ? "Saving..." : "Apply Signature & Finish"}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {/* 4. PENDING STATUS (Waiting for Admin Approval) */}
            {existingAgreement?.agreement_status === "pending" && (
              <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="info.main" mb={2} fontWeight="bold">⏳ Under Review</Typography>
                <Typography color="textSecondary">
                  Our team is currently reviewing your agreement details and documents. 
                  You will be notified once the process moves to the next stage.
                </Typography>
              </Paper>
            )}

            {/* 5. INITIAL FORM (Only if record doesn't exist) */}
            {!existingAgreement && (
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" mb={3} fontWeight="bold">Rent Agreement Form</Typography>
                <form onSubmit={handleSubmitInitialForm}>
                  <Box display="grid" gridTemplateColumns={{xs: '1fr', md: '1fr 1fr'}} gap={2}>
                    <TextField name="full_name" label="Full Name" required onChange={handleChange} />
                    <TextField name="mobile" label="Mobile Number" required onChange={handleChange} inputProps={{ maxLength: 10 }} />
                    <TextField name="father_name" label="Father's Name" onChange={handleChange} />
                    <TextField name="email" label="Email Address" type="email" onChange={handleChange} />
                    <TextField name="address" label="Permanent Address" multiline rows={2} sx={{ gridColumn: {md: 'span 2'} }} onChange={handleChange} />
                  </Box>
                  <Typography variant="subtitle2" mt={3} mb={1}>Upload Signature Image (Draft Signature):</Typography>
                  <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} required />
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 4, py: 1.5 }} disabled={loading}>
                    {loading ? "Submitting..." : "Submit Agreement Details"}
                  </Button>
                </form>
              </Paper>
            )}
          </>
        )}

        <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")}>
          <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>
        </Snackbar>
        
        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <div id="recaptcha-container"></div>
      </div>
    </Box>
  );
};

export default AgreementForm;