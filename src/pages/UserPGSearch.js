import React, { useEffect, useState, useCallback, useRef } from "react";
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
      padding: 20,
      animation: "fadeIn 0.3s ease"
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
        {/* Decorative circle */}
        <div style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          borderRadius: "50%",
          opacity: 0.1
        }} />
        
        <div style={{
          width: 80,
          height: 80,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 10px 25px -5px rgba(59,130,246,0.4)"
        }}>
          <Crosshair size={40} color="white" />
        </div>
        
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          marginBottom: 12,
          background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Find PGs Near You
        </h2>
        
        <p style={{ 
          fontSize: 15, 
          color: "#4b5563",
          marginBottom: 24,
          lineHeight: 1.5
        }}>
          Allow location access to find the best PGs, Co-living spaces, and rental homes within 5km of your current location.
        </p>
        
        <div style={{ 
          background: "#f0fdf4", 
          padding: "12px 16px", 
          borderRadius: 16,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left"
        }}>
          <div style={{
            width: 32,
            height: 32,
            background: "#10b98120",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Check size={16} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#065f46" }}>What you'll get:</div>
            <div style={{ fontSize: 12, color: "#047857" }}>✅ Nearby PGs within 5km</div>
            <div style={{ fontSize: 12, color: "#047857" }}>✅ Distance & travel time info</div>
            <div style={{ fontSize: 12, color: "#047857" }}>✅ Fastest booking experience</div>
          </div>
        </div>
        
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
              gap: 10,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(59,130,246,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
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
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Skip for now
          </button>
        </div>
        
        <p style={{ 
          fontSize: 12, 
          color: "#9ca3af", 
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4
        }}>
          <Shield size={12} />
          We never share your location
        </p>
      </div>
    </div>
  );
};

/* ================= LOCATION BANNER COMPONENT ================= */
const LocationBanner = ({ userLocation, nearestPGsCount, onRefresh, isLocating }) => {
  const [showFullInfo, setShowFullInfo] = useState(false);
  
  if (!userLocation) return null;
  
  // Get approximate location name (you can integrate with reverse geocoding)
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
      gap: 16,
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        background: "rgba(255,255,255,0.05)",
        borderRadius: "50%"
      }} />
      <div style={{
        position: "absolute",
        bottom: -30,
        left: -30,
        width: 120,
        height: 120,
        background: "rgba(255,255,255,0.03)",
        borderRadius: "50%"
      }} />
      
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, zIndex: 2 }}>
        <div style={{
          width: 48,
          height: 48,
          background: "rgba(255,255,255,0.15)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(10px)"
        }}>
          <LocateFixed size={24} color="white" />
        </div>
        
        <div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            flexWrap: "wrap"
          }}>
            <span style={{ 
              fontSize: 14, 
              fontWeight: 500, 
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "0.5px"
            }}>
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
          
          <div style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 4
          }}>
            <MapPinned size={16} color="#60a5fa" />
            {getLocationName()}
          </div>
          
          {showFullInfo && (
            <div style={{ 
              marginTop: 8, 
              fontSize: 12, 
              color: "#bfdbfe",
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}>
              <div>Latitude: {userLocation.lat?.toFixed(6)}</div>
              <div>Longitude: {userLocation.lng?.toFixed(6)}</div>
              <div>Accuracy: {userLocation.accuracy ? `${userLocation.accuracy.toFixed(0)}m` : "N/A"}</div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 20, zIndex: 2 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>
            {nearestPGsCount}
          </div>
          <div style={{ fontSize: 12, color: "#bfdbfe" }}>Nearby PGs</div>
        </div>
        
        <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.2)" }} />
        
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>
            5<span style={{ fontSize: 16 }}>km</span>
          </div>
          <div style={{ fontSize: 12, color: "#bfdbfe" }}>Radius</div>
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
            gap: 8,
            backdropFilter: "blur(10px)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (!isLocating) e.currentTarget.style.background = "rgba(255,255,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          }}
        >
          {isLocating ? (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: "2px solid white",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
              Updating...
            </>
          ) : (
            <>
              <Navigation2 size={16} />
              Refresh
            </>
          )}
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
  
  const getTravelTime = () => {
    const walkingTime = Math.round(distance * 12); // 5 km/h
    const drivingTime = Math.round(distance * 3); // 20 km/h
    
    if (distance < 1) return `${walkingTime} min walk`;
    return `${walkingTime} min walk • ${drivingTime} min drive`;
  };
  
  const color = getDistanceColor();
  
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }}>
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
        <span style={{ fontSize: 11, color: "#6b7280" }}>
          • {getDistanceLabel()}
        </span>
      </div>
      
      {showDetails && (
        <div style={{
          display: "flex",
          alignItems": "center",
          gap: 6,
          fontSize: 11,
          color: "#6b7280"
        }}>
          <Clock size={12} />
          {getTravelTime()}
        </div>
      )}
    </div>
  );
};

/* ================= HERO BANNER WITH LOCATION CTA ================= */
const HeroBanner = ({ onEnableLocation, isLocating }) => {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
      borderRadius: 24,
      marginBottom: 40,
      overflow: "hidden",
      boxShadow: "0 20px 35px -10px rgba(0,0,0,0.15)",
      position: "relative"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 40,
        alignItems: "center",
        padding: "48px 48px",
        position: "relative",
        zIndex: 2
      }}>
        {/* Left Content */}
        <div>
          <h1 style={{
            fontSize: 42,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 16,
            lineHeight: 1.2,
            letterSpacing: "-0.02em"
          }}>
            Find Verified PGs,<br />
            Coliving & Rental Homes
          </h1>
          <p style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 24,
            lineHeight: 1.5,
            maxWidth: "90%"
          }}>
            Book trusted stays with secure payments, verified owners and instant booking support.
          </p>
          
          {/* Location CTA Button */}
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
              marginBottom: 32,
              boxShadow: "0 10px 20px -5px rgba(0,0,0,0.2)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!isLocating) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 15px 30px -5px rgba(0,0,0,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(0,0,0,0.2)";
            }}
          >
            {isLocating ? (
              <>
                <div style={{
                  width: 20,
                  height: 20,
                  border: "2px solid #1e3a5f",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                Detecting your location...
              </>
            ) : (
              <>
                <Crosshair size={20} />
                🔍 Find PGs Near Me
              </>
            )}
          </button>
          
          {/* Trust Items */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16
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
              <span style={{ fontSize: 15, fontWeight: 500 }}>Direct Owner Support</span>
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
              <span style={{ fontSize: 15, fontWeight: 500 }}>Fast Move-In Process</span>
            </div>
          </div>
        </div>
        
        {/* Right Illustration */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 32,
            padding: 20,
            backdropFilter: "blur(10px)",
            textAlign: "center"
          }}>
            <MapPinned size={120} strokeWidth={1} color="rgba(255,255,255,0.9)" />
            <div style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              justifyContent: "center"
            }}>
              <div style={{
                background: "#10b981",
                padding: "8px 16px",
                borderRadius: 30,
                fontSize: 13,
                fontWeight: 600,
                color: "white"
              }}>
                ✓ Verified
              </div>
              <div style={{
                background: "#3b82f6",
                padding: "8px 16px",
                borderRadius: 30,
                fontSize: 13,
                fontWeight: 600,
                color: "white"
              }}>
                ✓ Secure
              </div>
              <div style={{
                background: "#8b5cf6",
                padding: "8px 16px",
                borderRadius: 30,
                fontSize: 13,
                fontWeight: 600,
                color: "white"
              }}>
                ✓ Trusted
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
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
  
  // Location States
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
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
    sort: "distance", // Default sort by distance when location available
    nearMe: false,
    foodType: "",
    radius: 5 // Default 5km radius
  });

  const limit = 10;

  // Check if location should be requested on first visit
  useEffect(() => {
    const hasAskedPermission = localStorage.getItem("location_permission_asked");
    if (!hasAskedPermission) {
      // Show location modal for new users
      setShowLocationModal(true);
    } else {
      // Try to get location silently if previously allowed
      const permissionStatus = localStorage.getItem("location_permission_status");
      if (permissionStatus === "allowed") {
        detectLocation(true); // Silent detection
      } else {
        // Load all properties
        loadPGs(false);
      }
    }
    loadFavorites();
  }, []);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [allPGs, filters, userLocation, propertyType]);

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
      food_available: pg.food_available === true || pg.food_available === 1 || pg.food_available === "true",
      ac_available: pg.ac_available === true || pg.ac_available === 1 || pg.ac_available === "true",
      wifi_available: pg.wifi_available === true || pg.wifi_available === 1 || pg.wifi_available === "true",
      parking_available: pg.parking_available === true || pg.parking_available === 1 || pg.parking_available === "true",
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

  // Enhanced Location Detection Function
  const detectLocation = async (silent = false) => {
    setIsLocating(true);
    
    if (!silent) {
      showNotification("📍 Detecting your location...");
    }
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      showNotification("❌ Geolocation is not supported by your browser", true);
      setIsLocating(false);
      if (!silent) {
        setShowLocationModal(false);
        loadPGs(false);
      }
      return;
    }
    
    // Options for better accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setUserLocation(locationData);
        localStorage.setItem("location_permission_asked", "true");
        localStorage.setItem("location_permission_status", "allowed");
        setLocationPermissionAsked(true);
        
        // Try to get address from coordinates (reverse geocoding)
        try {
          const address = await getAddressFromCoords(locationData.lat, locationData.lng);
          if (address) {
            locationData.address = address;
            setUserLocation(locationData);
          }
        } catch (err) {
          console.log("Reverse geocoding failed:", err);
        }
        
        showNotification(`📍 Location detected! Finding PGs within ${filters.radius}km`);
        
        // Update filter to show nearby properties
        setFilters(prev => ({ 
          ...prev, 
          nearMe: true,
          sort: "distance"
        }));
        
        // If this was triggered by the modal, close it
        if (!silent) {
          setShowLocationModal(false);
        }
        
        setIsLocating(false);
        
        // Load properties and sort by distance
        await loadPGs(false);
      },
      (error) => {
        console.error("Location error:", error);
        
        let errorMessage = "Unable to get your location. ";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            localStorage.setItem("location_permission_status", "denied");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "Please check your location settings.";
        }
        
        showNotification(errorMessage, true);
        setIsLocating(false);
        
        if (!silent) {
          setShowLocationModal(false);
        }
        
        localStorage.setItem("location_permission_asked", "true");
        setLocationPermissionAsked(true);
        
        // Load all properties without location
        await loadPGs(false);
      },
      options
    );
  };
  
  // Reverse geocoding to get address from coordinates
  const getAddressFromCoords = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'Nepxall Property App'
          }
        }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data && data.address) {
        const { suburb, city, town, village, state } = data.address;
        const locality = suburb || city || town || village;
        return locality ? `${locality}, ${state || ""}` : null;
      }
      
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  };
  
  // Get nearby PGs count
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
  
  // Update nearby count when data changes
  useEffect(() => {
    setNearbyCount(getNearbyCount());
  }, [getNearbyCount]);
  
  // Refresh location
  const refreshLocation = () => {
    detectLocation(false);
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allPGs];

    // Filter by property type
    if (propertyType !== "all") {
      filtered = filtered.filter((pg) => pg.pg_category === propertyType);
    }

    // Filter by location search
    if (filters.location) {
      filtered = filtered.filter((pg) =>
        `${pg.area || ""} ${pg.city || ""} ${pg.pg_name || ""}`
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    // Filter by budget
    filtered = filtered.filter((pg) => {
      const rent = getEffectiveRent(pg);
      return rent >= filters.minBudget && rent <= filters.maxBudget;
    });

    // Filter by amenities
    if (filters.food) filtered = filtered.filter((pg) => pg.food_available === true);
    if (filters.ac) filtered = filtered.filter((pg) => pg.ac_available === true);
    if (filters.wifi) filtered = filtered.filter((pg) => pg.wifi_available === true);
    if (filters.parking) filtered = filtered.filter((pg) => pg.parking_available === true);
    
    if (filters.foodType) {
      filtered = filtered.filter((pg) => pg.food_type === filters.foodType);
    }

    // Apply near me filter with distance calculation
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
          return {
            ...pg,
            distance: distance,
            travelTime: {
              walk: Math.round(distance * 12),
              drive: Math.round(distance * 3)
            }
          };
        })
        .filter(Boolean)
        .filter((pg) => pg.distance <= filters.radius);
    }

    // Apply sorting
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
    if (value === null || value === undefined || value === 0) return "0";
    try {
      return formatPrice(value);
    } catch (error) {
      return value.toString();
    }
  };

  const getPriceRangeDisplay = (pg) => {
    const range = getPriceRangeByType(pg);
    if (range.min === 0 && range.max === 0) return "Price on request";
    if (range.min === range.max) return `₹${formatCardPrice(range.min)}`;
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
    }
    
    return info.slice(0, 2);
  };

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

      {/* Location Permission Modal */}
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

      {/* Hero Banner */}
      <HeroBanner 
        onEnableLocation={() => detectLocation(false)}
        isLocating={isLocating}
      />

      {/* Location Banner (shows when location is active) */}
      {userLocation && filters.nearMe && (
        <LocationBanner
          userLocation={userLocation}
          nearestPGsCount={nearbyCount}
          onRefresh={refreshLocation}
          isLocating={isLocating}
        />
      )}

      {/* Property Type Quick Filter */}
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
              transition: "all 0.2s"
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
              gap: 8
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
              gap: 8
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
              gap: 8
            }}
          >
            <Building size={18} />
            To-Let
          </button>
        </div>
      </div>

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
              cursor: "pointer"
            }}
          >
            <Filter size={18} />
            Filters
          </button>

          {!userLocation && (
            <button
              onClick={() => detectLocation(false)}
              disabled={isLocating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 20px",
                background: "#f97316",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 500,
                cursor: isLocating ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {isLocating ? (
                <>
                  <div style={{
                    width: 18,
                    height: 18,
                    border: "2px solid white",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }} />
                  Locating...
                </>
              ) : (
                <>
                  <Crosshair size={18} />
                  Use My Location
                </>
              )}
            </button>
          )}

          {userLocation && (
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, nearMe: !prev.nearMe, sort: !prev.nearMe ? "distance" : "" }));
                if (filters.nearMe) {
                  setUserLocation(null);
                  showNotification("Location filter disabled");
                } else {
                  showNotification("Showing nearby properties");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 20px",
                background: filters.nearMe ? "#10b981" : "#f3f4f6",
                color: filters.nearMe ? "#ffffff" : "#374151",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              <Gps size={18} />
              {filters.nearMe ? "Near Me ON" : "Near Me OFF"}
            </button>
          )}

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
              cursor: "pointer"
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
                    cursor: "pointer"
                  }}
                >
                  <X size={18} />
                  Clear
                </button>
              )}
            </>
          )}
        </div>

        {filters.nearMe && userLocation && (
          <div style={{
            padding: "12px 16px",
            background: "#eff6ff",
            borderRadius: 12,
            marginBottom: 16,
            border: "1px solid #bfdbfe"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  background: "#3b82f620",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Route size={16} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>
                    Showing properties within {filters.radius}km
                  </div>
                  <div style={{ fontSize: 12, color: "#3b82f6" }}>
                    {nearbyCount} properties found near your location
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <select
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    fontSize: 13,
                    background: "#ffffff",
                    cursor: "pointer"
                  }}
                >
                  <option value={1}>Within 1 km</option>
                  <option value={2}>Within 2 km</option>
                  <option value={3}>Within 3 km</option>
                  <option value={5}>Within 5 km</option>
                  <option value={10}>Within 10 km</option>
                </select>
                
                <button
                  onClick={refreshLocation}
                  disabled={isLocating}
                  style={{
                    padding: "6px 12px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: isLocating ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Navigation2 size={12} />
                  Refresh
                </button>
              </div>
            </div>
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
                  cursor: "pointer"
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
                  {userLocation && <option value="distance">Distance: Nearest First</option>}
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
                  Amenities
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
                    cursor: "pointer"
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.food}
                      onChange={(e) => setFilters({ ...filters, food: e.target.checked })}
                      style={{ display: "none" }}
                    />
                    <Utensils size={14} />
                    Food
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
                    cursor: "pointer"
                  }}>
                    <input
                      type="checkbox"
                      checked={filters.ac}
                      onChange={(e) => setFilters({ ...filters, ac: e.target.checked })}
                      style={{ display: "none" }}
                    />
                    <Snowflake size={14} />
                    AC
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
                    cursor: "pointer"
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
                    cursor: "pointer"
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
            {filters.nearMe && userLocation ? "🏠 Properties Near You" : "📋 Available Properties"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>
              {pgs.length} properties found
              {filters.minBudget > 0 && filters.maxBudget < 50000 && 
                ` within ₹${formatPrice(filters.minBudget)} - ₹${formatPrice(filters.maxBudget)}`}
            </span>
            
            {filters.nearMe && userLocation && (
              <span style={{
                background: "#eff6ff",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                color: "#1e40af",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Compass size={12} />
                Sorted by nearest first
              </span>
            )}
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
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {pgs.map((pg) => {
              const cardQuickInfo = getCardQuickInfo(pg);
              const priceRange = getPriceRangeDisplay(pg);
              const depositAmount = pg.deposit_amount || pg.security_deposit || 0;
              const isSelectedForCompare = selectedForCompare.has(pg.id);
              const distance = pg.distance;
              
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
                    
                    {distance && (
                      <div style={{
                        position: "absolute",
                        bottom: 12,
                        right: 12,
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(8px)",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}>
                        <Navigation size={12} />
                        {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
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

                    {/* Distance and travel info if location is active */}
                    {distance && userLocation && (
                      <div style={{
                        marginBottom: 12,
                        padding: "8px 12px",
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0"
                      }}>
                        <DistanceIndicator distance={distance} showDetails={true} />
                      </div>
                    )}

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
                          Monthly Rent
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

                    {cardQuickInfo.length > 0 && (
                      <div style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 12,
                        flexWrap: "wrap"
                      }}>
                        {cardQuickInfo.map((item, index) => (
                          <div 
                            key={index}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 8px",
                              background: `${item.color}10`,
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 500,
                              color: item.color
                            }}
                          >
                            {item.icon}
                            {item.label}: {item.value}
                          </div>
                        ))}
                      </div>
                    )}

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
            {filters.nearMe && userLocation 
              ? "Try increasing the search radius or clearing filters"
              : "Try adjusting your filters or search terms"}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
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
            
            {!userLocation && (
              <button
                onClick={() => detectLocation(false)}
                style={{
                  padding: "12px 24px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <Crosshair size={18} />
                Find Nearby Properties
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals - Budget Filter, Quick View, Booking, Compare */}
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

// Export additional components that are referenced but not defined in this file
// These should be imported from your existing files or defined here

// BudgetFilter Component (simplified version - you should use your existing one)
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
      padding: 20,
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 500,
        padding: 30,
      }}>
        <h2>Budget Filter</h2>
        <div>
          <label>Min: ₹{localMin}</label>
          <input
            type="range"
            min="0"
            max="50000"
            value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))}
          />
          <label>Max: ₹{localMax}</label>
          <input
            type="range"
            min="0"
            max="50000"
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
          />
        </div>
        <button onClick={handleApply}>Apply</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

// QuickViewModal Component (simplified version)
const QuickViewModal = ({ pg, onClose, onBook, onSaveFavorite }) => {
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
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 800,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 30,
      }}>
        <h2>{pg.pg_name}</h2>
        <button onClick={() => onBook(pg)}>Book Now</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// BookingModal Component (simplified version)
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
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 500,
        padding: 30,
      }}>
        <h2>Book {pg.pg_name}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            required
          />
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            required
          >
            <option value="">Select Room Type</option>
            <option value="Single Sharing">Single Sharing</option>
            <option value="Double Sharing">Double Sharing</option>
          </select>
          <button type="submit">Confirm Booking</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

// CompareModal Component (simplified version)
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
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 1000,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 30,
      }}>
        <h2>Compare Properties</h2>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default UserPGSearch;