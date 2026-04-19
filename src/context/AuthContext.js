import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { userAPI } from "../api/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true
  const [initialized, setInitialized] = useState(false);

  const isSyncing = useRef(false);
  const logoutTimer = useRef(null);
  const authCheckComplete = useRef(false);

  const retryRequest = async (fn, retries = 3, delay = 2000) => {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status === 401) throw err;
      if (retries <= 0) throw err;
      await new Promise(res => setTimeout(res, delay));
      return retryRequest(fn, retries - 1, delay);
    }
  };

  const clearSession = () => {
    setUser(null);
    setUserData(null);
    setRole(null);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
  };

  const syncUser = async (firebaseUser) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const idToken = await firebaseUser.getIdToken();

      const res = await retryRequest(() =>
        userAPI.post("/auth/firebase", { idToken })
      );

      if (res.data.success) {
        setUser(firebaseUser);
        setUserData({
          name: res.data.name,
          id: res.data.userId
        });
        setRole(res.data.role?.toLowerCase().trim());

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("user_id", res.data.userId);
        localStorage.setItem("user_name", res.data.name);
      }
    } catch (err) {
      console.error("Sync user error:", err);
      if (!err.response) {
        setUser(firebaseUser);
        return;
      }

      if (err.response.status === 401) {
        clearSession();
      } else {
        setUser(firebaseUser);
      }
    } finally {
      isSyncing.current = false;
      setLoading(false);
      setInitialized(true);
      authCheckComplete.current = true;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      
      if (firebaseUser) {
        // User is logged in
        setLoading(true);
        await syncUser(firebaseUser);
      } else {
        // No user - clear any pending timers
        if (logoutTimer.current) {
          clearTimeout(logoutTimer.current);
        }

        // Small delay to ensure Firebase has completely settled
        logoutTimer.current = setTimeout(() => {
          if (mounted) {
            if (!auth.currentUser) {
              clearSession();
            }
            setLoading(false);
            setInitialized(true);
            authCheckComplete.current = true;
          }
        }, 500); // Reduced from 2000ms to 500ms for better UX
      }
    });

    // Safety timeout - ensure loading doesn't stay forever
    const safetyTimeout = setTimeout(() => {
      if (mounted && !authCheckComplete.current) {
        console.log("Safety timeout triggered - forcing loading complete");
        setLoading(false);
        setInitialized(true);
        authCheckComplete.current = true;
      }
    }, 5000); // 5 seconds max loading time

    return () => {
      mounted = false;
      unsub();
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      clearTimeout(safetyTimeout);
    };
  }, []);

  const value = {
    user,
    userData,
    role,
    loading: loading || !initialized, // Only show loading if not initialized
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};