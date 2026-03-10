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
  TrendingUp as TrendingUpIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Share as ShareIcon
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

  const [pgs, setPGs] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [pgDetailsMap, setPgDetailsMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
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

  // ⭐ MODERN QR CODE GENERATOR FUNCTION - UPDATED WITH SLEEK DESIGN
  const handleGenerateQR = async (propertyId) => {
    try {
      const BRAND_PRIMARY = "#6366F1"; // Indigo
      const BRAND_SECONDARY = "#8B5CF6"; // Purple
      const BRAND_ACCENT = "#EC4899"; // Pink

      const property = pgs.find(p => (p.id === propertyId || p.pg_id === propertyId));
      const propertyName = property?.pg_name || "PG";
      const propertyAddress = property?.address || property?.location || "Premium Living Space";
      const propertyPrice = property?.rent_amount || property?.single_sharing || 5000;
      
      const formattedPrice = formatCurrency(propertyPrice);
      const url = `https://nepxall.vercel.app/scan/${propertyId}`;

      // Create QR code with modern styling
      const qr = new QRCodeStyling({
        width: 500,
        height: 500,
        data: url,
        image: window.location.origin + "/logo.png",
        margin: 10,
        qrOptions: {
          typeNumber: 0,
          mode: "Byte",
          errorCorrectionLevel: "H"
        },
        dotsOptions: {
          type: "dots", // Changed to dots for modern look
          gradient: {
            type: "linear",
            rotation: 45,
            colorStops: [
              { offset: 0, color: BRAND_PRIMARY },
              { offset: 0.5, color: BRAND_SECONDARY },
              { offset: 1, color: BRAND_ACCENT }
            ]
          }
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          gradient: {
            type: "linear",
            rotation: 180,
            colorStops: [
              { offset: 0, color: BRAND_SECONDARY },
              { offset: 1, color: BRAND_PRIMARY }
            ]
          }
        },
        cornersDotOptions: {
          type: "dot",
          color: BRAND_ACCENT
        },
        backgroundOptions: {
          color: "#ffffff",
          gradient: {
            type: "radial",
            colorStops: [
              { offset: 0, color: "#ffffff" },
              { offset: 1, color: "#f9fafb" }
            ]
          }
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 8,
          imageSize: 0.4,
          hideBackgroundDots: true
        }
      });

      /* MODERN POSTER CANVAS - UPDATED DESIGN */
      const canvas = document.createElement("canvas");
      canvas.width = 1080; // Instagram story size
      canvas.height = 1350;

      const ctx = canvas.getContext("2d");

      // Modern gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, "#f8fafc");
      bgGradient.addColorStop(0.5, "#f1f5f9");
      bgGradient.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative elements
      ctx.save();
      
      // Top decorative wave
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(300, 100, 600, 50, canvas.width, 200);
      ctx.lineTo(canvas.width, 0);
      ctx.closePath();
      
      const topGradient = ctx.createLinearGradient(0, 0, canvas.width, 200);
      topGradient.addColorStop(0, BRAND_PRIMARY + "20");
      topGradient.addColorStop(1, BRAND_SECONDARY + "20");
      ctx.fillStyle = topGradient;
      ctx.fill();

      // Bottom decorative wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.bezierCurveTo(400, canvas.height - 150, 800, canvas.height - 100, canvas.width, canvas.height - 50);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      
      const bottomGradient = ctx.createLinearGradient(0, canvas.height - 200, canvas.width, canvas.height);
      bottomGradient.addColorStop(0, BRAND_SECONDARY + "20");
      bottomGradient.addColorStop(1, BRAND_ACCENT + "20");
      ctx.fillStyle = bottomGradient;
      ctx.fill();

      ctx.restore();

      // Add subtle pattern
      ctx.save();
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(100 + i * 100, 300 + i * 80, 50, 0, Math.PI * 2);
        ctx.fillStyle = BRAND_PRIMARY;
        ctx.fill();
      }
      ctx.restore();

      /* LOAD LOGO */
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = "/logo.png";

      logo.onload = async () => {
        // Logo with shadow
        ctx.save();
        ctx.shadowColor = "rgba(99, 102, 241, 0.3)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(logo, 390, 60, 300, 120);
        ctx.restore();

        // Main title with gradient
        ctx.textAlign = "center";
        
        // "NEPXALL" text with modern style
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        const titleGradient = ctx.createLinearGradient(300, 200, 780, 200);
        titleGradient.addColorStop(0, BRAND_PRIMARY);
        titleGradient.addColorStop(0.5, BRAND_SECONDARY);
        titleGradient.addColorStop(1, BRAND_ACCENT);
        
        ctx.font = "900 80px 'Poppins', 'Arial Black', sans-serif";
        ctx.fillStyle = titleGradient;
        ctx.fillText("NEPXALL", 540, 240);
        ctx.restore();

        // Tagline with modern typography
        ctx.font = "500 28px 'Poppins', 'Arial', sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText("Next Places for Living", 540, 300);

        // Property card design
        ctx.save();
        
        // Property name card
        ctx.shadowColor = "rgba(99, 102, 241, 0.2)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
        
        // White card background
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(200, 340, 680, 120, 24);
        ctx.fill();
        
        ctx.restore();

        // Property name
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.05)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.font = "bold 48px 'Poppins', 'Arial', sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.fillText(propertyName.toUpperCase(), 540, 400);
        ctx.restore();

        // Address
        ctx.font = "22px 'Poppins', 'Arial', sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(propertyAddress.substring(0, 35) + (propertyAddress.length > 35 ? "..." : ""), 540, 460);

        // Price highlight
        ctx.save();
        ctx.shadowColor = "rgba(236, 72, 153, 0.3)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        const priceGradient = ctx.createLinearGradient(400, 490, 680, 490);
        priceGradient.addColorStop(0, BRAND_PRIMARY);
        priceGradient.addColorStop(1, BRAND_ACCENT);
        
        ctx.font = "bold 64px 'Poppins', 'Arial', sans-serif";
        ctx.fillStyle = priceGradient;
        ctx.fillText(`${formattedPrice}/mo`, 540, 560);
        ctx.restore();

        // Scan instruction with icon
        ctx.font = "26px 'Poppins', 'Arial', sans-serif";
        ctx.fillStyle = "#334155";
        ctx.fillText("📱 Scan to Explore Rooms", 540, 630);

        ctx.font = "22px 'Poppins', 'Arial', sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("Instant Booking • Virtual Tour • Best Offers", 540, 680);

        /* QR IMAGE */
        const qrBlob = await qr.getRawData("png");
        const qrImg = new Image();
        qrImg.src = URL.createObjectURL(qrBlob);

        qrImg.onload = () => {
          ctx.save();
          
          // QR Code shadow and frame
          ctx.shadowColor = "rgba(99, 102, 241, 0.3)";
          ctx.shadowBlur = 30;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 10;
          
          // White background for QR
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(240, 710, 600, 600, 40);
          ctx.fill();
          
          ctx.shadowBlur = 20;
          ctx.drawImage(qrImg, 260, 730, 560, 560);
          ctx.restore();

          // Decorative QR corners
          ctx.save();
          ctx.strokeStyle = BRAND_PRIMARY;
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 10]);
          
          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(280, 750);
          ctx.lineTo(320, 750);
          ctx.moveTo(280, 750);
          ctx.lineTo(280, 790);
          
          // Top-right corner
          ctx.beginPath();
          ctx.moveTo(800, 750);
          ctx.lineTo(840, 750);
          ctx.moveTo(840, 750);
          ctx.lineTo(840, 790);
          
          // Bottom-left corner
          ctx.beginPath();
          ctx.moveTo(280, 1250);
          ctx.lineTo(320, 1250);
          ctx.moveTo(280, 1250);
          ctx.lineTo(280, 1210);
          
          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(800, 1250);
          ctx.lineTo(840, 1250);
          ctx.moveTo(840, 1250);
          ctx.lineTo(840, 1210);
          
          ctx.stroke();
          ctx.restore();

          /* FOOTER WITH MODERN DESIGN */
          ctx.save();
          
          // Footer background
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0,0,0,0.05)";
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = -4;
          
          ctx.beginPath();
          ctx.rect(0, 1300, canvas.width, 50);
          ctx.fill();
          
          ctx.restore();

          // Footer text
          ctx.font = "22px 'Poppins', 'Arial', sans-serif";
          
          const footerGradient = ctx.createLinearGradient(300, 1325, 780, 1325);
          footerGradient.addColorStop(0, BRAND_PRIMARY);
          footerGradient.addColorStop(0.5, BRAND_SECONDARY);
          footerGradient.addColorStop(1, BRAND_ACCENT);
          
          ctx.fillStyle = footerGradient;
          ctx.fillText("⚡ Powered by Nepxall - Premium Living Spaces", 540, 1325);

          // Add download button text
          ctx.font = "18px 'Poppins', 'Arial', sans-serif";
          ctx.fillStyle = "#94a3b8";
          ctx.fillText("↓ QR Code Generated - Save to Share", 540, 1375);

          /* DOWNLOAD */
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `nepxall-${propertyName.toLowerCase().replace(/\s+/g, '-')}-premium-qr.png`;
          link.click();

          // Show success message
          setSnackbar({
            open: true,
            message: "Modern QR Code generated successfully!",
            severity: "success"
          });
        };
      };
    } catch (err) {
      console.error("QR Generation Error:", err);
      setSnackbar({
        open: true,
        message: "Failed to generate QR code",
        severity: "error"
      });
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
    this.closePath();
    return this;
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ width: '100%' }}>

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

        {/* COMPACT TABLE FOR RECENT BOOKINGS - 5 COLUMNS (Removed Total Amount) */}
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
    </Container>
  );
};

export default OwnerDashboard;