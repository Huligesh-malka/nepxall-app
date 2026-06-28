import React, { useState, useEffect, useRef } from "react";
import {
  Box, Button, Typography, CircularProgress, Alert,
  alpha, useTheme, useMediaQuery,
  Snackbar, Backdrop
} from "@mui/material";
import {
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
  ArrowBackRounded,
  LockOutlined,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";                           // <-- Lottie import
import walkingBoy from "../animations/walking-boy.json";    // <-- your JSON file

import { auth, requestNotificationPermission } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BRAND = {
  bg: "#0B0C12",
  surface: "#17191F",
  surfaceHi: "#20232B",
  border: "rgba(99,244,163,0.35)",
  text: "#FFFFFF",
  textDim: "#8E94A4",
  accent: "#63F4A3",
  accentTop: "#7DF6AF",
  accentBottom: "#63F4A3",
  accentGlow: "rgba(99,244,163,0.25)",
  danger: "#FF5A6E",
  cardBg: "rgba(255,255,255,0.03)",
};

// ===== ANIMATED 3D SCENE - Pixar Style with Indian Young Boy (20 years) =====
const AnimatedScene = () => {
  const containerRef = useRef(null);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: 200,
        borderRadius: "20px",
        overflow: "hidden",
        background: `linear-gradient(180deg, #0F1923 0%, #1A2A3A 40%, #2D4A5E 70%, #3D5A6B 100%)`,
        position: "relative",
        border: `1px solid ${BRAND.border}`,
        boxShadow: `inset 0 0 60px ${alpha("#000", 0.4)}, 0 0 40px ${BRAND.accentGlow}`,
        mb: 2.5,
      }}
    >
      {/* Ground with soft shadow */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "28%",
          background: `linear-gradient(180deg, ${alpha("#2D4A5E", 0.6)} 0%, #1A2A3A 100%)`,
          borderTop: `2px solid ${alpha(BRAND.accent, 0.2)}`,
        }}
      />

      {/* Soft glow behind building */}
      <Box
        sx={{
          position: "absolute",
          bottom: "30%",
          right: "15%",
          width: "40%",
          height: "50%",
          background: `radial-gradient(ellipse, ${alpha(BRAND.accent, 0.1)} 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(20px)",
        }}
      />

      {/* Soft glow behind character */}
      <Box
        sx={{
          position: "absolute",
          bottom: "20%",
          left: "15%",
          width: "30%",
          height: "40%",
          background: `radial-gradient(ellipse, ${alpha("#63F4A3", 0.08)} 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(20px)",
        }}
      />

      {/* Stars */}
      <Box sx={{ position: "absolute", top: 15, left: 0, right: 0, px: 3 }}>
        {[...Array(15)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              borderRadius: "50%",
              bgcolor: "#fff",
              opacity: 0.2 + Math.random() * 0.5,
              top: Math.random() * 60,
              left: Math.random() * 95,
              animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              boxShadow: `0 0 4px ${alpha("#fff", 0.2)}`,
            }}
          />
        ))}
      </Box>

      {/* PG Building - 3D Pixar Style */}
      <svg
        style={{
          position: "absolute",
          bottom: "22%",
          right: "6%",
          width: "38%",
          height: "72%",
          filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))",
        }}
        viewBox="0 0 200 250"
      >
        {/* Building body with rounded corners */}
        <rect x="20" y="50" width="160" height="155" rx="6" fill="#2C3E50" stroke={alpha(BRAND.accent, 0.3)} strokeWidth="2" />
        <rect x="22" y="52" width="156" height="151" rx="5" fill="#34495E" />
        
        {/* Roof with rounded edges */}
        <polygon points="10,50 100,5 190,50" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.2)} strokeWidth="2" />
        <polygon points="12,50 100,8 188,50" fill="#243342" />
        
        {/* Chimney with soft edges */}
        <rect x="140" y="10" width="16" height="35" rx="2" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="1" />
        <rect x="137" y="8" width="22" height="6" rx="3" fill="#2C3E50" />

        {/* PG Sign - Glowing neon */}
        <rect x="55" y="22" width="90" height="24" rx="6" fill={alpha(BRAND.accent, 0.15)} stroke={BRAND.accent} strokeWidth="2" />
        <rect x="55" y="22" width="90" height="24" rx="6" fill={alpha(BRAND.accent, 0.05)}>
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" />
        </rect>
        <text x="100" y="39" textAnchor="middle" fill={BRAND.accent} fontSize="15" fontWeight="700" fontFamily="'Geist', sans-serif" letterSpacing="3" filter="drop-shadow(0 0 10px rgba(99,244,163,0.5))">PG</text>

        {/* Windows - Warm glowing */}
        {[[45, 85], [45, 135], [120, 85], [120, 135]].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width="30" height="30" rx="4" fill={alpha("#FFD983", 0.12)} stroke={alpha(BRAND.accent, 0.15)} strokeWidth="1.5" />
            <rect x={x + 2} y={y + 2} width="26" height="26" rx="3" fill={alpha("#FFD983", 0.05)}>
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
            </rect>
            {/* Window cross */}
            <line x1={x + 15} y1={y} x2={x + 15} y2={y + 30} stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1.5" />
            <line x1={x} y1={y + 15} x2={x + 30} y2={y + 15} stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1.5" />
            {/* Warm glow */}
            <rect x={x + 4} y={y + 4} width={22} height={22} rx="2" fill={alpha("#FFD983", 0.06)}>
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
            </rect>
          </g>
        ))}

        {/* Door - Dark green with warm light */}
        <rect x="80" y="160" width="40" height="45" rx="5" fill="#2E6E50" stroke={alpha(BRAND.accent, 0.2)} strokeWidth="2" />
        <path d="M90,205 A20,20 0 0,1 110,205" fill="none" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="1.5" />
        <circle cx="112" cy="185" r="3.5" fill={BRAND.accent} opacity="0.4" />
        {/* Door light glow */}
        <rect x="85" y="165" width="30" height="18" rx="3" fill={alpha("#FFD983", 0.06)}>
          <animate attributeName="opacity" values="0.15;0.5;0.15" dur="3s" repeatCount="indefinite" />
        </rect>

        {/* Steps with 3D effect */}
        <rect x="70" y="205" width="60" height="6" rx="2" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />
        <rect x="74" y="211" width="52" height="6" rx="2" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />

        {/* Bushes - Rounded 3D style */}
        <ellipse cx="32" cy="205" rx="20" ry="14" fill="#1A4A3A" opacity="0.7" />
        <ellipse cx="168" cy="205" rx="20" ry="14" fill="#1A4A3A" opacity="0.7" />
        <ellipse cx="26" cy="198" rx="14" ry="10" fill="#2A5A4A" opacity="0.5" />
        <ellipse cx="174" cy="198" rx="14" ry="10" fill="#2A5A4A" opacity="0.5" />
      </svg>

      {/* ===== INDIAN YOUNG BOY - LOTTIE ANIMATION ===== */}
      <Box
        sx={{
          position: "absolute",
          bottom: "18%",
          left: "5%",
          width: "130px",
          animation: "walkAcross 4.5s ease-in-out infinite",
          filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.3))",
        }}
      >
        <Lottie
          animationData={walkingBoy}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </Box>

      <style>{`
        @keyframes walkAcross {
          0% { transform: translateX(0); }
          12% { transform: translateX(12px); }
          25% { transform: translateX(25px); }
          38% { transform: translateX(38px); }
          50% { transform: translateX(48px); }
          55% { transform: translateX(50px); }
          65% { transform: translateX(42px); }
          78% { transform: translateX(30px); }
          88% { transform: translateX(15px); }
          100% { transform: translateX(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </Box>
  );
};

// ===== MAIN LOGIN COMPONENT (unchanged) =====
const PhoneLogin = () => {
  const { user, loading: authLoading, login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");

  // State...
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [step, setStep] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const verificationInProgress = useRef(false);
  const redirectInProgress = useRef(false);
  const initialCheckDone = useRef(false);
  const otpRefs = useRef([]);

  const navigate = useNavigate();

  // Effects and functions (same as your original)
  useEffect(() => {
    if (authLoading || redirectInProgress.current || registrationComplete || isRedirecting) return;
    if (initialCheckDone.current) return;

    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    let shouldRedirect = false;
    let userRole = null;

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.name && userData.name.trim() !== "") {
          shouldRedirect = true;
          userRole = userData.role || "user";
        }
      } catch (e) { console.error(e); }
    } else if (user && user.name && user.name.trim() !== "" && user.role) {
      shouldRedirect = true;
      userRole = user.role;
    }

    if (shouldRedirect && !isRedirecting) {
      initialCheckDone.current = true;
      setIsRedirecting(true);
      redirectInProgress.current = true;
      redirect(userRole);
    }
  }, [user, authLoading, registrationComplete, isRedirecting]);

  useEffect(() => { if (auth) auth.useDeviceLanguage(); }, []);
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const setupRecaptcha = async () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          "expired-callback": () => { window.recaptchaVerifier = null; },
        });
        await window.recaptchaVerifier.render();
      }
    } catch (err) {
      if (window.recaptchaVerifier) {
        try { await window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
      throw new Error("Failed to initialize security verification");
    }
  };

  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "owner") navigate("/owner/dashboard");
    else navigate("/");
  };

  const saveAuthData = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (login) login(userData);
    setAuthToken(token);
  };

  const sendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) return setError("Enter a valid 10-digit mobile number");
    try {
      setLoading(true); setError(""); setSuccess("");
      setConfirmObj(null); setOtp(""); setFirebaseUser(null);
      await setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, window.recaptchaVerifier);
      setConfirmObj(confirmation);
      setOtpTimer(60);
      setSuccess("OTP sent successfully");
      setStep(2);
    } catch (err) {
      if (window.recaptchaVerifier) {
        try { await window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
      if (err.code === "auth/invalid-phone-number") setError("Invalid phone number format");
      else if (err.code === "auth/too-many-requests") setError("Too many attempts. Try later");
      else if (err.code === "auth/network-request-failed") setError("Network error");
      else setError("Failed to send OTP. Please try again");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (verificationInProgress.current) return;
    if (otp.length !== 6) return setError("Please enter the 6-digit code");
    verificationInProgress.current = true;
    try {
      setLoading(true); setError(""); setSuccess("Verifying…");
      const result = await confirmObj.confirm(otp);
      setFirebaseUser(result.user);
      const idToken = await result.user.getIdToken(true);
      await requestNotificationPermission();
      const checkResponse = await userAPI.post("/auth/firebase", { idToken, role: "user", phone });
      if (checkResponse.data.success) {
        if (checkResponse.data.token) saveAuthData(checkResponse.data.token, checkResponse.data.user);
        const fcmToken = localStorage.getItem("fcm_token");
        if (fcmToken && checkResponse.data.token) {
          await userAPI.post("/notifications/save-fcm-token",
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${checkResponse.data.token}` } }
          );
        }
        setRegistrationComplete(true);
        setIsRedirecting(true);
        redirectInProgress.current = true;
        setSnackbarMessage(checkResponse.data.message || "Welcome aboard");
        setSnackbarOpen(true);
        redirect(checkResponse.data.user?.role || "user");
      } else setError(checkResponse.data.message || "Authentication failed");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
      verificationInProgress.current = false;
    }
  };

  const resendOtp = async () => {
    if (otpTimer > 0) return;
    setIsResending(true);
    await sendOtp();
    setIsResending(false);
  };

  const backToPhone = () => {
    setStep(1); setConfirmObj(null); setOtp(""); setError(""); setSuccess("");
    setRegistrationComplete(false); setFirebaseUser(null); setIsRedirecting(false);
    verificationInProgress.current = false; redirectInProgress.current = false;
  };

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const arr = otp.padEnd(6, " ").split("");
    arr[idx] = digit || " ";
    const next = arr.join("").trimEnd();
    setOtp(next.replace(/\s/g, ""));
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("Text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setOtp(pasted);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: BRAND.bg }}>
        <CircularProgress sx={{ color: BRAND.accent }} />
      </Box>
    );
  }
  if (isRedirecting || registrationComplete) return null;

  return (
    <>
      <GlobalStyles />

      <Backdrop sx={{ color: BRAND.accent, zIndex: 9999 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="success"
          sx={{
            bgcolor: BRAND.surfaceHi,
            color: BRAND.text,
            border: `1px solid ${alpha(BRAND.accent, 0.3)}`,
            "& .MuiAlert-icon": { color: BRAND.accent },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          bgcolor: BRAND.bg,
          color: BRAND.text,
          position: "relative",
          overflow: "hidden",
          fontFamily: `'Geist', 'Inter', system-ui, sans-serif`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        {/* Background effects */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            background: `radial-gradient(ellipse, ${alpha(BRAND.accent, 0.03)} 0%, transparent 70%)`,
            borderRadius: "50%",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <Box className="aurora aurora-1" />
        <Box className="aurora aurora-2" />
        <Box className="aurora aurora-3" />
        <Box className="grain" />

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 420,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box
              sx={{
                position: "relative",
                borderRadius: "32px",
                p: { xs: 3, sm: 4 },
                background: `linear-gradient(180deg, ${alpha("#ffffff", 0.05)} 0%, ${alpha("#ffffff", 0.02)} 100%)`,
                border: `1px solid ${BRAND.border}`,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: `
                  inset 0 1px 0 ${alpha("#ffffff", 0.08)},
                  0 30px 80px -20px ${alpha("#000", 0.7)},
                  0 0 40px ${alpha(BRAND.accent, 0.05)}
                `,
                overflow: "hidden",
              }}
            >
              {/* Glow border */}
              <Box sx={{
                position: "absolute",
                inset: -1,
                borderRadius: "32px",
                padding: "1px",
                background: `linear-gradient(140deg, ${alpha(BRAND.accent, 0.4)} 0%, transparent 40%, transparent 60%, ${alpha(BRAND.accent, 0.2)} 100%)`,
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none",
              }} />

              {/* PG Label */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: "6px",
                    color: BRAND.accent,
                    textShadow: `0 0 40px ${alpha(BRAND.accent, 0.3)}, 0 0 80px ${alpha(BRAND.accent, 0.1)}`,
                  }}
                >
                  PG
                </Typography>
              </Box>

              {/* Animated Scene */}
              <AnimatedScene />

              {/* Step indicator */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: alpha(BRAND.accent, 0.12),
                    border: `1px solid ${alpha(BRAND.accent, 0.2)}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: BRAND.accent,
                      letterSpacing: "0.08em",
                    }}
                  >
                    STEP {step} OF 2
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 0.8 }}>
                  {[1, 2].map((s) => (
                    <Box
                      key={s}
                      sx={{
                        width: s === step ? 36 : 20,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: s <= step ? BRAND.accent : alpha(BRAND.text, 0.1),
                        boxShadow: s === step ? `0 0 12px ${alpha(BRAND.accent, 0.4)}` : "none",
                        transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ borderTop: `1px solid ${alpha(BRAND.border, 0.5)}`, pt: 2.5 }} />

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Typography sx={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      mb: 0.5,
                      color: BRAND.text,
                    }}>
                      Enter your number
                    </Typography>
                    <Typography sx={{
                      color: BRAND.textDim,
                      fontSize: 14,
                      mb: 2.5,
                    }}>
                      We'll send a one-time code via SMS.
                    </Typography>

                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      border: `1px solid ${error ? BRAND.danger : alpha(BRAND.accent, 0.2)}`,
                      borderRadius: "18px",
                      bgcolor: alpha(BRAND.surfaceHi, 0.6),
                      transition: "all 0.3s ease",
                      mb: error ? 1.5 : 2.5,
                      "&:focus-within": {
                        borderColor: BRAND.accent,
                        boxShadow: `0 0 0 4px ${alpha(BRAND.accent, 0.12)}`,
                        bgcolor: alpha(BRAND.surfaceHi, 0.8),
                      },
                    }}>
                      <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1.8,
                        py: 1.6,
                        borderRight: `1px solid ${alpha(BRAND.border, 0.5)}`,
                        color: BRAND.textDim,
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                        <span style={{ fontSize: 18 }}>🇮🇳</span>
                        <span style={{ fontFamily: "'Geist Mono', monospace" }}>+91</span>
                        <span style={{ color: BRAND.textDim, fontSize: 11 }}>▼</span>
                      </Box>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        maxLength={10}
                        placeholder="Enter mobile number"
                        autoFocus
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: BRAND.text,
                          fontSize: 16,
                          padding: "16px 18px",
                          fontFamily: "'Geist', sans-serif",
                          letterSpacing: "0.02em",
                        }}
                      />
                    </Box>

                    {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

                    <PremiumButton
                      onClick={sendOtp}
                      disabled={loading || phone.replace(/\D/g, "").length !== 10}
                      loading={loading}
                    >
                      Continue
                      <SendIcon sx={{ fontSize: 18 }} />
                    </PremiumButton>

                    <Typography sx={{
                      mt: 2.5,
                      color: BRAND.textDim,
                      fontSize: 12,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.8,
                    }}>
                      <LockOutlined sx={{ fontSize: 13 }} />
                      Secure & private. We respect your privacy.
                    </Typography>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Typography sx={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      mb: 0.5,
                      color: BRAND.text,
                    }}>
                      Enter verification code
                    </Typography>
                    <Typography sx={{
                      color: BRAND.textDim,
                      fontSize: 14,
                      mb: 2.5,
                    }}>
                      We sent a 6-digit code to{" "}
                      <span style={{ color: BRAND.text, fontWeight: 600 }}>
                        +91 {phone}
                      </span>
                    </Typography>

                    <Box
                      onPaste={handleOtpPaste}
                      sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0.8, mb: 2.5 }}
                    >
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          value={otp[i] || ""}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKey(i, e)}
                          inputMode="numeric"
                          maxLength={1}
                          autoFocus={i === 0}
                          style={{
                            width: "100%",
                            aspectRatio: "1 / 1.15",
                            borderRadius: "14px",
                            border: `1px solid ${otp[i] ? alpha(BRAND.accent, 0.5) : alpha(BRAND.border, 0.5)}`,
                            background: otp[i] ? alpha(BRAND.accent, 0.06) : alpha(BRAND.surfaceHi, 0.4),
                            color: BRAND.text,
                            fontSize: 24,
                            fontWeight: 600,
                            textAlign: "center",
                            fontFamily: "'Geist Mono', monospace",
                            outline: "none",
                            transition: "all 0.2s ease",
                            boxShadow: otp[i] ? `0 0 0 4px ${alpha(BRAND.accent, 0.1)}` : "none",
                          }}
                          onFocus={(e) => e.target.style.borderColor = BRAND.accent}
                          onBlur={(e) => e.target.style.borderColor = otp[i] ? alpha(BRAND.accent, 0.5) : alpha(BRAND.border, 0.5)}
                        />
                      ))}
                    </Box>

                    {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

                    <PremiumButton
                      onClick={verifyOtp}
                      disabled={loading || otp.length !== 6}
                      loading={loading}
                    >
                      Verify
                      <VerifiedUserIcon sx={{ fontSize: 18 }} />
                    </PremiumButton>

                    <Box sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 2.5,
                    }}>
                      <Button
                        onClick={backToPhone}
                        startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
                        sx={{
                          color: BRAND.textDim,
                          textTransform: "none",
                          fontSize: 13,
                          "&:hover": { color: BRAND.text, bgcolor: "transparent" },
                        }}
                      >
                        Change number
                      </Button>

                      {otpTimer > 0 ? (
                        <Typography sx={{
                          color: BRAND.textDim,
                          fontSize: 13,
                          fontFamily: "'Geist Mono', monospace",
                        }}>
                          Resend in <span style={{ color: BRAND.text }}>{otpTimer}s</span>
                        </Typography>
                      ) : (
                        <Button
                          onClick={resendOtp}
                          disabled={isResending}
                          sx={{
                            color: BRAND.accent,
                            textTransform: "none",
                            fontSize: 13,
                            fontWeight: 600,
                            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                          }}
                        >
                          {isResending ? "Sending…" : "Resend code"}
                        </Button>
                      )}
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>

            <div id="recaptcha-container" style={{ display: "flex", justifyContent: "center", marginTop: 14 }} />
          </motion.div>
        </Box>
      </Box>
    </>
  );
};

/* ============ STYLING COMPONENTS ============ */

const PremiumButton = ({ onClick, disabled, loading, children }) => (
  <motion.button
    whileHover={!disabled ? { y: -3, scale: 1.01 } : {}}
    whileTap={!disabled ? { scale: 0.97 } : {}}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: "100%",
      border: "none",
      borderRadius: "20px",
      padding: "16px 24px",
      background: disabled
        ? alpha(BRAND.text, 0.08)
        : `linear-gradient(180deg, ${BRAND.accentTop} 0%, ${BRAND.accentBottom} 100%)`,
      color: disabled ? BRAND.textDim : "#0B0C12",
      fontSize: 16,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      boxShadow: disabled
        ? "none"
        : `0 8px 32px -8px ${alpha(BRAND.accent, 0.5)}, inset 0 1px 0 ${alpha("#ffffff", 0.2)}`,
      transition: "all 0.25s ease",
      fontFamily: "inherit",
      letterSpacing: "0.01em",
    }}
  >
    {loading ? (
      <CircularProgress size={20} sx={{ color: "#0B0C12" }} />
    ) : (
      children
    )}
  </motion.button>
);

const ErrorBanner = ({ msg, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      marginBottom: 16,
      padding: "10px 14px",
      borderRadius: 14,
      background: alpha(BRAND.danger, 0.08),
      border: `1px solid ${alpha(BRAND.danger, 0.25)}`,
      color: BRAND.danger,
      fontSize: 13,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>{msg}</span>
    <button
      onClick={onClose}
      style={{
        background: "transparent",
        border: "none",
        color: BRAND.danger,
        cursor: "pointer",
        fontSize: 18,
        lineHeight: 1,
        padding: "0 4px",
      }}
    >
      ×
    </button>
  </motion.div>
);

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

    .aurora {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.3;
      pointer-events: none;
      z-index: 1;
    }
    .aurora-1 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, ${BRAND.accent} 0%, transparent 60%);
      top: -200px;
      left: -150px;
      animation: drift1 18s ease-in-out infinite;
    }
    .aurora-2 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, ${alpha(BRAND.accent, 0.5)} 0%, transparent 60%);
      bottom: -150px;
      right: -100px;
      animation: drift2 20s ease-in-out infinite;
    }
    .aurora-3 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, ${alpha(BRAND.accent, 0.3)} 0%, transparent 60%);
      top: 40%;
      left: 30%;
      opacity: 0.12;
      animation: drift3 22s ease-in-out infinite;
    }
    @keyframes drift1 {
      0%,100% { transform: translate(0,0) scale(1); }
      50% { transform: translate(40px, 60px) scale(1.1); }
    }
    @keyframes drift2 {
      0%,100% { transform: translate(0,0) scale(1); }
      50% { transform: translate(-60px, -40px) scale(1.15); }
    }
    @keyframes drift3 {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(-30px, 50px); }
    }
    .grain {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      opacity: 0.03;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    }
  `}</style>
);

export default PhoneLogin;