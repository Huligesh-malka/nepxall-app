import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Backdrop,
} from "@mui/material";
import {
  ArrowBackRounded,
  VerifiedUser as VerifiedUserIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import { auth, requestNotificationPermission } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const B = {
  bg:        "#0A0B10",
  surface:   "#13141B",
  surfaceHi: "#1B1D27",
  border:    "rgba(255,255,255,0.08)",
  text:      "#EDEEF2",
  textDim:   "#8A8FA3",
  accent:    "#7CFFB2",
  accent2:   "#FF7A59",
  accent3:   "#7CA8FF",
  danger:    "#FF5A6E",
};

// ─── Walking SVG animation ───────────────────────────────────────────────────
const WalkingScene = () => (
  <>
    <style>{`
      @keyframes walkAcross {
        0%   { left: 0px; }
        68%  { left: calc(100% - 72px); }
        76%  { left: calc(100% - 72px); }
        100% { left: 0px; }
      }
      @keyframes legL  { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
      @keyframes legR  { 0%,100%{transform:rotate(22deg)}  50%{transform:rotate(-22deg)} }
      @keyframes armL  { 0%,100%{transform:rotate(18deg)}  50%{transform:rotate(-18deg)} }
      @keyframes armR  { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)} }
      @keyframes winBlink { 0%,100%{opacity:.5} 50%{opacity:1} }

      .walker-root {
        position: absolute;
        bottom: 18px;
        left: 0;
        width: 34px;
        height: 56px;
        animation: walkAcross 3.8s cubic-bezier(0.4,0,0.6,1) infinite;
      }
      .w-leg-l  { transform-origin: 8px 34px; animation: legL 0.46s linear infinite; }
      .w-leg-r  { transform-origin: 8px 34px; animation: legR 0.46s linear infinite; }
      .w-arm-l  { transform-origin: 8px 20px; animation: armL 0.46s linear infinite; }
      .w-arm-r  { transform-origin: 8px 20px; animation: armR 0.46s linear infinite; }
      .w-win    { animation: winBlink 2.8s ease-in-out infinite; }
      .w-win-2  { animation: winBlink 2.8s ease-in-out 1.4s infinite; }

      @media (prefers-reduced-motion: reduce) {
        .walker-root, .w-leg-l, .w-leg-r, .w-arm-l, .w-arm-r { animation: none; }
      }
    `}</style>

    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 100,
        mb: 3,
        overflow: "hidden",
      }}
    >
      {/* Road */}
      <Box
        sx={{
          position: "absolute",
          bottom: 18,
          left: 0,
          right: 0,
          height: "1.5px",
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(124,255,178,0.15) 15%,
            rgba(124,255,178,0.2) 85%,
            transparent 100%)`,
        }}
      />

      {/* PG building */}
      <Box
        sx={{
          position: "absolute",
          right: 10,
          bottom: 19,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Roof */}
        <Box
          sx={{
            width: 0,
            height: 0,
            borderLeft: "22px solid transparent",
            borderRight: "22px solid transparent",
            borderBottom: `14px solid rgba(124,255,178,0.22)`,
          }}
        />
        {/* Body */}
        <Box
          sx={{
            width: 44,
            height: 40,
            background: "rgba(124,255,178,0.08)",
            border: "1.5px solid rgba(124,255,178,0.3)",
            borderRadius: "4px 4px 0 0",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pb: 0,
          }}
        >
          {/* Windows */}
          <Box
            sx={{
              position: "absolute",
              top: 7,
              display: "flex",
              gap: "6px",
            }}
          >
            <Box
              className="w-win"
              sx={{
                width: 8,
                height: 8,
                background: "rgba(255,200,80,0.6)",
                borderRadius: "1px",
              }}
            />
            <Box
              className="w-win-2"
              sx={{
                width: 8,
                height: 8,
                background: "rgba(255,200,80,0.6)",
                borderRadius: "1px",
              }}
            />
          </Box>
          {/* Door */}
          <Box
            sx={{
              width: 11,
              height: 15,
              background: "rgba(124,255,178,0.15)",
              border: "1px solid rgba(124,255,178,0.35)",
              borderRadius: "2px 2px 0 0",
            }}
          />
        </Box>
        {/* Label */}
        <Typography
          sx={{
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(124,255,178,0.55)",
            letterSpacing: "0.08em",
            mt: "2px",
          }}
        >
          PG
        </Typography>
      </Box>

      {/* Walker */}
      <div className="walker-root">
        <svg
          width="34"
          height="56"
          viewBox="0 0 34 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Head */}
          <circle cx="17" cy="7" r="5.5" fill="#7CFFB2" opacity="0.88" />
          {/* Body */}
          <rect
            x="13"
            y="14"
            width="8"
            height="16"
            rx="4"
            fill="#7CFFB2"
            opacity="0.7"
          />
          {/* Bag */}
          <rect
            x="21"
            y="15"
            width="6"
            height="8"
            rx="2"
            fill="rgba(124,255,178,0.28)"
            stroke="rgba(124,255,178,0.45)"
            strokeWidth="0.8"
          />
          {/* Left arm */}
          <rect
            className="w-arm-l"
            x="5"
            y="16"
            width="7"
            height="3"
            rx="1.5"
            fill="#7CFFB2"
            opacity="0.65"
            style={{ transformOrigin: "17px 20px" }}
          />
          {/* Right arm */}
          <rect
            className="w-arm-r"
            x="22"
            y="16"
            width="7"
            height="3"
            rx="1.5"
            fill="#7CFFB2"
            opacity="0.65"
            style={{ transformOrigin: "17px 20px" }}
          />
          {/* Left leg */}
          <rect
            className="w-leg-l"
            x="12"
            y="30"
            width="5"
            height="15"
            rx="2.5"
            fill="#7CFFB2"
            opacity="0.75"
            style={{ transformOrigin: "17px 34px" }}
          />
          {/* Right leg */}
          <rect
            className="w-leg-r"
            x="17"
            y="30"
            width="5"
            height="15"
            rx="2.5"
            fill="#7CFFB2"
            opacity="0.75"
            style={{ transformOrigin: "17px 34px" }}
          />
        </svg>
      </div>
    </Box>
  </>
);

// ─── Phone input field ────────────────────────────────────────────────────────
const PhoneField = ({ phone, setPhone, onEnter }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      border: `1px solid ${B.border}`,
      borderRadius: "14px",
      bgcolor: "rgba(255,255,255,0.025)",
      transition: "border-color .2s, box-shadow .2s",
      mb: 2.5,
      "&:focus-within": {
        borderColor: `rgba(124,255,178,0.55)`,
        boxShadow: `0 0 0 3px rgba(124,255,178,0.10)`,
      },
    }}
  >
    <Box
      sx={{
        px: 2,
        py: 1.75,
        borderRight: `1px solid ${B.border}`,
        color: B.textDim,
        fontSize: 14,
        fontFamily: "'Geist Mono','Fira Mono',monospace",
        whiteSpace: "nowrap",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      🇮🇳 +91
    </Box>
    <input
      value={phone}
      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      maxLength={10}
      placeholder="98765 43210"
      autoFocus
      inputMode="numeric"
      style={{
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        color: B.text,
        fontSize: 16,
        padding: "14px 16px",
        fontFamily: "'Geist Mono','Fira Mono',monospace",
        letterSpacing: "0.06em",
      }}
    />
  </Box>
);

// ─── CTA button ───────────────────────────────────────────────────────────────
const PrimaryBtn = ({ onClick, disabled, loading, children }) => (
  <motion.button
    whileHover={!disabled ? { y: -2 } : {}}
    whileTap={!disabled ? { scale: 0.983 } : {}}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: "100%",
      border: "none",
      borderRadius: "14px",
      padding: "16px 20px",
      background: disabled
        ? "rgba(255,255,255,0.07)"
        : "linear-gradient(180deg,#7CFFB2 0%,#5BE69A 100%)",
      color: disabled ? B.textDim : B.bg,
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: "-0.01em",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      boxShadow: disabled
        ? "none"
        : "0 10px 30px -10px rgba(124,255,178,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
      transition: "background .2s, box-shadow .2s",
      fontFamily: "inherit",
    }}
  >
    {loading ? (
      <CircularProgress size={18} sx={{ color: B.bg }} />
    ) : (
      children
    )}
  </motion.button>
);

// ─── Error banner ─────────────────────────────────────────────────────────────
const ErrorBanner = ({ msg, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0, x: [0, -5, 5, -3, 3, 0] }}
    transition={{ x: { duration: 0.38 } }}
    style={{
      marginBottom: 14,
      padding: "11px 13px",
      borderRadius: 10,
      background: "rgba(255,90,110,0.08)",
      border: "1px solid rgba(255,90,110,0.3)",
      color: B.danger,
      fontSize: 13.5,
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
        color: B.danger,
        cursor: "pointer",
        fontSize: 18,
        lineHeight: 1,
        padding: 0,
        marginLeft: 8,
      }}
    >
      ×
    </button>
  </motion.div>
);

// ─── Global styles (aurora + grain) ─────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

    .aurora {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      pointer-events: none;
      z-index: 0;
    }
    .aurora-1 {
      width: 480px; height: 480px;
      background: radial-gradient(circle, #7CFFB2 0%, transparent 65%);
      top: -200px; left: -160px;
      opacity: 0.18;
      animation: drift1 15s ease-in-out infinite;
    }
    .aurora-2 {
      width: 420px; height: 420px;
      background: radial-gradient(circle, #7CA8FF 0%, transparent 65%);
      bottom: -180px; right: -120px;
      opacity: 0.14;
      animation: drift2 18s ease-in-out infinite;
    }
    @keyframes drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,50px)} }
    @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,-30px)} }

    .grain {
      position: absolute; inset: 0; z-index: 0; pointer-events: none;
      opacity: 0.055;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    }
  `}</style>
);

// ─── Main component ──────────────────────────────────────────────────────────
const PhoneLogin = () => {
  const { user, loading: authLoading, login } = useAuth();

  // ── state (unchanged logic) ──
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

  // ── effects (unchanged) ──
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

  // ── helpers (unchanged) ──
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
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${cleanPhone}`,
        window.recaptchaVerifier,
      );
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
          await userAPI.post(
            "/notifications/save-fcm-token",
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${checkResponse.data.token}` } },
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

  // ── OTP box handlers (unchanged) ──
  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const arr = otp.padEnd(6, " ").split("");
    arr[idx] = digit || " ";
    const next = arr.join("").trimEnd();
    setOtp(next.replace(/\s/g, ""));
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("Text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setOtp(pasted);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  // ── loading / redirect guards ──
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: B.bg,
        }}
      >
        <CircularProgress sx={{ color: B.accent }} />
      </Box>
    );
  }
  if (isRedirecting || registrationComplete) return null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />

      <Backdrop sx={{ color: B.accent, zIndex: 9999 }} open={loading}>
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
            bgcolor: B.surfaceHi,
            color: B.text,
            border: `1px solid rgba(124,255,178,0.3)`,
            "& .MuiAlert-icon": { color: B.accent },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* ── Page shell ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          bgcolor: B.bg,
          color: B.text,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: `'Geist','Inter',system-ui,sans-serif`,
        }}
      >
        {/* Ambient blobs */}
        <Box className="aurora aurora-1" />
        <Box className="aurora aurora-2" />
        <Box className="grain" />

        {/* ── Auth card ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 420,
            margin: "0 16px",
          }}
        >
          <Box
            sx={{
              borderRadius: "24px",
              p: { xs: "28px 22px", sm: "36px 32px" },
              background:
                "linear-gradient(180deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.018) 100%)",
              border: `1px solid ${B.border}`,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: `
                inset 0 1px 0 rgba(255,255,255,0.065),
                0 32px 80px -20px rgba(0,0,0,0.65)
              `,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Gradient halo border */}
            <Box
              sx={{
                position: "absolute",
                inset: -1,
                borderRadius: "24px",
                padding: "1px",
                background:
                  "linear-gradient(140deg,rgba(124,255,178,0.38) 0%,transparent 40%,transparent 62%,rgba(124,168,255,0.28) 100%)",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none",
              }}
            />

            {/* ── Walking animation (always visible, both steps) ── */}
            <WalkingScene />

            {/* ── Step indicator ── */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.8,
                  px: 1.4,
                  py: 0.55,
                  borderRadius: "999px",
                  bgcolor: "rgba(124,255,178,0.1)",
                  border: "1px solid rgba(124,255,178,0.22)",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: B.accent,
                    boxShadow: `0 0 7px ${B.accent}`,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: B.accent,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Step {step} of 2
                </Typography>
              </Box>

              {/* Step rail */}
              <Box sx={{ display: "flex", gap: 0.7 }}>
                {[1, 2].map((s) => (
                  <Box
                    key={s}
                    sx={{
                      width: s === step ? 28 : 16,
                      height: 4,
                      borderRadius: 2,
                      bgcolor:
                        s <= step ? B.accent : "rgba(237,238,242,0.12)",
                      boxShadow:
                        s === step
                          ? `0 0 10px rgba(124,255,178,0.55)`
                          : "none",
                      transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* ── Step content ────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.32 }}
                >
                  <Typography
                    sx={{
                      fontSize: 26,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      mb: 0.75,
                    }}
                  >
                    Enter your number
                  </Typography>
                  <Typography
                    sx={{ color: B.textDim, fontSize: 14, mb: 3, lineHeight: 1.55 }}
                  >
                    We'll send a one-time code via SMS.
                  </Typography>

                  <PhoneField
                    phone={phone}
                    setPhone={setPhone}
                    onEnter={
                      phone.replace(/\D/g, "").length === 10 ? sendOtp : undefined
                    }
                  />

                  {error && (
                    <ErrorBanner msg={error} onClose={() => setError("")} />
                  )}

                  <PrimaryBtn
                    onClick={sendOtp}
                    disabled={
                      loading || phone.replace(/\D/g, "").length !== 10
                    }
                    loading={loading}
                  >
                    Continue
                    <SendIcon sx={{ fontSize: 16 }} />
                  </PrimaryBtn>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.32 }}
                >
                  <Typography
                    sx={{
                      fontSize: 26,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      mb: 0.75,
                    }}
                  >
                    Enter OTP
                  </Typography>
                  <Typography
                    sx={{ color: B.textDim, fontSize: 14, mb: 3, lineHeight: 1.55 }}
                  >
                    Code sent to{" "}
                    <span
                      style={{
                        color: B.text,
                        fontWeight: 600,
                        fontFamily: "'Geist Mono','Fira Mono',monospace",
                      }}
                    >
                      +91 {phone}
                    </span>
                  </Typography>

                  {/* OTP boxes */}
                  <Box
                    onPaste={handleOtpPaste}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6,1fr)",
                      gap: { xs: 1, sm: 1.4 },
                      mb: 2.5,
                    }}
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
                          borderRadius: "12px",
                          border: `1px solid ${
                            otp[i]
                              ? "rgba(124,255,178,0.48)"
                              : B.border
                          }`,
                          background: otp[i]
                            ? "rgba(124,255,178,0.055)"
                            : "rgba(255,255,255,0.02)",
                          color: B.text,
                          fontSize: 22,
                          fontWeight: 600,
                          textAlign: "center",
                          fontFamily: "'Geist Mono','Fira Mono',monospace",
                          outline: "none",
                          transition: "all .18s ease",
                          boxShadow: otp[i]
                            ? "0 0 0 3px rgba(124,255,178,0.11)"
                            : "none",
                          caretColor: B.accent,
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = B.accent)
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = otp[i]
                            ? "rgba(124,255,178,0.48)"
                            : B.border)
                        }
                      />
                    ))}
                  </Box>

                  {error && (
                    <ErrorBanner msg={error} onClose={() => setError("")} />
                  )}

                  <PrimaryBtn
                    onClick={verifyOtp}
                    disabled={loading || otp.length !== 6}
                    loading={loading}
                  >
                    <VerifiedUserIcon sx={{ fontSize: 17 }} />
                    Verify & continue
                  </PrimaryBtn>

                  {/* Bottom row */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 2.5,
                    }}
                  >
                    <Button
                      onClick={backToPhone}
                      startIcon={<ArrowBackRounded sx={{ fontSize: 15 }} />}
                      sx={{
                        color: B.textDim,
                        textTransform: "none",
                        fontSize: 13,
                        p: 0,
                        minWidth: 0,
                        "&:hover": { color: B.text, bgcolor: "transparent" },
                      }}
                    >
                      Change number
                    </Button>

                    {otpTimer > 0 ? (
                      <Typography
                        sx={{
                          color: B.textDim,
                          fontSize: 13,
                          fontFamily: "'Geist Mono','Fira Mono',monospace",
                        }}
                      >
                        Resend in{" "}
                        <span style={{ color: B.text }}>{otpTimer}s</span>
                      </Typography>
                    ) : (
                      <Button
                        onClick={resendOtp}
                        disabled={isResending}
                        sx={{
                          color: B.accent,
                          textTransform: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          p: 0,
                          minWidth: 0,
                          "&:hover": {
                            bgcolor: "transparent",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {isResending ? "Sending…" : "Resend code"}
                      </Button>
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms footer */}
            <Typography
              sx={{
                mt: 3.5,
                pt: 2.5,
                borderTop: `1px solid ${B.border}`,
                color: B.textDim,
                fontSize: 11.5,
                textAlign: "center",
                lineHeight: 1.7,
              }}
            >
              By continuing you agree to our{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: B.text,
                  textDecoration: "none",
                  borderBottom: `1px dashed ${B.textDim}`,
                }}
              >
                Terms
              </a>{" "}
              &{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: B.text,
                  textDecoration: "none",
                  borderBottom: `1px dashed ${B.textDim}`,
                }}
              >
                Privacy
              </a>
              .
            </Typography>
          </Box>

          {/* Recaptcha anchor */}
          <div
            id="recaptcha-container"
            style={{ display: "flex", justifyContent: "center", marginTop: 14 }}
          />
        </motion.div>
      </Box>
    </>
  );
};

export default PhoneLogin;