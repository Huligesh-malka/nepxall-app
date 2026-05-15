import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Search, 
  Filter, 
  MapPin,  
  Home, 
  Utensils, 
  Snowflake,
  Navigation,
  X,
  Phone,
  MessageCircle,
  Wifi,
  Car,
  Shield,
  Check,
  Heart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Sliders,
  BarChart,
  BadgePercent,
  Coins,
  Plus,
  Minus,
  Users,
  Crown,
  TrendingUp
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

// Key for localStorage to track if location permission was asked
const LOCATION_AUTO_ASKED_KEY = "nepxall_location_auto_asked";

// Popular Areas in Bangalore
const popularAreas = [
  { name: "Koramangala", icon: "📍", color: "#3b82f6" },
  { name: "BTM Layout", icon: "📍", color: "#10b981" },
  { name: "Jayanagar", icon: "📍", color: "#f59e0b" },
  { name: "Electronic City", icon: "💻", color: "#8b5cf6" },
  { name: "HSR Layout", icon: "📍", color: "#ec4899" },
  { name: "Whitefield", icon: "🏢", color: "#06b6d4" },
  { name: "Marathahalli", icon: "📍", color: "#ef4444" },
  { name: "Bellandur", icon: "📍", color: "#14b8a6" },
  { name: "Indiranagar", icon: "📍", color: "#f97316" },
  { name: "MG Road", icon: "🏙️", color: "#a855f7" }
];

// Simple Quick Filters
const quickFilters = [
  { id: "near_me", name: "📍 Near Me", icon: <Navigation size={16} />, type: "location" },
  { id: "ac_room", name: "❄️ AC", icon: <Snowflake size={16} />, type: "amenity", field: "ac_available" },
  { id: "wifi", name: "📶 WiFi", icon: <Wifi size={16} />, type: "amenity", field: "wifi_available" },
  { id: "parking", name: "🅿️ Parking", icon: <Car size={16} />, type: "amenity", field: "parking_available" },
  { id: "veg_food", name: "🥬 Veg Food", icon: <Utensils size={16} />, type: "food", value: "veg" },
];

// ================= HELPER: GET MOBILE STATE =================
const isMobileDevice = () => window.innerWidth < 768;

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
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

// ================= SIMPLE BOOKING MODAL =================
const BookingModal = ({ pg, onClose, onBook }) => {
  const [bookingData, setBookingData] = useState({ roomType: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pg) return;
    let defaultRoomType = "";
    if (pg.pg_category === "pg") {
      if (pg.single_sharing) defaultRoomType = "Single Sharing";
      else if (pg.double_sharing) defaultRoomType = "Double Sharing";
      else if (pg.triple_sharing) defaultRoomType = "Triple Sharing";
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room) defaultRoomType = "Single Room";
      else if (pg.co_living_double_room) defaultRoomType = "Double Room";
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk) defaultRoomType = "1BHK";
      else if (pg.price_2bhk) defaultRoomType = "2BHK";
    }
    setBookingData({ roomType: defaultRoomType || "" });
  }, [pg]);

  if (!pg) return null;

  const getRoomTypes = () => {
    const types = [];
    if (pg.pg_category === "pg") {
      if (pg.single_sharing > 0) types.push({ value: "Single Sharing", label: `Single Sharing - ₹${formatPrice(pg.single_sharing)}` });
      if (pg.double_sharing > 0) types.push({ value: "Double Sharing", label: `Double Sharing - ₹${formatPrice(pg.double_sharing)}` });
      if (pg.triple_sharing > 0) types.push({ value: "Triple Sharing", label: `Triple Sharing - ₹${formatPrice(pg.triple_sharing)}` });
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room > 0) types.push({ value: "Single Room", label: `Single Room - ₹${formatPrice(pg.co_living_single_room)}` });
      if (pg.co_living_double_room > 0) types.push({ value: "Double Room", label: `Double Room - ₹${formatPrice(pg.co_living_double_room)}` });
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk > 0) types.push({ value: "1BHK", label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` });
      if (pg.price_2bhk > 0) types.push({ value: "2BHK", label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` });
    }
    return types;
  };

  const getSelectedPrice = () => {
    if (!bookingData.roomType) return null;
    if (pg.pg_category === "pg") {
      if (bookingData.roomType === "Single Sharing") return pg.single_sharing;
      if (bookingData.roomType === "Double Sharing") return pg.double_sharing;
      if (bookingData.roomType === "Triple Sharing") return pg.triple_sharing;
    } else if (pg.pg_category === "coliving") {
      if (bookingData.roomType === "Single Room") return pg.co_living_single_room;
      if (bookingData.roomType === "Double Room") return pg.co_living_double_room;
    } else if (pg.pg_category === "to_let") {
      if (bookingData.roomType === "1BHK") return pg.price_1bhk;
      if (bookingData.roomType === "2BHK") return pg.price_2bhk;
    }
    return null;
  };

  const selectedPrice = getSelectedPrice();

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 3000,
      padding: 20, animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "#ffffff", borderRadius: 20, width: "100%",
        maxWidth: 500, maxHeight: "90vh", overflowY: "auto",
        position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.9)", border: "none",
          width: 40, height: 40, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}><X size={24} /></button>

        <div style={{ padding: 30 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>📞 Contact Owner - {pg.pg_name}</h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Your details will be shared with the property owner.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try { await onBook(bookingData); } catch (err) { console.error(err); }
            finally { setLoading(false); }
          }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                {pg.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
              </label>
              <select
                name="roomType"
                value={bookingData.roomType}
                onChange={(e) => setBookingData(prev => ({ ...prev, roomType: e.target.value }))}
                required
                style={{ width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 10 }}
              >
                <option value="">Select Type</option>
                {getRoomTypes().map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
              {selectedPrice !== null && selectedPrice > 0 && (
                <p style={{ marginTop: 8, fontWeight: 600, color: "#10b981" }}>
                  Selected: ₹{formatPrice(selectedPrice)}/month
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={onClose} disabled={loading}
                style={{ flex: 1, padding: "14px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 2, padding: "14px", background: loading ? "#9ca3af" : "#3b82f6", color: "white", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? "Processing..." : <>📞 Contact Owner</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ================= QUICK VIEW MODAL =================
const QuickViewModal = ({ pg, onClose, onBook, onSaveFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  
  const photosArray = React.useMemo(() => {
    if (pg.photos && Array.isArray(pg.photos) && pg.photos.length > 0) {
      return pg.photos.filter(photo => photo && photo.trim() !== "");
    }
    return [];
  }, [pg.photos]);
  
  const hasMultipleImages = photosArray.length > 1;
  
  useEffect(() => {
    if (hasMultipleImages) {
      const interval = setInterval(() => setCurrentImage((prev) => (prev + 1) % photosArray.length), 2500);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length]);
  
  const currentPhotoUrl = React.useMemo(() => {
    if (hasMultipleImages && photosArray[currentImage]) return getCorrectImageUrl(photosArray[currentImage]);
    if (pg.main_photo) return getCorrectImageUrl(pg.main_photo);
    if (photosArray.length > 0) return getCorrectImageUrl(photosArray[0]);
    return "/no-image.png";
  }, [hasMultipleImages, photosArray, currentImage, pg.main_photo]);
  
  const startingPrice = React.useMemo(() => {
    const range = getPriceRangeByType(pg);
    return range.min || getEffectiveRent(pg);
  }, [pg]);
  
  const toggleFavorite = () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    onSaveFavorite(pg.id, newState);
  };
  
  const handleWhatsApp = () => {
    const phone = pg.contact_phone || "";
    window.open(`https://wa.me/${phone}?text=Hi, I'm interested in ${pg.pg_name}`, '_blank');
  };
  
  const handleCall = () => {
    const phone = pg.contact_phone || "";
    window.location.href = `tel:${phone}`;
  };
  
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 2000,
      padding: 20, animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "#ffffff", borderRadius: 20, width: "100%",
        maxWidth: 500, maxHeight: "90vh", overflowY: "auto",
        position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.9)", border: "none",
          width: 40, height: 40, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 100
        }}><X size={24} /></button>
        
        <button onClick={toggleFavorite} style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(255,255,255,0.9)", border: "none",
          width: 40, height: 40, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 100
        }}><Heart size={20} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} /></button>
        
        <div style={{ position: "relative", height: 250, background: "#f3f4f6" }}>
          <img src={currentPhotoUrl} alt={pg.pg_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.onerror = null; e.target.src = "/no-image.png"; }} />
        </div>
        
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{pg.pg_name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, color: "#6b7280", fontSize: 14 }}>
            <MapPin size={14} /><span>{pg.area}{pg.city ? `, ${pg.city}` : ""}</span>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1e3a5f" }}>
              ₹{formatPrice(startingPrice)} <span style={{ fontSize: 14, fontWeight: 400 }}>onwards</span>
            </div>
          </div>
          
          <div style={{ background: "#ecfdf5", color: "#059669", padding: "8px 12px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            🛏️ {pg.available_rooms || 0} Beds Left
          </div>
          
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button onClick={handleCall} style={{ flex: 1, padding: "14px", background: "#10b981", color: "white", border: "none", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Phone size={16} /> Call</button>
            <button onClick={handleWhatsApp} style={{ flex: 1, padding: "14px", background: "#25D366", color: "white", border: "none", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><MessageCircle size={16} /> WhatsApp</button>
            <button onClick={() => { onBook(pg); onClose(); }} style={{ flex: 1, padding: "14px", background: "#3b82f6", color: "white", border: "none", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Book</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= PG PROPERTY CARD =================
const PGPropertyCard = ({ pg, onQuickView, onFavorite, onContact, onCardClick, isFavorite }) => {
  const isMobile = window.innerWidth < 768;
  const [currentImage, setCurrentImage] = useState(0);
  
  const photosArray = React.useMemo(() => {
    if (pg.photos && Array.isArray(pg.photos) && pg.photos.length > 0) {
      return pg.photos.filter(photo => photo && photo.trim() !== "");
    }
    return [];
  }, [pg.photos]);
  
  const hasMultipleImages = photosArray.length > 1;
  
  useEffect(() => {
    if (hasMultipleImages) {
      const interval = setInterval(() => setCurrentImage((prev) => (prev + 1) % photosArray.length), 2500);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length]);
  
  const currentPhotoUrl = React.useMemo(() => {
    if (hasMultipleImages && photosArray[currentImage]) return getCorrectImageUrl(photosArray[currentImage]);
    if (pg.main_photo) return getCorrectImageUrl(pg.main_photo);
    if (photosArray.length > 0) return getCorrectImageUrl(photosArray[0]);
    return "/no-image.png";
  }, [hasMultipleImages, photosArray, currentImage, pg.main_photo]);
  
  const startingPrice = React.useMemo(() => {
    const range = getPriceRangeByType(pg);
    return range.min || getEffectiveRent(pg);
  }, [pg]);
  
  const foodTypeDisplay = React.useMemo(() => {
    if (!pg.food_available) return null;
    if (pg.food_type === 'veg') return "🥬 Veg";
    if (pg.food_type === 'non-veg') return "🍗 Non-Veg";
    return "🍽️ Food";
  }, [pg.food_available, pg.food_type]);
  
  return (
    <div onClick={() => onCardClick(pg)} style={{
      borderRadius: 16, overflow: "hidden", background: "#fff", cursor: "pointer",
      transition: "all 0.3s ease", border: "1px solid #e5e7eb",
      position: "relative", width: "100%", maxWidth: isMobile ? "100%" : "380px"
    }}>
      <button onClick={(e) => onQuickView(pg, e)} style={{
        position: "absolute", top: 12, right: 12,
        background: "rgba(255,255,255,0.9)", border: "none",
        padding: "6px 12px", borderRadius: 20, fontSize: 12,
        cursor: "pointer", zIndex: 10
      }}><Eye size={14} /> Quick View</button>
      
      <button onClick={(e) => onFavorite(pg.id, e)} style={{
        position: "absolute", top: 12, left: 12,
        background: "rgba(255,255,255,0.9)", border: "none",
        width: 36, height: 36, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", zIndex: 10
      }}><Heart size={18} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} /></button>
      
      <div style={{ position: "relative" }}>
        <img src={currentPhotoUrl} alt={pg.pg_name}
          style={{ width: "100%", height: isMobile ? 200 : 220, objectFit: "cover" }}
          onError={(e) => { e.target.onerror = null; e.target.src = "/no-image.png"; }} />
        
        <div style={{
          position: "absolute", bottom: 12, left: 12,
          background: pg.pg_category === "to_let" ? "#f97316" : pg.pg_category === "coliving" ? "#8b5cf6" : "#16a34a",
          color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
        }}>
          {pg.pg_category === "to_let" ? "To-Let" : pg.pg_category === "coliving" ? "Co-Living" : "PG"}
        </div>
        
        {pg.distance && (
          <div style={{
            position: "absolute", bottom: 12, right: 12,
            background: "rgba(0,0,0,0.7)", color: "white",
            padding: "4px 8px", borderRadius: 20, fontSize: 10,
            display: "flex", alignItems: "center", gap: 4
          }}><Navigation size={10} /> {pg.distance.toFixed(1)} km</div>
        )}
      </div>
      
      <div style={{ padding: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{pg.pg_name}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, color: "#6b7280", fontSize: 12 }}>
          <MapPin size={12} /><span>{pg.area || pg.city || "Location"}</span>
        </div>
        
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f" }}>
            ₹{formatPrice(startingPrice)} <span style={{ fontSize: 12, fontWeight: 400 }}>onwards</span>
          </div>
        </div>
        
        <div style={{ background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: 20, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          🛏️ {pg.available_rooms || 0} beds left
        </div>
        
        {foodTypeDisplay && (
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>{foodTypeDisplay}</div>
        )}
        
        <button onClick={(e) => { e.stopPropagation(); onContact(pg); }} style={{
          width: "100%", fontSize: 13, padding: "10px", background: "#3b82f6",
          color: "white", border: "none", borderRadius: 8, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}><MessageCircle size={14} /> Contact Owner</button>
      </div>
    </div>
  );
};

// ================= HERO BANNER =================
const HeroBanner = () => {
  const isMobile = isMobileDevice();
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
      borderRadius: 20, marginBottom: 24, padding: isMobile ? "30px 20px" : "40px 30px"
    }}>
      <h1 style={{ fontSize: isMobile ? "28px" : "40px", fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>
        Find Your Perfect Stay
      </h1>
      <p style={{ fontSize: isMobile ? "14px" : "18px", color: "rgba(255,255,255,0.9)", marginBottom: 20 }}>
        Verified PGs, Coliving & Rental Homes
      </p>
    </div>
  );
};

// ================= LOCATION PERMISSION BANNER =================
const LocationPermissionBanner = ({ onAllow, onDeny, isLoading }) => {
  return (
    <div style={{
      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: 16, marginBottom: 20,
      padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Navigation size={24} color="white" />
        <div><h3 style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Find Properties Near You</h3></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onDeny} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: 8 }}>Not Now</button>
        <button onClick={onAllow} disabled={isLoading} style={{ padding: "8px 20px", background: "white", color: "#3b82f6", border: "none", borderRadius: 8, fontWeight: 600 }}>
          {isLoading ? "Getting..." : "Allow"}
        </button>
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================
function UserPGSearch() {
  const isMobile = window.innerWidth < 768;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [allPGs, setAllPGs] = useState([]);
  const [displayPGs, setDisplayPGs] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [showLocationBanner, setShowLocationBanner] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState(new Set());

  const [filters, setFilters] = useState({
    location: "",
    ac: false,
    wifi: false,
    parking: false,
    foodType: "",
    nearMe: false
  });

  // Auto ask for location on first load
  useEffect(() => {
    const autoAsked = localStorage.getItem(LOCATION_AUTO_ASKED_KEY);
    if (!autoAsked && !userLocation && !locationLoading) {
      autoDetectLocation();
    }
  }, []);

  const autoDetectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18`);
          const data = await response.json();
          if (data.address) {
            const area = data.address.suburb || data.address.neighbourhood || "";
            setUserAddress(area);
          }
        } catch (err) {}
        setFilters(prev => ({ ...prev, nearMe: true }));
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocationLoading(false);
        loadPGs();
      },
      () => {
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocationLoading(false);
        loadPGs();
      }
    );
  };

  const applyQuickFilter = (filter) => {
    const newActiveFilters = new Set(activeQuickFilters);
    if (newActiveFilters.has(filter.id)) {
      newActiveFilters.delete(filter.id);
      if (filter.type === "location") setFilters(prev => ({ ...prev, nearMe: false }));
      else if (filter.type === "food") setFilters(prev => ({ ...prev, foodType: "" }));
      else if (filter.type === "amenity") setFilters(prev => ({ ...prev, [filter.field]: false }));
    } else {
      newActiveFilters.add(filter.id);
      if (filter.type === "location") {
        setFilters(prev => ({ ...prev, nearMe: true }));
        detectLocation();
      } else if (filter.type === "food" && filter.value) setFilters(prev => ({ ...prev, foodType: filter.value }));
      else if (filter.type === "amenity" && filter.field) setFilters(prev => ({ ...prev, [filter.field]: true }));
    }
    setActiveQuickFilters(newActiveFilters);
  };

  const processPGData = (data) => {
    return data.map(pg => ({
      ...pg,
      single_sharing: Number(pg.single_sharing) || 0,
      double_sharing: Number(pg.double_sharing) || 0,
      triple_sharing: Number(pg.triple_sharing) || 0,
      co_living_single_room: Number(pg.co_living_single_room) || 0,
      co_living_double_room: Number(pg.co_living_double_room) || 0,
      price_1bhk: Number(pg.price_1bhk) || 0,
      price_2bhk: Number(pg.price_2bhk) || 0,
      available_rooms: Number(pg.available_rooms) || 0,
      food_available: pg.food_available === true || pg.food_available === 1,
      ac_available: pg.ac_available === true || pg.ac_available === 1,
      wifi_available: pg.wifi_available === true || pg.wifi_available === 1,
      parking_available: pg.parking_available === true || pg.parking_available === 1,
    }));
  };

  const loadPGs = async () => {
    try {
      setLoading(true);
      let url = `/pg/search/advanced?page=1&limit=100`;
      if (userLocation && filters.nearMe) {
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`;
      }
      const res = await api.get(url);
      if (res.data?.success || res.data?.data) {
        let rawData = res.data?.data || [];
        if (userLocation) {
          rawData = rawData.map(pg => {
            if (pg.latitude && pg.longitude) {
              const distance = getDistanceKm(userLocation.lat, userLocation.lng, pg.latitude, pg.longitude);
              return { ...pg, distance };
            }
            return pg;
          });
          if (filters.nearMe) rawData.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        const processedData = processPGData(rawData);
        setAllPGs(processedData);
        setDisplayPGs(processedData);
        
        // Set nearby PGs for initial display
        const nearby = [...processedData].filter(p => p.distance && p.distance <= 5).slice(0, 12);
        setNearbyPGs(nearby);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading PGs:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPGs();
    loadFavorites();
  }, []);

  useEffect(() => {
    if (userLocation && filters.nearMe) loadPGs();
  }, [userLocation]);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem("pg_favorites");
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (error) { setFavorites(new Set()); }
  };

  const saveFavorites = (newFavorites) => {
    try { localStorage.setItem("pg_favorites", JSON.stringify([...newFavorites])); } catch (error) {}
  };

  const toggleFavorite = (pgId, e) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(pgId)) newFavorites.delete(pgId);
    else newFavorites.add(pgId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const showNotification = (message) => {
    setNotification({ message });
    setTimeout(() => setNotification(null), 2000);
  };

  const filterByArea = (area) => {
    setFilters(prev => ({ ...prev, location: area, nearMe: false }));
    const filtered = allPGs.filter(pg => `${pg.area || ""} ${pg.city || ""}`.toLowerCase().includes(area.toLowerCase()));
    setDisplayPGs(filtered);
    showNotification(`Showing properties in ${area}`);
  };

  const handleAllowLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFilters(prev => ({ ...prev, nearMe: true }));
        setShowLocationBanner(false);
        setLocationLoading(false);
        loadPGs();
      },
      () => {
        showNotification("Unable to get location");
        setShowLocationBanner(false);
        setLocationLoading(false);
      }
    );
  };

  const detectLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);
        setFilters(prev => ({ ...prev, nearMe: true }));
        setLocationLoading(false);
        loadPGs();
      },
      () => {
        showNotification("Unable to get location");
        setLocationLoading(false);
      }
    );
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];
    if (filters.location) {
      filtered = filtered.filter(pg => `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters.ac) filtered = filtered.filter(pg => pg.ac_available === true);
    if (filters.wifi) filtered = filtered.filter(pg => pg.wifi_available === true);
    if (filters.parking) filtered = filtered.filter(pg => pg.parking_available === true);
    if (filters.foodType) filtered = filtered.filter(pg => pg.food_type === filters.foodType);
    if (filters.nearMe && userLocation) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    setDisplayPGs(filtered);
  }, [allPGs, filters, userLocation]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const resetFilters = () => {
    setFilters({ location: "", ac: false, wifi: false, parking: false, foodType: "", nearMe: false });
    setActiveQuickFilters(new Set());
    setDisplayPGs(allPGs);
    showNotification("Filters reset");
  };

  const handleQuickView = (pg, e) => { e.stopPropagation(); setQuickViewPG(pg); };
  const handleBookNow = (pg) => { if (!user) { navigate("/login"); return; } setBookingPG(pg); };
  const handleSaveFavorite = (pgId, isFavorite) => {
    const newFavorites = new Set(favorites);
    if (isFavorite) newFavorites.add(pgId);
    else newFavorites.delete(pgId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };
  const handleCardClick = (pg) => navigate(`/pg/${pg.id}`);
  const handleBookingSubmit = async (bookingData) => {
    try {
      if (!user) { navigate("/register"); return; }
      const token = await user.getIdToken(true);
      await api.post(`/bookings/${bookingPG.id}`, { room_type: bookingData.roomType }, { headers: { Authorization: `Bearer ${token}` } });
      showNotification("Owner will contact you shortly");
      if (bookingPG.contact_phone) setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 500);
      setBookingPG(null);
    } catch (error) {
      if (error.response?.data?.message?.includes("already")) {
        showNotification("Connecting you to owner...");
        if (bookingPG.contact_phone) setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 500);
        setBookingPG(null);
      } else showNotification("Something went wrong");
    }
  };

  if (authLoading) {
    return <div style={{ textAlign: "center", paddingTop: 100 }}>Loading...</div>;
  }

  const propertiesToShow = filters.location || filters.ac || filters.wifi || filters.parking || filters.foodType || filters.nearMe || activeQuickFilters.size > 0 ? displayPGs : (userLocation ? nearbyPGs : allPGs.slice(0, 12));

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: "0 12px" }}>
      {notification && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#10b981", color: "white", padding: "10px 20px", borderRadius: 10, zIndex: 4000 }}>
          {notification.message}
        </div>
      )}

      {showLocationBanner && <LocationPermissionBanner onAllow={handleAllowLocation} onDeny={() => setShowLocationBanner(false)} isLoading={locationLoading} />}

      <HeroBanner />

      {userLocation && (
        <div style={{ background: "#f0f9ff", borderRadius: 12, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Navigation size={16} color="#0284c7" />
            <span style={{ fontSize: 13 }}>📍 {userAddress ? `Near ${userAddress}` : "Your Location"} • Properties within 5km</span>
          </div>
          <button onClick={detectLocation} style={{ padding: "6px 12px", background: "#0284c7", color: "white", border: "none", borderRadius: 8, fontSize: 12 }}>Refresh</button>
        </div>
      )}

      {/* Quick Filters */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {quickFilters.map((filter) => (
            <button key={filter.id} onClick={() => applyQuickFilter(filter)} style={{
              padding: "6px 14px", borderRadius: 30, fontSize: 13,
              background: activeQuickFilters.has(filter.id) ? (filter.id === "near_me" ? "#f97316" : "#3b82f6") : "#f3f4f6",
              color: activeQuickFilters.has(filter.id) ? "white" : "#374151", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}>{filter.icon}{filter.name}</button>
          ))}
        </div>
      </div>

      {/* Popular Areas */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>📍 Popular Areas</h3>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          {popularAreas.map((area) => (
            <button key={area.name} onClick={() => filterByArea(area.name)} style={{
              padding: "6px 14px", borderRadius: 30, whiteSpace: "nowrap",
              border: filters.location === area.name ? `2px solid ${area.color}` : "1px solid #e5e7eb",
              background: filters.location === area.name ? `${area.color}10` : "#fff",
              color: filters.location === area.name ? area.color : "#374151", fontSize: 13, cursor: "pointer"
            }}><span>{area.icon}</span> {area.name}</button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input placeholder="Search by area..." value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} style={{ width: "100%", padding: "8px 8px 8px 32px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "8px 16px", background: showFilters ? "#3b82f6" : "#f3f4f6", color: showFilters ? "white" : "#374151", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}><Filter size={14} /> Filters</button>
          <button onClick={detectLocation} style={{ padding: "8px 16px", background: filters.nearMe ? "#f97316" : "#f3f4f6", color: filters.nearMe ? "white" : "#374151", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}><Navigation size={14} /> Near Me</button>
          {(filters.location || filters.ac || filters.wifi || filters.parking || filters.foodType || filters.nearMe || activeQuickFilters.size > 0) && (
            <button onClick={resetFilters} style={{ padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Clear</button>
          )}
        </div>

        {showFilters && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
              <select value={filters.foodType} onChange={(e) => setFilters({ ...filters, foodType: e.target.value })} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                <option value="">Food: Any</option>
                <option value="veg">Vegetarian Only</option>
                <option value="non-veg">Non-Veg Only</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><input type="checkbox" checked={filters.ac} onChange={(e) => setFilters({ ...filters, ac: e.target.checked })} /> ❄️ AC</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><input type="checkbox" checked={filters.wifi} onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })} /> 📶 WiFi</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><input type="checkbox" checked={filters.parking} onChange={(e) => setFilters({ ...filters, parking: e.target.checked })} /> 🅿️ Parking</label>
            </div>
          </div>
        )}
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}>Loading properties...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {propertiesToShow.map((pg) => (
              <PGPropertyCard
                key={pg.id} pg={pg}
                onQuickView={handleQuickView} onFavorite={toggleFavorite}
                onContact={handleBookNow} onCardClick={handleCardClick}
                isFavorite={favorites.has(pg.id)}
              />
            ))}
          </div>
          {propertiesToShow.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px", background: "#f9fafb", borderRadius: 16 }}>
              <p style={{ fontSize: 18, fontWeight: 600 }}>No properties found</p>
              <button onClick={resetFilters} style={{ marginTop: 16, padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: 8 }}>Reset Filters</button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {quickViewPG && <QuickViewModal pg={quickViewPG} onClose={() => setQuickViewPG(null)} onBook={handleBookNow} onSaveFavorite={handleSaveFavorite} />}
      {bookingPG && <BookingModal pg={bookingPG} onClose={() => setBookingPG(null)} onBook={handleBookingSubmit} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default UserPGSearch;