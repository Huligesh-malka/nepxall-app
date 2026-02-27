/* =====================================================
   🔧 CONFIGURATION FILE — PRODUCTION GRADE
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
   🌍 ENV
===================================================== */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/* =====================================================
   🌍 DEFAULT BACKEND
===================================================== */
const PROD_BACKEND = "https://nepxall-backend.onrender.com";
const DEV_BACKEND = "http://localhost:5000";

/* =====================================================
   🌍 ROOT URL
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

const SOCKET_URL = sanitizeUrl(
  process.env.REACT_APP_SOCKET_URL || BACKEND_URL,
  BACKEND_URL
);

const FILE_BASE_URL = BACKEND_URL;

/* =====================================================
   🧠 CONFIG OBJECT
===================================================== */
export const API_CONFIG = {
  BACKEND_URL,
  USER_API_URL,
  ADMIN_API_URL,
  SOCKET_URL,
  FILE_BASE_URL,

  ENV: process.env.NODE_ENV,
  IS_PRODUCTION,

  APP_NAME: "Nepxall",
  APP_VERSION: "1.0.0",

  CASHFREE: {
    MODE: IS_PRODUCTION ? "production" : "sandbox",
  },

  URLS: {
    HEALTH: `${USER_API_URL}/health`,
    FIREBASE_LOGIN: `${USER_API_URL}/auth/firebase`,
    ME: `${USER_API_URL}/auth/me`,
  },
};

console.log("🌍 CONFIG:", API_CONFIG);

/* =====================================================
   🔍 BACKEND CONNECTION TEST (PRODUCTION SAFE)
===================================================== */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const testBackendConnection = async (retries = 2) => {
  const timeoutDuration = IS_PRODUCTION ? 20000 : 5000;

  try {
    console.log("🔍 Testing:", API_CONFIG.URLS.HEALTH);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutDuration);

    const res = await fetch(API_CONFIG.URLS.HEALTH, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    console.log("✅ Backend reachable");
    return { success: true, data };
  } catch (err) {
    console.warn("⚠️ Backend check failed:", err.message);

    if (retries > 0) {
      console.log("🔁 Retrying backend check...");
      await sleep(4000);
      return testBackendConnection(retries - 1);
    }

    return { success: false, error: err.message };
  }
};

/* =====================================================
   💳 CASHFREE SDK CHECK
===================================================== */
export const isCashfreeLoaded = () => {
  if (window.Cashfree) return true;

  console.error("❌ Cashfree SDK not loaded");
  return false;
};

/* =====================================================
   🖼️ IMAGE HELPER
===================================================== */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder-image.jpg";

  if (imagePath.startsWith("http")) return imagePath;

  const cleanPath = imagePath.startsWith("/")
    ? imagePath.slice(1)
    : imagePath;

  return `${BACKEND_URL}/${cleanPath}`;
};

/* =====================================================
   🌐 DEV GLOBALS
===================================================== */
if (typeof window !== "undefined" && !IS_PRODUCTION) {
  window.API_CONFIG = API_CONFIG;
  window.testBackend = testBackendConnection;
  window.getImageUrl = getImageUrl;
}