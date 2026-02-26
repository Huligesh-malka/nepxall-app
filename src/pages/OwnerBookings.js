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

  /* ================= LOAD BOOKINGS ================= */
  const loadOwnerBookings = useCallback(async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      console.log("📡 Loading owner bookings...");
      
      // Using pgAPI which already handles token
      const res = await pgAPI.getOwnerBookings();
      
      console.log("✅ Bookings received:", res.data);
      
      // The backend returns array directly
      setBookings(res.data || []);
      setError("");
      
    } catch (err) {
      console.error("❌ Error loading bookings:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      if (err.response?.status === 403) {
        setError("You are not registered as an owner. Please complete your owner profile.");
      } else if (err.response?.status === 500) {
        setError("Server error: Unable to load bookings. Please try again later.");
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
  const updateStatus = async (bookingId, status, roomId = null) => {
    try {
      setActionLoading(bookingId);
      setSuccess("");
      setError("");

      console.log(`📡 Updating booking ${bookingId} to ${status}...`);
      
      // Prepare update data
      const updateData = { status };
      
      // If approving, you might want to add room_id
      if (status === "approved" && roomId) {
        updateData.room_id = roomId;
      }
      
      // Using pgAPI.updateBookingStatus
      await pgAPI.updateBookingStatus(bookingId, updateData);

      setSuccess(`Booking ${status === "approved" ? "approved" : "rejected"} successfully!`);
      
      // Reload bookings to show updated status
      await loadOwnerBookings();

      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error("❌ Error updating booking:", err.response?.data || err.message);

      /* 🔐 OWNER ONBOARDING NOT COMPLETE */
      if (err.response?.data?.code === "ONBOARDING_PENDING") {
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

    const statusColors = {
      'pending': '#f59e0b',
      'approved': '#16a34a',
      'rejected': '#dc2626',
      'agreement_ready': '#8b5cf6',
      'kyc_pending': '#f97316',
      'confirmed': '#2563eb'
    };

    const color = statusColors[status?.toLowerCase()] || '#6b7280';
    return { ...baseStyle, background: color };
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div style={loadingContainer}>
        <div style={spinner}></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={container}>
        <div style={errorBox}>
          ❌ {error}
          <div style={{ marginTop: 15 }}>
            <button style={reloadBtn} onClick={loadOwnerBookings}>
              🔄 Try Again
            </button>
          </div>
        </div>
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
        </div>
      ) : (
        <>
          <p style={summary}>
            Showing {bookings.length} booking{bookings.length > 1 ? 's' : ''}
          </p>
          
          {bookings.map((b) => (
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
                  <span style={detailValue}>{b.tenant_name || 'Unknown'}</span>
                </div>

                <div style={detailItem}>
                  <span style={detailLabel}>📞 Phone:</span>
                  <span style={detailValue}>{b.phone || 'N/A'}</span>
                </div>

                <div style={detailItem}>
                  <span style={detailLabel}>📅 Check-in:</span>
                  <span style={detailValue}>{formatDate(b.check_in_date)}</span>
                </div>

                <div style={detailItem}>
                  <span style={detailLabel}>🛏️ Room Type:</span>
                  <span style={detailValue}>{b.room_type || 'Standard'}</span>
                </div>

                <div style={detailItem}>
                  <span style={detailLabel}>📅 Requested:</span>
                  <span style={detailValue}>{formatDate(b.created_at)}</span>
                </div>
              </div>

              {b.status?.toLowerCase() === "pending" && (
                <div style={actionButtons}>
                  <button
                    style={approveBtn}
                    disabled={actionLoading === b.id}
                    onClick={() => updateStatus(b.id, "approved")}
                  >
                    {actionLoading === b.id ? (
                      <span style={buttonContent}>
                        <span style={smallSpinner}></span>
                        Processing...
                      </span>
                    ) : (
                      "✅ Approve"
                    )}
                  </button>

                  <button
                    style={rejectBtn}
                    disabled={actionLoading === b.id}
                    onClick={() => updateStatus(b.id, "rejected")}
                  >
                    {actionLoading === b.id ? (
                      <span style={buttonContent}>
                        <span style={smallSpinner}></span>
                        Processing...
                      </span>
                    ) : (
                      "❌ Reject"
                    )}
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
                </div>
              )}
            </div>
          ))}
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

const smallSpinner = {
  width: 16,
  height: 16,
  border: "2px solid #f3f3f3",
  borderTop: "2px solid #ffffff",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  display: "inline-block",
  marginRight: 8,
};

const buttonContent = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
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
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
  transition: "background 0.2s",
  flex: 1,
  minWidth: "150px",
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
  transition: "background 0.2s",
  flex: 1,
  minWidth: "150px",
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
  padding: 20,
  margin: "20px 0",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 10,
  fontWeight: 500,
  border: "1px solid #fecaca",
  textAlign: "center",
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

// Add global animation
const style = document.createElement("style");
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);