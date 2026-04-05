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

  /* ================= RECAPTCHA FIX ================= */
  useEffect(() => {
    setupRecaptcha();
  }, []);

  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) return;

      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
            resetRecaptcha();
          }
        },
        auth
      );

      window.recaptchaVerifier.render().catch(console.error);

    } catch (err) {
      console.error("Recaptcha init error:", err);
    }
  };

  const resetRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
    setupRecaptcha();
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

      if (!window.recaptchaVerifier) {
        setupRecaptcha();
      }

      const appVerifier = window.recaptchaVerifier;

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

      resetRecaptcha(); // 🔥 important fix

      setError(
        "Failed to send OTP. Check internet / disable VPN / allow cookies."
      );
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

  /* ================= UI ================= */
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8fafc">
      <Paper sx={{ p: 4, width: 380, borderRadius: 4 }}>
        
        <Typography variant="h5" align="center" fontWeight="bold">
          {isNewUser ? "Select Role" : "Nepxall Login"}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

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

            <Button fullWidth onClick={sendOtp} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Get OTP"}
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

            <Button fullWidth onClick={verifyOtp} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Verify"}
            </Button>
          </>
        )}

        {isNewUser && (
          <>
            <TextField
              select
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value)}
              margin="normal"
            >
              <MenuItem value="tenant">Tenant</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
            </TextField>

            <Button fullWidth onClick={completeRegistration}>
              Create Account
            </Button>
          </>
        )}

        <div id="recaptcha-container"></div>

      </Paper>
    </Box>
  );
};

export default PhoneLogin;