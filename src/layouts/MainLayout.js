// MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

// ✅ Sync with Sidebar width
const SIDEBAR_WIDTH = 220;

const MainLayout = () => {
  const { installable, installApp } = useInstallPrompt();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

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

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  /* ================= AUTH PROTECTION (FIXED) ================= */
  // ✅ Public routes that anyone can access
  const publicRoutes = ["/", "/login", "/register", "/pg"];
  
  if (!user && !loading) {
    const isPublic = publicRoutes.some(route =>
      location.pathname === route || location.pathname.startsWith(route + "/")
    );
    
    if (!isPublic) {
      return <Navigate to="/login" replace />;
    }
  }
  
  // ✅ OPTIONAL: Redirect logged-in users away from login/register
  if (user && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/" replace />;
  }

  /* ================= TITLE ================= */
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
      {/* SIDEBAR - Only show if user is logged in */}
      {user && <Sidebar role={role} user={user} />}

      {/* MAIN CONTENT - AUTO SYNC WITH SIDEBAR WIDTH */}
      <div
        style={{
          marginLeft: user && !isMobile ? SIDEBAR_WIDTH : 0,
          padding: isMobile ? "12px" : "24px",
          width: "100%",
          minHeight: "100vh",
          background: "#f8fafc",
          overflowX: "hidden",
        }}
      >
        {/* RESPONSIVE HEADER */}
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
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {getTitle()}
          </Typography>

          {/* SINGLE LOGOUT + INSTALL BUTTON (NO DUPLICATE) */}
          {user && (
            <div style={{ display: "flex", gap: "10px" }}>
              {/* INSTALL BUTTON */}
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

              {/* LOGOUT */}
              <Button variant="contained" color="error" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Box>

        {/* PAGE CONTENT */}
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;