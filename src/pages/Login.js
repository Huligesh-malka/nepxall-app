// Login.jsx - Production Ready with All Improvements
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Grow,
  Zoom,
} from "@mui/material";
import { Phone, CheckCircle, PersonAdd, ArrowBack } from "@mui/icons-material";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const steps = ["Phone Number", "Verify OTP", "Complete Profile"];

const Login = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [timer, setTimer] = useState(0);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const navigate = useNavigate();
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  // Auto-focus on step change
  useEffect(() => {
    if (activeStep === 0 && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
    if (activeStep === 1 && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [activeStep]);

  // Timer for OTP resend
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Initialize reCAPTCHA
  const setUpRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        }
      );
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setUpRecaptcha();
      const phoneWithCode = `+91${phone}`;
      const result = await signInWithPhoneNumber(
        auth,
        phoneWithCode,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setActiveStep(1);
      setTimer(30);
    } catch (err) {
      console.error("OTP Error:", err);
      setError("Failed to send OTP. Please try again.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await confirmationResult.confirm(otp);
      const user = res.user;
      setFirebaseUser(user);

      // Get fresh ID token
      const idToken = await user.getIdToken(true);

      // ALWAYS CHECK BACKEND FOR USER STATUS
      const checkResponse = await userAPI.post("/auth/firebase", {
        idToken,
        // Role is NOT sent from frontend - backend decides!
      });

      // If user has no name → ask for name
      if (!checkResponse.data.user?.name) {
        setActiveStep(2);
      } else {
        // User exists with name, redirect based on role
        const role = checkResponse.data.user?.role || "tenant";
        redirectBasedOnRole(role);
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Save user name and complete registration
  const handleSaveName = async () => {
    if (!userName || userName.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const idToken = await firebaseUser.getIdToken(true);

      // Create user with name (role is set by backend)
      const response = await userAPI.post("/auth/firebase", {
        idToken,
        name: userName.trim(),
        // Role is NOT sent - backend automatically assigns "tenant"
      });

      const role = response.data.user?.role || "tenant";
      redirectBasedOnRole(role);
    } catch (err) {
      console.error("Save Name Error:", err);
      setError(err.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect user based on role
  const redirectBasedOnRole = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case "admin":
        navigate("/admin/finance");
        break;
      case "owner":
        navigate("/owner/dashboard");
        break;
      case "vendor":
        navigate("/vendor/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError("");

    try {
      const phoneWithCode = `+91${phone}`;
      const result = await signInWithPhoneNumber(
        auth,
        phoneWithCode,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setTimer(30);
    } catch (err) {
      console.error("Resend Error:", err);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
    setOtp("");
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 4 }}>
      <Grow in timeout={500}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 5 },
            borderRadius: 5,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(229,231,235,0.5)",
            boxShadow: "0 20px 35px -10px rgba(0,0,0,0.1)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Loading Overlay */}
          {loading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 999,
                borderRadius: 5,
              }}
            >
              <CircularProgress sx={{ color: "#4CAF50" }} />
            </Box>
          )}

          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                background: "linear-gradient(135deg, #0B5ED7, #4CAF50)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome to Nepxall
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {activeStep === 0 && "Enter your phone number to continue"}
              {activeStep === 1 && "Enter the 6-digit OTP sent to your phone"}
              {activeStep === 2 && "Tell us your name to complete setup"}
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 5, "& .MuiStepLabel-root": { cursor: "pointer" } }}>
            {steps.map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Phone Number */}
          {activeStep === 0 && (
            <Zoom in timeout={300}>
              <Box>
                <TextField
                  inputRef={phoneInputRef}
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  autoComplete="off"
                  InputProps={{
                    startAdornment: (
                      <Typography variant="body1" sx={{ mr: 1, color: "gray" }}>
                        +91
                      </Typography>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  onKeyPress={(e) => e.key === "Enter" && handleSendOTP()}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSendOTP}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: "linear-gradient(90deg, #0B5ED7, #4CAF50)",
                    borderRadius: 3,
                    textTransform: "none",
                    fontSize: 16,
                    "&:hover": {
                      background: "linear-gradient(90deg, #0a4fb8, #3d9a40)",
                    },
                  }}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </Box>
            </Zoom>
          )}

          {/* Step 1: OTP Verification */}
          {activeStep === 1 && (
            <Fade in timeout={300}>
              <Box>
                <TextField
                  inputRef={otpInputRef}
                  fullWidth
                  label="Enter OTP"
                  variant="outlined"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  autoComplete="off"
                  sx={{ mb: 2 }}
                  onKeyPress={(e) => e.key === "Enter" && handleVerifyOTP()}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: "linear-gradient(90deg, #0B5ED7, #4CAF50)",
                    borderRadius: 3,
                    textTransform: "none",
                    fontSize: 16,
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>

                {/* Resend OTP */}
                <Box textAlign="center" mt={3}>
                  <Typography variant="body2" color="text.secondary">
                    {timer > 0 ? (
                      `Resend code in ${timer}s`
                    ) : (
                      <Button
                        onClick={handleResendOTP}
                        disabled={loading}
                        sx={{ textTransform: "none", color: "#0B5ED7" }}
                      >
                        Resend OTP
                      </Button>
                    )}
                  </Typography>
                </Box>

                {/* Back Button */}
                <Button
                  startIcon={<ArrowBack />}
                  onClick={handleBack}
                  sx={{ mt: 2, textTransform: "none" }}
                >
                  Back
                </Button>
              </Box>
            </Fade>
          )}

          {/* Step 2: Name Collection */}
          {activeStep === 2 && (
            <Zoom in timeout={300}>
              <Box>
                {/* Phone Preview - User remembers which number they used */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <Phone fontSize="small" sx={{ color: "#4CAF50" }} />
                  <Typography variant="body2" color="text.secondary">
                    Verifying for: <strong>+91 {phone}</strong>
                  </Typography>
                </Paper>

                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="off"
                  InputProps={{
                    startAdornment: <PersonAdd sx={{ mr: 1, color: "gray" }} />,
                  }}
                  sx={{ mb: 3 }}
                  onKeyPress={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSaveName}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: "linear-gradient(90deg, #0B5ED7, #4CAF50)",
                    borderRadius: 3,
                    textTransform: "none",
                    fontSize: 16,
                  }}
                >
                  {loading ? "Creating Account..." : "Complete Registration"}
                </Button>
              </Box>
            </Zoom>
          )}

          {/* Error Message */}
          {error && (
            <Fade in timeout={300}>
              <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError("")}>
                {error}
              </Alert>
            </Fade>
          )}

          {/* reCAPTCHA Container (invisible) */}
          <div id="recaptcha-container" />

          {/* Terms Note */}
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={4}>
            By continuing, you agree to our Terms & Conditions and Privacy Policy
          </Typography>
        </Paper>
      </Grow>
    </Container>
  );
};

export default Login;