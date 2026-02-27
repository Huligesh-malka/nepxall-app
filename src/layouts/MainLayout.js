import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button, Box, CircularProgress } from "@mui/material";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(undefined); // undefined = not checked yet
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /* 🔥 SAFE ROLE FETCH */
  const getStoredRole = () => {
    const r = localStorage.getItem("role");
    if (!r || r === "null" || r === "undefined") return null;
    return r;
  };

  /* ✅ FIREBASE AUTH */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔥 Auth state:", currentUser?.email);

      if (currentUser) {
        setUser(currentUser);

        const storedRole = getStoredRole();
        setRole(storedRole);
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ✅ ROLE LISTENER */
  useEffect(() => {
    const updateRole = () => {
      const newRole = getStoredRole();
      console.log("🔄 Role updated:", newRole);
      setRole(newRole);
    };

    window.addEventListener("role-updated", updateRole);
    window.addEventListener("storage", updateRole);

    return () => {
      window.removeEventListener("role-updated", updateRole);
      window.removeEventListener("storage", updateRole);
    };
  }, []);

  /* ✅ LOGOUT */
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    setUser(null);
    setRole(null);
    navigate("/login", { replace: true });
  };

  /* ⏳ GLOBAL LOADER (only while checking auth) */
  if (loading) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  /* 🚫 NOT LOGGED IN → redirect */
  const publicRoutes = ["/login", "/register", "/"];
  if (!user && !publicRoutes.includes(location.pathname)) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div style={{ display: "flex" }}>
      {user && <Sidebar role={role} />}

      <div
        style={{
          marginLeft: user ? 250 : 0,
          padding: 20,
          width: "100%",
          background: "#f8fafc",
          minHeight: "100vh"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            mb: 2,
            alignItems: "center",
            backgroundColor: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          {user && (
            <span style={{ marginRight: "auto", color: "#64748b" }}>
              Welcome, <strong>{user.email?.split("@")[0]}</strong>
            </span>
          )}

          {!user ? (
            <>
              <Button onClick={() => navigate("/login")} variant="outlined">
                Login
              </Button>
              <Button onClick={() => navigate("/register")} variant="contained">
                Register
              </Button>
            </>
          ) : (
            <Button variant="contained" color="error" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>

        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;