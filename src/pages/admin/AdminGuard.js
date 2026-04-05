import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ Use your global context
import { Box, CircularProgress } from "@mui/material";

const AdminGuard = () => {
  // ✅ 1. Get Auth state from Context
  const { user, role, loading } = useAuth();

  /* ⏳ WAIT FOR AUTH CONTEXT TO INITIALIZE */
  if (loading) {
    return (
      <Box 
        height="100vh" 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center"
        gap={2}
      >
        <CircularProgress />
        <span style={{ color: "#64748b", fontFamily: "sans-serif", fontSize: "14px" }}>
          Verifying Permissions...
        </span>
      </Box>
    );
  }

  // Debugging log (Optional - remove for production)
  console.log("🛡️ AdminGuard Protected Route Check:", {
    hasUser: !!user,
    userRole: role
  });

  /* ❌ NOT LOGGED IN */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /* ❌ NOT ADMIN */
  // Strictly check for "admin" role. If user is "owner" or "user", redirect to home.
  if (role !== "admin") {
    console.warn("🚫 Access Denied: User does not have Admin privileges.");
    return <Navigate to="/" replace />;
  }

  /* ✅ ADMIN ALLOWED */
  // Renders the child routes defined in your App.js/routes file
  return <Outlet />;
};

export default AdminGuard;