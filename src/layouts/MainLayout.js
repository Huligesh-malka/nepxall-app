import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button, Box, CircularProgress } from "@mui/material";

const MainLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [authReady, setAuthReady] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(Date.now());

  /* ✅ FIREBASE AUTH LISTENER */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Sync role from localStorage when auth changes
      const storedRole = localStorage.getItem("role");
      console.log("Auth state changed - User:", currentUser?.email, "Role:", storedRole);
      setRole(storedRole);
      
      // Force sidebar to re-render
      setSidebarKey(Date.now());
      
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  /* ✅ SYNC ROLE ON STORAGE EVENT */
  useEffect(() => {
    const handleStorageChange = () => {
      const newRole = localStorage.getItem("role");
      console.log("Storage changed - New role:", newRole);
      setRole(newRole);
      setSidebarKey(Date.now()); // Force re-render
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Custom event for same-tab updates
    const handleRoleUpdate = (event) => {
      const newRole = localStorage.getItem("role");
      console.log("Role updated event - New role:", newRole);
      setRole(newRole);
      setSidebarKey(Date.now()); // Force re-render
    };
    
    window.addEventListener("role-updated", handleRoleUpdate);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("role-updated", handleRoleUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      setUser(null);
      setRole(null);
      setSidebarKey(Date.now()); // Force re-render
      
      // Dispatch events
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("role-updated"));
      
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!authReady) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      {/* Force sidebar to re-render with key */}
      <Sidebar key={`sidebar-${sidebarKey}-${role || 'no-role'}`} />

      <div style={{ 
        marginLeft: 250, 
        padding: 20, 
        width: "calc(100% - 250px)", 
        background: "#f8fafc", 
        minHeight: "100vh" 
      }}>
        <Box sx={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: 1, 
          mb: 2,
          alignItems: "center",
          backgroundColor: "white",
          padding: "10px 20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          {user && (
            <span style={{ marginRight: "auto", color: "#64748b" }}>
              Welcome, <strong>{user.email?.split('@')[0] || 'User'}!</strong>
            </span>
          )}
          
          {!user ? (
            <>
              <Button 
                variant="outlined" 
                onClick={() => navigate("/login")}
                sx={{ textTransform: "none" }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate("/register")}
                sx={{ textTransform: "none" }}
              >
                Register
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleLogout}
              sx={{ textTransform: "none" }}
            >
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