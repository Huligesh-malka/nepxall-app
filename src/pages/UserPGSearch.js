import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Stethoscope,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Grid,
  List,
  AlertCircle,
  HelpCircle,
  Settings,
  Globe,
  Camera,
  Video,
  Mic,
  Headphones as HeadphonesIcon,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Clock as ClockIcon2,
  Calendar as CalendarIcon2,
  Gift,
  Truck,
  Package,
  Box,
  ShoppingCart,
  Store,
  Building as BuildingIcon,
  Home as HomeIcon,
  Users as PeopleIcon,
  Award as BadgeIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info as InfoIcon,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  CircleDashed,
  CircleCheck,
  CircleAlert,
  CircleEllipsis,
  CirclePower,
  CircleSlash,
  CircleX,
  CirclePlus,
  CircleMinus,
  CircleEqual,
  CircleDivide,
  CirclePercent,
  CircleDollar,
  CircleEuro,
  CirclePound,
  CircleYen,
  CircleBitcoin,
  CircleEthereum,
  CircleTether,
  CircleSolana,
  CircleBnb,
  CircleMatic,
  CircleUsdc,
  CircleUsdt,
  CircleDai,
  CircleMkr,
  CircleAave,
  CircleLink,
  CircleUni,
  CircleComp,
  CircleLido,
  CircleStEth,
  CircleRpl,
  CircleFx,
  CircleBtc,
  CircleEth,
  CircleXrp,
  CircleAda,
  CircleSol,
  CircleDot,
  CircleMatic,
  CircleAtom,
  CircleAave,
  CircleLink,
  CircleUni,
  CircleComp,
  CircleMkr,
  CircleLdo,
  CircleRpl,
  CircleRpl,
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

const LOCATION_PERMISSION_ASKED_KEY = "nepxall_location_permission_asked";
const LOCATION_AUTO_ASKED_KEY = "nepxall_location_auto_asked";

const popularAreas = [
  { name: "Koramangala", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
  { name: "BTM Layout", color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #059669)" },
  { name: "Jayanagar", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { name: "Electronic City", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  { name: "HSR Layout", color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
  { name: "Whitefield", color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4, #0891b2)" },
  { name: "Marathahalli", color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
];

const quickFilters = [
  { id: "near_me", name: "Near Me", icon: <Navigation size={16} />, type: "location" },
  { id: "ac_room", name: "AC Room", icon: <Snowflake size={16} />, type: "amenity", field: "ac_available" },
  { id: "wifi", name: "WiFi", icon: <Wifi size={16} />, type: "amenity", field: "wifi_available" },
  { id: "parking", name: "Parking", icon: <Car size={16} />, type: "amenity", field: "parking_available" },
  { id: "veg_food", name: "Veg Food", icon: <Leaf size={16} />, type: "food", value: "veg" },
  { id: "family", name: "Family", icon: <Users size={16} />, type: "amenity", field: "family_allowed" },
];

const trackEvent = (eventName, data = {}) => {
  if (window.gtag) {
    window.gtag("event", eventName, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
  console.log("Tracked:", eventName, data);
};

const isMobileDevice = () => window.innerWidth < 768;

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

/* ================= GLASSMORPHISM BUDGET FILTER ================= */
const BudgetFilter = ({ minBudget, maxBudget, onBudgetChange, onClose }) => {
  const [localMin, setLocalMin] = useState(minBudget);
  const [localMax, setLocalMax] = useState(maxBudget);

  const budgetRanges = [
    { label: "Budget", min: 0, max: 5000, emoji: "🪙" },
    { label: "Economy", min: 5000, max: 10000, emoji: "💰" },
    { label: "Standard", min: 10000, max: 20000, emoji: "💎" },
    { label: "Premium", min: 20000, max: 30000, emoji: "👑" },
    { label: "Luxury", min: 30000, max: 100000, emoji: "🌟" }
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

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 32,
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 40px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "#fee2e2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.9)"; }}
        >
          <X size={24} color="#1e293b" />
        </button>

        <div style={{ padding: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Coins size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Budget Filter
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                Find properties in your price range
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 28, marginTop: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quick Select
            </h4>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
              gap: 10
            }}>
              {budgetRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => { setLocalMin(range.min); setLocalMax(range.max); }}
                  style={{
                    padding: "12px 8px",
                    background: localMin === range.min && localMax === range.max 
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)" 
                      : "rgba(241, 245, 249, 0.8)",
                    color: localMin === range.min && localMax === range.max ? "white" : "#1e293b",
                    border: localMin === range.min && localMax === range.max 
                      ? "none" 
                      : "1px solid #e2e8f0",
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <span style={{ fontSize: 20 }}>{range.emoji}</span>
                  <span>{range.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    ₹{formatPrice(range.min)}-{formatPrice(range.max)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Custom Range
            </h4>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10
              }}>
                <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>
                  ₹{formatPrice(localMin)}
                </span>
                <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>
                  ₹{formatPrice(localMax)}
                </span>
              </div>
              <div style={{
                position: "relative",
                height: 48,
                padding: "0 8px"
              }}>
                <div style={{
                  position: "absolute",
                  width: "100%",
                  height: 6,
                  background: "#e2e8f0",
                  borderRadius: 3,
                  top: "50%",
                  transform: "translateY(-50%)"
                }} />
                <div style={{
                  position: "absolute",
                  left: `${(localMin / 50000) * 100}%`,
                  right: `${100 - (localMax / 50000) * 100}%`,
                  height: 6,
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  borderRadius: 3,
                  top: "50%",
                  transform: "translateY(-50%)"
                }} />
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={localMin}
                  onChange={(e) => setLocalMin(Math.min(Number(e.target.value), localMax - 1000))}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: 6,
                    background: "transparent",
                    appearance: "none",
                    pointerEvents: "none",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={localMax}
                  onChange={(e) => setLocalMax(Math.max(Number(e.target.value), localMin + 1000))}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: 6,
                    background: "transparent",
                    appearance: "none",
                    pointerEvents: "none",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2
                  }}
                />
                <div style={{
                  position: "absolute",
                  left: `${(localMin / 50000) * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 22,
                  height: 22,
                  background: "white",
                  borderRadius: "50%",
                  border: "3px solid #6366f1",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                  zIndex: 3,
                  pointerEvents: "none"
                }} />
                <div style={{
                  position: "absolute",
                  left: `${(localMax / 50000) * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 22,
                  height: 22,
                  background: "white",
                  borderRadius: "50%",
                  border: "3px solid #6366f1",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                  zIndex: 3,
                  pointerEvents: "none"
                }} />
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14
            }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569"
                }}>
                  Min Budget
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    fontWeight: 600
                  }}>₹</span>
                  <input
                    type="number"
                    value={localMin}
                    onChange={(e) => setLocalMin(Math.min(Number(e.target.value), localMax - 1000))}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 32px",
                      border: "2px solid #e2e8f0",
                      borderRadius: 14,
                      fontSize: 14,
                      background: "#f8fafc",
                      fontWeight: 500,
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#475569"
                }}>
                  Max Budget
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    fontWeight: 600
                  }}>₹</span>
                  <input
                    type="number"
                    value={localMax}
                    onChange={(e) => setLocalMax(Math.max(Number(e.target.value), localMin + 1000))}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 32px",
                      border: "2px solid #e2e8f0",
                      borderRadius: 14,
                      fontSize: 14,
                      background: "#f8fafc",
                      fontWeight: 500,
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
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
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              style={{
                flex: 2,
                padding: "14px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
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

/* ================= BOOKING MODAL ================= */
const BookingModal = ({ pg, onClose, onBook }) => {
  const [bookingData, setBookingData] = useState({ roomType: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pg) return;
    const defaultRoomType = getDefaultRoomType();
    setBookingData({ roomType: defaultRoomType || "" });
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

  const getRoomTypes = () => {
    const types = [];
    if (pg.pg_category === "pg") {
      if (pg.single_sharing && Number(pg.single_sharing) > 0) types.push({ value: "Single Sharing", label: `Single Sharing - ₹${formatPrice(pg.single_sharing)}` });
      if (pg.double_sharing && Number(pg.double_sharing) > 0) types.push({ value: "Double Sharing", label: `Double Sharing - ₹${formatPrice(pg.double_sharing)}` });
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) types.push({ value: "Triple Sharing", label: `Triple Sharing - ₹${formatPrice(pg.triple_sharing)}` });
      if (pg.four_sharing && Number(pg.four_sharing) > 0) types.push({ value: "Four Sharing", label: `Four Sharing - ₹${formatPrice(pg.four_sharing)}` });
      if (pg.single_room && Number(pg.single_room) > 0) types.push({ value: "Single Room", label: `Single Room - ₹${formatPrice(pg.single_room)}` });
      if (pg.double_room && Number(pg.double_room) > 0) types.push({ value: "Double Room", label: `Double Room - ₹${formatPrice(pg.double_room)}` });
    } else if (pg.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ value: "Single Room", label: `Co-Living Single - ₹${formatPrice(pg.co_living_single_room)}` });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ value: "Double Room", label: `Co-Living Double - ₹${formatPrice(pg.co_living_double_room)}` });
      if (pg.coliving_three_sharing && Number(pg.coliving_three_sharing) > 0) types.push({ value: "Triple Sharing", label: `Co-Living Triple - ₹${formatPrice(pg.coliving_three_sharing)}` });
      if (pg.coliving_four_sharing && Number(pg.coliving_four_sharing) > 0) types.push({ value: "Four Sharing", label: `Co-Living Four - ₹${formatPrice(pg.coliving_four_sharing)}` });
    } else if (pg.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) types.push({ value: "1BHK", label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` });
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) types.push({ value: "2BHK", label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` });
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) types.push({ value: "3BHK", label: `3 BHK - ₹${formatPrice(pg.price_3bhk)}` });
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) types.push({ value: "4BHK", label: `4 BHK - ₹${formatPrice(pg.price_4bhk)}` });
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
      background: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 32,
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 40px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)"
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
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
            zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
          }}
        >
          <X size={24} color="#1e293b" />
        </button>

        <div style={{ padding: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <MessageCircle size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Contact Owner
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                {pg.pg_name}
              </p>
            </div>
          </div>

          {Number(pg.min_stay_months) > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              padding: "12px 16px",
              borderRadius: 14,
              marginBottom: 16,
              fontSize: 13,
              color: "#78350f",
              border: "1px solid #fbbf24",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <Lock size={18} />
              <span>Minimum stay requirement: <strong>{pg.min_stay_months} months</strong></span>
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
                fontWeight: 600,
                color: "#1e293b"
              }}>
                {pg.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
              </label>
              <select
                name="roomType"
                value={bookingData.roomType}
                onChange={(e) => setBookingData({ ...bookingData, roomType: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: 14,
                  fontSize: 14,
                  background: "#f8fafc",
                  fontWeight: 500,
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                <option value="">Select {pg.pg_category === "to_let" ? "BHK Type" : "Room Type"}</option>
                {getRoomTypes().map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              {selectedPrice !== null && selectedPrice > 0 && (
                <p style={{
                  marginTop: 10,
                  fontWeight: 600,
                  color: "#10b981",
                  fontSize: 15,
                  background: "#f0fdf4",
                  padding: "8px 16px",
                  borderRadius: 10,
                  display: "inline-block"
                }}>
                  ✅ ₹{formatPrice(selectedPrice)}/month
                </p>
              )}
            </div>

            <div style={{
              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              borderRadius: 16,
              padding: 18,
              marginBottom: 24,
              border: "1px solid #93c5fd"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <InfoIcon size={18} color="#2563eb" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>
                  What happens next?
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#1e3a5f", fontSize: 13, lineHeight: 1.8 }}>
                <li>📨 Owner receives your inquiry instantly</li>
                <li>📱 Owner gets WhatsApp notification</li>
                <li>📞 Owner will contact you within 24 hours</li>
                <li>💳 No payment required now</li>
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
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: 14,
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
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s ease"
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

/* ================= QUICK VIEW MODAL ================= */
const QuickViewModal = ({ pg, onClose, onBook, onSaveFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  
  const photosArray = React.useMemo(() => {
    if (pg.photos && Array.isArray(pg.photos) && pg.photos.length > 0) {
      return pg.photos.filter(photo => photo && photo.trim() !== "");
    }
    return [];
  }, [pg.photos]);
  
  const hasMultipleImages = photosArray.length > 1;
  
  useEffect(() => {
    if (hasMultipleImages && isPlaying) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % photosArray.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length, isPlaying]);
  
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

  const amenities = [
    { icon: <Wifi size={16} />, label: "WiFi", available: pg.wifi_available },
    { icon: <Snowflake size={16} />, label: "AC", available: pg.ac_available },
    { icon: <Car size={16} />, label: "Parking", available: pg.parking_available },
    { icon: <Utensils size={16} />, label: "Food", available: pg.food_available },
    { icon: <Users size={16} />, label: "Family", available: pg.family_allowed },
    { icon: <Bed size={16} />, label: "Attached Bath", available: pg.attached_bathroom },
  ].filter(a => a.available);
  
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.9)",
      backdropFilter: "blur(16px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.98)",
        borderRadius: 32,
        width: "100%",
        maxWidth: 560,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.95)",
            border: "none",
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "#fee2e2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.95)"; }}
        >
          <X size={24} color="#1e293b" />
        </button>
        
        <button
          onClick={toggleFavorite}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "rgba(255,255,255,0.95)",
            border: "none",
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
          }}
        >
          <Heart size={20} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} />
        </button>
        
        <div style={{ position: "relative", height: 280, background: "#f1f5f9" }}>
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
            <>
              <div style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 8,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                padding: "6px 14px",
                borderRadius: 30,
                alignItems: "center"
              }}>
                <button
                  onClick={() => setCurrentImage((prev) => (prev - 1 + photosArray.length) % photosArray.length)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                {photosArray.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: currentImage === idx ? 10 : 6,
                      height: currentImage === idx ? 10 : 6,
                      borderRadius: "50%",
                      background: currentImage === idx ? "white" : "rgba(255,255,255,0.4)",
                      transition: "all 0.3s ease"
                    }}
                  />
                ))}
                <button
                  onClick={() => setCurrentImage((prev) => (prev + 1) % photosArray.length)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>
              
              <div style={{
                position: "absolute",
                top: 16,
                right: 76,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                color: "white"
              }}>
                {currentImage + 1} / {photosArray.length}
              </div>
            </>
          )}
          
          <div style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 12,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <Camera size={14} />
            {photosArray.length} Photos
          </div>
        </div>
        
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {pg.pg_name}
            </h2>
            {pg.is_verified && (
              <div style={{
                background: "#10b981",
                color: "white",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <Shield size={12} /> Verified
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, color: "#64748b", fontSize: 14 }}>
            <MapPin size={16} color="#64748b" />
            <span>{pg.area}{pg.city ? `, ${pg.city}` : ""}</span>
            {pg.distance && (
              <span style={{ marginLeft: 8, color: "#6366f1", fontWeight: 500 }}>
                • {pg.distance.toFixed(1)} km away
              </span>
            )}
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a" }}>
              ₹{formatPrice(startingPrice)}
              <span style={{ fontSize: 16, fontWeight: 400, color: "#64748b", marginLeft: 6 }}>
                onwards
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#10b981", fontWeight: 500 }}>per month</div>
          </div>
          
          {/* Badges */}
          <div style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16
          }}>
            {pg.pg_category !== "to_let" && (
              <span style={{
                background: "#f0fdf4",
                color: "#059669",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Bed size={14} /> {pg.available_rooms || 0} Beds Left
              </span>
            )}
            {pg.pg_category !== "to_let" && pg.available_rooms < 5 && pg.available_rooms > 0 && (
              <span style={{
                background: "#fef3c7",
                color: "#d97706",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Flame size={14} /> Filling Fast
              </span>
            )}
            {pg.pg_category === "pg" && pg.food_available && (
              <span style={{
                background: "#eff6ff",
                color: "#2563eb",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Utensils size={14} /> {pg.food_type === 'veg' ? 'Vegetarian' : pg.food_type === 'non-veg' ? 'Non-Veg' : 'Veg & Non-Veg'}
              </span>
            )}
            {pg.pg_category === "to_let" && pg.bhk_type && (
              <span style={{
                background: "#f1f5f9",
                color: "#475569",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Building size={14} /> {pg.bhk_type}
              </span>
            )}
            {pg.pg_category === "to_let" && pg.furnishing_type && (
              <span style={{
                background: "#f1f5f9",
                color: "#475569",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Sofa size={14} /> {pg.furnishing_type}
              </span>
            )}
            {pg.pg_category === "to_let" && pg.family_allowed && (
              <span style={{
                background: "#fdf2f8",
                color: "#be185d",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Users size={14} /> Family
              </span>
            )}
          </div>
          
          {/* Amenities */}
          {amenities.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Amenities
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {amenities.map((amenity, idx) => (
                  <span key={idx} style={{
                    background: "#f8fafc",
                    padding: "4px 12px",
                    borderRadius: 16,
                    fontSize: 12,
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    {amenity.icon} {amenity.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleCall}
              style={{
                flex: 1,
                padding: "14px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Phone size={18} />
              Call
            </button>
            
            <button
              onClick={handleWhatsApp}
              style={{
                flex: 1,
                padding: "14px",
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <MessageCircle size={18} />
              WhatsApp
            </button>
            
            <button
              onClick={handleBookNow}
              style={{
                flex: 1,
                padding: "14px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Check size={18} />
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= COMPARE MODAL ================= */
const CompareModal = ({ selectedPGs, allPGs, onClose }) => {
  const [compareData, setCompareData] = useState([]);

  useEffect(() => {
    const propertiesToCompare = allPGs.filter(pg => selectedPGs.has(pg.id));
    setCompareData(propertiesToCompare);
  }, [selectedPGs, allPGs]);

  if (compareData.length === 0) return null;

  const getFeatureValue = (pg, feature) => {
    switch(feature) {
      case 'name': return pg.pg_name;
      case 'type': return pg.pg_category === 'pg' ? 'PG' : pg.pg_category === 'coliving' ? 'Co-Living' : 'To-Let';
      case 'price': return `₹${formatPrice(getEffectiveRent(pg))}`;
      case 'deposit': return `₹${formatPrice(pg.deposit_amount || pg.security_deposit || 0)}`;
      case 'location': return pg.area || pg.city || 'N/A';
      case 'food': return pg.food_available ? (pg.food_type === 'veg' ? 'Vegetarian' : pg.food_type === 'non-veg' ? 'Non-Veg' : 'Both') : 'No';
      case 'wifi': return pg.wifi_available ? '✅' : '❌';
      case 'ac': return pg.ac_available ? '✅' : '❌';
      case 'parking': return pg.parking_available ? '✅' : '❌';
      case 'attached_bathroom': return pg.attached_bathroom ? '✅' : '❌';
      case 'available_rooms': return pg.available_rooms || 0;
      case 'min_stay': return pg.min_stay_months ? `${pg.min_stay_months} months` : 'N/A';
      case 'distance': return pg.distance ? `${pg.distance.toFixed(1)} km` : 'N/A';
      default: return 'N/A';
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
      background: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: 20,
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.98)",
        borderRadius: 32,
        width: "100%",
        maxWidth: 1200,
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 40px 80px rgba(0,0,0,0.3)"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.95)",
            border: "none",
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
          }}
        >
          <X size={24} color="#1e293b" />
        </button>

        <div style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <BarChart size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Compare Properties
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                Comparing {compareData.length} properties side by side
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ 
                    padding: "16px 20px", 
                    background: "#f8fafc",
                    textAlign: "left",
                    borderRadius: "12px 0 0 0",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#475569",
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    minWidth: 140
                  }}>
                    Features
                  </th>
                  {compareData.map((pg, idx) => (
                    <th key={pg.id} style={{ 
                      padding: "16px 20px", 
                      background: "#f8fafc",
                      textAlign: "center",
                      minWidth: 200,
                      borderRadius: idx === compareData.length - 1 ? "0 12px 0 0" : "0"
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 10, color: "#0f172a" }}>{pg.pg_name}</div>
                      {pg.photos && pg.photos.length > 0 && (
                        <img 
                          src={getCorrectImageUrl(pg.photos[0])}
                          alt={pg.pg_name}
                          style={{ 
                            width: "100%", 
                            height: 120, 
                            objectFit: "cover", 
                            borderRadius: 12,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/no-image.png";
                          }}
                        />
                      )}
                      {pg.distance && (
                        <div style={{
                          marginTop: 10,
                          fontSize: 12,
                          color: "#6366f1",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}>
                          <Navigation size={14} />
                          {pg.distance.toFixed(1)} km away
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, featureIdx) => {
                  const isPrice = feature.key === 'price';
                  const isAvailable = feature.key === 'available_rooms';
                  
                  return (
                    <tr key={feature.key} style={{
                      background: featureIdx % 2 === 0 ? "#ffffff" : "#fafafa",
                      transition: "background 0.2s ease"
                    }}>
                      <td style={{ 
                        padding: "14px 20px", 
                        fontWeight: 600,
                        borderBottom: "1px solid #f1f5f9",
                        color: "#1e293b",
                        fontSize: 14,
                        position: "sticky",
                        left: 0,
                        background: featureIdx % 2 === 0 ? "#ffffff" : "#fafafa",
                        zIndex: 1
                      }}>
                        {feature.label}
                      </td>
                      {compareData.map((pg) => {
                        const value = getFeatureValue(pg, feature.key);
                        const isBest = feature.key === 'price' && 
                          value !== 'N/A' && 
                          value !== '0' &&
                          parseInt(value.replace(/[₹,]/g, '')) === Math.min(
                            ...compareData.map(p => parseInt(getFeatureValue(p, feature.key).replace(/[₹,]/g, '')) || 999999)
                          );
                        
                        return (
                          <td key={`${pg.id}-${feature.key}`} style={{ 
                            padding: "14px 20px", 
                            textAlign: "center",
                            borderBottom: "1px solid #f1f5f9",
                            fontSize: 14,
                            color: "#1e293b"
                          }}>
                            <span style={{
                              background: isPrice && isBest ? "linear-gradient(135deg, #10b981, #059669)" : "transparent",
                              color: isPrice && isBest ? "white" : "#1e293b",
                              padding: isPrice && isBest ? "6px 16px" : "0",
                              borderRadius: isPrice && isBest ? "20px" : "0",
                              fontWeight: isPrice && isBest ? 700 : 400,
                              display: "inline-block"
                            }}>
                              {value}
                              {isPrice && isBest && (
                                <span style={{ marginLeft: 6, fontSize: 12 }}>🏆</span>
                              )}
                            </span>
                            {isAvailable && Number(value) > 0 && (
                              <span style={{
                                display: "block",
                                fontSize: 11,
                                color: "#10b981",
                                marginTop: 2,
                                fontWeight: 500
                              }}>
                                {Number(value) > 5 ? "👍 Available" : "🔥 Limited"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid #f1f5f9"
          }}>
            <button
              onClick={onClose}
              style={{
                padding: "12px 32px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= PROMOTIONAL BANNERS SLIDER ================= */
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
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)"
    },
    {
      id: 2,
      title: "Direct Owner Contact",
      subtitle: "No Middlemen",
      description: "Save on commission",
      icon: "🏠",
      gradient: "linear-gradient(135deg, #10b981, #059669)"
    },
    {
      id: 3,
      title: "Instant Booking",
      subtitle: "Fast Confirmation",
      description: "Get confirmed in minutes",
      icon: "⚡",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)"
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
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovered, promoBanners.length]);

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>🔥 Exclusive Offers</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>Limited time deals for you</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button 
              onClick={() => setActiveIndex((prev) => (prev - 1 + promoBanners.length) % promoBanners.length)} 
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: "50%", 
                background: "#f1f5f9", 
                border: "none", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setActiveIndex((prev) => (prev + 1) % promoBanners.length)} 
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: "50%", 
                background: "#f1f5f9", 
                border: "none", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div style={{ 
          display: "flex", 
          gap: 14, 
          overflowX: "auto", 
          padding: "4px 2px 12px",
          scrollbarWidth: "thin",
          scrollSnapType: "x mandatory"
        }}>
          {promoBanners.map((banner) => (
            <div 
              key={banner.id} 
              onClick={() => onBannerClick(banner)} 
              style={{ 
                minWidth: 280, 
                background: banner.gradient, 
                borderRadius: 20, 
                padding: 20, 
                color: "white", 
                cursor: "pointer",
                scrollSnapAlign: "start",
                transition: "transform 0.3s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{banner.icon}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700 }}>{banner.title}</h3>
              <p style={{ fontSize: 14, opacity: 0.9 }}>{banner.subtitle}</p>
              <p style={{ fontSize: 12, opacity: 0.75 }}>{banner.description}</p>
              <div style={{
                marginTop: 12,
                display: "inline-block",
                padding: "6px 16px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600
              }}>
                Claim Now →
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>🔥 Exclusive Offers</h2>
          <p style={{ fontSize: 14, color: "#64748b" }}>Grab these limited-time deals before they're gone!</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            onClick={() => setActiveIndex((prev) => (prev - 1 + promoBanners.length) % promoBanners.length)} 
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: "50%", 
              background: "#f1f5f9", 
              border: "none", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
          >
            <ChevronLeft size={20} color="#1e293b" />
          </button>
          <button 
            onClick={() => setActiveIndex((prev) => (prev + 1) % promoBanners.length)} 
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: "50%", 
              background: "#f1f5f9", 
              border: "none", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
          >
            <ChevronRight size={20} color="#1e293b" />
          </button>
        </div>
      </div>
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: 20,
          alignItems: "stretch"
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {promoBanners.slice(0, 3).map((banner) => (
          <div 
            key={banner.id} 
            onClick={() => onBannerClick(banner)} 
            style={{ 
              background: banner.gradient, 
              borderRadius: 24, 
              padding: 28, 
              color: "white", 
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ 
              position: "absolute",
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              pointerEvents: "none"
            }} />
            <div style={{ fontSize: 48, marginBottom: 16 }}>{banner.icon}</div>
            <h3 style={{ fontSize: 28, fontWeight: 700 }}>{banner.title}</h3>
            <p style={{ fontSize: 16, opacity: 0.9 }}>{banner.subtitle}</p>
            <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 16 }}>{banner.description}</p>
            <div style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 600,
              backdropFilter: "blur(4px)"
            }}>
              Claim Offer →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= HERO BANNER ================= */
const HeroBanner = () => {
  const isMobile = isMobileDevice();
  
  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1e3a5f 60%, #2c5282 100%)",
      borderRadius: 28,
      marginBottom: 40,
      overflow: "hidden",
      padding: isMobile ? "40px 24px" : "64px 48px",
      position: "relative",
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
    }}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "rgba(99, 102, 241, 0.1)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: -80,
        left: -80,
        width: 250,
        height: 250,
        borderRadius: "50%",
        background: "rgba(16, 185, 129, 0.08)",
        pointerEvents: "none"
      }} />
      
      <h1 style={{
        fontSize: isMobile ? "34px" : "52px",
        fontWeight: 800,
        color: "#ffffff",
        marginBottom: 16,
        lineHeight: 1.2,
        position: "relative",
        zIndex: 1
      }}>
        Find Verified <br style={isMobile ? { display: "none" } : {}} />PGs, CoLiving & Rental Homes
      </h1>
      <p style={{
        fontSize: isMobile ? "16px" : "20px",
        color: "rgba(255,255,255,0.85)",
        marginBottom: 32,
        maxWidth: "90%",
        position: "relative",
        zIndex: 1
      }}>
        Book trusted stays with secure payments and verified owners.
      </p>
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: 12,
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ 
          background: "rgba(16, 185, 129, 0.9)", 
          color: "white", 
          padding: "10px 20px", 
          borderRadius: 30, 
          fontWeight: 600,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(4px)"
        }}>
          <CheckCircle size={18} /> Verified
        </div>
        <div style={{ 
          background: "rgba(99, 102, 241, 0.9)", 
          color: "white", 
          padding: "10px 20px", 
          borderRadius: 30, 
          fontWeight: 600,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(4px)"
        }}>
          <Shield size={18} /> Secure
        </div>
        <div style={{ 
          background: "rgba(139, 92, 246, 0.9)", 
          color: "white", 
          padding: "10px 20px", 
          borderRadius: 30, 
          fontWeight: 600,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(4px)"
        }}>
          <Users size={18} /> Trusted
        </div>
        <div style={{ 
          background: "rgba(245, 158, 11, 0.9)", 
          color: "white", 
          padding: "10px 20px", 
          borderRadius: 30, 
          fontWeight: 600,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(4px)"
        }}>
          <ZapIcon size={18} /> Instant Booking
        </div>
      </div>
    </div>
  );
};

/* ================= LOCATION PERMISSION BANNER ================= */
const LocationPermissionBanner = ({ onAllow, onDeny, isLoading }) => {
  return (
    <div style={{
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      borderRadius: 20,
      marginBottom: 24,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 16,
      boxShadow: "0 8px 24px rgba(99, 102, 241, 0.2)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ 
          background: "rgba(255,255,255,0.2)", 
          borderRadius: "50%", 
          width: 52, 
          height: 52, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center"
        }}>
          <Navigation size={26} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: 0 }}>
            📍 Find Properties Near You
          </h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", margin: "4px 0 0" }}>
            Allow location access to see properties within 5km of your area
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button 
          onClick={onDeny} 
          style={{ 
            padding: "10px 20px", 
            background: "rgba(255,255,255,0.2)", 
            color: "white", 
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 12, 
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 14,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
        >
          Not Now
        </button>
        <button 
          onClick={onAllow} 
          disabled={isLoading} 
          style={{ 
            padding: "10px 28px", 
            background: "white", 
            color: "#6366f1", 
            border: "none", 
            borderRadius: 12, 
            fontWeight: 600,
            fontSize: 14,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.transform = "scale(1)"; }}
        >
          {isLoading ? "Getting location..." : "Allow Location"}
        </button>
      </div>
    </div>
  );
};

/* ================= PG PROPERTY CARD ================= */
const PGPropertyCard = ({ pg, onQuickView, onFavorite, onContact, onCardClick, isFavorite, isSelectedForCompare, onSelectForCompare, compareMode }) => {
  const isMobile = window.innerWidth < 768;
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const photosArray = React.useMemo(() => {
    if (pg.photos && Array.isArray(pg.photos) && pg.photos.length > 0) {
      return pg.photos.filter(photo => photo && photo.trim() !== "");
    }
    return [];
  }, [pg.photos]);
  
  const hasMultipleImages = photosArray.length > 1;
  
  useEffect(() => {
    if (hasMultipleImages && isHovered) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % photosArray.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, photosArray.length, isHovered]);
  
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
    if (pg.food_type === 'veg') return "🌿 Veg";
    if (pg.food_type === 'non-veg') return "🍖 Non-Veg";
    if (pg.food_type === 'both') return "🍽️ Veg & Non-Veg";
    return "🍽️ Food";
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

  const propertyTypeColors = {
    pg: { bg: "linear-gradient(135deg, #10b981, #059669)", label: "PG" },
    coliving: { bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)", label: "Co-Living" },
    to_let: { bg: "linear-gradient(135deg, #f59e0b, #d97706)", label: "To-Let" }
  };

  const typeInfo = propertyTypeColors[pg.pg_category] || propertyTypeColors.pg;
  
  return (
    <div
      onClick={() => onCardClick(pg)}
      style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "#ffffff",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        border: isSelectedForCompare ? "3px solid #8b5cf6" : "1px solid #f1f5f9",
        position: "relative",
        width: "100%",
        maxWidth: isMobile ? "100%" : "400px",
        minWidth: 0,
        boxSizing: "border-box",
        boxShadow: isHovered ? "0 20px 60px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.04)"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {compareMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelectForCompare(pg.id, e); }}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "rgba(255,255,255,0.95)",
            border: "none",
            width: 38,
            height: 38,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 20,
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
        >
          {isSelectedForCompare ? <Check size={18} color="#8b5cf6" /> : <Plus size={18} color="#475569" />}
        </button>
      )}
      
      <button
        onClick={(e) => { e.stopPropagation(); onQuickView(pg, e); }}
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: "rgba(255,255,255,0.95)",
          border: "none",
          padding: "6px 16px",
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 500,
          color: "#1e293b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.95)"; e.currentTarget.style.transform = "scale(1)"; }}
      >
        <Eye size={14} /> Quick View
      </button>
      
      <button
        onClick={(e) => { e.stopPropagation(); onFavorite(pg.id, e); }}
        style={{
          position: "absolute",
          top: 14,
          left: compareMode ? 62 : 14,
          background: "rgba(255,255,255,0.95)",
          border: "none",
          width: 38,
          height: 38,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <Heart size={18} color="#ef4444" fill={isFavorite ? "#ef4444" : "none"} />
      </button>
      
      <div style={{ position: "relative", overflow: "hidden", height: isMobile ? 200 : 240 }}>
        {!imageLoaded && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
            animation: "pulse 1.5s ease-in-out infinite"
          }} />
        )}
        <img
          src={currentPhotoUrl}
          alt={pg.pg_name}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            display: "block",
            transition: "transform 0.6s ease"
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/no-image.png";
          }}
          onLoad={() => setImageLoaded(true)}
        />
        
        <div style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(8px)",
          padding: "2px 10px",
          borderRadius: 16
        }}>
          {photosArray.slice(0, 5).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: currentImage === idx ? 8 : 4,
                height: currentImage === idx ? 8 : 4,
                borderRadius: "50%",
                background: currentImage === idx ? "white" : "rgba(255,255,255,0.4)",
                transition: "all 0.3s ease"
              }}
            />
          ))}
        </div>
        
        <div style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          background: typeInfo.bg,
          color: "#fff",
          padding: "6px 16px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          {typeInfo.label}
        </div>
        
        {pg.distance && (
          <div style={{
            position: "absolute",
            bottom: 14,
            right: 14,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            color: "white",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <Navigation size={10} /> {pg.distance.toFixed(1)} km
          </div>
        )}
        
        {pg.is_verified && (
          <div style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(16, 185, 129, 0.9)",
            backdropFilter: "blur(4px)",
            color: "white",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}>
            <Shield size={12} /> Verified
          </div>
        )}
      </div>
      
      <div style={{ padding: 18 }}>
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 700, 
          marginBottom: 4, 
          color: "#0f172a",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {pg.pg_name}
        </h3>
        
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12, color: "#64748b", fontSize: 14 }}>
          <MapPin size={14} />
          <span style={{ 
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {pg.area}{pg.city ? `, ${pg.city}` : ""}
          </span>
        </div>
        
        {pg.pg_category !== "to_let" ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "baseline", gap: 4 }}>
                ₹{formatPrice(startingPrice)} <span style={{ fontSize: 14, fontWeight: 400, color: "#64748b" }}>onwards</span>
              </div>
              <div style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>per month</div>
            </div>
            
            <div style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 12
            }}>
              <span style={{
                background: "#f0fdf4",
                color: "#059669",
                padding: "3px 12px",
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <Bed size={14} /> {pg.available_rooms || 0} Beds
              </span>
              
              {pg.pg_category === "pg" && foodTypeDisplay && (
                <span style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "3px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  {foodTypeDisplay}
                </span>
              )}
              
              {isFillingFast && (
                <span style={{
                  background: "#fef3c7",
                  color: "#d97706",
                  padding: "3px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  <Flame size={14} /> Hot Deal
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "baseline", gap: 4 }}>
                ₹{formatPrice(startingPrice)} <span style={{ fontSize: 14, fontWeight: 400, color: "#64748b" }}>/month</span>
              </div>
            </div>
            
            <div style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 12
            }}>
              <span style={{
                background: "#f1f5f9",
                color: "#475569",
                padding: "3px 12px",
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <Building size={14} /> {getBHKDisplay()}
              </span>
              {pg.furnishing_type && (
                <span style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  padding: "3px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  <Sofa size={14} /> {pg.furnishing_type}
                </span>
              )}
              {pg.ready_to_move && (
                <span style={{
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "3px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  ✓ Ready to Move
                </span>
              )}
            </div>
          </>
        )}
        
        <button
          onClick={(e) => { e.stopPropagation(); onContact(pg); }}
          style={{
            width: "100%",
            fontSize: 14,
            padding: "12px 16px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            border: "none",
            borderRadius: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <MessageCircle size={16} /> Contact Owner
        </button>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
function UserPGSearch() {
  const isMobile = window.innerWidth < 768;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [allPGs, setAllPGs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;
  
  const [activeTab, setActiveTab] = useState("all");
  
  const propertyTabs = [
    { id: "all", label: "All", icon: <Grid size={16} /> },
    { id: "pg", label: "PG", icon: <Home size={16} /> },
    { id: "coliving", label: "Co-Living", icon: <Users size={16} /> },
    { id: "to_let", label: "To-Let", icon: <Building size={16} /> }
  ];
  
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
  const [viewMode, setViewMode] = useState("grid");
  const [searchInput, setSearchInput] = useState("");

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
        resetAndFetch();
      },
      () => {
        localStorage.setItem(LOCATION_AUTO_ASKED_KEY, "true");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const applyQuickFilter = (filter) => {
    const newActiveFilters = new Set(activeQuickFilters);
    if (newActiveFilters.has(filter.id)) {
      newActiveFilters.delete(filter.id);
      if (filter.type === "location") {
        setFilters(prev => ({ ...prev, nearMe: false }));
      } else if (filter.type === "food") {
        setFilters(prev => ({ ...prev, foodType: "" }));
      } else if (filter.type === "amenity") {
        setFilters(prev => ({ ...prev, [filter.field]: false }));
      }
    } else {
      newActiveFilters.add(filter.id);
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
    resetAndFetch();
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
      
      if (filters.location) {
        url += `&search=${encodeURIComponent(filters.location)}`;
      }
      
      if (userLocation && filters.nearMe) {
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
      }
      
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
        
        setHasMorePages(response.data.hasMore === true);
        setTotalCount(response.data.total || 0);
        setCurrentPage(pageToLoad);
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error("Error loading PGs:", error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const resetAndFetch = () => {
    setCurrentPage(1);
    loadPGs(1, false);
  };

  const loadMoreProperties = () => {
    if (!loadingMore && hasMorePages && !loading) {
      const nextPage = currentPage + 1;
      loadPGs(nextPage, true);
    }
  };

  useEffect(() => {
    resetAndFetch();
    loadFavorites();
  }, []);

  useEffect(() => {
    resetAndFetch();
  }, [filters.location, filters.sort, filters.nearMe, userLocation, filters.minBudget, filters.maxBudget, filters.food, filters.ac, filters.wifi, filters.parking, filters.foodType]);

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
      showNotification("❤️ Added to favorites");
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
        showNotification("📍 Location detected! Showing nearby properties");
        setLocationLoading(false);
        resetAndFetch();
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
        resetAndFetch();
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

  const getFilteredByTab = useCallback(() => {
    const allFiltered = applyFilters();
    if (activeTab === "all") return allFiltered;
    return allFiltered.filter((item) => item.pg_category === activeTab);
  }, [applyFilters, activeTab]);

  const filteredPGs = getFilteredByTab();
  const resultCount = filteredPGs.length;

  const handleBudgetChange = (min, max) => {
    setFilters(prev => ({ ...prev, minBudget: min, maxBudget: max }));
    showNotification(`Budget set: ₹${formatPrice(min)} - ₹${formatPrice(max)}`);
    resetAndFetch();
  };

  const resetFilters = () => {
    setFilters({
      location: "", minBudget: 0, maxBudget: 50000, food: false, ac: false, wifi: false, parking: false, sort: "", nearMe: false, foodType: ""
    });
    setActiveQuickFilters(new Set());
    setSearchInput("");
    showNotification("All filters reset");
    resetAndFetch();
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

  const getTabTitle = () => {
    switch(activeTab) {
      case "pg": return "PG Accommodations";
      case "coliving": return "Co-Living Spaces";
      case "to_let": return "To-Let Homes";
      default: return "All Properties";
    }
  };

  const hasActiveFilters = filters.location || filters.minBudget > 0 || filters.maxBudget < 50000 || filters.food || filters.ac || filters.wifi || filters.parking || filters.foodType || activeQuickFilters.size > 0;

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: 56, 
            height: 56, 
            border: "4px solid #e2e8f0", 
            borderTop: "4px solid #6366f1", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite", 
            margin: "0 auto 16px" 
          }} />
          <p style={{ color: "#64748b", fontSize: 16 }}>Loading properties...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: "0 auto", 
      minHeight: "100vh", 
      padding: "0 20px 40px",
      background: "#f8fafc"
    }}>
      {notification && (
        <div style={{
          position: "fixed",
          top: 24,
          right: 24,
          background: notification.isError ? "#ef4444" : "#10b981",
          color: "white",
          padding: "14px 24px",
          borderRadius: 16,
          zIndex: 4000,
          animation: "slideIn 0.3s ease",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
          fontWeight: 500
        }}>
          {notification.isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {notification.message}
        </div>
      )}

      {showLocationBanner && (
        <LocationPermissionBanner onAllow={handleAllowLocation} onDeny={handleDenyLocation} isLoading={locationLoading} />
      )}

      <HeroBanner />

      {userLocation && (
        <div style={{
          background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
          borderRadius: 16,
          padding: "14px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          border: "1px solid #93c5fd"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Navigation size={18} color="white" />
            </div>
            <div>
              <span style={{ fontWeight: 600, color: "#1e40af" }}>
                📍 {userAddress ? `Near ${userAddress}` : "Your Location"}
              </span>
              <span style={{ fontSize: 12, color: "#3b82f6", marginLeft: 8 }}>
                Properties within 5km
              </span>
            </div>
          </div>
          <button
            onClick={detectLocation}
            disabled={locationLoading}
            style={{
              padding: "8px 18px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { if (!locationLoading) e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { if (!locationLoading) e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Navigation size={14} />
            Refresh Location
          </button>
        </div>
      )}

      <PromoBannerSlider onBannerClick={handlePromoBannerClick} />

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: "#0f172a" }}>⚡ Quick Filters</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {quickFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => applyQuickFilter(filter)}
              style={{
                padding: "10px 20px",
                borderRadius: 40,
                background: activeQuickFilters.has(filter.id) 
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)" 
                  : "#f1f5f9",
                color: activeQuickFilters.has(filter.id) ? "white" : "#1e293b",
                border: activeQuickFilters.has(filter.id) ? "none" : "1px solid #e2e8f0",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { 
                if (!activeQuickFilters.has(filter.id)) {
                  e.currentTarget.style.background = "#e2e8f0"; 
                }
              }}
              onMouseLeave={(e) => { 
                if (!activeQuickFilters.has(filter.id)) {
                  e.currentTarget.style.background = "#f1f5f9"; 
                }
              }}
            >
              {filter.icon}
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: "#0f172a" }}>📍 Popular Areas in Bangalore</h3>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "thin" }}>
          {popularAreas.map((area) => (
            <button
              key={area.name}
              onClick={() => filterByArea(area.name)}
              style={{
                padding: "10px 22px",
                borderRadius: 40,
                border: filters.location === area.name ? `2px solid ${area.color}` : "1px solid #e2e8f0",
                background: filters.location === area.name ? `${area.color}15` : "#ffffff",
                color: filters.location === area.name ? area.color : "#1e293b",
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { 
                if (filters.location !== area.name) {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => { 
                if (filters.location !== area.name) {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span>{area.name.charAt(0)}</span> {area.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        borderRadius: 24, 
        padding: "20px 24px", 
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)", 
        marginBottom: 32, 
        position: "sticky", 
        top: 16, 
        zIndex: 100,
        border: "1px solid rgba(255,255,255,0.5)"
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input 
              placeholder="Search by area, city or property name..." 
              value={filters.location} 
              onChange={(e) => setFilters({ ...filters, location: e.target.value })} 
              style={{ 
                width: "100%", 
                padding: "12px 16px 12px 44px", 
                border: "2px solid #e2e8f0", 
                borderRadius: 40, 
                fontSize: 14, 
                background: "#f8fafc",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <button 
            onClick={() => setShowBudgetFilter(true)} 
            style={{ 
              padding: "12px 20px", 
              background: "#f1f5f9", 
              border: "1px solid #e2e8f0",
              borderRadius: 40, 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              cursor: "pointer", 
              fontWeight: 500,
              fontSize: 14,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
          >
            <Coins size={16} /> Budget
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{ 
              padding: "12px 20px", 
              background: showFilters ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#f1f5f9", 
              color: showFilters ? "white" : "#1e293b", 
              border: showFilters ? "none" : "1px solid #e2e8f0",
              borderRadius: 40, 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              cursor: "pointer", 
              fontWeight: 500,
              fontSize: 14,
              transition: "all 0.2s ease"
            }}
          >
            <Filter size={16} /> Filters
          </button>
          <button 
            onClick={detectLocation} 
            style={{ 
              padding: "12px 20px", 
              background: filters.nearMe ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#f1f5f9", 
              color: filters.nearMe ? "white" : "#1e293b", 
              border: filters.nearMe ? "none" : "1px solid #e2e8f0",
              borderRadius: 40, 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              cursor: "pointer", 
              fontWeight: 500,
              fontSize: 14,
              transition: "all 0.2s ease"
            }}
          >
            <Navigation size={16} /> Near Me
          </button>
          <button 
            onClick={toggleCompareMode} 
            style={{ 
              padding: "12px 20px", 
              background: compareMode ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" : "#f1f5f9", 
              color: compareMode ? "white" : "#1e293b", 
              border: compareMode ? "none" : "1px solid #e2e8f0",
              borderRadius: 40, 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              cursor: "pointer", 
              fontWeight: 500,
              fontSize: 14,
              transition: "all 0.2s ease"
            }}
          >
            <BarChart size={16} /> Compare
          </button>
          {hasActiveFilters && (
            <button 
              onClick={resetFilters} 
              style={{ 
                padding: "12px 20px", 
                background: "linear-gradient(135deg, #ef4444, #dc2626)", 
                color: "white", 
                border: "none", 
                borderRadius: 40, 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                cursor: "pointer", 
                fontWeight: 500,
                fontSize: 14,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <X size={16} /> Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ paddingTop: 20, marginTop: 20, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Advanced Filters</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <select 
                value={filters.foodType} 
                onChange={(e) => setFilters({ ...filters, foodType: e.target.value })} 
                style={{ 
                  padding: "10px 16px", 
                  border: "2px solid #e2e8f0", 
                  borderRadius: 30, 
                  background: "#f8fafc",
                  fontSize: 14,
                  transition: "border-color 0.2s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                <option value="">Any Food Type</option>
                <option value="veg">🌿 Vegetarian Only</option>
                <option value="non-veg">🍖 Non-Vegetarian</option>
                <option value="both">🥗 Both Available</option>
              </select>
              <select 
                value={filters.sort} 
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })} 
                style={{ 
                  padding: "10px 16px", 
                  border: "2px solid #e2e8f0", 
                  borderRadius: 30, 
                  background: "#f8fafc",
                  fontSize: 14,
                  transition: "border-color 0.2s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              >
                <option value="">Sort by: Relevance</option>
                <option value="low">💰 Price: Low to High</option>
                <option value="high">💰 Price: High to Low</option>
                <option value="new">🆕 Newest First</option>
                {userLocation && <option value="distance">📍 Distance (Nearest First)</option>}
              </select>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "6px 16px", 
                  background: filters.food ? "linear-gradient(135deg, #10b981, #059669)" : "#f1f5f9", 
                  borderRadius: 30, 
                  cursor: "pointer", 
                  fontSize: 13,
                  fontWeight: filters.food ? 500 : 400,
                  color: filters.food ? "white" : "#1e293b",
                  border: filters.food ? "none" : "1px solid #e2e8f0",
                  transition: "all 0.2s ease"
                }}>
                  <input type="checkbox" checked={filters.food} onChange={(e) => setFilters({ ...filters, food: e.target.checked })} style={{ display: "none" }} />
                  <Utensils size={14} /> Food
                </label>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "6px 16px", 
                  background: filters.ac ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#f1f5f9", 
                  borderRadius: 30, 
                  cursor: "pointer", 
                  fontSize: 13,
                  fontWeight: filters.ac ? 500 : 400,
                  color: filters.ac ? "white" : "#1e293b",
                  border: filters.ac ? "none" : "1px solid #e2e8f0",
                  transition: "all 0.2s ease"
                }}>
                  <input type="checkbox" checked={filters.ac} onChange={(e) => setFilters({ ...filters, ac: e.target.checked })} style={{ display: "none" }} />
                  <Snowflake size={14} /> AC
                </label>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "6px 16px", 
                  background: filters.wifi ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "#f1f5f9", 
                  borderRadius: 30, 
                  cursor: "pointer", 
                  fontSize: 13,
                  fontWeight: filters.wifi ? 500 : 400,
                  color: filters.wifi ? "white" : "#1e293b",
                  border: filters.wifi ? "none" : "1px solid #e2e8f0",
                  transition: "all 0.2s ease"
                }}>
                  <input type="checkbox" checked={filters.wifi} onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })} style={{ display: "none" }} />
                  <Wifi size={14} /> WiFi
                </label>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "6px 16px", 
                  background: filters.parking ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#f1f5f9", 
                  borderRadius: 30, 
                  cursor: "pointer", 
                  fontSize: 13,
                  fontWeight: filters.parking ? 500 : 400,
                  color: filters.parking ? "white" : "#1e293b",
                  border: filters.parking ? "none" : "1px solid #e2e8f0",
                  transition: "all 0.2s ease"
                }}>
                  <input type="checkbox" checked={filters.parking} onChange={(e) => setFilters({ ...filters, parking: e.target.checked })} style={{ display: "none" }} />
                  <Car size={14} /> Parking
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        display: "flex", 
        gap: 6, 
        marginBottom: 28,
        borderBottom: "2px solid #f1f5f9",
        paddingBottom: 12,
        overflowX: "auto",
        scrollbarWidth: "thin"
      }}>
        {propertyTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 24px",
              borderRadius: 40,
              background: activeTab === tab.id ? "linear-gradient(135deg, #0f172a, #1e293b)" : "transparent",
              color: activeTab === tab.id ? "white" : "#475569",
              border: activeTab === tab.id ? "none" : "1px solid #e2e8f0",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 500,
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            onMouseEnter={(e) => { 
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = "#f1f5f9";
              }
            }}
            onMouseLeave={(e) => { 
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 12
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {getTabTitle()}
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            {resultCount} {resultCount === 1 ? "property" : "properties"} found
          </p>
        </div>
        
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {compareMode && selectedForCompare.size > 0 && (
            <button
              onClick={handleCompare}
              style={{
                padding: "10px 22px",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: "white",
                border: "none",
                borderRadius: 40,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <BarChart size={16} />
              Compare ({selectedForCompare.size})
            </button>
          )}
          
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 4, borderRadius: 12 }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 12px",
                background: viewMode === "grid" ? "white" : "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
              }}
            >
              <Grid size={16} color={viewMode === "grid" ? "#6366f1" : "#94a3b8"} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "8px 12px",
                background: viewMode === "list" ? "white" : "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                boxShadow: viewMode === "list" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
              }}
            >
              <List size={16} color={viewMode === "list" ? "#6366f1" : "#94a3b8"} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ 
            width: 56, 
            height: 56, 
            border: "4px solid #e2e8f0", 
            borderTop: "4px solid #6366f1", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite", 
            margin: "0 auto 20px" 
          }} />
          <p style={{ color: "#64748b", fontSize: 16 }}>Loading properties...</p>
        </div>
      ) : filteredPGs.length > 0 ? (
        <>
          <div style={{ 
            display: viewMode === "grid" ? "grid" : "flex",
            flexDirection: viewMode === "list" ? "column" : "row",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(340px, 1fr))" : "none",
            gap: viewMode === "grid" ? 28 : 16
          }}>
            {filteredPGs.map((pg) => (
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
          
          {!loading && hasMorePages && !loadingMore && filteredPGs.length > 0 && filteredPGs.length < totalCount && (
            <div style={{ textAlign: "center", marginTop: 40, marginBottom: 60 }}>
              <button
                onClick={loadMoreProperties}
                disabled={loadingMore}
                style={{
                  padding: "14px 40px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.7 : 1,
                  transition: "all 0.3s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 4px 20px rgba(99, 102, 241, 0.25)"
                }}
                onMouseEnter={(e) => { if (!loadingMore) { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99, 102, 241, 0.35)"; } }}
                onMouseLeave={(e) => { if (!loadingMore) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.25)"; } }}
              >
                {loadingMore ? (
                  <>
                    <div style={{
                      width: 20,
                      height: 20,
                      border: "2px solid white",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }} />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowDown size={20} />
                    Load More Properties
                  </>
                )}
              </button>
            </div>
          )}
          
          {loadingMore && (
            <div style={{ textAlign: "center", marginTop: 20, marginBottom: 40 }}>
              <div style={{
                width: 40,
                height: 40,
                border: "3px solid #e2e8f0",
                borderTop: "3px solid #6366f1",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto"
              }} />
              <p style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
                Loading more properties...
              </p>
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          textAlign: "center", 
          padding: "80px 20px", 
          background: "#ffffff",
          borderRadius: 24,
          marginBottom: 40,
          border: "1px solid #f1f5f9"
        }}>
          <Search size={56} style={{ margin: "0 auto 20px", color: "#94a3b8" }} />
          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>No properties found</h3>
          <p style={{ color: "#64748b", marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
            Try adjusting your filters or search for a different location
          </p>
          <button 
            onClick={resetFilters} 
            style={{ 
              padding: "12px 32px", 
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", 
              color: "white", 
              border: "none", 
              borderRadius: 40, 
              cursor: "pointer", 
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            Reset All Filters
          </button>
        </div>
      )}

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

      {isMobile && !compareMode && filteredPGs.length > 0 && (
        <div style={{ 
          position: "fixed", 
          bottom: 16, 
          left: 16, 
          right: 16, 
          zIndex: 999 
        }}>
          <button 
            onClick={() => handleBookNow(filteredPGs[0])} 
            style={{ 
              width: "100%", 
              padding: "14px", 
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", 
              color: "white", 
              border: "none", 
              borderRadius: 60, 
              fontSize: 16, 
              fontWeight: 600, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 8, 
              boxShadow: "0 4px 24px rgba(99, 102, 241, 0.4)"
            }}
          >
            <MessageCircle size={20} /> Contact Owner
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        *::-webkit-scrollbar {
          height: 4px;
          width: 6px;
        }
        *::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #6366f1;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          cursor: pointer;
          pointer-events: all;
          position: relative;
          z-index: 5;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #6366f1;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

export default UserPGSearch;