import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Divider
} from "@mui/material";
import { Refresh, CheckCircle, Lock, Edit } from "@mui/icons-material";
import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Step Management
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const sigCanvas = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSign = (item) => {
    setSelectedBooking(item);
    setStep(1);
    setAgreed(false);
    setMobile("");
    setOtp("");
    setConfirmObj(null);
    setOtpVerified(false);
    setOpenSignModal(true);
  };

  /* ================= OTP LOGIC ================= */
  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Enter valid 10-digit mobile");
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, `+91${mobile}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      alert("OTP Sent to +91 " + mobile);
    } catch (err) {
      alert("Failed to send OTP. Try again.");
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmObj.confirm(otp);
      setOtpVerified(true);
      setStep(3); // Move to Signature only after verification
    } catch {
      alert("Invalid OTP. Please check again.");
    }
  };

  /* ================= FINAL SUBMISSION ================= */
  const handleSubmit = async () => {
    if (sigCanvas.current.isEmpty()) return alert("Please provide your signature");

    const signature = sigCanvas.current.getCanvas().toDataURL("image/png");

    try {
      setIsSubmitting(true);
      await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true,
        otp_verified: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Agreement Signed Successfully ✅");
      setOpenSignModal(false);
      fetchPayments();
    } catch {
      alert("Submission failed. Please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center">
        <Typography variant="h5" fontWeight="900" color="primary">
          Owner Settlement Dashboard
        </Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="contained" disableElevation>
          Refresh Data
        </Button>
      </Box>

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell><b>Booking ID</b></TableCell>
              <TableCell><b>Tenant</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
              <TableCell align="center"><b>Status & Action</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(item => (
              <TableRow key={item.booking_id} hover>
                <TableCell>#{item.booking_id}</TableCell>
                <TableCell>{item.tenant_name}</TableCell>
                <TableCell>₹{item.owner_amount}</TableCell>
                <TableCell align="center">
                  {item.signed_pdf ? (
                    <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle />}>
                      Completed
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="warning" 
                      size="small"
                      onClick={() => handleOpenSign(item)}
                    >
                      Process & Sign
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* STEP-BASED MODAL */}
      <Modal open={openSignModal} onClose={() => !isSubmitting && setOpenSignModal(false)}>
        <Fade in={openSignModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper', borderRadius: 4, p: 4, boxShadow: 24
          }}>
            
            {/* Step Header */}
            <Box display="flex" justifyContent="space-around" mb={3}>
              {[1, 2, 3].map((s) => (
                <Box key={s} sx={{ textAlign: 'center', opacity: step === s ? 1 : 0.4 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%', bgcolor: step >= s ? 'primary.main' : 'grey.400',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5, mx: 'auto'
                  }}>
                    {step > s ? <CheckCircle fontSize="small" /> : s}
                  </Box>
                  <Typography variant="caption" fontWeight="bold">
                    {s === 1 ? "Consent" : s === 2 ? "Verify" : "Sign"}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* STEP 1: CONSENT */}
            {step === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Digital Agreement Consent</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  By proceeding, you agree to the terms of the rental agreement and authorize the use of your digital signature for this transaction.
                </Typography>
                <Box display="flex" alignItems="center" mb={3}>
                  <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <Typography variant="body2">I accept all terms and conditions.</Typography>
                </Box>
                <Button fullWidth variant="contained" disabled={!agreed} onClick={() => setStep(2)}>
                  Continue to Verification
                </Button>
              </Box>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>Owner Verification</Typography>
                <TextField 
                  fullWidth label="Registered Mobile Number" 
                  variant="outlined" margin="normal"
                  value={mobile} onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  disabled={!!confirmObj}
                />
                
                {!confirmObj ? (
                  <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={sendOtp}>
                    Send OTP
                  </Button>
                ) : (
                  <>
                    <TextField 
                      fullWidth label="Enter 6-digit OTP" 
                      variant="outlined" margin="normal"
                      value={otp} onChange={(e) => setOtp(e.target.value)}
                    />
                    <Button fullWidth variant="contained" color="success" sx={{ mt: 1 }} onClick={verifyOtp}>
                      Verify & Proceed
                    </Button>
                  </>
                )}
                <div id="recaptcha-container" style={{ marginTop: '10px' }}></div>
              </Box>
            )}

            {/* STEP 3: SIGNATURE */}
            {step === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>Draw Your Signature</Typography>
                <Box sx={{ border: "1px solid #ddd", borderRadius: 2, overflow: "hidden", mb: 2 }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      width: 335,
                      height: 180,
                      className: "sigCanvas",
                      style: { background: "#fafafa" }
                    }}
                  />
                </Box>
                <Box display="flex" gap={2}>
                  <Button fullWidth variant="outlined" onClick={() => sigCanvas.current.clear()}>
                    Clear
                  </Button>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : "Finalize & Sign"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}