/* =====================================================
   🔧 CONFIGURATION FILE (CRA VERSION)
   BULLETPROOF VERSION - PRODUCTION READY
===================================================== */

console.log("🔥 CONFIG.JS LOADED");

/* =====================================================
   🧼 URL SANITIZER
===================================================== */
const sanitizeUrl = (url, fallback) => {
  if (!url) return fallback;

  const clean = url.trim().replace(/\/$/, "");

  try {
    new URL(clean);
    return clean;
  } catch {
    console.warn("⚠️ Invalid URL in env → using fallback:", clean);
    return fallback;
  }
};

/* =====================================================
   🌍 BASE URLS - PRODUCTION READY
===================================================== */

// ✅ PRODUCTION BACKEND URL (Render)
const PRODUCTION_BACKEND_URL = "https://nepxall-backend.onrender.com";

// ✅ DEVELOPMENT BACKEND URL (Local)
const DEVELOPMENT_BACKEND_URL = "http://localhost:5000";

// ✅ Determine current environment
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ✅ USER API (auth, PG search, bookings, etc.)
const USER_API_URL = sanitizeUrl(
  IS_PRODUCTION 
    ? (process.env.REACT_APP_API || `${PRODUCTION_BACKEND_URL}/api`)
    : (process.env.REACT_APP_API || `${DEVELOPMENT_BACKEND_URL}/api`),
  IS_PRODUCTION 
    ? `${PRODUCTION_BACKEND_URL}/api`
    : `${DEVELOPMENT_BACKEND_URL}/api`
);

// ✅ ADMIN API (dashboard, approvals, etc.)
const ADMIN_API_URL = sanitizeUrl(
  IS_PRODUCTION 
    ? (process.env.REACT_APP_ADMIN_API || `${PRODUCTION_BACKEND_URL}/api/admin`)
    : (process.env.REACT_APP_ADMIN_API || `${DEVELOPMENT_BACKEND_URL}/api/admin`),
  IS_PRODUCTION 
    ? `${PRODUCTION_BACKEND_URL}/api/admin`
    : `${DEVELOPMENT_BACKEND_URL}/api/admin`
);

// ✅ SOCKET URL for real-time features
const SOCKET_URL = IS_PRODUCTION
  ? (process.env.REACT_APP_SOCKET_URL || PRODUCTION_BACKEND_URL)
  : (process.env.REACT_APP_SOCKET_URL || DEVELOPMENT_BACKEND_URL);

// ✅ BACKEND ROOT
const BACKEND_URL = USER_API_URL.replace(/\/api$/, "");

/* =====================================================
   🧠 DEBUG LOG (VERY IMPORTANT)
===================================================== */

console.log("🌍 ENVIRONMENT:", IS_PRODUCTION ? "PRODUCTION" : "DEVELOPMENT");
console.log("🌍 API CONFIG →", {
  USER_API_URL,
  ADMIN_API_URL,
  SOCKET_URL,
  BACKEND_URL,
  ENV: process.env.NODE_ENV,
});

/* =====================================================
   🧠 MAIN CONFIG OBJECT
===================================================== */

export const API_CONFIG = {
  USER_API_URL,
  ADMIN_API_URL,
  BACKEND_URL,
  SOCKET_URL,

  APP_NAME: "Nepxall",
  APP_VERSION: "1.0.0",

  ENV: process.env.NODE_ENV,
  IS_PRODUCTION,

  CASHFREE: {
    MODE: IS_PRODUCTION ? "production" : "sandbox",
  },

  URLS: {
    // Health endpoints
    HEALTH: `${USER_API_URL}/health`,
    ADMIN_HEALTH: `${ADMIN_API_URL}/health`,
    DIAGNOSE: `${BACKEND_URL}/api/diagnose`,
    
    // Auth endpoints
    LOGIN: `${USER_API_URL}/auth/login`,
    REGISTER: `${USER_API_URL}/auth/register`,
    LOGOUT: `${USER_API_URL}/auth/logout`,
    ME: `${USER_API_URL}/auth/me`,
    
    // PG endpoints
    PG_LIST: `${USER_API_URL}/pg`,
    PG_DETAILS: (id) => `${USER_API_URL}/pg/${id}`,
    PG_CREATE: `${USER_API_URL}/pg`,
    PG_UPDATE: (id) => `${USER_API_URL}/pg/${id}`,
    
    // Room endpoints
    ROOM_LIST: `${USER_API_URL}/rooms`,
    ROOM_DETAILS: (id) => `${USER_API_URL}/rooms/${id}`,
    
    // Booking endpoints
    BOOKING_CREATE: `${USER_API_URL}/bookings`,
    BOOKING_LIST: `${USER_API_URL}/bookings`,
    BOOKING_DETAILS: (id) => `${USER_API_URL}/bookings/${id}`,
    
    // Payment endpoints
    CREATE_ORDER: `${USER_API_URL}/payments/create-order`,
    PAYMENT_VERIFY: `${USER_API_URL}/payments/verify`,
    PAYMENT_HISTORY: `${USER_API_URL}/payments/history`,
    
    // Admin endpoints
    ADMIN_DASHBOARD: `${ADMIN_API_URL}/dashboard`,
    ADMIN_USERS: `${ADMIN_API_URL}/users`,
    ADMIN_OWNERS: `${ADMIN_API_URL}/owners`,
    ADMIN_VERIFICATIONS: `${ADMIN_API_URL}/verifications`,
    
    // Chat endpoints
    PG_CHAT: `${USER_API_URL}/pg-chat`,
    PRIVATE_CHAT: `${USER_API_URL}/private-chat`,
    
    // Review endpoints
    REVIEWS: (pgId) => `${USER_API_URL}/reviews/pg/${pgId}`,
    
    // Notification endpoints
    NOTIFICATIONS: `${USER_API_URL}/notifications`,
  },
};

/* =====================================================
   🔍 CONNECTION TEST
===================================================== */

export const testBackendConnection = async () => {
  try {
    console.log("🔍 Testing connection to:", API_CONFIG.URLS.HEALTH);
    const res = await fetch(API_CONFIG.URLS.HEALTH);
    const data = await res.json();

    console.log("✅ Backend connection test successful:", data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Backend connection test failed:", error.message);
    console.error("   Make sure your backend is running at:", USER_API_URL);
    return { success: false, error: error.message };
  }
};

/* =====================================================
   💳 CASHFREE CHECK
===================================================== */

export const isCashfreeLoaded = () => {
  if (window.Cashfree) return true;

  console.error("❌ Cashfree SDK NOT loaded");
  return false;
};

/* =====================================================
   💰 PAYMENT HELPERS
===================================================== */

export const createPaymentOrder = async (token, payload) => {
  try {
    const res = await fetch(API_CONFIG.URLS.CREATE_ORDER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("❌ Payment order creation failed:", error);
    throw error;
  }
};

export const verifyPayment = async (orderId) => {
  try {
    const res = await fetch(`${API_CONFIG.URLS.PAYMENT_VERIFY}/${orderId}`);
    return await res.json();
  } catch (error) {
    console.error("❌ Payment verification failed:", error);
    throw error;
  }
};

/* =====================================================
   🌐 DEBUG ACCESS IN BROWSER
===================================================== */

if (typeof window !== "undefined") {
  window.API_CONFIG = API_CONFIG;
  window.testBackend = testBackendConnection;
}