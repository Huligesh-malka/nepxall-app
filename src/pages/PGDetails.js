import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";

// Import icons from lucide-react
import {
  X,
  MapPin,
  Phone,
  Home,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Shield,
  Calendar,
  Clock,
  UserCheck,
  BookOpen,
  Info,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  Coffee,
  Utensils,
  Snowflake,
  Navigation,
  Star,
  DollarSign,
  Key,
  DoorOpen,
  Sofa,
  Flame,
  Leaf,
  Zap,
  Building,
  Hash,
  Sun,
  Moon,
  Tv,
  Wind,
  Sparkles,
  Pill,
  Dumbbell,
  Wrench
} from "lucide-react";

/* ================= LEAFLET FIX ================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Base URL for images
const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

// Helper function to get correct image URL
const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  
  if (photo.startsWith('http')) {
    return photo;
  }
  
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BASE_URL}${relativePath}`;
    }
  }
  
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) {
      return `${BASE_URL}${uploadsMatch[0]}`;
    }
  }
  
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BASE_URL}${normalizedPath}`;
};

// Safe price formatting function
const formatPrice = (price) => {
  if (price === null || price === undefined || price === "" || price === "0" || price === 0) {
    return "0";
  }
  
  const numPrice = Number(price);
  
  if (isNaN(numPrice)) {
    return "0";
  }
  
  try {
    return numPrice.toLocaleString('en-IN');
  } catch (error) {
    return numPrice.toString();
  }
};

// Get tomorrow's date for check-in
const getTomorrowDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMaxDate = () => {
  const max = new Date();
  max.setMonth(max.getMonth() + 6);
  const year = max.getFullYear();
  const month = String(max.getMonth() + 1).padStart(2, '0');
  const day = String(max.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/* ================= BOOKING MODAL ================= */
const BookingModal = ({ pg, onClose, onBook, bookingLoading }) => {
  const [bookingData, setBookingData] = useState({
    checkInDate: "",
    roomType: ""
  });

  useEffect(() => {
    const defaultRoomType = getDefaultRoomType();
    setBookingData({
      checkInDate: "",
      roomType: defaultRoomType || ""
    });
  }, [pg]);

  const getDefaultRoomType = () => {
    if (pg?.pg_category === "pg") {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) return "Single Sharing";
      if (pg.double_sharing && Number(pg.double_sharing) > 0) return "Double Sharing";
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) return "Triple Sharing";
      if (pg.four_sharing && Number(pg.four_sharing) > 0) return "Four Sharing";
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) return "Single Room";
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) return "Double Room";
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) return "1BHK";
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) return "2BHK";
    }
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onBook(bookingData);
  };

  const getRoomTypes = () => {
    const types = [];
    
    if (pg?.pg_category === "pg") {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) types.push({ 
        value: "Single Sharing", 
        label: `Single Sharing - ₹${formatPrice(pg.single_sharing)}` 
      });
      if (pg.double_sharing && Number(pg.double_sharing) > 0) types.push({ 
        value: "Double Sharing", 
        label: `Double Sharing - ₹${formatPrice(pg.double_sharing)}` 
      });
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) types.push({ 
        value: "Triple Sharing", 
        label: `Triple Sharing - ₹${formatPrice(pg.triple_sharing)}` 
      });
      if (pg.four_sharing && Number(pg.four_sharing) > 0) types.push({ 
        value: "Four Sharing", 
        label: `Four Sharing - ₹${formatPrice(pg.four_sharing)}` 
      });
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ 
        value: "Single Room", 
        label: `Single Room - ₹${formatPrice(pg.co_living_single_room)}` 
      });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ 
        value: "Double Room", 
        label: `Double Room - ₹${formatPrice(pg.co_living_double_room)}` 
      });
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) types.push({ 
        value: "1BHK", 
        label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` 
      });
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) types.push({ 
        value: "2BHK", 
        label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` 
      });
    }
    
    return types;
  };

  const getSelectedPrice = () => {
    if (!bookingData.roomType) return null;
    
    if (pg?.pg_category === "pg") {
      if (bookingData.roomType === "Single Sharing") return pg.single_sharing;
      if (bookingData.roomType === "Double Sharing") return pg.double_sharing;
      if (bookingData.roomType === "Triple Sharing") return pg.triple_sharing;
      if (bookingData.roomType === "Four Sharing") return pg.four_sharing;
    } else if (pg?.pg_category === "coliving") {
      if (bookingData.roomType === "Single Room") return pg.co_living_single_room;
      if (bookingData.roomType === "Double Room") return pg.co_living_double_room;
    } else if (pg?.pg_category === "to_let") {
      if (bookingData.roomType === "1BHK") return pg.price_1bhk;
      if (bookingData.roomType === "2BHK") return pg.price_2bhk;
    }
    return null;
  };

  const selectedPrice = getSelectedPrice();

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
        <button onClick={onClose} disabled={bookingLoading} style={styles.modalCloseBtn}>
          <X size={24} />
        </button>

        <div style={styles.modalContent}>
          <h2 style={styles.modalTitle}>Book {pg?.pg_name}</h2>
          <p style={styles.modalSubtitle}>Fill details to request booking</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Check-in Date *</label>
              <input
                type="date"
                name="checkInDate"
                value={bookingData.checkInDate}
                onChange={handleInputChange}
                required
                disabled={bookingLoading}
                min={getTomorrowDate()}
                max={getMaxDate()}
                style={styles.formInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                {pg?.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
              </label>
              <select
                name="roomType"
                value={bookingData.roomType}
                onChange={handleInputChange}
                required
                disabled={bookingLoading}
                style={styles.formSelect}
              >
                <option value="">Select type</option>
                {getRoomTypes().map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              {selectedPrice !== null && selectedPrice > 0 && (
                <p style={styles.selectedPrice}>
                  ₹{formatPrice(selectedPrice)}/month
                </p>
              )}
            </div>

            <div style={styles.modalActions}>
              <button type="button" onClick={onClose} disabled={bookingLoading} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={bookingLoading} style={styles.confirmBtn}>
                {bookingLoading ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([0, 0]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch PG Details
  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pg/${id}`);
        
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to fetch");
        }

        const data = res.data.data;
        
        const photos = Array.isArray(data.photos)
          ? data.photos.map(p => ({ type: "photo", src: getCorrectImageUrl(p) }))
          : [];
        
        setMedia(photos);
        setPG(data);
        
        if (data.latitude && data.longitude) {
          setMapCenter([data.latitude, data.longitude]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPGDetails();
  }, [id]);

  // Fetch Nearby Places
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const fetchNearbyPlaces = async () => {
      try {
        const query = `
          [out:json];
          (
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="hospital"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="school"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="bank"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="atm"];
            node(around:1200,${pg.latitude},${pg.longitude})["railway"="station"];
            node(around:1200,${pg.latitude},${pg.longitude})["shop"="supermarket"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="restaurant"];
            node(around:1200,${pg.latitude},${pg.longitude})["leisure"="park"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="place_of_worship"];
          );
          out tags 10;
        `;

        const res = await axios.post(
          "https://overpass-api.de/api/interpreter",
          query,
          { headers: { "Content-Type": "text/plain" } }
        );

        const places = res.data.elements
          .filter(el => el.tags?.name)
          .map(el => ({
            name: el.tags.name,
            type: el.tags.amenity || el.tags.shop || el.tags.railway || el.tags.leisure,
            icon: getPlaceIcon(el),
            coordinates: el.lat && el.lon ? [el.lat, el.lon] : null
          }))
          .slice(0, 8);

        setNearbyHighlights(places);
      } catch (err) {
        console.error("Error fetching nearby places:", err);
      }
    };

    fetchNearbyPlaces();
  }, [pg]);

  // Fetch Nearby PGs
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const fetchNearbyPGs = async () => {
      try {
        const res = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
        if (res.data?.success && res.data?.data) {
          const pgs = res.data.data.slice(0, 3);
          setNearbyPGs(pgs);
        }
      } catch (err) {
        console.error("Error fetching nearby PGs:", err);
      }
    };

    fetchNearbyPGs();
  }, [pg, id]);

  const getPlaceIcon = (place) => {
    const type = place.tags?.amenity || place.tags?.shop || place.tags?.railway;
    if (type === "hospital") return "🏥";
    if (type === "school") return "🏫";
    if (type === "bank") return "🏦";
    if (type === "atm") return "🏧";
    if (type === "station") return "🚆";
    if (type === "supermarket") return "🛒";
    if (type === "restaurant") return "🍽️";
    if (place.tags?.leisure === "park") return "🌳";
    if (place.tags?.amenity === "place_of_worship") return "⛪";
    return "📍";
  };

  const getStartingPrice = () => {
    if (!pg) return null;
    
    if (pg.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) return pg.price_1bhk;
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) return pg.price_2bhk;
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) return pg.co_living_single_room;
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) return pg.co_living_double_room;
    } else {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) return pg.single_sharing;
      if (pg.double_sharing && Number(pg.double_sharing) > 0) return pg.double_sharing;
    }
    return null;
  };

  const handleBookNow = () => {
    if (!user) {
      showNotification("Please login to book");
      navigate("/login");
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      setBookingLoading(true);
      const token = await user.getIdToken(true);
      
      await api.post(`/bookings/${id}`, {
        check_in_date: bookingData.checkInDate,
        room_type: bookingData.roomType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification("Booking request sent!");
      setShowBookingModal(false);
    } catch (error) {
      showNotification(error.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const getFacilities = () => {
    const facilities = [];
    if (pg?.ac_available) facilities.push({ icon: "❄️", label: "AC" });
    if (pg?.wifi_available) facilities.push({ icon: "📶", label: "WiFi" });
    if (pg?.food_available) facilities.push({ icon: "🍽️", label: "Food" });
    if (pg?.parking_available) facilities.push({ icon: "🚗", label: "Parking" });
    if (pg?.cctv) facilities.push({ icon: "📹", label: "CCTV" });
    if (pg?.geyser) facilities.push({ icon: "🚿", label: "Geyser" });
    if (pg?.washing_machine) facilities.push({ icon: "🧺", label: "Washing" });
    if (pg?.power_backup) facilities.push({ icon: "🔋", label: "Power Backup" });
    return facilities;
  };

  const getRules = () => {
    const rules = [];
    if (pg?.visitor_allowed === true) rules.push({ icon: "👥", label: "Visitors Allowed", allowed: true });
    if (pg?.couple_allowed === true) rules.push({ icon: "❤️", label: "Couples Allowed", allowed: true });
    if (pg?.smoking_allowed === true) rules.push({ icon: "🚬", label: "Smoking Allowed", allowed: true });
    if (pg?.pets_allowed === true) rules.push({ icon: "🐕", label: "Pets Allowed", allowed: true });
    if (pg?.min_stay_months && Number(pg.min_stay_months) > 0) {
      rules.push({ icon: "📅", label: `Min Stay: ${pg.min_stay_months} months`, allowed: true });
    }
    return rules;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div style={styles.errorContainer}>
        <h2>Property Not Found</h2>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  const startingPrice = getStartingPrice();
  const facilities = getFacilities();
  const rules = getRules();
  const isToLet = pg.pg_category === "to_let";
  const isCoLiving = pg.pg_category === "coliving";

  return (
    <div style={styles.page}>
      {/* Notification */}
      {notification && (
        <div style={styles.notification}>
          {notification}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink} onClick={() => navigate("/")}>Home</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbCurrent}>{pg.pg_name}</span>
      </div>

      {/* Image Gallery */}
      {media.length > 0 ? (
        <div style={styles.slider}>
          <img 
            src={media[index].src} 
            alt={pg.pg_name} 
            style={styles.media}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/800x400?text=No+Image";
            }}
          />
          {media.length > 1 && (
            <>
              <button style={styles.navBtnLeft} onClick={() => setIndex(i => (i === 0 ? media.length - 1 : i - 1))}>
                <ChevronLeft size={24} />
              </button>
              <button style={styles.navBtnRight} onClick={() => setIndex(i => (i + 1) % media.length)}>
                <ChevronRight size={24} />
              </button>
              <div style={styles.mediaCounter}>
                {index + 1} / {media.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={styles.noMedia}>
          <div style={styles.noMediaIcon}>🏠</div>
          <p>No photos available</p>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.mainCard}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>{pg.pg_name}</h1>
            <p style={styles.address}>
              <MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}`}
            </p>
          </div>
          <button style={styles.bookButton} onClick={handleBookNow}>
            <BookOpen size={18} />
            Book Now
          </button>
        </div>

        <div style={styles.badgeRow}>
          <span style={styles.typeBadge}>
            {isToLet ? "🏠 To-Let" : isCoLiving ? "🤝 Coliving" : "🏘️ PG"}
          </span>
          {!isToLet && !isCoLiving && pg.pg_type && (
            <span style={styles.genderBadge}>
              {pg.pg_type === "boys" ? "👨 Boys Only" : "👩 Girls Only"}
            </span>
          )}
          {pg.available_rooms !== undefined && (
            <span style={{
              ...styles.availabilityBadge,
              backgroundColor: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
            }}>
              {pg.available_rooms > 0 ? `${pg.available_rooms} Available` : "Full"}
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>💰</span>
            <div>
              <div style={styles.statLabel}>Starting from</div>
              <div style={styles.statValue}>
                {startingPrice ? `₹${startingPrice.toLocaleString()}/mo` : "Request"}
              </div>
            </div>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>🏠</span>
            <div>
              <div style={styles.statLabel}>Total Rooms</div>
              <div style={styles.statValue}>{pg.total_rooms || "—"}</div>
            </div>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>✅</span>
            <div>
              <div style={styles.statLabel}>Facilities</div>
              <div style={styles.statValue}>{facilities.length}+</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={styles.twoColumn}>
        {/* Left Column */}
        <div>
          {/* Description */}
          {pg.description && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>About</h3>
              <p style={styles.description}>{pg.description}</p>
            </div>
          )}

          {/* Facilities */}
          {facilities.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Facilities</h3>
              <div style={styles.facilitiesGrid}>
                {facilities.map((facility, i) => (
                  <div key={i} style={styles.facilityItem}>
                    <span style={styles.facilityIcon}>{facility.icon}</span>
                    <span>{facility.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {rules.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Rules</h3>
              <div style={styles.rulesGrid}>
                {rules.map((rule, i) => (
                  <div key={i} style={styles.ruleItem}>
                    <span>{rule.icon}</span>
                    <span>{rule.label}</span>
                    {rule.allowed && <span style={styles.checkIcon}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Location Map */}
          {pg.latitude && pg.longitude && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Location</h3>
              <div style={styles.mapContainer}>
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: "200px", width: "100%", borderRadius: "16px" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pg.latitude, pg.longitude]}>
                    <Popup>{pg.pg_name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <button 
                style={styles.directionButton}
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`, "_blank")}
              >
                <Navigation size={16} /> Get Directions
              </button>
            </div>
          )}

          {/* Nearby Places */}
          {nearbyHighlights.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Nearby Places</h3>
              <div style={styles.nearbyList}>
                {nearbyHighlights.map((place, i) => (
                  <div key={i} style={styles.nearbyItem}>
                    <span style={styles.nearbyIcon}>{place.icon}</span>
                    <div>
                      <div style={styles.nearbyName}>{place.name}</div>
                      <div style={styles.nearbyType}>{place.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby PGs */}
          {nearbyPGs.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Nearby Properties</h3>
              <div style={styles.nearbyPGsList}>
                {nearbyPGs.map((nearby, i) => (
                  <div key={i} style={styles.nearbyPGItem} onClick={() => navigate(`/pg/${nearby.id}`)}>
                    <div style={styles.nearbyPGInfo}>
                      <div style={styles.nearbyPGName}>{nearby.pg_name}</div>
                      <div style={styles.nearbyPGPrice}>
                        {nearby.single_sharing ? `₹${nearby.single_sharing}/mo` : "View Details"}
                      </div>
                    </div>
                    <span style={styles.nearbyPGArrow}>→</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Book Button */}
      <div style={styles.stickyBar}>
        <div style={styles.stickyContent}>
          <div>
            <div style={styles.stickyPrice}>
              {startingPrice ? `₹${startingPrice.toLocaleString()}/month` : "Contact for price"}
            </div>
            <div style={styles.stickyInfo}>{pg.area || pg.city}</div>
          </div>
          <button style={styles.stickyBookButton} onClick={handleBookNow}>
            Book Now
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          pg={pg}
          onClose={() => setShowBookingModal(false)}
          onBook={handleBookingSubmit}
          bookingLoading={bookingLoading}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ================= MODERN STYLES ================= */
const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 20px 100px",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "16px",
    color: "#64748b",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  errorContainer: {
    textAlign: "center",
    padding: "60px 20px",
  },

  backButton: {
    padding: "12px 28px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },

  notification: {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#10b981",
    color: "white",
    padding: "12px 24px",
    borderRadius: "50px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease",
    fontSize: "14px",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "24px",
    fontSize: "14px",
    color: "#64748b",
  },

  breadcrumbLink: {
    color: "#3b82f6",
    cursor: "pointer",
  },

  breadcrumbSeparator: {
    color: "#cbd5e1",
  },

  breadcrumbCurrent: {
    color: "#1e293b",
    fontWeight: "500",
  },

  slider: {
    position: "relative",
    borderRadius: "24px",
    overflow: "hidden",
    marginBottom: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },

  media: {
    width: "100%",
    height: "400px",
    objectFit: "cover",
  },

  navBtnLeft: {
    position: "absolute",
    top: "50%",
    left: "16px",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.9)",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },

  navBtnRight: {
    position: "absolute",
    top: "50%",
    right: "16px",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.9)",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },

  mediaCounter: {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
  },

  noMedia: {
    height: "300px",
    background: "#e2e8f0",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    color: "#64748b",
  },

  noMediaIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },

  mainCard: {
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "28px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },

  address: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  bookButton: {
    padding: "12px 28px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "24px",
  },

  typeBadge: {
    background: "#e0e7ff",
    color: "#4338ca",
    padding: "4px 14px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "500",
  },

  genderBadge: {
    background: "#fce7f3",
    color: "#be185d",
    padding: "4px 14px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "500",
  },

  availabilityBadge: {
    color: "white",
    padding: "4px 14px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "500",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "20px",
  },

  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  statIcon: {
    fontSize: "24px",
  },

  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },

  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "28px",
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "28px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 16px 0",
    color: "#0f172a",
  },

  description: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#334155",
    margin: "0",
  },

  facilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "12px",
  },

  facilityItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    background: "#f8fafc",
    borderRadius: "12px",
    fontSize: "14px",
  },

  facilityIcon: {
    fontSize: "18px",
  },

  rulesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  ruleItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "#f8fafc",
    borderRadius: "12px",
    fontSize: "14px",
  },

  checkIcon: {
    marginLeft: "auto",
    color: "#10b981",
    fontWeight: "bold",
  },

  mapContainer: {
    marginBottom: "16px",
  },

  directionButton: {
    width: "100%",
    padding: "12px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  nearbyList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  nearbyItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
  },

  nearbyIcon: {
    fontSize: "20px",
  },

  nearbyName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
  },

  nearbyType: {
    fontSize: "12px",
    color: "#64748b",
  },

  nearbyPGsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  nearbyPGItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  nearbyPGInfo: {
    flex: 1,
  },

  nearbyPGName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
  },

  nearbyPGPrice: {
    fontSize: "13px",
    color: "#3b82f6",
    fontWeight: "500",
  },

  nearbyPGArrow: {
    fontSize: "20px",
    color: "#94a3b8",
  },

  stickyBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "white",
    padding: "16px 24px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
    zIndex: 100,
    borderTop: "1px solid #e2e8f0",
  },

  stickyContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },

  stickyPrice: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },

  stickyInfo: {
    fontSize: "12px",
    color: "#64748b",
  },

  stickyBookButton: {
    padding: "12px 28px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px",
  },

  modalContainer: {
    background: "white",
    borderRadius: "28px",
    width: "100%",
    maxWidth: "450px",
    position: "relative",
  },

  modalCloseBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "#f1f5f9",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    padding: "32px",
  },

  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#0f172a",
  },

  modalSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "24px",
  },

  formGroup: {
    marginBottom: "20px",
  },

  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
  },

  formInput: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    fontSize: "14px",
  },

  formSelect: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    fontSize: "14px",
    background: "white",
  },

  selectedPrice: {
    marginTop: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#10b981",
  },

  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },

  cancelBtn: {
    flex: 1,
    padding: "12px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },

  confirmBtn: {
    flex: 2,
    padding: "12px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
};

// Responsive
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  styles.twoColumn.gridTemplateColumns = "1fr";
  styles.media.height = "250px";
  styles.title.fontSize = "22px";
  styles.mainCard.padding = "20px";
  styles.card.padding = "20px";
}