import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { API_CONFIG } from "../config";

/* =====================================================
   🌍 ENV DETECTION
===================================================== */

const isProduction = process.env.NODE_ENV === "production";

/* =====================================================
   🌍 BASE URL RESOLUTION (NEVER UNDEFINED)
===================================================== */

const USER_BASE_URL =
  API_CONFIG?.USER_API_URL ||
  process.env.REACT_APP_API_URL ||
  "https://nepxall-backend.onrender.com/api";

const ADMIN_BASE_URL =
  API_CONFIG?.ADMIN_API_URL ||
  process.env.REACT_APP_ADMIN_API_URL ||
  "https://nepxall-backend.onrender.com/api/admin";

console.log("🌐 API CONFIG →", {
  env: isProduction ? "PRODUCTION" : "DEVELOPMENT",
  USER_BASE_URL,
  ADMIN_BASE_URL,
});

/* =====================================================
   🔐 WAIT FOR FIREBASE USER (FOR PAGE REFRESH)
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
   🚀 AXIOS FACTORY
===================================================== */

const createApi = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 60000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  /* ================= REQUEST INTERCEPTOR ================= */

  instance.interceptors.request.use(async (config) => {
    try {
      console.log("📡 API Request →", `${baseURL}${config.url}`);

      let user = auth.currentUser;

      if (!user) user = await getCurrentUser();

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
      if (!error.response) {
        console.error("🌐 Backend unreachable:", baseURL);
        return Promise.reject(error);
      }

      const status = error.response.status;

      if (status === 401) {
        console.warn("⚠️ Session expired → logout");
        await auth.signOut();
        window.location.href = "/login";
      }

      if (status === 403) {
        console.warn("⛔ Forbidden → Admin only?");
      }

      if (status === 404) {
        console.error("❌ API route not found →", error.config.url);
      }

      if (status >= 500) {
        console.error("🔥 Server error:", error.response.data);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/* =====================================================
   📦 EXPORT AXIOS INSTANCES
===================================================== */

export const userAPI = createApi(USER_BASE_URL);
export const adminAPI = createApi(ADMIN_BASE_URL);

/* =====================================================
   🏠 PG / OWNER / BOOKING APIs
===================================================== */

export const pgAPI = {
  /* OWNER DASHBOARD */
  getOwnerDashboard: () => userAPI.get("/pg/owner/dashboard"),

  getOwnerProperties: () => userAPI.get("/pg/owner"),

  getProperty: (id) => userAPI.get(`/pg/${id}`),

  createProperty: (formData) =>
    userAPI.post("/pg/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateProperty: (id, data) => userAPI.put(`/pg/${id}`, data),

  deleteProperty: (id) => userAPI.delete(`/pg/${id}`),

  /* BOOKINGS */
  getOwnerBookings: () => userAPI.get("/owner/bookings"),

  updateBookingStatus: (bookingId, status) =>
    userAPI.put(`/bookings/${bookingId}`, { status }),

  /* PUBLIC SEARCH */
  searchProperties: (params) => userAPI.get("/pg/search", { params }),
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

/* =====================================================
   DEFAULT EXPORT (BACKWARD COMPATIBLE)
===================================================== */

export default userAPI;