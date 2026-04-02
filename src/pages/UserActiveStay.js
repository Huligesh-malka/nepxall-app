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
      setError("");

      const user = auth.currentUser;
      if (!user) return; 

      const token = await user.getIdToken();

      const res = await api.get("/bookings/user/active-stay", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Ensure data is handled as an array for multiple stays
      setStays(Array.isArray(res.data) ? res.data : res.data ? [res.data] : []);
    } catch (err) {
      console.error("STAY LOAD ERROR:", err);
      if (showLoader) {
        setError(err.response?.data?.message || "Failed to load stay details");
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadStay(true);
      } else {
        setLoading(false);
        navigate("/login");
      }
    });

    // Auto-refresh every 10 seconds to catch status updates
    const interval = setInterval(() => {
      loadStay(false);
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadStay, navigate]);

  if (loading) {
    return (
      <div style={container}>
        <p style={{ textAlign: "center", padding: 50 }}>⏳ Syncing your stays...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={container}>
        <div style={emptyBox}>
          <p style={{ color: "#dc2626" }}>❌ {error}</p>
          <button style={btn} onClick={() => loadStay(true)}>🔄 Retry Now</button>
        </div>
      </div>
    );
  }

  if (stays.length === 0) {
    return (
      <div style={container}>
        <div style={emptyBox}>
          <div style={{ fontSize: "50px" }}>🏠</div>
          <h3>No Active Stay Found</h3>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Once the Admin verifies your payment, your stay details will appear here.
          </p>
          <div style={btnRow}>
            <button style={btn} onClick={() => navigate("/")}>🔍 Browse PGs</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 20 }}>🏠 My Current Stays</h2>

      {stays.map((stay) => (
        <div key={stay.id} style={card}>
          <div style={headerSection}>
            <h3 style={{ margin: 0, color: "#1e40af" }}>{stay.pg_name}</h3>
            <span style={statusBadge(stay.status)}>{stay.status}</span>
          </div>

          {/* ROOM & SHARING INFO SECTION */}
          <div style={infoGrid}>
            <div style={infoItem}>
              <label style={labelStyle}>🚪 Room & Sharing</label>
              <p style={valStyle}>
                {stay.room_no || "Allocating..."} — <span style={{ color: "#2563eb" }}>{stay.room_type || "N/A"}</span>
              </p>
            </div>
          </div>

          <hr style={divider} />

          {/* PRICE DETAILS SECTION */}
          <div style={priceList}>
            <p style={priceRow}>Monthly Rent: <span>₹{stay.rent_amount}</span></p>
            <p style={priceRow}>Maintenance: <span>₹{stay.maintenance_amount || 0}</span></p>
            <p style={priceRow}>Security Deposit (Paid): <span>₹{stay.deposit_amount}</span></p>
            
            <div style={totalBox}>
              <span>Total Monthly Payment</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>₹{stay.monthly_total}</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={btnRow}>
            <button style={btn} onClick={() => navigate("/user/bookings")}>📜 History</button>
            <button style={payBtn} onClick={() => navigate("/payment")}>💳 Pay Rent</button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ================= STYLES ================= */

const container = { maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" };
const card = { background: "#fff", padding: 30, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #f0f0f0", marginBottom: "30px" };
const headerSection = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: 20 }; 
const labelStyle = { fontSize: "12px", color: "#6b7280", textTransform: "uppercase" };
const valStyle = { margin: "5px 0 0 0", fontWeight: "600", fontSize: "16px" };
const divider = { border: "none", borderTop: "1px solid #eee", margin: "20px 0" };
const priceList = { marginBottom: 20 };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "8px 0" };
const totalBox = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, padding: "15px", background: "#f0fdf4", borderRadius: "8px", color: "#166534" };
const emptyBox = { padding: 50, textAlign: "center", background: "#fff", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
const statusBadge = (status) => ({ padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: status === "ACTIVE" ? "#dcfce7" : "#fee2e2", color: status === "ACTIVE" ? "#166534" : "#991b1b" });
const btnRow = { display: "flex", gap: 12, justifyContent: "center" };
const btn = { flex: 1, padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const payBtn = { ...btn, background: "#16a34a" };
const infoItem = { display: "flex", flexDirection: "column" };

export default UserActiveStay;