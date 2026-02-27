import axios from "axios";

const ADMIN_API = axios.create({
  baseURL:
    process.env.REACT_APP_ADMIN_API_URL ||
    "https://nepxall-backend.onrender.com/api/admin",
});

/* 🔐 Attach token automatically */
ADMIN_API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default ADMIN_API;