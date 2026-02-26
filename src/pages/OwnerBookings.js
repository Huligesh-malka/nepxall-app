import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { pgAPI } from "../api/api";

const OwnerBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  /* ================= LOAD BOOKINGS ================= */
  const loadOwnerBookings = useCallback(async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      console.log("📡 Loading owner bookings for owner ID:", user.uid);
      setDebugInfo(`Loading bookings for owner: ${user.uid}`);
      
      // ✅ Using pgAPI.getOwnerBookings()
      const res = await pgAPI.getOwnerBookings();
      
      console.log("✅ Bookings API Response:", res.data);
      setDebugInfo(JSON.stringify(res.data, null, 2));
      
      // Handle different response formats
      let bookingsData = [];
      if (Array.isArray(res.data)) {
        bookingsData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        bookingsData = res.data.data;
      } else if (res.data?.bookings && Array.isArray(res.data.bookings)) {
        bookingsData = res.data.bookings;
      } else if (res.data?.success && res.data?.bookings) {
        bookingsData = res.data.bookings;
      }
      
      console.log("📊 Processed bookings:", bookingsData.length);
      setBookings(bookingsData);
      setError("");
      
    } catch (err) {
      console.error("❌ Error loading bookings:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      setDebugInfo(JSON.stringify({
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      }, null, 2));

      if (err.response?.status === 500) {
        setError("Server error: Unable to load bookings. The backend service is having issues. Please try again later.");
      } else if (err.response?.status === 401) {
        await auth.signOut();
        navigate("/login");
      } else if (err.response?.status === 403) {
        setError("You are not registered as an owner. Please complete your owner profile.");
      } else if (err.response?.status === 404) {
        setError("Bookings endpoint not found. Please check backend configuration.");
      } else {
        setError(err.response?.data?.message || "Failed to load bookings");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadOwnerBookings();
  }, [loadOwnerBookings]);

  /* ================= APPROVE / REJECT ================= */
  const updateStatus = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      setSuccess("");
      setError("");

      console.log(`📡 Updating booking ${bookingId} to ${status}...`);
      
      // Using pgAPI.updateBookingStatus()
      await pgAPI.updateBookingStatus(bookingId, status);

      setSuccess(`Booking ${status} successfully!`);
      
      // Reload bookings to show updated status
      await loadOwnerBookings();

      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error("❌ Error updating booking:", err.response?.data || err.message);

      if (err.response?.data?.code === "OWNER_NOT_VERIFIED") {
        alert("⚠️ Please complete owner verification before approving bookings.");
        setTimeout(() => navigate("/owner/bank"), 800);
        return;
      }

      setError(err.response?.data?.message || "Failed to update booking");
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= FORMAT DATE ================= */
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  /* ================= FORMAT CURRENCY ================= */
  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    const num = Number(amount);
    return isNaN(num) ? "₹0" : `₹${num.toLocaleString('en-IN')}`;
  };

  /* ================= GET STATUS BADGE STYLE ================= */
  const getStatusStyle = (status) => {
    const baseStyle = {
      padding: "4px 12px",
      borderRadius: 20,
      color: "#fff",
      fontSize: 12,
      fontWeight: "bold",
      display: "inline-block",
      textTransform: "uppercase"
    };

    const statusMap = {
      'pending': { bg: "#f59e0b", text: "PENDING" },
      'approved': { bg: "#16a34a", text: "APPROVED" },
      'agreement_ready': { bg: "#8b5cf6", text: "AGREEMENT READY" },
      'kyc_pending': { bg: "#f97316", text: "KYC PENDING" },
      'confirmed': { bg: "#2563eb", text: "CONFIRMED" },
      'rejected': { bg: "#dc2626", text: "REJECTED" }
    };

    const statusKey = status?.toLowerCase() || 'pending';
    const config = statusMap[statusKey] || statusMap.pending;
    
    return { ...baseStyle, background: config.bg };
  };

  /* ================= CALCULATE TOTAL AMOUNT ================= */
  const calculateTotal = (booking) => {
    const rent = Number(booking.rent_amount) || 0;
    const deposit = Number(booking.security_deposit) || 0;
    const maintenance = Number(booking.maintenance_amount) || 0;
    return rent + deposit + maintenance;
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div style={loadingContainer}>
        <div style={spinner}></div>
        <p>Loading your bookings...</p>
        {debugInfo && <pre style={debugStyle}>{debugInfo}</pre>}
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={title}>📋 Owner Booking Requests</h2>
        <button 
          style={reloadBtn} 
          onClick={loadOwnerBookings}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {success && (
        <div style={successBox}>
          ✅ {success}
        </div>
      )}

      {error && (
        <div style={errorBox}>
          ❌ {error}
          {debugInfo && (
            <details style={{ marginTop: 10 }}>
              <summary>Debug Info</summary>
              <pre style={debugStyle}>{debugInfo}</pre>
            </details>
          )}
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={emptyBox}>
          <p style={{ fontSize: 18, marginBottom: 15 }}>
            📭 No booking requests found
          </p>
          <p style={{ color: "#666", marginBottom: 20 }}>
            When tenants request to book your properties, they will appear here.
          </p>
          <button style={reloadBtn} onClick={loadOwnerBookings}>
            🔄 Refresh
          </button>
          {debugInfo && (
            <details style={{ marginTop: 20 }}>
              <summary>Debug Info</summary>
              <pre style={debugStyle}>{debugInfo}</pre>
            </details>
          )}
        </div>
      ) : (
        <>
          <p style={summary}>
            Showing {bookings.length} booking{bookings.length > 1 ? 's' : ''}
          </p>
          
          {bookings.map((b) => {
            const totalAmount = calculateTotal(b);
            
            return (
              <div key={b.id} style={card}>
                <div style={cardHeader}>
                  <h3 style={pgName}>{b.pg_name || `Property #${b.pg_id}`}</h3>
                  <span style={getStatusStyle(b.status)}>
                    {b.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>

                <div style={detailsGrid}>
                  <div style={detailItem}>
                    <span style={detailLabel}>👤 Tenant:</span>
                    <span style={detailValue}>{b.name || 'Unknown'}</span>
                  </div>

                  <div style={detailItem}>
                    <span style={detailLabel}>📞 Phone:</span>
                    <span style={detailValue}>{b.phone || 'N/A'}</span>
                  </div>

                  <div style={detailItem}>
                    <span style={detailLabel}>📧 Email:</span>
                    <span style={detailValue}>{b.email || 'N/A'}</span>
                  </div>

                  <div style={detailItem}>
                    <span style={detailLabel}>📅 Check-in:</span>
                    <span style={detailValue}>{formatDate(b.check_in_date)}</span>
                  </div>

                  <div style={detailItem}>
                    <span style={detailLabel}>⏱️ Duration:</span>
                    <span style={detailValue}>{b.duration || 6} months</span>
                  </div>

                  <div style={detailItem}>
                    <span style={detailLabel}>🛏️ Room Type:</span>
                    <span style={detailValue}>{b.room_type || 'Standard'}</span>
                  </div>

                  {b.rent_amount > 0 && (
                    <div style={detailItem}>
                      <span style={detailLabel}>💰 Rent:</span>
                      <span style={detailValue}>{formatCurrency(b.rent_amount)}</span>
                    </div>
                  )}

                  {b.security_deposit > 0 && (
                    <div style={detailItem}>
                      <span style={detailLabel}>🔒 Deposit:</span>
                      <span style={detailValue}>{formatCurrency(b.security_deposit)}</span>
                    </div>
                  )}

                  {b.maintenance_amount > 0 && (
                    <div style={detailItem}>
                      <span style={detailLabel}>🔧 Maintenance:</span>
                      <span style={detailValue}>{formatCurrency(b.maintenance_amount)}</span>
                    </div>
                  )}

                  <div style={detailItem}>
                    <span style={detailLabel}>💵 Total Amount:</span>
                    <span style={{...detailValue, fontWeight: 700, color: '#2563eb'}}>
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                {b.message && (
                  <div style={specialRequests}>
                    <span style={detailLabel}>📝 Message:</span>
                    <p style={requestsText}>{b.message}</p>
                  </div>
                )}

                {b.status?.toLowerCase() === "pending" && (
                  <div style={actionButtons}>
                    <button
                      style={approveBtn}
                      disabled={actionLoading === b.id}
                      onClick={() => updateStatus(b.id, "approved")}
                    >
                      {actionLoading === b.id ? "⏳ Processing..." : "✅ Approve"}
                    </button>

                    <button
                      style={rejectBtn}
                      disabled={actionLoading === b.id}
                      onClick={() => updateStatus(b.id, "rejected")}
                    >
                      {actionLoading === b.id ? "⏳ Processing..." : "❌ Reject"}
                    </button>
                  </div>
                )}

                {b.status?.toLowerCase() === "approved" && (
                  <div style={infoMessage}>
                    ✅ Booking approved. Next step: Complete agreement.
                  </div>
                )}

                {b.status?.toLowerCase() === "agreement_ready" && (
                  <div style={infoMessage}>
                    📄 Agreement ready. Waiting for tenant to sign.
                  </div>
                )}

                {b.status?.toLowerCase() === "kyc_pending" && (
                  <div style={infoMessage}>
                    🆔 KYC verification pending from tenant.
                  </div>
                )}

                {b.status?.toLowerCase() === "confirmed" && (
                  <div style={infoMessage}>
                    🎉 Booking confirmed! Tenant will check in on {formatDate(b.check_in_date)}.
                  </div>
                )}

                {b.status?.toLowerCase() === "rejected" && (
                  <div style={errorMessage}>
                    ❌ Booking rejected.
                    {b.reject_reason && <p style={{marginTop: 5}}>Reason: {b.reject_reason}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default OwnerBookings;

/* ================= STYLES ================= */

const container = {
  maxWidth: 1000,
  margin: "0 auto",
  padding: "30px 20px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 25,
  flexWrap: "wrap",
  gap: 15,
};

const title = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#1f2937",
  margin: 0,
};

const loadingContainer = {
  minHeight: "60vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 15,
};

const spinner = {
  width: 50,
  height: 50,
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #2563eb",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  padding: 24,
  borderRadius: 16,
  marginBottom: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  transition: "box-shadow 0.3s ease",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  flexWrap: "wrap",
  gap: 10,
};

const pgName = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#2563eb",
  margin: 0,
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "15px 20px",
  marginBottom: 20,
};

const detailItem = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const detailLabel = {
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const detailValue = {
  fontSize: "16px",
  color: "#1f2937",
  fontWeight: 500,
};

const specialRequests = {
  background: "#f9fafb",
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
};

const requestsText = {
  margin: "8px 0 0 0",
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.6,
};

const actionButtons = {
  display: "flex",
  gap: 12,
  marginTop: 10,
  flexWrap: "wrap",
};

const approveBtn = {
  padding: "12px 24px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "background 0.2s",
  flex: 1,
  minWidth: "180px",
  justifyContent: "center",
};

const rejectBtn = {
  padding: "12px 24px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "background 0.2s",
  flex: 1,
  minWidth: "180px",
  justifyContent: "center",
};

const reloadBtn = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "background 0.2s",
};

const emptyBox = {
  padding: "60px 20px",
  textAlign: "center",
  background: "#f9fafb",
  borderRadius: 16,
  border: "2px dashed #e5e7eb",
};

const errorBox = {
  padding: 16,
  marginBottom: 20,
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 10,
  fontWeight: 500,
  border: "1px solid #fecaca",
};

const successBox = {
  background: "#dcfce7",
  color: "#166534",
  padding: 16,
  borderRadius: 10,
  marginBottom: 20,
  fontWeight: 500,
  border: "1px solid #bbf7d0",
};

const infoMessage = {
  background: "#e0f2fe",
  color: "#0369a1",
  padding: 12,
  borderRadius: 8,
  marginTop: 15,
  fontSize: "14px",
  fontWeight: 500,
};

const errorMessage = {
  background: "#fee2e2",
  color: "#b91c1c",
  padding: 12,
  borderRadius: 8,
  marginTop: 15,
  fontSize: "14px",
  fontWeight: 500,
};

const summary = {
  color: "#6b7280",
  marginBottom: 20,
  fontSize: "14px",
};

const debugStyle = {
  background: "#1e293b",
  color: "#e2e8f0",
  padding: 10,
  borderRadius: 6,
  fontSize: "12px",
  overflow: "auto",
  maxHeight: "200px",
  marginTop: 10,
  textAlign: "left",
};

// Add global animation
const style = document.createElement("style");
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);