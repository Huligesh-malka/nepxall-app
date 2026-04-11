import React, { useState, useEffect } from "react";
import api from "../api/api";

// Modern color palette
const BRAND_BLUE = "#0B5ED7";
const BRAND_RED = "#ef4444";
const BRAND_GREEN = "#10b981";
const BRAND_ORANGE = "#f59e0b";
const BRAND_PURPLE = "#8b5cf6";
const DARK_BG = "#1f2937";
const LIGHT_BG = "#f9fafb";

const RefundRequestPage = ({ onSuccess, onCancel }) => {
  const [stays, setStays] = useState([]);
  const [selectedStayId, setSelectedStayId] = useState("");
  const [formData, setFormData] = useState({
    reason: "",
    upiId: "",
    confirmUpi: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStays, setLoadingStays] = useState(true);
  const [focusedField, setFocusedField] = useState(null);

  const loadBookings = async () => {
    try {
      setLoadingStays(true);
      const res = await api.get("/bookings/user/active-stay");
      setStays(res.data || []);
    } catch (err) {
      console.error("Error loading bookings:", err);
      alert("Failed to load your bookings");
    } finally {
      setLoadingStays(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const selectedStay = stays.find(s => s.id === parseInt(selectedStayId));
  
  const isJoined = selectedStay?.is_joined > 0;
  
  // ✅ FIXED: Using total_paid instead of full_refund_amount
  const refundStatus = (selectedStay?.full_refund_status || "").toLowerCase();
  const refundAmount = selectedStay?.total_paid || 0;
  const isCompleted = refundStatus === "completed";
  const showRefundAmount = refundAmount > 0 && !isJoined;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return selectedStayId && formData.reason && formData.upiId && formData.upiId === formData.confirmUpi;
  };

  const submitRefundRequest = async () => {
    if (!selectedStayId) {
      alert("Please select a booking");
      return;
    }
    if (!formData.reason || !formData.upiId) {
      alert("Please provide both a reason and a UPI ID.");
      return;
    }
    if (formData.upiId !== formData.confirmUpi) {
      alert("UPI IDs do not match!");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const res = await api.post("/bookings/refunds/request", {
        bookingId: selectedStayId,
        reason: formData.reason,
        upi_id: formData.upiId
      });
      if (res.data.success) {
        alert("✅ Refund request submitted successfully.");
        
        await loadBookings();
        
        setFormData({
          reason: "",
          upiId: "",
          confirmUpi: ""
        });
        
        // 🔥 FIX: Safe check for onSuccess
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Refund Error:", err);
      alert(err.response?.data?.message || "Refund request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div style={styles.container}>
      {/* Modern Header with Gradient */}
      <div style={styles.headerGradient}>
        <div style={styles.header}>
          <div style={styles.headerIcon}>💰</div>
          <div>
            <h2 style={styles.title}>Request Refund</h2>
            <p style={styles.subtitle}>Get your money back for eligible bookings</p>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Modern Card for Booking Selection */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderIcon}>🏠</span>
            <h3 style={styles.cardTitle}>Select Your Booking</h3>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Booking <span style={styles.required}>*</span>
            </label>
            <div style={styles.selectWrapper}>
              <select 
                style={styles.select}
                value={selectedStayId} 
                onChange={(e) => setSelectedStayId(e.target.value)}
                disabled={loadingStays || (isJoined && refundStatus !== "pending")}
              >
                <option value="">{loadingStays ? "Loading bookings..." : "Choose a booking"}</option>
                {stays.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.pg_name} - Room {s.room_no}
                  </option>
                ))}
              </select>
              <span style={styles.selectArrow}>▼</span>
            </div>
          </div>
        </div>

        {/* Booking Details Card */}
        {selectedStay && (
          <div style={styles.detailsCard}>
            <div style={styles.detailsHeader}>
              <span style={styles.detailsIcon}>📋</span>
              <h3 style={styles.cardTitle}>Booking Details</h3>
            </div>
            
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>PG Name</span>
                <span style={styles.detailValue}>{selectedStay.pg_name}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Room Number</span>
                <span style={styles.detailValue}>{selectedStay.room_no}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Room Type</span>
                <span style={styles.detailValue}>{selectedStay.room_type} Sharing</span>
              </div>
            </div>

            <div style={styles.divider} />

            {/* ✅ CORRECTED BREAKDOWN SECTION */}
            <div style={styles.breakdownSection}>
              <div style={styles.breakdownHeader}>
                <span style={styles.breakdownIcon}>📊</span>
                <span style={styles.breakdownTitle}>Payment Breakdown</span>
              </div>
              
              <div style={styles.breakdownRow}>
                <span style={styles.breakdownLabel}>Monthly Rent</span>
                <span style={styles.breakdownValue}>{formatCurrency(selectedStay.rent_amount)}</span>
              </div>
              
              <div style={styles.breakdownRow}>
                <span style={styles.breakdownLabel}>Maintenance</span>
                <span style={styles.breakdownValue}>{formatCurrency(selectedStay.maintenance_amount)}</span>
              </div>
              
              <div style={styles.breakdownRow}>
                <span style={styles.breakdownLabel}>Security Deposit</span>
                <span style={styles.breakdownValue}>{formatCurrency(selectedStay.deposit_amount)}</span>
              </div>
              
              {showRefundAmount && (
                <>
                  <div style={styles.dividerLight} />
                  <div style={styles.totalRefundRow}>
                    <div style={styles.totalRefundLabel}>
                      <span>💵</span>
                      <span style={styles.totalRefundText}>Full Refund Amount</span>
                    </div>
                    <span style={styles.totalRefundValue}>{formatCurrency(refundAmount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Status Cards with Modern Design */}
        {selectedStay && refundStatus === "pending" && (
          <div style={styles.statusCardPending}>
            <div style={styles.statusIcon}>⏳</div>
            <div style={styles.statusContent}>
              <h4 style={styles.statusTitlePending}>Waiting for Admin Approval</h4>
              <p style={styles.statusMessage}>
                Your refund request is being reviewed by the admin. 
                You'll be notified once it's approved.
              </p>
              <div style={styles.statusBadgePending}>Under Review</div>
            </div>
          </div>
        )}

        {selectedStay && refundStatus === "approved" && (
          <div style={styles.statusCardApproved}>
            <div style={styles.statusIcon}>💰</div>
            <div style={styles.statusContent}>
              <h4 style={styles.statusTitleApproved}>Approved - Payment Initiated</h4>
              <p style={styles.statusMessage}>
                Your refund of {formatCurrency(refundAmount)} has been approved. 
                The amount will be credited to your UPI ID shortly.
              </p>
              <div style={styles.statusBadgeApproved}>Payment Processing</div>
            </div>
          </div>
        )}

        {selectedStay && refundStatus === "completed" && (
          <div style={styles.statusCardCompleted}>
            <div style={styles.statusIcon}>✅</div>
            <div style={styles.statusContent}>
              <h4 style={styles.statusTitleCompleted}>Refund Completed</h4>
              <p style={styles.statusMessage}>
                Your refund of {formatCurrency(refundAmount)} has been successfully 
                credited to your UPI ID.
              </p>
              <div style={styles.statusBadgeCompleted}>Completed</div>
            </div>
          </div>
        )}

        {selectedStay && refundStatus === "rejected" && (
          <div style={styles.statusCardRejected}>
            <div style={styles.statusIcon}>❌</div>
            <div style={styles.statusContent}>
              <h4 style={styles.statusTitleRejected}>Refund Rejected</h4>
              <p style={styles.statusMessage}>
                Your refund request has been rejected. You can apply again if eligible.
              </p>
              <div style={styles.statusBadgeRejected}>Rejected</div>
            </div>
          </div>
        )}

        {/* Joined Message Card */}
        {selectedStay && isJoined && !refundStatus && (
          <div style={styles.joinedCard}>
            <div style={styles.joinedIcon}>✅</div>
            <div style={styles.joinedContent}>
              <h4 style={styles.joinedTitle}>You have already joined this PG</h4>
              <p style={styles.joinedMessage}>
                Refunds are not allowed after joining the property.
              </p>
              <p style={styles.joinedContact}>
                📞 If you have any queries, please contact support.
              </p>
            </div>
          </div>
        )}

        {/* Refund Request Form */}
        {selectedStay && !isJoined && (!refundStatus || refundStatus === "rejected") && (
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <span style={styles.formIcon}>📝</span>
              <h3 style={styles.cardTitle}>Refund Request Form</h3>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Reason for Refund <span style={styles.required}>*</span>
              </label>
              <textarea
                name="reason"
                style={{
                  ...styles.textarea,
                  borderColor: focusedField === 'reason' ? BRAND_BLUE : '#e5e7eb',
                  boxShadow: focusedField === 'reason' ? `0 0 0 3px ${BRAND_BLUE}20` : 'none',
                }}
                placeholder="Please explain why you're requesting a refund..."
                rows={4}
                value={formData.reason}
                onChange={handleChange}
                onFocus={() => setFocusedField('reason')}
                onBlur={() => setFocusedField(null)}
                disabled={isCompleted || isSubmitting}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                UPI ID for Transfer <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="upiId"
                style={{
                  ...styles.input,
                  borderColor: focusedField === 'upiId' ? BRAND_BLUE : '#e5e7eb',
                  boxShadow: focusedField === 'upiId' ? `0 0 0 3px ${BRAND_BLUE}20` : 'none',
                }}
                placeholder="e.g. name@bank"
                value={formData.upiId}
                onChange={handleChange}
                onFocus={() => setFocusedField('upiId')}
                onBlur={() => setFocusedField(null)}
                disabled={isCompleted || isSubmitting}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Confirm UPI ID <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="confirmUpi"
                style={{
                  ...styles.input,
                  borderColor: formData.confirmUpi && formData.upiId !== formData.confirmUpi 
                    ? BRAND_RED 
                    : focusedField === 'confirmUpi' 
                      ? BRAND_BLUE 
                      : '#e5e7eb',
                  backgroundColor: formData.confirmUpi && formData.upiId === formData.confirmUpi 
                    ? '#ecfdf5' 
                    : '#fff',
                  boxShadow: focusedField === 'confirmUpi' ? `0 0 0 3px ${BRAND_BLUE}20` : 'none',
                }}
                placeholder="Re-enter UPI ID"
                value={formData.confirmUpi}
                onChange={handleChange}
                onFocus={() => setFocusedField('confirmUpi')}
                onBlur={() => setFocusedField(null)}
                disabled={isCompleted || isSubmitting}
              />
              {formData.confirmUpi && formData.upiId !== formData.confirmUpi && (
                <div style={styles.errorMessage}>
                  <span>⚠️</span> UPI IDs do not match
                </div>
              )}
              {formData.confirmUpi && formData.upiId === formData.confirmUpi && formData.upiId && (
                <div style={styles.successMessage}>
                  <span>✓</span> UPI ID verified
                </div>
              )}
            </div>

            {/* Policy Card */}
            <div style={styles.policyCard}>
              <div style={styles.policyHeader}>
                <span>📋</span>
                <span style={styles.policyTitle}>Refund Policy</span>
              </div>
              <ul style={styles.policyList}>
                <li>Refund requests are reviewed within 3-5 business days</li>
                <li>Refund amount will be credited to your provided UPI ID</li>
                <li>Processing time may vary based on your bank</li>
                <li>Contact support for any refund-related queries</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={styles.buttonGroup}>
              <button 
                style={styles.cancelButton} 
                onClick={() => { 
                  if (onCancel) onCancel(); 
                }}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.submitButton,
                  background: isFormValid() && !isCompleted && !isJoined 
                    ? `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_ORANGE})`
                    : "linear-gradient(135deg, #d1d5db, #9ca3af)",
                  cursor: isFormValid() && !isCompleted && !isJoined ? "pointer" : "not-allowed",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onClick={submitRefundRequest}
                disabled={!isFormValid() || isSubmitting || isJoined || isCompleted}
              >
                {isSubmitting ? (
                  <span style={styles.submitSpinner}>⟳</span>
                ) : (
                  "Submit Refund Request"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 700,
    margin: "0 auto",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  headerGradient: {
    background: `linear-gradient(135deg, ${DARK_BG}, #111827)`,
    padding: "32px 24px",
    marginBottom: 24,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    fontSize: 48,
    background: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    margin: "8px 0 0 0",
  },
  content: {
    padding: "0 24px 48px 24px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  detailsHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  cardHeaderIcon: {
    fontSize: 24,
  },
  detailsIcon: {
    fontSize: 24,
  },
  formIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1f2937",
    margin: 0,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: BRAND_RED,
  },
  selectWrapper: {
    position: "relative",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 14,
    outline: "none",
    backgroundColor: "#fff",
    cursor: "pointer",
    appearance: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  selectArrow: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 12,
    color: "#9ca3af",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
    transition: "all 0.2s",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 500,
  },
  detailValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: 600,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    margin: "20px 0",
  },
  dividerLight: {
    height: 1,
    backgroundColor: "#f3f4f6",
    margin: "12px 0",
  },
  breakdownSection: {
    marginTop: 4,
  },
  breakdownHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  breakdownIcon: {
    fontSize: 18,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#4b5563",
  },
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 500,
    color: "#1f2937",
  },
  totalRefundRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0 4px 0",
  },
  totalRefundLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  totalRefundText: {
    fontSize: 16,
    fontWeight: 700,
    color: BRAND_GREEN,
  },
  totalRefundValue: {
    fontSize: 20,
    fontWeight: 800,
    color: BRAND_GREEN,
  },
  statusCardPending: {
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: "1px solid #fde68a",
    display: "flex",
    gap: 16,
  },
  statusCardApproved: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: "1px solid #bfdbfe",
    display: "flex",
    gap: 16,
  },
  statusCardCompleted: {
    backgroundColor: "#ecfdf5",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: "1px solid #a7f3d0",
    display: "flex",
    gap: 16,
  },
  statusCardRejected: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: "1px solid #fecaca",
    display: "flex",
    gap: 16,
  },
  statusIcon: {
    fontSize: 32,
  },
  statusContent: {
    flex: 1,
  },
  statusTitlePending: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#92400e",
  },
  statusTitleApproved: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#1e40af",
  },
  statusTitleCompleted: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#065f46",
  },
  statusTitleRejected: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#991b1b",
  },
  statusMessage: {
    margin: "8px 0 12px 0",
    fontSize: 13,
    color: "#4b5563",
  },
  statusBadgePending: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  statusBadgeApproved: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  statusBadgeCompleted: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  statusBadgeRejected: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  joinedCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: "1px solid #a7f3d0",
    display: "flex",
    gap: 16,
  },
  joinedIcon: {
    fontSize: 32,
  },
  joinedContent: {
    flex: 1,
  },
  joinedTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#065f46",
  },
  joinedMessage: {
    margin: "8px 0 4px 0",
    fontSize: 14,
    color: "#065f46",
  },
  joinedContact: {
    margin: 0,
    fontSize: 13,
    color: "#047857",
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: BRAND_RED,
    marginTop: 8,
  },
  successMessage: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: BRAND_GREEN,
    marginTop: 8,
  },
  policyCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    border: "1px solid #bbf7d0",
  },
  policyHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#166534",
  },
  policyList: {
    margin: 0,
    paddingLeft: 24,
    color: "#166534",
    fontSize: 13,
    lineHeight: 1.6,
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#fff",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  submitButton: {
    flex: 1,
    padding: "14px",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitSpinner: {
    display: "inline-block",
    animation: "spin 1s linear infinite",
  },
};

// Add keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  * {
    animation: fadeIn 0.3s ease;
  }
`;
document.head.appendChild(styleSheet);

export default RefundRequestPage;