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

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [otpTimer]);

  /* ================= RECAPTCHA ================= */
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  }, []);

  /* ================= REDIRECT ================= */
  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
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
        role: selectedRole || null   // ⭐ IMPORTANT
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("userId", res.data.user?.id || "");

        setSuccess(`Welcome ${res.data.name}`);

        setTimeout(() => redirect(res.data.role), 800);
      }

    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
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

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        window.recaptchaVerifier
      );

      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent");

    } catch (err) {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {

    if (otp.length !== 6) return setError("Enter valid OTP");

    try {
      setLoading(true);

      const res = await confirmObj.confirm(otp);

      setFirebaseUser(res.user);

      if (res._tokenResponse?.isNewUser) {
        setIsNewUser(true);
      } else {
        // ⭐ EXISTING USER → ROLE FROM DB
        await syncUser(res.user, null);
      }

    } catch {
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= NEW USER REGISTRATION ================= */
  const completeRegistration = async () => {
    await syncUser(firebaseUser, role);
  };

  /* ================= UI ================= */
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">

      <Paper sx={{ p: 4, width: 360 }}>

        <Typography variant="h5" align="center" mb={2}>
          {isNewUser ? "Complete Registration" : "Phone Login"}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Snackbar open={!!success} autoHideDuration={2500}>
          <Alert severity="success">{success}</Alert>
        </Snackbar>

        {!confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              InputProps={{ startAdornment: <Typography mr={1}>+91</Typography> }}
            />

            <Button fullWidth variant="contained" onClick={sendOtp}>
              {loading ? <CircularProgress size={24} /> : "Send OTP"}
            </Button>
          </>
        )}

        {confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              margin="normal"
            />

            <Button fullWidth variant="contained" onClick={verifyOtp}>
              {loading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
          </>
        )}

        {isNewUser && (
          <>
            <TextField
              select
              fullWidth
              label="Register as"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              margin="normal"
            >
              <MenuItem value="tenant">Tenant</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
            </TextField>

            <Button fullWidth variant="contained" onClick={completeRegistration}>
              Continue
            </Button>
          </>
        )}

        <div id="recaptcha-container"></div>

      </Paper>
    </Box>
  );
};

export default PhoneLogin;