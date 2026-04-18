// MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography, Menu, MenuItem, Avatar, Divider } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";

// ✅ Sync with Sidebar width
const SIDEBAR_WIDTH = 260;

const MainLayout = () => {
  const { installable, installApp } = useInstallPrompt();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  /* ================= CHECK MOBILE ================= */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  /* ================= PROFILE MENU HANDLERS ================= */
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleProfileNavigate = (path) => {
    navigate(path);
    handleProfileClose();
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  /* ================= AUTH PROTECTION ================= */
  if (!user && !loading && location.pathname !== "/login" && location.pathname !== "/register") {
    return <Navigate to="/login" replace />;
  }

  /* ================= TITLE ================= */
  const getTitle = () => {
    if (location.pathname === "/") return "DASHBOARD";
    const path = location.pathname.split("/").pop();
    return path ? path.replace("-", " ").toUpperCase() : "PAGE";
  };

  // Get user initials (first letter of first name)
  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    return user?.name || user?.email?.split('@')[0] || "User";
  };

  // ✅ Define userName variable to use in JSX (cleaner approach)
  const userName = getUserName();
  const userInitial = getUserInitial();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f2f5" }}>
      {/* SIDEBAR */}
      <Sidebar role={role} user={user} />

      {/* MAIN CONTENT - AUTO SYNC WITH SIDEBAR WIDTH */}
      <div
        style={{
          marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
          padding: isMobile ? "16px" : "24px",
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          overflowX: "hidden",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* MODERN RESPONSIVE HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
            width: "100%",
            background: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {/* Page Title with Icon */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <DashboardIcon sx={{ color: "#2563eb", fontSize: "28px" }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                letterSpacing: "0.5px"
              }}
            >
              {getTitle()}
            </Typography>
          </Box>

          {/* RIGHT SECTION - USER PROFILE + ACTIONS */}
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* INSTALL BUTTON */}
              {installable && (
                <Button
                  variant="contained"
                  onClick={installApp}
                  startIcon="📲"
                  sx={{
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    "&:hover": { 
                      background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                    },
                    borderRadius: "10px",
                    fontWeight: 600,
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    transition: "all 0.2s ease"
                  }}
                >
                  Install App
                </Button>
              )}

              {/* PROFILE SECTION */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {/* Welcome Text */}
                <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                  <Typography sx={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
                    Welcome back,
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "15px" }}>
                    {userName}
                  </Typography>
                </Box>

                {/* Profile Icon with Menu */}
                <Box
                  onClick={handleProfileClick}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      "& .MuiAvatar-root": {
                        boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                      }
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "18px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  >
                    {userInitial}
                  </Avatar>
                </Box>

                {/* Profile Dropdown Menu */}
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleProfileClose}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 220,
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                      overflow: "visible",
                      "&:before": {
                        content: '""',
                        position: "absolute",
                        top: -8,
                        right: 16,
                        width: 16,
                        height: 16,
                        background: "white",
                        transform: "rotate(45deg)",
                        boxShadow: "-2px -2px 4px rgba(0,0,0,0.02)",
                      },
                    },
                  }}
                >
                  {/* User Info Section */}
                  <Box sx={{ px: 2, py: 1.5, textAlign: "center" }}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                        margin: "0 auto 8px auto",
                        fontWeight: 700,
                        fontSize: "20px"
                      }}
                    >
                      {userInitial}
                    </Avatar>
                    <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>
                      {userName}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>
                      {role || "User"}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  {/* Menu Items */}
                  <MenuItem 
                    onClick={() => handleProfileNavigate("/profile")}
                    sx={{ gap: 1.5, py: 1 }}
                  >
                    <PersonIcon fontSize="small" sx={{ color: "#2563eb" }} />
                    <Typography>My Profile</Typography>
                  </MenuItem>
                  
                  <MenuItem 
                    onClick={() => handleProfileNavigate("/settings")}
                    sx={{ gap: 1.5, py: 1 }}
                  >
                    <SettingsIcon fontSize="small" sx={{ color: "#2563eb" }} />
                    <Typography>Settings</Typography>
                  </MenuItem>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <MenuItem 
                    onClick={handleLogout}
                    sx={{ 
                      gap: 1.5, 
                      py: 1,
                      color: "#ef4444",
                      "&:hover": { bgcolor: "#fef2f2" }
                    }}
                  >
                    <LogoutIcon fontSize="small" />
                    <Typography>Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          )}
        </Box>

        {/* PAGE CONTENT */}
        <Box sx={{ 
          background: "white", 
          borderRadius: "16px", 
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          minHeight: "calc(100vh - 140px)"
        }}>
          <Outlet />
        </Box>
      </div>
    </div>
  );
};

export default MainLayout;