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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  useEffect(() => {
    fetchPG();
    trackScan();
  }, [id]);

  const fetchPG = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_CONFIG.USER_API_URL}/scan/${id}`
      );

      if (res.data.success) {
        setPg(res.data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const trackScan = async () => {
    try {
      await axios.post(`${API_CONFIG.USER_API_URL}/scan/${id}/track`);
    } catch (err) {
      console.error("Track error:", err);
    }
  };

  const goToPayment = () => {
    if (!selectedRoom) {
      alert("Please select a room to proceed");
      return;
    }
    navigate(`/booking/${id}?roomId=${selectedRoom.id}&type=${selectedRoom.sharing_type}&price=${selectedRoom.price}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading property details...</p>
      </div>
    );
  }

  if (!pg) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>🏠</div>
        <h2 style={styles.errorTitle}>Property Not Found</h2>
        <p style={styles.errorMessage}>The QR code link has expired or the property is no longer available.</p>
        <button 
          onClick={() => navigate('/')} 
          style={styles.errorButton}
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Image Gallery */}
      <div style={styles.imageGallery}>
        <div style={styles.mainImageContainer}>
          <img 
            src={pg.media?.photos[activeImageIndex]?.url || pg.photos?.[0] || '/default-pg.jpg'} 
            alt={pg.name}
            style={styles.mainImage}
          />
          <div style={styles.imageCount}>
            {activeImageIndex + 1} / {pg.media?.photo_count || pg.photos?.length || 1}
          </div>
        </div>
        
        {pg.media?.photo_count > 1 && (
          <div style={styles.thumbnailStrip}>
            {pg.media?.photos.slice(0, 5).map((photo, idx) => (
              <img
                key={idx}
                src={photo.url}
                alt={`Thumbnail ${idx + 1}`}
                style={{
                  ...styles.thumbnail,
                  border: activeImageIndex === idx ? '3px solid #4f46e5' : '3px solid transparent'
                }}
                onClick={() => setActiveImageIndex(idx)}
              />
            ))}
            {pg.media?.photo_count > 5 && (
              <div style={styles.moreThumbnails}>+{pg.media.photo_count - 5}</div>
            )}
          </div>
        )}
      </div>

      {/* Property Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{pg.name}</h1>
          <div style={styles.location}>
            <span style={styles.locationIcon}>📍</span>
            <span>{pg.location.area}, {pg.location.city}</span>
          </div>
        </div>
        
        {/* Rating Badge */}
        {pg.stats?.rating > 0 && (
          <div style={styles.ratingBadge}>
            <span style={styles.ratingStar}>★</span>
            <span style={styles.ratingValue}>{pg.stats.rating.toFixed(1)}</span>
            <span style={styles.ratingCount}>({pg.stats.reviews_count})</span>
          </div>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Starting from</span>
            <span style={styles.statValue}>{formatPrice(pg.pricing_summary.starting_from)}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🛏️</div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Available Beds</span>
            <span style={styles.statValue}>{pg.available_rooms?.total_beds || 0}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🔒</div>
          <div style={styles.statContent}>
            <span style={styles.statLabel}>Security</span>
            <span style={styles.statValue}>{formatPrice(pg.pricing_summary.security_deposit)}</span>
          </div>
        </div>
      </div>

      {/* Amenities Preview */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Amenities</h3>
          <button 
            onClick={() => setShowAllAmenities(!showAllAmenities)}
            style={styles.seeAllButton}
          >
            {showAllAmenities ? 'Show Less' : 'See All'}
          </button>
        </div>
        
        <div style={styles.amenitiesGrid}>
          {pg.amenities?.has_wifi && (
            <div style={styles.amenityItem}>
              <span style={styles.amenityIcon}>📶</span>
              <span>WiFi</span>
            </div>
          )}
          {pg.amenities?.has_ac && (
            <div style={styles.amenityItem}>
              <span style={styles.amenityIcon}>❄️</span>
              <span>AC</span>
            </div>
          )}
          {pg.amenities?.has_parking && (
            <div style={styles.amenityItem}>
              <span style={styles.amenityIcon}>🅿️</span>
              <span>Parking</span>
            </div>
          )}
          {pg.amenities?.has_gym && (
            <div style={styles.amenityItem}>
              <span style={styles.amenityIcon}>💪</span>
              <span>Gym</span>
            </div>
          )}
          {pg.amenities?.has_housekeeping && (
            <div style={styles.amenityItem}>
              <span style={styles.amenityIcon}>🧹</span>
              <span>Housekeeping</span>
            </div>
          )}
          {pg.amenities?.has_cctv && (
            <div style={styles.amenityItem}>
              <span style={styles.amenityIcon}>📹</span>
              <span>CCTV</span>
            </div>
          )}
          {pg.amenities?.has_power_backup && (
            <div style={styles.amenityItem}>
              <span style={styles.amenityIcon}>⚡</span>
              <span>Power Backup</span>
            </div>
          )}
        </div>
      </div>

      {/* Availability Summary */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Availability Summary</h3>
        <div style={styles.summaryGrid}>
          {Object.entries(pg.available_rooms?.summary || {}).map(([type, data]) => (
            <div key={type} style={styles.summaryCard}>
              <span style={styles.summaryType}>{type}</span>
              <span style={styles.summaryCount}>{data.total_beds} beds</span>
              <span style={styles.summaryPrice}>{formatPrice(data.min_price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Available Rooms */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Select a Room</h3>
        
        {pg.available_rooms?.rooms_list?.length > 0 ? (
          <div style={styles.roomList}>
            {pg.available_rooms.rooms_list.map((room, index) => (
              <div
                key={index}
                style={{
                  ...styles.roomCard,
                  borderColor: selectedRoom?.id === room.id ? '#4f46e5' : '#e5e7eb',
                  backgroundColor: selectedRoom?.id === room.id ? '#f5f3ff' : '#fff'
                }}
                onClick={() => setSelectedRoom(room)}
              >
                <div style={styles.roomHeader}>
                  <div style={styles.roomNumber}>Room {room.room_number}</div>
                  {room.badge && (
                    <div style={{
                      ...styles.roomBadge,
                      backgroundColor: room.badge_color === 'red' ? '#fee2e2' : 
                                     room.badge_color === 'orange' ? '#fff7ed' : '#dcfce7',
                      color: room.badge_color === 'red' ? '#dc2626' :
                             room.badge_color === 'orange' ? '#ea580c' : '#16a34a'
                    }}>
                      {room.badge}
                    </div>
                  )}
                </div>
                
                <div style={styles.roomDetails}>
                  <div style={styles.roomType}>
                    <span>🛏️ {room.sharing_type}</span>
                    {room.features.attached_bathroom && <span>🚽 Attached Bathroom</span>}
                  </div>
                  
                  <div style={styles.roomPriceInfo}>
                    <div style={styles.roomPrice}>{formatPrice(room.price)}</div>
                    <div style={styles.roomAvailability}>
                      {room.available_beds} of {room.total_beds} beds available
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noRooms}>
            <p>Sorry, no rooms are currently available.</p>
          </div>
        )}
      </div>

      {/* Rules Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Rules & Policies</h3>
        <div style={styles.rulesList}>
          {pg.rules?.couple_allowed && (
            <div style={styles.ruleItem}>
              <span style={styles.ruleIcon}>👫</span>
              <span>Couples Allowed</span>
            </div>
          )}
          {pg.rules?.family_allowed && (
            <div style={styles.ruleItem}>
              <span style={styles.ruleIcon}>👪</span>
              <span>Family Allowed</span>
            </div>
          )}
          <div style={styles.ruleItem}>
            <span style={styles.ruleIcon}>⏰</span>
            <span>Min Stay: {pg.rules?.min_stay || 1} months</span>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleIcon}>📝</span>
            <span>Notice Period: {pg.rules?.notice_period || 1} month</span>
          </div>
          {pg.rules?.visitors_till && (
            <div style={styles.ruleItem}>
              <span style={styles.ruleIcon}>🚪</span>
              <span>Visitors till {pg.rules.visitors_till}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.footer}>
        <button 
          onClick={goToPayment} 
          style={{
            ...styles.payBtn,
            opacity: !selectedRoom ? 0.5 : 1,
            cursor: !selectedRoom ? 'not-allowed' : 'pointer'
          }}
          disabled={!selectedRoom}
        >
          Continue to Booking
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
    padding: "20px 16px 100px",
    backgroundColor: "#f9fafb",
    minHeight: "100vh"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f9fafb"
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #e5e7eb",
    borderTopColor: "#4f46e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    marginTop: "20px",
    color: "#6b7280",
    fontSize: "16px"
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
    backgroundColor: "#f9fafb",
    textAlign: "center"
  },
  errorIcon: {
    fontSize: "64px",
    marginBottom: "20px"
  },
  errorTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "10px"
  },
  errorMessage: {
    color: "#6b7280",
    marginBottom: "30px",
    maxWidth: "300px"
  },
  errorButton: {
    padding: "12px 24px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer"
  },
  imageGallery: {
    marginBottom: "20px"
  },
  mainImageContainer: {
    position: "relative",
    width: "100%",
    height: "250px",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "12px"
  },
  mainImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  imageCount: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500"
  },
  thumbnailStrip: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "4px"
  },
  thumbnail: {
    width: "60px",
    height: "60px",
    borderRadius: "8px",
    objectFit: "cover",
    cursor: "pointer"
  },
  moreThumbnails: {
    width: "60px",
    height: "60px",
    borderRadius: "8px",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    color: "#6b7280"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "4px"
  },
  location: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#6b7280",
    fontSize: "14px"
  },
  locationIcon: {
    fontSize: "16px"
  },
  ratingBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#fef3c7",
    padding: "8px 12px",
    borderRadius: "20px"
  },
  ratingStar: {
    color: "#fbbf24",
    fontSize: "16px"
  },
  ratingValue: {
    fontWeight: "bold",
    color: "#1f2937"
  },
  ratingCount: {
    color: "#6b7280",
    fontSize: "12px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "24px"
  },
  statCard: {
    backgroundColor: "#fff",
    padding: "12px",
    borderRadius: "12px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  statIcon: {
    fontSize: "24px"
  },
  statContent: {
    display: "flex",
    flexDirection: "column"
  },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    marginBottom: "2px"
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1f2937"
  },
  section: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937"
  },
  seeAllButton: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  amenitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px"
  },
  amenityItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "8px",
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    fontSize: "12px",
    color: "#4b5563"
  },
  amenityIcon: {
    fontSize: "20px"
  },
  summaryGrid: {
    display: "grid",
    gap: "10px"
  },
  summaryCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "10px"
  },
  summaryType: {
    fontWeight: "500",
    color: "#1f2937"
  },
  summaryCount: {
    color: "#4f46e5",
    fontWeight: "600"
  },
  summaryPrice: {
    color: "#10b981",
    fontWeight: "600"
  },
  roomList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  roomCard: {
    padding: "16px",
    border: "2px solid #e5e7eb",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  roomNumber: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937"
  },
  roomBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  roomDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  roomType: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
    color: "#6b7280"
  },
  roomPriceInfo: {
    textAlign: "right"
  },
  roomPrice: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#4f46e5"
  },
  roomAvailability: {
    fontSize: "12px",
    color: "#10b981"
  },
  noRooms: {
    textAlign: "center",
    padding: "30px",
    backgroundColor: "#fef2f2",
    borderRadius: "12px",
    color: "#dc2626"
  },
  rulesList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px"
  },
  ruleItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#4b5563"
  },
  ruleIcon: {
    fontSize: "16px"
  },
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 600,
    margin: "0 auto",
    padding: "16px",
    backgroundColor: "#fff",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  payBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer"
  },
  callBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#fff",
    color: "#22c55e",
    border: "2px solid #22c55e",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer"
  }
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default ScanPG;