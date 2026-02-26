/* =====================================================
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
   🌐 GLOBAL DEBUG (DEV ONLY)
===================================================== */
if (typeof window !== "undefined" && !IS_PRODUCTION) {
  window.API_CONFIG = API_CONFIG;
  window.testBackend = testBackendConnection;
}