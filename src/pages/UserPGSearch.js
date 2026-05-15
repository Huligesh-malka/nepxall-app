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
  Headphones
} from "lucide-react";
import api from "../api/api";

import { useInstallPrompt } from "../hooks/useInstallPrompt";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

// Key for localStorage to track if location permission was asked
const LOCATION_PERMISSION_ASKED_KEY = "nepxall_location_permission_asked";

// ================= TRACKING FUNCTION =================
const trackEvent = (eventName, data = {}) => {
  if (window.gtag) {
    window.gtag("event", eventName, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
  console.log("Tracked:", eventName, data);
};

/* ================= HELPER: GET MOBILE STATE ================= */
const isMobileDevice = () => window.innerWidth < 768;

/* ================= HELPERS ================= */
const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;

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

// Safe price formatting function
const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
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
      return `${BACKEND_URL}${relativePath}`;
    }
  }
  
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) {
      return `${BACKEND_URL}${uploadsMatch[0]}`;
    }
  }
  
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

/* ================= HELPER: GET PRICE RANGE BY PROPERTY TYPE ================= */
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
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};

/* ================= HELPER: SINGLE PRICE GETTER ================= */
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

/* ================= BUDGET FILTER COMPONENT ================= */
const BudgetFilter = ({ minBudget, maxBudget, onBudgetChange, onClose }) => {
  const [localMin, setLocalMin] = useState(minBudget);
  const [localMax, setLocalMax] = useState(maxBudget);

  const budgetRanges = [
    { label: "Budget (₹0-5k)", min: 0, max: 5000 },
    { label: "Economy (₹5k-10k)", min: 5000, max: 10000 },
    { label: "Standard (₹10k-20k)", min: 10000, max: 20000 },
    { label: "Premium (₹20k-30k)", min: 20000, max: 30000 },
    { label: "Luxury (₹30k+)", min: 30000, max: 100000 }
  ];

  const handleApply = () => {
    onBudgetChange(localMin, localMax);
    onClose();
  };

  const handleReset = () => {
    setLocalMin(0);
    setLocalMax(50000);
    onBudgetChange(0, 50000);
  };

  const selectBudgetRange = (min, max) => {
    setLocalMin(min);
    setLocalMax(max);
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
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 500,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: 30 }}>
          <h2 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: "#111827",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <Sliders size={24} />
            Budget Filter
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: "#6b7280",
            marginBottom: 24 
          }}>
            Set your monthly budget range
          </p>

          <div style={{ marginBottom: 30 }}>
            <h4 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 16,
              color: "#374151"
            }}>
              Quick Select
            </h4>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12
            }}>
              {budgetRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => selectBudgetRange(range.min, range.max)}
                  style={{
                    padding: "14px 12px",
                    background: localMin === range.min && localMax === range.max ? "#3b82f6" : "#f3f4f6",
                    color: localMin === range.min && localMax === range.max ? "white" : "#374151",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{range.label.split('(')[0]}</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{range.label.split('(')[1]?.replace(')', '')}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <h4 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 16,
              color: "#374151"
            }}>
              Custom Range
            </h4>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8
              }}>
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
                  Min: ₹{formatPrice(localMin)}
                </span>
                <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
                  Max: ₹{formatPrice(localMax)}
                </span>
              </div>
              <div style={{
                position: "relative",
                height: 40
              }}>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={localMin}
                  onChange={(e) => setLocalMin(Number(e.target.value))}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: 6,
                    background: "transparent",
                    appearance: "none",
                    pointerEvents: "none"
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={localMax}
                  onChange={(e) => setLocalMax(Number(e.target.value))}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: 6,
                    background: "transparent",
                    appearance: "none",
                    pointerEvents: "none"
                  }}
                />
                <div style={{
                  position: "absolute",
                  width: "100%",
                  height: 6,
                  background: "#e5e7eb",
                  borderRadius: 3
                }} />
                <div style={{
                  position: "absolute",
                  left: `${(localMin / 50000) * 100}%`,
                  right: `${100 - (localMax / 50000) * 100}%`,
                  height: 6,
                  background: "#3b82f6",
                  borderRadius: 3
                }} />
                <div style={{
                  position: "absolute",
                  left: `${(localMin / 50000) * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 20,
                  height: 20,
                  background: "#3b82f6",
                  borderRadius: "50%",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }} />
                <div style={{
                  position: "absolute",
                  left: `${(localMax / 50000) * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 20,
                  height: 20,
                  background: "#3b82f6",
                  borderRadius: "50%",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16
            }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#374151"
                }}>
                  Min Budget
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280"
                  }}>₹</span>
                  <input
                    type="number"
                    value={localMin}
                    onChange={(e) => setLocalMin(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 32px",
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      fontSize: 14,
                      background: "#f9fafb"
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#374151"
                }}>
                  Max Budget
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280"
                  }}>₹</span>
                  <input
                    type="number"
                    value={localMax}
                    onChange={(e) => setLocalMax(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 32px",
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      fontSize: 14,
                      background: "#f9fafb"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: "14px",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              style={{
                flex: 2,
                padding: "14px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <Check size={18} />
              Apply Budget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= SIMPLE BOOKING MODAL (CONTACT OWNER) ================= */
const BookingModal = ({ pg, onClose, onBook }) => {

  const [bookingData, setBookingData] = useState({
    roomType: ""
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pg) return;

    const defaultRoomType = getDefaultRoomType();

    setBookingData({
      roomType: defaultRoomType || ""
    });

  }, [pg]);

  if (!pg) return null;

  const getDefaultRoomType = () => {
    if (pg.pg_category === "pg") {
      if (pg.single_sharing) return "Single Sharing";
      if (pg.double_sharing) return "Double Sharing";
      if (pg.triple_sharing) return "Triple Sharing";
      if (pg.four_sharing) return "Four Sharing";
      if (pg.single_room) return "Single Room";
      if (pg.double_room) return "Double Room";
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room) return "Single Room";
      if (pg.co_living_double_room) return "Double Room";
      if (pg.coliving_three_sharing) return "Triple Sharing";
      if (pg.coliving_four_sharing) return "Four Sharing";
    } else if (pg.pg_category === "to_let") {
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
  };

  const getRoomTypes = () => {
    const types = [];
    
    if (pg.pg_category === "pg") {
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
      if (pg.single_room && Number(pg.single_room) > 0) types.push({ 
        value: "Single Room", 
        label: `Single Room - ₹${formatPrice(pg.single_room)}` 
      });
      if (pg.double_room && Number(pg.double_room) > 0) types.push({ 
        value: "Double Room", 
        label: `Double Room - ₹${formatPrice(pg.double_room)}` 
      });
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ 
        value: "Single Room", 
        label: `Co-Living Single Room - ₹${formatPrice(pg.co_living_single_room)}` 
      });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ 
        value: "Double Room", 
        label: `Co-Living Double Room - ₹${formatPrice(pg.co_living_double_room)}` 
      });
      if (pg.coliving_three_sharing && Number(pg.coliving_three_sharing) > 0) types.push({ 
        value: "Triple Sharing", 
        label: `Co-Living Triple Sharing - ₹${formatPrice(pg.coliving_three_sharing)}` 
      });
      if (pg.coliving_four_sharing && Number(pg.coliving_four_sharing) > 0) types.push({ 
        value: "Four Sharing", 
        label: `Co-Living Four Sharing - ₹${formatPrice(pg.coliving_four_sharing)}` 
      });
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) types.push({ 
        value: "1BHK", 
        label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` 
      });
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) types.push({ 
        value: "2BHK", 
        label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` 
      });
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) types.push({ 
        value: "3BHK", 
        label: `3 BHK - ₹${formatPrice(pg.price_3bhk)}` 
      });
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) types.push({ 
        value: "4BHK", 
        label: `4 BHK - ₹${formatPrice(pg.price_4bhk)}` 
      });
    }
    
    return types;
  };

  const getSelectedPrice = () => {
    if (!bookingData.roomType) return null;
    
    if (pg.pg_category === "pg") {
      if (bookingData.roomType === "Single Sharing") return pg.single_sharing;
      if (bookingData.roomType === "Double Sharing") return pg.double_sharing;
      if (bookingData.roomType === "Triple Sharing") return pg.triple_sharing;
      if (bookingData.roomType === "Four Sharing") return pg.four_sharing;
      if (bookingData.roomType === "Single Room") return pg.single_room;
      if (bookingData.roomType === "Double Room") return pg.double_room;
    } else if (pg.pg_category === "coliving") {
      if (bookingData.roomType === "Single Room") return pg.co_living_single_room;
      if (bookingData.roomType === "Double Room") return pg.co_living_double_room;
      if (bookingData.roomType === "Triple Sharing") return pg.coliving_three_sharing;
      if (bookingData.roomType === "Four Sharing") return pg.coliving_four_sharing;
    } else if (pg.pg_category === "to_let") {
      if (bookingData.roomType === "1BHK") return pg.price_1bhk;
      if (bookingData.roomType === "2BHK") return pg.price_2bhk;
      if (bookingData.roomType === "3BHK") return pg.price_3bhk;
      if (bookingData.roomType === "4BHK") return pg.price_4bhk;
    }
    return null;
  };

  const selectedPrice = getSelectedPrice();

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
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 500,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: 30 }}>
          <h2 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: "#111827",
            marginBottom: 8 
          }}>
            📞 Contact Owner - {pg.pg_name}
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: "#6b7280",
            marginBottom: 24 
          }}>
            Your details will be shared with the property owner. They will contact you shortly.
          </p>

          {Number(pg.min_stay_months) > 0 && (
            <div style={{
              background: "#f0fdf4",
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
              fontSize: 13,
              color: "#065f46",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <Lock size={16} />
              Minimum stay requirement: {pg.min_stay_months} months
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              await onBook(bookingData);
            } catch (err) {
              console.error("Booking error:", err);
            } finally {
              setLoading(false);
            }
          }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#374151"
              }}>
                {pg.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
              </label>
              <select
                name="roomType"
                value={bookingData.roomType}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  fontSize: 14,
                  background: "#f9fafb"
                }}
              >
                <option value="">Select {pg.pg_category === "to_let" ? "BHK Type" : "Room Type"}</option>
                {getRoomTypes().map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              {selectedPrice !== null && selectedPrice > 0 && (
                <p style={{ marginTop: 8, fontWeight: 600, color: "#10b981", fontSize: 14 }}>
                  Selected: {bookingData.roomType} - ₹{formatPrice(selectedPrice)}/month
                </p>
              )}
            </div>

            <div style={{
              background: "#f0fdf4",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              border: "1px solid #bbf7d0"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Info size={16} color="#10b981" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#065f46" }}>
                  What happens next?
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#065f46", fontSize: 13 }}>
                <li>Owner receives your inquiry instantly</li>
                <li>Owner gets WhatsApp notification</li>
                <li>Owner will contact you within 24 hours</li>
                <li>No payment required now</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "14px",
                  background: loading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 18,
                      height: 18,
                      border: "2px solid white",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    Contact Owner
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

// Camera icon component
const Camera = ({ size, color }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color || "currentColor"} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// Wrench icon component
const Wrench = ({ size, color }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

/* ================= COMPARE MODAL COMPONENT ================= */
const CompareModal = ({ selectedPGs, allPGs, onClose }) => {
  const [compareData, setCompareData] = useState([]);

  useEffect(() => {
    const propertiesToCompare = allPGs.filter(pg => selectedPGs.has(pg.id));
    setCompareData(propertiesToCompare);
  }, [selectedPGs, allPGs]);

  if (compareData.length === 0) return null;

  const getFeatureValue = (pg, feature) => {
    switch(feature) {
      case 'name':
        return pg.pg_name;
      case 'type':
        return pg.pg_category === 'pg' ? 'PG' : 
              pg.pg_category === 'coliving' ? 'Co-Living' : 'To-Let';
      case 'price':
        return `₹${formatPrice(getEffectiveRent(pg))}`;
      case 'deposit':
        return `₹${formatPrice(pg.deposit_amount || pg.security_deposit || 0)}`;
      case 'location':
        return pg.area || pg.city || 'N/A';
      case 'food':
        return pg.food_available ? 
              (pg.food_type === 'veg' ? 'Vegetarian' : 
                pg.food_type === 'non-veg' ? 'Non-Veg' : 'Both') : 'No';
      case 'wifi':
        return pg.wifi_available ? 'Yes' : 'No';
      case 'ac':
        return pg.ac_available ? 'Yes' : 'No';
      case 'parking':
        return pg.parking_available ? 'Yes' : 'No';
      case 'attached_bathroom':
        return pg.attached_bathroom ? 'Yes' : 'No';
      case 'available_rooms':
        return pg.available_rooms || 0;
      case 'min_stay':
        return pg.min_stay_months ? `${pg.min_stay_months} months` : 'N/A';
      case 'distance':
        return pg.distance ? `${pg.distance.toFixed(1)} km` : 'N/A';
      default:
        return 'N/A';
    }
  };

  const features = [
    { key: 'name', label: 'Property Name' },
    { key: 'type', label: 'Type' },
    { key: 'price', label: 'Monthly Rent' },
    { key: 'deposit', label: 'Deposit' },
    { key: 'location', label: 'Location' },
    { key: 'distance', label: 'Distance' },
    { key: 'food', label: 'Food' },
    { key: 'wifi', label: 'WiFi' },
    { key: 'ac', label: 'AC' },
    { key: 'parking', label: 'Parking' },
    { key: 'attached_bathroom', label: 'Attached Bathroom' },
    { key: 'available_rooms', label: 'Available Rooms' },
    { key: 'min_stay', label: 'Min Stay' }
  ];

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
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 1200,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: 30 }}>
          <h2 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: "#111827",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <BarChart size={28} />
            Compare Properties
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: "#6b7280",
            marginBottom: 30 
          }}>
            Comparing {compareData.length} properties
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ 
                    padding: "16px", 
                    background: "#f3f4f6",
                    textAlign: "left",
                    borderRadius: "10px 0 0 0"
                  }}>
                    Features
                  </th>
                  {compareData.map((pg, idx) => (
                    <th key={pg.id} style={{ 
                      padding: "16px", 
                      background: "#f3f4f6",
                      textAlign: "center",
                      minWidth: "200px",
                      borderRadius: idx === compareData.length - 1 ? "0 10px 0 0" : "0"
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{pg.pg_name}</div>
                      {pg.photos && pg.photos.length > 0 && (
                        <img 
                          src={getCorrectImageUrl(pg.photos[0])}
                          alt={pg.pg_name}
                          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/no-image.png";
                          }}
                        />
                      )}
                      {pg.distance && (
                        <div style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}>
                          <Navigation size={12} />
                          {pg.distance.toFixed(1)} km away
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, featureIdx) => (
                  <tr key={feature.key} style={{
                    background: featureIdx % 2 === 0 ? "#ffffff" : "#f9fafb"
                  }}>
                    <td style={{ 
                      padding: "14px 16px", 
                      fontWeight: 600,
                      borderBottom: "1px solid #e5e7eb"
                    }}>
                      {feature.label}
                    </td>
                    {compareData.map((pg) => (
                      <td key={`${pg.id}-${feature.key}`} style={{ 
                        padding: "14px 16px", 
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb"
                      }}>
                        <span style={{
                          background: feature.key === 'price' ? "#10b98120" : "transparent",
                          color: feature.key === 'price' ? "#10b981" : "#374151",
                          padding: feature.key === 'price' ? "6px 12px" : "0",
                          borderRadius: feature.key === 'price' ? "20px" : "0",
                          fontWeight: feature.key === 'price' ? 600 : 400
                        }}>
                          {getFeatureValue(pg, feature.key)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb"
          }}>
            <button
              onClick={onClose}
              style={{
                padding: "12px 24px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= PROMOTIONAL BANNERS SLIDER COMPONENT ================= */
const PromoBannerSlider = ({ onBannerClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const promoBanners = [
    {
      id: 1,
      title: "₹200 OFF",
      subtitle: "On First Booking",
      description: "Use code FIRST200",
      color: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      icon: "🎉",
      gradient: "linear-gradient(135deg, #3b82f6, #1e40af)"
    },
    {
      id: 2,
      title: "Zero Brokerage",
      subtitle: "Direct Owner Contact",
      description: "Save on commission",
      color: "linear-gradient(135deg, #10b981, #059669)",
      icon: "🏠",
      gradient: "linear-gradient(135deg, #10b981, #047857)"
    },
    {
      id: 3,
      title: "Instant Booking",
      subtitle: "Fast Confirmation",
      description: "Get confirmed in minutes",
      color: "linear-gradient(135deg, #f59e0b, #d97706)",
      icon: "⚡",
      gradient: "linear-gradient(135deg, #f59e0b, #b45309)"
    },
    {
      id: 4,
      title: "Verified PGs",
      subtitle: "100% Trusted Properties",
      description: "No hidden charges",
      color: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      icon: "🤝",
      gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)"
    },
    {
      id: 5,
      title: "Student Offer",
      subtitle: "Limited Time Deal",
      description: "Special discount for students",
      color: "linear-gradient(135deg, #ec4899, #db2777)",
      icon: "🔥",
      gradient: "linear-gradient(135deg, #ec4899, #be185d)"
    }
  ];

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % promoBanners.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isHovered, promoBanners.length]);

  const handleManualScroll = (direction) => {
    if (direction === 'next') {
      setActiveIndex((prev) => (prev + 1) % promoBanners.length);
    } else {
      setActiveIndex((prev) => (prev - 1 + promoBanners.length) % promoBanners.length);
    }
  };

  const handleBannerClick = (banner) => {
    if (onBannerClick) {
      onBannerClick(banner);
    } else {
      // Default action based on banner type
      if (banner.title.includes("OFF")) {
        alert(`🎉 ${banner.title} - ${banner.subtitle}\n${banner.description}\n\nUse code: FIRST200 at checkout!`);
      } else if (banner.title.includes("Zero")) {
        alert(`🏠 ${banner.title}\n${banner.description}\n\nWe connect you directly with property owners - no middlemen, no brokerage!`);
      } else if (banner.title.includes("Instant")) {
        alert(`⚡ ${banner.title}\nBook now and get instant confirmation!\n\nYour booking will be confirmed within minutes.`);
      } else {
        alert(`✨ ${banner.title}\n${banner.description}\n\nClick to learn more!`);
      }
    }
  };

  // For mobile horizontal scroll view
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return (
      <div
        style={{
          marginBottom: 24,
          position: "relative",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          padding: "0 4px"
        }}>
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 2
            }}>
              🔥 Exclusive Offers
            </h3>
            <p style={{
              fontSize: 13,
              color: "#6b7280"
            }}>
              Limited time deals for you
            </p>
          </div>
          <div style={{
            display: "flex",
            gap: 8
          }}>
            <button
              onClick={() => handleManualScroll('prev')}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#f3f4f6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleManualScroll('next')}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#f3f4f6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            padding: "8px 4px 16px 4px",
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory"
          }}
          className="promo-scroll-container"
        >
          {promoBanners.map((banner, index) => (
            <div
              key={banner.id}
              onClick={() => handleBannerClick(banner)}
              style={{
                minWidth: 280,
                background: banner.gradient,
                borderRadius: 20,
                padding: 20,
                color: "white",
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.3s ease",
                scrollSnapAlign: "start",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
              }}
            >
              {/* Decorative circle */}
              <div style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%"
              }} />
              
              <div
                style={{
                  fontSize: 42,
                  marginBottom: 12,
                  position: "relative",
                  zIndex: 2
                }}
              >
                {banner.icon}
              </div>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 6,
                  position: "relative",
                  zIndex: 2
                }}
              >
                {banner.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  opacity: 0.9,
                  marginBottom: 4,
                  position: "relative",
                  zIndex: 2
                }}
              >
                {banner.subtitle}
              </p>
              <p
                style={{
                  fontSize: 12,
                  opacity: 0.75,
                  position: "relative",
                  zIndex: 2
                }}
              >
                {banner.description}
              </p>
              
              {/* CTA indicator */}
              <div style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                opacity: 0.8,
                position: "relative",
                zIndex: 2
              }}>
                <span>Tap to claim</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>

        {/* Dot indicators for auto-slide */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginTop: 8
        }}>
          {promoBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              style={{
                width: activeIndex === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: activeIndex === idx ? "#3b82f6" : "#d1d5db",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            />
          ))}
        </div>

        <style>{`
          .promo-scroll-container::-webkit-scrollbar {
            height: 4px;
          }
          .promo-scroll-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .promo-scroll-container::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .promo-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </div>
    );
  }

  // Desktop view with centered cards
  return (
    <div
      style={{
        marginBottom: 32,
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with navigation */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
      }}>
        <div>
          <h2 style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <SparklesIcon size={24} color="#f59e0b" />
            Exclusive Offers
          </h2>
          <p style={{
            fontSize: 14,
            color: "#6b7280"
          }}>
            Grab these limited-time deals before they're gone!
          </p>
        </div>
        <div style={{
          display: "flex",
          gap: 12
        }}>
          <button
            onClick={() => handleManualScroll('prev')}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#f3f4f6",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleManualScroll('next')}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#f3f4f6",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f3f4f6"}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Center-aligned cards with auto-slide */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap"
      }}>
        {/* Show only 3 featured banners on desktop, centered */}
        {promoBanners.slice(0, 3).map((banner) => (
          <div
            key={banner.id}
            onClick={() => handleBannerClick(banner)}
            style={{
              flex: "1 1 280px",
              maxWidth: 320,
              background: banner.gradient,
              borderRadius: 24,
              padding: 24,
              color: "white",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
          >
            {/* Animated shine effect */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              transition: "left 0.5s ease"
            }}
            className="shine-effect"
            onMouseEnter={(e) => {
              const shine = e.currentTarget;
              shine.style.left = "100%";
              setTimeout(() => { shine.style.left = "-100%"; }, 500);
            }}
            />
            
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
                position: "relative",
                zIndex: 2
              }}
            >
              {banner.icon}
            </div>
            <h3
              style={{
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 8,
                position: "relative",
                zIndex: 2
              }}
            >
              {banner.title}
            </h3>
            <p
              style={{
                fontSize: 15,
                opacity: 0.9,
                marginBottom: 8,
                position: "relative",
                zIndex: 2
              }}
            >
              {banner.subtitle}
            </p>
            <p
              style={{
                fontSize: 13,
                opacity: 0.75,
                marginBottom: 16,
                position: "relative",
                zIndex: 2
              }}
            >
              {banner.description}
            </p>
            
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 500,
              position: "relative",
              zIndex: 2
            }}>
              Claim Offer →
            </div>

            {/* Decorative elements */}
            <div style={{
              position: "absolute",
              bottom: -20,
              right: -20,
              width: 80,
              height: 80,
              background: "rgba(255,255,255,0.08)",
              borderRadius: "50%"
            }} />
            <div style={{
              position: "absolute",
              top: -10,
              left: -10,
              width: 60,
              height: 60,
              background: "rgba(255,255,255,0.05)",
              borderRadius: "50%"
            }} />
          </div>
        ))}
      </div>

      {/* Auto-slide indicator */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 10,
        marginTop: 24
      }}>
        {promoBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            style={{
              width: activeIndex === idx ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: activeIndex === idx ? "#3b82f6" : "#d1d5db",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }
        .shine-effect {
          animation: shine 3s infinite;
        }
      `}</style>
    </div>
  );
};

/* ================= HERO BANNER COMPONENT ================= */
const HeroBanner = () => {
  const isMobile = isMobileDevice();
  
  useEffect(() => {
    // Track homepage visit
    trackEvent("homepage_visit");
  }, []);
  
  return (
    <div className="hero-section" style={{
      background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
      borderRadius: 24,
      marginBottom: 40,
      overflow: "hidden",
      boxShadow: "0 20px 35px -10px rgba(0,0,0,0.15)",
      position: "relative"
    }}>
      <div style={{
        padding: "50px 30px 30px",
        position: "relative",
        zIndex: 2
      }}>
        <div>
          {/* Responsive heading with mobile size 36px, desktop 52px */}
          <h1 className="hero-title" style={{
            fontSize: isMobile ? "36px" : "52px",
            lineHeight: "1.15",
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 16,
            letterSpacing: "-0.02em"
          }}>
            Find Verified PGs,<br />
            Coliving & Rental Homes
          </h1>
          {/* Responsive description text */}
          <p style={{
            fontSize: isMobile ? "16px" : "22px",
            lineHeight: "1.4",
            color: "rgba(255,255,255,0.9)",
            marginBottom: 32,
            maxWidth: "90%"
          }}>
            Book trusted stays with secure payments, verified owners and instant booking support.
          </p>
          
          {/* Feature Columns with improved alignment */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            alignItems: "start",
            marginBottom: 32
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#ffffff"
            }}>
              <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Shield size={18} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Verified Properties</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#ffffff"
            }}>
              <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CreditCard size={18} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Secure Online Booking</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#ffffff"
            }}>
              <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Headphones size={18} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Direct Tenant-Owner Contact</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#ffffff"
            }}>
              <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <ClockIcon size={18} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 500 }}> Zero Brokerage</span>
            </div>
          </div>
          
          {/* Badges Section - Centered with flex-wrap */}
          <div className="hero-badges" style={{ 
            display: "flex", 
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginTop: 20
          }}>
            <div style={{
              background: "#10b981",
              color: "white",
              padding: "10px 18px",
              borderRadius: 30,
              fontWeight: 600,
              fontSize: 14
            }}>
              ✓ Verified
            </div>
            <div style={{
              background: "#3b82f6",
              color: "white",
              padding: "10px 18px",
              borderRadius: 30,
              fontWeight: 600,
              fontSize: 14
            }}>
              ✓ Secure
            </div>
            <div style={{
              background: "#8b5cf6",
              color: "white",
              padding: "10px 18px",
              borderRadius: 30,
              fontWeight: 600,
              fontSize: 14
            }}>
              ✓ Trusted
            </div>
          </div>
        </div>
      </div>
      
      <div style={{
        position: "absolute",
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        background: "rgba(255,255,255,0.05)",
        borderRadius: "50%",
        zIndex: 1
      }} />
      <div style={{
        position: "absolute",
        bottom: -80,
        left: -30,
        width: 250,
        height: 250,
        background: "rgba(255,255,255,0.03)",
        borderRadius: "50%",
        zIndex: 1
      }} />
    </div>
  );
};

/* ================= LOCATION PERMISSION BANNER COMPONENT ================= */
const LocationPermissionBanner = ({ onAllow, onDeny, isLoading }) => {
  return (
    <div style={{
      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      borderRadius: 20,
      marginBottom: 20,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 16,
      animation: "slideDown 0.3s ease",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
        <div style={{
          background: "rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Navigation size={24} color="white" />
        </div>
        <div>
          <h3 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: "white",
            marginBottom: 4
          }}>
            📍 Find Properties Near You
          </h3>
          <p style={{ 
            fontSize: 13, 
            color: "rgba(255,255,255,0.9)",
            margin: 0
          }}>
            Allow location access to see PGs, Co-living & To-Let properties within 5km of your area
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onDeny}
          style={{
            padding: "10px 20px",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
          }}
        >
          Not Now
        </button>
        <button
          onClick={onAllow}
          disabled={isLoading}
          style={{
            padding: "10px 24px",
            background: "white",
            color: "#3b82f6",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s"
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: "2px solid #3b82f6",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
              Getting location...
            </>
          ) : (
            <>
              <Navigation size={16} />
              Allow Location
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* ================= UPDATED PG CARD COMPONENT WITH AUTO IMAGE SLIDER ================= */
const PGPropertyCard = ({ pg, onQuickView, onFavorite, onContact, onCardClick, isFavorite, isSelectedForCompare, onSelectForCompare, compareMode, getImageUrl }) => {
  const isMobile = window.innerWidth < 768;
  const [currentImage, setCurrentImage] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Get photos array for auto-slider
  const photosArray = React.useMemo(() => {
    if (pg.photos && Array.isArray(pg.photos) && pg.photos.length > 0) {
      return pg.photos.filter(photo => photo && photo.trim() !== "");
    }
    return [];
  }, [pg.photos]);
  
  const mainPhoto = pg.main_photo || (photosArray.length > 0 ? photosArray[0] : null);
  const hasMultipleImages = photosArray.length > 1;
  
  // Auto image slider effect
  useEffect(() => {
    if (hasMultipleImages && !compareMode) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % photosArray.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length, compareMode]);
  
  const currentPhotoUrl = React.useMemo(() => {
    if (hasMultipleImages && photosArray[currentImage]) {
      return getCorrectImageUrl(photosArray[currentImage]);
    }
    if (mainPhoto) {
      return getCorrectImageUrl(mainPhoto);
    }
    return "/no-image.png";
  }, [hasMultipleImages, photosArray, currentImage, mainPhoto]);
  
  // Get starting price (only minimum)
  const startingPrice = React.useMemo(() => {
    const range = getPriceRangeByType(pg);
    return range.min || getEffectiveRent(pg);
  }, [pg]);
  
  // Check if filling fast (less than 5 beds left)
  const isFillingFast = pg.available_rooms < 5 && pg.available_rooms > 0;
  
  // Get food type display
  const foodTypeDisplay = React.useMemo(() => {
    if (!pg.food_available) return null;
    if (pg.food_type === 'veg') return "🍽️ Veg";
    if (pg.food_type === 'non-veg') return "🍽️ Non-Veg";
    if (pg.food_type === 'both') return "🍽️ Veg & Non-Veg";
    return "🍽️ Food Available";
  }, [pg.food_available, pg.food_type]);
  
  return (
    <div
      onClick={() => onCardClick(pg)}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        cursor: "pointer",
        transition: "all 0.3s ease",
        border: isSelectedForCompare ? "2px solid #8b5cf6" : "1px solid #e5e7eb",
        position: "relative",
        width: "100%",
        maxWidth: isMobile ? "100%" : "380px",
        minWidth: 0,
        boxSizing: "border-box"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.08)";
      }}
    >
      {/* Compare Mode Selector */}
      {compareMode && (
        <button
          onClick={(e) => onSelectForCompare(pg.id, e)}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          {isSelectedForCompare ? (
            <Check size={18} color="#8b5cf6" />
          ) : (
            <Plus size={18} color="#374151" />
          )}
        </button>
      )}
      
      {/* Quick View Button */}
      <button
        onClick={(e) => onQuickView(pg, e)}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(255,255,255,0.9)",
          border: "none",
          padding: "8px 16px",
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#3b82f6";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.9)";
          e.currentTarget.style.color = "#374151";
        }}
      >
        <Eye size={14} />
        Quick View
      </button>
      
      {/* Favorite Button */}
      <button
        onClick={(e) => onFavorite(pg.id, e)}
        style={{
          position: "absolute",
          top: 12,
          left: compareMode ? 56 : 12,
          background: "rgba(255,255,255,0.9)",
          border: "none",
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        <Heart 
          size={18} 
          color="#ef4444" 
          fill={isFavorite ? "#ef4444" : "none"}
        />
      </button>
      
      {/* Image Section with Auto Slider */}
      <div style={{ position: "relative" }}>
        <img
          src={currentPhotoUrl}
          alt={pg.pg_name}
          style={{ 
            width: "100%", 
            height: isMobile ? 200 : 240, 
            objectFit: "cover", 
            display: "block" 
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/no-image.png";
          }}
        />
        
        {/* Property Type Badge */}
        <div style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: pg.pg_category === "to_let" ? "#f97316" : 
                    pg.pg_category === "coliving" ? "#8b5cf6" :
                    pg.pg_type === "boys" ? "#16a34a" : "#db2777",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {pg.pg_category === "to_let" ? "To-Let" : 
          pg.pg_category === "coliving" ? "Co-Living" :
          pg.pg_type ? pg.pg_type.charAt(0).toUpperCase() + pg.pg_type.slice(1) + " PG" : "PG"}
        </div>
        
        {/* Distance Badge */}
        {pg.distance && (
          <div style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <Navigation size={10} />
            {pg.distance.toFixed(1)} km
          </div>
        )}
        
        {/* Image Slider Dots (only if multiple images) */}
        {hasMultipleImages && (
          <div style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
            background: "rgba(0,0,0,0.5)",
            padding: "4px 8px",
            borderRadius: 20
          }}>
            {photosArray.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: currentImage === idx ? 8 : 6,
                  height: currentImage === idx ? 8 : 6,
                  borderRadius: "50%",
                  background: currentImage === idx ? "#fff" : "rgba(255,255,255,0.5)",
                  transition: "all 0.2s"
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Card Content - Simplified */}
      <div style={{ padding: 16 }}>
        {/* PG Name */}
        <h3 style={{ 
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: 4,
          color: "#111827"
        }}>
          {pg.pg_name}
        </h3>
        
        {/* Location */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 4, 
          marginBottom: 12,
          color: "#6b7280",
          fontSize: 14
        }}>
          <MapPin size={14} />
          <span>{pg.area}{pg.city ? `, ${pg.city}` : ""}</span>
        </div>
        
        {/* Starting Price - Simplified */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            color: "#1e3a5f",
            display: "flex",
            alignItems: "baseline",
            gap: 4
          }}>
            ₹{formatPrice(startingPrice)}
            <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>onwards</span>
          </div>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>
            per month
          </div>
        </div>
        
        {/* Available Beds Left */}
        <div style={{
          background: "#ecfdf5",
          color: "#059669",
          padding: "6px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10
        }}>
          🛏️ {pg.available_rooms || 0} Beds Left
        </div>
        
        {/* Food Type */}
        {foodTypeDisplay && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
            fontSize: 13,
            color: "#374151"
          }}>
            {foodTypeDisplay}
          </div>
        )}
        
        {/* Filling Fast Badge */}
        {isFillingFast && (
          <div style={{
            background: "#fef3c7",
            color: "#d97706",
            padding: "4px 10px",
            borderRadius: 16,
            fontSize: 11,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 12
          }}>
            🔥 Filling Fast
          </div>
        )}
        
        {/* Verified + Response Time */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          fontSize: 11,
          color: "#6b7280",
          flexWrap: "wrap"
        }}>
          {pg.is_verified && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Shield size={12} color="#10b981" />
              Verified
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} />
            Owner responds in 10 mins
          </span>
        </div>
        
        {/* Contact Owner Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContact(pg);
          }}
          style={{
            width: "100%",
            fontSize: 14,
            padding: "12px 16px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#3b82f6";
          }}
        >
          <MessageCircle size={16} />
          Contact Owner
        </button>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
function UserPGSearch() {
  const isMobile = window.innerWidth < 768;
  
  const navigate = useNavigate();
  
  const { user, role, loading: authLoading } = useAuth();

  const [allPGs, setAllPGs] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [showLocationBanner, setShowLocationBanner] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
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
    foodType: ""
  });

  const limit = 1000;

  useEffect(() => {
    const permissionAsked = localStorage.getItem(LOCATION_PERMISSION_ASKED_KEY);
    if (!permissionAsked) {
      setShowLocationBanner(true);
    }
  }, []);

  // Handler for promo banner clicks
  const handlePromoBannerClick = (banner) => {
    if (banner.title.includes("OFF")) {
      showNotification(`🎉 ${banner.title} applied! Use code FIRST200 at checkout.`);
    } else if (banner.title.includes("Zero")) {
      showNotification(`🏠 ${banner.title} - No brokerage fees! Direct owner contact only.`);
    } else if (banner.title.includes("Instant")) {
      showNotification(`⚡ ${banner.title} - Book now for instant confirmation!`);
    } else {
      showNotification(`✨ ${banner.title} - ${banner.description}`);
    }
  };

  const processPGData = (data) => {
    return data.map(pg => ({
      ...pg,
      deposit_amount: Number(pg.deposit_amount) || Number(pg.security_deposit) || 0,
      rent_amount: Number(pg.rent_amount) || 0,
      single_sharing: Number(pg.single_sharing) || 0,
      double_sharing: Number(pg.double_sharing) || 0,
      triple_sharing: Number(pg.triple_sharing) || 0,
      four_sharing: Number(pg.four_sharing) || 0,
      single_room: Number(pg.single_room) || 0,
      double_room: Number(pg.double_room) || 0,
      price_1bhk: Number(pg.price_1bhk) || 0,
      price_2bhk: Number(pg.price_2bhk) || 0,
      price_3bhk: Number(pg.price_3bhk) || 0,
      price_4bhk: Number(pg.price_4bhk) || 0,
      co_living_single_room: Number(pg.co_living_single_room) || 0,
      co_living_double_room: Number(pg.co_living_double_room) || 0,
      coliving_three_sharing: Number(pg.coliving_three_sharing) || 0,
      coliving_four_sharing: Number(pg.coliving_four_sharing) || 0,
      security_deposit: Number(pg.security_deposit) || 0,
      maintenance_amount: Number(pg.maintenance_amount) || 0,
      available_rooms: Number(pg.available_rooms) || 0,
      total_rooms: Number(pg.total_rooms) || 0,
      min_stay_months: Number(pg.min_stay_months) || 0,
      bedrooms_1bhk: Number(pg.bedrooms_1bhk) || 0,
      bathrooms_1bhk: Number(pg.bathrooms_1bhk) || 0,
      bedrooms_2bhk: Number(pg.bedrooms_2bhk) || 0,
      bathrooms_2bhk: Number(pg.bathrooms_2bhk) || 0,
      bedrooms_3bhk: Number(pg.bedrooms_3bhk) || 0,
      bathrooms_3bhk: Number(pg.bathrooms_3bhk) || 0,
      bedrooms_4bhk: Number(pg.bedrooms_4bhk) || 0,
      bathrooms_4bhk: Number(pg.bathrooms_4bhk) || 0,
      food_available: pg.food_available === true || pg.food_available === 1 || pg.food_available === "true",
      ac_available: pg.ac_available === true || pg.ac_available === 1 || pg.ac_available === "true",
      wifi_available: pg.wifi_available === true || pg.wifi_available === 1 || pg.wifi_available === "true",
      parking_available: pg.parking_available === true || pg.parking_available === 1 || pg.parking_available === "true",
      cupboard_available: pg.cupboard_available === true || pg.cupboard_available === 1 || pg.cupboard_available === "true",
      table_chair_available: pg.table_chair_available === true || pg.table_chair_available === 1 || pg.table_chair_available === "true",
      dining_table_available: pg.dining_table_available === true || pg.dining_table_available === 1 || pg.dining_table_available === "true",
      attached_bathroom: pg.attached_bathroom === true || pg.attached_bathroom === 1 || pg.attached_bathroom === "true",
      balcony_available: pg.balcony_available === true || pg.balcony_available === 1 || pg.balcony_available === "true",
      wall_mounted_clothes_hook: pg.wall_mounted_clothes_hook === true || pg.wall_mounted_clothes_hook === 1 || pg.wall_mounted_clothes_hook === "true",
      bed_with_mattress: pg.bed_with_mattress === true || pg.bed_with_mattress === 1 || pg.bed_with_mattress === "true",
      fan_light: pg.fan_light === true || pg.fan_light === 1 || pg.fan_light === "true",
      kitchen_room: pg.kitchen_room === true || pg.kitchen_room === 1 || pg.kitchen_room === "true",
      co_living_fully_furnished: pg.co_living_fully_furnished === true || pg.co_living_fully_furnished === 1 || pg.co_living_fully_furnished === "true",
      co_living_food_included: pg.co_living_food_included === true || pg.co_living_food_included === 1 || pg.co_living_food_included === "true",
      co_living_wifi_included: pg.co_living_wifi_included === true || pg.co_living_wifi_included === 1 || pg.co_living_wifi_included === "true",
      co_living_housekeeping: pg.co_living_housekeeping === true || pg.co_living_housekeeping === 1 || pg.co_living_housekeeping === "true",
      co_living_power_backup: pg.co_living_power_backup === true || pg.co_living_power_backup === 1 || pg.co_living_power_backup === "true",
      co_living_maintenance: pg.co_living_maintenance === true || pg.co_living_maintenance === 1 || pg.co_living_maintenance === "true",
    }));
  };

  const loadPGs = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      let url = `/pg/search/advanced?page=${page}&limit=${limit}`;
      
      if (userLocation && filters.nearMe) {
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`;
      }
      
      const res = await api.get(url);
      
      if (res.data?.success || res.data?.data) {
        let rawData = res.data?.data || [];
        
        if (userLocation) {
          rawData = rawData.map(pg => {
            if (pg.latitude && pg.longitude) {
              const distance = getDistanceKm(
                userLocation.lat,
                userLocation.lng,
                pg.latitude,
                pg.longitude
              );
              return { ...pg, distance };
            }
            return pg;
          });
          
          if (filters.nearMe) {
            rawData.sort((a, b) => (a.distance || 999) - (b.distance || 999));
          }
        }
        
        const processedData = processPGData(rawData);
        
        if (!isLoadMore || page === 1) {
          setAllPGs(processedData);
          setPgs(processedData);
        } else {
          setAllPGs(prev => [...prev, ...processedData]);
          setPgs(prev => [...prev, ...processedData]);
        }
        
        setHasMore(false);
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error("Error loading PGs:", error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPGs(false);
    loadFavorites();
  }, []);

  useEffect(() => {
    if (userLocation && filters.nearMe) {
      setPage(1);
      loadPGs(false);
    }
  }, [userLocation]);

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
      setFavorites(new Set());
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
    const isFavorite = !newFavorites.has(pgId);
    
    if (newFavorites.has(pgId)) {
      newFavorites.delete(pgId);
      showNotification("Removed from favorites");
    } else {
      newFavorites.add(pgId);
      showNotification("Added to favorites");
    }
    
    trackEvent("favorite_click", {
      pg_id: pgId,
      favorite: isFavorite,
    });
    
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAllowLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(location);
        setFilters(prev => ({ ...prev, nearMe: true, sort: "distance" }));
        setShowLocationBanner(false);
        localStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, "true");
        showNotification("📍 Location detected! Showing nearby properties within 5km");
        setLocationLoading(false);
        setPage(1);
        loadPGs(false);
      },
      (error) => {
        console.error("Location error:", error);
        let errorMessage = "❌ Unable to get your location. ";
        if (error.code === 1) {
          errorMessage += "Please enable location permissions in your browser settings.";
        } else if (error.code === 2) {
          errorMessage += "Location unavailable. Please try again.";
        } else {
          errorMessage += "Please check your location settings.";
        }
        showNotification(errorMessage, true);
        setShowLocationBanner(false);
        localStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, "true");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDenyLocation = () => {
    setShowLocationBanner(false);
    localStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, "true");
    showNotification("You can enable location from the 'Near Me' button anytime", false);
  };

  const handleSearchClick = () => {
    trackEvent("search_click", {
      search_term: filters.location,
    });
  };

  const detectLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(location);
        setFilters(prev => ({ ...prev, nearMe: true, sort: "distance" }));
        showNotification("📍 Location detected! Showing nearby properties");
        setLocationLoading(false);
        setPage(1);
        loadPGs(false);
      },
      () => {
        showNotification("❌ Unable to get your location. Please check permissions.", true);
        setLocationLoading(false);
      }
    );
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];

    if (filters.location) {
      filtered = filtered.filter((pg) =>
        `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    filtered = filtered.filter(
      (pg) => {
        const rent = getEffectiveRent(pg);
        return rent >= filters.minBudget && rent <= filters.maxBudget;
      }
    );

    if (filters.food) filtered = filtered.filter((pg) => pg.food_available === true);
    if (filters.ac) filtered = filtered.filter((pg) => pg.ac_available === true);
    if (filters.wifi) filtered = filtered.filter((pg) => pg.wifi_available === true);
    if (filters.parking) filtered = filtered.filter((pg) => pg.parking_available === true);
    
    if (filters.foodType) {
      filtered = filtered.filter((pg) => pg.food_type === filters.foodType);
    }

    if (filters.sort === "low") {
      filtered.sort((a, b) => getEffectiveRent(a) - getEffectiveRent(b));
    } else if (filters.sort === "high") {
      filtered.sort((a, b) => getEffectiveRent(b) - getEffectiveRent(a));
    } else if (filters.sort === "new") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sort === "distance" && userLocation) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    setPgs(filtered);
  }, [allPGs, filters, userLocation]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleBudgetChange = (min, max) => {
    setFilters(prev => ({
      ...prev,
      minBudget: min,
      maxBudget: max
    }));
    
    trackEvent("filter_apply", {
      min_budget: min,
      max_budget: max,
    });
    
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
      sort: "",
      nearMe: false,
      foodType: ""
    });
    if (!userLocation) {
      setUserLocation(null);
    }
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
    trackEvent("contact_owner_click", {
      pg_id: pg.id,
      pg_name: pg.pg_name,
      category: pg.pg_category,
    });
    
    if (!user) {
      showNotification("Please register or login to contact owner");
      navigate("/login");
      return;
    }

    setBookingPG(pg);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (!user) {
        showNotification("Please register or login to continue");
        navigate("/register");
        return;
      }

      const token = await user.getIdToken(true);

      const payload = {
        room_type: bookingData.roomType
      };

      const res = await api.post(
        `/bookings/${bookingPG.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      trackEvent("contact_owner_success", {
        lead_id: res.data?.bookingId || res.data?.booking?.id,
        pg_id: bookingPG.id,
      });

      try {
        await api.post(
          "/whatsapp/send-booking-whatsapp",
          {
            ownerId: bookingPG.owner_id,
            userName: user.displayName || "Customer",
            userPhone: user.phoneNumber || "No Phone",
            propertyName: bookingPG.pg_name,
            area: bookingPG.area || bookingPG.city || "Location",
            rent: getEffectiveRent(bookingPG)
          }
        );
        console.log("✅ WhatsApp Sent To Owner");
      } catch (whatsappError) {
        console.log("❌ WhatsApp Error:", whatsappError.response?.data || whatsappError.message);
      }

      showNotification(res.data.message || "✅ Owner will contact you shortly");
      
      if (bookingPG.contact_phone) {
        setTimeout(() => {
          window.location.href = `tel:${bookingPG.contact_phone}`;
        }, 500);
      }
      
      setBookingPG(null);

    } catch (error) {
      console.log("CONTACT OWNER ERROR:", error.response?.data);
      
      if (
        error.response?.data?.message &&
        (error.response.data.message.includes("already") ||
         error.response.data.message.includes("already have"))
      ) {
        showNotification("📞 Connecting you directly to owner...");
        
        if (bookingPG.contact_phone) {
          setTimeout(() => {
            window.location.href = `tel:${bookingPG.contact_phone}`;
          }, 500);
        } else {
          showNotification("Owner phone number not available", true);
        }
        
        setBookingPG(null);
        return;
      }
      
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, true);
      } else {
        showNotification("❌ Something went wrong. Try again", true);
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
        showNotification("You can compare up to 3 properties at a time");
        return;
      }
    }
    
    setSelectedForCompare(newSelected);
  };

  const handleCompare = () => {
    if (selectedForCompare.size < 2) {
      showNotification("Please select at least 2 properties to compare");
      return;
    }
    setShowCompareModal(true);
  };

  const clearCompareSelections = () => {
    setSelectedForCompare(new Set());
  };

  if (authLoading) {
    return (
      <div style={{ padding: 20, maxWidth: 1400, margin: "auto", minHeight: "100vh", textAlign: "center", paddingTop: 100 }}>
        <div style={{ 
          width: 50, 
          height: 50, 
          border: "4px solid #e5e7eb",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ fontSize: 16, color: "#6b7280" }}>Loading authentication...</p>
      </div>
    );
  }
  
  return (
    <div style={{ 
      width: "100%", 
      overflowX: "hidden", 
      paddingLeft: 8, 
      paddingRight: 8, 
      boxSizing: "border-box",
      maxWidth: 1400, 
      margin: "auto", 
      minHeight: "100vh" 
    }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: notification.isError ? "#ef4444" : "#10b981",
          color: "white",
          padding: "12px 24px",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          zIndex: 4000,
          animation: "slideIn 0.3s ease",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          {notification.isError ? <X size={18} /> : <Check size={18} />}
          {notification.message}
        </div>
      )}

      {/* Location Permission Banner */}
      {showLocationBanner && (
        <LocationPermissionBanner
          onAllow={handleAllowLocation}
          onDeny={handleDenyLocation}
          isLoading={locationLoading}
        />
      )}

      {/* Hero Banner */}
      <HeroBanner />

      {/* PROMOTIONAL BANNERS SLIDER */}
      <PromoBannerSlider onBannerClick={handlePromoBannerClick} />

      {/* Location Info Bar */}
      {userLocation && filters.nearMe && (
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: 12,
          padding: "12px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          animation: "fadeIn 0.3s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Navigation size={20} color="white" />
            <div>
              <span style={{ color: "white", fontWeight: 600 }}>
                📍 Showing PGs near your location
              </span>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginLeft: 8 }}>
                Properties within 5km radius
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, nearMe: false, sort: "" }));
              showNotification("Location filter turned off");
            }}
            style={{
              padding: "6px 12px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <X size={14} />
            Clear
          </button>
        </div>
      )}

      {/* Modern Filter Bar */}
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        marginBottom: 20,
        border: "1px solid #e5e7eb",
        position: "sticky",
        top: 20,
        zIndex: 100
      }}>
        <div style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap"
        }}>
          <div style={{
            flex: 1,
            minWidth: 300,
            position: "relative",
            display: "flex",
            alignItems: "center"
          }}>
            <Search size={20} style={{ position: "absolute", left: 14, color: "#9ca3af" }} />
            <input
              placeholder="Search by area, city or property name..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              style={{
                width: "100%",
                padding: "14px 14px 14px 44px",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                fontSize: 15,
                background: "#f9fafb",
                transition: "all 0.2s"
              }}
            />
          </div>

          <button
            onClick={() => setShowBudgetFilter(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 20px",
              background: filters.minBudget > 0 || filters.maxBudget < 50000 ? "#10b981" : "#f3f4f6",
              color: filters.minBudget > 0 || filters.maxBudget < 50000 ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Sliders size={18} />
            Budget
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 20px",
              background: showFilters ? "#3b82f6" : "#f3f4f6",
              color: showFilters ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Filter size={18} />
            Filters
          </button>

          <button
            onClick={detectLocation}
            disabled={locationLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 20px",
              background: filters.nearMe ? "#f97316" : "#f3f4f6",
              color: filters.nearMe ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              cursor: locationLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {locationLoading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: "2px solid currentColor",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                Getting...
              </>
            ) : (
              <>
                <Navigation size={18} />
                Near Me
              </>
            )}
          </button>

          <button
            onClick={toggleCompareMode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 20px",
              background: compareMode ? "#8b5cf6" : "#f3f4f6",
              color: compareMode ? "#ffffff" : "#374151",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <BarChart size={18} />
            Compare
          </button>

          {compareMode && (
            <>
              <button
                onClick={handleCompare}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 20px",
                  background: selectedForCompare.size >= 2 ? "#10b981" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: selectedForCompare.size >= 2 ? "pointer" : "not-allowed",
                  transition: "all 0.2s"
                }}
                disabled={selectedForCompare.size < 2}
              >
                <Check size={18} />
                Compare ({selectedForCompare.size}/3)
              </button>
              
              {selectedForCompare.size > 0 && (
                <button
                  onClick={clearCompareSelections}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 20px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <X size={18} />
                  Clear
                </button>
              )}
            </>
          )}
        </div>

        {(filters.minBudget > 0 || filters.maxBudget < 50000) && (
          <div style={{
            padding: "10px 16px",
            background: "#f0fdf4",
            borderRadius: 10,
            marginBottom: 16,
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "fadeIn 0.3s ease",
            flexWrap: "wrap"
          }}>
            <TrendingUp size={16} color="#059669" />
            <span style={{ fontSize: 14, color: "#065f46", fontWeight: 500 }}>
              Budget: ₹{formatPrice(filters.minBudget)} - ₹{formatPrice(filters.maxBudget)}
            </span>
            <button
              onClick={() => handleBudgetChange(0, 50000)}
              style={{
                marginLeft: "auto",
                padding: "4px 12px",
                background: "transparent",
                color: "#ef4444",
                border: "1px solid #ef4444",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              Clear
            </button>
          </div>
        )}

        {showFilters && (
          <div style={{
            paddingTop: 20,
            borderTop: "1px solid #e5e7eb",
            animation: "fadeIn 0.3s ease"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
                Advanced Filters
              </h3>
              <button
                onClick={resetFilters}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: "transparent",
                  color: "#ef4444",
                  border: "1px solid #ef4444",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <X size={16} />
                Clear All
              </button>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20
            }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: 10,
                  color: "#4b5563",
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  Food Type
                </label>
                <select
                  value={filters.foodType}
                  onChange={(e) => setFilters({ ...filters, foodType: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    background: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  <option value="">Any Food Type</option>
                  <option value="veg">Vegetarian Only</option>
                  <option value="non-veg">Non-Vegetarian Only</option>
                  <option value="both">Both Available</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: "block",
                  marginBottom: 10,
                  color: "#4b5563",
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    background: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  <option value="">Relevance</option>
                  <option value="low">Rent: Low to High</option>
                  <option value="high">Rent: High to Low</option>
                  <option value="new">Newest First</option>
                  {userLocation && <option value="distance">Distance (Nearest First)</option>}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{
                  display: "block",
                  marginBottom: 10,
                  color: "#4b5563",
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  Amenities (Select multiple)
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background: filters.food ? "#10b981" : "#f3f4f6",
                    color: filters.food ? "#ffffff" : "#374151",
                    borderRadius: 20,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.food}
                      onChange={(e) => setFilters({ ...filters, food: e.target.checked })}
                      style={{ display: "none" }}
                    />
                    <Utensils size={14} />
                    Food Included
                  </label>

                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background: filters.ac ? "#3b82f6" : "#f3f4f6",
                    color: filters.ac ? "#ffffff" : "#374151",
                    borderRadius: 20,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.ac}
                      onChange={(e) => setFilters({ ...filters, ac: e.target.checked })}
                      style={{ display: "none" }}
                    />
                    <Snowflake size={14} />
                    AC Available
                  </label>

                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background: filters.wifi ? "#8b5cf6" : "#f3f4f6",
                    color: filters.wifi ? "#ffffff" : "#374151",
                    borderRadius: 20,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.wifi}
                      onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })}
                      style={{ display: "none" }}
                    />
                    <Wifi size={14} />
                    WiFi
                  </label>

                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    background: filters.parking ? "#f59e0b" : "#f3f4f6",
                    color: filters.parking ? "#ffffff" : "#374151",
                    borderRadius: 20,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.parking}
                      onChange={(e) => setFilters({ ...filters, parking: e.target.checked })}
                      style={{ display: "none" }}
                    />
                    <Car size={14} />
                    Parking
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 12
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
            {filters.nearMe ? "🏠 Properties Near You" : "🏠 Available Properties"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>
              {filters.minBudget > 0 && filters.maxBudget < 50000 && 
                ` within ₹${formatPrice(filters.minBudget)} - ₹${formatPrice(filters.maxBudget)}`}
              {filters.nearMe && userLocation && ` within 5km of your location`}
            </span>
          </div>
        </div>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            padding: "8px 16px",
            background: "#f3f4f6",
            color: "#374151",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          ↑ Top
        </button>
      </div>

      {/* Property Cards Grid - Using the new PGPropertyCard component */}
      {loading ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          color: "#6b7280",
          background: "#f9fafb",
          borderRadius: 16,
          border: "1px dashed #e5e7eb"
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ fontSize: 16 }}>Loading properties...</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {pgs.map((pg) => (
              <PGPropertyCard
                key={pg.id}
                pg={pg}
                onQuickView={handleQuickView}
                onFavorite={toggleFavorite}
                onContact={handleBookNow}
                onCardClick={handleCardClick}
                isFavorite={favorites.has(pg.id)}
                isSelectedForCompare={selectedForCompare.has(pg.id)}
                onSelectForCompare={toggleSelectForCompare}
                compareMode={compareMode}
                getImageUrl={getImageUrl}
              />
            ))}
          </div>

          {/* VIEW MORE BUTTON */}
          {!loading && pgs.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 50, marginBottom: 30 }}>
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding: "14px 28px",
                    background: loadingMore ? "#9ca3af" : "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    cursor: loadingMore ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingMore) e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {loadingMore ? "Loading more..." : "🔽 VIEW MORE PROPERTIES"}
                </button>
              ) : (
                <div style={{ 
                  padding: "20px", 
                  textAlign: "center", 
                  color: "#666",
                  borderTop: "1px solid #eee"
                }} />
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && pgs.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          color: "#6b7280",
          background: "#f9fafb",
          borderRadius: 16,
          border: "1px dashed #e5e7eb"
        }}>
          <Search size={48} style={{ margin: "0 auto 16px", color: "#9ca3af" }} />
          <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            No properties found
          </p>
          <p style={{ fontSize: 14, marginBottom: 24 }}>
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={resetFilters}
            style={{
              padding: "12px 24px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Modals */}
      {showBudgetFilter && (
        <BudgetFilter
          minBudget={filters.minBudget}
          maxBudget={filters.maxBudget}
          onBudgetChange={handleBudgetChange}
          onClose={() => setShowBudgetFilter(false)}
        />
      )}

      {quickViewPG && (
        <QuickViewModal
          pg={quickViewPG}
          onClose={() => setQuickViewPG(null)}
          onBook={handleBookNow}
          onSaveFavorite={handleSaveFavorite}
        />
      )}

      <BookingModal
        pg={bookingPG}
        onClose={() => setBookingPG(null)}
        onBook={handleBookingSubmit}
      />

      {showCompareModal && (
        <CompareModal
          selectedPGs={selectedForCompare}
          allPGs={allPGs}
          onClose={() => {
            setShowCompareModal(false);
            setSelectedForCompare(new Set());
            setCompareMode(false);
          }}
        />
      )}

      {/* Sticky Contact Button for Mobile */}
      {isMobile && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          padding: 12,
          zIndex: 999,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
          borderTop: "1px solid #e5e7eb"
        }}>
          <button
            onClick={() => {
              if (pgs.length > 0) {
                handleBookNow(pgs[0]);
              } else {
                showNotification("No properties available to contact");
              }
            }}
            style={{
              width: "100%",
              padding: "14px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <MessageCircle size={18} />
            Contact Owner
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .hero-section {
            padding: 25px 20px !important;
          }
          .hero-title {
            font-size: 34px !important;
            line-height: 44px !important;
          }
          .hero-badges {
            justify-content: flex-start !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default UserPGSearch;