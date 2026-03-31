import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton
} from "@mui/material";
import { Refresh, ArrowBack } from "@mui/icons-material";

import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Flow State
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [step, setStep] = useState(1);
  
  // Form State
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

  // Fix: Clear canvas only when step 3 is reached to avoid "stale" drawings
  useEffect(() => {
    if (step === 3 && openSignModal) {
      const timer = setTimeout(() => {
        sigCanvas.current?.clear();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, openSignModal]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch payments ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async (bookingId, filePath) => {
    try {
      await axios.post(`${API}/agreements/viewed`, { booking_id: bookingId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.open(filePath, "_blank");
      fetchPayments();
    } catch (err) {
      window.open(filePath, "_blank");
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

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Enter valid 10-digit mobile");

    try {
      setIsSubmitting(true);
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${mobile}`,
        window.recaptchaVerifier
      );

      setConfirmObj(confirmation);
      alert("OTP Sent ✅");
    } catch (error) {
      console.error("OTP Error:", error);
      alert("OTP failed to send. Check your connection or mobile number.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return alert("Please enter OTP");
    try {
      setIsSubmitting(true);
      await confirmObj.confirm(otp);
      
      setOtpVerified(true);
      setStep(3); // Direct move to step 3 upon success
    } catch (error) {
      console.error("Verification Error:", error);
      alert("Invalid OTP ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!otpVerified) return alert("Please verify OTP first");
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return alert("Please provide a signature");
    }

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
    } catch (err) {
      alert("Submission failed ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Box p={5} textAlign="center"><CircularProgress /></Box>;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">Owner Settlement Dashboard</Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined">Refresh</Button>
      </Box>

      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(item => {
              const isSigned = !!item.signed_pdf;
              return (
                <TableRow key={item.booking_id}>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>₹{item.owner_amount}</TableCell>
                  <TableCell>
                    {!item.final_pdf ? (
                      <Chip label="Processing" />
                    ) : isSigned ? (
                      <Button color="success" variant="contained" onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}>
                        VIEW SIGNED
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}>VIEW PDF</Button>
                        {item.viewed_by_owner && (
                          <Button color="warning" onClick={() => handleOpenSign(item)}>SIGN</Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* MODAL */}
      <Modal 
        open={openSignModal} 
        onClose={() => !isSubmitting && setOpenSignModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openSignModal}>
          <Box sx={{
            width: { xs: '95%', sm: 420 },
            bgcolor: "background.paper",
            borderRadius: 3,
            p: 4,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 24,
            outline: 'none'
          }}>

            <Box display="flex" alignItems="center" mb={2}>
               {step > 1 && (
                 <IconButton onClick={() => setStep(step - 1)} size="small" sx={{ mr: 1 }}>
                   <ArrowBack />
                 </IconButton>
               )}
               <Typography variant="h6">Sign Agreement</Typography>
            </Box>

            {/* STEP BAR */}
            <Box display="flex" justifyContent="space-between" mb={4}>
              {["Consent", "OTP", "Sign"].map((label, i) => (
                <Box key={i} textAlign="center" flex={1}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: "50%", mx: "auto",
                    bgcolor: step >= i + 1 ? "primary.main" : "#ccc",
                    color: "#fff", lineHeight: "30px", fontWeight: 'bold'
                  }}>
                    {i + 1}
                  </Box>
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>{label}</Typography>
                </Box>
              ))}
            </Box>

            {/* STEP 1: CONSENT */}
            {step === 1 && (
              <Box>
                <Box display="flex" alignItems="flex-start" mb={3} sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2 }}>
                  <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} sx={{ p: 0, mr: 1 }} />
                  <Typography variant="body2">
                    I acknowledge that I have reviewed the settlement PDF and agree to the terms listed therein.
                  </Typography>
                </Box>
                <Button fullWidth variant="contained" disabled={!agreed} onClick={() => setStep(2)}>
                  Continue to Verification
                </Button>
              </Box>
            )}

            {/* STEP 2: OTP */}
            {step === 2 && (
              <Box>
                <TextField 
                  fullWidth label="Mobile Number" 
                  variant="outlined" value={mobile} 
                  placeholder="9876543210"
                  onChange={(e) => setMobile(e.target.value)} 
                  disabled={!!confirmObj || isSubmitting}
                />
                {!confirmObj ? (
                  <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={sendOtp} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Send OTP"}
                  </Button>
                ) : (
                  <>
                    <TextField 
                      fullWidth sx={{ mt: 2 }} label="6-Digit OTP" 
                      value={otp} onChange={(e) => setOtp(e.target.value)} 
                      autoFocus
                    />
                    <Button 
                      fullWidth sx={{ mt: 2 }} variant="contained" 
                      onClick={verifyOtp} disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Verify & Proceed"}
                    </Button>
                    <Button fullWidth sx={{ mt: 1 }} size="small" onClick={() => setConfirmObj(null)} disabled={isSubmitting}>
                      Change Number
                    </Button>
                  </>
                )}
                <div id="recaptcha-container"></div>
              </Box>
            )}

            {/* STEP 3: SIGNATURE */}
            {step === 3 && (
              <Box>
                <Typography variant="subtitle2" mb={1}>Draw your signature below:</Typography>
                <Box sx={{ border: "1px solid #ddd", borderRadius: 1, overflow: 'hidden', bgcolor: '#fafafa' }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      width: 356,
                      height: 180,
                      className: "sigCanvas"
                    }}
                  />
                </Box>
                <Box mt={3} display="flex" gap={2}>
                  <Button variant="outlined" fullWidth onClick={() => sigCanvas.current.clear()} disabled={isSubmitting}>
                    Clear
                  </Button>
                  <Button 
                    variant="contained" fullWidth 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Finish & Sign"}
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