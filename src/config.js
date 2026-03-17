import axios from "axios";
import { auth } from "../firebase";
import { API_CONFIG } from "../config";

/* =====================================================
   🌍 BASE URL
===================================================== */

const USER_BASE_URL =
  API_CONFIG?.USER_API_URL ||
  process.env.REACT_APP_API_URL ||
  "https://nepxall-backend.onrender.com/api";

const ADMIN_BASE_URL =
  API_CONFIG?.ADMIN_API_URL ||
  process.env.REACT_APP_ADMIN_API_URL ||
  "https://nepxall-backend.onrender.com/api/admin";

console.log("🌐 API CONFIG →", { USER_BASE_URL, ADMIN_BASE_URL });

/* =====================================================
   🔥 BACKEND WAKEUP SYSTEM
===================================================== */

let backendReady = false;
let wakePromise = null;

const wakeBackend = async () => {
  if (backendReady) return;

  if (!wakePromise) {
    console.log("⏳ Waking backend...");

    wakePromise = new Promise(async (resolve) => {
      const start = Date.now();

      while (Date.now() - start < 120000) {
        try {
          await fetch(`${USER_BASE_URL}/health`);
          backendReady = true;
          console.log("✅ Backend awake");
          resolve(true);
          return;
        } catch {
          console.log("⌛ waiting for backend...");
          await new Promise((r) => setTimeout(r, 4000));
        }
      }

      console.error("❌ Backend wake failed");
      resolve(false);
    });
  }

  return wakePromise;
};

/* =====================================================
   🚀 AXIOS FACTORY
===================================================== */

const createApi = (baseURL) => {
  const api = axios.create({
    baseURL,
    timeout: 120000,
  });

  /* ================= REQUEST ================= */

  api.interceptors.request.use(async (config) => {
    await wakeBackend();

    try {
      console.log("📡", `${baseURL}${config.url}`);

      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("⚠️ Token error:", err.message);
    }

    return config;
  });

  /* ================= RESPONSE ================= */

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (!error.response) {
        console.error("🌐 Backend unreachable:", baseURL);
        backendReady = false; // force re-wake
        return Promise.reject(error);
      }

      const originalRequest = error.config;

      /* 🔁 RETRY ON 401 */
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const user = auth.currentUser;

          if (user) {
            const newToken = await user.getIdToken(true);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch {
          await auth.signOut();
          window.location.href = "/login";
        }
      }

      if (error.response.status >= 500) {
        console.error("🔥 Server error:", error.response.data);
      }

      if (error.response.status === 404) {
        console.error("❌ Route not found:", originalRequest.url);
      }

      return Promise.reject(error);
    }
  );

  return api;
};

/* =====================================================
   📦 INSTANCES
===================================================== */

export const userAPI = createApi(USER_BASE_URL);
export const adminAPI = createApi(ADMIN_BASE_URL);

/* =====================================================
   🏠 PG APIs
===================================================== */

export const pgAPI = {
  getOwnerDashboard: () => userAPI.get("/pg/owner/dashboard"),
  getOwnerProperties: () => userAPI.get("/pg/owner"),
  getProperty: (id) => userAPI.get(`/pg/${id}`),

  createProperty: (formData) =>
    userAPI.post("/pg/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateProperty: (id, data) => userAPI.put(`/pg/${id}`, data),
  deleteProperty: (id) => userAPI.delete(`/pg/${id}`),

  getOwnerBookings: () => userAPI.get("/owner/bookings"),

  updateBookingStatus: (bookingId, status) =>
    userAPI.put(`/bookings/${bookingId}`, { status }),

  searchProperties: (params) =>
    userAPI.get("/pg/search", { params }),
};

/* =====================================================
   👑 ADMIN APIs
===================================================== */

export const adminPGAPI = {
  getPendingPGs: () => adminAPI.get("/pgs/pending"),
  getPGById: (id) => adminAPI.get(`/pg/${id}`),
  approvePG: (id) => adminAPI.patch(`/pg/${id}/approve`),
  rejectPG: (id, reason) =>
    adminAPI.patch(`/pg/${id}/reject`, { reason }),
};

export default userAPI;  /* =====================================================
   🔧 CONFIGURATION FILE — PRODUCTION SAFE (CRA)
===================================================== */

console.log("🔥 CONFIG.JS LOADED");

/* =====================================================
   🧼 URL SANITIZER
===================================================== */
const sanitizeUrl = (url, fallback) => {
  if (!url) return fallback;

  const clean = url.trim().replace(/\/+$/, "");

  try {
    new URL(clean);
    return clean;
  } catch {
    console.warn("⚠️ Invalid URL → using fallback:", clean);
    return fallback;
  }
};

/* =====================================================
   🌍 ENV DETECTION
===================================================== */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/* =====================================================
   🌍 DEFAULT BACKEND URLS
===================================================== */
const PROD_BACKEND = "https://nepxall-backend.onrender.com";
const DEV_BACKEND = "http://localhost:5000";

/* =====================================================
   🌍 BACKEND ROOT
===================================================== */
const BACKEND_URL = sanitizeUrl(
  process.env.REACT_APP_BACKEND_URL ||
    (IS_PRODUCTION ? PROD_BACKEND : DEV_BACKEND),
  IS_PRODUCTION ? PROD_BACKEND : DEV_BACKEND
);

/* =====================================================
   🌍 API URLS
===================================================== */
const USER_API_URL = sanitizeUrl(
  process.env.REACT_APP_USER_API || `${BACKEND_URL}/api`,
  `${BACKEND_URL}/api`
);

const ADMIN_API_URL = sanitizeUrl(
  process.env.REACT_APP_ADMIN_API || `${BACKEND_URL}/api/admin`,
  `${BACKEND_URL}/api/admin`
);

/* =====================================================
   🔌 SOCKET URL
===================================================== */
const SOCKET_URL = sanitizeUrl(
  process.env.REACT_APP_SOCKET_URL || BACKEND_URL,
  BACKEND_URL
);

/* =====================================================
   🖼️ FILE / IMAGE BASE URL
   👉 USE THIS FOR ALL IMAGES
===================================================== */
const FILE_BASE_URL = BACKEND_URL;

/* =====================================================
   🧠 DEBUG LOG
===================================================== */
console.log("🌍 ENV:", IS_PRODUCTION ? "PRODUCTION" : "DEVELOPMENT");
console.log("🌍 CONFIG:", {
  BACKEND_URL,
  USER_API_URL,
  ADMIN_API_URL,
  SOCKET_URL,
});

/* =====================================================
   🧠 MAIN CONFIG OBJECT
===================================================== */
export const API_CONFIG = {
  BACKEND_URL,
  USER_API_URL,
  ADMIN_API_URL,
  SOCKET_URL,
  FILE_BASE_URL,

  APP_NAME: "Nepxall",
  APP_VERSION: "1.0.0",

  ENV: process.env.NODE_ENV,
  IS_PRODUCTION,

  CASHFREE: {
    MODE: IS_PRODUCTION ? "production" : "sandbox",
  },

  URLS: {
    HEALTH: `${USER_API_URL}/health`,
    ADMIN_HEALTH: `${ADMIN_API_URL}/health`,
    DIAGNOSE: `${BACKEND_URL}/api/diagnose`,

    /* AUTH */
    FIREBASE_LOGIN: `${USER_API_URL}/auth/firebase`,
    ME: `${USER_API_URL}/auth/me`,

    /* PG */
    PG_LIST: `${USER_API_URL}/pg`,
    PG_DETAILS: (id) => `${USER_API_URL}/pg/${id}`,

    /* BOOKINGS */
    BOOKINGS: `${USER_API_URL}/bookings`,
    ACTIVE_STAY: `${USER_API_URL}/bookings/user/active-stay`,

    /* PAYMENTS */
    CREATE_ORDER: `${USER_API_URL}/payments/create-order`,
    VERIFY_PAYMENT: `${USER_API_URL}/payments/verify`,

    /* ADMIN */
    ADMIN_DASHBOARD: `${ADMIN_API_URL}/dashboard`,
    ADMIN_OWNER_VERIFICATIONS: `${ADMIN_API_URL}/owner-verifications`,
    ADMIN_PENDING_SETTLEMENTS: `${ADMIN_API_URL}/payments/pending-settlements`,
  },
};

/* =====================================================
   🔍 CONNECTION TEST (WITH TIMEOUT)
===================================================== */
export const testBackendConnection = async () => {
  try {
    console.log("🔍 Testing:", API_CONFIG.URLS.HEALTH);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(API_CONFIG.URLS.HEALTH, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();

    console.log("✅ Backend reachable");
    return { success: true, data };
  } catch (err) {
    console.error("❌ Backend unreachable:", err.message);
    return { success: false, error: err.message };
  }
};

/* =====================================================
   💳 CASHFREE CHECK
===================================================== */
export const isCashfreeLoaded = () => {
  if (window.Cashfree) return true;

  console.error("❌ Cashfree SDK not loaded");
  return false;
};

/* =====================================================
   🖼️ IMAGE URL HELPER
===================================================== */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder-image.jpg";
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith("http")) return imagePath;
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  
  // Construct full URL using BACKEND_URL
  return `${BACKEND_URL}/${cleanPath}`;
};

/* =====================================================
   🌐 GLOBAL DEBUG (DEV ONLY)
===================================================== */
if (typeof window !== "undefined" && !IS_PRODUCTION) {
  window.API_CONFIG = API_CONFIG;
  window.testBackend = testBackendConnection;
  window.getImageUrl = getImageUrl;
}