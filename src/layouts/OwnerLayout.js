// src/layouts/OwnerLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Box, CircularProgress } from "@mui/material";

const OwnerLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const role = (localStorage.getItem("role") || "").toLowerCase();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      if (role !== "owner") {
        navigate("/", { replace: true });
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar - Your existing component */}
      <Sidebar />
      
      {/* Main Content - No Topbar, just direct content */}
      <div
        style={{
          marginLeft: 250,
          width: "100%",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default OwnerLayout;