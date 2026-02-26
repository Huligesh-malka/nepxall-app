import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, MenuItem, Snackbar
} from "@mui/material";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";

const PhoneLogin = () => {
  // Form states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // User states
  const [role, setRole] = useState("tenant");
  const [isNewUser, setIsNewUser] = useState(false);
  
  // OTP timer
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const navigate = useNavigate();

  /* ================= SESSION RESTORE ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedName = localStorage.getItem("name");
    
    if (token && savedRole) {
      console.log("🔄 Restoring session for:", savedName);
      redirect(savedRole);
    }
  }, []);

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      setCanResend(false);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

  /* ================= INIT RECAPTCHA ONCE ================= */
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              console.log("✅ Recaptcha verified");
            }
          }
        );
      } catch (err) {
        console.error("❌ Recaptcha init error:", err);
        setError("Failed to initialize verification. Please refresh.");
      }
    }
  }, []);

  /* ================= CLEANUP RECAPTCHA ================= */
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (err) {
          console.error("❌ Recaptcha cleanup error:", err);
        }
      }
    };
  }, []);

  /* ================= REDIRECT ================= */
  const redirect = (role) => {
    console.log("🚀 Redirecting with role:", role);
    
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "owner") {
      navigate("/owner/dashboard");
    } else {
      navigate("/");
    }
  };

  /* ================= BACKEND LOGIN ================= */
  const syncUser = async (user, selectedRole) => {
    try {
      setLoading(true);
      setError("");

      console.log("🔄 Syncing user with backend...");
      
      // Get fresh token
      const idToken = await user.getIdToken(true);
      
      console.log("🔑 Firebase token obtained");

      const res = await userAPI.post("/auth/firebase", {
        idToken,
        role: selectedRole
      });

      console.log("✅ Backend response:", res.data);

      if (res.data.success) {
        // Store user data
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("userId", res.data.user?.id || "");
        
        setSuccess(`Welcome ${res.data.name}!`);
        
        // Redirect after short delay
        setTimeout(() => redirect(res.data.role), 1000);
      } else {
        throw new Error(res.data.message || "Backend login failed");
      }

    } catch (err) {
      console.error("❌ Backend sync error:", err);
      
      const errorMsg = err?.response?.data?.message || 
                       err?.message || 
                       "Backend login failed";
      
      setError(errorMsg);
      
      // If backend error, sign out from Firebase
      await auth.signOut();
      
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    // Validate phone
    if (!phone || phone.length !== 10) {
      return setError("Please enter a valid 10-digit mobile number");
    }

    // Validate recaptcha
    if (!window.recaptchaVerifier) {
      return setError("Verification not initialized. Please refresh.");
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      console.log("📱 Sending OTP to:", `+91${phone}`);

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        window.recaptchaVerifier
      );

      setConfirmObj(confirmation);
      setSuccess(`OTP sent to +91 ${phone}`);
      
      // Start 60-second timer for resend
      setOtpTimer(60);
      
      console.log("✅ OTP sent successfully");

    } catch (err) {
      console.error("❌ Send OTP error:", err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/invalid-phone-number') {
        setError("Invalid phone number format");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later.");
      } else if (err.code === 'auth/quota-exceeded') {
        setError("SMS quota exceeded. Please try email login.");
      } else {
        setError(err.message || "Failed to send OTP");
      }
      
      // Reset recaptcha
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (clearErr) {
          console.error("❌ Recaptcha clear error:", clearErr);
        }
      }
      
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */
  const resendOtp = async () => {
    if (!canResend) return;
    setOtp("");
    await sendOtp();
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      return setError("Please enter a valid 6-digit OTP");
    }

    if (!confirmObj) {
      return setError("Session expired. Please request OTP again.");
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      console.log("🔐 Verifying OTP...");

      const res = await confirmObj.confirm(otp);
      
      console.log("✅ Firebase verification successful");
      console.log("👤 User:", res.user.uid);
      console.log("🆕 Is new user:", res._tokenResponse?.isNewUser);

      setFirebaseUser(res.user);
      setSuccess("Phone verified successfully!");

      // Check if new user
      if (res._tokenResponse?.isNewUser) {
        console.log("🆕 New user - showing role selection");
        setIsNewUser(true);
        setLoading(false);
      } else {
        console.log("✅ Existing user - logging in");
        await syncUser(res.user, "tenant");
      }

    } catch (err) {
      console.error("❌ OTP verification error:", err);
      
      if (err.code === 'auth/invalid-verification-code') {
        setError("Invalid OTP. Please try again.");
      } else if (err.code === 'auth/code-expired') {
        setError("OTP expired. Please request again.");
        setConfirmObj(null);
        setOtp("");
      } else {
        setError(err.message || "Failed to verify OTP");
      }
      
    } finally {
      setLoading(false);
    }
  };

  /* ================= COMPLETE REGISTRATION ================= */
  const completeRegistration = async () => {
    if (!firebaseUser) {
      return setError("Session expired. Please start over.");
    }
    
    await syncUser(firebaseUser, role);
  };

  /* ================= CANCEL AND START OVER ================= */
  const startOver = () => {
    setConfirmObj(null);
    setIsNewUser(false);
    setFirebaseUser(null);
    setOtp("");
    setError("");
    setSuccess("");
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper sx={{ p: 4, width: 360, position: 'relative' }}>
        
        <Typography variant="h5" align="center" mb={2}>
          {isNewUser ? "Complete Registration" : "Phone Login"}
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess("")}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        </Snackbar>

        {/* Phone Input Step */}
        {!confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              margin="normal"
              placeholder="10-digit mobile number"
              disabled={loading}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>+91</Typography>
              }}
            />

            <Button 
              fullWidth 
              variant="contained" 
              onClick={sendOtp} 
              disabled={loading || phone.length !== 10}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Send OTP"}
            </Button>
          </>
        )}

        {/* OTP Verification Step */}
        {confirmObj && !isNewUser && (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              OTP sent to <strong>+91 {phone}</strong>
            </Typography>

            <TextField
              fullWidth
              label="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              margin="normal"
              placeholder="123456"
              disabled={loading}
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={verifyOtp} 
                disabled={loading || otp.length !== 6}
              >
                {loading ? <CircularProgress size={24} /> : "Verify OTP"}
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={startOver}
                disabled={loading}
              >
                Change
              </Button>
            </Box>

            {/* Resend OTP */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              {otpTimer > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Resend OTP in {otpTimer}s
                </Typography>
              ) : (
                <Button 
                  size="small" 
                  onClick={resendOtp}
                  disabled={loading || !canResend}
                >
                  Resend OTP
                </Button>
              )}
            </Box>
          </>
        )}

        {/* New User Registration Step */}
        {isNewUser && (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Welcome! Complete your registration
            </Typography>

            <TextField
              select
              fullWidth
              label="Register as"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              margin="normal"
              disabled={loading}
            >
              <MenuItem value="tenant">Tenant (Looking for PG)</MenuItem>
              <MenuItem value="owner">Owner (List your PG)</MenuItem>
            </TextField>

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={completeRegistration}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Continue"}
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={startOver}
                disabled={loading}
              >
                Back
              </Button>
            </Box>
          </>
        )}

        {/* Recaptcha Container */}
        <div id="recaptcha-container"></div>

        {/* Help Text */}
        <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }} color="text.secondary">
          By continuing, you agree to our Terms & Privacy Policy
        </Typography>

      </Paper>
    </Box>
  );
};

export default PhoneLogin;