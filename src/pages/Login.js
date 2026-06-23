
import React, { useState, useEffect, useRef } from "react";
import {
  Box, Button, Typography, CircularProgress, Alert,
  InputAdornment, alpha, useTheme, useMediaQuery,
  Snackbar, Backdrop
} from "@mui/material";
import {
  Smartphone as SmartphoneIcon,
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  ShieldOutlined,
  BoltOutlined,
  AutoAwesomeOutlined,
  ArrowBackRounded,
  LockOutlined,
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
  accent: "#7CFFB2",      // mint neon
  accent2: "#FF7A59",     // coral
  accent3: "#7CA8FF",     // ice blue
  danger: "#FF5A6E",
};

const PhoneLogin = () => {
  const { user, loading: authLoading, login } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery("(min-width:900px)");

  // ===== Original state (unchanged) =====
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

  // ===== All your effects (unchanged) =====
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

  // ===== OTP digit-box handlers =====
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
          minHeight: "100vh", width: "100%",
          bgcolor: BRAND.bg, color: BRAND.text,
          position: "relative", overflow: "hidden",
          fontFamily: `'Geist', 'Inter', system-ui, sans-serif`,
        }}
      >
        {/* Aurora blobs */}
        <Box className="aurora aurora-1" />
        <Box className="aurora aurora-2" />
        <Box className="aurora aurora-3" />
        {/* Grain overlay */}
        <Box className="grain" />

        <Box
          sx={{
            position: "relative", zIndex: 2,
            minHeight: "100vh",
            display: "grid",
            gridTemplateColumns: isDesktop ? "1.1fr 1fr" : "1fr",
            alignItems: "center",
          }}
        >
          {/* ===== LEFT — Brand panel ===== */}
          {isDesktop && (
            <Box sx={{ p: { md: 8, lg: 10 }, maxWidth: 640 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 6 }}>
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: "10px",
                      background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accent3})`,
                      display: "grid", placeItems: "center",
                      boxShadow: `0 0 24px ${alpha(BRAND.accent, 0.4)}`,
                    }}
                  >
                    <BoltOutlined sx={{ color: BRAND.bg, fontSize: 20 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: 18 }}>
                    yourbrand<span style={{ color: BRAND.accent }}>.</span>
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: { md: 56, lg: 68 },
                    lineHeight: 1.02,
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    mb: 3,
                  }}
                >
                  Sign in
                  <br />
                  <span style={{
                    background: `linear-gradient(90deg, ${BRAND.accent} 0%, ${BRAND.accent3} 60%, ${BRAND.accent2} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    in seconds.
                  </span>
                </Typography>

                <Typography sx={{ color: BRAND.textDim, fontSize: 17, maxWidth: 440, mb: 6, lineHeight: 1.6 }}>
                  One number. One tap. Zero friction. We use secure mobile verification — no passwords to remember, no inboxes to check.
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {[
                    { icon: <ShieldOutlined />, t: "End-to-end secured", d: "Firebase phone auth · 6-digit OTP" },
                    { icon: <BoltOutlined />, t: "Built for speed", d: "Average sign-in under 12 seconds" },
                    { icon: <AutoAwesomeOutlined />, t: "Trusted by thousands", d: "99.98% verification success rate" },
                  ].map((f, i) => (
                    <motion.div
                      key={f.t}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                      style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
                    >
                      <Box sx={{
                        width: 38, height: 38, borderRadius: "10px",
                        bgcolor: alpha(BRAND.accent, 0.08),
                        border: `1px solid ${alpha(BRAND.accent, 0.2)}`,
                        display: "grid", placeItems: "center", flexShrink: 0,
                        color: BRAND.accent,
                      }}>
                        {f.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.3 }}>{f.t}</Typography>
                        <Typography sx={{ color: BRAND.textDim, fontSize: 13.5 }}>{f.d}</Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </motion.div>
            </Box>
          )}

          {/* ===== RIGHT — Auth card ===== */}
          <Box sx={{
            display: "grid", placeItems: "center",
            p: { xs: 3, sm: 4, md: 6 },
            minHeight: isDesktop ? "auto" : "100vh",
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
                  p: { xs: 3, sm: 4.5 },
                  background: `linear-gradient(180deg, ${alpha("#ffffff", 0.04)} 0%, ${alpha("#ffffff", 0.015)} 100%)`,
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
                {/* Gradient halo */}
                <Box sx={{
                  position: "absolute", inset: -1, borderRadius: "24px",
                  padding: "1px",
                  background: `linear-gradient(140deg, ${alpha(BRAND.accent, 0.4)} 0%, transparent 40%, transparent 60%, ${alpha(BRAND.accent3, 0.3)} 100%)`,
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                }} />

                {/* Step pill */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
                  <Box sx={{
                    display: "inline-flex", alignItems: "center", gap: 1,
                    px: 1.5, py: 0.6, borderRadius: "999px",
                    bgcolor: alpha(BRAND.accent, 0.1),
                    border: `1px solid ${alpha(BRAND.accent, 0.25)}`,
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: BRAND.accent, boxShadow: `0 0 8px ${BRAND.accent}` }} />
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: BRAND.accent, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Step {step} of 2
                    </Typography>
                  </Box>

                  {/* Step rail */}
                  <Box sx={{ display: "flex", gap: 0.6 }}>
                    {[1, 2].map((s) => (
                      <Box key={s} sx={{
                        width: s === step ? 28 : 18,
                        height: 4, borderRadius: 2,
                        bgcolor: s <= step ? BRAND.accent : alpha(BRAND.text, 0.12),
                        boxShadow: s === step ? `0 0 10px ${alpha(BRAND.accent, 0.6)}` : "none",
                        transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                      }} />
                    ))}
                  </Box>
                </Box>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.35 }}
                    >
                      <Typography sx={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", mb: 1 }}>
                        Enter your number
                      </Typography>
                      <Typography sx={{ color: BRAND.textDim, fontSize: 14.5, mb: 4 }}>
                        We'll send a verification code via SMS.
                      </Typography>

                      <PhoneField phone={phone} setPhone={setPhone} />

                      {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

                      <PremiumButton
                        onClick={sendOtp}
                        disabled={loading || phone.replace(/\D/g, "").length !== 10}
                        loading={loading}
                        icon={<SendIcon sx={{ fontSize: 18 }} />}
                      >
                        Continue
                      </PremiumButton>

                      <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
                        {[
                          { icon: <SecurityIcon sx={{ fontSize: 13 }} />, l: "Secure" },
                          { icon: <BoltOutlined sx={{ fontSize: 13 }} />, l: "Instant" },
                          { icon: <AutoAwesomeOutlined sx={{ fontSize: 13 }} />, l: "Trusted" },
                        ].map(c => (
                          <Box key={c.l} sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.6,
                            px: 1.2, py: 0.4, borderRadius: "999px",
                            border: `1px solid ${BRAND.border}`,
                            color: BRAND.textDim, fontSize: 11.5, fontWeight: 500,
                          }}>
                            {c.icon} {c.l}
                          </Box>
                        ))}
                      </Box>
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
                      <Typography sx={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", mb: 1 }}>
                        Verify code
                      </Typography>
                      <Typography sx={{ color: BRAND.textDim, fontSize: 14.5, mb: 4 }}>
                        We sent a 6-digit code to{" "}
                        <span style={{ color: BRAND.text, fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>
                          +91 {phone}
                        </span>
                      </Typography>

                      {/* OTP digit boxes */}
                      <Box
                        onPaste={handleOtpPaste}
                        sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1.2, mb: 3 }}
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
                              width: "100%", aspectRatio: "1 / 1.15",
                              borderRadius: "12px",
                              border: `1px solid ${otp[i] ? alpha(BRAND.accent, 0.5) : BRAND.border}`,
                              background: otp[i] ? alpha(BRAND.accent, 0.06) : alpha("#fff", 0.02),
                              color: BRAND.text,
                              fontSize: 22, fontWeight: 600,
                              textAlign: "center",
                              fontFamily: "'Geist Mono', monospace",
                              outline: "none",
                              transition: "all 0.2s ease",
                              boxShadow: otp[i] ? `0 0 0 3px ${alpha(BRAND.accent, 0.12)}` : "none",
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
                        icon={<VerifiedUserIcon sx={{ fontSize: 18 }} />}
                      >
                        Verify & continue
                      </PremiumButton>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
                        <Button
                          onClick={backToPhone}
                          startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
                          sx={{
                            color: BRAND.textDim, textTransform: "none", fontSize: 13.5,
                            "&:hover": { color: BRAND.text, bgcolor: "transparent" },
                          }}
                        >
                          Change number
                        </Button>

                        {otpTimer > 0 ? (
                          <Typography sx={{ color: BRAND.textDim, fontSize: 13, fontFamily: "'Geist Mono', monospace" }}>
                            Resend in <span style={{ color: BRAND.text }}>{otpTimer}s</span>
                          </Typography>
                        ) : (
                          <Button
                            onClick={resendOtp} disabled={isResending}
                            sx={{
                              color: BRAND.accent, textTransform: "none", fontSize: 13.5, fontWeight: 600,
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

                <Typography sx={{
                  mt: 4, pt: 3, borderTop: `1px solid ${BRAND.border}`,
                  color: BRAND.textDim, fontSize: 11.5, textAlign: "center", lineHeight: 1.7,
                }}>
                  By continuing you agree to our{" "}
                  <a href="/terms" target="_blank" rel="noreferrer" style={{ color: BRAND.text, textDecoration: "none", borderBottom: `1px dashed ${BRAND.textDim}` }}>Terms</a>
                  {" "}&{" "}
                  <a href="/privacy-policy" target="_blank" rel="noreferrer" style={{ color: BRAND.text, textDecoration: "none", borderBottom: `1px dashed ${BRAND.textDim}` }}>Privacy</a>.
                </Typography>
              </Box>

              <div id="recaptcha-container" style={{ display: "flex", justifyContent: "center", marginTop: 16 }} />
            </motion.div>
          </Box>
        </Box>
      </Box>
    </>
  );
};

/* ============ Subcomponents ============ */

const PhoneField = ({ phone, setPhone }) => (
  <Box sx={{
    display: "flex", alignItems: "center",
    border: `1px solid ${BRAND.border}`,
    borderRadius: "14px",
    bgcolor: alpha("#fff", 0.02),
    transition: "all 0.2s ease",
    mb: 3,
    "&:focus-within": {
      borderColor: BRAND.accent,
      boxShadow: `0 0 0 3px ${alpha(BRAND.accent, 0.12)}`,
      bgcolor: alpha(BRAND.accent, 0.03),
    },
  }}>
    <Box sx={{
      display: "flex", alignItems: "center", gap: 0.7,
      px: 2, py: 1.8, borderRight: `1px solid ${BRAND.border}`,
      color: BRAND.textDim, fontSize: 14, fontWeight: 500,
      fontFamily: "'Geist Mono', monospace",
    }}>
      🇮🇳 +91
    </Box>
    <input
      value={phone}
      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
      maxLength={10}
      placeholder="98765 43210"
      autoFocus
      style={{
        flex: 1, background: "transparent", border: "none", outline: "none",
        color: BRAND.text, fontSize: 16, padding: "14px 16px",
        fontFamily: "'Geist Mono', monospace", letterSpacing: "0.04em",
      }}
    />
  </Box>
);

const PremiumButton = ({ onClick, disabled, loading, icon, children }) => (
  <motion.button
    whileHover={!disabled ? { y: -2 } : {}}
    whileTap={!disabled ? { scale: 0.985 } : {}}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: "100%",
      border: "none",
      borderRadius: "14px",
      padding: "16px 20px",
      background: disabled
        ? alpha(BRAND.text, 0.08)
        : `linear-gradient(180deg, ${BRAND.accent} 0%, #5BE69A 100%)`,
      color: disabled ? BRAND.textDim : BRAND.bg,
      fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      boxShadow: disabled ? "none" : `0 10px 30px -10px ${alpha(BRAND.accent, 0.6)}, inset 0 1px 0 ${alpha("#fff", 0.3)}`,
      transition: "background 0.2s",
      fontFamily: "inherit",
    }}
  >
    {loading ? <CircularProgress size={18} sx={{ color: BRAND.bg }} /> : (
      <>
        {children}
        {icon}
      </>
    )}
  </motion.button>
);

const ErrorBanner = ({ msg, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
    transition={{ x: { duration: 0.4 } }}
    style={{
      marginBottom: 16, padding: "12px 14px",
      borderRadius: 12,
      background: alpha(BRAND.danger, 0.08),
      border: `1px solid ${alpha(BRAND.danger, 0.3)}`,
      color: BRAND.danger,
      fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center",
    }}
  >
    <span>{msg}</span>
    <button onClick={onClose} style={{
      background: "transparent", border: "none", color: BRAND.danger,
      cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0,
    }}>×</button>
  </motion.div>
);

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

    .aurora {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.55;
      pointer-events: none;
      z-index: 1;
    }
    .aurora-1 {
      width: 520px; height: 520px;
      background: radial-gradient(circle, ${BRAND.accent} 0%, transparent 60%);
      top: -160px; left: -120px;
      animation: drift1 14s ease-in-out infinite;
    }
    .aurora-2 {
      width: 460px; height: 460px;
      background: radial-gradient(circle, ${BRAND.accent3} 0%, transparent 60%);
      bottom: -160px; right: -100px;
      animation: drift2 16s ease-in-out infinite;
    }
    .aurora-3 {
      width: 380px; height: 380px;
      background: radial-gradient(circle, ${BRAND.accent2} 0%, transparent 60%);
      top: 40%; left: 35%;
      opacity: 0.25;
      animation: drift3 20s ease-in-out infinite;
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
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      opacity: 0.06;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    }
  `}</style>
);

export default PhoneLogin;
