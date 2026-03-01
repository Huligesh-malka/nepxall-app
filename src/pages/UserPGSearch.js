import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

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
  Coins
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

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

// FIXED: Helper function to get correct image URL
const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  
  // If it's already a full URL
  if (photo.startsWith('http')) {
    return photo;
  }
  
  // If it's a path containing /uploads/
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BACKEND_URL}${relativePath}`;
    }
  }
  
  // If it's a path starting with /opt/render
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) {
      return `${BACKEND_URL}${uploadsMatch[0]}`;
    }
  }
  
  // Default: prepend backend URL
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

/* ================= HELPER: GET PRICE RANGE BY PROPERTY TYPE ================= */
const getPriceRangeByType = (pg) => {
  const prices = [];
  
  if (pg.pg_category === "pg") {
    // PG prices
    if (pg.single_sharing > 0) prices.push(pg.single_sharing);
    if (pg.double_sharing > 0) prices.push(pg.double_sharing);
    if (pg.triple_sharing > 0) prices.push(pg.triple_sharing);
    if (pg.four_sharing > 0) prices.push(pg.four_sharing);
    if (pg.single_room > 0) prices.push(pg.single_room);
    if (pg.double_room > 0) prices.push(pg.double_room);
  } else if (pg.pg_category === "coliving") {
    // Co-Living prices
    if (pg.co_living_single_room > 0) prices.push(pg.co_living_single_room);
    if (pg.co_living_double_room > 0) prices.push(pg.co_living_double_room);
  } else if (pg.pg_category === "to_let") {
    // To-Let prices
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
    pg.single_room ||
    pg.co_living_single_room ||
    pg.co_living_double_room ||
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

  // Predefined budget ranges
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
        {/* Close Button */}
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

          {/* Quick Budget Ranges */}
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

          {/* Custom Range */}
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

            {/* Input Fields */}
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

          {/* Action Buttons */}
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
    name: "",
    phone: "",
    checkInDate: "",
    roomType: pg.single_sharing ? "Single Sharing" : "Single Room"
  });

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
    
    if (pg.pg_category === "pg") {
      if (pg.single_sharing) types.push({ 
        value: "Single Sharing", 
        label: `Single Sharing - ₹${formatPrice(pg.single_sharing)}` 
      });
      if (pg.double_sharing) types.push({ 
        value: "Double Sharing", 
        label: `Double Sharing - ₹${formatPrice(pg.double_sharing)}` 
      });
      if (pg.triple_sharing) types.push({ 
        value: "Triple Sharing", 
        label: `Triple Sharing - ₹${formatPrice(pg.triple_sharing)}` 
      });
      if (pg.four_sharing) types.push({ 
        value: "Four Sharing", 
        label: `Four Sharing - ₹${formatPrice(pg.four_sharing)}` 
      });
      if (pg.single_room) types.push({ 
        value: "Single Room", 
        label: `Single Room - ₹${formatPrice(pg.single_room)}` 
      });
      if (pg.double_room) types.push({ 
        value: "Double Room", 
        label: `Double Room - ₹${formatPrice(pg.double_room)}` 
      });
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room) types.push({ 
        value: "Co-Living Single Room", 
        label: `Co-Living Single Room - ₹${formatPrice(pg.co_living_single_room)}` 
      });
      if (pg.co_living_double_room) types.push({ 
        value: "Co-Living Double Room", 
        label: `Co-Living Double Room - ₹${formatPrice(pg.co_living_double_room)}` 
      });
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk) types.push({ 
        value: "1 BHK", 
        label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` 
      });
      if (pg.price_2bhk) types.push({ 
        value: "2 BHK", 
        label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` 
      });
      if (pg.price_3bhk) types.push({ 
        value: "3 BHK", 
        label: `3 BHK - ₹${formatPrice(pg.price_3bhk)}` 
      });
      if (pg.price_4bhk) types.push({ 
        value: "4 BHK", 
        label: `4 BHK - ₹${formatPrice(pg.price_4bhk)}` 
      });
    }
    
    return types;
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
            marginBottom: 8 
          }}>
            🏠 Book {pg.pg_name}
          </h2>
          <p style={{ 
            fontSize: 14, 
            color: "#6b7280",
            marginBottom: 24 
          }}>
            Fill in your details to book this property
          </p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#374151"
              }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={bookingData.name}
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
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#374151"
              }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={bookingData.phone}
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
                placeholder="Enter your phone number"
              />
            </div>

            {/* Check-in Date */}
            <div style={{ marginBottom: 20 }}>
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
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  fontSize: 14,
                  background: "#f9fafb"
                }}
              />
            </div>

            {/* Room Type */}
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
                {getRoomTypes().map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
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
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: "14px",
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
                  gap: 8
                }}
              >
                <BookOpen size={18} />
                Submit Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ================= QUICK VIEW MODAL COMPONENT ================= */
const QuickViewModal = ({ pg, onClose, onBook, onSaveFavorite }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const getImages = () => {
    const images = [];
    if (Array.isArray(pg.photos) && pg.photos.length) {
      images.push(...pg.photos.map(photo => getCorrectImageUrl(photo)));
    }
    if (images.length === 0) {
      images.push("https://via.placeholder.com/600x400?text=No+Images+Available");
    }
    return images;
  };

  const images = getImages();

  const toggleFavorite = () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    onSaveFavorite(pg.id, newState);
  };

  const handleShare = () => {
    setShowShareOptions(!showShareOptions);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getTypeColor = () => {
    if (pg.pg_category === "to_let") return "#f97316";
    if (pg.pg_category === "coliving") return "#8b5cf6";
    if (pg.pg_type === "boys") return "#16a34a";
    if (pg.pg_type === "girls") return "#db2777";
    return "#3b82f6";
  };

  const getTypeLabel = () => {
    if (pg.pg_category === "to_let") return "🏠 To-Let Home";
    if (pg.pg_category === "coliving") return "🤝 Co-Living";
    if (pg.pg_type === "boys") return "👨 Boys PG";
    if (pg.pg_type === "girls") return "👩 Girls PG";
    return "🏢 PG/Hostel";
  };

  const hasFacility = (facility) => {
    return pg[facility] === true || pg[facility] === 1 || pg[facility] === "true";
  };

  const renderRoomAmenities = () => {
    const roomAmenities = [];
    
    if (pg.cupboard_available) roomAmenities.push({ 
      icon: <DoorOpen size={16} />, 
      label: "Cupboard/Wardrobe", 
      color: "#8b5cf6" 
    });
    if (pg.table_chair_available) roomAmenities.push({ 
      icon: <Coffee size={16} />, 
      label: "Study Table & Chair", 
      color: "#f59e0b" 
    });
    if (pg.attached_bathroom) roomAmenities.push({ 
      icon: <Bath size={16} />, 
      label: "Attached Bathroom", 
      color: "#0ea5e9" 
    });
    if (pg.balcony_available) roomAmenities.push({ 
      icon: <Sun size={16} />, 
      label: "Balcony", 
      color: "#10b981" 
    });
    if (pg.dining_table_available) roomAmenities.push({ 
      icon: <Utensils size={16} />, 
      label: "Dining Table", 
      color: "#ec4899" 
    });
    
    if (pg.wall_mounted_clothes_hook) roomAmenities.push({ 
      icon: <Key size={16} />, 
      label: "Wall-mounted Clothes Hook", 
      color: "#6b7280" 
    });
    if (pg.bed_with_mattress) roomAmenities.push({ 
      icon: <Bed size={16} />, 
      label: "Bed with Mattress", 
      color: "#3b82f6" 
    });
    if (pg.fan_light) roomAmenities.push({ 
      icon: <Zap size={16} />, 
      label: "Fan & Light", 
      color: "#f97316" 
    });
    if (pg.kitchen_room) roomAmenities.push({ 
      icon: <Flame size={16} />, 
      label: "Kitchen Room", 
      color: "#ef4444" 
    });
    
    if (pg.pg_category === "to_let" && pg.furnishing_type) {
      roomAmenities.push({ 
        icon: <Sofa size={16} />, 
        label: `Furnishing: ${pg.furnishing_type.replace('_', ' ').toUpperCase()}`, 
        color: "#f59e0b" 
      });
    }
    
    return roomAmenities;
  };

  const getPriceDetails = () => {
    const priceDetails = [];
    
    if (pg.pg_category === "pg") {
      if (pg.single_sharing && pg.single_sharing > 0) priceDetails.push({ 
        label: "Single Sharing", 
        value: `₹${formatPrice(pg.single_sharing)}`,
        icon: <UserCheck size={16} />,
        color: "#10b981"
      });
      if (pg.double_sharing && pg.double_sharing > 0) priceDetails.push({ 
        label: "Double Sharing", 
        value: `₹${formatPrice(pg.double_sharing)}`,
        icon: <Users size={16} />,
        color: "#3b82f6"
      });
      if (pg.triple_sharing && pg.triple_sharing > 0) priceDetails.push({ 
        label: "Triple Sharing", 
        value: `₹${formatPrice(pg.triple_sharing)}`,
        icon: <Hash size={16} />,
        color: "#8b5cf6"
      });
      if (pg.four_sharing && pg.four_sharing > 0) priceDetails.push({ 
        label: "Four Sharing", 
        value: `₹${formatPrice(pg.four_sharing)}`,
        icon: <Building size={16} />,
        color: "#f97316"
      });
      if (pg.single_room && pg.single_room > 0) priceDetails.push({ 
        label: "Single Room", 
        value: `₹${formatPrice(pg.single_room)}`,
        icon: <DoorOpen size={16} />,
        color: "#0ea5e9"
      });
      if (pg.double_room && pg.double_room > 0) priceDetails.push({ 
        label: "Double Room", 
        value: `₹${formatPrice(pg.double_room)}`,
        icon: <DoorOpen size={16} />,
        color: "#ec4899"
      });
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room && pg.co_living_single_room > 0) priceDetails.push({ 
        label: "Co-Living Single Room", 
        value: `₹${formatPrice(pg.co_living_single_room)}`,
        icon: <Users size={16} />,
        color: "#8b5cf6"
      });
      if (pg.co_living_double_room && pg.co_living_double_room > 0) priceDetails.push({ 
        label: "Co-Living Double Room", 
        value: `₹${formatPrice(pg.co_living_double_room)}`,
        icon: <Users size={16} />,
        color: "#a855f7"
      });
      
      if (pg.co_living_food_included) priceDetails.push({ 
        label: "Food Included", 
        value: "Yes",
        icon: <Utensils size={16} />,
        color: "#10b981"
      });
      if (pg.co_living_wifi_included) priceDetails.push({ 
        label: "WiFi Included", 
        value: "Yes",
        icon: <Wifi size={16} />,
        color: "#3b82f6"
      });
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk && pg.price_1bhk > 0) priceDetails.push({ 
        label: "1 BHK", 
        value: `₹${formatPrice(pg.price_1bhk)}`,
        icon: <Building size={16} />,
        color: "#f97316"
      });
      if (pg.price_2bhk && pg.price_2bhk > 0) priceDetails.push({ 
        label: "2 BHK", 
        value: `₹${formatPrice(pg.price_2bhk)}`,
        icon: <Building size={16} />,
        color: "#f59e0b"
      });
      if (pg.price_3bhk && pg.price_3bhk > 0) priceDetails.push({ 
        label: "3 BHK", 
        value: `₹${formatPrice(pg.price_3bhk)}`,
        icon: <Building size={16} />,
        color: "#eab308"
      });
      if (pg.price_4bhk && pg.price_4bhk > 0) priceDetails.push({ 
        label: "4 BHK", 
        value: `₹${formatPrice(pg.price_4bhk)}`,
        icon: <Building size={16} />,
        color: "#d97706"
      });
      
      if (pg.bedrooms_1bhk) priceDetails.push({ 
        label: "1 BHK - Bedrooms", 
        value: `${pg.bedrooms_1bhk}`,
        icon: <Bed size={16} />,
        color: "#0ea5e9"
      });
      if (pg.bathrooms_1bhk) priceDetails.push({ 
        label: "1 BHK - Bathrooms", 
        value: `${pg.bathrooms_1bhk}`,
        icon: <Bath size={16} />,
        color: "#06b6d4"
      });
    }
    
    if (pg.deposit_amount && pg.deposit_amount > 0) {
      priceDetails.push({ 
        label: "Deposit Amount", 
        value: `₹${formatPrice(pg.deposit_amount)}`,
        icon: <Shield size={16} />,
        color: "#f59e0b"
      });
    }
    
    if (pg.security_deposit && pg.security_deposit > 0) {
      priceDetails.push({ 
        label: "Security Deposit", 
        value: `₹${formatPrice(pg.security_deposit)}`,
        icon: <Shield size={16} />,
        color: "#f59e0b"
      });
    }
    
    if (pg.maintenance_amount && pg.maintenance_amount > 0) {
      priceDetails.push({ 
        label: "Maintenance", 
        value: `₹${formatPrice(pg.maintenance_amount)}/month`,
        icon: <Wrench size={16} />,
        color: "#6b7280"
      });
    }
    
    return priceDetails;
  };

  const getQuickInfo = () => {
    const quickInfo = [];
    
    quickInfo.push({ 
      label: "Property Type", 
      value: getTypeLabel().replace(/[^\w\s]/g, ''),
      icon: <Home size={16} />,
      color: getTypeColor()
    });
    
    if (pg.available_rooms !== undefined && pg.available_rooms !== null) {
      quickInfo.push({ 
        label: "Available", 
        value: `${pg.available_rooms || 0} / ${pg.total_rooms || "N/A"}`,
        icon: <DoorOpen size={16} />,
        color: "#3b82f6"
      });
    }
    
    if ((pg.pg_category === "pg" || pg.pg_category === "coliving") && hasFacility("food_available")) {
      const foodLabel = pg.food_type === 'veg' ? "Vegetarian" : 
                       pg.food_type === 'non-veg' ? "Non-Vegetarian" : 
                       pg.food_type === 'both' ? "Veg & Non-Veg" : "Food Included";
      const foodIcon = pg.food_type === 'veg' ? <Leaf size={16} /> : 
                      pg.food_type === 'non-veg' ? <Flame size={16} /> : 
                      <Utensils size={16} />;
      quickInfo.push({ 
        label: "Food", 
        value: foodLabel,
        icon: foodIcon,
        color: pg.food_type === 'veg' ? '#10b981' : 
               pg.food_type === 'non-veg' ? '#ef4444' : '#f97316'
      });
    }
    
    if (pg.pg_category === "to_let" && pg.bhk_type) {
      quickInfo.push({ 
        label: "BHK Type", 
        value: `${pg.bhk_type} BHK`,
        icon: <Building size={16} />,
        color: "#f97316"
      });
    }
    
    if (pg.min_stay_months && pg.min_stay_months > 0) {
      quickInfo.push({ 
        label: "Min. Stay", 
        value: `${pg.min_stay_months} months`,
        icon: <Calendar size={16} />,
        color: "#8b5cf6"
      });
    }
    
    if (pg.notice_period) {
      quickInfo.push({ 
        label: "Notice Period", 
        value: `${pg.notice_period} month${pg.notice_period > 1 ? 's' : ''}`,
        icon: <Bell size={16} />,
        color: "#6b7280"
      });
    }
    
    return quickInfo;
  };

  const quickInfoItems = getQuickInfo();
  const priceDetails = getPriceDetails();
  const roomAmenities = renderRoomAmenities();

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
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 1000,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          gap: 8,
          zIndex: 100
        }}>
          <button
            onClick={toggleFavorite}
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "none",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              size={20} 
              color="#ef4444" 
              fill={isFavorite ? "#ef4444" : "none"}
            />
          </button>
          
          <button
            onClick={handleShare}
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "none",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
            title="Share property"
          >
            <Share2 size={20} />
          </button>
          
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "none",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {showShareOptions && (
          <div style={{
            position: "absolute",
            top: 70,
            right: 16,
            background: "#ffffff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            zIndex: 101,
            animation: "slideDown 0.2s ease"
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Share Property</h4>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => window.open(`https://wa.me/?text=Check out this property: ${window.location.origin}/pg/${pg.id}`, '_blank')}
                style={{
                  padding: "8px 12px",
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/pg/${pg.id}`)}
                style={{
                  padding: "8px 12px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Copy size={14} />
                Copy Link
              </button>
            </div>
          </div>
        )}

        <div style={{ position: "relative", height: 300 }}>
          <img
            src={images[currentImageIndex]}
            alt={`${pg.pg_name} - Image ${currentImageIndex + 1}`}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover" 
            }}
            onError={(e) => {
              console.error("Image failed to load:", images[currentImageIndex]);
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/600x400?text=Image+Not+Found";
            }}
          />
          
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 16,
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.9)",
                  border: "none",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextImage}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 16,
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.9)",
                  border: "none",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                <ChevronRight size={24} />
              </button>
              <div style={{
                position: "absolute",
                bottom: 16,
                right: 16,
                background: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 500
              }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          <div style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: getTypeColor(),
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            {getTypeLabel()}
          </div>
        </div>

        <div style={{ padding: 30 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20
          }}>
            <div>
              <h2 style={{ 
                fontSize: 28, 
                fontWeight: 700, 
                color: "#111827",
                marginBottom: 8 
              }}>
                {pg.pg_name}
                {pg.is_verified && (
                  <span style={{
                    marginLeft: 12,
                    fontSize: 14,
                    color: "#10b981",
                    background: "#f0fdf4",
                    padding: "4px 10px",
                    borderRadius: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    <Shield size={12} />
                    Verified
                  </span>
                )}
              </h2>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                marginBottom: 12,
                color: "#4b5563" 
              }}>
                <MapPin size={18} />
                <span style={{ fontSize: 16 }}>
                  {pg.address || `${pg.area}, ${pg.city}, ${pg.state}`}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#111827" }}>
                ₹{formatPrice(getEffectiveRent(pg))}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                per month
              </div>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr 1fr",
            gap: 30,
            marginBottom: 30
          }}>
            <div>
              <div style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}>
                <h4 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <Info size={16} />
                  Quick Info
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {quickInfoItems.slice(0, 8).map((item, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: index < Math.min(quickInfoItems.length - 1, 7) ? "1px solid #e5e7eb" : "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8, 
                          background: `${item.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: item.color
                        }}>
                          {item.icon}
                        </div>
                        <span style={{ fontSize: 14, color: "#4b5563" }}>{item.label}</span>
                      </div>
                      <span style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: item.color || "#111827" 
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 16,
                padding: 24,
                color: "white",
                marginTop: 20
              }}>
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 700,
                  marginBottom: 16 
                }}>
                  ⚡ Instant Booking
                </h3>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Available Rooms</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>
                    {pg.available_rooms || 0}
                    <span style={{ fontSize: 16, opacity: 0.9 }}> / {pg.total_rooms || "N/A"}</span>
                  </div>
                </div>
                <button
                  onClick={() => onBook(pg)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "white",
                    color: "#667eea",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(255,255,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  🏠 Book Now
                </button>
              </div>
            </div>

            <div>
              <div style={{
                background: "#f0fdf4",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #bbf7d0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                marginBottom: 20
              }}>
                <h4 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#166534"
                }}>
                  <DollarSign size={16} />
                  Price Details
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {priceDetails.slice(0, 8).map((item, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: index < Math.min(priceDetails.length - 1, 7) ? "1px solid #bbf7d0" : "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8, 
                          background: `${item.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: item.color
                        }}>
                          {item.icon}
                        </div>
                        <span style={{ fontSize: 14, color: "#374151" }}>{item.label}</span>
                      </div>
                      <span style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: item.color || "#166534" 
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}>
                <h4 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#374151"
                }}>
                  <Info size={16} />
                  Description
                </h4>
                <p style={{ 
                  fontSize: 14, 
                  color: "#4b5563",
                  lineHeight: "1.6",
                  maxHeight: "200px",
                  overflowY: "auto",
                  paddingRight: "8px"
                }}>
                  {pg.description || "No description available."}
                </p>
              </div>
            </div>

            <div>
              <div style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}>
                <h4 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <Bed size={16} />
                  Room Amenities
                </h4>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 10
                }}>
                  {roomAmenities.length > 0 ? (
                    roomAmenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          background: `${amenity.color}10`,
                          borderRadius: 10,
                          fontSize: 14,
                          color: amenity.color,
                          fontWeight: 500
                        }}
                      >
                        {amenity.icon}
                        {amenity.label}
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: 14,
                      background: "#f3f4f6",
                      borderRadius: 8
                    }}>
                      No room amenities listed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: "flex",
            gap: 16,
            paddingTop: 20,
            borderTop: "1px solid #e5e7eb"
          }}>
            <button
              onClick={() => onBook(pg)}
              style={{
                flex: 2,
                padding: "16px 24px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(16, 185, 129, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <BookOpen size={20} />
              Book Now
            </button>
            
            <button
              onClick={() => window.open(`/pg/${pg.id}`, '_blank')}
              style={{
                flex: 1,
                padding: "16px 24px",
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
                gap: 12,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Eye size={20} />
              View Details
            </button>
            
            {pg.latitude && pg.longitude && (
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`, '_blank')}
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(139, 92, 246, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Map size={20} />
                View Map
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add missing Wrench icon component
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
                            e.target.src = "https://via.placeholder.com/400x200/6b7280/ffffff?text=No+Image";
                          }}
                        />
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

/* ================= MAIN COMPONENT ================= */
function UserPGSearch() {
  const navigate = useNavigate();

  const [allPGs, setAllPGs] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);

  // Property Type Filter State
  const [propertyType, setPropertyType] = useState("all");

  // Compare Feature State
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

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    loadPGs();
    loadFavorites();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPGs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pg/search/advanced");
      const data = res.data?.success ? res.data.data : [];
      
      const processedData = data.map(pg => ({
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
        security_deposit: Number(pg.security_deposit) || 0,
        maintenance_amount: Number(pg.maintenance_amount) || 0,
        available_rooms: Number(pg.available_rooms) || 0,
        total_rooms: Number(pg.total_rooms) || 0,
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
      
      setAllPGs(processedData);
      setPgs(processedData);
    } catch (error) {
      console.error("Error loading PGs:", error);
      setAllPGs([]);
      setPgs([]);
    } finally {
      setLoading(false);
    }
  };

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

  /* ================= FAVORITES HANDLING ================= */
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

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  /* ================= LOCATION DETECTION ================= */
  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(location);
        setFilters(prev => ({ ...prev, nearMe: true }));
        showNotification("📍 Location detected! Showing nearby properties");
      },
      () => {
        showNotification("❌ Unable to get your location. Please check permissions.");
      }
    );
  };

  /* ================= FILTERS ================= */
  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];

    // Property Type Filter (Quick Filter at top)
    if (propertyType !== "all") {
      filtered = filtered.filter((pg) => pg.pg_category === propertyType);
    }

    // Location search
    if (filters.location) {
      filtered = filtered.filter((pg) =>
        `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    // Budget filter using getEffectiveRent
    filtered = filtered.filter(
      (pg) => {
        const rent = getEffectiveRent(pg);
        return rent >= filters.minBudget && rent <= filters.maxBudget;
      }
    );

    // Amenities filters
    if (filters.food) filtered = filtered.filter((pg) => pg.food_available === true);
    if (filters.ac) filtered = filtered.filter((pg) => pg.ac_available === true);
    if (filters.wifi) filtered = filtered.filter((pg) => pg.wifi_available === true);
    if (filters.parking) filtered = filtered.filter((pg) => pg.parking_available === true);
    
    if (filters.foodType) {
      filtered = filtered.filter((pg) => pg.food_type === filters.foodType);
    }

    // Nearby filter
    if (filters.nearMe && userLocation) {
      filtered = filtered
        .map((pg) => {
          if (!pg.latitude || !pg.longitude) return null;
          return {
            ...pg,
            distance: getDistanceKm(
              userLocation.lat,
              userLocation.lng,
              pg.latitude,
              pg.longitude
            ),
          };
        })
        .filter(Boolean)
        .filter((pg) => pg.distance <= 5)
        .sort((a, b) => a.distance - b.distance);
    }

    // Sorting
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
  }, [allPGs, filters, userLocation, propertyType]);

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
    setPropertyType("all");
    setUserLocation(null);
    setPgs(allPGs);
    showNotification("All filters reset");
  };

  // FIXED: Updated getImageUrl function
  const getImageUrl = (pg) => {
    if (Array.isArray(pg.photos) && pg.photos.length) {
      return getCorrectImageUrl(pg.photos[0]);
    }
    return "https://via.placeholder.com/400x200/6b7280/ffffff?text=No+Image";
  };

  /* ================= INTERACTION HANDLERS ================= */
  const handleQuickView = (pg, e) => {
    e.stopPropagation();
    setQuickViewPG(pg);
  };

  const handleBookNow = (pg) => {
    const user = auth.currentUser;

    if (!user) {
      showNotification("Please register or login to book this property");
      navigate("/register");
      return;
    }

    setBookingPG(pg);
  };

 const handleBookingSubmit = async (bookingData) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      showNotification("Please register or login to continue");
      navigate("/register");
      return;
    }

    const token = await user.getIdToken(true);

    const payload = {
      name: bookingData.name,
      phone: bookingData.phone,
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

    // ✅ HANDLE ALREADY BOOKED
    if (res.data?.alreadyBooked) {
      showNotification(res.data.message);
      setBookingPG(null);
      return;
    }

    // ✅ SUCCESS
    showNotification(res.data.message || "✅ Booking request sent to owner");
    setBookingPG(null);

  } catch (error) {
    console.log("BOOKING ERROR:", error.response?.data);

    // ✅ SHOW BACKEND MESSAGE
    if (error.response?.data?.message) {
      showNotification(error.response.data.message);
    } else {
      showNotification("❌ Something went wrong. Try again");
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

  /* ================= COMPARE FEATURE HANDLERS ================= */
  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) {
      // Clear selections when exiting compare mode
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

  const getDisplayPrice = (pg) => {
    return getEffectiveRent(pg);
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
        icon: <Users size={12} />, 
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
    
    return info.slice(0, 3);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "auto", minHeight: "100vh" }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: "#10b981",
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
          <Check size={18} />
          {notification}
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Find Your Perfect Stay
          </h1>
          <button
            onClick={() => {
              if (favorites.size > 0) {
                setPgs(allPGs.filter(pg => favorites.has(pg.id)));
              } else {
                setPgs(allPGs);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              background: favorites.size > 0 ? "#ec4899" : "#f3f4f6",
              color: favorites.size > 0 ? "white" : "#374151",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Heart size={18} fill={favorites.size > 0 ? "white" : "none"} />
            Favorites ({favorites.size})
          </button>
        </div>
        
        {/* ================= NEW FEATURES BANNER ================= */}
        <div style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 20,
          padding: "16px 20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 16,
          color: "white",
          boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              background: "rgba(255,255,255,0.2)",
              padding: "10px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ZapIcon size={24} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>⚡ Instant Booking Available</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Book your room instantly with just one click</div>
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              background: "rgba(255,255,255,0.2)",
              padding: "10px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <BadgePercent size={24} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>🆓 Free to Book </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Save up to ₹5,000 on booking fees</div>
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              background: "rgba(255,255,255,0.2)",
              padding: "10px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Coins size={24} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>💰 Zero Brokerage</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Direct owner listings, no middleman</div>
            </div>
          </div>
        </div>

        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Discover comfortable PGs, Co-living spaces, and rental homes
          {filters.nearMe && userLocation && " - Showing nearby properties"}
        </p>
      </div>

      {/* ================= PROPERTY TYPE QUICK FILTER ================= */}
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        marginBottom: 20,
        border: "1px solid #e5e7eb"
      }}>
        <div style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setPropertyType("all")}
            style={{
              padding: "12px 24px",
              background: propertyType === "all" ? "#3b82f6" : "#f3f4f6",
              color: propertyType === "all" ? "white" : "#374151",
              border: "none",
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
              flex: "0 1 auto"
            }}
          >
            <Home size={18} />
            All
          </button>
          <button
            onClick={() => setPropertyType("pg")}
            style={{
              padding: "12px 24px",
              background: propertyType === "pg" ? "#3b82f6" : "#f3f4f6",
              color: propertyType === "pg" ? "white" : "#374151",
              border: "none",
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
              flex: "0 1 auto"
            }}
          >
            <DoorOpen size={18} />
            PG
          </button>
          <button
            onClick={() => setPropertyType("coliving")}
            style={{
              padding: "12px 24px",
              background: propertyType === "coliving" ? "#3b82f6" : "#f3f4f6",
              color: propertyType === "coliving" ? "white" : "#374151",
              border: "none",
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
              flex: "0 1 auto"
            }}
          >
            <Users size={18} />
            Co-Living
          </button>
          <button
            onClick={() => setPropertyType("to_let")}
            style={{
              padding: "12px 24px",
              background: propertyType === "to_let" ? "#3b82f6" : "#f3f4f6",
              color: propertyType === "to_let" ? "white" : "#374151",
              border: "none",
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
              flex: "0 1 auto"
            }}
          >
            <Building size={18} />
            To-Let
          </button>
        </div>
      </div>

      {/* ================= MODERN FILTER BAR ================= */}
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
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Navigation size={18} />
            Near Me
          </button>

          {/* Compare Mode Toggle */}
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

          {/* Compare Action Button (shows when in compare mode) */}
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

        {/* Budget Summary */}
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
            animation: "fadeIn 0.3s ease"
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

        {/* Nearby Info */}
        {filters.nearMe && userLocation && (
          <div style={{
            padding: "10px 16px",
            background: "#fff7ed",
            borderRadius: 10,
            marginBottom: 16,
            border: "1px solid #fed7aa",
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "fadeIn 0.3s ease"
          }}>
            <Navigation size={16} color="#f97316" />
            <span style={{ fontSize: 14, color: "#9a3412", fontWeight: 500 }}>
              Showing properties within 5km of your location
            </span>
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, nearMe: false }));
                setUserLocation(null);
              }}
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
              marginBottom: 20
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
                  {userLocation && <option value="distance">Distance</option>}
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

      {/* ================= RESULTS HEADER ================= */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
            {filters.nearMe ? "Properties Near You" : "Available Properties"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>
              Showing {pgs.length} properties
              {filters.minBudget > 0 && filters.maxBudget < 50000 && 
                ` within ₹${formatPrice(filters.minBudget)} - ₹${formatPrice(filters.maxBudget)}`}
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

      {/* ================= PROPERTY CARDS ================= */}
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
                      e.target.src = "https://via.placeholder.com/400x200/6b7280/ffffff?text=No+Image";
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
                  
                  {/* Distance badge if available */}
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

                  <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                    {getPGCode(pg.id)}
                  </p>

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

                  {/* PRICE RANGE DISPLAY */}
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

      {/* ================= MODALS ================= */}
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

      {bookingPG && (
        <BookingModal
          pg={bookingPG}
          onClose={() => setBookingPG(null)}
          onBook={handleBookingSubmit}
        />
      )}

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
        
        @media (max-width: 768px) {
          .filter-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default UserPGSearch;