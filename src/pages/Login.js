import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Paper,
  CircularProgress, Alert, Fade, Grow, Zoom,
  InputAdornment, IconButton, alpha, useTheme
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Smartphone as SmartphoneIcon
} from "@mui/icons-material";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PhoneLogin = () => {
  const { user, role: authRole, loading: authLoading } = useAuth();
  const theme = useTheme();

  // Form states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Name

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

  /* ================= RECAPTCHA SETUP ================= */
  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
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
  const syncUser = async (user, userName = null) => {
    try {
      setLoading(true);
      setError("");

      const idToken = await user.getIdToken(true);

      // Default role is always "tenant" for new users
      const res = await userAPI.post("/auth/firebase", {
        idToken,
        role: "tenant",
        name: userName
      });

      if (res.data.success) {
        setSuccess(`Welcome ${res.data.name || userName || "User"}!`);
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
      return setError("Enter a valid 10-digit mobile number");
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
      setSuccess("OTP sent successfully!");
      setStep(2);

    } catch (err) {
      setError("Failed to send OTP. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Please enter a valid 6-digit OTP");

    try {
      setLoading(true);
      setError("");

      const res = await confirmObj.confirm(otp);
      setFirebaseUser(res.user);

      if (res._tokenResponse?.isNewUser) {
        setIsNewUser(true);
        setStep(3);
      } else {
        await syncUser(res.user);
      }

    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= COMPLETE REGISTRATION ================= */
  const completeRegistration = async () => {
    if (!firebaseUser) return;
    if (!name.trim()) return setError("Please enter your full name");
    
    await syncUser(firebaseUser, name.trim());
  };

  /* ================= RESEND OTP ================= */
  const resendOtp = async () => {
    if (otpTimer > 0) return;
    await sendOtp();
  };

  /* ================= BACK TO PHONE ================= */
  const backToPhone = () => {
    setStep(1);
    setConfirmObj(null);
    setOtp("");
    setError("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
          top: "-100px",
          right: "-100px",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 70%)`,
          bottom: "-50px",
          left: "-50px",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />
      
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>

      <Fade in timeout={800}>
        <Paper
          elevation={0}
          sx={{
            width: 450,
            maxWidth: "90%",
            borderRadius: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
            backdropFilter: "blur(10px)",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 25px 50px -12px ${alpha(theme.palette.common.black, 0.25)}`,
            overflow: "hidden",
            animation: "slideUp 0.6s ease-out",
          }}
        >
          {/* Header with gradient */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              padding: "40px 32px 32px",
              textAlign: "center",
              position: "relative",
            }}
          >
            <Zoom in timeout={500}>
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  margin: "0 auto 20px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <SmartphoneIcon sx={{ fontSize: 40, color: "white" }} />
              </Box>
            </Zoom>
            <Typography
              variant="h4"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {step === 1 && "Welcome Back"}
              {step === 2 && "Verify Your Number"}
              {step === 3 && "Almost There!"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: alpha(theme.palette.common.white, 0.9),
                opacity: 0.9,
              }}
            >
              {step === 1 && "Enter your mobile number to continue"}
              {step === 2 && `We've sent a 6-digit code to +91 ${phone}`}
              {step === 3 && "Just one more step to get started"}
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ padding: "32px" }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  animation: "slideUp 0.3s ease-out",
                }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  animation: "slideUp 0.3s ease-out",
                }}
                onClose={() => setSuccess("")}
              >
                {success}
              </Alert>
            )}

            {/* Step 1: Phone Number */}
            {step === 1 && (
              <Grow in timeout={300}>
                <Box>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    inputProps={{ maxLength: 10 }}
                    margin="normal"
                    variant="outlined"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                        },
                      },
                    }}
                  />

                  <Button
                    fullWidth
                    onClick={sendOtp}
                    disabled={loading || phone.length !== 10}
                    variant="contained"
                    size="large"
                    endIcon={!loading && <ArrowForwardIcon />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      textTransform: "none",
                      fontSize: "1rem",
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                      "&:active": {
                        transform: "translateY(0)",
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Continue"}
                  </Button>
                </Box>
              </Grow>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <Grow in timeout={300}>
                <Box>
                  <TextField
                    fullWidth
                    label="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    inputProps={{ maxLength: 6 }}
                    margin="normal"
                    variant="outlined"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                      },
                    }}
                  />

                  <Button
                    fullWidth
                    onClick={verifyOtp}
                    disabled={loading || otp.length !== 6}
                    variant="contained"
                    size="large"
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      textTransform: "none",
                      fontSize: "1rem",
                      fontWeight: 600,
                      mb: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Verify & Continue"}
                  </Button>

                  <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Didn't receive the code?{" "}
                      <Button
                        onClick={resendOtp}
                        disabled={otpTimer > 0}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          minWidth: "auto",
                          "&:hover": {
                            background: "transparent",
                          },
                        }}
                      >
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                      </Button>
                    </Typography>
                    <Button
                      onClick={backToPhone}
                      sx={{
                        mt: 1,
                        textTransform: "none",
                        color: "text.secondary",
                      }}
                    >
                      ← Back
                    </Button>
                  </Box>
                </Box>
              </Grow>
            )}

            {/* Step 3: Name Collection (New Users Only) */}
            {step === 3 && (
              <Grow in timeout={300}>
                <Box>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    autoFocus
                    placeholder="Enter your full name"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                      },
                    }}
                  />

                  <Button
                    fullWidth
                    onClick={completeRegistration}
                    disabled={loading || !name.trim()}
                    variant="contained"
                    size="large"
                    endIcon={!loading && <CheckCircleIcon />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      textTransform: "none",
                      fontSize: "1rem",
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      animation: "pulse 2s infinite",
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
                  </Button>
                </Box>
              </Grow>
            )}

            {/* Terms & Conditions */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>

          <div id="recaptcha-container"></div>
        </Paper>
      </Fade>
    </Box>
  );
};

export default PhoneLogin;