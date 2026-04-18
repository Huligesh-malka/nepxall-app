import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
  Wrench,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  Video,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  TrendingUp,
  Award,
  ExternalLink,
  Copy,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Grid3x3,
  List,
  ArrowUp,
  ArrowDown,
  Loader2
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
  } catch (error) {
    return numPrice.toString();
  }
};

const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;
const getTomorrowDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
};
const getMaxDate = () => {
  const max = new Date();
  max.setMonth(max.getMonth() + 6);
  return max.toISOString().split('T')[0];
};

/* ================= ANIMATED MAP CONTROLLER ================= */
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    }
  }, [map, center, zoom]);
  return null;
};

/* ================= BOOKING MODAL (REDESIGNED) ================= */
const BookingModal = ({ pg, onClose, onBook, bookingLoading }) => {
  const [bookingData, setBookingData] = useState({ checkInDate: "", roomType: "" });
  const [selectedPrice, setSelectedPrice] = useState(null);

  useEffect(() => {
    const defaultRoomType = getDefaultRoomType();
    setBookingData({ checkInDate: "", roomType: defaultRoomType || "" });
  }, [pg]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
    if (name === "roomType") updateSelectedPrice(value);
  };

  const updateSelectedPrice = (roomType) => {
    if (pg?.pg_category === "pg") {
      const prices = { "Single Sharing": pg.single_sharing, "Double Sharing": pg.double_sharing, "Triple Sharing": pg.triple_sharing, "Four Sharing": pg.four_sharing, "Single Room": pg.single_room, "Double Room": pg.double_room };
      setSelectedPrice(prices[roomType]);
    } else if (pg?.pg_category === "coliving") {
      const prices = { "Single Room": pg.co_living_single_room, "Double Room": pg.co_living_double_room };
      setSelectedPrice(prices[roomType]);
    } else if (pg?.pg_category === "to_let") {
      const prices = { "1BHK": pg.price_1bhk, "2BHK": pg.price_2bhk, "3BHK": pg.price_3bhk, "4BHK": pg.price_4bhk };
      setSelectedPrice(prices[roomType]);
    }
  };

  const getRoomTypes = () => {
    const types = [];
    if (pg?.pg_category === "pg") {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) types.push({ value: "Single Sharing", label: `Single Sharing`, price: pg.single_sharing });
      if (pg.double_sharing && Number(pg.double_sharing) > 0) types.push({ value: "Double Sharing", label: `Double Sharing`, price: pg.double_sharing });
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) types.push({ value: "Triple Sharing", label: `Triple Sharing`, price: pg.triple_sharing });
      if (pg.four_sharing && Number(pg.four_sharing) > 0) types.push({ value: "Four Sharing", label: `Four Sharing`, price: pg.four_sharing });
      if (pg.single_room && Number(pg.single_room) > 0) types.push({ value: "Single Room", label: `Single Room`, price: pg.single_room });
      if (pg.double_room && Number(pg.double_room) > 0) types.push({ value: "Double Room", label: `Double Room`, price: pg.double_room });
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ value: "Single Room", label: `Co-Living Single Room`, price: pg.co_living_single_room });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ value: "Double Room", label: `Co-Living Double Room`, price: pg.co_living_double_room });
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) types.push({ value: "1BHK", label: `1 BHK`, price: pg.price_1bhk });
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) types.push({ value: "2BHK", label: `2 BHK`, price: pg.price_2bhk });
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) types.push({ value: "3BHK", label: `3 BHK`, price: pg.price_3bhk });
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) types.push({ value: "4BHK", label: `4 BHK`, price: pg.price_4bhk });
    }
    return types;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onBook(bookingData);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} disabled={bookingLoading} style={styles.modalCloseBtn}>
          <X size={22} />
        </button>
        <div style={styles.modalGradient} />
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <div style={styles.modalIcon}>🏠</div>
            <h2 style={styles.modalTitle}>Reserve {pg?.pg_name}</h2>
            <p style={styles.modalSubtitle}>Your details will be auto-filled from your profile</p>
          </div>
          <div style={styles.modalWarning}>
            <AlertCircle size={16} />
            <span>You can only request this PG once every 24 hours</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <Calendar size={16} />
                <span>Check-in Date *</span>
              </label>
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
              <p style={styles.formHint}>Earliest check-in: tomorrow (24h notice required)</p>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <Bed size={16} />
                <span>{pg?.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}</span>
              </label>
              <div style={styles.roomTypeGrid}>
                {getRoomTypes().map((type, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.roomTypeCard,
                      border: bookingData.roomType === type.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      background: bookingData.roomType === type.value ? 'linear-gradient(135deg, #6366f110, #8b5cf610)' : 'white',
                    }}
                    onClick={() => {
                      setBookingData(prev => ({ ...prev, roomType: type.value }));
                      updateSelectedPrice(type.value);
                    }}
                  >
                    <span style={styles.roomTypeIcon}>🏠</span>
                    <div>
                      <div style={styles.roomTypeLabel}>{type.label}</div>
                      <div style={styles.roomTypePrice}>₹{formatPrice(type.price)}/month</div>
                    </div>
                    {bookingData.roomType === type.value && <Check size={18} style={styles.roomTypeCheck} />}
                  </div>
                ))}
              </div>
            </div>
            {selectedPrice && (
              <div style={styles.selectedPriceCard}>
                <DollarSign size={18} />
                <span>Selected: <strong>₹{formatPrice(selectedPrice)}/month</strong></span>
              </div>
            )}
            <div style={styles.infoBox}>
              <div style={styles.infoBoxHeader}>
                <Info size={16} />
                <span>Booking Information</span>
              </div>
              <ul style={styles.infoList}>
                <li>✓ Your name and contact info will be auto-filled from your profile</li>
                <li>✓ Register number will be automatically generated</li>
                <li>✓ You'll receive confirmation via email/SMS</li>
                <li>✓ Owner will contact you within 24 hours</li>
              </ul>
            </div>
            <div style={styles.modalActions}>
              <button type="button" onClick={onClose} disabled={bookingLoading} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={bookingLoading} style={styles.confirmBtn}>
                {bookingLoading ? (
                  <>
                    <Loader2 size={18} style={styles.spinning} />
                    Processing...
                  </>
                ) : (
                  <>
                    <BookOpen size={18} />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ================= PRICE DETAILS COMPONENT ================= */
const PriceDetails = ({ pg }) => {
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;

  const formatPriceLocal = (price) => {
    if (!price || price === "" || price === "0") return "—";
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
  };

  if (isToLet) {
    const prices = [
      { key: 'price_1bhk', label: '1 BHK', deposit: 'security_deposit_1bhk' },
      { key: 'price_2bhk', label: '2 BHK', deposit: 'security_deposit_2bhk' },
      { key: 'price_3bhk', label: '3 BHK', deposit: 'security_deposit_3bhk' },
      { key: 'price_4bhk', label: '4 BHK', deposit: 'security_deposit_4bhk' }
    ].filter(p => pg[p.key] && pg[p.key] !== "0");
    
    if (prices.length === 0) return <div style={styles.noPriceCard}>💰 No price details available</div>;
    
    return (
      <div style={styles.priceSection}>
        <div style={styles.priceSectionHeader}>
          <span style={styles.priceSectionIcon}>🏠</span>
          <h4 style={styles.priceSectionTitle}>House/Flat Rental Prices</h4>
        </div>
        <div style={styles.priceGrid}>
          {prices.map(p => (
            <div key={p.key} style={styles.priceCard}>
              <div style={styles.priceCardHeader}>
                <span style={styles.priceType}>{p.label}</span>
                <span style={styles.priceValue}>{formatPriceLocal(pg[p.key])}<span style={styles.pricePeriod}>/month</span></span>
              </div>
              {pg[p.deposit] && pg[p.deposit] !== "0" && (
                <div style={styles.priceDeposit}>Security: {formatPriceLocal(pg[p.deposit])}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (isCoLiving) {
    return (
      <div style={styles.priceSection}>
        <div style={styles.priceSectionHeader}>
          <span style={styles.priceSectionIcon}>🤝</span>
          <h4 style={styles.priceSectionTitle}>Co-Living Prices</h4>
        </div>
        <div style={styles.priceGrid}>
          {pg.co_living_single_room && pg.co_living_single_room !== "0" && (
            <div style={styles.priceCard}>
              <div style={styles.priceCardHeader}>
                <span style={styles.priceType}>Single Room</span>
                <span style={styles.priceValue}>{formatPriceLocal(pg.co_living_single_room)}<span style={styles.pricePeriod}>/month</span></span>
              </div>
            </div>
          )}
          {pg.co_living_double_room && pg.co_living_double_room !== "0" && (
            <div style={styles.priceCard}>
              <div style={styles.priceCardHeader}>
                <span style={styles.priceType}>Double Room</span>
                <span style={styles.priceValue}>{formatPriceLocal(pg.co_living_double_room)}<span style={styles.pricePeriod}>/month</span></span>
              </div>
            </div>
          )}
        </div>
        {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && (
          <div style={styles.priceDepositCard}>Security Deposit: {formatPriceLocal(pg.co_living_security_deposit)}</div>
        )}
      </div>
    );
  }
  
  // PG/Hostel
  const sharingPrices = [
    { key: 'single_sharing', label: 'Single Sharing' },
    { key: 'double_sharing', label: 'Double Sharing' },
    { key: 'triple_sharing', label: 'Triple Sharing' },
    { key: 'four_sharing', label: 'Four Sharing' }
  ].filter(p => pg[p.key] && pg[p.key] !== "0");
  
  const privatePrices = [
    { key: 'single_room', label: 'Single Room' },
    { key: 'double_room', label: 'Double Room' },
    { key: 'triple_room', label: 'Triple Room' }
  ].filter(p => pg[p.key] && pg[p.key] !== "0");
  
  if (sharingPrices.length === 0 && privatePrices.length === 0) {
    return <div style={styles.noPriceCard}>💰 No price details available</div>;
  }
  
  return (
    <div style={styles.priceSection}>
      {sharingPrices.length > 0 && (
        <>
          <div style={styles.priceSubsectionHeader}>
            <Users size={16} />
            <span>Sharing Rooms</span>
          </div>
          <div style={styles.priceGrid}>
            {sharingPrices.map(p => (
              <div key={p.key} style={styles.priceCard}>
                <span style={styles.priceType}>{p.label}</span>
                <span style={styles.priceValue}>{formatPriceLocal(pg[p.key])}<span style={styles.pricePeriod}>/month</span></span>
              </div>
            ))}
          </div>
        </>
      )}
      {privatePrices.length > 0 && (
        <>
          <div style={styles.priceSubsectionHeader}>
            <DoorOpen size={16} />
            <span>Private Rooms</span>
          </div>
          <div style={styles.priceGrid}>
            {privatePrices.map(p => (
              <div key={p.key} style={styles.priceCard}>
                <span style={styles.priceType}>{p.label}</span>
                <span style={styles.priceValue}>{formatPriceLocal(pg[p.key])}<span style={styles.pricePeriod}>/month</span></span>
              </div>
            ))}
          </div>
        </>
      )}
      {(pg.security_deposit || pg.maintenance_charges) && (
        <div style={styles.chargesCard}>
          <div style={styles.chargesHeader}>Additional Charges</div>
          <div style={styles.chargesGrid}>
            {pg.security_deposit && pg.security_deposit !== "0" && <div><span>Security Deposit:</span> <strong>{formatPriceLocal(pg.security_deposit)}</strong></div>}
            {pg.maintenance_charges && pg.maintenance_charges !== "0" && <div><span>Maintenance:</span> <strong>{formatPriceLocal(pg.maintenance_charges)}/month</strong></div>}
            {pg.advance_rent && pg.advance_rent !== "0" && <div><span>Advance Rent:</span> <strong>{pg.advance_rent} months</strong></div>}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= FACILITY ITEM ================= */
const FacilityItem = ({ icon, label, active = true, color }) => (
  <div style={{ ...styles.facilityItem, borderLeftColor: color, background: active ? `linear-gradient(135deg, ${color}08, white)` : '#f8fafc' }}>
    <span style={styles.facilityIcon}>{icon}</span>
    <span style={styles.facilityLabel}>{label}</span>
    {active && <Check size={16} style={styles.facilityCheck} />}
  </div>
);

/* ================= RULE ITEM ================= */
const RuleItem = ({ icon, label, allowed, description }) => (
  <div style={{ ...styles.ruleItem, background: allowed ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
    <div style={{ ...styles.ruleIcon, background: allowed ? '#10b981' : '#ef4444' }}>{icon}</div>
    <div style={styles.ruleContent}>
      <div style={{ ...styles.ruleLabel, color: allowed ? '#065f46' : '#7f1d1d' }}>{label}</div>
      {description && <div style={styles.ruleDescription}>{description}</div>}
      <div style={{ ...styles.ruleStatus, background: allowed ? '#10b981' : '#ef4444' }}>{allowed ? '✓ Allowed' : '✗ Not Allowed'}</div>
    </div>
  </div>
);

/* ================= HIGHLIGHT ITEM ================= */
const HighlightItem = ({ name, type, icon, onMapView, color }) => (
  <div style={{ ...styles.highlightItem, borderLeftColor: color }} onClick={onMapView}>
    <div style={{ ...styles.highlightIconContainer, background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
      <span style={styles.highlightIcon}>{icon}</span>
    </div>
    <div style={styles.highlightContent}>
      <div style={styles.highlightName}>{name}</div>
      <div style={styles.highlightType}>{type.replace(/_/g, ' ').replace('nearby ', '')}</div>
    </div>
    <button style={{ ...styles.viewOnMapButton, background: `linear-gradient(135deg, ${color}, ${color}dd)` }} onClick={(e) => { e.stopPropagation(); onMapView(); }}>
      <MapPin size={12} /> View
    </button>
  </div>
);

/* ================= NEARBY PG CARD ================= */
const NearbyPGCard = ({ pg, onClick, distance }) => {
  const getStartingPrice = () => {
    if (!pg) return "—";
    if (pg.pg_category === "to_let") return pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk || "—";
    if (pg.pg_category === "coliving") return pg.co_living_single_room || pg.co_living_double_room || "—";
    return pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing || pg.single_room || pg.double_room || "—";
  };
  
  const imageUrl = pg.photos?.[0] ? getCorrectImageUrl(pg.photos[0]) : null;
  
  return (
    <div style={styles.nearbyPgCard} onClick={onClick}>
      <div style={styles.nearbyPgImage}>
        {imageUrl ? (
          <img src={imageUrl} alt={pg.pg_name} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🏠'; }} />
        ) : (
          <div style={styles.nearbyPgImagePlaceholder}>🏠</div>
        )}
        <div style={styles.nearbyPgBadges}>
          <span style={styles.nearbyPgTypeBadge}>{pg.pg_category === "to_let" ? "House" : pg.pg_category === "coliving" ? "Co-Living" : "PG"}</span>
          {distance && <span style={styles.nearbyPgDistanceBadge}>📏 {distance.toFixed(1)} km</span>}
        </div>
      </div>
      <div style={styles.nearbyPgContent}>
        <h4 style={styles.nearbyPgTitle}>{pg.pg_name}</h4>
        <p style={styles.nearbyPgAddress}>📍 {pg.address?.substring(0, 40) || pg.area || pg.city}</p>
        <div style={styles.nearbyPgPrice}>₹{formatPrice(getStartingPrice())}/month</div>
        <button style={styles.nearbyPgViewButton}>View Details →</button>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [loadingNearbyPGs, setLoadingNearbyPGs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState("all");
  const [selectedHighlightCategory, setSelectedHighlightCategory] = useState("all");
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [mapZoom, setMapZoom] = useState(15);
  const [expandedRules, setExpandedRules] = useState({ visitors: true, lifestyle: true, pets: true, restrictions: true, legal: true });
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const sliderRef = useRef(null);

  const highlightCategories = [
    { id: "all", label: "All", icon: "📍", color: "#6366f1" },
    { id: "education", label: "Education", icon: "🎓", color: "#8b5cf6" },
    { id: "transport", label: "Transport", icon: "🚌", color: "#3b82f6" },
    { id: "healthcare", label: "Healthcare", icon: "🏥", color: "#ef4444" },
    { id: "shopping", label: "Shopping", icon: "🛒", color: "#f59e0b" },
    { id: "food", label: "Food", icon: "🍽️", color: "#f97316" },
    { id: "recreation", label: "Recreation", icon: "🏃", color: "#ec4899" }
  ];

  const facilityCategories = [
    { id: "all", label: "All", icon: "🏢", color: "#6366f1" },
    { id: "room", label: "Room", icon: "🛏️", color: "#8b5cf6" },
    { id: "kitchen", label: "Kitchen", icon: "🍳", color: "#f59e0b" },
    { id: "safety", label: "Safety", icon: "🛡️", color: "#ef4444" },
    { id: "common", label: "Common", icon: "🏃", color: "#10b981" },
    { id: "basic", label: "Basic", icon: "💧", color: "#3b82f6" }
  ];

  const allFacilities = [
    { key: "cupboard_available", label: "Cupboard/Wardrobe", icon: "👔", category: "room" },
    { key: "table_chair_available", label: "Study Table & Chair", icon: "💺", category: "room" },
    { key: "dining_table_available", label: "Dining Table", icon: "🍽️", category: "kitchen" },
    { key: "attached_bathroom", label: "Attached Bathroom", icon: "🚽", category: "room" },
    { key: "balcony_available", label: "Balcony", icon: "🌿", category: "room" },
    { key: "bed_with_mattress", label: "Bed with Mattress", icon: "🛏️", category: "room" },
    { key: "fan_light", label: "Fan & Light", icon: "💡", category: "room" },
    { key: "kitchen_room", label: "Kitchen Room", icon: "🍳", category: "kitchen" },
    { key: "food_available", label: "Food Available", icon: "🍽️", category: "basic" },
    { key: "ac_available", label: "Air Conditioner", icon: "❄️", category: "room" },
    { key: "wifi_available", label: "Wi-Fi / Internet", icon: "📶", category: "basic" },
    { key: "tv", label: "Television", icon: "📺", category: "common" },
    { key: "parking_available", label: "Car Parking", icon: "🚗", category: "safety" },
    { key: "bike_parking", label: "Bike Parking", icon: "🏍️", category: "safety" },
    { key: "laundry_available", label: "Laundry Service", icon: "🧺", category: "basic" },
    { key: "washing_machine", label: "Washing Machine", icon: "🧼", category: "basic" },
    { key: "refrigerator", label: "Refrigerator", icon: "🧊", category: "kitchen" },
    { key: "geyser", label: "Geyser", icon: "🚿", category: "room" },
    { key: "power_backup", label: "Power Backup", icon: "🔋", category: "basic" },
    { key: "lift_elevator", label: "Lift / Elevator", icon: "⬆️", category: "common" },
    { key: "cctv", label: "CCTV Surveillance", icon: "📹", category: "safety" },
    { key: "security_guard", label: "Security Guard", icon: "🛡️", category: "safety" },
    { key: "gym", label: "Gym / Fitness", icon: "🏋️", category: "common" },
    { key: "housekeeping", label: "Housekeeping", icon: "🧹", category: "basic" },
    { key: "water_purifier", label: "Water Purifier", icon: "💧", category: "basic" }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch PG Details
  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pg/${id}`);
        if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch");
        const data = res.data.data;
        setPG(data);
        
        const photos = (data.photos || []).map(p => ({ type: "photo", src: getCorrectImageUrl(p) }));
        let videos = [];
        try { videos = JSON.parse(data.videos || "[]").map(v => ({ type: "video", src: getCorrectImageUrl(v) })); } catch(e) {}
        setMedia([...photos, ...videos]);
        
        if (data.latitude && data.longitude) setMapCenter([data.latitude, data.longitude]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPGDetails();
  }, [id]);

  // Fetch Nearby Data
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;
    
    const fetchNearbyHighlights = async () => {
      setLoadingHighlights(true);
      const highlights = [];
      const highlightFields = ['nearby_college', 'nearby_school', 'nearby_metro', 'nearby_bus_stop', 'nearby_hospital', 'nearby_pharmacy', 'nearby_supermarket', 'nearby_restaurant', 'nearby_bank', 'nearby_atm', 'nearby_gym', 'nearby_park'];
      
      highlightFields.forEach(field => {
        if (pg[field] && pg[field].trim()) {
          const categoryMap = { nearby_college: 'education', nearby_school: 'education', nearby_metro: 'transport', nearby_bus_stop: 'transport', nearby_hospital: 'healthcare', nearby_pharmacy: 'healthcare', nearby_supermarket: 'shopping', nearby_restaurant: 'food', nearby_bank: 'finance', nearby_atm: 'finance', nearby_gym: 'recreation', nearby_park: 'recreation' };
          highlights.push({ name: pg[field], type: field, category: categoryMap[field] || 'other', icon: getCategoryIcon(categoryMap[field]), coordinates: generateRandomCoords(pg.latitude, pg.longitude, 1.5) });
        }
      });
      setNearbyHighlights(highlights);
      setLoadingHighlights(false);
    };
    
    const fetchNearbyPGs = async () => {
      setLoadingNearbyPGs(true);
      try {
        const res = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
        if (res.data?.success) {
          const pgsWithDistance = res.data.data.map(other => ({ ...other, distance: calculateDistance(pg.latitude, pg.longitude, other.latitude, other.longitude) }))
            .sort((a, b) => a.distance - b.distance).slice(0, 4);
          setNearbyPGs(pgsWithDistance);
        }
      } catch (err) { console.error(err); }
      setLoadingNearbyPGs(false);
    };
    
    fetchNearbyHighlights();
    fetchNearbyPGs();
  }, [pg, id]);

  const getCategoryIcon = (category) => {
    const icons = { education: '🎓', transport: '🚌', healthcare: '🏥', shopping: '🛒', food: '🍽️', recreation: '🏃', finance: '🏦' };
    return icons[category] || '📍';
  };
  
  const generateRandomCoords = (lat, lon, maxDistKm) => {
    const R = 6371;
    const dist = maxDistKm / R;
    const bearing = Math.random() * 2 * Math.PI;
    const lat1 = lat * Math.PI / 180;
    const lon1 = lon * Math.PI / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) + Math.cos(lat1) * Math.sin(dist) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(dist) * Math.cos(lat1), Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2));
    return [lat2 * 180 / Math.PI, lon2 * 180 / Math.PI];
  };
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getStartingPrice = () => {
    if (!pg) return "—";
    if (pg.pg_category === "to_let") return pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk || "—";
    if (pg.pg_category === "coliving") return pg.co_living_single_room || pg.co_living_double_room || "—";
    return pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing || pg.single_room || pg.double_room || "—";
  };

  const getTrueFacilities = () => {
    const trueFacilities = allFacilities.filter(f => pg && (pg[f.key] === true || pg[f.key] === "true" || pg[f.key] === 1));
    if (selectedFacilityCategory === "all") return trueFacilities;
    return trueFacilities.filter(f => f.category === selectedFacilityCategory);
  };

  const getFacilityCount = (categoryId) => {
    const facilities = allFacilities.filter(f => categoryId === "all" || f.category === categoryId);
    return facilities.filter(f => pg && (pg[f.key] === true || pg[f.key] === "true" || pg[f.key] === 1)).length;
  };

  const handleBookNow = () => {
    if (!user) {
      showNotification("Please login to book this property", 'error');
      navigate("/register", { state: { redirectTo: `/pg/${id}` } });
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    if (bookingLoading) return;
    setBookingLoading(true);
    try {
      const token = await user.getIdToken(true);
      const res = await api.post(`/bookings/${id}`, { check_in_date: bookingData.checkInDate, room_type: bookingData.roomType }, { headers: { Authorization: `Bearer ${token}` } });
      showNotification(res.data?.message || "✅ Booking request sent!", 'success');
      setShowBookingModal(false);
    } catch (error) {
      showNotification(error?.response?.data?.message || "❌ Booking failed", 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCallOwner = () => {
    if (pg?.contact_phone) window.location.href = `tel:${pg.contact_phone}`;
    else showNotification("Contact number will be visible after booking", 'info');
  };

  const handleViewOnMap = (highlight) => {
    if (highlight.coordinates) {
      setMapCenter(highlight.coordinates);
      setMapZoom(17);
      setTimeout(() => document.getElementById("location-map")?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: pg?.pg_name, url }); } catch(e) {}
    } else {
      navigator.clipboard.writeText(url);
      showNotification("Link copied to clipboard!", 'success');
    }
    setShowShareOptions(false);
  };

  const toggleFullscreen = () => {
    if (!sliderRef.current) return;
    if (!isFullscreen) {
      sliderRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleRulesSection = (section) => {
    setExpandedRules(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (authLoading || loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>🏠</div>
        <h2>Property Not Found</h2>
        <p>{error || "The property you're looking for doesn't exist."}</p>
        <button style={styles.backButton} onClick={() => navigate("/")}>← Back to Home</button>
      </div>
    );
  }

  const isToLet = pg.pg_category === "to_let";
  const isCoLiving = pg.pg_category === "coliving";
  const hasOwnerContact = pg.contact_phone?.trim();
  const currentMedia = media[currentMediaIndex];
  const filteredFacilities = getTrueFacilities();
  const filteredHighlights = selectedHighlightCategory === "all" ? nearbyHighlights : nearbyHighlights.filter(h => h.category === selectedHighlightCategory);

  return (
    <div style={styles.page}>
      {/* Notification Toast */}
      {notification && (
        <div style={{ ...styles.notification, background: notification.type === 'error' ? '#ef4444' : notification.type === 'info' ? '#3b82f6' : '#10b981' }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : notification.type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
          {notification.message}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span onClick={() => navigate("/")}>Home</span>
        <span>/</span>
        <span onClick={() => navigate("/properties")}>Properties</span>
        <span>/</span>
        <span style={styles.breadcrumbCurrent}>{pg.pg_name}</span>
        <span style={styles.propertyCode}>{getPGCode(pg.id)}</span>
      </div>

      {/* Media Slider */}
      <div style={styles.sliderContainer} ref={sliderRef}>
        {media.length > 0 ? (
          <div style={styles.slider}>
            {currentMedia.type === "photo" ? (
              <img src={currentMedia.src} alt={pg.pg_name} style={styles.mediaImage} onError={(e) => { e.target.src = "https://via.placeholder.com/800x500?text=Image+Not+Found"; }} />
            ) : (
              <video ref={videoRef} src={currentMedia.src} style={styles.mediaVideo} controls={false} loop />
            )}
            
            {currentMedia.type === "video" && (
              <div style={styles.videoControls}>
                <button onClick={toggleVideoPlay} style={styles.videoControlBtn}>{isVideoPlaying ? <Pause size={20} /> : <Play size={20} />}</button>
                <button onClick={toggleMute} style={styles.videoControlBtn}>{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
              </div>
            )}
            
            {media.length > 1 && (
              <>
                <button style={styles.navBtnLeft} onClick={() => setCurrentMediaIndex(i => (i === 0 ? media.length - 1 : i - 1))}><ChevronLeft size={28} /></button>
                <button style={styles.navBtnRight} onClick={() => setCurrentMediaIndex(i => (i + 1) % media.length)}><ChevronRight size={28} /></button>
                <div style={styles.mediaCounter}>{currentMediaIndex + 1} / {media.length}</div>
              </>
            )}
            <button style={styles.fullscreenBtn} onClick={toggleFullscreen}>{isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
          </div>
        ) : (
          <div style={styles.noMedia}>
            <Camera size={48} />
            <p>No photos available</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={styles.mainCard}>
        <div style={styles.headerRow}>
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>{pg.pg_name}</h1>
            <div style={styles.addressRow}>
              <MapPin size={16} />
              <span>{pg.address || `${pg.area}, ${pg.city}`}</span>
            </div>
            {pg.landmark && <div style={styles.landmarkRow}><Navigation size={14} /> Near {pg.landmark}</div>}
          </div>
          <div style={styles.actionButtons}>
            <button style={{ ...styles.iconBtn, background: isLiked ? '#ef4444' : '#f1f5f9' }} onClick={() => setIsLiked(!isLiked)}>
              <Heart size={18} fill={isLiked ? 'white' : 'none'} color={isLiked ? 'white' : '#64748b'} />
            </button>
            <button style={styles.iconBtn} onClick={() => setShowShareOptions(!showShareOptions)}>
              <Share2 size={18} />
            </button>
            {showShareOptions && (
              <div style={styles.shareMenu}>
                <button onClick={handleShare}><Copy size={16} /> Copy Link</button>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(pg.pg_name)}`, '_blank')}><MessageCircle size={16} /> WhatsApp</button>
                <button onClick={() => window.open(`mailto:?subject=${pg.pg_name}&body=${window.location.href}`, '_blank')}><Mail size={16} /> Email</button>
              </div>
            )}
            <button style={styles.bookButton} onClick={handleBookNow}><BookOpen size={18} /> Book Now</button>
            {hasOwnerContact && <button style={styles.callButton} onClick={handleCallOwner}><Phone size={18} /> Call</button>}
          </div>
        </div>

        <div style={styles.badgeRow}>
          <span style={styles.typeBadge}>{isToLet ? "🏠 House/Flat" : isCoLiving ? "🤝 Co-Living" : "🏢 PG/Hostel"}</span>
          {!isToLet && !isCoLiving && pg.pg_type && <span style={styles.genderBadge}>{pg.pg_type === "boys" ? "👨 Boys Only" : pg.pg_type === "girls" ? "👩 Girls Only" : "Mixed"}</span>}
          <span style={{ ...styles.availabilityBadge, background: pg.available_rooms > 0 ? '#10b981' : '#ef4444' }}>{pg.available_rooms > 0 ? `🟢 ${pg.available_rooms} Available` : "🔴 Fully Occupied"}</span>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statItem}><div style={styles.statIcon}>💰</div><div><div style={styles.statLabel}>Starting from</div><div style={styles.statValue}>₹{formatPrice(getStartingPrice())}<span style={styles.statPeriod}>/month</span></div></div></div>
          <div style={styles.statItem}><div style={styles.statIcon}>🏠</div><div><div style={styles.statLabel}>Total {isToLet ? "Properties" : "Rooms"}</div><div style={styles.statValue}>{pg.total_rooms || "—"}</div></div></div>
          <div style={styles.statItem}><div style={styles.statIcon}>✅</div><div><div style={styles.statLabel}>Facilities</div><div style={styles.statValue}>{getFacilityCount("all")}+</div></div></div>
          <div style={styles.statItem}><div style={styles.statIcon}>📍</div><div><div style={styles.statLabel}>Nearby Places</div><div style={styles.statValue}>{nearbyHighlights.length}+</div></div></div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={styles.twoColumn}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {pg.description && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>📝 About this Property</h3></div>
              <p style={styles.description}>{pg.description}</p>
            </div>
          )}

          <div style={styles.section}>
            <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>💰 Price Details</h3></div>
            <PriceDetails pg={pg} />
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>🏠 Facilities & Amenities</h3>
              <span style={styles.sectionBadge}>{getFacilityCount("all")} amenities</span>
            </div>
            <div style={styles.facilityCategories}>
              {facilityCategories.map(cat => {
                const count = getFacilityCount(cat.id);
                if (count === 0 && cat.id !== "all") return null;
                return (
                  <button key={cat.id} style={{ ...styles.facilityCategoryBtn, background: selectedFacilityCategory === cat.id ? `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` : 'white', color: selectedFacilityCategory === cat.id ? 'white' : '#334155' }} onClick={() => setSelectedFacilityCategory(cat.id)}>
                    <span>{cat.icon}</span>
                    <span>{cat.label} {count > 0 && `(${count})`}</span>
                  </button>
                );
              })}
            </div>
            <div style={styles.facilitiesGrid}>
              {filteredFacilities.map((facility, idx) => {
                const catColor = facilityCategories.find(c => c.id === facility.category)?.color;
                return <FacilityItem key={idx} icon={facility.icon} label={facility.label} color={catColor} />;
              })}
            </div>
            {pg.water_type && <div style={styles.waterSource}>💧 Water Source: {pg.water_type === "borewell" ? "Borewell" : pg.water_type === "kaveri" ? "Kaveri" : pg.water_type}</div>}
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>📜 House Rules</h3></div>
            <div style={styles.rulesContainer}>
              <div style={styles.rulesSection}>
                <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('visitors')}><h4>👥 Visitor Rules</h4><span>{expandedRules.visitors ? '−' : '+'}</span></div>
                {expandedRules.visitors && (
                  <div style={styles.rulesGrid}>
                    {pg.visitor_allowed !== undefined && <RuleItem icon="👥" label="Visitors Allowed" allowed={pg.visitor_allowed === true || pg.visitor_allowed === "true"} description="Friends and family can visit" />}
                    {pg.couple_allowed !== undefined && <RuleItem icon="❤️" label="Couples Allowed" allowed={pg.couple_allowed === true || pg.couple_allowed === "true"} description="Couples can stay together" />}
                  </div>
                )}
              </div>
              <div style={styles.rulesSection}>
                <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('lifestyle')}><h4>🚬 Lifestyle Rules</h4><span>{expandedRules.lifestyle ? '−' : '+'}</span></div>
                {expandedRules.lifestyle && (
                  <div style={styles.rulesGrid}>
                    {pg.smoking_allowed !== undefined && <RuleItem icon="🚬" label="Smoking Allowed" allowed={pg.smoking_allowed === true || pg.smoking_allowed === "true"} description="Smoking inside the property" />}
                    {pg.drinking_allowed !== undefined && <RuleItem icon="🍺" label="Drinking Allowed" allowed={pg.drinking_allowed === true || pg.drinking_allowed === "true"} description="Alcohol consumption allowed" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {pg.latitude && pg.longitude && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>📍 Location</h3></div>
              <div id="location-map" style={styles.mapContainer}>
                <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "280px", width: "100%", borderRadius: "20px" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pg.latitude, pg.longitude]}>
                    <Popup><strong>{pg.pg_name}</strong><br />{pg.address || pg.area}<br /><button style={styles.mapPopupBtn} onClick={handleBookNow}>Book Now</button></Popup>
                  </Marker>
                  <MapController center={mapCenter} zoom={mapZoom} />
                </MapContainer>
              </div>
              <div style={styles.locationDetails}>
                {pg.area && <div><strong>Area:</strong> {pg.area}</div>}
                {pg.landmark && <div><strong>Landmark:</strong> {pg.landmark}</div>}
                {pg.city && <div><strong>City:</strong> {pg.city}</div>}
              </div>
            </div>
          )}

          {nearbyHighlights.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>📍 Nearby Places</h3></div>
              <div style={styles.categoriesPills}>
                {highlightCategories.map(cat => {
                  const count = cat.id === "all" ? nearbyHighlights.length : nearbyHighlights.filter(h => h.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button key={cat.id} style={{ ...styles.highlightCategoryBtn, background: selectedHighlightCategory === cat.id ? `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` : 'white', color: selectedHighlightCategory === cat.id ? 'white' : '#334155' }} onClick={() => setSelectedHighlightCategory(cat.id)}>
                      <span>{cat.icon}</span> {cat.label} <span style={styles.categoryCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div style={styles.highlightsList}>
                {filteredHighlights.slice(0, 5).map((h, idx) => {
                  const catColor = highlightCategories.find(c => c.id === h.category)?.color || '#6366f1';
                  return <HighlightItem key={idx} name={h.name} type={h.type} icon={h.icon} onMapView={() => handleViewOnMap(h)} color={catColor} />;
                })}
              </div>
            </div>
          )}

          {nearbyPGs.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>🏘️ Nearby Properties</h3><span style={styles.sectionBadge}>{nearbyPGs.length}</span></div>
              <div style={styles.nearbyPGsList}>
                {nearbyPGs.map(pgItem => <NearbyPGCard key={pgItem.id} pg={pgItem} onClick={() => navigate(`/pg/${pgItem.id}`)} distance={pgItem.distance} />)}
              </div>
            </div>
          )}

          {(hasOwnerContact || pg.contact_person) && (
            <div style={styles.contactCard}>
              <h3 style={styles.contactTitle}>📞 Contact Information</h3>
              {pg.contact_person && <div style={styles.contactItem}><span>👤</span><div><div style={styles.contactLabel}>Contact Person</div><div>{pg.contact_person}</div></div></div>}
              {hasOwnerContact && <div style={styles.contactItem}><span>📱</span><div><div style={styles.contactLabel}>Phone Number</div><a href={`tel:${pg.contact_phone}`} style={styles.phoneLink}>{pg.contact_phone}</a></div></div>}
              <div style={styles.contactButtons}>
                <button style={styles.bookButtonSmall} onClick={handleBookNow}><BookOpen size={16} /> Book Now</button>
                {hasOwnerContact && <button style={styles.callButtonSmall} onClick={handleCallOwner}><Phone size={16} /> Call Now</button>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div style={styles.stickyBar}>
        <div style={styles.stickyContent}>
          <div><div style={styles.stickyPrice}>₹{formatPrice(getStartingPrice())}<span style={styles.stickyPeriod}>/month</span></div><div style={styles.stickyInfo}>{pg.pg_name} • {pg.area || pg.city}</div></div>
          <div style={styles.stickyActions}>
            <button style={styles.stickyBookButton} onClick={handleBookNow}><BookOpen size={18} /> Book Now</button>
            {hasOwnerContact && <button style={styles.stickyCallButton} onClick={handleCallOwner}><Phone size={18} /> Call</button>}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && <BookingModal pg={pg} onClose={() => setShowBookingModal(false)} onBook={handleBookingSubmit} bookingLoading={bookingLoading} />}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

/* ================= MODERN STYLES ================= */
const styles = {
  page: { maxWidth: "1280px", margin: "0 auto", padding: "24px 20px 100px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px", color: "#64748b" },
  errorContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", textAlign: "center", background: "white", borderRadius: "32px", margin: "20px" },
  errorIcon: { fontSize: "64px", marginBottom: "20px" },
  backButton: { marginTop: "24px", padding: "12px 28px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "40px", cursor: "pointer", fontWeight: "600" },
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: "#64748b", flexWrap: "wrap" },
  breadcrumbCurrent: { color: "#1e293b", fontWeight: "600" },
  propertyCode: { marginLeft: "auto", background: "#f1f5f9", padding: "6px 12px", borderRadius: "30px", fontSize: "12px", fontWeight: "600" },
  sliderContainer: { borderRadius: "28px", overflow: "hidden", marginBottom: "28px", boxShadow: "0 25px 40px -12px rgba(0,0,0,0.25)" },
  slider: { position: "relative", backgroundColor: "#000" },
  mediaImage: { width: "100%", height: "500px", objectFit: "cover" },
  mediaVideo: { width: "100%", height: "500px", objectFit: "cover" },
  navBtnLeft: { position: "absolute", top: "50%", left: "20px", transform: "translateY(-50%)", background: "rgba(255,255,255,0.95)", border: "none", width: "48px", height: "48px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" },
  navBtnRight: { position: "absolute", top: "50%", right: "20px", transform: "translateY(-50%)", background: "rgba(255,255,255,0.95)", border: "none", width: "48px", height: "48px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" },
  mediaCounter: { position: "absolute", bottom: "20px", right: "20px", background: "rgba(0,0,0,0.7)", color: "white", padding: "6px 14px", borderRadius: "30px", fontSize: "13px", fontWeight: "600" },
  fullscreenBtn: { position: "absolute", bottom: "20px", left: "20px", background: "rgba(0,0,0,0.7)", border: "none", width: "40px", height: "40px", borderRadius: "30px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  videoControls: { position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px", background: "rgba(0,0,0,0.7)", padding: "10px 20px", borderRadius: "50px" },
  videoControlBtn: { background: "transparent", border: "none", color: "white", cursor: "pointer", padding: "8px" },
  noMedia: { height: "400px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", gap: "16px" },
  mainCard: { background: "white", borderRadius: "32px", padding: "32px", marginBottom: "28px", boxShadow: "0 20px 35px -12px rgba(0,0,0,0.08)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "20px" },
  headerInfo: { flex: 1 },
  title: { fontSize: "32px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  addressRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#475569", marginBottom: "4px" },
  landmarkRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b" },
  actionButtons: { display: "flex", gap: "12px", alignItems: "center" },
  iconBtn: { width: "44px", height: "44px", borderRadius: "30px", background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  bookButton: { padding: "12px 28px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" },
  callButton: { padding: "12px 28px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "white", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" },
  shareMenu: { position: "absolute", top: "70px", right: "20px", background: "white", borderRadius: "20px", boxShadow: "0 20px 35px -12px rgba(0,0,0,0.15)", padding: "12px", zIndex: 100, display: "flex", flexDirection: "column", gap: "8px" },
  badgeRow: { display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "28px" },
  typeBadge: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", padding: "6px 16px", borderRadius: "40px", fontSize: "13px", fontWeight: "600" },
  genderBadge: { background: "linear-gradient(135deg, #ec4899, #db2777)", color: "white", padding: "6px 16px", borderRadius: "40px", fontSize: "13px", fontWeight: "600" },
  availabilityBadge: { color: "white", padding: "6px 16px", borderRadius: "40px", fontSize: "13px", fontWeight: "600" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", padding: "20px", background: "#f8fafc", borderRadius: "24px" },
  statItem: { display: "flex", alignItems: "center", gap: "16px" },
  statIcon: { fontSize: "28px", width: "56px", height: "56px", background: "white", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  statLabel: { fontSize: "13px", color: "#64748b", marginBottom: "4px" },
  statValue: { fontSize: "22px", fontWeight: "700", color: "#0f172a" },
  statPeriod: { fontSize: "12px", fontWeight: "400", color: "#64748b", marginLeft: "4px" },
  twoColumn: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px", marginBottom: "100px" },
  leftColumn: { display: "flex", flexDirection: "column", gap: "28px" },
  rightColumn: { display: "flex", flexDirection: "column", gap: "28px" },
  section: { background: "white", borderRadius: "28px", padding: "28px", boxShadow: "0 12px 30px rgba(0,0,0,0.05)" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "12px", borderBottom: "2px solid #f1f5f9" },
  sectionTitle: { fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 },
  sectionBadge: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", padding: "4px 12px", borderRadius: "30px", fontSize: "12px", fontWeight: "600" },
  description: { fontSize: "16px", lineHeight: "1.6", color: "#334155" },
  priceSection: { marginBottom: "20px" },
  priceSectionHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" },
  priceSubsectionHeader: { display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: "600", color: "#475569", marginTop: "16px", marginBottom: "12px" },
  priceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" },
  priceCard: { background: "#f8fafc", padding: "16px", borderRadius: "20px", border: "1px solid #e2e8f0", textAlign: "center" },
  priceCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" },
  priceType: { fontSize: "14px", fontWeight: "500", color: "#64748b" },
  priceValue: { fontSize: "18px", fontWeight: "700", color: "#10b981" },
  pricePeriod: { fontSize: "11px", fontWeight: "400", color: "#64748b" },
  priceDeposit: { fontSize: "11px", color: "#ef4444", marginTop: "8px" },
  chargesCard: { marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "20px" },
  chargesHeader: { fontWeight: "600", marginBottom: "12px", fontSize: "14px" },
  chargesGrid: { display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" },
  noPriceCard: { textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "20px", color: "#64748b" },
  facilityCategories: { display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px" },
  facilityCategoryBtn: { padding: "8px 18px", borderRadius: "40px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s", border: "1px solid #e2e8f0" },
  facilitiesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" },
  facilityItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "16px", border: "1px solid #e2e8f0", borderLeftWidth: "4px", transition: "all 0.2s" },
  facilityIcon: { fontSize: "20px" },
  facilityLabel: { fontSize: "14px", fontWeight: "500", color: "#1e293b", flex: 1 },
  facilityCheck: { color: "#10b981" },
  waterSource: { marginTop: "20px", padding: "12px 16px", background: "#e0f2fe", borderRadius: "16px", fontSize: "14px" },
  rulesContainer: { display: "flex", flexDirection: "column", gap: "16px" },
  rulesSection: { background: "#f8fafc", borderRadius: "20px", overflow: "hidden" },
  rulesSectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: "white" },
  rulesGrid: { display: "flex", flexDirection: "column", gap: "12px", padding: "20px", paddingTop: 0 },
  ruleItem: { display: "flex", gap: "14px", padding: "14px", borderRadius: "16px", border: "1px solid #e2e8f0" },
  ruleIcon: { width: "40px", height: "40px", borderRadius: "30px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "white" },
  ruleContent: { flex: 1 },
  ruleLabel: { fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
  ruleDescription: { fontSize: "12px", color: "#64748b", marginBottom: "6px" },
  ruleStatus: { display: "inline-block", padding: "2px 10px", borderRadius: "30px", fontSize: "10px", fontWeight: "600", color: "white" },
  mapContainer: { borderRadius: "20px", overflow: "hidden", marginBottom: "16px" },
  locationDetails: { padding: "16px", background: "#f8fafc", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" },
  mapPopupBtn: { padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: "30px", fontSize: "12px", cursor: "pointer", marginTop: "8px" },
  categoriesPills: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" },
  highlightCategoryBtn: { padding: "8px 16px", borderRadius: "40px", cursor: "pointer", fontSize: "13px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s", border: "1px solid #e2e8f0" },
  categoryCount: { background: "rgba(0,0,0,0.1)", padding: "2px 8px", borderRadius: "30px", fontSize: "11px", marginLeft: "4px" },
  highlightsList: { display: "flex", flexDirection: "column", gap: "12px" },
  highlightItem: { display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", borderLeftWidth: "4px", borderLeftStyle: "solid", cursor: "pointer", transition: "all 0.2s" },
  highlightIconContainer: { width: "40px", height: "40px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  highlightIcon: { fontSize: "20px", color: "white" },
  highlightContent: { flex: 1 },
  highlightName: { fontSize: "14px", fontWeight: "600", color: "#1e293b" },
  highlightType: { fontSize: "12px", color: "#64748b" },
  viewOnMapButton: { padding: "6px 12px", borderRadius: "30px", color: "white", border: "none", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
  nearbyPGsList: { display: "flex", flexDirection: "column", gap: "16px" },
  nearbyPgCard: { display: "flex", gap: "16px", padding: "16px", background: "#f8fafc", borderRadius: "20px", cursor: "pointer", transition: "all 0.2s" },
  nearbyPgImage: { width: "100px", height: "100px", borderRadius: "16px", overflow: "hidden", position: "relative", flexShrink: 0, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" },
  nearbyPgImagePlaceholder: { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" },
  nearbyPgBadges: { position: "absolute", top: "8px", left: "8px", display: "flex", gap: "6px" },
  nearbyPgTypeBadge: { background: "rgba(59,130,246,0.9)", padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "600", color: "white" },
  nearbyPgDistanceBadge: { background: "rgba(16,185,129,0.9)", padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "600", color: "white" },
  nearbyPgContent: { flex: 1 },
  nearbyPgTitle: { fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" },
  nearbyPgAddress: { fontSize: "12px", color: "#64748b", marginBottom: "8px" },
  nearbyPgPrice: { fontSize: "14px", fontWeight: "700", color: "#10b981", marginBottom: "8px" },
  nearbyPgViewButton: { padding: "6px 12px", background: "transparent", border: "1px solid #6366f1", borderRadius: "30px", fontSize: "11px", fontWeight: "600", color: "#6366f1", cursor: "pointer" },
  contactCard: { background: "white", borderRadius: "28px", padding: "24px", boxShadow: "0 12px 30px rgba(0,0,0,0.05)" },
  contactTitle: { fontSize: "18px", fontWeight: "700", marginBottom: "20px" },
  contactItem: { display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: "1px solid #f1f5f9" },
  contactLabel: { fontSize: "12px", color: "#64748b" },
  phoneLink: { color: "#3b82f6", textDecoration: "none", fontWeight: "500" },
  contactButtons: { display: "flex", gap: "12px", marginTop: "20px" },
  bookButtonSmall: { flex: 1, padding: "10px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "40px", color: "white", border: "none", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" },
  callButtonSmall: { flex: 1, padding: "10px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "40px", color: "white", border: "none", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" },
  stickyBar: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", padding: "14px 24px", boxShadow: "0 -8px 30px rgba(0,0,0,0.08)", zIndex: 1000 },
  stickyContent: { maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" },
  stickyPrice: { fontSize: "20px", fontWeight: "800", color: "#0f172a" },
  stickyPeriod: { fontSize: "12px", fontWeight: "400", color: "#64748b" },
  stickyActions: { display: "flex", gap: "12px" },
  stickyBookButton: { padding: "10px 24px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "40px", color: "white", border: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  stickyCallButton: { padding: "10px 24px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "40px", color: "white", border: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  notification: { position: "fixed", top: "24px", right: "24px", color: "white", padding: "12px 20px", borderRadius: "50px", boxShadow: "0 15px 35px rgba(0,0,0,0.15)", zIndex: 4000, display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "500", animation: "slideIn 0.3s ease" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" },
  modalContainer: { background: "white", borderRadius: "32px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", position: "relative" },
  modalGradient: { position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)", borderRadius: "32px 32px 0 0" },
  modalCloseBtn: { position: "absolute", top: "16px", right: "16px", background: "#f1f5f9", border: "none", width: "38px", height: "38px", borderRadius: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 },
  modalContent: { padding: "32px" },
  modalHeader: { textAlign: "center", marginBottom: "24px" },
  modalIcon: { fontSize: "48px", marginBottom: "12px" },
  modalTitle: { fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" },
  modalSubtitle: { fontSize: "13px", color: "#64748b" },
  modalWarning: { background: "#fff7ed", padding: "12px 16px", borderRadius: "16px", marginBottom: "24px", fontSize: "13px", color: "#9a3412", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #fed7aa" },
  formGroup: { marginBottom: "24px" },
  formLabel: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontSize: "14px", fontWeight: "600", color: "#334155" },
  formInput: { width: "100%", padding: "14px 16px", border: "1px solid #cbd5e1", borderRadius: "20px", fontSize: "14px", background: "#f9fafb" },
  formHint: { fontSize: "11px", color: "#64748b", marginTop: "6px" },
  roomTypeGrid: { display: "flex", flexDirection: "column", gap: "12px" },
  roomTypeCard: { display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "20px", cursor: "pointer", transition: "all 0.2s" },
  roomTypeIcon: { fontSize: "24px" },
  roomTypeLabel: { fontSize: "14px", fontWeight: "500" },
  roomTypePrice: { fontSize: "12px", color: "#10b981" },
  roomTypeCheck: { marginLeft: "auto", color: "#6366f1" },
  selectedPriceCard: { background: "#ecfdf5", padding: "12px 16px", borderRadius: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" },
  infoBox: { background: "#f0fdf4", borderRadius: "20px", padding: "16px", marginBottom: "24px", border: "1px solid #bbf7d0" },
  infoBoxHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontWeight: "600", color: "#065f46" },
  infoList: { margin: 0, paddingLeft: "20px", color: "#065f46", fontSize: "12px", lineHeight: "1.6" },
  modalActions: { display: "flex", gap: "12px" },
  cancelBtn: { flex: 1, padding: "14px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  confirmBtn: { flex: 2, padding: "14px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  spinning: { animation: "spin 0.8s linear infinite" }
};