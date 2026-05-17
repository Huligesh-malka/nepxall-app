import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Search, Filter, MapPin, Home, Utensils, Snowflake, Navigation, X, Phone, 
  MessageCircle, Wifi, Car, Shield, Eye, Heart, ChevronLeft, ChevronRight, 
  Check, Sliders, Coins, BarChart, Plus, Info 
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

// Key for localStorage
const LOCATION_AUTO_ASKED_KEY = "nepxall_location_auto_asked";

// Popular Areas
const popularAreas = [
  { name: "Koramangala", color: "#3b82f6" },
  { name: "BTM Layout", color: "#10b981" },
  { name: "Jayanagar", color: "#f59e0b" },
  { name: "Electronic City", color: "#8b5cf6" },
  { name: "HSR Layout", color: "#ec4899" },
  { name: "Whitefield", color: "#06b6d4" },
  { name: "Marathahalli", color: "#ef4444" },
];

// Quick Filters
const quickFilters = [
  { id: "near_me", name: "Near Me", icon: <Navigation size={16} />, type: "location" },
  { id: "ac_room", name: "AC Room", icon: <Snowflake size={16} />, type: "amenity", field: "ac_available" },
  { id: "wifi", name: "WiFi", icon: <Wifi size={16} />, type: "amenity", field: "wifi_available" },
  { id: "parking", name: "Parking", icon: <Car size={16} />, type: "amenity", field: "parking_available" },
];

// Helper functions
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

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BACKEND_URL}${relativePath}`;
    }
  }
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

const getPriceRangeByType = (pg) => {
  const prices = [];
  if (pg.pg_category === "pg") {
    if (pg.single_sharing > 0) prices.push(pg.single_sharing);
    if (pg.double_sharing > 0) prices.push(pg.double_sharing);
    if (pg.triple_sharing > 0) prices.push(pg.triple_sharing);
    if (pg.four_sharing > 0) prices.push(pg.four_sharing);
  } else if (pg.pg_category === "coliving") {
    if (pg.co_living_single_room > 0) prices.push(pg.co_living_single_room);
    if (pg.co_living_double_room > 0) prices.push(pg.co_living_double_room);
  } else if (pg.pg_category === "to_let") {
    if (pg.price_1bhk > 0) prices.push(pg.price_1bhk);
    if (pg.price_2bhk > 0) prices.push(pg.price_2bhk);
  }
  if (prices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

const getEffectiveRent = (pg) => {
  return pg.rent_amount || pg.single_sharing || pg.double_sharing || 
         pg.triple_sharing || pg.four_sharing || pg.co_living_single_room ||
         pg.co_living_double_room || pg.price_1bhk || pg.price_2bhk || 0;
};

// Budget Filter Component
const BudgetFilter = ({ minBudget, maxBudget, onBudgetChange, onClose }) => {
  const [localMin, setLocalMin] = useState(minBudget);
  const [localMax, setLocalMax] = useState(maxBudget);

  const handleApply = () => {
    onBudgetChange(localMin, localMax);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20
    }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 500, padding: 30 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Budget Filter</h2>
        <div style={{ marginBottom: 20 }}>
          <label>Min Budget: ₹{formatPrice(localMin)}</label>
          <input type="range" min="0" max="50000" step="1000" value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label>Max Budget: ₹{formatPrice(localMax)}</label>
          <input type="range" min="0" max="50000" step="1000" value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: "#f3f4f6", border: "none", borderRadius: 10 }}>Cancel</button>
          <button onClick={handleApply} style={{ flex: 1, padding: 12, background: "#3b82f6", color: "white", border: "none", borderRadius: 10 }}>Apply</button>
        </div>
      </div>
    </div>
  );
};

// Booking Modal
const BookingModal = ({ pg, onClose, onBook }) => {
  const [roomType, setRoomType] = useState("");
  const [loading, setLoading] = useState(false);

  const getRoomTypes = () => {
    const types = [];
    if (pg.pg_category === "pg") {
      if (pg.single_sharing > 0) types.push("Single Sharing");
      if (pg.double_sharing > 0) types.push("Double Sharing");
      if (pg.triple_sharing > 0) types.push("Triple Sharing");
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room > 0) types.push("Single Room");
      if (pg.co_living_double_room > 0) types.push("Double Room");
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk > 0) types.push("1BHK");
      if (pg.price_2bhk > 0) types.push("2BHK");
    }
    return types;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onBook({ roomType });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 20
    }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 500, padding: 30 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>📞 Contact Owner</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8 }}>Room Type *</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} required
              style={{ width: "100%", padding: 12, border: "1px solid #d1d5db", borderRadius: 10 }}>
              <option value="">Select Room Type</option>
              {getRoomTypes().map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, background: "#f3f4f6", border: "none", borderRadius: 10 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: 12, background: "#3b82f6", color: "white", border: "none", borderRadius: 10 }}>
              {loading ? "Processing..." : "Contact Owner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Quick View Modal
const QuickViewModal = ({ pg, onClose, onBook, onSaveFavorite, isFavorite }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const photosArray = pg.photos?.filter(p => p && p.trim()) || [];
  const hasMultipleImages = photosArray.length > 1;

  useEffect(() => {
    if (hasMultipleImages) {
      const interval = setInterval(() => setCurrentImage(prev => (prev + 1) % photosArray.length), 2500);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length]);

  const currentPhotoUrl = getCorrectImageUrl(photosArray[currentImage]) || getCorrectImageUrl(pg.main_photo) || "/no-image.png";
  const startingPrice = getPriceRangeByType(pg).min || getEffectiveRent(pg);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20
    }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.9)", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", zIndex: 100 }}>
          <X size={24} />
        </button>
        <button onClick={() => onSaveFavorite(pg.id, !isFavorite)} style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.9)", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", zIndex: 100 }}>
          <Heart size={20} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} />
        </button>
        <div style={{ height: 250, background: "#f3f4f6" }}>
          <img src={currentPhotoUrl} alt={pg.pg_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{pg.pg_name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, color: "#6b7280" }}>
            <MapPin size={14} /> {pg.area}{pg.city ? `, ${pg.city}` : ""}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1e3a5f", marginBottom: 16 }}>
            ₹{formatPrice(startingPrice)} <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280" }}>onwards</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => window.location.href = `tel:${pg.contact_phone}`} style={{ flex: 1, padding: 12, background: "#10b981", color: "white", border: "none", borderRadius: 10 }}><Phone size={16} /> Call</button>
            <button onClick={() => window.open(`https://wa.me/${pg.contact_phone}`, '_blank')} style={{ flex: 1, padding: 12, background: "#25D366", color: "white", border: "none", borderRadius: 10 }}><MessageCircle size={16} /> WhatsApp</button>
            <button onClick={() => { onBook(pg); onClose(); }} style={{ flex: 1, padding: 12, background: "#3b82f6", color: "white", border: "none", borderRadius: 10 }}><Check size={16} /> Book</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Property Card Component
const PGPropertyCard = ({ pg, onQuickView, onFavorite, onContact, onCardClick, isFavorite }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const photosArray = pg.photos?.filter(p => p && p.trim()) || [];
  const hasMultipleImages = photosArray.length > 1;

  useEffect(() => {
    if (hasMultipleImages) {
      const interval = setInterval(() => setCurrentImage(prev => (prev + 1) % photosArray.length), 2500);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length]);

  const currentPhotoUrl = getCorrectImageUrl(photosArray[currentImage]) || getCorrectImageUrl(pg.main_photo) || "/no-image.png";
  const startingPrice = getPriceRangeByType(pg).min || getEffectiveRent(pg);
  const isFillingFast = pg.available_rooms < 5 && pg.available_rooms > 0;

  return (
    <div onClick={() => onCardClick(pg)} style={{
      borderRadius: 16, overflow: "hidden", background: "#fff", cursor: "pointer",
      transition: "all 0.3s ease", border: "1px solid #e5e7eb", position: "relative"
    }}>
      <button onClick={(e) => { e.stopPropagation(); onQuickView(pg); }} style={{
        position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.9)",
        border: "none", padding: "8px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", zIndex: 10
      }}><Eye size={14} /> Quick View</button>
      <button onClick={(e) => { e.stopPropagation(); onFavorite(pg.id); }} style={{
        position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.9)",
        border: "none", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", zIndex: 10
      }}><Heart size={18} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} /></button>
      <div style={{ position: "relative" }}>
        <img src={currentPhotoUrl} alt={pg.pg_name} style={{ width: "100%", height: 200, objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: 12, left: 12, background: "#3b82f6", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>
          {pg.pg_category === "to_let" ? "To-Let" : pg.pg_category === "coliving" ? "Co-Living" : "PG"}
        </div>
        {pg.distance && <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 11 }}><Navigation size={10} /> {pg.distance.toFixed(1)} km</div>}
      </div>
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{pg.pg_name}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12, color: "#6b7280", fontSize: 14 }}>
          <MapPin size={14} /> {pg.area}{pg.city ? `, ${pg.city}` : ""}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>
          ₹{formatPrice(startingPrice)} <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>onwards</span>
        </div>
        {pg.pg_category !== "to_let" && (
          <div style={{ background: "#ecfdf5", color: "#059669", padding: "6px 12px", borderRadius: 20, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            🛏️ {pg.available_rooms || 0} Beds Left
          </div>
        )}
        {pg.pg_category === "pg" && pg.food_available && (
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 12 }}>🍽️ {pg.food_type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}</div>
        )}
        {isFillingFast && (
          <div style={{ background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: 16, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            🔥 Filling Fast
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onContact(pg); }} style={{
          width: "100%", padding: "12px", background: "#3b82f6", color: "white",
          border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}><MessageCircle size={16} /> Contact Owner</button>
      </div>
    </div>
  );
};

// Hero Banner Component
const HeroBanner = () => {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
      borderRadius: 24, marginBottom: 40, overflow: "hidden",
      padding: isMobile ? "40px 20px" : "60px 40px",
    }}>
      <h1 style={{
        fontSize: isMobile ? "36px" : "52px",
        fontWeight: 800, color: "#ffffff", marginBottom: 16,
      }}>
        Find Verified PGs,<br />Coliving & Rental Homes
      </h1>
      <p style={{
        fontSize: isMobile ? "16px" : "22px",
        color: "rgba(255,255,255,0.9)", marginBottom: 32, maxWidth: "90%"
      }}>
        Book trusted stays with secure payments, verified owners and instant booking support.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <div style={{ background: "#10b981", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>✓ Verified</div>
        <div style={{ background: "#3b82f6", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>✓ Secure</div>
        <div style={{ background: "#8b5cf6", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>✓ Trusted</div>
        <div style={{ background: "#f59e0b", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>✓ Zero Brokerage</div>
      </div>
    </div>
  );
};

// Promotional Banner Slider Component
const PromoBannerSlider = ({ onBannerClick }) => {
  const promoBanners = [
    { id: 1, title: "₹200 OFF", subtitle: "On First Booking", description: "Use code FIRST200", icon: "🎉", gradient: "linear-gradient(135deg, #3b82f6, #1e40af)" },
    { id: 2, title: "Zero Brokerage", subtitle: "Direct Owner Contact", description: "Save on commission", icon: "🏠", gradient: "linear-gradient(135deg, #10b981, #047857)" },
    { id: 3, title: "Instant Booking", subtitle: "Fast Confirmation", description: "Get confirmed in minutes", icon: "⚡", gradient: "linear-gradient(135deg, #f59e0b, #b45309)" },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>🔥 Exclusive Offers</h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>Grab these limited-time deals before they're gone!</p>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
        {promoBanners.map((banner) => (
          <div key={banner.id} onClick={() => onBannerClick(banner)} style={{ flex: "1 1 280px", maxWidth: 320, background: banner.gradient, borderRadius: 24, padding: 24, color: "white", cursor: "pointer", transition: "transform 0.3s" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{banner.icon}</div>
            <h3 style={{ fontSize: 26, fontWeight: 700 }}>{banner.title}</h3>
            <p style={{ fontSize: 15, opacity: 0.9 }}>{banner.subtitle}</p>
            <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>{banner.description}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(255,255,255,0.2)", borderRadius: 30, fontSize: 13 }}>Claim Offer →</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
export default function UserPGSearch() {
  const isMobile = window.innerWidth < 768;
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [allPGs, setAllPGs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all");
  const PAGE_SIZE = 12;

  const propertyTabs = [
    { id: "all", label: "All" },
    { id: "pg", label: "PG" },
    { id: "coliving", label: "Co-Living" },
    { id: "to_let", label: "To-Let" }
  ];

  const [filters, setFilters] = useState({
    location: "", minBudget: 0, maxBudget: 50000, food: false,
    ac: false, wifi: false, parking: false, sort: "", nearMe: false
  });

  // Helper: Process PG data
  const processPGData = (data) => {
    return data.map(pg => ({
      ...pg,
      rent_amount: Number(pg.rent_amount) || 0,
      single_sharing: Number(pg.single_sharing) || 0,
      double_sharing: Number(pg.double_sharing) || 0,
      triple_sharing: Number(pg.triple_sharing) || 0,
      four_sharing: Number(pg.four_sharing) || 0,
      co_living_single_room: Number(pg.co_living_single_room) || 0,
      co_living_double_room: Number(pg.co_living_double_room) || 0,
      price_1bhk: Number(pg.price_1bhk) || 0,
      price_2bhk: Number(pg.price_2bhk) || 0,
      available_rooms: Number(pg.available_rooms) || 0,
      food_available: pg.food_available === true || pg.food_available === 1,
      ac_available: pg.ac_available === true || pg.ac_available === 1,
      wifi_available: pg.wifi_available === true || pg.wifi_available === 1,
      parking_available: pg.parking_available === true || pg.parking_available === 1,
      is_verified: pg.is_verified === true || pg.is_verified === 1,
    }));
  };

  // Load PGs with pagination
  const loadPGs = async (pageToLoad = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let url = `/pg/search/advanced?page=${pageToLoad}&limit=${PAGE_SIZE}`;
      
      let sortParam = "relevance";
      if (filters.sort === "low") sortParam = "price_low";
      else if (filters.sort === "high") sortParam = "price_high";
      else if (filters.sort === "new") sortParam = "newest";
      else if (filters.sort === "distance" && userLocation) sortParam = "nearest";
      url += `&sort_by=${sortParam}`;
      
      if (filters.location) url += `&search=${encodeURIComponent(filters.location)}`;
      if (userLocation && filters.nearMe) url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;

      console.log("Fetching:", url);
      const response = await api.get(url);
      
      if (response.data?.data) {
        let rawData = response.data.data;
        
        if (userLocation) {
          rawData = rawData.map(pg => {
            if (pg.latitude && pg.longitude) {
              const distance = getDistanceKm(userLocation.lat, userLocation.lng, pg.latitude, pg.longitude);
              return { ...pg, distance };
            }
            return pg;
          });
        }
        
        const processedData = processPGData(rawData);
        
        if (!isLoadMore || pageToLoad === 1) {
          setAllPGs(processedData);
        } else {
          setAllPGs(prev => [...prev, ...processedData]);
        }
        
        // ✅ CRITICAL: Set hasMorePages based on backend response
        setHasMorePages(response.data.hasMore === true);
        setTotalCount(response.data.total || 0);
        setCurrentPage(pageToLoad);
      }
    } catch (error) {
      console.error("Error loading PGs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset and fetch first page
  const resetAndFetch = () => {
    setCurrentPage(1);
    loadPGs(1, false);
  };

  // Load more - FIXED: Only load if hasMorePages is true
  const loadMoreProperties = () => {
    console.log("loadMoreProperties called - hasMorePages:", hasMorePages, "loadingMore:", loadingMore, "loading:", loading);
    if (!loadingMore && hasMorePages && !loading) {
      const nextPage = currentPage + 1;
      console.log("Loading next page:", nextPage);
      loadPGs(nextPage, true);
    }
  };

  // Initial load
  useEffect(() => {
    resetAndFetch();
    loadFavorites();
    // Auto ask for location
    const autoAsked = localStorage.getItem(LOCATION_AUTO_ASKED_KEY);
    if (!autoAsked && !userLocation) {
      setTimeout(() => detectLocation(), 1000);
    }
  }, []);

  // Refetch when filters change
  useEffect(() => {
    resetAndFetch();
  }, [filters.location, filters.sort, filters.nearMe, userLocation, filters.minBudget, filters.maxBudget, filters.food, filters.ac, filters.wifi, filters.parking]);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem("pg_favorites");
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (error) {}
  };

  const saveFavorites = (newFavorites) => {
    localStorage.setItem("pg_favorites", JSON.stringify([...newFavorites]));
  };

  const toggleFavorite = (pgId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(pgId)) newFavorites.delete(pgId);
    else newFavorites.add(pgId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    showNotification(newFavorites.has(pgId) ? "Added to favorites" : "Removed from favorites");
  };

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const filterByArea = (area) => {
    setFilters(prev => ({ ...prev, location: area, nearMe: false }));
    showNotification(`📍 Showing properties in ${area}`);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFilters(prev => ({ ...prev, nearMe: true, sort: "distance" }));
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        showNotification("📍 Location detected! Showing nearby properties");
        setLocationLoading(false);
        resetAndFetch();
      },
      () => {
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocationLoading(false);
      }
    );
  };

  const handleBudgetChange = (min, max) => {
    setFilters(prev => ({ ...prev, minBudget: min, maxBudget: max }));
    showNotification(`Budget set: ₹${formatPrice(min)} - ₹${formatPrice(max)}`);
    resetAndFetch();
  };

  const resetFilters = () => {
    setFilters({ location: "", minBudget: 0, maxBudget: 50000, food: false, ac: false, wifi: false, parking: false, sort: "", nearMe: false });
    setActiveQuickFilters(new Set());
    showNotification("All filters reset");
    resetAndFetch();
  };

  const handleQuickView = (pg) => setQuickViewPG(pg);
  const handleBookNow = (pg) => setBookingPG(pg);

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (!user) {
        showNotification("Please login to contact owner");
        navigate("/login");
        return;
      }
      const token = await user.getIdToken(true);
      const res = await api.post(`/bookings/${bookingPG.id}`, { room_type: bookingData.roomType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(res.data.message || "✅ Owner will contact you shortly");
      if (bookingPG.contact_phone) setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 500);
      setBookingPG(null);
    } catch (error) {
      if (error.response?.data?.message?.includes("already")) {
        showNotification("📞 Connecting you directly to owner...");
        if (bookingPG.contact_phone) setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 500);
        setBookingPG(null);
      } else {
        showNotification(error.response?.data?.message || "❌ Something went wrong", true);
      }
    }
  };

  const handleSaveFavorite = (pgId, isFavorite) => {
    const newFavorites = new Set(favorites);
    if (isFavorite) newFavorites.add(pgId);
    else newFavorites.delete(pgId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const handleCardClick = (pg) => navigate(`/pg/${pg.id}`);

  const applyQuickFilter = (filter) => {
    const newActiveFilters = new Set(activeQuickFilters);
    if (newActiveFilters.has(filter.id)) {
      newActiveFilters.delete(filter.id);
      if (filter.type === "location") setFilters(prev => ({ ...prev, nearMe: false }));
      else if (filter.type === "amenity") setFilters(prev => ({ ...prev, [filter.field]: false }));
    } else {
      newActiveFilters.add(filter.id);
      if (filter.type === "location") {
        setFilters(prev => ({ ...prev, nearMe: true, sort: "distance" }));
        detectLocation();
      } else if (filter.type === "amenity") {
        setFilters(prev => ({ ...prev, [filter.field]: true }));
      }
    }
    setActiveQuickFilters(newActiveFilters);
    showNotification(`${newActiveFilters.has(filter.id) ? "Applied" : "Removed"} ${filter.name}`);
    resetAndFetch();
  };

  const handlePromoBannerClick = (banner) => {
    showNotification(`🎉 ${banner.title} - ${banner.description}`);
  };

  // Apply all filters
  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];
    if (filters.location) {
      filtered = filtered.filter(pg =>
        `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    filtered = filtered.filter(pg => {
      const rent = getEffectiveRent(pg);
      return rent >= filters.minBudget && rent <= filters.maxBudget;
    });
    if (filters.food) filtered = filtered.filter(pg => pg.food_available === true);
    if (filters.ac) filtered = filtered.filter(pg => pg.ac_available === true);
    if (filters.wifi) filtered = filtered.filter(pg => pg.wifi_available === true);
    if (filters.parking) filtered = filtered.filter(pg => pg.parking_available === true);
    if (filters.sort === "low") filtered.sort((a, b) => getEffectiveRent(a) - getEffectiveRent(b));
    else if (filters.sort === "high") filtered.sort((a, b) => getEffectiveRent(b) - getEffectiveRent(a));
    else if (filters.sort === "new") filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (filters.sort === "distance" && userLocation) filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    return filtered;
  }, [allPGs, filters, userLocation]);

  const getFilteredByTab = useCallback(() => {
    const allFiltered = applyFilters();
    if (activeTab === "all") return allFiltered;
    return allFiltered.filter(item => item.pg_category === activeTab);
  }, [applyFilters, activeTab]);

  const filteredPGs = getFilteredByTab();
  const resultCount = filteredPGs.length;
  const hasActiveFilters = filters.location || filters.minBudget > 0 || filters.maxBudget < 50000 || filters.food || filters.ac || filters.wifi || filters.parking || activeQuickFilters.size > 0;

  // ✅ Calculate if we should show load more button
  const showLoadMore = hasMorePages && filteredPGs.length > 0 && filteredPGs.length < totalCount;

  return (
    <div style={{ maxWidth: 1400, margin: "auto", minHeight: "100vh", padding: "0 16px" }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, background: notification.isError ? "#ef4444" : "#10b981",
          color: "white", padding: "12px 24px", borderRadius: 10, zIndex: 4000, animation: "slideIn 0.3s ease"
        }}>{notification.message}</div>
      )}

      {/* Hero Banner */}
      <HeroBanner />

      {/* Promotional Banners */}
      <PromoBannerSlider onBannerClick={handlePromoBannerClick} />

      {/* Location Info Bar */}
      {userLocation && (
        <div style={{
          background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)", borderRadius: 16,
          padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Navigation size={20} color="#0284c7" />
            <div>
              <span style={{ fontWeight: 600, color: "#0369a1" }}>📍 Your Location</span>
              <span style={{ fontSize: 12, color: "#0284c7", marginLeft: 8 }}>Properties within 5km</span>
            </div>
          </div>
          <button onClick={detectLocation} disabled={locationLoading} style={{
            padding: "8px 16px", background: "#0284c7", color: "white", border: "none",
            borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer"
          }}><Navigation size={14} /> Refresh</button>
        </div>
      )}

      {/* Quick Filters */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Quick Filters</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {quickFilters.map((filter) => (
            <button key={filter.id} onClick={() => applyQuickFilter(filter)} style={{
              padding: "10px 18px", borderRadius: 40,
              background: activeQuickFilters.has(filter.id) ? (filter.id === "near_me" ? "#f97316" : "#3b82f6") : "#f3f4f6",
              color: activeQuickFilters.has(filter.id) ? "white" : "#374151", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8
            }}>{filter.icon} {filter.name}</button>
          ))}
        </div>
      </div>

      {/* Popular Areas */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>📍 Popular Areas in Bangalore</h3>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10 }}>
          {popularAreas.map((area) => (
            <button key={area.name} onClick={() => filterByArea(area.name)} style={{
              padding: "10px 20px", borderRadius: 40, whiteSpace: "nowrap",
              border: filters.location === area.name ? `2px solid ${area.color}` : "1px solid #e5e7eb",
              background: filters.location === area.name ? `${area.color}10` : "#fff",
              color: filters.location === area.name ? area.color : "#374151", cursor: "pointer", fontWeight: 500
            }}>{area.name}</button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: "20px 24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 32,
        position: "sticky", top: 20, zIndex: 100, border: "1px solid #eef2ff"
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input placeholder="Search by area, city or property name..." value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              style={{ width: "100%", padding: "12px 14px 12px 42px", border: "1px solid #e5e7eb", borderRadius: 40, fontSize: 14, background: "#fafafa" }} />
          </div>
          <button onClick={() => setShowBudgetFilter(true)} style={{ padding: "12px 20px", background: "#f3f4f6", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Coins size={16} /> Budget
          </button>
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "12px 20px", background: showFilters ? "#3b82f6" : "#f3f4f6", color: showFilters ? "white" : "#374151", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Filter size={16} /> Filters
          </button>
          <button onClick={detectLocation} style={{ padding: "12px 20px", background: filters.nearMe ? "#f97316" : "#f3f4f6", color: filters.nearMe ? "white" : "#374151", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Navigation size={16} /> Near Me
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{ padding: "12px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <X size={16} /> Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ paddingTop: 20, marginTop: 20, borderTop: "1px solid #eef2ff" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 30, background: "#fafafa" }}>
                <option value="">Sort by: Relevance</option>
                <option value="low">Rent: Low to High</option>
                <option value="high">Rent: High to Low</option>
                <option value="new">Newest First</option>
                {userLocation && <option value="distance">Distance (Nearest First)</option>}
              </select>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.food ? "#10b981" : "#f3f4f6", borderRadius: 30, cursor: "pointer" }}>
                  <input type="checkbox" checked={filters.food} onChange={(e) => setFilters({ ...filters, food: e.target.checked })} style={{ display: "none" }} />
                  <Utensils size={14} /> Food
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.ac ? "#3b82f6" : "#f3f4f6", borderRadius: 30, cursor: "pointer" }}>
                  <input type="checkbox" checked={filters.ac} onChange={(e) => setFilters({ ...filters, ac: e.target.checked })} style={{ display: "none" }} />
                  <Snowflake size={14} /> AC
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.wifi ? "#8b5cf6" : "#f3f4f6", borderRadius: 30, cursor: "pointer" }}>
                  <input type="checkbox" checked={filters.wifi} onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })} style={{ display: "none" }} />
                  <Wifi size={14} /> WiFi
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.parking ? "#f59e0b" : "#f3f4f6", borderRadius: 30, cursor: "pointer" }}>
                  <input type="checkbox" checked={filters.parking} onChange={(e) => setFilters({ ...filters, parking: e.target.checked })} style={{ display: "none" }} />
                  <Car size={14} /> Parking
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, borderBottom: "1px solid #e5e7eb", paddingBottom: 12, overflowX: "auto" }}>
        {propertyTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "12px 24px", borderRadius: 40, whiteSpace: "nowrap",
            background: activeTab === tab.id ? "#1e3a5f" : "transparent",
            color: activeTab === tab.id ? "white" : "#4b5563",
            border: activeTab === tab.id ? "none" : "1px solid #e5e7eb",
            cursor: "pointer", fontSize: 15, fontWeight: activeTab === tab.id ? 600 : 500
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Results Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            {activeTab === "pg" ? "PG Accommodations" : activeTab === "coliving" ? "Co-Living Spaces" : activeTab === "to_let" ? "To-Let Homes" : "All Properties"}
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>{resultCount} {resultCount === 1 ? "property" : "properties"} found</p>
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: 50, height: 50, border: "4px solid #e5e7eb", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
          <p style={{ color: "#6b7280" }}>Loading properties...</p>
        </div>
      ) : filteredPGs.length > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 28 }}>
            {filteredPGs.map((pg) => (
              <PGPropertyCard
                key={pg.id} pg={pg} onQuickView={handleQuickView}
                onFavorite={toggleFavorite} onContact={handleBookNow}
                onCardClick={handleCardClick} isFavorite={favorites.has(pg.id)}
              />
            ))}
          </div>

          {/* ✅ FIXED: Load More Button - Shows correctly when there are more properties */}
          {showLoadMore && (
            <div style={{ textAlign: "center", marginTop: 40, marginBottom: 60 }}>
              <button
                onClick={loadMoreProperties}
                disabled={loadingMore}
                style={{
                  padding: "14px 32px", background: "#2563eb", color: "white",
                  border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.7 : 1, transition: "all 0.3s ease",
                  display: "inline-flex", alignItems: "center", gap: 8
                }}
              >
                {loadingMore ? (
                  <>
                    <div style={{ width: 18, height: 18, border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Loading...
                  </>
                ) : (
                  `Load More Properties (${filteredPGs.length}/${totalCount})`
                )}
              </button>
            </div>
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div style={{ textAlign: "center", marginTop: 20, marginBottom: 40 }}>
              <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              <p style={{ marginTop: 12, color: "#6b7280", fontSize: 14 }}>Loading more properties...</p>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "#f9fafb", borderRadius: 24, marginBottom: 40 }}>
          <Search size={56} style={{ margin: "0 auto 20px", color: "#9ca3af" }} />
          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#374151", marginBottom: 8 }}>No properties found</h3>
          <p style={{ color: "#6b7280", marginBottom: 28 }}>Try adjusting your filters or search for a different location</p>
          <button onClick={resetFilters} style={{ padding: "12px 28px", background: "#3b82f6", color: "white", border: "none", borderRadius: 40, cursor: "pointer", fontWeight: 600 }}>Reset All Filters</button>
        </div>
      )}

      {/* Modals */}
      {showBudgetFilter && <BudgetFilter minBudget={filters.minBudget} maxBudget={filters.maxBudget} onBudgetChange={handleBudgetChange} onClose={() => setShowBudgetFilter(false)} />}
      {quickViewPG && <QuickViewModal pg={quickViewPG} onClose={() => setQuickViewPG(null)} onBook={handleBookNow} onSaveFavorite={handleSaveFavorite} isFavorite={favorites.has(quickViewPG.id)} />}
      {bookingPG && <BookingModal pg={bookingPG} onClose={() => setBookingPG(null)} onBook={handleBookingSubmit} />}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}