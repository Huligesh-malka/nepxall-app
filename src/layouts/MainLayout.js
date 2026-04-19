import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, Typography, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

const SIDEBAR_WIDTH = 220;

/* ================= BRAND COLORS (SAME AS SIDEBAR) ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

// Loading Component inside MainLayout
const LoadingSpinner = ({ message = "Loading..." }) => (
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
          Next Places for Living
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
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
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
    if (location.pathname === "/") return "Find Your Perfect Stay";
    if (location.pathname === "/pg") return "PG Listings";
    if (location.pathname.startsWith("/pg/")) return "PG Details";
    if (location.pathname === "/booking") return "My Bookings";
    if (location.pathname === "/owner/dashboard") return "Owner Dashboard";
    if (location.pathname === "/profile") return "My Profile";
    const path = location.pathname.split("/").pop();
    return path ? path.replace("-", " ").toUpperCase() : "PAGE";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar only for logged-in users */}
      <Sidebar role={role} user={user} />

      <div
        style={{
          marginLeft: !isMobile ? SIDEBAR_WIDTH : 0,
          padding: isMobile ? "12px" : "24px",
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          overflowX: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
            width: "100%"
          }}
        >
          {/* Hide title for public users (optional) */}
          {user && (
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {getTitle()}
            </Typography>
          )}

          {/* Buttons only for logged-in users */}
          {user && (
            <div style={{ display: "flex", gap: "10px" }}>
              {installable && (
                <Button
                  variant="contained"
                  onClick={installApp}
                  sx={{
                    background: "#2563eb",
                    "&:hover": { background: "#1d4ed8" },
                    borderRadius: "8px",
                    fontWeight: 600
                  }}
                >
                  📲 Install App
                </Button>
              )}
              <Button variant="contained" color="error" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Box>

        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;