import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";
import api from "../api/api";
import { auth } from "../firebase";
import { X, BookOpen, Phone, MapPin, Check, Info } from "lucide-react";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [notification, setNotification] = useState(null);

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

  //////////////////////////////////////////////////////
  // 🏷 BOOK NOW CLICK - EXACT SAME AS PGDetails
  //////////////////////////////////////////////////////
  const handleBookNow = () => {
    const selected = getSelectedDetails();
    if (!selected) {
      alert("Please select a room to proceed");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      showNotificationMessage("Please register or login to book this property");
      navigate("/register", {
        state: { redirectTo: `/scan/${id}` }
      });
      return;
    }

    setShowBookingModal(true);
  };

  //////////////////////////////////////////////////////
  // 📝 BOOKING SUBMIT - EXACT SAME AS PGDetails
  //////////////////////////////////////////////////////
  const handleBookingSubmit = async (bookingData) => {
    try {
      if (bookingLoading) return;

      setBookingLoading(true);

      const user = auth.currentUser;

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

      // ✅ SUCCESS
      showNotificationMessage(
        res.data?.message || "✅ Booking request sent to owner"
      );

      setShowBookingModal(false);
      setSelectedRoom(null);

    } catch (error) {
      console.log("BOOKING ERROR:", error?.response?.data);

      // ⚠️ REAL BACKEND MESSAGE
      if (error?.response?.data?.message) {
        showNotificationMessage(error.response.data.message);
      } else {
        showNotificationMessage("❌ Booking failed. Try again");
      }

    } finally {
      setBookingLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // 📞 CALL OWNER
  //////////////////////////////////////////////////////
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

  // Format price with commas
  const formatPrice = (price) => {
    if (!price || price === 0 || price === "0" || price === "") return "0";
    return Number(price).toLocaleString('en-IN');
  };

  // Get room display name
  const getRoomDisplayName = (room) => {
    if (room.sharing_type?.toLowerCase().includes('single')) return 'Single Sharing';
    if (room.sharing_type?.toLowerCase().includes('double')) return 'Double Sharing';
    if (room.sharing_type?.toLowerCase().includes('triple')) return 'Triple Sharing';
    if (room.sharing_type?.toLowerCase().includes('four')) return 'Four Sharing';
    return room.sharing_type || 'Standard Room';
  };

  // Get all available prices based on property type
  const getAllPropertyPrices = () => {
    if (!pg?.price_details) return [];
    
    const prices = [];
    const { price_details } = pg;

    // PG/Hostel Prices
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

    // Co-living Prices
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

    // To-let/BHK Prices
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

  // Get room types for booking modal
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
      {/* Notification Toast */}
      {notification && (
        <div style={styles.notification}>
          {notification.includes("✅") ? <Check size={18} /> : 
           notification.includes("❌") ? <X size={18} /> : 
           <Info size={18} />}
          {notification}
        </div>
      )}

      {/* Header with PG Name and Location */}
      <div style={styles.headerSection}>
        <h1 style={styles.title}>{pg.name}</h1>
        <div style={styles.locationRow}>
          <MapPin size={16} style={styles.locationIcon} />
          <span style={styles.locationText}>
            {pg.location?.area}, {pg.location?.city}
          </span>
        </div>
        {/* Property Type Badge */}
        <div style={styles.typeBadge}>
          {pg.category === "to_let" ? "🏠 House/Flat" : 
           pg.category === "coliving" ? "🤝 Co-Living" : 
           "🏢 PG/Hostel"}
        </div>
      </div>

      {/* Room Selection Section */}
      <div style={styles.roomSection}>
        <h2 style={styles.sectionTitle}>Select Your Room</h2>
        
        {pg.available_room_details && pg.available_room_details.length > 0 ? (
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
        ) : (
          <div style={styles.noRooms}>
            <p>No rooms currently available</p>
          </div>
        )}
      </div>

      {/* Price Details Section - Shows all available prices */}
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

          {/* Additional Charges */}
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

      {/* View Full Details Button */}
      <button onClick={goToFullDetails} style={styles.viewDetailsBtn}>
        <span>View Full Property Details</span>
        <span style={styles.viewDetailsArrow}>→</span>
      </button>

      {/* Footer Actions */}
      <div style={styles.footer}>
        <button
          onClick={handleBookNow}
          style={{
            ...styles.bookBtn,
            opacity: selectedRoom ? 1 : 0.5,
            cursor: selectedRoom ? 'pointer' : 'not-allowed'
          }}
          disabled={!selectedRoom}
        >
          <BookOpen size={18} style={{ marginRight: 8 }} />
          {selectedRoom ? 'Book Now' : 'Select a room to continue'}
        </button>

        {pg.contact?.phone && (
          <button onClick={handleCallOwner} style={styles.callBtn}>
            <Phone size={18} style={{ marginRight: 8 }} />
            Call {pg.contact.person || 'Owner'}
          </button>
        )}
      </div>

      {/* Booking Modal - EXACT SAME AS PGDetails */}
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
                {/* Full Name */}
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

                {/* Phone Number */}
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

                {/* Check-in Date */}
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

                {/* Room Type */}
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

                {/* Action Buttons */}
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
                        <BookOpen size={18} />
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
    padding: "24px 20px 120px 20px",
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
    padding: "12px 24px",
    borderRadius: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    zIndex: 4000,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  headerSection: {
    marginBottom: "32px"
  },
  title: {
    fontSize: "28px",
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
    fontSize: "15px",
    color: "#6b7280"
  },
  typeBadge: {
    display: "inline-block",
    backgroundColor: "#f3f4f6",
    padding: "6px 14px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#4b5563"
  },
  roomSection: {
    marginBottom: "32px"
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 20px 0"
  },
  subSectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 16px 0"
  },
  roomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px"
  },
  roomCard: {
    backgroundColor: "#ffffff",
    border: "2px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  roomCardSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#f5f3ff",
    transform: "scale(1.02)",
    boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.2)"
  },
  roomCardSoldOut: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  roomCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  roomName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827"
  },
  roomAvailability: {
    fontSize: "14px",
    color: "#10b981",
    fontWeight: "500",
    backgroundColor: "#d1fae5",
    padding: "4px 10px",
    borderRadius: "20px"
  },
  roomSoldOut: {
    fontSize: "14px",
    color: "#ef4444",
    fontWeight: "500",
    backgroundColor: "#fee2e2",
    padding: "4px 10px",
    borderRadius: "20px"
  },
  roomFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "12px"
  },
  roomNumber: {
    fontSize: "14px",
    color: "#6b7280"
  },
  selectedBadge: {
    fontSize: "14px",
    color: "#4f46e5",
    fontWeight: "600"
  },
  noRooms: {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "#f9fafb",
    borderRadius: "20px",
    border: "2px dashed #e5e7eb",
    color: "#6b7280"
  },
  priceSection: {
    backgroundColor: "#f9fafb",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "32px"
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "12px",
    marginBottom: "20px"
  },
  priceCard: {
    backgroundColor: "#ffffff",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    textAlign: "center"
  },
  priceCardLabel: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "8px",
    fontWeight: "500"
  },
  priceCardValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: "4px"
  },
  priceCardConfig: {
    fontSize: "11px",
    color: "#9ca3af"
  },
  additionalCharges: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "20px",
    marginTop: "8px"
  },
  chargesTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 12px 0"
  },
  chargesList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  chargeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    padding: "4px 0"
  },
  chargeValue: {
    fontWeight: "600",
    color: "#111827"
  },
  viewDetailsBtn: {
    width: "100%",
    padding: "18px",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "16px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  viewDetailsArrow: {
    fontSize: "20px"
  },
  footer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderTop: "1px solid #e5e7eb",
    boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)"
  },
  bookBtn: {
    width: "100%",
    padding: "18px",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "16px",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  callBtn: {
    width: "100%",
    padding: "18px",
    backgroundColor: "#ffffff",
    color: "#22c55e",
    border: "2px solid #22c55e",
    borderRadius: "16px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  // Modal Styles - EXACT SAME AS PGDetails
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
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 100,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  },
  modalBody: {
    padding: 30
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24
  },
  formGroup: {
    marginBottom: 20
  },
  formLabel: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    color: "#374151"
  },
  formInput: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    background: "#f9fafb"
  },
  formSelect: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    background: "#f9fafb"
  },
  formActions: {
    display: "flex",
    gap: 12,
    marginTop: 24
  },
  cancelBtn: {
    flex: 1,
    padding: "14px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  },
  submitBtn: {
    flex: 2,
    padding: "14px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};

// Add global styles for animations
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default ScanPG;