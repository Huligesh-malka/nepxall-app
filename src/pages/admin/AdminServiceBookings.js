import React, { useEffect, useState } from "react";
import { adminAPI } from "../../api/api";

const AdminServiceBookings = () => {
  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // These call https://nepxall-backend.onrender.com/api/admin/services
      const s = await adminAPI.get("/services");
      const v = await adminAPI.get("/vendors");

      setServices(s.data.data || []);
      setVendors(v.data.vendors || []);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  const assignVendor = async (serviceId, vendorId) => {
    if (!vendorId) return;
    try {
      await adminAPI.post("/assign-vendor", { serviceId, vendorId });
      alert("Vendor assigned successfully");
      loadData();
    } catch (err) {
      alert("Failed to assign vendor");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Service Requests</h1>

      {services.length === 0 ? (
        <div className="bg-blue-50 text-blue-700 p-4 rounded mb-4">No bookings found</div>
      ) : (
        <table className="w-full bg-white shadow rounded">
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
                <td className="p-3">{s.tenant_name || "Unknown"}</td>
                <td className="p-3">₹{s.amount}</td>
                <td className="p-3">
                  <select
                    defaultValue=""
                    onChange={(e) => assignVendor(s.id, e.target.value)}
                    className="border p-2 rounded"
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
      )}
    </div>
  );
};

export default AdminServiceBookings;