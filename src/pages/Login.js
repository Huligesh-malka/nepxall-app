import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, InputAdornment, alpha, useTheme,
  Avatar, Backdrop, Snackbar
} from "@mui/material";
import {
  Smartphone as SmartphoneIcon, Lock as LockIcon,
  Person as PersonIcon
} from "@mui/icons-material";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PhoneLogin = () => {
  const { loading: authLoading, login } = useAuth();
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
  const [step, setStep] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  const redirectInProgress = useRef(false);
  const verificationInProgress = useRef(false);
  const registrationInProgress = useRef(false);

  /* ================= AUTO REDIRECT (STRICT LOCK) ================= */
  useEffect(() => {
    // 🔥 CRITICAL FIX: If we need a name, DO NOT REDIRECT.
    // This stops the infinite loop to the phone number page.
    if (authLoading || needsName || registrationComplete || redirectInProgress.current) {
      return;
    }
    
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Only redirect if a valid name exists in the profile
        if (userData.name && userData.name.trim() !== "" && !/^[0-9+]+$/.test(userData.name)) {
          redirectInProgress.current = true;
          redirect(userData.role || "tenant");
        }
      } catch (e) {
        console.error("Auth sync error:", e);
      }
    }
  }, [authLoading, registrationComplete, needsName]); // needsName is a dependency

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
      setStep(2);
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

      const result = await confirmObj.confirm(otp);
      setFirebaseUser(result.user);
      const idToken = await result.user.getIdToken(true);
      
      const res = await userAPI.post("/auth/firebase", { idToken, role: "tenant", phone });
      
      if (res.data.success) {
        // Always save credentials to maintain the session
        saveAuthData(res.data.token, res.data.user);

        if (res.data.needsName) {
          // 🔥 Set needsName FIRST to block the Auto-Redirect useEffect
          setNeedsName(true);
          setStep(3);
        } else {
          setRegistrationComplete(true);
          setSnackbarMessage("Welcome back!");
          setSnackbarOpen(true);
          setTimeout(() => redirect(res.data.user?.role), 1000);
        }
      }
    } catch (err) {
      setError("Invalid OTP. Please check and try again.");
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
      // Send the name to complete the profile
      const res = await userAPI.post("/auth/firebase", { idToken, phone, name: name.trim() });
      
      if (res.data.success) {
        saveAuthData(res.data.token, res.data.user);
        setRegistrationComplete(true);
        setNeedsName(false); // Unlock the redirect
        setSnackbarMessage("Profile created successfully!");
        setSnackbarOpen(true);
        setTimeout(() => redirect(res.data.user?.role), 1000);
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
    setNeedsName(false);
    setOtp("");
    setError("");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: alpha(theme.palette.primary.main, 0.05) }}>
      <div id="recaptcha-container"></div>
      
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" variant="filled">{snackbarMessage}</Alert>
      </Snackbar>

      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={loading}><CircularProgress color="inherit" /></Backdrop>

      <Paper elevation={3} sx={{ width: 450, borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ bgcolor: "primary.main", color: "white", p: 4, textAlign: "center" }}>
           <Avatar sx={{ width: 60, height: 60, mx: "auto", mb: 2, bgcolor: "rgba(255,255,255,0.2)" }}>
              {step === 1 ? <SmartphoneIcon /> : step === 2 ? <LockIcon /> : <PersonIcon />}
           </Avatar>
           <Typography variant="h5" fontWeight="bold">
             {step === 1 ? "Login" : step === 2 ? "Verify OTP" : "Complete Profile"}
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
              <TextField fullWidth label="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} margin="normal" autoFocus />
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