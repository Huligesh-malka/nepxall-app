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
  Wrench
} from "lucide-react";
import api from "../api/api";

import { useInstallPrompt } from "../hooks/useInstallPrompt";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

// Key for localStorage to track if location permission was asked
const LOCATION_PERMISSION_ASKED_KEY = "nepxall_location_permission_asked";

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

/* ================= BOOKING MODAL COMPONENT ================= */
const BookingModal = ({ pg, onClose, onBook }) => {
  const [bookingData, setBookingData] = useState({
    checkInDate: "",
    roomType: ""
  });
  
  const [loading, setLoading] = useState(false);

  // Get tomorrow's date for min date
  const getTomorrowDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set default check-in date to tomorrow
  useEffect(() => {
    const defaultRoomType = getDefaultRoomType();
    const tomorrowDate = getTomorrowDate();
    setBookingData({
      checkInDate: tomorrowDate, // Set to tomorrow by default
      roomType: defaultRoomType || ""
    });
  }, [pg]);

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

  const getMaxDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + 6);
    const year = max.getFullYear();
    const month = String(max.getMonth() + 1).padStart(2, '0');
    const day = String(max.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  const tomorrowDate = getTomorrowDate();

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
            🏠 Book {pg.pg_name}
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: "#6b7280",
            marginBottom: 24 
          }}>
            Your details will be auto-filled from your profile
          </p>

          <div style={{
            background: "#fff7ed",
            padding: 12,
            borderRadius: 8,
            marginBottom: 15,
            fontSize: 13,
            color: "#9a3412",
            border: "1px solid #fed7aa"
          }}>
            ⚠️ You can only request this PG once every 24 hours
          </div>

          {pg.min_stay_months && pg.min_stay_months > 0 && (
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

          {pg.notice_period && pg.notice_period > 0 && (
            <div style={{
              background: "#fef3c7",
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
              fontSize: 13,
              color: "#92400e",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <Bell size={16} />
              Notice Period: {pg.notice_period} month{pg.notice_period > 1 ? 's' : ''}
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
                Check-in Date *
              </label>
              <input
                type="date"
                name="checkInDate"
                value={bookingData.checkInDate}
                onChange={handleInputChange}
                required
                min={tomorrowDate}
                max={getMaxDate()}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  fontSize: 14,
                  background: "#f9fafb"
                }}
              />
              <p style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 4
              }}>
                Earliest check-in: {new Date(tomorrowDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (24h notice required)
              </p>
            </div>

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
                  Booking Information
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#065f46", fontSize: 13 }}>
                <li>You'll receive confirmation via email/SMS</li>
                <li>Owner will contact you within 24 hours</li>
                {pg.min_stay_months > 0 && (
                  <li>Minimum {pg.min_stay_months} month{pg.min_stay_months > 1 ? 's' : ''} stay required</li>
                )}
                {pg.notice_period > 0 && (
                  <li>{pg.notice_period} month{pg.notice_period > 1 ? 's' : ''} notice period for move-out</li>
                )}
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
                  background: loading ? "#9ca3af" : "#10b981",
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

/* ================= MAIN COMPONENT ================= */
function UserPGSearch() {
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
      notice_period: Number(pg.notice_period) || 0,
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
    if (!user) {
      showNotification("Please register or login to book this property");
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
        check_in_date: bookingData.checkInDate,
        room_type: bookingData.roomType
      };

      const res = await api.post(
        `/bookings/${bookingPG.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data?.alreadyBooked) {
        showNotification(res.data.message);
        setBookingPG(null);
        return;
      }

      showNotification(res.data.message || "✅ Booking request sent to owner");
      setBookingPG(null);

    } catch (error) {
      console.log("BOOKING ERROR:", error.response?.data);

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

  const formatCardPrice = (value) => {
    if (value === null || value === undefined || value === 0) {
      return "0";
    }
    try {
      return formatPrice(value);
    } catch (error) {
      return value.toString();
    }
  };

  const getPriceRangeDisplay = (pg) => {
    const range = getPriceRangeByType(pg);
    if (range.min === 0 && range.max === 0) return "Price on request";
    
    if (range.min === range.max) {
      return `₹${formatCardPrice(range.min)}`;
    }
    
    return `₹${formatCardPrice(range.min)} – ₹${formatCardPrice(range.max)}`;
  };

  const getCardQuickInfo = (pg) => {
    const info = [];
    
    if (pg.pg_category === "to_let") {
      if (pg.price_1bhk > 0) info.push({ 
        icon: <Building size={12} />, 
        label: "1BHK", 
        value: `₹${formatCardPrice(pg.price_1bhk)}`,
        color: "#f97316" 
      });
      if (pg.price_2bhk > 0) info.push({ 
        icon: <Building size={12} />, 
        label: "2BHK", 
        value: `₹${formatCardPrice(pg.price_2bhk)}`,
        color: "#f59e0b" 
      });
      if (pg.bhk_type) info.push({ 
        icon: <Hash size={12} />, 
        label: "Type", 
        value: `${pg.bhk_type}BHK`,
        color: "#0ea5e9" 
      });
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room > 0) info.push({ 
        icon: <UserCheck size={12} />, 
        label: "Single", 
        value: `₹${formatCardPrice(pg.co_living_single_room)}`,
        color: "#8b5cf6" 
      });
      if (pg.co_living_double_room > 0) info.push({ 
        icon: <Users size={12} />, 
        label: "Double", 
        value: `₹${formatCardPrice(pg.co_living_double_room)}`,
        color: "#a855f7" 
      });
      if (pg.coliving_three_sharing > 0) info.push({ 
        icon: <Hash size={12} />, 
        label: "3-Sharing", 
        value: `₹${formatCardPrice(pg.coliving_three_sharing)}`,
        color: "#c084fc" 
      });
      if (pg.coliving_four_sharing > 0) info.push({ 
        icon: <Building size={12} />, 
        label: "4-Sharing", 
        value: `₹${formatCardPrice(pg.coliving_four_sharing)}`,
        color: "#e879f9" 
      });
      if (pg.co_living_food_included) info.push({ 
        icon: <Utensils size={12} />, 
        label: "Food", 
        value: "Included",
        color: "#10b981" 
      });
    } else {
      if (pg.single_sharing > 0) info.push({ 
        icon: <UserCheck size={12} />, 
        label: "Single", 
        value: `₹${formatCardPrice(pg.single_sharing)}`,
        color: "#10b981" 
      });
      if (pg.double_sharing > 0) info.push({ 
        icon: <Users size={12} />, 
        label: "Double", 
        value: `₹${formatCardPrice(pg.double_sharing)}`,
        color: "#3b82f6" 
      });
      if (pg.triple_sharing > 0) info.push({ 
        icon: <Hash size={12} />, 
        label: "3-Sharing", 
        value: `₹${formatCardPrice(pg.triple_sharing)}`,
        color: "#8b5cf6" 
      });
      if (pg.four_sharing > 0) info.push({ 
        icon: <Building size={12} />, 
        label: "4-Sharing", 
        value: `₹${formatCardPrice(pg.four_sharing)}`,
        color: "#f97316" 
      });
      if (pg.single_room > 0) info.push({ 
        icon: <DoorOpen size={12} />, 
        label: "Room", 
        value: `₹${formatCardPrice(pg.single_room)}`,
        color: "#0ea5e9" 
      });
    }
    
    if (pg.food_available) info.push({ 
      icon: pg.food_type === 'veg' ? <Leaf size={12} /> : <Flame size={12} />, 
      label: "Food", 
      value: pg.food_type === 'veg' ? 'Veg' : 'Non-Veg',
      color: pg.food_type === 'veg' ? '#10b981' : '#ef4444' 
    });
    
    if (pg.ac_available) info.push({ 
      icon: <Snowflake size={12} />, 
      label: "AC", 
      value: "Yes",
      color: "#3b82f6" 
    });
    
    if (pg.min_stay_months > 0) info.push({
      icon: <Calendar size={12} />,
      label: "Min Stay",
      value: `${pg.min_stay_months}m`,
      color: "#8b5cf6"
    });
    
    return info.slice(0, 3);
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
    <div style={{ padding: 20, maxWidth: 1400, margin: "auto", minHeight: "100vh" }}>
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
              {pgs.length} properties found
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

      {/* Property Cards */}
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
            {pgs.map((pg) => {
              const cardQuickInfo = getCardQuickInfo(pg);
              const priceRange = getPriceRangeDisplay(pg);
              const depositAmount = pg.deposit_amount || pg.security_deposit || 0;
              const isSelectedForCompare = selectedForCompare.has(pg.id);
              
              return (
                <div
                  key={pg.id}
                  onClick={() => handleCardClick(pg)}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: isSelectedForCompare ? "2px solid #8b5cf6" : "1px solid #e5e7eb",
                    position: "relative"
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
                  {compareMode && (
                    <button
                      onClick={(e) => toggleSelectForCompare(pg.id, e)}
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

                  <button
                    onClick={(e) => handleQuickView(pg, e)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: compareMode ? 12 : 12,
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

                  <button
                    onClick={(e) => toggleFavorite(pg.id, e)}
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
                      fill={favorites.has(pg.id) ? "#ef4444" : "none"}
                    />
                  </button>

                  <div style={{ position: "relative" }}>
                    <img
                      src={getImageUrl(pg)}
                      alt={pg.pg_name}
                      style={{ width: "100%", height: 200, objectFit: "cover" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/no-image.png";
                      }}
                    />
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
                  </div>

                  <div style={{ padding: 20 }}>
                    <h3 style={{ 
                      fontSize: 18, 
                      fontWeight: 600, 
                      color: "#111827",
                      marginBottom: 4 
                    }}>
                      {pg.pg_name}
                    </h3>

                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      marginBottom: 12,
                      color: "#4b5563" 
                    }}>
                      <MapPin size={14} />
                      <span style={{ fontSize: 14 }}>
                        {pg.area}
                        {pg.city ? `, ${pg.city}` : ""}
                      </span>
                    </div>

                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: 12,
                      background: "#f0f9ff",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #bae6fd"
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: 16, 
                          fontWeight: 600, 
                          color: "#0369a1",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}>
                          <DollarSign size={16} />
                          {priceRange}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          Price Range
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, color: "#4b5563" }}>
                          Deposit
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                          ₹{formatCardPrice(depositAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Min Stay Badge */}
                    {pg.min_stay_months > 0 && (
                      <div style={{
                        marginBottom: 12,
                        padding: "6px 10px",
                        background: "#f3e8ff",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <Calendar size={12} color="#8b5cf6" />
                        <span style={{ fontSize: 12, color: "#6d28d9", fontWeight: 500 }}>
                          Min {pg.min_stay_months} month{pg.min_stay_months > 1 ? 's' : ''} stay
                        </span>
                      </div>
                    )}

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      marginBottom: 12
                    }}>
                      {cardQuickInfo.map((item, index) => (
                        <div 
                          key={index}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            padding: "8px 4px",
                            background: `${item.color}10`,
                            borderRadius: 8,
                            textAlign: "center"
                          }}
                        >
                          <div style={{ color: item.color }}>
                            {item.icon}
                          </div>
                          <div style={{ 
                            fontSize: 10, 
                            fontWeight: 500,
                            color: "#4b5563"
                          }}>
                            {item.label}
                          </div>
                          <div style={{ 
                            fontSize: 11, 
                            fontWeight: 600,
                            color: item.color
                          }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid #e5e7eb"
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookNow(pg);
                        }}
                        style={{
                          flex: 2,
                          padding: "10px 16px",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#059669";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#10b981";
                        }}
                      >
                        <BookOpen size={16} />
                        Book Now
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(pg);
                        }}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
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
                        <Info size={16} />
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                }}>
                  ✨ You've seen all {pgs.length} properties ✨
                </div>
              )}
              
              <p style={{ 
                marginTop: 15, 
                fontSize: 14, 
                color: "#666",
                fontWeight: "500"
              }}>
                Showing {pgs.length} properties
              </p>
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

      {bookingPG && (
        <BookingModal
          pg={bookingPG}
          onClose={() => setBookingPG(null)}
          onBook={handleBookingSubmit}
        />
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