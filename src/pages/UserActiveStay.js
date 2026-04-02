import React, { useEffect, useState, useCallback } from "react";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const UserActiveStay = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      if (showLoader) setError("Failed to load stay details");
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
            <span style={statusBadge}>{stay.status}</span>
          </div>

          {/* ROOM NO AT TOP */}
          <div style={infoGrid}>
            <div style={infoItem}>
              <label style={labelStyle}>🚪 Allotted Room</label>
              <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
            </div>
          </div>

          <hr style={divider} />

          <div style={priceList}>
            <p style={priceRow}>Monthly Rent: <span>₹{stay.rent_amount}</span></p>
            <p style={priceRow}>Maintenance: <span>₹{stay.maintenance_amount || 0}</span></p>
            <p style={priceRow}>Security Deposit (Paid): <span>₹{stay.deposit_amount}</span></p>
            
            {/* ROOM SHARING SHOWN HERE */}
            <p style={priceRow}>
              Room Sharing: <span style={{ fontWeight: "700", color: "#2563eb" }}>{stay.room_type}</span>
            </p>
            
            <div style={totalBox}>
              <span>Total Monthly Payment</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>₹{stay.monthly_total}</span>
            </div>
          </div>

          <div style={btnRow}>
            <button style={btn} onClick={() => navigate("/user/bookings")}>📜 History</button>
            <button style={payBtn} onClick={() => navigate("/payment")}>💳 Pay Rent</button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* Styles */
const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" };
const card = { background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #f0f0f0", marginBottom: "30px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: 20 }; 
const labelStyle = { fontSize: "12px", color: "#6b7280", textTransform: "uppercase" };
const valStyle = { margin: "5px 0 0 0", fontWeight: "700", fontSize: "18px" };
const divider = { border: "none", borderTop: "1px solid #eee", margin: "20px 0" };
const priceList = { marginBottom: 20 };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "10px 0" };
const totalBox = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, padding: "15px", background: "#f0fdf4", borderRadius: "8px", color: "#166534" };
const statusBadge = { padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "#166534" };
const btnRow = { display: "flex", gap: 12 };
const btn = { flex: 1, padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const payBtn = { ...btn, background: "#16a34a" };
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = { textAlign: "center", padding: 50, background: "#fff", borderRadius: 16 };

export default UserActiveStay;