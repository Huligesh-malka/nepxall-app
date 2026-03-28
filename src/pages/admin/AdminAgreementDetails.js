import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const AdminAgreementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // State for the E-Stamp file
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

  const handleApproveAndUpload = async () => {
    if (!estampFile) {
      alert("Please select the E-Stamp Paper PDF or Image first!");
      return;
    }

    const formData = new FormData();
    formData.append("status", "approved");
    formData.append("estamp_paper", estampFile);

    setUpdating(true);
    try {
      const res = await api.put(`/agreements/admin/${id}/status`, formData);
      if (res.data.success) {
        alert("E-Stamp Uploaded & Agreement Approved!");
        fetchData(); 
      }
    } catch (err) {
      alert("Failed to upload E-Stamp");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <div style={loaderWrap}>Loading...</div>;
  if (!data) return <div style={loaderWrap}>Not found.</div>;

  return (
    <div style={container}>
      {/* Top Header / Navigation */}
      <div style={topNav}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back to List</button>
        <span style={statusBadgeStyle(data.status)}>{data.status}</span>
      </div>

      <div style={headerSection}>
        <h1 style={title}>Review Agreement #ID-{data.id}</h1>
        <p style={subtitle}>Submitted by {data.full_name} on {new Date(data.created_at).toLocaleDateString()}</p>
      </div>

      {/* STEP 1: ADMIN ACTION AREA - SHOWS ONLY IF PENDING */}
      {data.status === 'pending' && (
        <div style={uploadCard}>
          <div style={uploadInfo}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>🚀 Action Required: Upload E-Stamp</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              To approve this agreement, please upload the legal E-Stamp paper. 
              Once uploaded, the Owner will be notified to sign.
            </p>
          </div>
          <div style={uploadControls}>
            <input 
              type="file" 
              accept=".pdf, .jpg, .jpeg, .png"
              onChange={(e) => setEstampFile(e.target.files[0])} 
              style={fileInputCustom} 
            />
            <div style={actionGroup}>
              <button onClick={handleApproveAndUpload} disabled={updating || !estampFile} style={approveBtn}>
                {updating ? "Uploading..." : "Approve & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPLAY UPLOADED DOCUMENT IF EXISTS */}
      {data.estamp_paper && (
        <div style={documentCard}>
          <h3 style={cardTitle}>📜 Final E-Stamp Document</h3>
          <div style={documentBody}>
            <p>The e-stamp has been successfully attached to this record.</p>
            <a href={`${BACKEND_URL}/${data.estamp_paper}`} target="_blank" rel="noreferrer" style={viewBtn}>
              View Document ↗
            </a>
          </div>
        </div>
      )}

      {/* TENANT DETAILS SECTION */}
      <div style={grid}>
        <div style={card}>
          <h3 style={cardTitle}>👤 Tenant Information</h3>
          <div style={cardContent}>
            <DetailRow label="Name" value={data.full_name} />
            <DetailRow label="Mobile" value={data.mobile} />
            <DetailRow label="Email" value={data.email} />
            <DetailRow label="Aadhaar" value={`XXXX-XXXX-${data.aadhaar_last4}`} />
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>🏠 Agreement Terms</h3>
          <div style={cardContent}>
            <DetailRow label="Monthly Rent" value={`₹${data.rent}`} highlight />
            <DetailRow label="Security Deposit" value={`₹${data.deposit}`} highlight />
            <DetailRow label="Duration" value={`${data.agreement_months} Months`} />
          </div>
        </div>
      </div>

      {/* SIGNATURE SECTION */}
      <div style={{ ...card, marginTop: "24px" }}>
        <h3 style={cardTitle}>✍️ Tenant Signature</h3>
        <div style={sigContainer}>
          <img src={`${BACKEND_URL}/${data.signature?.replace(/\\/g, '/')}`} alt="Tenant Signature" style={sigImg} />
        </div>
      </div>
    </div>
  );
};

/* --- UI Components --- */
const DetailRow = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
    <span style={{ color: '#94a3b8', fontSize: '14px' }}>{label}</span>
    <span style={{ fontWeight: '600', color: highlight ? '#2563eb' : '#1e293b' }}>{value}</span>
  </div>
);

/* --- Styles --- */
const container = { padding: "40px", maxWidth: "1000px", margin: "0 auto", fontFamily: 'Inter, sans-serif' };
const topNav = { display: "flex", justifyContent: "space-between", marginBottom: "20px" };
const title = { fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 };
const subtitle = { color: "#64748b", fontSize: "16px" };
const headerSection = { marginBottom: "30px" };

const uploadCard = { 
  background: "#ffffff", 
  padding: "25px", 
  borderRadius: "16px", 
  border: "2px dashed #cbd5e1", 
  display: "flex", 
  flexDirection: "column", 
  gap: "20px",
  marginBottom: "30px"
};

const documentCard = { 
  background: "#eff6ff", 
  borderRadius: "12px", 
  border: "1px solid #bfdbfe", 
  marginBottom: "30px",
  overflow: "hidden"
};

const documentBody = { padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" };
const viewBtn = { backgroundColor: "#2563eb", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" };

const card = { background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" };
const cardTitle = { padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "#64748b" };
const cardContent = { padding: "20px" };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };

const approveBtn = { backgroundColor: "#059669", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" };
const fileInputCustom = { padding: "10px", border: "1px solid #e2e8f0", borderRadius: "8px", width: "100%", background: "#f8fafc" };
const sigContainer = { padding: "30px", textAlign: "center", background: "#fcfcfc" };
const sigImg = { maxHeight: "120px", filter: "contrast(1.2)" };
const backBtn = { background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const loaderWrap = { textAlign: "center", marginTop: "100px", fontSize: "18px", color: "#64748b" };

const statusBadgeStyle = (status) => ({
  padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase",
  backgroundColor: status === "approved" ? "#dcfce7" : status === "signed" ? "#e0e7ff" : "#fee2e2",
  color: status === "approved" ? "#166534" : status === "signed" ? "#4338ca" : "#991b1b"
});

export default AdminAgreementDetails;