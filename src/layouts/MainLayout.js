import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

const SIDEBAR_WIDTH = 220;

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

  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  // 🔥 FIX 2: SAFER REDIRECT LOGIC – only for non‑public routes
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
      {user && <Sidebar role={role} user={user} />}

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
          {/* 🔥 Hide title for public users (optional) */}
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