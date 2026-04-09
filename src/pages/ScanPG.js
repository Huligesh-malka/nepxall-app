import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_CONFIG } from "../config";
import api from "../api/api";
import { X, BookOpen, Phone, MapPin, Check, Info, AlertCircle } from "lucide-react";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading: authLoading } = useAuth();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [status, setStatus] = useState(null);
  const [joined, setJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    fetchPG();
    // Check if user has already joined on page load
    if (user) {
      checkExistingJoin();
    }
  }, [id, user]);

  const fetchPG = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_CONFIG.USER_API_URL}/scan/${id}`);

      if (res.data.success) {
        setPg(res.data.data);
        console.log("PG Data:", res.data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Check existing join
  const checkExistingJoin = async () => {
    try {
      const token = await user.getIdToken();
      const res = await api.post(
        `/scan/checkin`,
        { pg_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Only set joined when type is ALREADY_JOINED
      if (res.data.type === "ALREADY_JOINED") {
        setJoined(true);
        setStatus({
          success: true,
          message: "✅ You have already joined this PG",
        });
      }
    } catch (err) {
      console.log("Check existing join error:", err);
    }
  };

  const handleRoomSelection = (room) => {
    if (room.available_beds === 0) return;
    setSelectedRoom(room);
  };

  // ✅ FIXED: CHECK-IN BUTTON HANDLER with all backend types
  const handleCheckin = async () => {
    if (!user) {
      navigate("/login", { state: { redirectTo: `/scan/${id}` } });
      return;
    }

    // Reset states
    setShowConfirmBox(false);
    setConfirmChecked(false);
    setStatus(null);

    try {
      const token = await user.getIdToken();
      
      const res = await api.post(
        `/scan/checkin`,
        { pg_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;

      // ✅ CASE: Already joined
      if (data.type === "ALREADY_JOINED") {
        setJoined(true);
        setStatus({
          success: true,
          message: data.message || "✅ You have already joined this PG"
        });
        return;
      }

      // ❌ CASE: Not active user
      if (data.type === "NOT_ACTIVE") {
        setStatus({
          success: false,
          message: data.message || "❌ Not approved by owner"
        });
        return;
      }

      // ❌ CASE: Payment pending
      if (data.type === "PAYMENT_PENDING") {
        setStatus({
          success: false,
          message: "💰 Payment required. Redirecting..."
        });

        // Redirect to payment page after 1.5 seconds
        setTimeout(() => {
          navigate(`/payment/${id}`);
        }, 1500);
        return;
      }

      // ❌ CASE: No booking
      if (data.type === "NO_BOOKING") {
        setStatus({
          success: false,
          message: "❌ No booking found. Please book first."
        });
        return;
      }

      // ✅ CASE: Allow join (IMPORTANT - replaces CONFIRM_JOIN)
      if (data.type === "ALLOW_JOIN") {
        setBookingId(data.booking_id);
        setShowConfirmBox(true);
        setStatus({
          success: true,
          message: "✅ Payment verified. Please confirm to join"
        });

        // Scroll to confirmation box
        document.getElementById('confirm-box')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        return;
      }

      // Fallback for any other response
      if (!data.success) {
        setStatus({
          success: false,
          message: data.message || "❌ Check-in failed",
        });
      }

    } catch (err) {
      console.error("Check-in error:", err);
      const errMsg = err.response?.data?.message || "❌ Check-in failed";
      setStatus({ success: false, message: errMsg });
      
      if (err.response?.status === 404) {
        showNotificationMessage("Profile missing. Please complete registration.");
        setTimeout(() => {
          navigate("/register", { 
            state: { 
              redirectTo: `/scan/${id}`,
              message: "Please complete your profile registration"
            } 
          });
        }, 2000);
      }
    }
  };

  // ✅ JOIN BUTTON HANDLER - Called when user confirms
  const handleJoin = async () => {
    if (joinLoading || joined) return;
    
    setJoinLoading(true);

    try {
      const token = await user.getIdToken();

      const res = await api.post(
        `/scan/join`,
        {
          pg_id: id,
          room_id: selectedRoom?.id || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        setJoined(true);
        setShowConfirmBox(false);
        setConfirmChecked(false);
        setStatus({
          success: true,
          message: res.data.message || "🎉 Successfully joined PG!"
        });
        fetchPG(); // Refresh data
        showNotificationMessage("🎉 Successfully joined PG!");
        
        // Auto refresh after 1 second for better UX
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setStatus({
          success: false,
          message: res.data.message || "❌ Join failed"
        });
      }
    } catch (err) {
      console.error("Join error:", err);
      setStatus({
        success: false,
        message: err.response?.data?.message || "❌ Join failed. Please try again."
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!selectedRoom) {
      alert("Please select a room to proceed");
      return;
    }

    if (!user) {
      showNotificationMessage("Please register or login to book this property");
      navigate("/register", {
        state: { redirectTo: `/scan/${id}` }
      });
      return;
    }

    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (bookingLoading) return;

      setBookingLoading(true);

      if (!user) {
        showNotificationMessage("Please login to continue");
        navigate("/login");
        return;
      }

      const token = await user.getIdToken(true);

      const payload = {
        name: bookingData.name,
        phone: bookingData.phone,
        check_in_date: bookingData.checkInDate,
        room_type: bookingData.roomType,
        room_number: selectedRoom?.room_number,
        sharing_type: selectedRoom?.sharing_type,
        rent_amount: selectedRoom?.price
      };

      const res = await api.post(
        `/bookings/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showNotificationMessage(
        res.data?.message || "✅ Booking request sent to owner"
      );

      setShowBookingModal(false);
      setSelectedRoom(null);

    } catch (error) {
      console.log("BOOKING ERROR:", error?.response?.data);

      if (error?.response?.data?.message) {
        showNotificationMessage(error.response.data.message);
      } else {
        showNotificationMessage("❌ Booking failed. Try again");
      }

    } finally {
      setBookingLoading(false);
    }
  };

  const handleCallOwner = () => {
    if (pg.contact?.phone) {
      window.location.href = `tel:${pg.contact.phone}`;
    }
  };

  const showNotificationMessage = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const goToFullDetails = () => {
    navigate(`/pg/${id}`);
  };

  const formatPrice = (price) => {
    if (!price || price === 0 || price === "0" || price === "") return "0";
    return Number(price).toLocaleString('en-IN');
  };

  const getRoomDisplayName = (room) => {
    if (room.sharing_type?.toLowerCase().includes('single')) return 'Single Sharing';
    if (room.sharing_type?.toLowerCase().includes('double')) return 'Double Sharing';
    if (room.sharing_type?.toLowerCase().includes('triple')) return 'Triple Sharing';
    if (room.sharing_type?.toLowerCase().includes('four')) return 'Four Sharing';
    return room.sharing_type || 'Standard Room';
  };

  const getAllPropertyPrices = () => {
    if (!pg?.price_details) return [];
    
    const prices = [];
    const { price_details } = pg;

    if (price_details.co_living) {
      if (price_details.co_living.single_room && price_details.co_living.single_room > 0) {
        prices.push({
          label: "Co-living Single",
          price: price_details.co_living.single_room,
          type: "coliving"
        });
      }
      if (price_details.co_living.double_room && price_details.co_living.double_room > 0) {
        prices.push({
          label: "Co-living Double",
          price: price_details.co_living.double_room,
          type: "coliving"
        });
      }
    }

    if (price_details.sharing) {
      if (price_details.sharing.single_sharing && price_details.sharing.single_sharing > 0) {
        prices.push({ label: "Single Sharing", price: price_details.sharing.single_sharing, type: "pg" });
      }
      if (price_details.sharing.double_sharing && price_details.sharing.double_sharing > 0) {
        prices.push({ label: "Double Sharing", price: price_details.sharing.double_sharing, type: "pg" });
      }
      if (price_details.sharing.triple_sharing && price_details.sharing.triple_sharing > 0) {
        prices.push({ label: "Triple Sharing", price: price_details.sharing.triple_sharing, type: "pg" });
      }
      if (price_details.sharing.four_sharing && price_details.sharing.four_sharing > 0) {
        prices.push({ label: "Four Sharing", price: price_details.sharing.four_sharing, type: "pg" });
      }
    }

    return prices;
  };

  const getRoomTypes = () => {
    if (!pg) return [];
    
    const types = [];
    
    if (pg.category === "coliving") {
      if (pg.price_details?.co_living?.single_room) types.push({ 
        value: "Co-Living Single Room", 
        label: `Co-Living Single Room - ₹${formatPrice(pg.price_details.co_living.single_room)}` 
      });
      if (pg.price_details?.co_living?.double_room) types.push({ 
        value: "Co-Living Double Room", 
        label: `Co-Living Double Room - ₹${formatPrice(pg.price_details.co_living.double_room)}` 
      });
    } else {
      if (pg.price_details?.sharing?.single_sharing) types.push({ 
        value: "Single Sharing", 
        label: `Single Sharing - ₹${formatPrice(pg.price_details.sharing.single_sharing)}` 
      });
      if (pg.price_details?.sharing?.double_sharing) types.push({ 
        value: "Double Sharing", 
        label: `Double Sharing - ₹${formatPrice(pg.price_details.sharing.double_sharing)}` 
      });
      if (pg.price_details?.sharing?.triple_sharing) types.push({ 
        value: "Triple Sharing", 
        label: `Triple Sharing - ₹${formatPrice(pg.price_details.sharing.triple_sharing)}` 
      });
      if (pg.price_details?.sharing?.four_sharing) types.push({ 
        value: "Four Sharing", 
        label: `Four Sharing - ₹${formatPrice(pg.price_details.sharing.four_sharing)}` 
      });
    }
    
    return types;
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loader}>Loading property details...</div>
      </div>
    );
  }

  if (!pg) {
    return (
      <div style={styles.center}>
        <div style={styles.notFound}>
          <span style={styles.notFoundEmoji}>🏠❌</span>
          <h3>Property not found or link expired</h3>
          <button onClick={() => navigate('/')} style={styles.homeBtn}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const propertyPrices = getAllPropertyPrices();

  return (
    <div style={styles.container}>
      {notification && (
        <div style={styles.notification}>
          {notification.includes("✅") ? <Check size={18} /> : 
           notification.includes("❌") ? <X size={18} /> : 
           <Info size={18} />}
          {notification}
        </div>
      )}

      {/* Status Message */}
      {status && !showConfirmBox && (
        <div style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: 12,
          background: status.success ? "#d1fae5" : "#fee2e2",
          color: status.success ? "#065f46" : "#991b1b",
          textAlign: "center",
          border: `1px solid ${status.success ? "#10b981" : "#ef4444"}`,
        }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>
            {status.message}
          </p>
        </div>
      )}

      {/* CONFIRMATION BOX - Shows when user clicks Check-in and has valid booking */}
      {showConfirmBox && (
        <div id="confirm-box" style={styles.confirmBox}>
          <div style={styles.confirmBoxHeader}>
            <AlertCircle size={24} color="#f59e0b" />
            <h3 style={styles.confirmBoxTitle}>Confirm Join</h3>
          </div>
          
          {/* ✅ FIXED: Updated confirmation message text */}
          <p style={styles.confirmBoxMessage}>
            ✅ Payment verified. Confirm to check-in to this PG.
          </p>

          {/* Room Selection Info */}
          {pg.available_room_details && pg.available_room_details.length > 0 && (
            <div style={styles.roomSelectionBox}>
              <p style={styles.roomSelectionLabel}>Select a room (optional):</p>
              <div style={styles.confirmRoomGrid}>
                {pg.available_room_details.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomSelection(room)}
                    style={{
                      ...styles.confirmRoomBtn,
                      ...(selectedRoom?.id === room.id ? styles.confirmRoomBtnSelected : {})
                    }}
                  >
                    {getRoomDisplayName(room)} - Room {room.room_number}
                    {room.available_beds > 0 && <span style={styles.roomPrice}>₹{formatPrice(room.price)}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checkbox and Join Button */}
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              style={styles.checkbox}
            />
            <span>I confirm that I want to join this PG</span>
          </label>

          <div style={styles.confirmBoxActions}>
            <button
              onClick={() => {
                setShowConfirmBox(false);
                setStatus(null);
                setConfirmChecked(false);
              }}
              style={styles.cancelConfirmBtn}
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={!confirmChecked || joinLoading}
              style={{
                ...styles.confirmJoinBtn,
                ...(!confirmChecked || joinLoading ? styles.confirmJoinBtnDisabled : {})
              }}
            >
              {joinLoading ? "⏳ Joining..." : "✅ Confirm & Join"}
            </button>
          </div>
        </div>
      )}

      <div style={styles.headerSection}>
        <h1 style={styles.title}>{pg.name}</h1>
        <div style={styles.locationRow}>
          <MapPin size={16} style={styles.locationIcon} />
          <span style={styles.locationText}>
            {pg.location?.area}, {pg.location?.city}
          </span>
        </div>
        <div style={styles.typeBadge}>
          {pg.category === "to_let" ? "🏠 House/Flat" : 
           pg.category === "coliving" ? "🤝 Co-Living" : 
           "🏢 PG/Hostel"}
        </div>
      </div>

      {/* Room Section */}
      <div style={styles.roomSection}>
        <h2 style={styles.sectionTitle}>Select Your Room</h2>
        
        {pg.available_room_details && pg.available_room_details.length > 0 ? (
          <div style={styles.roomGrid}>
            {pg.available_room_details.map((room, index) => {
              const roomDisplayName = getRoomDisplayName(room);
              const isSelected = selectedRoom?.id === room.id;
              
              return (
                <div
                  key={index}
                  style={{
                    ...styles.roomCard,
                    ...(isSelected ? styles.roomCardSelected : {}),
                    ...(room.available_beds === 0 ? styles.roomCardSoldOut : {})
                  }}
                  onClick={() => handleRoomSelection(room)}
                >
                  <div style={styles.roomCardHeader}>
                    <span style={styles.roomName}>{roomDisplayName}</span>
                    {room.available_beds > 0 ? (
                      <span style={styles.roomAvailability}>● {room.available_beds} left</span>
                    ) : (
                      <span style={styles.roomSoldOut}>Sold Out</span>
                    )}
                  </div>
                  
                  <div style={styles.roomFooter}>
                    <span style={styles.roomNumber}>Room {room.room_number}</span>
                    <span style={styles.roomPriceDisplay}>₹{formatPrice(room.price)}/month</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.noRooms}>
            <p>No rooms currently available</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Please join this PG to check room availability
            </p>
          </div>
        )}
      </div>

      {propertyPrices.length > 0 && (
        <div style={styles.priceSection}>
          <h3 style={styles.subSectionTitle}>Available Price Options</h3>
          
          <div style={styles.priceGrid}>
            {propertyPrices.map((item, index) => (
              <div key={index} style={styles.priceCard}>
                <div style={styles.priceCardLabel}>{item.label}</div>
                <div style={styles.priceCardValue}>₹{formatPrice(item.price)}/month</div>
              </div>
            ))}
          </div>

          <div style={styles.additionalCharges}>
            <h4 style={styles.chargesTitle}>Additional Charges</h4>
            <div style={styles.chargesList}>
              {pg.price_details?.deposit_amount > 0 && (
                <div style={styles.chargeRow}>
                  <span>Security Deposit</span>
                  <span style={styles.chargeValue}>₹{formatPrice(pg.price_details.deposit_amount)}</span>
                </div>
              )}
              {pg.price_details?.maintenance_amount > 0 && (
                <div style={styles.chargeRow}>
                  <span>Maintenance</span>
                  <span style={styles.chargeValue}>₹{formatPrice(pg.price_details.maintenance_amount)}/month</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={goToFullDetails} style={styles.viewDetailsBtn}>
        <span>View Full Property Details</span>
        <span style={styles.viewDetailsArrow}>→</span>
      </button>

      {/* Footer Buttons */}
      <div style={styles.footer}>
        <div style={styles.buttonGroup}>
          <button 
            onClick={handleCheckin} 
            style={{
              ...styles.checkinBtn,
              background: joined ? "#10b981" : "#4f46e5"
            }}
            disabled={joined}
          >
            {joined ? '✅ Checked-In' : user ? '📍 Check-in' : '🔑 Login to Join'}
          </button>

          <button
            onClick={handleBookNow}
            style={{
              ...styles.bookBtn,
              opacity: selectedRoom ? 1 : 0.5,
              cursor: selectedRoom ? 'pointer' : 'not-allowed'
            }}
            disabled={!selectedRoom}
          >
            <BookOpen size={16} style={{ marginRight: 6 }} />
            {selectedRoom ? 'Book' : 'Select Room'}
          </button>

          {pg.contact?.phone && (
            <button onClick={handleCallOwner} style={styles.callBtn}>
              <Phone size={16} style={{ marginRight: 6 }} />
              Call
            </button>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button
              onClick={() => setShowBookingModal(false)}
              disabled={bookingLoading}
              style={styles.modalClose}
            >
              <X size={24} />
            </button>

            <div style={styles.modalBody}>
              <h2 style={styles.modalTitle}>
                🏠 Book {pg?.name}
              </h2>
              <p style={styles.modalSubtitle}>
                Fill in your details to book this property
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = {
                  name: e.target.name.value,
                  phone: e.target.phone.value,
                  checkInDate: e.target.checkInDate.value,
                  roomType: e.target.roomType.value
                };
                handleBookingSubmit(formData);
              }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    disabled={bookingLoading}
                    style={styles.formInput}
                    placeholder="Enter your full name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    disabled={bookingLoading}
                    style={styles.formInput}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    name="checkInDate"
                    required
                    disabled={bookingLoading}
                    style={styles.formInput}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Room Type *
                  </label>
                  <select
                    name="roomType"
                    required
                    disabled={bookingLoading}
                    style={styles.formSelect}
                    defaultValue=""
                  >
                    <option value="" disabled>Select room type</option>
                    {getRoomTypes().map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    disabled={bookingLoading}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    style={styles.submitBtn}
                  >
                    {bookingLoading ? (
                      <>
                        <div style={styles.spinner}></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <BookOpen size={16} />
                        Submit Booking
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "24px 20px 100px 20px",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#ffffff"
  },
  loader: {
    fontSize: "18px",
    color: "#4f46e5",
    fontWeight: "500"
  },
  notFound: {
    textAlign: "center",
    padding: "40px"
  },
  notFoundEmoji: {
    fontSize: "48px",
    display: "block",
    marginBottom: "20px"
  },
  homeBtn: {
    padding: "12px 24px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "20px"
  },
  notification: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#10b981",
    color: "white",
    padding: "10px 20px",
    borderRadius: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    zIndex: 4000,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "13px"
  },
  confirmBox: {
    backgroundColor: "#fffbeb",
    border: "2px solid #f59e0b",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.1)"
  },
  confirmBoxHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px"
  },
  confirmBoxTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#92400e",
    margin: 0
  },
  confirmBoxMessage: {
    fontSize: "14px",
    color: "#78350f",
    marginBottom: "16px",
    lineHeight: 1.5
  },
  roomSelectionBox: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fef3c7",
    borderRadius: "12px"
  },
  roomSelectionLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#92400e",
    marginBottom: "10px"
  },
  confirmRoomGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  confirmRoomBtn: {
    padding: "10px",
    backgroundColor: "#fff",
    border: "1px solid #fcd34d",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  confirmRoomBtnSelected: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
    fontWeight: "500"
  },
  roomPrice: {
    fontSize: "12px",
    color: "#b45309",
    fontWeight: "600"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#78350f"
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer"
  },
  confirmBoxActions: {
    display: "flex",
    gap: "12px"
  },
  cancelConfirmBtn: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    color: "#6b7280"
  },
  confirmJoinBtn: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    color: "white"
  },
  confirmJoinBtnDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
    opacity: 0.6
  },
  headerSection: {
    marginBottom: "32px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0"
  },
  locationRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px"
  },
  locationIcon: {
    color: "#6b7280"
  },
  locationText: {
    fontSize: "14px",
    color: "#6b7280"
  },
  typeBadge: {
    display: "inline-block",
    backgroundColor: "#f3f4f6",
    padding: "4px 12px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#4b5563"
  },
  roomSection: {
    marginBottom: "32px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 16px 0"
  },
  subSectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 12px 0"
  },
  roomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px"
  },
  roomCard: {
    backgroundColor: "#ffffff",
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  roomCardSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#f5f3ff",
    transform: "scale(1.01)",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)"
  },
  roomCardSoldOut: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  roomCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  roomName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827"
  },
  roomAvailability: {
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "500",
    backgroundColor: "#d1fae5",
    padding: "3px 8px",
    borderRadius: "20px"
  },
  roomSoldOut: {
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "500",
    backgroundColor: "#fee2e2",
    padding: "3px 8px",
    borderRadius: "20px"
  },
  roomFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "10px"
  },
  roomNumber: {
    fontSize: "13px",
    color: "#6b7280"
  },
  roomPriceDisplay: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#4f46e5"
  },
  noRooms: {
    textAlign: "center",
    padding: "30px",
    backgroundColor: "#f9fafb",
    borderRadius: "16px",
    border: "2px dashed #e5e7eb",
    color: "#6b7280",
    fontSize: "14px"
  },
  priceSection: {
    backgroundColor: "#f9fafb",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "24px"
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px",
    marginBottom: "16px"
  },
  priceCard: {
    backgroundColor: "#ffffff",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    textAlign: "center"
  },
  priceCardLabel: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "6px",
    fontWeight: "500"
  },
  priceCardValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#4f46e5"
  },
  additionalCharges: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "16px",
    marginTop: "6px"
  },
  chargesTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 10px 0"
  },
  chargesList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  chargeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    padding: "3px 0"
  },
  chargeValue: {
    fontWeight: "600",
    color: "#111827"
  },
  viewDetailsBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  viewDetailsArrow: {
    fontSize: "18px"
  },
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "12px 20px",
    borderTop: "1px solid #e5e7eb",
    boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  checkinBtn: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  bookBtn: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  callBtn: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#ffffff",
    color: "#22c55e",
    border: "2px solid #22c55e",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    padding: 20
  },
  modalContent: {
    background: "#ffffff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
  },
  modalClose: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "rgba(255,255,255,0.9)",
    border: "none",
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  modalBody: {
    padding: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 20
  },
  formGroup: {
    marginBottom: 16
  },
  formLabel: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 500,
    color: "#374151"
  },
  formInput: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 13,
    background: "#f9fafb"
  },
  formSelect: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 13,
    background: "#f9fafb"
  },
  formActions: {
    display: "flex",
    gap: 10,
    marginTop: 20
  },
  cancelBtn: {
    flex: 1,
    padding: "10px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  submitBtn: {
    flex: 2,
    padding: "10px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default ScanPG;