import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const AdminAgreementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 1. Hook into AuthContext for route protection
  const { user, role, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const BACKEND_URL = "https://nepxall-backend.onrender.com";

  const fetchData = async () => {
    try {
      const res = await api.get(`/agreements-form/admin/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Agreement not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if the user is authorized as an admin
    if (!authLoading && user && role === "admin") {
      fetchData();
    }
  }, [id, authLoading, user, role]);

  // 2. ADD PROTECTION & ROLE VALIDATION (BEFORE RENDER)
  if (authLoading) {
    return <div style={loaderWrap}>Loading auth status...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const formatUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${BACKEND_URL}/${path.replace(/\\/g, "/")}`;
  };

  // Helper function to check if file is PDF based on URL
  const isPDFFile = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes(".PDF");
  };

  // Helper function to get download URL for PDFs
  const getDownloadUrl = (url) => {
    if (!url) return "#";
    // Add fl_attachment flag for Cloudinary to force download
    if (url.includes("cloudinary")) {
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid file (PDF, PNG, or JPG)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return alert("Please select a file first");

    // Re-upload confirmation if signatures already exist
    if (data.signed_pdf) {
      const confirmReset = window.confirm(
        "Warning: A signed version already exists. Uploading a new draft will delete the existing signatures and the Owner/Tenant must sign again. Continue?"
      );
      if (!confirmReset) return;
    }

    const formData = new FormData();
    formData.append("final_image", selectedFile);

    setUploading(true);
    try {
      const res = await api.put(`/agreements-form/admin/${id}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert("Draft Updated! Previous signatures (if any) have been reset.");
        fetchData();
        setSelectedFile(null);
      }
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) return <div style={loaderWrap}>Fetching Agreement Details...</div>;
  if (!data) return <div style={loaderWrap}>Agreement Not Found</div>;

  return (
    <div style={container}>
      <div style={topNav}>
        <button onClick={() => navigate(-1)} style={backBtn}>
          ← Back
        </button>
      </div>

      <div style={headerSection}>
        <div>
          <h1 style={title}>Agreement Application #{data.id}</h1>
          <p style={subtitle}>
            Booking ID: <span style={{ fontWeight: "700", color: "#2563eb" }}>BK-{data.booking_id}</span>
          </p>
        </div>
        <div style={statusBadge(data.agreement_status)}>{data.agreement_status?.toUpperCase() || "PENDING"}</div>
      </div>

      {/* --- ADMIN ACTION SECTION --- */}
      <div style={uploadCard}>
        <div style={cardContent}>
          <h3 style={uploadCardTitle}>🛡️ Admin Approval / Re-upload</h3>
          <p style={uploadSubtitle}>
            {data.final_pdf
              ? "Upload a new file to replace the current draft. Note: This will clear existing signatures."
              : "Upload the initial agreement draft to enable Owner & Tenant signing."}
          </p>

          <div style={actionRow}>
            <input 
              type="file" 
              accept="image/*,application/pdf"  // ✅ FIXED: Allow both images and PDFs
              onChange={handleFileChange} 
              style={fileInput} 
            />
            <button
              onClick={handleUploadImage}
              disabled={uploading || !selectedFile}
              style={{ ...uploadBtn, opacity: uploading || !selectedFile ? 0.6 : 1 }}
            >
              {uploading ? "Uploading..." : data.final_pdf ? "Replace Draft" : "Approve & Upload"}
            </button>
          </div>

          <div style={previewGrid}>
            {data.final_pdf && (
              <div style={previewBox}>
                <p style={previewLabel}>Current Unsigned Draft:</p>
                {(() => {
                  const fileUrl = formatUrl(data.final_pdf);
                  const isPDF = isPDFFile(fileUrl);
                  return isPDF ? (
                    <div style={pdfContainer}>
                      <a
                        href={getDownloadUrl(fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={downloadLink}
                      >
                        📄 Download Agreement PDF
                      </a>
                      <p style={pdfHint}>Click to view or download the PDF document</p>
                    </div>
                  ) : (
                    <img src={fileUrl} alt="Draft" style={previewImg} />
                  );
                })()}
              </div>
            )}
            {data.signed_pdf && (
              <div style={previewBox}>
                <p style={previewLabel}>Latest Signed Version:</p>
                {(() => {
                  const fileUrl = formatUrl(data.signed_pdf);
                  const isPDF = isPDFFile(fileUrl);
                  return isPDF ? (
                    <div style={pdfContainer}>
                      <a
                        href={getDownloadUrl(fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...downloadLink, backgroundColor: "#059669" }}
                      >
                        📄 Download Signed Agreement PDF
                      </a>
                      <p style={pdfHint}>Click to view or download the signed PDF document</p>
                    </div>
                  ) : (
                    <img
                      src={fileUrl}
                      alt="Signed"
                      style={{ ...previewImg, borderColor: "#059669" }}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={grid}>
        <div style={card}>
          <h3 style={cardTitle}>👤 Personal Details</h3>
          <div style={cardContent}>
            <DataField label="Full Name" value={data.full_name} />
            <DataField label="Father's Name" value={data.father_name} />
            <DataField label="Mobile" value={data.mobile} />
            <DataField label="Email" value={data.email} />
            <DataField label="PAN Number" value={data.pan_number} />
            <DataField label="Aadhaar (Last 4)" value={data.aadhaar_last4} />
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>💰 Financials & Stay</h3>
          <div style={cardContent}>
            <DataField label="Monthly Rent" value={`₹${data.rent}`} isMoney />
            <DataField label="Security Deposit" value={`₹${data.deposit}`} isMoney />
            <DataField label="Maintenance" value={`₹${data.maintenance}`} isMoney />
            <DataField label="Check-in Date" value={formatDate(data.checkin_date)} highlight />
            <DataField label="Duration" value={`${data.agreement_months} Months`} />
            <DataField label="Location" value={`${data.city}, ${data.state}`} />
          </div>
        </div>
      </div>

      <h3 style={{ margin: "30px 0 15px", color: "#475569", fontSize: "18px" }}>🗂️ Verification Documents</h3>
      <div style={docGrid}>
        <DocItem title="Aadhaar Front" url={formatUrl(data.aadhaar_front)} />
        <DocItem title="Aadhaar Back" url={formatUrl(data.aadhaar_back)} />
        <DocItem title="PAN Card" url={formatUrl(data.pan_card)} />
        <DocItem title="Tenant Applied Signature" url={formatUrl(data.signature)} isSig />
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */
const DataField = ({ label, value, highlight, isMoney }) => (
  <div style={fieldRow}>
    <span style={fieldLabel}>{label}</span>
    <span
      style={{
        ...fieldValue,
        color: highlight ? "#2563eb" : isMoney ? "#059669" : "#1e293b",
        fontWeight: highlight || isMoney ? "700" : "500",
      }}
    >
      {value || "Not Provided"}
    </span>
  </div>
);

const DocItem = ({ title, url, isSig }) => {
  const isPDF = url?.toLowerCase().includes(".pdf");
  
  return (
    <div style={card}>
      <h3 style={cardTitle}>{title}</h3>
      <div style={{ padding: "15px", textAlign: "center", backgroundColor: isSig ? "#fdfdfd" : "#fff" }}>
        {url ? (
          isPDF ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={smallDownloadLink}
            >
              📄 View PDF Document
            </a>
          ) : (
            <a href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt={title}
                style={{
                  maxWidth: "100%",
                  borderRadius: "8px",
                  maxHeight: isSig ? "100px" : "200px",
                  border: "1px solid #f1f5f9",
                }}
              />
            </a>
          )
        ) : (
          <div style={{ padding: "40px 0", color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>
            Missing Document
          </div>
        )}
      </div>
    </div>
  );
};

/* --- STYLES --- */
const container = { padding: "40px", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const topNav = { marginBottom: "20px", display: "flex", justifyContent: "flex-start" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const title = { fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 };
const subtitle = { color: "#64748b", margin: 0, fontSize: "14px" };

const uploadCard = { background: "#eff6ff", borderRadius: "16px", border: "2px dashed #bfdbfe", marginBottom: "30px" };
const uploadCardTitle = { fontSize: "18px", fontWeight: "700", color: "#1e40af", marginBottom: "8px" };
const uploadSubtitle = { fontSize: "13px", color: "#60a5fa", marginBottom: "20px" };
const cardContent = { padding: "24px" };
const actionRow = { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" };
const fileInput = { background: "#fff", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "8px", flex: 1, fontSize: "13px" };
const uploadBtn = { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" };
const docGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" };
const card = { background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", overflow: "hidden" };
const cardTitle = { padding: "12px 20px", borderBottom: "1px solid #f1f5f9", margin: 0, fontSize: "14px", fontWeight: "700", color: "#64748b", backgroundColor: "#f8fafc" };

const fieldRow = { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" };
const fieldLabel = { color: "#94a3b8", fontSize: "13px" };
const fieldValue = { fontSize: "14px" };
const backBtn = { background: "#fff", border: "1px solid #e2e8f0", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#475569" };
const loaderWrap = { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#64748b" };

const previewGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" };
const previewBox = { display: "flex", flexDirection: "column" };
const previewLabel = { fontWeight: "700", fontSize: "13px", color: "#1e40af", marginBottom: "8px" };
const previewImg = { width: "100%", borderRadius: "12px", border: "2px solid #dbeafe", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" };

const pdfContainer = {
  padding: "40px 20px",
  textAlign: "center",
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  border: "2px solid #dbeafe",
};

const downloadLink = {
  display: "inline-block",
  backgroundColor: "#2563eb",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  marginBottom: "10px",
};

const smallDownloadLink = {
  display: "inline-block",
  backgroundColor: "#3b82f6",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "500",
  fontSize: "12px",
};

const pdfHint = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "8px",
};

const statusBadge = (status) => {
  const s = status?.toLowerCase();
  const colors =
    s === "approved" || s === "completed"
      ? { bg: "#dcfce7", text: "#15803d", border: "#b9f6ca" }
      : { bg: "#fef9c3", text: "#a16207", border: "#fef08a" };
  return {
    padding: "8px 16px",
    borderRadius: "99px",
    fontSize: "12px",
    fontWeight: "700",
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
  };
};

export default AdminAgreementDetails;