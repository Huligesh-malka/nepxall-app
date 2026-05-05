import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, InputAdornment, alpha,
  Chip, Backdrop, Snackbar, IconButton, Divider,
  LinearProgress, Fade, Slide, Zoom
} from "@mui/material";
import {
  PhoneAndroid as PhoneIcon,
  VpnKey as KeyIcon,
 Send as SendIcon,
  VerifiedUser as VerifiedIcon,
  Security as ShieldIcon,
  Speed as SpeedIcon,
  Stars as TrustIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  CheckCircle as SuccessIcon,
  ErrorOutline as ErrorIcon,
  WifiOff as OfflineIcon,
  Refresh as RefreshIcon,
  NotificationsActive as NotifIcon,
  Fingerprint as BiometricIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import { auth, requestNotificationPermission } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PhoneLogin = () => {
  const { user, loading: authLoading, login } = useAuth();
  const theme = useTheme();

  // Form states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  
  // Flow control
  const [step, setStep] = useState(1);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });
  
  // Refs
  const verificationInProgress = useRef(false);
  const initialCheckDone = useRef(false);
  const inputRefs = useRef([]);

  const navigate = useNavigate();

  // Modern color palette
  const colors = {
    primary: "#7C3AED",
    primaryDark: "#6D28D9",
    secondary: "#06B6D4",
    accent: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    dark: "#1E1B4B",
    light: "#F8FAFC",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #06B6D4 100%)",
    gradientDark: "linear-gradient(135deg, #5B21B6 0%, #6D28D9 50%, #0891B2 100%)",
  };

  // Auto redirect for existing users
  useEffect(() => {
    if (authLoading || isRedirecting) return;
    if (initialCheckDone.current) return;

    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.name?.trim()) {
          initialCheckDone.current = true;
          setIsRedirecting(true);
          redirect(userData.role || "user");
        }
      } catch (e) {}
    }
  }, [user, authLoading, isRedirecting]);

  useEffect(() => {
    if (auth) auth.useDeviceLanguage();
  }, []);

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const setupRecaptcha = async () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            "expired-callback": () => {
              window.recaptchaVerifier = null;
            },
          }
        );
        await window.recaptchaVerifier.render();
      }
    } catch (err) {
      if (window.recaptchaVerifier) {
        try { await window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
      throw new Error("Security verification failed");
    }
  };

  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/");
  };

  const saveAuthData = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (login) login(userData);
  };

  const sendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setConfirmObj(null);
      setOtp("");

      await setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${cleanPhone}`,
        window.recaptchaVerifier
      );

      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("Verification code sent! Check your SMS.");
      setStep(2);

      // Auto-focus first OTP input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      if (window.recaptchaVerifier) {
        try { await window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
      
      const errorMessages = {
        "auth/invalid-phone-number": "Invalid phone number format",
        "auth/too-many-requests": "Too many attempts. Try again later",
        "auth/network-request-failed": "Network error. Check connection",
      };
      setError(errorMessages[err.code] || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (verificationInProgress.current || otp.length !== 6) {
      if (otp.length !== 6) setError("Enter all 6 digits");
      return;
    }

    verificationInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");

      const result = await confirmObj.confirm(otp);
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
        
        setSnackbar({ 
          open: true, 
          message: checkResponse.data.message || "Welcome aboard! 🎉", 
          type: "success" 
        });
        
        setIsRedirecting(true);
        redirect(checkResponse.data.user?.role || "user");
      } else {
        setError(checkResponse.data.message || "Authentication failed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
      verificationInProgress.current = false;
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = otp.split('');
    newOtp[index] = value;
    const updatedOtp = newOtp.join('');
    setOtp(updatedOtp);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (authLoading) {
    return (
      <Box sx={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Box sx={styles.loadingSpinner} />
        </motion.div>
        <Typography variant="h6" sx={styles.loadingText}>
          Experience something amazing...
        </Typography>
      </Box>
    );
  }

  if (isRedirecting) return null;

  return (
    <>
      <Backdrop sx={styles.backdrop} open={loading}>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <CircularProgress size={60} sx={{ color: colors.primary }} />
        </motion.div>
        <Typography sx={{ mt: 2, color: "white" }}>Securing your access...</Typography>
      </Backdrop>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert severity={snackbar.type} sx={styles.snackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={styles.mainContainer}>
        {/* Animated background */}
        <Box sx={styles.backgroundEffects}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              style={{
                ...styles.particle,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 8 + 2}px`,
                height: `${Math.random() * 8 + 2}px`,
                animationDelay: `${Math.random() * 5}s`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </Box>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          style={{ width: "100%", display: "flex", justifyContent: "center", padding: "20px" }}
        >
          <Paper elevation={0} sx={styles.card}>
            {/* Animated gradient border */}
            <Box sx={styles.glowBorder} />

            {/* Header */}
            <Box sx={styles.header}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Box sx={styles.iconWrapper}>
                  {step === 1 ? (
                    <PhoneIcon sx={styles.mainIcon} />
                  ) : (
                    <KeyIcon sx={styles.mainIcon} />
                  )}
                </Box>
              </motion.div>

              <Typography variant="h3" sx={styles.title}>
                {step === 1 ? "Welcome" : "Verify"}
              </Typography>
              <Typography variant="body1" sx={styles.subtitle}>
                {step === 1 
                  ? "Enter your mobile number to continue" 
                  : `Code sent to +91 ${phone.slice(0, 3)}*****${phone.slice(-3)}`}
              </Typography>
            </Box>

            {/* Progress Indicator */}
            <Box sx={styles.progressSection}>
              <Box sx={styles.stepIndicator}>
                <Typography variant="caption" sx={styles.stepText}>
                  Step {step} of 2
                </Typography>
                <Chip
                  label={step === 1 ? "Phone Number" : "Verification"}
                  size="small"
                  sx={styles.stepChip}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={step === 1 ? 40 : 100}
                sx={styles.progressBar}
              />
            </Box>

            {/* Content */}
            <Box sx={styles.content}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Alert
                      severity="error"
                      icon={<ErrorIcon />}
                      sx={styles.errorAlert}
                      onClose={() => setError("")}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}

                {success && step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert severity="success" icon={<SuccessIcon />} sx={styles.successAlert}>
                      {success}
                    </Alert>
                  </motion.div>
                )}

                {/* Step 1: Phone */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Box sx={styles.inputWrapper}>
                      <Typography variant="body2" sx={styles.inputLabel}>
                        Mobile Number
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
                              <Box sx={styles.countryCode}>+91</Box>
                            </InputAdornment>
                          ),
                          sx: styles.phoneInput,
                        }}
                        sx={styles.textField}
                      />
                    </Box>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        fullWidth
                        onClick={sendOtp}
                        disabled={loading || phone.replace(/\D/g, "").length !== 10}
                        sx={styles.sendButton}
                      >
                        {loading ? (
                          <CircularProgress size={24} sx={{ color: "white" }} />
                        ) : (
                          <>
                            Send Verification Code
                            <SendIcon sx={{ ml: 1 }} />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 2: OTP */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Box sx={styles.inputWrapper}>
                      <Typography variant="body2" sx={styles.inputLabel}>
                        Verification Code
                      </Typography>
                      <Box sx={styles.otpContainer}>
                        {[...Array(6)].map((_, index) => (
                          <motion.input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="tel"
                            maxLength={1}
                            value={otp[index] || ""}
                            onChange={(e) => handleOtpChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            style={styles.otpInput}
                            whileFocus={{ scale: 1.05, borderColor: colors.primary }}
                            animate={otp[index] ? { scale: [1, 1.1, 1] } : {}}
                          />
                        ))}
                      </Box>
                    </Box>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        fullWidth
                        onClick={verifyOtp}
                        disabled={loading || otp.length !== 6}
                        sx={styles.verifyButton}
                      >
                        {loading ? (
                          <CircularProgress size={24} sx={{ color: "white" }} />
                        ) : (
                          <>
                            Verify & Continue
                            <VerifiedIcon sx={{ ml: 1 }} />
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <Box sx={styles.otpFooter}>
                      {otpTimer > 0 ? (
                        <Chip
                          icon={<RefreshIcon />}
                          label={`Resend in ${otpTimer}s`}
                          sx={styles.timerChip}
                        />
                      ) : (
                        <Button
                          onClick={resendOtp}
                          disabled={isResending}
                          sx={styles.resendButton}
                        >
                          {isResending ? <CircularProgress size={20} /> : "Resend Code"}
                        </Button>
                      )}
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={backToPhone}
                        startIcon={<BackIcon />}
                        sx={styles.backButton}
                      >
                        Change Number
                      </Button>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Features */}
              <Box sx={styles.features}>
                <Divider sx={styles.divider}>
                  <Chip
                    icon={<ShieldIcon />}
                    label="Secure Platform"
                    size="small"
                    sx={styles.dividerChip}
                  />
                </Divider>

                <Box sx={styles.featureGrid}>
                  {[
                    { icon: <ShieldIcon />, label: "256-bit Encryption" },
                    { icon: <BiometricIcon />, label: "Biometric Ready" },
                    { icon: <SpeedIcon />, label: "Lightning Fast" },
                    { icon: <NotifIcon />, label: "Instant Alerts" },
                  ].map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Box sx={styles.featureItem}>
                        <Box sx={styles.featureIcon}>{feature.icon}</Box>
                        <Typography variant="caption">{feature.label}</Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>

                <Typography variant="caption" sx={styles.terms}>
                  By continuing, you agree to our{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </Typography>
              </Box>
            </Box>

            <div id="recaptcha-container" />
          </Paper>
        </motion.div>
      </Box>
    </>
  );
};

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "4px solid rgba(124, 58, 237, 0.2)",
    borderTop: `4px solid #7C3AED`,
    borderRight: `4px solid #06B6D4`,
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    mt: 3,
    color: "white",
    fontWeight: 500,
    letterSpacing: "0.5px",
  },
  backdrop: {
    color: "#fff",
    zIndex: 9999,
    backdropFilter: "blur(10px)",
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    flexDirection: "column",
  },
  snackbar: {
    borderRadius: 3,
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  },
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #2E1065 100%)",
    position: "relative",
    overflow: "hidden",
  },
  backgroundEffects: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
    background: "linear-gradient(45deg, #7C3AED, #06B6D4)",
    borderRadius: "50%",
    opacity: 0.6,
  },
  card: {
    width: 560,
    maxWidth: "95%",
    borderRadius: 8,
    background: "rgba(255, 255, 255, 0.97)",
    backdropFilter: "blur(20px)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
  },
  glowBorder: {
    position: "absolute",
    inset: -2,
    background: "linear-gradient(90deg, #7C3AED, #06B6D4, #8B5CF6, #7C3AED)",
    backgroundSize: "300% 300%",
    borderRadius: 8,
    opacity: 0.3,
    animation: "gradientShift 3s ease infinite",
    zIndex: -1,
  },
  header: {
    background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #06B6D4 100%)",
    padding: "45px 32px 35px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  iconWrapper: {
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
  },
  mainIcon: {
    fontSize: 55,
    color: "white",
  },
  title: {
    color: "white",
    fontWeight: 800,
    letterSpacing: "-1px",
    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
    fontSize: { xs: "2rem", sm: "2.5rem" },
  },
  subtitle: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: 500,
    mt: 1,
  },
  progressSection: {
    px: 4,
    pt: 3,
  },
  stepIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 1.5,
  },
  stepText: {
    color: "#64748B",
    fontWeight: 600,
  },
  stepChip: {
    bgcolor: "rgba(124, 58, 237, 0.1)",
    fontWeight: 600,
    fontSize: "0.7rem",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    bgcolor: "rgba(124, 58, 237, 0.1)",
    "& .MuiLinearProgress-bar": {
      borderRadius: 3,
      background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
    },
  },
  content: {
    padding: "32px",
  },
  inputWrapper: {
    mb: 3,
  },
  inputLabel: {
    fontWeight: 600,
    mb: 1,
    color: "#334155",
  },
  countryCode: {
    fontWeight: 700,
    color: "#7C3AED",
    fontSize: "1rem",
  },
  phoneInput: {
    borderRadius: 3,
    fontSize: "1rem",
    "&:hover": {
      boxShadow: "0 0 0 2px rgba(124, 58, 237, 0.1)",
    },
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      "&.Mui-focused": {
        boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.2)",
      },
    },
  },
  sendButton: {
    borderRadius: 3,
    py: 1.5,
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
    transition: "all 0.3s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 30px rgba(124, 58, 237, 0.4)",
    },
  },
  otpContainer: {
    display: "flex",
    gap: 1.5,
    justifyContent: "center",
    mb: 3,
  },
  otpInput: {
    width: 60,
    height: 60,
    textAlign: "center",
    fontSize: "1.5rem",
    fontWeight: 600,
    border: `2px solid #E2E8F0`,
    borderRadius: 12,
    outline: "none",
    transition: "all 0.2s",
    "&:focus": {
      borderColor: "#7C3AED",
      boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.2)",
    },
  },
  verifyButton: {
    borderRadius: 3,
    py: 1.5,
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    mb: 2,
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
    },
  },
  otpFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    mt: 2,
  },
  timerChip: {
    opacity: 0.7,
    borderRadius: 3,
  },
  resendButton: {
    textTransform: "none",
    fontWeight: 700,
    color: "#7C3AED",
    "&:hover": { bgcolor: "rgba(124, 58, 237, 0.1)" },
  },
  backButton: {
    textTransform: "none",
    color: "#64748B",
    "&:hover": { bgcolor: "transparent" },
  },
  errorAlert: {
    mb: 3,
    borderRadius: 2,
    borderLeft: `4px solid #EF4444`,
  },
  successAlert: {
    mb: 3,
    borderRadius: 2,
    borderLeft: `4px solid #10B981`,
  },
  features: {
    mt: 4,
  },
  divider: {
    my: 2,
  },
  dividerChip: {
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 2,
    mb: 3,
  },
  featureItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0.5,
  },
  featureIcon: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    bgcolor: "rgba(124, 58, 237, 0.1)",
    color: "#7C3AED",
    "& svg": { fontSize: 20 },
  },
  terms: {
    display: "block",
    textAlign: "center",
    color: "#94A3B8",
    fontSize: "0.7rem",
    "& a": {
      color: "#7C3AED",
      fontWeight: 700,
      textDecoration: "none",
      "&:hover": { textDecoration: "underline" },
    },
  },
};

// Add keyframe animations to document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;
document.head.appendChild(styleSheet);

export default PhoneLogin;