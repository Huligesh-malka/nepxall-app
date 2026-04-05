import React, { useState, useEffect, useRef } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, MenuItem
} from "@mui/material";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";

const PhoneLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [role, setRole] = useState("tenant");
  const [isNewUser, setIsNewUser] = useState(false);

  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const navigate = useNavigate();
  // Use useRef to persist the verifier without re-renders
  const recaptchaRef = useRef(null);

  /* ================= SESSION RESTORE ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (token && savedRole) {
      redirect(savedRole);
    }
  }, []);

  /* ================= LANGUAGE FIX ================= */
  useEffect(() => {
    auth.useDeviceLanguage();
  }, []);

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [otpTimer]);

  /* ================= RECAPTCHA SETUP ================= */
  useEffect(() => {
    const initRecaptcha = () => {
      // Check if container exists and verifier isn't already set
      if (!recaptchaRef.current && document.getElementById("recaptcha-container")) {
        try {
          recaptchaRef.current = new RecaptchaVerifier(
            auth, // First argument should be auth in many versions
            "recaptcha-container",
            {
              size: "invisible",
              callback: (response) => {
                console.log("reCAPTCHA solved");
              },
              "expired-callback": () => {
                console.log("reCAPTCHA expired");
                resetRecaptcha();
              }
            }
          );
        } catch (err) {
          console.error("Recaptcha init error:", err);
        }
      }
    };

    initRecaptcha();

    // Cleanup on unmount
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
    // Re-trigger the logic to create a new one
    const container = document.getElementById("recaptcha-container");
    if (container) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible"
      });
    }
  };

  /* ================= REDIRECT ================= */
  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else if (role === "vendor") navigate("/vendor/dashboard");
    else navigate("/");
  };

  /* ================= BACKEND LOGIN ================= */
  const syncUser = async (user, selectedRole = null) => {
    try {
      setLoading(true);
      setError("");
      const idToken = await user.getIdToken(true);

      const res = await userAPI.post("/auth/firebase", {
        idToken,
        role: selectedRole || null
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        const userId = res.data.user?.id || res.data.userId;
        localStorage.setItem("user_id", userId);

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("role-updated"));

        setSuccess(`Welcome ${res.data.name}`);
        setTimeout(() => redirect(res.data.role), 1000);
      }
    } catch (err) {
      console.error("Sync Error:", err);
      setError(err?.response?.data?.message || "Server sync failed");
      await auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (phone.length !== 10) {
      return setError("Enter valid 10 digit number");
    }

    try {
      setLoading(true);
      setError("");

      if (!recaptchaRef.current) {
        setError("Captcha not initialized. Please refresh.");
        return;
      }

      const appVerifier = recaptchaRef.current;
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        appVerifier
      );

      setConfirmObj(confirmation);
      setOtpTimer(60);
      setCanResend(false);
      setSuccess("OTP sent successfully");
    } catch (err) {
      console.error("Firebase SMS Error:", err);
      resetRecaptcha(); 
      setError("Failed to send OTP. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter valid 6 digit OTP");
    try {
      setLoading(true);
      const res = await confirmObj.confirm(otp);
      setFirebaseUser(res.user);

      if (res._tokenResponse?.isNewUser) {
        setIsNewUser(true);
      } else {
        await syncUser(res.user, null);
      }
    } catch (err) {
      setError("Invalid OTP or expired");
    } finally {
      setLoading(false);
    }
  };

  /* ================= REGISTER ================= */
  const completeRegistration = async () => {
    if (!firebaseUser) return;
    await syncUser(firebaseUser, role);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8fafc">
      <Paper sx={{ p: 4, width: 380, borderRadius: 4 }}>
        <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
          {isNewUser ? "Select Role" : "Nepxall Login"}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {!confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              inputProps={{ maxLength: 10 }}
              margin="normal"
            />
            <Button fullWidth variant="contained" onClick={sendOtp} disabled={loading || !canResend} sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={24} /> : otpTimer > 0 ? `Resend in ${otpTimer}s` : "Get OTP"}
            </Button>
          </>
        )}

        {confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              inputProps={{ maxLength: 6 }}
              margin="normal"
            />
            <Button fullWidth variant="contained" onClick={verifyOtp} disabled={loading} sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
          </>
        )}

        {isNewUser && (
          <>
            <TextField
              select
              fullWidth
              label="Account Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              margin="normal"
            >
              <MenuItem value="tenant">Tenant</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
            </TextField>
            <Button fullWidth variant="contained" onClick={completeRegistration} disabled={loading} sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={24} /> : "Create Account"}
            </Button>
          </>
        )}

        {/* This must always be in the DOM */}
        <div id="recaptcha-container" style={{ marginTop: '10px' }}></div>
      </Paper>
    </Box>
  );
};

export default PhoneLogin;