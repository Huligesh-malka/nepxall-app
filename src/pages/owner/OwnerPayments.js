import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import {
  Container, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Box, CircularProgress, Button,
  Modal, Fade, TextField, Stepper, Step, StepLabel,
  Card, CardContent, IconButton, Alert, Snackbar,
  useTheme, alpha, Divider, Stack, Avatar
} from "@mui/material";
import {
  Refresh, CheckCircle, Phone, Signature, Gavel,
  Close, ArrowBack, ArrowForward, VerifiedUser
} from "@mui/icons-material";

// Firebase imports
import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API = "https://nepxall-backend.onrender.com/api/owner";

export default function OwnerPayments() {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sigCanvas = useRef(null);
  const token = localStorage.getItem("token");

  const steps = [
    { label: "Legal Consent", icon: <Gavel />, description: "Review and accept terms" },
    { label: "Verify Mobile", icon: <Phone />, description: "OTP verification" },
    { label: "Sign Document", icon: <Signature />, description: "Draw your signature" }
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Prevent refresh during signing process
  useEffect(() => {
    const handler = (e) => {
      if (activeStep > 0 && activeStep < steps.length - 1) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [activeStep]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch {
      showSnackbar("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
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
    setActiveStep(0);
    setAgreed(false);
    setMobile("");
    setOtp("");
    setConfirmObj(null);
    setOtpVerified(false);
    setOpenSignModal(true);
    setTimeout(() => sigCanvas.current?.clear(), 200);
  };

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      showSnackbar("Enter valid 10-digit mobile number", "error");
      return;
    }

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
      setCountdown(30);
      showSnackbar("OTP sent successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to send OTP", "error");
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showSnackbar("Enter valid 6-digit OTP", "error");
      return;
    }

    try {
      await confirmObj.confirm(otp);
      setOtpVerified(true);
      setActiveStep(2);
      showSnackbar("Mobile verified successfully!", "success");
    } catch {
      showSnackbar("Invalid OTP", "error");
    }
  };

  const handleSubmit = async () => {
    if (!otpVerified) {
      showSnackbar("Please verify OTP first", "error");
      return;
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      showSnackbar("Please draw your signature", "error");
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

      showSnackbar("Document signed successfully!", "success");
      setOpenSignModal(false);
      fetchPayments();
    } catch {
      showSnackbar("Failed to sign document", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !agreed) {
      showSnackbar("Please accept the terms to continue", "warning");
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < activeStep) return "complete";
    if (stepIndex === activeStep) return "active";
    return "inactive";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Settlement Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and sign legal agreements
          </Typography>
        </Box>
        <Button
          onClick={fetchPayments}
          startIcon={<Refresh />}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3} mb={4}>
        <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          <CardContent>
            <Typography color="primary" variant="h4" fontWeight="bold">
              {data.length}
            </Typography>
            <Typography variant="body2">Total Bookings</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
          <CardContent>
            <Typography color="success.main" variant="h4" fontWeight="bold">
              {data.filter(item => item.signed_pdf).length}
            </Typography>
            <Typography variant="body2">Signed Agreements</Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
          <CardContent>
            <Typography color="warning.main" variant="h4" fontWeight="bold">
              {data.filter(item => item.viewed_by_owner && !item.signed_pdf).length}
            </Typography>
            <Typography variant="body2">Pending Signatures</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Payments Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Tenant</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status / Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => {
              const isSigned = !!item.signed_pdf;
              const isViewed = item.viewed_by_owner;
              
              return (
                <TableRow key={item.booking_id} hover>
                  <TableCell>#{item.booking_id}</TableCell>
                  <TableCell>{item.tenant_name}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold" color="primary">
                      ₹{item.owner_amount?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {!item.final_pdf ? (
                      <Chip label="Processing" size="small" />
                    ) : isSigned ? (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => handleViewPdf(item.booking_id, item.signed_pdf)}
                        sx={{ borderRadius: 2 }}
                      >
                        View Signed
                      </Button>
                    ) : (
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewPdf(item.booking_id, item.final_pdf)}
                          sx={{ borderRadius: 2 }}
                        >
                          View PDF
                        </Button>
                        {isViewed && (
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            onClick={() => handleOpenSign(item)}
                            sx={{ borderRadius: 2 }}
                          >
                            Sign Now
                          </Button>
                        )}
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Sign Modal */}
      <Modal open={openSignModal} onClose={() => setOpenSignModal(false)}>
        <Fade in={openSignModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", sm: 500, md: 550 },
              maxHeight: "90vh",
              overflow: "auto",
              bgcolor: "background.paper",
              borderRadius: 4,
              boxShadow: 24,
              p: 3
            }}
          >
            {/* Modal Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Sign Agreement
              </Typography>
              <IconButton onClick={() => setOpenSignModal(false)} size="small">
                <Close />
              </IconButton>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: getStepStatus(index) === "complete" 
                          ? theme.palette.success.main 
                          : getStepStatus(index) === "active"
                          ? theme.palette.primary.main
                          : alpha(theme.palette.text.disabled, 0.2),
                        color: getStepStatus(index) === "complete" || getStepStatus(index) === "active"
                          ? "white"
                          : theme.palette.text.disabled
                      }}
                    >
                      {getStepStatus(index) === "complete" ? <CheckCircle sx={{ fontSize: 18 }} /> : step.icon}
                    </Box>
                  )}>
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step Content */}
            <Box mb={3}>
              {/* Step 0 - Legal Consent */}
              {activeStep === 0 && (
                <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Terms & Conditions
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    By signing this agreement, you confirm that:
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <VerifiedUser fontSize="small" color="primary" />
                      <Typography variant="body2">You have reviewed the agreement thoroughly</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <VerifiedUser fontSize="small" color="primary" />
                      <Typography variant="body2">All information provided is accurate</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <VerifiedUser fontSize="small" color="primary" />
                      <Typography variant="body2">You agree to all terms and conditions</Typography>
                    </Box>
                  </Stack>
                  <Box display="flex" alignItems="center" gap={1} mt={3}>
                    <CheckCircle color={agreed ? "success" : "disabled"} />
                    <Typography
                      variant="body2"
                      sx={{ cursor: "pointer" }}
                      onClick={() => setAgreed(!agreed)}
                    >
                      I have read and agree to the terms
                    </Typography>
                  </Box>
                </Card>
              )}

              {/* Step 1 - Mobile Verification */}
              {activeStep === 1 && (
                <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Mobile Verification
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    An OTP will be sent to verify your mobile number
                  </Typography>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    disabled={!!confirmObj}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />
                    }}
                    sx={{ mb: 2 }}
                  />
                  {!confirmObj ? (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={sendOtp}
                      disabled={countdown > 0}
                      sx={{ borderRadius: 2 }}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Send OTP"}
                    </Button>
                  ) : (
                    <>
                      <TextField
                        fullWidth
                        label="Enter OTP"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={verifyOtp}
                        sx={{ borderRadius: 2 }}
                      >
                        Verify OTP
                      </Button>
                    </>
                  )}
                  <div id="recaptcha-container"></div>
                </Card>
              )}

              {/* Step 2 - Signature */}
              {activeStep === 2 && (
                <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Draw Your Signature
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Use your mouse or touch to draw your signature
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.common.white, 0.05),
                      borderRadius: 2
                    }}
                  >
                    <SignatureCanvas
                      ref={sigCanvas}
                      canvasProps={{
                        width: "100%",
                        height: 200,
                        style: { width: "100%", border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 8 }
                      }}
                    />
                  </Paper>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => sigCanvas.current.clear()}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    Clear Signature
                  </Button>
                </Card>
              )}
            </Box>

            {/* Navigation Buttons */}
            <Box display="flex" justifyContent="space-between" gap={2}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBack />}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  endIcon={<ArrowForward />}
                  sx={{ borderRadius: 2 }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="success"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ borderRadius: 2 }}
                >
                  {isSubmitting ? "Signing..." : "Final Sign"}
                </Button>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}