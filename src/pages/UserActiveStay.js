import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ================= BRAND COLORS ================= */
const BRAND_BLUE = "#0B5ED7";
const BRAND_GREEN = "#4CAF50";
const BRAND_RED = "#ef4444";

/* ================= 3-DOT MENU COMPONENT ================= */
const ThreeDotMenu = ({ items }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={dotBtn}
        aria-label="More options"
      >
        <span style={dot} />
        <span style={dot} />
        <span style={dot} />
      </button>

      {open && (
        <div style={dropdownMenu}>
          {items.map((item, idx) => (
            <button
              key={idx}
              style={{
                ...dropdownItem,
                color: item.danger ? BRAND_RED : item.warn ? "#f59e0b" : "#111827",
                borderBottom: idx < items.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              <span style={{ marginRight: 10, fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const UserActiveStay = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // ✅ USE ONLY THIS - No direct auth.currentUser
  const { user, role, loading: authLoading } = useAuth();

  const receiptRef = useRef();
  const [selectedStay, setSelectedStay] = useState(null);

  const [showRefundFormFor, setShowRefundFormFor] = useState(null);
  // ✅ REFUND - per-stay state
  const [refundForms, setRefundForms] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showVacateFormFor, setShowVacateFormFor] = useState(null);
  // ✅ VACATE - per-stay state (FIXED: no more global state)
  const [vacateForms, setVacateForms] = useState({});

  // ✅ Load stays
  const loadStay = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setLoading(true);
      if (!user) return;

      const res = await api.get("/bookings/user/active-stay");
      setStays(Array.isArray(res.data) ? res.data : res.data ? [res.data] : []);
    } catch (err) {
      console.error("Error loading stays:", err);
    } finally {
      if (forceRefresh) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStay(true);
    }
  }, [user, loadStay]);

  // ✅ PROTECTION - MOVED AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div style={container}>
        <p style={{ textAlign: "center", padding: 50 }}>⏳ Loading authentication...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ REFUND SUBMIT - using per-stay state
  const submitRefundRequest = async (stayId) => {
    const form = refundForms[stayId] || {};
    
    if (!form.reason || !form.upiId) {
      alert("Please provide both a reason and a UPI ID.");
      return;
    }
    if (form.upiId !== form.confirmUpi) {
      alert("UPI IDs do not match!");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post("/bookings/refunds/request", {
        bookingId: stayId,
        reason: form.reason,
        upi_id: form.upiId
      });
      if (res.data.success) {
        alert("✅ Refund request submitted successfully.");
        await loadStay(true);
        setShowRefundFormFor(null);
        // ✅ Clear only this stay's refund form
        setRefundForms(prev => ({
          ...prev,
          [stayId]: {}
        }));
      }
    } catch (err) {
      console.error("Refund Error:", err);
      alert(err.response?.data?.message || "Refund request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ VACATE SUBMIT - using per-stay state (FIXED)
  const submitVacateRequest = async (stayId) => {
    const form = vacateForms[stayId] || {};
    
    if (!form.vacateReason || !form.vacateDate) {
      alert("Please fill all required fields");
      return;
    }
    
    // ✅ Prevent past date selection
    const selectedDate = new Date(form.vacateDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert("Vacate date cannot be in the past");
      return;
    }
    
    try {
      const res = await api.post("/bookings/vacate/request", {
        bookingId: stayId,
        vacate_date: form.vacateDate,
        reason: form.vacateReason,
        account_number: form.accountNumber || "",
        ifsc_code: form.ifscCode || "",
        upi_id: form.upiId || "",
      });
      if (res.data.success) {
        alert("✅ Vacate request submitted");
        setShowVacateFormFor(null);
        
        // ✅ FIX 5: Force UI update immediately to prevent flicker/disappearing
        setStays(prev =>
          prev.map(s =>
            s.id === stayId
              ? { ...s, vacate_status: "requested" }
              : s
          )
        );
        
        // ✅ Clear only this stay's vacate form
        setVacateForms(prev => ({
          ...prev,
          [stayId]: {}
        }));
        
        // ✅ Force refresh from backend
        await loadStay(true);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Vacate failed");
    }
  };

  // ✅ Accept refund
  const acceptRefund = async (bookingId) => {
    try {
      await api.post("/bookings/refunds/accept", { bookingId });
      alert("✅ Refund accepted");
      await loadStay(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Accept failed");
    }
  };

  // ✅ Reject refund
  const rejectRefund = async (bookingId) => {
    try {
      await api.post("/bookings/refunds/reject", { bookingId });
      alert("❌ Refund rejected");
      await loadStay(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Reject failed");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Processing...";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownloadReceipt = async (stay) => {
    setSelectedStay(stay);
    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_${stay.order_id || "Booking"}.pdf`);
        setSelectedStay(null);
      } catch (error) {
        console.error("Receipt Generation Failed:", error);
      }
    }, 500);
  };

  // ✅ Helper to check if refund button should be disabled
  const isRefundDisabled = (stayId) => {
    const form = refundForms[stayId] || {};
    return isSubmitting || !form.reason || !form.upiId || form.upiId !== form.confirmUpi;
  };

  if (loading)
    return (
      <div style={container}>
        <p style={{ textAlign: "center", padding: 50 }}>⏳ Syncing your stays...</p>
      </div>
    );

  if (stays.length === 0)
    return (
      <div style={container}>
        <div style={emptyBox}>
          <h3 style={{ color: "#4b5563" }}>No Active Stays Found</h3>
          <p style={{ color: "#9ca3af", marginBottom: 20 }}>
            You don't have any confirmed bookings at the moment.
          </p>
          <button style={btn} onClick={() => navigate("/")}>
            Browse PGs
          </button>
        </div>
      </div>
    );

  return (
    <div style={container}>
      <h2 style={{ marginBottom: 25, color: "#111827" }}>🏠 My Current Stays</h2>

      {stays.map((stay) => {
        // Get per-stay vacate form data
        const vacateForm = vacateForms[stay.id] || {};
        const refundForm = refundForms[stay.id] || {};
        
        return (
          <div key={stay.id} style={card}>

            {/* ✅ FIX 1 & 2: CORRECT STATUS VALUES with "requested" instead of "pending" */}
            {(stay.vacate_status === "requested" ||
              stay.vacate_status === "approved" ||
              stay.vacate_status === "completed") && (
              <div
                style={{
                  background:
                    stay.vacate_status === "requested"
                      ? "#fef3c7"
                      : stay.vacate_status === "approved"
                      ? "#dcfce7"
                      : "#e0e7ff",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  🚪 Vacate Request Status:
                  {stay.vacate_status === "requested" && " ⏳ Requested"}
                  {stay.vacate_status === "approved" && " ✅ Approved"}
                  {stay.vacate_status === "completed" && " ✓ Completed"}
                </p>
                {stay.vacate_date && (
                  <p style={{ fontSize: "12px", color: "#666" }}>
                    Vacate Date: {formatDate(stay.vacate_date)}
                  </p>
                )}
              </div>
            )}

            {/* ✅ FIX 3: SAFE CONDITION for showing vacate form - Now includes rejected refund status to allow re-request */}
            {(!stay.vacate_status || stay.vacate_status === null || stay.refund_status === "rejected") && showVacateFormFor === stay.id ? (
              <div style={refundFormContainer}>
                <h3 style={{ color: "#f59e0b" }}>Vacate Request</h3>

                {/* ✅ REFUND STATUS UI - FULL FIX */}
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontWeight: "bold" }}>
                    Refund Status:
                    
                    {stay.refund_status === "pending" &&
                      (!stay.user_approval || stay.user_approval === null) &&
                      " ⏳ Waiting for Owner Approval"}

                    {stay.refund_status === "approved" &&
                      (stay.user_approval === "pending" || !stay.user_approval) &&
                      " ✅ Owner Approved - Please Accept"}

                    {stay.refund_status === "pending" &&
                      stay.user_approval === "accepted" &&
                      " ⏳ Waiting for Owner Payment"}

                    {stay.refund_status === "pending" &&
                      stay.user_approval === "rejected" &&
                      " ⚠️ You Rejected - Owner will review again"}

                    {stay.refund_status === "rejected" &&
                      " ❌ Owner Rejected (You can request again)"}

                    {stay.refund_status === "paid" &&
                      " 💸 Refund Completed"}
                  </p>

                  {/* 💰 Amount */}
                  {stay.refund_amount > 0 && (
                    <p>💰 Refund Amount: ₹{stay.refund_amount}</p>
                  )}

                  {/* ✅ SHOW BUTTONS ONLY WHEN NEEDED - handles NULL as pending */}
                  {stay.refund_status === "approved" &&
                    (stay.user_approval === "pending" || !stay.user_approval) && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          style={{ ...btn, background: "#4CAF50" }}
                          onClick={() => acceptRefund(stay.id)}
                        >
                          ✅ Accept
                        </button>
                        <button
                          style={{ ...btn, background: "#ef4444" }}
                          onClick={() => rejectRefund(stay.id)}
                        >
                          ❌ Reject
                        </button>
                      </div>
                  )}

                  {/* 🔁 RE-REQUEST BUTTON */}
                  {stay.refund_status === "rejected" && (
                    <button
                      style={{ ...btn, background: "#f59e0b", marginTop: 10 }}
                      onClick={() => setShowVacateFormFor(stay.id)}
                    >
                      🔁 Request Again
                    </button>
                  )}
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>Vacate Date</label>
                  <input
                    type="date"
                    style={inputField}
                    min={new Date().toISOString().split("T")[0]}
                    value={vacateForm.vacateDate || ""}
                    onChange={(e) =>
                      setVacateForms(prev => ({
                        ...prev,
                        [stay.id]: {
                          ...prev[stay.id],
                          vacateDate: e.target.value
                        }
                      }))
                    }
                  />
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>Reason</label>
                  <textarea
                    style={inputField}
                    placeholder="Why are you vacating?"
                    value={vacateForm.vacateReason || ""}
                    onChange={(e) =>
                      setVacateForms(prev => ({
                        ...prev,
                        [stay.id]: {
                          ...prev[stay.id],
                          vacateReason: e.target.value
                        }
                      }))
                    }
                  />
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>Account Number (Optional)</label>
                  <input
                    style={inputField}
                    placeholder="Enter account number"
                    value={vacateForm.accountNumber || ""}
                    onChange={(e) =>
                      setVacateForms(prev => ({
                        ...prev,
                        [stay.id]: {
                          ...prev[stay.id],
                          accountNumber: e.target.value
                        }
                      }))
                    }
                  />
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>IFSC Code (Optional)</label>
                  <input
                    style={inputField}
                    placeholder="Enter IFSC code"
                    value={vacateForm.ifscCode || ""}
                    onChange={(e) =>
                      setVacateForms(prev => ({
                        ...prev,
                        [stay.id]: {
                          ...prev[stay.id],
                          ifscCode: e.target.value
                        }
                      }))
                    }
                  />
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>UPI ID (Optional)</label>
                  <input
                    style={inputField}
                    placeholder="name@bank"
                    value={vacateForm.upiId || ""}
                    onChange={(e) =>
                      setVacateForms(prev => ({
                        ...prev,
                        [stay.id]: {
                          ...prev[stay.id],
                          upiId: e.target.value
                        }
                      }))
                    }
                  />
                </div>

                <div style={btnRow}>
                  <button
                    style={{ ...btn, background: "#6b7280" }}
                    onClick={() => {
                      setShowVacateFormFor(null);
                      // Clear only this stay's vacate form
                      setVacateForms(prev => ({
                        ...prev,
                        [stay.id]: {}
                      }));
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...btn, background: "#f59e0b" }}
                    onClick={() => submitVacateRequest(stay.id)}
                  >
                    Submit Vacate
                  </button>
                </div>
              </div>

            ) : showRefundFormFor === stay.id ? (
              /* REFUND FORM - Using per-stay state */
              <div style={refundFormContainer}>
                {stay.refund_status ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "10px" }}>
                      {stay.refund_status === "pending" && "⏳ Waiting for Admin Approval"}
                      {stay.refund_status === "approved" && "✅ Approved - Processing"}
                      {stay.refund_status === "paid" && "💸 Refunded Successfully"}
                      {stay.refund_status === "rejected" && "❌ Rejected (You can retry)"}
                    </div>
                    <button
                      style={{ ...btn, background: "#6b7280", flex: "none", width: "120px" }}
                      onClick={() => {
                        setShowRefundFormFor(null);
                        setRefundForms(prev => ({
                          ...prev,
                          [stay.id]: {}
                        }));
                      }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 style={{ color: BRAND_RED, marginBottom: "15px" }}>Request Refund</h3>
                    <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>
                      Order ID: {stay.order_id}
                    </p>
                    <div style={inputGroup}>
                      <label style={labelStyle}>Refund Reason</label>
                      <textarea
                        style={inputField}
                        placeholder="Tell us why you want a refund..."
                        value={refundForm.reason || ""}
                        onChange={(e) =>
                          setRefundForms(prev => ({
                            ...prev,
                            [stay.id]: {
                              ...prev[stay.id],
                              reason: e.target.value
                            }
                          }))
                        }
                      />
                    </div>
                    <div style={inputGroup}>
                      <label style={labelStyle}>UPI ID for Transfer</label>
                      <input
                        style={inputField}
                        type="text"
                        placeholder="e.g. name@bank"
                        value={refundForm.upiId || ""}
                        onChange={(e) =>
                          setRefundForms(prev => ({
                            ...prev,
                            [stay.id]: {
                              ...prev[stay.id],
                              upiId: e.target.value
                            }
                          }))
                        }
                      />
                    </div>
                    <div style={inputGroup}>
                      <label style={labelStyle}>Confirm UPI ID</label>
                      <input
                        style={{
                          ...inputField,
                          borderColor:
                            refundForm.confirmUpi && refundForm.upiId !== refundForm.confirmUpi ? BRAND_RED : "#ddd",
                          backgroundColor:
                            refundForm.confirmUpi && refundForm.upiId === refundForm.confirmUpi ? "#f0fdf4" : "#fff",
                        }}
                        type="text"
                        placeholder="Re-enter UPI ID"
                        value={refundForm.confirmUpi || ""}
                        onChange={(e) =>
                          setRefundForms(prev => ({
                            ...prev,
                            [stay.id]: {
                              ...prev[stay.id],
                              confirmUpi: e.target.value
                            }
                          }))
                        }
                      />
                      {refundForm.confirmUpi && refundForm.upiId !== refundForm.confirmUpi && (
                        <span style={{ fontSize: "10px", color: BRAND_RED }}>
                          UPI IDs do not match
                        </span>
                      )}
                    </div>
                    <div style={btnRow}>
                      <button
                        style={{ ...btn, background: "#6b7280" }}
                        onClick={() => {
                          setShowRefundFormFor(null);
                          setRefundForms(prev => ({
                            ...prev,
                            [stay.id]: {}
                          }));
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        style={{
                          ...btn,
                          background: isRefundDisabled(stay.id) ? "#cca7a7" : BRAND_RED,
                          cursor: isRefundDisabled(stay.id) ? "not-allowed" : "pointer",
                        }}
                        disabled={isRefundDisabled(stay.id)}
                        onClick={() => submitRefundRequest(stay.id)}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Request"}
                      </button>
                    </div>
                  </>
                )}
              </div>

            ) : (
              /* ── MAIN CARD VIEW ── */
              <>
                {/* Header: PG name + badge + 3-dot menu */}
                <div style={headerSection}>
                  <div>
                    <h3 style={{ margin: 0, color: BRAND_BLUE }}>{stay.pg_name}</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={statusBadge}>VERIFIED ✅</span>

                    {/* ── 3-DOT MENU ── */}
                    <ThreeDotMenu
                      items={[
                        {
                          icon: "📜",
                          label: "Booking History",
                          onClick: () => navigate("/user/bookings"),
                        },
                        {
                          icon: "💳",
                          label: "Pay Rent",
                          onClick: () => navigate("/payment"),
                        },
                        {
                          icon: "📥",
                          label: "Download Receipt",
                          onClick: () => handleDownloadReceipt(stay),
                        },
                        ...(stay.order_id
                          ? [
                              {
                                icon: "🔁",
                                label: "Request Refund",
                                danger: true,
                                onClick: () => setShowRefundFormFor(stay.id),
                              },
                            ]
                          : []),
                        // ✅ FIXED: Menu condition - allows vacate again after rejection
                        ...((!stay.vacate_status || stay.vacate_status === null || stay.refund_status === "rejected")
                          ? [
                              {
                                icon: "🚪",
                                label: "Vacate Room",
                                warn: true,
                                onClick: () => setShowVacateFormFor(stay.id),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </div>

                <div style={infoGrid}>
                  <div style={infoItem}>
                    <label style={labelStyle}>🚪 Allotted Room</label>
                    <p style={valStyle}>{stay.room_no || "Allocating..."}</p>
                  </div>
                  <div style={infoItem}>
                    <label style={labelStyle}>👥 Sharing Type</label>
                    <p style={valStyle}>{stay.room_type || "N/A"}</p>
                  </div>
                  <div style={{ ...infoItem, gridColumn: "span 2", marginTop: "10px" }}>
                    <label style={labelStyle}>🆔 Order ID</label>
                    <p
                      style={{
                        ...valStyle,
                        fontSize: "12px",
                        color: BRAND_BLUE,
                        wordBreak: "break-all",
                      }}
                    >
                      {stay.order_id || "N/A"}
                    </p>
                  </div>
                </div>

                <div style={priceList}>
                  <p style={{ ...priceRow, color: BRAND_GREEN, fontWeight: "700" }}>
                    💰 Paid On: <span>{formatDate(stay.paid_date)}</span>
                  </p>
                  {stay.rent_amount > 0 && (
                    <p style={priceRow}>
                      Monthly Rent: <span>₹{stay.rent_amount}</span>
                    </p>
                  )}
                  {stay.maintenance_amount > 0 && (
                    <p style={priceRow}>
                      Maintenance: <span>₹{stay.maintenance_amount}</span>
                    </p>
                  )}
                  {stay.deposit_amount > 0 && (
                    <p
                      style={{
                        ...priceRow,
                        borderTop: "1px dashed #eee",
                        paddingTop: "10px",
                        marginTop: "10px",
                      }}
                    >
                      Security Deposit (Paid):{" "}
                      <span style={{ fontWeight: "bold" }}>₹{stay.deposit_amount}</span>
                    </p>
                  )}
                  <div style={totalBox}>
                    <span>Total Monthly Paid</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      ₹{stay.monthly_total}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* HIDDEN RECEIPT FOR PDF */}
      {selectedStay && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={receiptRef} style={modernReceiptContainer}>
            <div style={{ ...receiptHeader, borderBottom: `4px solid ${BRAND_BLUE}` }}>
              <div>
                <h1 style={logoText}>
                  <span style={{ color: BRAND_BLUE }}>NEP</span>
                  <span style={{ color: BRAND_GREEN }}>XALL</span>
                </h1>
                <p style={tagline}>Next Places for Living</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={receiptTitle}>RENT RECEIPT</h2>
                <p style={{ ...orderIdText, color: BRAND_BLUE }}>
                  Order ID: {selectedStay.order_id || "N/A"}
                </p>
                <p style={dateText}>
                  Date: {formatDate(selectedStay.paid_date || new Date())}
                </p>
              </div>
            </div>

            <div style={mainReceiptBody}>
              <div style={{ flex: 1 }}>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>👤 ISSUED TO</label>
                  <p style={receiptValue}>
                    {user?.displayName || "Valued Tenant"}
                  </p>
                  <p style={receiptSubValue}>
                    Mob: {user?.phoneNumber || "Registered User"}
                  </p>
                </div>
                <div style={sectionBlock}>
                  <label style={receiptLabel}>🏠 PROPERTY DETAILS</label>
                  <p style={receiptValue}>{selectedStay.pg_name}</p>
                  <p style={receiptSubValue}>
                    {selectedStay.room_type} Sharing{" "}
                    {selectedStay.room_no ? `| Room: ${selectedStay.room_no}` : ""}
                  </p>
                </div>
              </div>
              <div style={paymentStatusBox}>
                <div style={statusCircle}>✅</div>
                <h3 style={{ ...statusText, color: BRAND_GREEN }}>VERIFIED</h3>
                <p style={dateText}>Payment Mode: Online</p>
                <div style={amountDisplay}>₹{selectedStay.monthly_total}</div>
              </div>
            </div>

            <div style={tableContainer}>
              <div style={{ ...tableHeader, background: BRAND_BLUE }}>
                <span>📊 PAYMENT BREAKDOWN</span>
                <span>Amount</span>
              </div>
              {selectedStay.rent_amount > 0 && (
                <div style={tableRow}>
                  <span>Monthly Room Rent ({selectedStay.room_type})</span>
                  <span>₹{selectedStay.rent_amount}</span>
                </div>
              )}
              {selectedStay.maintenance_amount > 0 && (
                <div style={tableRow}>
                  <span>Maintenance Charges</span>
                  <span>₹{selectedStay.maintenance_amount}</span>
                </div>
              )}
              <div
                style={{
                  ...tableRow,
                  borderBottom: `2px solid ${BRAND_BLUE}`,
                  fontWeight: "bold",
                  background: "#f8fafc",
                }}
              >
                <span>Total Amount Received</span>
                <span>₹{selectedStay.monthly_total}</span>
              </div>
            </div>

            {selectedStay.deposit_amount > 0 && (
              <div
                style={{
                  ...sectionBlock,
                  marginTop: "30px",
                  padding: "20px",
                  background: "#f0f4f8",
                  borderRadius: "10px",
                }}
              >
                <label style={receiptLabel}>💳 SECURITY DEPOSIT (ONE-TIME)</label>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={receiptValue}>₹{selectedStay.deposit_amount}</span>
                  <span style={{ color: BRAND_GREEN, fontWeight: "bold" }}>
                    Paid (Refundable)
                  </span>
                </div>
              </div>
            )}

            <div style={footerNote}>
              <div
                style={{ textAlign: "left", marginBottom: "20px", color: "#4b5563" }}
              >
                <p>
                  ✔ Verified Transaction:{" "}
                  <strong>{selectedStay.order_id || "N/A"}</strong>
                </p>
                <p>
                  ✔ This is a digital proof of stay generated by Nepxall.
                </p>
              </div>
              <p
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "20px",
                }}
              >
                * System-generated receipt. No signature required.
              </p>
              <p
                style={{ fontWeight: "bold", marginTop: 5, color: BRAND_BLUE }}
              >
                THANK YOU FOR STAYING WITH US!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===== STYLES ===== */
const container = {
  maxWidth: 600,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "Inter, sans-serif",
};
const card = {
  background: "#fff",
  padding: 30,
  borderRadius: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  border: "1px solid #f0f0f0",
  marginBottom: "25px",
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
  gap: "10px",
  marginBottom: 20,
};
const labelStyle = {
  fontSize: "11px",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: "600",
};
const valStyle = {
  margin: "2px 0 0 0",
  fontWeight: "700",
  fontSize: "15px",
  color: "#111827",
};
const priceList = {
  marginBottom: 20,
  background: "#f9fafb",
  padding: "15px",
  borderRadius: "12px",
};
const priceRow = {
  display: "flex",
  justifyContent: "space-between",
  color: "#4b5563",
  margin: "10px 0",
  fontSize: "14px",
};
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
const statusBadge = {
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "bold",
  background: "#dcfce7",
  color: "#166534",
};
const btnRow = { display: "flex", gap: 8, flexWrap: "wrap" };
const btn = {
  flex: 1,
  minWidth: "100px",
  padding: "12px",
  background: BRAND_BLUE,
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
};
const infoItem = { display: "flex", flexDirection: "column" };
const emptyBox = {
  textAlign: "center",
  padding: 60,
  background: "#fff",
  borderRadius: 16,
  border: "2px dashed #e5e7eb",
};
const refundFormContainer = { animation: "fadeIn 0.3s ease" };
const inputGroup = { marginBottom: "15px" };
const inputField = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  marginTop: "5px",
  fontFamily: "inherit",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

/* 3-dot button styles */
const dotBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "6px 10px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: "center",
  transition: "background 0.15s",
};
const dot = {
  display: "block",
  width: "4px",
  height: "4px",
  borderRadius: "50%",
  background: "#6b7280",
};
const dropdownMenu = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  zIndex: 999,
  minWidth: "190px",
  overflow: "hidden",
};
const dropdownItem = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "12px 16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  textAlign: "left",
  fontFamily: "Inter, sans-serif",
  transition: "background 0.12s",
};

/* Receipt styles */
const modernReceiptContainer = {
  width: "210mm",
  minHeight: "297mm",
  padding: "60px",
  background: "#ffffff",
  color: "#111827",
  fontFamily: "Helvetica, Arial, sans-serif",
};
const receiptHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  paddingBottom: "20px",
  marginBottom: "30px",
};
const logoText = {
  margin: 0,
  fontSize: "36px",
  fontWeight: "900",
  letterSpacing: "-1px",
};
const tagline = { margin: 0, fontSize: "12px", color: "#6b7280" };
const receiptTitle = { margin: 0, fontSize: "22px", color: "#111827" };
const orderIdText = { margin: 0, fontSize: "14px", fontWeight: "bold" };
const mainReceiptBody = {
  display: "flex",
  gap: "30px",
  marginBottom: "40px",
};
const sectionBlock = { marginBottom: "20px" };
const receiptLabel = {
  fontSize: "11px",
  color: "#9ca3af",
  fontWeight: "bold",
  letterSpacing: "1px",
  display: "block",
  marginBottom: "5px",
};
const receiptValue = {
  fontSize: "16px",
  fontWeight: "bold",
  margin: 0,
  color: "#111827",
};
const receiptSubValue = { fontSize: "13px", color: "#4b5563", margin: "2px 0" };
const paymentStatusBox = {
  width: "200px",
  background: "#f8fafc",
  borderRadius: "15px",
  border: "1px solid #e2e8f0",
  padding: "20px",
  textAlign: "center",
};
const statusCircle = { fontSize: "30px", marginBottom: "5px" };
const statusText = { margin: 0, fontSize: "18px", fontWeight: "bold" };
const dateText = { fontSize: "12px", color: "#6b7280", margin: "5px 0" };
const amountDisplay = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#111827",
  marginTop: "10px",
};
const tableContainer = { marginTop: "10px" };
const tableHeader = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px",
  color: "#fff",
  borderRadius: "8px 8px 0 0",
  fontWeight: "bold",
};
const tableRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "15px 12px",
  borderBottom: "1px solid #e5e7eb",
};
const footerNote = {
  marginTop: "50px",
  textAlign: "center",
  color: "#9ca3af",
  fontSize: "12px",
};

export default UserActiveStay;