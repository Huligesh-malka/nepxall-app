import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";
import { Box, CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import QRCodeStyling from "qr-code-styling";
import CountUp from "react-countup";

import {
  Typography,
  Box as MuiBox,
  Button,
  Grid,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Divider,
  Stack,
  Tooltip,
  Container,
  LinearProgress,
  Fade,
  Zoom,
  Slide,
  Grow
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
  QrCodeScanner as QRIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoIcon,
  Videocam as VideoIcon,
  Campaign as AnnounceIcon,
  Dashboard as DashboardIcon,
  ChevronRight as ChevronIcon,
  Close as CloseIcon,
  HelpOutline as HelpIcon,
  Star as StarIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

import StatCard from "../components/owner/StatCard";
import PropertyCard from "../components/owner/PropertyCard";

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
      return { bg: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', glow: '0 0 10px rgba(22,163,74,0.5)' };
    case 'pending':
      return { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', glow: '0 0 10px rgba(245,158,11,0.5)' };
    case 'rejected':
    case 'cancelled':
      return { bg: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', glow: '0 0 10px rgba(220,38,38,0.5)' };
    case 'completed':
      return { bg: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', glow: '0 0 10px rgba(2,132,199,0.5)' };
    default:
      return { bg: 'linear-gradient(135deg, #6b7280, #4b5563)', color: '#fff', glow: 'none' };
  }
};

/* ---------------- ANIMATED COMPONENTS ---------------- */

const GlowingCard = ({ children, delay = 0, className = "", ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

const FloatingIcon = ({ icon, color, delay = 0 }) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0]
    }}
    transition={{ 
      duration: 3, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut" 
    }}
    style={{ 
      display: 'inline-flex',
      filter: `drop-shadow(0 0 15px ${color})`
    }}
  >
    {icon}
  </motion.div>
);

const AnimatedCounter = ({ value, duration = 2, prefix = "", suffix = "" }) => (
  <CountUp
    start={0}
    end={value}
    duration={duration}
    separator=","
    prefix={prefix}
    suffix={suffix}
    useEasing={true}
    useGrouping={true}
  >
    {({ countUpRef }) => <span ref={countUpRef} />}
  </CountUp>
);

/* ---------------- MAIN COMPONENT ---------------- */

const OwnerDashboard = () => {

  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pgDetailsMap, setPgDetailsMap] = useState({});
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [selectedPropertyForQR, setSelectedPropertyForQR] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    pendingDeposit: 0
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Update greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  /* ---------------- LOAD DATA ---------------- */

  const loadAllData = useCallback(async (refresh = false) => {
    try {
      if (!user) return;

      refresh ? setRefreshing(true) : setPageLoading(true);
      console.log("📡 Loading dashboard data...");

      const pgRes = await pgAPI.getOwnerDashboard();
      const pgData = Array.isArray(pgRes.data)
        ? pgRes.data
        : pgRes.data?.data || [];

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
      const bookings = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.bookings || [];

      setBookingHistory(bookings);

      const enhancedBookings = bookings.map(booking => {
        const pgId = booking.pg_id || booking.property_id;
        const pg = pgMap[pgId];
        const roomType = booking.room_type || '';
        const monthlyRent = getRentByRoomType(pg, roomType);
        const deposit = getDepositByRoomType(pg, roomType);
        
        return {
          ...booking,
          tenant_name: booking.name || booking.tenant_name || 'Unknown',
          tenant_phone: booking.phone || booking.tenant_phone,
          tenant_email: booking.email || booking.tenant_email,
          room_type: booking.room_type || 'Not specified',
          check_in_date: booking.check_in_date || booking.created_at,
          amount: Number(booking.amount) || monthlyRent || 0,
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

      const totalRooms = properties.reduce((a, b) => a + (b.total_rooms || 0), 0);
      const availableRooms = properties.reduce((a, b) => a + (b.available_rooms || 0), 0);
      const occupiedRooms = totalRooms - availableRooms;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      const ratings = properties.filter(p => p.avg_rating > 0).map(p => p.avg_rating);
      const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

      const totalRent = enhancedBookings
        .filter(b => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);

      const totalDeposit = enhancedBookings
        .filter(b => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);

      const pendingRent = enhancedBookings
        .filter(b => b?.status?.toLowerCase() === "pending")
        .reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);

      const pendingDeposit = enhancedBookings
        .filter(b => b?.status?.toLowerCase() === "pending")
        .reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);

      const totalEarnings = enhancedBookings
        .filter(b => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const pendingBookings = bookings.filter(b => b?.status?.toLowerCase() === "pending").length;

      setStats({
        totalProperties: properties.length,
        totalRooms,
        availableRooms,
        occupiedRooms,
        occupancyRate,
        totalEarnings,
        pendingBookings,
        totalBookings: bookings.length,
        avgRating,
        totalEnquiries: recentEnquiries.length,
        totalRent,
        totalDeposit,
        pendingRent,
        pendingDeposit
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
  }, [user, recentEnquiries.length]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (user && role === "owner") loadAllData();
  }, [user, role, authLoading, navigate, loadAllData]);

  const handleRefresh = () => loadAllData(true);
  const handleViewProperty = (propertyId) => navigate(`/pg/${propertyId}`);
  const handleEditProperty = (propertyId) => navigate(`/owner/edit/${propertyId}`);
  const handleManageRooms = (propertyId) => navigate(`/owner/rooms/${propertyId}`);
  const handleManagePhotos = (propertyId) => navigate(`/owner/photos/${propertyId}`);
  const handleManageVideos = (propertyId) => navigate(`/owner/videos/${propertyId}`);
  const handleChat = (propertyId) => navigate(`/owner/pg-chat/${propertyId}`);
  const handleAnnouncement = (propertyId) => navigate(`/owner/pg-chat/${propertyId}?mode=announcement`);
  const handleCreatePlan = (propertyId) => navigate(`/owner/property/${propertyId}/plans`);
  const handleViewBooking = (bookingId) => navigate(`/owner/bookings/${bookingId}`);

  // Enhanced QR Code Generator with Preview
  const handleGenerateQR = async (propertyId) => {
    try {
      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      const propertyName = property?.pg_name || "PG";
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
      setSelectedPropertyForQR(property);
      setQrPreviewOpen(true);
    } catch (err) {
      console.error("QR Generation Error:", err);
    }
  };

  const downloadFullPoster = async () => {
    if (!selectedPropertyForQR) return;
    
    const BRAND_BLUE = "#0B5ED7";
    const BRAND_GREEN = "#4CAF50";
    const propertyName = selectedPropertyForQR.pg_name;

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

    const qrImg = new Image();
    qrImg.src = qrImageUrl;

    await Promise.all([
      new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve; }),
      new Promise((resolve) => { qrImg.onload = resolve; qrImg.onerror = resolve; })
    ]);

    ctx.drawImage(logo, 350, 40, 200, 110);
    
    ctx.font = "900 54px 'Inter', Arial";
    const gradient = ctx.createLinearGradient(360, 210, 540, 210);
    gradient.addColorStop(0, BRAND_BLUE);
    gradient.addColorStop(1, BRAND_GREEN);
    ctx.fillStyle = gradient;
    ctx.fillText("Nepxall", 450, 210);
    
    ctx.font = "26px 'Inter', Arial";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Next Places for Living", 450, 250);
    
    ctx.font = "bold 36px 'Inter', Arial";
    ctx.fillStyle = "#111827";
    ctx.fillText(propertyName.toUpperCase(), 450, 320);
    
    ctx.font = "26px 'Inter', Arial";
    ctx.fillStyle = BRAND_BLUE;
    ctx.fillText("Scan QR to View Rooms", 450, 380);
    
    ctx.font = "24px 'Inter', Arial";
    ctx.fillStyle = "#6B7280";
    ctx.fillText("Book Instantly Online", 450, 415);
    
    ctx.drawImage(qrImg, 150, 450, 600, 600);
    
    ctx.font = "22px 'Inter', Arial";
    ctx.fillStyle = "#6B7280";
    ctx.fillText("Powered by Nepxall", 450, 1080);
    
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `nepxall-${propertyName}-entrance-qr.png`;
    link.click();
  };

  if (authLoading || pageLoading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <CircularProgress size={80} thickness={4} sx={{ color: 'white' }} />
        </motion.div>
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 100, -100, 0],
            y: [0, 50, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            top: '10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(11,94,215,0.3) 0%, rgba(76,175,80,0.1) 100%)',
            borderRadius: '50%',
            filter: 'blur(80px)'
          }}
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -50, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(11,94,215,0.1) 100%)',
            borderRadius: '50%',
            filter: 'blur(80px)'
          }}
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        
        {/* Hero Header - Futuristic Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper elevation={0} sx={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            border: '1px solid rgba(255,255,255,0.1)',
            p: { xs: 3, md: 5 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative Gradient Bar */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #0B5ED7, #4CAF50, #8B5CF6, #0B5ED7)',
              backgroundSize: '300% 100%',
              animation: 'gradientShift 3s ease infinite'
            }} />
            
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3}>
              <Box>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Typography variant="overline" sx={{ 
                    color: '#8B5CF6', 
                    letterSpacing: 2,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #8B5CF6, #0B5ED7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {greeting.toUpperCase()}
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Typography variant="h3" sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #fff, #0B5ED7, #4CAF50)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    fontSize: { xs: '2rem', md: '3rem' }
                  }}>
                    {user?.name || 'Owner'} 👋
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Typography>
                </motion.div>
              </Box>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', gap: '12px' }}
              >
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/owner/add")}
                  sx={{
                    background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                    color: 'white',
                    borderRadius: '40px',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 30px rgba(11,94,215,0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add Property
                </Button>
                
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { transform: 'rotate(180deg)' },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <RefreshIcon sx={{ color: 'white' }} />
                </IconButton>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>

        {/* Smart Stats Cards - Asymmetrical Layout */}
        <Box sx={{ mb: 5 }}>
          <Grid container spacing={3}>
            {/* Property Card - Emerald Glow */}
            <Grid item xs={12} md={3}>
              <GlowingCard delay={0.1}>
                <Paper sx={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '28px',
                  border: '1px solid rgba(76,175,80,0.3)',
                  p: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#4CAF50',
                    boxShadow: '0 20px 40px rgba(76,175,80,0.2)'
                  }
                }}>
                  <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
                    <FloatingIcon icon={<ApartmentIcon sx={{ fontSize: 48, color: '#4CAF50' }} />} color="#4CAF50" delay={0} />
                  </Box>
                  <Typography variant="overline" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                    Total Properties
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', mt: 1, mb: 1 }}>
                    <AnimatedCounter value={stats.totalProperties} duration={2} />
                  </Typography>
                  <LinearProgress variant="determinate" value={100} sx={{ bgcolor: 'rgba(76,175,80,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#4CAF50' } }} />
                </Paper>
              </GlowingCard>
            </Grid>

            {/* Rooms Card - Electric Blue */}
            <Grid item xs={12} md={3}>
              <GlowingCard delay={0.2}>
                <Paper sx={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '28px',
                  border: '1px solid rgba(11,94,215,0.3)',
                  p: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#0B5ED7',
                    boxShadow: '0 20px 40px rgba(11,94,215,0.2)'
                  }
                }}>
                  <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
                    <FloatingIcon icon={<RoomIcon sx={{ fontSize: 48, color: '#0B5ED7' }} />} color="#0B5ED7" delay={1} />
                  </Box>
                  <Typography variant="overline" sx={{ color: '#0B5ED7', fontWeight: 600 }}>
                    Total Rooms
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', mt: 1, mb: 1 }}>
                    <AnimatedCounter value={stats.totalRooms} duration={2} />
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Occupied: {stats.occupiedRooms}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Available: {stats.availableRooms}
                    </Typography>
                  </Box>
                </Paper>
              </GlowingCard>
            </Grid>

            {/* Occupancy Card - Neon Purple */}
            <Grid item xs={12} md={3}>
              <GlowingCard delay={0.3}>
                <Paper sx={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '28px',
                  border: '1px solid rgba(139,92,246,0.3)',
                  p: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#8B5CF6',
                    boxShadow: '0 20px 40px rgba(139,92,246,0.2)'
                  }
                }}>
                  <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
                    <FloatingIcon icon={<TrendingUpIcon sx={{ fontSize: 48, color: '#8B5CF6' }} />} color="#8B5CF6" delay={2} />
                  </Box>
                  <Typography variant="overline" sx={{ color: '#8B5CF6', fontWeight: 600 }}>
                    Occupancy Rate
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', mt: 1, mb: 1 }}>
                    <AnimatedCounter value={stats.occupancyRate} duration={2} suffix="%" />
                  </Typography>
                  <LinearProgress variant="determinate" value={stats.occupancyRate} sx={{ bgcolor: 'rgba(139,92,246,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6' } }} />
                </Paper>
              </GlowingCard>
            </Grid>

            {/* Pending Card - Soft Red Pulse */}
            <Grid item xs={12} md={3}>
              <GlowingCard delay={0.4}>
                <Paper sx={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '28px',
                  border: '1px solid rgba(220,38,38,0.3)',
                  p: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#dc2626',
                    boxShadow: '0 20px 40px rgba(220,38,38,0.2)'
                  }
                }}>
                  <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
                    <FloatingIcon icon={<PendingIcon sx={{ fontSize: 48, color: '#dc2626' }} />} color="#dc2626" delay={3} />
                  </Box>
                  <Typography variant="overline" sx={{ color: '#dc2626', fontWeight: 600 }}>
                    Pending Bookings
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', mt: 1, mb: 1 }}>
                    <AnimatedCounter value={stats.pendingBookings} duration={2} />
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Total: {stats.totalBookings}
                  </Typography>
                </Paper>
              </GlowingCard>
            </Grid>
          </Grid>
        </Box>

        {/* Availability Alert - Glass Toast Style */}
        <AnimatePresence>
          {stats.availableRooms > 0 && (
            <Slide direction="down" in={true}>
              <Alert 
                severity="success" 
                icon={<CommunityIcon />}
                sx={{ 
                  mb: 3,
                  background: 'rgba(76,175,80,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(76,175,80,0.3)',
                  borderRadius: '20px',
                  color: '#4CAF50'
                }}
              >
                <strong>{stats.availableRooms}</strong> rooms available across your properties
              </Alert>
            </Slide>
          )}
        </AnimatePresence>

        {/* Properties Section - Horizontal Scroll Cards */}
        {pgs.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                Your Properties
                <Chip 
                  label={pgs.length} 
                  size="small" 
                  sx={{ ml: 2, background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)', color: 'white' }} 
                />
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              overflowX: 'auto',
              gap: 3,
              pb: 2,
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                borderRadius: '10px',
              }
            }}>
              {pgs.map((pg, index) => (
                <motion.div
                  key={pg.id || pg.pg_id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  style={{ minWidth: '350px', maxWidth: '400px' }}
                >
                  <PropertyCard
                    property={pg}
                    onView={() => handleViewProperty(pg.id || pg.pg_id)}
                    onEdit={() => handleEditProperty(pg.id || pg.pg_id)}
                    onRooms={() => handleManageRooms(pg.id || pg.pg_id)}
                    onPhotos={() => handleManagePhotos(pg.id || pg.pg_id)}
                    onVideos={() => handleManageVideos(pg.id || pg.pg_id)}
                    onChat={() => handleChat(pg.id || pg.pg_id)}
                    onAnnouncement={() => handleAnnouncement(pg.id || pg.pg_id)}
                    onGenerateQR={() => handleGenerateQR(pg.id || pg.pg_id)}
                    onCreatePlan={pg.pg_category === "coliving" ? () => handleCreatePlan(pg.id || pg.pg_id) : null}
                  />
                </motion.div>
              ))}
            </Box>
          </Box>
        )}

        {/* Empty State */}
        {pgs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                py: 3,
                background: 'rgba(11,94,215,0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(11,94,215,0.3)',
                borderRadius: '24px'
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => navigate("/owner/add")}
                  startIcon={<AddIcon />}
                  sx={{ color: '#0B5ED7' }}
                >
                  Add Now
                </Button>
              }
            >
              <Typography variant="body1" sx={{ color: 'white' }}>
                <strong>No properties added yet!</strong> Click the button to add your first property.
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Bookings Section - Reinvented as Timeline Cards */}
        <Box mt={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
              Recent Bookings
              {stats.totalBookings > 0 && (
                <Chip 
                  label={stats.totalBookings} 
                  size="small" 
                  sx={{ ml: 2, background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)', color: 'white' }} 
                />
              )}
            </Typography>
            
            {stats.totalBookings > 5 && (
              <Button 
                onClick={() => navigate("/owner/bookings")}
                endIcon={<ChevronIcon />}
                sx={{ color: '#0B5ED7' }}
              >
                View All
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentBookings.length === 0 ? (
              <Paper sx={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                p: 4,
                textAlign: 'center'
              }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  No bookings yet
                </Typography>
              </Paper>
            ) : (
              recentBookings.map((booking, index) => {
                const statusStyle = getStatusBadgeStyle(booking.status);
                const monthlyRent = booking.monthly_rent || 0;
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 10 }}
                  >
                    <Paper sx={{
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '24px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      p: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'rgba(11,94,215,0.5)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                      }
                    }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ 
                            width: 56, 
                            height: 56, 
                            background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                            boxShadow: `0 0 20px ${statusStyle.glow}`
                          }}>
                            {booking.tenant_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                              {booking.tenant_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon sx={{ fontSize: 12 }} />
                              {booking.tenant_phone || <span style={{ color: '#f59e0b' }}>Hidden</span>}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Chip 
                            label={booking.status?.toUpperCase() || 'PENDING'}
                            sx={{ 
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              boxShadow: statusStyle.glow,
                              animation: statusStyle.glow !== 'none' ? 'pulse 2s infinite' : 'none'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Property
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                            {booking.pg_name}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Room Type
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {booking.room_type}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Check-in Date
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {formatDate(booking.check_in_date)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Monthly Rent
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #8B5CF6, #0B5ED7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            {formatCurrency(monthlyRent)}
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewBooking(booking.id)}
                          sx={{
                            borderColor: '#0B5ED7',
                            color: '#0B5ED7',
                            borderRadius: '20px',
                            '&:hover': {
                              borderColor: '#4CAF50',
                              color: '#4CAF50'
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                );
              })
            )}
          </Box>
        </Box>

        {/* Floating Action Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
        >
          <Button
            variant="contained"
            startIcon={<ChatIcon />}
            onClick={() => navigate("/owner/chats")}
            sx={{
              background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
              borderRadius: '40px',
              px: 3,
              py: 1.5,
              mr: 2,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 10px 30px rgba(11,94,215,0.5)'
              }
            }}
          >
            Chats
          </Button>
          
          <Button
            variant="contained"
            startIcon={<HelpIcon />}
            sx={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '40px',
              px: 3,
              py: 1.5,
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            Help
          </Button>
        </motion.div>

        {/* QR Preview Modal */}
        <AnimatePresence>
          {qrPreviewOpen && (
            <Box sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(20px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Paper sx={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '32px',
                  p: 4,
                  maxWidth: '500px',
                  textAlign: 'center'
                }}>
                  <IconButton
                    onClick={() => setQrPreviewOpen(false)}
                    sx={{ position: 'absolute', top: 16, right: 16 }}
                  >
                    <CloseIcon sx={{ color: 'white' }} />
                  </IconButton>
                  
                  <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                    {selectedPropertyForQR?.pg_name}
                  </Typography>
                  
                  <img src={qrImageUrl} alt="QR Code" style={{ width: '100%', borderRadius: '20px', marginBottom: '20px' }} />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={downloadFullPoster}
                    sx={{
                      background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                      borderRadius: '40px',
                      py: 1.5
                    }}
                  >
                    Download Full Poster
                  </Button>
                </Paper>
              </motion.div>
            </Box>
          )}
        </AnimatePresence>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbar.severity} 
            variant="filled"
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: '100%', borderRadius: '20px' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Container>

      {/* Global Animation Styles */}
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
            70% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
            100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>
    </Box>
  );
};

export default OwnerDashboard;