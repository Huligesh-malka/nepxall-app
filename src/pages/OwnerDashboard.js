import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { pgAPI } from "../api/api"; // This imports pgAPI, but not the default api
import { getImageUrl } from "../config";

import QRCodeStyling from "qr-code-styling";

import {
  Typography, Box, Button, Grid, Alert, Snackbar,
  CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Card, CardContent,
  Divider, Stack, Collapse
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
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
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
  if (!amt) return "₹0";
  const num = Number(amt);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
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
    case 'approved':
    case 'confirmed': 
      return 'success';
    case 'pending': 
      return 'warning';
    case 'rejected':
    case 'cancelled': 
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

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalRooms: 0,
    availableRooms: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    pendingBookings: 0,
    totalBookings: 0,
    avgRating: 0,
    totalEnquiries: 0
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

      // Debug: Log the first property's photos to see format
      if (pgData.length > 0) {
        console.log("📸 First property photos (raw):", pgData[0].photos);
      }

      const properties = pgData.map(pg => {
        const photos = parseArray(pg.photos);
        
        // Debug: Log parsed photos
        console.log(`Property ${pg.pg_name} parsed photos:`, photos);
        
        return {
          ...pg,
          id: pg.id || pg.pg_id,
          pg_id: pg.pg_id || pg.id,
          photos,
          // ✅ Don't use getImageUrl here - let PropertyCard handle it
          image: photos.length ? photos[0] : null,
          total_rooms: Number(pg.total_rooms) || 0,
          available_rooms: Number(pg.available_rooms) || 0
        };
      });

      setPGs(properties);
      console.log(`✅ Loaded ${properties.length} properties`);

      /* -------- BOOKINGS USING pgAPI -------- */

      console.log("📡 Fetching owner bookings...");
      const bookingsRes = await pgAPI.getOwnerBookings();
      console.log("✅ Bookings received:", bookingsRes.data);

      const bookings = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data?.bookings || [];

      // Enhance booking data with more details
      const enhancedBookings = bookings.map(booking => ({
        ...booking,
        tenant_name: booking.name || booking.tenant_name || 'Unknown',
        tenant_phone: booking.phone || booking.tenant_phone,
        tenant_email: booking.email || booking.tenant_email,
        room_type: booking.room_type || 'Not specified',
        check_in_date: booking.check_in_date || booking.created_at,
        amount: booking.amount || 0,
        pg_name: booking.pg_name || 'N/A'
      }));

      const sortedBookings = enhancedBookings
        .sort(
          (a, b) =>
            new Date(b.created_at || b.check_in_date || 0) -
            new Date(a.created_at || a.check_in_date || 0)
        )
        .slice(0, 10); // Show more recent bookings

      setRecentBookings(sortedBookings);

      /* -------- STATS -------- */

      const totalRooms = properties.reduce((a, b) => a + (b.total_rooms || 0), 0);
      const availableRooms = properties.reduce((a, b) => a + (b.available_rooms || 0), 0);

      const ratings = properties
        .filter(p => p.avg_rating > 0)
        .map(p => p.avg_rating);

      const avgRating = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;

      const totalEarnings = bookings
        .filter(b => ["approved", "confirmed", "completed"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyEarnings = bookings
        .filter(b => {
          if (!["approved", "confirmed", "completed"].includes(b?.status?.toLowerCase())) return false;
          const d = new Date(b.created_at || b.check_in_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const pendingBookings = bookings.filter(b => 
        b?.status?.toLowerCase() === "pending"
      ).length;

      setStats({
        totalProperties: properties.length,
        totalRooms,
        availableRooms,
        totalEarnings,
        monthlyEarnings,
        pendingBookings,
        totalBookings: bookings.length,
        avgRating,
        totalEnquiries: recentEnquiries.length
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
  }, [navigate]);

  /* ---------------- UPDATE BOOKING STATUS ---------------- */

  const updateBookingStatus = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      
      const token = await auth.currentUser.getIdToken(true);

      // Use pgAPI instead of api
      await pgAPI.updateBookingStatus(bookingId, status, token);

      setSnackbar({
        open: true,
        message: `Booking ${status} successfully`,
        severity: "success"
      });

      // Refresh bookings
      await loadAllData(true);

    } catch (err) {
      console.error(err);
      
      let errorMsg = "Failed to update booking";
      if (err.response?.data?.code === "ONBOARDING_PENDING") {
        errorMsg = "Please complete owner verification first";
        setTimeout(() => navigate("/owner/bank"), 2000);
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error"
      });

    } finally {
      setActionLoading(null);
    }
  };

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

  const handleExpandBooking = (bookingId) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const handleApproveBooking = (bookingId) => {
    updateBookingStatus(bookingId, "approved");
  };

  const handleRejectBooking = (bookingId) => {
    updateBookingStatus(bookingId, "rejected");
  };

  // ⭐ QR Code Generator Function
  const handleGenerateQR = async (propertyId) => {
    try {
      const BRAND_BLUE = "#0B5ED7";
      const BRAND_GREEN = "#4CAF50";

      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      const propertyName = property?.pg_name || "PG";

      const url = `https://nepxall.vercel.app/scan/${propertyId}`;

      /* QR DESIGN */
      const qr = new QRCodeStyling({
        width: 600,
        height: 600,
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

  /* ---------------- LOADER ---------------- */

  if (authLoading || loading) {
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

  /* ---------------- UI ---------------- */

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* HEADER */}
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

      {/* STATS CARDS */}
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
            title="Monthly Earnings" 
            value={formatCurrency(stats.monthlyEarnings)} 
            icon={<MoneyIcon sx={{ fontSize: 40 }} />} 
            color="#FF9800"
            bgColor="#FFF3E0"
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600}>
              Your Properties
              <Chip 
                label={pgs.length} 
                size="small" 
                sx={{ ml: 1, bgcolor: 'primary.main', color: 'white' }} 
              />
            </Typography>
          </Box>

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

      {/* ENHANCED BOOKINGS SECTION */}
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={600}>
            Recent Booking Requests
            {stats.totalBookings > 0 && (
              <Chip 
                label={stats.totalBookings} 
                size="small" 
                sx={{ ml: 1, bgcolor: 'primary.main', color: 'white' }} 
              />
            )}
          </Typography>
          
          {stats.totalBookings > 10 && (
            <Button 
              onClick={() => navigate("/owner/bookings")}
              endIcon={<ViewIcon />}
              size="small"
            >
              View All Bookings
            </Button>
          )}
        </Box>

        <Stack spacing={2}>
          {recentBookings.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No booking requests yet
              </Typography>
            </Paper>
          ) : (
            recentBookings.map((booking) => {
              const statusStyle = getStatusBadgeStyle(booking.status);
              const isExpanded = expandedBooking === booking.id;
              
              return (
                <Card 
                  key={booking.id} 
                  sx={{ 
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header - Always Visible */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                      <Box>
                        <Typography variant="h6" fontWeight={600} color="primary.main" gutterBottom>
                          {booking.pg_name}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#4CAF50' }}>
                            {booking.tenant_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {booking.tenant_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {booking.tenant_phone ? (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <PhoneIcon sx={{ fontSize: 14 }} />
                                  {booking.tenant_phone}
                                </Box>
                              ) : (
                                <span style={{ color: '#f59e0b' }}>
                                  🔒 Phone hidden until approval
                                </span>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {formatDate(booking.check_in_date)}
                          </Typography>
                          <Chip 
                            label={booking.status?.toUpperCase() || 'PENDING'}
                            size="small"
                            sx={{ 
                              mt: 1,
                              bgcolor: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                        
                        <IconButton 
                          onClick={() => handleExpandBooking(booking.id)}
                          sx={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.3s'
                          }}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Quick Info Row */}
                    <Box display="flex" gap={3} mt={2} flexWrap="wrap">
                      <Box display="flex" alignItems="center" gap={1}>
                        <RoomIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Room Type:</strong> {booking.room_type}
                        </Typography>
                      </Box>
                      
                      {booking.amount > 0 && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <MoneyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            <strong>Amount:</strong> {formatCurrency(booking.amount)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Expanded Details */}
                    <Collapse in={isExpanded}>
                      <Box mt={3} pt={2} sx={{ borderTop: '1px solid #e5e7eb' }}>
                        <Grid container spacing={2}>
                          {/* Contact Details */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              Contact Information
                            </Typography>
                            <Stack spacing={1}>
                              {booking.tenant_email && (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2">{booking.tenant_email}</Typography>
                                </Box>
                              )}
                              {booking.tenant_phone && (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2">{booking.tenant_phone}</Typography>
                                </Box>
                              )}
                            </Stack>
                          </Grid>

                          {/* Booking Details */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              Booking Details
                            </Typography>
                            <Stack spacing={1}>
                              <Typography variant="body2">
                                <strong>Booking ID:</strong> {booking.id}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Booked on:</strong> {formatDate(booking.created_at)}
                              </Typography>
                              {booking.special_requests && (
                                <Typography variant="body2">
                                  <strong>Special Requests:</strong> {booking.special_requests}
                                </Typography>
                              )}
                            </Stack>
                          </Grid>
                        </Grid>

                        {/* Action Buttons for Pending Bookings */}
                        {booking.status?.toLowerCase() === 'pending' && (
                          <Box display="flex" gap={2} mt={3}>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleApproveBooking(booking.id)}
                              disabled={actionLoading === booking.id}
                              sx={{ flex: 1 }}
                            >
                              {actionLoading === booking.id ? 'Processing...' : 'Approve Booking'}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<RejectIcon />}
                              onClick={() => handleRejectBooking(booking.id)}
                              disabled={actionLoading === booking.id}
                              sx={{ flex: 1 }}
                            >
                              {actionLoading === booking.id ? 'Processing...' : 'Reject Booking'}
                            </Button>
                          </Box>
                        )}

                        {/* View Details Button */}
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                          <Button
                            size="small"
                            onClick={() => handleViewBooking(booking.id)}
                            endIcon={<ViewIcon />}
                          >
                            View Full Details
                          </Button>
                        </Box>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      </Box>

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

    </Box>
  );
};

export default OwnerDashboard;