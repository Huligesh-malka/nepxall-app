import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";
import { Box, useMediaQuery } from "@mui/material";
import axios from "axios";
import QRCodeStyling from "qr-code-styling";

import {
  Typography, Button, Grid, Alert, Snackbar,
  Chip, Avatar, IconButton, Divider, Stack,
  Tooltip, Container, LinearProgress,
  SwipeableDrawer, Tabs, Tab, Menu, MenuItem
} from "@mui/material";

import {
  Add as AddIcon,
  Apartment as ApartmentIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Hotel as RoomIcon,
  TrendingUp as TrendingUpIcon,
  QrCodeScanner as QrIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

// API endpoint for owner payments
const PAYMENTS_API = "https://nepxall-backend.onrender.com/api/owner";

/* ---------------- HELPERS ---------------- */
const parseArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

const formatCurrency = (amt) => {
  if (!amt && amt !== 0) return "₹0";
  const num = Number(amt);
  if (isNaN(num)) return "₹0";
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString()}`;
};

const formatCurrencyFull = (amt) => {
  if (!amt && amt !== 0) return "₹0";
  const num = Number(amt);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
};

const getStatusBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': case 'confirmed': return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
    case 'pending': return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    case 'rejected': case 'cancelled': return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
    case 'completed': return { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };
    default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  }
};

/* --- CountUp hook --- */
const useCountUp = (endValue, duration = 900) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime, animationFrame;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);
  return count;
};

/* --- Design tokens --- */
const T = {
  blue: "#0B5ED7",
  green: "#16a34a",
  greenLight: "#4CAF50",
  purple: "#7C3AED",
  amber: "#d97706",
  red: "#dc2626",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  white: "#ffffff",
};

/* --- Stat Card --- */
const StatCard = ({ label, value, sub, icon: Icon, accent, progress }) => (
  <Box sx={{
    background: T.white,
    borderRadius: "20px",
    border: `1px solid ${T.slate200}`,
    p: { xs: 2, sm: 2.5 },
    height: "100%",
    position: "relative",
    overflow: "hidden",
    transition: "box-shadow 0.2s, transform 0.2s",
    '&:hover': { transform: "translateY(-3px)", boxShadow: "0 12px 24px rgba(0,0,0,0.08)" },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: '3px',
      background: accent,
      borderRadius: '0 0 20px 20px'
    }
  }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
      <Typography sx={{ color: T.slate500, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Box sx={{ width: 32, height: 32, borderRadius: "10px", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon sx={{ fontSize: 18, color: accent }} />
      </Box>
    </Box>
    <Typography sx={{ fontSize: { xs: "1.6rem", sm: "2rem" }, fontWeight: 800, color: T.slate900, lineHeight: 1, mb: 0.5 }}>
      {value}
    </Typography>
    {sub && <Typography sx={{ fontSize: "0.7rem", color: T.slate500 }}>{sub}</Typography>}
    {progress !== undefined && (
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          mt: 1.5, height: 3, borderRadius: 4, bgcolor: T.slate100,
          '& .MuiLinearProgress-bar': { background: accent, borderRadius: 4 }
        }}
      />
    )}
  </Box>
);

/* --- Action Button --- */
const ActionBtn = ({ icon, label, onClick, disabled, color = T.blue }) => (
  <Button
    size="small"
    startIcon={icon}
    onClick={onClick}
    disabled={disabled}
    sx={{
      background: `${color}12`,
      color,
      borderRadius: "14px",
      px: 1.5,
      py: 0.6,
      textTransform: "none",
      fontWeight: 600,
      fontSize: "0.72rem",
      gap: 0.5,
      minWidth: 0,
      transition: "all 0.18s",
      '&:hover': { background: color, color: T.white, transform: "translateY(-1px)", boxShadow: `0 4px 12px ${color}40` },
      '&.Mui-disabled': { background: T.slate100, color: T.slate500 }
    }}
  >
    {label}
  </Button>
);

/* --- Insight Row --- */
const InsightRow = ({ label, value, color, icon }) => (
  <Box sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    py: 1.2,
    px: 0,
    borderBottom: `1px solid ${T.slate100}`,
    '&:last-child': { borderBottom: 'none' },
  }}>
    <Typography sx={{ color: T.slate500, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 1 }}>
      <span style={{ fontSize: "1rem" }}>{icon}</span> {label}
    </Typography>
    <Typography sx={{ color: color || T.slate900, fontWeight: 700, fontSize: "0.9rem" }}>{value}</Typography>
  </Box>
);

/* ================================================================ */
/*                         MAIN COMPONENT                           */
/* ================================================================ */
const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width:768px)");
  const isSmall = useMediaQuery("(max-width:480px)");

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pgDetailsMap, setPgDetailsMap] = useState({});
  const [settlementData, setSettlementData] = useState([]);
  const [settlementStats, setSettlementStats] = useState({
    totalSettled: 0, totalPending: 0, totalAmount: 0,
    settledAmount: 0, pendingAmount: 0, notJoinedAmount: 0, pgBreakdown: []
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [stats, setStats] = useState({
    totalProperties: 0, totalRooms: 0, availableRooms: 0, occupiedRooms: 0,
    occupancyRate: 0, totalEarnings: 0, pendingBookings: 0, totalBookings: 0,
    avgRating: 0, totalEnquiries: 0, totalRent: 0, totalDeposit: 0,
    pendingRent: 0, pendingDeposit: 0, monthlyRevenue: 0, yearlyRevenue: 0,
    cancelledBookings: 0, completedBookings: 0
  });

  const animatedProperties = useCountUp(stats.totalProperties);
  const animatedRooms = useCountUp(stats.totalRooms);
  const animatedOccupancy = useCountUp(stats.occupancyRate);
  const animatedPending = useCountUp(stats.pendingBookings);
  const animatedEarnings = useCountUp(stats.totalEarnings);
  const animatedMonthly = useCountUp(stats.monthlyRevenue);
  const animatedSettled = useCountUp(settlementStats.settledAmount);
  const animatedPendingAmt = useCountUp(settlementStats.pendingAmount);
  const animatedNotJoined = useCountUp(settlementStats.notJoinedAmount);

  const getDepositByRoomType = (pg) => {
    if (!pg) return 0;
    return Number(pg.security_deposit) || Number(pg.deposit_amount) || 0;
  };

  const fetchSettlementData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await axios.get(`${PAYMENTS_API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payments = res.data.data || [];
      setSettlementData(payments);

      const settled = payments.filter(p => p.owner_settlement === "DONE");
      const pending = payments.filter(p => p.owner_settlement !== "DONE");
      const joinedAmount = payments.filter(p => p.owner_settlement === "DONE" && p.join_status === "JOINED").reduce((s, p) => s + (parseFloat(p.owner_amount) || 0), 0);
      const notJoinedAmount = payments.filter(p => p.owner_settlement === "DONE" && p.join_status !== "JOINED").reduce((s, p) => s + (parseFloat(p.owner_amount) || 0), 0);
      const totalAmount = payments.reduce((s, p) => s + (parseFloat(p.owner_amount) || 0), 0);
      const pendingAmount = pending.reduce((s, p) => s + (parseFloat(p.owner_amount) || 0), 0);

      const pgMap = new Map();
      payments.forEach(p => {
        const pgName = p.pg_name || "Unknown PG";
        if (!pgMap.has(pgName)) pgMap.set(pgName, { total: 0, settled: 0, pending: 0, notJoined: 0 });
        const pg = pgMap.get(pgName);
        const amount = parseFloat(p.owner_amount) || 0;
        pg.total += amount;
        if (p.owner_settlement === "DONE" && p.join_status === "JOINED") pg.settled += amount;
        else if (p.owner_settlement === "DONE") pg.notJoined += amount;
        else pg.pending += amount;
      });

      setSettlementStats({
        totalSettled: settled.length, totalPending: pending.length, totalAmount,
        settledAmount: joinedAmount, pendingAmount, notJoinedAmount,
        pgBreakdown: Array.from(pgMap.entries()).map(([name, data]) => ({ name, ...data }))
      });
    } catch (err) {
      console.error("Settlement fetch error:", err);
    }
  }, [user]);

  const loadAllData = useCallback(async (refresh = false) => {
    if (!user) return;
    refresh ? setRefreshing(true) : setPageLoading(true);

    try {
      const pgRes = await pgAPI.getOwnerDashboard();
      const pgData = Array.isArray(pgRes.data) ? pgRes.data : pgRes.data?.data || [];

      const pgMap = {};
      const properties = pgData.map(pg => {
        const photos = parseArray(pg.photos);
        pgMap[pg.id] = pg;
        pgMap[pg.pg_id] = pg;
        return {
          ...pg,
          id: pg.id || pg.pg_id,
          pg_id: pg.pg_id || pg.id,
          photos,
          image: photos.length ? photos[0] : null,
          total_rooms: Number(pg.total_rooms) || 0,
          available_rooms: Number(pg.available_rooms) || 0,
          rent_amount: Number(pg.rent_amount) || 0,
        };
      });

      setPGs(properties);
      setPgDetailsMap(pgMap);

      const bookingsRes = await pgAPI.getOwnerBookings();
      const bookings = bookingsRes.data?.data || [];
      setBookingHistory(bookings);

      const enhancedBookings = bookings.map(booking => {
        const pg = pgMap[booking.pg_id || booking.property_id];
        const monthlyRent = Number(booking.rent_amount) || 0;
        const deposit = getDepositByRoomType(pg);
        const ownerAmount = Number(booking.owner_amount) || Number(booking.amount) || monthlyRent || 0;
        return {
          ...booking,
          tenant_name: booking.name || booking.tenant_name || 'Unknown',
          tenant_phone: booking.phone || booking.tenant_phone,
          tenant_email: booking.email || booking.tenant_email,
          room_type: booking.room_type || 'Not specified',
          check_in_date: booking.check_in_date || booking.created_at,
          owner_amount: ownerAmount,
          monthly_rent: monthlyRent,
          deposit_amount: deposit,
          pg_name: booking.pg_name || pg?.pg_name || 'N/A',
          pg_details: pg
        };
      });

      setRecentBookings(
        [...enhancedBookings].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5)
      );

      const totalRooms = properties.reduce((a, b) => a + (b.total_rooms || 0), 0);
      const availableRooms = properties.reduce((a, b) => a + (b.available_rooms || 0), 0);
      const occupiedRooms = totalRooms - availableRooms;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      const ratings = properties.filter(p => p.avg_rating > 0).map(p => p.avg_rating);
      const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

      const paidBookings = enhancedBookings.filter(b => ["done"].includes(b.owner_settlement?.toLowerCase()));
      const pendingList = enhancedBookings.filter(b => ["pending", "approved"].includes(b?.status?.toLowerCase()));
      const cancelledList = enhancedBookings.filter(b => ["rejected", "cancelled"].includes(b?.status?.toLowerCase()));
      const completedList = enhancedBookings.filter(b => ["confirmed", "left", "completed"].includes(b?.status?.toLowerCase()));

      const totalEarnings = paidBookings.reduce((a, b) => a + (Number(b.owner_amount) || 0), 0);
      const totalRent = paidBookings.reduce((a, b) => a + (Number(b.rent_amount) || 0), 0);
      const totalDeposit = paidBookings.reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);
      const pendingRent = pendingList.reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);
      const pendingDeposit = pendingList.reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);
      const now = new Date();
      const monthlyRevenue = paidBookings.filter(b => {
        const d = new Date(b.created_at || b.check_in_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((a, b) => a + (Number(b.owner_amount) || 0), 0);

      setStats({
        totalProperties: properties.length, totalRooms, availableRooms, occupiedRooms,
        occupancyRate, totalEarnings, pendingBookings: pendingList.length,
        totalBookings: enhancedBookings.length, avgRating, totalEnquiries: 0,
        totalRent, totalDeposit, pendingRent, pendingDeposit, monthlyRevenue,
        cancelledBookings: cancelledList.length, completedBookings: completedList.length
      });

      await fetchSettlementData();

      if (refresh) setSnackbar({ open: true, message: "Dashboard refreshed", severity: "success" });
    } catch (err) {
      console.error("Dashboard error:", err);
      setSnackbar({ open: true, message: "Failed to load dashboard", severity: "error" });
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, [user, fetchSettlementData]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (user && role === "owner") loadAllData();
  }, [user, role, authLoading, navigate, loadAllData]);

  /* --- Handlers --- */
  const handleGenerateQR = async (propertyId) => {
    try {
      const property = pgs.find(p => p.id === propertyId || p.pg_id === propertyId);
      setSelectedProperty(property);
      const url = `https://nepxall-app.vercel.app/scan/${propertyId}`;
      const qr = new QRCodeStyling({
        width: 400, height: 400, data: url,
        dotsOptions: { type: "square", color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "square", color: "#000000" },
        cornersDotOptions: { type: "square", color: "#000000" }
      });
      const qrBlob = await qr.getRawData("png");
      setQrImageUrl(URL.createObjectURL(qrBlob));
      setQrOpen(true);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to generate QR code", severity: "error" });
    }
  };

  const handleDownloadQRPoster = async () => {
    if (!selectedProperty) return;
    try {
      const propertyName = selectedProperty?.pg_name || "PG";
      const propertyId = selectedProperty?.id || selectedProperty?.pg_id;
      const url = `https://nepxall-app.vercel.app/scan/${propertyId}`;
      const qr = new QRCodeStyling({ width: 600, height: 600, data: url, dotsOptions: { type: "square", color: "#000000" }, backgroundOptions: { color: "#ffffff" }, cornersSquareOptions: { type: "square", color: "#000000" }, cornersDotOptions: { type: "square", color: "#000000" } });
      const canvas = document.createElement("canvas");
      canvas.width = 900; canvas.height = 1100;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#F9FAFB"; ctx.fillRect(0, 0, 900, 1100); ctx.textAlign = "center";
      const logo = new Image();
      logo.crossOrigin = "anonymous"; logo.src = "/logo.png";
      logo.onload = async () => {
        ctx.drawImage(logo, 350, 40, 200, 110);
        ctx.font = "900 54px Arial";
        const g = ctx.createLinearGradient(360, 210, 540, 210);
        g.addColorStop(0, T.blue); g.addColorStop(1, T.greenLight);
        ctx.fillStyle = g; ctx.fillText("Nepxall", 450, 210);
        ctx.font = "bold 36px Arial"; ctx.fillStyle = "#111827"; ctx.fillText(propertyName.toUpperCase(), 450, 320);
        ctx.font = "26px Arial"; ctx.fillStyle = T.blue; ctx.fillText("Scan QR to View Rooms", 450, 380);
        const qrBlob = await qr.getRawData("png");
        const qrImg = new Image(); qrImg.src = URL.createObjectURL(qrBlob);
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 150, 450, 600, 600);
          ctx.font = "22px Arial"; ctx.fillStyle = "#6B7280"; ctx.fillText("Powered by Nepxall", 450, 1080);
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `nepxall-${propertyName}-qr.png`;
          link.click();
        };
      };
    } catch (err) { console.error("Poster error:", err); }
  };

  const handleExportReport = () => {
    const headers = ["Property", "Tenant", "Check-in Date", "Room Type", "Monthly Rent", "Owner Amount", "Status", "Settlement"];
    const rows = bookingHistory.map(b => {
      const s = settlementData.find(sd => sd.booking_id === b.id);
      return [
        b.pg_name || "N/A", b.name || b.tenant_name || "Unknown",
        formatDate(b.check_in_date || b.created_at), b.room_type || "N/A",
        formatCurrencyFull(b.rent_amount || 0), formatCurrencyFull(b.owner_amount || 0),
        b.status || "Pending",
        s?.owner_settlement === "DONE" ? "Settled" : "Pending"
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    setSnackbar({ open: true, message: "Report exported", severity: "success" });
  };

  /* ---- GUARDS ---- */
  if (authLoading || pageLoading) {
    return (
      <Box sx={{
        minHeight: "100vh", background: "#f8fafc",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: "18px",
          background: `linear-gradient(135deg, ${T.blue}, ${T.greenLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 8px 24px ${T.blue}30`
        }}>
          <ApartmentIcon sx={{ color: "#fff", fontSize: 28 }} />
        </Box>
        <Typography sx={{ color: T.slate500, fontWeight: 500, fontSize: "0.9rem" }}>
          Loading dashboard…
        </Typography>
        <LinearProgress sx={{
          width: 120, borderRadius: 4, bgcolor: T.slate200,
          '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${T.blue}, ${T.greenLight})` }
        }} />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  /* ================================================================ */
  /*                              RENDER                              */
  /* ================================================================ */
  return (
    <Box sx={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>

        {/* ── HEADER ── */}
        <Box sx={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2,
          position: "sticky", top: 12, zIndex: 100,
          background: "rgba(248,250,252,0.9)", backdropFilter: "blur(12px)",
          borderRadius: "20px", p: { xs: "12px 16px", sm: "14px 24px" },
          border: `1px solid ${T.slate200}`, boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
        }}>
          <Box>
            <Typography sx={{
              fontSize: { xs: "1.4rem", md: "1.8rem" }, fontWeight: 800,
              color: T.slate900, letterSpacing: "-0.02em"
            }}>
              Dashboard
            </Typography>
            <Typography sx={{ color: T.slate500, fontSize: "0.8rem", mt: 0.2 }}>
              {pgs.length} {pgs.length === 1 ? "property" : "properties"} · {stats.totalBookings} bookings
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={() => loadAllData(true)}
                disabled={refreshing}
                size="small"
                sx={{
                  background: T.white, border: `1px solid ${T.slate200}`,
                  borderRadius: "12px", color: T.slate500,
                  '&:hover': { color: T.green, borderColor: T.green, background: "#f0fdf4" }
                }}
              >
                <RefreshIcon fontSize="small" sx={{ transition: "transform 0.4s", transform: refreshing ? "rotate(360deg)" : "none" }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Export CSV">
              <IconButton
                onClick={handleExportReport}
                size="small"
                sx={{
                  background: T.white, border: `1px solid ${T.slate200}`,
                  borderRadius: "12px", color: T.slate500,
                  '&:hover': { color: T.purple, borderColor: T.purple, background: "#f5f3ff" }
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {!isSmall && (
              <>
                <Button
                  startIcon={<ChatIcon />}
                  onClick={() => navigate("/owner/chats")}
                  size="small"
                  sx={{
                    background: T.white, border: `1px solid ${T.slate200}`,
                    borderRadius: "14px", px: 2, color: T.slate700, fontWeight: 600,
                    textTransform: "none", fontSize: "0.82rem",
                    '&:hover': { background: "#dbeafe", borderColor: T.blue, color: T.blue }
                  }}
                >
                  Chats
                </Button>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/owner/add")}
                  size="small"
                  sx={{
                    background: `linear-gradient(135deg, ${T.blue}, ${T.greenLight})`,
                    borderRadius: "14px", px: 2.5, color: T.white, fontWeight: 600,
                    textTransform: "none", fontSize: "0.82rem",
                    boxShadow: `0 4px 12px ${T.blue}30`,
                    '&:hover': { boxShadow: `0 6px 20px ${T.blue}40`, transform: "translateY(-1px)" }
                  }}
                >
                  Add Property
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* ── STAT CARDS ── */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              label="Properties" value={animatedProperties}
              icon={ApartmentIcon} accent={T.greenLight}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              label="Total Rooms" value={animatedRooms}
              sub={`${stats.availableRooms} available`}
              icon={RoomIcon} accent={T.blue}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              label="Occupancy" value={`${animatedOccupancy}%`}
              icon={TrendingUpIcon} accent={T.purple}
              progress={stats.occupancyRate}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              label="Pending" value={animatedPending}
              icon={PendingIcon} accent={T.amber}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              label="Revenue" value={formatCurrency(animatedEarnings)}
              sub={`${formatCurrency(animatedMonthly)} this month`}
              icon={MoneyIcon} accent={T.green}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              label="Rating" value={stats.avgRating || "—"}
              sub={stats.avgRating ? "★".repeat(Math.round(stats.avgRating)) : "No ratings yet"}
              icon={StarIcon} accent="#d97706"
            />
          </Grid>
        </Grid>

        {/* ── AVAILABILITY BANNER ── */}
        {stats.availableRooms > 0 && (
          <Box sx={{
            background: "#f0fdf4", border: `1px solid #bbf7d0`,
            borderRadius: "16px", p: { xs: 1.5, sm: 2 }, mb: 3,
            display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap"
          }}>
            <CheckCircleIcon sx={{ color: T.green, fontSize: 20 }} />
            <Typography sx={{ color: "#166534", flex: 1, fontSize: "0.88rem", fontWeight: 500 }}>
              <strong>{stats.availableRooms}</strong> rooms available across your properties
            </Typography>
            <Button size="small" onClick={() => navigate("/owner/add")} sx={{
              color: T.green, borderColor: "#86efac", borderRadius: "10px",
              textTransform: "none", fontSize: "0.8rem", fontWeight: 600,
              '&:hover': { background: "#dcfce7" }
            }} variant="outlined">
              Manage
            </Button>
          </Box>
        )}

        {/* ── TABS ── */}
        <Box sx={{
          background: T.white, borderRadius: "20px",
          border: `1px solid ${T.slate200}`, overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
        }}>
          <Box sx={{ borderBottom: `1px solid ${T.slate200}`, px: { xs: 1, sm: 2 } }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  color: T.slate500, fontWeight: 600, textTransform: "none",
                  fontSize: { xs: "0.8rem", sm: "0.88rem" },
                  minHeight: 48, py: 0, px: { xs: 1.5, sm: 3 },
                  '&.Mui-selected': { color: T.blue }
                },
                '& .MuiTabs-indicator': { background: T.blue, height: 2, borderRadius: "2px 2px 0 0" }
              }}
            >
              <Tab label="Properties" icon={<ApartmentIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
              <Tab label="Bookings" icon={<ReceiptIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
              <Tab label="Insights" icon={<TrendingUpIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            </Tabs>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>

            {/* ── PROPERTIES TAB ── */}
            {activeTab === 0 && (
              pgs.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Box sx={{
                    width: 72, height: 72, borderRadius: "24px",
                    background: `linear-gradient(135deg, ${T.blue}15, ${T.greenLight}15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2
                  }}>
                    <ApartmentIcon sx={{ fontSize: 36, color: T.greenLight }} />
                  </Box>
                  <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: "1.1rem", mb: 0.5 }}>
                    No properties yet
                  </Typography>
                  <Typography sx={{ color: T.slate500, fontSize: "0.88rem", mb: 3 }}>
                    Add your first property to start managing bookings.
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/owner/add")}
                    sx={{
                      background: `linear-gradient(135deg, ${T.blue}, ${T.greenLight})`,
                      borderRadius: "14px", px: 3, py: 1.2, color: T.white,
                      fontWeight: 600, textTransform: "none"
                    }}
                  >
                    Add Property
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  {pgs.map((pg) => {
                    const isActive = pg.status === "active";
                    const isPending = pg.status === "pending";
                    const isRejected = pg.status === "rejected";

                    const statusMeta = {
                      active: { label: "Active", bg: "#dcfce7", color: "#15803d", dot: T.green },
                      pending: { label: "Under Review", bg: "#fef3c7", color: "#92400e", dot: T.amber },
                      rejected: { label: "Rejected", bg: "#fee2e2", color: "#991b1b", dot: T.red },
                    }[pg.status] || { label: pg.status || "Pending", bg: T.slate100, color: T.slate500, dot: T.slate500 };

                    return (
                      <Box key={pg.id || pg.pg_id} sx={{
                        border: `1px solid ${T.slate200}`,
                        borderRadius: "18px", overflow: "hidden",
                        transition: "box-shadow 0.2s, border-color 0.2s",
                        '&:hover': { borderColor: T.slate200, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }
                      }}>
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" } }}>
                          {/* Image */}
                          <Box sx={{
                            width: { xs: "100%", md: 240 },
                            minHeight: { xs: 160, md: "auto" },
                            backgroundImage: pg.image ? `url(${getImageUrl(pg.image)})` : `linear-gradient(135deg, ${T.blue}20, ${T.greenLight}20)`,
                            backgroundSize: "cover", backgroundPosition: "center",
                            position: "relative", flexShrink: 0
                          }}>
                            <Box sx={{
                              position: "absolute", top: 10, left: 10,
                              background: statusMeta.bg, color: statusMeta.color,
                              px: 1.5, py: 0.4, borderRadius: "10px",
                              fontSize: "0.7rem", fontWeight: 700,
                              display: "flex", alignItems: "center", gap: 0.5
                            }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: statusMeta.dot }} />
                              {statusMeta.label}
                            </Box>
                            <Box sx={{
                              position: "absolute", top: 10, right: 10,
                              background: pg.available_rooms > 0 ? "#dcfce7" : "#fee2e2",
                              color: pg.available_rooms > 0 ? "#15803d" : "#b91c1c",
                              px: 1.5, py: 0.4, borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700
                            }}>
                              {pg.available_rooms > 0 ? `${pg.available_rooms} free` : "Full"}
                            </Box>
                          </Box>

                          {/* Content */}
                          <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5 } }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1, flexWrap: "wrap", gap: 1 }}>
                              <Box>
                                <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem" } }}>
                                  {pg.pg_name}
                                </Typography>
                                <Typography sx={{ color: T.slate500, fontSize: "0.8rem" }}>
                                  {pg.location || "Location not specified"}
                                </Typography>
                              </Box>
                              <Typography sx={{ color: T.purple, fontWeight: 700, fontSize: "0.95rem" }}>
                                {formatCurrencyFull(pg.rent_amount)}<span style={{ color: T.slate500, fontWeight: 400, fontSize: "0.72rem" }}>/mo</span>
                              </Typography>
                            </Box>

                            {/* Stats row */}
                            <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
                              <Box>
                                <Typography sx={{ color: T.slate500, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rooms</Typography>
                                <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: "0.95rem" }}>{pg.total_rooms}</Typography>
                              </Box>
                              <Box>
                                <Typography sx={{ color: T.slate500, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Available</Typography>
                                <Typography sx={{ color: isActive ? T.green : T.slate500, fontWeight: 700, fontSize: "0.95rem" }}>{pg.available_rooms}</Typography>
                              </Box>
                            </Box>

                            {/* Alerts */}
                            {isPending && (
                              <Alert severity="warning" icon={false} sx={{
                                borderRadius: "12px", background: "#fef3c7",
                                border: `1px solid #fde68a`, mb: 2, py: 1, px: 1.5
                              }}>
                                <Typography sx={{ fontWeight: 600, color: "#92400e", fontSize: "0.8rem" }}>
                                  ⏳ Admin review in progress · usually 24–48 hours
                                </Typography>
                              </Alert>
                            )}
                            {isRejected && (
                              <Alert severity="error" icon={false} sx={{
                                borderRadius: "12px", background: "#fee2e2",
                                border: `1px solid #fecaca`, mb: 2, py: 1, px: 1.5
                              }}>
                                <Typography sx={{ fontWeight: 600, color: "#991b1b", fontSize: "0.8rem" }}>
                                  ❌ Property rejected · check your email for details
                                </Typography>
                              </Alert>
                            )}

                            {/* Action buttons */}
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              <ActionBtn icon={<ViewIcon sx={{ fontSize: 14 }} />} label="View" onClick={() => navigate(`/pg/${pg.id || pg.pg_id}`)} color={T.blue} />
                              <ActionBtn icon={<EditIcon sx={{ fontSize: 14 }} />} label="Edit" onClick={() => navigate(`/owner/edit/${pg.id || pg.pg_id}`)} disabled={!isActive} color={T.amber} />
                              <ActionBtn icon={<RoomIcon sx={{ fontSize: 14 }} />} label="Rooms" onClick={() => navigate(`/owner/rooms/${pg.id || pg.pg_id}`)} disabled={!isActive} color={T.purple} />
                              <ActionBtn icon={<PhotoIcon sx={{ fontSize: 14 }} />} label="Photos" onClick={() => navigate(`/owner/photos/${pg.id || pg.pg_id}`)} disabled={!isActive} color="#ec4899" />
                              <ActionBtn icon={<QrIcon sx={{ fontSize: 14 }} />} label="QR Code" onClick={() => handleGenerateQR(pg.id || pg.pg_id)} disabled={!isActive} color={T.green} />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )
            )}

            {/* ── BOOKINGS TAB ── */}
            {activeTab === 1 && (
              recentBookings.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: T.slate200, mb: 1 }} />
                  <Typography sx={{ color: T.slate500 }}>No bookings yet</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {recentBookings.map((booking) => {
                    const isSettled = booking.owner_settlement === "DONE";
                    const statusStyle = getStatusBadgeStyle(booking.status);
                    return (
                      <Box
                        key={booking.id}
                        onClick={() => { setSelectedBooking(booking); setBookingDetailsOpen(true); }}
                        sx={{
                          border: `1px solid ${T.slate200}`, borderRadius: "16px",
                          p: { xs: 1.5, sm: 2 }, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 2,
                          flexWrap: "wrap", transition: "all 0.18s",
                          '&:hover': { borderColor: T.blue, background: "#f0f6ff", transform: "translateX(2px)" }
                        }}
                      >
                        <Avatar sx={{
                          width: 44, height: 44, fontSize: "1rem", fontWeight: 700,
                          background: `linear-gradient(135deg, ${T.blue}, ${T.greenLight})`,
                          flexShrink: 0
                        }}>
                          {booking.tenant_name?.charAt(0) || "U"}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 120 }}>
                          <Typography sx={{ color: T.slate900, fontWeight: 600, fontSize: "0.9rem" }}>
                            {booking.tenant_name}
                          </Typography>
                          <Typography sx={{ color: T.slate500, fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 11 }} /> {booking.tenant_phone || "Hidden"}
                          </Typography>
                        </Box>

                        <Box sx={{ minWidth: 120, display: { xs: "none", sm: "block" } }}>
                          <Typography sx={{ color: T.slate500, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Property</Typography>
                          <Typography sx={{ color: T.slate700, fontSize: "0.82rem", fontWeight: 500 }}>{booking.pg_name}</Typography>
                          <Typography sx={{ color: T.purple, fontSize: "0.72rem" }}>{booking.room_type}</Typography>
                        </Box>

                        <Box sx={{ minWidth: 90, display: { xs: "none", md: "block" } }}>
                          <Typography sx={{ color: T.slate500, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Check-in</Typography>
                          <Typography sx={{ color: T.slate700, fontSize: "0.82rem" }}>{formatDate(booking.check_in_date)}</Typography>
                        </Box>

                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Typography sx={{ color: isSettled ? T.green : T.amber, fontWeight: 800, fontSize: "1rem" }}>
                            {formatCurrencyFull(booking.owner_amount)}
                          </Typography>
                          <Chip
                            label={isSettled ? "Settled" : (booking.status || "Pending")}
                            size="small"
                            sx={{
                              background: isSettled ? "#dcfce7" : statusStyle.bg,
                              color: isSettled ? "#15803d" : statusStyle.color,
                              fontWeight: 700, fontSize: "0.65rem", height: 22,
                              border: `1px solid ${isSettled ? "#86efac" : statusStyle.border}`
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}

                  {stats.totalBookings > 5 && (
                    <Box sx={{ textAlign: "center", pt: 1 }}>
                      <Button onClick={() => navigate("/owner/bookings")} size="small" endIcon={<ViewIcon />}
                        sx={{ color: T.blue, textTransform: "none", fontWeight: 600, fontSize: "0.82rem" }}>
                        View all {stats.totalBookings} bookings
                      </Button>
                    </Box>
                  )}
                </Stack>
              )
            )}

            {/* ── INSIGHTS TAB ── */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                {/* Revenue */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ border: `1px solid ${T.slate200}`, borderRadius: "16px", p: 2.5 }}>
                    <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: "0.9rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <MoneyIcon sx={{ fontSize: 18, color: T.green }} /> Revenue
                    </Typography>
                    <InsightRow label="Total Earnings" value={formatCurrencyFull(animatedEarnings)} color={T.green} icon="💰" />
                    <InsightRow label="This Month" value={formatCurrencyFull(animatedMonthly)} color={T.purple} icon="📊" />
                    <InsightRow label="Rent Collected" value={formatCurrencyFull(stats.totalRent)} color={T.blue} icon="🏠" />
                    <InsightRow label="Deposits Collected" value={formatCurrencyFull(stats.totalDeposit)} color={T.amber} icon="🔒" />
                    <InsightRow label="Pending Rent" value={formatCurrencyFull(stats.pendingRent)} color={T.red} icon="⏰" />
                    <InsightRow label="Pending Deposit" value={formatCurrencyFull(stats.pendingDeposit)} color={T.red} icon="⚠️" />
                  </Box>
                </Grid>

                {/* Bookings */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ border: `1px solid ${T.slate200}`, borderRadius: "16px", p: 2.5 }}>
                    <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: "0.9rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <ReceiptIcon sx={{ fontSize: 18, color: T.amber }} /> Bookings
                    </Typography>
                    <InsightRow label="Total" value={stats.totalBookings} color={T.slate900} icon="📋" />
                    <InsightRow label="Completed / Active" value={stats.completedBookings} color={T.green} icon="✅" />
                    <InsightRow label="Pending" value={stats.pendingBookings} color={T.amber} icon="⏳" />
                    <InsightRow label="Cancelled" value={stats.cancelledBookings} color={T.red} icon="❌" />
                  </Box>
                </Grid>

                {/* Settlements */}
                <Grid item xs={12}>
                  <Box sx={{ border: `1px solid ${T.slate200}`, borderRadius: "16px", p: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 1 }}>
                        <BankIcon sx={{ fontSize: 18, color: T.purple }} /> Settlements
                      </Typography>
                      <Button size="small" onClick={() => navigate("/owner/payments")}
                        sx={{ color: T.blue, textTransform: "none", fontWeight: 600, fontSize: "0.78rem" }}>
                        View all →
                      </Button>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: settlementStats.pgBreakdown.length > 0 ? 3 : 0 }}>
                      {[
                        { label: "Joined Earnings", amount: animatedSettled, bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", tag: "✅ Real profit" },
                        { label: "Not Joined", amount: animatedNotJoined, bg: "#fffbeb", color: "#d97706", border: "#fde68a", tag: "⚠️ Not joined" },
                        { label: "Pending", amount: animatedPendingAmt, bg: "#fef2f2", color: "#dc2626", border: "#fecaca", tag: "⏳ Processing" },
                      ].map(({ label, amount, bg, color, border, tag }) => (
                        <Grid item xs={12} sm={4} key={label}>
                          <Box sx={{
                            background: bg, border: `1px solid ${border}`, borderRadius: "14px",
                            p: 2, textAlign: "center",
                            transition: "transform 0.2s",
                            '&:hover': { transform: "translateY(-2px)" }
                          }}>
                            <Typography sx={{ color, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                              {label}
                            </Typography>
                            <Typography sx={{ color, fontWeight: 800, fontSize: "1.4rem", lineHeight: 1 }}>
                              {formatCurrency(amount)}
                            </Typography>
                            <Typography sx={{ color, fontSize: "0.68rem", mt: 0.5, opacity: 0.8 }}>{tag}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    {settlementStats.pgBreakdown.length > 0 && (
                      <>
                        <Typography sx={{ color: T.slate500, fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                          Per Property
                        </Typography>
                        <Stack spacing={1}>
                          {settlementStats.pgBreakdown.map((pg) => (
                            <Box key={pg.name} sx={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "center", p: 1.5,
                              background: T.slate50, borderRadius: "12px",
                              flexWrap: "wrap", gap: 1,
                              '&:hover': { background: T.slate100 }
                            }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ApartmentIcon sx={{ fontSize: 14, color: T.green }} />
                                <Typography sx={{ color: T.slate900, fontSize: "0.82rem", fontWeight: 500 }}>{pg.name}</Typography>
                              </Box>
                              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                <Typography sx={{ color: T.slate500, fontSize: "0.72rem" }}>Total: {formatCurrency(pg.total)}</Typography>
                                {pg.settled > 0 && <Typography sx={{ color: T.green, fontSize: "0.72rem" }}>✅ {formatCurrency(pg.settled)}</Typography>}
                                {pg.notJoined > 0 && <Typography sx={{ color: T.amber, fontSize: "0.72rem" }}>⚠️ {formatCurrency(pg.notJoined)}</Typography>}
                                {pg.pending > 0 && <Typography sx={{ color: T.red, fontSize: "0.72rem" }}>⏳ {formatCurrency(pg.pending)}</Typography>}
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>

        {/* ── QR DRAWER ── */}
        <SwipeableDrawer
          anchor="bottom"
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen
          sx={{
            '& .MuiDrawer-paper': {
              borderTopLeftRadius: "28px", borderTopRightRadius: "28px",
              border: `1px solid ${T.slate200}`, borderBottom: "none", p: 3
            }
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <IconButton onClick={() => setQrOpen(false)} size="small" sx={{ color: T.slate500 }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: "1.1rem", mb: 0.5 }}>
              {selectedProperty?.pg_name}
            </Typography>
            <Typography sx={{ color: T.slate500, fontSize: "0.82rem", mb: 3 }}>
              Share this QR so tenants can view and book
            </Typography>
            {qrImageUrl && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <img src={qrImageUrl} alt="QR Code" style={{ width: 220, height: 220, borderRadius: "20px", border: `1px solid ${T.slate200}` }} />
              </Box>
            )}
            <Button fullWidth onClick={handleDownloadQRPoster} sx={{
              background: `linear-gradient(135deg, ${T.blue}, ${T.greenLight})`,
              borderRadius: "14px", py: 1.4, color: T.white, fontWeight: 700, textTransform: "none", mb: 1.5
            }}>
              Download Poster
            </Button>
            <Button fullWidth variant="outlined" onClick={() => setQrOpen(false)} sx={{
              borderColor: T.slate200, color: T.slate500, borderRadius: "14px", py: 1.2,
              textTransform: "none", fontWeight: 600
            }}>
              Close
            </Button>
          </Box>
        </SwipeableDrawer>

        {/* ── BOOKING DETAILS DRAWER ── */}
        <SwipeableDrawer
          anchor="bottom"
          open={bookingDetailsOpen}
          onClose={() => setBookingDetailsOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen
          sx={{
            '& .MuiDrawer-paper': {
              borderTopLeftRadius: "28px", borderTopRightRadius: "28px",
              border: `1px solid ${T.slate200}`, borderBottom: "none",
              p: 3, maxHeight: "82vh"
            }
          }}
        >
          {selectedBooking && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ color: T.slate900, fontWeight: 700, fontSize: "1.1rem" }}>Booking Details</Typography>
                <IconButton onClick={() => setBookingDetailsOpen(false)} size="small" sx={{ color: T.slate500 }}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Divider sx={{ borderColor: T.slate100, mb: 2 }} />

              <Grid container spacing={1.5}>
                {[
                  { label: "Tenant", value: selectedBooking.tenant_name, full: true },
                  { label: "Phone", value: selectedBooking.tenant_phone || "Hidden" },
                  { label: "Email", value: selectedBooking.tenant_email || "Not provided" },
                  { label: "Property", value: selectedBooking.pg_name, full: true },
                  { label: "Room Type", value: selectedBooking.room_type, color: T.purple },
                  { label: "Check-in", value: formatDate(selectedBooking.check_in_date) },
                  { label: "Owner Amount", value: formatCurrencyFull(selectedBooking.owner_amount), color: T.green },
                  { label: "Monthly Rent", value: formatCurrencyFull(selectedBooking.monthly_rent), color: T.blue },
                  { label: "Deposit", value: formatCurrencyFull(selectedBooking.deposit_amount), color: T.amber },
                ].map(({ label, value, full, color }) => (
                  <Grid item xs={full ? 12 : 6} key={label}>
                    <Typography sx={{ color: T.slate500, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ color: color || T.slate900, fontWeight: 600, fontSize: "0.9rem" }}>
                      {value}
                    </Typography>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Typography sx={{ color: T.slate500, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                    Settlement
                  </Typography>
                  <Chip
                    label={selectedBooking.owner_settlement === "DONE" ? "Settled" : "Pending"}
                    sx={{
                      background: selectedBooking.owner_settlement === "DONE" ? "#dcfce7" : "#fef3c7",
                      color: selectedBooking.owner_settlement === "DONE" ? "#15803d" : "#92400e",
                      fontWeight: 700, fontSize: "0.75rem"
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                fullWidth
                onClick={() => { setBookingDetailsOpen(false); navigate(`/owner/bookings/${selectedBooking.id}`); }}
                sx={{
                  mt: 3, background: `linear-gradient(135deg, ${T.blue}, ${T.greenLight})`,
                  borderRadius: "14px", py: 1.4, color: T.white, fontWeight: 700, textTransform: "none"
                }}
              >
                View Full Details
              </Button>
            </Box>
          )}
        </SwipeableDrawer>

        {/* ── SNACKBAR ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar(s => ({ ...s, open: false }))}
            sx={{
              borderRadius: "14px",
              background: snackbar.severity === "success"
                ? `linear-gradient(135deg, ${T.green}, #15803d)`
                : `linear-gradient(135deg, ${T.red}, #b91c1c)`
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Container>
    </Box>
  );
};

export default OwnerDashboard;