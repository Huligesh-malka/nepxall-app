import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Navigate } default as ReactRouterDom, { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";
import { Box, CircularProgress, useTheme, alpha, keyframes } from "@mui/material";

import QRCodeStyling from "qr-code-styling";

import {
  Typography, Box as MuiBox, Button, Grid, Alert, Snackbar,
  Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Card, CardContent,
  Divider, Stack, Tooltip, Container, LinearProgress, SwipeableDrawer, useMediaQuery
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
  MoreVert as MoreIcon
} from "@mui/icons-material";

import StatCard from "../components/owner/StatCard";
import PropertyCard from "../components/owner/PropertyCard";

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
  const { user, role, loading: authLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pgDetailsMap, setPgDetailsMap] = useState({});

  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);

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

  // Animated stats values
  const animatedTotalProperties = useCountUp(stats.totalProperties, 800);
  const animatedTotalRooms = useCountUp(stats.totalRooms, 800);
  const animatedOccupiedRooms = useCountUp(stats.occupiedRooms, 800);
  const animatedPendingBookings = useCountUp(stats.pendingBookings, 800);
  const animatedOccupancyRate = useCountUp(stats.occupancyRate, 800);
  const animatedTotalEarnings = useCountUp(stats.totalEarnings, 1000);

  /* ---------------- HELPER FUNCTION TO GET RENT BY ROOM TYPE ---------------- */
  
  const getRentByRoomType = (pg, roomType) => {
    if (!pg) return 0;
    
    const roomTypeLower = roomType?.toLowerCase() || '';
    
    // Map room types to database fields
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
      // Default to general rent_amount
      return Number(pg.rent_amount) || 0;
    }
  };

  const getDepositByRoomType = (pg, roomType) => {
    if (!pg) return 0;
    
    // Use security_deposit from PG table or default deposit_amount
    return Number(pg.security_deposit) || Number(pg.deposit_amount) || 0;
  };

  /* ---------------- LOAD DATA ---------------- */

  const loadAllData = useCallback(async (refresh = false) => {
    try {
      if (!user) {
        console.log("❌ No user");
        return;
      }

      refresh ? setRefreshing(true) : setPageLoading(true);
      console.log("📡 Loading dashboard data...");

      /* -------- PG DATA USING pgAPI -------- */
      
      console.log("📡 Fetching owner dashboard...");
      const pgRes = await pgAPI.getOwnerDashboard();
      console.log("✅ PG Data received:", pgRes.data);

      const pgData = Array.isArray(pgRes.data)
        ? pgRes.data
        : pgRes.data?.data || [];

      // Create a map of PG details for quick lookup
      const pgMap = {};
      const properties = pgData.map(pg => {
        const photos = parseArray(pg.photos);
        
        // Store in map with both id and pg_id as keys
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
          // Ensure these fields are numbers
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
      console.log(`✅ Loaded ${properties.length} properties`);

      /* -------- BOOKINGS USING pgAPI -------- */

      console.log("📡 Fetching owner bookings...");
      const bookingsRes = await pgAPI.getOwnerBookings();
      console.log("✅ Bookings received:", bookingsRes.data);

      const bookings = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.bookings || [];

      // Store full booking history
      setBookingHistory(bookings);

      // Enhance booking data with rent and deposit from PG table
      const enhancedBookings = bookings.map(booking => {
        // Find the associated PG
        const pgId = booking.pg_id || booking.property_id;
        const pg = pgMap[pgId];
        
        // Get room type from booking
        const roomType = booking.room_type || '';
        
        // Calculate rent and deposit based on PG data and room type
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
          pg_details: pg // Store full PG details for reference
        };
      });

      const sortedBookings = enhancedBookings
        .sort(
          (a, b) =>
            new Date(b.created_at || b.check_in_date || 0) -
            new Date(a.created_at || a.check_in_date || 0)
        )
        .slice(0, 5);

      setRecentBookings(sortedBookings);

      /* -------- STATS -------- */

      const totalRooms = properties.reduce((a, b) => a + (b.total_rooms || 0), 0);
      const availableRooms = properties.reduce((a, b) => a + (b.available_rooms || 0), 0);
      const occupiedRooms = totalRooms - availableRooms;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      const ratings = properties
        .filter(p => p.avg_rating > 0)
        .map(p => p.avg_rating);

      const avgRating = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;

      // Calculate Total Rent from all confirmed bookings using enhanced data
      const totalRent = enhancedBookings
        .filter(b => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);

      // Calculate Total Deposit from all confirmed bookings
      const totalDeposit = enhancedBookings
        .filter(b => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);

      // Calculate Pending Rent (from pending bookings)
      const pendingRent = enhancedBookings
        .filter(b => b?.status?.toLowerCase() === "pending")
        .reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);

      // Calculate Pending Deposit (from pending bookings)
      const pendingDeposit = enhancedBookings
        .filter(b => b?.status?.toLowerCase() === "pending")
        .reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);

      const totalEarnings = enhancedBookings
        .filter(b => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const pendingBookings = bookings.filter(b => 
        b?.status?.toLowerCase() === "pending"
      ).length;

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

      setSnackbar({
        open: true,
        message: "Dashboard loaded successfully",
        severity: "success"
      });

    } catch (err) {
      console.error("❌ Dashboard error:", err?.response?.data || err.message);

      if (err.response?.status === 401) {
        console.log("🔐 Unauthorized");
      }

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

  /* ---------------- AUTH + LOAD ================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }

    if (user && role === "owner") {
      loadAllData();
    }
  }, [user, role, authLoading, navigate, loadAllData]);

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

  // ⭐ QR Code Generator Function with preview popup
  const handleGenerateQR = async (propertyId) => {
    try {
      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      setSelectedProperty(property);
      
      const BRAND_BLUE = "#0B5ED7";
      const BRAND_GREEN = "#4CAF50";
      const propertyName = property?.pg_name || "PG";

      const url = `https://nepxall-app.vercel.app/scan/${propertyId}`;

      /* QR DESIGN - Clean black & white for perfect scanning */
      const qr = new QRCodeStyling({
        width: 400,
        height: 400,
        data: url,
        dotsOptions: {
          type: "square",
          color: "#000000"
        },
        backgroundOptions: {
          color: "#ffffff"
        },
        cornersSquareOptions: {
          type: "square",
          color: "#000000"
        },
        cornersDotOptions: {
          type: "square",
          color: "#000000"
        }
      });

      /* Get QR as image URL for preview */
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
          Loading your futuristic dashboard...
        </Typography>
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  /* ---------------- UI ---------------- */

  // Get dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const greeting = getGreeting();
  const ownerName = user?.name?.split(' ')[0] || 'Owner';

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
        
        {/* FLOATING HEADER - Glass morphism */}
        <Box
          component={motion.div}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
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
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(76, 175, 80, 0.2)',
                    transform: 'rotate(180deg)'
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>

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
                  transition: 'all 0.3s ease',
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
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(76, 175, 80, 0.2)',
                    borderColor: '#4CAF50'
                  }
                }}
              >
                Add Property
              </Button>
            </Box>
          </Box>
        </Box>

        {/* SMART STATS CARDS - Angled / Curved design */}
        <Box sx={{ mb: 5 }}>
          <Grid container spacing={3}>
            {/* Properties Card */}
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05))',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '28px',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    p: 2.5,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #4CAF50, #0B5ED7)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>PROPERTIES</Typography>
                      <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#4CAF50', lineHeight: 1 }}>
                        {animatedTotalProperties}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      animation: `${float} 3s ease-in-out infinite`,
                      background: 'rgba(76, 175, 80, 0.2)',
                      borderRadius: '20px',
                      p: 1
                    }}>
                      <ApartmentIcon sx={{ fontSize: 40, color: '#4CAF50' }} />
                    </Box>
                  </Box>
                  <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mt: 1 }}>
                    Total registered properties
                  </Typography>
                </Box>
              </motion.div>
            </Grid>

            {/* Rooms Card */}
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, rgba(11, 94, 215, 0.15), rgba(11, 94, 215, 0.05))',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '28px',
                    border: '1px solid rgba(11, 94, 215, 0.3)',
                    p: 2.5,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #0B5ED7, #4CAF50)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>TOTAL ROOMS</Typography>
                      <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#0B5ED7', lineHeight: 1 }}>
                        {animatedTotalRooms}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#4CAF50' }}>
                        {stats.availableRooms} available
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      animation: `${float} 3s ease-in-out infinite 0.5s`,
                      background: 'rgba(11, 94, 215, 0.2)',
                      borderRadius: '20px',
                      p: 1
                    }}>
                      <RoomIcon sx={{ fontSize: 40, color: '#0B5ED7' }} />
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            {/* Occupancy Card */}
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -5 }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '28px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    p: 2.5,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #8B5CF6, #4CAF50)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>OCCUPANCY</Typography>
                      <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#8B5CF6', lineHeight: 1 }}>
                        {animatedOccupancyRate}%
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {animatedOccupiedRooms} / {stats.totalRooms} rooms
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      animation: `${float} 3s ease-in-out infinite 1s`,
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '20px',
                      p: 1
                    }}>
                      <TrendingUpIcon sx={{ fontSize: 40, color: '#8B5CF6' }} />
                    </Box>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.occupancyRate} 
                    sx={{ 
                      mt: 2, 
                      borderRadius: '10px', 
                      height: 6,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #8B5CF6, #4CAF50)',
                        borderRadius: '10px'
                      }
                    }} 
                  />
                </Box>
              </motion.div>
            </Grid>

            {/* Pending Bookings Card */}
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ scale: 1.02, y: -5 }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(220, 38, 38, 0.05))',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '28px',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    p: 2.5,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #dc2626, #f59e0b)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>PENDING</Typography>
                      <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                        {animatedPendingBookings}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Awaiting confirmation
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      animation: `${float} 3s ease-in-out infinite 1.5s`,
                      background: 'rgba(245, 158, 11, 0.2)',
                      borderRadius: '20px',
                      p: 1
                    }}>
                      <PendingIcon sx={{ fontSize: 40, color: '#f59e0b' }} />
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        {/* AVAILABILITY ALERT - Floating toast style */}
        {stats.availableRooms > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Box
              sx={{
                background: 'rgba(76, 175, 80, 0.15)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(76, 175, 80, 0.4)',
                p: 2,
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                animation: `${pulseGlow} 2s infinite`
              }}
            >
              <CommunityIcon sx={{ color: '#4CAF50', fontSize: 28 }} />
              <Typography sx={{ color: '#e2e8f0', flex: 1 }}>
                <strong style={{ color: '#4CAF50', fontSize: '1.2rem' }}>{stats.availableRooms}</strong> rooms available across your properties
              </Typography>
              <Button
                size="small"
                onClick={() => navigate("/owner/add")}
                sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
                variant="outlined"
              >
                Manage
              </Button>
            </Box>
          </motion.div>
        )}

        {/* EMPTY STATE */}
        {pgs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                background: 'rgba(15, 23, 36, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                border: '1px solid rgba(255,255,255,0.1)',
                p: { xs: 3, md: 6 },
                textAlign: 'center',
                mb: 4
              }}
            >
              <ApartmentIcon sx={{ fontSize: 80, color: '#4CAF50', mb: 2, opacity: 0.7 }} />
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                No properties yet
              </Typography>
              <Typography sx={{ color: '#94a3b8', mb: 3 }}>
                Start by adding your first property to begin managing bookings and tenants.
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => navigate("/owner/add")}
                sx={{
                  background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                  borderRadius: '30px',
                  px: 4,
                  py: 1.5,
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                Add Your First Property
              </Button>
            </Box>
          </motion.div>
        )}

        {/* PROPERTY SECTION - Horizontal scrollable cards */}
        {pgs.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #fff, #94a3b8)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Your Properties
              </Typography>
              <Chip 
                label={pgs.length} 
                sx={{ 
                  bgcolor: '#4CAF50', 
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '12px'
                }} 
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                overflowX: 'auto',
                gap: 3,
                pb: 2,
                '&::-webkit-scrollbar': {
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#4CAF50',
                  borderRadius: '10px',
                },
              }}
            >
              {pgs.map((pg, index) => (
                <motion.div
                  key={pg.id || pg.pg_id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  style={{ minWidth: isMobile ? '280px' : '320px', flexShrink: 0 }}
                >
                  <Box
                    sx={{
                      background: 'rgba(15, 23, 36, 0.8)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '28px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        borderColor: 'rgba(76, 175, 80, 0.5)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                      }
                    }}
                  >
                    {/* Diagonal status ribbon */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        right: -35,
                        width: 120,
                        transform: 'rotate(45deg)',
                        background: pg.available_rooms > 0 
                          ? 'linear-gradient(135deg, #4CAF50, #2e7d32)'
                          : 'linear-gradient(135deg, #f59e0b, #dc2626)',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        py: 0.5,
                        zIndex: 2,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                      }}
                    >
                      {pg.available_rooms > 0 ? `${pg.available_rooms} AVAILABLE` : 'FULL'}
                    </Box>

                    {/* Property Image */}
                    <Box
                      sx={{
                        height: 180,
                        backgroundImage: pg.image ? `url(${getImageUrl(pg.image)})` : 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                          p: 2
                        }}
                      >
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                          {pg.pg_name}
                        </Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          {pg.location || 'Location not specified'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Glass info panel */}
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Total Rooms</Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 600 }}>{pg.total_rooms || 0}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Available</Typography>
                          <Typography sx={{ color: '#4CAF50', fontWeight: 600 }}>{pg.available_rooms || 0}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Rent</Typography>
                          <Typography sx={{ color: '#8B5CF6', fontWeight: 600 }}>{formatCurrency(pg.rent_amount)}</Typography>
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="View Property">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewProperty(pg.id || pg.pg_id)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.05)',
                              borderRadius: '12px',
                              color: '#fff',
                              '&:hover': { bgcolor: '#0B5ED7' }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Property">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditProperty(pg.id || pg.pg_id)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.05)',
                              borderRadius: '12px',
                              color: '#fff',
                              '&:hover': { bgcolor: '#f59e0b' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Generate QR">
                          <IconButton 
                            size="small"
                            onClick={() => handleGenerateQR(pg.id || pg.pg_id)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.05)',
                              borderRadius: '12px',
                              color: '#fff',
                              '&:hover': { bgcolor: '#8B5CF6' }
                            }}
                          >
                            <QrIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chat">
                          <IconButton 
                            size="small"
                            onClick={() => handleChat(pg.id || pg.pg_id)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.05)',
                              borderRadius: '12px',
                              color: '#fff',
                              '&:hover': { bgcolor: '#4CAF50' }
                            }}
                          >
                            <ChatIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Announcement">
                          <IconButton 
                            size="small"
                            onClick={() => handleAnnouncement(pg.id || pg.pg_id)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.05)',
                              borderRadius: '12px',
                              color: '#fff',
                              '&:hover': { bgcolor: '#0B5ED7' }
                            }}
                          >
                            <CampaignIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        )}

        {/* BOOKINGS SECTION - Reinvented as Timeline Style Cards */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #fff, #94a3b8)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Recent Bookings
            </Typography>
            {stats.totalBookings > 5 && (
              <Button 
                onClick={() => navigate("/owner/bookings")}
                endIcon={<ViewIcon />}
                sx={{ color: '#4CAF50' }}
              >
                View All
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentBookings.length === 0 ? (
              <Box
                sx={{
                  background: 'rgba(15, 23, 36, 0.6)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '24px',
                  p: 4,
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <Typography sx={{ color: '#94a3b8' }}>No bookings yet</Typography>
              </Box>
            ) : (
              recentBookings.map((booking, index) => {
                const statusStyle = getStatusBadgeStyle(booking.status);
                const monthlyRent = booking.monthly_rent || 0;
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                  >
                    <Box
                      sx={{
                        background: 'rgba(15, 23, 36, 0.7)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        p: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'rgba(76, 175, 80, 0.3)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                        {/* Avatar + Tenant Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 180 }}>
                          <Avatar 
                            sx={{ 
                              width: 50, 
                              height: 50, 
                              bgcolor: '#4CAF50',
                              background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)'
                            }}
                          >
                            {booking.tenant_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                              {booking.tenant_name}
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhoneIcon sx={{ fontSize: 12 }} />
                              {booking.tenant_phone || 'Hidden'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Property & Room */}
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Property</Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                            {booking.pg_name}
                          </Typography>
                          <Typography sx={{ color: '#8B5CF6', fontSize: '0.75rem' }}>
                            {booking.room_type}
                          </Typography>
                        </Box>

                        {/* Check-in Date */}
                        <Box sx={{ minWidth: 100 }}>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Check-in</Typography>
                          <Typography sx={{ color: '#fff', fontSize: '0.85rem' }}>
                            {formatDate(booking.check_in_date)}
                          </Typography>
                        </Box>

                        {/* Monthly Rent - Gradient Text */}
                        <Box sx={{ minWidth: 100 }}>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>Monthly Rent</Typography>
                          <Typography 
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '1.1rem',
                              background: 'linear-gradient(135deg, #8B5CF6, #4CAF50)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}
                          >
                            {formatCurrency(monthlyRent)}
                          </Typography>
                        </Box>

                        {/* Status Badge with Glow */}
                        <Box sx={{ minWidth: 100 }}>
                          <Chip 
                            label={booking.status?.toUpperCase() || 'PENDING'}
                            size="small"
                            sx={{ 
                              bgcolor: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              minWidth: 90,
                              animation: statusStyle.glow === '#f59e0b' ? `${pulseGlow} 1.5s infinite` : 'none',
                              boxShadow: statusStyle.glow === '#f59e0b' ? `0 0 8px ${statusStyle.glow}` : 'none'
                            }}
                          />
                        </Box>

                        {/* View Button */}
                        <IconButton
                          onClick={() => handleViewBooking(booking.id)}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.05)',
                            borderRadius: '14px',
                            color: '#fff',
                            '&:hover': { bgcolor: '#0B5ED7' }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })
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
              <IconButton onClick={() => setQrOpen(false)} sx={{ color: '#fff' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
              {selectedProperty?.pg_name || 'Property'} QR Code
            </Typography>
            
            {qrImageUrl && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                my: 3,
                animation: `${float} 2s ease-in-out infinite`
              }}>
                <img 
                  src={qrImageUrl} 
                  alt="QR Code" 
                  style={{ 
                    width: 250, 
                    height: 250, 
                    borderRadius: '24px',
                    boxShadow: '0 0 30px rgba(76, 175, 80, 0.3)'
                  }} 
                />
              </Box>
            )}
            
            <Typography sx={{ color: '#94a3b8', mb: 3 }}>
              Scan to view property details and book instantly
            </Typography>
            
            <Button
              fullWidth
              onClick={handleDownloadQRPoster}
              sx={{
                background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
                borderRadius: '30px',
                py: 1.5,
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                mb: 2
              }}
            >
              Download Poster
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setQrOpen(false)}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '30px',
                py: 1.5,
                '&:hover': { borderColor: '#4CAF50' }
              }}
            >
              Close
            </Button>
          </Box>
        </SwipeableDrawer>

        {/* Floating Assistant Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
        >
          <IconButton
            onClick={() => setSnackbar({ open: true, message: "Need help? Contact support", severity: "info" })}
            sx={{
              background: 'linear-gradient(135deg, #0B5ED7, #4CAF50)',
              width: 56,
              height: 56,
              boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 8px 30px rgba(76, 175, 80, 0.6)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <ChatIcon sx={{ color: '#fff' }} />
          </IconButton>
        </motion.div>

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
            sx={{ 
              width: '100%',
              borderRadius: '20px',
              background: snackbar.severity === 'success' 
                ? 'linear-gradient(135deg, #4CAF50, #2e7d32)'
                : snackbar.severity === 'error'
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #0B5ED7, #1e40af)'
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