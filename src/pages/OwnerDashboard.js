import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon
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
  const canvasRef = useRef(null);

  useEffect(() => {
    if (open && property) {
      generateQRCode();
    }
  }, [open, property]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const propertyId = property.id || property.pg_id;
      
      // Create URL for QR code
      const scanUrl = `https://nepxall.vercel.app/scan/${propertyId}`;
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      
      // Generate QR code with custom colors
      await QRCode.toCanvas(canvas, scanUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0A5CB8', // Brand primary blue
          light: '#ffffff'
        }
      });

      // Get the canvas context
      const ctx = canvas.getContext('2d');
      
      // Draw a white background for the center
      const centerSize = 80;
      const centerX = (canvas.width - centerSize) / 2;
      const centerY = (canvas.height - centerSize) / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX, centerY, centerSize, centerSize);
      
      // Draw rounded square for logo background
      ctx.beginPath();
      ctx.roundRect(centerX, centerY, centerSize, centerSize, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0A5CB8';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw house icon
      ctx.fillStyle = '#0A5CB8';
      
      // Draw house shape
      const houseX = centerX + 20;
      const houseY = centerY + 15;
      const houseWidth = 40;
      const houseHeight = 35;
      
      // Roof
      ctx.beginPath();
      ctx.moveTo(houseX, houseY + 10);
      ctx.lineTo(houseX + houseWidth/2, houseY - 10);
      ctx.lineTo(houseX + houseWidth, houseY + 10);
      ctx.closePath();
      ctx.fillStyle = '#0A5CB8';
      ctx.fill();
      
      // House body
      ctx.fillStyle = '#0A5CB8';
      ctx.fillRect(houseX, houseY + 10, houseWidth, houseHeight - 10);
      
      // Door
      ctx.fillStyle = '#1DB954';
      ctx.fillRect(houseX + 15, houseY + 25, 10, 15);
      
      // Draw brand name below icon
      ctx.font = 'bold 16px "Inter", Arial, sans-serif';
      ctx.fillStyle = '#0A5CB8';
      ctx.textAlign = 'center';
      ctx.fillText('NEPXALL', canvas.width / 2, centerY + centerSize + 25);
      
      // Draw tagline
      ctx.font = '10px "Inter", Arial, sans-serif';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Next Places for Living', canvas.width / 2, centerY + centerSize + 40);
      
      setQrDataUrl(canvas.toDataURL('image/png'));
      
    } catch (err) {
      console.error("❌ QR Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function for rounded rectangles
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
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

  const handlePrint = () => {
    if (!qrDataUrl || !property) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }

    const propertyId = property.id || property.pg_id;
    const pgCode = generatePGCode(propertyId);
    const status = property.status || 'active';
    const statusColor = status === 'active' ? '#10b981' : '#f59e0b';
    const statusText = status === 'active' ? 'ACTIVE' : 'PENDING';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${property.pg_name}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f9fafb;
            }
            .qr-container {
              max-width: 500px;
              width: 100%;
              background: white;
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
            .header {
              background: linear-gradient(135deg, #0A5CB8 0%, #1DB954 100%);
              color: white;
              padding: 32px;
              text-align: center;
            }
            .brand {
              font-size: 36px;
              font-weight: 800;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .tagline {
              font-size: 14px;
              opacity: 0.9;
              margin: 4px 0 0 0;
            }
            .content {
              padding: 32px;
              text-align: center;
            }
            .property-name {
              font-size: 24px;
              font-weight: 700;
              color: #111827;
              margin: 0 0 16px 0;
            }
            .pg-code {
              display: inline-block;
              background: #f3f4f6;
              color: #0A5CB8;
              font-weight: 700;
              font-size: 20px;
              padding: 12px 24px;
              border-radius: 12px;
              margin-bottom: 24px;
              letter-spacing: 1px;
              border: 1px solid #e5e7eb;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 20px;
              border-radius: 20px;
              margin-bottom: 20px;
              display: inline-block;
              border: 2px solid #e5e7eb;
              box-shadow: 0 8px 20px rgba(0,0,0,0.05);
            }
            .qr-image {
              width: 300px;
              height: 300px;
              display: block;
              border-radius: 12px;
            }
            .status-badge {
              display: inline-block;
              background: ${statusColor};
              color: white;
              font-weight: 600;
              font-size: 14px;
              padding: 8px 32px;
              border-radius: 30px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 16px;
            }
            @media print {
              body { background: white; padding: 0; }
              .qr-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="header">
              <h1 class="brand">NEPXALL</h1>
              <p class="tagline">Next Places for Living</p>
            </div>
            
            <div class="content">
              <h2 class="property-name">${property.pg_name}</h2>
              
              <div class="pg-code">${pgCode}</div>
              
              <div class="qr-wrapper">
                <img src="${qrDataUrl}" alt="QR Code" class="qr-image" />
              </div>
              
              <div class="status-badge">${statusText}</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for images to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!property) return null;

  const propertyId = property.id || property.pg_id;
  const pgCode = generatePGCode(propertyId);
  const status = property.status || 'active';
  const statusColor = status === 'active' ? '#10b981' : '#f59e0b';
  const statusText = status === 'active' ? 'ACTIVE' : 'PENDING';

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
            maxWidth: 550,
            width: '100%',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            outline: 'none',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}
        >
          {/* Header with brand gradient - Blue to Green */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0A5CB8 0%, #1DB954 100%)',
              color: 'white',
              p: 4,
              textAlign: 'center'
            }}
          >
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>

            <Typography variant="h2" fontWeight={800} sx={{ letterSpacing: '-0.5px', mb: 1 }}>
              NEPXALL
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Next Places for Living
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ p: 4, textAlign: 'center' }}>
            {/* Property Name */}
            <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: '#111827' }}>
              {property.pg_name}
            </Typography>
            
            {/* PG Code */}
            <Box
              sx={{
                display: 'inline-block',
                bgcolor: '#f3f4f6',
                color: '#0A5CB8',
                fontWeight: 700,
                fontSize: '1.5rem',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                mb: 3,
                border: '1px solid',
                borderColor: '#e5e7eb',
                letterSpacing: '1px'
              }}
            >
              {pgCode}
            </Box>

            {/* QR Code with Logo */}
            <Box
              sx={{
                bgcolor: '#ffffff',
                p: 3,
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 3,
                border: '2px solid',
                borderColor: '#e5e7eb',
                boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
              }}
            >
              {loading ? (
                <CircularProgress size={250} />
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${property.pg_name}`}
                  style={{
                    width: 300,
                    height: 300,
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              ) : null}
            </Box>

            {/* Status Badge */}
            <Box
              sx={{
                display: 'inline-block',
                bgcolor: statusColor,
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                px: 5,
                py: 1.5,
                borderRadius: 40,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                mb: 3,
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              {statusText}
            </Box>

            {/* Action Buttons */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={loading || !qrDataUrl}
                  sx={{
                    bgcolor: '#0A5CB8',
                    color: 'white',
                    py: 1.8,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#1DB954',
                    }
                  }}
                >
                  DOWNLOAD
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  disabled={loading || !qrDataUrl}
                  sx={{
                    bgcolor: '#0A5CB8',
                    color: 'white',
                    py: 1.8,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#1DB954',
                    }
                  }}
                >
                  PRINT
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

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

  // ⭐ QR Code Handler - Opens Modal
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