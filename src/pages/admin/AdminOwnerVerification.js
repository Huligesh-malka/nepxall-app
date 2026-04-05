import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/api"; // ✅ Using your standard API instance
import { useAuth } from "../../context/AuthContext"; // ✅ Added AuthContext

const FILES_BASE_URL = "https://nepxall-backend.onrender.com"; // Updated to match your backend

export default function AdminOwnerVerification() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 1. Get Auth State
  const { user, role, loading: authLoading } = useAuth();

  // 🔹 Load data
  const load = useCallback(async () => {
    // Only fetch if authenticated and admin
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);
      // Endpoint matches your Admin prefix
      const res = await api.get(`/admin/owner-verifications`);
      setList(res.data.data || []);
    } catch (err) {
      console.error("Load error:", err);
      // Only alert if it's not a cancel/unauth error handled by interceptor
      if (err.response?.status !== 401) {
        alert("Failed to load verification requests");
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    load();
  }, [load]);

  // ✅ 2. Handle Route Protection Logic
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Verifying Admin Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // 🔹 Approve
  const approve = async (id) => {
    if (!window.confirm("Are you sure you want to approve this owner?")) return;
    try {
      await api.patch(`/admin/owner-verifications/${id}/approve`, {});
      alert("Owner approved successfully");
      load();
    } catch (err) {
      console.error("Approve error:", err);
      alert("Approval failed");
    }
  };

  // 🔹 Reject
  const reject = async (id) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;

    try {
      await api.patch(`/admin/owner-verifications/${id}/reject`, { reason });
      alert("Owner rejected");
      load();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Rejection failed");
    }
  };

  const getFileUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    return `${FILES_BASE_URL}/${path.replace(/\\/g, "/")}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🛡️ Owner Verification Requests
        </h2>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
          {list.length} Pending
        </span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading data...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
           <p className="text-gray-500">No verification requests found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">ID Proof</th>
                <th className="p-4 font-semibold text-gray-600">Property Proof</th>
                <th className="p-4 font-semibold text-gray-600">Signature</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>

            <tbody>
              {list.map((v) => (
                <tr key={v.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{v.name}</td>

                  <td className="p-4">
                    <a
                      href={getFileUrl(v.id_proof_file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View ID
                    </a>
                  </td>

                  <td className="p-4">
                    <a
                      href={getFileUrl(v.property_proof_file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View Property
                    </a>
                  </td>

                  <td className="p-4">
                    <a
                      href={getFileUrl(v.digital_signature_file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View Signature
                    </a>
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      v.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      v.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {v.status}
                    </span>
                  </td>

                  <td className="p-4">
                    {v.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => approve(v.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => reject(v.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm font-semibold hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}