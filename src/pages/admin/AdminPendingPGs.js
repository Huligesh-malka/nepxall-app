import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom"; // ✅ Added Navigate
import { adminPGAPI } from "../../api/api";
import { useAuth } from "../../context/AuthContext"; // ✅ Added AuthContext

const AdminPendingPGs = () => {
  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const navigate = useNavigate();

  // ✅ 1. Get Auth State
  const { user, role, loading: authLoading } = useAuth();

  /* ================= LOAD DATA ================= */

  const loadPendingPGs = useCallback(async () => {
    // Only fetch if authenticated and admin
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);
      const res = await adminPGAPI.getPendingPGs();
      setPGs(res.data.data || []);
    } catch (err) {
      console.error("Load Pending PGs Error:", err);
      // Handle unauthorized access or fetch failures
      if ([401, 403].includes(err.response?.status)) {
        navigate("/login");
      } else {
        alert("Failed to load pending PGs");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, authLoading, user, role]);

  /* ================= EFFECT ================= */

  useEffect(() => {
    loadPendingPGs();
  }, [loadPendingPGs]);

  /* ================= ROUTE PROTECTION ================= */

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  /* ================= FILTER / SORT ================= */

  const list = pgs
    .filter((pg) => {
      if (filter !== "all" && pg.pg_category !== filter) return false;
      if (!searchTerm) return true;

      const s = searchTerm.toLowerCase();
      return (
        pg.pg_name?.toLowerCase().includes(s) ||
        pg.city?.toLowerCase().includes(s) ||
        pg.area?.toLowerCase().includes(s) ||
        pg.owner_name?.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);

      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);

      return (a.pg_name || "").localeCompare(b.pg_name || "");
    });

  /* ================= LOADER (Data Fetching) ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Pending Property Reviews
          </h1>
          <p className="text-sm text-gray-500">
            PG • Co-Living • House / Flat
          </p>
        </div>

        <div className="flex items-center gap-3">
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
              Total Pending: {pgs.length}
            </span>
            <button 
                onClick={loadPendingPGs}
                className="text-sm text-blue-600 hover:underline"
            >
                Refresh
            </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          No pending properties found to review.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((pg) => (
            <div
              key={pg.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="h-2 bg-blue-600" />

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 truncate flex-1">
                      {pg.pg_name || "Unnamed Property"}
                    </h3>
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 uppercase font-bold">
                        ID: {pg.id}
                    </span>
                </div>

                <p className="text-sm text-gray-500">
                  {pg.area}, {pg.city}
                </p>

                <div className="flex justify-between items-center mt-4">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Pending Review
                  </span>

                  <span className="text-xs text-gray-400">
                    {new Date(pg.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/admin/pg/${pg.id}`)}
                  className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Review Property 
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPendingPGs;