import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton
} from "@mui/material";
import { Refresh, ArrowBack, Gavel } from "@mui/icons-material";

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

  // Fix for canvas sizing inside modal
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
    if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Enter a valid 10-digit mobile number");

    try {
      setIsSubmitting(true);

      const verifyRes = await axios.post(`${API}/agreements/verify-owner`, {
        booking_id: selectedBooking.booking_id,
        mobile: mobile
      });

      if (!verifyRes.data.success) {
        return alert("Verification Failed: This number is not registered for this booking ❌");
      }

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
      alert("Verification successful. OTP Sent ✅");
    } catch (error) {
      console.error("Verification/OTP Error:", error);
      const errorMsg = error.response?.data?.message || "Access Denied: Mobile number mismatch.";
      alert(errorMsg);
      
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return alert("Please enter the 6-digit OTP");
    try {
      setIsSubmitting(true);
      await confirmObj.confirm(otp);
      setOtpVerified(true);
      setStep(3); 
    } catch (error) {
      alert("Invalid OTP code. Please try again ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!otpVerified) return alert("Phone verification required");
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return alert("Please draw your signature in the box");
    }

    const signature = sigCanvas.current.getCanvas().toDataURL("image/png");

    try {
      setIsSubmitting(true);
      
      const res = await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true
      });

      if (res.data.success) {
        alert("Digital Signature Applied Successfully ✅");
        setOpenSignModal(false);
        fetchPayments(); 
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Submission failed";
      alert(`${msg} ❌`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center">
        <Typography variant="h5" fontWeight="bold">Owner Settlement Dashboard</Typography>
        <Button onClick={fetchPayments} startIcon={<Refresh />} variant="outlined">Refresh Data</Button>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell><b>Booking ID</b></TableCell>
              <TableCell><b>Tenant Name</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
              <TableCell align="center"><b>Agreement Action</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No pending settlements found.</TableCell></TableRow>
            ) : data.map(item => {
              const isSigned = !!item.signed_pdf;
              return (
                <TableRow key={item.booking_id} hover>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>₹{item.owner_amount}</TableCell>
                  <TableCell align="center">
                    {!item.final_pdf ? (
                      <Chip label="Drafting..." variant="outlined" />
                    ) : isSigned ? (
                      <Button color="success" variant="contained" size="small" onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}>
                        VIEW SIGNED PDF
                      </Button>
                    ) : (
                      <Box display="flex" gap={1} justifyContent="center">
                        <Button variant="outlined" size="small" onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}>VIEW DRAFT</Button>
                        {item.viewed_by_owner && (
                          <Button variant="contained" color="warning" size="small" onClick={() => handleOpenSign(item)}>SIGN NOW</Button>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* MULTI-STEP SIGNING MODAL */}
      <Modal 
        open={openSignModal} 
        onClose={() => !isSubmitting && setOpenSignModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openSignModal}>
          <Box sx={{
            width: { xs: '95%', sm: 580, md: 650 }, // Expanded for Big Screen focus
            bgcolor: "background.paper",
            borderRadius: 4,
            p: { xs: 2, sm: 4 },
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 24, outline: 'none'
          }}>

            <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
               <Box display="flex" alignItems="center">
                  {step > 1 && !otpVerified && (
                    <IconButton onClick={() => setStep(step - 1)} size="small" sx={{ mr: 1 }}>
                      <ArrowBack />
                    </IconButton>
                  )}
                  <Typography variant="h6" fontWeight="bold">Owner Digital Authentication</Typography>
               </Box>
               <Chip icon={<Gavel />} label={`Step ${step} of 3`} color="primary" variant="outlined" size="small" />
            </Box>

            {/* STEP 1: LEGAL CONSENT (BIG UPDATE) */}
            {step === 1 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom color="textSecondary">
                  Please review the legal declaration before proceeding to signature.
                </Typography>
                
                <Box sx={{ 
                  bgcolor: '#ffffff', 
                  p: 3, 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0',
                  mb: 3,
                  boxShadow: 'inset 0px 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      maxHeight: 320, 
                      overflowY: "auto",
                      whiteSpace: 'pre-line',
                      lineHeight: 1.8,
                      fontSize: '0.95rem',
                      pr: 2,
                      '&::-webkit-scrollbar': { width: '8px' },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#bdbdbd', borderRadius: '10px' }
                    }}
                  >
                    <b style={{ color: '#1a1a1a', fontSize: '1.1rem' }}>Legal Declaration & Consent</b>{"\n\n"}
                    1. <b>Agreement Understanding:</b> I have carefully read, reviewed, and understood all terms, conditions, and clauses of this rental agreement draft.{"\n\n"}
                    2. <b>Factual Accuracy:</b> I hereby confirm that all information provided by me, including property details and ownership status, is true and correct.{"\n\n"}
                    3. <b>E-Sign Validity:</b> I agree that this agreement is executed electronically under the <b>Information Technology Act, 2000</b> and shall be legally binding and enforceable.{"\n\n"}
                    4. <b>Identity Authentication:</b> I understand that the OTP sent to my registered mobile number serves as my unique identity authentication for this transaction.{"\n\n"}
                    5. <b>Digital Signature:</b> I provide my explicit consent to use my drawn signature as a valid legal signature on this digital document.{"\n\n"}
                    6. <b>Non-Repudiation:</b> I agree that once the signature is applied and the document is generated, I shall not deny or repudiate the execution of this agreement.{"\n\n"}
                    7. <b>Legal Jurisdiction:</b> I accept that this agreement is subject to the laws of India and any disputes shall be handled within the jurisdiction of the property's respective state.{"\n\n"}
                    8. <b>Physical Equivalent:</b> I acknowledge that this digital document holds the same legal weight as a physically signed paper agreement.
                  </Typography>
                </Box>

                <Box display="flex" alignItems="flex-start" mb={4} sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2 }}>
                  <Checkbox 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                    sx={{ p: 0, mr: 1.5, mt: 0.3 }} 
                  />
                  <Typography variant="body2" color="primary.dark" fontWeight={600}>
                    I confirm that I have read the declaration above and I am authorized to sign this agreement digitally.
                  </Typography>
                </Box>

                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  disabled={!agreed} 
                  onClick={() => setStep(2)}
                  sx={{ py: 1.5, textTransform: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                  I Accept, Proceed to Verify
                </Button>
              </Box>
            )}

            {/* STEP 2: PHONE OTP VERIFICATION */}
            {step === 2 && (
              <Box py={2}>
                <Typography variant="body1" mb={3} textAlign="center">
                  Verify your identity via the mobile number registered with this booking.
                </Typography>
                <TextField 
                  fullWidth label="Registered Mobile Number" 
                  placeholder="e.g. 9876543210"
                  variant="outlined" value={mobile} 
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} 
                  disabled={!!confirmObj || isSubmitting}
                  sx={{ mb: 3 }}
                  inputProps={{ style: { fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px' } }}
                />
                {!confirmObj ? (
                  <Button fullWidth variant="contained" size="large" onClick={sendOtp} disabled={isSubmitting || mobile.length < 10} sx={{ py: 1.5 }}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Send Verification Code"}
                  </Button>
                ) : (
                  <>
                    <TextField 
                      fullWidth label="6-Digit OTP" 
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                      sx={{ mb: 3 }}
                      inputProps={{ style: { fontSize: '1.2rem', textAlign: 'center', letterSpacing: '5px' }, maxLength: 6 }}
                    />
                    <Button 
                      fullWidth variant="contained" size="large" color="primary"
                      onClick={verifyOtp} disabled={isSubmitting || otp.length < 6}
                      sx={{ py: 1.5 }}
                    >
                      {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Verify & Continue"}
                    </Button>
                  </>
                )}
                <div id="recaptcha-container"></div>
              </Box>
            )}

            {/* STEP 3: DIGITAL SIGNATURE PAD */}
            {step === 3 && (
              <Box py={2}>
                <Typography variant="h6" textAlign="center" mb={1}>Draw Your Signature</Typography>
                <Typography variant="body2" color="textSecondary" textAlign="center" mb={3}>
                  Please use your mouse or touch screen to sign within the box.
                </Typography>
                <Box sx={{ 
                  border: "2px solid #1976d2", 
                  borderRadius: 2, 
                  bgcolor: '#ffffff', 
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ 
                      width: 500, 
                      height: 220, 
                      className: "sigCanvas",
                      style: { cursor: 'crosshair' }
                    }}
                  />
                </Box>
                <Box mt={4} display="flex" gap={2}>
                  <Button variant="outlined" size="large" fullWidth onClick={() => sigCanvas.current.clear()} disabled={isSubmitting}>
                    Clear Pad
                  </Button>
                  <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Apply Signature"}
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