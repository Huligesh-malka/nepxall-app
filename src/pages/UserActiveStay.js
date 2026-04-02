import React, { useEffect, useState, useCallback } from "react";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const UserActiveStay = () => {
  // 🔥 Initialized as an empty array to handle multiple stays
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

      // 🔥 Set the array of stays
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

    const interval = setInterval(() => {
      loadStay(false);
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadStay, navigate]);

  /* 🧠 DATE HELPERS */
  const getNextDueDate = (joinDate) => {
    if (!joinDate) return "N/A";
    const date = new Date(joinDate);
    date.setMonth(date.getMonth() + 1);
    return date.toDateString();
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* ================= UI RENDERING ================= */

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

  // 🔥 If array is empty, show the "No Stay" UI
  if (stays.length === 0) {
    return (
      <div style={container}>
        <div style={emptyBox}>
          <div style={{ fontSize: "50px" }}>🏠</div>
          <h3>No Active Stay Found</h3>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Once the Admin verifies your payment, your stay details will appear here automatically.
          </p>
          <div style={btnRow}>
            <button style={btn} onClick={() => navigate("/")}>🔍 Browse PGs</button>
            <button style={{ ...btn, background: "#6b7280" }} onClick={() => navigate("/user/bookings")}>📜 My Bookings</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 20 }}>🏠 My Current Stays</h2>
      
      <p style={{ color: "#666", fontSize: "14px", marginBottom: 20 }}>
        Showing {stays.length} active booking(s).
      </p>

      {/* 🔥 Map through all active stays */}
      {stays.map((stay) => (
        <div key={stay.id} style={card}>
          <div style={headerSection}>
            <h3 style={{ margin: 0, color: "#1e40af" }}>{stay.pg_name}</h3>
            <span style={statusBadge(stay.status)}>{stay.status}</span>
          </div>

          <div style={infoGrid}>
            <div style={infoItem}>
              <label style={labelStyle}>🚪 Room No</label>
              <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
            </div>
            <div style={infoItem}>
              <label style={labelStyle}>📅 Join Date</label>
              <p style={valStyle}>{formatDate(stay.join_date)}</p>
            </div>
          </div>

          <hr style={divider} />

          <div style={priceList}>
            <p style={priceRow}>Monthly Rent: <span>₹{stay.rent_amount}</span></p>
            <p style={priceRow}>Maintenance: <span>₹{stay.maintenance_amount || 0}</span></p>
            <p style={priceRow}>Security Deposit (Paid): <span>₹{stay.deposit_amount}</span></p>
            
            <div style={totalBox}>
              <span>Total Monthly Payment</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>₹{stay.monthly_total}</span>
            </div>
          </div>

          <div style={dueAlert}>
            📅 Next Rent Due: <b>{getNextDueDate(stay.join_date)}</b>
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

/* ================= STYLES ================= */

const container = {
  maxWidth: 600,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "sans-serif",
};

const card = {
  background: "#fff",
  padding: 30,
  borderRadius: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  border: "1px solid #f0f0f0",
  marginBottom: "30px", // Added spacing between multiple cards
};

const headerSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: 20,
};

const labelStyle = { fontSize: "12px", color: "#6b7280", textTransform: "uppercase" };
const valStyle = { margin: "5px 0 0 0", fontWeight: "600", fontSize: "16px" };
const divider = { border: "none", borderTop: "1px solid #eee", margin: "20px 0" };
const priceList = { marginBottom: 20 };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#4b5563", margin: "8px 0" };

const totalBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 15,
  padding: "15px",
  background: "#f0fdf4",
  borderRadius: "8px",
  color: "#166534",
};

const dueAlert = {
  background: "#fff7ed",
  color: "#9a3412",
  padding: "12px",
  borderRadius: "8px",
  textAlign: "center",
  fontSize: "14px",
  marginBottom: 20,
  border: "1px solid #ffedd5",
};

const emptyBox = {
  padding: 50,
  textAlign: "center",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const statusBadge = (status) => ({
  padding: "5px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
  background: status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
  color: status === "ACTIVE" ? "#166534" : "#991b1b",
});

const btnRow = { display: "flex", gap: 12, justifyContent: "center" };
const btn = {
  flex: 1,
  padding: "12px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
};
const payBtn = { ...btn, background: "#16a34a" };
const infoItem = { display: "flex", flexDirection: "column" };

export default UserActiveStay;