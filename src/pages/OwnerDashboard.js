import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { pgAPI } from "../api/api";
import { getImageUrl } from "../config";
import QRCodeStyling from "qr-code-styling";

import {
  Box,
  CircularProgress,
  Typography,
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
  alpha,
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
  Edit as EditIcon,
  QrCode as QrCodeIcon,
  PhotoCamera as PhotoIcon,
  VideoCameraBack as VideoIcon,
  Campaign as CampaignIcon,
  ArrowForward as ArrowForwardIcon,
  Dashboard as DashboardIcon,
  Storefront as StorefrontIcon,
  EventAvailable as EventAvailableIcon,
  Star as StarIcon,
} from "@mui/icons-material";

/* ---------------- GLASSMORPHISM STYLES ---------------- */

const glassCard = {
  backdropFilter: "blur(16px)",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-5px) scale(1.01)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
};

const gradientBg = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  backgroundAttachment: "fixed",
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)",
    pointerEvents: "none",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)",
    pointerEvents: "none",
  },
};

const neonStatCard = (color) => ({
  backdropFilter: "blur(16px)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "28px",
  border: `1px solid ${alpha(color, 0.3)}`,
  boxShadow: `0 8px 32px ${alpha(color, 0.1)}`,
  transition: "all 0.3s ease",
  overflow: "hidden",
  position: "relative",
  "&:hover": {
    transform: "translateY(-8px)",
    border: `1px solid ${alpha(color, 0.6)}`,
    boxShadow: `0 20px 40px ${alpha(color, 0.2)}`,
  },
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`,
  },
});

/* ---------------- HELPERS ---------------- */

const parseArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
};

const formatCurrency = (amt) => {
  if (!amt && amt !== 0) return "₹0";
  const num = Number(amt);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const getStatusBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "confirmed":
      return { bg: "#16a34a", color: "#fff", glow: "0 0 10px #16a34a" };
    case "pending":
      return { bg: "#f59e0b", color: "#fff", glow: "0 0 10px #f59e0b" };
    case "rejected":
    case "cancelled":
      return { bg: "#dc2626", color: "#fff", glow: "0 0 10px #dc2626" };
    case "completed":
      return { bg: "#0284c7", color: "#fff", glow: "0 0 10px #0284c7" };
    default:
      return { bg: "#6b7280", color: "#fff", glow: "none" };
  }
};

/* ---------------- MAIN COMPONENT ---------------- */

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
  const [hoveredCard, setHoveredCard] = useState(null);

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
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /* ---------------- HELPER FUNCTIONS ---------------- */

  const getRentByRoomType = (pg, roomType) => {
    if (!pg) return 0;
    const roomTypeLower = roomType?.toLowerCase() || "";

    if (roomTypeLower.includes("single sharing")) {
      return (
        Number(pg.single_sharing) ||
        Number(pg.single_room) ||
        Number(pg.co_living_single_room) ||
        Number(pg.rent_amount) ||
        0
      );
    } else if (roomTypeLower.includes("double sharing")) {
      return Number(pg.double_sharing) || Number(pg.double_room) || Number(pg.co_living_double_room) || 0;
    } else if (roomTypeLower.includes("triple sharing")) {
      return Number(pg.triple_sharing) || Number(pg.triple_room) || 0;
    } else if (roomTypeLower.includes("four sharing")) {
      return Number(pg.four_sharing) || 0;
    } else if (roomTypeLower.includes("1bhk") || roomTypeLower.includes("1 bhk")) {
      return Number(pg.price_1bhk) || 0;
    } else if (roomTypeLower.includes("2bhk") || roomTypeLower.includes("2 bhk")) {
      return Number(pg.price_2bhk) || 0;
    } else if (roomTypeLower.includes("3bhk") || roomTypeLower.includes("3 bhk")) {
      return Number(pg.price_3bhk) || 0;
    } else if (roomTypeLower.includes("4bhk") || roomTypeLower.includes("4 bhk")) {
      return Number(pg.price_4bhk) || 0;
    } else {
      return Number(pg.rent_amount) || 0;
    }
  };

  const getDepositByRoomType = (pg, roomType) => {
    if (!pg) return 0;
    return Number(pg.security_deposit) || Number(pg.deposit_amount) || 0;
  };

  /* ---------------- LOAD DATA ---------------- */

  const loadAllData = useCallback(
    async (refresh = false) => {
      try {
        if (!user) {
          console.log("❌ No user");
          return;
        }

        refresh ? setRefreshing(true) : setPageLoading(true);
        console.log("📡 Loading dashboard data...");

        const pgRes = await pgAPI.getOwnerDashboard();
        console.log("✅ PG Data received:", pgRes.data);

        const pgData = Array.isArray(pgRes.data) ? pgRes.data : pgRes.data?.data || [];

        const pgMap = {};
        const properties = pgData.map((pg) => {
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
            triple_room: Number(pg.triple_room) || 0,
          };
        });

        setPGs(properties);
        setPgDetailsMap(pgMap);
        console.log(`✅ Loaded ${properties.length} properties`);

        const bookingsRes = await pgAPI.getOwnerBookings();
        console.log("✅ Bookings received:", bookingsRes.data);

        const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data?.bookings || [];
        setBookingHistory(bookings);

        const enhancedBookings = bookings.map((booking) => {
          const pgId = booking.pg_id || booking.property_id;
          const pg = pgMap[pgId];
          const roomType = booking.room_type || "";
          const monthlyRent = getRentByRoomType(pg, roomType);
          const deposit = getDepositByRoomType(pg, roomType);

          return {
            ...booking,
            tenant_name: booking.name || booking.tenant_name || "Unknown",
            tenant_phone: booking.phone || booking.tenant_phone,
            tenant_email: booking.email || booking.tenant_email,
            room_type: booking.room_type || "Not specified",
            check_in_date: booking.check_in_date || booking.created_at,
            amount: Number(booking.amount) || monthlyRent || 0,
            monthly_rent: monthlyRent,
            deposit_amount: deposit,
            pg_name: booking.pg_name || pg?.pg_name || "N/A",
            pg_details: pg,
          };
        });

        const sortedBookings = enhancedBookings
          .sort(
            (a, b) =>
              new Date(b.created_at || b.check_in_date || 0) - new Date(a.created_at || a.check_in_date || 0)
          )
          .slice(0, 5);

        setRecentBookings(sortedBookings);

        const totalRooms = properties.reduce((a, b) => a + (b.total_rooms || 0), 0);
        const availableRooms = properties.reduce((a, b) => a + (b.available_rooms || 0), 0);
        const occupiedRooms = totalRooms - availableRooms;
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        const ratings = properties.filter((p) => p.avg_rating > 0).map((p) => p.avg_rating);
        const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

        const totalRent = enhancedBookings
          .filter((b) => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
          .reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);

        const totalDeposit = enhancedBookings
          .filter((b) => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
          .reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);

        const pendingRent = enhancedBookings
          .filter((b) => b?.status?.toLowerCase() === "pending")
          .reduce((a, b) => a + (Number(b.monthly_rent) || 0), 0);

        const pendingDeposit = enhancedBookings
          .filter((b) => b?.status?.toLowerCase() === "pending")
          .reduce((a, b) => a + (Number(b.deposit_amount) || 0), 0);

        const totalEarnings = enhancedBookings
          .filter((b) => ["confirmed", "completed", "approved"].includes(b?.status?.toLowerCase()))
          .reduce((a, b) => a + (Number(b.amount) || 0), 0);

        const pendingBookings = bookings.filter((b) => b?.status?.toLowerCase() === "pending").length;

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
          pendingDeposit,
        });

        setSnackbar({
          open: true,
          message: "Dashboard loaded successfully",
          severity: "success",
        });
      } catch (err) {
        console.error("❌ Dashboard error:", err?.response?.data || err.message);

        if (err.response?.status === 401) {
          console.log("🔐 Unauthorized");
        }

        setSnackbar({
          open: true,
          message: err.response?.data?.message || "Failed to load dashboard",
          severity: "error",
        });
      } finally {
        setPageLoading(false);
        setRefreshing(false);
      }
    },
    [user, recentEnquiries.length]
  );

  /* ---------------- AUTH + LOAD ---------------- */

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

  const handleGenerateQR = async (propertyId) => {
    try {
      const BRAND_BLUE = "#0B5ED7";
      const BRAND_GREEN = "#4CAF50";
      const property = pgs.find((p) => p.id === propertyId || p.pg_id === propertyId);
      const propertyName = property?.pg_name || "PG";
      const url = `https://nepxall-app.vercel.app/scan/${propertyId}`;

      const qr = new QRCodeStyling({
        width: 600,
        height: 600,
        data: url,
        dotsOptions: {
          type: "square",
          color: "#000000",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          type: "square",
          color: "#000000",
        },
        cornersDotOptions: {
          type: "square",
          color: "#000000",
        },
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

  /* ================= PROTECTION ================= */

  if (authLoading || pageLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={70} thickness={4} sx={{ color: "#22c55e", mb: 2 }} />
          <Typography sx={{ color: "white", opacity: 0.8 }}>Loading your premium dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  /* ---------------- UI ---------------- */

  return (
    <Box sx={gradientBg}>
      <Container maxWidth="xl" sx={{ py: 4, position: "relative", zIndex: 1 }}>
        {/* HEADER SECTION */}
        <Fade in timeout={600}>
          <Box
            sx={{
              ...glassCard,
              p: { xs: 2, md: 4 },
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: "linear-gradient(135deg, #fff, #94a3b8)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                👋 Welcome back, {user?.name?.split(" ")[0] || "Owner"}
              </Typography>
              <Typography sx={{ opacity: 0.7, mt: 0.5 }}>
                Manage your properties smarter 🚀 | Real-time insights
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Tooltip title="Refresh Dashboard">
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    backdropFilter: "blur(10px)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    "&:hover": { background: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <RefreshIcon sx={{ color: "#fff" }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Messages">
                <IconButton
                  onClick={() => navigate("/owner/chats")}
                  sx={{
                    backdropFilter: "blur(10px)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    "&:hover": { background: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <ChatIcon sx={{ color: "#22c55e" }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Notifications">
                <IconButton
                  onClick={() => navigate("/owner/notifications")}
                  sx={{
                    backdropFilter: "blur(10px)",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    "&:hover": { background: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <NotificationsIcon sx={{ color: "#a855f7" }} />
                </IconButton>
              </Tooltip>

              <Button
                startIcon={<AddIcon />}
                onClick={() => navigate("/owner/add")}
                sx={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  borderRadius: "16px",
                  px: 3,
                  py: 1,
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    transform: "scale(1.02)",
                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                  },
                  transition: "transform 0.2s",
                }}
              >
                + Add Property
              </Button>
            </Stack>
          </Box>
        </Fade>

        {/* STATS CARDS - NEON STYLE */}
        <Grid container spacing={3} mb={4}>
          {[
            { label: "Total Properties", value: stats.totalProperties, icon: <StorefrontIcon />, color: "#22c55e" },
            { label: "Total Rooms", value: stats.totalRooms, icon: <RoomIcon />, color: "#3b82f6" },
            { label: "Occupied Rooms", value: stats.occupiedRooms, color: "#a855f7", icon: <PeopleIcon /> },
            { label: "Pending Bookings", value: stats.pendingBookings, color: "#f59e0b", icon: <PendingIcon /> },
          ].map((item, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Zoom in timeout={300 + i * 100}>
                <Box sx={neonStatCard(item.color)}>
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography sx={{ opacity: 0.7, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: 1 }}>
                        {item.label}
                      </Typography>
                      <Box sx={{ color: item.color }}>{item.icon}</Box>
                    </Box>
                    <Typography variant="h3" fontWeight={800} sx={{ color: "#fff", mb: 1 }}>
                      {item.value}
                    </Typography>
                    {item.label === "Occupied Rooms" && (
                      <LinearProgress
                        variant="determinate"
                        value={stats.occupancyRate}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "rgba(255,255,255,0.1)",
                          "& .MuiLinearProgress-bar": {
                            background: `linear-gradient(90deg, #a855f7, #d946ef)`,
                            borderRadius: 3,
                          },
                        }}
                      />
                    )}
                    {item.label === "Occupied Rooms" && (
                      <Typography variant="caption" sx={{ opacity: 0.6, mt: 1, display: "block" }}>
                        {stats.occupancyRate}% Occupancy Rate
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* AVAILABILITY ALERT */}
        {stats.availableRooms > 0 && (
          <Fade in>
            <Alert
              severity="success"
              sx={{
                mb: 3,
                backdropFilter: "blur(16px)",
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "20px",
                color: "#fff",
                "& .MuiAlert-icon": { color: "#22c55e" },
              }}
              icon={<CommunityIcon />}
            >
              <strong>{stats.availableRooms}</strong> rooms available across your properties •{" "}
              <strong>{stats.totalBookings}</strong> total bookings received
            </Alert>
          </Fade>
        )}

        {/* EMPTY STATE */}
        {pgs.length === 0 && (
          <Fade in>
            <Alert
              severity="info"
              sx={{
                mb: 3,
                py: 2,
                backdropFilter: "blur(16px)",
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "20px",
                color: "#fff",
              }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate("/owner/add")}
                  startIcon={<AddIcon />}
                  sx={{ color: "#3b82f6" }}
                >
                  Add Now
                </Button>
              }
            >
              <Typography variant="body1">
                <strong>No properties added yet!</strong> Click the button to add your first property and start earning.
              </Typography>
            </Alert>
          </Fade>
        )}

        {/* PROPERTIES SECTION */}
        {pgs.length > 0 && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{
                  background: "linear-gradient(135deg, #fff, #c084fc)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Your Premium Properties
                <Chip
                  label={pgs.length}
                  size="small"
                  sx={{
                    ml: 1,
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "white",
                    fontWeight: 600,
                  }}
                />
              </Typography>
            </Box>

            <Grid container spacing={3} mb={4}>
              {pgs.map((pg, idx) => (
                <Grid item xs={12} key={pg.id || pg.pg_id}>
                  <Fade in timeout={300 + idx * 100}>
                    <Card
                      sx={{
                        ...glassCard,
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 2,
                        p: 2,
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          "& .property-image": {
                            transform: "scale(1.05)",
                          },
                        },
                      }}
                      onMouseEnter={() => setHoveredCard(pg.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {/* Image Section */}
                      <Box
                        sx={{
                          width: { xs: "100%", md: 220 },
                          height: 160,
                          borderRadius: "20px",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={getImageUrl(pg.image)}
                          alt={pg.pg_name}
                          className="property-image"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.5s ease",
                          }}
                        />
                      </Box>

                      {/* Content Section */}
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight={800} sx={{ color: "#fff" }}>
                          {pg.pg_name}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.6, mb: 1 }}>
                          {pg.address?.substring(0, 80)}...
                        </Typography>

                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                          <Chip
                            label="ACTIVE"
                            size="small"
                            sx={{
                              background: "linear-gradient(135deg, #22c55e, #16a34a)",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              boxShadow: "0 0 8px #22c55e",
                            }}
                          />
                          <Chip
                            label={`${pg.available_rooms || 0} rooms left`}
                            size="small"
                            sx={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
                          />
                          {pg.avg_rating > 0 && (
                            <Chip
                              icon={<StarIcon sx={{ fontSize: 14, color: "#fbbf24 !important" }} />}
                              label={`${pg.avg_rating} ★`}
                              size="small"
                              sx={{ background: "rgba(255,255,255,0.1)", color: "#fbbf24" }}
                            />
                          )}
                        </Box>

                        {/* Progress Bar for Occupancy */}
                        <Box sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>
                              Occupancy
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {Math.round(((pg.total_rooms - pg.available_rooms) / (pg.total_rooms || 1)) * 100)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={((pg.total_rooms - pg.available_rooms) / (pg.total_rooms || 1)) * 100}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "rgba(255,255,255,0.1)",
                              "& .MuiLinearProgress-bar": {
                                background: `linear-gradient(90deg, #22c55e, #4ade80)`,
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Tooltip title="View Details">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewProperty(pg.id || pg.pg_id)}
                              startIcon={<ViewIcon />}
                              sx={{
                                borderRadius: "12px",
                                borderColor: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                "&:hover": { borderColor: "#3b82f6", background: "rgba(59,130,246,0.1)" },
                              }}
                            >
                              View
                            </Button>
                          </Tooltip>
                          <Tooltip title="Edit Property">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEditProperty(pg.id || pg.pg_id)}
                              startIcon={<EditIcon />}
                              sx={{
                                borderRadius: "12px",
                                borderColor: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                "&:hover": { borderColor: "#f59e0b", background: "rgba(245,158,11,0.1)" },
                              }}
                            >
                              Edit
                            </Button>
                          </Tooltip>
                          <Tooltip title="Generate QR Code">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleGenerateQR(pg.id || pg.pg_id)}
                              startIcon={<QrCodeIcon />}
                              sx={{
                                borderRadius: "12px",
                                borderColor: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                "&:hover": { borderColor: "#a855f7", background: "rgba(168,85,247,0.1)" },
                              }}
                            >
                              QR
                            </Button>
                          </Tooltip>
                          <Tooltip title="Chat with Tenants">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleChat(pg.id || pg.pg_id)}
                              startIcon={<ChatIcon />}
                              sx={{
                                borderRadius: "12px",
                                borderColor: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                "&:hover": { borderColor: "#22c55e", background: "rgba(34,197,94,0.1)" },
                              }}
                            >
                              Chat
                            </Button>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* RECENT BOOKINGS TABLE */}
        <Box mt={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                background: "linear-gradient(135deg, #fff, #60a5fa)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Recent Bookings
              {stats.totalBookings > 0 && (
                <Chip
                  label={stats.totalBookings}
                  size="small"
                  sx={{
                    ml: 1,
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    color: "white",
                    fontWeight: 600,
                  }}
                />
              )}
            </Typography>

            {stats.totalBookings > 5 && (
              <Button
                onClick={() => navigate("/owner/bookings")}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: "#3b82f6",
                  "&:hover": { background: "rgba(59,130,246,0.1)" },
                }}
              >
                View All
              </Button>
            )}
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              ...glassCard,
              background: "rgba(255,255,255,0.05)",
              borderRadius: "24px",
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead sx={{ background: "rgba(0,0,0,0.2)" }}>
                <TableRow>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    PROPERTY
                  </TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    TENANT
                  </TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    CHECK-IN
                  </TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    MONTHLY RENT
                  </TableCell>
                  <TableCell sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    STATUS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ color: "#94a3b8" }}>No bookings yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentBookings.map((booking, idx) => {
                    const statusStyle = getStatusBadgeStyle(booking.status);
                    const monthlyRent = booking.monthly_rent || 0;

                    return (
                      <Fade in timeout={300 + idx * 50} key={booking.id}>
                        <TableRow
                          hover
                          sx={{
                            "&:hover": { background: "rgba(255,255,255,0.05)" },
                            "& td": { borderBottom: "1px solid rgba(255,255,255,0.05)" },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} sx={{ color: "#fff" }}>
                              {booking.pg_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                  fontSize: "0.9rem",
                                }}
                              >
                                {booking.tenant_name?.charAt(0) || "U"}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ color: "#fff" }}>
                                  {booking.tenant_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 12 }} />
                                  {booking.tenant_phone || <span style={{ color: "#f59e0b" }}>Hidden</span>}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ color: "#fff" }}>
                                {formatDate(booking.check_in_date)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                {booking.room_type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ color: "#a855f7" }}>
                              {formatCurrency(monthlyRent)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                              /month
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status?.toUpperCase() || "PENDING"}
                              size="small"
                              sx={{
                                bgcolor: statusStyle.bg,
                                color: statusStyle.color,
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                minWidth: 90,
                                boxShadow: statusStyle.glow,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      </Fade>
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
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: "100%", borderRadius: "16px" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default OwnerDashboard;