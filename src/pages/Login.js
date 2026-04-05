import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, MenuItem
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
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [role, setRole] = useState("tenant");
  const [isNewUser, setIsNewUser] = useState(false);

  const [otpTimer, setOtpTimer] = useState(0);

  const navigate = useNavigate();

  /* ================= AUTO REDIRECT ================= */
  useEffect(() => {
    if (!authLoading && user && authRole) {
      redirect(authRole);
    }
  }, [user, authRole, authLoading]);

  /* ================= LANGUAGE ================= */
  useEffect(() => {
    auth.useDeviceLanguage();
  }, []);

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  /* ================= RECAPTCHA FIX ================= */
  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, // ✅ correct order
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

  /* ================= BACKEND SYNC ================= */
  const syncUser = async (user, selectedRole = null) => {
    try {
      setLoading(true);
      setError("");

      const idToken = await user.getIdToken(true);

      const res = await userAPI.post("/auth/firebase", {
        idToken,
        role: selectedRole
      });

      if (res.data.success) {
        setSuccess(`Welcome ${res.data.name}`);
        setTimeout(() => redirect(res.data.role), 800);
      }

    } catch (err) {
      setError(err?.response?.data?.message || "Server error");
      await auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (phone.length !== 10) {
      return setError("Enter valid number");
    }

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

    } catch (err) {
      setError("OTP failed. Check internet / disable VPN");
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
          {isNewUser ? "Select Role" : "Login"}
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
              {loading ? <CircularProgress size={20} /> : "Verify OTP"}
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