import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

// Brand colors (matching Sidebar)
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";
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
        <CircularProgress sx={{ color: BRAND_BLUE }} />
      </Box>
    );
  }

  /* ================= 🚨 NO AUTH CHECK HERE! ================= */
  // Auth protection is handled by PrivateRoute in App.js
  // MainLayout only renders when user is authenticated (via PrivateRoute)
  // So we don't need any redirect logic here

  /* ================= TITLE ================= */
  const getTitle = () => {
    if (location.pathname === "/") return "DASHBOARD";
    const path = location.pathname.split("/").pop();
    return path ? path.replace("-", " ").toUpperCase() : "PAGE";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sidebar role={role} user={user} />

      {/* MAIN CONTENT - AUTO SYNC WITH SIDEBAR WIDTH */}
      <div
        style={{
          marginLeft: isMobile ? 0 : SIDEBAR_WIDTH,
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
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
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
                    background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_GREEN})`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${BRAND_BLUE}dd, ${BRAND_GREEN}dd)`,
                      transform: "translateY(-2px)"
                    },
                    borderRadius: "8px",
                    fontWeight: 600,
                    textTransform: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  📲 Install App
                </Button>
              )}

              {/* LOGOUT */}
              <Button 
                variant="contained" 
                onClick={handleLogout}
                sx={{
                  background: "#ef4444",
                  "&:hover": {
                    background: "#dc2626",
                    transform: "translateY(-2px)"
                  },
                  borderRadius: "8px",
                  fontWeight: 600,
                  textTransform: "none",
                  transition: "all 0.2s ease"
                }}
              >
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