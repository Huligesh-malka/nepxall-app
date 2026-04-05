import React, { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom"; // ✅ Added Navigate
import { adminPGAPI } from "../../api/api";
import { API_CONFIG } from "../../config";
import { useAuth } from "../../context/AuthContext"; // ✅ Added AuthContext

const FILES_BASE =
  API_CONFIG?.FILES_URL ||
  "https://nepxall-backend.onrender.com";

const AdminPGDetails = () => {
  const { id } = useParams();

  // ✅ 1. Get Auth State
  const { user, role, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  /* ================= LOAD PG ================= */

  const loadPG = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminPGAPI.getPGById(id);
      const data = res.data.data;

      setPG(data);
      // Ensure photos is always an array
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      console.error("Load PG error:", err);
      alert("Failed to load PG details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* ================= EFFECT ================= */

  useEffect(() => {
    // Only load data if auth is finished and user is admin
    if (!authLoading && user && role === "admin") {
      loadPG();
    }
  }, [loadPG, authLoading, user, role]);

  /* ================= ROUTE PROTECTION ================= */

  if (authLoading) {
    return <div className="p-10 text-center font-semibold text-gray-500">Verifying Admin Permissions...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  /* ================= ACTIONS ================= */

  const approve = async () => {
    if (!window.confirm("Are you sure you want to approve this property? It will go live immediately.")) return;

    try {
      setActionLoading(true);
      await adminPGAPI.approvePG(id);
      alert("Property approved successfully!");
      await loadPG();
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return alert("Please enter a rejection reason for the owner.");

    try {
      setActionLoading(true);
      await adminPGAPI.rejectPG(id, rejectReason);
      setShowReject(false);
      setRejectReason("");
      alert("Property rejected and owner notified.");
      await loadPG();
    } catch (err) {
      console.error("Rejection failed:", err);
      alert("Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= UI ================= */

  if (loading) return <div className="p-10 text-center">Fetching property details...</div>;
  if (!pg) return <div className="p-10 text-center">No property found with ID: {id}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{pg.pg_name || "Unnamed Property"}</h1>
                <p className="text-gray-500 text-sm">Property ID: #{id}</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                pg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                pg.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
                {pg.status}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
          
          <Section title="Property Overview">
            <Row label="Property Name" value={pg.pg_name} />
            <Row label="Category" value={pg.pg_category} />
            <Row label="Type" value={pg.pg_type} />
            <Row label="City" value={pg.city} />
            <Row label="Area" value={pg.area} />
            <Row label="Owner Name" value={pg.owner_name} />
          </Section>

          <Section title="Photos">
            {photos.length === 0 ? (
              <div className="col-span-full py-10 bg-gray-50 rounded text-center text-gray-400">
                  No photos uploaded for this property
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-full">
                {photos.map((img, i) => (
                  <a key={i} href={`${FILES_BASE}${img}`} target="_blank" rel="noreferrer">
                    <img
                      src={`${FILES_BASE}${img}`}
                      alt={`Property ${i}`}
                      className="h-40 w-full object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </a>
                ))}
              </div>
            )}
          </Section>

          {/* Action Footer */}
          {pg.status === "pending" && !showReject && (
            <div className="flex justify-end gap-4 border-t pt-6">
              <button
                disabled={actionLoading}
                onClick={() => setShowReject(true)}
                className="px-6 py-2 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
              >
                Reject
              </button>

              <button
                disabled={actionLoading}
                onClick={approve}
                className="bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md disabled:opacity-50 transition-all"
              >
                {actionLoading ? "Processing..." : "Approve Listing"}
              </button>
            </div>
          )}

          {/* Rejection Form */}
          {showReject && (
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 space-y-4">
              <h4 className="font-bold text-red-800">Reject Property Listing</h4>
              <textarea
                placeholder="Explain why this property is being rejected (the owner will see this)..."
                className="w-full border border-red-200 p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none h-32"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:underline"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={reject}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
                >
                  {actionLoading ? "Sending..." : "Submit Rejection"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* UI helpers */

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-600 pl-3">{title}</h3>
    <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-gray-50 py-2">
    <span className="text-gray-500 text-sm font-medium">{label}</span>
    <span className="text-gray-800 font-semibold">{value || "—"}</span>
  </div>
);

export default AdminPGDetails;