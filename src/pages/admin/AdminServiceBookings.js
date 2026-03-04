import React, { useEffect, useState } from "react";
import { adminAPI } from "../../api/api";

const AdminServiceBookings = () => {
  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Hits: /api/admin/services
      const s = await adminAPI.get("/services");
      
      // 2. Hits: /api/admin/services/vendors
      const v = await adminAPI.get("/services/vendors");

      setServices(s.data.data || []);
      setVendors(v.data.vendors || []);
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignVendor = async (serviceId, vendorId) => {
    if (!vendorId) return;
    try {
      // Hits: /api/admin/services/assign-vendor
      await adminAPI.post("/services/assign-vendor", { serviceId, vendorId });
      alert("Vendor assigned successfully");
      loadData();
    } catch (err) {
      console.error("Assign error:", err);
      alert("Failed to assign vendor");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading services...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Service Management</h1>

      {services.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 p-6 rounded-lg text-center">
          No service bookings found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Service Type</th>
                <th className="p-4 font-semibold text-gray-700">Tenant</th>
                <th className="p-4 font-semibold text-gray-700">Amount</th>
                <th className="p-4 font-semibold text-gray-700">Assign Vendor</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 capitalize">{s.service_type}</td>
                  <td className="p-4 font-medium">{s.tenant_name || "Guest"}</td>
                  <td className="p-4">₹{s.amount}</td>
                  <td className="p-4">
                    <select
                      defaultValue=""
                      onChange={(e) => assignVendor(s.id, e.target.value)}
                      className="border rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select a Vendor</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminServiceBookings;