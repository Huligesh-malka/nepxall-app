import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { API_CONFIG } from "../config";


/* =====================================================
   🌍 BASE URL (AUTO SWITCH LOCAL ↔ PRODUCTION)
===================================================== */

const BASE_URL = API_CONFIG.API_URL;

/* =====================================================
   🚀 AXIOS INSTANCE
===================================================== */

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 60000, // for Render cold start
  headers: {
    "Content-Type": "application/json",
  },
});

/* =====================================================
   🔐 WAIT FOR FIREBASE USER (ON REFRESH)
===================================================== */

const getCurrentUser = () =>
  new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });

/* =====================================================
   📤 REQUEST INTERCEPTOR → ATTACH TOKEN
===================================================== */

API.interceptors.request.use(
  async (config) => {
    try {
      let user = auth.currentUser;

      if (!user) {
        user = await getCurrentUser();
      }

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("⚠️ Token attach failed:", err.message);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =====================================================
   📥 RESPONSE INTERCEPTOR
===================================================== */

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    /* 🔌 BACKEND NOT REACHABLE */
    if (!error.response) {
      console.error("🌐 Network error or server down");
      return Promise.reject(error);
    }

    /* 🔐 TOKEN EXPIRED */
    if (error.response.status === 401) {
      console.warn("⚠️ Unauthorized → Logging out");

      await auth.signOut();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    /* ❌ FORBIDDEN */
    if (error.response.status === 403) {
      console.warn("⛔ Access forbidden");
    }

    /* 💥 SERVER ERROR */
    if (error.response.status >= 500) {
      console.error("🔥 Server error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default API;