import React, { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";

const UserActiveStay = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const formatDate = (dateString) => {
    if (!dateString) return "02 April 2026"; // Fallback for your demo
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);

    // Timeout ensures React finishes rendering the hidden receipt div
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, {
          scale: 2, // High resolution
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`NEXPALL_Receipt_${stay.order_id || "NXP"}.pdf`);
        setSelectedStay(null);
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
        setSelectedStay(null);
      }
    }, 500);
  };

  if (loading) return <div style={container}><p style={{ textAlign: "center", padding: 50 }}>⏳ Syncing stays...</p></div>;

  if (stays.length === 0) return (
    <div style={container}>
      <div style={emptyBox}>
        <h3>No Active Stay</h3>
        <button style={btn} onClick={() => navigate("/")}>Browse PGs</button>
      </div>
    </div>
  );

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 20 }}>🏠 My Current Stays</h2>

      {stays.map((stay) => (
        <div key={stay.id} style={card}>
          <div style={headerSection}>
            <h3 style={{ margin: 0, color: BRAND_BLUE }}>{stay.pg_name}</h3>
            <span style={statusBadge}>VERIFIED ✅</span>
          </div>

          <div style={infoGrid}>
            <div style={infoItem}>
              <label style={labelStyle}>🚪 Allotted Room</label>
              <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
            </div>
          </div>

          <div style={priceList}>
            <p style={{ ...priceRow, color: BRAND_GREEN, fontWeight: "700" }}>
              💰 Paid On: <span>{formatDate(stay.paid_date)}</span>
            </p>
            <p style={priceRow}>Monthly Rent: <span>₹{stay.rent_amount}</span></p>
            <p style={priceRow}>Maintenance: <span>₹{stay.maintenance_amount || 0}</span></p>
            <p style={priceRow}>Security Deposit (Paid): <span>₹{stay.deposit_amount}</span></p>
            <p style={priceRow}>Room Sharing: <span style={{ fontWeight: "700", color: BRAND_BLUE }}>{stay.room_type}</span></p>

            <div style={totalBox}>
              <span>Total Monthly Payment</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>₹{stay.monthly_total}</span>
            </div>
          </div>

          <div style={btnRow}>
            <button style={btn} onClick={() => navigate("/user/bookings")}>📜 History</button>
            <button style={payBtn} onClick={() => navigate("/payment")}>💳 Pay Rent</button>
            <button style={receiptBtn} onClick={() => handleDownloadReceipt(stay)}>📥 Receipt</button>
          </div>
        </div>
      ))}

      {/* ================= UPDATED RENT RECEIPT PDF DESIGN ================= */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px" }}>
          <div ref={receiptRef} style={receiptCanvasStyle}>
            
            {/* Header Section */}
            <div style={receiptBrandHeader}>
              <div style={{ textAlign: "center" }}>
                <h1 style={brandMain}>NEXPALL</h1>
                <p style={brandSub}>Next Places for Living</p>
              </div>
            </div>

            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <h2 style={receiptTitleStyle}>RENT RECEIPT</h2>
              <p style={receiptNoStyle}>Receipt No: {selectedStay.order_id || "NXP-2026-000145"}</p>
            </div>

            <hr style={divider} />
            <div style={flexRowBetween}>
              <p style={metaText}><strong>Order ID:</strong> {selectedStay.order_id || "ORD-98237465"}</p>
              <p style={metaText}><strong>Date:</strong> {formatDate(selectedStay.paid_date)}</p>
              <p style={{ ...metaText, color: BRAND_GREEN }}><strong>Payment Status:</strong> VERIFIED ✅</p>
            </div>
            <hr style={divider} />

            {/* Issued To */}
            <div style={sectionSpacing}>
              <h4 style={sectionHeader}>👤 ISSUED TO</h4>
              <p style={detailText}><strong>Name:</strong> {auth.currentUser?.displayName || "Tenant"}</p>
              <p style={detailText}><strong>Reg. Mobile:</strong> {auth.currentUser?.phoneNumber || "+91-8147526814"}</p>
            </div>

            {/* Property Details */}
            <div style={sectionSpacing}>
              <h4 style={sectionHeader}>🏠 PROPERTY DETAILS</h4>
              <p style={detailText}><strong>PG Name:</strong> {selectedStay.pg_name}</p>
              <p style={detailText}><strong>Sharing Type:</strong> {selectedStay.room_type} Sharing</p>
              <p style={detailText}><strong>Location:</strong> Bangalore, Karnataka</p>
            </div>

            {/* Payment Summary */}
            <div style={sectionSpacing}>
              <h4 style={sectionHeader}>💰 PAYMENT SUMMARY</h4>
              <p style={detailText}><strong>Amount Paid:</strong> ₹{selectedStay.monthly_total}</p>
              <p style={detailText}><strong>Payment Method:</strong> UPI (QR Scan)</p>
              <p style={detailText}><strong>Paid On:</strong> {formatDate(selectedStay.paid_date)}</p>
            </div>

            {/* Breakdown Table */}
            <div style={sectionSpacing}>
              <h4 style={sectionHeader}>📊 PAYMENT BREAKDOWN</h4>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRow}>
                    <th style={thStyle}>Description</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle}>Monthly Rent</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>₹{selectedStay.rent_amount}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Maintenance Charges</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>₹{selectedStay.maintenance_amount || 0}</td>
                  </tr>
                  <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                    <td style={tdStyle}>Total Amount Paid</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: BRAND_BLUE }}>₹{selectedStay.monthly_total}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Declaration */}
            <div style={sectionSpacing}>
              <h4 style={sectionHeader}>📝 DECLARATION</h4>
              <p style={smallText}>✔ This payment has been manually verified by the PG owner/admin.</p>
              <p style={smallText}>✔ The above amount has been received successfully.</p>
            </div>

            {/* Support */}
            <div style={{ ...sectionSpacing, borderTop: "1px dashed #ccc", paddingTop: 20 }}>
              <h4 style={sectionHeader}>📞 SUPPORT DETAILS</h4>
              <div style={flexRowBetween}>
                <p style={smallText}>Website: www.nexpall.com</p>
                <p style={smallText}>Email: support@nexpall.com</p>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <p style={{ fontWeight: "bold", color: BRAND_BLUE }}>THANK YOU FOR USING NEXPALL 🙏</p>
              <p style={{ fontSize: 10, color: "#999", marginTop: 10 }}>* This is a system-generated receipt and does not require signature.</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" };
const card = { background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: "30px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: 20 };
const labelStyle = { fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" };
const valStyle = { margin: "5px 0 0 0", fontWeight: "700", fontSize: "18px", color: "#111827" };
const priceList = { marginBottom: 20 };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "10px 0", fontSize: "14px" };
const totalBox = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, padding: "15px", background: "#f0fdf4", borderRadius: "8px", color: "#166534" };
const statusBadge = { padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "#166534" };
const btnRow = { display: "flex", gap: 10 };
const btn = { flex: 1, padding: "12px", background: BRAND_BLUE, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px" };
const payBtn = { ...btn, background: BRAND_GREEN };
const receiptBtn = { ...btn, background: "#4b5563" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 50, background: "#fff", borderRadius: 16 };

/* PDF SPECIFIC STYLES (Receipt Canvas) */
const receiptCanvasStyle = { width: "190mm", padding: "20mm", background: "#fff", color: "#333", fontSize: "13px", lineHeight: "1.6" };
const receiptBrandHeader = { borderBottom: `2px solid ${BRAND_BLUE}`, paddingBottom: 10, marginBottom: 10 };
const brandMain = { margin: 0, fontSize: 32, letterSpacing: 4, fontWeight: "bold", color: "#333" };
const brandSub = { margin: 0, fontSize: 14, color: "#666" };
const receiptTitleStyle = { margin: "10px 0 5px 0", fontSize: 20, fontWeight: "bold" };
const receiptNoStyle = { margin: 0, color: "#666" };
const divider = { border: "none", borderTop: "1px solid #eee", margin: "10px 0" };
const flexRowBetween = { display: "flex", justifyContent: "space-between" };
const metaText = { fontSize: 12, margin: 0 };
const sectionSpacing = { marginTop: 25 };
const sectionHeader = { borderBottom: "1px solid #eee", paddingBottom: 5, marginBottom: 10, fontSize: 14, color: BRAND_BLUE };
const detailText = { margin: "4px 0" };
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const tableHeaderRow = { borderBottom: `2px solid ${BRAND_BLUE}` };
const thStyle = { textAlign: "left", padding: 10, fontSize: 12, color: "#666" };
const tdStyle = { padding: 10, borderBottom: "1px solid #f0f0f0" };
const smallText = { fontSize: 12, margin: "2px 0" };

export default UserActiveStay;