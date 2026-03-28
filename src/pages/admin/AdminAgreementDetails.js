import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const AdminAgreementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // New state for manual E-Stamp upload
  const [estampFile, setEstampFile] = useState(null);

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

  const handleApprove = async () => {
    if (!estampFile) {
      alert("Please select the E-Stamp Paper PDF/Image first!");
      return;
    }

    const formData = new FormData();
    formData.append("status", "approved");
    formData.append("estamp_paper", estampFile);

    setUpdating(true);
    try {
      // Axios handles Content-Type automatically with FormData
      const res = await api.put(`/agreements/admin/${id}/status`, formData);
      if (res.data.success) {
        alert("Agreement Approved & E-Stamp Uploaded!");
        fetchData(); // Refresh page data
      }
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this?")) return;
    setUpdating(true);
    try {
      const res = await api.put(`/agreements/admin/${id}/status`, { status: "rejected" });
      if (res.data.success) {
        alert("Agreement Rejected");
        fetchData();
      }
    } catch (err) {
      alert("Error rejecting");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) return <div style={loaderWrap}>Loading...</div>;
  if (!data) return <div style={loaderWrap}>Not found.</div>;

  return (
    <div style={container}>
      <div style={topNav}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back to List</button>
        
        {data.status === 'pending' && (
          <div style={approvalBox}>
            <div style={{ textAlign: 'right' }}>
              <label style={uploadLabel}>Upload E-Stamp Paper (PDF/JPG)</label>
              <input 
                type="file" 
                onChange={(e) => setEstampFile(e.target.files[0])} 
                style={fileInput} 
              />
            </div>
            <div style={actionGroup}>
              <button onClick={handleReject} disabled={updating} style={rejectBtn}>Reject</button>
              <button onClick={handleApprove} disabled={updating} style={approveBtn}>
                {updating ? "Processing..." : "Approve & Send to Owner"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={headerSection}>
        <div>
          <h1 style={title}>Agreement #ID-{data.id}</h1>
          <p style={subtitle}>Current Status: <strong>{data.status}</strong></p>
        </div>
        <span style={statusBadgeStyle(data.status)}>{data.status}</span>
      </div>

      {data.estamp_paper && (
        <div style={{ ...card, marginBottom: '20px', border: '1px solid #3b82f6', backgroundColor: '#eff6ff' }}>
          <h3 style={cardTitle}>📜 E-Stamp Document</h3>
          <div style={{ padding: '20px' }}>
            <a href={`${BACKEND_URL}/${data.estamp_paper}`} target="_blank" rel="noreferrer" style={viewLink}>
              View Uploaded E-Stamp Paper ↗
            </a>
          </div>
        </div>
      )}

      <div style={grid}>
        <div style={card}>
          <h3 style={cardTitle}>👤 Personal Information</h3>
          <div style={cardContent}>
            <DataField label="Full Name" value={data.full_name} />
            <DataField label="Mobile" value={data.mobile} />
            <DataField label="Email" value={data.email} />
            <DataField label="Aadhaar Last 4" value={data.aadhaar_last4} />
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>🏠 Rent Details</h3>
          <div style={cardContent}>
            <DataField label="Rent" value={`₹${data.rent}`} isMoney />
            <DataField label="Deposit" value={`₹${data.deposit}`} isMoney />
            <DataField label="Check-in" value={formatDate(data.checkin_date)} highlight />
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: "24px" }}>
        <h3 style={cardTitle}>✍️ User Signature</h3>
        <div style={sigContainer}>
          <img src={`${BACKEND_URL}/${data.signature?.replace(/\\/g, '/')}`} alt="Sig" style={sigImg} />
        </div>
      </div>
    </div>
  );
};

/* --- Helper Components & Styles --- */
const DataField = ({ label, value, highlight, isMoney }) => (
  <div style={fieldRow}>
    <span style={fieldLabel}>{label}</span>
    <span style={{ ...fieldValue, color: highlight ? "#2563eb" : isMoney ? "#059669" : "#1e293b", fontWeight: "600" }}>{value}</span>
  </div>
);

const approvalBox = { display: "flex", alignItems: "center", gap: "20px", background: "#fff", padding: "10px 20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const uploadLabel = { display: "block", fontSize: "11px", fontWeight: "800", color: "#64748b", marginBottom: "4px", textTransform: "uppercase" };
const fileInput = { fontSize: "12px" };
const viewLink = { color: "#2563eb", fontWeight: "700", textDecoration: "none" };

const container = { padding: "40px", maxWidth: "1100px", margin: "0 auto", backgroundColor: "#f8fafc", minHeight: "100vh" };
const topNav = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const headerSection = { display: "flex", justifyContent: "space-between", marginBottom: "32px" };
const title = { fontSize: "24px", fontWeight: "800", margin: 0 };
const subtitle = { color: "#64748b" };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };
const card = { background: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" };
const cardTitle = { padding: "12px 20px", background: "#fcfdfe", borderBottom: "1px solid #f1f5f9", fontSize: "14px", fontWeight: "700" };
const cardContent = { padding: "20px" };
const fieldRow = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc" };
const fieldLabel = { color: "#94a3b8", fontSize: "13px" };
const fieldValue = { fontSize: "14px" };
const sigContainer = { padding: "20px", textAlign: "center" };
const sigImg = { maxHeight: "100px", border: "1px solid #eee", padding: "5px" };
const backBtn = { background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" };
const approveBtn = { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const rejectBtn = { backgroundColor: "#fff", color: "#dc2626", border: "1px solid #fecaca", padding: "10px 18px", borderRadius: "8px", cursor: "pointer" };
const actionGroup = { display: "flex", gap: "10px" };
const loaderWrap = { textAlign: "center", marginTop: "100px" };

const statusBadgeStyle = (status) => ({
  padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase",
  backgroundColor: status === "approved" ? "#dcfce7" : status === "signed" ? "#e0e7ff" : status === "rejected" ? "#fee2e2" : "#fef9c3",
  color: status === "approved" ? "#166534" : status === "signed" ? "#4338ca" : status === "rejected" ? "#991b1b" : "#854d0e"
});

export default AdminAgreementDetails;