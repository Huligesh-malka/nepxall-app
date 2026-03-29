import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, Checkbox, TextField, IconButton, Alert,
  Stepper, Step, StepLabel, Card, CardContent, Divider,
  Backdrop, useTheme
} from "@mui/material";
import { Refresh, Close, Draw, Phone, Verified, Gavel, CheckCircle } from "@mui/icons-material";

// Firebase OTP
import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const theme = useTheme();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");

  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  const sigCanvas = useRef(null);
  const token = localStorage.getItem("token");

  const steps = ['Legal Agreement', 'Verify Mobile', 'Sign Document'];

  useEffect(() => {
    fetchPayments();
  }, []);

  // Prevent refresh during OTP/Sign process
  useEffect(() => {
    const handler = (e) => {
      if (step === 2 || step === 3) {
        e.preventDefault();
        e.returnValue = "You have an ongoing signing process. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  // Clear signature when step changes to sign
  useEffect(() => {
    if (step === 3 && otpVerified) {
      setTimeout(() => {
        sigCanvas.current?.clear();
      }, 200);
    }
  }, [step, otpVerified]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch {
      alert("Failed to load payments ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async (bookingId, filePath) => {
    await axios.post(`${API}/agreements/viewed`, { booking_id: bookingId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    window.open(filePath, "_blank");
    fetchPayments();
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
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    setOtpSending(true);
    try {
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
      alert("OTP sent successfully! ✅");
    } catch (error) {
      console.error(error);
      alert("Failed to send OTP. Please try again. ❌");
    } finally {
      setOtpSending(false);
    }
  };

  // 🔥 FIXED VERIFY OTP FUNCTION
  const verifyOtp = async () => {
    try {
      await confirmObj.confirm(otp);
      
      // Force reset and set verified
      setOtpVerified(false);
      
      setTimeout(() => {
        setOtpVerified(true);
        setStep(3);
      }, 100);
      
      alert("OTP Verified Successfully! ✅");
    } catch (error) {
      console.error(error);
      alert("Invalid OTP. Please try again. ❌");
    }
  };

  const handleSubmit = async () => {
    if (!otpVerified) {
      alert("Please verify OTP first");
      return;
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert("Please draw your signature");
      return;
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

      alert("Document signed successfully! ✅");
      setOpenSignModal(false);
      fetchPayments();
    } catch (error) {
      console.error(error);
      alert("Failed to sign document. Please try again. ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Owner Settlement Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and sign legal agreements for completed bookings
          </Typography>
        </Box>
        <Button
          onClick={fetchPayments}
          startIcon={<Refresh />}
          variant="contained"
          sx={{ bgcolor: '#1976d2' }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card sx={{ bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>Total Bookings</Typography>
            <Typography variant="h4" fontWeight="bold">{data.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#e8f5e9' }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>Settled</Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {data.filter(item => item.signed_pdf).length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#fff3e0' }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>Pending Signature</Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {data.filter(item => item.viewed_by_owner && !item.signed_pdf).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Payments Table */}
      <Paper elevation={3} sx={{ overflowX: 'auto', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tenant Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status / Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => {
              const isSigned = !!item.signed_pdf;
              const canSign = item.viewed_by_owner && !isSigned && item.final_pdf;

              return (
                <TableRow key={item.booking_id} hover>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">₹{item.owner_amount}</Typography>
                  </TableCell>
                  <TableCell>
                    {!item.final_pdf ? (
                      <Chip label="Processing" color="default" size="small" />
                    ) : isSigned ? (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}
                        startIcon={<Verified />}
                      >
                        View Signed
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}
                        >
                          View PDF
                        </Button>
                        {canSign && (
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            onClick={() => handleOpenSign(item)}
                            startIcon={<Draw />}
                          >
                            Sign
                          </Button>
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

      {/* Signature Modal */}
      <Modal
        open={openSignModal}
        onClose={() => !isSubmitting && setOpenSignModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openSignModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', sm: 500 },
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {/* Modal Header */}
            <Box sx={{ 
              p: 3, 
              bgcolor: theme.palette.primary.main, 
              color: 'white',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" fontWeight="bold">
                Sign Agreement
              </Typography>
              <IconButton
                onClick={() => setOpenSignModal(false)}
                sx={{ color: 'white' }}
                disabled={isSubmitting}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Stepper */}
            <Box sx={{ px: 3, pt: 3 }}>
              <Stepper activeStep={step - 1} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Step 1 - Legal Agreement */}
            {step === 1 && (
              <Box sx={{ p: 3 }}>
                <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f9f9f9' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Gavel sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="h6">Legal Terms & Conditions</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      By signing this agreement, you confirm that:
                    </Typography>
                    <ul style={{ marginTop: 0, paddingLeft: 20 }}>
                      <li><Typography variant="body2">You have reviewed the rental agreement thoroughly</Typography></li>
                      <li><Typography variant="body2">All information provided is accurate and complete</Typography></li>
                      <li><Typography variant="body2">You agree to the terms and conditions of the rental</Typography></li>
                      <li><Typography variant="body2">You authorize the release of payment as per the agreement</Typography></li>
                    </ul>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Checkbox
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    sx={{ '&.Mui-checked': { color: theme.palette.primary.main } }}
                  />
                  <Typography>
                    I have read and agree to the terms and conditions
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={!agreed}
                  onClick={() => setStep(2)}
                  size="large"
                >
                  Continue to Verification
                </Button>
              </Box>
            )}

            {/* Step 2 - OTP Verification */}
            {step === 2 && (
              <Box sx={{ p: 3 }}>
                <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Mobile Verification</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter your registered mobile number to receive verification code
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    variant="outlined"
                    disabled={!!confirmObj}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={sendOtp}
                    disabled={otpSending || !mobile || confirmObj}
                  >
                    {otpSending ? "Sending..." : "Send OTP"}
                  </Button>
                </Card>

                {confirmObj && (
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <TextField
                      fullWidth
                      label="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={verifyOtp}
                      disabled={!otp}
                      size="large"
                    >
                      Verify OTP
                    </Button>
                  </Card>
                )}

                <div id="recaptcha-container"></div>
              </Box>
            )}

            {/* Step 3 - Signature */}
            {step === 3 && otpVerified && (
              <Box sx={{ p: 3 }}>
                <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Draw sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Draw Your Signature</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Use your mouse or touch to draw your signature in the box below
                  </Typography>
                  
                  <Box sx={{ 
                    border: '2px solid #e0e0e0', 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    bgcolor: '#fff'
                  }}>
                    <SignatureCanvas
                      ref={sigCanvas}
                      canvasProps={{ 
                        width: '100%', 
                        height: 200,
                        style: { width: '100%', height: '200px' }
                      }}
                      backgroundColor="white"
                      penColor="black"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => sigCanvas.current?.clear()}
                      fullWidth
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      fullWidth
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      {isSubmitting ? "Signing..." : "Final Sign"}
                    </Button>
                  </Box>
                </Card>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}