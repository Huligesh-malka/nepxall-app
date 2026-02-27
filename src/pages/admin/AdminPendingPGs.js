import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { adminPGAPI } from "../../api/api";   // ✅ use this

const AdminPendingPGs = () => {
  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const navigate = useNavigate();

  /* ================= LOAD DATA ================= */

  const loadPendingPGs = useCallback(async () => {
    try {
      setLoading(true);

      const res = await adminPGAPI.getPendingPGs();

      setPGs(res.data.data || []);
    } catch (err) {
      console.error(err);

      if ([401, 403].includes(err.response?.status)) {
        navigate("/login");
      } else {
        alert("Failed to load pending PGs");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /* ================= AUTH READY ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
      else loadPendingPGs();
    });

    return () => unsub();
  }, [loadPendingPGs, navigate]);

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

  /* ================= LOADER ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Pending Property Reviews
          </h1>
          <p className="text-sm text-gray-500">
            PG • Co-Living • House / Flat
          </p>
        </div>

        <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
          Total: {pgs.length}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
          No pending properties found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((pg) => (
            <div
              key={pg.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
            >
              <div className="h-2 bg-blue-600" />

              <div className="p-5">
                <h3 className="font-semibold text-lg text-gray-800 truncate">
                  {pg.pg_name || "Unnamed Property"}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {pg.area}, {pg.city}
                </p>

                <div className="flex justify-between items-center mt-3">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Pending
                  </span>

                  <span className="text-xs text-gray-400">
                    {new Date(pg.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/admin/pg/${pg.id}`)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                >
                  Review Property →
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