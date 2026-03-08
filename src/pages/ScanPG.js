import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";
import { MapPin, Wifi, Zap, Snowflake, Utensils, ChevronRight } from "lucide-react";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: 32, condition: "Sunny" });

  useEffect(() => {
    fetchPG();
    
    // Track QR scan
    const trackScan = async () => {
      try {
        await axios.post(`${API_CONFIG.USER_API_URL}/scan/${id}/track`);
      } catch (err) {
        console.error("Scan tracking failed:", err);
      }
    };
    
    trackScan();
  }, [id]);

  const fetchPG = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_CONFIG.USER_API_URL}/scan/${id}`);
      if (res.data.success) {
        setPg(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleContinueBooking = () => {
    if (!selectedRoom) {
      alert("Please select a room to continue");
      return;
    }
    navigate(`/booking/${id}?room=${selectedRoom.room_number}&type=${selectedRoom.sharing_type}`);
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0 || price === "0" || price === "") return null;
    return `₹${Number(price).toLocaleString('en-IN')}`;
  };

  // Check if property has any price data
  const hasPriceData = () => {
    if (!pg) return false;
    
    return (
      (pg.single_sharing > 0) ||
      (pg.double_sharing > 0) ||
      (pg.triple_sharing > 0) ||
      (pg.four_sharing > 0) ||
      (pg.single_room > 0) ||
      (pg.double_room > 0) ||
      (pg.price_1bhk > 0) ||
      (pg.price_2bhk > 0) ||
      (pg.price_3bhk > 0) ||
      (pg.price_4bhk > 0) ||
      (pg.rent_amount > 0)
    );
  };

  // Get property type
  const getPropertyType = () => {
    if (!pg) return "PG";
    
    if (pg.pg_category === "to_let" || pg.price_1bhk > 0 || pg.price_2bhk > 0 || pg.price_3bhk > 0) {
      return "House/Flat";
    } else if (pg.pg_category === "coliving") {
      return "Co-Living";
    } else {
      return "PG/Hostel";
    }
  };

  // Get BHK price details
  const getBHKDetails = () => {
    if (!pg) return [];
    
    const bhkTypes = [];
    
    if (pg.price_1bhk > 0) {
      bhkTypes.push({
        type: "1 BHK",
        price: formatPrice(pg.price_1bhk),
        deposit: pg.security_deposit_1bhk > 0 ? formatPrice(pg.security_deposit_1bhk) : null
      });
    }
    if (pg.price_2bhk > 0) {
      bhkTypes.push({
        type: "2 BHK",
        price: formatPrice(pg.price_2bhk),
        deposit: pg.security_deposit_2bhk > 0 ? formatPrice(pg.security_deposit_2bhk) : null
      });
    }
    if (pg.price_3bhk > 0) {
      bhkTypes.push({
        type: "3 BHK",
        price: formatPrice(pg.price_3bhk),
        deposit: pg.security_deposit_3bhk > 0 ? formatPrice(pg.security_deposit_3bhk) : null
      });
    }
    if (pg.price_4bhk > 0) {
      bhkTypes.push({
        type: "4 BHK",
        price: formatPrice(pg.price_4bhk),
        deposit: pg.security_deposit_4bhk > 0 ? formatPrice(pg.security_deposit_4bhk) : null
      });
    }
    
    return bhkTypes;
  };

  // Get sharing room details
  const getSharingDetails = () => {
    if (!pg) return [];
    
    const sharingTypes = [];
    
    if (pg.single_sharing > 0) {
      sharingTypes.push({
        type: "Single Sharing",
        price: formatPrice(pg.single_sharing)
      });
    }
    if (pg.double_sharing > 0) {
      sharingTypes.push({
        type: "Double Sharing",
        price: formatPrice(pg.double_sharing)
      });
    }
    if (pg.triple_sharing > 0) {
      sharingTypes.push({
        type: "Triple Sharing",
        price: formatPrice(pg.triple_sharing)
      });
    }
    if (pg.four_sharing > 0) {
      sharingTypes.push({
        type: "Four Sharing",
        price: formatPrice(pg.four_sharing)
      });
    }
    if (pg.single_room > 0) {
      sharingTypes.push({
        type: "Single Room",
        price: formatPrice(pg.single_room)
      });
    }
    if (pg.double_room > 0) {
      sharingTypes.push({
        type: "Double Room",
        price: formatPrice(pg.double_room)
      });
    }
    
    return sharingTypes;
  };

  // Get rooms for selection
  const getRoomsList = () => {
    if (pg?.available_room_details?.length > 0) {
      return pg.available_room_details;
    }
    
    // Create mock rooms based on available price types
    const rooms = [];
    const sharingTypes = getSharingDetails();
    const bhkTypes = getBHKDetails();
    
    [...sharingTypes, ...bhkTypes].forEach((type, idx) => {
      if (type.price) {
        const roomCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 1; i <= roomCount; i++) {
          rooms.push({
            id: idx * 100 + i,
            room_number: `${200 + idx}${i}`,
            sharing_type: type.type,
            available_beds: Math.floor(Math.random() * 5) + 1,
            price: parseInt(type.price.replace(/[^0-9]/g, '')) || 0
          });
        }
      }
    });
    
    return rooms;
  };

  // Get starting price for display
  const getStartingPrice = () => {
    if (!pg) return "0";
    
    const prices = [
      pg.single_sharing, pg.double_sharing, pg.triple_sharing, pg.four_sharing,
      pg.single_room, pg.double_room, pg.price_1bhk, pg.price_2bhk, pg.price_3bhk, pg.price_4bhk
    ].filter(p => p > 0);
    
    return prices.length > 0 ? Math.min(...prices) : pg.rent_amount || 1998;
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: 16, color: '#6b7280' }}>Loading property details...</p>
      </div>
    );
  }

  if (!pg) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <h2 style={{ color: '#1f2937', marginBottom: 8 }}>Property Not Found</h2>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>The QR code is invalid or property has been removed.</p>
        <button onClick={() => navigate('/')} style={styles.homeBtn}>
          Go to Home
        </button>
      </div>
    );
  }

  const bhkDetails = getBHKDetails();
  const sharingDetails = getSharingDetails();
  const roomsList = getRoomsList();
  const startingPrice = getStartingPrice();
  const propertyType = getPropertyType();

  return (
    <div style={styles.page}>
      {/* Header with Logo and Weather */}
      <div style={styles.header}>
        <div style={styles.logo}># Nepxall</div>
        <div style={styles.weather}>
          <span>{weather.temp}°C</span>
          <span style={styles.weatherCondition}>{weather.condition}</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.container}>
        {/* Property Title */}
        <h1 style={styles.title}>{pg.pg_name}</h1>
        <p style={styles.location}>
          <MapPin size={16} style={{ marginRight: 4 }} />
          {pg.area || pg.address}, {pg.city}
        </p>

        {/* About this Property Section */}
        {pg.description && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>About this Property</h3>
            <p style={styles.description}>{pg.description || "No description available"}</p>
          </div>
        )}

        {/* PRICE DETAILS SECTION - Exactly like your image */}
        {hasPriceData() && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Price Details</h3>
            
            {/* House/Flat Rental Prices */}
            {bhkDetails.length > 0 && (
              <div style={styles.priceCategory}>
                <h4 style={styles.priceCategoryTitle}>House/Flat Rental Prices</h4>
                <div style={styles.priceList}>
                  {bhkDetails.map((bhk, index) => (
                    <div key={index} style={styles.priceItem}>
                      <span style={styles.priceType}>{bhk.type}</span>
                      <span style={styles.priceValue}>{bhk.price}/month</span>
                    </div>
                  ))}
                </div>
                
                {/* Available BHK Type - exactly like your image */}
                {pg.bhk_type && (
                  <div style={styles.availableInfo}>
                    <strong>Available:</strong> {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
                  </div>
                )}
              </div>
            )}

            {/* PG/Hostel Sharing Prices */}
            {sharingDetails.length > 0 && (
              <div style={styles.priceCategory}>
                <h4 style={styles.priceCategoryTitle}>PG/Hostel Room Prices</h4>
                <div style={styles.priceList}>
                  {sharingDetails.map((share, index) => (
                    <div key={index} style={styles.priceItem}>
                      <span style={styles.priceType}>{share.type}</span>
                      <span style={styles.priceValue}>{share.price}/month</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Charges */}
            {(pg.security_deposit > 0 || pg.maintenance_charges > 0) && (
              <div style={styles.additionalCharges}>
                {pg.security_deposit > 0 && (
                  <div style={styles.chargeItem}>
                    <span>Security Deposit:</span>
                    <span>{formatPrice(pg.security_deposit)}</span>
                  </div>
                )}
                {pg.maintenance_charges > 0 && (
                  <div style={styles.chargeItem}>
                    <span>Maintenance:</span>
                    <span>{formatPrice(pg.maintenance_charges)}/month</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Location Section - Exactly like your image */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Location</h3>
          <div style={styles.locationDetails}>
            <div style={styles.locationRow}>
              <span style={styles.locationLabel}>Area:</span>
              <span style={styles.locationValue}>{pg.area || "Maruthi Nagara"}</span>
            </div>
            <div style={styles.locationRow}>
              <span style={styles.locationLabel}>Road:</span>
              <span style={styles.locationValue}>{pg.road || "Maruthi Nagar Main Road"}</span>
            </div>
            <div style={styles.locationRow}>
              <span style={styles.locationLabel}>City:</span>
              <span style={styles.locationValue}>{pg.city || "Bengaluru"}</span>
            </div>
            {pg.landmark && (
              <div style={styles.locationRow}>
                <span style={styles.locationLabel}>Landmark:</span>
                <span style={styles.locationValue}>{pg.landmark}</span>
              </div>
            )}
          </div>
        </div>

        {/* Facilities & Amenities Section - Exactly like your image */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Facilities & Amenities</h3>
          <div style={styles.facilitiesHeader}>
            <div style={styles.facilitiesPrice}>{formatPrice(startingPrice)} / month</div>
            <div style={styles.facilitiesLocation}>
              {pg.pg_name} • {pg.area || "Maruthi Nagara"}
            </div>
          </div>
          
          {/* Amenities Icons */}
          <div style={styles.amenities}>
            {pg.wifi_available && <span style={styles.amenity}><Wifi size={16} /> WiFi</span>}
            {pg.ac_available && <span style={styles.amenity}><Snowflake size={16} /> AC</span>}
            {pg.food_available && <span style={styles.amenity}><Utensils size={16} /> Food</span>}
            {pg.power_backup && <span style={styles.amenity}><Zap size={16} /> Backup</span>}
            {pg.parking_available && <span style={styles.amenity}>🚗 Parking</span>}
            {pg.cctv && <span style={styles.amenity}>📹 CCTV</span>}
            {pg.gym && <span style={styles.amenity}>🏋️ Gym</span>}
          </div>
        </div>

        {/* Choose Room Section */}
        {roomsList.length > 0 && (
          <>
            <h3 style={styles.sectionTitle}>Choose Room</h3>
            <div style={styles.roomsList}>
              {roomsList.slice(0, 3).map((room, index) => (
                <div
                  key={index}
                  onClick={() => handleRoomSelect(room)}
                  style={{
                    ...styles.roomCard,
                    border: selectedRoom?.room_number === room.room_number
                      ? "2px solid #6366f1"
                      : "1px solid #e5e7eb",
                    backgroundColor: selectedRoom?.room_number === room.room_number ? "#f5f3ff" : "#ffffff"
                  }}
                >
                  <div style={styles.roomHeader}>
                    <span style={styles.roomNumber}>Room {room.room_number}</span>
                    <span style={styles.roomPrice}>{formatPrice(room.price)}</span>
                  </div>
                  <div style={styles.roomFooter}>
                    <span style={styles.roomType}>{room.sharing_type}</span>
                    <span style={styles.bedsLeft}>{room.available_beds} beds left</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Continue Booking Button */}
        <button
          onClick={handleContinueBooking}
          style={{
            ...styles.bookBtn,
            opacity: selectedRoom ? 1 : 0.6,
            cursor: selectedRoom ? 'pointer' : 'not-allowed'
          }}
          disabled={!selectedRoom}
        >
          <span>Continue Booking</span>
          <ChevronRight size={20} />
        </button>

        {/* Footer Note */}
        <p style={styles.note}>
          * Prices mentioned are per month. Additional charges may apply.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
  },
  weather: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 500,
    color: '#334155',
  },
  weatherCondition: {
    color: '#f59e0b',
  },
  container: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '20px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    padding: 20,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px 0',
    textTransform: 'capitalize',
  },
  location: {
    fontSize: 14,
    color: '#64748b',
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 16px 0',
    paddingBottom: 8,
    borderBottom: '1px solid #e2e8f0',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    margin: 0,
    lineHeight: 1.6,
  },
  priceCategory: {
    marginBottom: 20,
  },
  priceCategoryTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#4b5563',
    margin: '0 0 12px 0',
  },
  priceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  priceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    fontSize: 14,
  },
  priceType: {
    color: '#4b5563',
  },
  priceValue: {
    fontWeight: 600,
    color: '#10b981',
  },
  availableInfo: {
    marginTop: 12,
    padding: '8px 12px',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    fontSize: 14,
    color: '#0369a1',
    border: '1px solid #bae6fd',
  },
  additionalCharges: {
    marginTop: 12,
    padding: '12px',
    backgroundColor: '#fef9c3',
    borderRadius: 8,
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  chargeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#854d0e',
  },
  locationDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  locationRow: {
    display: 'flex',
    fontSize: 14,
  },
  locationLabel: {
    width: 80,
    color: '#64748b',
  },
  locationValue: {
    color: '#334155',
    fontWeight: 500,
  },
  facilitiesHeader: {
    marginBottom: 16,
  },
  facilitiesPrice: {
    fontSize: 20,
    fontWeight: 700,
    color: '#10b981',
    marginBottom: 4,
  },
  facilitiesLocation: {
    fontSize: 13,
    color: '#64748b',
  },
  amenities: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenity: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '6px 10px',
    borderRadius: 6,
  },
  roomsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
  },
  roomCard: {
    padding: 16,
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  roomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomNumber: {
    fontWeight: 600,
    fontSize: 16,
    color: '#1e293b',
  },
  roomPrice: {
    fontWeight: 600,
    fontSize: 15,
    color: '#10b981',
  },
  roomFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomType: {
    fontSize: 13,
    color: '#64748b',
  },
  bedsLeft: {
    fontSize: 13,
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    padding: '2px 8px',
    borderRadius: 4,
  },
  bookBtn: {
    width: '100%',
    padding: 16,
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  note: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  homeBtn: {
    padding: '12px 24px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default ScanPG;