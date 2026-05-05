import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Fade, Grow, Zoom,
  InputAdornment, alpha, useTheme,
  Stepper, Step, StepLabel,
  Avatar, Chip, Backdrop, Snackbar,
  IconButton, Divider, Tooltip, LinearProgress
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
  ArrowBack as ArrowBackIcon,
  Fingerprint as FingerprintIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Verified as VerifiedIcon,
  Shield as ShieldIcon,
  Bolt as BoltIcon,
  Wifi as WifiIcon,
  SignalCellularAlt as SignalIcon
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
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  
  // Refs to prevent duplicate calls
  const verificationInProgress = useRef(false);
  const redirectInProgress = useRef(false);
  const initialCheckDone = useRef(false);
  const otpInputRefs = useRef([]);

  const navigate = useNavigate();

  const steps = ['Mobile Number', 'Verify OTP'];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, rotateY: 90 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotateY: 0,
      transition: { 
        duration: 0.6, 
        type: "spring", 
        stiffness: 100,
        damping: 15
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      rotateY: -90,
      transition: { duration: 0.4 } 
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.03, 
      transition: { 
        duration: 0.2,
        type: "spring",
        stiffness: 400
      } 
    },
    tap: { scale: 0.97 }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  };

  /* ================= AUTO REDIRECT FOR EXISTING USERS ================= */
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

  /* ================= AUTO VERIFY OTP ================= */
  useEffect(() => {
    const fullOtp = otpInputs.join("");
    if (fullOtp.length === 6 && !isAutoVerifying && step === 2 && confirmObj) {
      setOtp(fullOtp);
      setIsAutoVerifying(true);
      const timer = setTimeout(() => {
        verifyOtp();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [otpInputs, step, confirmObj]);

  /* ================= RECAPTCHA SETUP ================= */
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
      setOtp("");
      setFirebaseUser(null);
      setOtpInputs(["", "", "", "", "", ""]);

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

      // Auto-focus first OTP input
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 300);

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

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (verificationInProgress.current) {
      return;
    }
    
    const fullOtp = otp || otpInputs.join("");
    
    if (fullOtp.length !== 6) {
      return setError("Please enter a valid 6-digit OTP");
    }

    verificationInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");
      setSuccess("Verifying OTP...");

      const result = await confirmObj.confirm(fullOtp);
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
      
      // Clear OTP inputs on error
      setOtpInputs(["", "", "", "", "", ""]);
      setOtp("");
      
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
    } finally {
      setLoading(false);
      verificationInProgress.current = false;
      setIsAutoVerifying(false);
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
    setActiveStep(0);
    setConfirmObj(null);
    setOtp("");
    setOtpInputs(["", "", "", "", "", ""]);
    setError("");
    setSuccess("");
    setRegistrationComplete(false);
    setFirebaseUser(null);
    setIsRedirecting(false);
    verificationInProgress.current = false;
    redirectInProgress.current = false;
  };

  /* ================= HANDLE OTP INPUT CHANGE ================= */
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value;
    setOtpInputs(newOtpInputs);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  /* ================= HANDLE OTP KEYDOWN ================= */
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  /* ================= HANDLE OTP PASTE ================= */
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.split("");
    
    if (digits.length === 6 && digits.every(d => /\d/.test(d))) {
      setOtpInputs(digits);
      otpInputRefs.current[5].focus();
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isRedirecting || registrationComplete) {
    return null;
  }

  return (
    <>
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: "blur(8px)",
          background: "rgba(0,0,0,0.7)"
        }}
        open={loading}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="inherit" size={60} />
          <Typography sx={{ mt: 2, fontWeight: 500 }}>
            {step === 1 ? "Sending OTP..." : "Verifying..."}
          </Typography>
        </Box>
      </Backdrop>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.3)}`
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: `radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 50%, transparent 100%)`,
        }}
      >
        {/* Animated background particles */}
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {[...Array(20)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float${Math.floor(Math.random() * 3) + 1} ${Math.random() * 10 + 10}s ease-in-out infinite`,
              }}
            />
          ))}
        </Box>

        <style>
          {`
            @keyframes float1 {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              25% { transform: translate(20px, -20px) rotate(5deg); }
              75% { transform: translate(-20px, 20px) rotate(-5deg); }
            }
            @keyframes float2 {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              25% { transform: translate(-20px, -15px) rotate(-3deg); }
              75% { transform: translate(20px, 15px) rotate(3deg); }
            }
            @keyframes float3 {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              25% { transform: translate(15px, -25px) rotate(8deg); }
              75% { transform: translate(-15px, 25px) rotate(-8deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.1); }
            }
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            @keyframes wave {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}
        </style>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ width: "100%", display: "flex", justifyContent: "center", perspective: "1000px" }}
        >
          <Paper
            elevation={0}
            sx={{
              width: 520,
              maxWidth: "94%",
              borderRadius: 8,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
              backdropFilter: "blur(30px)",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 30px 60px -20px ${alpha(theme.palette.common.black, 0.4)}`,
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
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                backgroundSize: "300% 100%",
                borderRadius: 8,
                opacity: 0.1,
                zIndex: -1,
                animation: "shimmer 4s linear infinite",
              }}
            />

            {/* Top decorative bar */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "6px",
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.success.main})`,
                animation: "shimmer 2s linear infinite",
                backgroundSize: "200% 100%",
              }}
            />

            {/* Header Section */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.95)} 100%)`,
                padding: "40px 32px 32px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Animated waves */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: -20,
                  left: 0,
                  right: 0,
                  height: 40,
                  background: `radial-gradient(ellipse at center, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
                  animation: "wave 2s ease-in-out infinite",
                }}
              />
              
              <motion.div
                animate={floatingAnimation}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    margin: "0 auto 24px",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(255,255,255,0.3)",
                    transform: "rotate(5deg)",
                    transition: "all 0.3s",
                    '&:hover': {
                      transform: "rotate(0deg) scale(1.05)",
                    },
                  }}
                >
                  {step === 1 && <SmartphoneIcon sx={{ fontSize: 50, color: "white" }} />}
                  {step === 2 && <FingerprintIcon sx={{ fontSize: 50, color: "white" }} />}
                </Box>
              </motion.div>
              
              <Typography
                variant="h3"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  mb: 1,
                  letterSpacing: "-1px",
                  textShadow: "0 2px 15px rgba(0,0,0,0.2)",
                  fontSize: { xs: "2rem", sm: "2.5rem" },
                }}
              >
                {step === 1 && "Welcome Back!"}
                {step === 2 && "Secure Access"}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: alpha(theme.palette.common.white, 0.95),
                  opacity: 0.95,
                  fontWeight: 500,
                  maxWidth: "80%",
                  mx: "auto",
                }}
              >
                {step === 1 && "Experience seamless login with just your mobile number"}
                {step === 2 && `Enter the 6-digit code sent to +91 ${phone}`}
              </Typography>
            </Box>

            {/* Floating progress indicator */}
            {step === 2 && (
              <Box sx={{ px: 4, pt: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {steps.map((label, index) => (
                    <Box key={label} sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          height: 4,
                          background: index <= activeStep 
                            ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                            : alpha(theme.palette.divider, 0.3),
                          borderRadius: 2,
                          transition: "all 0.3s",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          display: "block",
                          textAlign: "center",
                          fontWeight: index === activeStep ? 600 : 400,
                          color: index === activeStep ? theme.palette.primary.main : "text.secondary",
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Content Section */}
            <Box sx={{ padding: "32px 32px 36px" }}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        animation: "shake 0.3s ease-in-out",
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
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
                      sx={{ mb: 3, borderRadius: 2 }}
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
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      inputProps={{ maxLength: 10 }}
                      margin="normal"
                      variant="outlined"
                      autoFocus
                      placeholder="9876543210"
                      helperText="We'll send a verification code to this number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Chip 
                              label="+91" 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                borderRadius: 2,
                              }} 
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 3,
                          transition: "all 0.2s",
                          '&:hover': {
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                        }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}`,
                          }
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
                        endIcon={!loading && <SendIcon />}
                        sx={{
                          borderRadius: 3,
                          py: 1.8,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          transition: "all 0.3s",
                          position: "relative",
                          overflow: "hidden",
                          '&::before': {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: "-100%",
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
                            transition: "left 0.5s",
                          },
                          '&:hover::before': {
                            left: "100%",
                          },
                          '&:hover': {
                            transform: "translateY(-2px)",
                            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={26} color="inherit" /> : "Get Started"}
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
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: "center",
                          mb: 2,
                          color: "text.secondary",
                        }}
                      >
                        Enter the 6-digit verification code
                      </Typography>
                      
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          justifyContent: "center",
                          mb: 2,
                        }}
                        onPaste={handleOtpPaste}
                      >
                        {otpInputs.map((digit, index) => (
                          <TextField
                            key={index}
                            inputRef={(el) => (otpInputRefs.current[index] = el)}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            inputProps={{
                              maxLength: 1,
                              style: {
                                textAlign: "center",
                                fontSize: "1.8rem",
                                padding: "16px 8px",
                                width: "100%",
                              },
                            }}
                            variant="outlined"
                            sx={{
                              width: 60,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                transition: "all 0.2s",
                                '&.Mui-focused': {
                                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                                  borderColor: theme.palette.primary.main,
                                },
                              },
                            }}
                          />
                        ))}
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          textAlign: "center",
                          display: "block",
                          color: "text.secondary",
                        }}
                      >
                        {otpTimer > 0 ? (
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                            <SignalIcon sx={{ fontSize: 16, animation: "pulse 1s infinite" }} />
                            <span>Code expires in <strong style={{ color: theme.palette.primary.main }}>{otpTimer}s</strong></span>
                          </Box>
                        ) : (
                          "Didn't receive the code?"
                        )}
                      </Typography>
                    </Box>

                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        fullWidth
                        onClick={verifyOtp}
                        disabled={loading || otpInputs.join("").length !== 6 || verificationInProgress.current}
                        variant="contained"
                        size="large"
                        endIcon={!loading && <VerifiedUserIcon />}
                        sx={{
                          borderRadius: 3,
                          py: 1.8,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          mb: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          position: "relative",
                          overflow: "hidden",
                          '&::before': {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: "-100%",
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
                            transition: "left 0.5s",
                          },
                          '&:hover::before': {
                            left: "100%",
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={26} color="inherit" /> : "Verify & Continue"}
                      </Button>
                    </motion.div>

                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      {otpTimer > 0 ? (
                        <Chip 
                          label={`Resend in ${otpTimer}s`} 
                          size="medium" 
                          variant="outlined"
                          sx={{ 
                            opacity: 0.7,
                            borderRadius: 2,
                            '& .MuiChip-label': { fontWeight: 500 }
                          }}
                        />
                      ) : (
                        <Button
                          onClick={resendOtp}
                          disabled={isResending}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            '&:hover': { 
                              background: "transparent",
                              transform: "scale(1.05)",
                            },
                            transition: "all 0.2s",
                          }}
                        >
                          {isResending ? <CircularProgress size={20} /> : "Resend Verification Code"}
                        </Button>
                      )}
                      
                      <Button
                        onClick={backToPhone}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                          mt: 1.5,
                          textTransform: "none",
                          color: "text.secondary",
                          fontSize: "0.9rem",
                          '&:hover': { 
                            background: "transparent",
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        Use different number
                      </Button>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              <Divider sx={{ my: 3 }}>
                <Chip 
                  label="Secure Connection" 
                  size="small" 
                  icon={<ShieldIcon sx={{ fontSize: 16 }} />}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    fontWeight: 500,
                  }}
                />
              </Divider>

              {/* Feature badges */}
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
                <Tooltip title="256-bit SSL Encryption">
                  <Chip 
                    icon={<SecurityIcon sx={{ fontSize: 16 }} />} 
                    label="Bank-grade" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      transition: "all 0.2s",
                      '&:hover': {
                        transform: "translateY(-2px)",
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }}
                  />
                </Tooltip>
                <Tooltip title="Under 5 seconds">
                  <Chip 
                    icon={<BoltIcon sx={{ fontSize: 16 }} />} 
                    label="Lightning Fast" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      transition: "all 0.2s",
                      '&:hover': {
                        transform: "translateY(-2px)",
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }}
                  />
                </Tooltip>
                <Tooltip title="Trusted by 10,000+ users">
                  <Chip 
                    icon={<StarsIcon sx={{ fontSize: 16 }} />} 
                    label="Trusted" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      transition: "all 0.2s",
                      '&:hover': {
                        transform: "translateY(-2px)",
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }}
                  />
                </Tooltip>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  textAlign: "center",
                  mt: 2.5,
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
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    textDecoration: "none",
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
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Privacy Policy
                </a>
                .
              </Typography>
            </Box>

            <div id="recaptcha-container"></div>
          </Paper>
        </motion.div>
      </Box>
    </>
  );
};

export default PhoneLogin;