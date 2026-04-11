import React, { useState, useEffect } from "react";
import api from "../api/api";

const BRAND_BLUE = "#0B5ED7";
const BRAND_RED = "#ef4444";
const BRAND_GREEN = "#4CAF50";

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
        
        // 🔥 IMPORTANT FIX - refresh data
        await loadBookings();
        
        // optional reset form
        setFormData({
          reason: "",
          upiId: "",
          confirmUpi: ""
        });
        
        onSuccess();
      }
    } catch (err) {
      console.error("Refund Error:", err);
      alert(err.response?.data?.message || "Refund request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStay = stays.find(s => s.id === parseInt(selectedStayId));
  
  // Check if user has already joined
  const isJoined = selectedStay?.is_joined > 0;
  
  // Check refund status - with safe lowercase fallback
  const refundStatus = selectedStay?.refund_status?.toLowerCase();

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={title}>💰 Request Refund</h2>
        <p style={subtitle}>Request a refund for your stay</p>
      </div>

      <div style={content}>
        {/* Booking Selection Dropdown */}
        <div style={formGroup}>
          <label style={label}>
            Select Booking <span style={required}>*</span>
          </label>
          <select 
            style={selector}
            value={selectedStayId} 
            onChange={(e) => setSelectedStayId(e.target.value)}
            disabled={loadingStays || (isJoined && refundStatus !== "pending")}
          >
            <option value="">{loadingStays ? "Loading bookings..." : "Select Booking"}</option>
            {stays.map(s => (
              <option key={s.id} value={s.id}>
                {s.pg_name} - Room {s.room_no}
              </option>
            ))}
          </select>
        </div>

        {/* Stay Info Card - Only show if booking selected */}
        {selectedStay && (
          <div style={infoCard}>
            <div style={infoRow}>
              <span style={infoLabel}>PG Name:</span>
              <span style={infoValue}>{selectedStay.pg_name}</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>Room Number:</span>
              <span style={infoValue}>{selectedStay.room_no}</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>Room Type:</span>
              <span style={infoValue}>{selectedStay.room_type} Sharing</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>Monthly Rent:</span>
              <span style={infoValue}>₹{selectedStay.monthly_total}</span>
            </div>
            
            {/* 🔥 Show Refund Amount if approved or paid */}
            {selectedStay?.refund_amount > 0 && (
              <div style={{
                ...infoRow,
                borderBottom: "none",
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid #e5e7eb"
              }}>
                <span style={infoLabel}>💵 Refund Amount:</span>
                <span style={{
                  ...infoValue,
                  color: BRAND_GREEN,
                  fontSize: 16,
                  fontWeight: 700
                }}>₹{selectedStay.refund_amount}</span>
              </div>
            )}
          </div>
        )}

        {/* 🔥 FIXED: Status Messages - Using correct DB status values */}
        {selectedStay && refundStatus === "pending" && (
          <div style={{
            background: "#fef3c7",
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            border: "1px solid #f59e0b"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>⏳</span>
              <div>
                <h4 style={{ margin: 0, color: "#92400e" }}>Waiting for Admin Approval</h4>
                <p style={{ margin: "5px 0 0", color: "#92400e", fontSize: 13 }}>
                  Your refund request is being reviewed by the admin. You'll be notified once it's approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedStay && refundStatus === "approved" && (
          <div style={{
            background: "#dcfce7",
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            border: "1px solid #22c55e"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>✅</span>
              <div>
                <h4 style={{ margin: 0, color: "#166534" }}>Refund Approved - Waiting for Payment</h4>
                <p style={{ margin: "5px 0 0", color: "#166534", fontSize: 13 }}>
                  Your refund of ₹{selectedStay.refund_amount} has been approved. The amount will be credited to your UPI ID shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedStay && refundStatus === "paid" && (
          <div style={{
            background: "#dbeafe",
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            border: "1px solid #3b82f6"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>💰</span>
              <div>
                <h4 style={{ margin: 0, color: "#1e3a8a" }}>Refund Completed Successfully</h4>
                <p style={{ margin: "5px 0 0", color: "#1e3a8a", fontSize: 13 }}>
                  Your refund of ₹{selectedStay.refund_amount} has been successfully credited to your UPI ID.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedStay && refundStatus === "rejected" && (
          <div style={{
            background: "#fee2e2",
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            border: "1px solid #ef4444"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>❌</span>
              <div>
                <h4 style={{ margin: 0, color: "#991b1b" }}>Refund Rejected</h4>
                <p style={{ margin: "5px 0 0", color: "#991b1b", fontSize: 13 }}>
                  Your refund request has been rejected. You can apply again if eligible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show message when already joined and no refund request */}
        {selectedStay && isJoined && !refundStatus && (
          <div style={{
            background: "#dcfce7",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #22c55e",
            marginBottom: 20
          }}>
            <h4 style={{ color: "#166534", margin: 0 }}>
              ✅ You have already joined this PG
            </h4>
            <p style={{ color: "#166534", marginTop: 8 }}>
              ❌ Refund is not allowed after joining.
            </p>
            <p style={{ color: "#166534", marginTop: 8 }}>
              📞 If you have any queries, please contact support.
            </p>
          </div>
        )}

        {/* 🔥 FIXED: Form Fields - Show when NOT joined AND (no refund OR refund is rejected) */}
        {selectedStay && !isJoined && (!refundStatus || refundStatus === "rejected") && (
          <>
            <div style={formGroup}>
              <label style={label}>
                Refund Reason <span style={required}>*</span>
              </label>
              <textarea
                name="reason"
                style={textarea}
                placeholder="Please explain why you're requesting a refund..."
                rows={4}
                value={formData.reason}
                onChange={handleChange}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>
                UPI ID for Transfer <span style={required}>*</span>
              </label>
              <input
                type="text"
                name="upiId"
                style={input}
                placeholder="e.g. name@bank"
                value={formData.upiId}
                onChange={handleChange}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>
                Confirm UPI ID <span style={required}>*</span>
              </label>
              <input
                type="text"
                name="confirmUpi"
                style={{
                  ...input,
                  borderColor: formData.confirmUpi && formData.upiId !== formData.confirmUpi ? BRAND_RED : "#d1d5db",
                  backgroundColor: formData.confirmUpi && formData.upiId === formData.confirmUpi ? "#f0fdf4" : "#fff",
                }}
                placeholder="Re-enter UPI ID"
                value={formData.confirmUpi}
                onChange={handleChange}
              />
              {formData.confirmUpi && formData.upiId !== formData.confirmUpi && (
                <span style={errorText}>UPI IDs do not match</span>
              )}
            </div>

            {/* Important Notes */}
            <div style={notesCard}>
              <h4 style={notesTitle}>📋 Refund Policy:</h4>
              <ul style={notesList}>
                <li>Refund requests are reviewed within 3-5 business days</li>
                <li>Refund amount will be credited to your provided UPI ID</li>
                <li>Processing time may vary based on your bank</li>
                <li>Contact support for any refund-related queries</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={buttonGroup}>
              <button style={cancelButton} onClick={onCancel}>
                Cancel
              </button>
              <button 
                style={{
                  ...submitButton,
                  background: isFormValid() ? BRAND_RED : "#cca7a7",
                  cursor: isFormValid() ? "pointer" : "not-allowed",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onClick={submitRefundRequest}
                disabled={!isFormValid() || isSubmitting || isJoined}
              >
                {isSubmitting ? "Submitting..." : "Submit Refund Request"}
              </button>
            </div>
          </>
        )}

        {/* 
          🔥 REMOVED: The duplicate "Already Submitted" block that caused confusion.
          The status is now clearly shown only through the dedicated status cards above.
          No duplicate messages for pending, approved, or paid statuses.
        */}
      </div>
    </div>
  );
};

const container = {
  animation: "fadeIn 0.3s ease",
};

const header = {
  marginBottom: 30,
};

const title = {
  fontSize: 24,
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const subtitle = {
  fontSize: 14,
  color: "#6b7280",
  margin: "8px 0 0 0",
};

const content = {
  maxWidth: 600,
};

const infoCard = {
  background: "#f8fafc",
  padding: 20,
  borderRadius: 12,
  marginBottom: 25,
  border: "1px solid #e2e8f0",
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #e5e7eb",
};

const infoLabel = {
  fontSize: 14,
  color: "#6b7280",
  fontWeight: 500,
};

const infoValue = {
  fontSize: 14,
  color: "#111827",
  fontWeight: 600,
};

const formGroup = {
  marginBottom: 20,
};

const label = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  color: "#374151",
  marginBottom: 8,
};

const required = {
  color: BRAND_RED,
};

const selector = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  backgroundColor: "#fff",
  cursor: "pointer",
  boxSizing: "border-box",
};

const input = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const textarea = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};

const errorText = {
  display: "block",
  fontSize: 12,
  color: BRAND_RED,
  marginTop: 5,
};

const notesCard = {
  background: "#e0f2fe",
  padding: 20,
  borderRadius: 12,
  marginTop: 25,
  marginBottom: 25,
};

const notesTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0369a1",
  margin: "0 0 10px 0",
};

const notesList = {
  margin: 0,
  paddingLeft: 20,
  color: "#0369a1",
  fontSize: 13,
};

const buttonGroup = {
  display: "flex",
  gap: 12,
  marginTop: 30,
};

const cancelButton = {
  flex: 1,
  padding: "12px",
  background: "#fff",
  color: "#6b7280",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  transition: "all 0.2s",
};

const submitButton = {
  flex: 1,
  padding: "12px",
  background: BRAND_RED,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  transition: "all 0.2s",
};

export default RefundRequestPage;