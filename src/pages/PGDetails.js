import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";

// ================= ICONS (lucide-react) =================
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

// ================= CONSTANTS =================
const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BASE_URL}${relativePath}`;
    }
  }
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) return `${BASE_URL}${uploadsMatch[0]}`;
  }
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BASE_URL}${normalizedPath}`;
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "0";
  const numPrice = Number(price);
  if (isNaN(numPrice)) return "0";
  try {
    return numPrice.toLocaleString('en-IN');
  } catch {
    return numPrice.toString();
  }
};

const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;
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

// ================= BOOKING MODAL =================
const BookingModal = ({ pg, onClose, onBook, bookingLoading }) => {
  const [bookingData, setBookingData] = useState({ checkInDate: "", roomType: "" });

  useEffect(() => {
    const getDefaultRoomType = () => {
      if (pg?.pg_category === "pg") {
        if (pg.single_sharing) return "Single Sharing";
        if (pg.double_sharing) return "Double Sharing";
        if (pg.triple_sharing) return "Triple Sharing";
        if (pg.four_sharing) return "Four Sharing";
        if (pg.single_room) return "Single Room";
        if (pg.double_room) return "Double Room";
      } else if (pg?.pg_category === "coliving") {
        if (pg.co_living_single_room) return "Single Room";
        if (pg.co_living_double_room) return "Double Room";
      } else if (pg?.pg_category === "to_let") {
        if (pg.price_1bhk) return "1BHK";
        if (pg.price_2bhk) return "2BHK";
        if (pg.price_3bhk) return "3BHK";
        if (pg.price_4bhk) return "4BHK";
      }
      return "";
    };
    setBookingData(prev => ({ ...prev, roomType: getDefaultRoomType() }));
  }, [pg]);

  const getRoomTypes = () => {
    const types = [];
    if (pg?.pg_category === "pg") {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) types.push({ value: "Single Sharing", label: `Single Sharing - ₹${formatPrice(pg.single_sharing)}` });
      if (pg.double_sharing && Number(pg.double_sharing) > 0) types.push({ value: "Double Sharing", label: `Double Sharing - ₹${formatPrice(pg.double_sharing)}` });
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) types.push({ value: "Triple Sharing", label: `Triple Sharing - ₹${formatPrice(pg.triple_sharing)}` });
      if (pg.four_sharing && Number(pg.four_sharing) > 0) types.push({ value: "Four Sharing", label: `Four Sharing - ₹${formatPrice(pg.four_sharing)}` });
      if (pg.single_room && Number(pg.single_room) > 0) types.push({ value: "Single Room", label: `Single Room - ₹${formatPrice(pg.single_room)}` });
      if (pg.double_room && Number(pg.double_room) > 0) types.push({ value: "Double Room", label: `Double Room - ₹${formatPrice(pg.double_room)}` });
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ value: "Single Room", label: `Co-Living Single - ₹${formatPrice(pg.co_living_single_room)}` });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ value: "Double Room", label: `Co-Living Double - ₹${formatPrice(pg.co_living_double_room)}` });
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) types.push({ value: "1BHK", label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` });
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) types.push({ value: "2BHK", label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` });
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) types.push({ value: "3BHK", label: `3 BHK - ₹${formatPrice(pg.price_3bhk)}` });
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) types.push({ value: "4BHK", label: `4 BHK - ₹${formatPrice(pg.price_4bhk)}` });
    }
    return types;
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
        <button onClick={onClose} disabled={bookingLoading} style={styles.modalClose}>
          <X size={20} />
        </button>
        <div style={styles.modalContent}>
          <h2 style={styles.modalTitle}>🏠 Complete Booking</h2>
          <p style={styles.modalSubtitle}>Your profile details will be auto-filled</p>

          <div style={styles.modalWarning}>
            <Info size={14} /> You can only request this property once every 24 hours
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onBook(bookingData); }}>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Check-in Date *</label>
              <input
                type="date"
                name="checkInDate"
                value={bookingData.checkInDate}
                onChange={(e) => setBookingData(prev => ({ ...prev, checkInDate: e.target.value }))}
                required
                disabled={bookingLoading}
                min={getTomorrowDate()}
                max={getMaxDate()}
                style={styles.modalInput}
              />
              <p style={styles.modalHint}>Earliest check-in: tomorrow (24h notice)</p>
            </div>

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>{pg?.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}</label>
              <select
                name="roomType"
                value={bookingData.roomType}
                onChange={(e) => setBookingData(prev => ({ ...prev, roomType: e.target.value }))}
                required
                disabled={bookingLoading}
                style={styles.modalSelect}
              >
                <option value="">Select type</option>
                {getRoomTypes().map((type, idx) => (
                  <option key={idx} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.modalInfoBox}>
              <div style={styles.modalInfoIcon}><Info size={14} /></div>
              <div style={styles.modalInfoText}>
                <strong>Booking Information</strong><br/>
                • Auto-filled from your profile<br/>
                • Register number generated automatically<br/>
                • Owner will contact you within 24 hours
              </div>
            </div>

            <div style={styles.modalActions}>
              <button type="button" onClick={onClose} disabled={bookingLoading} style={styles.modalCancel}>
                Cancel
              </button>
              <button type="submit" disabled={bookingLoading} style={styles.modalSubmit}>
                {bookingLoading ? "Processing..." : "Confirm Booking →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ================= HELPER COMPONENTS =================
const Section = ({ title, children, badge }) => (
  <div style={styles.sectionCard}>
    <div style={styles.sectionHeader}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {badge && <span style={styles.sectionBadge}>{badge}</span>}
    </div>
    {children}
  </div>
);

const FacilityPill = ({ icon, label, color }) => (
  <div style={{ ...styles.facilityPill, borderLeftColor: color }}>
    <span style={styles.facilityPillIcon}>{icon}</span>
    <span style={styles.facilityPillLabel}>{label}</span>
    <Check size={14} style={styles.facilityPillCheck} />
  </div>
);

const RuleCard = ({ icon, label, allowed, description }) => (
  <div style={{ ...styles.ruleCard, background: allowed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
    <div style={{ ...styles.ruleIcon, background: allowed ? '#10b981' : '#ef4444' }}>{icon}</div>
    <div style={styles.ruleContent}>
      <div style={{ ...styles.ruleLabel, color: allowed ? '#065f46' : '#991b1b' }}>{label}</div>
      {description && <div style={styles.ruleDesc}>{description}</div>}
      <div style={{ ...styles.ruleStatus, color: allowed ? '#10b981' : '#ef4444' }}>
        {allowed ? '✓ Allowed' : '✗ Not Allowed'}
      </div>
    </div>
  </div>
);

const NearbyPlaceCard = ({ name, type, distance, onView }) => (
  <div style={styles.nearbyPlaceCard} onClick={onView}>
    <div style={styles.nearbyPlaceIcon}>📍</div>
    <div style={styles.nearbyPlaceInfo}>
      <div style={styles.nearbyPlaceName}>{name}</div>
      <div style={styles.nearbyPlaceType}>{type.replace(/_/g, ' ')}</div>
      {distance && <div style={styles.nearbyPlaceDist}>{distance.toFixed(1)} km away</div>}
    </div>
    <button style={styles.nearbyPlaceBtn}>View →</button>
  </div>
);

const calculateDistanceBetweenCoords = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// ================= MAIN COMPONENT =================
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [activeFacilityFilter, setActiveFacilityFilter] = useState("all");

  // Fetch PG details
  useEffect(() => {
    const fetchPG = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pg/${id}`);
        if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch");
        const data = res.data.data;
        setPG(data);
        if (data.latitude && data.longitude) setMapCenter([data.latitude, data.longitude]);

        // Process media
        const photos = Array.isArray(data.photos) ? data.photos.map(p => ({ type: "image", url: getCorrectImageUrl(p) })) : [];
        let videos = [];
        try { videos = JSON.parse(data.videos || "[]").map(v => ({ type: "video", url: getCorrectImageUrl(v) })); } catch(e) {}
        setMedia([...photos, ...videos]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPG();
    else setError("Invalid property ID");
  }, [id]);

  // Fetch nearby places & PGs
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const fetchNearby = async () => {
      try {
        const query = `
          [out:json];
          (
            node(around:1500,${pg.latitude},${pg.longitude})["amenity"~"hospital|school|college|bank|atm|police|restaurant|place_of_worship"];
            node(around:1500,${pg.latitude},${pg.longitude})["shop"~"supermarket|mall"];
            node(around:1500,${pg.latitude},${pg.longitude})["highway"="bus_stop"];
            node(around:1500,${pg.latitude},${pg.longitude})["railway"="station"];
            node(around:1500,${pg.latitude},${pg.longitude})["leisure"="park"];
          );
          out tags 20;
        `;
        const res = await axios.post("https://overpass-api.de/api/interpreter", query, { headers: { "Content-Type": "text/plain" } });
        const places = res.data.elements.map(el => ({
          name: el.tags?.name || "Nearby Place",
          type: el.tags?.amenity || el.tags?.shop || el.tags?.highway || "location",
          lat: el.lat, lon: el.lon,
          distance: calculateDistanceBetweenCoords(pg.latitude, pg.longitude, el.lat, el.lon)
        })).filter(p => p.name !== "Nearby Place").slice(0, 12);
        setNearbyPlaces(places);
      } catch (err) { console.error(err); }
    };
    fetchNearby();

    const fetchNearbyPGs = async () => {
      try {
        const res = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
        if (res.data?.success) {
          const withDist = res.data.data.map(p => ({ ...p, distance: calculateDistanceBetweenCoords(pg.latitude, pg.longitude, p.latitude, p.longitude) }));
          setNearbyPGs(withDist.sort((a,b) => a.distance - b.distance).slice(0, 4));
        }
      } catch (err) { console.error(err); }
    };
    fetchNearbyPGs();
  }, [pg, id]);

  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const hasOwnerContact = pg?.contact_phone && pg.contact_phone.trim() !== "";
  const hasLocation = pg?.latitude && pg?.longitude;

  const getStartingPrice = () => {
    if (!pg) return "—";
    if (isToLet) return pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk || "—";
    if (isCoLiving) return pg.co_living_single_room || pg.co_living_double_room || "—";
    return pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing || pg.single_room || pg.double_room || "—";
  };

  const handleBookNow = () => {
    if (!user) {
      setNotification("Please login to book this property");
      setTimeout(() => setNotification(null), 3000);
      navigate("/register", { state: { redirectTo: `/pg/${id}` } });
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      setBookingLoading(true);
      const token = await user.getIdToken(true);
      const res = await api.post(`/bookings/${id}`, {
        check_in_date: bookingData.checkInDate,
        room_type: bookingData.roomType
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNotification(res.data?.message || "✅ Booking request sent!");
      setShowBookingModal(false);
    } catch (err) {
      setNotification(err.response?.data?.message || "❌ Booking failed");
    } finally {
      setBookingLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCallOwner = () => {
    if (hasOwnerContact) window.location.href = `tel:${pg.contact_phone}`;
    else setNotification("Contact will be visible after booking approval");
  };

  const facilitiesList = [
    { key: "cupboard_available", label: "Wardrobe", icon: "👔", category: "room" },
    { key: "table_chair_available", label: "Study Table", icon: "💺", category: "room" },
    { key: "attached_bathroom", label: "Attached Bath", icon: "🚿", category: "room" },
    { key: "balcony_available", label: "Balcony", icon: "🌿", category: "room" },
    { key: "bed_with_mattress", label: "Bed & Mattress", icon: "🛏️", category: "room" },
    { key: "ac_available", label: "Air Conditioner", icon: "❄️", category: "room" },
    { key: "geyser", label: "Geyser", icon: "🔥", category: "room" },
    { key: "wifi_available", label: "High-speed WiFi", icon: "📶", category: "basic" },
    { key: "food_available", label: "Meals Available", icon: "🍽️", category: "basic" },
    { key: "laundry_available", label: "Laundry Service", icon: "🧺", category: "basic" },
    { key: "housekeeping", label: "Daily Housekeeping", icon: "🧹", category: "basic" },
    { key: "power_backup", label: "Power Backup", icon: "⚡", category: "basic" },
    { key: "water_purifier", label: "RO Water", icon: "💧", category: "basic" },
    { key: "parking_available", label: "Car Parking", icon: "🚗", category: "safety" },
    { key: "cctv", label: "CCTV Security", icon: "📹", category: "safety" },
    { key: "security_guard", label: "Security Guard", icon: "🛡️", category: "safety" },
    { key: "lift_elevator", label: "Elevator", icon: "⬆️", category: "common" },
    { key: "gym", label: "Gym Access", icon: "💪", category: "common" },
    { key: "common_tv_lounge", label: "TV Lounge", icon: "📺", category: "common" },
    { key: "study_room", label: "Study Room", icon: "📚", category: "common" },
    { key: "kitchen_room", label: "Kitchen", icon: "🍳", category: "kitchen" },
    { key: "refrigerator", label: "Refrigerator", icon: "🧊", category: "kitchen" },
    { key: "microwave", label: "Microwave", icon: "🔥", category: "kitchen" },
  ];

  const activeFacilities = facilitiesList.filter(f => pg && (pg[f.key] === true || pg[f.key] === "true"));
  const filteredFacilities = activeFacilityFilter === "all" ? activeFacilities : activeFacilities.filter(f => f.category === activeFacilityFilter);
  const facilityCounts = {
    all: activeFacilities.length,
    room: activeFacilities.filter(f => f.category === "room").length,
    basic: activeFacilities.filter(f => f.category === "basic").length,
    safety: activeFacilities.filter(f => f.category === "safety").length,
    common: activeFacilities.filter(f => f.category === "common").length,
    kitchen: activeFacilities.filter(f => f.category === "kitchen").length,
  };

  const rules = [
    { key: "visitor_allowed", label: "Visitors Allowed", desc: "Friends & family can visit", default: true },
    { key: "couple_allowed", label: "Couples Allowed", desc: "Couples can stay together", default: false },
    { key: "family_allowed", label: "Family Allowed", desc: "Family members can stay", default: false },
    { key: "smoking_allowed", label: "Smoking", desc: "Smoking inside property", default: false },
    { key: "drinking_allowed", label: "Alcohol", desc: "Alcohol consumption", default: false },
    { key: "pets_allowed", label: "Pets Allowed", desc: "Can keep pets", default: false },
    { key: "late_night_entry_allowed", label: "Late Night Entry", desc: "24x7 access", default: false },
    { key: "outside_food_allowed", label: "Outside Food", desc: "Can bring food from outside", default: true },
  ].filter(rule => pg && (pg[rule.key] !== undefined));

  if (authLoading || loading) return <div style={styles.loader}><div style={styles.spinner}></div><p>Loading...</p></div>;
  if (error || !pg) return <div style={styles.errorBox}><h2>Property not found</h2><button onClick={() => navigate("/")}>← Back to Home</button></div>;

  const currentMedia = media[currentMediaIndex];

  return (
    <div style={styles.container}>
      {/* Notification Toast */}
      {notification && <div style={styles.toast}>{notification}</div>}

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span onClick={() => navigate("/")}>Home</span> / <span onClick={() => navigate("/properties")}>Properties</span> / <span style={styles.breadcrumbActive}>{pg.pg_name}</span>
        <span style={styles.propertyCode}>{getPGCode(pg.id)}</span>
      </div>

      {/* Media Slider */}
      <div style={styles.slider}>
        {media.length > 0 ? (
          <>
            {currentMedia.type === "image" ? (
              <img src={currentMedia.url} alt={pg.pg_name} style={styles.sliderMedia} onError={(e) => e.target.src = "https://placehold.co/800x400?text=No+Image"} />
            ) : (
              <video src={currentMedia.url} controls style={styles.sliderMedia} />
            )}
            {media.length > 1 && (
              <>
                <button style={styles.sliderPrev} onClick={() => setCurrentMediaIndex(i => (i - 1 + media.length) % media.length)}><ChevronLeft size={24} /></button>
                <button style={styles.sliderNext} onClick={() => setCurrentMediaIndex(i => (i + 1) % media.length)}><ChevronRight size={24} /></button>
                <div style={styles.sliderCounter}>{currentMediaIndex+1} / {media.length}</div>
              </>
            )}
          </>
        ) : (
          <div style={styles.noMedia}>📷 No media available</div>
        )}
      </div>

      {/* Main Info Card */}
      <div style={styles.mainCard}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>{pg.pg_name}</h1>
            <p style={styles.address}><MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}`}</p>
            {pg.landmark && <p style={styles.landmark}>📍 Near {pg.landmark}</p>}
          </div>
          <div style={styles.actionButtons}>
            <button style={styles.btnPrimary} onClick={handleBookNow}><BookOpen size={18} /> Book Now</button>
            {hasOwnerContact && <button style={styles.btnSecondary} onClick={handleCallOwner}><Phone size={18} /> Call Owner</button>}
            {hasLocation && <button style={styles.btnOutline} onClick={() => window.open(`https://maps.google.com/?q=${pg.latitude},${pg.longitude}`)}><Navigation size={18} /> Directions</button>}
          </div>
        </div>

        <div style={styles.badgeRow}>
          <span style={{...styles.badge, background: '#8b5cf6'}}>{isToLet ? "🏠 House" : isCoLiving ? "🤝 Co-Living" : "🏢 PG"}</span>
          {pg.pg_type && !isToLet && !isCoLiving && <span style={{...styles.badge, background: '#ec4899'}}>{pg.pg_type === "boys" ? "👨 Boys Only" : "👩 Girls Only"}</span>}
          {isToLet && pg.bhk_type && <span style={{...styles.badge, background: '#f59e0b'}}>{pg.bhk_type} BHK</span>}
          <span style={{...styles.badge, background: pg.available_rooms > 0 ? '#10b981' : '#ef4444'}}>{pg.available_rooms > 0 ? `🟢 ${pg.available_rooms} Available` : "🔴 Full"}</span>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.stat}><span style={styles.statIcon}>💰</span><div><div style={styles.statLabel}>Starting from</div><div style={styles.statValue}>₹{formatPrice(getStartingPrice())}/month</div></div></div>
          <div style={styles.stat}><span style={styles.statIcon}>🏠</span><div><div style={styles.statLabel}>Total {isToLet ? "Units" : "Rooms"}</div><div style={styles.statValue}>{pg.total_rooms || "—"}</div></div></div>
          <div style={styles.stat}><span style={styles.statIcon}>✨</span><div><div style={styles.statLabel}>Amenities</div><div style={styles.statValue}>{activeFacilities.length}+</div></div></div>
          <div style={styles.stat}><span style={styles.statIcon}>📍</span><div><div style={styles.statLabel}>Nearby Places</div><div style={styles.statValue}>{nearbyPlaces.length}+</div></div></div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={styles.twoColumn}>
        {/* Left Column */}
        <div style={styles.leftCol}>
          {pg.description && (
            <Section title="📝 About this space">
              <p style={styles.description}>{pg.description}</p>
            </Section>
          )}

          {/* Price Details */}
          <Section title="💰 Pricing">
            <div style={styles.priceGrid}>
              {isToLet && (
                <>
                  {pg.price_1bhk && <div style={styles.priceCard}><div style={styles.priceType}>1 BHK</div><div style={styles.priceAmount}>₹{formatPrice(pg.price_1bhk)}<span>/mo</span></div>{pg.security_deposit_1bhk && <div style={styles.priceDeposit}>Deposit: ₹{formatPrice(pg.security_deposit_1bhk)}</div>}</div>}
                  {pg.price_2bhk && <div style={styles.priceCard}><div style={styles.priceType}>2 BHK</div><div style={styles.priceAmount}>₹{formatPrice(pg.price_2bhk)}<span>/mo</span></div>{pg.security_deposit_2bhk && <div style={styles.priceDeposit}>Deposit: ₹{formatPrice(pg.security_deposit_2bhk)}</div>}</div>}
                  {pg.price_3bhk && <div style={styles.priceCard}><div style={styles.priceType}>3 BHK</div><div style={styles.priceAmount}>₹{formatPrice(pg.price_3bhk)}<span>/mo</span></div>{pg.security_deposit_3bhk && <div style={styles.priceDeposit}>Deposit: ₹{formatPrice(pg.security_deposit_3bhk)}</div>}</div>}
                </>
              )}
              {isCoLiving && (
                <>
                  {pg.co_living_single_room && <div style={styles.priceCard}><div style={styles.priceType}>Single Room</div><div style={styles.priceAmount}>₹{formatPrice(pg.co_living_single_room)}<span>/mo</span></div></div>}
                  {pg.co_living_double_room && <div style={styles.priceCard}><div style={styles.priceType}>Double Room</div><div style={styles.priceAmount}>₹{formatPrice(pg.co_living_double_room)}<span>/mo</span></div></div>}
                </>
              )}
              {!isToLet && !isCoLiving && (
                <>
                  {pg.single_sharing && <div style={styles.priceCard}><div style={styles.priceType}>Single Sharing</div><div style={styles.priceAmount}>₹{formatPrice(pg.single_sharing)}<span>/mo</span></div></div>}
                  {pg.double_sharing && <div style={styles.priceCard}><div style={styles.priceType}>Double Sharing</div><div style={styles.priceAmount}>₹{formatPrice(pg.double_sharing)}<span>/mo</span></div></div>}
                  {pg.triple_sharing && <div style={styles.priceCard}><div style={styles.priceType}>Triple Sharing</div><div style={styles.priceAmount}>₹{formatPrice(pg.triple_sharing)}<span>/mo</span></div></div>}
                  {pg.single_room && <div style={styles.priceCard}><div style={styles.priceType}>Single Room</div><div style={styles.priceAmount}>₹{formatPrice(pg.single_room)}<span>/mo</span></div></div>}
                </>
              )}
            </div>
            {pg.security_deposit && !isToLet && <div style={styles.extraCharge}>🔒 Security Deposit: ₹{formatPrice(pg.security_deposit)}</div>}
            {pg.food_available && pg.food_charges && <div style={styles.extraCharge}>🍽️ Food Plan: +₹{formatPrice(pg.food_charges)}/month</div>}
          </Section>

          {/* Facilities */}
          <Section title="✨ Amenities" badge={activeFacilities.length}>
            <div style={styles.filterRow}>
              {["all", "room", "basic", "safety", "common", "kitchen"].map(cat => (
                <button key={cat} onClick={() => setActiveFacilityFilter(cat)} style={{...styles.filterChip, background: activeFacilityFilter === cat ? '#1e293b' : '#f1f5f9', color: activeFacilityFilter === cat ? 'white' : '#334155'}}>
                  {cat === "all" ? "All" : cat.charAt(0).toUpperCase()+cat.slice(1)} ({facilityCounts[cat] || 0})
                </button>
              ))}
            </div>
            <div style={styles.facilitiesGrid}>
              {filteredFacilities.map(f => <FacilityPill key={f.key} icon={f.icon} label={f.label} color="#10b981" />)}
            </div>
            {filteredFacilities.length === 0 && <p style={styles.noContent}>No amenities in this category</p>}
          </Section>

          {/* Rules */}
          <Section title="📜 House Rules">
            <div style={styles.rulesGrid}>
              {rules.map(rule => {
                const allowed = pg[rule.key] === true || pg[rule.key] === "true";
                return <RuleCard key={rule.key} icon={rule.key.includes("visitor") ? "👥" : rule.key.includes("couple") ? "❤️" : rule.key.includes("pet") ? "🐕" : rule.key.includes("smoke") ? "🚬" : rule.key.includes("drink") ? "🍺" : "⏰"} label={rule.label} allowed={allowed} description={rule.desc} />;
              })}
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div style={styles.rightCol}>
          {/* Map */}
          {hasLocation && (
            <Section title="📍 Location">
              <div style={styles.mapWrapper}>
                <MapContainer center={mapCenter} zoom={15} style={{ height: "200px", width: "100%", borderRadius: "12px" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pg.latitude, pg.longitude]}>
                    <Popup>{pg.pg_name}<br/>{pg.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div style={styles.locationInfo}>
                <div><strong>Area:</strong> {pg.area || "—"}</div>
                <div><strong>Landmark:</strong> {pg.landmark || "—"}</div>
                <div><strong>City:</strong> {pg.city || "—"}</div>
              </div>
            </Section>
          )}

          {/* Nearby Places */}
          <Section title="📍 Nearby Places">
            <div style={styles.nearbyList}>
              {nearbyPlaces.slice(0, 5).map((place, idx) => (
                <NearbyPlaceCard key={idx} name={place.name} type={place.type} distance={place.distance} onView={() => setMapCenter([place.lat, place.lon])} />
              ))}
              {nearbyPlaces.length === 0 && <p style={styles.noContent}>Loading nearby places...</p>}
            </div>
          </Section>

          {/* Nearby PGs */}
          {nearbyPGs.length > 0 && (
            <Section title="🏘️ Similar Properties">
              <div style={styles.nearbyPGsList}>
                {nearbyPGs.map(p => (
                  <div key={p.id} style={styles.nearbyPGCard} onClick={() => navigate(`/pg/${p.id}`)}>
                    <div style={styles.nearbyPGImg}>{p.photos?.[0] ? <img src={getCorrectImageUrl(p.photos[0])} alt={p.pg_name} style={{width: "100%", height: "100%", objectFit: "cover"}} /> : <span>🏠</span>}</div>
                    <div style={styles.nearbyPGInfo}>
                      <div style={styles.nearbyPGName}>{p.pg_name}</div>
                      <div style={styles.nearbyPGPrice}>₹{formatPrice(p.single_sharing || p.co_living_single_room || p.price_1bhk)}/mo</div>
                      <div style={styles.nearbyPGDist}>📍 {p.distance.toFixed(1)} km</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Contact Card */}
          <div style={styles.contactCard}>
            <h3 style={styles.contactTitle}>📞 Contact</h3>
            {pg.contact_person && <div style={styles.contactRow}><span>👤</span> {pg.contact_person}</div>}
            {hasOwnerContact && <div style={styles.contactRow}><span>📱</span> <a href={`tel:${pg.contact_phone}`} style={styles.contactLink}>{pg.contact_phone}</a></div>}
            {pg.contact_email && <div style={styles.contactRow}><span>✉️</span> {pg.contact_email}</div>}
            <div style={styles.contactActions}>
              <button style={styles.btnPrimarySmall} onClick={handleBookNow}>Book Now</button>
              {hasOwnerContact && <button style={styles.btnSecondarySmall} onClick={handleCallOwner}>Call Now</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div style={styles.stickyBar}>
        <div style={styles.stickyContent}>
          <div>
            <div style={styles.stickyPrice}>₹{formatPrice(getStartingPrice())}/month</div>
            <div style={styles.stickyInfo}>{pg.pg_name} • {pg.area}</div>
          </div>
          <div style={styles.stickyActions}>
            <button style={styles.stickyBookBtn} onClick={handleBookNow}><BookOpen size={16} /> Book Now</button>
            {hasOwnerContact && <button style={styles.stickyCallBtn} onClick={handleCallOwner}><Phone size={16} /> Call</button>}
          </div>
        </div>
      </div>

      {showBookingModal && <BookingModal pg={pg} onClose={() => setShowBookingModal(false)} onBook={handleBookingSubmit} bookingLoading={bookingLoading} />}
    </div>
  );
}

// ================= STYLES =================
const styles = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "24px 20px 100px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  loader: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" },
  spinner: { width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" },
  errorBox: { textAlign: "center", padding: "80px 20px", background: "#f8fafc", minHeight: "100vh" },
  toast: { position: "fixed", top: "20px", right: "20px", background: "#1e293b", color: "white", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 4000, fontSize: "14px", fontWeight: "500" },
  breadcrumb: { fontSize: "14px", color: "#64748b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  breadcrumbActive: { color: "#1e293b", fontWeight: "600" },
  propertyCode: { marginLeft: "auto", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", color: "#475569" },
  slider: { position: "relative", borderRadius: "24px", overflow: "hidden", marginBottom: "24px", boxShadow: "0 20px 35px -10px rgba(0,0,0,0.1)" },
  sliderMedia: { width: "100%", height: "400px", objectFit: "cover", display: "block" },
  sliderPrev: { position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "none", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  sliderNext: { position: "absolute", top: "50%", right: "16px", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "none", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  sliderCounter: { position: "absolute", bottom: "16px", right: "16px", background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", backdropFilter: "blur(4px)" },
  noMedia: { height: "300px", background: "linear-gradient(135deg, #e2e8f0, #f1f5f9)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#94a3b8", marginBottom: "24px" },
  mainCard: { background: "white", borderRadius: "24px", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #eef2ff" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0", letterSpacing: "-0.02em" },
  address: { fontSize: "14px", color: "#64748b", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" },
  landmark: { fontSize: "13px", color: "#94a3b8", margin: 0, display: "flex", alignItems: "center", gap: "6px" },
  actionButtons: { display: "flex", gap: "10px", flexWrap: "wrap" },
  btnPrimary: { padding: "10px 20px", background: "#0f172a", color: "white", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" },
  btnSecondary: { padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  btnOutline: { padding: "10px 20px", background: "white", color: "#1e293b", border: "1px solid #e2e8f0", borderRadius: "40px", fontSize: "14px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  badgeRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" },
  badge: { padding: "4px 12px", borderRadius: "30px", fontSize: "12px", fontWeight: "600", color: "white", display: "inline-flex", alignItems: "center", gap: "6px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "20px", border: "1px solid #eef2ff" },
  stat: { display: "flex", alignItems: "center", gap: "12px" },
  statIcon: { fontSize: "24px", width: "44px", height: "44px", background: "white", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  statLabel: { fontSize: "12px", color: "#64748b" },
  statValue: { fontSize: "18px", fontWeight: "700", color: "#0f172a" },
  twoColumn: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "40px" },
  leftCol: { display: "flex", flexDirection: "column", gap: "24px" },
  rightCol: { display: "flex", flexDirection: "column", gap: "24px" },
  sectionCard: { background: "white", borderRadius: "20px", padding: "20px", border: "1px solid #eef2ff", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "12px", borderBottom: "2px solid #f1f5f9" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0 },
  sectionBadge: { background: "#f1f5f9", padding: "4px 10px", borderRadius: "30px", fontSize: "12px", fontWeight: "500", color: "#475569" },
  description: { fontSize: "15px", lineHeight: "1.6", color: "#334155", margin: 0 },
  priceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" },
  priceCard: { background: "#f8fafc", padding: "14px", borderRadius: "16px", border: "1px solid #eef2ff", textAlign: "center" },
  priceType: { fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "6px" },
  priceAmount: { fontSize: "20px", fontWeight: "700", color: "#0f172a", "& span": { fontSize: "12px", fontWeight: "400", color: "#94a3b8" } },
  priceDeposit: { fontSize: "11px", color: "#ef4444", marginTop: "6px" },
  extraCharge: { marginTop: "12px", padding: "10px", background: "#fef3c7", borderRadius: "12px", fontSize: "13px", color: "#92400e" },
  filterRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
  filterChip: { padding: "6px 12px", borderRadius: "30px", fontSize: "12px", fontWeight: "500", border: "none", cursor: "pointer", transition: "all 0.2s" },
  facilitiesGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
  facilityPill: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px 6px 8px", background: "#f8fafc", borderRadius: "40px", borderLeft: "3px solid #10b981", fontSize: "13px", fontWeight: "500", color: "#1e293b" },
  facilityPillIcon: { fontSize: "16px" },
  facilityPillLabel: { flex: 1 },
  facilityPillCheck: { color: "#10b981" },
  rulesGrid: { display: "flex", flexDirection: "column", gap: "12px" },
  ruleCard: { display: "flex", gap: "12px", padding: "14px", borderRadius: "16px", border: "1px solid #eef2ff" },
  ruleIcon: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "white" },
  ruleContent: { flex: 1 },
  ruleLabel: { fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  ruleDesc: { fontSize: "12px", color: "#64748b", marginBottom: "6px" },
  ruleStatus: { fontSize: "11px", fontWeight: "500" },
  mapWrapper: { borderRadius: "16px", overflow: "hidden", marginBottom: "16px", border: "1px solid #eef2ff" },
  locationInfo: { display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#475569", background: "#f8fafc", padding: "12px", borderRadius: "12px" },
  nearbyList: { display: "flex", flexDirection: "column", gap: "10px" },
  nearbyPlaceCard: { display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "#f8fafc", borderRadius: "14px", cursor: "pointer", transition: "all 0.2s" },
  nearbyPlaceIcon: { fontSize: "20px", width: "36px", height: "36px", background: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" },
  nearbyPlaceInfo: { flex: 1 },
  nearbyPlaceName: { fontSize: "14px", fontWeight: "600", color: "#0f172a" },
  nearbyPlaceType: { fontSize: "11px", color: "#64748b", textTransform: "capitalize" },
  nearbyPlaceDist: { fontSize: "10px", color: "#10b981", marginTop: "2px" },
  nearbyPlaceBtn: { padding: "4px 10px", background: "white", border: "1px solid #e2e8f0", borderRadius: "20px", fontSize: "11px", fontWeight: "500", cursor: "pointer" },
  nearbyPGsList: { display: "flex", flexDirection: "column", gap: "12px" },
  nearbyPGCard: { display: "flex", gap: "12px", padding: "10px", background: "#f8fafc", borderRadius: "16px", cursor: "pointer" },
  nearbyPGImg: { width: "70px", height: "70px", background: "#e2e8f0", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", overflow: "hidden" },
  nearbyPGInfo: { flex: 1 },
  nearbyPGName: { fontSize: "14px", fontWeight: "600", color: "#0f172a", marginBottom: "4px" },
  nearbyPGPrice: { fontSize: "13px", fontWeight: "500", color: "#10b981" },
  nearbyPGDist: { fontSize: "11px", color: "#64748b", marginTop: "4px" },
  contactCard: { background: "white", borderRadius: "20px", padding: "20px", border: "1px solid #eef2ff" },
  contactTitle: { fontSize: "18px", fontWeight: "600", margin: "0 0 16px 0", color: "#0f172a" },
  contactRow: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: "#334155" },
  contactLink: { color: "#3b82f6", textDecoration: "none" },
  contactActions: { display: "flex", gap: "10px", marginTop: "16px" },
  btnPrimarySmall: { flex: 1, padding: "10px", background: "#0f172a", color: "white", border: "none", borderRadius: "40px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  btnSecondarySmall: { flex: 1, padding: "10px", background: "#3b82f6", color: "white", border: "none", borderRadius: "40px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  stickyBar: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(12px)", padding: "12px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.05)", zIndex: 1000, borderTop: "1px solid #eef2ff" },
  stickyContent: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  stickyPrice: { fontSize: "20px", fontWeight: "700", color: "#0f172a" },
  stickyInfo: { fontSize: "12px", color: "#64748b" },
  stickyActions: { display: "flex", gap: "10px" },
  stickyBookBtn: { padding: "8px 20px", background: "#0f172a", color: "white", border: "none", borderRadius: "40px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  stickyCallBtn: { padding: "8px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "40px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" },
  modalContainer: { background: "white", borderRadius: "28px", maxWidth: "500px", width: "100%", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalClose: { position: "absolute", top: "16px", right: "16px", background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  modalContent: { padding: "28px" },
  modalTitle: { fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0", color: "#0f172a" },
  modalSubtitle: { fontSize: "14px", color: "#64748b", marginBottom: "20px" },
  modalWarning: { background: "#fffbeb", padding: "12px", borderRadius: "12px", fontSize: "13px", color: "#b45309", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" },
  modalField: { marginBottom: "20px" },
  modalLabel: { display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1e293b" },
  modalInput: { width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "14px", fontSize: "14px", background: "#f9fafb" },
  modalSelect: { width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "14px", fontSize: "14px", background: "#f9fafb" },
  modalHint: { fontSize: "11px", color: "#94a3b8", marginTop: "4px" },
  modalInfoBox: { background: "#eef2ff", padding: "14px", borderRadius: "14px", display: "flex", gap: "10px", marginBottom: "24px" },
  modalInfoIcon: { color: "#3b82f6" },
  modalInfoText: { fontSize: "12px", color: "#1e293b", lineHeight: "1.5" },
  modalActions: { display: "flex", gap: "12px" },
  modalCancel: { flex: 1, padding: "12px", background: "#f1f5f9", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "500", cursor: "pointer" },
  modalSubmit: { flex: 2, padding: "12px", background: "#0f172a", color: "white", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  noContent: { textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "14px" },
};