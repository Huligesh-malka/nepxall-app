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
      if (user) {
        loadStay(true);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [loadStay, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    
    // Small timeout to allow the hidden div to render the specific stay data
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { 
          scale: 3, 
          useCORS: true,
          backgroundColor: "#ffffff"
        });
        const imgData = canvas.toDataURL("image/png");
        
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${stay.order_id || 'NXP'}.pdf`);
        setSelectedStay(null); 
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
        setSelectedStay(null);
      }
    }, 500);
  };

  if (loading) return <div style={container}><p style={{textAlign:"center", padding: 50}}>⏳ Syncing stays...</p></div>;

  if (stays.length === 0) return (
    <div style={container}>
      <div style={emptyBox}>
        <h3>No Active Stay Found</h3>
        <p style={{color: '#666', marginBottom: 20}}>Once your payment is verified, your stay will appear here.</p>
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
            <div style={infoItem}>
              <label style={labelStyle}>👥 Sharing Type</label>
              <p style={valStyle}>{stay.room_type}</p>
            </div>
          </div>

          <div style={priceList}>
            <p style={{ ...priceRow, color: BRAND_GREEN, fontWeight: "700" }}>
              💰 Paid On: <span>{formatDate(stay.paid_date)}</span>
            </p>
            <p style={priceRow}>Monthly Rent: <span>₹{stay.rent_amount}</span></p>
            <p style={priceRow}>Maintenance: <span>₹{stay.maintenance_amount || 0}</span></p>
            <p style={{ ...priceRow, borderTop: "1px dashed #eee", paddingTop: "10px", marginTop: "10px" }}>
              Security Deposit (Paid): <span style={{fontWeight: "bold"}}>₹{stay.deposit_amount || 0}</span>
            </p>
            
            <div style={totalBox}>
              <span>Total Monthly Paid</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>₹{stay.monthly_total}</span>
            </div>
          </div>

          <div style={btnRow}>
            <button style={receiptBtn} onClick={() => handleDownloadReceipt(stay)}>📥 Download Receipt</button>
          </div>
        </div>
      ))}

      {/* HIDDEN RECEIPT DESIGN FOR PDF GENERATION */}
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
                {/* DYNAMIC ORDER ID FROM DB */}
                <p style={{ ...orderIdText, color: BRAND_BLUE }}>
                    Order ID: {selectedStay.order_id || "N/A"}
                </p>
                {/* DYNAMIC PAYMENT DATE FROM DB */}
                <p style={dateText}>Payment Date: {formatDate(selectedStay.paid_date)}</p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>👤 ISSUED TO</label>
                  <p style={receiptValue}>{auth.currentUser?.displayName || "Tenant"}</p>
                  <p style={receiptSubValue}>User ID: {auth.currentUser?.uid?.substring(0,8)}</p>
                </div>

                <div style={sectionBlock}>
                  <label style={receiptLabel}>🏠 PROPERTY DETAILS</label>
                  <p style={receiptValue}>{selectedStay.pg_name}</p>
                  <p style={receiptSubValue}>{selectedStay.room_type} Room</p>
                  <p style={receiptSubValue}>Room No: {selectedStay.room_no || "Allotted"}</p>
                </div>
              </div>

              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={{ ...statusText, color: BRAND_GREEN }}>PAID</h3>
                <p style={dateText}>Status: Verified</p>
                <div style={amountDisplay}>₹{selectedStay.monthly_total}</div>
              </div>
            </div>

            <div style={tableContainer}>
              <div style={{ ...tableHeader, background: BRAND_BLUE }}>
                <span>📊 PAYMENT BREAKDOWN</span>
                <span>Amount</span>
              </div>
              <div style={tableRow}>
                <span>Monthly Room Rent</span>
                <span>₹{selectedStay.rent_amount}</span>
              </div>
              <div style={tableRow}>
                <span>Maintenance Charges</span>
                <span>₹{selectedStay.maintenance_amount || 0}</span>
              </div>
              <div style={{ ...tableRow, borderBottom: `2px solid ${BRAND_BLUE}`, fontWeight: "bold", background: "#f8fafc" }}>
                <span>Total Amount Paid</span>
                <span>₹{selectedStay.monthly_total}</span>
              </div>
            </div>

            <div style={{...sectionBlock, marginTop: '30px', padding: '20px', background: '#f0f4f8', borderRadius: '10px'}}>
                <label style={receiptLabel}>💳 SECURITY DEPOSIT</label>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={receiptValue}>₹{selectedStay.deposit_amount || "0"}</span>
                    <span style={{color: BRAND_GREEN, fontWeight: 'bold'}}>Paid & Refundable</span>
                </div>
            </div>

            <div style={footerNote}>
              <div style={{textAlign: 'left', marginBottom: '20px', color: '#4b5563'}}>
                <p>✔ This is a digital proof of payment for the mentioned period.</p>
                <p>✔ Order verified via system transaction log: {selectedStay.order_id}</p>
              </div>
              <p style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>* This is a system-generated receipt. No physical signature is required.</p>
              <p style={{ fontWeight: "bold", marginTop: 5, color: BRAND_BLUE }}>THANK YOU FOR CHOOSING NEPXALL</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Styles */
const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "'Inter', sans-serif" };
const card = { background: "#fff", padding: 25, borderRadius: 16, boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #eee", marginBottom: "20px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: 20 }; 
const labelStyle = { fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" };
const valStyle = { margin: "2px 0 0 0", fontWeight: "700", fontSize: "15px", color: "#111827" };
const priceList = { marginBottom: 20 };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "8px 0", fontSize: "14px" };
const totalBox = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, padding: "12px", background: "#f0fdf4", borderRadius: "8px", color: "#166534" };
const statusBadge = { padding: "4px 10px", borderRadius: "15px", fontSize: "10px", fontWeight: "bold", background: "#dcfce7", color: "#166534" };
const btnRow = { display: "flex", gap: 10 };
const btn = { flex: 1, padding: "12px", background: BRAND_BLUE, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const receiptBtn = { ...btn, background: "#111827" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 50, background: "#fff", borderRadius: 16, border: '1px solid #eee' };

/* PDF/PRINT STYLES - DO NOT REMOVE */
const modernReceiptContainer = { width: "210mm", minHeight: "280mm", padding: "50px", background: "#ffffff", color: "#111827" };
const receiptHeader = { display: "flex", justifyContent: "space-between", paddingBottom: "20px", marginBottom: "30px" };
const logoText = { margin: 0, fontSize: "32px", fontWeight: "900" };
const tagline = { margin: 0, fontSize: "12px", color: "#6b7280" };
const receiptTitle = { margin: 0, fontSize: "20px" };
const orderIdText = { margin: "5px 0", fontSize: "13px" };
const mainReceiptBody = { display: "flex", gap: "30px", marginBottom: "40px" };
const sectionBlock = { marginBottom: "20px" };
const receiptLabel = { fontSize: "10px", color: "#9ca3af", fontWeight: "bold", display: "block", marginBottom: "5px" };
const receiptValue = { fontSize: "15px", fontWeight: "bold", margin: 0 };
const receiptSubValue = { fontSize: "12px", color: "#4b5563", margin: "2px 0" };
const paymentStatusBox = { width: "180px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "15px", textAlign: "center" };
const statusCircle = { fontSize: "24px" };
const statusText = { margin: "5px 0", fontSize: "16px", fontWeight: "bold" };
const dateText = { fontSize: "11px", color: "#6b7280" };
const amountDisplay = { fontSize: "22px", fontWeight: "900", marginTop: "10px" };
const tableContainer = { marginTop: "10px" };
const tableHeader = { display: "flex", justifyContent: "space-between", padding: "12px", color: "#fff", borderRadius: "5px", fontWeight: "bold" };
const tableRow = { display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #eee" };
const footerNote = { marginTop: "40px", textAlign: "center", color: "#9ca3af", fontSize: "11px" };

export default UserActiveStay;