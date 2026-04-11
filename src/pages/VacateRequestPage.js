import React, { useState, useEffect } from "react";
import api from "../api/api";

const BRAND_BLUE = "#0B5ED7";
const BRAND_RED = "#ef4444";
const BRAND_ORANGE = "#f59e0b";

const VacateRequestPage = ({ onSuccess, onCancel }) => {
  const [stays, setStays] = useState([]);
  const [selectedStayId, setSelectedStayId] = useState("");
  const [formData, setFormData] = useState({
    vacateDate: "",
    vacateReason: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStays, setLoadingStays] = useState(true);

  const loadBookings = async () => {
    try {
      setLoadingStays(true);
      const res = await api.get("/bookings/user/active-stay");
      // Ensure the response includes pg_user_status and vacate_status
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
    return selectedStayId && formData.vacateReason && formData.vacateDate;
  };

  const submitVacateRequest = async () => {
    if (!selectedStayId) {
      alert("Please select a booking");
      return;
    }
    if (!formData.vacateReason || !formData.vacateDate) {
      alert("Please fill all required fields");
      return;
    }
    
    const selectedDate = new Date(formData.vacateDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert("Vacate date cannot be in the past");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const res = await api.post("/bookings/vacate/request", {
        bookingId: selectedStayId,
        vacate_date: formData.vacateDate,
        reason: formData.vacateReason,
        account_number: formData.accountNumber || "",
        ifsc_code: formData.ifscCode || "",
        upi_id: formData.upiId || "",
      });
      if (res.data.success) {
        alert("✅ Vacate request submitted successfully");
        loadBookings(); // Refresh safely instead of calling onSuccess()
      }
    } catch (err) {
      console.error(err);
      // Extra safe: Ignore duplicate error
      if (err.response?.data?.message === "Vacate already requested") {
        return; // ignore duplicate error
      }
      alert(err.response?.data?.message || "Vacate request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRefund = async (bookingId) => {
    try {
      await api.post("/bookings/refunds/accept", {
        bookingId: bookingId
      });
      alert("✅ Refund accepted successfully");
      loadBookings(); // Refresh the data
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to accept refund");
    }
  };

  const handleRejectRefund = async (bookingId) => {
    try {
      await api.post("/bookings/refunds/reject", {
        bookingId: bookingId
      });
      alert("❌ Refund rejected");
      loadBookings(); // Refresh the data
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to reject refund");
    }
  };

  const handleRequestAgain = () => {
    setFormData({
      vacateDate: "",
      vacateReason: "",
      accountNumber: "",
      ifscCode: "",
      upiId: ""
    });
    // Optional: Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedStay = stays.find(s => s.id === parseInt(selectedStayId));
  
  // FIXED: Check pg_user_status and vacate_status instead of just is_joined
  const isJoined = selectedStay?.is_joined > 0;
  const pgUserStatus = selectedStay?.pg_user_status;
  const vacateStatus = selectedStay?.vacate_status;
  
  // Check if user can submit vacate request (joined and not in vacate process)
  const canSubmitVacate = isJoined && 
    pgUserStatus !== "LEAVING" && 
    pgUserStatus !== "LEFT" &&
    selectedStay?.refund_status !== "paid" &&
    selectedStay?.refund_status !== "pending";

  // Get UI message based on status
  const getStatusMessage = () => {
    if (pgUserStatus === "LEAVING" && vacateStatus === "requested") {
      return {
        type: "pending",
        message: "⏳ Vacate request sent. Waiting for owner approval",
        icon: "⏳"
      };
    }
    if (pgUserStatus === "LEAVING" && vacateStatus === "approved") {
      return {
        type: "approved",
        message: "💰 Vacate request approved! Waiting for refund payment",
        icon: "💰"
      };
    }
    if (pgUserStatus === "LEFT" && vacateStatus === "completed") {
      return {
        type: "completed",
        message: "✅ Vacate process completed successfully",
        icon: "✅"
      };
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  // Show completion screen if refund is paid OR status is LEFT
  if (selectedStay?.refund_status === "paid" || pgUserStatus === "LEFT") {
    return (
      <div style={container}>
        <div style={completionCard}>
          <div style={completionIcon}>🎉</div>
          <h2 style={completionTitle}>✅ Refund completed successfully</h2>
          <p style={completionText}>
            Your security deposit refund of ₹{selectedStay?.refund_amount || 0} has been processed successfully.
            The amount has been credited to your account.
          </p>
          <button style={completionButton} onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={title}>🚪 Vacate Room Request</h2>
        <p style={subtitle}>Request to vacate your room</p>
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
            disabled={loadingStays}
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
              <span style={infoLabel}>Security Deposit:</span>
              <span style={infoValue}>₹{selectedStay.deposit_amount}</span>
            </div>
            {pgUserStatus && (
              <div style={infoRow}>
                <span style={infoLabel}>Status:</span>
                <span style={infoValue}>
                  {pgUserStatus === "ACTIVE" && "✅ Active"}
                  {pgUserStatus === "LEAVING" && "⏳ Leaving Process"}
                  {pgUserStatus === "LEFT" && "📦 Left PG"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* FIXED: Warning Message - Check pg_user_status instead of just is_joined */}
        {selectedStay && 
         isJoined === 0 &&
         pgUserStatus !== "LEAVING" &&
         pgUserStatus !== "LEFT" && (
          <div style={warningCard}>
            <p style={warningText}>
              ❌ You have not joined this PG yet
            </p>
            <p style={warningSubtext}>
              Vacate request is only allowed after check-in.
            </p>
          </div>
        )}

        {/* FIXED: Show status message based on pg_user_status and vacate_status */}
        {statusMessage && (
          <div style={{
            ...statusCard,
            background: statusMessage.type === "pending" ? "#fef3c7" : 
                       statusMessage.type === "approved" ? "#dbeafe" : "#d1fae5",
            borderColor: statusMessage.type === "pending" ? "#f59e0b" :
                        statusMessage.type === "approved" ? "#3b82f6" : "#10b981"
          }}>
            <p style={{
              ...statusText,
              color: statusMessage.type === "pending" ? "#92400e" :
                     statusMessage.type === "approved" ? "#1e40af" : "#065f46"
            }}>
              {statusMessage.icon} {statusMessage.message}
            </p>
          </div>
        )}

        {/* Refund Status Section - Updated with amount display */}
        {selectedStay && (
          <div style={refundCard}>
            <p style={refundTitle}>
              <b>💰 Refund Status:</b> {
                selectedStay.refund_status === "paid" 
                  ? "✅ Refund Completed Successfully" 
                  : selectedStay.refund_status === "approved" 
                  ? `💰 Approved - Amount: ₹${selectedStay.refund_amount || 0}`
                  : selectedStay.refund_status === "pending" && selectedStay.user_approval === "accepted"
                  ? "⏳ Waiting for owner to send payment"
                  : selectedStay.refund_status === "pending"
                  ? "⏳ Waiting for owner approval"
                  : selectedStay.refund_status === "rejected"
                  ? "❌ Rejected"
                  : "Not Requested"
              }
            </p>

            {/* Show refund amount if available */}
            {selectedStay.refund_amount > 0 && (
              <p style={refundAmount}>
                💵 Refund Amount: <b>₹{selectedStay.refund_amount}</b>
              </p>
            )}

            {/* Accept/Reject Buttons for approved refund */}
            {selectedStay.refund_status === "approved" &&
             selectedStay.user_approval === "pending" && (
              <div style={buttonGroupSmall}>
                <button
                  onClick={() => handleAcceptRefund(selectedStay.id)}
                  style={acceptButton}
                >
                  ✅ Accept ₹{selectedStay.refund_amount || 0}
                </button>

                <button
                  onClick={() => handleRejectRefund(selectedStay.id)}
                  style={rejectButton}
                >
                  ❌ Reject Refund
                </button>
              </div>
            )}

            {/* Request Again button for rejected refund */}
            {selectedStay.refund_status === "rejected" && (
              <button
                onClick={handleRequestAgain}
                style={requestAgainButton}
              >
                🔁 Request Again
              </button>
            )}
          </div>
        )}

        {/* Form Fields - Only show if can submit vacate */}
        {selectedStay && canSubmitVacate && (
          <>
            <div style={formGroup}>
              <label style={label}>
                Vacate Date <span style={required}>*</span>
              </label>
              <input
                type="date"
                name="vacateDate"
                style={input}
                min={new Date().toISOString().split("T")[0]}
                value={formData.vacateDate}
                onChange={handleChange}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>
                Reason for Vacating <span style={required}>*</span>
              </label>
              <textarea
                name="vacateReason"
                style={textarea}
                placeholder="Please provide a reason for vacating..."
                rows={4}
                value={formData.vacateReason}
                onChange={handleChange}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Account Number (Optional)</label>
              <input
                type="text"
                name="accountNumber"
                style={input}
                placeholder="Enter account number for refund"
                value={formData.accountNumber}
                onChange={handleChange}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>IFSC Code (Optional)</label>
              <input
                type="text"
                name="ifscCode"
                style={input}
                placeholder="Enter IFSC code"
                value={formData.ifscCode}
                onChange={handleChange}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>UPI ID (Optional)</label>
              <input
                type="text"
                name="upiId"
                style={input}
                placeholder="name@bank"
                value={formData.upiId}
                onChange={handleChange}
              />
            </div>

            {/* Important Notes */}
            <div style={notesCard}>
              <h4 style={notesTitle}>📋 Important Notes:</h4>
              <ul style={notesList}>
                <li>Your vacate request will be reviewed by the owner</li>
                <li>Security deposit refund will be processed after vacate approval</li>
                <li>Please ensure all dues are cleared before vacating</li>
                <li>You'll receive updates on your request status</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={buttonGroupLarge}>
              <button style={cancelButton} onClick={onCancel}>
                Cancel
              </button>
              <button 
                style={{ 
                  ...submitButton, 
                  opacity: isFormValid() && !isSubmitting ? 1 : 0.7,
                  cursor: isFormValid() && !isSubmitting ? "pointer" : "not-allowed"
                }}
                onClick={submitVacateRequest}
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Vacate Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Styles
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

const warningCard = {
  marginTop: 15,
  padding: 15,
  background: "#fee2e2",
  borderRadius: 8,
  border: "1px solid #ef4444"
};

const warningText = {
  margin: 0,
  color: "#991b1b",
  fontWeight: 500
};

const warningSubtext = {
  marginTop: 6,
  fontSize: 13,
  color: "#991b1b"
};

const statusCard = {
  marginTop: 15,
  padding: 15,
  borderRadius: 8,
  border: "1px solid",
};

const statusText = {
  margin: 0,
  fontWeight: 500,
  textAlign: "center"
};

const refundCard = {
  marginTop: 15,
  padding: 12,
  background: "#f1f5f9",
  borderRadius: 8,
  border: "1px solid #e2e8f0"
};

const refundTitle = {
  margin: 0,
  fontSize: 14
};

const refundAmount = {
  marginTop: 6,
  fontSize: 13
};

const notesCard = {
  background: "#fef3c7",
  padding: 20,
  borderRadius: 12,
  marginTop: 25,
  marginBottom: 25,
};

const notesTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#92400e",
  margin: "0 0 10px 0",
};

const notesList = {
  margin: 0,
  paddingLeft: 20,
  color: "#92400e",
  fontSize: 13,
};

const buttonGroupSmall = {
  display: "flex",
  gap: 10,
  marginTop: 10
};

const buttonGroupLarge = {
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
  background: BRAND_ORANGE,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  transition: "all 0.2s",
};

const acceptButton = {
  flex: 1,
  padding: "8px 16px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500
};

const rejectButton = {
  flex: 1,
  padding: "8px 16px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500
};

const requestAgainButton = {
  marginTop: 10,
  width: "100%",
  padding: "8px 12px",
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500
};

const completionCard = {
  maxWidth: 500,
  margin: "0 auto",
  padding: 40,
  textAlign: "center",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const completionIcon = {
  fontSize: 64,
  marginBottom: 20,
};

const completionTitle = {
  fontSize: 24,
  fontWeight: 700,
  color: "#10b981",
  margin: "0 0 16px 0",
};

const completionText = {
  fontSize: 14,
  color: "#6b7280",
  margin: "0 0 24px 0",
  lineHeight: 1.5,
};

const completionButton = {
  padding: "10px 24px",
  background: BRAND_ORANGE,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  transition: "all 0.2s",
};

export default VacateRequestPage;