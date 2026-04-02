import React, { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    if (!dateString) return "Processing...";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { 
          scale: 3, // Higher scale for crisp PDF text
          useCORS: true,
          backgroundColor: "#ffffff"
        });
        const imgData = canvas.toDataURL("image/png");
        
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`NEXPALL_Receipt_${stay.order_id || stay.id}.pdf`);
        setSelectedStay(null); 
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
      }
    }, 300);
  };

  if (loading) return <div style={container}><p style={{textAlign:"center", padding: 50}}>⏳ Syncing stays...</p></div>;

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
            <h3 style={{ margin: 0, color: "#1e40af" }}>{stay.pg_name}</h3>
            <span style={statusBadge}>VERIFIED ✅</span>
          </div>

          <div style={infoGrid}>
            <div style={infoItem}>
              <label style={labelStyle}>🚪 Allotted Room</label>
              <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
            </div>
          </div>

          <div style={priceList}>
            <p style={{ ...priceRow, color: "#16a34a", fontWeight: "700" }}>
              💰 Paid On: <span>{formatDate(stay.paid_date)}</span>
            </p>
            <p style={priceRow}>Monthly Rent: <span>₹{stay.rent_amount}</span></p>
            <p style={priceRow}>Maintenance: <span>₹{stay.maintenance_amount || 0}</span></p>
            <p style={priceRow}>Security Deposit (Paid): <span>₹{stay.deposit_amount}</span></p>
            <p style={priceRow}>Room Sharing: <span style={{ fontWeight: "700", color: "#2563eb" }}>{stay.room_type}</span></p>
            
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

      {/* MODERN RECEIPT DESIGN (HIDDEN) */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px" }}>
          <div ref={receiptRef} style={modernReceiptContainer}>
            {/* Header */}
            <div style={receiptHeader}>
              <div>
                <h1 style={logoText}>NEXPALL</h1>
                <p style={tagline}>Next Places for Living</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={receiptTitle}>RENT RECEIPT</h2>
                <p style={orderIdText}>#{selectedStay.order_id || "NXP-001"}</p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              {/* Left Column: Tenant & Property */}
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>ISSUED TO</label>
                  <p style={receiptValue}>{auth.currentUser?.displayName || "Valued Tenant"}</p>
                  <p style={receiptSubValue}>{auth.currentUser?.email}</p>
                  <p style={receiptSubValue}>{auth.currentUser?.phoneNumber || "Registered Mobile"}</p>
                </div>

                <div style={sectionBlock}>
                  <label style={receiptLabel}>PROPERTY DETAILS</label>
                  <p style={receiptValue}>{selectedStay.pg_name}</p>
                  <p style={receiptSubValue}>Room: {selectedStay.room_no || "Allotted"}</p>
                  <p style={receiptSubValue}>{selectedStay.room_type} Sharing</p>
                  <p style={receiptSubValue}>Bangalore, India</p>
                </div>
              </div>

              {/* Right Column: Payment Status Box */}
              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={statusText}>PAID</h3>
                <p style={dateText}>{formatDate(selectedStay.paid_date)}</p>
                <div style={amountDisplay}>₹{selectedStay.monthly_total}</div>
              </div>
            </div>

            {/* Price Breakdown Table */}
            <div style={tableContainer}>
              <div style={tableHeader}>
                <span>Description</span>
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
              <div style={{ ...tableRow, borderBottom: "2px solid #1e40af", fontWeight: "bold" }}>
                <span>Total Amount Received</span>
                <span>₹{selectedStay.monthly_total}</span>
              </div>
            </div>

            <div style={footerNote}>
              <p>This is a digitally verified receipt. No physical signature is required.</p>
              <p style={{ fontWeight: "bold", marginTop: 5 }}>Thank you for choosing Nexpall!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Dashboard Styles */
const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "Inter, sans-serif" };
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
const btn = { flex: 1, padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px" };
const payBtn = { ...btn, background: "#16a34a" };
const receiptBtn = { ...btn, background: "#4b5563" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 50, background: "#fff", borderRadius: 16 };

/* MODERN RECEIPT PDF STYLES */
const modernReceiptContainer = { width: "210mm", height: "297mm", padding: "80px", background: "#ffffff", color: "#111827", fontFamily: "Helvetica, Arial, sans-serif" };
const receiptHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "4px solid #1e40af", paddingBottom: "30px", marginBottom: "40px" };
const logoText = { margin: 0, fontSize: "36px", fontWeight: "900", color: "#1e40af", letterSpacing: "-1px" };
const tagline = { margin: 0, fontSize: "14px", color: "#6b7280" };
const receiptTitle = { margin: 0, fontSize: "24px", color: "#111827" };
const orderIdText = { margin: 0, fontSize: "16px", color: "#1e40af", fontWeight: "bold" };
const mainReceiptBody = { display: "flex", gap: "40px", marginBottom: "50px" };
const sectionBlock = { marginBottom: "30px" };
const receiptLabel = { fontSize: "12px", color: "#9ca3af", fontWeight: "bold", letterSpacing: "1px", display: "block", marginBottom: "8px" };
const receiptValue = { fontSize: "18px", fontWeight: "bold", margin: 0, color: "#111827" };
const receiptSubValue = { fontSize: "14px", color: "#4b5563", margin: "2px 0" };
const paymentStatusBox = { width: "220px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "30px", textAlign: "center" };
const statusCircle = { fontSize: "40px", marginBottom: "10px" };
const statusText = { margin: 0, fontSize: "20px", color: "#16a34a", fontWeight: "bold" };
const dateText = { fontSize: "13px", color: "#6b7280", margin: "5px 0" };
const amountDisplay = { fontSize: "28px", fontWeight: "900", color: "#111827", marginTop: "15px" };
const tableContainer = { marginTop: "20px" };
const tableHeader = { display: "flex", justifyContent: "space-between", padding: "15px", background: "#1e40af", color: "#fff", borderRadius: "8px 8px 0 0", fontWeight: "bold" };
const tableRow = { display: "flex", justifyContent: "space-between", padding: "20px 15px", borderBottom: "1px solid #e5e7eb" };
const footerNote = { marginTop: "100px", textAlign: "center", borderTop: "1px solid #e5e7eb", paddingTop: "30px", color: "#9ca3af", fontSize: "12px" };

export default UserActiveStay;