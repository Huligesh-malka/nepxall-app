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
        // ✅ Storing session data
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        
        // 🚨 CRITICAL FIX: Changed from "userId" to "user_id" 
        // to match what AgreementForm.js expects
        localStorage.setItem("user_id", res.data.user?.id || "");

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
      setCanResend(false);
      setSuccess("OTP sent successfully");

    } catch (err) {
      setError("Failed to send OTP. Please refresh and try again.");
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

    } catch {
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= NEW USER REGISTRATION ================= */
  const completeRegistration = async () => {
    if (!firebaseUser) return;
    await syncUser(firebaseUser, role);
  };

  /* ================= UI ================= */
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} sx={{ p: 4, width: 360, borderRadius: 2 }}>
        <Typography variant="h5" align="center" mb={2} fontWeight="bold">
          {isNewUser ? "Complete Registration" : "Nepxall Login"}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Snackbar 
          open={!!success} 
          autoHideDuration={2500} 
          onClose={() => setSuccess("")}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" variant="filled">
            {success}
          </Alert>
        </Snackbar>

        {!confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              inputProps={{ maxLength: 10 }}
              InputProps={{
                startAdornment: <Typography mr={1} color="textSecondary">+91</Typography>
              }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              onClick={sendOtp} 
              disabled={loading}
              sx={{ mt: 2, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Send OTP"}
            </Button>
          </>
        )}

        {confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Enter 6-Digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              inputProps={{ maxLength: 6 }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              onClick={verifyOtp} 
              disabled={loading}
              sx={{ mt: 2, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Verify & Login"}
            </Button>
            {otpTimer > 0 ? (
              <Typography variant="caption" display="block" mt={2} align="center">
                Resend available in {otpTimer}s
              </Typography>
            ) : (
              <Button size="small" fullWidth onClick={sendOtp} sx={{ mt: 1 }}>
                Resend OTP
              </Button>
            )}
          </>
        )}

        {isNewUser && (
          <>
            <TextField
              select
              fullWidth
              label="I am a..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              margin="normal"
            >
              <MenuItem value="tenant">Tenant</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
            </TextField>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={completeRegistration}
              sx={{ mt: 2, py: 1.2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Finish Registration"}
            </Button>
          </>
        )}

        <div id="recaptcha-container"></div>
      </Paper>
    </Box>
  );
};

export default PhoneLogin;