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

  /* ================= BACKEND LOGIN & SYNC ================= */
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
        // ✅ 1. Standard Session Storage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        
        // ✅ 2. Critical ID Storage (Matches your DB schema 'id')
        const userId = res.data.user?.id || res.data.userId;
        localStorage.setItem("user_id", userId);

        // ✅ 3. FORCE REFRESH EVENT
        // This tells MainLayout and Sidebar to update their state immediately
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("role-updated"));

        setSuccess(`Welcome ${res.data.name}`);

        // Small delay to ensure localStorage is written before navigation
        setTimeout(() => redirect(res.data.role), 1000);
      }

    } catch (err) {
      console.error("Sync Error:", err);
      setError(err?.response?.data?.message || "Login failed to sync with server");
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
      console.error("Firebase SMS Error:", err);
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

      // Check if this is a brand new Firebase user
      if (res._tokenResponse?.isNewUser) {
        setIsNewUser(true);
      } else {
        // Existing user, sync directly
        await syncUser(res.user, null);
      }

    } catch (err) {
      setError("Invalid OTP or session expired");
    } finally {
      setLoading(false);
    }
  };

  /* ================= NEW USER REGISTRATION ================= */
  const completeRegistration = async () => {
    if (!firebaseUser) return;
    await syncUser(firebaseUser, role);
  };

  /* ================= UI RENDERING ================= */
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8fafc">
      <Paper elevation={0} sx={{ p: 4, width: 380, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <Typography variant="h5" align="center" mb={1} fontWeight="800" color="#1e293b">
          {isNewUser ? "Select Your Role" : "Nepxall Login"}
        </Typography>
        <Typography variant="body2" align="center" mb={3} color="textSecondary">
          {isNewUser ? "Tell us how you'll use the platform" : "Enter your number to continue"}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Snackbar 
          open={!!success} 
          autoHideDuration={2500} 
          onClose={() => setSuccess("")}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
            {success}
          </Alert>
        </Snackbar>

        {/* STEP 1: PHONE NUMBER */}
        {!confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Mobile Number"
              variant="outlined"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              inputProps={{ maxLength: 10 }}
              InputProps={{
                startAdornment: <Typography mr={1} fontWeight="bold" color="#64748b">+91</Typography>
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              onClick={sendOtp} 
              disabled={loading || phone.length < 10}
              sx={{ mt: 2, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: 'none' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Get OTP"}
            </Button>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {confirmObj && !isNewUser && (
          <>
            <TextField
              fullWidth
              label="Verification Code"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              margin="normal"
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '8px', fontSize: '20px' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              onClick={verifyOtp} 
              disabled={loading || otp.length < 6}
              sx={{ mt: 2, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', fontSize: '16px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Verify & Continue"}
            </Button>
            
            <Box textAlign="center" mt={3}>
              {otpTimer > 0 ? (
                <Typography variant="body2" color="textSecondary">
                  Resend OTP in <strong>{otpTimer}s</strong>
                </Typography>
              ) : (
                <Button variant="text" size="small" onClick={sendOtp} sx={{ textTransform: 'none', fontWeight: '600' }}>
                  Didn't get code? Resend
                </Button>
              )}
            </Box>
          </>
        )}

        {/* STEP 3: NEW USER ROLE SELECTION */}
        {isNewUser && (
          <>
            <TextField
              select
              fullWidth
              label="Account Type"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="tenant">Tenant (Looking for stay)</MenuItem>
              <MenuItem value="owner">Owner (Listing property)</MenuItem>
              <MenuItem value="vendor">Vendor (Services)</MenuItem>
            </TextField>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={completeRegistration}
              disabled={loading}
              sx={{ mt: 2, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', fontSize: '16px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
            </Button>
          </>
        )}

        <div id="recaptcha-container"></div>
      </Paper>
    </Box>
  );
};

export default PhoneLogin;