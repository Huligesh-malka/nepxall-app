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

// ─── Walking Scene ─────────────────────────────────────────────────────────────
const WalkingScene = () => (
  <>
    <style>{`
      /* Man walks left→right, pauses near PG, resets */
      @keyframes walkerMove {
        0%          { transform: translateX(0px); }
        65%         { transform: translateX(178px); }
        78%         { transform: translateX(178px); }
        79%         { transform: translateX(-10px); opacity:0; }
        80%         { transform: translateX(0px);   opacity:1; }
        100%        { transform: translateX(0px); }
      }

      /* Legs swing back and forth */
      @keyframes legFwd  { 0%,100%{transform:rotate(-28deg)} 50%{transform:rotate(28deg)} }
      @keyframes legBwd  { 0%,100%{transform:rotate(28deg)}  50%{transform:rotate(-28deg)} }

      /* Arms swing opposite to legs */
      @keyframes armFwd  { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
      @keyframes armBwd  { 0%,100%{transform:rotate(22deg)}  50%{transform:rotate(-22deg)} }

      /* Body slight bob */
      @keyframes bodyBob { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-1.5px)} }

      /* Trolley wheel spin */
      @keyframes wheelSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

      /* PG windows warm glow pulse */
      @keyframes warmGlow { 0%,100%{opacity:0.75} 50%{opacity:1} }

      /* Green PG sign flicker */
      @keyframes signFlicker { 0%,90%,100%{opacity:1} 95%{opacity:0.6} }

      /* Ground shadow */
      @keyframes shadowPulse { 0%,100%{transform:scaleX(1) translateX(0)} 65%{transform:scaleX(1) translateX(178px)} 79%{transform:scaleX(1) translateX(-10px); opacity:0} 80%{transform:scaleX(1) translateX(0); opacity:0.35} }

      .scene-walker      { animation: walkerMove 4.2s cubic-bezier(0.4,0,0.6,1) infinite; }
      .walker-body-group { animation: bodyBob 0.42s ease-in-out infinite; }
      .leg-left          { transform-origin: 50% 0%; animation: legFwd 0.42s ease-in-out infinite; }
      .leg-right         { transform-origin: 50% 0%; animation: legBwd 0.42s ease-in-out infinite; }
      .arm-left          { transform-origin: 50% 5%; animation: armBwd 0.42s ease-in-out infinite; }
      .arm-right         { transform-origin: 50% 5%; animation: armFwd 0.42s ease-in-out infinite; }
      .trolley-wheel     { transform-origin: 50% 50%; animation: wheelSpin 0.42s linear infinite; }
      .pg-window         { animation: warmGlow 2.5s ease-in-out infinite; }
      .pg-window-2       { animation: warmGlow 2.5s ease-in-out 1.2s infinite; }
      .pg-sign           { animation: signFlicker 4s ease-in-out infinite; }
      .walker-shadow     { animation: shadowPulse 4.2s cubic-bezier(0.4,0,0.6,1) infinite; opacity:0.35; }

      @media (prefers-reduced-motion: reduce) {
        .scene-walker,.walker-body-group,.leg-left,.leg-right,
        .arm-left,.arm-right,.trolley-wheel { animation: none !important; }
      }
    `}</style>

    <Box sx={{ position: "relative", width: "100%", height: 150, mb: 2, overflow: "hidden", userSelect: "none" }}>
      <svg
        width="100%"
        height="150"
        viewBox="0 0 370 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Ground glow gradient */}
          <radialGradient id="groundGlow" cx="50%" cy="100%" r="60%" fx="50%" fy="100%">
            <stop offset="0%" stopColor="#7CFFB2" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7CFFB2" stopOpacity="0" />
          </radialGradient>

          {/* PG house glow */}
          <radialGradient id="pgGlow" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#7CFFB2" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7CFFB2" stopOpacity="0" />
          </radialGradient>

          {/* Window warm light */}
          <radialGradient id="warmLight" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#FFD080" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF9A30" stopOpacity="0.6" />
          </radialGradient>

          {/* Door glow */}
          <radialGradient id="doorGlow" cx="50%" cy="60%" r="80%">
            <stop offset="0%" stopColor="#FFC060" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF8820" stopOpacity="0.3" />
          </radialGradient>

          {/* Hoodie gradient */}
          <linearGradient id="hoodieGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5DD89A" />
            <stop offset="100%" stopColor="#38A870" />
          </linearGradient>

          {/* Bag gradient */}
          <linearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4EC988" />
            <stop offset="100%" stopColor="#2E9660" />
          </linearGradient>

          {/* Trolley gradient */}
          <linearGradient id="trolleyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5DD89A" />
            <stop offset="100%" stopColor="#2E8A60" />
          </linearGradient>

          {/* PG building gradient */}
          <linearGradient id="pgBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A2E22" />
            <stop offset="100%" stopColor="#0E1A13" />
          </linearGradient>

          {/* PG roof gradient */}
          <linearGradient id="pgRoofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3428" />
            <stop offset="100%" stopColor="#142318" />
          </linearGradient>

          {/* Clip for leg left */}
          <clipPath id="legLClip">
            <rect x="-6" y="0" width="12" height="30" rx="4" />
          </clipPath>
          <clipPath id="legRClip">
            <rect x="-6" y="0" width="12" height="30" rx="4" />
          </clipPath>
        </defs>

        {/* ── Ground ─────────────────────────────────────────────────── */}
        <rect x="0" y="133" width="370" height="1.5" fill="rgba(124,255,178,0.13)" />
        <rect x="0" y="134" width="370" height="16" fill="url(#groundGlow)" />

        {/* ── PG Building ────────────────────────────────────────────── */}
        {/* BG glow behind PG */}
        <ellipse cx="305" cy="120" rx="55" ry="30" fill="url(#pgGlow)" />

        {/* Bushes */}
        <ellipse cx="260" cy="131" rx="10" ry="6" fill="#14291C" opacity="0.9" />
        <ellipse cx="350" cy="131" rx="10" ry="6" fill="#14291C" opacity="0.9" />
        <ellipse cx="256" cy="128" rx="7" ry="5" fill="#1A3824" />
        <ellipse cx="354" cy="128" rx="7" ry="5" fill="#1A3824" />

        {/* House body */}
        <rect x="266" y="78" width="78" height="55" rx="3" fill="url(#pgBodyGrad)" stroke="rgba(124,255,178,0.25)" strokeWidth="1" />

        {/* Roof */}
        <polygon points="258,80 305,42 352,80" fill="url(#pgRoofGrad)" stroke="rgba(124,255,178,0.3)" strokeWidth="1" />
        {/* Roof ridge highlight */}
        <line x1="305" y1="43" x2="305" y2="80" stroke="rgba(124,255,178,0.12)" strokeWidth="1" />

        {/* Chimney */}
        <rect x="320" y="50" width="10" height="18" rx="2" fill="#142018" stroke="rgba(124,255,178,0.15)" strokeWidth="0.8" />

        {/* PG sign on roof */}
        <text className="pg-sign" x="305" y="68" textAnchor="middle" fill="#7CFFB2" fontSize="14" fontWeight="700" fontFamily="'Geist','Inter',sans-serif" letterSpacing="1">PG</text>

        {/* Window left */}
        <rect className="pg-window" x="272" y="90" width="20" height="18" rx="2" fill="url(#warmLight)" opacity="0.8" />
        <line x1="282" y1="90" x2="282" y2="108" stroke="rgba(100,60,0,0.4)" strokeWidth="1" />
        <line x1="272" y1="99" x2="292" y2="99" stroke="rgba(100,60,0,0.4)" strokeWidth="1" />

        {/* Window right */}
        <rect className="pg-window-2" x="318" y="90" width="20" height="18" rx="2" fill="url(#warmLight)" opacity="0.8" />
        <line x1="328" y1="90" x2="328" y2="108" stroke="rgba(100,60,0,0.4)" strokeWidth="1" />
        <line x1="318" y1="99" x2="338" y2="99" stroke="rgba(100,60,0,0.4)" strokeWidth="1" />

        {/* Door */}
        <rect x="294" y="104" width="22" height="29" rx="3" fill="url(#doorGlow)" />
        {/* Door frame */}
        <rect x="294" y="104" width="22" height="29" rx="3" fill="none" stroke="rgba(124,255,178,0.35)" strokeWidth="1.2" />
        {/* Door knob */}
        <circle cx="311" cy="119" r="2" fill="rgba(255,200,80,0.9)" />
        {/* Door top arc */}
        <path d="M294,107 Q305,99 316,107" fill="none" stroke="rgba(255,180,60,0.3)" strokeWidth="0.8" />

        {/* Steps */}
        <rect x="290" y="132" width="30" height="3" rx="1" fill="#1E3025" stroke="rgba(124,255,178,0.2)" strokeWidth="0.5" />
        <rect x="287" y="134" width="36" height="2" rx="1" fill="#162219" />

        {/* Ground shadow under PG */}
        <ellipse cx="305" cy="136" rx="45" ry="4" fill="rgba(0,0,0,0.5)" />

        {/* ── Walker ─────────────────────────────────────────────────── */}
        <g className="scene-walker" transform="translate(28, 60)">

          {/* Shadow under feet */}
          <ellipse cx="28" cy="73" rx="18" ry="3.5" fill="rgba(0,0,0,0.45)" />

          {/* ── Trolley bag (dragged behind) ── */}
          <g transform="translate(-18, 22)">
            {/* Trolley handle */}
            <line x1="18" y1="8" x2="14" y2="48" stroke="#4EC988" strokeWidth="2" strokeLinecap="round" />
            {/* Trolley body */}
            <rect x="4" y="22" width="22" height="28" rx="4" fill="url(#trolleyGrad)" />
            {/* Trolley body highlight */}
            <rect x="6" y="24" width="7" height="24" rx="2" fill="rgba(255,255,255,0.1)" />
            {/* Trolley zipper */}
            <line x1="4" y1="36" x2="26" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeDasharray="3,2" />
            {/* Trolley pocket */}
            <rect x="8" y="40" width="14" height="8" rx="2" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" />
            {/* Wheel left */}
            <g transform="translate(7, 50)">
              <g className="trolley-wheel">
                <circle r="4" fill="#2A6644" stroke="#4EC988" strokeWidth="1" />
                <line x1="-3" y1="0" x2="3" y2="0" stroke="#4EC988" strokeWidth="0.8" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke="#4EC988" strokeWidth="0.8" />
              </g>
            </g>
            {/* Wheel right */}
            <g transform="translate(19, 50)">
              <g className="trolley-wheel">
                <circle r="4" fill="#2A6644" stroke="#4EC988" strokeWidth="1" />
                <line x1="-3" y1="0" x2="3" y2="0" stroke="#4EC988" strokeWidth="0.8" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke="#4EC988" strokeWidth="0.8" />
              </g>
            </g>
          </g>

          {/* ── Person ── */}
          <g className="walker-body-group" transform="translate(28, 0)">

            {/* Backpack */}
            <rect x="14" y="10" width="14" height="20" rx="4" fill="url(#bagGrad)" />
            <rect x="15" y="12" width="5" height="16" rx="2" fill="rgba(255,255,255,0.1)" />
            {/* Backpack strap left */}
            <path d="M15,10 Q10,20 13,32" stroke="#2E9660" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Backpack strap right */}
            <path d="M26,10 Q29,20 25,32" stroke="#2E9660" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Legs (behind body) */}
            {/* Left leg */}
            <g className="leg-left" transform="translate(22, 44)">
              {/* Thigh */}
              <rect x="-5" y="0" width="10" height="16" rx="4" fill="#1A1A2E" />
              {/* Shin */}
              <rect x="-4" y="13" width="8" height="14" rx="3" fill="#141428" />
              {/* Shoe */}
              <ellipse cx="0" cy="28" rx="7" ry="3.5" fill="#E8E8E0" />
              <rect x="-7" y="25" width="14" height="5" rx="2.5" fill="#E8E8E0" />
            </g>

            {/* Right leg */}
            <g className="leg-right" transform="translate(34, 44)">
              {/* Thigh */}
              <rect x="-5" y="0" width="10" height="16" rx="4" fill="#222238" />
              {/* Shin */}
              <rect x="-4" y="13" width="8" height="14" rx="3" fill="#1A1A30" />
              {/* Shoe */}
              <ellipse cx="0" cy="28" rx="7" ry="3.5" fill="#E8E8E0" />
              <rect x="-7" y="25" width="14" height="5" rx="2.5" fill="#E8E8E0" />
            </g>

            {/* Hoodie body */}
            <rect x="13" y="22" width="30" height="26" rx="8" fill="url(#hoodieGrad)" />
            {/* Hoodie pocket */}
            <rect x="17" y="36" width="22" height="10" rx="4" fill="rgba(0,0,0,0.18)" />
            {/* Hoodie zipper */}
            <line x1="28" y1="22" x2="28" y2="46" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />

            {/* Left arm */}
            <g className="arm-left" transform="translate(13, 26)">
              <rect x="-5" y="-3" width="9" height="20" rx="4" fill="#5DD89A" />
              {/* Hand */}
              <ellipse cx="-0.5" cy="19" rx="4.5" ry="3.5" fill="#C8A882" />
            </g>

            {/* Right arm (holds trolley handle) */}
            <g className="arm-right" transform="translate(43, 26)">
              <rect x="-4" y="-3" width="9" height="20" rx="4" fill="#4EC888" />
              {/* Hand */}
              <ellipse cx="0.5" cy="19" rx="4.5" ry="3.5" fill="#C8A882" />
            </g>

            {/* Neck */}
            <rect x="24" y="12" width="8" height="12" rx="4" fill="#C8A882" />

            {/* Head */}
            <ellipse cx="28" cy="9" rx="13" ry="13" fill="#C8A882" />
            {/* Hair */}
            <ellipse cx="28" cy="1" rx="13" ry="7" fill="#2A1A0A" />
            <ellipse cx="28" cy="4" rx="11" ry="6" fill="#3A2010" />
            {/* Ear */}
            <ellipse cx="41" cy="10" rx="3" ry="4" fill="#B89070" />
            {/* Eye */}
            <ellipse cx="35" cy="9" rx="2.5" ry="2.5" fill="#1A0A00" />
            <circle cx="35.8" cy="8.2" r="0.9" fill="white" />
            {/* Eyebrow */}
            <path d="M32,6 Q35,4.5 38,6" stroke="#2A1A0A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            {/* Mouth - slight smile */}
            <path d="M32,13 Q35,15 38,13" stroke="#9A6840" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Nose */}
            <circle cx="36" cy="11" r="1" fill="rgba(0,0,0,0.18)" />
          </g>
        </g>

        {/* Subtle ground dashes (road markings) */}
        {[20,55,90,125,160,195,230].map((x, i) => (
          <rect key={i} x={x} y="134.5" width="20" height="1" rx="0.5" fill="rgba(124,255,178,0.08)" />
        ))}
      </svg>
    </Box>
  </>
);

// ─── Phone input ──────────────────────────────────────────────────────────────
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
        borderColor: "rgba(124,255,178,0.55)",
        boxShadow: "0 0 0 3px rgba(124,255,178,0.10)",
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
      placeholder="Enter mobile number"
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
    {loading ? <CircularProgress size={18} sx={{ color: B.bg }} /> : children}
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
      filter: blur(90px);
      pointer-events: none;
      z-index: 0;
    }
    .aurora-1 {
      width: 480px; height: 480px;
      background: radial-gradient(circle, #7CFFB2 0%, transparent 65%);
      top: -200px; left: -160px;
      opacity: 0.15;
      animation: drift1 15s ease-in-out infinite;
    }
    .aurora-2 {
      width: 420px; height: 420px;
      background: radial-gradient(circle, #7CA8FF 0%, transparent 65%);
      bottom: -180px; right: -120px;
      opacity: 0.12;
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
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: B.bg }}>
        <CircularProgress sx={{ color: B.accent }} />
      </Box>
    );
  }
  if (isRedirecting || registrationComplete) return null;

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

      {/* Page shell */}
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

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 440, margin: "0 16px" }}
        >
          <Box
            sx={{
              borderRadius: "24px",
              p: { xs: "24px 20px", sm: "32px 30px" },
              background: "linear-gradient(180deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.018) 100%)",
              border: `1px solid ${B.border}`,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.065), 0 32px 80px -20px rgba(0,0,0,0.65)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Gradient halo border */}
            <Box
              sx={{
                position: "absolute", inset: -1, borderRadius: "24px", padding: "1px",
                background: "linear-gradient(140deg,rgba(124,255,178,0.38) 0%,transparent 40%,transparent 62%,rgba(124,168,255,0.28) 100%)",
                WebkitMask: "linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor", maskComposite: "exclude", pointerEvents: "none",
              }}
            />

            {/* Animation scene */}
            <WalkingScene />

            {/* Step indicator */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Box
                sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.8,
                  px: 1.4, py: 0.55, borderRadius: "999px",
                  bgcolor: "rgba(124,255,178,0.1)",
                  border: "1px solid rgba(124,255,178,0.22)",
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: B.accent, boxShadow: `0 0 7px ${B.accent}` }} />
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: B.accent, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Step {step} of 2
                </Typography>
              </Box>
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

            {/* Step content */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.32 }}
                >
                  <Typography sx={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", mb: 0.75 }}>
                    Enter your number
                  </Typography>
                  <Typography sx={{ color: B.textDim, fontSize: 14, mb: 3, lineHeight: 1.55 }}>
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
                    Continue <SendIcon sx={{ fontSize: 16 }} />
                  </PrimaryBtn>

                  {/* Secure & private footer line */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, mt: 2.5 }}>
                    <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
                      <path d="M6.5 0L13 3V7C13 10.866 10.1 14.394 6.5 15C2.9 14.394 0 10.866 0 7V3L6.5 0Z" fill="rgba(124,255,178,0.2)" stroke="rgba(124,255,178,0.4)" strokeWidth="0.8"/>
                      <path d="M4 7.5L5.8 9.5L9 6" stroke="#7CFFB2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <Typography sx={{ color: B.textDim, fontSize: 12 }}>Secure &amp; private</Typography>
                  </Box>
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
                  <Typography sx={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", mb: 0.75 }}>
                    Enter OTP
                  </Typography>
                  <Typography sx={{ color: B.textDim, fontSize: 14, mb: 3, lineHeight: 1.55 }}>
                    Code sent to{" "}
                    <span style={{ color: B.text, fontWeight: 600, fontFamily: "'Geist Mono','Fira Mono',monospace" }}>
                      +91 {phone}
                    </span>
                  </Typography>

                  {/* OTP boxes */}
                  <Box
                    onPaste={handleOtpPaste}
                    sx={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: { xs: 1, sm: 1.4 }, mb: 2.5 }}
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
                          border: `1px solid ${otp[i] ? "rgba(124,255,178,0.48)" : B.border}`,
                          background: otp[i] ? "rgba(124,255,178,0.055)" : "rgba(255,255,255,0.02)",
                          color: B.text, fontSize: 22, fontWeight: 600,
                          textAlign: "center",
                          fontFamily: "'Geist Mono','Fira Mono',monospace",
                          outline: "none", transition: "all .18s ease",
                          boxShadow: otp[i] ? "0 0 0 3px rgba(124,255,178,0.11)" : "none",
                          caretColor: B.accent,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = B.accent)}
                        onBlur={(e) => (e.target.style.borderColor = otp[i] ? "rgba(124,255,178,0.48)" : B.border)}
                      />
                    ))}
                  </Box>

                  {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

                  <PrimaryBtn
                    onClick={verifyOtp}
                    disabled={loading || otp.length !== 6}
                    loading={loading}
                  >
                    <VerifiedUserIcon sx={{ fontSize: 17 }} /> Verify &amp; continue
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
              sx={{ mt: 3.5, pt: 2.5, borderTop: `1px solid ${B.border}`, color: B.textDim, fontSize: 11.5, textAlign: "center", lineHeight: 1.7 }}
            >
              By continuing you agree to our{" "}
              <a href="/terms" target="_blank" rel="noreferrer" style={{ color: B.text, textDecoration: "none", borderBottom: `1px dashed ${B.textDim}` }}>Terms</a>
              {" "}&amp;{" "}
              <a href="/privacy-policy" target="_blank" rel="noreferrer" style={{ color: B.text, textDecoration: "none", borderBottom: `1px dashed ${B.textDim}` }}>Privacy</a>.
            </Typography>
          </Box>

          <div id="recaptcha-container" style={{ display: "flex", justifyContent: "center", marginTop: 14 }} />
        </motion.div>
      </Box>
    </>
  );
};

export default PhoneLogin;