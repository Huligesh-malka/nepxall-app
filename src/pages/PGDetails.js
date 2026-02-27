import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";
import { auth } from "../firebase";

// Import icons from lucide-react for consistency with search page
import {
  X,
  MapPin,
  Phone,
  Home,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Shield,
  Calendar,
  Clock,
  UserCheck,
  BookOpen,
  Info,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  Coffee,
  Utensils,
  Snowflake,
  Navigation,
  Star,
  DollarSign,
  Key,
  DoorOpen,
  Sofa,
  Flame,
  Leaf,
  Zap,
  Building,
  Hash,
  Sun,
  Moon,
  Tv,
  Wind,
  Sparkles,
  Pill,
  Dumbbell,
  Wrench
} from "lucide-react";

/* ================= LEAFLET FIX ================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://nepxall-backend.onrender.com";

/* ================= HELPER FUNCTIONS ================= */
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

const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;

/* ================= BOOKING MODAL COMPONENT ================= */
const BookingModal = ({ pg, onClose, onBook }) => {
  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    checkInDate: "",
    roomType: pg?.single_sharing ? "Single Sharing" : "Single Room"
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
    
    if (pg?.pg_category === "pg") {
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
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room) types.push({ 
        value: "Co-Living Single Room", 
        label: `Co-Living Single Room - ₹${formatPrice(pg.co_living_single_room)}` 
      });
      if (pg.co_living_double_room) types.push({ 
        value: "Co-Living Double Room", 
        label: `Co-Living Double Room - ₹${formatPrice(pg.co_living_double_room)}` 
      });
    } else if (pg?.pg_category === "to_let") {
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
            🏠 Book {pg?.pg_name}
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
                {pg?.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
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

// Helper Components
const Section = ({ title, children, hasContent = true, badgeCount }) => 
  hasContent ? (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span style={styles.sectionBadge}>{badgeCount}</span>
        )}
      </div>
      {children}
    </div>
  ) : null;

const FacilityItem = ({ icon, label, active = true, onClick, categoryColor }) => (
  <div 
    style={{
      ...styles.facilityItem,
      background: active 
        ? `linear-gradient(135deg, ${categoryColor || '#f0f9ff'}, white)` 
        : '#f9fafb',
      borderLeft: `4px solid ${categoryColor || '#667eea'}`,
      ...(active ? styles.facilityItemActive : styles.facilityItemInactive)
    }}
    onClick={onClick}
    title={label}
  >
    <span style={styles.facilityIcon}>{icon}</span>
    <span style={styles.facilityLabel}>{label}</span>
    {active && <span style={styles.checkmark}>✓</span>}
  </div>
);

const RuleItem = ({ icon, label, allowed, description }) => (
  <div style={{
    ...styles.ruleItem,
    background: allowed 
      ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' 
      : 'linear-gradient(135deg, #fef2f2, #fee2e2)'
  }}>
    <div style={styles.ruleIconContainer}>
      <span style={{
        ...styles.ruleIcon,
        background: allowed ? '#10b981' : '#ef4444'
      }}>{icon}</span>
    </div>
    <div style={styles.ruleContent}>
      <div style={{
        ...styles.ruleLabel,
        color: allowed ? '#065f46' : '#7f1d1d'
      }}>{label}</div>
      {description && (
        <div style={styles.ruleDescription}>{description}</div>
      )}
      <div style={styles.ruleStatus}>
        <span style={{
          ...styles.ruleStatusBadge,
          background: allowed ? '#10b981' : '#ef4444'
        }}>
          {allowed ? '✅ Allowed' : '❌ Not Allowed'}
        </span>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => {
  if (!value || value === "false" || value === false || value === "") return null;
  return (
    <div style={styles.infoRow}>
      <strong>{label}:</strong> {value}
    </div>
  );
};

// Price Component for different property types
const PriceDetails = ({ pg }) => {
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;

  const formatPrice = (price) => {
    if (!price || price === "" || price === "0") return "—";
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
  };

  const hasAnyPrice = () => {
    if (!pg) return false;
    
    if (isToLet) {
      return pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk;
    } else if (isCoLiving) {
      return pg.co_living_single_room || pg.co_living_double_room;
    } else {
      return pg.single_sharing || pg.double_sharing || pg.triple_sharing || 
             pg.four_sharing || pg.single_room || pg.double_room;
    }
  };

  if (!hasAnyPrice()) {
    return (
      <div style={styles.noPriceContainer}>
        <span style={styles.noPriceIcon}>💰</span>
        <p style={styles.noPriceText}>Price details not available</p>
      </div>
    );
  }

  return (
    <div style={styles.priceDetailsContainer}>
      {isToLet && (
        <div style={styles.priceSection}>
          <h4 style={styles.priceSectionTitle}>
            <span style={styles.priceSectionIcon}>🏠</span>
            House/Flat Rental Prices
          </h4>
          <div style={styles.priceGrid}>
            {pg.price_1bhk && pg.price_1bhk !== "0" && pg.price_1bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>1 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_1bhk)}/month
                </div>
                {pg.security_deposit_1bhk && pg.security_deposit_1bhk !== "0" && pg.security_deposit_1bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_1bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_2bhk && pg.price_2bhk !== "0" && pg.price_2bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>2 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_2bhk)}/month
                </div>
                {pg.security_deposit_2bhk && pg.security_deposit_2bhk !== "0" && pg.security_deposit_2bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_2bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_3bhk && pg.price_3bhk !== "0" && pg.price_3bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>3 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_3bhk)}/month
                </div>
                {pg.security_deposit_3bhk && pg.security_deposit_3bhk !== "0" && pg.security_deposit_3bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_3bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_4bhk && pg.price_4bhk !== "0" && pg.price_4bhk !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>4 BHK</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.price_4bhk)}/month
                </div>
                {pg.security_deposit_4bhk && pg.security_deposit_4bhk !== "0" && pg.security_deposit_4bhk !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.security_deposit_4bhk)}
                  </div>
                )}
              </div>
            )}
          </div>
          {pg.bhk_type && (
            <div style={styles.bhkInfo}>
              Available: {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
            </div>
          )}
        </div>
      )}

      {isCoLiving && (
        <div style={styles.priceSection}>
          <h4 style={styles.priceSectionTitle}>
            <span style={styles.priceSectionIcon}>🤝</span>
            Co-Living Prices
          </h4>
          <div style={styles.priceGrid}>
            {pg.co_living_single_room && pg.co_living_single_room !== "0" && pg.co_living_single_room !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>Single Room</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.co_living_single_room)}/month
                </div>
                {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && pg.co_living_security_deposit !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.co_living_security_deposit)}
                  </div>
                )}
              </div>
            )}
            {pg.co_living_double_room && pg.co_living_double_room !== "0" && pg.co_living_double_room !== "" && (
              <div style={styles.priceItem}>
                <div style={styles.priceType}>Double Room</div>
                <div style={styles.priceValue}>
                  {formatPrice(pg.co_living_double_room)}/month
                </div>
                {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && pg.co_living_security_deposit !== "" && (
                  <div style={styles.depositAmount}>
                    Security: {formatPrice(pg.co_living_security_deposit)}
                  </div>
                )}
              </div>
            )}
          </div>
          {pg.co_living_includes && (
            <div style={styles.includesInfo}>
              Includes: {pg.co_living_includes}
            </div>
          )}
        </div>
      )}

      {isPG && (
        <div style={styles.priceSection}>
          <h4 style={styles.priceSectionTitle}>
            <span style={styles.priceSectionIcon}>🏢</span>
            PG/Hostel Room Prices
          </h4>
          
          {(pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing) && (
            <div style={styles.priceCategory}>
              <div style={styles.priceCategoryTitle}>Sharing Rooms</div>
              <div style={styles.priceGrid}>
                {pg.single_sharing && pg.single_sharing !== "0" && pg.single_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Single Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.single_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.double_sharing && pg.double_sharing !== "0" && pg.double_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Double Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.double_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.triple_sharing && pg.triple_sharing !== "0" && pg.triple_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Triple Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.triple_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.four_sharing && pg.four_sharing !== "0" && pg.four_sharing !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Four Sharing</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.four_sharing)}/month
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(pg.single_room || pg.double_room) && (
            <div style={styles.priceCategory}>
              <div style={styles.priceCategoryTitle}>Private Rooms</div>
              <div style={styles.priceGrid}>
                {pg.single_room && pg.single_room !== "0" && pg.single_room !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Single Room</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.single_room)}/month
                    </div>
                  </div>
                )}
                {pg.double_room && pg.double_room !== "0" && pg.double_room !== "" && (
                  <div style={styles.priceItem}>
                    <div style={styles.priceType}>Double Room</div>
                    <div style={styles.priceValue}>
                      {formatPrice(pg.double_room)}/month
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(pg.security_deposit || pg.maintenance_charges || pg.advance_rent) && (
            <div style={styles.additionalCharges}>
              <h5 style={styles.additionalChargesTitle}>Additional Charges</h5>
              <div style={styles.chargesGrid}>
                {pg.security_deposit && pg.security_deposit !== "0" && pg.security_deposit !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Security Deposit:</span>
                    <span style={styles.chargeValue}>{formatPrice(pg.security_deposit)}</span>
                  </div>
                )}
                {pg.maintenance_charges && pg.maintenance_charges !== "0" && pg.maintenance_charges !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Maintenance:</span>
                    <span style={styles.chargeValue}>{formatPrice(pg.maintenance_charges)}/month</span>
                  </div>
                )}
                {pg.advance_rent && pg.advance_rent !== "0" && pg.advance_rent !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Advance Rent:</span>
                    <span style={styles.chargeValue}>{pg.advance_rent} months</span>
                  </div>
                )}
                {pg.lock_in_period && pg.lock_in_period !== "0" && pg.lock_in_period !== "" && (
                  <div style={styles.chargeItem}>
                    <span style={styles.chargeLabel}>Lock-in Period:</span>
                    <span style={styles.chargeValue}>{pg.lock_in_period} months</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {pg.food_available && pg.food_charges && pg.food_charges !== "0" && pg.food_charges !== "" && (
        <div style={styles.foodCharges}>
          <span style={styles.foodChargesIcon}>🍽️</span>
          <div>
            <div style={styles.foodChargesLabel}>Food Charges (Optional)</div>
            <div style={styles.foodChargesValue}>{formatPrice(pg.food_charges)}/month</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState("all");
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [expandedRules, setExpandedRules] = useState({
    visitors: true,
    lifestyle: true,
    pets: true,
    restrictions: true,
    legal: true
  });

  // Color themes
  const facilityCategories = [
    { id: "all", label: "All", icon: "🏢", color: "#667eea" },
    { id: "room", label: "Room", icon: "🛏️", color: "#8b5cf6" },
    { id: "kitchen", label: "Kitchen", icon: "🍳", color: "#f59e0b" },
    { id: "safety", label: "Safety", icon: "🛡️", color: "#ef4444" },
    { id: "common", label: "Common", icon: "🏃", color: "#10b981" },
    { id: "basic", label: "Basic", icon: "💧", color: "#3b82f6" },
  ];

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching PG details for ID:", id);
        
        const res = await api.get(`/pg/${id}`);
        
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to fetch property details");
        }

        const data = res.data.data;
        console.log("PG data received:", data.pg_name);

        const photos = Array.isArray(data.photos)
          ? data.photos.map(p => ({ 
              type: "photo", 
              src: getCorrectImageUrl(p) 
            }))
          : [];

        let videos = [];
        try {
          if (data.videos) {
            videos = JSON.parse(data.videos || "[]").map(v => ({
              type: "video",
              src: getCorrectImageUrl(v),
            }));
          }
        } catch (err) {
          console.error("Error parsing videos:", err);
        }

        setMedia([...photos, ...videos]);
        setPG(data);
        
        if (data.latitude && data.longitude) {
          setMapCenter([data.latitude, data.longitude]);
        }
      } catch (err) {
        console.error("Error fetching PG details:", err);
        setError(err.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPGDetails();
    } else {
      setError("Invalid property ID");
      setLoading(false);
    }
  }, [id]);

  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;
  const hasOwnerContact = pg?.contact_phone && pg.contact_phone.trim() !== "";
  const hasContactPerson = pg?.contact_person && pg.contact_person.trim() !== "";
  const hasLocation = pg?.latitude && pg?.longitude;

  const getStartingPrice = () => {
    if (!pg) return "—";
    
    if (isToLet) {
      if (pg.price_1bhk && parseInt(pg.price_1bhk) > 0) return pg.price_1bhk;
      if (pg.price_2bhk && parseInt(pg.price_2bhk) > 0) return pg.price_2bhk;
      if (pg.price_3bhk && parseInt(pg.price_3bhk) > 0) return pg.price_3bhk;
      if (pg.price_4bhk && parseInt(pg.price_4bhk) > 0) return pg.price_4bhk;
      return "—";
    } else if (isCoLiving) {
      if (pg.co_living_single_room && parseInt(pg.co_living_single_room) > 0) return pg.co_living_single_room;
      if (pg.co_living_double_room && parseInt(pg.co_living_double_room) > 0) return pg.co_living_double_room;
      return "—";
    } else {
      if (pg.single_sharing && parseInt(pg.single_sharing) > 0) return pg.single_sharing;
      if (pg.double_sharing && parseInt(pg.double_sharing) > 0) return pg.double_sharing;
      if (pg.triple_sharing && parseInt(pg.triple_sharing) > 0) return pg.triple_sharing;
      if (pg.four_sharing && parseInt(pg.four_sharing) > 0) return pg.four_sharing;
      if (pg.single_room && parseInt(pg.single_room) > 0) return pg.single_room;
      if (pg.double_room && parseInt(pg.double_room) > 0) return pg.double_room;
      return "—";
    }
  };

  const handleBookNow = () => {
    const user = auth.currentUser;

    if (!user) {
      showNotification("Please register or login to book this property");
      navigate("/register", {
        state: { redirectTo: `/pg/${id}` }
      });
      return;
    }

    setShowBookingModal(true);
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

      await api.post(
        `/bookings/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showNotification("✅ Booking request sent to owner");
      setShowBookingModal(false);

    } catch (error) {
      console.error(error);
      showNotification("❌ Booking failed. Try again");
    }
  };

  const handleCallOwner = () => {
    if (hasOwnerContact) {
      window.location.href = `tel:${pg.contact_phone}`;
    } else {
      alert("Owner contact will be visible after booking approval");
    }
  };

  const toggleRulesSection = (section) => {
    setExpandedRules(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAllFacilities = () => {
    return [
      { key: "cupboard_available", label: "Cupboard/Wardrobe", icon: "👔", category: "room" },
      { key: "table_chair_available", label: "Study Table & Chair", icon: "💺", category: "room" },
      { key: "dining_table_available", label: "Dining Table", icon: "🍽️", category: "kitchen" },
      { key: "attached_bathroom", label: "Attached Bathroom", icon: "🚽", category: "room" },
      { key: "balcony_available", label: "Balcony", icon: "🌿", category: "room" },
      { key: "wall_mounted_clothes_hook", label: "Wall-Mounted Clothes Hook", icon: "🪝", category: "room" },
      { key: "bed_with_mattress", label: "Bed with Mattress", icon: "🛏️", category: "room" },
      { key: "fan_light", label: "Fan & Light", icon: "💡", category: "room" },
      { key: "kitchen_room", label: "Kitchen Room", icon: "🍳", category: "kitchen" },
      { key: "food_available", label: "Food Available", icon: "🍽️", category: "basic" },
      { key: "ac_available", label: "Air Conditioner", icon: "❄️", category: "room" },
      { key: "wifi_available", label: "Wi-Fi / Internet", icon: "📶", category: "basic" },
      { key: "tv", label: "Television", icon: "📺", category: "common" },
      { key: "parking_available", label: "Car Parking", icon: "🚗", category: "safety" },
      { key: "bike_parking", label: "Bike Parking", icon: "🏍️", category: "safety" },
      { key: "laundry_available", label: "Laundry Service", icon: "🧺", category: "basic" },
      { key: "washing_machine", label: "Washing Machine", icon: "🧼", category: "basic" },
      { key: "refrigerator", label: "Refrigerator", icon: "🧊", category: "kitchen" },
      { key: "microwave", label: "Microwave", icon: "🍳", category: "kitchen" },
      { key: "geyser", label: "Geyser", icon: "🚿", category: "room" },
      { key: "power_backup", label: "Power Backup", icon: "🔋", category: "basic" },
      { key: "lift_elevator", label: "Lift / Elevator", icon: "⬆️", category: "common" },
      { key: "cctv", label: "CCTV Surveillance", icon: "📹", category: "safety" },
      { key: "security_guard", label: "Security Guard", icon: "🛡️", category: "safety" },
      { key: "gym", label: "Gym / Fitness", icon: "🏋️", category: "common" },
      { key: "housekeeping", label: "Housekeeping", icon: "🧹", category: "basic" },
      { key: "water_purifier", label: "Water Purifier (RO)", icon: "💧", category: "basic" },
      { key: "fire_safety", label: "Fire Safety System", icon: "🔥", category: "safety" },
      { key: "study_room", label: "Study Room", icon: "📚", category: "common" },
      { key: "common_tv_lounge", label: "Common TV Lounge", icon: "📺", category: "common" },
      { key: "balcony_open_space", label: "Balcony / Open Space", icon: "🌿", category: "common" },
      { key: "water_24x7", label: "24×7 Water Supply", icon: "💦", category: "basic" },
    ];
  };

  const getFilteredFacilities = () => {
    const allFacilities = getAllFacilities();
    
    const trueFacilities = allFacilities.filter(facility => 
      pg && (pg[facility.key] === true || pg[facility.key] === "true" || pg[facility.key] === 1)
    );

    if (selectedFacilityCategory === "all") {
      return trueFacilities;
    }
    
    return trueFacilities.filter(facility => facility.category === selectedFacilityCategory);
  };

  const getTrueFacilitiesCountInCategory = (categoryId) => {
    const allFacilities = getAllFacilities();
    if (categoryId === "all") {
      return allFacilities.filter(facility => 
        pg && (pg[facility.key] === true || pg[facility.key] === "true" || pg[facility.key] === 1)
      ).length;
    }
    return allFacilities.filter(facility => 
      facility.category === categoryId && pg && (pg[facility.key] === true || pg[facility.key] === "true" || pg[facility.key] === 1)
    ).length;
  };

  const hasRulesContent = () => {
    if (!pg) return false;
    
    const rulesToCheck = [
      'visitor_allowed', 'couple_allowed', 'family_allowed', 'smoking_allowed',
      'drinking_allowed', 'outside_food_allowed', 'parties_allowed', 'pets_allowed',
      'late_night_entry_allowed', 'loud_music_restricted', 'office_going_only',
      'students_only', 'boys_only', 'girls_only', 'subletting_allowed', 
      'lock_in_period', 'agreement_mandatory', 'id_proof_mandatory'
    ];
    
    return rulesToCheck.some(rule => 
      pg[rule] === true || pg[rule] === "true" || pg[rule] === "false"
    );
  };

  const hasFacilitiesContent = () => {
    const hasTrueFacilities = getFilteredFacilities().length > 0;
    const hasWaterType = pg?.water_type;
    const hasAnyCategoryWithFacilities = facilityCategories.some(category => 
      getTrueFacilitiesCountInCategory(category.id) > 0
    );
    
    return hasTrueFacilities || hasWaterType || hasAnyCategoryWithFacilities;
  };

  const hasPriceDetails = () => {
    if (!pg) return false;
    
    if (isToLet) {
      return pg.price_1bhk || pg.price_2bhk || pg.price_3bhk || pg.price_4bhk;
    } else if (isCoLiving) {
      return pg.co_living_single_room || pg.co_living_double_room;
    } else {
      return pg.single_sharing || pg.double_sharing || pg.triple_sharing || 
             pg.four_sharing || pg.single_room || pg.double_room;
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div style={styles.errorContainer}>
        <h2>Property Not Found</h2>
        <p>{error || "The property you're looking for doesn't exist or has been removed."}</p>
        <button style={styles.backButton} onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>
    );
  }

  const current = media[index];
  
  const availableFacilitiesCount = getTrueFacilitiesCountInCategory("all");
  const filteredFacilities = getFilteredFacilities();

  return (
    <div style={styles.page}>
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

      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink} onClick={() => navigate("/")}>Home</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbLink} onClick={() => navigate("/properties")}>Properties</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbCurrent}>{pg.pg_name}</span>
        <span style={styles.propertyCode}>{getPGCode(pg.id)}</span>
      </div>

      {media.length > 0 ? (
        <div style={styles.slider}>
          {current.type === "photo" ? (
            <img 
              src={current.src} 
              alt={pg.pg_name} 
              style={styles.media}
              onError={(e) => {
                console.error("Image failed to load:", current.src);
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Found";
              }}
            />
          ) : (
            <video src={current.src} controls style={styles.media} />
          )}

          {media.length > 1 && (
            <>
              <button
                style={styles.navBtnLeft}
                onClick={() => setIndex(i => (i === 0 ? media.length - 1 : i - 1))}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                style={styles.navBtnRight}
                onClick={() => setIndex(i => (i + 1) % media.length)}
              >
                <ChevronRight size={24} />
              </button>
              <div style={styles.mediaCounter}>
                {index + 1} / {media.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={styles.noMedia}>
          <div style={styles.noMediaIcon}>📷</div>
          <p>No photos available</p>
        </div>
      )}

      <div style={styles.mainCard}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>{pg.pg_name}</h1>
            <p style={styles.address}>
              <MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}, ${pg.state}`}
            </p>
            {pg.landmark && (
              <p style={styles.landmark}>
                <Navigation size={14} /> Near {pg.landmark}
              </p>
            )}
          </div>
          <div style={styles.actionButtons}>
            <button
              style={styles.bookButton}
              onClick={handleBookNow}
            >
              <BookOpen size={18} />
              Book Now
            </button>
            {hasOwnerContact && (
              <button
                style={styles.callButton}
                onClick={handleCallOwner}
              >
                <Phone size={18} />
                Call Owner
              </button>
            )}
            {hasLocation && (
              <button
                style={styles.directionButton}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`,
                    "_blank"
                  )
                }
              >
                <Navigation size={18} />
                Directions
              </button>
            )}
          </div>
        </div>

        <div style={styles.badgeRow}>
          <span style={styles.typeBadge}>
            {isToLet ? "🏠 House/Flat" : 
             isCoLiving ? "🤝 Co-Living" : 
             "🏢 PG/Hostel"}
          </span>
          
          {!isToLet && !isCoLiving && pg.pg_type && (
            <span style={styles.genderBadge}>
              {pg.pg_type === "boys" ? "👨 Boys Only" : 
               pg.pg_type === "girls" ? "👩 Girls Only" : 
               "Mixed"}
            </span>
          )}
          
          {isToLet && pg.bhk_type && (
            <span style={styles.bhkBadge}>
              {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
            </span>
          )}
          
          <span style={{
            ...styles.availabilityBadge,
            backgroundColor: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
          }}>
            {pg.available_rooms > 0 ? `🟢 ${pg.available_rooms} Available` : "🔴 Fully Occupied"}
          </span>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statIcon}>💰</div>
            <div>
              <div style={styles.statLabel}>Starting from</div>
              <div style={styles.statValue}>
                ₹{formatPrice(getStartingPrice())} / month
              </div>
            </div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statIcon}>🏠</div>
            <div>
              <div style={styles.statLabel}>Total {isToLet ? "Properties" : "Rooms"}</div>
              <div style={styles.statValue}>{pg.total_rooms || "—"}</div>
            </div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <div style={styles.statLabel}>Facilities</div>
              <div style={styles.statValue}>{availableFacilitiesCount}+</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.twoColumn}>
        <div style={styles.leftColumn}>
          {pg.description && (
            <Section title="📝 About this Property">
              <p style={styles.description}>{pg.description}</p>
            </Section>
          )}

          {hasPriceDetails() && (
            <Section title="💰 Price Details">
              <PriceDetails pg={pg} />
            </Section>
          )}

          {hasFacilitiesContent() && (
            <Section 
              title={`🏠 Facilities & Amenities`} 
              badgeCount={availableFacilitiesCount}
            >
              <div style={styles.facilityCategories}>
                {facilityCategories.map(category => {
                  const trueCount = getTrueFacilitiesCountInCategory(category.id);
                  
                  if (trueCount === 0 && category.id !== "all") return null;
                  
                  return (
                    <button
                      key={category.id}
                      style={{
                        ...styles.facilityCategoryBtn,
                        background: selectedFacilityCategory === category.id 
                          ? `linear-gradient(135deg, ${category.color}, ${category.color}dd)` 
                          : 'white',
                        color: selectedFacilityCategory === category.id ? 'white' : '#374151',
                        boxShadow: selectedFacilityCategory === category.id 
                          ? `0 4px 15px ${category.color}40` 
                          : '0 2px 10px rgba(0,0,0,0.05)',
                      }}
                      onClick={() => setSelectedFacilityCategory(category.id)}
                    >
                      <span style={styles.facilityCategoryIcon}>{category.icon}</span>
                      <span style={styles.facilityCategoryLabel}>
                        {category.label} {trueCount > 0 && `(${trueCount})`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredFacilities.length > 0 ? (
                <div style={styles.facilitiesGrid}>
                  {filteredFacilities.map((facility, index) => {
                    const categoryColor = facilityCategories.find(c => c.id === facility.category)?.color;
                    return (
                      <FacilityItem 
                        key={index}
                        icon={facility.icon} 
                        label={facility.label}
                        active={true}
                        categoryColor={categoryColor}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={styles.noFacilitiesContainer}>
                  <div style={styles.noFacilitiesIcon}>🏢</div>
                  <p style={styles.noContentText}>
                    No {selectedFacilityCategory === "all" ? "" : selectedFacilityCategory} facilities available
                  </p>
                </div>
              )}

              {pg.water_type && (
                <div style={styles.waterSource}>
                  <strong>💧 Water Source:</strong> {pg.water_type === "borewell" ? "Borewell" : 
                                                 pg.water_type === "kaveri" ? "Kaveri" : 
                                                 pg.water_type === "both" ? "Both" : 
                                                 pg.water_type === "municipal" ? "Municipal" : pg.water_type}
                </div>
              )}
            </Section>
          )}

          {hasRulesContent() && (
            <Section title="📜 House Rules & Restrictions">
              <div style={styles.rulesContainer}>
                {(pg.visitor_allowed || pg.couple_allowed || pg.family_allowed) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('visitors')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>👥</span>
                        Visitor Rules
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.visitors ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.visitors && (
                      <div style={styles.rulesGrid}>
                        {(pg.visitor_allowed === true || pg.visitor_allowed === "true" || pg.visitor_allowed === "false") && (
                          <RuleItem 
                            icon="👥" 
                            label="Visitors Allowed" 
                            allowed={pg.visitor_allowed === true || pg.visitor_allowed === "true"}
                            description="Friends and family can visit"
                          />
                        )}
                        {(pg.couple_allowed === true || pg.couple_allowed === "true" || pg.couple_allowed === "false") && (
                          <RuleItem 
                            icon="❤️" 
                            label="Couples Allowed" 
                            allowed={pg.couple_allowed === true || pg.couple_allowed === "true"}
                            description="Couples can stay together"
                          />
                        )}
                        {(pg.family_allowed === true || pg.family_allowed === "true" || pg.family_allowed === "false") && (
                          <RuleItem 
                            icon="👨‍👩‍👧‍👦" 
                            label="Family Allowed" 
                            allowed={pg.family_allowed === true || pg.family_allowed === "true"}
                            description="Families can stay"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(pg.smoking_allowed || pg.drinking_allowed || pg.outside_food_allowed || pg.parties_allowed) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('lifestyle')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>🚬</span>
                        Lifestyle Rules
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.lifestyle ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.lifestyle && (
                      <div style={styles.rulesGrid}>
                        {(pg.smoking_allowed === true || pg.smoking_allowed === "true" || pg.smoking_allowed === "false") && (
                          <RuleItem 
                            icon="🚬" 
                            label="Smoking Allowed" 
                            allowed={pg.smoking_allowed === true || pg.smoking_allowed === "true"}
                            description="Smoking inside the property"
                          />
                        )}
                        {(pg.drinking_allowed === true || pg.drinking_allowed === "true" || pg.drinking_allowed === "false") && (
                          <RuleItem 
                            icon="🍺" 
                            label="Drinking Allowed" 
                            allowed={pg.drinking_allowed === true || pg.drinking_allowed === "true"}
                            description="Alcohol consumption allowed"
                          />
                        )}
                        {(pg.outside_food_allowed === true || pg.outside_food_allowed === "true" || pg.outside_food_allowed === "false") && (
                          <RuleItem 
                            icon="🍕" 
                            label="Outside Food Allowed" 
                            allowed={pg.outside_food_allowed === true || pg.outside_food_allowed === "true"}
                            description="Can bring food from outside"
                          />
                        )}
                        {(pg.parties_allowed === true || pg.parties_allowed === "true" || pg.parties_allowed === "false") && (
                          <RuleItem 
                            icon="🎉" 
                            label="Parties Allowed" 
                            allowed={pg.parties_allowed === true || pg.parties_allowed === "true"}
                            description="Can host parties"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(pg.pets_allowed || pg.late_night_entry_allowed || pg.entry_curfew_time) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('pets')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>🐾</span>
                        Pets & Entry Rules
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.pets ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.pets && (
                      <div style={styles.rulesGrid}>
                        {(pg.pets_allowed === true || pg.pets_allowed === "true" || pg.pets_allowed === "false") && (
                          <RuleItem 
                            icon="🐕" 
                            label="Pets Allowed" 
                            allowed={pg.pets_allowed === true || pg.pets_allowed === "true"}
                            description="Can keep pets"
                          />
                        )}
                        {(pg.late_night_entry_allowed === true || pg.late_night_entry_allowed === "true" || pg.late_night_entry_allowed === "false") && (
                          <RuleItem 
                            icon="🌙" 
                            label="Late Night Entry" 
                            allowed={pg.late_night_entry_allowed === true || pg.late_night_entry_allowed === "true"}
                            description="Can enter late at night"
                          />
                        )}
                        {pg.entry_curfew_time && !(pg.late_night_entry_allowed === true || pg.late_night_entry_allowed === "true") && (
                          <RuleItem 
                            icon="⏰" 
                            label={`Curfew: ${pg.entry_curfew_time}`} 
                            allowed={false}
                            description="Entry restricted after this time"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(pg.loud_music_restricted || pg.office_going_only || pg.students_only || pg.boys_only || pg.girls_only || pg.subletting_allowed) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('restrictions')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>🎯</span>
                        Restrictions
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.restrictions ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.restrictions && (
                      <div style={styles.rulesGrid}>
                        {(pg.loud_music_restricted === true || pg.loud_music_restricted === "true" || pg.loud_music_restricted === "false") && (
                          <RuleItem 
                            icon="🔇" 
                            label="Loud Music Restricted" 
                            allowed={pg.loud_music_restricted === true || pg.loud_music_restricted === "true"}
                            description="No loud music allowed"
                          />
                        )}
                        {(pg.office_going_only === true || pg.office_going_only === "true" || pg.office_going_only === "false") && (
                          <RuleItem 
                            icon="💼" 
                            label="Office-Going Only" 
                            allowed={pg.office_going_only === true || pg.office_going_only === "true"}
                            description="Only working professionals"
                          />
                        )}
                        {(pg.students_only === true || pg.students_only === "true" || pg.students_only === "false") && (
                          <RuleItem 
                            icon="🎓" 
                            label="Students Only" 
                            allowed={pg.students_only === true || pg.students_only === "true"}
                            description="Only students allowed"
                          />
                        )}
                        {!isCoLiving && (
                          <>
                            {(pg.boys_only === true || pg.boys_only === "true" || pg.boys_only === "false") && (
                              <RuleItem 
                                icon="👨" 
                                label="Boys Only" 
                                allowed={pg.boys_only === true || pg.boys_only === "true"}
                                description="Only male residents"
                              />
                            )}
                            {(pg.girls_only === true || pg.girls_only === "true" || pg.girls_only === "false") && (
                              <RuleItem 
                                icon="👩" 
                                label="Girls Only" 
                                allowed={pg.girls_only === true || pg.girls_only === "true"}
                                description="Only female residents"
                              />
                            )}
                          </>
                        )}
                        {(pg.subletting_allowed === true || pg.subletting_allowed === "true" || pg.subletting_allowed === "false") && (
                          <RuleItem 
                            icon="🔄" 
                            label="Sub-letting Allowed" 
                            allowed={pg.subletting_allowed === true || pg.subletting_allowed === "true"}
                            description="Can sublet the room"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(pg.min_stay_months || pg.agreement_mandatory || pg.id_proof_mandatory) && (
                  <div style={styles.rulesSection}>
                    <div style={styles.rulesSectionHeader} onClick={() => toggleRulesSection('legal')}>
                      <h4 style={styles.rulesSectionTitle}>
                        <span style={styles.rulesSectionIcon}>⚖️</span>
                        Legal & Duration
                      </h4>
                      <span style={styles.rulesToggle}>
                        {expandedRules.legal ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.legal && (
                      <div style={styles.rulesGrid}>
                        {pg.min_stay_months && (
                          <RuleItem 
                            icon="🔒" 
                            label={`Min Stay: ${pg.min_stay_months} months`} 
                            allowed={pg.lock_in_period === true || pg.lock_in_period === "true"}
                            description="Minimum stay requirement"
                          />
                        )}
                        {(pg.agreement_mandatory === true || pg.agreement_mandatory === "true" || pg.agreement_mandatory === "false") && (
                          <RuleItem 
                            icon="📝" 
                            label="Agreement Mandatory" 
                            allowed={pg.agreement_mandatory === true || pg.agreement_mandatory === "true"}
                            description="Legal agreement required"
                          />
                        )}
                        {(pg.id_proof_mandatory === true || pg.id_proof_mandatory === "true" || pg.id_proof_mandatory === "false") && (
                          <RuleItem 
                            icon="🆔" 
                            label="ID Proof Mandatory" 
                            allowed={pg.id_proof_mandatory === true || pg.id_proof_mandatory === "true"}
                            description="ID proof verification required"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>
          )}
        </div>

        <div style={styles.rightColumn}>
          {hasLocation && (
            <Section title="📍 Location">
              <div id="location-map" style={styles.mapContainer}>
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: "250px", width: "100%", borderRadius: "12px" }}
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pg.latitude, pg.longitude]}>
                    <Popup>
                      <div style={styles.mapPopup}>
                        <strong style={styles.mapPopupTitle}>{pg.pg_name}</strong><br/>
                        <small style={styles.mapPopupAddress}>{pg.address || pg.area}</small><br/>
                        <button 
                          style={styles.mapPopupButton}
                          onClick={handleBookNow}
                        >
                          Book Now
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
                
                <div style={styles.locationDetails}>
                  <InfoRow label="Area" value={pg.area} />
                  <InfoRow label="Road" value={pg.road} />
                  <InfoRow label="Landmark" value={pg.landmark} />
                  <InfoRow label="City" value={pg.city} />
                </div>
              </div>
            </Section>
          )}

          {(hasOwnerContact || hasContactPerson || pg?.contact_email) && (
            <div style={styles.contactCard}>
              <h3 style={styles.contactTitle}>📞 Contact Information</h3>
              {hasContactPerson && (
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>👤</span>
                  <div>
                    <div style={styles.contactLabel}>Contact Person</div>
                    <div style={styles.contactValue}>{pg.contact_person}</div>
                  </div>
                </div>
              )}
              
              {hasOwnerContact && (
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>📱</span>
                  <div>
                    <div style={styles.contactLabel}>Phone Number</div>
                    <div style={styles.contactValue}>
                      <a href={`tel:${pg.contact_phone}`} style={styles.phoneLink}>
                        {pg.contact_phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {pg.contact_email && (
                <div style={styles.contactItem}>
                  <span style={styles.contactIcon}>✉️</span>
                  <div>
                    <div style={styles.contactLabel}>Email</div>
                    <div style={styles.contactValue}>
                      <a href={`mailto:${pg.contact_email}`} style={styles.emailLink}>
                        {pg.contact_email}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={styles.contactButtons}>
                <button
                  style={styles.bookButtonSmall}
                  onClick={handleBookNow}
                >
                  <BookOpen size={16} />
                  Book Now
                </button>
                {hasOwnerContact && (
                  <button
                    style={styles.callButtonSmall}
                    onClick={handleCallOwner}
                  >
                    <Phone size={16} />
                    Call Now
                  </button>
                )}
              </div>
            </div>
          )}

          {(pg.total_rooms || pg.available_rooms) && (
            <div style={styles.availabilityCard}>
              <h3 style={styles.availabilityTitle}>🛏 Availability Status</h3>
              {pg.total_rooms && (
                <div style={styles.availabilityItem}>
                  <div style={styles.availabilityLabel}>Total {isToLet ? "Properties" : "Rooms"}</div>
                  <div style={styles.availabilityValue}>{pg.total_rooms}</div>
                </div>
              )}
              {(pg.available_rooms || pg.available_rooms === 0) && (
                <div style={styles.availabilityItem}>
                  <div style={styles.availabilityLabel}>Available Now</div>
                  <div style={{
                    ...styles.availabilityValue,
                    color: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
                  }}>
                    {pg.available_rooms > 0 ? `${pg.available_rooms} Available` : "Fully Occupied"}
                  </div>
                </div>
              )}
              <div style={styles.availabilityNote}>
                {pg.available_rooms > 0 
                  ? "Book now to secure your spot!" 
                  : "Check back later for availability"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.stickyBar}>
        <div style={styles.stickyContent}>
          <div>
            <div style={styles.stickyPrice}>₹{formatPrice(getStartingPrice())} / month</div>
            <div style={styles.stickyInfo}>
              {pg.pg_name} • {pg.area || pg.city}
            </div>
          </div>
          <div style={styles.stickyActions}>
            <button
              style={styles.stickyBookButton}
              onClick={handleBookNow}
            >
              <BookOpen size={18} />
              Book Now
            </button>
            {hasOwnerContact && (
              <button
                style={styles.stickyCallButton}
                onClick={handleCallOwner}
              >
                <Phone size={18} />
                Call Owner
              </button>
            )}
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          pg={pg}
          onClose={() => setShowBookingModal(false)}
          onBook={handleBookingSubmit}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
  },

  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
    textAlign: "center",
  },
  backButton: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    color: "#666",
    padding: "10px 0",
    flexWrap: "wrap",
  },
  breadcrumbLink: {
    color: "#667eea",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  breadcrumbSeparator: {
    color: "#cbd5e1",
  },
  breadcrumbCurrent: {
    color: "#334155",
    fontWeight: "600",
  },
  propertyCode: {
    marginLeft: "auto",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },

  slider: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
  },
  media: {
    width: "100%",
    height: "400px",
    objectFit: "cover",
    display: "block",
  },
  navBtnLeft: {
    position: "absolute",
    top: "50%",
    left: "20px",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  },
  navBtnRight: {
    position: "absolute",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.9)",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  },
  mediaCounter: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    backdropFilter: "blur(4px)",
  },
  noMedia: {
    height: "200px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    color: "white",
  },
  noMediaIcon: {
    fontSize: "48px",
    marginBottom: "10px",
    opacity: 0.8,
  },

  mainCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
    lineHeight: "1.2",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  address: {
    fontSize: "15px",
    color: "#64748b",
    margin: "0 0 4px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  landmark: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  bookButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
  },
  callButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
  },
  directionButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "24px",
  },
  typeBadge: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
  },
  genderBadge: {
    background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)",
  },
  bhkBadge: {
    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
  },
  availabilityBadge: {
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    padding: "16px",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.3s ease",
  },
  statIcon: {
    fontSize: "24px",
    width: "48px",
    height: "48px",
    backgroundColor: "white",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "2px",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
  },

  priceDetailsContainer: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  priceSection: {
    marginBottom: "24px",
  },
  priceSectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  priceSectionIcon: {
    fontSize: "20px",
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },
  priceItem: {
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
    transition: "all 0.3s ease",
  },
  priceType: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    marginBottom: "8px",
  },
  priceValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#10b981",
    marginBottom: "6px",
  },
  depositAmount: {
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "500",
    backgroundColor: "#fef2f2",
    padding: "4px 8px",
    borderRadius: "6px",
    display: "inline-block",
  },
  bhkInfo: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "8px 12px",
    borderRadius: "8px",
    display: "inline-block",
  },
  priceCategory: {
    marginBottom: "20px",
  },
  priceCategoryTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "12px",
    paddingLeft: "8px",
    borderLeft: "4px solid #667eea",
  },
  includesInfo: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#059669",
    backgroundColor: "#d1fae5",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "500",
  },
  additionalCharges: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  additionalChargesTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "12px",
  },
  chargesGrid: {
    display: "grid",
    gap: "8px",
  },
  chargeItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  chargeLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  chargeValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  foodCharges: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f0fdf4",
    borderRadius: "10px",
    border: "1px solid #86efac",
    marginTop: "16px",
  },
  foodChargesIcon: {
    fontSize: "24px",
  },
  foodChargesLabel: {
    fontSize: "12px",
    color: "#64748b",
  },
  foodChargesValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#059669",
  },
  noPriceContainer: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
    border: "1px dashed #cbd5e1",
  },
  noPriceIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
  },
  noPriceText: {
    fontSize: "14px",
    color: "#64748b",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
    marginBottom: "100px",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  section: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionBadge: {
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    minWidth: "24px",
    textAlign: "center",
  },

  description: {
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#475569",
    margin: "0",
  },

  noFacilitiesContainer: {
    textAlign: "center",
    padding: "40px 20px",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "10px",
    marginTop: "10px",
    border: "1px dashed #cbd5e1",
  },
  noFacilitiesIcon: {
    fontSize: "48px",
    marginBottom: "15px",
    opacity: 0.5,
  },
  noContentText: {
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "500",
    marginBottom: "8px",
  },

  facilityCategories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
  },
  facilityCategoryBtn: {
    padding: "8px 12px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  facilityCategoryIcon: {
    fontSize: "14px",
  },
  facilityCategoryLabel: {
    fontSize: "12px",
  },

  facilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "12px",
  },
  facilityItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s",
    cursor: "pointer",
    position: "relative",
  },
  facilityItemActive: {},
  facilityItemInactive: {
    opacity: 0.6,
  },
  facilityIcon: {
    fontSize: "18px",
    width: "32px",
    height: "32px",
    backgroundColor: "white",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  facilityLabel: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: "500",
    flex: 1,
  },
  checkmark: {
    color: "#10b981",
    fontWeight: "bold",
    fontSize: "14px",
  },
  waterSource: {
    marginTop: "16px",
    padding: "12px",
    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0369a1",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #7dd3fc",
  },

  rulesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  rulesSection: {
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  rulesSectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    cursor: "pointer",
    backgroundColor: "white",
    transition: "all 0.3s ease",
  },
  rulesSectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  rulesSectionIcon: {
    fontSize: "16px",
  },
  rulesToggle: {
    fontSize: "18px",
    color: "#64748b",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  rulesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    padding: "16px",
    paddingTop: "0",
  },
  ruleItem: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
  },
  ruleIconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleIcon: {
    fontSize: "20px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  ruleContent: {
    flex: 1,
  },
  ruleLabel: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  ruleDescription: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "8px",
  },
  ruleStatus: {
    display: "flex",
    alignItems: "center",
  },
  ruleStatusBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    color: "white",
  },

  mapContainer: {
    marginBottom: "20px",
  },
  mapPopup: {
    padding: "10px",
    maxWidth: "200px",
  },
  mapPopupTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  mapPopupAddress: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  mapPopupButton: {
    padding: "6px 12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "8px",
  },
  locationDetails: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  infoRow: {
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#475569",
  },

  contactCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  contactTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  contactIcon: {
    fontSize: "20px",
    width: "40px",
    height: "40px",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  contactLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "2px",
  },
  contactValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
  },
  phoneLink: {
    color: "#334155",
    textDecoration: "none",
    transition: "all 0.3s",
  },
  emailLink: {
    color: "#3b82f6",
    textDecoration: "none",
    transition: "all 0.3s",
  },
  contactButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
  },
  bookButtonSmall: {
    flex: "1",
    padding: "10px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  callButtonSmall: {
    flex: "1",
    padding: "10px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },

  availabilityCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  availabilityTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  availabilityItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  availabilityLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  availabilityValue: {
    fontSize: "16px",
    fontWeight: "700",
  },
  availabilityNote: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    padding: "8px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },

  stickyBar: {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    backgroundColor: "white",
    padding: "12px 20px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
    zIndex: "1000",
    backdropFilter: "blur(10px)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  stickyContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  stickyPrice: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  stickyInfo: {
    fontSize: "13px",
    color: "#64748b",
  },
  stickyActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  stickyBookButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
  },
  stickyCallButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
};