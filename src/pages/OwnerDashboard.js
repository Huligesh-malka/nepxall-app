import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";
import { Box, CircularProgress } from "@mui/material";

import QRCodeStyling from "qr-code-styling";

import {
  Typography, Box as MuiBox, Button, Grid, Alert, Snackbar,
  Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Card, CardContent,
  Divider, Stack, Tooltip, Container
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
  TrendingUp as TrendingUpIcon
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
      return { bg: '#16a34a', color: '#fff' };
    case 'pending':
      return { bg: '#f59e0b', color: '#fff' };
    case 'rejected':
    case 'cancelled':
      return { bg: '#dc2626', color: '#fff' };
    case 'completed':
      return { bg: '#0284c7', color: '#fff' };
    default:
      return { bg: '#6b7280', color: '#fff' };
  }
};

/* ---------------- COMPONENT ---------------- */

const OwnerDashboard = () => {

  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pgDetailsMap, setPgDetailsMap] = useState({});

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

  // ⭐ QR Code Generator Function (FIXED - Will scan instantly)
  const handleGenerateQR = async (propertyId) => {
    try {
      const BRAND_BLUE = "#0B5ED7";
      const BRAND_GREEN = "#4CAF50";

      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      const propertyName = property?.pg_name || "PG";

      const url = `https://nepxall-app.vercel.app/scan/${propertyId}`;

      /* QR DESIGN - FIXED: Clean black & white for perfect scanning */
      const qr = new QRCodeStyling({
        width: 600,
        height: 600,
        data: url,
        // NO LOGO - this was causing scanner failure
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

      /* POSTER CANVAS */
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1100;

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
        ctx.drawImage(logo, 350, 40, 200, 110);

        /* STRONG NEPXALL BRAND TEXT */
        ctx.font = "900 54px Arial";

        const gradient = ctx.createLinearGradient(360, 210, 540, 210);
        gradient.addColorStop(0, BRAND_BLUE);
        gradient.addColorStop(1, BRAND_GREEN);

        ctx.fillStyle = gradient;

        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        ctx.fillText("Nepxall", 450, 210);

        ctx.shadowColor = "transparent";

        /* TAGLINE */
        ctx.font = "26px Arial";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Next Places for Living", 450, 250);

        /* PROPERTY NAME */
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "#111827";
        ctx.fillText(propertyName.toUpperCase(), 450, 320);

        /* DESCRIPTION */
        ctx.font = "26px Arial";
        ctx.fillStyle = BRAND_BLUE;
        ctx.fillText("Scan QR to View Rooms", 450, 380);

        ctx.font = "24px Arial";
        ctx.fillStyle = "#6B7280";
        ctx.fillText("Book Instantly Online", 450, 415);

        /* QR IMAGE */
        const qrBlob = await qr.getRawData("png");
        const qrImg = new Image();
        qrImg.src = URL.createObjectURL(qrBlob);

        qrImg.onload = () => {
          ctx.drawImage(qrImg, 150, 450, 600, 600);

          /* FOOTER */
          ctx.font = "22px Arial";
          ctx.fillStyle = "#6B7280";
          ctx.fillText("Powered by Nepxall", 450, 1080);

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

  /* ================= PROTECTION ================= */
  if (authLoading || pageLoading) {
    return (
      <Box 
        minHeight="60vh" 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center"
        gap={2}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography color="text.secondary">
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  /* ---------------- UI ---------------- */

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <MuiBox sx={{ width: '100%' }}>

        {/* HEADER */}
        <MuiBox 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={4} 
          flexWrap="wrap" 
          gap={2}
        >
          <MuiBox>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Owner Dashboard
            </Typography>
            <Typography color="text.secondary">
              Manage your properties and track performance
            </Typography>
          </MuiBox>

          <MuiBox display="flex" gap={2} flexWrap="wrap">
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
          </MuiBox>
        </MuiBox>

        {/* STATS CARDS - 4 Cards with fixed layout */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Properties" 
              value={stats.totalProperties} 
              icon={<ApartmentIcon sx={{ fontSize: 40 }} />} 
              color="#4CAF50"
              bgColor="#E8F5E8"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Rooms" 
              value={stats.totalRooms} 
              icon={<CommunityIcon sx={{ fontSize: 40 }} />} 
              color="#2196F3"
              bgColor="#E3F2FD"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Occupied Rooms" 
              value={stats.occupiedRooms} 
              subvalue={stats.occupancyRate > 0 ? `${stats.occupancyRate}% occupancy` : null}
              icon={<OccupantsIcon sx={{ fontSize: 40 }} />} 
              color="#8B5CF6"
              bgColor="#F3E8FF"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Pending Bookings" 
              value={stats.pendingBookings} 
              icon={<PendingIcon sx={{ fontSize: 40 }} />} 
              color="#f44336"
              bgColor="#FFEBEE"
            />
          </Grid>
        </Grid>

        {/* AVAILABILITY ALERT */}
        {stats.availableRooms > 0 && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            icon={<CommunityIcon />}
          >
            <strong>{stats.availableRooms}</strong> rooms available across your properties
          </Alert>
        )}

        {/* EMPTY STATE */}
        {pgs.length === 0 && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, py: 2 }}
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
            <Typography variant="body1">
              <strong>No properties added yet!</strong> Click the button to add your first property.
            </Typography>
          </Alert>
        )}

        {/* PROPERTIES SECTION */}
        {pgs.length > 0 && (
          <>
            <MuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={600}>
                Your Properties
                <Chip 
                  label={pgs.length} 
                  size="small" 
                  sx={{ ml: 1, bgcolor: 'primary.main', color: 'white' }} 
                />
              </Typography>
            </MuiBox>

            <Grid container spacing={3} mb={4}>
              {pgs.map(pg => (
                <Grid item xs={12} key={pg.id || pg.pg_id}>
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
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* COMPACT TABLE FOR RECENT BOOKINGS - 5 COLUMNS (Removed Total Amount) */}
        <MuiBox mt={4}>
          <MuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600}>
              Recent Bookings
              {stats.totalBookings > 0 && (
                <Chip 
                  label={stats.totalBookings} 
                  size="small" 
                  sx={{ ml: 1, bgcolor: 'primary.main', color: 'white' }} 
                />
              )}
            </Typography>
            
            {stats.totalBookings > 5 && (
              <Button 
                onClick={() => navigate("/owner/bookings")}
                endIcon={<ViewIcon />}
                size="small"
              >
                View All
              </Button>
            )}
          </MuiBox>

          <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: 2 }}>
            <Table>
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
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        {/* PROPERTY COLUMN */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {booking.pg_name}
                          </Typography>
                        </TableCell>

                        {/* TENANT COLUMN */}
                        <TableCell>
                          <MuiBox display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#4CAF50', fontSize: '0.875rem' }}>
                              {booking.tenant_name?.charAt(0) || 'U'}
                            </Avatar>
                            <MuiBox>
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
                            </MuiBox>
                          </MuiBox>
                        </TableCell>

                        {/* CHECK-IN COLUMN */}
                        <TableCell>
                          <MuiBox>
                            <Typography variant="body2">
                              {formatDate(booking.check_in_date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.room_type}
                            </Typography>
                          </MuiBox>
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
                            sx={{ 
                              bgcolor: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              minWidth: 80
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
        </MuiBox>

        {/* SNACKBAR */}
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
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </MuiBox>
    </Container>
  );
};

export default OwnerDashboard;