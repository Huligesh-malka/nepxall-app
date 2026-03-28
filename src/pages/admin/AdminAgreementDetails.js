import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const AdminAgreementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <div style={loaderWrap}>Loading Details...</div>;
  if (!data) return <div style={loaderWrap}>Agreement not found.</div>;

  return (
    <div style={container}>
      <div style={topNav}>
        <button onClick={() => navigate(-1)} style={backBtn}>
          ← Back to List
        </button>
      </div>

      <div style={headerSection}>
        <div>
          <h1 style={title}>Agreement #ID-{data.id}</h1>
          <p style={subtitle}>Submitted on {formatDate(data.created_at)}</p>
        </div>
        <span style={statusBadge(data.status)}>{data.status || "Pending"}</span>
      </div>

      <div style={grid}>
        {/* Card 1: Personal */}
        <div style={card}>
          <h3 style={cardTitle}>👤 Personal Information</h3>
          <div style={cardContent}>
            <DataField label="Full Name" value={data.full_name} />
            <DataField label="Father's Name" value={data.father_name} />
            <DataField label="Mobile Number" value={data.mobile} />
            <DataField label="Email Address" value={data.email} />
            <DataField label="Aadhaar (Last 4)" value={data.aadhaar_last4} />
            <DataField label="PAN Number" value={data.pan_number} />
          </div>
        </div>

        {/* Card 2: Property */}
        <div style={card}>
          <h3 style={cardTitle}>🏠 Property & Financials</h3>
          <div style={cardContent}>
            <DataField label="Address" value={data.address} />
            <DataField label="Location" value={`${data.city}, ${data.state} - ${data.pincode}`} />
            <DataField label="Check-in Date" value={formatDate(data.checkin_date)} highlight />
            <DataField label="Stay Duration" value={`${data.agreement_months} Months`} />
            <DataField label="Monthly Rent" value={`₹${data.rent}`} isMoney />
            <DataField label="Security Deposit" value={`₹${data.deposit}`} isMoney />
            <DataField label="Maintenance" value={`₹${data.maintenance}`} isMoney />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div style={{ ...card, marginTop: "24px" }}>
        <h3 style={cardTitle}>✍️ Digital Signature</h3>
        <div style={sigContainer}>
          {data.signature ? (
            <img
              src={`${BACKEND_URL}/${data.signature.replace(/\\/g, '/')}`}
              alt="Signature"
              style={sigImg}
              onError={(e) => { e.target.src = "https://via.placeholder.com/300x150?text=Signature+Image+Missing"; }}
            />
          ) : (
            <div style={noSig}>No signature provided</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- Helper Components --- */
const DataField = ({ label, value, highlight, isMoney }) => (
  <div style={fieldRow}>
    <span style={fieldLabel}>{label}</span>
    <span style={{ 
      ...fieldValue, 
      color: highlight ? "#2563eb" : isMoney ? "#059669" : "#1e293b",
      fontWeight: isMoney || highlight ? "700" : "500"
    }}>
      {value || "Not Provided"}
    </span>
  </div>
);

/* --- Modern Styles --- */
const container = { padding: "40px", maxWidth: "1100px", margin: "0 auto", backgroundColor: "#f8fafc", minHeight: "100vh" };
const topNav = { display: "flex", justifyContent: "flex-start", alignItems: "center", marginBottom: "30px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" };
const title = { fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 };
const subtitle = { color: "#64748b", marginTop: "4px" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" };
const card = { background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", overflow: "hidden" };
const cardTitle = { padding: "16px 24px", borderBottom: "1px solid #f1f5f9", margin: 0, fontSize: "16px", fontWeight: "700", color: "#334155", backgroundColor: "#fcfdfe" };
const cardContent = { padding: "24px" };
const fieldRow = { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f8fafc" };
const fieldLabel = { color: "#94a3b8", fontSize: "14px", fontWeight: "500" };
const fieldValue = { fontSize: "15px" };
const sigContainer = { padding: "40px", textAlign: "center", backgroundColor: "#fdfdfd" };
const sigImg = { maxHeight: "180px", width: "auto", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px", backgroundColor: "#fff" };
const noSig = { color: "#94a3b8", fontStyle: "italic" };

const backBtn = { background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "8px", color: "#64748b", cursor: "pointer", fontWeight: "600" };
const loaderWrap = { display: "grid", placeItems: "center", height: "100vh", fontSize: "18px", color: "#64748b" };

const statusBadge = (status) => {
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  return {
    padding: "6px 16px",
    borderRadius: "99px",
    fontSize: "14px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backgroundColor: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef9c3",
    color: isApproved ? "#15803d" : isRejected ? "#b91c1c" : "#a16207",
    border: `1px solid ${isApproved ? "#86efac" : isRejected ? "#fca5a5" : "#fef08a"}`
  };
};

export default AdminAgreementDetails;