import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Box, CircularProgress } from "@mui/material";
import { userAPI } from "../api/api";

const OwnerLayout = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const res = await userAPI.post("/auth/firebase", { idToken });

        if (!res.data.success) {
          navigate("/login", { replace: true });
          return;
        }

        const backendRole = res.data.role?.toLowerCase().trim();

        if (backendRole !== "owner") {
          navigate("/", { replace: true });
          return;
        }

        setUser(currentUser);
        setRole(backendRole);

      } catch (err) {
        console.error("❌ Error:", err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }

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

      {/* ✅ FIX: PASS ROLE + USER */}
      <Sidebar role={role} user={user} />

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