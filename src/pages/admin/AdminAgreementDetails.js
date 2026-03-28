import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const AdminAgreementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Backend URL for images
  const BACKEND_URL = "https://nepxall-backend.onrender.com";

  const fetchData = async () => {
    try {
      const res = await api.get(`/agreements/admin/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <p style={{ textAlign: "center", padding: "50px" }}>Loading Details...</p>;
  if (!data) return <p style={{ textAlign: "center", padding: "50px" }}>Agreement not found.</p>;

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backBtn}>
        ← Back to List
      </button>

      <div style={header}>
        <h2>📄 Agreement Details</h2>
        <span style={statusLarge(data.status)}>{data.status || "Pending"}</span>
      </div>

      <div style={contentGrid}>
        <section style={box}>
          <h3 style={sectionTitle}>Personal Information</h3>
          <InfoRow label="Full Name" value={data.full_name} />
          <InfoRow label="Father's Name" value={data.father_name} />
          <InfoRow label="Mobile" value={data.mobile} />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Aadhaar (Last 4)" value={data.aadhaar_last4} />
          <InfoRow label="PAN Number" value={data.pan_number} />
        </section>

        <section style={box}>
          <h3 style={sectionTitle}>Property & Financials</h3>
          <InfoRow label="City/State" value={`${data.city}, ${data.state}`} />
          <InfoRow label="Pincode" value={data.pincode} />
          <InfoRow label="Check-in Date" value={data.checkin_date} />
          <InfoRow label="Duration" value={`${data.agreement_months} Months`} />
          <InfoRow label="Monthly Rent" value={`₹${data.rent}`} highlight />
          <InfoRow label="Security Deposit" value={`₹${data.deposit}`} />
        </section>
      </div>

      {data.signature && (
        <div style={{ ...box, marginTop: "20px", textAlign: "center" }}>
          <h3 style={sectionTitle}>Digital Signature</h3>
          <img
            src={`${BACKEND_URL}/${data.signature.replace(/\\/g, '/')}`}
            alt="User Signature"
            style={sigImage}
            onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=Signature+Not+Found"; }}
          />
        </div>
      )}
    </div>
  );
};

/* --- UI Components --- */
const InfoRow = ({ label, value, highlight }) => (
  <div style={infoRowStyle}>
    <span style={{ color: "#64748b", fontSize: "14px" }}>{label}</span>
    <span style={{ fontWeight: "600", color: highlight ? "#2563eb" : "#1e293b" }}>{value || "N/A"}</span>
  </div>
);

/* --- Styles --- */
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const contentGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" };
const box = { background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" };
const sectionTitle = { fontSize: "16px", color: "#0f172a", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" };
const infoRowStyle = { display: "flex", justifyContent: "space-between", marginBottom: "10px" };
const sigImage = { maxWidth: "300px", height: "auto", border: "1px dashed #cbd5e1", borderRadius: "8px", marginTop: "10px", padding: "10px" };
const backBtn = { background: "none", border: "none", color: "#64748b", cursor: "pointer", marginBottom: "15px", fontWeight: "600" };

const statusLarge = (status) => ({
  padding: "6px 16px",
  borderRadius: "8px",
  fontWeight: "bold",
  background: status === "approved" ? "#dcfce7" : "#fef9c3",
  color: status === "approved" ? "#166534" : "#854d0e",
});

export default AdminAgreementDetails;