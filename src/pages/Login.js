import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Fade, Grow, Zoom,
  InputAdornment, alpha, useTheme,
  Stepper, Step, StepLabel,
  Avatar, Chip, Backdrop, Snackbar,
  IconButton, Divider, Stack
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
  WhatsApp as WhatsAppIcon,
  Apple as AppleIcon,
  Google as GoogleIcon,
  Fingerprint as FingerprintIcon,
  Shield as ShieldIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AutoAwesome as AutoAwesomeIcon,
  Diamond as DiamondIcon,
  RocketLaunch as RocketLaunchIcon,
  VpnKey as VpnKeyIcon,
  MarkEmailRead as MarkEmailReadIcon
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
  const [isSuccessGlowing, setIsSuccessGlowing] = useState(false);
  
  // Refs to prevent duplicate calls
  const verificationInProgress = useRef(false);
  const redirectInProgress = useRef(false);
  const initialCheckDone = useRef(false);

  const navigate = useNavigate();

  const steps = ['Mobile Number', 'Verify OTP'];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        type: "spring", 
        stiffness: 100,
        damping: 15
      } 
    },
    exit: { opacity: 0, scale: 0.95, y: -30, transition: { duration: 0.4 } }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.02, 
      transition: { duration: 0.2, type: "spring", stiffness: 400 },
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
    },
    tap: { scale: 0.98 }
  };

  const glowVariants = {
    initial: { boxShadow: "0 0 0 0 rgba(99, 102, 241, 0.4)" },
    animate: { 
      boxShadow: ["0 0 0 0 rgba(99, 102, 241, 0.4)", "0 0 0 20px rgba(99, 102, 241, 0)"],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
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

  /* ================= SUCCESS GLOW EFFECT ================= */
  useEffect(() => {
    if (success) {
      setIsSuccessGlowing(true);
      const timer = setTimeout(() => setIsSuccessGlowing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
      setSuccess("✨ OTP sent successfully!");
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

  /* ================= FIXED: VERIFY OTP - INSTANT REDIRECT ================= */
  const verifyOtp = async () => {
    if (verificationInProgress.current) {
      return;
    }
    
    if (otp.length !== 6) {
      return setError("Please enter a valid 6-digit OTP");
    }

    verificationInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");
      setSuccess("🔐 Verifying OTP...");

      const result = await confirmObj.confirm(otp);
      setFirebaseUser(result.user);
      
      setSuccess("✅ OTP verified successfully!");
      
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
        
        setSnackbarMessage("🎉 Welcome aboard! Redirecting...");
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

  // Show loading state while checking for existing session
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <CircularProgress 
            size={60} 
            thickness={4}
            sx={{ color: "white" }}
          />
        </motion.div>
      </Box>
    );
  }

  // FIX: RETURN NULL WHEN REDIRECTING - NO UI SHOWN AT ALL
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
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <CircularProgress color="inherit" size={60} thickness={4} />
        </motion.div>
      </Backdrop>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <Alert 
            severity="success" 
            sx={{ 
              width: '100%',
              borderRadius: 3,
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              '& .MuiAlert-icon': { color: "white" }
            }}
          >
            {snackbarMessage}
          </Alert>
        </motion.div>
      </Snackbar>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background elements */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            top: "-150px",
            right: "-150px",
          }}
        />
        
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
            bottom: "-100px",
            left: "-100px",
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, (Math.random() - 0.5) * 100, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            style={{
              position: "absolute",
              width: "3px",
              height: "3px",
              background: "white",
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
        
        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(5deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes shine {
              0% { transform: translateX(-100%) rotate(45deg); }
              100% { transform: translateX(200%) rotate(45deg); }
            }
            @keyframes ripple {
              0% { transform: scale(0.8); opacity: 0.5; }
              100% { transform: scale(2.5); opacity: 0; }
            }
          `}
        </style>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ width: "100%", display: "flex", justifyContent: "center", zIndex: 10 }}
        >
          <Paper
            elevation={0}
            sx={{
              width: 520,
              maxWidth: "92%",
              borderRadius: 8,
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Premium gradient border animation */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe, #667eea)",
                backgroundSize: "200% 100%",
                animation: "gradientShift 3s linear infinite",
              }}
            />

            {/* Success glow overlay */}
            {isSuccessGlowing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Header Section */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "40px 32px 35px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Shine effect */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  transform: "translateX(-100%)",
                  animation: "shine 3s infinite",
                }}
              />

              <Zoom in timeout={600}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      margin: "0 auto 25px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.4)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    }}
                  >
                    {step === 1 && (
                      <RocketLaunchIcon sx={{ fontSize: 50, color: "white" }} />
                    )}
                    {step === 2 && (
                      <VpnKeyIcon sx={{ fontSize: 50, color: "white" }} />
                    )}
                  </Box>
                </motion.div>
              </Zoom>
              
              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  mb: 1.5,
                  letterSpacing: "-0.5px",
                  textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  fontSize: { xs: "1.8rem", sm: "2.2rem" }
                }}
              >
                {step === 1 && "Welcome Back!"}
                {step === 2 && "Verify Your Number"}
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: alpha(theme.palette.common.white, 0.95),
                  opacity: 0.95,
                  fontWeight: 500,
                  maxWidth: "300px",
                  margin: "0 auto"
                }}
              >
                {step === 1 && "Enter your mobile number to continue"}
                {step === 2 && `We've sent a 6-digit code to +91 ${phone}`}
              </Typography>
            </Box>

            {/* Modern Stepper */}
            {step === 2 && (
              <Box sx={{ px: 4, pt: 4 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel 
                        StepIconProps={{
                          sx: {
                            '&.Mui-active': { 
                              color: '#667eea',
                              '& .MuiStepIcon-text': { fill: 'white' }
                            },
                            '&.Mui-completed': { color: '#4caf50' },
                            fontSize: '2rem'
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, color: index === activeStep ? '#667eea' : 'text.secondary' }}>
                          {label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}

            {/* Content */}
            <Box sx={{ padding: "32px 36px 40px" }}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 3,
                        animation: "shake 0.3s ease-in-out",
                        borderLeft: "4px solid #f44336"
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
                      sx={{ 
                        mb: 3, 
                        borderRadius: 3,
                        background: "linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)",
                        borderLeft: "4px solid #4caf50"
                      }}
                      onClose={() => setSuccess("")}
                      icon={<CheckCircleOutlineIcon />}
                    >
                      {success}
                    </Alert>
                  </motion.div>
                )}

                {/* Step 1: Phone Number */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
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
                                bgcolor: alpha('#667eea', 0.1),
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: '#667eea'
                              }} 
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 4,
                          transition: "all 0.3s",
                          '&:hover': {
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          },
                        }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: "0 0 0 3px rgba(102,126,234,0.2)",
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
                        endIcon={!loading && <ArrowForwardIcon />}
                        sx={{
                          borderRadius: 4,
                          py: 1.8,
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          transition: "all 0.3s",
                          '&:hover': {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(102,126,234,0.4)",
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Continue"}
                      </Button>
                    </motion.div>

                    <Divider sx={{ my: 3 }}>
                      <Chip label="OR" size="small" />
                    </Divider>

                    {/* Social Login Options */}
                    <Stack direction="row" spacing={2}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ flex: 1 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<GoogleIcon />}
                          sx={{
                            borderRadius: 3,
                            py: 1.2,
                            textTransform: "none",
                            borderColor: alpha('#000', 0.1),
                            '&:hover': {
                              borderColor: '#667eea',
                              background: alpha('#667eea', 0.05)
                            }
                          }}
                        >
                          Google
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ flex: 1 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<AppleIcon />}
                          sx={{
                            borderRadius: 3,
                            py: 1.2,
                            textTransform: "none",
                            borderColor: alpha('#000', 0.1),
                            '&:hover': {
                              borderColor: '#667eea',
                              background: alpha('#667eea', 0.05)
                            }
                          }}
                        >
                          Apple
                        </Button>
                      </motion.div>
                    </Stack>
                  </motion.div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Animated OTP Input */}
                    <Box sx={{ position: "relative", mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        inputProps={{ maxLength: 6 }}
                        margin="normal"
                        variant="outlined"
                        autoFocus
                        placeholder="123456"
                        helperText={
                          otpTimer > 0 ? (
                            <motion.span
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              ⏱️ Code expires in {otpTimer}s
                            </motion.span>
                          ) : "Didn't receive code?"
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FingerprintIcon sx={{ color: '#667eea' }} />
                            </InputAdornment>
                          ),
                          sx: { 
                            borderRadius: 4,
                            fontSize: "1.2rem",
                            letterSpacing: "2px"
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused': {
                              boxShadow: "0 0 0 3px rgba(102,126,234,0.2)",
                            }
                          }
                        }}
                      />
                      
                      {/* Ripple effect on OTP entry */}
                      {otp.length === 6 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.5, 2], opacity: [0.5, 0] }}
                          transition={{ duration: 0.8 }}
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle, rgba(102,126,234,0.3) 0%, transparent 70%)",
                            pointerEvents: "none",
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      )}
                    </Box>

                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
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
                          fontSize: "1rem",
                          fontWeight: 700,
                          mb: 2,
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify & Login"}
                      </Button>
                    </motion.div>

                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {otpTimer > 0 ? (
                          <Chip 
                            label={`Resend code in ${otpTimer}s`} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              opacity: 0.7,
                              borderRadius: 2,
                              borderColor: alpha('#667eea', 0.3)
                            }}
                          />
                        ) : (
                          <Button
                            onClick={resendOtp}
                            disabled={isResending}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              color: '#667eea',
                              '&:hover': { 
                                background: alpha('#667eea', 0.05),
                                transform: "translateY(-1px)"
                              },
                              transition: "all 0.2s"
                            }}
                          >
                            {isResending ? <CircularProgress size={20} /> : "Resend OTP →"}
                          </Button>
                        )}
                      </Typography>
                      
                      <Button
                        onClick={backToPhone}
                        sx={{
                          mt: 1.5,
                          textTransform: "none",
                          color: "text.secondary",
                          fontSize: "0.85rem",
                          '&:hover': { 
                            background: "transparent",
                            color: '#667eea'
                          }
                        }}
                      >
                        ← Change Phone Number
                      </Button>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trust badges with animations */}
              <Box sx={{ mt: 4, textAlign: "center" }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Chip 
                        icon={<ShieldIcon sx={{ fontSize: 16 }} />} 
                        label="256-bit SSL" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          opacity: 0.7,
                          borderRadius: 2,
                          borderColor: alpha('#667eea', 0.3)
                        }}
                      />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Chip 
                        icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />} 
                        label="Instant Delivery" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          opacity: 0.7,
                          borderRadius: 2,
                          borderColor: alpha('#667eea', 0.3)
                        }}
                      />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Chip 
                        icon={<DiamondIcon sx={{ fontSize: 16 }} />} 
                        label="Premium Support" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          opacity: 0.7,
                          borderRadius: 2,
                          borderColor: alpha('#667eea', 0.3)
                        }}
                      />
                    </motion.div>
                  </Stack>
                </motion.div>
                
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    mt: 2,
                    lineHeight: 1.8,
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
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                    onMouseLeave={(e) => e.target.style.textDecoration = "none"}
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
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                    onMouseLeave={(e) => e.target.style.textDecoration = "none"}
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