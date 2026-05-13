import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import api from "../api/api";
import { load } from "@cashfreepayments/cashfree-js";

const UserBookingHistory = () => {
  const navigate = useNavigate();
  
  // Add mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const [me, setMe] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  // Check window size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load user from backend
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get("/private-chat/me");
        setMe(res.data);
        console.log("✅ User loaded from backend:", res.data);
      } catch (err) {
        console.error("Failed to load user from backend:", err);
      }
    };

    if (user?.uid) {
      loadMe();
    }
  }, [user?.uid]);

  // Filter bookings based on active tab
  const filteredBookings = useMemo(() => {
    if (activeTab === "all") return bookings;
    if (activeTab === "pending") return bookings.filter(b => b.status === "pending");
    if (activeTab === "approved") return bookings.filter(b => b.status === "approved");
    if (activeTab === "confirmed") return bookings.filter(b => b.status === "confirmed");
    if (activeTab === "left") return bookings.filter(b => b.status === "left");
    return bookings;
  }, [bookings, activeTab]);

  // Load bookings only once
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await api.get("/bookings/user/history");
      setBookings(res.data || []);
      
      if (res.data && res.data.length > 0) {
        await checkAllPaymentStatuses(res.data);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError(err.response?.data?.message || "Failed to load booking history");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check payment status
  const checkAllPaymentStatuses = useCallback(async (bookingsList) => {
    try {
      const statusMap = { ...paymentStatuses };
      
      await Promise.all(bookingsList.map(async (booking) => {
        try {
          const res = await api.get(`/payments/status/${booking.id}`);
          if (res.data.success && res.data.data) {
            statusMap[booking.id] = res.data.data.status;
          }
        } catch (err) {
          console.log(`No payment found for booking ${booking.id}`);
        }
      }));
      
      setPaymentStatuses({ ...statusMap });
    } catch (err) {
      console.error("Error checking payment statuses:", err);
    }
  }, [paymentStatuses]);

  // Initial load - only once
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Show payment dialog
  const handleShowPaymentDialog = useCallback((booking) => {
    setSelectedBookingForPayment(booking);
    setShowPaymentDialog(true);
  }, []);

  // Create payment with Cashfree
  const handlePayNow = useCallback(async () => {
    if (!selectedBookingForPayment) return;

    try {
      setPayingId(selectedBookingForPayment.id);
      setError("");

      const booking = selectedBookingForPayment;

      // Fixed amounts
      const total = 1099; // 1000 token + 99 platform fee

      // Create Cashfree order
      const res = await api.post("/payments/create-cashfree-order", {
        amount: total,
        customerId: String(user.uid),
        customerPhone: user.phoneNumber || "9999999999",
        bookingId: booking.id,
        includeAgreement: false
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Cashfree order failed");
      }

      // Initialize Cashfree
      const cashfree = await load({
        mode: "production"
      });

      // Redirect to Cashfree checkout
      await cashfree.checkout({
        paymentSessionId: res.data.payment_session_id,
        redirectTarget: "_self"
      });
      
    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      setError(err.message || "Payment initialization failed");
    } finally {
      setPayingId(null);
      setSelectedBookingForPayment(null);
      setShowPaymentDialog(false);
    }
  }, [selectedBookingForPayment, user]);

  // Close payment dialog
  const closePaymentDialog = useCallback(() => {
    setShowPaymentDialog(false);
    setSelectedBookingForPayment(null);
  }, []);

  // Get payment status
  const getPaymentStatusDisplay = useCallback((bookingId, bookingStatus) => {
    const status = paymentStatuses[bookingId];
    
    if (!status) {
      return {
        showPayButton: bookingStatus === "approved",
        message: null,
        badge: null
      };
    }

    switch(status) {
      case "paid":
        return {
          showPayButton: false,
          message: "✅ Payment verified successfully!",
          badge: { text: "Paid", style: "paid" }
        };
      
      case "submitted":
        return {
          showPayButton: false,
          message: "⏳ Payment submitted! Waiting for verification.",
          badge: { text: "Pending Verification", style: "submitted" }
        };
      
      case "rejected":
        return {
          showPayButton: true,
          message: "❌ Payment was rejected. Please try again.",
          badge: { text: "Rejected", style: "rejected" }
        };
      
      case "pending":
        return {
          showPayButton: true,
          message: "Complete payment using Cashfree.",
          badge: { text: "Pending", style: "pending" }
        };
      
      default:
        return {
          showPayButton: bookingStatus === "approved",
          message: null,
          badge: null
        };
    }
  }, [paymentStatuses]);

  // Handle chat navigation
  const handleChatNavigation = useCallback(async (booking) => {
    try {
      if (!booking.pg_id || !me?.id) return;

      const res = await api.get(
        `/private-chat/user/${me.id}?pg_id=${booking.pg_id}`
      );

      const ownerId = res.data?.id;
      if (!ownerId) return;

      navigate(`/chat/private/${ownerId}/${booking.pg_id}`);
    } catch (err) {
      console.error("Chat error:", err);
    }
  }, [navigate, me]);

  // Protect route
  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading authentication...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your bookings...</p>
      </div>
    );
  }

  if (error && !bookings.length) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.retryBtn} onClick={() => loadBookings()}>
          Try Again
        </button>
      </div>
    );
  }

  // Dynamic styles based on isMobile
  const containerPadding = isMobile ? "20px 16px" : "40px 24px";
  const headerMarginBottom = isMobile ? 24 : 40;
  const titleFontSize = isMobile ? "28px" : "clamp(32px, 6vw, 48px)";
  const subtitleFontSize = isMobile ? 13 : 16;
  const tabsGap = isMobile ? 8 : 12;
  const tabsMarginBottom = isMobile ? 24 : 32;
  const tabPadding = isMobile ? "8px 16px" : "12px 24px";
  const tabFontSize = isMobile ? 12 : 14;
  const bookingsGap = isMobile ? 16 : 24;
  const cardHeaderPadding = isMobile ? "16px" : "20px 24px";
  const pgNameFontSize = isMobile ? 16 : 18;
  const pgLocationFontSize = isMobile ? 11 : 13;
  const badgePadding = isMobile ? "4px 8px" : "6px 12px";
  const badgeFontSize = isMobile ? 10 : 12;
  const cardContentPadding = isMobile ? 16 : 24;
  const detailsGap = isMobile ? 12 : 16;
  const detailIconSize = isMobile ? 20 : 24;
  const detailIconBoxSize = isMobile ? 36 : 40;
  const detailLabelFontSize = isMobile ? 10 : 11;
  const detailValueFontSize = isMobile ? 12 : 14;
  const priceSectionPadding = isMobile ? 12 : 16;
  const priceRowFontSize = isMobile ? 12 : 14;
  const totalPriceFontSize = isMobile ? 14 : 16;
  const actionButtonsGap = isMobile ? 6 : 8;
  const iconButtonPadding = isMobile ? "8px 4px" : "10px";
  const iconButtonFontSize = isMobile ? 10 : 12;
  const buttonIconSize = isMobile ? 16 : 18;
  const payButtonPadding = isMobile ? "12px" : "14px";
  const payButtonFontSize = isMobile ? 14 : 16;
  const emptyStatePadding = isMobile ? "40px 20px" : "60px 20px";
  const emptyIconSize = isMobile ? 48 : 64;
  const emptyTitleFontSize = isMobile ? 20 : 24;
  const emptyTextFontSize = isMobile ? 13 : 16;
  const errorToastRight = isMobile ? 10 : 20;
  const errorToastLeft = isMobile ? 10 : "auto";
  const errorToastMaxWidth = isMobile ? "calc(100% - 20px)" : 400;

  return (
    <div style={{ ...styles.container, padding: containerPadding }}>
      {/* Header */}
      <div style={{ ...styles.header, marginBottom: headerMarginBottom }}>
        <h1 style={{ ...styles.title, fontSize: titleFontSize }}>My Bookings</h1>
        <p style={{ ...styles.subtitle, fontSize: subtitleFontSize }}>Manage your property bookings and payments</p>
      </div>

      {/* Tabs */}
      {bookings.length > 0 && (
        <div style={{ ...styles.tabsContainer, gap: tabsGap, marginBottom: tabsMarginBottom }}>
          {["all", "pending", "approved", "confirmed", "left"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                padding: tabPadding,
                fontSize: tabFontSize,
                ...(activeTab === tab ? styles.activeTab : {})
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={styles.tabCount}>
                {bookings.filter(b => tab === "all" ? true : b.status === tab).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: emptyStatePadding }}>
          <div style={{ ...styles.emptyIcon, fontSize: emptyIconSize }}>🏠</div>
          <h3 style={{ ...styles.emptyTitle, fontSize: emptyTitleFontSize }}>No bookings found</h3>
          <p style={{ ...styles.emptyText, fontSize: emptyTextFontSize }}>Start your journey by browsing our properties</p>
          <button 
            style={styles.browseBtn} 
            onClick={() => navigate("/")}
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div style={{ ...styles.bookingsGrid, gap: bookingsGap }}>
          {filteredBookings.map((booking) => {
            const rent = Number(booking.rent_amount || booking.rent || 0);
            const deposit = Number(booking.security_deposit || 0);
            const maintenance = Number(booking.maintenance_amount || 0);
            
            const tokenAmount = 1000;
            const platformFee = 99;
            const remainingAmount = (rent + deposit + maintenance) - tokenAmount;
            
            const paymentDisplay = getPaymentStatusDisplay(booking.id, booking.status);
            const paymentStatus = paymentStatuses[booking.id];
            
            const showPayButton = booking.status === "approved" &&
              paymentStatus !== "paid" && 
              paymentStatus !== "submitted";

            return (
              <div key={booking.id} style={styles.card}>
                {/* Card Header */}
                <div style={{ ...styles.cardHeader, padding: cardHeaderPadding }}>
                  <div style={styles.cardHeaderLeft}>
                    <h3 style={{ ...styles.pgName, fontSize: pgNameFontSize }}>{booking.pg_name || "Property Name"}</h3>
                    <p style={{ ...styles.pgLocation, fontSize: pgLocationFontSize }}>{booking.location || "Location not specified"}</p>
                  </div>
                  <div style={styles.badgeGroup}>
                    <span style={{
                      ...styles.statusBadge,
                      padding: badgePadding,
                      fontSize: badgeFontSize,
                      ...(booking.status === "confirmed" ? styles.statusConfirmed :
                         booking.status === "approved" ? styles.statusApproved :
                         booking.status === "left" ? styles.statusLeft :
                         styles.statusPending)
                    }}>
                      {booking.status}
                    </span>
                    {paymentDisplay.badge && (
                      <span style={{
                        ...styles.paymentBadge,
                        padding: badgePadding,
                        fontSize: badgeFontSize,
                        ...styles[`paymentBadge${paymentDisplay.badge.style}`]
                      }}>
                        {paymentDisplay.badge.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ ...styles.cardContent, padding: cardContentPadding }}>
                  {/* Details Grid - Mobile Responsive */}
                  <div style={{ ...styles.detailsGrid, gap: detailsGap }}>
                    <div style={styles.detailItem}>
                      <span style={{ ...styles.detailIcon, fontSize: detailIconSize, width: detailIconBoxSize, height: detailIconBoxSize }}>📞</span>
                      <div style={styles.detailInfo}>
                        <span style={{ ...styles.detailLabel, fontSize: detailLabelFontSize }}>Contact</span>
                        {booking.status !== "pending" && booking.phone ? (
                          <a
                            href={`tel:${booking.phone}`}
                            style={styles.callButton}
                          >
                            Call Owner
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 13 }}>Not available</span>
                        )}
                      </div>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={{ ...styles.detailIcon, fontSize: detailIconSize, width: detailIconBoxSize, height: detailIconBoxSize }}>📅</span>
                      <div style={styles.detailInfo}>
                        <span style={{ ...styles.detailLabel, fontSize: detailLabelFontSize }}>Check-in</span>
                        <span style={{ ...styles.detailValue, fontSize: detailValueFontSize }}>
                          {booking.check_in_date
                            ? new Date(booking.check_in_date).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={{ ...styles.detailIcon, fontSize: detailIconSize, width: detailIconBoxSize, height: detailIconBoxSize }}>🛏️</span>
                      <div style={styles.detailInfo}>
                        <span style={{ ...styles.detailLabel, fontSize: detailLabelFontSize }}>Room Type</span>
                        <span style={{ ...styles.detailValue, fontSize: detailValueFontSize }}>{booking.room_type || "Single"}</span>
                      </div>
                    </div>
                    {booking.room_no && (
                      <div style={styles.detailItem}>
                        <span style={{ ...styles.detailIcon, fontSize: detailIconSize, width: detailIconBoxSize, height: detailIconBoxSize }}>🚪</span>
                        <div style={styles.detailInfo}>
                          <span style={{ ...styles.detailLabel, fontSize: detailLabelFontSize }}>Room No</span>
                          <span style={{ ...styles.detailValue, fontSize: detailValueFontSize }}>{booking.room_no}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Waiting for approval message */}
                  {booking.status === "pending" && (
                    <div style={styles.waitingMessage}>
                      ⏳ Booking requested — Waiting for owner approval
                    </div>
                  )}

                  {/* Price Section */}
                  <div style={{ ...styles.priceSection, padding: priceSectionPadding }}>
                    {rent > 0 && (
                      <div style={{ ...styles.priceRow, fontSize: priceRowFontSize }}>
                        <span>Rent</span>
                        <span>₹{rent.toLocaleString()}</span>
                      </div>
                    )}

                    {deposit > 0 && (
                      <div style={{ ...styles.priceRow, fontSize: priceRowFontSize }}>
                        <span>Security Deposit</span>
                        <span>₹{deposit.toLocaleString()}</span>
                      </div>
                    )}

                    {maintenance > 0 && (
                      <div style={{ ...styles.priceRow, fontSize: priceRowFontSize }}>
                        <span>Maintenance</span>
                        <span>₹{maintenance.toLocaleString()}</span>
                      </div>
                    )}

                    <div style={{ ...styles.priceRow, fontSize: priceRowFontSize }}>
                      <span>Platform Fee</span>
                      <span>₹99</span>
                    </div>

                    <div style={{ ...styles.priceRow, fontSize: priceRowFontSize }}>
                      <span>Remaining Amount</span>
                      <span>₹{remainingAmount.toLocaleString()}</span>
                    </div>

                    <div style={{ ...styles.totalPrice, fontSize: totalPriceFontSize }}>
                      <span>Total Paid Online</span>
                      <span>₹1099</span>
                    </div>
                  </div>

                  {/* Payment completed message */}
                  {paymentStatus === "paid" && (
                    <div style={styles.paidMessage}>
                      <div style={styles.paidMessageTitle}>✅ Payment Completed! (₹1099)</div>
                      <div style={styles.paidMessageSubtext}>
                        Remaining amount of <strong>₹{remainingAmount.toLocaleString()}</strong> needs to be paid directly to the owner during check-in.
                      </div>
                    </div>
                  )}

                  {/* Message if any */}
                  {paymentDisplay.message && paymentStatus !== "paid" && (
                    <div style={{
                      ...styles.messageBox,
                      ...styles[`messageBox${paymentDisplay.badge?.style}`]
                    }}>
                      {paymentDisplay.message}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={styles.actionGroup}>
                    <div style={{ ...styles.actionButtons, gap: actionButtonsGap }}>
                      <button
                        style={{ ...styles.iconButton, padding: iconButtonPadding, fontSize: iconButtonFontSize }}
                        onClick={() => navigate(`/pg/${booking.pg_id}`)}
                        title="View Property"
                      >
                        <span style={{ ...styles.buttonIcon, fontSize: buttonIconSize }}>🏠</span>
                        <span>View</span>
                      </button>
                      <button
                        style={{
                          ...styles.iconButton,
                          padding: iconButtonPadding,
                          fontSize: iconButtonFontSize,
                          opacity: !me?.id ? 0.5 : 1,
                          cursor: !me?.id ? "not-allowed" : "pointer"
                        }}
                        onClick={() => handleChatNavigation(booking)}
                        disabled={!me?.id}
                        title="Chat with Owner"
                      >
                        <span style={{ ...styles.buttonIcon, fontSize: buttonIconSize }}>💬</span>
                        <span>{!me?.id ? "Loading..." : "Chat"}</span>
                      </button>
                      <button
                        style={{ ...styles.iconButton, padding: iconButtonPadding, fontSize: iconButtonFontSize }}
                        onClick={() => window.open("/e-stamp.jpg", "_blank")}
                        title="Preview Agreement"
                      >
                        <span style={{ ...styles.buttonIcon, fontSize: buttonIconSize }}>📑</span>
                        <span>Preview</span>
                      </button>
                      <button
                        style={{ ...styles.iconButton, padding: iconButtonPadding, fontSize: iconButtonFontSize }}
                        onClick={() => navigate(`/user/services/${booking.id}`)}
                        title="Add Services"
                      >
                        <span style={{ ...styles.buttonIcon, fontSize: buttonIconSize }}>🚚</span>
                        <span>Services</span>
                      </button>
                    </div>

                    {showPayButton && (
                      <button
                        style={{ ...styles.payButton, padding: payButtonPadding, fontSize: payButtonFontSize }}
                        onClick={() => handleShowPaymentDialog(booking)}
                        disabled={payingId === booking.id}
                      >
                        {payingId === booking.id ? (
                          <>
                            <span style={styles.buttonSpinner}></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <span>💳</span>
                            Pay ₹1099 (Booking Token)
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* LEFT STATUS UI */}
                  {booking.status === "left" && (
                    <div style={styles.leftStatusMessage}>
                      🚪 You have vacated - You can book again
                    </div>
                  )}

                  {/* Confirmed Badge */}
                  {booking.status === "confirmed" && paymentStatuses[booking.id] === "paid" && (
                    <div style={styles.confirmedBadge}>
                      <span>✅</span>
                      <span>Booking Confirmed (Payment Received)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && selectedBookingForPayment && (
        <div style={styles.modalOverlay} onClick={closePaymentDialog}>
          <div style={styles.paymentDialogContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirm Payment</h2>
              <button style={styles.modalClose} onClick={closePaymentDialog}>×</button>
            </div>
            
            <div style={styles.paymentDialogBody}>
              <div style={styles.paymentIcon}>💰</div>
              <p style={styles.paymentText}>
                You are about to pay <strong>₹1099</strong> for booking token.
              </p>
              <p style={styles.paymentBreakdown}>
                Breakdown: ₹1000 (Token) + ₹99 (Platform Fee)
              </p>
              <button
                style={styles.confirmPayButton}
                onClick={handlePayNow}
                disabled={payingId === selectedBookingForPayment.id}
              >
                {payingId === selectedBookingForPayment.id ? (
                  <>
                    <span style={styles.buttonSpinner}></span>
                    Processing...
                  </>
                ) : (
                  "Confirm & Pay ₹1099"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {error && (
        <div style={{ ...styles.errorToast, right: errorToastRight, left: errorToastLeft, maxWidth: errorToastMaxWidth }}>
          <span>❌</span>
          <span>{error}</span>
          <button onClick={() => setError("")} style={styles.errorToastClose}>×</button>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

// Styles - Base styles without functions
const styles = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    animation: "slideIn 0.5s ease-out",
    width: "100%",
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  
  header: {
    textAlign: "center",
  },
  
  title: {
    fontWeight: 800,
    color: "#fff",
    marginBottom: 8,
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    letterSpacing: "-0.5px",
    wordBreak: "break-word",
  },
  
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: 400,
  },
  
  tabsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  
  tab: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 40,
    color: "#fff",
    fontWeight: 500,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  
  activeTab: {
    background: "#fff",
    color: "#667eea",
    borderColor: "#fff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  
  tabCount: {
    background: "rgba(0,0,0,0.1)",
    padding: "2px 6px",
    borderRadius: 20,
    fontSize: 11,
    marginLeft: 4,
  },
  
  bookingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  },
  
  card: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    animation: "slideIn 0.5s ease-out",
    border: "1px solid rgba(255,255,255,0.2)",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  
  cardHeader: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  
  cardHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  
  pgName: {
    margin: 0,
    fontWeight: 600,
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    wordBreak: "break-word",
  },
  
  pgLocation: {
    margin: 0,
    opacity: 0.9,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  
  badgeGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  
  statusBadge: {
    borderRadius: 30,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  
  statusConfirmed: {
    background: "#10b981",
    color: "#fff",
  },
  
  statusApproved: {
    background: "#3b82f6",
    color: "#fff",
  },
  
  statusPending: {
    background: "#f59e0b",
    color: "#fff",
  },
  
  statusLeft: {
    background: "#6b7280",
    color: "#fff",
  },
  
  paymentBadge: {
    borderRadius: 30,
    background: "#fff",
  },
  
  paymentBadgepaid: {
    background: "#10b981",
    color: "#fff",
  },
  
  paymentBadgesubmitted: {
    background: "#f59e0b",
    color: "#fff",
  },
  
  paymentBadgerejected: {
    background: "#ef4444",
    color: "#fff",
  },
  
  paymentBadgepending: {
    background: "#6b7280",
    color: "#fff",
  },
  
  cardContent: {},
  
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    marginBottom: 20,
  },
  
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  
  detailIcon: {
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    flexShrink: 0,
  },
  
  detailInfo: {
    flex: 1,
    minWidth: 0,
  },
  
  detailLabel: {
    display: "block",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 2,
  },
  
  detailValue: {
    display: "block",
    fontWeight: 600,
    color: "#1f2937",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
  },
  
  callButton: {
    display: "inline-block",
    background: "#10b981",
    color: "#fff",
    borderRadius: 8,
    fontWeight: 600,
    textDecoration: "none",
  },
  
  waitingMessage: {
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 10,
    textAlign: "center",
    fontWeight: 600,
    marginBottom: 20,
  },
  
  priceSection: {
    background: "#f9fafb",
    borderRadius: 16,
    marginBottom: 20,
  },
  
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#4b5563",
    borderBottom: "1px dashed #e5e7eb",
    flexWrap: "wrap",
    gap: 4,
  },
  
  totalPrice: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "2px solid #e5e7eb",
    fontWeight: 700,
    color: "#1f2937",
    flexWrap: "wrap",
    gap: 4,
  },
  
  paidMessage: {
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 12,
    textAlign: "center",
    fontWeight: 500,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  
  paidMessageTitle: {
    fontWeight: 700,
    marginBottom: 8,
  },
  
  paidMessageSubtext: {
    fontSize: 12,
  },
  
  messageBox: {
    borderRadius: 12,
    marginBottom: 16,
    fontWeight: 500,
  },
  
  messageBoxrejected: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },
  
  messageBoxsubmitted: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  
  messageBoxpaid: {
    background: "#d1fae5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  
  actionButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
  },
  
  iconButton: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: 12,
    fontWeight: 500,
    color: "#4b5563",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  
  buttonIcon: {},
  
  payButton: {
    width: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: 14,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  
  confirmedBadge: {
    marginTop: 16,
    background: "#10b981",
    color: "#fff",
    borderRadius: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
    textAlign: "center",
  },
  
  leftStatusMessage: {
    marginTop: 16,
    background: "#6b7280",
    color: "#fff",
    borderRadius: 12,
    fontWeight: 600,
    textAlign: "center",
  },
  
  emptyState: {
    textAlign: "center",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 32,
    border: "1px solid rgba(255,255,255,0.2)",
  },
  
  emptyIcon: {
    marginBottom: 16,
  },
  
  emptyTitle: {
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 8,
  },
  
  emptyText: {
    color: "#6b7280",
    marginBottom: 24,
  },
  
  browseBtn: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: 40,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  
  loadingSpinner: {
    width: 50,
    height: 50,
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 16,
  },
  
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  
  errorContainer: {
    textAlign: "center",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 32,
    margin: "40px auto",
    maxWidth: 400,
  },
  
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  errorText: {
    color: "#ef4444",
    marginBottom: 24,
  },
  
  retryBtn: {
    background: "#3b82f6",
    border: "none",
    borderRadius: 40,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    animation: "fadeIn 0.3s ease",
  },
  
  paymentDialogContent: {
    background: "#fff",
    borderRadius: 32,
    width: "100%",
    maxWidth: 400,
    position: "relative",
    animation: "slideIn 0.3s ease",
  },
  
  paymentDialogBody: {
    textAlign: "center",
  },
  
  paymentIcon: {
    marginBottom: 16,
  },
  
  paymentText: {
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  
  paymentBreakdown: {
    color: "#6b7280",
    marginBottom: 24,
  },
  
  confirmPayButton: {
    width: "100%",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    borderRadius: 14,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  
  modalHeader: {
    padding: "24px 24px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  
  modalTitle: {
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  },
  
  modalClose: {
    width: 40,
    height: 40,
    background: "#f3f4f6",
    border: "none",
    borderRadius: "50%",
    fontSize: 20,
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  buttonSpinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid #fff",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  
  errorToast: {
    position: "fixed",
    bottom: 20,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontWeight: 500,
    border: "1px solid #fecaca",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    zIndex: 1100,
    animation: "slideIn 0.3s ease",
  },
  
  errorToastClose: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#991b1b",
    marginLeft: "auto",
    padding: "0 4px",
  },
};

export default UserBookingHistory;