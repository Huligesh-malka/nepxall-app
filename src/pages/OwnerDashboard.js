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
  Divider
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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Person as PersonIcon
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
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const formatDateString = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toDateString();
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

const getStatusStyle = (status) => {
  switch(status?.toLowerCase()) {
    case 'approved':
      return { background: "#16a34a", color: "#fff" };
    case 'rejected':
      return { background: "#dc2626", color: "#fff" };
    case 'pending':
      return { background: "#f59e0b", color: "#fff" };
    default:
      return { background: "#6b7280", color: "#fff" };
  }
};

/* ---------------- COMPONENT ---------------- */

const OwnerDashboard = () => {

  const navigate = useNavigate();

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
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

      const properties = pgData.map(pg => {
        const photos = parseArray(pg.photos);
        
        return {
          ...pg,
          id: pg.id || pg.pg_id,
          pg_id: pg.pg_id || pg.id,
          photos,
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

      // Filter out invalid bookings
      const validBookings = bookings.filter(booking => 
        booking && booking.id
      );

      const sortedBookings = validBookings
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

      const ratings = properties
        .filter(p => p.avg_rating > 0)
        .map(p => p.avg_rating);

      const avgRating = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;

      const totalEarnings = validBookings
        .filter(b => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyEarnings = validBookings
        .filter(b => {
          if (!["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase())) return false;
          const d = new Date(b.created_at || b.check_in_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const pendingBookings = validBookings.filter(b => 
        b?.status?.toLowerCase() === "pending"
      ).length;

      setStats({
        totalProperties: properties.length,
        totalRooms,
        availableRooms,
        totalEarnings,
        monthlyEarnings,
        pendingBookings,
        totalBookings: validBookings.length,
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
  }, [navigate, recentEnquiries.length]);

  /* ---------------- UPDATE BOOKING STATUS ---------------- */

  const updateBookingStatus = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);

      const token = await auth.currentUser.getIdToken(true);

      await pgAPI.updateBookingStatus(bookingId, status);

      setSnackbar({
        open: true,
        message: `Booking ${status} successfully`,
        severity: "success"
      });

      // Reload data to reflect changes
      loadAllData(true);

    } catch (err) {
      console.error("❌ Status update error:", err);

      if (err.response?.data?.code === "ONBOARDING_PENDING") {
        setSnackbar({
          open: true,
          message: "Please complete owner verification first",
          severity: "warning"
        });
        navigate("/owner/bank");
        return;
      }

      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Action failed",
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

  const handleViewAllBookings = () => {
    navigate("/owner/bookings");
  };

  const handleApproveBooking = (bookingId) => {
    updateBookingStatus(bookingId, "approved");
  };

  const handleRejectBooking = (bookingId) => {
    updateBookingStatus(bookingId, "rejected");
  };

  // QR Code Generator Function
  const handleGenerateQR = async (propertyId) => {
    try {
      const BRAND_BLUE = "#0B5ED7";
      const BRAND_GREEN = "#4CAF50";

      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      const propertyName = property?.pg_name || "PG";

      const url = `https://nepxall.vercel.app/scan/${propertyId}`;

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
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
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

      {/* RECENT BOOKINGS SECTION - Simple Card Style */}
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
          
          <Button 
            onClick={handleViewAllBookings}
            endIcon={<ViewIcon />}
            variant="outlined"
            size="small"
          >
            View All
          </Button>
        </Box>

        {recentBookings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f9fafb', borderRadius: 2 }}>
            <Typography color="text.secondary" gutterBottom>
              No booking requests yet
            </Typography>
            <Button 
              size="small" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              sx={{ mt: 1 }}
            >
              Reload
            </Button>
          </Paper>
        ) : (
          <Box>
            {recentBookings.map((booking) => (
              <Card key={booking.id} sx={{ 
                mb: 2, 
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Simple format like the example */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      <strong>PG:</strong> {booking.pg_name || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      <strong>Tenant:</strong> {booking.tenant_name || booking.name || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      <strong>Phone:</strong> {booking.tenant_phone || booking.phone || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      <strong>Check-in:</strong> {formatDateString(booking.check_in_date)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      <strong>Room Type:</strong> {booking.room_type || 'Standard'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      <strong>Status:</strong>{' '}
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 20,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        background: booking.status?.toLowerCase() === 'approved' ? '#16a34a' :
                                   booking.status?.toLowerCase() === 'rejected' ? '#dc2626' :
                                   booking.status?.toLowerCase() === 'pending' ? '#f59e0b' : '#6b7280',
                        marginLeft: 8
                      }}>
                        {booking.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </Typography>
                  </Box>

                  {/* Action Buttons for Pending Bookings */}
                  {booking.status?.toLowerCase() === 'pending' && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        sx={{ 
                          bgcolor: '#16a34a', 
                          '&:hover': { bgcolor: '#15803d' },
                          color: '#fff',
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                        disabled={actionLoading === booking.id}
                        onClick={() => handleApproveBooking(booking.id)}
                        startIcon={actionLoading === booking.id ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckCircleIcon />}
                      >
                        {actionLoading === booking.id ? 'Processing...' : '✅ Approve'}
                      </Button>

                      <Button
                        variant="contained"
                        sx={{ 
                          bgcolor: '#dc2626', 
                          '&:hover': { bgcolor: '#b91c1c' },
                          color: '#fff',
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                        disabled={actionLoading === booking.id}
                        onClick={() => handleRejectBooking(booking.id)}
                        startIcon={actionLoading === booking.id ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CancelIcon />}
                      >
                        {actionLoading === booking.id ? 'Processing...' : '❌ Reject'}
                      </Button>
                    </Box>
                  )}

                  {/* View Details for Non-Pending Bookings */}
                  {booking.status?.toLowerCase() !== 'pending' && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewBooking(booking.id)}
                        startIcon={<ViewIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
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