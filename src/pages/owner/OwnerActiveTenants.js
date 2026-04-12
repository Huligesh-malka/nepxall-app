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
        console.log("TENANTS DATA:", res.data.data); // 🔍 debug
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
                </div>

                {/* FINANCIAL */}
                <div className="grid grid-cols-2 gap-2 text-gray-700 mb-3">
                  <p>💰 Rent: <strong>₹{t.rent_amount ?? 0}</strong></p>
                  <p>🔐 Deposit: <strong>₹{t.security_deposit ?? 0}</strong></p>
                  <p>🧾 Owner Earn: ₹{t.owner_amount ?? 0}</p>
                  <p>💸 Platform Fee: ₹{t.platform_fee ?? 0}</p>
                </div>

                {/* STATUS */}
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className={`px-2 py-1 rounded ${t.kyc_verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    KYC: {t.kyc_verified ? "Verified" : "Pending"}
                  </span>

                  <span className={`px-2 py-1 rounded ${t.agreement_signed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    Agreement: {t.agreement_signed ? "Signed" : "Pending"}
                  </span>

                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                    Booking: {t.booking_status}
                  </span>
                </div>

                {/* DATES */}
                <div className="text-sm text-gray-600 mb-3">
                  <p>
                    📅 Joined:{" "}
                    {t.join_date
                      ? new Date(t.join_date).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <p>
                    🏁 Check-in:{" "}
                    {t.check_in_date
                      ? new Date(t.check_in_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 flex gap-2">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    View
                  </button>

                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Message
                  </button>

                  <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    Vacate
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