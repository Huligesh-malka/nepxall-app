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
  
  // Ref for receipt generation
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

      // The backend should now return paid_date and next_due_date
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

  // Helper to format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return "Processing...";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    
    // Timeout ensures the hidden DOM element is rendered before capture
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`NEXPALL_Receipt_${stay.order_id || stay.id}.pdf`);
        setSelectedStay(null); 
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
      }
    }, 200);
  };

  if (loading) return <div style={container}><p style={{textAlign:"center", padding: 50}}>⏳ Syncing payments...</p></div>;

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

          <hr style={divider} />

          <div style={priceList}>
            {/* ✅ PAID DATE SECTION */}
            <p style={{ ...priceRow, color: "#16a34a", fontWeight: "700" }}>
              💰 Paid On: <span>{formatDate(stay.paid_date)}</span>
            </p>

            <p style={priceRow}>Joined On: <span>{formatDate(stay.join_date)}</span></p>
            <p style={priceRow}>Monthly Rent: <span>₹{stay.rent_amount}</span></p>
            <p style={priceRow}>Maintenance: <span>₹{stay.maintenance_amount || 0}</span></p>
            <p style={priceRow}>Security Deposit: <span>₹{stay.deposit_amount}</span></p>
            
            <p style={priceRow}>
              Room Sharing: <span style={{ fontWeight: "700", color: "#2563eb" }}>{stay.room_type}</span>
            </p>

            <hr style={divider} />

            {/* ✅ NEXT DUE DATE SECTION */}
            <p style={{ ...priceRow, color: "#b91c1c", fontWeight: "700" }}>
              📅 Next Rent Due: <span>{formatDate(stay.next_due_date)}</span>
            </p>
            
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

      {/* HIDDEN RECEIPT DESIGN */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px" }}>
          <div ref={receiptRef} style={receiptLayout}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
              <h1 style={{ margin: 0, letterSpacing: "2px" }}>NEXPALL</h1>
              <p style={{ margin: 0 }}>Next Places for Living</p>
            </div>
            
            <h3 style={{ textAlign: "center", textDecoration: "underline", marginTop: "20px" }}>📄 RENT PAYMENT RECEIPT</h3>
            
            <div style={receiptSection}>
              <p><strong>Order ID:</strong> {selectedStay.order_id || "N/A"}</p>
              <p><strong>Receipt Date:</strong> {formatDate(selectedStay.paid_date)}</p>
            </div>

            <h4 style={receiptSubHeader}>👤 TENANT DETAILS</h4>
            <div style={receiptSection}>
              <p><strong>Name:</strong> {auth.currentUser?.displayName || "Valued Tenant"}</p>
              <p><strong>Contact:</strong> {auth.currentUser?.email}</p>
            </div>

            <h4 style={receiptSubHeader}>🏠 PROPERTY DETAILS</h4>
            <div style={receiptSection}>
              <p><strong>PG Name:</strong> {selectedStay.pg_name}</p>
              <p><strong>Room No:</strong> {selectedStay.room_no}</p>
              <p><strong>Sharing:</strong> {selectedStay.room_type}</p>
            </div>

            <h4 style={receiptSubHeader}>💰 PAYMENT SUMMARY</h4>
            <div style={receiptSection}>
              <p><strong>Amount Paid:</strong> ₹{selectedStay.monthly_total}</p>
              <p><strong>Status:</strong> SUCCESSFUL ✅</p>
              <p><strong>Next Due:</strong> {formatDate(selectedStay.next_due_date)}</p>
            </div>

            <div style={{ marginTop: "40px", borderTop: "1px dashed #000", paddingTop: "20px", textAlign: "center" }}>
              <p style={{ fontStyle: "italic" }}>Computer-generated receipt. No signature required.</p>
              <p><strong>THANK YOU FOR STAYING WITH NEXPALL 🙏</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Styles */
const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" };
const card = { background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0", marginBottom: "30px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: 20 }; 
const labelStyle = { fontSize: "12px", color: "#6b7280", textTransform: "uppercase" };
const valStyle = { margin: "5px 0 0 0", fontWeight: "700", fontSize: "18px" };
const divider = { border: "none", borderTop: "1px solid #eee", margin: "15px 0" };
const priceList = { marginBottom: 20 };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "10px 0", fontSize: "14px" };
const totalBox = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, padding: "15px", background: "#f0fdf4", borderRadius: "8px", color: "#166534" };
const statusBadge = { padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "#166534" };
const btnRow = { display: "flex", gap: 8 };
const btn = { flex: 1, padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px" };
const payBtn = { ...btn, background: "#16a34a" };
const receiptBtn = { ...btn, background: "#6b7280" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 50, background: "#fff", borderRadius: 16 };

/* Receipt PDF Specific Styles */
const receiptLayout = { width: "180mm", padding: "50px", background: "#fff", color: "#000", fontFamily: "monospace" };
const receiptSubHeader = { background: "#f0f0f0", padding: "5px 10px", margin: "15px 0 5px 0", borderLeft: "4px solid #000" };
const receiptSection = { paddingLeft: "15px", marginBottom: "10px", lineHeight: "1.4", fontSize: "14px" };

export default UserActiveStay;