import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const UserActiveStay = () => {
  const [stay, setStay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadStay();

    // 🔥 AUTO REFRESH EVERY 10 SEC (important for payment confirmation)
    const interval = setInterval(() => {
      loadStay(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadStay = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");

      const user = auth.currentUser;
      if (!user) return navigate("/login");

      const token = await user.getIdToken();

      const res = await api.get("/bookings/user/active-stay", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStay(res.data || null);

    } catch (err) {
      console.error("STAY LOAD ERROR:", err);
      setError(err.response?.data?.message || "Failed to load stay details");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  /* 🧠 NEXT RENT DUE DATE */
  const getNextDueDate = () => {
    if (!stay?.join_date) return "N/A";
    const date = new Date(stay.join_date);
    date.setMonth(date.getMonth() + 1);
    return date.toDateString();
  };

  /* 🧠 SAFE DATE */
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toDateString();
  };

  /* ================= UI ================= */

  if (loading)
    return <p style={{ padding: 30 }}>⏳ Loading stay...</p>;

  if (error)
    return (
      <div style={emptyBox}>
        ❌ {error}
        <br />
        <button style={btn} onClick={() => loadStay()}>
          Retry
        </button>
      </div>
    );

  if (!stay)
    return (
      <div style={emptyBox}>
        <h3>🏠 No Active Stay</h3>
        <p>You have not completed any booking yet.</p>

        <button
          style={btn}
          onClick={() => navigate("/")}
        >
          🔍 Browse PG
        </button>
      </div>
    );

  return (
    <div style={container}>
      <h2>🏠 My Current Stay</h2>

      <div style={card}>
        <h3>{stay.pg_name || "PG Name"}</h3>

        <p>
          🚪 Room No:{" "}
          <b>{stay.room_no || "Will be assigned soon"}</b>
        </p>

        <p>📅 Join Date: {formatDate(stay.join_date)}</p>

        <hr />

        <p>💰 Rent: ₹{stay.rent_amount || 0}</p>
        <p>🛠 Maintenance: ₹{stay.maintenance_amount || 0}</p>
        <p>📦 Deposit Paid: ₹{stay.deposit_amount || 0}</p>

        <h3 style={{ color: "#16a34a" }}>
          🧾 Monthly Total: ₹{stay.monthly_total || 0}
        </h3>

        <p>📆 Next Rent Due: {getNextDueDate()}</p>

        <p>
          📌 Status:
          <span style={statusBadge(stay.status)}>
            {stay.status || "ACTIVE"}
          </span>
        </p>

        <div style={btnRow}>
          <button
            style={btn}
            onClick={() => navigate("/user/bookings")}
          >
            📜 Booking History
          </button>

          <button
            style={payBtn}
            onClick={() => navigate("/payment")}
          >
            💳 Pay Rent
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserActiveStay;

/* ================= STYLES ================= */

const container = {
  maxWidth: 650,
  margin: "auto",
  padding: 20,
};

const card = {
  background: "#fff",
  padding: 25,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const emptyBox = {
  padding: 30,
  textAlign: "center",
  background: "#f9fafb",
  borderRadius: 10,
};

const statusBadge = (status) => ({
  marginLeft: 10,
  padding: "4px 12px",
  borderRadius: 20,
  color: "#fff",
  background: status === "ACTIVE" ? "#16a34a" : "#dc2626",
});

const btnRow = {
  display: "flex",
  gap: 10,
  marginTop: 15,
  flexWrap: "wrap",
};

const btn = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const payBtn = {
  ...btn,
  background: "#16a34a",
};