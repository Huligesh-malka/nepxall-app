import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, Backdrop, IconButton, Divider
} from "@mui/material";
import { Refresh, ArrowBack, Gavel, Security, VerifiedUser, InfoOutlined } from "@mui/icons-material";

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
        if (sigCanvas.current) {
          sigCanvas.current.clear();
        }
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
        return alert("This mobile number is not registered for this booking. ❌");
      }

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }

      const confirmation = await signInWithPhoneNumber(auth, `+91${mobile}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      alert("Verification successful. OTP Sent ✅");
    } catch (error) {
      console.error("OTP Error:", error);
      const errMsg = error.response?.status === 403 
        ? "This mobile number is not registered for this booking. ❌" 
        : (error.response?.data?.message || "OTP Service Error");
      alert(errMsg);
      
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
      alert("Invalid OTP code. ❌");
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

    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };

    try {
      setIsSubmitting(true);
      const res = await axios.post(`${API}/agreements/sign`, {
        booking_id: selectedBooking.booking_id,
        owner_mobile: mobile,
        owner_signature: signature,
        accepted_terms: true,
        owner_device_info: JSON.stringify(deviceInfo) 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert("Digital Signature Applied Successfully ✅");
        setOpenSignModal(false);
        fetchPayments(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
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
            width: { xs: '95%', sm: 600, md: 750 },
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
                  <Typography variant="h6" fontWeight="bold" color="primary.main">Owner Digital Authentication</Typography>
                </Box>
                <Chip icon={<Gavel />} label={`Step ${step} of 3`} color="primary" variant="outlined" />
            </Box>

            {/* STEP 1: COMPREHENSIVE LEGAL DECLARATION */}
            {step === 1 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom color="textSecondary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <InfoOutlined fontSize="small" sx={{ mr: 0.5 }} /> Please review all 25 legal clauses before proceeding.
                </Typography>
                
                <Box sx={{ 
                  bgcolor: '#fcfcfc', 
                  p: 3, 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0',
                  mb: 2,
                  boxShadow: 'inset 0px 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ 
                    maxHeight: 380, 
                    overflowY: "auto",
                    pr: 2,
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '10px' }
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 1 }}>GENERAL DECLARATION</Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8 }}>
                        1. <b>Agreement Understanding:</b> I have carefully read and understood all clauses of this draft.<br/>
                        2. <b>Factual Accuracy:</b> I confirm that all property and owner details provided are true.<br/>
                        3. <b>E-Sign Validity:</b> I agree this is executed under the IT Act, 2000 and is legally binding.<br/>
                        4. <b>Identity Authentication:</b> I acknowledge OTP acts as my unique digital identifier.<br/>
                        5. <b>Digital Signature:</b> I consent to using my hand-drawn signature as a valid legal mark.<br/>
                        6. <b>Non-Repudiation:</b> I shall not repudiate the execution once generated.<br/>
                        7. <b>Legal Jurisdiction:</b> Subject to Indian laws and local property jurisdiction.<br/>
                        8. <b>Physical Equivalent:</b> Holds the same legal weight as a physical paper document.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" fontWeight="bold" color="warning.dark" sx={{ mb: 1 }}>OWNER LEGAL RESPONSIBILITIES (ADVANCED)</Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8 }}>
                        9. <b>Ownership Liability:</b> I confirm I am the lawful owner; disputes are my sole responsibility.<br/>
                        10. <b>Title & Legal Clearance:</b> Property is free from encumbrances or government restrictions.<br/>
                        11. <b>Rental Authority:</b> I hold full legal rights to lease/rent this premises.<br/>
                        12. <b>Property Condition:</b> Premises provided is safe, habitable, and standard-compliant.<br/>
                        13. <b>Maintenance Responsibility:</b> Responsible for structural, electrical, and plumbing repairs.<br/>
                        14. <b>Deposit Handling:</b> I will refund security deposits without unlawful deductions.<br/>
                        15. <b>False Information Liability:</b> Fully liable for legal consequences of false details.<br/>
                        16. <b>Tax Responsibility:</b> Responsible for declaring rental income per Indian Tax Laws.<br/>
                        17. <b>Indemnity Clause:</b> I hold the platform harmless from claims arising from my actions.<br/>
                        18. <b>No Illegal Use Permission:</b> I shall not allow illegal activities on the property.
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" fontWeight="bold" color="error" sx={{ mb: 1 }}>DIGITAL CONFIRMATION & PLATFORM PROTECTION</Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8 }}>
                        19. <b>Electronic Execution:</b> Executed digitally under Information Technology Act, 2000.<br/>
                        20. <b>Binding Nature:</b> Enforceable under the Indian Contract Act, 1872.<br/>
                        21. <b>Audit Trail Acceptance:</b> OTP, IP, and timestamps will be recorded as legal proof.<br/>
                        22. <b>Platform Role:</b> Platform is a facilitator only and not a party to this contract.<br/>
                        23. <b>No Platform Liability:</b> Not responsible for property, rent, or legal conflicts.<br/>
                        24. <b>Full Acceptance:</b> I confirm reading and accepting all terms fully.<br/>
                        25. <b>Legal Responsibility:</b> I accept full legal responsibility for this entire agreement.
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" mb={3} sx={{ bgcolor: '#fff9c4', p: 1.5, borderRadius: 2 }}>
                  <Checkbox 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                    sx={{ p: 0, mr: 1 }} 
                  />
                  <Typography variant="body2" fontWeight="bold">
                    I confirm that I have read and accept all 25 clauses mentioned above.
                  </Typography>
                </Box>

                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  disabled={!agreed} 
                  onClick={() => setStep(2)}
                  sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
                >
                  I Accept, Proceed to Verify
                </Button>
              </Box>
            )}

            {/* STEP 2: PHONE OTP */}
            {step === 2 && (
              <Box py={2} textAlign="center">
                <VerifiedUser color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h6" mb={1}>Identity Verification</Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                    OTP will be sent to the number registered with Booking ID #{selectedBooking?.booking_id}
                </Typography>
                <TextField 
                  fullWidth label="Registered Mobile" 
                  variant="outlined" value={mobile} 
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} 
                  disabled={!!confirmObj || isSubmitting}
                  sx={{ mb: 3 }}
                />
                {!confirmObj ? (
                  <Button fullWidth variant="contained" size="large" onClick={sendOtp} disabled={isSubmitting || mobile.length < 10}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Send OTP Code"}
                  </Button>
                ) : (
                  <>
                    <TextField 
                      fullWidth label="6-Digit OTP" 
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                      sx={{ mb: 3 }}
                    />
                    <Button fullWidth variant="contained" size="large" onClick={verifyOtp} disabled={isSubmitting || otp.length < 6}>
                        Verify & Continue
                    </Button>
                  </>
                )}
                <div id="recaptcha-container"></div>
              </Box>
            )}

            {/* STEP 3: SIGNATURE */}
            {step === 3 && (
              <Box py={2}>
                <Box textAlign="center" mb={2}>
                    <Security color="success" sx={{ fontSize: 40 }} />
                    <Typography variant="h6">Apply Digital Signature</Typography>
                </Box>
                <Box sx={{ border: "2px dashed #1976d2", borderRadius: 2, bgcolor: '#fbfbfb', overflow: 'hidden' }}>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ 
                      width: 680, 
                      height: 250, 
                      className: "sigCanvas",
                      style: { width: '100%', height: '250px' } 
                    }}
                  />
                </Box>
                <Box mt={3} display="flex" gap={2}>
                  <Button variant="outlined" size="large" fullWidth onClick={() => sigCanvas.current.clear()} disabled={isSubmitting}>
                    Clear
                  </Button>
                  <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Sign & Finalize"}
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