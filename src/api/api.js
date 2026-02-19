import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const API = axios.create({
  // Use /api to match your backend app.use("/api/...") configuration
  baseURL: "http://localhost:5000/api", 
});

/* ---------------- HELPER: WAIT FOR FIREBASE ---------------- */
// This ensures that if the page refreshes, we wait for Firebase to 
// confirm the user is logged in before sending the request.
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

/* ---------------- REQUEST INTERCEPTOR ---------------- */
API.interceptors.request.use(
  async (config) => {
    // 1. Get the current user (wait if initializing)
    let user = auth.currentUser;
    if (!user) {
        user = await getCurrentUser();
    }

    // 2. Attach token if user exists
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("✅ Token attached for:", user.email);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    // If the backend says the token is expired or invalid
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized! Logging out...");
      await auth.signOut();
      // Only redirect if we aren't already on the login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;