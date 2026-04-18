import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api from "../../api/api";

export default function OwnerActiveTenants() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  //////////////////////////////////////////////////////
  // FETCH TENANTS
  //////////////////////////////////////////////////////
  const fetchTenants = async () => {
    try {
      const res = await api.get("/owner/tenants/active");

      if (res.data.success) {
        setTenants(res.data.data);
      }
    } catch (err) {
      console.error("TENANTS ERROR:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // AUTH + LOAD
  //////////////////////////////////////////////////////
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }

    if (user && role === "owner") {
      fetchTenants();
    }
  }, [user, role, authLoading, navigate]);

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////
  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-6">
          <h1 className="text-2xl font-bold">👥 Active Tenants</h1>
          <p className="text-indigo-100">
            View all currently staying users in your PGs
          </p>
        </div>

        {/* EMPTY */}
        {tenants.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-center">
            No active tenants found
          </div>
        ) : (

          <div className="grid md:grid-cols-2 gap-6">
            {tenants.map((t) => (
              <div
                key={t.pg_user_id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                {/* USER */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{t.name}</h2>
                    <p className="text-gray-500">{t.phone}</p>
                    <p className="text-gray-400 text-sm">{t.email}</p>
                  </div>

                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    🟢 {t.status}
                  </span>
                </div>

                {/* PROPERTY */}
                <div className="space-y-1 text-gray-700 mb-3">
                  <p>🏠 <strong>{t.pg_name}</strong></p>
                  <p>🚪 Room: {t.room_no || "Not Assigned"}</p>

                  {/* ✅ ROOM TYPE (SHARING) */}
                  <p>
                    🛏 Type:{" "}
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                      {t.room_type || "N/A"}
                    </span>
                  </p>
                </div>

                {/* FINANCIAL */}
                <div className="grid grid-cols-2 gap-2 text-gray-700 mb-3">
                  <p>💰 Rent: <strong>₹{t.rent_amount ?? 0}</strong></p>
                  <p>🔐 Deposit: <strong>₹{t.security_deposit ?? 0}</strong></p>

                  {/* ✅ MAINTENANCE */}
                  <p>🛠 Maintenance: <strong>₹{t.maintenance_amount ?? 0}</strong></p>

                  <p>🧾 Owner Earn: ₹{t.owner_amount ?? 0}</p>
                </div>

                {/* CHECK-IN */}
                <div className="text-sm text-gray-600 mb-3">
                  <p>
                    📅 Check-in:{" "}
                    {t.checkin_time
                      ? new Date(t.checkin_time).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                {/* ACTIONS - Only View button */}
                <div className="mt-4">
                  <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}