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
  Headphones,
  Train,
  Bus,
  GraduationCap as GraduationIcon,
  Briefcase as BriefcaseIcon,
  School,
  Building2,
  ShoppingBag,
  TreePine,
  Coffee as CoffeeIcon,
  Dumbbell as GymIcon,
  Droplets as WaterIcon,
  WashingMachine,
  Fan,
  Tv as TvIcon,
  Microwaves,
  Fridge,
  Stethoscope
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

// Key for localStorage to track if location permission was asked
const LOCATION_PERMISSION_ASKED_KEY = "nepxall_location_permission_asked";
const LOCATION_AUTO_ASKED_KEY = "nepxall_location_auto_asked";

// Popular Areas in Bangalore
const popularAreas = [
  { name: "Koramangala", icon: "", color: "#3b82f6" },
  { name: "BTM Layout", icon: "", color: "#10b981" },
  { name: "Jayanagar", icon: "", color: "#f59e0b" },
  { name: "Electronic City", icon: "", color: "#8b5cf6" },
  { name: "HSR Layout", icon: "", color: "#ec4899" },
  { name: "Whitefield", icon: "", color: "#06b6d4" },
  { name: "Marathahalli", icon: "", color: "#ef4444" },
];

// Quick Filters - Easy access filters
const quickFilters = [
  { id: "near_me", name: "Near Me", icon: <Navigation size={16} />, type: "location" },
  { id: "ac_room", name: "AC Room", icon: <Snowflake size={16} />, type: "amenity", field: "ac_available" },
  { id: "wifi", name: "WiFi", icon: <Wifi size={16} />, type: "amenity", field: "wifi_available" },
  { id: "parking", name: "Parking", icon: <Car size={16} />, type: "amenity", field: "parking_available" },
  { id: "veg_food", name: "Veg Food", icon: <Leaf size={16} />, type: "food", value: "veg" },
];

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

/* ================= WALKING ANIMATION COMPONENT ================= */
const WalkingAnimation = () => {
  const [doorOpen, setDoorOpen] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Cycle animation: walk -> door opens -> person enters -> reset
    const cycleInterval = setInterval(() => {
      // Start walking animation triggers door open after 2 seconds
      setTimeout(() => setDoorOpen(true), 2000);
      // After person enters, close door and reset
      setTimeout(() => {
        setDoorOpen(false);
        setShowText(true);
        setTimeout(() => setShowText(false), 1500);
      }, 3500);
    }, 6000);

    return () => clearInterval(cycleInterval);
  }, []);

  return (
    <div className="walking-animation-container">
      <div className="animation-header">
        <span className="live-badge">⚡ LIVE</span>
        <span className="animation-title">See how it works</span>
      </div>
      
      <div className="animation-stage">
        <div className="walking-man-wrapper">
          <div className="walking-man">
            <div className="person">
              <div className="head"></div>
              <div className="body"></div>
              <div className="legs">
                <div className="leg leg-left"></div>
                <div className="leg leg-right"></div>
              </div>
              <div className="arms">
                <div className="arm arm-left"></div>
                <div className="arm arm-right"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`house ${doorOpen ? "door-open" : ""}`}>
          <div className="house-roof">🏠</div>
          <div className="house-body">
            <div className="door">
              <div className="door-handle"></div>
            </div>
            <div className="window"></div>
          </div>
        </div>
        
        <div className="path"></div>
      </div>
      
      {showText && (
        <div className="success-message">
          ✨ Just like that! Owner will contact you ✨
        </div>
      )}
      
      <div className="cta-button-wrapper">
        <button className="animation-cta">
          <MessageCircle size={18} />
          Join PG Now
        </button>
        <p className="animation-note">Zero brokerage • Verified owners</p>
      </div>
      
      <style>{`
        .walking-animation-container {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 22px;
          padding: 14px;
          width: 100%;
          max-width: 320px;
          min-height: 420px;
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.25);
          position: sticky;
          top: 100px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .animation-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 0 4px;
        }
        
        .live-badge {
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 30px;
          letter-spacing: 0.5px;
          animation: pulse 1.5s infinite;
        }
        
        .animation-title {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 500;
        }
        
        .animation-stage {
          position: relative;
          height: 120px;
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        
        .walking-man-wrapper {
          position: absolute;
          bottom: 15px;
          left: 0;
          animation: walkAcross 4s ease-in-out infinite;
          z-index: 10;
        }
        
        .walking-man {
          transform: scale(0.7);
        }
        
        .person {
          position: relative;
          width: 40px;
          height: 70px;
        }
        
        .head {
          width: 28px;
          height: 28px;
          background: #fcd34d;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 6px;
          animation: bob 0.4s ease-in-out infinite;
        }
        
        .head::before {
          content: "👤";
          position: absolute;
          font-size: 18px;
          top: 2px;
          left: 5px;
          opacity: 0.8;
        }
        
        .body {
          width: 24px;
          height: 30px;
          background: #3b82f6;
          border-radius: 12px;
          position: absolute;
          top: 30px;
          left: 8px;
        }
        
        .legs {
          position: absolute;
          top: 60px;
          left: 10px;
          width: 20px;
          display: flex;
          gap: 2px;
        }
        
        .leg {
          width: 8px;
          height: 16px;
          background: #1e293b;
          border-radius: 4px;
          animation: walk 0.4s ease-in-out infinite;
          transform-origin: top center;
        }
        
        .leg-left {
          animation-delay: 0s;
        }
        
        .leg-right {
          animation-delay: 0.2s;
        }
        
        .arms {
          position: absolute;
          top: 38px;
          left: 6px;
          width: 28px;
          display: flex;
          justify-content: space-between;
        }
        
        .arm {
          width: 6px;
          height: 18px;
          background: #fcd34d;
          border-radius: 3px;
          animation: swing 0.4s ease-in-out infinite;
          transform-origin: top center;
        }
        
        .arm-left {
          transform: rotate(-20deg);
          animation-delay: 0s;
        }
        
        .arm-right {
          transform: rotate(20deg);
          animation-delay: 0.2s;
        }
        
        .house {
          position: absolute;
          bottom: 15px;
          right: 15px;
          transition: all 0.3s ease;
        }
        
        .house-roof {
          font-size: 28px;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
        }
        
        .house-body {
          background: #f59e0b;
          width: 50px;
          height: 42px;
          border-radius: 8px;
          position: relative;
          margin-top: -8px;
          overflow: hidden;
        }
        
        .door {
          position: absolute;
          bottom: 0;
          left: 15px;
          width: 20px;
          height: 28px;
          background: #78350f;
          border-radius: 10px 10px 0 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: left center;
        }
        
        .house.door-open .door {
          transform: rotateY(-80deg);
          background: #451a03;
        }
        
        .door-handle {
          position: absolute;
          right: 3px;
          top: 12px;
          width: 3px;
          height: 3px;
          background: #fcd34d;
          border-radius: 50%;
        }
        
        .window {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 14px;
          height: 14px;
          background: #93c5fd;
          border-radius: 4px;
          animation: glow 2s infinite;
        }
        
        .path {
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          height: 3px;
          background: repeating-linear-gradient(90deg, #475569, #475569 10px, #334155 10px, #334155 20px);
          border-radius: 2px;
        }
        
        .success-message {
          background: #10b981;
          color: white;
          text-align: center;
          padding: 8px 12px;
          border-radius: 40px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 12px;
          animation: slideUp 0.4s ease;
        }
        
        .cta-button-wrapper {
          margin-top: 20px;
          text-align: center;
        }
        
        .animation-cta {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          padding: 12px;
          border-radius: 40px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        
        .animation-cta:hover {
          transform: scale(1.02);
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }
        
        .animation-note {
          font-size: 10px;
          color: #64748b;
          margin-top: 10px;
          margin-bottom: 0;
        }
        
        @keyframes walkAcross {
          0% {
            transform: translateX(-20px);
          }
          50% {
            transform: translateX(calc(100% - 100px));
          }
          100% {
            transform: translateX(-20px);
          }
        }
        
        @keyframes walk {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(25deg);
          }
        }
        
        @keyframes swing {
          0%, 100% {
            transform: rotate(-25deg);
          }
          50% {
            transform: rotate(25deg);
          }
        }
        
        @keyframes bob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 8px #93c5fd;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @media (max-width: 768px) {
          .walking-animation-container {
            position: relative;
            top: 0;
            width: 100%;
            max-width: 100%;
            min-height: auto;
            margin-top: 20px;
            padding: 12px;
            border-radius: 18px;
          }
          
          .animation-stage {
            height: 100px;
          }
          
          .animation-cta {
            padding: 10px;
            font-size: 13px;
          }
          
          .animation-header {
            margin-bottom: 12px;
          }
          
          .walking-man {
            transform: scale(0.6);
          }
          
          .house-roof {
            font-size: 24px;
          }
          
          .house-body {
            width: 45px;
            height: 38px;
          }
          
          .door {
            left: 13px;
            width: 18px;
            height: 24px;
          }
        }
      `}</style>
    </div>
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
                <li>No payment required now - Zero Brokerage!</li>
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

/* ================= QUICK VIEW MODAL COMPONENT ================= */
const QuickViewModal = ({ pg, onClose, onBook, onSaveFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const getBHKDisplay = () => {
    if (pg.bhk_type) return pg.bhk_type;
    if (pg.price_2bhk > 0) return "2BHK";
    if (pg.price_3bhk > 0) return "3BHK";
    if (pg.price_1bhk > 0) return "1BHK";
    if (pg.price_4bhk > 0) return "4BHK";
    return "Apartment";
  };

  
  const photosArray = React.useMemo(() => {
    if (pg.photos && Array.isArray(pg.photos) && pg.photos.length > 0) {
      return pg.photos.filter(photo => photo && photo.trim() !== "");
    }
    return [];
  }, [pg.photos]);
  
  const hasMultipleImages = photosArray.length > 1;
  
  useEffect(() => {
    if (hasMultipleImages) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % photosArray.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length]);
  
  const currentPhotoUrl = React.useMemo(() => {
    if (hasMultipleImages && photosArray[currentImage]) {
      return getCorrectImageUrl(photosArray[currentImage]);
    }
    if (pg.main_photo) {
      return getCorrectImageUrl(pg.main_photo);
    }
    if (photosArray.length > 0) {
      return getCorrectImageUrl(photosArray[0]);
    }
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
  
  const handleBookNow = () => {
    onBook(pg);
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
      zIndex: 2000,
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
        
        <button
          onClick={toggleFavorite}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
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
          <Heart size={20} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} />
        </button>
        
        <div style={{ position: "relative", height: 250, background: "#f3f4f6" }}>
          <img
            src={currentPhotoUrl}
            alt={pg.pg_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/no-image.png";
            }}
          />
          
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
        
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#111827" }}>
            {pg.pg_name}
          </h2>
          
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, color: "#6b7280", fontSize: 14 }}>
            <MapPin size={14} />
            <span>{pg.area}{pg.city ? `, ${pg.city}` : ""}</span>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1e3a5f" }}>
              ₹{formatPrice(startingPrice)} <span style={{ fontSize: 14, fontWeight: 400, color: "#6b7280" }}>onwards</span>
            </div>
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>per month</div>
          </div>
          
          {/* PG ONLY: Beds Left */}
          {pg.pg_category !== "to_let" && (
            <div style={{
              background: "#ecfdf5",
              color: "#059669",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16
            }}>
              🛏️ {pg.available_rooms || 0} Beds Left
            </div>
          )}
          
          {/* PG ONLY: Food Available */}
          {pg.pg_category === "pg" && pg.food_available && (
            <div style={{ marginBottom: 16, fontSize: 14, color: "#374151" }}>
              🍽️ {pg.food_type === 'veg' ? 'Vegetarian' : pg.food_type === 'non-veg' ? 'Non-Vegetarian' : 'Veg & Non-Veg'}
            </div>
          )}
          
          {/* PG ONLY: Filling Fast */}
          {pg.pg_category !== "to_let" && pg.available_rooms < 5 && pg.available_rooms > 0 && (
            <div style={{
              background: "#fef3c7",
              color: "#d97706",
              padding: "6px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 16
            }}>
              🔥 Filling Fast
            </div>
          )}
          
          {/* TO-LET BADGES */}
          {pg.pg_category === "to_let" && (
            <div style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: 16
            }}>
              <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🏠 {getBHKDisplay()}</span>
              {pg.furnishing_type && <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>🛋️ {pg.furnishing_type}</span>}
              {pg.family_allowed && <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>👨‍👩‍👧 Family</span>}
              {pg.parking_available && <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>🚗 Parking</span>}
              <span style={{ background: "#10b98120", color: "#10b981", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>✔ Zero Brokerage</span>
            </div>
          )}
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            fontSize: 12,
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
              <Home size={14} color="#10b981" />
              Zero Brokerage
            </span>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleCall}
              style={{
                flex: 1,
                padding: "14px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <Phone size={16} />
              Call
            </button>
            
            <button
              onClick={handleWhatsApp}
              style={{
                flex: 1,
                padding: "14px",
                background: "#25D366",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
            
            <button
              onClick={handleBookNow}
              style={{
                flex: 1,
                padding: "14px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <Check size={16} />
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
                    borderRadius: "10px 0 0 0",
                    width: "200px"
                  }}>
                    Features
                  </th>
                  {compareData.map((pg, idx) => (
                    <th key={pg.id} style={{ 
                      padding: "16px", 
                      background: "#f3f4f6",
                      textAlign: "center",
                      minWidth: "220px",
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
                          fontWeight: feature.key === 'price' ? 600 : 400,
                          display: "inline-block"
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
      icon: "🎉",
      gradient: "linear-gradient(135deg, #3b82f6, #1e40af)"
    },
    {
      id: 2,
      title: "Zero Brokerage",
      subtitle: "Direct Owner Contact",
      description: "Save on commission",
      icon: "🏠",
      gradient: "linear-gradient(135deg, #10b981, #047857)"
    },
    {
      id: 3,
      title: "Instant Booking",
      subtitle: "Fast Confirmation",
      description: "Get confirmed in minutes",
      icon: "⚡",
      gradient: "linear-gradient(135deg, #f59e0b, #b45309)"
    },
    {
      id: 4,
      title: "Verified PGs",
      subtitle: "100% Trusted Properties",
      description: "No hidden charges",
      icon: "🤝",
      gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)"
    },
    {
      id: 5,
      title: "Student Offer",
      subtitle: "Limited Time Deal",
      description: "Special discount for students",
      icon: "🎓",
      gradient: "linear-gradient(135deg, #ec4899, #be185d)"
    }
  ];

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
    }
  };

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return (
      <div style={{ marginBottom: 24, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>🔥 Exclusive Offers</h3>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Limited time deals for you</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleManualScroll('prev')} style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer" }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => handleManualScroll('next')} style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer" }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "8px 4px 16px", scrollbarWidth: "thin" }}>
          {promoBanners.map((banner) => (
            <div key={banner.id} onClick={() => handleBannerClick(banner)} style={{ minWidth: 280, background: banner.gradient, borderRadius: 20, padding: 20, color: "white", cursor: "pointer" }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{banner.icon}</div>
              <h3 style={{ fontSize: 24, fontWeight: 700 }}>{banner.title}</h3>
              <p style={{ fontSize: 14, opacity: 0.9 }}>{banner.subtitle}</p>
              <p style={{ fontSize: 12, opacity: 0.75 }}>{banner.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>🔥 Exclusive Offers</h2>
          <p style={{ fontSize: 14, color: "#6b7280" }}>Grab these limited-time deals before they're gone!</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => handleManualScroll('prev')} style={{ width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => handleManualScroll('next')} style={{ width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer" }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
        {promoBanners.slice(0, 3).map((banner) => (
          <div key={banner.id} onClick={() => handleBannerClick(banner)} style={{ flex: "1 1 280px", maxWidth: 320, background: banner.gradient, borderRadius: 24, padding: 24, color: "white", cursor: "pointer", transition: "transform 0.3s" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{banner.icon}</div>
            <h3 style={{ fontSize: 26, fontWeight: 700 }}>{banner.title}</h3>
            <p style={{ fontSize: 15, opacity: 0.9 }}>{banner.subtitle}</p>
            <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>{banner.description}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(255,255,255,0.2)", borderRadius: 30, fontSize: 13 }}>
              Claim Offer →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= HERO BANNER COMPONENT ================= */
const HeroBanner = () => {
  const isMobile = isMobileDevice();
  
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
      borderRadius: 24,
      marginBottom: 40,
      overflow: "hidden",
      padding: isMobile ? "40px 20px" : "60px 40px",
    }}>
      <h1 style={{
        fontSize: isMobile ? "36px" : "52px",
        fontWeight: 800,
        color: "#ffffff",
        marginBottom: 16,
      }}>
        Find Verified PGs,<br />
        Coliving & Rental Homes
      </h1>
      <p style={{
        fontSize: isMobile ? "16px" : "22px",
        color: "rgba(255,255,255,0.9)",
        marginBottom: 32,
        maxWidth: "90%"
      }}>
        Book trusted stays with secure payments, verified owners and instant booking support.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <div style={{ background: "#10b981", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>✓ Verified</div>
        <div style={{ background: "#3b82f6", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>✓ Secure</div>
        <div style={{ background: "#8b5cf6", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>✓ Trusted</div>
        <div style={{ background: "#f59e0b", color: "white", padding: "10px 18px", borderRadius: 30, fontWeight: 600 }}>
  ✓ Zero Brokerage
</div>
      </div>
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
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Navigation size={24} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "white" }}>📍 Find Properties Near You</h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>Allow location access to see properties within 5km of your area</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onDeny} style={{ padding: "10px 20px", background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>Not Now</button>
        <button onClick={onAllow} disabled={isLoading} style={{ padding: "10px 24px", background: "white", color: "#3b82f6", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
          {isLoading ? "Getting location..." : "Allow Location"}
        </button>
      </div>
    </div>
  );
};

/* ================= UPDATED PG CARD COMPONENT WITH SEPARATE UI FOR PG AND TO-LET ================= */
const PGPropertyCard = ({ pg, onQuickView, onFavorite, onContact, onCardClick, isFavorite, isSelectedForCompare, onSelectForCompare, compareMode }) => {
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
    if (pg.main_photo) {
      return getCorrectImageUrl(pg.main_photo);
    }
    if (photosArray.length > 0) {
      return getCorrectImageUrl(photosArray[0]);
    }
    return "/no-image.png";
  }, [hasMultipleImages, photosArray, currentImage, pg.main_photo]);
  
  const startingPrice = React.useMemo(() => {
    const range = getPriceRangeByType(pg);
    return range.min || getEffectiveRent(pg);
  }, [pg]);
  
  const isFillingFast = pg.available_rooms < 5 && pg.available_rooms > 0;
  
  const foodTypeDisplay = React.useMemo(() => {
    if (!pg.food_available) return null;
    if (pg.food_type === 'veg') return "🍽️ Veg";
    if (pg.food_type === 'non-veg') return "🍽️ Non-Veg";
    if (pg.food_type === 'both') return "🍽️ Veg & Non-Veg";
    return "🍽️ Food Available";
  }, [pg.food_available, pg.food_type]);
  
  const getBHKDisplay = () => {
    if (pg.bhk_type) return pg.bhk_type;
    if (pg.price_2bhk > 0) return "2 BHK";
    if (pg.price_3bhk > 0) return "3 BHK";
    if (pg.price_1bhk > 0) return "1 BHK";
    if (pg.price_4bhk > 0) return "4 BHK";
    return "Apartment";
  };
  
  const getAreaDisplay = () => {
    if (pg.sqft_area) return `${pg.sqft_area} sqft`;
    return "Spacious";
  };
  
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
          {isSelectedForCompare ? <Check size={18} color="#8b5cf6" /> : <Plus size={18} color="#374151" />}
        </button>
      )}
      
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
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        <Eye size={14} /> Quick View
      </button>
      
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
        <Heart size={18} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} />
      </button>
      
      <div style={{ position: "relative" }}>
        <img
          src={currentPhotoUrl}
          alt={pg.pg_name}
          style={{ width: "100%", height: isMobile ? 200 : 240, objectFit: "cover", display: "block" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/no-image.png";
          }}
        />
        
        <div style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: pg.pg_category === "to_let" ? "#f97316" : pg.pg_category === "coliving" ? "#8b5cf6" : pg.pg_type === "boys" ? "#16a34a" : "#db2777",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
        }}>
          {pg.pg_category === "to_let" ? "To-Let" : pg.pg_category === "coliving" ? "Co-Living" : pg.pg_type ? pg.pg_type.charAt(0).toUpperCase() + pg.pg_type.slice(1) + " PG" : "PG"}
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
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <Navigation size={10} /> {pg.distance.toFixed(1)} km
          </div>
        )}
        
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
              <div key={idx} style={{
                width: currentImage === idx ? 8 : 6,
                height: currentImage === idx ? 8 : 6,
                borderRadius: "50%",
                background: currentImage === idx ? "#fff" : "rgba(255,255,255,0.5)",
              }} />
            ))}
          </div>
        )}
      </div>
      
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#111827" }}>{pg.pg_name}</h3>
        
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12, color: "#6b7280", fontSize: 14 }}>
          <MapPin size={14} />
          <span>{pg.area}{pg.city ? `, ${pg.city}` : ""}</span>
        </div>
        
        {/* ========== PG UI ========== */}
        {pg.pg_category !== "to_let" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", display: "flex", alignItems: "baseline", gap: 4 }}>
                ₹{formatPrice(startingPrice)} <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>onwards</span>
              </div>
              <div style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>per month</div>
            </div>
            
            {pg.pg_category !== "to_let" && (
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
            )}
            
            {pg.pg_category === "pg" && foodTypeDisplay && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 13, color: "#374151" }}>
                {foodTypeDisplay}
              </div>
            )}
            
            {pg.pg_category !== "to_let" && isFillingFast && (
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
          </>
        )}
        
        {/* ========== TO-LET UI ========== */}
        {pg.pg_category === "to_let" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f", display: "flex", alignItems: "baseline", gap: 4 }}>
                ₹{formatPrice(startingPrice)} <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>/month</span>
              </div>
            </div>
            
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
                {getBHKDisplay()} • {getAreaDisplay()}
              </div>
            </div>
            
            {/* To-Let Badges */}
            <div style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: 12
            }}>
              <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🏠 {getBHKDisplay()}</span>
              {pg.furnishing_type && <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>🛋️ {pg.furnishing_type}</span>}
              {pg.family_allowed && <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>👨‍👩‍👧 Family</span>}
              {pg.parking_available && <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>🚗 Parking</span>}
              <span style={{ background: "#10b98120", color: "#10b981", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>✔ Zero Brokerage</span>
            </div>
            
            {/* Ready to Move Badge */}
            {pg.ready_to_move && (
              <div style={{
                background: "#dbeafe",
                color: "#1e40af",
                padding: "4px 10px",
                borderRadius: 16,
                fontSize: 11,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 12
              }}>
                ✓ Ready to Move
              </div>
            )}
          </>
        )}
        
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
              <Shield size={12} color="#10b981" /> Verified
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Home size={14} color="#10b981" />
            Zero Brokerage by Nepxall
          </span>
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onContact(pg); }}
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
            gap: 8
          }}
        >
          <MessageCircle size={16} /> Contact Owner
        </button>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
function UserPGSearch() {
  const isMobile = window.innerWidth < 768;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [allPGs, setAllPGs] = useState([]);
  
  // View All PGs state
  const INITIAL_PG_LIMIT = 12;
  const [showAllPGs, setShowAllPGs] = useState(false);
  
  // Tab state - Default is "all"
  const [activeTab, setActiveTab] = useState("all");
  
  // Property tabs definition
  const propertyTabs = [
    { id: "all", label: "All" },
    { id: "pg", label: "PG" },
    { id: "coliving", label: "Co-Living" },
    { id: "to_let", label: "To-Let" }
  ];
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
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
  const [activeQuickFilters, setActiveQuickFilters] = useState(new Set());

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
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`);
          const data = await response.json();
          if (data.address) {
            const area = data.address.suburb || data.address.neighbourhood || data.address.city_district || "";
            setUserAddress(area);
          }
        } catch (err) {}
        
        setFilters(prev => ({ ...prev, nearMe: true, sort: "distance" }));
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocationLoading(false);
        setPage(1);
        loadPGs(false);
      },
      () => {
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Apply quick filter
  const applyQuickFilter = (filter) => {
    const newActiveFilters = new Set(activeQuickFilters);
    
    if (newActiveFilters.has(filter.id)) {
      newActiveFilters.delete(filter.id);
      // Reset the specific filter
      if (filter.type === "location") {
        setFilters(prev => ({ ...prev, nearMe: false }));
      } else if (filter.type === "food") {
        setFilters(prev => ({ ...prev, foodType: "" }));
      } else if (filter.type === "amenity") {
        setFilters(prev => ({ ...prev, [filter.field]: false }));
      }
    } else {
      newActiveFilters.add(filter.id);
      // Apply the filter
      if (filter.type === "location") {
        setFilters(prev => ({ ...prev, nearMe: true, sort: "distance" }));
        detectLocation();
      } else if (filter.type === "food" && filter.value) {
        setFilters(prev => ({ ...prev, foodType: filter.value }));
      } else if (filter.type === "amenity" && filter.field) {
        setFilters(prev => ({ ...prev, [filter.field]: true }));
      }
    }
    
    setActiveQuickFilters(newActiveFilters);
    showNotification(`${newActiveFilters.has(filter.id) ? "Applied" : "Removed"} ${filter.name}`);
  };

  const handlePromoBannerClick = (banner) => {
    showNotification(`🎉 ${banner.title} - ${banner.description}`);
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
      ready_to_move: pg.ready_to_move === true || pg.ready_to_move === 1 || pg.ready_to_move === "true",
      family_allowed: pg.family_allowed === true || pg.family_allowed === 1 || pg.family_allowed === "true",
      sqft_area: pg.sqft_area || null,
      bhk_type: pg.bhk_type || null,
      furnishing_type: pg.furnishing_type || null,
      food_available: pg.food_available === true || pg.food_available === 1 || pg.food_available === "true",
      ac_available: pg.ac_available === true || pg.ac_available === 1 || pg.ac_available === "true",
      wifi_available: pg.wifi_available === true || pg.wifi_available === 1 || pg.wifi_available === "true",
      parking_available: pg.parking_available === true || pg.parking_available === 1 || pg.parking_available === "true",
      is_verified: pg.is_verified === true || pg.is_verified === 1 || pg.is_verified === "true",
    }));
  };

  const loadPGs = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);
      
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
              const distance = getDistanceKm(userLocation.lat, userLocation.lng, pg.latitude, pg.longitude);
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
        } else {
          setAllPGs(prev => [...prev, ...processedData]);
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
    if (page > 1) loadPGs(true);
  }, [page]);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem("pg_favorites");
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (error) {
      setFavorites(new Set());
    }
  };

  const saveFavorites = (newFavorites) => {
    try {
      localStorage.setItem("pg_favorites", JSON.stringify([...newFavorites]));
    } catch (error) {}
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

  const filterByArea = (area) => {
    setFilters(prev => ({ ...prev, location: area, nearMe: false }));
    showNotification(`📍 Showing properties in ${area}`);
    trackEvent("area_filter_click", { area });
  };

  const handleAllowLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFilters(prev => ({ ...prev, nearMe: true, sort: "distance" }));
        setShowLocationBanner(false);
        localStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, "true");
        showNotification("📍 Location detected! Showing nearby properties within 5km");
        setLocationLoading(false);
        setPage(1);
        loadPGs(false);
      },
      () => {
        showNotification("❌ Unable to get your location.", true);
        setShowLocationBanner(false);
        localStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, "true");
        setLocationLoading(false);
      }
    );
  };

  const handleDenyLocation = () => {
    setShowLocationBanner(false);
    localStorage.setItem(LOCATION_PERMISSION_ASKED_KEY, "true");
    showNotification("You can enable location from the 'Near Me' button anytime");
  };

  const detectLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
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

  // Apply filters - FIRST filter all PGs
  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];

    if (filters.location) {
      filtered = filtered.filter((pg) =>
        `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`.toLowerCase().includes(filters.location.toLowerCase())
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
    if (filters.foodType) filtered = filtered.filter((pg) => pg.food_type === filters.foodType);

    if (filters.sort === "low") {
      filtered.sort((a, b) => getEffectiveRent(a) - getEffectiveRent(b));
    } else if (filters.sort === "high") {
      filtered.sort((a, b) => getEffectiveRent(b) - getEffectiveRent(a));
    } else if (filters.sort === "new") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sort === "distance" && userLocation) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    return filtered;
  }, [allPGs, filters, userLocation]);

  // Get filtered PGs based on tab
  const getFilteredByTab = useCallback(() => {
    const allFiltered = applyFilters();
    
    if (activeTab === "all") {
      return allFiltered;
    }
    return allFiltered.filter(
      (item) => item.pg_category === activeTab
    );
  }, [applyFilters, activeTab]);

  const filteredPGs = getFilteredByTab();
  
  // THEN display based on showAllPGs state
  const displayedPGs = showAllPGs
    ? filteredPGs
    : filteredPGs.slice(0, INITIAL_PG_LIMIT);

  const resultCount = filteredPGs.length;
  
  // Reset showAllPGs when filters or tab changes
  useEffect(() => {
    setShowAllPGs(false);
  }, [activeTab, filters, allPGs]);

  const handleBudgetChange = (min, max) => {
    setFilters(prev => ({ ...prev, minBudget: min, maxBudget: max }));
    showNotification(`Budget set: ₹${formatPrice(min)} - ₹${formatPrice(max)}`);
  };

  const resetFilters = () => {
    setFilters({
      location: "", minBudget: 0, maxBudget: 50000, food: false, ac: false, wifi: false, parking: false, sort: "", nearMe: false, foodType: ""
    });
    setActiveQuickFilters(new Set());
    setShowAllPGs(false);
    showNotification("All filters reset");
  };

  const handleQuickView = (pg, e) => {
    e.stopPropagation();
    setQuickViewPG(pg);
  };

  const handleBookNow = (pg) => {
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
      const payload = { room_type: bookingData.roomType };

      const res = await api.post(`/bookings/${bookingPG.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showNotification(res.data.message || "✅ Owner will contact you shortly");
      
      if (bookingPG.contact_phone) {
        setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 500);
      }
      
      setBookingPG(null);
    } catch (error) {
      if (error.response?.data?.message?.includes("already")) {
        showNotification("📞 Connecting you directly to owner...");
        if (bookingPG.contact_phone) {
          setTimeout(() => window.location.href = `tel:${bookingPG.contact_phone}`, 500);
        }
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

  const handleCardClick = (pg) => {
    navigate(`/pg/${pg.id}`);
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) setSelectedForCompare(new Set());
  };

  const toggleSelectForCompare = (pgId, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedForCompare);
    if (newSelected.has(pgId)) {
      newSelected.delete(pgId);
    } else if (newSelected.size < 3) {
      newSelected.add(pgId);
    } else {
      showNotification("You can compare up to 3 properties at a time");
      return;
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

  // Get title based on active tab
  const getTabTitle = () => {
    switch(activeTab) {
      case "pg": return "PG Accommodations";
      case "coliving": return "Co-Living Spaces";
      case "to_let": return "To-Let Homes";
      default: return "All Properties";
    }
  };

  // Check if filters are active
  const hasActiveFilters = filters.location || filters.minBudget > 0 || filters.maxBudget < 50000 || filters.food || filters.ac || filters.wifi || filters.parking || filters.foodType || activeQuickFilters.size > 0;

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 100 }}>
        <div style={{ width: 50, height: 50, border: "4px solid #e5e7eb", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p>Loading authentication...</p>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: 1400, margin: "auto", minHeight: "100vh", padding: "0 16px" }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20,
          background: notification.isError ? "#ef4444" : "#10b981",
          color: "white", padding: "12px 24px", borderRadius: 10, zIndex: 4000,
          animation: "slideIn 0.3s ease"
        }}>
          {notification.message}
        </div>
      )}

      {/* Location Permission Banner */}
      {showLocationBanner && (
        <LocationPermissionBanner onAllow={handleAllowLocation} onDeny={handleDenyLocation} isLoading={locationLoading} />
      )}

      {/* Hero Banner */}
      <HeroBanner />

      {/* Location Info Bar */}
      {userLocation && (
        <div style={{
          background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
          borderRadius: 16,
          padding: "12px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          border: "1px solid #bae6fd"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Navigation size={20} color="#0284c7" />
            <div>
              <span style={{ fontWeight: 600, color: "#0369a1" }}>
                📍 {userAddress ? `Near ${userAddress}` : "Your Location"}
              </span>
              <span style={{ fontSize: 12, color: "#0284c7", marginLeft: 8 }}>
                Properties within 5km
              </span>
            </div>
          </div>
          <button
            onClick={detectLocation}
            disabled={locationLoading}
            style={{
              padding: "8px 16px",
              background: "#0284c7",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Navigation size={14} />
            Refresh Location
          </button>
        </div>
      )}

      {/* Promotional Banners */}
      <PromoBannerSlider onBannerClick={handlePromoBannerClick} />

      {/* Quick Filters Section */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: "#374151" }}>Quick Filters</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {quickFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => applyQuickFilter(filter)}
              style={{
                padding: "10px 18px",
                borderRadius: 40,
                background: activeQuickFilters.has(filter.id) ? filter.id === "near_me" ? "#f97316" : "#3b82f6" : "#f3f4f6",
                color: activeQuickFilters.has(filter.id) ? "white" : "#374151",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              {filter.icon}
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Areas Chips */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: "#374151" }}>📍 Popular Areas in Bangalore</h3>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "thin" }}>
          {popularAreas.map((area) => (
            <button
              key={area.name}
              onClick={() => filterByArea(area.name)}
              style={{
                padding: "10px 20px",
                borderRadius: 40,
                border: filters.location === area.name ? `2px solid ${area.color}` : "1px solid #e5e7eb",
                background: filters.location === area.name ? `${area.color}10` : "#fff",
                color: filters.location === area.name ? area.color : "#374151",
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <span>{area.icon}</span> {area.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ 
        background: "#fff", 
        borderRadius: 20, 
        padding: "20px 24px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)", 
        marginBottom: 32, 
        position: "sticky", 
        top: 20, 
        zIndex: 100,
        border: "1px solid #eef2ff"
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input 
              placeholder="Search by area, city or property name..." 
              value={filters.location} 
              onChange={(e) => setFilters({ ...filters, location: e.target.value })} 
              style={{ width: "100%", padding: "12px 14px 12px 42px", border: "1px solid #e5e7eb", borderRadius: 40, fontSize: 14, background: "#fafafa" }} 
            />
          </div>
          <button onClick={() => setShowBudgetFilter(true)} style={{ padding: "12px 20px", background: "#f3f4f6", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500 }}>
            <Coins size={16} /> Budget
          </button>
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "12px 20px", background: showFilters ? "#3b82f6" : "#f3f4f6", color: showFilters ? "white" : "#374151", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500 }}>
            <Filter size={16} /> Filters
          </button>
          <button onClick={detectLocation} style={{ padding: "12px 20px", background: filters.nearMe ? "#f97316" : "#f3f4f6", color: filters.nearMe ? "white" : "#374151", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500 }}>
            <Navigation size={16} /> Near Me
          </button>
          <button onClick={toggleCompareMode} style={{ padding: "12px 20px", background: compareMode ? "#8b5cf6" : "#f3f4f6", color: compareMode ? "white" : "#374151", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500 }}>
            <BarChart size={16} /> Compare
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{ padding: "12px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: 40, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500 }}>
              <X size={16} /> Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ paddingTop: 20, marginTop: 20, borderTop: "1px solid #eef2ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Advanced Filters</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <select value={filters.foodType} onChange={(e) => setFilters({ ...filters, foodType: e.target.value })} style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 30, background: "#fafafa" }}>
                <option value="">Any Food Type</option>
                <option value="veg">Vegetarian Only</option>
                <option value="non-veg">Non-Vegetarian Only</option>
                <option value="both">Both Available</option>
              </select>
              <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 30, background: "#fafafa" }}>
                <option value="">Sort by: Relevance</option>
                <option value="low">Rent: Low to High</option>
                <option value="high">Rent: High to Low</option>
                <option value="new">Newest First</option>
                {userLocation && <option value="distance">Distance (Nearest First)</option>}
              </select>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.food ? "#10b981" : "#f3f4f6", borderRadius: 30, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={filters.food} onChange={(e) => setFilters({ ...filters, food: e.target.checked })} style={{ display: "none" }} />
                  <Utensils size={14} /> Food
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.ac ? "#3b82f6" : "#f3f4f6", borderRadius: 30, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={filters.ac} onChange={(e) => setFilters({ ...filters, ac: e.target.checked })} style={{ display: "none" }} />
                  <Snowflake size={14} /> AC
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.wifi ? "#8b5cf6" : "#f3f4f6", borderRadius: 30, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={filters.wifi} onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })} style={{ display: "none" }} />
                  <Wifi size={14} /> WiFi
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: filters.parking ? "#f59e0b" : "#f3f4f6", borderRadius: 30, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={filters.parking} onChange={(e) => setFilters({ ...filters, parking: e.target.checked })} style={{ display: "none" }} />
                  <Car size={14} /> Parking
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT: LEFT SIDE (Property Cards) + RIGHT SIDE (Walking Animation) */}
      <div style={{ display: "flex", gap: "32px" }}>
        {/* LEFT SIDE - PROPERTY CARDS */}
        <div style={{ flex: 1 }}>
          {/* Property Tabs */}
          <div style={{ 
            display: "flex", 
            gap: 8, 
            marginBottom: 28,
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 12,
            overflowX: "auto",
            scrollbarWidth: "thin"
          }}>
            {propertyTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 40,
                  background: activeTab === tab.id ? "#1e3a5f" : "transparent",
                  color: activeTab === tab.id ? "white" : "#4b5563",
                  border: activeTab === tab.id ? "none" : "1px solid #e5e7eb",
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            ))}
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
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                {getTabTitle()}
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
                {resultCount} {resultCount === 1 ? "property" : "properties"} found
              </p>
            </div>
            
            {compareMode && selectedForCompare.size > 0 && (
              <button
                onClick={handleCompare}
                style={{
                  padding: "10px 20px",
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: 40,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <BarChart size={16} />
                Compare ({selectedForCompare.size})
              </button>
            )}
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ width: 50, height: 50, border: "4px solid #e5e7eb", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
              <p style={{ color: "#6b7280" }}>Loading properties...</p>
            </div>
          ) : displayedPGs.length > 0 ? (
            <>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", 
                gap: 28 
              }}>
                {displayedPGs.map((pg) => (
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
                  />
                ))}
              </div>
              
              {/* View All PGs Button - Exactly as requested */}
              {!showAllPGs && filteredPGs.length > INITIAL_PG_LIMIT && (
                <div style={{ textAlign: "center", marginTop: 40, marginBottom: 60 }}>
                  <button
                    onClick={() => setShowAllPGs(true)}
                    style={{
                      padding: "14px 28px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    View All PGs
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 20px", background: "#f9fafb", borderRadius: 24, marginBottom: 40 }}>
              <Search size={56} style={{ margin: "0 auto 20px", color: "#9ca3af" }} />
              <h3 style={{ fontSize: 22, fontWeight: 600, color: "#374151", marginBottom: 8 }}>No properties found</h3>
              <p style={{ color: "#6b7280", marginBottom: 28 }}>Try adjusting your filters or search for a different location</p>
              <button onClick={resetFilters} style={{ padding: "12px 28px", background: "#3b82f6", color: "white", border: "none", borderRadius: 40, cursor: "pointer", fontWeight: 600 }}>
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - STICKY WALKING ANIMATION */}
        <div style={{
          width: "320px",
          position: "sticky",
          top: "90px",
          height: "fit-content",
          display: isMobile ? "none" : "block"
        }}>
          <WalkingAnimation />
        </div>
      </div>

      {/* Modals */}
      {showBudgetFilter && <BudgetFilter minBudget={filters.minBudget} maxBudget={filters.maxBudget} onBudgetChange={handleBudgetChange} onClose={() => setShowBudgetFilter(false)} />}
      {quickViewPG && <QuickViewModal pg={quickViewPG} onClose={() => setQuickViewPG(null)} onBook={handleBookNow} onSaveFavorite={handleSaveFavorite} />}
      {bookingPG && <BookingModal pg={bookingPG} onClose={() => setBookingPG(null)} onBook={handleBookingSubmit} />}
      {showCompareModal && <CompareModal selectedPGs={selectedForCompare} allPGs={allPGs} onClose={() => { setShowCompareModal(false); setSelectedForCompare(new Set()); setCompareMode(false); }} />}

      {/* Sticky Contact Button for Mobile */}
      {isMobile && !compareMode && displayedPGs.length > 0 && (
        <div style={{ position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 999 }}>
          <button onClick={() => handleBookNow(displayedPGs[0])} style={{ width: "100%", padding: "14px", background: "#3b82f6", color: "white", border: "none", borderRadius: 60, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <MessageCircle size={20} /> Contact Owner
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        
        *::-webkit-scrollbar {
          height: 4px;
          width: 6px;
        }
        *::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

export default UserPGSearch;