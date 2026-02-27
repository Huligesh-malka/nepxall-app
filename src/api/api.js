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
   🚀 AXIOS FACTORY
===================================================== */

const createApi = (baseURL) => {
  const api = axios.create({
    baseURL,
    timeout: 60000,
    withCredentials: false,
  });

  /* ================= REQUEST ================= */

  api.interceptors.request.use(async (config) => {
    try {
      console.log("📡", `${baseURL}${config.url}`);

      const user = auth.currentUser;

      // ✅ DO NOT WAIT FOR FIREBASE
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
        return Promise.reject(error);
      }

      const originalRequest = error.config;

      /* 🔁 RETRY ON 401 ONCE */
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const user = auth.currentUser;
          if (user) {
            const newToken = await user.getIdToken(true);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (err) {
          console.warn("🔐 Re-auth failed");
        }

        await auth.signOut();
        window.location.href = "/login";
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

export default userAPI;