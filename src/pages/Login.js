import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Fade, Zoom,
  InputAdornment, alpha, useTheme,
  Stepper, Step, StepLabel,
  Chip, Backdrop, Snackbar,
  IconButton, Divider,
  LinearProgress
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Smartphone as SmartphoneIcon,
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Stars as StarsIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Key as KeyIcon,
  NotificationsNone as NotificationsIcon,
  Fingerprint as FingerprintIcon,
  WifiOff as WifiOffIcon
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
  const [otp, setOtp] = useState("");
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
  const [activeStep, setActiveStep] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Refs to prevent duplicate calls
  const verificationInProgress = useRef(false);
  const redirectInProgress = useRef(false);
  const initialCheckDone = useRef(false);

  const navigate = useNavigate();

  // Design System
  const gradients = {
    primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    secondary: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
    accent: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
    success: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
    dark: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`
  };

  const glowEffect = {
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    transition: "box-shadow 0.3s ease-in-out"
  };

  // Auto redirect for existing users
  useEffect(() => {
    if (authLoading || redirectInProgress.current || registrationComplete || isRedirecting) {
      return;
    }
    
    if (initialCheckDone.current) return;
    
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

  // Language setup
  useEffect(() => {
    if (auth) {
      auth.useDeviceLanguage();
    }
  }, []);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Recaptcha setup
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

  // Redirect function
  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/");
  };

  // Save auth data
  const saveAuthData = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (login) {
      login(userData);
    }
    setAuthToken(token);
  };

  // Send OTP
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
      setOtp("");
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
      setActiveStep(1);

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

  // Verify OTP
  const verifyOtp = async () => {
    if (verificationInProgress.current) return;
    
    if (otp.length !== 6) {
      return setError("Please enter a valid 6-digit OTP");
    }

    verificationInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");

      const result = await confirmObj.confirm(otp);
      setFirebaseUser(result.user);
      
      const idToken = await result.user.getIdToken(true);
      
      await requestNotificationPermission();
      
      const checkResponse = await userAPI.post("/auth/firebase", {
        idToken,
        role: "user",
        phone: phone
      });
      
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
        
        setSnackbarMessage("Welcome back! 🚀");
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

  // Resend OTP
  const resendOtp = async () => {
    if (otpTimer > 0) return;
    setIsResending(true);
    await sendOtp();
    setIsResending(false);
  };

  // Back to phone
  const backToPhone = () => {
    setStep(1);
    setActiveStep(0);
    setConfirmObj(null);
    setOtp("");
    setError("");
    setSuccess("");
    setRegistrationComplete(false);
    setFirebaseUser(null);
    setIsRedirecting(false);
    verificationInProgress.current = false;
    redirectInProgress.current = false;
  };

  // Loading state
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} sx={{ color: "#667eea" }} />
          <Typography variant="h6" sx={{ mt: 3, color: "white" }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Redirect state
  if (isRedirecting || registrationComplete) {
    return null;
  }

  return (
    <>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: "blur(10px)",
          background: "rgba(0,0,0,0.8)"
        }}
        open={loading}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" size={60} />
          <Typography sx={{ mt: 2 }}>Processing...</Typography>
        </Box>
      </Backdrop>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Main Container */}
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background particles */}
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha("#667eea", 0.1)} 0%, transparent 70%)`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float${(i % 3) + 1} ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}

        <style>
          {`
            @keyframes float1 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-50px) rotate(5deg); }
            }
            @keyframes float2 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(50px) rotate(-5deg); }
            }
            @keyframes float3 {
              0%, 100% { transform: translateX(0px) rotate(0deg); }
              50% { transform: translateX(50px) rotate(10deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.05); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}
        </style>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{ width: "100%", display: "flex", justifyContent: "center", padding: "20px" }}
        >
          <Paper
            elevation={0}
            sx={{
              width: 520,
              maxWidth: "100%",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Animated gradient border */}
            <Box
              sx={{
                position: "absolute",
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe, #667eea)",
                backgroundSize: "300% 300%",
                borderRadius: 8,
                zIndex: -1,
                animation: "spin 3s linear infinite",
                opacity: 0.3,
              }}
            />

            {/* Header Section */}
            <Box
              sx={{
                background: gradients.accent,
                padding: "40px 32px 30px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    margin: "0 auto 20px",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(255,255,255,0.3)",
                    position: "relative",
                  }}
                >
                  {step === 1 && (
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <SmartphoneIcon sx={{ fontSize: 55, color: "white" }} />
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <KeyIcon sx={{ fontSize: 55, color: "white" }} />
                    </motion.div>
                  )}
                </Box>
              </motion.div>
              
              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  mb: 1,
                  letterSpacing: "-0.5px",
                  textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                {step === 1 && "Welcome Aboard!"}
                {step === 2 && "Enter Verification Code"}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: alpha("#fff", 0.95),
                  fontWeight: 500,
                }}
              >
                {step === 1 && "Get started with your phone number"}
                {step === 2 && `Code sent to +91 ${phone.slice(0, 5)}*****`}
              </Typography>

              {/* Decorative elements */}
              <Box
                sx={{
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  animation: "pulse 3s ease-in-out infinite",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -50,
                  left: -50,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  animation: "pulse 4s ease-in-out infinite reverse",
                }}
              />
            </Box>

            {/* Progress Indicator */}
            <Box sx={{ px: 4, pt: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
                </Typography>
                <Chip
                  label={step === 1 ? "Phone Number" : "Verification"}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontWeight: 600,
                  }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={step === 1 ? 50 : 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: gradients.accent,
                  }
                }}
              />
            </Box>

            {/* Content Section */}
            <Box sx={{ padding: "24px 32px 32px" }}>
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
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                      }}
                      onClose={() => setError("")}
                      icon={<CloseIcon fontSize="small" />}
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
                      sx={{ mb: 3, borderRadius: 3 }}
                      onClose={() => setSuccess("")}
                    >
                      {success}
                    </Alert>
                  </motion.div>
                )}

                {/* Step 1: Phone Number */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                      Mobile Number
                    </Typography>
                    <TextField
                      fullWidth
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      inputProps={{ maxLength: 10 }}
                      variant="outlined"
                      placeholder="9876543210"
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Chip 
                              label="+91" 
                              size="medium" 
                              sx={{ 
                                bgcolor: gradients.accent,
                                color: "white",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                height: 32,
                              }} 
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 4,
                          fontSize: "1.1rem",
                          '&:hover': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                          },
                        }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: glowEffect.boxShadow,
                          }
                        }
                      }}
                    />

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        fullWidth
                        onClick={sendOtp}
                        disabled={loading || phone.replace(/\D/g, "").length !== 10}
                        variant="contained"
                        size="large"
                        endIcon={!loading && <SendIcon />}
                        sx={{
                          borderRadius: 4,
                          py: 1.8,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          background: gradients.accent,
                          transition: "all 0.3s",
                          '&:hover': {
                            transform: "translateY(-2px)",
                            boxShadow: `0 10px 30px ${alpha("#667eea", 0.4)}`,
                          },
                          '&:disabled': {
                            background: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)",
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={28} color="inherit" /> : "Send Verification Code"}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                      Verification Code
                    </Typography>
                    <TextField
                      fullWidth
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      inputProps={{ maxLength: 6 }}
                      variant="outlined"
                      placeholder="123456"
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SecurityIcon sx={{ color: "#667eea" }} />
                          </InputAdornment>
                        ),
                        sx: { 
                          borderRadius: 4,
                          fontSize: "1.1rem",
                          letterSpacing: "2px",
                        }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: glowEffect.boxShadow,
                          }
                        }
                      }}
                    />

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        fullWidth
                        onClick={verifyOtp}
                        disabled={loading || otp.length !== 6 || verificationInProgress.current}
                        variant="contained"
                        size="large"
                        endIcon={!loading && <VerifiedUserIcon />}
                        sx={{
                          borderRadius: 4,
                          py: 1.8,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          background: gradients.accent,
                          mb: 2,
                        }}
                      >
                        {loading ? <CircularProgress size={28} color="inherit" /> : "Verify & Continue"}
                      </Button>
                    </motion.div>

                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, alignItems: "center" }}>
                        {otpTimer > 0 ? (
                          <Chip 
                            label={`Resend in ${otpTimer}s`} 
                            size="medium" 
                            variant="outlined"
                            sx={{ 
                              opacity: 0.7,
                              borderRadius: 3,
                              fontWeight: 600
                            }}
                          />
                        ) : (
                          <Button
                            onClick={resendOtp}
                            disabled={isResending}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              color: "#667eea",
                              '&:hover': { background: alpha("#667eea", 0.1) }
                            }}
                          >
                            {isResending ? <CircularProgress size={20} /> : "Resend Code"}
                          </Button>
                        )}
                        <Divider orientation="vertical" flexItem />
                        <Button
                          onClick={backToPhone}
                          startIcon={<ArrowBackIcon />}
                          sx={{
                            textTransform: "none",
                            color: "text.secondary",
                            '&:hover': { background: "transparent" }
                          }}
                        >
                          Change Number
                        </Button>
                      </Box>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              <Divider sx={{ my: 3 }}>
                <Chip label="Secure" size="small" icon={<SecurityIcon />} />
              </Divider>

              {/* Trust Indicators */}
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  <Chip 
                    icon={<SecurityIcon sx={{ fontSize: 16 }} />} 
                    label="End-to-end encrypted" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.7 }}
                  />
                  <Chip 
                    icon={<FingerprintIcon sx={{ fontSize: 16 }} />} 
                    label="Biometric ready" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.7 }}
                  />
                  <Chip 
                    icon={<SpeedIcon sx={{ fontSize: 16 }} />} 
                    label="Instant verification" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.7 }}
                  />
                </Box>
                
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    mt: 2,
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
                      color: "#667eea",
                      fontWeight: 700,
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
                      color: "#667eea",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    Privacy Policy
                  </a>
                  .
                </Typography>
              </Box>
            </Box>

            <div id="recaptcha-container"></div>
          </Paper>
        </motion.div>
      </Box>
    </>
  );
};

export default PhoneLogin;