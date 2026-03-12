import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Coins,
  Camera,
  Maximize2,
  Grid,
  List,
  Play,
  Pause,
  VolumeX,
  Volume2 as VolumeIcon,
  HeartOff,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Settings,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Headphones,
  Speaker,
  Mic,
  Radio,
  Gamepad,
  Gift,
  Star as StarIcon,
  Award as AwardIcon,
  ThumbsUp as ThumbsUpIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon,
  Coffee as CoffeeIcon,
  BookOpen as BookOpenIcon,
  CreditCard as CreditCardIcon,
  Shield as ShieldIcon,
  Zap as ZapIcon2,
  Battery as BatteryIcon,
  Volume2 as VolumeIcon2,
  Bell as BellIcon,
  ThumbsUp as ThumbsUpIcon2,
  Bookmark as BookmarkIcon,
  Share2 as ShareIcon,
  Download as DownloadIcon,
  Printer as PrinterIcon,
  Copy as CopyIcon,
  Info as InfoIcon,
  Leaf as LeafIcon,
  Flame as FlameIcon,
  BatteryCharging as BatteryChargingIcon,
  Droplets as DropletsIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Tv as TvIcon,
  Wind as WindIcon,
  Sparkles as SparklesIcon,
  Pill as PillIcon,
  Dumbbell as DumbbellIcon,
  Building as BuildingIcon,
  DoorOpen as DoorOpenIcon,
  Key as KeyIcon,
  Sofa as SofaIcon,
  Hash as HashIcon,
  Sliders as SlidersIcon,
  TrendingUp as TrendingUpIcon,
  Target as TargetIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  BarChart as BarChartIcon,
  BadgePercent as BadgePercentIcon,
  Coins as CoinsIcon
} from "lucide-react";
import api from "../api/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

/* ================= STYLES ================= */
const styles = {
  // Modern color palette
  colors: {
    primary: "#6366f1",
    primaryDark: "#4f46e5",
    primaryLight: "#a5b4fc",
    secondary: "#10b981",
    secondaryDark: "#059669",
    accent: "#f59e0b",
    danger: "#ef4444",
    warning: "#f97316",
    success: "#22c55e",
    info: "#3b82f6",
    purple: "#8b5cf6",
    pink: "#ec4899",
    dark: "#111827",
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827"
    }
  },

  // Glass morphism effect
  glass: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
  },

  // Neumorphism effect
  neumorphism: {
    background: "#e0e5ec",
    boxShadow: "20px 20px 60px #b5b9c0, -20px -20px 60px #ffffff",
    border: "none"
  },

  // Gradient backgrounds
  gradients: {
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    secondary: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    accent: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    danger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    info: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    purple: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    pink: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    dark: "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
  },

  // Animation keyframes
  animations: {
    fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
    slideIn: `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `,
    slideUp: `
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `,
    pulse: `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `,
    spin: `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `,
    shimmer: `
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
    `
  }
};

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

/* ================= MODERN PHOTO GALLERY COMPONENT ================= */
const ModernPhotoGallery = ({ photos, name, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const galleryRef = useRef(null);

  const imageUrls = photos?.length > 0 
    ? photos.map(photo => getCorrectImageUrl(photo))
    : ["https://via.placeholder.com/1200x800/6366f1/ffffff?text=No+Image"];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const handleMouseMove = (e) => {
    if (!isZoomed || !galleryRef.current) return;
    const rect = galleryRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "#000",
      borderRadius: "16px",
      overflow: "hidden"
    }}>
      {/* Main Image */}
      <div
        ref={galleryRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          cursor: isZoomed ? "zoom-out" : "zoom-in",
          overflow: "hidden"
        }}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={imageUrls[currentIndex]}
          alt={`${name} - ${currentIndex + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: isZoomed ? "contain" : "cover",
            transform: isZoomed ? `scale(2) translate(${-zoomPosition.x}%, ${-zoomPosition.y}%)` : "none",
            transition: isZoomed ? "none" : "transform 0.3s ease"
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/1200x800/6366f1/ffffff?text=Image+Not+Found";
          }}
        />
      </div>

      {/* Controls Overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px"
      }}>
        {/* Top Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "auto"
        }}>
          <div style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(10px)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "30px",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Camera size={16} />
            {currentIndex + 1} / {imageUrls.length}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowFullscreen(!showFullscreen)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(10px)",
                border: "none",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.8)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(10px)",
                border: "none",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#ef4444"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Bottom Thumbnails */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          pointerEvents: "auto",
          overflowX: "auto",
          padding: "10px 0"
        }}>
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "8px",
                overflow: "hidden",
                border: index === currentIndex ? "3px solid #6366f1" : "3px solid transparent",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: index === currentIndex ? 1 : 0.6
              }}
            >
              <img
                src={url}
                alt={`Thumbnail ${index + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/60x60/6366f1/ffffff?text=No+Image";
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {imageUrls.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              zIndex: 10
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.8)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              zIndex: 10
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.8)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );
};

/* ================= MODERN PROPERTY CARD COMPONENT ================= */
const ModernPropertyCard = ({ pg, onQuickView, onBook, onFavorite, isFavorite, onSelect, isSelected, compareMode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);

  const getImages = () => {
    if (Array.isArray(pg.photos) && pg.photos.length) {
      return pg.photos.map(photo => getCorrectImageUrl(photo));
    }
    return ["https://via.placeholder.com/400x300/6366f1/ffffff?text=No+Image"];
  };

  const images = getImages();
  const mainImage = imageError ? images[1] || images[0] : images[0];
  const priceRange = getPriceRangeByType(pg);
  const effectiveRent = getEffectiveRent(pg);
  const depositAmount = pg.deposit_amount || pg.security_deposit || 0;

  const getTypeColor = () => {
    if (pg.pg_category === "to_let") return styles.gradients.accent;
    if (pg.pg_category === "coliving") return styles.gradients.purple;
    if (pg.pg_type === "boys") return styles.gradients.secondary;
    if (pg.pg_type === "girls") return styles.gradients.pink;
    return styles.gradients.primary;
  };

  const getTypeIcon = () => {
    if (pg.pg_category === "to_let") return <Building size={16} />;
    if (pg.pg_category === "coliving") return <Users size={16} />;
    if (pg.pg_type === "boys") return <Users size={16} />;
    if (pg.pg_type === "girls") return <Users size={16} />;
    return <Home size={16} />;
  };

  const getTypeLabel = () => {
    if (pg.pg_category === "to_let") return "To-Let";
    if (pg.pg_category === "coliving") return "Co-Living";
    if (pg.pg_type === "boys") return "Boys PG";
    if (pg.pg_type === "girls") return "Girls PG";
    return "PG";
  };

  const amenities = [
    { icon: <Wifi size={14} />, active: pg.wifi_available, label: "WiFi" },
    { icon: <Snowflake size={14} />, active: pg.ac_available, label: "AC" },
    { icon: <Utensils size={14} />, active: pg.food_available, label: "Food" },
    { icon: <Car size={14} />, active: pg.parking_available, label: "Parking" },
    { icon: <Shield size={14} />, active: pg.is_verified, label: "Verified" },
    { icon: <Bath size={14} />, active: pg.attached_bathroom, label: "Attached Bath" }
  ].filter(a => a.active).slice(0, 4);

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect?.(pg)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        borderRadius: "24px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: isHovered 
          ? "0 20px 40px rgba(0,0,0,0.15), 0 8px 20px rgba(99,102,241,0.2)"
          : "0 10px 30px rgba(0,0,0,0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-8px)" : "none",
        cursor: "pointer",
        border: isSelected ? "2px solid #6366f1" : "none"
      }}
    >
      {/* Image Section */}
      <div style={{ position: "relative", height: "240px", overflow: "hidden" }}>
        <img
          src={mainImage}
          alt={pg.pg_name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s ease"
          }}
          onError={() => setImageError(true)}
        />

        {/* Gradient Overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none"
        }} />

        {/* Type Badge */}
        <div style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          background: getTypeColor(),
          color: "white",
          padding: "8px 16px",
          borderRadius: "30px",
          fontSize: "13px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          zIndex: 2
        }}>
          {getTypeIcon()}
          {getTypeLabel()}
        </div>

        {/* Compare Mode Selector */}
        {compareMode && (
          <div style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 3
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(pg);
              }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: isSelected ? "#6366f1" : "rgba(255,255,255,0.9)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                transition: "all 0.2s"
              }}
            >
              {isSelected ? (
                <Check size={18} color="white" />
              ) : (
                <Plus size={18} color="#374151" />
              )}
            </button>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(pg.id);
          }}
          style={{
            position: "absolute",
            top: "16px",
            right: compareMode ? "60px" : "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            transition: "all 0.2s",
            zIndex: 3
          }}
        >
          <Heart 
            size={18} 
            color="#ef4444" 
            fill={isFavorite ? "#ef4444" : "none"}
          />
        </button>

        {/* Distance Badge */}
        {pg.distance && (
          <div style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(10px)",
            color: "white",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            zIndex: 2
          }}>
            <Navigation size={12} />
            {pg.distance.toFixed(1)} km
          </div>
        )}

        {/* Quick View Overlay */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          right: "16px",
          display: "flex",
          gap: "10px",
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.3s ease",
          zIndex: 3
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(pg);
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#6366f1"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.95)"}
          >
            <Eye size={14} />
            Quick View
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div style={{ padding: "20px" }}>
        {/* Title and Price */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px"
        }}>
          <div>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "4px",
              lineHeight: "1.3"
            }}>
              {pg.pg_name}
            </h3>
            <p style={{
              fontSize: "12px",
              color: "#6b7280"
            }}>
              {getPGCode(pg.id)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#6366f1",
              lineHeight: "1"
            }}>
              ₹{formatPrice(effectiveRent)}
            </div>
            <div style={{
              fontSize: "11px",
              color: "#6b7280"
            }}>
              per month
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "16px",
          color: "#4b5563"
        }}>
          <MapPin size={14} />
          <span style={{ fontSize: "13px" }}>
            {pg.area}{pg.city ? `, ${pg.city}` : ""}
          </span>
        </div>

        {/* Price Range and Deposit */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
          padding: "12px",
          background: "#f8fafc",
          borderRadius: "16px"
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>
              Price Range
            </div>
            <div style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#6366f1"
            }}>
              ₹{formatPrice(priceRange.min)} - ₹{formatPrice(priceRange.max)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>
              Deposit
            </div>
            <div style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#10b981"
            }}>
              ₹{formatPrice(depositAmount)}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px"
        }}>
          {amenities.map((amenity, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#6366f1",
                background: "#eef2ff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "500"
              }}
            >
              {amenity.icon}
              <span>{amenity.label}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px"
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook(pg);
            }}
            style={{
              padding: "12px",
              background: styles.gradients.secondary,
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <BookOpen size={16} />
            Book Now
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(pg);
            }}
            style={{
              padding: "12px",
              background: styles.gradients.info,
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <Info size={16} />
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= MODERN FILTER BAR COMPONENT ================= */
const ModernFilterBar = ({ filters, onFilterChange, onLocationDetect, userLocation, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(10px)",
      borderRadius: "30px",
      padding: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
      border: "1px solid rgba(255,255,255,0.2)",
      marginBottom: "30px"
    }}>
      {/* Main Search Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto auto",
        gap: "10px",
        alignItems: "center"
      }}>
        <div style={{ position: "relative" }}>
          <Search size={20} style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af"
          }} />
          <input
            placeholder="Search by area, city or property name..."
            value={filters.location}
            onChange={(e) => onFilterChange("location", e.target.value)}
            style={{
              width: "100%",
              padding: "16px 16px 16px 48px",
              border: "none",
              borderRadius: "20px",
              fontSize: "15px",
              background: "#f3f4f6",
              transition: "all 0.2s"
            }}
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: "16px 24px",
            background: isExpanded ? "#6366f1" : "#f3f4f6",
            color: isExpanded ? "white" : "#374151",
            border: "none",
            borderRadius: "20px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <Filter size={18} />
          Filters
        </button>

        <button
          onClick={onLocationDetect}
          style={{
            padding: "16px 24px",
            background: filters.nearMe ? "#f97316" : "#f3f4f6",
            color: filters.nearMe ? "white" : "#374151",
            border: "none",
            borderRadius: "20px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <Navigation size={18} />
          Near Me
        </button>

        <button
          onClick={onReset}
          style={{
            padding: "16px 24px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "20px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <RefreshCw size={18} />
          Reset
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div style={{
          marginTop: "20px",
          paddingTop: "20px",
          borderTop: "1px solid rgba(0,0,0,0.1)",
          animation: "fadeIn 0.3s ease"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px"
          }}>
            {/* Budget Range */}
            <div>
              <label style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Budget Range (₹)
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minBudget}
                  onChange={(e) => onFilterChange("minBudget", Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "14px"
                  }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxBudget}
                  onChange={(e) => onFilterChange("maxBudget", Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>

            {/* Food Type */}
            <div>
              <label style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Food Type
              </label>
              <select
                value={filters.foodType}
                onChange={(e) => onFilterChange("foodType", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  background: "white"
                }}
              >
                <option value="">Any</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) => onFilterChange("sort", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  background: "white"
                }}
              >
                <option value="">Relevance</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="new">Newest First</option>
                {userLocation && <option value="distance">Distance</option>}
              </select>
            </div>

            {/* Amenities */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Amenities
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {[
                  { key: "food", label: "Food", icon: <Utensils size={14} /> },
                  { key: "ac", label: "AC", icon: <Snowflake size={14} /> },
                  { key: "wifi", label: "WiFi", icon: <Wifi size={14} /> },
                  { key: "parking", label: "Parking", icon: <Car size={14} /> }
                ].map(amenity => (
                  <button
                    key={amenity.key}
                    onClick={() => onFilterChange(amenity.key, !filters[amenity.key])}
                    style={{
                      padding: "10px 20px",
                      background: filters[amenity.key] ? "#6366f1" : "#f3f4f6",
                      color: filters[amenity.key] ? "white" : "#374151",
                      border: "none",
                      borderRadius: "30px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s"
                    }}
                  >
                    {amenity.icon}
                    {amenity.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= MODERN QUICK VIEW MODAL ================= */
const ModernQuickViewModal = ({ pg, onClose, onBook, onSaveFavorite, isFavorite }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showGallery, setShowGallery] = useState(false);

  const getImages = () => {
    if (Array.isArray(pg.photos) && pg.photos.length) {
      return pg.photos.map(photo => getCorrectImageUrl(photo));
    }
    return ["https://via.placeholder.com/1200x800/6366f1/ffffff?text=No+Image"];
  };

  const images = getImages();

  const tabs = [
    { id: "overview", label: "Overview", icon: <Info size={18} /> },
    { id: "pricing", label: "Pricing", icon: <DollarSign size={18} /> },
    { id: "amenities", label: "Amenities", icon: <Sparkles size={18} /> },
    { id: "location", label: "Location", icon: <MapPin size={18} /> }
  ];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: "20px",
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        maxHeight: "90vh",
        background: "white",
        borderRadius: "30px",
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 30px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "4px"
            }}>
              {pg.pg_name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                padding: "4px 12px",
                background: "#eef2ff",
                color: "#6366f1",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                {getPGCode(pg.id)}
              </span>
              {pg.is_verified && (
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#10b981",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  <Shield size={14} />
                  Verified
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => onSaveFavorite(pg.id, !isFavorite)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#f3f4f6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Heart 
                size={20} 
                color="#ef4444" 
                fill={isFavorite ? "#ef4444" : "none"}
              />
            </button>
            <button
              onClick={() => setShowGallery(true)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#f3f4f6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Camera size={20} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#f3f4f6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Gallery Modal */}
        {showGallery && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 4000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}>
            <div style={{
              width: "100%",
              height: "100%",
              maxWidth: "1400px",
              maxHeight: "800px"
            }}>
              <ModernPhotoGallery
                photos={pg.photos}
                name={pg.pg_name}
                onClose={() => setShowGallery(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left Column - Image Preview */}
          <div style={{
            width: "40%",
            padding: "20px",
            background: "#f8fafc",
            overflowY: "auto"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px"
            }}>
              {images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setShowGallery(true)}
                  style={{
                    position: "relative",
                    paddingBottom: "100%",
                    borderRadius: "16px",
                    overflow: "hidden",
                    cursor: "pointer"
                  }}
                >
                  <img
                    src={img}
                    alt={`${pg.pg_name} ${idx + 1}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  {idx === 3 && images.length > 4 && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "18px",
                      fontWeight: "700"
                    }}>
                      +{images.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Tabs Content */}
          <div style={{
            width: "60%",
            padding: "30px",
            overflowY: "auto"
          }}>
            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: "10px",
              marginBottom: "30px",
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "10px"
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === tab.id ? "3px solid #6366f1" : "none",
                    color: activeTab === tab.id ? "#6366f1" : "#6b7280",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {activeTab === "overview" && (
                <div>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "16px"
                  }}>
                    Description
                  </h3>
                  <p style={{
                    fontSize: "15px",
                    color: "#4b5563",
                    lineHeight: "1.7",
                    marginBottom: "24px"
                  }}>
                    {pg.description || "No description available."}
                  </p>

                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "16px"
                  }}>
                    Quick Facts
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "15px"
                  }}>
                    {[
                      { label: "Property Type", value: getTypeLabel(pg) },
                      { label: "Available Rooms", value: pg.available_rooms || 0 },
                      { label: "Total Rooms", value: pg.total_rooms || "N/A" },
                      { label: "Min Stay", value: pg.min_stay_months ? `${pg.min_stay_months} months` : "N/A" },
                      { label: "Notice Period", value: pg.notice_period ? `${pg.notice_period} month${pg.notice_period > 1 ? 's' : ''}` : "N/A" },
                      { label: "Deposit", value: `₹${formatPrice(pg.deposit_amount || pg.security_deposit || 0)}` }
                    ].map((fact, idx) => (
                      <div key={idx} style={{
                        padding: "15px",
                        background: "#f8fafc",
                        borderRadius: "12px"
                      }}>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                          {fact.label}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827" }}>
                          {fact.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "20px"
                  }}>
                    Price Details
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {pg.pg_category === "pg" && (
                      <>
                        {pg.single_sharing > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            background: "#eef2ff",
                            borderRadius: "12px"
                          }}>
                            <span style={{ fontWeight: "500" }}>Single Sharing</span>
                            <span style={{ fontWeight: "700", color: "#6366f1" }}>
                              ₹{formatPrice(pg.single_sharing)}/month
                            </span>
                          </div>
                        )}
                        {pg.double_sharing > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            background: "#f3f4f6",
                            borderRadius: "12px"
                          }}>
                            <span style={{ fontWeight: "500" }}>Double Sharing</span>
                            <span style={{ fontWeight: "700", color: "#6366f1" }}>
                              ₹{formatPrice(pg.double_sharing)}/month
                            </span>
                          </div>
                        )}
                        {pg.triple_sharing > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            background: "#f3f4f6",
                            borderRadius: "12px"
                          }}>
                            <span style={{ fontWeight: "500" }}>Triple Sharing</span>
                            <span style={{ fontWeight: "700", color: "#6366f1" }}>
                              ₹{formatPrice(pg.triple_sharing)}/month
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {pg.pg_category === "coliving" && (
                      <>
                        {pg.co_living_single_room > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            background: "#eef2ff",
                            borderRadius: "12px"
                          }}>
                            <span style={{ fontWeight: "500" }}>Single Room</span>
                            <span style={{ fontWeight: "700", color: "#6366f1" }}>
                              ₹{formatPrice(pg.co_living_single_room)}/month
                            </span>
                          </div>
                        )}
                        {pg.co_living_double_room > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            background: "#f3f4f6",
                            borderRadius: "12px"
                          }}>
                            <span style={{ fontWeight: "500" }}>Double Room</span>
                            <span style={{ fontWeight: "700", color: "#6366f1" }}>
                              ₹{formatPrice(pg.co_living_double_room)}/month
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {pg.pg_category === "to_let" && (
                      <>
                        {pg.price_1bhk > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            background: "#eef2ff",
                            borderRadius: "12px"
                          }}>
                            <span style={{ fontWeight: "500" }}>1 BHK</span>
                            <span style={{ fontWeight: "700", color: "#6366f1" }}>
                              ₹{formatPrice(pg.price_1bhk)}/month
                            </span>
                          </div>
                        )}
                        {pg.price_2bhk > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            background: "#f3f4f6",
                            borderRadius: "12px"
                          }}>
                            <span style={{ fontWeight: "500" }}>2 BHK</span>
                            <span style={{ fontWeight: "700", color: "#6366f1" }}>
                              ₹{formatPrice(pg.price_2bhk)}/month
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div style={{
                      marginTop: "20px",
                      padding: "20px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "16px",
                      color: "white"
                    }}>
                      <div style={{ fontSize: "14px", opacity: "0.9", marginBottom: "8px" }}>
                        Total Monthly Cost (with all inclusions)
                      </div>
                      <div style={{ fontSize: "32px", fontWeight: "700" }}>
                        ₹{formatPrice(getEffectiveRent(pg))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "amenities" && (
                <div>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "20px"
                  }}>
                    Room Amenities
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "15px"
                  }}>
                    {[
                      { key: "cupboard_available", label: "Cupboard/Wardrobe", icon: <DoorOpen size={16} /> },
                      { key: "table_chair_available", label: "Study Table & Chair", icon: <Coffee size={16} /> },
                      { key: "attached_bathroom", label: "Attached Bathroom", icon: <Bath size={16} /> },
                      { key: "balcony_available", label: "Balcony", icon: <Sun size={16} /> },
                      { key: "dining_table_available", label: "Dining Table", icon: <Utensils size={16} /> },
                      { key: "bed_with_mattress", label: "Bed with Mattress", icon: <Bed size={16} /> },
                      { key: "fan_light", label: "Fan & Light", icon: <Zap size={16} /> },
                      { key: "kitchen_room", label: "Kitchen", icon: <Flame size={16} /> }
                    ].map((amenity, idx) => {
                      const isAvailable = pg[amenity.key] === true || pg[amenity.key] === 1 || pg[amenity.key] === "true";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            background: isAvailable ? "#eef2ff" : "#f3f4f6",
                            borderRadius: "12px",
                            color: isAvailable ? "#6366f1" : "#9ca3af"
                          }}
                        >
                          {amenity.icon}
                          <span style={{
                            fontSize: "14px",
                            fontWeight: "500"
                          }}>
                            {amenity.label}
                          </span>
                          {isAvailable && (
                            <Check size={14} style={{ marginLeft: "auto" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#111827",
                    marginTop: "30px",
                    marginBottom: "20px"
                  }}>
                    Common Amenities
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "15px"
                  }}>
                    {[
                      { key: "wifi_available", label: "WiFi", icon: <Wifi size={16} /> },
                      { key: "ac_available", label: "AC", icon: <Snowflake size={16} /> },
                      { key: "food_available", label: "Food", icon: <Utensils size={16} /> },
                      { key: "parking_available", label: "Parking", icon: <Car size={16} /> },
                      { key: "co_living_housekeeping", label: "Housekeeping", icon: <Sparkles size={16} /> },
                      { key: "co_living_power_backup", label: "Power Backup", icon: <Battery size={16} /> }
                    ].map((amenity, idx) => {
                      const isAvailable = pg[amenity.key] === true || pg[amenity.key] === 1 || pg[amenity.key] === "true";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            background: isAvailable ? "#eef2ff" : "#f3f4f6",
                            borderRadius: "12px",
                            color: isAvailable ? "#6366f1" : "#9ca3af"
                          }}
                        >
                          {amenity.icon}
                          <span style={{
                            fontSize: "14px",
                            fontWeight: "500"
                          }}>
                            {amenity.label}
                          </span>
                          {isAvailable && (
                            <Check size={14} style={{ marginLeft: "auto" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "location" && (
                <div>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "16px"
                  }}>
                    Location Details
                  </h3>
                  <div style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "16px",
                    marginBottom: "20px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <MapPin size={20} color="#6366f1" />
                      <span style={{ fontSize: "16px", fontWeight: "500" }}>
                        {pg.address || `${pg.area}, ${pg.city}, ${pg.state} - ${pg.pincode}`}
                      </span>
                    </div>
                    {pg.landmark && (
                      <div style={{ fontSize: "14px", color: "#6b7280", marginLeft: "30px" }}>
                        Landmark: {pg.landmark}
                      </div>
                    )}
                  </div>

                  {pg.latitude && pg.longitude && (
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`, '_blank')}
                      style={{
                        width: "100%",
                        padding: "16px",
                        background: styles.gradients.purple,
                        color: "white",
                        border: "none",
                        borderRadius: "16px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <Map size={20} />
                      View on Google Maps
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Book Now Button */}
            <div style={{
              marginTop: "30px",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb"
            }}>
              <button
                onClick={() => {
                  onClose();
                  onBook(pg);
                }}
                style={{
                  width: "100%",
                  padding: "18px",
                  background: styles.gradients.secondary,
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "18px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <BookOpen size={20} />
                Book Now
              </button>
            </div>
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
  const [quickViewPG, setQuickViewPG] = useState(null);
  const [bookingPG, setBookingPG] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Filter State
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

  // Compare Feature
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    loadPGs();
    loadFavorites();
  }, []);

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
      if (saved) setFavorites(new Set(JSON.parse(saved)));
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

  const toggleFavorite = (pgId) => {
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

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        handleFilterChange("nearMe", true);
        showNotification("📍 Location detected! Showing nearby properties");
      },
      () => showNotification("❌ Unable to get your location", "error")
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];

    // Location search
    if (filters.location) {
      filtered = filtered.filter((pg) =>
        `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    // Budget filter
    filtered = filtered.filter((pg) => {
      const rent = getEffectiveRent(pg);
      return rent >= filters.minBudget && rent <= filters.maxBudget;
    });

    // Amenities filters
    if (filters.food) filtered = filtered.filter((pg) => pg.food_available);
    if (filters.ac) filtered = filtered.filter((pg) => pg.ac_available);
    if (filters.wifi) filtered = filtered.filter((pg) => pg.wifi_available);
    if (filters.parking) filtered = filtered.filter((pg) => pg.parking_available);
    
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
            )
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
  }, [allPGs, filters, userLocation]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
    setUserLocation(null);
    setPgs(allPGs);
    showNotification("All filters reset");
  };

  const handleQuickView = (pg) => {
    setQuickViewPG(pg);
  };

  const handleBookNow = (pg) => {
    const user = auth.currentUser;
    if (!user) {
      showNotification("Please register or login to book this property", "error");
      navigate("/register");
      return;
    }
    setBookingPG(pg);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showNotification("Please register or login to continue", "error");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.alreadyBooked) {
        showNotification(res.data.message, "warning");
      } else {
        showNotification(res.data.message || "✅ Booking request sent to owner");
      }
      setBookingPG(null);
    } catch (error) {
      console.log("BOOKING ERROR:", error.response?.data);
      showNotification(
        error.response?.data?.message || "❌ Something went wrong",
        "error"
      );
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

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) setSelectedForCompare(new Set());
  };

  const toggleSelectForCompare = (pg) => {
    const newSelected = new Set(selectedForCompare);
    if (newSelected.has(pg.id)) {
      newSelected.delete(pg.id);
    } else {
      if (newSelected.size < 3) {
        newSelected.add(pg.id);
      } else {
        showNotification("You can compare up to 3 properties", "warning");
        return;
      }
    }
    setSelectedForCompare(newSelected);
  };

  const handleCompare = () => {
    if (selectedForCompare.size < 2) {
      showNotification("Select at least 2 properties to compare", "warning");
      return;
    }
    setShowCompareModal(true);
  };

  const clearCompareSelections = () => {
    setSelectedForCompare(new Set());
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "20px"
    }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "16px 24px",
          background: notification.type === "success" ? "#10b981" : 
                     notification.type === "error" ? "#ef4444" : 
                     notification.type === "warning" ? "#f97316" : "#6366f1",
          color: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          zIndex: 4000,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "slideIn 0.3s ease"
        }}>
          {notification.type === "success" && <CheckCircle size={20} />}
          {notification.type === "error" && <XCircle size={20} />}
          {notification.type === "warning" && <AlertTriangle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto 30px",
        textAlign: "center"
      }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: "800",
          background: styles.gradients.primary,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "10px"
        }}>
          Find Your Perfect Stay
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#4b5563",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          Discover the best PG accommodations, co-living spaces, and rental properties near you
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{ maxWidth: "1400px", margin: "0 auto 20px" }}>
        <ModernFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onLocationDetect={detectLocation}
          userLocation={userLocation}
          onReset={resetFilters}
        />
      </div>

      {/* View Controls */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ fontSize: "16px", color: "#4b5563" }}>
            Showing <strong>{pgs.length}</strong> properties
          </div>
          
          {/* View Mode Toggle */}
          <div style={{
            display: "flex",
            gap: "5px",
            background: "#f3f4f6",
            padding: "4px",
            borderRadius: "30px"
          }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 16px",
                background: viewMode === "grid" ? "white" : "transparent",
                border: "none",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
              }}
            >
              <Grid size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "8px 16px",
                background: viewMode === "list" ? "white" : "transparent",
                border: "none",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: viewMode === "list" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
              }}
            >
              <List size={16} />
              List
            </button>
          </div>
        </div>

        {/* Compare Controls */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={toggleCompareMode}
            style={{
              padding: "10px 20px",
              background: compareMode ? "#8b5cf6" : "#f3f4f6",
              color: compareMode ? "white" : "#374151",
              border: "none",
              borderRadius: "30px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <BarChart size={16} />
            Compare Mode {compareMode && "(ON)"}
          </button>

          {compareMode && selectedForCompare.size > 0 && (
            <>
              <button
                onClick={handleCompare}
                style={{
                  padding: "10px 20px",
                  background: selectedForCompare.size >= 2 ? "#10b981" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "30px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: selectedForCompare.size >= 2 ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                disabled={selectedForCompare.size < 2}
              >
                <Check size={16} />
                Compare ({selectedForCompare.size})
              </button>
              <button
                onClick={clearCompareSelections}
                style={{
                  padding: "10px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "30px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Property Grid */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: viewMode === "grid"
          ? "grid"
          : "flex",
        gridTemplateColumns: viewMode === "grid"
          ? "repeat(auto-fill, minmax(350px, 1fr))"
          : "none",
        flexDirection: viewMode === "list" ? "column" : "none",
        gap: "24px"
      }}>
        {loading ? (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "80px 20px"
          }}>
            <div style={{
              width: "50px",
              height: "50px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }} />
            <p style={{ color: "#6b7280", fontSize: "16px" }}>
              Loading amazing properties...
            </p>
          </div>
        ) : pgs.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "80px 20px",
            background: "white",
            borderRadius: "30px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
          }}>
            <Search size={64} style={{ margin: "0 auto 20px", color: "#9ca3af" }} />
            <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", marginBottom: "10px" }}>
              No Properties Found
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Try adjusting your filters or search criteria
            </p>
            <button
              onClick={resetFilters}
              style={{
                padding: "12px 30px",
                background: styles.gradients.primary,
                color: "white",
                border: "none",
                borderRadius: "30px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          pgs.map(pg => (
            <ModernPropertyCard
              key={pg.id}
              pg={pg}
              onQuickView={handleQuickView}
              onBook={handleBookNow}
              onFavorite={toggleFavorite}
              isFavorite={favorites.has(pg.id)}
              onSelect={compareMode ? toggleSelectForCompare : () => navigate(`/pg/${pg.id}`)}
              isSelected={selectedForCompare.has(pg.id)}
              compareMode={compareMode}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {quickViewPG && (
        <ModernQuickViewModal
          pg={quickViewPG}
          onClose={() => setQuickViewPG(null)}
          onBook={handleBookNow}
          onSaveFavorite={handleSaveFavorite}
          isFavorite={favorites.has(quickViewPG.id)}
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

      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        * {
          transition: all 0.2s ease;
        }
        
        input:focus, button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
        }
      `}</style>
    </div>
  );
}

export default UserPGSearch;