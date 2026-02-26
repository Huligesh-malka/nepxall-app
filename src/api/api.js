import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { API_CONFIG, testBackendConnection } from "../config";

/* =====================================================
   🌍 BASE URL
===================================================== */

const BASE_URL = API_CONFIG.USER_API_URL;
const ADMIN_BASE_URL = API_CONFIG.ADMIN_API_URL;

console.log("🌐 API Service Initialized:", {
  baseURL: BASE_URL,
  adminURL: ADMIN_BASE_URL,
  env: API_CONFIG.ENV,
});

/* =====================================================
   🔐 GET FIREBASE USER (SAFE & FAST)
===================================================== */

const getCurrentUser = () =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user || null);
    });

    // ⏱️ fallback (prevents infinite wait)
    setTimeout(() => resolve(null), 3000);
  });

/* =====================================================
   🚀 CREATE AXIOS INSTANCE
===================================================== */

const createApi = (baseURL, isAdmin = false) => {
  const instance = axios.create({
    baseURL,
    timeout: 60000,
    withCredentials: false,
    headers: {
      "Content-Type": "application/json",
    },
  });

  /* ================= REQUEST INTERCEPTOR ================= */

  instance.interceptors.request.use(async (config) => {
    try {
      let user = auth.currentUser || (await getCurrentUser());

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("⚠️ Token attach failed:", err.message);
    }

    return config;
  });

  /* ================= RESPONSE INTERCEPTOR ================= */

  instance.interceptors.response.use(
    (res) => res,

    async (error) => {
      // 🌐 NETWORK ERROR
      if (!error.response) {
        console.error("🌐 Backend not reachable:", baseURL);

        if (!API_CONFIG.IS_PRODUCTION) {
          await testBackendConnection();
        }

        return Promise.reject(error);
      }

      const { status } = error.response;

      console.error(`❌ API ${status}:`, error.config.url);

      /* ===== AUTH ERROR ===== */
      if (status === 401) {
        await auth.signOut();
        window.location.href = "/login";
      }

      /* ===== ADMIN FORBIDDEN ===== */
      if (status === 403 && isAdmin) {
        window.location.href = "/admin/unauthorized";
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/* =====================================================
   📦 EXPORT APIs
===================================================== */

export const userAPI = createApi(BASE_URL, false);
export const adminAPI = createApi(ADMIN_BASE_URL, true);

/* =====================================================
   🩺 HEALTH CHECK
===================================================== */

export const checkHealth = async () => {
  try {
    const res = await userAPI.get("/health");
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export default userAPI;