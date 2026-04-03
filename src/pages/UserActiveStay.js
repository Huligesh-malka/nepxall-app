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
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Refund Form States
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundData, setRefundData] = useState({ reason: "", upi_id: "" });
  const [refundStatus, setRefundStatus] = useState(null); // 'success' or null

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

  /* --- HANDLERS --- */
  const openRefundForm = (stay) => {
    setSelectedStay(stay);
    setShowRefundForm(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundData.reason || !refundData.upi_id) return alert("Please fill all fields");

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      await api.post(
        "/bookings/refunds/request",
        {
          bookingId: selectedStay.id,
          reason: refundData.reason,
          upi_id: refundData.upi_id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRefundStatus("success");
      setTimeout(() => {
        setShowRefundForm(false);
        setRefundStatus(null);
        setSelectedStay(null);
        setRefundData({ reason: "", upi_id: "" });
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Refund failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${stay.order_id}.pdf`);
        setSelectedStay(null);
      } catch (error) {
        console.error(error);
      }
    }, 500);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Processing...";
    return new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  /* --- VIEW RENDERERS --- */

  if (loading) return <div style={container}><p style={{ textAlign: "center", padding: 50 }}>⏳ Syncing...</p></div>;

  // 1. REFUND FORM VIEW
  if (showRefundForm) {
    return (
      <div style={container}>
        <div style={card}>
          <button onClick={() => setShowRefundForm(false)} style={{ background: "none", border: "none", color: BRAND_BLUE, cursor: "pointer", fontWeight: "bold", marginBottom: 15 }}>
            ← Back to Stays
          </button>
          
          {refundStatus === "success" ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "50px" }}>✅</div>
              <h2 style={{ color: BRAND_GREEN }}>Request Submitted!</h2>
              <p>Your refund request for <b>{selectedStay.pg_name}</b> is being processed.</p>
            </div>
          ) : (
            <>
              <h2 style={{ marginBottom: 10 }}>Apply for Refund</h2>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: 20 }}>
                Requesting refund for Order: <span style={{ color: BRAND_BLUE }}>{selectedStay.order_id}</span>
              </p>

              <form onSubmit={handleRefundSubmit}>
                <div style={inputGroup}>
                  <label style={labelStyle}>Refund Reason</label>
                  <textarea
                    style={textArea}
                    placeholder="e.g. Booking cancellation, Overpayment..."
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                    required
                  />
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>Your UPI ID (For Transfer)</label>
                  <input
                    style={input}
                    type="text"
                    placeholder="username@okaxis"
                    value={refundData.upi_id}
                    onChange={(e) => setRefundData({ ...refundData, upi_id: e.target.value })}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  style={{ ...btn, background: BRAND_RED, width: "100%", marginTop: 10 }}
                >
                  {submitting ? "Submitting..." : "Submit Refund Request"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // 2. MAIN LIST VIEW
  if (stays.length === 0) return <div style={container}><div style={emptyBox}><h3>No Active Stays</h3><button style={btn} onClick={() => navigate("/")}>Browse PGs</button></div></div>;

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 25 }}>🏠 My Current Stays</h2>
      {stays.map((stay) => (
        <div key={stay.id} style={card}>
          <div style={headerSection}>
            <h3 style={{ margin: 0, color: BRAND_BLUE }}>{stay.pg_name}</h3>
            <span style={statusBadge}>VERIFIED ✅</span>
          </div>

          <div style={infoGrid}>
            <div style={infoItem}><label style={labelStyle}>🚪 Room</label><p style={valStyle}>{stay.room_no || "Allocating..."}</p></div>
            <div style={infoItem}><label style={labelStyle}>👥 Sharing</label><p style={valStyle}>{stay.room_type || "N/A"}</p></div>
          </div>

          <div style={priceList}>
            <p style={priceRow}>Total Monthly Paid: <span style={{ fontWeight: "bold" }}>₹{stay.monthly_total}</span></p>
          </div>

          <div style={btnRow}>
            <button style={receiptBtn} onClick={() => handleDownloadReceipt(stay)}>📥 Receipt</button>
            <button style={payBtn} onClick={() => navigate("/payment")}>💳 Pay Rent</button>
            {stay.order_id && (
              <button style={{ ...btn, background: BRAND_RED }} onClick={() => openRefundForm(stay)}>🔁 Refund</button>
            )}
          </div>
        </div>
      ))}

      {/* Hidden Receipt Logic (Remains Same as your code) */}
      {selectedStay && !showRefundForm && (
         <div style={{ position: "absolute", left: "-9999px" }}>
            <div ref={receiptRef} style={modernReceiptContainer}>
                {/* ... (Your receipt design here) */}
                <h1>RECEIPT: {selectedStay.pg_name}</h1>
            </div>
         </div>
      )}
    </div>
  );
};

/* --- ADDED STYLES --- */
const inputGroup = { marginBottom: "15px" };
const input = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "5px", fontSize: "14px", boxSizing: "border-box" };
const textArea = { ...input, minHeight: "100px", fontFamily: "inherit" };

/* --- EXISTING STYLES (Kept for brevity) --- */
const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "Inter, sans-serif" };
const card = { background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: "25px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: 20 };
const labelStyle = { fontSize: "11px", color: "#6b7280", textTransform: "uppercase", fontWeight: "600" };
const valStyle = { margin: "2px 0 0 0", fontWeight: "700", fontSize: "15px" };
const priceList = { marginBottom: 20, background: "#f9fafb", padding: "15px", borderRadius: "12px" };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", fontSize: "14px" };
const btnRow = { display: "flex", gap: 8, flexWrap: "wrap" };
const btn = { flex: 1, padding: "12px", background: BRAND_BLUE, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const payBtn = { ...btn, background: BRAND_GREEN };
const receiptBtn = { ...btn, background: "#4b5563" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" };
const statusBadge = { padding: "6px 12px", borderRadius: "20px", fontSize: "11px", background: "#dcfce7", color: "#166534" };
const modernReceiptContainer = { width: "210mm", padding: "60px", background: "#ffffff" };

export default UserActiveStay;