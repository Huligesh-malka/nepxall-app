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
const BRAND_ORANGE = "#f59e0b"; // For Pending status

const UserActiveStay = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const receiptRef = useRef();
  const [selectedStay, setSelectedStay] = useState(null);

  /* --- STATES FOR REFUND FORM --- */
  const [showRefundFormFor, setShowRefundFormFor] = useState(null); 
  const [refundReason, setRefundReason] = useState("");
  const [refundUpi, setRefundUpi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  /* 🔥 SUBMIT REFUND REQUEST */
  const submitRefundRequest = async (stayId) => {
    if (!refundReason || !refundUpi) {
      alert("Please provide both a reason and a UPI ID.");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await api.post(
        "/bookings/refunds/request",
        {
          bookingId: stayId,
          reason: refundReason,
          upi_id: refundUpi
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        alert("✅ Refund request submitted successfully.");
        setShowRefundFormFor(null);
        setRefundReason("");
        setRefundUpi("");
        // Reload data to reflect the new status immediately
        loadStay(false);
      }
    } catch (err) {
      console.error("Refund Error:", err);
      alert(err.response?.data?.message || "Refund request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Processing...";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /* Helper to style refund status */
  const getRefundStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { background: "#fff7ed", color: BRAND_ORANGE };
      case 'approved': return { background: "#eff6ff", color: BRAND_BLUE };
      case 'paid': return { background: "#f0fdf4", color: BRAND_GREEN };
      case 'rejected': return { background: "#fef2f2", color: BRAND_RED };
      default: return { background: "#f3f4f6", color: "#6b7280" };
    }
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
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

  if (loading)
    return (
      <div style={container}>
        <p style={{ textAlign: "center", padding: 50 }}>⏳ Syncing your stays...</p>
      </div>
    );

  if (stays.length === 0)
    return (
      <div style={container}>
        <div style={emptyBox}>
          <h3 style={{ color: "#4b5563" }}>No Active Stays Found</h3>
          <p style={{ color: "#9ca3af", marginBottom: 20 }}>
            You don't have any confirmed bookings at the moment.
          </p>
          <button style={btn} onClick={() => navigate("/")}>
            Browse PGs
          </button>
        </div>
      </div>
    );

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 25, color: "#111827" }}>🏠 My Current Stays</h2>

      {stays.map((stay) => (
        <div key={stay.id} style={card}>
          
          {showRefundFormFor === stay.id ? (
            <div style={refundFormContainer}>
              <h3 style={{ color: BRAND_RED, marginBottom: "15px" }}>Request Refund</h3>
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>
                Order ID: {stay.order_id}
              </p>

              <div style={inputGroup}>
                <label style={labelStyle}>Refund Reason</label>
                <textarea
                  style={inputField}
                  placeholder="Tell us why you want a refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>UPI ID for Transfer</label>
                <input
                  style={inputField}
                  type="text"
                  placeholder="e.g. name@bank"
                  value={refundUpi}
                  onChange={(e) => setRefundUpi(e.target.value)}
                />
              </div>

              <div style={btnRow}>
                <button 
                  style={{ ...btn, background: "#6b7280" }} 
                  onClick={() => setShowRefundFormFor(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  style={{ ...btn, background: BRAND_RED }} 
                  onClick={() => submitRefundRequest(stay.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Submit Request"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={headerSection}>
                <h3 style={{ margin: 0, color: BRAND_BLUE }}>{stay.pg_name}</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  {/* 🔥 REFUND STATUS BADGE */}
                  {stay.refund_status && (
                    <span style={{ 
                      ...statusBadge, 
                      ...getRefundStatusStyle(stay.refund_status),
                      border: `1px solid ${getRefundStatusStyle(stay.refund_status).color}`
                    }}>
                      REFUND: {stay.refund_status.toUpperCase()}
                    </span>
                  )}
                  <span style={statusBadge}>VERIFIED ✅</span>
                </div>
              </div>

              <div style={infoGrid}>
                <div style={infoItem}>
                  <label style={labelStyle}>🚪 Allotted Room</label>
                  <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
                </div>
                <div style={infoItem}>
                  <label style={labelStyle}>👥 Sharing Type</label>
                  <p style={valStyle}>{stay.room_type || "N/A"}</p>
                </div>
                <div style={{ ...infoItem, gridColumn: "span 2", marginTop: "10px" }}>
                  <label style={labelStyle}>🆔 Order ID</label>
                  <p style={{ ...valStyle, fontSize: "12px", color: BRAND_BLUE, wordBreak: "break-all" }}>
                    {stay.order_id || "N/A"}
                  </p>
                </div>
              </div>

              <div style={priceList}>
                <p style={{ ...priceRow, color: BRAND_GREEN, fontWeight: "700" }}>
                  💰 Paid On: <span>{formatDate(stay.paid_date)}</span>
                </p>
                <div style={totalBox}>
                  <span>Total Monthly Paid</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>₹{stay.monthly_total}</span>
                </div>
              </div>

              <div style={btnRow}>
                <button style={btn} onClick={() => navigate("/user/bookings")}>📜 History</button>
                <button style={payBtn} onClick={() => navigate("/payment")}>💳 Pay Rent</button>
                <button style={receiptBtn} onClick={() => handleDownloadReceipt(stay)}>📥 Receipt</button>
                
                {/* 🔥 HIDE REFUND BUTTON IF ALREADY FILED OR PAID */}
                {stay.order_id && !stay.refund_status && (
                  <button
                    style={{ ...btn, background: BRAND_RED }}
                    onClick={() => setShowRefundFormFor(stay.id)}
                  >
                    🔁 Refund
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* HIDDEN RECEIPT DESIGN FOR PDF */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef} style={modernReceiptContainer}>
            <div style={{ ...receiptHeader, borderBottom: `4px solid ${BRAND_BLUE}` }}>
              <div>
                <h1 style={logoText}>
                  <span style={{ color: BRAND_BLUE }}>NEP</span>
                  <span style={{ color: BRAND_GREEN }}>XALL</span>
                </h1>
                <p style={tagline}>Next Places for Living</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={receiptTitle}>RENT RECEIPT</h2>
                <p style={{ ...orderIdText, color: BRAND_BLUE }}>Order ID: {selectedStay.order_id || "N/A"}</p>
                <p style={dateText}>Date: {formatDate(selectedStay.paid_date || new Date())}</p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>👤 ISSUED TO</label>
                  <p style={receiptValue}>{auth.currentUser?.displayName || "Valued Tenant"}</p>
                </div>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>🏠 PROPERTY DETAILS</label>
                  <p style={receiptValue}>{selectedStay.pg_name}</p>
                </div>
              </div>
              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={{ ...statusText, color: BRAND_GREEN }}>VERIFIED</h3>
                <div style={amountDisplay}>₹{selectedStay.monthly_total}</div>
              </div>
            </div>

            <div style={tableContainer}>
              <div style={{ ...tableHeader, background: BRAND_BLUE }}>
                <span>📊 PAYMENT BREAKDOWN</span>
                <span>Amount</span>
              </div>
              <div style={tableRow}>
                <span>Monthly Total Received</span>
                <span>₹{selectedStay.monthly_total}</span>
              </div>
            </div>

            <div style={footerNote}>
              <p>* System-generated receipt. No signature required.</p>
              <p style={{ fontWeight: "bold", marginTop: 5, color: BRAND_BLUE }}>THANK YOU FOR STAYING WITH US!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- STYLES --- */
const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "Inter, sans-serif" };
const card = { background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: "25px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: 20 };
const labelStyle = { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" };
const valStyle = { margin: "2px 0 0 0", fontWeight: "700", fontSize: "15px", color: "#111827" };
const priceList = { marginBottom: 20, background: "#f9fafb", padding: "15px", borderRadius: "12px" };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "10px 0", fontSize: "14px" };
const totalBox = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, padding: "15px", background: "#f0fdf4", borderRadius: "8px", color: "#166534" };
const statusBadge = { padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "#166534" };
const btnRow = { display: "flex", gap: 8, flexWrap: "wrap" }; 
const btn = { flex: 1, minWidth: "100px", padding: "12px", background: BRAND_BLUE, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px" };
const payBtn = { ...btn, background: BRAND_GREEN };
const receiptBtn = { ...btn, background: "#4b5563" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" };
const refundFormContainer = { animation: "fadeIn 0.3s ease" };
const inputGroup = { marginBottom: "15px" };
const inputField = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "5px", fontSize: "14px", outline: "none" };

/* --- PDF SPECIFIC STYLES --- */
const modernReceiptContainer = { width: "210mm", minHeight: "297mm", padding: "60px", background: "#ffffff", color: "#111827" };
const receiptHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "20px", marginBottom: "30px" };
const logoText = { margin: 0, fontSize: "36px", fontWeight: "900" };
const tagline = { margin: 0, fontSize: "12px", color: "#6b7280" };
const receiptTitle = { margin: 0, fontSize: "22px" };
const orderIdText = { margin: 0, fontSize: "14px", fontWeight: "bold" };
const mainReceiptBody = { display: "flex", gap: "30px", marginBottom: "40px" };
const sectionBlock = { marginBottom: "20px" };
const receiptLabel = { fontSize: "11px", color: "#9ca3af", fontWeight: "bold", display: "block", marginBottom: "5px" };
const receiptValue = { fontSize: "16px", fontWeight: "bold", margin: 0 };
const paymentStatusBox = { width: "200px", background: "#f8fafc", borderRadius: "15px", border: "1px solid #e2e8f0", padding: "20px", textAlign: "center" };
const statusCircle = { fontSize: "30px", marginBottom: "5px" };
const statusText = { margin: 0, fontSize: "18px", fontWeight: "bold" };
const dateText = { fontSize: "12px", color: "#6b7280", margin: "5px 0" };
const amountDisplay = { fontSize: "24px", fontWeight: "900", color: "#111827", marginTop: "10px" };
const tableContainer = { marginTop: "10px" };
const tableHeader = { display: "flex", justifyContent: "space-between", padding: "12px", color: "#fff", borderRadius: "8px 8px 0 0", fontWeight: "bold" };
const tableRow = { display: "flex", justifyContent: "space-between", padding: "15px 12px", borderBottom: "1px solid #e5e7eb" };
const footerNote = { marginTop: "50px", textAlign: "center", color: "#9ca3af", fontSize: "12px" };

export default UserActiveStay;