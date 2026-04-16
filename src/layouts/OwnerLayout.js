import React, { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";

const OwnerLayout = () => {
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

  /* 🔥 LOADING */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  /* 🔐 AUTH CHECK */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /* 🔐 ROLE CHECK */
  if (role !== "owner") {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar role={role} user={user} />

      <div
        style={{
          marginLeft: isMobile ? 0 : 250, // ✅ FIX: No margin on mobile
          width: "100%",
          minHeight: "100vh",
          padding: "24px",
          overflowX: "hidden", // 🔥 IMPORTANT: Prevents horizontal scroll
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default OwnerLayout;