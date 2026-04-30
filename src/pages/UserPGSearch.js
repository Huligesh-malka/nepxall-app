import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Home, 
  Utensils, 
  Snowflake,
  Navigation,
  X,
  Phone,
  MessageCircle,
  Map,
  Star,
  Wifi,
  Car,
  Shield,
  Users,
  Calendar,
  Bed,
  Bath,
  Check,
  Heart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Briefcase,
  GraduationCap,
  Coffee,
  Bookmark,
  Share2,
  Download,
  Printer,
  BookOpen,
  CreditCard,
  UserCheck,
  Award,
  Zap,
  Battery,
  Volume2,
  Bell,
  ThumbsUp,
  BookmarkPlus,
  Copy,
  Info,
  Leaf,
  Flame,
  BatteryCharging,
  Droplets,
  Sun,
  Moon,
  Tv,
  Wind,
  Sparkles,
  Pill,
  Dumbbell,
  Building,
  DoorOpen,
  Key,
  Sofa,
  Hash,
  Sliders,
  TrendingUp,
  Target,
  Plus,
  Minus,
  BarChart,
  Zap as ZapIcon,
  BadgePercent,
  Coins,
  Rocket,
  Users as UsersIcon,
  Megaphone,
  Instagram,
  Sparkles as SparklesIcon,
  Crown,
  Gem,
  FileText,
  Clock as ClockIcon,
  Headphones,
  Crosshair,
  Gps,
  Compass,
  LocateFixed,
  MapPinned,
  Navigation2,
  Route
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

/* ================= HELPER: DISTANCE CALCULATION ================= */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ================= HELPER: FORMAT PRICE ================= */
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

/* ================= HELPER: GET CORRECT IMAGE URL ================= */
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
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) return `${BACKEND_URL}${uploadsMatch[0]}`;
  }
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

/* ================= HELPER: GET EFFECTIVE RENT ================= */
const getEffectiveRent = (pg) => {
  return (
    pg.rent_amount ||
    pg.single_sharing ||
    pg.double_sharing ||
    pg.triple_sharing ||
    pg.four_sharing ||
    pg.single_room ||
    pg.double_room ||
    pg.co_living_single_room ||
    pg.co_living_double_room ||
    pg.coliving_three_sharing ||
    pg.coliving_four_sharing ||
    pg.price_1bhk ||
    pg.price_2bhk ||
    pg.price_3bhk ||
    pg.price_4bhk ||
    0
  );
};

/* ================= HELPER: GET PRICE RANGE ================= */
const getPriceRangeByType = (pg) => {
  const prices = [];
  if (pg.pg_category === "pg") {
    if (pg.single_sharing > 0) prices.push(pg.single_sharing);
    if (pg.double_sharing > 0) prices.push(pg.double_sharing);
    if (pg.triple_sharing > 0) prices.push(pg.triple_sharing);
    if (pg.four_sharing > 0) prices.push(pg.four_sharing);
    if (pg.single_room > 0) prices.push(pg.single_room);
    if (pg.double_room > 0) prices.push(pg.double_room);
  } else if (pg.pg_category === "coliving") {
    if (pg.co_living_single_room > 0) prices.push(pg.co_living_single_room);
    if (pg.co_living_double_room > 0) prices.push(pg.co_living_double_room);
    if (pg.coliving_three_sharing > 0) prices.push(pg.coliving_three_sharing);
    if (pg.coliving_four_sharing > 0) prices.push(pg.coliving_four_sharing);
  } else if (pg.pg_category === "to_let") {
    if (pg.price_1bhk > 0) prices.push(pg.price_1bhk);
    if (pg.price_2bhk > 0) prices.push(pg.price_2bhk);
    if (pg.price_3bhk > 0) prices.push(pg.price_3bhk);
    if (pg.price_4bhk > 0) prices.push(pg.price_4bhk);
  }
  if (prices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

/* ================= LOCATION PERMISSION MODAL ================= */
const LocationPermissionModal = ({ onAllow, onDeny, onSkip }) => {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5000,
      padding: 20
    }}>
      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: 28,
        width: "100%",
        maxWidth: 400,
        textAlign: "center",
        padding: 32,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          width: 80,
          height: 80,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <Crosshair size={40} color="white" />
        </div>
        
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Find PGs Near You
        </h2>
        
        <p style={{ fontSize: 15, color: "#4b5563", marginBottom: 24, lineHeight: 1.5 }}>
          Allow location access to find the best PGs, Co-living spaces, and rental homes within 5km of your current location.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={onAllow}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10
            }}
          >
            <Navigation2 size={18} />
            Allow Location Access
          </button>
          
          <button
            onClick={onSkip}
            style={{
              width: "100%",
              padding: "14px",
              background: "transparent",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= LOCATION BANNER COMPONENT ================= */
const LocationBanner = ({ userLocation, nearestPGsCount, onRefresh, isLocating }) => {
  const [showFullInfo, setShowFullInfo] = useState(false);
  
  if (!userLocation) return null;
  
  const getLocationName = () => {
    if (userLocation.address) return userLocation.address;
    if (userLocation.lat && userLocation.lng) {
      return `${userLocation.lat.toFixed(2)}°N, ${userLocation.lng.toFixed(2)}°E`;
    }
    return "Your Location";
  };
  
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
      borderRadius: 20,
      padding: "16px 24px",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 16
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
        <div style={{
          width: 48,
          height: 48,
          background: "rgba(255,255,255,0.15)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <LocateFixed size={24} color="white" />
        </div>
        
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
              📍 YOUR LOCATION
            </span>
            <button
              onClick={() => setShowFullInfo(!showFullInfo)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 11,
                color: "white",
                cursor: "pointer"
              }}
            >
              {showFullInfo ? "Hide" : "Details"}
            </button>
          </div>
          
          <div style={{ fontSize: 18, fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <MapPinned size={16} color="#60a5fa" />
            {getLocationName()}
          </div>
          
          {showFullInfo && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#bfdbfe" }}>
              <div>Lat: {userLocation.lat?.toFixed(6)}</div>
              <div>Lng: {userLocation.lng?.toFixed(6)}</div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{nearestPGsCount}</div>
          <div style={{ fontSize: 12, color: "#bfdbfe" }}>Nearby PGs</div>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isLocating}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: 40,
            padding: "10px 20px",
            color: "white",
            fontSize: 14,
            fontWeight: 500,
            cursor: isLocating ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          {isLocating ? "Updating..." : "Refresh"}
        </button>
      </div>
    </div>
  );
};

/* ================= DISTANCE INDICATOR COMPONENT ================= */
const DistanceIndicator = ({ distance, showDetails = false }) => {
  if (!distance && distance !== 0) return null;
  
  const getDistanceColor = () => {
    if (distance < 1) return "#10b981";
    if (distance < 2) return "#3b82f6";
    if (distance < 3) return "#8b5cf6";
    if (distance < 4) return "#f59e0b";
    return "#ef4444";
  };
  
  const getDistanceLabel = () => {
    if (distance < 1) return "Very Close";
    if (distance < 2) return "Nearby";
    if (distance < 3) return "Short Drive";
    if (distance < 4) return "Moderate";
    return "Far";
  };
  
  const color = getDistanceColor();
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: `${color}15`,
        padding: "4px 12px",
        borderRadius: 20,
        border: `1px solid ${color}30`
      }}>
        <Navigation size={12} color={color} />
        <span style={{ fontSize: 13, fontWeight: 600, color: color }}>
          {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
        </span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>• {getDistanceLabel()}</span>
      </div>
    </div>
  );
};

/* ================= HERO BANNER ================= */
const HeroBanner = ({ onEnableLocation, isLocating }) => {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
      borderRadius: 24,
      marginBottom: 40,
      overflow: "hidden",
      padding: "48px",
      position: "relative"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 40,
        alignItems: "center"
      }}>
        <div>
          <h1 style={{
            fontSize: 42,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 16,
            lineHeight: 1.2
          }}>
            Find Verified PGs,<br />
            Coliving & Rental Homes
          </h1>
          <p style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 24,
            lineHeight: 1.5
          }}>
            Book trusted stays with secure payments, verified owners and instant booking support.
          </p>
          
          <button
            onClick={onEnableLocation}
            disabled={isLocating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 28px",
              background: "white",
              border: "none",
              borderRadius: 50,
              fontSize: 16,
              fontWeight: 700,
              color: "#1e3a5f",
              cursor: isLocating ? "not-allowed" : "pointer",
              marginBottom: 32
            }}
          >
            {isLocating ? "Detecting..." : "🔍 Find PGs Near Me"}
          </button>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#ffffff" }}>
              <Shield size={18} />
              <span>Verified Properties</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#ffffff" }}>
              <CreditCard size={18} />
              <span>Secure Booking</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 32,
            padding: 20,
            textAlign: "center"
          }}>
            <MapPinned size={120} color="rgba(255,255,255,0.9)" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= BUDGET FILTER COMPONENT ================= */
const BudgetFilter = ({ minBudget, maxBudget, onBudgetChange, onClose }) => {
  const [localMin, setLocalMin] = useState(minBudget);
  const [localMax, setLocalMax] = useState(maxBudget);

  const handleApply = () => {
    onBudgetChange(localMin, localMax);
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: 20
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 500,
        padding: 30
      }}>
        <h2>Budget Filter</h2>
        <div style={{ marginBottom: 20 }}>
          <label>Min: ₹{localMin}</label>
          <input
            type="range"
            min="0"
            max="50000"
            value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label>Max: ₹{localMax}</label>
          <input
            type="range"
            min="0"
            max="50000"
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleApply} style={{ flex: 1, padding: 12, background: "#3b82f6", color: "white", border: "none", borderRadius: 8 }}>Apply</button>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: "#f3f4f6", border: "none", borderRadius: 8 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* ================= QUICK VIEW MODAL ================= */
const QuickViewModal = ({ pg, onClose, onBook }) => {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: 20
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 800,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 30
      }}>
        <h2>{pg.pg_name}</h2>
        <p>{pg.address}</p>
        <button onClick={() => onBook(pg)} style={{ padding: "10px 20px", background: "#10b981", color: "white", border: "none", borderRadius: 8, marginRight: 10 }}>Book Now</button>
        <button onClick={onClose} style={{ padding: "10px 20px", background: "#f3f4f6", border: "none", borderRadius: 8 }}>Close</button>
      </div>
    </div>
  );
};

/* ================= BOOKING MODAL ================= */
const BookingModal = ({ pg, onClose, onBook }) => {
  const [checkInDate, setCheckInDate] = useState("");
  const [roomType, setRoomType] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onBook({ checkInDate, roomType });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: 20
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 500,
        padding: 30
      }}>
        <h2>Book {pg.pg_name}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label>Check-in Date</label>
            <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} required style={{ width: "100%", padding: 10, marginTop: 5 }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Room Type</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} required style={{ width: "100%", padding: 10, marginTop: 5 }}>
              <option value="">Select</option>
              <option value="Single Sharing">Single Sharing</option>
              <option value="Double Sharing">Double Sharing</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" style={{ flex: 1, padding: 12, background: "#10b981", color: "white", border: "none", borderRadius: 8 }}>Confirm</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, background: "#f3f4f6", border: "none", borderRadius: 8 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= COMPARE MODAL ================= */
const CompareModal = ({ selectedPGs, allPGs, onClose }) => {
  const compareData = allPGs.filter(pg => selectedPGs.has(pg.id));

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: 20
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 1000,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 30
      }}>
        <h2>Compare Properties ({compareData.length})</h2>
        <button onClick={onClose} style={{ marginTop: 20, padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: 8 }}>Close</button>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
function UserPGSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allPGs, setAllPGs] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);

  const [propertyType, setPropertyType] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);

  const [filters, setFilters] = useState({
    location: "",
    minBudget: 0,
    maxBudget: 50000,
    food: false,
    ac: false,
    wifi: false,
    parking: false,
    sort: "",
    nearMe: false,
    foodType: "",
    radius: 5
  });

  const limit = 10;

  useEffect(() => {
    const hasAskedPermission = localStorage.getItem("location_permission_asked");
    if (!hasAskedPermission) {
      setShowLocationModal(true);
    } else {
      const permissionStatus = localStorage.getItem("location_permission_status");
      if (permissionStatus === "allowed") {
        detectLocation(true);
      } else {
        loadPGs(false);
      }
    }
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allPGs, filters, userLocation, propertyType]);

  const processPGData = (data) => {
    return data.map(pg => ({
      ...pg,
      deposit_amount: Number(pg.deposit_amount) || 0,
      rent_amount: Number(pg.rent_amount) || 0,
      single_sharing: Number(pg.single_sharing) || 0,
      double_sharing: Number(pg.double_sharing) || 0,
      triple_sharing: Number(pg.triple_sharing) || 0,
      four_sharing: Number(pg.four_sharing) || 0,
      food_available: pg.food_available === true || pg.food_available === 1,
      ac_available: pg.ac_available === true || pg.ac_available === 1,
      wifi_available: pg.wifi_available === true || pg.wifi_available === 1,
      parking_available: pg.parking_available === true || pg.parking_available === 1,
    }));
  };

  const loadPGs = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const res = await api.get(`/pg/search/advanced?page=${page}&limit=${limit}`);
      
      if (res.data?.success || res.data?.data) {
        const rawData = res.data?.data || [];
        const processedData = processPGData(rawData);
        
        if (!isLoadMore || page === 1) {
          setAllPGs(processedData);
          setPgs(processedData);
        } else {
          setAllPGs(prev => [...prev, ...processedData]);
          setPgs(prev => [...prev, ...processedData]);
        }
        
        setHasMore(processedData.length === limit);
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error("Error loading PGs:", error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      loadPGs(true);
    }
  }, [page]);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem("pg_favorites");
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const saveFavorites = (newFavorites) => {
    try {
      localStorage.setItem("pg_favorites", JSON.stringify([...newFavorites]));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const toggleFavorite = (pgId, e) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(pgId)) {
      newFavorites.delete(pgId);
      showNotification("Removed from favorites");
    } else {
      newFavorites.add(pgId);
      showNotification("Added to favorites");
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const detectLocation = (silent = false) => {
    setIsLocating(true);
    
    if (!silent) {
      showNotification("📍 Detecting your location...");
    }
    
    if (!navigator.geolocation) {
      showNotification("❌ Geolocation is not supported", true);
      setIsLocating(false);
      if (!silent) {
        setShowLocationModal(false);
        loadPGs(false);
      }
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setUserLocation(locationData);
        localStorage.setItem("location_permission_asked", "true");
        localStorage.setItem("location_permission_status", "allowed");
        
        showNotification(`📍 Location detected! Finding PGs within ${filters.radius}km`);
        
        setFilters(prev => ({ 
          ...prev, 
          nearMe: true,
          sort: "distance"
        }));
        
        if (!silent) {
          setShowLocationModal(false);
        }
        
        setIsLocating(false);
        loadPGs(false);
      },
      (error) => {
        console.error("Location error:", error);
        
        let errorMessage = "Unable to get your location. ";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access.";
            localStorage.setItem("location_permission_status", "denied");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location unavailable.";
            break;
          default:
            errorMessage += "Please check your settings.";
        }
        
        showNotification(errorMessage, true);
        setIsLocating(false);
        
        if (!silent) {
          setShowLocationModal(false);
        }
        
        localStorage.setItem("location_permission_asked", "true");
        loadPGs(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  
  const getNearbyCount = useCallback(() => {
    if (!userLocation) return 0;
    
    return allPGs.filter(pg => {
      if (!pg.latitude || !pg.longitude) return false;
      const distance = getDistanceKm(
        userLocation.lat,
        userLocation.lng,
        pg.latitude,
        pg.longitude
      );
      return distance !== null && distance <= filters.radius;
    }).length;
  }, [allPGs, userLocation, filters.radius]);
  
  useEffect(() => {
    setNearbyCount(getNearbyCount());
  }, [getNearbyCount]);
  
  const refreshLocation = () => {
    detectLocation(false);
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];

    if (propertyType !== "all") {
      filtered = filtered.filter((pg) => pg.pg_category === propertyType);
    }

    if (filters.location) {
      filtered = filtered.filter((pg) =>
        `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    filtered = filtered.filter((pg) => {
      const rent = getEffectiveRent(pg);
      return rent >= filters.minBudget && rent <= filters.maxBudget;
    });

    if (filters.food) filtered = filtered.filter((pg) => pg.food_available === true);
    if (filters.ac) filtered = filtered.filter((pg) => pg.ac_available === true);
    if (filters.wifi) filtered = filtered.filter((pg) => pg.wifi_available === true);
    if (filters.parking) filtered = filtered.filter((pg) => pg.parking_available === true);
    
    if (filters.foodType) {
      filtered = filtered.filter((pg) => pg.food_type === filters.foodType);
    }

    if (filters.nearMe && userLocation) {
      filtered = filtered
        .map((pg) => {
          if (!pg.latitude || !pg.longitude) return null;
          const distance = getDistanceKm(
            userLocation.lat,
            userLocation.lng,
            pg.latitude,
            pg.longitude
          );
          if (distance === null) return null;
          return { ...pg, distance: distance };
        })
        .filter(Boolean)
        .filter((pg) => pg.distance <= filters.radius);
    }

    if (filters.sort === "low") {
      filtered.sort((a, b) => getEffectiveRent(a) - getEffectiveRent(b));
    } else if (filters.sort === "high") {
      filtered.sort((a, b) => getEffectiveRent(b) - getEffectiveRent(a));
    } else if (filters.sort === "new") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sort === "distance" && userLocation && filters.nearMe) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    setPgs(filtered);
  }, [allPGs, filters, userLocation, propertyType]);

  const handleBudgetChange = (min, max) => {
    setFilters(prev => ({ ...prev, minBudget: min, maxBudget: max }));
    showNotification(`Budget set: ₹${formatPrice(min)} - ₹${formatPrice(max)}`);
  };

  const resetFilters = () => {
    setFilters({
      location: "",
      minBudget: 0,
      maxBudget: 50000,
      food: false,
      ac: false,
      wifi: false,
      parking: false,
      sort: userLocation ? "distance" : "",
      nearMe: userLocation ? true : false,
      foodType: "",
      radius: 5
    });
    setPropertyType("all");
    setPgs(allPGs);
    showNotification("All filters reset");
  };

  const getImageUrl = (pg) => {
    if (Array.isArray(pg.photos) && pg.photos.length) {
      return getCorrectImageUrl(pg.photos[0]);
    }
    return "/no-image.png";
  };

  const handleQuickView = (pg, e) => {
    e.stopPropagation();
    setQuickViewPG(pg);
  };

  const handleBookNow = (pg) => {
    if (!user) {
      showNotification("Please login to book this property");
      navigate("/login");
      return;
    }
    setBookingPG(pg);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (!user) {
        showNotification("Please login to continue");
        navigate("/register");
        return;
      }

      const token = await user.getIdToken(true);

      const payload = {
        check_in_date: bookingData.checkInDate,
        room_type: bookingData.roomType
      };

      const res = await api.post(`/bookings/${bookingPG.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.alreadyBooked) {
        showNotification(res.data.message);
        setBookingPG(null);
        return;
      }

      showNotification(res.data.message || "✅ Booking request sent");
      setBookingPG(null);

    } catch (error) {
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, true);
      } else {
        showNotification("❌ Something went wrong", true);
      }
    }
  };
  
  const handleSaveFavorite = (pgId, isFavorite) => {
    const newFavorites = new Set(favorites);
    if (isFavorite) {
      newFavorites.add(pgId);
      showNotification("Added to favorites");
    } else {
      newFavorites.delete(pgId);
      showNotification("Removed from favorites");
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const handleCardClick = (pg) => {
    navigate(`/pg/${pg.id}`);
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) {
      setSelectedForCompare(new Set());
    }
  };

  const toggleSelectForCompare = (pgId, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedForCompare);
    
    if (newSelected.has(pgId)) {
      newSelected.delete(pgId);
    } else {
      if (newSelected.size < 3) {
        newSelected.add(pgId);
      } else {
        showNotification("You can compare up to 3 properties");
        return;
      }
    }
    
    setSelectedForCompare(newSelected);
  };

  const handleCompare = () => {
    if (selectedForCompare.size < 2) {
      showNotification("Select at least 2 properties to compare");
      return;
    }
    setShowCompareModal(true);
  };

  const clearCompareSelections = () => {
    setSelectedForCompare(new Set());
  };

  const formatCardPrice = (value) => {
    if (value === null || value === undefined || value === 0) return "0";
    return formatPrice(value);
  };

  const getPriceRangeDisplay = (pg) => {
    const range = getPriceRangeByType(pg);
    if (range.min === 0 && range.max === 0) return "Price on request";
    if (range.min === range.max) return `₹${formatCardPrice(range.min)}`;
    return `₹${formatCardPrice(range.min)} – ₹${formatCardPrice(range.max)}`;
  };

  const getCardQuickInfo = (pg) => {
    const info = [];
    
    if (pg.pg_category === "pg") {
      if (pg.single_sharing > 0) info.push({ icon: <UserCheck size={12} />, label: "Single", value: `₹${formatCardPrice(pg.single_sharing)}`, color: "#10b981" });
      if (pg.double_sharing > 0) info.push({ icon: <Users size={12} />, label: "Double", value: `₹${formatCardPrice(pg.double_sharing)}`, color: "#3b82f6" });
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room > 0) info.push({ icon: <UserCheck size={12} />, label: "Single", value: `₹${formatCardPrice(pg.co_living_single_room)}`, color: "#8b5cf6" });
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk > 0) info.push({ icon: <Building size={12} />, label: "1BHK", value: `₹${formatCardPrice(pg.price_1bhk)}`, color: "#f97316" });
    }
    
    return info.slice(0, 2);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "auto", minHeight: "100vh" }}>
      {notification && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: notification.isError ? "#ef4444" : "#10b981",
          color: "white",
          padding: "12px 24px",
          borderRadius: 10,
          zIndex: 4000,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          {notification.isError ? <X size={18} /> : <Check size={18} />}
          {notification.message}
        </div>
      )}

      {showLocationModal && (
        <LocationPermissionModal
          onAllow={() => detectLocation(false)}
          onDeny={() => {
            localStorage.setItem("location_permission_asked", "true");
            localStorage.setItem("location_permission_status", "denied");
            setShowLocationModal(false);
            loadPGs(false);
          }}
          onSkip={() => {
            localStorage.setItem("location_permission_asked", "true");
            localStorage.setItem("location_permission_status", "skipped");
            setShowLocationModal(false);
            loadPGs(false);
          }}
        />
      )}

      <HeroBanner onEnableLocation={() => detectLocation(false)} isLocating={isLocating} />

      {userLocation && filters.nearMe && (
        <LocationBanner
          userLocation={userLocation}
          nearestPGsCount={nearbyCount}
          onRefresh={refreshLocation}
          isLocating={isLocating}
        />
      )}

      {/* Property Type Filter */}
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setPropertyType("all")} style={{ padding: "10px 20px", background: propertyType === "all" ? "#3b82f6" : "#f3f4f6", color: propertyType === "all" ? "white" : "#374151", border: "none", borderRadius: 30, cursor: "pointer" }}>All</button>
          <button onClick={() => setPropertyType("pg")} style={{ padding: "10px 20px", background: propertyType === "pg" ? "#3b82f6" : "#f3f4f6", color: propertyType === "pg" ? "white" : "#374151", border: "none", borderRadius: 30, cursor: "pointer" }}>PG</button>
          <button onClick={() => setPropertyType("coliving")} style={{ padding: "10px 20px", background: propertyType === "coliving" ? "#3b82f6" : "#f3f4f6", color: propertyType === "coliving" ? "white" : "#374151", border: "none", borderRadius: 30, cursor: "pointer" }}>Co-Living</button>
          <button onClick={() => setPropertyType("to_let")} style={{ padding: "10px 20px", background: propertyType === "to_let" ? "#3b82f6" : "#f3f4f6", color: propertyType === "to_let" ? "white" : "#374151", border: "none", borderRadius: 30, cursor: "pointer" }}>To-Let</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: "1px solid #e5e7eb",
        position: "sticky",
        top: 20,
        zIndex: 100
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
            <Search size={20} style={{ position: "absolute", left: 14, top: 12, color: "#9ca3af" }} />
            <input
              placeholder="Search by area, city or property name..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              style={{ width: "100%", padding: "12px 12px 12px 44px", border: "1px solid #e5e7eb", borderRadius: 12 }}
            />
          </div>

          <button onClick={() => setShowBudgetFilter(true)} style={{ padding: "12px 20px", background: "#f3f4f6", border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Sliders size={18} /> Budget
          </button>

          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "12px 20px", background: showFilters ? "#3b82f6" : "#f3f4f6", color: showFilters ? "white" : "#374151", border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={18} /> Filters
          </button>

          {!userLocation && (
            <button onClick={() => detectLocation(false)} disabled={isLocating} style={{ padding: "12px 20px", background: "#f97316", color: "white", border: "none", borderRadius: 12, cursor: isLocating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {isLocating ? "..." : <><Crosshair size={18} /> Use My Location</>}
            </button>
          )}

          {userLocation && (
            <button onClick={() => {
              setFilters(prev => ({ ...prev, nearMe: !prev.nearMe, sort: !prev.nearMe ? "distance" : "" }));
              if (filters.nearMe) {
                setUserLocation(null);
                showNotification("Location filter disabled");
              } else {
                showNotification("Showing nearby properties");
              }
            }} style={{ padding: "12px 20px", background: filters.nearMe ? "#10b981" : "#f3f4f6", color: filters.nearMe ? "white" : "#374151", border: "none", borderRadius: 12, cursor: "pointer" }}>
              <Gps size={18} /> {filters.nearMe ? "Near Me ON" : "Near Me OFF"}
            </button>
          )}

          <button onClick={toggleCompareMode} style={{ padding: "12px 20px", background: compareMode ? "#8b5cf6" : "#f3f4f6", color: compareMode ? "white" : "#374151", border: "none", borderRadius: 12, cursor: "pointer" }}>
            <BarChart size={18} /> Compare
          </button>
        </div>

        {showFilters && (
          <div style={{ paddingTop: 20, marginTop: 16, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              <div style={{ minWidth: 200 }}>
                <label>Food Type</label>
                <select value={filters.foodType} onChange={(e) => setFilters({ ...filters, foodType: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 5 }}>
                  <option value="">Any</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                </select>
              </div>
              <div style={{ minWidth: 200 }}>
                <label>Sort By</label>
                <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 5 }}>
                  <option value="">Relevance</option>
                  <option value="low">Rent: Low to High</option>
                  <option value="high">Rent: High to Low</option>
                  <option value="new">Newest First</option>
                  {userLocation && <option value="distance">Nearest First</option>}
                </select>
              </div>
              <div>
                <label>Amenities</label>
                <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5 }}><input type="checkbox" checked={filters.food} onChange={(e) => setFilters({ ...filters, food: e.target.checked })} /> Food</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 5 }}><input type="checkbox" checked={filters.ac} onChange={(e) => setFilters({ ...filters, ac: e.target.checked })} /> AC</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 5 }}><input type="checkbox" checked={filters.wifi} onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })} /> WiFi</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 5 }}><input type="checkbox" checked={filters.parking} onChange={(e) => setFilters({ ...filters, parking: e.target.checked })} /> Parking</label>
                </div>
              </div>
            </div>
            <button onClick={resetFilters} style={{ marginTop: 15, padding: "8px 16px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: 8, cursor: "pointer" }}>Clear All</button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2>{filters.nearMe && userLocation ? "🏠 Properties Near You" : "📋 Available Properties"}</h2>
          <span>{pgs.length} properties found</span>
        </div>
      </div>

      {/* Property Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
          {pgs.map((pg) => {
            const priceRange = getPriceRangeDisplay(pg);
            const depositAmount = pg.deposit_amount || 0;
            const distance = pg.distance;
            
            return (
              <div key={pg.id} onClick={() => handleCardClick(pg)} style={{ borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,.08)", cursor: "pointer", border: "1px solid #e5e7eb" }}>
                <div style={{ position: "relative" }}>
                  <img src={getImageUrl(pg)} alt={pg.pg_name} style={{ width: "100%", height: 200, objectFit: "cover" }} />
                  {distance && (
                    <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.75)", color: "white", padding: "6px 12px", borderRadius: 20, fontSize: 12 }}>
                      <Navigation size={12} /> {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                    </div>
                  )}
                </div>
                <div style={{ padding: 20 }}>
                  <h3>{pg.pg_name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><MapPin size={14} /> {pg.area}, {pg.city}</div>
                  {distance && userLocation && <DistanceIndicator distance={distance} />}
                  <div style={{ marginBottom: 12, padding: 12, background: "#f0f9ff", borderRadius: 10 }}>
                    <div><strong>{priceRange}</strong> / month</div>
                    <div>Deposit: ₹{formatCardPrice(depositAmount)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); handleBookNow(pg); }} style={{ flex: 2, padding: 10, background: "#10b981", color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>Book Now</button>
                    <button onClick={(e) => handleQuickView(pg, e)} style={{ flex: 1, padding: 10, background: "#3b82f6", color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>Quick View</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {!loading && pgs.length > 0 && hasMore && (
        <div style={{ textAlign: "center", marginTop: 50 }}>
          <button onClick={loadMore} disabled={loadingMore} style={{ padding: "14px 28px", background: loadingMore ? "#9ca3af" : "#dc2626", color: "white", border: "none", borderRadius: 12, cursor: loadingMore ? "not-allowed" : "pointer", fontWeight: "bold" }}>
            {loadingMore ? "Loading..." : "VIEW MORE PROPERTIES"}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && pgs.length === 0 && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Search size={48} />
          <p>No properties found</p>
          <button onClick={resetFilters} style={{ marginTop: 20, padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>Reset Filters</button>
        </div>
      )}

      {/* Modals */}
      {showBudgetFilter && <BudgetFilter minBudget={filters.minBudget} maxBudget={filters.maxBudget} onBudgetChange={handleBudgetChange} onClose={() => setShowBudgetFilter(false)} />}
      {quickViewPG && <QuickViewModal pg={quickViewPG} onClose={() => setQuickViewPG(null)} onBook={handleBookNow} />}
      {bookingPG && <BookingModal pg={bookingPG} onClose={() => setBookingPG(null)} onBook={handleBookingSubmit} />}
      {showCompareModal && <CompareModal selectedPGs={selectedForCompare} allPGs={allPGs} onClose={() => { setShowCompareModal(false); setSelectedForCompare(new Set()); setCompareMode(false); }} />}
    </div>
  );
}

export default UserPGSearch;