import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const AdminAgreementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadPDF = async () => {
    if (!selectedFile) return alert("Please select a PDF file first");
    
    const formData = new FormData();
    formData.append("final_pdf", selectedFile);

    setUploading(true);
    try {
      const res = await api.put(`/agreements/admin/${id}/upload-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert("PDF Uploaded Successfully!");
        fetchData(); // Refresh data to show the PDF link
      }
    } catch (err) {
      alert("Failed to upload PDF");
    } finally {
      setUploading(false);
      setSelectedFile(null);
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

  if (loading) return <div style={loaderWrap}>Loading Details...</div>;
  if (!data) return <div style={loaderWrap}>Agreement not found.</div>;

  return (
    <div style={container}>
      <div style={topNav}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back to List</button>
      </div>

      <div style={headerSection}>
        <div>
          <h1 style={title}>Agreement #ID-{data.id}</h1>
          <p style={subtitle}>Submitted on {formatDate(data.created_at)}</p>
        </div>
        <span style={statusBadge(data.status)}>{data.status || "Pending"}</span>
      </div>

      {/* PDF UPLOAD SECTION */}
      <div style={{ ...card, marginBottom: "24px", border: "2px dashed #2563eb", backgroundColor: "#eff6ff" }}>
        <div style={cardContent}>
          <h3 style={{ ...cardTitle, backgroundColor: "transparent", border: "none", padding: 0 }}>📄 Upload Final Signed PDF</h3>
          <p style={{ fontSize: "14px", color: "#1e40af", marginBottom: "15px" }}>Upload the final agreement PDF here to share it with the user.</p>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="file" accept="application/pdf" onChange={handleFileChange} style={fileInput} />
            <button 
              onClick={handleUploadPDF} 
              disabled={uploading || !selectedFile} 
              style={uploadBtn}
            >
              {uploading ? "Uploading..." : "Upload & Approve"}
            </button>
          </div>

          {data.final_pdf && (
            <div style={{ marginTop: "15px" }}>
              <a 
                href={`${BACKEND_URL}/${data.final_pdf.replace(/\\/g, '/')}`} 
                target="_blank" 
                rel="noreferrer"
                style={viewPdfLink}
              >
                👁️ View Existing PDF
              </a>
            </div>
          )}
        </div>
      </div>

      <div style={grid}>
        <div style={card}>
          <h3 style={cardTitle}>👤 Personal Information</h3>
          <div style={cardContent}>
            <DataField label="Full Name" value={data.full_name} />
            <DataField label="Mobile" value={data.mobile} />
            <DataField label="Email" value={data.email} />
            <DataField label="PAN" value={data.pan_number} />
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>🏠 Property Details</h3>
          <div style={cardContent}>
            <DataField label="Rent" value={`₹${data.rent}`} isMoney />
            <DataField label="Deposit" value={`₹${data.deposit}`} isMoney />
            <DataField label="Check-in" value={formatDate(data.checkin_date)} highlight />
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: "24px" }}>
        <h3 style={cardTitle}>✍️ Digital Signature</h3>
        <div style={sigContainer}>
          {data.signature ? (
            <img src={`${BACKEND_URL}/${data.signature.replace(/\\/g, '/')}`} alt="Signature" style={sigImg} />
          ) : (
            <div style={noSig}>No signature provided</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- Updated Styles --- */
const fileInput = { padding: "8px", border: "1px solid #bfdbfe", borderRadius: "6px", backgroundColor: "#fff" };
const uploadBtn = { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", opacity: "1" };
const viewPdfLink = { display: "inline-block", color: "#2563eb", fontWeight: "600", textDecoration: "none", marginTop: "10px" };

/* ... Existing Styles From Previous Response ... */
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

const statusBadge = (status) => {
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  return {
    padding: "6px 16px", borderRadius: "99px", fontSize: "14px", fontWeight: "700", textTransform: "uppercase",
    backgroundColor: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef9c3",
    color: isApproved ? "#15803d" : isRejected ? "#b91c1c" : "#a16207",
    border: `1px solid ${isApproved ? "#86efac" : isRejected ? "#fca5a5" : "#fef08a"}`
  };
};

export default AdminAgreementDetails;