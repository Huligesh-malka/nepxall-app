import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";
import { motion } from "framer-motion";
import { Box, CircularProgress, useTheme, alpha, keyframes } from "@mui/material";
import axios from "axios";

import QRCodeStyling from "qr-code-styling";

import {
  Typography, Box as MuiBox, Button, Grid, Alert, Snackbar,
  Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Card, CardContent,
  Divider, Stack, Tooltip, Container, LinearProgress, SwipeableDrawer, useMediaQuery,
  Tabs, Tab, Badge, Menu, MenuItem, ListItemIcon, ListItemText
} from "@mui/material";

import {
  Add as AddIcon,
  Apartment as ApartmentIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Groups as CommunityIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Hotel as RoomIcon,
  Person as PersonIcon,
  People as OccupantsIcon,
  TrendingUp as TrendingUpIcon,
  QrCodeScanner as QrIcon,
  Edit as EditIcon,
  VideoCameraBack as VideoIcon,
  PhotoCamera as PhotoIcon,
  Campaign as CampaignIcon,
  Close as CloseIcon,
  MoreVert as MoreIcon,
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon
} from "@mui/icons-material";

import StatCard from "../components/owner/StatCard";
import PropertyCard from "../components/owner/PropertyCard";

// API endpoint for owner payments
const PAYMENTS_API = "https://nepxall-backend.onrender.com/api/owner";

/* ---------------- ANIMATIONS ---------------- */
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(11, 94, 215, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(11, 94, 215, 0); }
  100% { box-shadow: 0 0 0 0 rgba(11, 94, 215, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

/* ---------------- HELPERS ---------------- */

const parseArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

const formatCurrency = (amt) => {
  if (!amt && amt !== 0) return "₹0";
  const num = Number(amt);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'confirmed':
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'rejected':
      return 'error';
    case 'completed':
      return 'info';
    default:
      return 'default';
  }
};

const getStatusBadgeStyle = (status) => {
  switch(status?.toLowerCase()) {
    case 'approved':
    case 'confirmed':
      return { bg: '#16a34a', color: '#fff', glow: '#16a34a' };
    case 'pending':
      return { bg: '#f59e0b', color: '#fff', glow: '#f59e0b' };
    case 'rejected':
    case 'cancelled':
      return { bg: '#dc2626', color: '#fff', glow: '#dc2626' };
    case 'completed':
      return { bg: '#0284c7', color: '#fff', glow: '#0284c7' };
    default:
      return { bg: '#6b7280', color: '#fff', glow: '#6b7280' };
  }
};

// Row component for insights display
const Row = ({ label, value, color, icon }) => (
  <Box sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 1.5,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    transition: "all 0.2s ease",
    '&:hover': {
      background: "rgba(255,255,255,0.06)",
      transform: "translateX(4px)"
    }
  }}>
    <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 1 }}>
      {icon && <Box component="span" sx={{ fontSize: "1rem" }}>{icon}</Box>}
      {label}
    </Typography>
    <Typography sx={{ color, fontWeight: "bold", fontSize: "1rem" }}>{value}</Typography>
  </Box>
);

// CountUp animation hook
const useCountUp = (endValue, duration = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);
  return count;
};

/* ---------------- COMPONENT ---------------- */

const OwnerDashboard = () => {

  const navigate = useNavigate();
  const { user, role, loading: authLoading, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pgDetailsMap, setPgDetailsMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Settlement data from payments API
  const [settlementData, setSettlementData] = useState([]);
  const [settlementStats, setSettlementStats] = useState({
    totalSettled: 0,
    totalPending: 0,
    totalAmount: 0,
    settledAmount: 0,
    pendingAmount: 0,
    notJoinedAmount: 0,
    pgBreakdown: []
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    totalEarnings: 0,
    pendingBookings: 0,
    totalBookings: 0,
    avgRating: 0,
    totalEnquiries: 0,
    totalRent: 0,
    totalDeposit: 0,
    pendingRent: 0,
    pendingDeposit: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    cancelledBookings: 0,
    completedBookings: 0
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Animated stats values
  const animatedTotalProperties = useCountUp(stats.totalProperties, 800);
  const animatedTotalRooms = useCountUp(stats.totalRooms, 800);
  const animatedOccupiedRooms = useCountUp(stats.occupiedRooms, 800);
  const animatedPendingBookings = useCountUp(stats.pendingBookings, 800);
  const animatedOccupancyRate = useCountUp(stats.occupancyRate, 800);
  const animatedTotalEarnings = useCountUp(stats.totalEarnings, 1000);
  const animatedMonthlyRevenue = useCountUp(stats.monthlyRevenue, 1000);
  const animatedSettledAmount = useCountUp(settlementStats.settledAmount, 1000);
  const animatedPendingAmount = useCountUp(settlementStats.pendingAmount, 1000);
  const animatedNotJoinedAmount = useCountUp(settlementStats.notJoinedAmount, 1000);

  /* ---------------- HELPER FUNCTION TO GET RENT BY ROOM TYPE ---------------- */
  
  const getRentByRoomType = (pg, roomType) => {
    if (!pg) return 0;
    
    const roomTypeLower = roomType?.toLowerCase() || '';
    
    if (roomTypeLower.includes('single sharing')) {
      return Number(pg.single_sharing) || Number(pg.single_room) || Number(pg.co_living_single_room) || Number(pg.rent_amount) || 0;
    }
    else if (roomTypeLower.includes('double sharing')) {
      return Number(pg.double_sharing) || Number(pg.double_room) || Number(pg.co_living_double_room) || 0;
    }
    else if (roomTypeLower.includes('triple sharing')) {
      return Number(pg.triple_sharing) || Number(pg.triple_room) || 0;
    }
    else if (roomTypeLower.includes('four sharing')) {
      return Number(pg.four_sharing) || 0;
    }
    else if (roomTypeLower.includes('1bhk') || roomTypeLower.includes('1 bhk')) {
      return Number(pg.price_1bhk) || 0;
    }
    else if (roomTypeLower.includes('2bhk') || roomTypeLower.includes('2 bhk')) {
      return Number(pg.price_2bhk) || 0;
    }
    else if (roomTypeLower.includes('3bhk') || roomTypeLower.includes('3 bhk')) {
      return Number(pg.price_3bhk) || 0;
    }
    else if (roomTypeLower.includes('4bhk') || roomTypeLower.includes('4 bhk')) {
      return Number(pg.price_4bhk) || 0;
    }
    else {
      return Number(pg.rent_amount) || 0;
    }
  };

  const getDepositByRoomType = (pg, roomType) => {
    if (!pg) return 0;
    return Number(pg.security_deposit) || Number(pg.deposit_amount) || 0;
  };

  // 🔥 UPDATED: Fetch settlement data from payments API with new logic
  const fetchSettlementData = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const res = await axios.get(`${PAYMENTS_API}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const payments = res.data.data || [];
      setSettlementData(payments);
      
      // 🔥 NEW SETTLEMENT LOGIC (MATCH PAYMENTS PAGE)
      const settled = payments.filter(p => p.owner_settlement === "DONE");
      const pending = payments.filter(p => p.owner_settlement !== "DONE");
      
      // ✅ Joined (REAL MONEY)
      const joinedAmount = payments
        .filter(p => p.owner_settlement === "DONE" && p.join_status === "JOINED")
        .reduce((sum, p) => sum + (parseFloat(p.owner_amount) || 0), 0);
      
      // ⚠️ Not Joined (RISK)
      const notJoinedAmount = payments
        .filter(p => p.owner_settlement === "DONE" && p.join_status !== "JOINED")
        .reduce((sum, p) => sum + (parseFloat(p.owner_amount) || 0), 0);
      
      // 💰 Total
      const totalAmount = payments
        .reduce((sum, p) => sum + (parseFloat(p.owner_amount) || 0), 0);
      
      // ⏳ Pending
      const pendingAmount = payments
        .filter(p => p.owner_settlement !== "DONE")
        .reduce((sum, p) => sum + (parseFloat(p.owner_amount) || 0), 0);
      
      // 🔥 UPDATED: Group by PG with join_status logic
      const pgMap = new Map();
      payments.forEach(p => {
        const pgName = p.pg_name || "Unknown PG";
        if (!pgMap.has(pgName)) {
          pgMap.set(pgName, { total: 0, settled: 0, pending: 0, notJoined: 0 });
        }
        const pg = pgMap.get(pgName);
        const amount = parseFloat(p.owner_amount) || 0;
        pg.total += amount;
        
        // 🔥 UPDATED: Only count as settled if owner_settlement === "DONE" AND join_status === "JOINED"
        if (p.owner_settlement === "DONE" && p.join_status === "JOINED") {
          pg.settled += amount;
        } else if (p.owner_settlement === "DONE" && p.join_status !== "JOINED") {
          pg.notJoined = (pg.notJoined || 0) + amount;
        } else if (p.owner_settlement !== "DONE") {
          pg.pending += amount;
        }
      });
      
      const pgBreakdown = Array.from(pgMap.entries()).map(([name, data]) => ({
        name,
        ...data
      }));
      
      // 🔥 UPDATED: Set settlement stats with new fields
      setSettlementStats({
        totalSettled: settled.length,
        totalPending: pending.length,
        totalAmount,
        settledAmount: joinedAmount,
        pendingAmount,
        notJoinedAmount,
        pgBreakdown
      });
      
    } catch (err) {
      console.error("Failed to fetch settlement data:", err);
    }
  }, [user]);

  // Load mock notifications
  const loadNotifications = useCallback(async () => {
    try {
      const mockNotifications = [
        { id: 1, message: "New booking request received", type: "booking", read: false, timestamp: new Date().toISOString() },
        { id: 2, message: "Payment settlement completed for ₹15,000", type: "payment", read: false, timestamp: new Date().toISOString() },
        { id: 3, message: "New review received: 5 stars", type: "review", read: true, timestamp: new Date().toISOString() }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  /* ---------------- LOAD DATA ---------------- */

  const loadAllData = useCallback(async (refresh = false) => {
    try {
      if (!user) return;

      refresh ? setRefreshing(true) : setPageLoading(true);
      console.log("📡 Loading dashboard data...");

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
          deposit_amount: Number(pg.deposit_amount) || 0,
          security_deposit: Number(pg.security_deposit) || 0,
          single_sharing: Number(pg.single_sharing) || 0,
          double_sharing: Number(pg.double_sharing) || 0,
          triple_sharing: Number(pg.triple_sharing) || 0,
          four_sharing: Number(pg.four_sharing) || 0,
          single_room: Number(pg.single_room) || 0,
          double_room: Number(pg.double_room) || 0,
          price_1bhk: Number(pg.price_1bhk) || 0,
          price_2bhk: Number(pg.price_2bhk) || 0,
          price_3bhk: Number(pg.price_3bhk) || 0,
          price_4bhk: Number(pg.price_4bhk) || 0,
          co_living_single_room: Number(pg.co_living_single_room) || 0,
          co_living_double_room: Number(pg.co_living_double_room) || 0,
          triple_room: Number(pg.triple_room) || 0
        };
      });

      setPGs(properties);
      setPgDetailsMap(pgMap);

      const bookingsRes = await pgAPI.getOwnerBookings();
      
      // 🔥🔥🔥 CRITICAL FIX - THE ONLY LINE THAT WAS BROKEN 🔥🔥🔥
      // Backend response: { success: true, count: 10, data: [...] }
      // So we need bookingsRes.data.data (not bookingsRes.data.bookings)
      const bookings = bookingsRes.data?.data || [];
      
      // 🧪 DEBUG LOGS - Add these to verify fix
      console.log("🔍 API RESPONSE:", bookingsRes.data);
      console.log("🔍 BOOKINGS ARRAY (raw):", bookings);
      console.log("🔍 BOOKINGS COUNT:", bookings.length);

      setBookingHistory(bookings);

      const enhancedBookings = bookings.map(booking => {
        const pgId = booking.pg_id || booking.property_id;
        const pg = pgMap[pgId];
        const roomType = booking.room_type || '';
        const monthlyRent = Number(booking.rent_amount) || 0;
        const deposit = getDepositByRoomType(pg, roomType);
        
        // 🔥 IMPORTANT FIX: Use owner_amount from payment data or fallback to calculated rent
        // Get owner_amount from payment if available, otherwise use monthlyRent
        const ownerAmount = Number(booking.owner_amount) || Number(booking.amount) || monthlyRent || 0;
        
        return {
          ...booking,
          tenant_name: booking.name || booking.tenant_name || 'Unknown',
          tenant_phone: booking.phone || booking.tenant_phone,
          tenant_email: booking.email || booking.tenant_email,
          room_type: booking.room_type || 'Not specified',
          check_in_date: booking.check_in_date || booking.created_at,
          owner_amount: ownerAmount, // 🔥 CRITICAL: Store the correct amount
          amount: ownerAmount, // For backward compatibility
          monthly_rent: monthlyRent,
          deposit_amount: deposit,
          pg_name: booking.pg_name || pg?.pg_name || 'N/A',
          pg_details: pg
        };
      });

      const sortedBookings = enhancedBookings
        .sort((a, b) => new Date(b.created_at || b.check_in_date || 0) - new Date(a.created_at || a.check_in_date || 0))
        .slice(0, 5);

      setRecentBookings(sortedBookings);

      // 🔥 FIXED: Calculate stats using owner_amount and owner_settlement = "DONE"
      const totalRooms = properties.reduce((a, b) => a + (b.total_rooms || 0), 0);
      const availableRooms = properties.reduce((a, b) => a + (b.available_rooms || 0), 0);
      const occupiedRooms = totalRooms - availableRooms;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      const ratings = properties.filter(p => p.avg_rating > 0).map(p => p.avg_rating);
      const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

      // 🔥 CRITICAL FIX: Only count bookings where owner_settlement = "DONE"
      // This matches your business rule: revenue = owner_amount WHERE owner_settlement = DONE
      const paidBookings = enhancedBookings.filter(b => 
        b.owner_settlement === "DONE" || 
        b.payment_status === "DONE" ||
        b.settlement_status === "DONE"
      );
      
      const confirmedBookings = enhancedBookings.filter(b => 
        ["confirmed", "completed", "approved", "active", "left"].includes(b?.status?.toLowerCase())
      );
      
      // ✅ FIX 2: CORRECT STATUS MAPPING FOR BOOKING COUNTS
      // Using 'rejected' for cancelled bookings (matches your DB)
      const pendingBookingsList = enhancedBookings.filter(b => 
        b?.status?.toLowerCase() === "pending" || 
        b?.status?.toLowerCase() === "approved"
      );
      
      // ✅ FIX 3: CANCELLED = 'rejected' from your DB
      const cancelledBookingsList = enhancedBookings.filter(b => 
        b?.status?.toLowerCase() === "rejected" || 
        b?.status?.toLowerCase() === "cancelled"
      );
      
      // ✅ FIX 4: COMPLETED = 'confirmed' or 'left' from your DB
      const completedBookingsList = enhancedBookings.filter(b =>
        b?.status?.toLowerCase() === "confirmed" ||
        b?.status?.toLowerCase() === "left"
      );

      // 🔥 REVENUE CALCULATION: Use owner_amount from paid bookings only
      const totalEarnings = paidBookings.reduce((a, b) => a + (Number(b.owner_amount) || 0), 0);
      
      const totalRent = paidBookings.reduce((a, b) => a + (Number(b.rent_amount) || 0), 0);
      const totalDeposit = paidBookings.reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);
      const pendingRent = pendingBookingsList.reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);
      const pendingDeposit = pendingBookingsList.reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);

      // 🔥 MONTHLY REVENUE: Only paid bookings in current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = paidBookings
        .filter(b => {
          const bookingDate = new Date(b.created_at || b.check_in_date);
          return bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear;
        })
        .reduce((a, b) => a + (Number(b.owner_amount) || 0), 0);

      // 🔥 YEARLY REVENUE: Only paid bookings in current year
      const yearlyRevenue = paidBookings
        .filter(b => {
          const bookingDate = new Date(b.created_at || b.check_in_date);
          return bookingDate.getFullYear() === currentYear;
        })
        .reduce((a, b) => a + (Number(b.owner_amount) || 0), 0);

      // ✅ FIX 1: Use enhancedBookings.length for total bookings (NOT raw bookings)
      const totalBookings = enhancedBookings.length;
      const pendingBookingsCount = pendingBookingsList.length;

      // 🧪 DEBUG LOGS - Add these to verify data
      console.log("📊 RAW BOOKINGS (from API):", bookings.length);
      console.log("📊 ENHANCED BOOKINGS:", enhancedBookings.length);
      console.log("📊 Total Bookings Count:", totalBookings);
      console.log("📊 Pending Bookings:", pendingBookingsCount);
      console.log("📊 Cancelled/Rejected Bookings:", cancelledBookingsList.length);
      console.log("📊 Completed/Confirmed Bookings:", completedBookingsList.length);
      console.log("📊 Total Earnings:", totalEarnings);
      console.log("📊 Monthly Revenue:", monthlyRevenue);

      setStats({
        totalProperties: properties.length,
        totalRooms,
        availableRooms,
        occupiedRooms,
        occupancyRate,
        totalEarnings,
        pendingBookings: pendingBookingsCount,
        totalBookings: totalBookings, // ✅ FIX 1 APPLIED
        avgRating,
        totalEnquiries: recentEnquiries.length,
        totalRent,
        totalDeposit,
        pendingRent,
        pendingDeposit,
        monthlyRevenue,
        yearlyRevenue,
        cancelledBookings: cancelledBookingsList.length, // ✅ FIX 2 & 3 APPLIED
        completedBookings: completedBookingsList.length // ✅ FIX 4 APPLIED
      });

      // Fetch settlement data
      await fetchSettlementData();

      setSnackbar({
        open: true,
        message: "Dashboard loaded successfully",
        severity: "success"
      });

    } catch (err) {
      console.error("❌ Dashboard error:", err?.response?.data || err.message);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to load dashboard",
        severity: "error"
      });
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, [user, recentEnquiries.length, fetchSettlementData]);

  /* ---------------- AUTH + LOAD ================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (user && role === "owner") {
      loadAllData();
      loadNotifications();
    }
  }, [user, role, authLoading, navigate, loadAllData, loadNotifications]);

  /* ---------------- HANDLERS ---------------- */

  const handleRefresh = () => {
    loadAllData(true);
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/pg/${propertyId}`);
  };

  const handleEditProperty = (propertyId) => {
    navigate(`/owner/edit/${propertyId}`);
  };

  const handleManageRooms = (propertyId) => {
    navigate(`/owner/rooms/${propertyId}`);
  };

  const handleManagePhotos = (propertyId) => {
    navigate(`/owner/photos/${propertyId}`);
  };

  const handleManageVideos = (propertyId) => {
    navigate(`/owner/videos/${propertyId}`);
  };

  const handleChat = (propertyId) => {
    navigate(`/owner/pg-chat/${propertyId}`);
  };

  const handleAnnouncement = (propertyId) => {
    navigate(`/owner/pg-chat/${propertyId}?mode=announcement`);
  };

  const handleCreatePlan = (propertyId) => {
    navigate(`/owner/property/${propertyId}/plans`);
  };

  const handleViewBooking = (bookingId) => {
    navigate(`/owner/bookings/${bookingId}`);
  };

  const handleViewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setBookingDetailsOpen(true);
  };

  const handleGenerateQR = async (propertyId) => {
    try {
      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      setSelectedProperty(property);
      
      const url = `https://nepxall-app.vercel.app/scan/${propertyId}`;

      const qr = new QRCodeStyling({
        width: 400,
        height: 400,
        data: url,
        dotsOptions: { type: "square", color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "square", color: "#000000" },
        cornersDotOptions: { type: "square", color: "#000000" }
      });

      const qrBlob = await qr.getRawData("png");
      const qrUrl = URL.createObjectURL(qrBlob);
      setQrImageUrl(qrUrl);
      setQrOpen(true);
      
    } catch (err) {
      console.error("QR Generation Error:", err);
      setSnackbar({ open: true, message: "Failed to generate QR code", severity: "error" });
    }
  };

  const handleDownloadQRPoster = async () => {
    if (!selectedProperty) return;
    
    try {
      const BRAND_BLUE = "#0B5ED7";
      const BRAND_GREEN = "#4CAF50";
      const propertyName = selectedProperty?.pg_name || "PG";
      const propertyId = selectedProperty?.id || selectedProperty?.pg_id;
      const url = `https://nepxall-app.vercel.app/scan/${propertyId}`;

      const qr = new QRCodeStyling({
        width: 600,
        height: 600,
        data: url,
        dotsOptions: { type: "square", color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "square", color: "#000000" },
        cornersDotOptions: { type: "square", color: "#000000" }
      });

      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1100;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#F9FAFB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "center";

      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = "/logo.png";

      logo.onload = async () => {
        ctx.drawImage(logo, 350, 40, 200, 110);
        
        ctx.font = "900 54px Arial";
        const gradient = ctx.createLinearGradient(360, 210, 540, 210);
        gradient.addColorStop(0, BRAND_BLUE);
        gradient.addColorStop(1, BRAND_GREEN);
        ctx.fillStyle = gradient;
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 2;
        ctx.fillText("Nepxall", 450, 210);
        ctx.shadowColor = "transparent";
        
        ctx.font = "26px Arial";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Next Places for Living", 450, 250);
        
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "#111827";
        ctx.fillText(propertyName.toUpperCase(), 450, 320);
        
        ctx.font = "26px Arial";
        ctx.fillStyle = BRAND_BLUE;
        ctx.fillText("Scan QR to View Rooms", 450, 380);
        
        ctx.font = "24px Arial";
        ctx.fillStyle = "#6B7280";
        ctx.fillText("Book Instantly Online", 450, 415);
        
        const qrBlob = await qr.getRawData("png");
        const qrImg = new Image();
        qrImg.src = URL.createObjectURL(qrBlob);
        
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 150, 450, 600, 600);
          ctx.font = "22px Arial";
          ctx.fillStyle = "#6B7280";
          ctx.fillText("Powered by Nepxall", 450, 1080);
          
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `nepxall-${propertyName}-entrance-qr.png`;
          link.click();
        };
      };
    } catch (err) {
      console.error("Poster Download Error:", err);
    }
  };

  const handleExportReport = () => {
    const headers = ["Property", "Tenant", "Check-in Date", "Room Type", "Monthly Rent", "Owner Amount", "Status", "Settlement Status"];
    const rows = bookingHistory.map(booking => {
      const settlement = settlementData.find(s => s.booking_id === booking.id);
      return [
        booking.pg_name || "N/A",
        booking.name || booking.tenant_name || "Unknown",
        formatDate(booking.check_in_date || booking.created_at),
        booking.room_type || "Not specified",
        formatCurrency(booking.monthly_rent || 0),
        formatCurrency(booking.owner_amount || 0),
        booking.status || "Pending",
        settlement?.owner_settlement === "DONE" ? "Settled" : (settlement?.admin_settlement === "DONE" ? "Pending Settlement" : "Not Processed")
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSnackbar({ open: true, message: "Report exported successfully", severity: "success" });
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
    setUnreadCount(0);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const greeting = getGreeting();
  const ownerName = user?.name?.split(' ')[0] || 'Owner';

  const handleViewSettlements = () => {
    navigate("/owner/payments");
  };

  /* ================= PROTECTION ================= */
  if (authLoading || pageLoading) {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0f1a 0%, #0f1724 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <CircularProgress size={80} thickness={3} sx={{ color: '#4CAF50' }} />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
              animation: `${pulseGlow} 1.5s infinite`,
            }}
          />
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#fff', 
            fontWeight: 500,
            background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  /* ---------------- UI ---------------- */

  // Styles for insights cards
  const insightCardStyle = {
    background: "rgba(15, 23, 36, 0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: isMobile ? 2 : 3,
    transition: "all 0.3s ease",
    height: "100%",
    animation: `${slideUp} 0.5s ease-out`,
    '&:hover': {
      transform: "translateY(-4px)",
      borderColor: "rgba(76, 175, 80, 0.3)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
    }
  };

  const insightTitleStyle = {
    color: "#fff",
    fontWeight: 600,
    marginBottom: 2,
    display: "flex",
    alignItems: "center",
    gap: 1,
    fontSize: isMobile ? "1rem" : "1.1rem"
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 20% 30%, rgba(11, 94, 215, 0.08), rgba(0, 0, 0, 0.95)), linear-gradient(135deg, #0a0f1a 0%, #0f1724 100%)',
        position: 'relative',
        overflowX: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(76, 175, 80, 0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}
    >
      {/* Animated background mesh */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: 'radial-gradient(circle, rgba(11,94,215,0.15) 0%, transparent 70%)',
            animation: `${float} 20s ease-in-out infinite`,
          }
        }}
      />

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
        
        {/* FLOATING HEADER */}
        <Box
          component={motion ? motion.div : "div"}
          {...(motion ? { initial: { y: -50, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.6, type: "spring", stiffness: 100 } } : {})}
          sx={{
            position: 'sticky',
            top: 16,
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            background: 'rgba(15, 23, 36, 0.7)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            mb: 4,
            p: { xs: 1.5, md: 2 },
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#4CAF50',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem'
                }}
              >
                {greeting}
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}
              >
                {ownerName}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <IconButton 
                onClick={handleNotificationOpen}
                sx={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  color: '#fff',
                  '&:hover': { background: 'rgba(76, 175, 80, 0.2)' }
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  color: '#fff',
                  '&:hover': {
                    background: 'rgba(76, 175, 80, 0.2)',
                    transform: 'rotate(180deg)'
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>

              <Tooltip title="Export Report">
                <IconButton 
                  onClick={handleExportReport}
                  sx={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    color: '#fff',
                    '&:hover': { background: 'rgba(139, 92, 246, 0.2)' }
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>

              {!isSmall && (
                <>
                  <Button
                    startIcon={<ChatIcon />}
                    onClick={() => navigate("/owner/chats")}
                    sx={{
                      background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                      borderRadius: '24px',
                      px: 3,
                      py: 1,
                      color: '#fff',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)'
                      }
                    }}
                  >
                    Chats
                  </Button>

                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/owner/add")}
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '24px',
                      px: 3,
                      py: 1,
                      color: '#fff',
                      fontWeight: 600,
                      textTransform: 'none',
                      border: '1px solid rgba(255,255,255,0.2)',
                      '&:hover': {
                        background: 'rgba(76, 175, 80, 0.2)',
                        borderColor: '#4CAF50'
                      }
                    }}
                  >
                    Add Property
                  </Button>
                </>
              )}

              <IconButton 
                onClick={handleMenuOpen}
                sx={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  color: '#fff',
                  '&:hover': { background: 'rgba(76, 175, 80, 0.2)' }
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#4CAF50' }}>
                  {ownerName.charAt(0)}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              background: 'rgba(15, 23, 36, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              mt: 1,
              minWidth: 200
            }
          }}
        >
          <MenuItem onClick={() => { handleMenuClose(); navigate("/owner/profile"); }}>
            <ListItemIcon><PersonIcon fontSize="small" sx={{ color: '#4CAF50' }} /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate("/owner/settings"); }}>
            <ListItemIcon><SettingsIcon fontSize="small" sx={{ color: '#0B5ED7' }} /></ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate("/owner/payments"); }}>
            <ListItemIcon><ReceiptIcon fontSize="small" sx={{ color: '#8B5CF6' }} /></ListItemIcon>
            <ListItemText>Settlements</ListItemText>
          </MenuItem>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#dc2626' }} /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

        {/* Notifications Dropdown */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              background: 'rgba(15, 23, 36, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              mt: 1,
              width: 320,
              maxHeight: 400
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography sx={{ color: '#fff', fontWeight: 600 }}>Notifications</Typography>
          </Box>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ color: '#94a3b8' }}>No notifications</Typography>
            </Box>
          ) : (
            notifications.map(notif => (
              <MenuItem key={notif.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Typography sx={{ color: '#fff', fontSize: '0.85rem' }}>{notif.message}</Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                  {formatDate(notif.timestamp)}
                </Typography>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* STATS CARDS - Responsive Grid */}
        <Box sx={{ mb: 5 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={6} md={4} lg={2}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05))',
                backdropFilter: 'blur(10px)',
                borderRadius: '28px',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #4CAF50, #0B5ED7)',
                  borderRadius: '28px 28px 0 0',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>PROPERTIES</Typography>
                    <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 800, color: '#4CAF50', lineHeight: 1 }}>
                      {animatedTotalProperties}
                    </Typography>
                  </Box>
                  <ApartmentIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#4CAF50', opacity: 0.7 }} />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={6} md={4} lg={2}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(11, 94, 215, 0.15), rgba(11, 94, 215, 0.05))',
                backdropFilter: 'blur(10px)',
                borderRadius: '28px',
                border: '1px solid rgba(11, 94, 215, 0.3)',
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #0B5ED7, #4CAF50)',
                  borderRadius: '28px 28px 0 0',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>TOTAL ROOMS</Typography>
                    <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 800, color: '#0B5ED7', lineHeight: 1 }}>
                      {animatedTotalRooms}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#4CAF50' }}>
                      {stats.availableRooms} avail
                    </Typography>
                  </Box>
                  <RoomIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#0B5ED7', opacity: 0.7 }} />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={6} md={4} lg={2}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
                backdropFilter: 'blur(10px)',
                borderRadius: '28px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #8B5CF6, #4CAF50)',
                  borderRadius: '28px 28px 0 0',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>OCCUPANCY</Typography>
                    <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 800, color: '#8B5CF6', lineHeight: 1 }}>
                      {animatedOccupancyRate}%
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#8B5CF6', opacity: 0.7 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.occupancyRate} 
                  sx={{ 
                    mt: 1.5, 
                    borderRadius: '10px', 
                    height: 4,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #8B5CF6, #4CAF50)',
                      borderRadius: '10px'
                    }
                  }} 
                />
              </Box>
            </Grid>

            <Grid item xs={6} sm={6} md={4} lg={2}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
                backdropFilter: 'blur(10px)',
                borderRadius: '28px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #f59e0b, #dc2626)',
                  borderRadius: '28px 28px 0 0',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>PENDING</Typography>
                    <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                      {animatedPendingBookings}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#f59e0b', opacity: 0.7 }} />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={6} md={4} lg={2}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05))',
                backdropFilter: 'blur(10px)',
                borderRadius: '28px',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>MONTHLY REVENUE</Typography>
                    <Typography sx={{ fontSize: { xs: '1rem', sm: '1.4rem' }, fontWeight: 800, color: '#4CAF50', lineHeight: 1 }}>
                      {formatCurrency(animatedMonthlyRevenue)}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#4CAF50', opacity: 0.7 }} />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={6} md={4} lg={2}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))',
                backdropFilter: 'blur(10px)',
                borderRadius: '28px',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>RATING</Typography>
                    <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 800, color: '#eab308', lineHeight: 1 }}>
                      {stats.avgRating}
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5, mt: 0.5 }}>
                      {[1,2,3,4,5].map(star => (
                        <StarIcon key={star} sx={{ fontSize: 12, color: star <= stats.avgRating ? '#eab308' : '#475569' }} />
                      ))}
                    </Box>
                  </Box>
                  <StarIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: '#eab308', opacity: 0.7 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* AVAILABILITY ALERT */}
        {stats.availableRooms > 0 && (
          <Box sx={{
            background: 'rgba(76, 175, 80, 0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            border: '1px solid rgba(76, 175, 80, 0.4)',
            p: { xs: 1.5, sm: 2 },
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            animation: `${pulseGlow} 2s infinite`
          }}>
            <CommunityIcon sx={{ color: '#4CAF50', fontSize: { xs: 24, sm: 28 } }} />
            <Typography sx={{ color: '#e2e8f0', flex: 1, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
              <strong style={{ color: '#4CAF50', fontSize: { xs: '1rem', sm: '1.2rem' } }}>{stats.availableRooms}</strong> rooms available across your properties
            </Typography>
            <Button size="small" onClick={() => navigate("/owner/add")} sx={{ color: '#4CAF50', borderColor: '#4CAF50' }} variant="outlined">
              Manage
            </Button>
          </Box>
        )}

        {/* TABS SECTION */}
        <Box sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, v) => setActiveTab(v)}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTab-root': {
                color: '#94a3b8',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: { xs: '0.85rem', sm: '1rem' },
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 2, sm: 3 },
                '&.Mui-selected': { color: '#4CAF50' }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4CAF50',
                height: 3,
                borderRadius: '3px'
              }
            }}
          >
            <Tab label="Properties" icon={<ApartmentIcon />} iconPosition="start" />
            <Tab label="Recent Bookings" icon={<ReceiptIcon />} iconPosition="start" />
            <Tab label="Insights" icon={<TrendingUpIcon />} iconPosition="start" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
           {/* Properties Tab */}
{activeTab === 0 && (
  <>
    {pgs.length === 0 ? (
      <Box sx={{
        background: 'rgba(15, 23, 36, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        border: '1px solid rgba(255,255,255,0.1)',
        p: { xs: 3, md: 6 },
        textAlign: 'center'
      }}>
        <ApartmentIcon sx={{ fontSize: 80, color: '#4CAF50', mb: 2, opacity: 0.7 }} />
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>No properties yet</Typography>
        <Typography sx={{ color: '#94a3b8', mb: 3 }}>Start by adding your first property to begin managing bookings and tenants.</Typography>
        <Button startIcon={<AddIcon />} onClick={() => navigate("/owner/add")} sx={{
          background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
          borderRadius: '30px',
          px: 4,
          py: 1.5,
          color: '#fff',
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '1rem'
        }}>Add Your First Property</Button>
      </Box>
    ) : (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {pgs.map((pg) => (
          <PropertyCard
            key={pg.id || pg.pg_id}
            property={pg}
            onView={() => handleViewProperty(pg.id || pg.pg_id)}
            onEdit={() => handleEditProperty(pg.id || pg.pg_id)}
            onRooms={() => handleManageRooms(pg.id || pg.pg_id)}
            onPhotos={() => handleManagePhotos(pg.id || pg.pg_id)}
            onVideos={() => handleManageVideos(pg.id || pg.pg_id)}
            onChat={() => handleChat(pg.id || pg.pg_id)}
            onAnnouncement={() => handleAnnouncement(pg.id || pg.pg_id)}
            onCreatePlan={pg.pg_category === "coliving" ? () => handleCreatePlan(pg.id || pg.pg_id) : null}
            onGenerateQR={() => handleGenerateQR(pg.id || pg.pg_id)}
            onToggleStatus={() => {
              // Optional: Add toggle status functionality
              console.log("Toggle status for:", pg.id);
            }}
          />
        ))}
      </Box>
    )}
  </>
)}

            {/* Recent Bookings Tab */}
            {activeTab === 1 && (
              <Box>
                {recentBookings.length === 0 ? (
                  <Box sx={{ background: 'rgba(15, 23, 36, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '24px', p: 4, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography sx={{ color: '#94a3b8' }}>No bookings yet</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recentBookings.map((booking) => {
                      const statusStyle = getStatusBadgeStyle(booking.status);
                      const monthlyRent = booking.monthly_rent || 0;
                      const ownerAmount = booking.owner_amount || 0;
                      const isSettled = booking.owner_settlement === "DONE";
                      return (
                        <Box key={booking.id} sx={{
                          background: 'rgba(15, 23, 36, 0.7)',
                          backdropFilter: 'blur(12px)',
                          borderRadius: '24px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          p: { xs: 1.5, sm: 2 },
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'rgba(76, 175, 80, 0.3)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                            transform: 'translateX(5px)'
                          }
                        }} onClick={() => handleViewBookingDetails(booking)}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: { xs: '100%', sm: 180 } }}>
                              <Avatar sx={{ width: 50, height: 50, bgcolor: '#4CAF50', background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)' }}>{booking.tenant_name?.charAt(0) || 'U'}</Avatar>
                              <Box>
                                <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>{booking.tenant_name}</Typography>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon sx={{ fontSize: 12 }} />{booking.tenant_phone || 'Hidden'}</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 150 } }}>
                              <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Property</Typography>
                              <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>{booking.pg_name}</Typography>
                              <Typography sx={{ color: '#8B5CF6', fontSize: '0.75rem' }}>{booking.room_type}</Typography>
                            </Box>
                            <Box sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                              <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Check-in</Typography>
                              <Typography sx={{ color: '#fff', fontSize: '0.85rem' }}>{formatDate(booking.check_in_date)}</Typography>
                            </Box>
                            <Box sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                              <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Owner Amount</Typography>
                              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: isSettled ? '#4CAF50' : '#f59e0b' }}>
                                {formatCurrency(ownerAmount)}
                              </Typography>
                            </Box>
                            <Box sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                              <Chip 
                                label={isSettled ? "SETTLED" : (booking.owner_settlement === "PENDING" ? "PENDING" : (booking.status?.toUpperCase() || 'PENDING'))} 
                                size="small" 
                                sx={{ 
                                  bgcolor: isSettled ? '#4CAF50' : (booking.owner_settlement === "PENDING" ? '#f59e0b' : statusStyle.bg), 
                                  color: '#fff', 
                                  fontWeight: 600, 
                                  fontSize: '0.7rem', 
                                  minWidth: 90 
                                }} 
                              />
                            </Box>
                            <IconButton onClick={(e) => { e.stopPropagation(); handleViewBooking(booking.id); }} sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '14px', color: '#fff', '&:hover': { bgcolor: '#0B5ED7' } }}><ViewIcon fontSize="small" /></IconButton>
                          </Box>
                        </Box>
                      );
                    })}
                    {stats.totalBookings > 5 && (
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button onClick={() => navigate("/owner/bookings")} endIcon={<ViewIcon />} sx={{ color: '#4CAF50' }}>View All Bookings</Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Insights Tab - Updated with new Settlement Summary UI */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                {/* Revenue Summary */}
                <Grid item xs={12} md={6}>
                  <Box sx={insightCardStyle}>
                    <Typography sx={insightTitleStyle}>
                      <MoneyIcon sx={{ color: '#4CAF50' }} /> Revenue Summary
                    </Typography>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                    
                    <Row 
                      label="Total Earnings" 
                      value={formatCurrency(stats.totalEarnings)} 
                      color="#4CAF50"
                      icon="💰"
                    />
                    <Row 
                      label="Monthly Revenue" 
                      value={formatCurrency(stats.monthlyRevenue)} 
                      color="#0B5ED7"
                      icon="📅"
                    />
                    <Row 
                      label="Yearly Revenue" 
                      value={formatCurrency(stats.yearlyRevenue)} 
                      color="#8B5CF6"
                      icon="📊"
                    />
                    <Row 
                      label="Total Rent Collected" 
                      value={formatCurrency(stats.totalRent)} 
                      color="#fff"
                      icon="🏠"
                    />
                    <Row 
                      label="Total Deposit Collected" 
                      value={formatCurrency(stats.totalDeposit)} 
                      color="#4CAF50"
                      icon="🏦"
                    />
                  </Box>
                </Grid>

                {/* Booking Summary */}
                <Grid item xs={12} md={6}>
                  <Box sx={insightCardStyle}>
                    <Typography sx={insightTitleStyle}>
                      <ReceiptIcon sx={{ color: '#f59e0b' }} /> Booking Summary
                    </Typography>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                    
                    <Row 
                      label="Total Bookings" 
                      value={stats.totalBookings} 
                      color="#fff"
                      icon="📋"
                    />
                    <Row 
                      label="Completed" 
                      value={stats.completedBookings} 
                      color="#4CAF50"
                      icon="✅"
                    />
                    <Row 
                      label="Pending" 
                      value={stats.pendingBookings} 
                      color="#f59e0b"
                      icon="⏳"
                    />
                    <Row 
                      label="Cancelled" 
                      value={stats.cancelledBookings} 
                      color="#dc2626"
                      icon="❌"
                    />
                  </Box>
                </Grid>

                {/* 🔥 UPDATED: Settlement Summary with new PRO UI */}
                <Grid item xs={12}>
                  <Box sx={{
                    background: 'rgba(15, 23, 36, 0.7)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    p: { xs: 2, sm: 3 }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BankIcon sx={{ color: '#8B5CF6' }} /> Settlement Summary
                      </Typography>
                      <Button size="small" onClick={handleViewSettlements} sx={{ color: '#4CAF50' }}>View Details →</Button>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                    
                    {/* 🔥 NEW PRO UI CARDS */}
                    <Grid container spacing={2}>
                      {/* ✅ Joined (REAL MONEY) */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          bgcolor: "#052e16", 
                          p: { xs: 1.5, sm: 2 }, 
                          borderRadius: 3,
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)'
                          }
                        }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                            Joined Earnings
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
                            {formatCurrency(animatedSettledAmount)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: '#4CAF50', mt: 0.5 }}>
                            ✅ Real profit
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {/* ⚠️ Not Joined (RISK) */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          bgcolor: "#3f1d02", 
                          p: { xs: 1.5, sm: 2 }, 
                          borderRadius: 3,
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.2)'
                          }
                        }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                            Not Joined
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
                            {formatCurrency(animatedNotJoinedAmount)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: '#f59e0b', mt: 0.5 }}>
                            
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {/* ⏳ Pending Settlement */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          bgcolor: "#1e293b", 
                          p: { xs: 1.5, sm: 2 }, 
                          borderRadius: 3,
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)'
                          }
                        }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                            Pending
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#eab308', fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
                            {formatCurrency(animatedPendingAmount)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: '#eab308', mt: 0.5 }}>
                            ⏳ Coming soon
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* PG-wise Breakdown with updated logic */}
                    {settlementStats.pgBreakdown.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>PG-wise Breakdown</Typography>
                        <Stack spacing={1}>
                          {settlementStats.pgBreakdown.map((pg) => (
                            <Box key={pg.name} sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              p: 1.5, 
                              background: 'rgba(255,255,255,0.03)', 
                              borderRadius: '12px', 
                              flexWrap: 'wrap', 
                              gap: 1,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.06)'
                              }
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ApartmentIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                                <Typography sx={{ color: '#fff', fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>{pg.name}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total: {formatCurrency(pg.total)}</Typography>
                                {pg.settled > 0 && <Typography sx={{ color: '#4CAF50', fontSize: '0.75rem' }}>✅ Joined: {formatCurrency(pg.settled)}</Typography>}
                                {pg.notJoined > 0 && <Typography sx={{ color: '#f59e0b', fontSize: '0.75rem' }}>⚠️ Not Joined: {formatCurrency(pg.notJoined)}</Typography>}
                                {pg.pending > 0 && <Typography sx={{ color: '#eab308', fontSize: '0.75rem' }}>⏳ Pending: {formatCurrency(pg.pending)}</Typography>}
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>

        {/* QR Code Preview Modal */}
        <SwipeableDrawer
          anchor="bottom"
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen
          sx={{
            '& .MuiDrawer-paper': {
              background: 'rgba(15, 23, 36, 0.95)',
              backdropFilter: 'blur(20px)',
              borderTopLeftRadius: '32px',
              borderTopRightRadius: '32px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              p: 3
            }
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setQrOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
            </Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>{selectedProperty?.pg_name || 'Property'} QR Code</Typography>
            {qrImageUrl && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, animation: `${float} 2s ease-in-out infinite` }}>
                <img src={qrImageUrl} alt="QR Code" style={{ width: 250, height: 250, borderRadius: '24px', boxShadow: '0 0 30px rgba(76, 175, 80, 0.3)' }} />
              </Box>
            )}
            <Typography sx={{ color: '#94a3b8', mb: 3 }}>Scan to view property details and book instantly</Typography>
            <Button fullWidth onClick={handleDownloadQRPoster} sx={{ background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)', borderRadius: '30px', py: 1.5, color: '#fff', fontWeight: 600, textTransform: 'none', mb: 2 }}>Download Poster</Button>
            <Button fullWidth variant="outlined" onClick={() => setQrOpen(false)} sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '30px', py: 1.5, '&:hover': { borderColor: '#4CAF50' } }}>Close</Button>
          </Box>
        </SwipeableDrawer>

        {/* Booking Details Dialog */}
        <SwipeableDrawer
          anchor="bottom"
          open={bookingDetailsOpen}
          onClose={() => setBookingDetailsOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen
          sx={{
            '& .MuiDrawer-paper': {
              background: 'rgba(15, 23, 36, 0.95)',
              backdropFilter: 'blur(20px)',
              borderTopLeftRadius: '32px',
              borderTopRightRadius: '32px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              p: 3,
              maxHeight: '80vh'
            }
          }}
        >
          {selectedBooking && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Booking Details</Typography>
                <IconButton onClick={() => setBookingDetailsOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Tenant Name</Typography><Typography sx={{ color: '#fff', fontWeight: 500 }}>{selectedBooking.tenant_name}</Typography></Grid>
                <Grid item xs={6}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Phone</Typography><Typography sx={{ color: '#fff' }}>{selectedBooking.tenant_phone || 'Hidden'}</Typography></Grid>
                <Grid item xs={6}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Email</Typography><Typography sx={{ color: '#fff' }}>{selectedBooking.tenant_email || 'Not provided'}</Typography></Grid>
                <Grid item xs={12}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Property</Typography><Typography sx={{ color: '#fff' }}>{selectedBooking.pg_name}</Typography></Grid>
                <Grid item xs={6}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Room Type</Typography><Typography sx={{ color: '#8B5CF6' }}>{selectedBooking.room_type}</Typography></Grid>
                <Grid item xs={6}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Check-in Date</Typography><Typography sx={{ color: '#fff' }}>{formatDate(selectedBooking.check_in_date)}</Typography></Grid>
                <Grid item xs={6}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Owner Amount</Typography><Typography sx={{ color: '#4CAF50', fontWeight: 600 }}>{formatCurrency(selectedBooking.owner_amount)}</Typography></Grid>
                <Grid item xs={6}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Monthly Rent</Typography><Typography sx={{ color: '#8B5CF6', fontWeight: 600 }}>{formatCurrency(selectedBooking.monthly_rent)}</Typography></Grid>
                <Grid item xs={6}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Deposit Amount</Typography><Typography sx={{ color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(selectedBooking.deposit_amount)}</Typography></Grid>
                <Grid item xs={12}><Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Settlement Status</Typography>
                  <Chip 
                    label={selectedBooking.owner_settlement === "DONE" ? "SETTLED" : (selectedBooking.owner_settlement === "PENDING" ? "PENDING SETTLEMENT" : "NOT PROCESSED")} 
                    sx={{ 
                      bgcolor: selectedBooking.owner_settlement === "DONE" ? '#4CAF50' : '#f59e0b', 
                      color: '#fff', 
                      fontWeight: 600, 
                      mt: 0.5 
                    }} 
                  />
                </Grid>
              </Grid>
              <Button fullWidth onClick={() => { setBookingDetailsOpen(false); handleViewBooking(selectedBooking.id); }} sx={{ mt: 3, background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)', borderRadius: '30px', py: 1.5, color: '#fff', fontWeight: 600, textTransform: 'none' }}>View Full Details</Button>
            </Box>
          )}
        </SwipeableDrawer>

        {/* Floating Assistant Button */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, animation: `${float} 3s ease-in-out infinite` }}>
          <IconButton onClick={() => setSnackbar({ open: true, message: "Need help? Contact support", severity: "info" })} sx={{ background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)', width: 56, height: 56, boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)', '&:hover': { transform: 'scale(1.1)', boxShadow: '0 8px 30px rgba(76, 175, 80, 0.6)' }, transition: 'all 0.3s ease' }}><ChatIcon sx={{ color: '#fff' }} /></IconButton>
        </Box>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%', borderRadius: '20px', background: snackbar.severity === 'success' ? 'linear-gradient(135deg, #4CAF50, #2e7d32)' : snackbar.severity === 'error' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #0B5ED7, #1e40af)' }}>{snackbar.message}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
};

export default OwnerDashboard;