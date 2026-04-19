import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Fade, Grow, Zoom,
  InputAdornment, alpha, useTheme,
  Stepper, Step, StepLabel,
  Avatar, Chip, Backdrop, Snackbar
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
  Close as CloseIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../firebase";
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
  const [name, setName] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  // Flow control states
  const [otpVerified, setOtpVerified] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [flowCompleted, setFlowCompleted] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Name
  const [activeStep, setActiveStep] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  
  // Refs to prevent duplicate calls
  const verificationInProgress = useRef(false);
  const redirectInProgress = useRef(false);
  const nameSubmissionInProgress = useRef(false);

  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: "spring", stiffness: 100 } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.3 } }
  };

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  /* ================= AUTO REDIRECT FOR EXISTING USERS ================= */
  useEffect(() => {
    // Don't redirect if:
    if (authLoading || !user || !authRole || needsName || flowCompleted || redirectInProgress.current) {
      return;
    }

    // Only redirect if user has name (existing user)
    if (user.name && user.name.trim() !== "" && !needsName) {
      redirectInProgress.current = true;
      setTimeout(() => {
        redirect(authRole);
      }, 1000);
    }
  }, [user, authRole, authLoading, needsName, flowCompleted]);

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

  /* ================= CLEANUP RECAPTCHA ================= */
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (err) {
          console.error("Error clearing recaptcha:", err);
        }
      }
    };
  }, []);

  /* ================= RECAPTCHA SETUP ================= */
  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    } catch (err) {
      console.error("Recaptcha error:", err);
    }
  };

  /* ================= REDIRECT ================= */
  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else if (role === "vendor") navigate("/vendor/dashboard");
    else navigate("/");
  };

  /* ================= CHECK IF USER NEEDS NAME ================= */
  const checkIfNeedsName = async (firebaseUserObj) => {
    try {
      const idToken = await firebaseUserObj.getIdToken(true);
      
      console.log("Checking user with phone:", phone);
      
      const res = await userAPI.post("/auth/firebase", {
        idToken,
        role: "tenant",
        phone: phone
      });

      console.log("✅ User check response:", res.data);

      // Store the user data in context if needed
      if (res.data.user && !user) {
        // You might want to update your auth context here
        // login(res.data.user);
      }

      // Check if user needs to provide name
      if (res.data.needsName === true) {
        console.log("User needs to provide name");
        setNeedsName(true);
        setIsExistingUser(res.data.isExistingUser || false);
        setStep(3);
        setActiveStep(2);
        return true;
      }
      
      // User has a name and is existing
      console.log("Existing user with name, redirecting...");
      setNeedsName(false);
      setIsExistingUser(true);
      setFlowCompleted(true);
      
      setSnackbarMessage(res.data.message || `Welcome back ${res.data.user?.name || ''}!`);
      setSnackbarOpen(true);
      
      // Redirect after short delay
      setTimeout(() => {
        redirect(res.data.user?.role || "tenant");
      }, 1500);
      
      return false;
      
    } catch (err) {
      console.error("❌ Error checking user:", err);
      
      // On error, show name collection to be safe
      setNeedsName(true);
      setIsExistingUser(false);
      setStep(3);
      setActiveStep(2);
      return true;
    }
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

      setupRecaptcha();

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
      setOtp(""); // Clear any previous OTP

    } catch (err) {
      console.error("Send OTP error:", err);
      setError("Failed to send OTP. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    // Prevent multiple verification attempts
    if (verificationInProgress.current) {
      console.log("Verification already in progress");
      return;
    }
    
    if (otp.length !== 6) {
      return setError("Please enter a valid 6-digit OTP");
    }

    verificationInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const result = await confirmObj.confirm(otp);
      setFirebaseUser(result.user);
      setOtpVerified(true);
      
      setSuccess("OTP verified successfully!");
      
      // Check if user needs to provide name
      await checkIfNeedsName(result.user);
      
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("Invalid OTP. Please try again.");
      setOtpVerified(false);
      setStep(2); // Stay on OTP step
    } finally {
      setLoading(false);
      verificationInProgress.current = false;
    }
  };

  /* ================= COMPLETE REGISTRATION FOR NEW USER ================= */
  const completeRegistration = async () => {
    // Prevent multiple submissions
    if (nameSubmissionInProgress.current) {
      console.log("Name submission already in progress");
      return;
    }
    
    if (!firebaseUser) {
      setError("Session expired. Please try again.");
      setStep(1);
      setActiveStep(0);
      setNeedsName(false);
      return;
    }
    
    if (!name.trim()) {
      return setError("Please enter your full name");
    }
    
    if (name.trim().length < 3) {
      return setError("Please enter a valid name (minimum 3 characters)");
    }
    
    if (/^[0-9+]+$/.test(name.trim())) {
      return setError("Please enter a valid name (not phone number)");
    }
    
    nameSubmissionInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");

      const idToken = await firebaseUser.getIdToken(true);
      
      console.log("Registering user with name:", name.trim(), "phone:", phone);
      
      const res = await userAPI.post(
        "/auth/register",
        {
          name: name.trim(),
          phone: phone,
          idToken: idToken
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        }
      );

      console.log("Registration complete response:", res.data);

      if (res.data.success) {
        setFlowCompleted(true);
        setNeedsName(false);
        
        setSnackbarMessage(`Welcome ${name.trim()}! Your account has been created.`);
        setSnackbarOpen(true);
        
        // Reset all states
        setTimeout(() => {
          // Clear all form data
          setPhone("");
          setOtp("");
          setName("");
          setConfirmObj(null);
          setFirebaseUser(null);
          setOtpVerified(false);
          setStep(1);
          setActiveStep(0);
          
          // Redirect to home after registration
          navigate("/");
        }, 2000);
        
      } else {
        setError(res.data.message || "Registration failed");
        // Keep user on name step if registration fails
        setStep(3);
        setActiveStep(2);
      }
      
    } catch (err) {
      console.error("Complete registration error:", err);
      setError(err?.response?.data?.message || "Server error. Please try again.");
      // Keep user on name step
      setStep(3);
      setActiveStep(2);
    } finally {
      setLoading(false);
      nameSubmissionInProgress.current = false;
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
    setNeedsName(false);
    setOtpVerified(false);
    setFlowCompleted(false);
    setIsExistingUser(false);
    setFirebaseUser(null);
    verificationInProgress.current = false;
    redirectInProgress.current = false;
    nameSubmissionInProgress.current = false;
  };

  // Steps for stepper
  const steps = ['Mobile Number', 'Verify OTP', 'Complete Profile'];

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
        <Alert severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 50%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
            top: "-150px",
            right: "-150px",
            animation: "float1 8s ease-in-out infinite",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
            bottom: "-100px",
            left: "-100px",
            animation: "float2 10s ease-in-out infinite reverse",
          }}
        />
        
        <style>
          {`
            @keyframes float1 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-30px) rotate(5deg); }
            }
            @keyframes float2 {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(30px) rotate(-5deg); }
            }
            @keyframes shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            @keyframes glow {
              0%, 100% { box-shadow: 0 0 5px ${alpha(theme.palette.primary.main, 0.3)}; }
              50% { box-shadow: 0 0 20px ${alpha(theme.palette.primary.main, 0.6)}; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }
          `}
        </style>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <Paper
            elevation={0}
            sx={{
              width: 500,
              maxWidth: "92%",
              borderRadius: 6,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 25px 50px -12px ${alpha(theme.palette.common.black, 0.3)}`,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Gradient border effect */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                backgroundSize: "200% 100%",
                animation: "shimmer 3s linear infinite",
              }}
            />

            {/* Header with gradient */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.95)} 100%)`,
                padding: "35px 32px 25px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <Zoom in timeout={600}>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      margin: "0 auto 20px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "25px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {step === 1 && <SmartphoneIcon sx={{ fontSize: 45, color: "white" }} />}
                    {step === 2 && <LockIcon sx={{ fontSize: 45, color: "white" }} />}
                    {step === 3 && <PersonIcon sx={{ fontSize: 45, color: "white" }} />}
                  </Box>
                </motion.div>
              </Zoom>
              
              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  mb: 1,
                  letterSpacing: "-0.5px",
                  textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                {step === 1 && "Welcome Back!"}
                {step === 2 && "Verify Your Number"}
                {step === 3 && "Complete Your Profile"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: alpha(theme.palette.common.white, 0.95),
                  opacity: 0.95,
                  fontWeight: 500,
                }}
              >
                {step === 1 && "Enter your mobile number to get started"}
                {step === 2 && `We've sent a 6-digit code to +91 ${phone}`}
                {step === 3 && "Please tell us your name to continue"}
              </Typography>
            </Box>

            {/* Stepper - Only show when needed */}
            {(step === 2 || (step === 3 && needsName)) && (
              <Box sx={{ px: 4, pt: 3 }}>
                <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 2 }}>
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel 
                        StepIconProps={{
                          sx: {
                            '&.Mui-active': { color: theme.palette.primary.main },
                            '&.Mui-completed': { color: theme.palette.success.main }
                          }
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}

            {/* Content */}
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
                        borderRadius: 2,
                        animation: "shake 0.3s ease-in-out",
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
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
                                fontWeight: 600,
                                fontSize: "0.85rem"
                              }} 
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 3,
                          transition: "all 0.2s",
                          '&:hover': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                        }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
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
                          py: 1.5,
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          transition: "all 0.3s",
                          '&:hover': {
                            transform: "translateY(-2px)",
                            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Send OTP"}
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
                    transition={{ duration: 0.3 }}
                  >
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
                      helperText={`${otpTimer > 0 ? `Code expires in ${otpTimer}s` : "Didn't receive code?"}`}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SecurityIcon color="primary" />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 3 }
                      }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
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
                        onClick={verifyOtp}
                        disabled={loading || otp.length !== 6 || verificationInProgress.current}
                        variant="contained"
                        size="large"
                        endIcon={!loading && <VerifiedUserIcon />}
                        sx={{
                          borderRadius: 3,
                          py: 1.5,
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 700,
                          mb: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify OTP"}
                      </Button>
                    </motion.div>

                    <Box sx={{ textAlign: "center", mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {otpTimer > 0 ? (
                          <Chip 
                            label={`Resend in ${otpTimer}s`} 
                            size="small" 
                            variant="outlined"
                            sx={{ opacity: 0.7 }}
                          />
                        ) : (
                          <Button
                            onClick={resendOtp}
                            disabled={isResending}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              '&:hover': { background: "transparent" }
                            }}
                          >
                            {isResending ? <CircularProgress size={20} /> : "Resend OTP"}
                          </Button>
                        )}
                      </Typography>
                      <Button
                        onClick={backToPhone}
                        sx={{
                          mt: 1.5,
                          textTransform: "none",
                          color: "text.secondary",
                          '&:hover': { background: "transparent" }
                        }}
                      >
                        ← Change Phone Number
                      </Button>
                    </Box>
                  </motion.div>
                )}

                {/* Step 3: Name Collection (For new users only) */}
                {step === 3 && needsName && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          margin: "0 auto",
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          mb: 2,
                          animation: "glow 2s infinite"
                        }}
                      >
                        <EmojiEmotionsIcon sx={{ fontSize: 45 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Welcome to our platform!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Please tell us your name to personalize your experience
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      margin="normal"
                      variant="outlined"
                      autoFocus
                      placeholder="Enter your full name"
                      helperText="This will be displayed on your profile"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="primary" />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 3 }
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
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
                        onClick={completeRegistration}
                        disabled={loading || !name.trim() || nameSubmissionInProgress.current}
                        variant="contained"
                        size="large"
                        endIcon={!loading && <CheckCircleIcon />}
                        sx={{
                          borderRadius: 3,
                          py: 1.5,
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                          transition: "all 0.3s",
                          '&:hover': {
                            transform: "translateY(-2px)",
                            boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.3)}`,
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Complete Registration"}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trust badges */}
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
                  <Chip 
                    icon={<SecurityIcon sx={{ fontSize: 16 }} />} 
                    label="Secure" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.7 }}
                  />
                  <Chip 
                    icon={<SpeedIcon sx={{ fontSize: 16 }} />} 
                    label="Fast" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.7 }}
                  />
                  <Chip 
                    icon={<StarsIcon sx={{ fontSize: 16 }} />} 
                    label="Trusted" 
                    size="small" 
                    variant="outlined"
                    sx={{ opacity: 0.7 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  By continuing, you agree to our Terms of Service and Privacy Policy
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