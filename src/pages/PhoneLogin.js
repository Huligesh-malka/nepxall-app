import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const PhoneLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [useTestMode, setUseTestMode] = useState(false);
  const navigate = useNavigate();

  // Initialize reCAPTCHA
  useEffect(() => {
    // For testing, you might want to disable app verification
    auth.settings.appVerificationDisabledForTesting = false; // Set to true for test OTPs
    
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container",
          {
            size: "normal",
            theme: "light",
            callback: () => {
              console.log("reCAPTCHA solved successfully");
            },
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
              window.recaptchaVerifier = null;
            }
          },
          auth
        );
        
        window.recaptchaVerifier.render().catch(err => {
          console.error("reCAPTCHA render error:", err);
        });
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
      }
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const sendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      // Validate phone number
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        throw new Error("Please enter a valid mobile number");
      }

      // IMPORTANT: Use the exact test number format from Firebase Console
      let formattedPhone;
      
      if (useTestMode) {
        // Use the test number from Firebase Console
        formattedPhone = "+77483090510"; // Your test number from console
        console.log("Using test number:", formattedPhone);
      } else {
        // Format for real numbers
        if (phoneDigits.length === 10) {
          formattedPhone = `+91${phoneDigits}`; // For Indian numbers
        } else {
          formattedPhone = `+${phoneDigits}`;
        }
      }

      console.log("Attempting to send OTP to:", formattedPhone);
      
      // Make sure reCAPTCHA is ready
      if (!window.recaptchaVerifier) {
        throw new Error("Security verification not ready. Please refresh the page.");
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
      
      console.log("OTP sent successfully!");
      setConfirmation(confirmationResult);
      setOtpSent(true);
      
      if (useTestMode) {
        setError("Test OTP sent! Use code: 523456");
      } else {
        setError("OTP sent successfully! Check your SMS.");
      }
      
    } catch (err) {
      console.error("Send OTP Error Details:", {
        code: err.code,
        message: err.message,
        name: err.name
      });
      
      if (err.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please wait a few minutes.");
      } else if (err.code === 'auth/invalid-phone-number') {
        setError(`Invalid phone number format. Please use: +91XXXXXXXXXX or test with: +77483090510`);
      } else if (err.code === 'auth/quota-exceeded') {
        setError("SMS quota exceeded. Try again later or use test mode.");
      } else if (err.code === 'auth/captcha-check-failed') {
        setError("reCAPTCHA verification failed. Please solve the puzzle.");
        // Reset reCAPTCHA
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      if (!confirmation) {
        throw new Error("No OTP confirmation found. Please send OTP again.");
      }

      if (otp.length < 6) {
        throw new Error("Please enter a valid 6-digit OTP");
      }

      console.log("Verifying OTP:", otp);
      const result = await confirmation.confirm(otp);
      
      console.log("OTP verified successfully!", result.user);
      
      // Store user info
      localStorage.setItem("uid", result.user.uid);
      localStorage.setItem("phone", result.user.phoneNumber);
      localStorage.setItem("role", "user");
      
      // Navigate to home
      navigate("/");
      
    } catch (err) {
      console.error("Verify OTP Error:", err.code, err.message);
      
      if (err.code === 'auth/invalid-verification-code') {
        setError("Invalid OTP. Please check and try again.");
        if (useTestMode) {
          setError("Invalid OTP. Test OTP should be: 523456");
        }
      } else if (err.code === 'auth/code-expired') {
        setError("OTP has expired. Please request a new one.");
        setConfirmation(null);
        setOtpSent(false);
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many incorrect attempts. Please wait.");
      } else {
        setError(`Verification failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestModeToggle = () => {
    setUseTestMode(!useTestMode);
    if (!useTestMode) {
      setPhone("7483090510"); // Pre-fill test number
    } else {
      setPhone("");
    }
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      backgroundColor: "#f5f5f5"
    }}>
      <Paper sx={{ 
        p: 4, 
        width: 400,
        maxWidth: "90%",
        boxShadow: 3
      }}>
        <Typography variant="h5" gutterBottom align="center" fontWeight="bold">
          {useTestMode ? "🔧 Test Mode - Phone Login" : "Phone Number Login"}
        </Typography>
        
        {useTestMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Test Mode Active. Using test number: +77483090510
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          {useTestMode 
            ? "Test OTP: 523456 (from Firebase Console)" 
            : "Enter your mobile number to receive OTP"}
        </Typography>

        {error && (
          <Alert severity={error.includes("success") ? "success" : "error"} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!otpSent ? (
          <>
            <TextField
              label={useTestMode ? "Test Number (pre-filled)" : "Mobile Number"}
              placeholder="10-digit mobile number"
              fullWidth
              margin="normal"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              disabled={loading || useTestMode}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {useTestMode ? "+7" : "+91"}
                  </InputAdornment>
                ),
              }}
            />
            
            {/* reCAPTCHA Container - Make sure it's visible */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Complete the security check below:
              </Typography>
              <div id="recaptcha-container" style={{ marginTop: 8 }}></div>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              onClick={sendOtp}
              disabled={loading || (!useTestMode && phone.length !== 10)}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : "Send OTP"}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={handleTestModeToggle}
              sx={{ mt: 2 }}
            >
              {useTestMode ? "Switch to Real Number" : "Use Test Mode"}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              OTP sent to {useTestMode ? "+77483090510" : `+91${phone}`}
            </Typography>
            
            <TextField
              label="Enter OTP"
              placeholder="6-digit code"
              fullWidth
              margin="normal"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              helperText={useTestMode ? "Enter: 523456" : "Check your SMS"}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
              }}
              sx={{ mt: 1 }}
            >
              Back to Phone Entry
            </Button>
          </>
        )}
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          By continuing, you agree to our Terms & Conditions
        </Typography>
      </Paper>
    </Box>
  );
};

export default PhoneLogin;