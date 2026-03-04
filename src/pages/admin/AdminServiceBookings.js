import React, { useEffect, useState } from "react";
import { adminAPI } from "../../api/api";

const AdminServiceBookings = () => {

  const [services,setServices] = useState([]);
  const [vendors,setVendors] = useState([]);

  useEffect(()=>{
    loadData();
  },[]);

  const loadData = async ()=>{

    const s = await adminAPI.get("/services");
    setServices(s.data.data);

    const v = await adminAPI.get("/vendors");
    setVendors(v.data.vendors);

  };

  const assignVendor = async(serviceId,vendorId)=>{

    await adminAPI.post("/assign-vendor",{
      serviceId,
      vendorId
    });

    alert("Vendor assigned");

    loadData();
  };

  return(

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Service Requests
      </h1>

      <table className="w-full bg-white shadow rounded">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Service</th>
            <th className="p-3">Tenant</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Assign Vendor</th>
          </tr>
        </thead>

        <tbody>

        {services.map(s=>(
          <tr key={s.id} className="border-t">

            <td className="p-3">
              {s.service_type}
            </td>

            <td className="p-3">
              {s.tenant_name}
            </td>

            <td className="p-3">
              ₹{s.amount}
            </td>

            <td className="p-3">

              <select
                onChange={(e)=>assignVendor(s.id,e.target.value)}
                className="border p-2 rounded"
              >

                <option>Select Vendor</option>

                {vendors.map(v=>(
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
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