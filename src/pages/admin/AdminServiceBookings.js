import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { adminAPI } from "../../api/api";
import { useAuth } from "../../context/AuthContext"; // ✅ Added AuthContext

const AdminServiceBookings = () => {
  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ 1. Get Auth State
  const { user, role, loading: authLoading } = useAuth();

  /* ================= LOAD DATA ================= */

  const loadData = useCallback(async () => {
    // Only fetch if authenticated and admin
    if (authLoading || !user || role !== "admin") return;

    try {
      setLoading(true);

      // Fetch services and vendors in parallel
      const [servicesRes, vendorsRes] = await Promise.all([
        adminAPI.get("/services"),
        adminAPI.get("/vendors")
      ]);

      setServices(servicesRes.data.data || []);
      setVendors(vendorsRes.data.vendors || []);
    } catch (err) {
      console.error("Failed to load admin service data:", err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= ACTIONS ================= */

  const assignVendor = async (serviceId, vendorId) => {
    if (!vendorId) return;

    const confirmAssign = window.confirm("Are you sure you want to assign this vendor?");
    if (!confirmAssign) return;

    try {
      setRefreshing(true);
      await adminAPI.post("/assign-vendor", {
        serviceId,
        vendorId,
      });

      alert("Vendor assigned successfully");
      await loadData(); // Refresh list
    } catch (err) {
      console.error("Assign Error:", err);
      alert("Failed to assign vendor. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  /* ================= ROUTE PROTECTION ================= */

  if (authLoading) {
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Verifying Admin Access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Loading services and vendors...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Service Management
          </h1>
          <p className="text-sm text-gray-500">Assign vendors to pending service requests</p>
        </div>
        
        {refreshing && (
          <span className="text-xs font-bold text-blue-600 animate-pulse bg-blue-50 px-3 py-1 rounded-full">
            Updating...
          </span>
        )}
      </div>

      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Service</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Tenant Name</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Amount</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Vendor Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {services.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-400">
                  No service bookings found.
                </td>
              </tr>
            ) : (
              services.map((s) => {
                const assigned = s.assigned_vendor_id;

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{s.service_type}</div>
                      <div className="text-xs text-gray-400">ID: {s.id}</div>
                    </td>

                    <td className="p-4 text-gray-700">
                      {s.tenant_name || <span className="text-gray-300 italic">Not available</span>}
                    </td>

                    <td className="p-4 font-bold text-gray-900">
                      ₹{s.amount}
                    </td>

                    <td className="p-4">
                      {assigned ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                            {s.vendor_name || "Assigned"}
                          </span>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => assignVendor(s.id, e.target.value)}
                          disabled={refreshing}
                          className="border border-gray-200 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-50"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select Vendor to Assign
                          </option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.service_type || "General"})
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminServiceBookings;