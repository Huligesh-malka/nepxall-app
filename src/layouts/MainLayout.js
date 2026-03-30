import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import { userAPI } from "../api/api";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ROLE ONLY ONCE ================= */
  const fetchRoleOnce = async (currentUser) => {
    try {
      const idToken = await currentUser.getIdToken();

      const res = await userAPI.post("/auth/firebase", { idToken });

      if (res.data.success) {
        setRole(res.data.role);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user_id", res.data.userId);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await fetchRoleOnce(currentUser);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    setUser(null);
    setRole(null);
    navigate("/login");
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ✅ PASS BOTH USER + ROLE */}
      <Sidebar role={role} user={user} />

      <div style={{ marginLeft: 250, padding: 24, width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
          <Typography variant="h6">
            {location.pathname === "/" ? "DASHBOARD" :
              location.pathname.split("/").pop()?.toUpperCase()}
          </Typography>

          {user && (
            <Button color="error" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>

        <Outlet context={{ user, role }} />
      </div>
    </div>
  );
};

export default MainLayout;