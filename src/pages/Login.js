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

// ── Put the image file at: src/assets/pg-walk.png  (copy the image there)
import pgWalkImg from "../assets/pg-walk.png";

import { auth, requestNotificationPermission } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { userAPI } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
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

// ─── Hero illustration ────────────────────────────────────────────────────────
// Displays the static 3D illustration (man + trolley + PG building) exactly as
// shown in the reference design. The image fills the full card width with a
// dark-to-transparent fade at the bottom so it blends into the card surface.
const HeroIllustration = () => (
  <Box
    sx={{
      position: "relative",
      width: "calc(100% + 60px)",   // bleed past card padding on both sides
      ml: "-30px",
      mt: "-32px",
      mb: 0,
      height: { xs: 200, sm: 230 },
      overflow: "hidden",
      borderRadius: "24px 24px 0 0",
      flexShrink: 0,
    }}
  >
    {/* Actual illustration */}
    <Box
      component="img"
      src={pgWalkImg}
      alt="Person walking with trolley bag toward a PG house"
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 20%",
        display: "block",
      }}
    />

    {/* Bottom fade — blends the illustration into the card background */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(
          to bottom,
          transparent 0%,
          transparent 45%,
          rgba(10,11,16,0.55) 72%,
          rgba(10,11,16,0.97) 100%
        )`,
        pointerEvents: "none",
      }}
    />

    {/* Left-side ambient green bleed matching the reference */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(
          ellipse 55% 80% at 15% 60%,
          rgba(124,255,178,0.10) 0%,
          transparent 100%
        )`,
        pointerEvents: "none",
      }}
    />
  </Box>
);

// ─── Phone input ──────────────────────────────────────────────────────────────
const PhoneField = ({ phone, setPhone, onEnter }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      border: `1px solid ${B.border}`,
      borderRadius: "14px",
      bgcolor: "rgba(255,255,255,0.035)",
      transition: "border-color .2s, box-shadow .2s",
      mb: 2,
      "&:focus-within": {
        borderColor: "rgba(124,255,178,0.55)",
        boxShadow: "0 0 0 3px rgba(124,255,178,0.10)",
        bgcolor: "rgba(124,255,178,0.03)",
      },
    }}
  >
    {/* Country code block */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        px: 1.8,
        py: 1.7,
        borderRight: `1px solid ${B.border}`,
        color: B.text,
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "'Geist Mono','Fira Mono',monospace",
        whiteSpace: "nowrap",
        flexShrink: 0,
        userSelect: "none",
        cursor: "default",
      }}
    >
      <span style={{ fontSize: 16 }}>🇮🇳</span>
      <span style={{ color: B.text }}>+91</span>
      {/* Chevron */}
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: 2 }}>
        <path d="M1 1L5 5L9 1" stroke={B.textDim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Box>
    <input
      value={phone}
      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      maxLength={10}
      placeholder="Enter mobile number"
      autoFocus
      inputMode="numeric"
      style={{
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        color: B.text,
        fontSize: 15,
        padding: "14px 16px",
        fontFamily: "'Geist Mono','Fira Mono',monospace",
        letterSpacing: "0.04em",
      }}
    />
  </Box>
);

// ─── CTA button ───────────────────────────────────────────────────────────────
const PrimaryBtn = ({ onClick, disabled, loading, children }) => (
  <motion.button
    whileHover={!disabled ? { y: -1.5 } : {}}
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
      color: disabled ? B.textDim : "#0A0B10",
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
    {loading ? <CircularProgress size={18} sx={{ color: "#0A0B10" }} /> : children}
  </motion.button>
);

// ─── Error banner ─────────────────────────────────────────────────────────────
const ErrorBanner = ({ msg, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0, x: [0, -5, 5, -3, 3, 0] }}
    transition={{ x: { duration: 0.38 } }}
    style={{
      marginBottom: 12,
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
        background: "transparent", border: "none",
        color: B.danger, cursor: "pointer",
        fontSize: 18, lineHeight: 1, padding: 0, marginLeft: 8,
      }}
    >×</button>
  </motion.div>
);

// ─── Global styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

    .aurora {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
    }
    .aurora-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #7CFFB2 0%, transparent 65%);
      top: -220px; left: -180px;
      opacity: 0.14;
      animation: drift1 16s ease-in-out infinite;
    }
    .aurora-2 {
      width: 440px; height: 440px;
      background: radial-gradient(circle, #7CA8FF 0%, transparent 65%);
      bottom: -200px; right: -140px;
      opacity: 0.10;
      animation: drift2 20s ease-in-out infinite;
    }
    @keyframes drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(35px,55px)} }
    @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-45px,-35px)} }

    .grain {
      position: absolute; inset: 0; z-index: 0; pointer-events: none;
      opacity: 0.05;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    }
  `}</style>
);

// ─── Main component ───────────────────────────────────────────────────────────
const PhoneLogin = () => {
  const { user, loading: authLoading, login } = useAuth();

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

  // ── Auth redirect check ──
  useEffect(() => {
    if (authLoading || redirectInProgress.current || registrationComplete || isRedirecting) return;
    if (initialCheckDone.current) return;
    const storedToken = localStorage.getItem("token");
    const storedUser  = localStorage.getItem("user");
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

  // ── Helpers ──
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
    if (role === "admin")       navigate("/admin/dashboard");
    else if (role === "owner")  navigate("/owner/dashboard");
    else                        navigate("/");
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
      if      (err.code === "auth/invalid-phone-number")   setError("Invalid phone number format");
      else if (err.code === "auth/too-many-requests")       setError("Too many attempts. Try later");
      else if (err.code === "auth/network-request-failed")  setError("Network error");
      else                                                   setError("Failed to send OTP. Please try again");
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
            { headers: { Authorization: `Bearer ${checkResponse.data.token}` } });
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

  // ── OTP handlers ──
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

  // ── Guards ──
  if (authLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: B.bg }}>
        <CircularProgress sx={{ color: B.accent }} />
      </Box>
    );
  }
  if (isRedirecting || registrationComplete) return null;

  // ── Render ────────────────────────────────────────────────────────────────
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
            bgcolor: B.surfaceHi, color: B.text,
            border: "1px solid rgba(124,255,178,0.3)",
            "& .MuiAlert-icon": { color: B.accent },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* ── Page shell ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          minHeight: "100vh", width: "100%",
          bgcolor: B.bg, color: B.text,
          position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: `'Geist','Inter',system-ui,sans-serif`,
        }}
      >
        <Box className="aurora aurora-1" />
        <Box className="aurora aurora-2" />
        <Box className="grain" />

        {/* ── Auth card ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "relative", zIndex: 2,
            width: "100%", maxWidth: 460,
            margin: "24px 16px",
          }}
        >
          <Box
            sx={{
              borderRadius: "24px",
              overflow: "hidden",
              background: "linear-gradient(180deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.016) 100%)",
              border: `1px solid ${B.border}`,
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow: `
                inset 0 1px 0 rgba(255,255,255,0.07),
                0 40px 100px -24px rgba(0,0,0,0.7)
              `,
              position: "relative",
            }}
          >
            {/* Gradient halo border */}
            <Box
              sx={{
                position: "absolute", inset: -1, borderRadius: "24px", padding: "1px",
                background: "linear-gradient(140deg,rgba(124,255,178,0.35) 0%,transparent 40%,transparent 65%,rgba(124,168,255,0.22) 100%)",
                WebkitMask: "linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor", maskComposite: "exclude",
                pointerEvents: "none", zIndex: 10,
              }}
            />

            {/* ── Hero illustration ── */}
            <HeroIllustration />

            {/* ── Card body ── */}
            <Box sx={{ px: { xs: "22px", sm: "30px" }, pb: { xs: "24px", sm: "30px" }, pt: "20px" }}>

              {/* Step indicator */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Box
                  sx={{
                    display: "inline-flex", alignItems: "center", gap: 0.8,
                    px: 1.4, py: 0.6, borderRadius: "999px",
                    bgcolor: "rgba(124,255,178,0.10)",
                    border: "1px solid rgba(124,255,178,0.22)",
                  }}
                >
                  <Box
                    sx={{
                      width: 6, height: 6, borderRadius: "50%",
                      bgcolor: B.accent,
                      boxShadow: `0 0 8px ${B.accent}`,
                    }}
                  />
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: B.accent, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Step {step} of 2
                  </Typography>
                </Box>

                {/* Progress rail */}
                <Box sx={{ display: "flex", gap: 0.7 }}>
                  {[1, 2].map((s) => (
                    <Box
                      key={s}
                      sx={{
                        width: s === step ? 28 : 16, height: 4, borderRadius: 2,
                        bgcolor: s <= step ? B.accent : "rgba(237,238,242,0.12)",
                        boxShadow: s === step ? "0 0 10px rgba(124,255,178,0.55)" : "none",
                        transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* ── Step content ── */}
              <AnimatePresence mode="wait">

                {/* Step 1 — phone */}
                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 18 }}
                    transition={{ duration: 0.30 }}
                  >
                    <Typography sx={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", mb: 0.6 }}>
                      Enter your number
                    </Typography>
                    <Typography sx={{ color: B.textDim, fontSize: 14, mb: 2.5, lineHeight: 1.55 }}>
                      We'll send a one-time code via SMS.
                    </Typography>

                    <PhoneField
                      phone={phone}
                      setPhone={setPhone}
                      onEnter={phone.replace(/\D/g, "").length === 10 ? sendOtp : undefined}
                    />

                    {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

                    <PrimaryBtn
                      onClick={sendOtp}
                      disabled={loading || phone.replace(/\D/g, "").length !== 10}
                      loading={loading}
                    >
                      Continue
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 2 }}>
                        <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </PrimaryBtn>

                    {/* Secure & private */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, mt: 2.5 }}>
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                        <path d="M6 0L12 2.8V6.5C12 9.97 9.33 13.22 6 14C2.67 13.22 0 9.97 0 6.5V2.8L6 0Z"
                          fill="rgba(124,255,178,0.15)" stroke="rgba(124,255,178,0.4)" strokeWidth="0.8"/>
                        <path d="M3.5 7L5.2 8.8L8.5 5.5" stroke="#7CFFB2" strokeWidth="1.3"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <Typography sx={{ color: B.textDim, fontSize: 12 }}>Secure &amp; private</Typography>
                    </Box>
                  </motion.div>
                )}

                {/* Step 2 — OTP */}
                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.30 }}
                  >
                    <Typography sx={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", mb: 0.6 }}>
                      Enter OTP
                    </Typography>
                    <Typography sx={{ color: B.textDim, fontSize: 14, mb: 2.5, lineHeight: 1.55 }}>
                      Code sent to{" "}
                      <span style={{ color: B.text, fontWeight: 600, fontFamily: "'Geist Mono','Fira Mono',monospace" }}>
                        +91 {phone}
                      </span>
                    </Typography>

                    {/* OTP boxes */}
                    <Box
                      onPaste={handleOtpPaste}
                      sx={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: { xs: "8px", sm: "10px" }, mb: 2.5 }}
                    >
                      {[0,1,2,3,4,5].map((i) => (
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
                            width: "100%", aspectRatio: "1 / 1.15",
                            borderRadius: "12px",
                            border: `1px solid ${otp[i] ? "rgba(124,255,178,0.5)" : B.border}`,
                            background: otp[i] ? "rgba(124,255,178,0.06)" : "rgba(255,255,255,0.025)",
                            color: B.text, fontSize: 22, fontWeight: 600,
                            textAlign: "center",
                            fontFamily: "'Geist Mono','Fira Mono',monospace",
                            outline: "none", transition: "all .18s ease",
                            boxShadow: otp[i] ? "0 0 0 3px rgba(124,255,178,0.12)" : "none",
                            caretColor: B.accent,
                          }}
                          onFocus={(e) => (e.target.style.borderColor = B.accent)}
                          onBlur={(e) => (e.target.style.borderColor = otp[i] ? "rgba(124,255,178,0.5)" : B.border)}
                        />
                      ))}
                    </Box>

                    {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

                    <PrimaryBtn
                      onClick={verifyOtp}
                      disabled={loading || otp.length !== 6}
                      loading={loading}
                    >
                      <VerifiedUserIcon sx={{ fontSize: 17 }} />
                      Verify &amp; continue
                    </PrimaryBtn>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2.5 }}>
                      <Button
                        onClick={backToPhone}
                        startIcon={<ArrowBackRounded sx={{ fontSize: 15 }} />}
                        sx={{ color: B.textDim, textTransform: "none", fontSize: 13, p: 0, minWidth: 0, "&:hover": { color: B.text, bgcolor: "transparent" } }}
                      >
                        Change number
                      </Button>

                      {otpTimer > 0 ? (
                        <Typography sx={{ color: B.textDim, fontSize: 13, fontFamily: "'Geist Mono','Fira Mono',monospace" }}>
                          Resend in <span style={{ color: B.text }}>{otpTimer}s</span>
                        </Typography>
                      ) : (
                        <Button
                          onClick={resendOtp}
                          disabled={isResending}
                          sx={{ color: B.accent, textTransform: "none", fontSize: 13, fontWeight: 600, p: 0, minWidth: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
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
                sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${B.border}`, color: B.textDim, fontSize: 11.5, textAlign: "center", lineHeight: 1.7 }}
              >
                By continuing you agree to our{" "}
                <a href="/terms" target="_blank" rel="noreferrer"
                  style={{ color: B.text, textDecoration: "none", borderBottom: `1px dashed ${B.textDim}` }}>Terms</a>
                {" "}&amp;{" "}
                <a href="/privacy-policy" target="_blank" rel="noreferrer"
                  style={{ color: B.text, textDecoration: "none", borderBottom: `1px dashed ${B.textDim}` }}>Privacy</a>.
              </Typography>
            </Box>
          </Box>

          <div id="recaptcha-container" style={{ display: "flex", justifyContent: "center", marginTop: 14 }} />
        </motion.div>
      </Box>
    </>
  );
};

export default PhoneLogin;