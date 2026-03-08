import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";
import QRCode from "qrcode";

import {
  Typography, Box, Button, Grid, Alert, Snackbar,
  CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Modal, Fade, Divider
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
  QrCodeScanner as QrCodeIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon
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

const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'confirmed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'error';
    case 'completed': return 'info';
    default: return 'default';
  }
};

// Generate PG Code
const generatePGCode = (id) => {
  return `NEPX-${String(id).padStart(5, '0')}`;
};

/* ---------------- QR MODAL COMPONENT ---------------- */
const QRCodeModal = ({ open, onClose, property }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (open && property) {
      generateQRCode();
    }
  }, [open, property]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const propertyId = property.id || property.pg_id;
      const propertyName = property.pg_name || 'property';
      const pgCode = generatePGCode(propertyId);
      
      // Create URL for QR code
      const scanUrl = `https://nepxall.vercel.app/scan/${propertyId}`;
      
      // Generate QR code with custom design
      const qr = await QRCode.toDataURL(scanUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#4f46e5', // Primary color
          light: '#ffffff'
        }
      });

      setQrDataUrl(qr);
    } catch (err) {
      console.error("❌ QR Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl || !property) return;
    
    const propertyId = property.id || property.pg_id;
    const propertyName = property.pg_name || 'property';
    const sanitizedName = propertyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const pgCode = generatePGCode(propertyId);
    
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `nepxall-${sanitizedName}-${pgCode}.png`;
    link.click();
  };

  const handleCopyLink = () => {
    if (!property) return;
    
    const propertyId = property.id || property.pg_id;
    const scanUrl = `https://nepxall.vercel.app/scan/${propertyId}`;
    
    navigator.clipboard.writeText(scanUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!property) return null;

  const propertyId = property.id || property.pg_id;
  const pgCode = generatePGCode(propertyId);
  const scanUrl = `https://nepxall.vercel.app/scan/${propertyId}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Fade in={open}>
        <Paper
          sx={{
            maxWidth: 500,
            width: '100%',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            outline: 'none'
          }}
        >
          {/* Header with brand colors */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              p: 3,
              textAlign: 'center'
            }}
          >
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>

            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              NEPXALL
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Next Places for Living
            </Typography>
          </Box>

          {/* Property Info */}
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
              {property.pg_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {property.area}, {property.city}
            </Typography>
            
            <Chip
              label={pgCode}
              sx={{
                bgcolor: '#f3f4f6',
                color: '#4f46e5',
                fontWeight: 600,
                fontSize: '1rem',
                p: 2,
                borderRadius: 2,
                mb: 3
              }}
            />

            {/* QR Code */}
            <Box
              sx={{
                bgcolor: '#f9fafb',
                p: 3,
                borderRadius: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2
              }}
            >
              {loading ? (
                <CircularProgress size={200} />
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${property.pg_name}`}
                  style={{
                    width: 250,
                    height: 250,
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
              ) : null}
            </Box>

            {/* Scan Link */}
            <Box
              sx={{
                bgcolor: '#f3f4f6',
                p: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#4b5563'
                }}
              >
                {scanUrl}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopyLink}
                sx={{ color: copySuccess ? '#10b981' : '#4f46e5' }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
            {copySuccess && (
              <Typography variant="caption" sx={{ color: '#10b981', display: 'block', mb: 2 }}>
                ✓ Link copied to clipboard
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Instructions */}
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                📋 How to use:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                1. Print this QR code and display at your property
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                2. Tenants can scan to view property details instantly
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. Track scans and bookings in your dashboard
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={loading || !qrDataUrl}
                  sx={{
                    borderColor: '#4f46e5',
                    color: '#4f46e5',
                    '&:hover': {
                      borderColor: '#7c3aed',
                      bgcolor: '#f5f3ff'
                    }
                  }}
                >
                  Download
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onClose}
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#7c3aed' }
                  }}
                >
                  Done
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
};

/* ---------------- COMPONENT ---------------- */

const OwnerDashboard = () => {

  const navigate = useNavigate();

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

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

      const sortedBookings = bookings
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

      const totalEarnings = bookings
        .filter(b => ["confirmed", "completed"].includes(b?.status?.toLowerCase()))
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyEarnings = bookings
        .filter(b => {
          if (!["confirmed", "completed"].includes(b?.status?.toLowerCase())) return false;
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

  // ⭐ NEW: QR Code Handler - Opens Modal
  const handleGenerateQR = (propertyId) => {
    const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
    if (property) {
      setSelectedProperty(property);
      setQrModalOpen(true);
    } else {
      setSnackbar({
        open: true,
        message: "❌ Property not found",
        severity: "error"
      });
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

      {/* QR Code Modal */}
      <QRCodeModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        property={selectedProperty}
      />

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

      {/* BOOKINGS TABLE */}
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
          
          {stats.totalBookings > 5 && (
            <Button 
              onClick={() => navigate("/owner/bookings")}
              endIcon={<ViewIcon />}
              size="small"
            >
              View All
            </Button>
          )}
        </Box>

        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Tenant</strong></TableCell>
                <TableCell><strong>Property</strong></TableCell>
                <TableCell><strong>Check In</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No bookings yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar 
                          sx={{ 
                            width: 36, 
                            height: 36, 
                            bgcolor: '#4CAF50',
                            fontSize: '1rem'
                          }}
                        >
                          {booking.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {booking.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.email || ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {booking.pg_name || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {formatDate(booking.check_in_date || booking.created_at)}
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={600} color="primary.main">
                        {formatCurrency(booking.amount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip 
                        label={booking.status || 'pending'} 
                        size="small"
                        color={getStatusColor(booking.status)}
                        sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewBooking(booking.id)}
                        startIcon={<ViewIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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