import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Box, CircularProgress } from "@mui/material";

const AdminGuard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const getValidRole = () => {
    const role = localStorage.getItem("role");
    if (!role || role === "null" || role === "undefined") return null;
    return role;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const token = localStorage.getItem("token");
      const role = getValidRole();

      console.log("🛡️ AdminGuard check:", {
        user: user?.email,
        token,
        role
      });

      if (user && token && role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ⏳ WAIT FOR FIREBASE */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  /* ❌ NOT LOGGED IN */
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /* ❌ NOT ADMIN */
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  /* ✅ ADMIN ALLOWED */
  return <Outlet />;
};

export default AdminGuard;