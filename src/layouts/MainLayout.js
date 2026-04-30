import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, Typography, CircularProgress, Menu, MenuItem, Avatar, IconButton, Tooltip, Zoom, Fade } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GetAppIcon from '@mui/icons-material/GetApp';

const SIDEBAR_WIDTH = 260;

/* ================= PREMIUM DESIGN SYSTEM ================= */
const PREMIUM_COLORS = {
  primary: {
    main: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
  },
  secondary: {
    main: "#10b981",
    light: "#34d399",
    dark: "#059669",
    gradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
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
      {/* Premium Animated Logo */}
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

      {/* Premium Brand Text */}
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

      {/* Loading Animation */}
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

const MainLayout = () => {
  const { installable, installApp } = useInstallPrompt();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);

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
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  // Premium avatar display with role-based styling
  const getAvatarDisplay = () => {
    if (role === "owner") {
      return <StorefrontIcon sx={{ fontSize: 24 }} />;
    } else if (role === "tenant") {
      return <HomeIcon sx={{ fontSize: 24 }} />;
    } else {
      return user?.displayName?.charAt(0)?.toUpperCase() || <PersonIcon />;
    }
  };

  const getAvatarGradient = () => {
    if (role === "owner") return PREMIUM_COLORS.secondary.gradient;
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
              boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)"
            },
            borderRadius: "12px",
            fontWeight: 600,
            padding: "8px 24px",
            transition: "all 0.3s ease",
            textTransform: "none",
            fontSize: "14px"
          }}
        >
          Sign In
        </Button>
      )}

      {/* IF USER LOGGED IN */}
      {user && (
        <Fade in={true} timeout={500}>
          <Box sx={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* Become Owner Premium Button */}
            {role !== "owner" && (
              <Tooltip title="Start earning as an owner" arrow TransitionComponent={Zoom}>
                <Button
                  variant="contained"
                  onClick={() => navigate("/become-owner")}
                  startIcon={<StorefrontIcon />}
                  sx={{
                    background: PREMIUM_COLORS.secondary.gradient,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)"
                    },
                    borderRadius: "12px",
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

            {/* Premium Profile Dropdown */}
            <Tooltip title="Profile" arrow TransitionComponent={Zoom}>
              <IconButton
                onClick={openMenu}
                sx={{
                  padding: 0,
                  "&:hover": {
                    transform: "scale(1.05)"
                  },
                  transition: "all 0.3s ease"
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    background: getAvatarGradient(),
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                      transform: "scale(1.02)"
                    }
                  }}
                >
                  {getAvatarDisplay()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              TransitionComponent={Zoom}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: "16px",
                  minWidth: 200,
                  boxShadow: "0 20px 35px rgba(0,0,0,0.1)",
                  border: `1px solid ${PREMIUM_COLORS.neutral[200]}`
                }
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${PREMIUM_COLORS.neutral[200]}` }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  {user?.displayName || "User"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: PREMIUM_COLORS.neutral[500] }}>
                  {user?.email}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: role === "owner" ? PREMIUM_COLORS.secondary.main : PREMIUM_COLORS.primary.main, textTransform: "uppercase" }}>
                    {role === "owner" ? "🏠 Property Owner" : "👤 Tenant"}
                  </Typography>
                </Box>
              </Box>
              <MenuItem
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                sx={{
                  py: 1.5,
                  gap: 1.5,
                  color: "#ef4444",
                  "&:hover": {
                    background: "#ef444410"
                  }
                }}
              >
                <LogoutIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontWeight: 600 }}>Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Fade>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: PREMIUM_COLORS.neutral[50] }}>
      {/* Sidebar only for logged-in users */}
      {user && <Sidebar role={role} user={user} />}

      <div
        style={{
          marginLeft: !isMobile && user ? SIDEBAR_WIDTH : 0,
          padding: isMobile ? "16px" : "32px",
          width: "100%",
          minHeight: "100vh",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
              marginBottom: "10px"
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
              background: scrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
              backdropFilter: scrolled ? "blur(20px)" : "none",
              borderRadius: scrolled ? "16px" : "0px",
              padding: scrolled ? "16px 24px" : "0px",
              transition: "all 0.3s ease",
              boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.05)" : "none"
            }}
          >
            <ActionButtons />
          </Box>
        )}

        {/* Premium Content Area with Smooth Animation */}
        <Box
          sx={{
            animation: "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            "@keyframes fadeInUp": {
              "0%": {
                opacity: 0,
                transform: "translateY(30px)"
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
    </div>
  );
};

export default MainLayout;