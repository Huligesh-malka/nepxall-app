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
    if (!price || price === 0 || price === "0" || price === "") return null;
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
      {/* Header with PG Name and Location */}
      <div style={styles.headerSection}>
        <h1 style={styles.title}>{pg.name}</h1>
        <div style={styles.locationRow}>
          <span style={styles.locationIcon}>📍</span>
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

      {/* Selected Room Summary (if any) */}
      {selectedDetails && (
        <div style={styles.selectedSummary}>
          <div style={styles.selectedSummaryLeft}>
            <span style={styles.selectedSummaryLabel}>Selected:</span>
            <span style={styles.selectedSummaryName}>{selectedDetails.name}</span>
          </div>
          <span style={styles.selectedSummaryPrice}>₹{formatPrice(selectedDetails.price)}/month</span>
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
          <a href={`tel:${pg.contact.phone}`} style={{ textDecoration: 'none', width: '100%' }}>
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
    marginTop: "20px",
    transition: "all 0.2s ease"
  },
  headerSection: {
    marginBottom: "32px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
    lineHeight: "1.2"
  },
  locationRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px"
  },
  locationIcon: {
    fontSize: "16px",
    color: "#6b7280"
  },
  locationText: {
    fontSize: "15px",
    color: "#6b7280",
    fontWeight: "400"
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
    color: "#6b7280",
    fontSize: "16px"
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
    gap: "8px",
    transition: "all 0.2s ease"
  },
  viewDetailsArrow: {
    fontSize: "20px",
    transition: "transform 0.2s ease"
  },
  selectedSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: "16px 20px",
    borderRadius: "16px",
    marginBottom: "16px",
    border: "1px solid #e5e7eb"
  },
  selectedSummaryLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  selectedSummaryLabel: {
    fontSize: "14px",
    color: "#6b7280"
  },
  selectedSummaryName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#111827"
  },
  selectedSummaryPrice: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#4f46e5"
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
    transition: "all 0.2s ease"
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
    transition: "all 0.2s ease"
  }
};

export default ScanPG;