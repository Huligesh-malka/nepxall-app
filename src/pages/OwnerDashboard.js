import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";

import QRCodeStyling from "qr-code-styling";

import {
  Typography, Box, Button, Grid, Alert, Snackbar,
  CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Card, CardContent,
  Divider, Stack, Tooltip, Container, useMediaQuery,
  useTheme, Fade, Zoom, Badge, Collapse, Fab
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
  Image as ImageIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
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

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
  } catch {
    return formatDate(dateStr);
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
      return { bg: '#16a34a', color: '#fff', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> };
    case 'pending':
      return { bg: '#f59e0b', color: '#fff', icon: <PendingIcon sx={{ fontSize: 14 }} /> };
    case 'rejected':
    case 'cancelled':
      return { bg: '#dc2626', color: '#fff', icon: <WarningIcon sx={{ fontSize: 14 }} /> };
    case 'completed':
      return { bg: '#0284c7', color: '#fff', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> };
    default:
      return { bg: '#6b7280', color: '#fff', icon: <InfoIcon sx={{ fontSize: 14 }} /> };
  }
};

// Helper function to get proper image URL
const getPropertyImageUrl = (photo) => {
  if (!photo) return null;
  
  // If it's already a full URL (Cloudinary or other)
  if (photo.startsWith('http')) {
    return photo;
  }
  
  // Backend URL from environment
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";
  
  // If it's a path containing /uploads/
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BACKEND_URL}${relativePath}`;
    }
  }
  
  // If it's a relative path starting with /opt/render or similar
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) {
      return `${BACKEND_URL}${uploadsMatch[0]}`;
    }
  }
  
  // Default: just prepend backend URL
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

// Mobile Responsive Table Component
const MobileBookingCard = ({ booking, onClick }) => {
  const statusStyle = getStatusBadgeStyle(booking.status);
  const monthlyRent = booking.monthly_rent || 0;
  
  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header with Property and Status */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#0B5ED7' }}>
            {booking.pg_name}
          </Typography>
          <Chip 
            label={booking.status?.toUpperCase() || 'PENDING'}
            size="small"
            icon={statusStyle.icon}
            sx={{ 
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
              '& .MuiChip-icon': {
                color: statusStyle.color,
                marginLeft: '4px'
              }
            }}
          />
        </Box>

        {/* Tenant Info */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#4CAF50' }}>
            {booking.tenant_name?.charAt(0) || 'U'}
          </Avatar>
          <Box flex={1}>
            <Typography variant="body1" fontWeight={500}>
              {booking.tenant_name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {booking.tenant_phone ? (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {booking.tenant_phone}
                  </Typography>
                </Box>
              ) : (
                <Chip 
                  label="Phone Hidden" 
                  size="small"
                  sx={{ 
                    bgcolor: '#f59e0b20', 
                    color: '#f59e0b',
                    fontSize: '0.65rem',
                    height: 20
                  }} 
                />
              )}
            </Box>
          </Box>
          <Typography variant="body2" fontWeight={600} color="#8B5CF6">
            {formatCurrency(monthlyRent)}/mo
          </Typography>
        </Box>

        {/* Details Grid */}
        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Box sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Check-in
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatDate(booking.check_in_date)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Room Type
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {booking.room_type}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Footer with Actions */}
        <Box display="flex" justifyContent="flex-end" mt={1.5}>
          <Button 
            size="small" 
            endIcon={<ArrowForwardIcon />}
            sx={{ color: '#0B5ED7' }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

/* ---------------- COMPONENT ---------------- */

const OwnerDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pgDetailsMap, setPgDetailsMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

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

  /* 🔐 AUTH CHECK */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        console.log("👤 User authenticated:", user.uid);
        setAuthLoading(false);
        await loadAllData();
      }
    });

    return () => unsub();
  }, []);

  /* ---------------- HELPER FUNCTION TO GET RENT BY ROOM TYPE ---------------- */
  
  const getRentByRoomType = (pg, roomType) => {
    if (!pg) return 0;
    
    const roomTypeLower = roomType?.toLowerCase() || '';
    
    // Map room types to database fields
    if (roomTypeLower.includes('single sharing') || roomTypeLower.includes('single')) {
      return Number(pg.single_sharing) || Number(pg.single_room) || Number(pg.co_living_single_room) || Number(pg.rent_amount) || 0;
    }
    else if (roomTypeLower.includes('double sharing') || roomTypeLower.includes('double')) {
      return Number(pg.double_sharing) || Number(pg.double_room) || Number(pg.co_living_double_room) || 0;
    }
    else if (roomTypeLower.includes('triple sharing') || roomTypeLower.includes('triple')) {
      return Number(pg.triple_sharing) || Number(pg.triple_room) || 0;
    }
    else if (roomTypeLower.includes('four sharing') || roomTypeLower.includes('four')) {
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
      if (!auth.currentUser) {
        console.log("❌ No current user");
        return;
      }

      refresh ? setRefreshing(true) : setLoading(true);
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
        
        // Get proper image URL for the first photo
        const firstPhoto = photos.length > 0 ? getPropertyImageUrl(photos[0]) : null;
        
        // Store in map with both id and pg_id as keys
        pgMap[pg.id] = pg;
        pgMap[pg.pg_id] = pg;
        
        return {
          ...pg,
          id: pg.id || pg.pg_id,
          pg_id: pg.pg_id || pg.id,
          photos,
          photosWithUrls: photos.map(p => getPropertyImageUrl(p)).filter(Boolean),
          image: firstPhoto,
          imageUrl: firstPhoto, // Add this for easy access
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
          pg_details: pg, // Store full PG details for reference
          relative_time: formatRelativeTime(booking.created_at || booking.check_in_date)
        };
      });

      const sortedBookings = enhancedBookings
        .sort(
          (a, b) =>
            new Date(b.created_at || b.check_in_date || 0) -
            new Date(a.created_at || a.check_in_date || 0)
        )
        .slice(0, isMobile ? 3 : 5);

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
        console.log("🔐 Unauthorized - logging out");
        await auth.signOut();
        navigate("/login");
      }

      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to load dashboard",
        severity: "error"
      });

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate, isMobile]);

  /* ---------------- HANDLERS ---------------- */

  const handleRefresh = () => {
    loadAllData(true);
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/pg/${propertyId}`);
    setMobileMenuOpen(false);
  };

  const handleEditProperty = (propertyId) => {
    navigate(`/owner/edit/${propertyId}`);
    setMobileMenuOpen(false);
  };

  const handleManageRooms = (propertyId) => {
    navigate(`/owner/rooms/${propertyId}`);
    setMobileMenuOpen(false);
  };

  const handleManagePhotos = (propertyId) => {
    navigate(`/owner/photos/${propertyId}`);
    setMobileMenuOpen(false);
  };

  const handleManageVideos = (propertyId) => {
    navigate(`/owner/videos/${propertyId}`);
    setMobileMenuOpen(false);
  };

  const handleChat = (propertyId) => {
    navigate(`/owner/pg-chat/${propertyId}`);
    setMobileMenuOpen(false);
  };

  const handleAnnouncement = (propertyId) => {
    navigate(`/owner/pg-chat/${propertyId}?mode=announcement`);
    setMobileMenuOpen(false);
  };

  const handleCreatePlan = (propertyId) => {
    navigate(`/owner/property/${propertyId}/plans`);
    setMobileMenuOpen(false);
  };

  const handleViewBooking = (bookingId) => {
    navigate(`/owner/bookings/${bookingId}`);
    setMobileMenuOpen(false);
  };

  const handleGenerateQR = async (propertyId) => {
    try {
      const BRAND_BLUE = "#0B5ED7";
      const BRAND_GREEN = "#4CAF50";

      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      const propertyName = property?.pg_name || "PG";

      const url = `https://nepxall.vercel.app/scan/${propertyId}`;

      /* QR DESIGN */
      const qr = new QRCodeStyling({
        width: isMobile ? 400 : 600,
        height: isMobile ? 400 : 600,
        data: url,
        image: window.location.origin + "/logo.png",
        dotsOptions: {
          type: "rounded",
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: BRAND_BLUE },
              { offset: 1, color: BRAND_GREEN }
            ]
          }
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: BRAND_GREEN
        },
        cornersDotOptions: {
          type: "dot",
          color: BRAND_BLUE
        },
        backgroundOptions: {
          color: "#ffffff"
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: 0.35
        }
      });

      /* POSTER CANVAS */
      const canvas = document.createElement("canvas");
      canvas.width = isMobile ? 600 : 900;
      canvas.height = isMobile ? 800 : 1100;

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#F9FAFB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = "center";

      /* LOAD LOGO */
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = "/logo.png";

      logo.onload = async () => {
        /* LOGO */
        ctx.drawImage(logo, isMobile ? 200 : 350, 40, isMobile ? 150 : 200, isMobile ? 80 : 110);

        /* STRONG NEPXALL BRAND TEXT */
        ctx.font = isMobile ? "700 36px Arial" : "900 54px Arial";

        const gradient = ctx.createLinearGradient(isMobile ? 200 : 360, isMobile ? 150 : 210, isMobile ? 350 : 540, isMobile ? 150 : 210);
        gradient.addColorStop(0, BRAND_BLUE);
        gradient.addColorStop(1, BRAND_GREEN);

        ctx.fillStyle = gradient;

        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        ctx.fillText("Nepxall", isMobile ? 275 : 450, isMobile ? 160 : 210);

        ctx.shadowColor = "transparent";

        /* TAGLINE */
        ctx.font = isMobile ? "18px Arial" : "26px Arial";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Next Places for Living", isMobile ? 275 : 450, isMobile ? 190 : 250);

        /* PROPERTY NAME */
        ctx.font = isMobile ? "bold 24px Arial" : "bold 36px Arial";
        ctx.fillStyle = "#111827";
        ctx.fillText(propertyName.toUpperCase(), isMobile ? 275 : 450, isMobile ? 230 : 320);

        /* DESCRIPTION */
        ctx.font = isMobile ? "18px Arial" : "26px Arial";
        ctx.fillStyle = BRAND_BLUE;
        ctx.fillText("Scan QR to View Rooms", isMobile ? 275 : 450, isMobile ? 270 : 380);

        ctx.font = isMobile ? "16px Arial" : "24px Arial";
        ctx.fillStyle = "#6B7280";
        ctx.fillText("Book Instantly Online", isMobile ? 275 : 450, isMobile ? 295 : 415);

        /* QR IMAGE */
        const qrBlob = await qr.getRawData("png");
        const qrImg = new Image();
        qrImg.src = URL.createObjectURL(qrBlob);

        qrImg.onload = () => {
          ctx.drawImage(qrImg, isMobile ? 100 : 150, isMobile ? 320 : 450, isMobile ? 350 : 600, isMobile ? 350 : 600);

          /* FOOTER */
          ctx.font = isMobile ? "16px Arial" : "22px Arial";
          ctx.fillStyle = "#6B7280";
          ctx.fillText("Powered by Nepxall", isMobile ? 275 : 450, isMobile ? 750 : 1080);

          /* DOWNLOAD */
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `nepxall-${propertyName}-entrance-qr.png`;
          link.click();
        };
      };
    } catch (err) {
      console.error("QR Generation Error:", err);
    }
  };

  /* ---------------- LOADER ---------------- */

  if (authLoading || loading) {
    return (
      <Box 
        minHeight="100vh"
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center"
        gap={2}
        sx={{ px: 2 }}
      >
        <CircularProgress size={isMobile ? 50 : 60} thickness={4} />
        <Typography color="text.secondary" align="center">
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      pb: { xs: 4, md: 6 }
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <Box 
          sx={{ 
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            bgcolor: '#0f172a',
            color: 'white',
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <DashboardIcon sx={{ color: '#4CAF50' }} />
            <Typography variant="h6" fontWeight={600}>
              <span style={{ color: '#0B5ED7' }}>Owner</span> Dashboard
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              color="inherit" 
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              <RefreshIcon />
            </IconButton>
            <IconButton 
              color="inherit"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              size="small"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Mobile Menu Drawer */}
      <Collapse in={mobileMenuOpen && isMobile}>
        <Box 
          sx={{ 
            position: 'fixed',
            top: 56,
            left: 0,
            right: 0,
            bgcolor: 'white',
            zIndex: 1090,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ p: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    navigate("/owner/add");
                    setMobileMenuOpen(false);
                  }}
                  sx={{ bgcolor: '#0B5ED7' }}
                  size="small"
                >
                  Add Property
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={() => {
                    navigate("/owner/chats");
                    setMobileMenuOpen(false);
                  }}
                  color="success"
                  size="small"
                >
                  Chats
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={() => {
                    navigate("/owner/notifications");
                    setMobileMenuOpen(false);
                  }}
                  size="small"
                >
                  Notifications
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setSelectedFilter('pending')}
                  size="small"
                >
                  Filter
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Collapse>

      {/* Main Content */}
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          mt: isMobile ? 6 : 0
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>

          {/* Desktop Header */}
          {!isMobile && (
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={4} 
              flexWrap="wrap" 
              gap={2}
            >
              <Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Owner Dashboard
                </Typography>
                <Typography color="text.secondary">
                  Manage your properties and track performance
                </Typography>
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <IconButton 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  color="primary"
                  sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
                  title="Refresh"
                >
                  <RefreshIcon />
                </IconButton>

                <Button
                  startIcon={<ChatIcon />}
                  variant="contained"
                  color="success"
                  onClick={() => navigate("/owner/chats")}
                  sx={{ boxShadow: 2 }}
                >
                  Chats
                </Button>

                <Button
                  startIcon={<NotificationsIcon />}
                  onClick={() => navigate("/owner/notifications")}
                  variant="outlined"
                >
                  Notifications
                </Button>

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/owner/add")}
                  variant="contained"
                  color="primary"
                  sx={{ boxShadow: 2 }}
                >
                  Add Property
                </Button>
              </Box>
            </Box>
          )}

          {/* STATS CARDS - Responsive Grid */}
          <Grid container spacing={isMobile ? 2 : 3} mb={4}>
            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <Box>
                  <StatCard 
                    title="Properties" 
                    value={stats.totalProperties} 
                    icon={<ApartmentIcon sx={{ fontSize: isMobile ? 32 : 40 }} />} 
                    color="#4CAF50"
                    bgColor="#E8F5E8"
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Box>
              </Zoom>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                <Box>
                  <StatCard 
                    title="Total Rooms" 
                    value={stats.totalRooms} 
                    icon={<CommunityIcon sx={{ fontSize: isMobile ? 32 : 40 }} />} 
                    color="#2196F3"
                    bgColor="#E3F2FD"
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Box>
              </Zoom>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                <Box>
                  <StatCard 
                    title="Occupied" 
                    value={stats.occupiedRooms} 
                    subvalue={stats.occupancyRate > 0 ? `${stats.occupancyRate}%` : null}
                    icon={<OccupantsIcon sx={{ fontSize: isMobile ? 32 : 40 }} />} 
                    color="#8B5CF6"
                    bgColor="#F3E8FF"
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Box>
              </Zoom>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                <Box>
                  <StatCard 
                    title="Pending" 
                    value={stats.pendingBookings} 
                    icon={<PendingIcon sx={{ fontSize: isMobile ? 32 : 40 }} />} 
                    color="#f44336"
                    bgColor="#FFEBEE"
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Box>
              </Zoom>
            </Grid>
          </Grid>

          {/* AVAILABILITY ALERT */}
          {stats.availableRooms > 0 && (
            <Fade in={true}>
              <Alert 
                severity="success" 
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<CommunityIcon />}
                action={
                  isMobile ? null : (
                    <Button color="inherit" size="small">
                      View Details
                    </Button>
                  )
                }
              >
                <Typography variant={isMobile ? 'body2' : 'body1'}>
                  <strong>{stats.availableRooms}</strong> rooms available across your properties
                </Typography>
              </Alert>
            </Fade>
          )}

          {/* EMPTY STATE */}
          {pgs.length === 0 && (
            <Fade in={true}>
              <Alert 
                severity="info" 
                sx={{ mb: 3, py: 2, borderRadius: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => navigate("/owner/add")}
                    startIcon={<AddIcon />}
                  >
                    Add Now
                  </Button>
                }
              >
                <Typography variant={isMobile ? 'body2' : 'body1'}>
                  <strong>No properties added yet!</strong> Click the button to add your first property.
                </Typography>
              </Alert>
            </Fade>
          )}

          {/* PROPERTIES SECTION */}
          {pgs.length > 0 && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
                  Your Properties
                  <Chip 
                    label={pgs.length} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      height: isMobile ? 20 : 24 
                    }} 
                  />
                </Typography>
                {isMobile && (
                  <Button 
                    size="small"
                    onClick={() => navigate("/owner/pgs")}
                    endIcon={<ArrowForwardIcon />}
                  >
                    View All
                  </Button>
                )}
              </Box>

              <Grid container spacing={isMobile ? 2 : 3} mb={4}>
                {pgs.slice(0, isMobile ? 2 : pgs.length).map((pg, index) => (
                  <Grid item xs={12} key={pg.id || pg.pg_id}>
                    <Fade in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                      <Box>
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
                          onCreatePlan={
                            pg.pg_category === "coliving"
                              ? () => handleCreatePlan(pg.id || pg.pg_id)
                              : null
                          }
                          isMobile={isMobile}
                        />
                      </Box>
                    </Fade>
                  </Grid>
                ))}
              </Grid>

              {isMobile && pgs.length > 2 && (
                <Box display="flex" justifyContent="center" mb={3}>
                  <Button 
                    variant="outlined"
                    onClick={() => navigate("/owner/pgs")}
                    endIcon={<ArrowForwardIcon />}
                  >
                    View All {pgs.length} Properties
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* RECENT BOOKINGS SECTION */}
          <Box mt={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
                Recent Bookings
                {stats.totalBookings > 0 && (
                  <Chip 
                    label={stats.totalBookings} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      height: isMobile ? 20 : 24 
                    }} 
                  />
                )}
              </Typography>
              
              {stats.totalBookings > (isMobile ? 3 : 5) && (
                <Button 
                  onClick={() => navigate("/owner/bookings")}
                  endIcon={<ArrowForwardIcon />}
                  size={isMobile ? "small" : "medium"}
                >
                  {isMobile ? 'View' : 'View All'}
                </Button>
              )}
            </Box>

            {/* Mobile Booking Cards */}
            {isMobile ? (
              <Box>
                {recentBookings.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">
                      No bookings yet
                    </Typography>
                  </Paper>
                ) : (
                  recentBookings.map((booking, index) => (
                    <Fade in={true} key={booking.id} style={{ transitionDelay: `${index * 100}ms` }}>
                      <Box>
                        <MobileBookingCard 
                          booking={booking} 
                          onClick={() => handleViewBooking(booking.id)}
                        />
                      </Box>
                    </Fade>
                  ))
                )}
              </Box>
            ) : (
              /* Desktop Table */
              <TableContainer 
                component={Paper} 
                sx={{ 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                  borderRadius: 2, 
                  overflow: 'auto' 
                }}
              >
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>PROPERTY</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>TENANT</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>CHECK-IN</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>MONTHLY RENT</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No bookings yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentBookings.map((booking) => {
                        const statusStyle = getStatusBadgeStyle(booking.status);
                        const monthlyRent = booking.monthly_rent || 0;
                        
                        return (
                          <TableRow 
                            key={booking.id}
                            hover
                            sx={{ 
                              '&:last-child td, &:last-child th': { border: 0 },
                              cursor: 'pointer'
                            }}
                            onClick={() => handleViewBooking(booking.id)}
                          >
                            {/* PROPERTY COLUMN */}
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {booking.pg_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {booking.relative_time}
                              </Typography>
                            </TableCell>

                            {/* TENANT COLUMN */}
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#4CAF50', fontSize: '0.875rem' }}>
                                  {booking.tenant_name?.charAt(0) || 'U'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>
                                    {booking.tenant_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PhoneIcon sx={{ fontSize: 12 }} />
                                    {booking.tenant_phone ? (
                                      booking.tenant_phone
                                    ) : (
                                      <span style={{ color: '#f59e0b' }}>Hidden</span>
                                    )}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            {/* CHECK-IN COLUMN */}
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {formatDate(booking.check_in_date)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {booking.room_type}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* MONTHLY RENT COLUMN */}
                            <TableCell>
                              <Typography variant="body2" fontWeight={500} color="#8B5CF6">
                                {formatCurrency(monthlyRent)}
                              </Typography>
                            </TableCell>

                            {/* STATUS COLUMN */}
                            <TableCell>
                              <Chip 
                                label={booking.status?.toUpperCase() || 'PENDING'}
                                size="small"
                                icon={statusStyle.icon}
                                sx={{ 
                                  bgcolor: statusStyle.bg,
                                  color: statusStyle.color,
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  minWidth: 80,
                                  '& .MuiChip-icon': {
                                    color: statusStyle.color
                                  }
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* Quick Actions for Mobile */}
          {isMobile && (
            <Box 
              sx={{ 
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000
              }}
            >
              <Fab 
                color="primary" 
                aria-label="add"
                onClick={() => navigate("/owner/add")}
                sx={{
                  bgcolor: '#0B5ED7',
                  '&:hover': {
                    bgcolor: '#0B5ED7',
                    opacity: 0.9
                  }
                }}
              >
                <AddIcon />
              </Fab>
            </Box>
          )}

          {/* SNACKBAR */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ 
              vertical: isMobile ? 'top' : 'bottom', 
              horizontal: 'center' 
            }}
            sx={{ 
              mt: isMobile ? 7 : 0,
              width: isMobile ? '90%' : 'auto',
              left: isMobile ? '5%' : 'auto'
            }}
          >
            <Alert 
              severity={snackbar.severity} 
              variant="filled"
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

        </Box>
      </Container>
    </Box>
  );
};

export default OwnerDashboard;