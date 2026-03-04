import React, { useEffect, useState } from "react";
import { adminAPI } from "../../api/api";

const AdminServiceBookings = () => {
  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Hits GET /api/admin/services
      const s = await adminAPI.get("/services");
      // Hits GET /api/admin/services/vendors
      const v = await adminAPI.get("/services/vendors");

      setServices(s.data.data || []);
      setVendors(v.data.vendors || []);
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignVendor = async (serviceId, vendorId) => {
    if (!vendorId) return;
    try {
      // Hits POST /api/admin/services/assign-vendor
      await adminAPI.post("/services/assign-vendor", { serviceId, vendorId });
      alert("Vendor assigned successfully");
      loadData();
    } catch (err) {
      alert("Failed to assign vendor");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Service Management</h1>
      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Service</th>
            <th className="p-3 text-left">Tenant</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Assign Vendor</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-3 capitalize">{s.service_type}</td>
              <td className="p-3">{s.tenant_name || "N/A"}</td>
              <td className="p-3">₹{s.amount}</td>
              <td className="p-3">
                <select
                  defaultValue=""
                  onChange={(e) => assignVendor(s.id, e.target.value)}
                  className="border p-1 rounded"
                >
                  <option value="" disabled>Select Vendor</option>
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
  );
};

export default AdminServiceBookings;