import React, { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";
const BRAND_RED = "#ef4444"; 

const UserActiveStay = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState(null); // Track which booking is being refunded
  const [refundData, setRefundData] = useState({ reason: "", upi_id: "" });
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const receiptRef = useRef();
  const [selectedStay, setSelectedStay] = useState(null);

  const loadStay = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await api.get("/bookings/user/active-stay", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStays(Array.isArray(res.data) ? res.data : res.data ? [res.data] : []);
    } catch (err) {
      console.error("Error loading stays:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      user ? loadStay(true) : navigate("/login");
    });
    return () => unsubscribe();
  }, [loadStay, navigate]);

  /* --- REFUND LOGIC --- */
  const handleRefundSubmit = async (e, stayId) => {
    e.preventDefault();
    if (!refundData.reason || !refundData.upi_id) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setSubmitting(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await api.post(
        "/bookings/refunds/request",
        {
          bookingId: stayId,
          reason: refundData.reason,
          upi_id: refundData.upi_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("✅ Refund request submitted successfully.");
        setRefundingId(null);
        setRefundData({ reason: "", upi_id: "" });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Refund request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Processing...";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${stay.order_id || "Booking"}.pdf`);
        setSelectedStay(null);
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
      }
    }, 500);
  };

  if (loading) return <div style={container}><p style={{ textAlign: "center", padding: 50 }}>⏳ Syncing stays...</p></div>;

  if (stays.length === 0) return (
    <div style={container}>
      <div style={emptyBox}>
        <h3>No Active Stays</h3>
        <button style={btn} onClick={() => navigate("/")}>Browse PGs</button>
      </div>
    </div>
  );

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 25, color: "#111827" }}>🏠 My Current Stays</h2>

      {stays.map((stay) => (
        <div key={stay.id} style={card}>
          {/* --- IF REFUNDING: SHOW FORM --- */}
          {refundingId === stay.id ? (
            <form onSubmit={(e) => handleRefundSubmit(e, stay.id)} style={formFadeIn}>
              <h3 style={{ color: BRAND_RED, marginBottom: 15 }}>Request Refund</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: 20 }}>
                For Order: <strong>{stay.order_id}</strong>
              </p>
              
              <label style={labelStyle}>Reason for Refund</label>
              <textarea 
                required
                style={inputStyle} 
                placeholder="Why are you requesting a refund?"
                value={refundData.reason}
                onChange={(e) => setRefundData({...refundData, reason: e.target.value})}
              />

              <label style={labelStyle}>Your UPI ID (For Transfer)</label>
              <input 
                required
                type="text" 
                style={inputStyle} 
                placeholder="username@bank"
                value={refundData.upi_id}
                onChange={(e) => setRefundData({...refundData, upi_id: e.target.value})}
              />

              <div style={btnRow}>
                <button type="button" style={{...btn, background: '#9ca3af'}} onClick={() => setRefundingId(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{...btn, background: BRAND_RED}}>
                  {submitting ? "Submitting..." : "Confirm Request"}
                </button>
              </div>
            </form>
          ) : (
            /* --- ELSE: SHOW STAY DETAILS --- */
            <>
              <div style={headerSection}>
                <h3 style={{ margin: 0, color: BRAND_BLUE }}>{stay.pg_name}</h3>
                <span style={statusBadge}>VERIFIED ✅</span>
              </div>

              <div style={infoGrid}>
                <div style={infoItem}><label style={labelStyle}>🚪 Room</label><p style={valStyle}>{stay.room_no || "Allocating..."}</p></div>
                <div style={infoItem}><label style={labelStyle}>👥 Sharing</label><p style={valStyle}>{stay.room_type || "N/A"}</p></div>
              </div>

              <div style={priceList}>
                <p style={priceRow}>Total Monthly: <strong>₹{stay.monthly_total}</strong></p>
                <p style={{...priceRow, fontSize: '12px', color: '#888'}}>Paid Date: {formatDate(stay.paid_date)}</p>
              </div>

              <div style={btnRow}>
                <button style={btn} onClick={() => navigate("/user/bookings")}>📜 History</button>
                <button style={payBtn} onClick={() => navigate("/payment")}>💳 Pay</button>
                <button style={receiptBtn} onClick={() => handleDownloadReceipt(stay)}>📥 Receipt</button>
                {stay.order_id && (
                  <button style={{ ...btn, background: BRAND_RED }} onClick={() => setRefundingId(stay.id)}>
                    🔁 Refund
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* HIDDEN RECEIPT DESIGN (Remains Same) */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef} style={modernReceiptContainer}>
            {/* ... Your existing receipt design ... */}
          </div>
        </div>
      )}
    </div>
  );
};

/* --- UPDATED STYLES --- */
const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "Inter, sans-serif" };
const card = { background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: "25px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: 20 };
const labelStyle = { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", fontWeight: "600", display: 'block', marginBottom: '5px' };
const valStyle = { margin: "2px 0 0 0", fontWeight: "700", fontSize: "15px", color: "#111827" };
const priceList = { marginBottom: 20, background: "#f9fafb", padding: "15px", borderRadius: "12px" };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "5px 0" };
const statusBadge = { padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "#166534" };
const btnRow = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: '15px' };
const btn = { flex: 1, minWidth: "100px", padding: "12px", background: BRAND_BLUE, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px" };
const payBtn = { ...btn, background: BRAND_GREEN };
const receiptBtn = { ...btn, background: "#4b5563" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" };

/* FORM STYLES */
const formFadeIn = { animation: "fadeIn 0.3s ease-in" };
const inputStyle = { 
  width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", 
  border: "1px solid #ddd", fontSize: "14px", fontFamily: "inherit", boxSizing: 'border-box' 
};

/* PDF STYLES (Kept from original) */
const modernReceiptContainer = { width: "210mm", minHeight: "297mm", padding: "60px", background: "#ffffff" };

export default UserActiveStay;