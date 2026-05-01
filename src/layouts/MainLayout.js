import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, Typography, CircularProgress, Avatar, IconButton, Tooltip, Zoom, Fade, Badge, Drawer, Divider, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KingBedIcon from '@mui/icons-material/KingBed';
import DiamondIcon from '@mui/icons-material/Diamond';
import ShieldIcon from '@mui/icons-material/Shield';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StarIcon from '@mui/icons-material/Star';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import FlagIcon from '@mui/icons-material/Flag';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import PolicyIcon from '@mui/icons-material/Policy';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DescriptionIcon from '@mui/icons-material/Description';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PeopleIcon from '@mui/icons-material/People';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';

const SIDEBAR_WIDTH = 280;

/* ================= PREMIUM DESIGN SYSTEM v2.0 ================= */
const PREMIUM_COLORS = {
  primary: {
    main: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    gradientHover: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
  },
  secondary: {
    main: "#10b981",
    light: "#34d399",
    dark: "#059669",
    gradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
    gradientHover: "linear-gradient(135deg, #059669 0%, #0d9488 100%)"
  },
  accent: {
    main: "#f59e0b",
    light: "#fbbf24",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
  },
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827"
  },
  gold: {
    main: "#fbbf24",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
  }
};

// Premium Loading Component
const PremiumLoadingSpinner = () => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `radial-gradient(circle at 50% 50%, ${PREMIUM_COLORS.neutral[50]} 0%, ${PREMIUM_COLORS.neutral[100]} 100%)`,
      zIndex: 9999,
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        p: 4,
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${PREMIUM_COLORS.primary.main}20, transparent)`,
            animation: "pulse 2s ease-in-out infinite",
            "@keyframes pulse": {
              "0%": { transform: "translate(-50%, -50%) scale(0.8)", opacity: 0.3 },
              "50%": { transform: "translate(-50%, -50%) scale(1.3)", opacity: 0.1 },
              "100%": { transform: "translate(-50%, -50%) scale(0.8)", opacity: 0.3 },
            },
          }}
        />
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 20,
            position: "relative",
            zIndex: 2,
            background: PREMIUM_COLORS.primary.gradient,
            boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "float 2s ease-in-out infinite",
            "@keyframes float": {
              "0%": { transform: "translateY(0px) rotate(0deg)" },
              "50%": { transform: "translateY(-10px) rotate(3deg)" },
              "100%": { transform: "translateY(0px) rotate(0deg)" },
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 36,
              fontWeight: 800,
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            N
          </Typography>
        </Box>
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography
          sx={{
            fontSize: { xs: 32, sm: 36 },
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: PREMIUM_COLORS.primary.gradient,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            mb: 1,
          }}
        >
          Nepxall
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: PREMIUM_COLORS.neutral[500],
            letterSpacing: "1px",
            fontWeight: 500,
            textTransform: "uppercase"
          }}
        >
          Premium Living
        </Typography>
      </Box>

      <Box sx={{ position: "relative", mt: 2 }}>
        <CircularProgress
          size={48}
          thickness={3}
          sx={{
            color: PREMIUM_COLORS.primary.main,
            animation: "spin 1.5s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
        <CircularProgress
          size={48}
          thickness={3}
          sx={{
            position: "absolute",
            left: 0,
            color: PREMIUM_COLORS.secondary.main,
            animation: "spinReverse 1.5s linear infinite",
            "@keyframes spinReverse": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(-360deg)" },
            },
          }}
        />
      </Box>
    </Box>
  </Box>
);

// ================= RIGHT SIDE PROFILE CARD COMPONENT =================
// Complete menu for Tenant and Owner with scrollable content
const RightProfileCard = ({ open, onClose, user, role, onLogout }) => {
  const navigate = useNavigate();
  
  const getAvatarGradient = () => {
    if (role === "owner") return PREMIUM_COLORS.gold.gradient;
    if (role === "tenant") return PREMIUM_COLORS.primary.gradient;
    return "linear-gradient(135deg, #6b7280, #9ca3af)";
  };

  // Navigation handlers for Tenant
  const handleBecomeOwner = () => {
    navigate("/become-owner");
    onClose();
  };

  const handleVacateRoom = () => {
    navigate("/user/vacate");
    onClose();
  };

  const handleMyAgreements = () => {
    navigate("/user/agreements");
    onClose();
  };

  // Navigation handlers for Owner
  const handleActiveTenants = () => {
    navigate("/owner/tenants");
    onClose();
  };

  const handleVacateRequests = () => {
    navigate("/owner/vacate");
    onClose();
  };

  const handleBankDetails = () => {
    navigate("/owner/bank");
    onClose();
  };

  // Common navigation handlers
  const handleContactUs = () => {
    navigate("/contact");
    onClose();
  };

  const handleTermsConditions = () => {
    navigate("/terms");
    onClose();
  };

  const handleRefundPolicy = () => {
    navigate("/refund-policy");
    onClose();
  };

  const handlePrivacyPolicy = () => {
    navigate("/privacy-policy");
    onClose();
  };

  // Role-specific menu item (Refunds for Tenant, Earnings for Owner)
  const handleRoleSpecificAction = () => {
    if (role === "tenant") {
      navigate("/user/refunds");
    } else if (role === "owner") {
      navigate("/owner/payments");
    }
    onClose();
  };

  const getRoleSpecificIcon = () => {
    if (role === "tenant") {
      return <ReceiptIcon />;
    } else if (role === "owner") {
      return <MonetizationOnIcon />;
    }
    return <TrendingUpIcon />;
  };

  const getRoleSpecificLabel = () => {
    if (role === "tenant") {
      return "Refunds";
    } else if (role === "owner") {
      return "Earnings";
    }
    return "Payments";
  };

  // Tenant specific menu items
  const tenantMenuItems = [
    { label: "Become Owner", icon: <WorkspacePremiumIcon />, onClick: handleBecomeOwner },
    { label: "Vacate Room", icon: <MeetingRoomIcon />, onClick: handleVacateRoom },
    { label: "My Agreements", icon: <DescriptionIcon />, onClick: handleMyAgreements },
  ];

  // Owner specific menu items
  const ownerMenuItems = [
    { label: "Active Tenants", icon: <PeopleIcon />, onClick: handleActiveTenants },
    { label: "Vacate Requests", icon: <LogoutOutlinedIcon />, onClick: handleVacateRequests },
    { label: "Bank Details", icon: <AccountBalanceIcon />, onClick: handleBankDetails },
  ];

  // Common policy menu items for both roles
  const policyMenuItems = [
    { label: "Contact Us", icon: <ContactSupportIcon />, onClick: handleContactUs },
    { label: "Terms & Conditions", icon: <FlagIcon />, onClick: handleTermsConditions },
    { label: "Refund Policy", icon: <PolicyIcon />, onClick: handleRefundPolicy },
    { label: "Privacy Policy", icon: <PrivacyTipIcon />, onClick: handlePrivacyPolicy },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "85%", sm: 380 },
          maxWidth: "100%",
          borderRadius: { xs: "24px 0 0 24px", sm: "32px 0 0 32px" },
          background: `linear-gradient(145deg, ${PREMIUM_COLORS.neutral[50]} 0%, white 100%)`,
          boxShadow: "-20px 0 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header with close button - COMPACT VERSION (removed profile details) */}
      <Box
        sx={{
          p: 1.5,
          minHeight: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          background: PREMIUM_COLORS.primary.gradient,
          color: "white",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            color: "white",
            background: "rgba(255,255,255,0.2)",
            "&:hover": {
              background: "rgba(255,255,255,0.3)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Scrollable Menu Items */}
      <Box sx={{ p: 2, flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 400px)" }}>
        {/* Role Specific Menu Item - Refunds for Tenant, Earnings for Owner */}
        <ListItem
          onClick={handleRoleSpecificAction}
          sx={{
            borderRadius: "16px",
            mb: 1,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              background: `${PREMIUM_COLORS.primary.main}10`,
              transform: "translateX(4px)",
            },
          }}
        >
          <ListItemIcon sx={{ color: PREMIUM_COLORS.primary.main, minWidth: 40 }}>
            {getRoleSpecificIcon()}
          </ListItemIcon>
          <ListItemText
            primary={getRoleSpecificLabel()}
            primaryTypographyProps={{
              sx: { fontWeight: 500, fontSize: 14 },
            }}
          />
          <ArrowForwardIosIcon sx={{ fontSize: 14, color: PREMIUM_COLORS.neutral[400] }} />
        </ListItem>

        {/* Tenant Specific Menu Items */}
        {role === "tenant" && (
          <>
            {tenantMenuItems.map((item, index) => (
              <ListItem
                key={index}
                onClick={item.onClick}
                sx={{
                  borderRadius: "16px",
                  mb: 1,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: `${PREMIUM_COLORS.primary.main}10`,
                    transform: "translateX(4px)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: PREMIUM_COLORS.primary.main, minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    sx: { fontWeight: 500, fontSize: 14 },
                  }}
                />
                <ArrowForwardIosIcon sx={{ fontSize: 14, color: PREMIUM_COLORS.neutral[400] }} />
              </ListItem>
            ))}
          </>
        )}

        {/* Owner Specific Menu Items - Active Tenants, Vacate Requests, Bank Details */}
        {role === "owner" && (
          <>
            {ownerMenuItems.map((item, index) => (
              <ListItem
                key={index}
                onClick={item.onClick}
                sx={{
                  borderRadius: "16px",
                  mb: 1,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: `${PREMIUM_COLORS.primary.main}10`,
                    transform: "translateX(4px)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: PREMIUM_COLORS.primary.main, minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    sx: { fontWeight: 500, fontSize: 14 },
                  }}
                />
                <ArrowForwardIosIcon sx={{ fontSize: 14, color: PREMIUM_COLORS.neutral[400] }} />
              </ListItem>
            ))}
          </>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Policy Menu Items - Contact Us, Terms, Refund Policy, Privacy Policy */}
        {policyMenuItems.map((item, index) => (
          <ListItem
            key={index}
            onClick={item.onClick}
            sx={{
              borderRadius: "16px",
              mb: 1,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                background: `${PREMIUM_COLORS.primary.main}10`,
                transform: "translateX(4px)",
              },
            }}
          >
            <ListItemIcon sx={{ color: PREMIUM_COLORS.primary.main, minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                sx: { fontWeight: 500, fontSize: 14 },
              }}
            />
            <ArrowForwardIosIcon sx={{ fontSize: 14, color: PREMIUM_COLORS.neutral[400] }} />
          </ListItem>
        ))}
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Logout Button */}
      <Box sx={{ p: 2, mb: 2, flexShrink: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onLogout}
          startIcon={<LogoutIcon />}
          sx={{
            borderRadius: "14px",
            py: 1.2,
            borderColor: "#ef4444",
            color: "#ef4444",
            "&:hover": {
              borderColor: "#dc2626",
              background: "#ef444410",
            },
          }}
        >
          Sign Out
        </Button>
      </Box>

      {/* Version */}
      <Box sx={{ textAlign: "center", py: 2, px: 3, flexShrink: 0 }}>
        <Typography sx={{ fontSize: 11, color: PREMIUM_COLORS.neutral[400] }}>
          Version 2.0.0 • © 2024 Nepxall
        </Typography>
      </Box>
    </Drawer>
  );
};

const MainLayout = () => {
  const { installable, installApp } = useInstallPrompt();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      setProfileCardOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const openProfileCard = () => {
    setProfileCardOpen(true);
  };

  const closeProfileCard = () => {
    setProfileCardOpen(false);
  };

  // Function to open sidebar drawer programmatically
  const openSidebarDrawer = () => {
    const menuBtn = document.querySelector(".mobile-menu-trigger");
    if (menuBtn) {
      menuBtn.click();
    }
  };

  const getAvatarGradient = () => {
    if (role === "owner") return PREMIUM_COLORS.gold.gradient;
    if (role === "tenant") return PREMIUM_COLORS.primary.gradient;
    return "linear-gradient(135deg, #6b7280, #9ca3af)";
  };

  // Show branded loading spinner while checking auth
  if (loading) {
    return <PremiumLoadingSpinner />;
  }

  // SAFER REDIRECT LOGIC – only for non‑public routes
  const publicRoutes = ["/", "/login", "/register", "/pg"];
  const isPublic = publicRoutes.some(route =>
    location.pathname === route || location.pathname.startsWith(route + "/")
  );

  if (!user && !isPublic) {
    return <Navigate to="/login" replace />;
  }

  // Redirect logged-in users away from auth pages
  if (user && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/" replace />;
  }

  // Premium Action Buttons Component (reused for both mobile and desktop)
  const ActionButtons = () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      {/* IF USER NOT LOGGED IN - Premium Login Button */}
      {!user && (
        <Button
          variant="contained"
          onClick={() => navigate("/login")}
          sx={{
            background: PREMIUM_COLORS.primary.gradient,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)",
              background: PREMIUM_COLORS.primary.gradientHover,
            },
            borderRadius: "14px",
            fontWeight: 600,
            padding: "8px 24px",
            transition: "all 0.3s ease",
            textTransform: "none",
            fontSize: "14px",
            boxShadow: "0 4px 10px rgba(99, 102, 241, 0.2)"
          }}
        >
          Sign In
        </Button>
      )}

      {/* IF USER LOGGED IN */}
      {user && (
        <Fade in={true} timeout={500}>
          <Box sx={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* Become Owner Premium Button - Only show for non-owners */}
            {role !== "owner" && (
              <Tooltip title="Start earning as an owner" arrow TransitionComponent={Zoom}>
                <Button
                  variant="contained"
                  onClick={() => navigate("/become-owner")}
                  startIcon={<DiamondIcon />}
                  sx={{
                    background: PREMIUM_COLORS.secondary.gradient,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
                      background: PREMIUM_COLORS.secondary.gradientHover,
                    },
                    borderRadius: "14px",
                    fontWeight: 600,
                    padding: "8px 20px",
                    transition: "all 0.3s ease",
                    textTransform: "none",
                    fontSize: "14px"
                  }}
                >
                  List Property
                </Button>
              </Tooltip>
            )}

            {/* REDESIGNED PROFILE ICON - Modern circular icon with gradient */}
            <Tooltip title="Account" arrow TransitionComponent={Zoom}>
              <IconButton
                onClick={openProfileCard}
                sx={{
                  padding: 0,
                  "&:hover": {
                    transform: "scale(1.05)"
                  },
                  transition: "all 0.3s ease"
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    role === "owner" ? (
                      <Box sx={{ 
                        bgcolor: PREMIUM_COLORS.gold.main, 
                        width: 14, 
                        height: 14, 
                        borderRadius: "50%",
                        border: "2px solid white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <StarIcon sx={{ fontSize: 8, color: "white" }} />
                      </Box>
                    ) : role === "tenant" ? (
                      <Box sx={{ 
                        bgcolor: PREMIUM_COLORS.primary.main, 
                        width: 14, 
                        height: 14, 
                        borderRadius: "50%",
                        border: "2px solid white"
                      }} />
                    ) : null
                  }
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      background: getAvatarGradient(),
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: `2px solid ${role === "owner" ? PREMIUM_COLORS.gold.main : PREMIUM_COLORS.primary.light}`,
                      "&:hover": {
                        boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
                        transform: "scale(1.02)"
                      }
                    }}
                  >
                    <AccountCircleIcon sx={{ fontSize: 32, color: "white" }} />
                  </Avatar>
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}
    </div>
  );

  // ================= MOBILE BOTTOM NAVIGATION STYLES =================
  const mobileBottomNav = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(20px)",
    borderTop: `1px solid ${PREMIUM_COLORS.neutral[200]}`,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 2000,
    boxShadow: "0 -8px 32px rgba(0,0,0,0.08)",
    paddingBottom: "env(safe-area-inset-bottom)",
  };

  const bottomNavBtnStyle = (active) => ({
    border: "none",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    color: active ? PREMIUM_COLORS.primary.main : PREMIUM_COLORS.neutral[500],
    fontWeight: active ? "600" : "500",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    padding: "8px 12px",
    borderRadius: "28px",
    flex: 1,
    maxWidth: 80,
    transform: active ? "translateY(-2px)" : "translateY(0)",
  });

  // Helper function to check if a route is active
  const isActiveRoute = (paths) => {
    if (typeof paths === 'string') {
      return location.pathname === paths;
    }
    return paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: PREMIUM_COLORS.neutral[50] }}>
      {/* Sidebar only for logged-in users - Desktop only */}
      {user && <Sidebar role={role} user={user} />}

      <div
        style={{
          marginLeft: !isMobile && user ? SIDEBAR_WIDTH : 0,
          padding: isMobile ? "16px 16px 90px 16px" : "32px",
          width: "100%",
          minHeight: "100vh",
          transition: "margin 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease",
          overflowX: "hidden",
        }}
      >
        {/* Mobile Only - Buttons at top without header container */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginBottom: "16px"
            }}
          >
            <ActionButtons />
          </div>
        )}

        {/* Desktop Only - Premium Header with sticky behavior */}
        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              mb: 4,
              flexWrap: "wrap",
              gap: 2,
              position: "sticky",
              top: 0,
              zIndex: 1100,
              background: scrolled ? "rgba(255, 255, 255, 0.92)" : "transparent",
              backdropFilter: scrolled ? "blur(24px)" : "none",
              borderRadius: scrolled ? "24px" : "0px",
              padding: scrolled ? "16px 28px" : "0px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.06)" : "none"
            }}
          >
            <ActionButtons />
          </Box>
        )}

        {/* Premium Content Area with Smooth Animation */}
        <Box
          sx={{
            animation: "fadeInUp 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
            "@keyframes fadeInUp": {
              "0%": {
                opacity: 0,
                transform: "translateY(40px)"
              },
              "100%": {
                opacity: 1,
                transform: "translateY(0)"
              }
            }
          }}
        >
          <Outlet />
        </Box>
      </div>

      {/* ================= PREMIUM MOBILE BOTTOM NAVIGATION ================= */}
      {/* Only visible when user is logged in on mobile */}
      {isMobile && user && (
        <div style={mobileBottomNav}>
          {/* TENANT BOTTOM NAVIGATION - Premium Design */}
          {role === "tenant" && (
            <>
              <button
                onClick={() => navigate("/")}
                style={bottomNavBtnStyle(isActiveRoute("/"))}
              >
                <HomeIcon style={{ fontSize: 22, transition: "transform 0.2s" }} />
                <span>Home</span>
              </button>

              <button
                onClick={() => navigate("/user/bookings")}
                style={bottomNavBtnStyle(isActiveRoute(["/user/bookings", "/bookings"]))}
              >
                <MenuBookIcon style={{ fontSize: 20 }} />
                <span>Bookings</span>
              </button>

              <button
                onClick={() => navigate("/user/my-stay")}
                style={bottomNavBtnStyle(isActiveRoute("/user/my-stay"))}
              >
                <KingBedIcon style={{ fontSize: 22 }} />
                <span>My Stay</span>
              </button>

              <button
                onClick={openSidebarDrawer}
                style={bottomNavBtnStyle(false)}
              >
                <span style={{ fontSize: 22 }}>👤</span>
                <span>Profile</span>
              </button>
            </>
          )}

          {/* OWNER BOTTOM NAVIGATION - Premium Design */}
          {role === "owner" && (
            <>
              <button
                onClick={() => navigate("/owner/dashboard")}
                style={bottomNavBtnStyle(isActiveRoute("/owner/dashboard"))}
              >
                <DashboardIcon style={{ fontSize: 22 }} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigate("/owner/bookings")}
                style={bottomNavBtnStyle(isActiveRoute("/owner/bookings"))}
              >
                <CalendarMonthIcon style={{ fontSize: 20 }} />
                <span>Bookings</span>
              </button>

              <button
                onClick={() => navigate("/owner/add")}
                style={bottomNavBtnStyle(isActiveRoute("/owner/add"))}
              >
                <AddBusinessIcon style={{ fontSize: 20 }} />
                <span>Add PG</span>
              </button>

              <button
                onClick={openSidebarDrawer}
                style={bottomNavBtnStyle(false)}
              >
                <span style={{ fontSize: 22 }}>👤</span>
                <span>Profile</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ================= RIGHT SIDE PROFILE CARD ================= */}
      <RightProfileCard
        open={profileCardOpen}
        onClose={closeProfileCard}
        user={user}
        role={role}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default MainLayout;