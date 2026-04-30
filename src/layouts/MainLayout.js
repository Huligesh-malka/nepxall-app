import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, Typography, CircularProgress, Menu, MenuItem, Avatar, IconButton, Divider, Badge, Paper } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const SIDEBAR_WIDTH = 220;

/* ================= BRAND COLORS (SAME AS SIDEBAR) ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

// Loading Component inside MainLayout
const LoadingSpinner = ({ message = "Loading your dashboard..." }) => (
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
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      zIndex: 9999,
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        p: 4,
      }}
    >
      {/* Animated Logo Container */}
      <Box
        sx={{
          position: "relative",
          animation: "float 2s ease-in-out infinite",
          "@keyframes float": {
            "0%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(-10px)" },
            "100%": { transform: "translateY(0px)" },
          },
        }}
      >
        {/* Glow effect behind logo */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BRAND_BLUE}20, transparent)`,
            animation: "pulse 2s ease-in-out infinite",
            "@keyframes pulse": {
              "0%": { transform: "translate(-50%, -50%) scale(0.8)", opacity: 0.5 },
              "50%": { transform: "translate(-50%, -50%) scale(1.2)", opacity: 0.2 },
              "100%": { transform: "translate(-50%, -50%) scale(0.8)", opacity: 0.5 },
            },
          }}
        />
        
        {/* Logo placeholder - matches sidebar styling */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 16,
            position: "relative",
            zIndex: 2,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: "bold",
            color: "white",
          }}
        >
          N
        </Box>
      </Box>

      {/* Brand Name with Gradient */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          sx={{
            fontSize: { xs: 28, sm: 32 },
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            mb: 1,
          }}
        >
          <span style={{ color: BRAND_BLUE }}>Nep</span>
          <span style={{ color: BRAND_GREEN }}>xall</span>
        </Typography>
        
        <Typography
          sx={{
            fontSize: 12,
            color: "#64748b",
            letterSpacing: "0.5px",
            fontWeight: 500,
          }}
        >
          Premium PG Management
        </Typography>
      </Box>

      {/* Loading Spinner with Brand Colors */}
      <Box sx={{ position: "relative", mt: 2 }}>
        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            color: BRAND_BLUE,
            animation: "spin 1.5s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            position: "absolute",
            left: 0,
            color: BRAND_GREEN,
            animation: "spinReverse 1.5s linear infinite",
            "@keyframes spinReverse": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(-360deg)" },
            },
          }}
        />
      </Box>

      {/* Loading Message */}
      <Typography
        sx={{
          fontSize: 13,
          color: "#64748b",
          fontWeight: 500,
          mt: 1,
          animation: "fadeInOut 1.5s ease-in-out infinite",
          "@keyframes fadeInOut": {
            "0%": { opacity: 0.5 },
            "50%": { opacity: 1 },
            "100%": { opacity: 0.5 },
          },
        }}
      >
        {message}
      </Typography>
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  // Show branded loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
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

  const getTitle = () => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname === "/pg") return "PG Listings";
    if (location.pathname.startsWith("/pg/")) return "PG Details";
    if (location.pathname === "/booking") return "My Bookings";
    if (location.pathname === "/owner/dashboard") return "Owner Dashboard";
    if (location.pathname === "/profile") return "My Profile";
    const path = location.pathname.split("/").pop();
    return path ? path.replace("-", " ").toUpperCase() : "PAGE";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar only for logged-in users */}
      {user && <Sidebar role={role} user={user} />}

      <div
        style={{
          marginLeft: !isMobile && user ? SIDEBAR_WIDTH : 0,
          padding: isMobile ? "12px" : "24px",
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          overflowX: "hidden",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              width: "100%"
            }}
          >
            {/* Title Section with Icon */}
            {user && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {role === "owner" ? (
                  <StorefrontIcon sx={{ color: BRAND_BLUE, fontSize: 28 }} />
                ) : (
                  <DashboardIcon sx={{ color: BRAND_GREEN, fontSize: 28 }} />
                )}
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    letterSpacing: "-0.5px"
                  }}
                >
                  {getTitle()}
                </Typography>
                {role === "owner" && (
                  <Badge
                    badgeContent="OWNER"
                    color="primary"
                    sx={{
                      "& .MuiBadge-badge": {
                        background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
                        color: "white",
                        fontWeight: 700,
                        fontSize: "10px",
                        px: 1,
                      }
                    }}
                  />
                )}
              </Box>
            )}

            {/* RIGHT SIDE BUTTONS */}
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {/* IF USER NOT LOGGED IN - Show Login button only */}
              {!user && (
                <Button
                  variant="contained"
                  onClick={() => navigate("/login")}
                  sx={{
                    background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${BRAND_BLUE}CC, ${BRAND_GREEN}CC)`,
                      transform: "translateY(-2px)",
                    },
                    borderRadius: "12px",
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "14px",
                    px: 3,
                    py: 1,
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                    transition: "all 0.2s ease",
                  }}
                >
                  Login
                </Button>
              )}

              {/* IF USER LOGGED IN */}
              {user && (
                <>
                  {/* Become Owner button for logged-in users who are not already owners */}
                  {role !== "owner" && (
                    <Button
                      variant="contained"
                      onClick={() => navigate("/become-owner")}
                      sx={{
                        background: "linear-gradient(135deg, #4CAF50, #45a049)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #45a049, #3d8b40)",
                          transform: "translateY(-2px)",
                        },
                        borderRadius: "12px",
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "14px",
                        px: 2.5,
                        py: 1,
                        boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      🏪 Become Owner
                    </Button>
                  )}

                  {installable && (
                    <Button
                      variant="contained"
                      onClick={installApp}
                      sx={{
                        background: "linear-gradient(135deg, #2563eb, #1e40af)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #1e40af, #1e3a8a)",
                          transform: "translateY(-2px)",
                        },
                        borderRadius: "12px",
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "14px",
                        px: 2.5,
                        py: 1,
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      📲 Install App
                    </Button>
                  )}

                  {/* Conditional Rendering for Owner vs Normal User */}
                  {role === "owner" ? (
                    /* Owner gets a premium logout button */
                    <Button
                      variant="outlined"
                      onClick={handleLogout}
                      startIcon={<LogoutIcon />}
                      sx={{
                        borderColor: "#dc2626",
                        color: "#dc2626",
                        "&:hover": {
                          borderColor: "#b91c1c",
                          background: "rgba(220, 38, 38, 0.04)",
                          transform: "translateY(-2px)",
                        },
                        borderRadius: "12px",
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "14px",
                        px: 2.5,
                        py: 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      Logout
                    </Button>
                  ) : (
                    /* Normal user gets profile dropdown with avatar */
                    <>
                      <IconButton 
                        onClick={openMenu}
                        sx={{
                          p: 0,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                          variant="dot"
                          sx={{
                            "& .MuiBadge-badge": {
                              backgroundColor: "#4CAF50",
                              boxShadow: "0 0 0 2px white",
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
                              width: 44,
                              height: 44,
                              fontWeight: 700,
                              fontSize: "18px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              cursor: "pointer",
                            }}
                          >
                            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                          </Avatar>
                        </Badge>
                      </IconButton>
                      
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={closeMenu}
                        PaperProps={{
                          sx: {
                            mt: 1.5,
                            borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
                            minWidth: 220,
                            border: "1px solid #e2e8f0",
                            overflow: "hidden",
                          },
                        }}
                        transformOrigin={{ horizontal: "right", vertical: "top" }}
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                      >
                        {/* User Info Header */}
                        <Box sx={{ px: 2, py: 1.5, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>
                            {user?.displayName || user?.email || "User"}
                          </Typography>
                          <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>
                            {user?.email}
                          </Typography>
                        </Box>
                        <Divider />
                        
                        <MenuItem
                          onClick={() => {
                            navigate("/profile");
                            closeMenu();
                          }}
                          sx={{
                            py: 1.5,
                            px: 2,
                            gap: 1.5,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                            },
                          }}
                        >
                          <PersonIcon sx={{ color: BRAND_BLUE, fontSize: 20 }} />
                          <Typography sx={{ fontWeight: 600, fontSize: "14px" }}>
                            My Profile
                          </Typography>
                        </MenuItem>
                        
                        <Divider />
                        
                        <MenuItem
                          onClick={() => {
                            handleLogout();
                            closeMenu();
                          }}
                          sx={{
                            py: 1.5,
                            px: 2,
                            gap: 1.5,
                            color: "#dc2626",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              background: "rgba(220, 38, 38, 0.04)",
                            },
                          }}
                        >
                          <LogoutIcon sx={{ fontSize: 20 }} />
                          <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
                            Logout
                          </Typography>
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Outlet />
        </Box>
      </div>
    </div>
  );
};

export default MainLayout;