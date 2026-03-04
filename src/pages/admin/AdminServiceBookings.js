import React, { useEffect, useState } from "react";
import { adminAPI } from "../../api/api";

const AdminServiceBookings = () => {

  const [services,setServices] = useState([]);
  const [vendors,setVendors] = useState([]);
  const [loading,setLoading] = useState(true);

  const loadData = async () => {

    try{

      setLoading(true);

      const s = await adminAPI.get("/services");
      const v = await adminAPI.get("/vendors");

      setServices(s.data.data || []);
      setVendors(v.data.vendors || []);

    }catch(err){
      console.error(err);
    }finally{
      setLoading(false);
    }

  };

  useEffect(()=>{
    loadData();
  },[]);


  const assignVendor = async(serviceId,vendorId)=>{

    if(!vendorId) return;

    try{

      await adminAPI.post("/assign-vendor",{
        serviceId,
        vendorId
      });

      alert("Vendor assigned successfully");

      loadData();

    }catch(err){
      alert("Failed to assign vendor");
    }

  };


  if(loading){
    return <div className="p-6">Loading services...</div>;
  }


  return(

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Admin Service Management
      </h1>

      <table className="w-full bg-white shadow rounded overflow-hidden">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Service</th>
            <th className="p-3 text-left">Tenant</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Vendor</th>
          </tr>
        </thead>

        <tbody>

        {services.map((s)=>{

          const assigned = s.assigned_vendor_id;

          return(

            <tr key={s.id} className="border-t">

              <td className="p-3">
                {s.service_type}
              </td>

              <td className="p-3">
                {s.tenant_name || "N/A"}
              </td>

              <td className="p-3">
                ₹{s.amount}
              </td>

              <td className="p-3">

                {assigned ? (

                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                    {s.vendor_name || "Vendor Assigned"}
                  </span>

                ) : (

                  <select
                    onChange={(e)=>assignVendor(s.id,e.target.value)}
                    className="border p-2 rounded"
                    defaultValue=""
                  >

                    <option value="">
                      Select Vendor
                    </option>

                    {vendors.map(v=>(
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}

                  </select>

                )}

              </td>

            </tr>

          );

        })}

        </tbody>

      </table>

    </div>

  );

};

export default AdminServiceBookings;