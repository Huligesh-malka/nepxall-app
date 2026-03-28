import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";

const AdminAgreementDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get(`/agreements/admin/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading details");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>📄 Agreement Details</h2>

      <div style={box}>
        <p><b>Name:</b> {data.full_name}</p>
        <p><b>Mobile:</b> {data.mobile}</p>
        <p><b>Email:</b> {data.email}</p>
        <p><b>Address:</b> {data.address}</p>
        <p><b>City:</b> {data.city}</p>
        <p><b>State:</b> {data.state}</p>
        <p><b>Pincode:</b> {data.pincode}</p>
        <p><b>Aadhaar (Last 4):</b> {data.aadhaar_last4}</p>
        <p><b>PAN:</b> {data.pan_number}</p>
        <p><b>Check-in:</b> {data.checkin_date}</p>
        <p><b>Months:</b> {data.agreement_months}</p>
        <p><b>Rent:</b> ₹{data.rent}</p>
        <p><b>Deposit:</b> ₹{data.deposit}</p>
        <p><b>Maintenance:</b> ₹{data.maintenance}</p>

        {data.signature && (
          <div>
            <p><b>Signature:</b></p>
            <img
              src={`http://localhost:5000/${data.signature}`}
              alt="signature"
              width="200"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const box = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  marginTop: "20px"
};

export default AdminAgreementDetails;