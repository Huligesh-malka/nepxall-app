import React, { useState } from "react";
import api from "../api/api";

const BRAND_BLUE = "#0B5ED7";
const BRAND_RED = "#ef4444";
const BRAND_GREEN = "#4CAF50";

const RefundRequestPage = ({ stay, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    reason: "",
    upiId: "",
    confirmUpi: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.reason && formData.upiId && formData.upiId === formData.confirmUpi;
  };

  const submitRefundRequest = async () => {
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
        bookingId: stay.id,
        reason: formData.reason,
        upi_id: formData.upiId
      });
      if (res.data.success) {
        alert("✅ Refund request submitted successfully.");
        onSuccess();
      }
    } catch (err) {
      console.error("Refund Error:", err);
      alert(err.response?.data?.message || "Refund request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If refund is already paid or in progress
  if (stay.refund_status === "paid") {
    return (
      <div style={container}>
        <div style={infoCard}>
          <div style={successIcon}>💸</div>
          <h3 style={infoTitle}>Refund Already Processed</h3>
          <p style={infoText}>
            Your refund has already been completed. You cannot request another refund.
          </p>
          <button style={backButton} onClick={onCancel}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={title}>💰 Request Refund</h2>
        <p style={subtitle}>Request a refund for your stay at {stay.pg_name}</p>
      </div>

      <div style={content}>
        {/* Stay Info Card */}
        <div style={infoCard}>
          <div style={infoRow}>
            <span style={infoLabel}>Order ID:</span>
            <span style={infoValue}>{stay.order_id}</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}>Total Paid:</span>
            <span style={infoValue}>₹{stay.monthly_total}</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}>Security Deposit:</span>
            <span style={infoValue}>₹{stay.deposit_amount}</span>
          </div>
        </div>

        {/* Refund Status if any */}
        {stay.refund_status === "pending" && (
          <div style={warningCard}>
            <p style={warningText}>
              ⏳ You already have a pending refund request. Please wait for admin approval.
            </p>
          </div>
        )}

        {stay.refund_status === "approved" && (
          <div style={warningCard}>
            <p style={warningText}>
              ✅ Your refund has been approved! Please check your email for further instructions.
            </p>
          </div>
        )}

        {stay.refund_status === "rejected" && (
          <div style={warningCard}>
            <p style={warningText}>
              ❌ Your previous refund request was rejected. You can submit a new request.
            </p>
          </div>
        )}

        {/* Form Fields - Only show if no pending/approved refund */}
        {(!stay.refund_status || stay.refund_status === "rejected") && (
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
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Refund Request"}
              </button>
            </div>
          </>
        )}

        {/* If refund is pending/approved, show only back button */}
        {(stay.refund_status === "pending" || stay.refund_status === "approved") && (
          <div style={buttonGroup}>
            <button style={cancelButton} onClick={onCancel}>
              Go Back
            </button>
          </div>
        )}
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

const warningCard = {
  background: "#fef3c7",
  padding: 15,
  borderRadius: 8,
  marginBottom: 25,
};

const warningText = {
  margin: 0,
  color: "#92400e",
  fontSize: 14,
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

const successIcon = {
  fontSize: 48,
  textAlign: "center",
  marginBottom: 15,
};

const infoTitle = {
  fontSize: 18,
  fontWeight: 600,
  color: "#111827",
  textAlign: "center",
  marginBottom: 10,
};

const infoText = {
  fontSize: 14,
  color: "#6b7280",
  textAlign: "center",
  marginBottom: 20,
};

const backButton = {
  width: "100%",
  padding: "12px",
  background: BRAND_BLUE,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

export default RefundRequestPage;