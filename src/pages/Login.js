import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, InputAdornment, alpha, useTheme,
  Stepper, Step, StepLabel, Avatar, Chip, Backdrop, Snackbar, Zoom
} from "@mui/material";
import {
  Smartphone as SmartphoneIcon, Lock as LockIcon,
  Person as PersonIcon, Send as SendIcon,
  VerifiedUser as VerifiedUserIcon, EmojiEmotions as EmojiEmotionsIcon,
  Security as SecurityIcon, Close as CloseIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PhoneLogin = () => {
  const { user, loading: authLoading, login } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  // Form states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  // Flow control states
  const [needsName, setNeedsName] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
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
  
  const redirectInProgress = useRef(false);
  const verificationInProgress = useRef(false);
  const registrationInProgress = useRef(false);

  const steps = ['Mobile Number', 'Verify OTP', 'Complete Profile'];

  /* ================= AUTO REDIRECT (FIXED) ================= */
  useEffect(() => {
    // 🔥 FIX: Prevent redirect if we explicitly need a name or just finished registering
    if (authLoading || registrationComplete || needsName || redirectInProgress.current) {
      return;
    }
    
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Only redirect if name actually exists in the stored object
        if (userData.name && userData.name.trim() !== "") {
          redirectInProgress.current = true;
          setTimeout(() => {
            redirect(userData.role || "tenant");
          }, 500);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [user, authLoading, registrationComplete, needsName]);

  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else if (role === "vendor") navigate("/vendor/dashboard");
    else navigate("/");
  };

  const saveAuthData = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (login) login(userData);
  };

  /* ================= OTP LOGIC ================= */
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
  };

  const sendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) return setError("Enter a 10-digit number");

    try {
      setLoading(true);
      setError("");
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setStep(2);
      setActiveStep(1);
    } catch (err) {
      setError("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (verificationInProgress.current) return;
    verificationInProgress.current = true;
    
    try {
      setLoading(true);
      setError("");

      // 🔥 FIX: Clear any old session data before verifying new one
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const result = await confirmObj.confirm(otp);
      setFirebaseUser(result.user);
      const idToken = await result.user.getIdToken(true);
      
      const res = await userAPI.post("/auth/firebase", { idToken, role: "tenant", phone });
      
      if (res.data.success) {
        if (res.data.needsName) {
          // Stay on this page but move to Step 3
          setNeedsName(true);
          setStep(3);
          setActiveStep(2);
        } else {
          saveAuthData(res.data.token, res.data.user);
          setRegistrationComplete(true);
          setSnackbarMessage("Welcome back!");
          setSnackbarOpen(true);
          setTimeout(() => redirect(res.data.user?.role), 1500);
        }
      }
    } catch (err) {
      setError("Invalid OTP or server error.");
    } finally {
      setLoading(false);
      verificationInProgress.current = false;
    }
  };

  const completeRegistration = async () => {
    if (registrationInProgress.current || !name.trim()) return;
    registrationInProgress.current = true;
    
    try {
      setLoading(true);
      const idToken = await firebaseUser.getIdToken(true);
      const res = await userAPI.post("/auth/firebase", { idToken, phone, name: name.trim() });
      
      if (res.data.success) {
        saveAuthData(res.data.token, res.data.user);
        setRegistrationComplete(true);
        setNeedsName(false); // 🔥 Ensure redirect check is now allowed
        setSnackbarMessage("Profile created successfully!");
        setSnackbarOpen(true);
        setTimeout(() => redirect(res.data.user?.role), 1500);
      }
    } catch (err) {
      setError("Failed to save profile.");
    } finally {
      setLoading(false);
      registrationInProgress.current = false;
    }
  };

  const backToPhone = () => {
    setStep(1);
    setActiveStep(0);
    setNeedsName(false); // Reset state
    setOtp("");
    setError("");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: alpha(theme.palette.primary.main, 0.05) }}>
      <div id="recaptcha-container"></div>
      
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>

      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={loading}><CircularProgress color="inherit" /></Backdrop>

      <Paper elevation={3} sx={{ width: 450, borderRadius: 4, overflow: "hidden" }}>
        {/* Header Section */}
        <Box sx={{ bgcolor: "primary.main", color: "white", p: 4, textAlign: "center" }}>
           <Avatar sx={{ width: 60, height: 60, mx: "auto", mb: 2, bgcolor: "rgba(255,255,255,0.2)" }}>
              {step === 1 ? <SmartphoneIcon /> : step === 2 ? <LockIcon /> : <PersonIcon />}
           </Avatar>
           <Typography variant="h5" fontWeight="bold">
             {step === 1 ? "Login" : step === 2 ? "Verify OTP" : "Almost There!"}
           </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {step === 1 && (
            <>
              <TextField fullWidth label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} margin="normal" InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }} />
              <Button fullWidth variant="contained" size="large" onClick={sendOtp} sx={{ mt: 2 }}>Send OTP</Button>
            </>
          )}

          {step === 2 && (
            <>
              <TextField fullWidth label="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} margin="normal" />
              <Button fullWidth variant="contained" size="large" onClick={verifyOtp} sx={{ mt: 2 }}>Verify</Button>
              <Button fullWidth onClick={backToPhone} sx={{ mt: 1 }}>Back</Button>
            </>
          )}

          {step === 3 && (
            <Box sx={{ textAlign: "center" }}>
              <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} margin="normal" autoFocus />
              <Button fullWidth variant="contained" size="large" onClick={completeRegistration} sx={{ mt: 2 }} disabled={name.length < 3}>
                Finish & Explore
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PhoneLogin;