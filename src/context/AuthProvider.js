import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { setAuthToken } from "../api/api";
import axios from "axios";

const AuthContext = createContext();

/* ================= SAFE HOOK ================= */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

/* ================= PROVIDER ================= */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [userData, setUserData] = useState(null); // 🔥 backend user
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USER FROM BACKEND ================= */
  const fetchBackendUser = async (firebaseToken) => {
    try {
      const res = await axios.post(
        "https://nepxall-backend.onrender.com/api/auth/firebase",
        {},
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
          },
        }
      );

      setUserData(res.data.user);
    } catch (err) {
      console.error("❌ Backend user fetch failed", err);
    }
  };

  /* ================= SET TOKEN GLOBAL ================= */
  const setToken = (newToken) => {
    setTokenState(newToken);
    setAuthToken(newToken);

    // used for silent refresh in api.js
    window.getFreshToken = async () => newToken;
  };

  /* ================= FIREBASE LISTENER ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const firebaseToken = await firebaseUser.getIdToken();

          setUser(firebaseUser);
          setToken(firebaseToken);

          await fetchBackendUser(firebaseToken);
        } else {
          setUser(null);
          setToken(null);
          setUserData(null);
        }
      } catch (err) {
        console.error("🔥 Auth error:", err);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  /* ================= AUTO TOKEN REFRESH ================= */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const refreshedToken = await user.getIdToken(true);
      setToken(refreshedToken);
      console.log("🔄 Token refreshed");
    }, 50 * 60 * 1000); // every 50 minutes

    return () => clearInterval(interval);
  }, [user]);

  /* ================= LOGOUT ================= */
  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setUserData(null);
    setToken(null);
  };

  /* ================= CONTEXT VALUE ================= */
  const value = {
    user,
    token,
    userData,
    loading,
    logout,
    isAuthenticated: !!user,
    role: userData?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};