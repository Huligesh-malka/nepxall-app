import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { CircularProgress, Box } from "@mui/material";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // This listener waits for Firebase to finish initializing
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Auth state is now confirmed
    });

    return () => unsubscribe();
  }, []);

  // 1. Show a loader while Firebase is "thinking"
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 2. If after loading there is still no user, redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Otherwise, show the protected content
  return children;
};

export default ProtectedRoute;