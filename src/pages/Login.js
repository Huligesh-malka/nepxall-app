import React, { useState, useEffect, useRef } from "react";
import {
  Box, Button, Typography, CircularProgress, Alert,
  alpha, useTheme, useMediaQuery,
  Snackbar, Backdrop
} from "@mui/material";
import {
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  ShieldOutlined,
  BoltOutlined,
  AutoAwesomeOutlined,
  ArrowBackRounded,
  LockOutlined,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  Favorite as FavoriteIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import { auth, requestNotificationPermission } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BRAND = {
  bg: "#0A0B10",
  surface: "#13141B",
  surfaceHi: "#1B1D27",
  border: "rgba(255,255,255,0.08)",
  text: "#EDEEF2",
  textDim: "#8A8FA3",
  accent: "#7CFFB2",
  accent2: "#FF7A59",
  accent3: "#7CA8FF",
  danger: "#FF5A6E",
  cardBg: "rgba(255,255,255,0.03)",
};

// ===== ANIMATED SCENE COMPONENT =====
const AnimatedScene = () => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // SVG Scene with walking character and PG building
  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: 280,
        borderRadius: "16px",
        overflow: "hidden",
        background: `linear-gradient(180deg, #0F1923 0%, #1A2A3A 40%, #2D4A5E 70%, #3D5A6B 100%)`,
        position: "relative",
        border: `1px solid ${alpha(BRAND.accent, 0.1)}`,
        boxShadow: `inset 0 0 60px ${alpha("#000", 0.3)}`,
        mb: 3,
      }}
    >
      {/* Ground */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "25%",
          background: `linear-gradient(180deg, ${alpha("#2D4A5E", 0.8)} 0%, #1A2A3A 100%)`,
          borderTop: `2px solid ${alpha(BRAND.accent, 0.15)}`,
        }}
      />

      {/* Stars */}
      <Box sx={{ position: "absolute", top: 10, left: 0, right: 0, px: 3 }}>
        {[...Array(12)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: 2,
              height: 2,
              borderRadius: "50%",
              bgcolor: "#fff",
              opacity: 0.3 + Math.random() * 0.5,
              top: Math.random() * 80,
              left: Math.random() * 95,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </Box>

      {/* PG Building */}
      <svg
        style={{
          position: "absolute",
          bottom: "20%",
          right: "8%",
          width: "35%",
          height: "75%",
        }}
        viewBox="0 0 200 250"
      >
        {/* Building body */}
        <rect x="20" y="50" width="160" height="160" rx="4" fill="#2C3E50" stroke={alpha(BRAND.accent, 0.2)} strokeWidth="1.5" />
        
        {/* Roof */}
        <polygon points="10,50 100,5 190,50" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="1.5" />
        
        {/* Chimney */}
        <rect x="140" y="10" width="16" height="35" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />
        <rect x="136" y="8" width="24" height="6" rx="2" fill="#2C3E50" />

        {/* PG Sign */}
        <rect x="55" y="20" width="90" height="22" rx="4" fill={alpha(BRAND.accent, 0.15)} stroke={BRAND.accent} strokeWidth="1.5" />
        <text
          x="100"
          y="36"
          textAnchor="middle"
          fill={BRAND.accent}
          fontSize="14"
          fontWeight="700"
          fontFamily="'Geist', sans-serif"
          letterSpacing="2"
        >
          PG
        </text>
        {/* Sign glow */}
        <rect x="55" y="20" width="90" height="22" rx="4" fill={alpha(BRAND.accent, 0.05)}>
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </rect>

        {/* Windows */}
        {[
          [45, 80],
          [45, 130],
          [120, 80],
          [120, 130]
        ].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width="28" height="28" rx="2" fill={alpha("#FFD700", 0.15)} stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />
            {/* Window cross */}
            <line x1={x + 14} y1={y} x2={x + 14} y2={y + 28} stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />
            <line x1={x} y1={y + 14} x2={x + 28} y2={y + 14} stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />
            {/* Warm glow */}
            <rect x={x + 2} y={y + 2} width={24} height={24} rx="1" fill={alpha("#FFD700", 0.05)}>
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
            </rect>
          </g>
        ))}

        {/* Door */}
        <rect x="80" y="160" width="40" height="50" rx="4" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="1.5" />
        <path d="M90,210 A20,20 0 0,1 110,210" fill="none" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />
        {/* Door knob */}
        <circle cx="110" cy="188" r="3" fill={BRAND.accent} opacity="0.3" />
        {/* Door light */}
        <rect x="85" y="165" width="30" height="20" rx="2" fill={alpha("#FFD700", 0.05)}>
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
        </rect>

        {/* Steps */}
        <rect x="72" y="210" width="56" height="6" rx="1" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />
        <rect x="76" y="216" width="48" height="6" rx="1" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />

        {/* Bushes */}
        <ellipse cx="35" cy="205" rx="18" ry="12" fill="#1A4A3A" opacity="0.6" />
        <ellipse cx="165" cy="205" rx="18" ry="12" fill="#1A4A3A" opacity="0.6" />
        <ellipse cx="30" cy="200" rx="12" ry="8" fill="#2A5A4A" opacity="0.4" />
        <ellipse cx="170" cy="200" rx="12" ry="8" fill="#2A5A4A" opacity="0.4" />
      </svg>

      {/* Walking Character with Trolley */}
      <svg
        style={{
          position: "absolute",
          bottom: "18%",
          left: "5%",
          width: "25%",
          height: "50%",
          animation: "walkCycle 4.2s ease-in-out infinite",
        }}
        viewBox="0 0 120 160"
      >
        <g>
          {/* Shadow */}
          <ellipse cx="60" cy="148" rx="25" ry="5" fill={alpha("#000", 0.2)}>
            <animate attributeName="rx" values="25;22;25" dur="0.6s" repeatCount="indefinite" />
          </ellipse>

          {/* Trolley Bag - behind character */}
          <g transform="translate(85, 95)">
            {/* Handle */}
            <line x1="5" y1="0" x2="5" y2="-35" stroke={alpha("#8A8FA3", 0.4)} strokeWidth="3" strokeLinecap="round" />
            <line x1="5" y1="-35" x2="-20" y2="-35" stroke={alpha("#8A8FA3", 0.4)} strokeWidth="3" strokeLinecap="round" />
            <line x1="-20" y1="-35" x2="-20" y2="-15" stroke={alpha("#8A8FA3", 0.4)} strokeWidth="3" strokeLinecap="round" />
            {/* Trolley body */}
            <rect x="-15" y="10" width="35" height="45" rx="4" fill="#2A5A4A" stroke={alpha(BRAND.accent, 0.15)} strokeWidth="1.5" />
            <rect x="-12" y="14" width="8" height="8" rx="1" fill={alpha(BRAND.accent, 0.05)} />
            <rect x="0" y="14" width="8" height="8" rx="1" fill={alpha(BRAND.accent, 0.05)} />
            <rect x="-12" y="28" width="8" height="8" rx="1" fill={alpha(BRAND.accent, 0.05)} />
            <rect x="0" y="28" width="8" height="8" rx="1" fill={alpha(BRAND.accent, 0.05)} />
            {/* Trolley wheels */}
            <g transform="translate(-5, 55)">
              <circle cx="0" cy="0" r="6" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2" fill="#3A5A6A" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#3A5A6A" strokeWidth="1">
                <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.8s" repeatCount="indefinite" />
              </line>
            </g>
            <g transform="translate(15, 55)">
              <circle cx="0" cy="0" r="6" fill="#1A2A3A" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2" fill="#3A5A6A" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#3A5A6A" strokeWidth="1">
                <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.8s" repeatCount="indefinite" />
              </line>
            </g>
          </g>

          {/* Character Body - full with skin face */}
          <g>
            {/* Body - Green Hoodie */}
            <rect x="35" y="50" width="40" height="55" rx="8" fill="#2D7A4A" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />
            {/* Hoodie pocket */}
            <rect x="40" y="75" width="30" height="12" rx="4" fill="none" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />
            {/* Hoodie zipper */}
            <line x1="55" y1="50" x2="55" y2="105" stroke={alpha(BRAND.accent, 0.08)} strokeWidth="1.5" />
            {/* Hood */}
            <path d="M35,50 Q55,30 75,50" fill="#2D7A4A" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="1" />

            {/* Legs - Dark pants */}
            <rect x="38" y="105" width="12" height="30" rx="3" fill="#1A2A3A" />
            <rect x="58" y="105" width="12" height="30" rx="3" fill="#1A2A3A" />

            {/* Shoes - White sneakers */}
            <ellipse cx="42" cy="138" rx="10" ry="4" fill="#EDEEF2" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />
            <ellipse cx="64" cy="138" rx="10" ry="4" fill="#EDEEF2" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />

            {/* Left Arm - extended to trolley */}
            <g>
              <line x1="35" y1="60" x2="20" y2="85" stroke="#2D7A4A" strokeWidth="8" strokeLinecap="round" />
              <circle cx="20" cy="87" r="5" fill="#D4A574" />
            </g>

            {/* Right Arm - swinging */}
            <g>
              <line x1="75" y1="60" x2="88" y2="80" stroke="#2D7A4A" strokeWidth="8" strokeLinecap="round">
                <animate attributeName="x2" values="88;92;88" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="y2" values="80;76;80" dur="0.6s" repeatCount="indefinite" />
              </line>
              <circle cx="88" cy="82" r="5" fill="#D4A574">
                <animate attributeName="cx" values="88;92;88" dur="0.6s" repeatCount="indefinite" />
                <animate attributeName="cy" values="82;78;82" dur="0.6s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Head - Skin tone */}
            <ellipse cx="55" cy="38" rx="22" ry="26" fill="#D4A574" stroke={alpha(BRAND.accent, 0.05)} strokeWidth="1" />
            
            {/* Hair - Dark */}
            <ellipse cx="55" cy="28" rx="24" ry="16" fill="#1A1A1A" />
            <path d="M33,30 Q45,20 55,22 Q65,20 77,30" fill="#1A1A1A" />

            {/* Eyes */}
            <ellipse cx="47" cy="38" rx="4" ry="4.5" fill="#fff" />
            <ellipse cx="63" cy="38" rx="4" ry="4.5" fill="#fff" />
            <circle cx="48" cy="38" r="2.5" fill="#2C3E50" />
            <circle cx="64" cy="38" r="2.5" fill="#2C3E50" />
            <circle cx="49" cy="37" r="1" fill="#fff" />
            <circle cx="65" cy="37" r="1" fill="#fff" />

            {/* Eyebrows */}
            <path d="M43,33 Q47,31 51,33" stroke="#1A1A1A" strokeWidth="1.5" fill="none" />
            <path d="M59,33 Q63,31 67,33" stroke="#1A1A1A" strokeWidth="1.5" fill="none" />

            {/* Smile */}
            <path d="M48,46 Q55,52 62,46" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Backpack straps */}
            <path d="M40,52 L40,70 Q40,72 42,72" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="2" fill="none" />
            <path d="M70,52 L70,70 Q70,72 68,72" stroke={alpha(BRAND.accent, 0.1)} strokeWidth="2" fill="none" />
          </g>

          {/* Leg animation */}
          <animateTransform attributeName="transform" type="translate" values="0,0; 30,0; 60,0; 90,0; 60,0; 30,0; 0,0" dur="4.2s" repeatCount="indefinite" />
        </g>
      </svg>

      <style>{`
        @keyframes walkCycle {
          0% { transform: translateX(0); }
          15% { transform: translateX(10px); }
          30% { transform: translateX(20px); }
          45% { transform: translateX(30px); }
          55% { transform: translateX(35px); }
          70% { transform: translateX(30px); }
          85% { transform: translateX(15px); }
          100% { transform: translateX(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </Box>
  );
};

const PhoneLogin = () => {
  const { user, loading: authLoading, login } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery("(min-width:900px)");
  const isMobile = useMediaQuery("(max-width:600px)");

  // ===== State =====
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

  // ===== Effects =====
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

  // ===== Functions =====
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

  // ===== OTP handlers =====
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
            bgcolor: BRAND.surfaceHi, color: BRAND.text,
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
        }}
      >
        {/* Aurora blobs */}
        <Box className="aurora aurora-1" />
        <Box className="aurora aurora-2" />
        <Box className="aurora aurora-3" />
        <Box className="grain" />

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 1200,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, sm: 4 },
            display: "grid",
            gridTemplateColumns: isDesktop ? "1.2fr 1fr" : "1fr",
            gap: isDesktop ? 6 : 0,
            alignItems: "center",
          }}
        >
          {/* ===== LEFT — Brand Panel with Animated Scene ===== */}
          {isDesktop && (
            <Box sx={{ pr: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Logo */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${BRAND.accent}, #4CAF50)`,
                      display: "grid",
                      placeItems: "center",
                      boxShadow: `0 0 30px ${alpha(BRAND.accent, 0.3)}`,
                    }}
                  >
                    <HomeIcon sx={{ color: BRAND.bg, fontSize: 22 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: 22 }}>
                    PG<span style={{ color: BRAND.accent }}>Finder</span>
                  </Typography>
                </Box>

                {/* Animated Scene */}
                <AnimatedScene />

                {/* Main Title - matches image */}
                <Typography
                  sx={{
                    fontSize: { md: 44, lg: 52 },
                    lineHeight: 1.05,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    mb: 1.5,
                  }}
                >
                  Find your
                  <br />
                  <span style={{
                    background: `linear-gradient(90deg, ${BRAND.accent} 0%, #4CAF50 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    perfect PG
                  </span>
                </Typography>

                {/* Subtitle */}
                <Typography
                  sx={{
                    color: BRAND.textDim,
                    fontSize: 16,
                    mb: 3,
                    lineHeight: 1.6,
                  }}
                >
                  Comfortable stays. <br />
                  Verified owners.
                </Typography>

                {/* Feature Tags - matches image */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                  {[
                    { icon: <CheckCircleIcon />, label: "Verified PGs" },
                    { icon: <ShieldOutlined />, label: "Safe & Secure" },
                    { icon: <FavoriteIcon />, label: "Loved by Students" },
                  ].map((feature, idx) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.1 }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 14px",
                        borderRadius: "999px",
                        background: alpha(BRAND.accent, 0.08),
                        border: `1px solid ${alpha(BRAND.accent, 0.15)}`,
                      }}
                    >
                      <Box sx={{ color: BRAND.accent, display: "flex", fontSize: 14 }}>
                        {feature.icon}
                      </Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 500, color: BRAND.text }}>
                        {feature.label}
                      </Typography>
                    </motion.div>
                  ))}
                </Box>

                {/* Step indicator - matches image */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: BRAND.textDim,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    STEP {step} OF 2
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.8 }}>
                    {[1, 2].map((s) => (
                      <Box
                        key={s}
                        sx={{
                          width: s === step ? 32 : 20,
                          height: 4,
                          borderRadius: 2,
                          bgcolor: s <= step ? BRAND.accent : alpha(BRAND.text, 0.12),
                          transition: "all 0.4s ease",
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Box>
          )}

          {/* ===== RIGHT — Auth Card ===== */}
          <Box sx={{
            display: "grid",
            placeItems: "center",
            width: "100%",
          }}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", maxWidth: 440 }}
            >
              <Box
                sx={{
                  position: "relative",
                  borderRadius: "24px",
                  p: { xs: 3, sm: 4 },
                  background: `linear-gradient(180deg, ${alpha("#ffffff", 0.04)} 0%, ${alpha("#ffffff", 0.01)} 100%)`,
                  border: `1px solid ${BRAND.border}`,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: `
                    inset 0 1px 0 ${alpha("#ffffff", 0.06)},
                    0 30px 80px -20px ${alpha("#000", 0.6)}
                  `,
                  overflow: "hidden",
                }}
              >
                {/* Glow border */}
                <Box sx={{
                  position: "absolute",
                  inset: -1,
                  borderRadius: "24px",
                  padding: "1px",
                  background: `linear-gradient(140deg, ${alpha(BRAND.accent, 0.3)} 0%, transparent 40%, transparent 60%, ${alpha(BRAND.accent3, 0.2)} 100%)`,
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                }} />

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.35 }}
                    >
                      {/* Mobile title - matches image */}
                      {isMobile && (
                        <>
                          <Typography sx={{
                            fontSize: 24,
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            mb: 0.5,
                          }}>
                            Find your perfect PG
                          </Typography>
                          <Typography sx={{
                            color: BRAND.textDim,
                            fontSize: 14,
                            mb: 3,
                          }}>
                            Comfortable stays. Verified owners.
                          </Typography>
                        </>
                      )}

                      <Typography sx={{
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        mb: 0.5,
                      }}>
                        Enter your mobile number
                      </Typography>
                      <Typography sx={{
                        color: BRAND.textDim,
                        fontSize: 14,
                        mb: 3,
                      }}>
                        We'll send a one-time code via SMS
                      </Typography>

                      {/* Phone Input - matches image */}
                      <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        border: `1px solid ${error ? BRAND.danger : BRAND.border}`,
                        borderRadius: "12px",
                        bgcolor: alpha("#fff", 0.02),
                        transition: "all 0.2s ease",
                        mb: error ? 1.5 : 3,
                        "&:focus-within": {
                          borderColor: BRAND.accent,
                          boxShadow: `0 0 0 3px ${alpha(BRAND.accent, 0.1)}`,
                        },
                      }}>
                        <Box sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1.5,
                          py: 1.5,
                          borderRight: `1px solid ${BRAND.border}`,
                          color: BRAND.textDim,
                          fontSize: 14,
                          fontWeight: 500,
                        }}>
                          <span style={{ fontSize: 18 }}>🇮🇳</span>
                          <span style={{ fontFamily: "'Geist Mono', monospace" }}>+91</span>
                          <span style={{ color: BRAND.textDim, fontSize: 12 }}>▼</span>
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
                            padding: "14px 16px",
                            fontFamily: "'Geist', sans-serif",
                          }}
                        />
                      </Box>

                      {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

                      {/* Continue Button - matches image */}
                      <PremiumButton
                        onClick={sendOtp}
                        disabled={loading || phone.replace(/\D/g, "").length !== 10}
                        loading={loading}
                      >
                        Continue
                        <SendIcon sx={{ fontSize: 18 }} />
                      </PremiumButton>

                      {/* Privacy note - matches image */}
                      <Typography sx={{
                        mt: 3,
                        color: BRAND.textDim,
                        fontSize: 12,
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.8,
                      }}>
                        <LockOutlined sx={{ fontSize: 14 }} />
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
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        mb: 0.5,
                      }}>
                        Enter verification code
                      </Typography>
                      <Typography sx={{
                        color: BRAND.textDim,
                        fontSize: 14,
                        mb: 3,
                      }}>
                        We sent a 6-digit code to{" "}
                        <span style={{ color: BRAND.text, fontWeight: 500 }}>
                          +91 {phone}
                        </span>
                      </Typography>

                      {/* OTP Input */}
                      <Box
                        onPaste={handleOtpPaste}
                        sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1, mb: 3 }}
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
                              aspectRatio: "1 / 1.2",
                              borderRadius: "12px",
                              border: `1px solid ${otp[i] ? alpha(BRAND.accent, 0.5) : BRAND.border}`,
                              background: otp[i] ? alpha(BRAND.accent, 0.06) : alpha("#fff", 0.02),
                              color: BRAND.text,
                              fontSize: 24,
                              fontWeight: 600,
                              textAlign: "center",
                              fontFamily: "'Geist Mono', monospace",
                              outline: "none",
                              transition: "all 0.2s ease",
                              boxShadow: otp[i] ? `0 0 0 3px ${alpha(BRAND.accent, 0.1)}` : "none",
                            }}
                            onFocus={(e) => e.target.style.borderColor = BRAND.accent}
                            onBlur={(e) => e.target.style.borderColor = otp[i] ? alpha(BRAND.accent, 0.5) : BRAND.border}
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
                        mt: 3,
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

              <div id="recaptcha-container" style={{ display: "flex", justifyContent: "center", marginTop: 16 }} />
            </motion.div>
          </Box>
        </Box>
      </Box>
    </>
  );
};

/* ============ Components ============ */

const PremiumButton = ({ onClick, disabled, loading, children }) => (
  <motion.button
    whileHover={!disabled ? { y: -2, scale: 1.01 } : {}}
    whileTap={!disabled ? { scale: 0.98 } : {}}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: "100%",
      border: "none",
      borderRadius: "12px",
      padding: "14px 20px",
      background: disabled
        ? alpha(BRAND.text, 0.08)
        : `linear-gradient(135deg, ${BRAND.accent} 0%, #4CAF50 100%)`,
      color: disabled ? BRAND.textDim : BRAND.bg,
      fontSize: 16,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      boxShadow: disabled
        ? "none"
        : `0 8px 30px -8px ${alpha(BRAND.accent, 0.5)}`,
      transition: "all 0.2s ease",
      fontFamily: "inherit",
    }}
  >
    {loading ? (
      <CircularProgress size={20} sx={{ color: BRAND.bg }} />
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
      borderRadius: 10,
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
      filter: blur(80px);
      opacity: 0.4;
      pointer-events: none;
      z-index: 1;
    }
    .aurora-1 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, ${BRAND.accent} 0%, transparent 60%);
      top: -150px;
      left: -100px;
      animation: drift1 14s ease-in-out infinite;
    }
    .aurora-2 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, ${BRAND.accent3} 0%, transparent 60%);
      bottom: -120px;
      right: -80px;
      animation: drift2 16s ease-in-out infinite;
    }
    .aurora-3 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, #4CAF50 0%, transparent 60%);
      top: 30%;
      left: 40%;
      opacity: 0.15;
      animation: drift3 20s ease-in-out infinite;
    }
    @keyframes drift1 {
      0%,100% { transform: translate(0,0) scale(1); }
      50% { transform: translate(30px, 50px) scale(1.1); }
    }
    @keyframes drift2 {
      0%,100% { transform: translate(0,0) scale(1); }
      50% { transform: translate(-50px, -30px) scale(1.15); }
    }
    @keyframes drift3 {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(-20px, 40px); }
    }
    .grain {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      opacity: 0.04;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    }
  `}</style>
);

export default PhoneLogin;