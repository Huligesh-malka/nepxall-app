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
            width: { xs: '92%', sm: 480 }, // Increased width slightly for long text
            bgcolor: "background.paper",
            borderRadius: 4,
            p: 4,
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 24, outline: 'none'
          }}>

            <Box display="flex" alignItems="center" mb={3}>
               {step > 1 && !otpVerified && (
                 <IconButton onClick={() => setStep(step - 1)} size="small" sx={{ mr: 1 }}>
                   <ArrowBack />
                 </IconButton>
               )}
               <Typography variant="h6" fontWeight="bold">Owner Digital Sign</Typography>
            </Box>

            {/* STEP 1: LEGAL CONSENT (UPDATED) */}
            {step === 1 && (
              <Box>
                <Box sx={{ 
                  bgcolor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: 2, 
                  border: '1px solid #ddd',
                  mb: 3
                }}>
                  <Typography 
                    variant="body2" 
                    color="textSecondary" 
                    sx={{ 
                      maxHeight: 250, 
                      overflowY: "auto",
                      whiteSpace: 'pre-line',
                      pr: 1,
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '10px' }
                    }}
                  >
                    <b>I hereby declare that:</b>{"\n\n"}
                    1. I have carefully read and understood all the terms and conditions of this rental agreement.{"\n\n"}
                    2. I confirm that all the details provided by me are true and correct to the best of my knowledge.{"\n\n"}
                    3. I agree that this agreement is executed electronically under the provisions of the Information Technology Act, 2000 and shall be legally binding.{"\n\n"}
                    4. I understand that my mobile number verification through OTP serves as my identity authentication.{"\n\n"}
                    5. I consent to use my electronic signature (drawn signature) as a valid and legally enforceable signature.{"\n\n"}
                    6. I agree that once signed, this agreement cannot be denied or repudiated by me.{"\n\n"}
                    7. I accept that this agreement shall be governed by the laws of India and jurisdiction of the respective state.{"\n\n"}
                    8. I understand that any violation of terms may lead to legal action as per applicable laws.{"\n\n"}
                    9. I agree that this digital document is equivalent to a physical signed agreement.
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={3}>
                  <Checkbox 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                    sx={{ p: 0, mr: 1 }} 
                  />
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    I agree to the Terms & Conditions and consent to use electronic signature
                  </Typography>
                </Box>

                <Button fullWidth variant="contained" size="large" disabled={!agreed} onClick={() => setStep(2)}>
                  Accept & Continue
                </Button>
              </Box>
            )}

            {/* STEP 2: PHONE OTP VERIFICATION */}
            {step === 2 && (
              <Box>
                <TextField 
                  fullWidth label="Registered Mobile" 
                  placeholder="Enter 10 digit number"
                  variant="outlined" value={mobile} 
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} 
                  disabled={!!confirmObj || isSubmitting}
                  sx={{ mb: 2 }}
                />
                {!confirmObj ? (
                  <Button fullWidth variant="contained" size="large" onClick={sendOtp} disabled={isSubmitting || mobile.length < 10}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Verify & Send OTP"}
                  </Button>
                ) : (
                  <>
                    <TextField 
                      fullWidth label="Enter 6-digit OTP" 
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      fullWidth variant="contained" size="large" color="primary"
                      onClick={verifyOtp} disabled={isSubmitting || otp.length < 6}
                    >
                      {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Verify OTP"}
                    </Button>
                  </>
                )}
                <div id="recaptcha-container"></div>
              </Box>
            )}

            {/* STEP 3: DIGITAL SIGNATURE PAD */}
            {step === 3 && (
              <Box>
                <Typography variant="subtitle2" color="primary" mb={1} fontWeight="bold">Draw your signature below:</Typography>
                <Box sx={{ border: "2px dashed #999", borderRadius: 2, bgcolor: '#fafafa', overflow: 'hidden' }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ width: 400, height: 180, className: "sigCanvas" }}
                  />
                </Box>
                <Box mt={3} display="flex" gap={2}>
                  <Button variant="outlined" fullWidth onClick={() => sigCanvas.current.clear()} disabled={isSubmitting}>
                    Clear
                  </Button>
                  <Button variant="contained" fullWidth onClick={handleSubmit} disabled={isSubmitting}>
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