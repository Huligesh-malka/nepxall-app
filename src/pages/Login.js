import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Fade, Grow, Zoom,
  InputAdornment, alpha, useTheme,
  Stepper, Step, StepLabel,
  Avatar, Chip, Backdrop, Snackbar,
  Container, Grid
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Smartphone as SmartphoneIcon,
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Stars as StarsIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Homes as HomesIcon,
  Shield as ShieldIcon,
  Bolt as BoltIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import {
  auth,
  requestNotificationPermission
} from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PhoneLogin = () => {
  const { user, role: authRole, loading: authLoading, login } = useAuth();
  const theme = useTheme();

  // Form states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  // Flow control states
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [step, setStep] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  
  // Refs to prevent duplicate calls
  const verificationInProgress = useRef(false);
  const redirectInProgress = useRef(false);
  const initialCheckDone = useRef(false);
  const otpInputRefs = useRef([]);

  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  /* ================= FIXED: AUTO REDIRECT FOR EXISTING USERS ================= */
  useEffect(() => {
    if (authLoading || redirectInProgress.current || registrationComplete || isRedirecting) {
      return;
    }
    
    if (initialCheckDone.current) {
      return;
    }
    
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    let shouldRedirect = false;
    let userRole = null;
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.name && userData.name.trim() !== "") {
          shouldRedirect = true;
          userRole = userData.role || "user";
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    } else if (user && user.name && user.name.trim() !== "" && user.role) {
      shouldRedirect = true;
      userRole = user.role;
    }
    
    if (shouldRedirect && !isRedirecting) {
      initialCheckDone.current = true;
      setIsRedirecting(true);
      redirectInProgress.current = true;
      redirect(userRole);
    }
  }, [user, authLoading, registrationComplete, isRedirecting]);

  /* ================= LANGUAGE ================= */
  useEffect(() => {
    if (auth) {
      auth.useDeviceLanguage();
    }
  }, []);

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  /* ================= FIXED RECAPTCHA SETUP ================= */
  const setupRecaptcha = async () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
              window.recaptchaVerifier = null;
            },
          }
        );
        
        await window.recaptchaVerifier.render();
        console.log("reCAPTCHA initialized successfully");
      }
    } catch (err) {
      console.error("Recaptcha setup error:", err);
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      throw new Error("Failed to initialize security verification");
    }
  };

  /* ================= REDIRECT - INSTANT ================= */
  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/");
  };

  /* ================= SAVE AUTH DATA ================= */
  const saveAuthData = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (login) {
      login(userData);
    }
    setAuthToken(token);
  };

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return setError("Enter a valid 10-digit mobile number");
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      setConfirmObj(null);
      setOtp(["", "", "", "", "", ""]);
      setFirebaseUser(null);

      await setupRecaptcha();

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${cleanPhone}`,
        window.recaptchaVerifier
      );

      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent successfully!");
      setStep(2);

    } catch (err) {
      console.error("Send OTP error:", err);
      
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection");
      } else {
        setError("Failed to send OTP. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= FIXED: VERIFY OTP - INSTANT REDIRECT ================= */
  const verifyOtp = async () => {
    if (verificationInProgress.current) {
      return;
    }
    
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      return setError("Please enter a valid 6-digit OTP");
    }

    verificationInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");
      setSuccess("Verifying OTP...");

      const result = await confirmObj.confirm(otpString);
      setFirebaseUser(result.user);
      
      setSuccess("OTP verified successfully!");
      
      const idToken = await result.user.getIdToken(true);
      
      await requestNotificationPermission();
      
      const checkResponse = await userAPI.post("/auth/firebase", {
        idToken,
        role: "user",
        phone: phone
      });
      
      console.log("User check response:", checkResponse.data);
      
      if (checkResponse.data.success) {
        if (checkResponse.data.token) {
          saveAuthData(checkResponse.data.token, checkResponse.data.user);
        }

        const fcmToken = localStorage.getItem("fcm_token");
        if (fcmToken && checkResponse.data.token) {
          await userAPI.post(
            "/notifications/save-fcm-token",
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${checkResponse.data.token}` } }
          );
        }
        
        setRegistrationComplete(true);
        setIsRedirecting(true);
        redirectInProgress.current = true;
        
        setSnackbarMessage(checkResponse.data.message || "Welcome! 🚀");
        setSnackbarOpen(true);
        
        redirect(checkResponse.data.user?.role || "user");
        
      } else {
        setError(checkResponse.data.message || "Authentication failed");
      }
      
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
      verificationInProgress.current = false;
    }
  };

  /* ================= RESEND OTP ================= */
  const resendOtp = async () => {
    if (otpTimer > 0) return;
    setIsResending(true);
    await sendOtp();
    setIsResending(false);
  };

  /* ================= BACK TO PHONE ================= */
  const backToPhone = () => {
    setStep(1);
    setConfirmObj(null);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setSuccess("");
    setRegistrationComplete(false);
    setFirebaseUser(null);
    setIsRedirecting(false);
    verificationInProgress.current = false;
    redirectInProgress.current = false;
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  // Handle OTP key down (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  // Show loading state while checking for existing session
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)`,
        }}
      >
        <CircularProgress sx={{ color: "#2563eb" }} />
      </Box>
    );
  }

  // Return null when redirecting
  if (isRedirecting || registrationComplete) {
    return null;
  }

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%', borderRadius: 2 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(145deg, #f8fafc 0%, #eef2ff 50%, #f1f5f9 100%)`,
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
              top: "-200px",
              right: "-150px",
              animation: "float1 12s ease-in-out infinite",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
              bottom: "-200px",
              left: "-150px",
              animation: "float2 15s ease-in-out infinite reverse",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
              top: "40%",
              left: "20%",
              animation: "float3 10s ease-in-out infinite",
            }}
          />
        </Box>

        <style>
          {`
            @keyframes float1 {
              0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
              50% { transform: translateY(-40px) rotate(5deg) scale(1.05); }
            }
            @keyframes float2 {
              0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
              50% { transform: translateY(40px) rotate(-5deg) scale(1.05); }
            }
            @keyframes float3 {
              0%, 100% { transform: translateX(0px) translateY(0px); }
              50% { transform: translateX(30px) translateY(-20px); }
            }
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes glowPulse {
              0%, 100% { box-shadow: 0 0 5px rgba(37,99,235,0.3); }
              50% { box-shadow: 0 0 25px rgba(37,99,235,0.6); }
            }
          `}
        </style>

        <Container
          disableGutters
          maxWidth={false}
          sx={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Hero Section */}
          <Box
            sx={{
              flex: step === 1 ? "0.65" : "0.4",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              px: 3,
              pt: { xs: 8, sm: 12 },
              transition: "flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  px: 2,
                  py: 0.75,
                  borderRadius: 50,
                  mb: 3,
                }}
              >
                <HomesIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  India's Trusted PG Platform
                </Typography>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: 42, sm: 56, md: 64 },
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #1e293b 0%, #2563eb 50%, #7c3aed 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  letterSpacing: "-0.02em",
                  mb: 2,
                }}
              >
                {step === 1 ? "Find your perfect PG 🏠" : "Verify your number"}
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  maxWidth: 450,
                  mx: "auto",
                  fontSize: { xs: 16, sm: 18 },
                }}
              >
                {step === 1 
                  ? "Safe, Verified & Affordable stays near you" 
                  : `We've sent a 6-digit code to +91 ${phone}`}
              </Typography>
            </motion.div>

            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 3,
                    mt: 4,
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <ShieldIcon sx={{ color: "#10b981", fontSize: 28, mb: 0.5 }} />
                    <Typography variant="caption" sx={{ display: "block", fontWeight: 500 }}>
                      Verified Properties
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <BoltIcon sx={{ color: "#f59e0b", fontSize: 28, mb: 0.5 }} />
                    <Typography variant="caption" sx={{ display: "block", fontWeight: 500 }}>
                      Instant Booking
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <SecurityIcon sx={{ color: "#3b82f6", fontSize: 28, mb: 0.5 }} />
                    <Typography variant="caption" sx={{ display: "block", fontWeight: 500 }}>
                      Safe Stay
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            )}
          </Box>

          {/* Bottom Glass Panel */}
          <Box
            sx={{
              flex: step === 1 ? "0.35" : "0.6",
              width: "100%",
              bgcolor: alpha(theme.palette.background.paper, 0.85),
              backdropFilter: "blur(20px)",
              borderTopLeftRadius: { xs: 30, sm: 40 },
              borderTopRightRadius: { xs: 30, sm: 40 },
              boxShadow: `0 -10px 40px ${alpha(theme.palette.common.black, 0.08)}`,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: "flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "auto",
            }}
          >
            <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, maxWidth: 500, mx: "auto", width: "100%" }}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                      }}
                      onClose={() => setError("")}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}

                {success && step !== 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert
                      severity="success"
                      sx={{ mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}
                      onClose={() => setSuccess("")}
                    >
                      {success}
                    </Alert>
                  </motion.div>
                )}

                {/* Step 1: Phone Number */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500, color: "text.secondary" }}>
                      Enter your mobile number
                    </Typography>
                    
                    <TextField
                      fullWidth
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      inputProps={{ maxLength: 10 }}
                      variant="outlined"
                      placeholder="9876543210"
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Chip 
                              label="+91" 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                borderRadius: 2,
                              }} 
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.common.white, 0.9),
                          transition: "all 0.2s",
                          '&:hover': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                            animation: "glowPulse 1.5s infinite",
                          }
                        }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          fontSize: "1.1rem",
                          fontWeight: 500,
                        }
                      }}
                    />

                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        fullWidth
                        onClick={sendOtp}
                        disabled={loading || phone.replace(/\D/g, "").length !== 10}
                        variant="contained"
                        size="large"
                        endIcon={!loading && <ArrowForwardIcon />}
                        sx={{
                          borderRadius: 3,
                          py: 1.75,
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          backgroundSize: "200% 100%",
                          transition: "all 0.3s",
                          '&:hover': {
                            transform: "translateY(-2px)",
                            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.35)}`,
                            backgroundPosition: "100% 0",
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Continue"}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: "text.secondary", textAlign: "center" }}>
                      Enter the 6-digit verification code
                    </Typography>
                    
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: { xs: 1.5, sm: 2 },
                        mb: 3,
                      }}
                    >
                      {otp.map((digit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <TextField
                            inputRef={(el) => (otpInputRefs.current[index] = el)}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            inputProps={{
                              maxLength: 1,
                              style: {
                                textAlign: "center",
                                fontSize: "1.75rem",
                                fontWeight: 600,
                                padding: "12px 0",
                              }
                            }}
                            sx={{
                              width: { xs: 48, sm: 56 },
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: alpha(theme.palette.common.white, 0.9),
                                transition: "all 0.2s",
                                '&:hover': {
                                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                                },
                                '&.Mui-focused': {
                                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                                }
                              }
                            }}
                          />
                        </motion.div>
                      ))}
                    </Box>

                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        fullWidth
                        onClick={verifyOtp}
                        disabled={loading || otp.some(d => !d) || verificationInProgress.current}
                        variant="contained"
                        size="large"
                        endIcon={!loading && <VerifiedUserIcon />}
                        sx={{
                          borderRadius: 3,
                          py: 1.75,
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 700,
                          mb: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          backgroundSize: "200% 100%",
                          transition: "all 0.3s",
                          '&:hover': {
                            transform: "translateY(-2px)",
                            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.35)}`,
                            backgroundPosition: "100% 0",
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify & Continue"}
                      </Button>
                    </motion.div>

                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      {/* Timer Progress Ring */}
                      {otpTimer > 0 && (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: `conic-gradient(${theme.palette.primary.main} ${(otpTimer / 60) * 360}deg, ${alpha(theme.palette.primary.main, 0.2)} 0deg)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              '&::before': {
                                content: '""',
                                position: "absolute",
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                bgcolor: "background.paper",
                              }
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Resend in {otpTimer}s
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                        <Button
                          onClick={resendOtp}
                          disabled={otpTimer > 0 || isResending}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            '&:hover': { background: "transparent", textDecoration: "underline" }
                          }}
                        >
                          {isResending ? <CircularProgress size={20} /> : "Resend OTP"}
                        </Button>
                        <Button
                          onClick={backToPhone}
                          sx={{
                            textTransform: "none",
                            color: "text.secondary",
                            '&:hover': { background: "transparent", textDecoration: "underline" }
                          }}
                        >
                          Change Number
                        </Button>
                      </Box>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms & Trust Badges */}
              <Box sx={{ mt: 4, textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
                  <Chip 
                    icon={<SecurityIcon sx={{ fontSize: 14 }} />} 
                    label="Secure" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.6, borderRadius: 2 }}
                  />
                  <Chip 
                    icon={<SpeedIcon sx={{ fontSize: 14 }} />} 
                    label="Fast" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.6, borderRadius: 2 }}
                  />
                  <Chip 
                    icon={<StarsIcon sx={{ fontSize: 14 }} />} 
                    label="Trusted by 50k+ Users" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.6, borderRadius: 2 }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    lineHeight: 1.6,
                    fontSize: "11px"
                  }}
                >
                  By continuing, you agree to our{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2563eb",
                      fontWeight: 600,
                      textDecoration: "none"
                    }}
                  >
                    Terms & Conditions
                  </a>
                  {" "}and{" "}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2563eb",
                      fontWeight: 600,
                      textDecoration: "none"
                    }}
                  >
                    Privacy Policy
                  </a>
                  .
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>

        <div id="recaptcha-container"></div>
      </Box>
    </>
  );
};

export default PhoneLogin;