import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "../config";

const ScanPG = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBHK, setSelectedBHK] = useState(null);
  const [selectedSharing, setSelectedSharing] = useState(null);
  const [activeTab, setActiveTab] = useState("rooms"); // 'rooms', 'pricing', 'amenities', 'rules'
  const [loading, setLoading] = useState(true);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

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
        console.log("PG Data:", res.data.data); // For debugging
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelection = (room) => {
    setSelectedRoom(room);
    setSelectedBHK(null);
    setSelectedSharing(null);
  };

  const handleBHKSelection = (bhkType, price) => {
    setSelectedBHK({ type: bhkType, price });
    setSelectedRoom(null);
    setSelectedSharing(null);
  };

  const handleSharingSelection = (type, price) => {
    setSelectedSharing({ type, price });
    setSelectedRoom(null);
    setSelectedBHK(null);
  };

  const getSelectedPrice = () => {
    if (selectedRoom) return selectedRoom.price;
    if (selectedBHK) return selectedBHK.price;
    if (selectedSharing) return selectedSharing.price;
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
    if (selectedBHK) {
      return {
        type: "bhk",
        name: `${selectedBHK.type} BHK`,
        price: selectedBHK.price
      };
    }
    if (selectedSharing) {
      return {
        type: "sharing",
        name: selectedSharing.type.replace('_', ' ').toUpperCase(),
        price: selectedSharing.price
      };
    }
    return null;
  };

  const goToPayment = () => {
    const selected = getSelectedDetails();
    if (!selected) {
      alert("Please select a room/configuration to proceed");
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

  const renderPriceSection = () => {
    if (!pg) return null;

    const { price_details, category } = pg;

    return (
      <div style={styles.priceSection}>
        {/* Base Price */}
        {price_details?.rent_amount && (
          <div style={styles.basePriceCard}>
            <span style={styles.basePriceLabel}>Starting from</span>
            <span style={styles.basePriceValue}>₹{price_details.rent_amount}/month</span>
          </div>
        )}

        {/* Sharing Prices (PG) */}
        {price_details?.sharing && Object.values(price_details.sharing).some(val => val) && (
          <div style={styles.priceCategory}>
            <h4 style={styles.categoryTitle}>🏠 Sharing Options</h4>
            <div style={styles.priceGrid}>
              {price_details.sharing.single_sharing && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedSharing?.type === 'single_sharing' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedSharing?.type === 'single_sharing' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleSharingSelection('single_sharing', price_details.sharing.single_sharing)}
                >
                  <span style={styles.priceLabel}>Single Sharing</span>
                  <span style={styles.priceAmount}>₹{price_details.sharing.single_sharing}</span>
                </div>
              )}
              {price_details.sharing.double_sharing && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedSharing?.type === 'double_sharing' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedSharing?.type === 'double_sharing' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleSharingSelection('double_sharing', price_details.sharing.double_sharing)}
                >
                  <span style={styles.priceLabel}>Double Sharing</span>
                  <span style={styles.priceAmount}>₹{price_details.sharing.double_sharing}</span>
                </div>
              )}
              {price_details.sharing.triple_sharing && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedSharing?.type === 'triple_sharing' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedSharing?.type === 'triple_sharing' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleSharingSelection('triple_sharing', price_details.sharing.triple_sharing)}
                >
                  <span style={styles.priceLabel}>Triple Sharing</span>
                  <span style={styles.priceAmount}>₹{price_details.sharing.triple_sharing}</span>
                </div>
              )}
              {price_details.sharing.four_sharing && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedSharing?.type === 'four_sharing' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedSharing?.type === 'four_sharing' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleSharingSelection('four_sharing', price_details.sharing.four_sharing)}
                >
                  <span style={styles.priceLabel}>Four Sharing</span>
                  <span style={styles.priceAmount}>₹{price_details.sharing.four_sharing}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BHK Prices (To-let) */}
        {price_details?.to_let?.prices && Object.values(price_details.to_let.prices).some(val => val) && (
          <div style={styles.priceCategory}>
            <h4 style={styles.categoryTitle}>🏢 BHK Options</h4>
            <div style={styles.priceGrid}>
              {price_details.to_let.prices['1bhk'] && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedBHK?.type === '1bhk' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedBHK?.type === '1bhk' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleBHKSelection('1bhk', price_details.to_let.prices['1bhk'])}
                >
                  <span style={styles.priceLabel}>1 BHK</span>
                  <span style={styles.priceAmount}>₹{price_details.to_let.prices['1bhk']}</span>
                  <small style={styles.configText}>
                    {price_details.to_let.configurations?.['1bhk']?.bedrooms} bed, {price_details.to_let.configurations?.['1bhk']?.bathrooms} bath
                  </small>
                </div>
              )}
              {price_details.to_let.prices['2bhk'] && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedBHK?.type === '2bhk' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedBHK?.type === '2bhk' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleBHKSelection('2bhk', price_details.to_let.prices['2bhk'])}
                >
                  <span style={styles.priceLabel}>2 BHK</span>
                  <span style={styles.priceAmount}>₹{price_details.to_let.prices['2bhk']}</span>
                  <small style={styles.configText}>
                    {price_details.to_let.configurations?.['2bhk']?.bedrooms} bed, {price_details.to_let.configurations?.['2bhk']?.bathrooms} bath
                  </small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Co-living Prices */}
        {price_details?.co_living && Object.values(price_details.co_living).some(val => val) && (
          <div style={styles.priceCategory}>
            <h4 style={styles.categoryTitle}>👥 Co-living Options</h4>
            <div style={styles.priceGrid}>
              {price_details.co_living.single_room && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedSharing?.type === 'co_living_single' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedSharing?.type === 'co_living_single' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleSharingSelection('co_living_single', price_details.co_living.single_room)}
                >
                  <span style={styles.priceLabel}>Single Room</span>
                  <span style={styles.priceAmount}>₹{price_details.co_living.single_room}</span>
                </div>
              )}
              {price_details.co_living.double_room && (
                <div 
                  style={{
                    ...styles.priceCard,
                    borderColor: selectedSharing?.type === 'co_living_double' ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedSharing?.type === 'co_living_double' ? '#f5f3ff' : '#fff'
                  }}
                  onClick={() => handleSharingSelection('co_living_double', price_details.co_living.double_room)}
                >
                  <span style={styles.priceLabel}>Double Room</span>
                  <span style={styles.priceAmount}>₹{price_details.co_living.double_room}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Charges */}
        {(price_details?.deposit_amount || price_details?.maintenance_amount || price_details?.brokerage_amount) && (
          <div style={styles.chargesSection}>
            <h4 style={styles.categoryTitle}>💰 Additional Charges</h4>
            <div style={styles.chargesGrid}>
              {price_details.deposit_amount > 0 && (
                <div style={styles.chargeItem}>
                  <span>Security Deposit</span>
                  <span style={styles.chargeValue}>₹{price_details.deposit_amount}</span>
                </div>
              )}
              {price_details.maintenance_amount > 0 && (
                <div style={styles.chargeItem}>
                  <span>Maintenance</span>
                  <span style={styles.chargeValue}>₹{price_details.maintenance_amount}/month</span>
                </div>
              )}
              {price_details.brokerage_amount > 0 && (
                <div style={styles.chargeItem}>
                  <span>Brokerage</span>
                  <span style={styles.chargeValue}>₹{price_details.brokerage_amount}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAmenities = () => {
    if (!pg?.amenities) return null;

    const { amenities } = pg;

    const amenityCategories = [
      {
        title: "Basic Amenities",
        items: [
          { key: "wifi", label: "WiFi", emoji: "📶" },
          { key: "parking", label: "Parking", emoji: "🅿️" },
          { key: "ac", label: "AC", emoji: "❄️" },
          { key: "power_backup", label: "Power Backup", emoji: "⚡" },
          { key: "cctv", label: "CCTV", emoji: "📹" },
          { key: "security_guard", label: "Security Guard", emoji: "🛡️" },
          { key: "housekeeping", label: "Housekeeping", emoji: "🧹" },
          { key: "lift", label: "Lift", emoji: "🛗" }
        ]
      },
      {
        title: "Appliances",
        items: [
          { key: "geyser", label: "Geyser", emoji: "🔥" },
          { key: "washing_machine", label: "Washing Machine", emoji: "🧺" },
          { key: "refrigerator", label: "Refrigerator", emoji: "🧊" },
          { key: "microwave", label: "Microwave", emoji: "🔥" },
          { key: "tv", label: "TV", emoji: "📺" },
          { key: "water_purifier", label: "Water Purifier", emoji: "💧" }
        ]
      },
      {
        title: "Room Amenities",
        items: [
          { key: "attached_bathroom", label: "Attached Bathroom", emoji: "🚿" },
          { key: "balcony", label: "Balcony", emoji: "🏞️" },
          { key: "cupboard", label: "Cupboard", emoji: "🗄️" },
          { key: "table_chair", label: "Table & Chair", emoji: "🪑" },
          { key: "bed_with_mattress", label: "Bed with Mattress", emoji: "🛏️" }
        ]
      },
      {
        title: "Common Areas",
        items: [
          { key: "gym", label: "Gym", emoji: "💪" },
          { key: "study_room", label: "Study Room", emoji: "📚" },
          { key: "common_tv_lounge", label: "TV Lounge", emoji: "📺" },
          { key: "balcony_open_space", label: "Open Space", emoji: "🌳" }
        ]
      }
    ];

    return (
      <div style={styles.amenitiesSection}>
        {amenityCategories.map((category, idx) => (
          <div key={idx} style={styles.amenityCategory}>
            <h4 style={styles.categoryTitle}>{category.title}</h4>
            <div style={styles.amenityGrid}>
              {category.items.map((item, i) => {
                const isAvailable = amenities.basic?.[item.key] || 
                                   amenities.appliances?.[item.key] || 
                                   amenities.room_amenities?.[item.key] || 
                                   amenities.common_areas?.[item.key];
                if (isAvailable) {
                  return (
                    <div key={i} style={styles.amenityItem}>
                      <span style={styles.amenityEmoji}>{item.emoji}</span>
                      <span style={styles.amenityLabel}>{item.label}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFoodDetails = () => {
    if (!pg?.food_details || !pg.food_details.food_available) return null;

    return (
      <div style={styles.foodSection}>
        <h4 style={styles.categoryTitle}>🍽️ Food Details</h4>
        <div style={styles.foodCard}>
          <div style={styles.foodItem}>
            <span>Type:</span>
            <span style={styles.foodValue}>{pg.food_details.food_type}</span>
          </div>
          {pg.food_details.meals_per_day && (
            <div style={styles.foodItem}>
              <span>Meals:</span>
              <span style={styles.foodValue}>{pg.food_details.meals_per_day}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRules = () => {
    if (!pg?.rules) return null;

    const { rules } = pg;

    return (
      <div style={styles.rulesSection}>
        <h4 style={styles.categoryTitle}>📋 House Rules</h4>
        
        {/* Visitor Rules */}
        <div style={styles.ruleCategory}>
          <h5 style={styles.ruleSubtitle}>👥 Visitors</h5>
          <div style={styles.ruleGrid}>
            <span style={styles.ruleItem}>
              {rules.visitors?.allowed ? "✅ Visitors Allowed" : "❌ No Visitors"}
            </span>
            {rules.visitors?.time_restricted && (
              <span style={styles.ruleItem}>
                ⏰ Until {rules.visitors.allowed_till}
              </span>
            )}
          </div>
        </div>

        {/* Entry Rules */}
        <div style={styles.ruleCategory}>
          <h5 style={styles.ruleSubtitle}>🚪 Entry</h5>
          <div style={styles.ruleGrid}>
            <span style={styles.ruleItem}>
              {rules.entry?.late_night_allowed ? "✅ Late Night Entry" : "❌ No Late Entry"}
            </span>
            {rules.entry?.curfew_time && (
              <span style={styles.ruleItem}>
                ⏰ Curfew: {rules.entry.curfew_time}
              </span>
            )}
          </div>
        </div>

        {/* Restrictions */}
        <div style={styles.ruleCategory}>
          <h5 style={styles.ruleSubtitle}>🚫 Restrictions</h5>
          <div style={styles.ruleGrid}>
            {rules.restrictions?.couple_allowed && (
              <span style={styles.ruleItem}>👫 Couples Allowed</span>
            )}
            {rules.restrictions?.smoking_allowed && (
              <span style={styles.ruleItem}>🚬 Smoking Allowed</span>
            )}
            {rules.restrictions?.drinking_allowed && (
              <span style={styles.ruleItem}>🍺 Drinking Allowed</span>
            )}
            {rules.restrictions?.pets_allowed && (
              <span style={styles.ruleItem}>🐕 Pets Allowed</span>
            )}
          </div>
        </div>

        {/* Tenancy Terms */}
        <div style={styles.ruleCategory}>
          <h5 style={styles.ruleSubtitle}>📄 Tenancy Terms</h5>
          <div style={styles.ruleGrid}>
            <span style={styles.ruleItem}>
              📅 Notice Period: {rules.tenancy?.notice_period} month(s)
            </span>
            <span style={styles.ruleItem}>
              🔒 Min Stay: {rules.tenancy?.min_stay_months} month(s)
            </span>
          </div>
        </div>

        {/* Occupant Type */}
        <div style={styles.ruleCategory}>
          <h5 style={styles.ruleSubtitle}>👤 Suitable For</h5>
          <div style={styles.ruleGrid}>
            {rules.occupant_type?.students_only && (
              <span style={styles.ruleItem}>🎓 Students Only</span>
            )}
            {rules.occupant_type?.boys_only && (
              <span style={styles.ruleItem}>👨 Boys Only</span>
            )}
            {rules.occupant_type?.girls_only && (
              <span style={styles.ruleItem}>👩 Girls Only</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNearbyPlaces = () => {
    if (!pg?.nearby_places) return null;

    const { nearby_places } = pg;

    const nearbyCategories = [
      { title: "🚆 Transport", items: nearby_places.transport },
      { title: "🏥 Healthcare", items: nearby_places.healthcare },
      { title: "🛒 Shopping", items: nearby_places.shopping },
      { title: "🏫 Education", items: nearby_places.education },
      { title: "💼 Employment", items: nearby_places.employment }
    ];

    return (
      <div style={styles.nearbySection}>
        <h4 style={styles.categoryTitle}>📍 Nearby Places</h4>
        {nearbyCategories.map((category, idx) => {
          const hasItems = Object.values(category.items || {}).some(val => val);
          if (!hasItems) return null;

          return (
            <div key={idx} style={styles.nearbyCategory}>
              <h5 style={styles.nearbySubtitle}>{category.title}</h5>
              <div style={styles.nearbyGrid}>
                {Object.entries(category.items || {}).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} style={styles.nearbyItem}>
                      <span>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
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
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{pg.name}</h1>
        <div style={styles.rating}>
          <span style={styles.star}>⭐</span>
          <span>{pg.rating || "New"}</span>
        </div>
      </div>

      {/* Address */}
      <div style={styles.addressContainer}>
        <span style={styles.locationIcon}>📍</span>
        <p style={styles.address}>{pg.location?.address}</p>
      </div>
      <p style={styles.area}>{pg.location?.area}, {pg.location?.city}</p>

      {/* Quick Info */}
      <div style={styles.quickInfo}>
        <div style={styles.infoChip}>
          <span>🏷️ {pg.category}</span>
        </div>
        <div style={styles.infoChip}>
          <span>👥 {pg.type}</span>
        </div>
        {pg.available_rooms > 0 && (
          <div style={styles.infoChip}>
            <span>🛏️ {pg.available_rooms} rooms left</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            borderBottomColor: activeTab === 'rooms' ? '#4f46e5' : 'transparent',
            color: activeTab === 'rooms' ? '#4f46e5' : '#6b7280'
          }}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms
        </button>
        <button
          style={{
            ...styles.tab,
            borderBottomColor: activeTab === 'pricing' ? '#4f46e5' : 'transparent',
            color: activeTab === 'pricing' ? '#4f46e5' : '#6b7280'
          }}
          onClick={() => setActiveTab('pricing')}
        >
          Pricing
        </button>
        <button
          style={{
            ...styles.tab,
            borderBottomColor: activeTab === 'amenities' ? '#4f46e5' : 'transparent',
            color: activeTab === 'amenities' ? '#4f46e5' : '#6b7280'
          }}
          onClick={() => setActiveTab('amenities')}
        >
          Amenities
        </button>
        <button
          style={{
            ...styles.tab,
            borderBottomColor: activeTab === 'rules' ? '#4f46e5' : 'transparent',
            color: activeTab === 'rules' ? '#4f46e5' : '#6b7280'
          }}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'rooms' && (
          <>
            {/* Availability Summary */}
            {pg.availability_summary && Object.keys(pg.availability_summary).length > 0 && (
              <div style={styles.summaryBox}>
                <p style={styles.summaryTitle}>📊 Quick Availability</p>
                <div style={styles.badgeContainer}>
                  {Object.entries(pg.availability_summary).map(([type, data]) => (
                    <span key={type} style={styles.badge}>
                      {type}: {data.available_beds || data} beds left
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                    </div>
                    <div style={styles.priceInfo}>
                      <span style={styles.price}>₹{room.price}</span>
                      <span style={styles.beds}>{room.available_beds} beds left</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noRooms}>
                <p style={styles.noRoomsText}>No rooms currently available</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'pricing' && (
          <>
            {renderPriceSection()}
            {renderFoodDetails()}
          </>
        )}

        {activeTab === 'amenities' && (
          <>
            {renderAmenities()}
            {renderNearbyPlaces()}
          </>
        )}

        {activeTab === 'rules' && renderRules()}
      </div>

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
          Continue to Booking • ₹{getSelectedPrice() || 'Select option'}/month
        </button>

        {pg.contact?.phone && (
          <a href={`tel:${pg.contact.phone}`} style={{ textDecoration: 'none' }}>
            <button style={styles.callBtn}>
              📞 Contact {pg.contact.person || 'Owner'}
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
    minHeight: "100vh"
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
    marginBottom: "12px"
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
    fontSize: "14px"
  },
  star: {
    fontSize: "16px"
  },
  addressContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "4px"
  },
  locationIcon: {
    fontSize: "18px"
  },
  address: {
    margin: 0,
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: "1.5"
  },
  area: {
    margin: "0 0 16px 26px",
    color: "#6b7280",
    fontSize: "14px"
  },
  quickInfo: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "24px"
  },
  infoChip: {
    backgroundColor: "#e5e7eb",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#374151"
  },
  tabs: {
    display: "flex",
    gap: "16px",
    borderBottom: "2px solid #e5e7eb",
    marginBottom: "20px",
    overflowX: "auto",
    paddingBottom: "2px"
  },
  tab: {
    padding: "8px 4px",
    border: "none",
    background: "none",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  },
  tabContent: {
    minHeight: "400px",
    marginBottom: "20px"
  },
  summaryBox: {
    backgroundColor: "#e0f2fe",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "20px"
  },
  summaryTitle: {
    margin: "0 0 12px 0",
    fontWeight: "600",
    color: "#0369a1"
  },
  badgeContainer: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  badge: {
    backgroundColor: "#fff",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    border: "1px solid #bae6fd",
    color: "#0369a1"
  },
  sectionTitle: {
    fontSize: "18px",
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
    borderRadius: "12px",
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
    marginBottom: "4px"
  },
  roomType: {
    fontSize: "13px",
    color: "#6b7280"
  },
  priceInfo: {
    textAlign: "right"
  },
  price: {
    display: "block",
    fontWeight: "bold",
    color: "#4f46e5",
    fontSize: "18px"
  },
  beds: {
    fontSize: "12px",
    color: "#16a34a"
  },
  noRooms: {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "2px dashed #e5e7eb"
  },
  noRoomsText: {
    color: "#6b7280",
    margin: 0
  },
  priceSection: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px"
  },
  basePriceCard: {
    backgroundColor: "#f3f4f6",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "20px",
    textAlign: "center"
  },
  basePriceLabel: {
    display: "block",
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "4px"
  },
  basePriceValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#4f46e5"
  },
  priceCategory: {
    marginBottom: "24px"
  },
  categoryTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#374151"
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px"
  },
  priceCard: {
    padding: "12px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  priceLabel: {
    display: "block",
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "4px"
  },
  priceAmount: {
    display: "block",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#4f46e5"
  },
  configText: {
    display: "block",
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "4px"
  },
  chargesSection: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb"
  },
  chargesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  chargeItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    padding: "8px 0"
  },
  chargeValue: {
    fontWeight: "600",
    color: "#374151"
  },
  foodSection: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "16px"
  },
  foodCard: {
    backgroundColor: "#f9fafb",
    padding: "12px",
    borderRadius: "8px"
  },
  foodItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0"
  },
  foodValue: {
    fontWeight: "500",
    color: "#374151"
  },
  amenitiesSection: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px"
  },
  amenityCategory: {
    marginBottom: "20px"
  },
  amenityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "12px"
  },
  amenityItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px"
  },
  amenityEmoji: {
    fontSize: "18px"
  },
  amenityLabel: {
    fontSize: "13px",
    color: "#374151"
  },
  nearbySection: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "16px"
  },
  nearbyCategory: {
    marginBottom: "16px"
  },
  nearbySubtitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#4b5563"
  },
  nearbyGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  nearbyItem: {
    fontSize: "13px",
    color: "#6b7280",
    padding: "4px 0"
  },
  rulesSection: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px"
  },
  ruleCategory: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px"
  },
  ruleSubtitle: {
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 8px 0",
    color: "#4b5563"
  },
  ruleGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  ruleItem: {
    fontSize: "13px",
    padding: "4px 8px",
    backgroundColor: "#fff",
    borderRadius: "6px",
    border: "1px solid #e5e7eb"
  },
  selectedSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#f3f4f6",
    borderRadius: "10px",
    marginBottom: "16px",
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
    gap: "12px",
    position: "sticky",
    bottom: "20px",
    backgroundColor: "#f9fafb",
    padding: "16px 0"
  },
  payBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "all 0.2s"
  },
  callBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#fff",
    color: "#22c55e",
    border: "2px solid #22c55e",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer"
  }
};

export default ScanPG;