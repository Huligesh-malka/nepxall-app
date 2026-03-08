import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    fetchPG();
  }, [id]);

  const fetchPG = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_CONFIG.USER_API_URL}/scan/${id}`
      );

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

  const goToPayment = () => {
    const selected = getSelectedDetails();
    if (!selected) {
      alert("Please select a room to proceed");
      return;
    }
    
    navigate(`/booking/${id}`, {
      state: {
        selectionType: selected.type,
        selectionName: selected.name,
        price: selected.price,
        roomId: selectedRoom?.room_number,
        sharingType: selectedRoom?.sharing_type
      }
    });
  };

  const toggleFullDetails = () => {
    setShowFullDetails(!showFullDetails);
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
          <button 
            onClick={() => navigate('/')} 
            style={styles.homeBtn}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const selectedDetails = getSelectedDetails();

  return (
    <div style={styles.container}>
      {/* Header with PG Name */}
      <div style={styles.header}>
        <h1 style={styles.title}>{pg.name}</h1>
        <div style={styles.rating}>
          <span style={styles.star}>⭐</span>
          <span>{pg.rating || "4.5"}</span>
        </div>
      </div>

      {/* Location - Simple and Clear */}
      <div style={styles.locationContainer}>
        <span style={styles.locationIcon}>📍</span>
        <p style={styles.location}>
          {pg.location?.area}, {pg.location?.city}
        </p>
      </div>

      {/* Price Summary - Clear Display */}
      <div style={styles.priceSummary}>
        <div style={styles.priceCard}>
          <span style={styles.priceLabel}>Starting from</span>
          <span style={styles.priceValue}>₹{pg.price_details?.rent_amount || pg.available_room_details?.[0]?.price || 0}</span>
          <span style={styles.pricePeriod}>/month</span>
        </div>
        
        {pg.price_details?.deposit_amount > 0 && (
          <div style={styles.depositCard}>
            <span style={styles.depositLabel}>Security Deposit</span>
            <span style={styles.depositValue}>₹{pg.price_details.deposit_amount}</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statItem}>
          <span style={styles.statEmoji}>🛏️</span>
          <span style={styles.statValue}>{pg.available_rooms || 0}</span>
          <span style={styles.statLabel}>Rooms Left</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statEmoji}>🏠</span>
          <span style={styles.statValue}>{pg.category}</span>
          <span style={styles.statLabel}>Type</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statEmoji}>👥</span>
          <span style={styles.statValue}>{pg.type}</span>
          <span style={styles.statLabel}>For</span>
        </div>
      </div>

      {/* Room Selection Section */}
      <div style={styles.roomSection}>
        <h3 style={styles.sectionTitle}>Select a Room</h3>
        
        {pg.available_room_details && pg.available_room_details.length > 0 ? (
          <div style={styles.roomList}>
            {pg.available_room_details.map((room, index) => (
              <div
                key={index}
                style={{
                  ...styles.roomItem,
                  borderColor: selectedRoom?.room_number === room.room_number ? "#4f46e5" : "#e5e7eb",
                  backgroundColor: selectedRoom?.room_number === room.room_number ? "#f5f3ff" : "#fff"
                }}
                onClick={() => handleRoomSelection(room)}
              >
                <input
                  type="radio"
                  name="room"
                  checked={selectedRoom?.room_number === room.room_number}
                  onChange={() => handleRoomSelection(room)}
                  style={styles.radio}
                />
                <div style={styles.roomInfo}>
                  <span style={styles.roomNo}>Room {room.room_number}</span>
                  <span style={styles.roomType}>{room.sharing_type}</span>
                  <span style={styles.roomBeds}>{room.available_beds} bed{room.available_beds > 1 ? 's' : ''} left</span>
                </div>
                <div style={styles.roomPriceInfo}>
                  <span style={styles.roomPrice}>₹{room.price}</span>
                  <span style={styles.roomPeriod}>/month</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noRooms}>
            <p style={styles.noRoomsText}>No rooms currently available</p>
          </div>
        )}
      </div>

      {/* View All Details Button */}
      <button onClick={toggleFullDetails} style={styles.viewDetailsBtn}>
        {showFullDetails ? 'Hide Details' : 'View All Details'} 📋
      </button>

      {/* Full Details Section - Collapsible */}
      {showFullDetails && (
        <div style={styles.fullDetails}>
          <h4 style={styles.detailsTitle}>Complete Property Details</h4>
          
          {/* Address */}
          <div style={styles.detailBlock}>
            <h5 style={styles.detailSubtitle}>📍 Full Address</h5>
            <p style={styles.detailText}>{pg.location?.address}</p>
          </div>

          {/* Amenities Summary */}
          {pg.amenities && (
            <div style={styles.detailBlock}>
              <h5 style={styles.detailSubtitle}>✨ Key Amenities</h5>
              <div style={styles.amenitiesList}>
                {pg.amenities.basic?.wifi && <span style={styles.amenityTag}>📶 WiFi</span>}
                {pg.amenities.basic?.ac && <span style={styles.amenityTag}>❄️ AC</span>}
                {pg.amenities.basic?.parking && <span style={styles.amenityTag}>🅿️ Parking</span>}
                {pg.amenities.appliances?.geyser && <span style={styles.amenityTag}>🔥 Geyser</span>}
                {pg.amenities.appliances?.washing_machine && <span style={styles.amenityTag}>🧺 Washing Machine</span>}
                {pg.amenities.appliances?.refrigerator && <span style={styles.amenityTag}>🧊 Refrigerator</span>}
              </div>
            </div>
          )}

          {/* Food Details */}
          {pg.food_details?.food_available && (
            <div style={styles.detailBlock}>
              <h5 style={styles.detailSubtitle}>🍽️ Food</h5>
              <p style={styles.detailText}>
                {pg.food_details.food_type} • {pg.food_details.meals_per_day || 'Meals included'}
              </p>
            </div>
          )}

          {/* Rules Summary */}
          {pg.rules && (
            <div style={styles.detailBlock}>
              <h5 style={styles.detailSubtitle}>📋 Rules</h5>
              <div style={styles.rulesList}>
                {pg.rules.visitors?.allowed && <span style={styles.ruleTag}>👥 Visitors Allowed</span>}
                {pg.rules.entry?.late_night_allowed && <span style={styles.ruleTag}>🌙 Late Entry</span>}
                {pg.rules.occupant_type?.boys_only && <span style={styles.ruleTag}>👨 Boys Only</span>}
                {pg.rules.occupant_type?.girls_only && <span style={styles.ruleTag}>👩 Girls Only</span>}
                {pg.rules.restrictions?.couple_allowed && <span style={styles.ruleTag}>👫 Couples Allowed</span>}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {pg.contact && (
            <div style={styles.detailBlock}>
              <h5 style={styles.detailSubtitle}>📞 Contact</h5>
              <p style={styles.detailText}>
                {pg.contact.person}<br />
                <a href={`tel:${pg.contact.phone}`} style={styles.contactLink}>
                  {pg.contact.phone}
                </a>
                {pg.contact.email && <><br /><a href={`mailto:${pg.contact.email}`} style={styles.contactLink}>{pg.contact.email}</a></>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Item Summary */}
      {selectedDetails && (
        <div style={styles.selectedSummary}>
          <span>Selected: {selectedDetails.name}</span>
          <span style={styles.selectedPrice}>₹{selectedDetails.price}/month</span>
        </div>
      )}

      {/* Footer Actions */}
      <div style={styles.footer}>
        <button
          onClick={goToPayment}
          style={{
            ...styles.payBtn,
            opacity: selectedDetails ? 1 : 0.5,
            cursor: selectedDetails ? 'pointer' : 'not-allowed'
          }}
          disabled={!selectedDetails}
        >
          Book Now • ₹{getSelectedPrice() || 'Select room'}/month
        </button>

        {pg.contact?.phone && (
          <a href={`tel:${pg.contact.phone}`} style={{ textDecoration: 'none' }}>
            <button style={styles.callBtn}>
              📞 Call Owner
            </button>
          </a>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "20px 16px",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif"
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f9fafb"
  },
  loader: {
    fontSize: "18px",
    color: "#4f46e5"
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
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0
  },
  rating: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#f3f4f6",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500"
  },
  star: {
    fontSize: "16px"
  },
  locationContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "16px"
  },
  locationIcon: {
    fontSize: "16px"
  },
  location: {
    margin: 0,
    color: "#4b5563",
    fontSize: "14px",
    fontWeight: "500"
  },
  priceSummary: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px"
  },
  priceCard: {
    flex: 2,
    backgroundColor: "#4f46e5",
    padding: "16px",
    borderRadius: "16px",
    color: "white"
  },
  priceLabel: {
    display: "block",
    fontSize: "12px",
    opacity: 0.9,
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  priceValue: {
    display: "inline-block",
    fontSize: "28px",
    fontWeight: "bold",
    marginRight: "4px"
  },
  pricePeriod: {
    fontSize: "14px",
    opacity: 0.8
  },
  depositCard: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  depositLabel: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "4px"
  },
  depositValue: {
    display: "block",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1f2937"
  },
  statsContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px"
  },
  statItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: "12px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  statEmoji: {
    display: "block",
    fontSize: "20px",
    marginBottom: "4px"
  },
  statValue: {
    display: "block",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1f2937"
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "2px"
  },
  roomSection: {
    marginBottom: "16px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#1f2937"
  },
  roomList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  roomItem: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    border: "2px solid #e5e7eb",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: "#fff"
  },
  radio: {
    marginRight: "16px",
    width: "20px",
    height: "20px",
    cursor: "pointer",
    accentColor: "#4f46e5"
  },
  roomInfo: {
    flex: 1
  },
  roomNo: {
    display: "block",
    fontWeight: "600",
    fontSize: "16px",
    marginBottom: "2px",
    color: "#1f2937"
  },
  roomType: {
    display: "inline-block",
    fontSize: "13px",
    color: "#6b7280",
    marginRight: "8px"
  },
  roomBeds: {
    display: "inline-block",
    fontSize: "12px",
    color: "#16a34a",
    backgroundColor: "#e6f7e6",
    padding: "2px 8px",
    borderRadius: "12px"
  },
  roomPriceInfo: {
    textAlign: "right"
  },
  roomPrice: {
    display: "block",
    fontWeight: "bold",
    color: "#4f46e5",
    fontSize: "20px",
    lineHeight: "1.2"
  },
  roomPeriod: {
    fontSize: "11px",
    color: "#9ca3af"
  },
  noRooms: {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "2px dashed #e5e7eb"
  },
  noRoomsText: {
    color: "#6b7280",
    margin: 0
  },
  viewDetailsBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#fff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "16px"
  },
  fullDetails: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px"
  },
  detailsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#1f2937"
  },
  detailBlock: {
    marginBottom: "16px"
  },
  detailSubtitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#4b5563"
  },
  detailText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
    lineHeight: "1.5"
  },
  amenitiesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  amenityTag: {
    backgroundColor: "#f3f4f6",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#1f2937"
  },
  rulesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  ruleTag: {
    backgroundColor: "#f3f4f6",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#1f2937"
  },
  contactLink: {
    color: "#4f46e5",
    textDecoration: "none",
    fontWeight: "500"
  },
  selectedSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: "500"
  },
  selectedPrice: {
    color: "#4f46e5",
    fontWeight: "bold"
  },
  footer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "sticky",
    bottom: "16px",
    backgroundColor: "#f9fafb",
    padding: "12px 0"
  },
  payBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  callBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#fff",
    color: "#22c55e",
    border: "2px solid #22c55e",
    borderRadius: "14px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer"
  }
};

export default ScanPG;