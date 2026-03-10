import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button, Box, CircularProgress } from "@mui/material";

const MainLayout = () => {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  /* 🔥 NORMALIZE ROLE */
  const getStoredRole = () => {
    const r = localStorage.getItem("role");
    if (!r || r === "null" || r === "undefined") return null;
    return r;
  };

  /* 📱 SCREEN SIZE LISTENER */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* 🔐 FIREBASE AUTH */
  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (currentUser) => {

      setUser(currentUser);
      setRole(getStoredRole());
      setAuthReady(true);

      console.log("Auth changed:", currentUser?.email, getStoredRole());

    });

    return () => unsub();

  }, []);

  /* 🔁 ROLE UPDATE */
  useEffect(() => {

    const updateRole = () => {

      const newRole = getStoredRole();
      setRole(newRole);

    };

    window.addEventListener("role-updated", updateRole);
    window.addEventListener("storage", updateRole);

    return () => {

      window.removeEventListener("role-updated", updateRole);
      window.removeEventListener("storage", updateRole);

    };

  }, []);

  /* 🚪 LOGOUT */
  const handleLogout = async () => {

    await signOut(auth);

    localStorage.clear();

    setUser(null);
    setRole(null);

    navigate("/", { replace: true });

  };

  if (!authReady) {

    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );

  }

  return (

    <div style={{ display: "flex" }}>

      {/* SIDEBAR */}
      <Sidebar role={role} />

      {/* MAIN CONTENT */}
      <div
        style={{
          marginLeft: isMobile ? 0 : 250,
          width: isMobile ? "100%" : "calc(100% - 250px)",
          padding: 20,
          background: "#f8fafc",
          minHeight: "100vh",
          transition: "0.3s"
        }}
      >

        {/* TOP BAR */}
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
              <Button
                onClick={() => navigate("/login")}
                variant="outlined"
              >
                Login
              </Button>

              <Button
                onClick={() => navigate("/register")}
                variant="contained"
              >
                Register
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}

        </Box>

        {/* PAGE CONTENT */}
        <Outlet />

      </div>

    </div>

  );

};

export default MainLayout;