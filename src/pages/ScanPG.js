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

  const goToFullDetails = () => {
    navigate(`/pg/${id}`);
  };

  // Format price with commas
  const formatPrice = (price) => {
    if (!price) return "0";
    return Number(price).toLocaleString('en-IN');
  };

  // Get all available price options from price_details
  const getAllPriceOptions = () => {
    if (!pg?.price_details) return [];
    
    const options = [];
    const { price_details } = pg;

    // Sharing options
    if (price_details.sharing) {
      if (price_details.sharing.single_sharing) {
        options.push({
          type: "Single Sharing",
          price: price_details.sharing.single_sharing,
          category: "sharing"
        });
      }
      if (price_details.sharing.double_sharing) {
        options.push({
          type: "Double Sharing",
          price: price_details.sharing.double_sharing,
          category: "sharing"
        });
      }
      if (price_details.sharing.triple_sharing) {
        options.push({
          type: "Triple Sharing",
          price: price_details.sharing.triple_sharing,
          category: "sharing"
        });
      }
      if (price_details.sharing.four_sharing) {
        options.push({
          type: "Four Sharing",
          price: price_details.sharing.four_sharing,
          category: "sharing"
        });
      }
    }

    // Co-living options
    if (price_details.co_living) {
      if (price_details.co_living.single_room) {
        options.push({
          type: "Co-Living Single",
          price: price_details.co_living.single_room,
          category: "coliving"
        });
      }
      if (price_details.co_living.double_room) {
        options.push({
          type: "Co-Living Double",
          price: price_details.co_living.double_room,
          category: "coliving"
        });
      }
    }

    // BHK options
    if (price_details.to_let?.prices) {
      if (price_details.to_let.prices['1bhk']) {
        options.push({
          type: "1 BHK",
          price: price_details.to_let.prices['1bhk'],
          category: "bhk",
          config: price_details.to_let.configurations?.['1bhk']
        });
      }
      if (price_details.to_let.prices['2bhk']) {
        options.push({
          type: "2 BHK",
          price: price_details.to_let.prices['2bhk'],
          category: "bhk",
          config: price_details.to_let.configurations?.['2bhk']
        });
      }
    }

    return options;
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
  const priceOptions = getAllPriceOptions();
  const minPrice = priceOptions.length > 0 
    ? Math.min(...priceOptions.map(o => Number(o.price))) 
    : pg.price_details?.rent_amount || 0;

  return (
    <div style={styles.container}>
      {/* Header with PG Name */}
      <div style={styles.header}>
        <h1 style={styles.title}>{pg.name}</h1>
        {pg.rating && (
          <div style={styles.rating}>
            <span style={styles.star}>⭐</span>
            <span>{pg.rating}</span>
          </div>
        )}
      </div>

      {/* Location - Simple and Clear */}
      <div style={styles.locationContainer}>
        <span style={styles.locationIcon}>📍</span>
        <p style={styles.location}>
          {pg.location?.area}, {pg.location?.city}
        </p>
      </div>

      {/* Price Summary Card */}
      <div style={styles.priceSummaryCard}>
        <div style={styles.priceMain}>
          <span style={styles.priceLabel}>Starting from</span>
          <span style={styles.priceValue}>₹{formatPrice(minPrice)}</span>
          <span style={styles.pricePeriod}>/month</span>
        </div>
        
        <div style={styles.priceMeta}>
          {pg.available_rooms > 0 && (
            <span style={styles.availabilityChip}>
              🟢 {pg.available_rooms} room{pg.available_rooms > 1 ? 's' : ''} available
            </span>
          )}
          {pg.price_details?.deposit_amount > 0 && (
            <span style={styles.depositChip}>
              🔒 Deposit: ₹{formatPrice(pg.price_details.deposit_amount)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Property Info */}
      <div style={styles.quickInfo}>
        <div style={styles.infoChip}>
          <span>🏷️ {pg.category || "PG"}</span>
        </div>
        <div style={styles.infoChip}>
          <span>👥 {pg.type || "All"}</span>
        </div>
        {pg.available_rooms > 0 && (
          <div style={styles.infoChip}>
            <span>🛏️ {pg.available_rooms} left</span>
          </div>
        )}
      </div>

      {/* Room Selection Section */}
      <div style={styles.roomSection}>
        <h3 style={styles.sectionTitle}>Available Rooms</h3>
        
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
                  <span style={styles.roomPrice}>₹{formatPrice(room.price)}</span>
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

      {/* All Price Options (if no specific rooms) */}
      {(!pg.available_room_details || pg.available_room_details.length === 0) && priceOptions.length > 0 && (
        <div style={styles.priceOptionsSection}>
          <h3 style={styles.sectionTitle}>Available Price Options</h3>
          <div style={styles.priceOptionsGrid}>
            {priceOptions.map((option, index) => (
              <div key={index} style={styles.priceOptionCard}>
                <div style={styles.priceOptionType}>{option.type}</div>
                <div style={styles.priceOptionValue}>₹{formatPrice(option.price)}/month</div>
                {option.config && (
                  <div style={styles.priceOptionConfig}>
                    {option.config.bedrooms} bed • {option.config.bathrooms} bath
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Charges */}
      {pg.price_details && (
        <div style={styles.chargesSection}>
          {(pg.price_details.deposit_amount > 0 || pg.price_details.maintenance_amount > 0 || pg.price_details.brokerage_amount > 0) && (
            <>
              <h4 style={styles.chargesTitle}>Additional Charges</h4>
              <div style={styles.chargesList}>
                {pg.price_details.deposit_amount > 0 && (
                  <div style={styles.chargeItem}>
                    <span>Security Deposit</span>
                    <span style={styles.chargeValue}>₹{formatPrice(pg.price_details.deposit_amount)}</span>
                  </div>
                )}
                {pg.price_details.maintenance_amount > 0 && (
                  <div style={styles.chargeItem}>
                    <span>Maintenance</span>
                    <span style={styles.chargeValue}>₹{formatPrice(pg.price_details.maintenance_amount)}/month</span>
                  </div>
                )}
                {pg.price_details.brokerage_amount > 0 && (
                  <div style={styles.chargeItem}>
                    <span>Brokerage</span>
                    <span style={styles.chargeValue}>₹{formatPrice(pg.price_details.brokerage_amount)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* View Full Details Button - Like in reference component */}
      <button onClick={goToFullDetails} style={styles.viewDetailsBtn}>
        <span>📋 View Full Property Details</span>
        <span style={styles.viewDetailsArrow}>→</span>
      </button>

      {/* Selected Item Summary */}
      {selectedDetails && (
        <div style={styles.selectedSummary}>
          <span>Selected: {selectedDetails.name}</span>
          <span style={styles.selectedPrice}>₹{formatPrice(selectedDetails.price)}/month</span>
        </div>
      )}

      {/* Footer Actions */}
      <div style={styles.footer}>
        <button
          onClick={goToPayment}
          style={{
            ...styles.bookBtn,
            opacity: selectedDetails ? 1 : 0.5,
            cursor: selectedDetails ? 'pointer' : 'not-allowed'
          }}
          disabled={!selectedDetails}
        >
          {selectedDetails ? `Book Now • ₹${formatPrice(selectedDetails.price)}/month` : 'Select a room to continue'}
        </button>

        {pg.contact?.phone && (
          <a href={`tel:${pg.contact.phone}`} style={{ textDecoration: 'none' }}>
            <button style={styles.callBtn}>
              📞 Call {pg.contact.person || 'Owner'}
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
    padding: "20px 16px 100px 16px",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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
  priceSummaryCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb"
  },
  priceMain: {
    marginBottom: "12px"
  },
  priceLabel: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  priceValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#4f46e5",
    marginRight: "4px"
  },
  pricePeriod: {
    fontSize: "14px",
    color: "#9ca3af"
  },
  priceMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  availabilityChip: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500"
  },
  depositChip: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500"
  },
  quickInfo: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "24px"
  },
  infoChip: {
    backgroundColor: "#f3f4f6",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#374151"
  },
  roomSection: {
    marginBottom: "24px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#1f2937"
  },
  roomList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
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
    marginBottom: "4px",
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
    backgroundColor: "#dcfce7",
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
  priceOptionsSection: {
    marginBottom: "24px"
  },
  priceOptionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "12px"
  },
  priceOptionCard: {
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    textAlign: "center"
  },
  priceOptionType: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "8px"
  },
  priceOptionValue: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#4f46e5",
    marginBottom: "4px"
  },
  priceOptionConfig: {
    fontSize: "11px",
    color: "#9ca3af"
  },
  chargesSection: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #e5e7eb"
  },
  chargesTitle: {
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 12px 0",
    color: "#374151"
  },
  chargesList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  chargeItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    padding: "4px 0"
  },
  chargeValue: {
    fontWeight: "600",
    color: "#374151"
  },
  viewDetailsBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#fff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "14px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease"
  },
  viewDetailsArrow: {
    fontSize: "18px",
    transition: "transform 0.3s ease"
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
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#f9fafb",
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
    boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
  },
  bookBtn: {
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