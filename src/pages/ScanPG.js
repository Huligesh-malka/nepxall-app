import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_CONFIG } from "../config";
import api from "../api/api";
import { X, BookOpen, Phone, MapPin, Check, Info } from "lucide-react";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ USE AUTH CONTEXT
  const { user, loading: authLoading } = useAuth();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [status, setStatus] = useState(null); // ✅ NEW: For check-in status

  useEffect(() => {
    fetchPG();
  }, [id]);

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

  const handleRoomSelection = (room) => {
    console.log("Selected Room:", room); // 🔥 ADDED FOR CLARITY
    setSelectedRoom(room);
  };

  const getSelectedPrice = () => {
    if (selectedRoom) return selectedRoom.price;
    return null;
  };

  const getSelectedDetails = () => {
    if (selectedRoom) {
      return {
        type: "room",
        name: `Room ${selectedRoom.room_number} (${selectedRoom.sharing_type})`,
        price: selectedRoom.price
      };
    }
    return null;
  };

  // 🔥 FIXED CHECK-IN FUNCTION WITH CASE HANDLING
  const handleCheckin = async () => {
    try {
      // ✅ Redirect with state if not logged in
      if (!user) {
        navigate("/login", {
          state: { redirectTo: `/scan/${id}` }
        });
        return;
      }

      // ✅ Debug logging
      console.log("USER:", user);
      
      const token = await user.getIdToken();
      console.log("TOKEN:", token ? "Present" : "Missing");

      const res = await api.post(
        `/scan/checkin`,
        { pg_id: id },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = res.data;

      // 🔥 HANDLE ALL CASES
      if (data.type === "NOT_JOINED") {
        setStatus({
          success: false,
          message: "🏠 Please join this PG first"
        });
        return;
      }

      if (data.type === "NOT_PAID") {
        setStatus({
          success: false,
          message: "❌ You have not paid. Please pay first"
        });
        return;
      }

      if (data.type === "READY_TO_JOIN") { // 🔥 NEW CASE
        setStatus({
          success: false,
          message: "Select a room to join"
        });
        return;
      }

      if (data.type === "SUCCESS") {
        setStatus({
          success: true,
          message: data.message || "✅ ACCESS GRANTED"
        });
        return;
      }

      // Fallback
      setStatus({
        success: true,
        message: res.data.message || "✅ Check-in successful!"
      });

    } catch (err) {
      console.error("Check-in error:", err);
      
      // ✅ Set error status
      setStatus({
        success: false,
        message: err.response?.data?.message || "❌ Check-in failed. Please try again."
      });
    }
  };

  // 🔥 FIXED JOIN FUNCTION WITH ROOM SELECTION
  const handleJoin = async () => {
  try {
    if (!selectedRoom) {
      setStatus({
        success: false,
        message: "❌ Please select a room first"
      });
      return;
    }

    console.log("SENDING ROOM:", selectedRoom.room_number); // ✅ DEBUG

    const token = await user.getIdToken();

    const res = await api.post(
      `/scan/join`,
      {
        pg_id: id,
        room_id: selectedRoom.room_number   // ✅ FIXED HERE
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setStatus({
      success: true,
      message: "🎉 Joined successfully with selected room"
    });

    setTimeout(() => {
      fetchPG();
    }, 1000);

  } catch (err) {
    console.error("Join error:", err);
    setStatus({
      success: false,
      message: err.response?.data?.message || "❌ Join failed"
    });
  }
};

  const handleBookNow = () => {
    const selected = getSelectedDetails();
    if (!selected) {
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

    if (price_details.sharing) {
      if (price_details.sharing.single_sharing && price_details.sharing.single_sharing > 0) {
        prices.push({
          label: "Single Sharing",
          price: price_details.sharing.single_sharing,
          type: "pg"
        });
      }
      if (price_details.sharing.double_sharing && price_details.sharing.double_sharing > 0) {
        prices.push({
          label: "Double Sharing",
          price: price_details.sharing.double_sharing,
          type: "pg"
        });
      }
      if (price_details.sharing.triple_sharing && price_details.sharing.triple_sharing > 0) {
        prices.push({
          label: "Triple Sharing",
          price: price_details.sharing.triple_sharing,
          type: "pg"
        });
      }
      if (price_details.sharing.four_sharing && price_details.sharing.four_sharing > 0) {
        prices.push({
          label: "Four Sharing",
          price: price_details.sharing.four_sharing,
          type: "pg"
        });
      }
      if (price_details.sharing.single_room && price_details.sharing.single_room > 0) {
        prices.push({
          label: "Single Room",
          price: price_details.sharing.single_room,
          type: "pg"
        });
      }
      if (price_details.sharing.double_room && price_details.sharing.double_room > 0) {
        prices.push({
          label: "Double Room",
          price: price_details.sharing.double_room,
          type: "pg"
        });
      }
    }

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

    if (price_details.to_let?.prices) {
      if (price_details.to_let.prices['1bhk'] && price_details.to_let.prices['1bhk'] > 0) {
        prices.push({
          label: "1 BHK",
          price: price_details.to_let.prices['1bhk'],
          type: "tolet",
          config: price_details.to_let.configurations?.['1bhk']
        });
      }
      if (price_details.to_let.prices['2bhk'] && price_details.to_let.prices['2bhk'] > 0) {
        prices.push({
          label: "2 BHK",
          price: price_details.to_let.prices['2bhk'],
          type: "tolet",
          config: price_details.to_let.configurations?.['2bhk']
        });
      }
      if (price_details.to_let.prices['3bhk'] && price_details.to_let.prices['3bhk'] > 0) {
        prices.push({
          label: "3 BHK",
          price: price_details.to_let.prices['3bhk'],
          type: "tolet",
          config: price_details.to_let.configurations?.['3bhk']
        });
      }
      if (price_details.to_let.prices['4bhk'] && price_details.to_let.prices['4bhk'] > 0) {
        prices.push({
          label: "4 BHK",
          price: price_details.to_let.prices['4bhk'],
          type: "tolet",
          config: price_details.to_let.configurations?.['4bhk']
        });
      }
    }

    return prices;
  };

  const getRoomTypes = () => {
    if (!pg) return [];
    
    const types = [];
    
    if (pg.category === "to_let") {
      if (pg.price_details?.to_let?.prices?.['1bhk']) types.push({ 
        value: "1 BHK", 
        label: `1 BHK - ₹${formatPrice(pg.price_details.to_let.prices['1bhk'])}` 
      });
      if (pg.price_details?.to_let?.prices?.['2bhk']) types.push({ 
        value: "2 BHK", 
        label: `2 BHK - ₹${formatPrice(pg.price_details.to_let.prices['2bhk'])}` 
      });
      if (pg.price_details?.to_let?.prices?.['3bhk']) types.push({ 
        value: "3 BHK", 
        label: `3 BHK - ₹${formatPrice(pg.price_details.to_let.prices['3bhk'])}` 
      });
      if (pg.price_details?.to_let?.prices?.['4bhk']) types.push({ 
        value: "4 BHK", 
        label: `4 BHK - ₹${formatPrice(pg.price_details.to_let.prices['4bhk'])}` 
      });
    } else if (pg.category === "coliving") {
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
      if (pg.price_details?.sharing?.single_room) types.push({ 
        value: "Single Room", 
        label: `Single Room - ₹${formatPrice(pg.price_details.sharing.single_room)}` 
      });
      if (pg.price_details?.sharing?.double_room) types.push({ 
        value: "Double Room", 
        label: `Double Room - ₹${formatPrice(pg.price_details.sharing.double_room)}` 
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

  const selectedDetails = getSelectedDetails();
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

      {/* ✅ UPDATED STATUS UI WITH JOIN BUTTON */}
      {status && (
        <div style={{
          marginTop: 20,
          marginBottom: 20,
          padding: 16,
          borderRadius: 12,
          background: status.success ? "#d1fae5" : "#fee2e2",
          color: status.success ? "#065f46" : "#991b1b",
          textAlign: "center",
          border: `2px solid ${status.success ? "#10b981" : "#ef4444"}`,
          animation: "slideDown 0.3s ease"
        }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
            {status.success ? "✅ " : "❌ "}
            {status.message}
          </p>

          {/* 🔥 SHOW JOIN BUTTON only after room selection */}
          {status.message && 
           status.message.toLowerCase().includes("join") && 
           selectedRoom && (
            <button 
              onClick={handleJoin}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.background = "#059669"}
              onMouseLeave={(e) => e.target.style.background = "#10b981"}
            >
              ✅ Join PG
            </button>
          )}

          {/* 🔥 Optional: Show retry button for other errors */}
          {!status.success && 
           status.message && 
           !status.message.toLowerCase().includes("join") && (
            <button 
              onClick={handleCheckin}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              Try Again
            </button>
          )}
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

      {/* 🔥 ROOM SECTION WITH CONDITIONAL RENDERING */}
      <div style={styles.roomSection}>
        <h2 style={styles.sectionTitle}>Select Your Room</h2>
        
        {pg.available_room_details && pg.available_room_details.length > 0 ? (
          <>
            <div style={styles.roomGrid}>
              {pg.available_room_details.map((room, index) => {
                const roomDisplayName = getRoomDisplayName(room);
                const isSelected = selectedRoom?.room_number === room.room_number;
                
                return (
                  <div
                    key={index}
                    style={{
                      ...styles.roomCard,
                      ...(isSelected ? styles.roomCardSelected : {}),
                      ...(room.available_beds === 0 ? styles.roomCardSoldOut : {})
                    }}
                    onClick={() => room.available_beds > 0 && handleRoomSelection(room)}
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
                      {isSelected && (
                        <span style={styles.selectedBadge}>✓ Selected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🔥 SHOW SELECTED ROOM INFO */}
            {selectedRoom && (
              <div style={{
                marginTop: 12,
                padding: 10,
                background: "#ecfdf5",
                borderRadius: 8,
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "500",
                color: "#065f46"
              }}>
                ✅ Selected: Room {selectedRoom.room_number}
              </div>
            )}
          </>
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
                {item.config && (
                  <div style={styles.priceCardConfig}>
                    {item.config.bedrooms} bed • {item.config.bathrooms} bath
                  </div>
                )}
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
              {pg.price_details?.brokerage_amount > 0 && (
                <div style={styles.chargeRow}>
                  <span>Brokerage</span>
                  <span style={styles.chargeValue}>₹{formatPrice(pg.price_details.brokerage_amount)}</span>
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

      {/* ✅ FOOTER SECTION WITH SMALLER BUTTONS */}
      <div style={styles.footer}>
        <div style={styles.buttonGroup}>
          <button 
            onClick={handleCheckin} 
            style={styles.checkinBtn}
          >
            📍 {user ? 'Check-in' : 'Login'}
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
                    {pg?.category === "to_let" ? "BHK Type *" : "Room Type *"}
                  </label>
                  <select
                    name="roomType"
                    required
                    disabled={bookingLoading}
                    style={styles.formSelect}
                    defaultValue={selectedRoom ? getRoomDisplayName(selectedRoom) : ''}
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
  selectedBadge: {
    fontSize: "12px",
    color: "#4f46e5",
    fontWeight: "600"
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
    color: "#4f46e5",
    marginBottom: "3px"
  },
  priceCardConfig: {
    fontSize: "10px",
    color: "#9ca3af"
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
    padding: "10px",
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  bookBtn: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  callBtn: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#ffffff",
    color: "#22c55e",
    border: "2px solid #22c55e",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "13px",
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

const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default ScanPG;