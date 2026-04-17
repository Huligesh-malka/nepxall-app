import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert
} from "@mui/material";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PhoneLogin = () => {
  const { user, role: authRole, loading: authLoading } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isNewUser, setIsNewUser] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const navigate = useNavigate();

  /* ================= AUTO REDIRECT ================= */
  useEffect(() => {
    if (!authLoading && user && authRole) {
      redirect(authRole);
    }
  }, [user, authRole, authLoading]);

  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/");
  };

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  /* ================= RECAPTCHA ================= */
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  };

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (phone.length !== 10) return setError("Enter valid number");

    try {
      setLoading(true);
      setError("");

      setupRecaptcha();

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        window.recaptchaVerifier
      );

      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent");

    } catch {
      setError("OTP failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Invalid OTP");

    try {
      setLoading(true);

      const res = await confirmObj.confirm(otp);
      setFirebaseUser(res.user);

      if (res._tokenResponse?.isNewUser) {
        setIsNewUser(true);
      } else {
        await syncUser(res.user);
      }

    } catch {
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= BACKEND SYNC ================= */
  const syncUser = async (user, userName = null) => {
    try {
      setLoading(true);

      const idToken = await user.getIdToken(true);

      const res = await userAPI.post("/auth/firebase", {
        idToken,
        name: userName,       // 🔥 send name
        role: "tenant"        // 🔥 default role
      });

      if (res.data.success) {
        setSuccess(`Welcome ${res.data.name}`);
        setTimeout(() => redirect(res.data.role), 800);
      }

    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= REGISTER ================= */
  const completeRegistration = async () => {
    if (!name.trim()) return setError("Enter your name");
    await syncUser(firebaseUser, name);
  };

  /* ================= UI ================= */
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8fafc">
      <Paper sx={{ p: 4, width: 380, borderRadius: 4 }}>

        <Typography variant="h5" align="center" fontWeight="bold">
          {isNewUser ? "Create Account" : "Login"}
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
              margin="normal"
            />

            <Button fullWidth onClick={sendOtp}>
              {loading ? <CircularProgress size={20} /> : "Get OTP"}
            </Button>
          </>
        )}

        {confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              margin="normal"
            />

            <Button fullWidth onClick={verifyOtp}>
              {loading ? <CircularProgress size={20} /> : "Verify OTP"}
            </Button>
          </>
        )}

        {isNewUser && (
          <>
            <TextField
              fullWidth
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
            />

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