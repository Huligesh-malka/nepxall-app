import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";

// Import icons from lucide-react
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

// Base URL for images
const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

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
      return `${BASE_URL}${relativePath}`;
    }
  }
  
  if (photo.includes('/opt/render/')) {
    const uploadsMatch = photo.match(/\/uploads\/.*/);
    if (uploadsMatch) {
      return `${BASE_URL}${uploadsMatch[0]}`;
    }
  }
  
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BASE_URL}${normalizedPath}`;
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

const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;

// Get tomorrow's date for check-in
const getTomorrowDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMaxDate = () => {
  const max = new Date();
  max.setMonth(max.getMonth() + 6);
  const year = max.getFullYear();
  const month = String(max.getMonth() + 1).padStart(2, '0');
  const day = String(max.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/* ================= BOOKING MODAL COMPONENT (UPDATED MODERN DESIGN) ================= */
const BookingModal = ({ pg, onClose, onBook, bookingLoading }) => {
  const [bookingData, setBookingData] = useState({
    checkInDate: "",
    roomType: ""
  });

  useEffect(() => {
    const defaultRoomType = getDefaultRoomType();
    setBookingData({
      checkInDate: "",
      roomType: defaultRoomType || ""
    });
  }, [pg]);

  const getDefaultRoomType = () => {
    if (pg?.pg_category === "pg") {
      if (pg.single_sharing) return "Single Sharing";
      if (pg.double_sharing) return "Double Sharing";
      if (pg.triple_sharing) return "Triple Sharing";
      if (pg.four_sharing) return "Four Sharing";
      if (pg.single_room) return "Single Room";
      if (pg.double_room) return "Double Room";
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room) return "Single Room";
      if (pg.co_living_double_room) return "Double Room";
    } else if (pg?.pg_category === "to_let") {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onBook(bookingData);
  };

  const getRoomTypes = () => {
    const types = [];
    
    if (pg?.pg_category === "pg") {
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
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ 
        value: "Single Room", 
        label: `Co-Living Single Room - ₹${formatPrice(pg.co_living_single_room)}` 
      });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ 
        value: "Double Room", 
        label: `Co-Living Double Room - ₹${formatPrice(pg.co_living_double_room)}` 
      });
    } else if (pg?.pg_category === "to_let") {
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
    
    if (pg?.pg_category === "pg") {
      if (bookingData.roomType === "Single Sharing") return pg.single_sharing;
      if (bookingData.roomType === "Double Sharing") return pg.double_sharing;
      if (bookingData.roomType === "Triple Sharing") return pg.triple_sharing;
      if (bookingData.roomType === "Four Sharing") return pg.four_sharing;
      if (bookingData.roomType === "Single Room") return pg.single_room;
      if (bookingData.roomType === "Double Room") return pg.double_room;
    } else if (pg?.pg_category === "coliving") {
      if (bookingData.roomType === "Single Room") return pg.co_living_single_room;
      if (bookingData.roomType === "Double Room") return pg.co_living_double_room;
    } else if (pg?.pg_category === "to_let") {
      if (bookingData.roomType === "1BHK") return pg.price_1bhk;
      if (bookingData.roomType === "2BHK") return pg.price_2bhk;
      if (bookingData.roomType === "3BHK") return pg.price_3bhk;
      if (bookingData.roomType === "4BHK") return pg.price_4bhk;
    }
    return null;
  };

  const selectedPrice = getSelectedPrice();

  return (
    <div style={modernStyles.modalOverlay}>
      <div style={modernStyles.modalContainer}>
        <button onClick={onClose} disabled={bookingLoading} style={modernStyles.modalCloseBtn}>
          <X size={24} />
        </button>

        <div style={modernStyles.modalContent}>
          <div style={modernStyles.modalHeader}>
            <h2 style={modernStyles.modalTitle}>🏠 Reserve {pg?.pg_name}</h2>
            <p style={modernStyles.modalSubtitle}>Your details will be auto-filled from your profile</p>
          </div>

          <div style={modernStyles.modalWarning}>
            ⚠️ You can only request this PG once every 24 hours
          </div>

          <form onSubmit={handleSubmit}>
            <div style={modernStyles.formGroup}>
              <label style={modernStyles.formLabel}>Check-in Date *</label>
              <input
                type="date"
                name="checkInDate"
                value={bookingData.checkInDate}
                onChange={handleInputChange}
                required
                disabled={bookingLoading}
                min={getTomorrowDate()}
                max={getMaxDate()}
                style={modernStyles.formInput}
              />
              <p style={modernStyles.formHint}>Earliest check-in: tomorrow (24h notice required)</p>
            </div>

            <div style={modernStyles.formGroup}>
              <label style={modernStyles.formLabel}>
                {pg?.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
              </label>
              <select
                name="roomType"
                value={bookingData.roomType}
                onChange={handleInputChange}
                required
                disabled={bookingLoading}
                style={modernStyles.formSelect}
              >
                <option value="">Select {pg?.pg_category === "to_let" ? "BHK Type" : "Room Type"}</option>
                {getRoomTypes().map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              {selectedPrice !== null && selectedPrice > 0 && (
                <p style={modernStyles.selectedPrice}>
                  Selected: {bookingData.roomType} - ₹{formatPrice(selectedPrice)}/month
                </p>
              )}
            </div>

            <div style={modernStyles.infoBox}>
              <div style={modernStyles.infoBoxHeader}>
                <Info size={16} />
                <span>Booking Information</span>
              </div>
              <ul style={modernStyles.infoList}>
                <li>Your name and contact info will be auto-filled from your profile</li>
                <li>Register number will be automatically generated</li>
                <li>You'll receive confirmation via email/SMS</li>
                <li>Owner will contact you within 24 hours</li>
              </ul>
            </div>

            <div style={modernStyles.modalActions}>
              <button type="button" onClick={onClose} disabled={bookingLoading} style={modernStyles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={bookingLoading} style={modernStyles.confirmBtn}>
                {bookingLoading ? (
                  <>
                    <div style={modernStyles.spinnerSmall} />
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

// Helper functions
const getHighlightIcon = (category, type) => {
  const categoryIcons = {
    education: "🎓",
    transport: "🚌",
    healthcare: "🏥",
    shopping: "🛒",
    finance: "🏦",
    recreation: "🏃",
    worship: "🛐",
    safety: "👮",
    food: "🍽️"
  };
  
  if (type === "college" || type === "nearby_college") return "🏫";
  if (type === "school" || type === "nearby_school") return "📚";
  if (type === "hospital" || type === "nearby_hospital") return "🏥";
  if (type === "clinic" || type === "nearby_clinic") return "🩺";
  if (type === "pharmacy" || type === "nearby_pharmacy") return "💊";
  if (type === "bank" || type === "nearby_bank") return "🏦";
  if (type === "atm" || type === "nearby_atm") return "🏧";
  if (type === "police" || type === "nearby_police_station") return "👮";
  if (type === "restaurant" || type === "nearby_restaurant") return "🍽️";
  if (type === "supermarket" || type === "nearby_supermarket") return "🛒";
  if (type === "grocery" || type === "nearby_grocery_store") return "🥦";
  if (type === "bus" || type === "nearby_bus_stop") return "🚌";
  if (type === "railway" || type === "nearby_railway_station") return "🚆";
  if (type === "metro" || type === "nearby_metro") return "🚇";
  if (type === "gym" || type === "nearby_gym") return "🏋️";
  if (type === "park" || type === "nearby_park") return "🌳";
  if (type === "mall" || type === "nearby_mall") return "🏬";
  if (type === "post_office" || type === "nearby_post_office") return "📮";
  if (type === "temple" || type === "nearby_temple") return "🛕";
  if (type === "mosque" || type === "nearby_mosque") return "🕌";
  if (type === "church" || type === "nearby_church") return "⛪";
  if (type === "it_park" || type === "nearby_it_park") return "💻";
  if (type === "office_hub" || type === "nearby_office_hub") return "🏢";
  if (type === "main_road" || type === "distance_main_road") return "🛣️";
  
  return categoryIcons[category] || "📍";
};

// Helper Components with modern styling
const Section = ({ title, children, hasContent = true, badgeCount }) => 
  hasContent ? (
    <div style={modernStyles.section}>
      <div style={modernStyles.sectionHeader}>
        <h3 style={modernStyles.sectionTitle}>{title}</h3>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span style={modernStyles.sectionBadge}>{badgeCount}</span>
        )}
      </div>
      {children}
    </div>
  ) : null;

const FacilityItem = ({ icon, label, active = true, onClick, categoryColor }) => (
  <div 
    style={{
      ...modernStyles.facilityItem,
      background: active 
        ? `linear-gradient(135deg, ${categoryColor || '#f0f9ff'}10, white)` 
        : '#f9fafb',
      borderLeft: `4px solid ${categoryColor || '#667eea'}`,
      ...(active ? modernStyles.facilityItemActive : modernStyles.facilityItemInactive)
    }}
    onClick={onClick}
    title={label}
  >
    <span style={modernStyles.facilityIcon}>{icon}</span>
    <span style={modernStyles.facilityLabel}>{label}</span>
    {active && <span style={modernStyles.checkmark}>✓</span>}
  </div>
);

const RuleItem = ({ icon, label, allowed, description }) => (
  <div style={{
    ...modernStyles.ruleItem,
    background: allowed 
      ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' 
      : 'linear-gradient(135deg, #fef2f2, #fee2e2)'
  }}>
    <div style={modernStyles.ruleIconContainer}>
      <span style={{
        ...modernStyles.ruleIcon,
        background: allowed ? '#10b981' : '#ef4444'
      }}>{icon}</span>
    </div>
    <div style={modernStyles.ruleContent}>
      <div style={{
        ...modernStyles.ruleLabel,
        color: allowed ? '#065f46' : '#7f1d1d'
      }}>{label}</div>
      {description && (
        <div style={modernStyles.ruleDescription}>{description}</div>
      )}
      <div style={modernStyles.ruleStatus}>
        <span style={{
          ...modernStyles.ruleStatusBadge,
          background: allowed ? '#10b981' : '#ef4444'
        }}>
          {allowed ? '✅ Allowed' : '❌ Not Allowed'}
        </span>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => {
  if (
  value === null ||
  value === undefined ||
  value === "" ||
  value === "0" ||
  value === 0 ||
  value === false ||
  value === "false"
) {
  return null;
}
  return (
    <div style={modernStyles.infoRow}>
      <strong>{label}:</strong> {value}
    </div>
  );
};

// Price Component for different property types (updated design)
const PriceDetails = ({ pg }) => {
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;

  const formatPriceLocal = (price) => {
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
             pg.four_sharing || pg.single_room || pg.double_room || pg.triple_room;
    }
  };

  if (!hasAnyPrice()) {
    return (
      <div style={modernStyles.noPriceContainer}>
        <span style={modernStyles.noPriceIcon}>💰</span>
        <p style={modernStyles.noPriceText}>Price details not available</p>
      </div>
    );
  }

  return (
    <div style={modernStyles.priceDetailsContainer}>
      {isToLet && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🏠</span>
            House/Flat Rental Prices
          </h4>
          <div style={modernStyles.priceGrid}>
            {pg.price_1bhk && pg.price_1bhk !== "0" && pg.price_1bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>1 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_1bhk)}/month
                </div>
                {pg.security_deposit_1bhk && pg.security_deposit_1bhk !== "0" && pg.security_deposit_1bhk !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.security_deposit_1bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_2bhk && pg.price_2bhk !== "0" && pg.price_2bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>2 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_2bhk)}/month
                </div>
                {pg.security_deposit_2bhk && pg.security_deposit_2bhk !== "0" && pg.security_deposit_2bhk !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.security_deposit_2bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_3bhk && pg.price_3bhk !== "0" && pg.price_3bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>3 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_3bhk)}/month
                </div>
                {pg.security_deposit_3bhk && pg.security_deposit_3bhk !== "0" && pg.security_deposit_3bhk !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.security_deposit_3bhk)}
                  </div>
                )}
              </div>
            )}
            {pg.price_4bhk && pg.price_4bhk !== "0" && pg.price_4bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>4 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_4bhk)}/month
                </div>
                {pg.security_deposit_4bhk && pg.security_deposit_4bhk !== "0" && pg.security_deposit_4bhk !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.security_deposit_4bhk)}
                  </div>
                )}
              </div>
            )}
          </div>
          {pg.bhk_type && (
            <div style={modernStyles.bhkInfo}>
              Available: {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
            </div>
          )}
        </div>
      )}

      {isCoLiving && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🤝</span>
            Co-Living Prices
          </h4>
          <div style={modernStyles.priceGrid}>
            {pg.co_living_single_room && pg.co_living_single_room !== "0" && pg.co_living_single_room !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Single Room</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.co_living_single_room)}/month
                </div>
                {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && pg.co_living_security_deposit !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.co_living_security_deposit)}
                  </div>
                )}
              </div>
            )}
            {pg.co_living_double_room && pg.co_living_double_room !== "0" && pg.co_living_double_room !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Double Room</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.co_living_double_room)}/month
                </div>
                {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && pg.co_living_security_deposit !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.co_living_security_deposit)}
                  </div>
                )}
              </div>
            )}
          </div>
          {pg.co_living_includes && (
            <div style={modernStyles.includesInfo}>
              Includes: {pg.co_living_includes}
            </div>
          )}
        </div>
      )}

      {isPG && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🏢</span>
            PG/Hostel Room Prices
          </h4>
          
          {(pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing) && (
            <div style={modernStyles.priceCategory}>
              <div style={modernStyles.priceCategoryTitle}>Sharing Rooms</div>
              <div style={modernStyles.priceGrid}>
                {pg.single_sharing && pg.single_sharing !== "0" && pg.single_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Single Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.single_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.double_sharing && pg.double_sharing !== "0" && pg.double_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Double Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.double_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.triple_sharing && pg.triple_sharing !== "0" && pg.triple_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Triple Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.triple_sharing)}/month
                    </div>
                  </div>
                )}
                {pg.four_sharing && pg.four_sharing !== "0" && pg.four_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Four Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.four_sharing)}/month
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(pg.single_room || pg.double_room || pg.triple_room) && (
            <div style={modernStyles.priceCategory}>
              <div style={modernStyles.priceCategoryTitle}>Private Rooms</div>
              <div style={modernStyles.priceGrid}>
                {pg.single_room && pg.single_room !== "0" && pg.single_room !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Single Room</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.single_room)}/month
                    </div>
                  </div>
                )}
                {pg.double_room && pg.double_room !== "0" && pg.double_room !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Double Room</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.double_room)}/month
                    </div>
                  </div>
                )}
                {pg.triple_room && pg.triple_room !== "0" && pg.triple_room !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Triple Room</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.triple_room)}/month
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(pg.security_deposit || pg.maintenance_charges || pg.advance_rent) && (
            <div style={modernStyles.additionalCharges}>
              <h5 style={modernStyles.additionalChargesTitle}>Additional Charges</h5>
              <div style={modernStyles.chargesGrid}>
                {pg.security_deposit && pg.security_deposit !== "0" && pg.security_deposit !== "" && (
                  <div style={modernStyles.chargeItem}>
                    <span style={modernStyles.chargeLabel}>Security Deposit:</span>
                    <span style={modernStyles.chargeValue}>{formatPriceLocal(pg.security_deposit)}</span>
                  </div>
                )}
                {pg.maintenance_charges && pg.maintenance_charges !== "0" && pg.maintenance_charges !== "" && (
                  <div style={modernStyles.chargeItem}>
                    <span style={modernStyles.chargeLabel}>Maintenance:</span>
                    <span style={modernStyles.chargeValue}>{formatPriceLocal(pg.maintenance_charges)}/month</span>
                  </div>
                )}
                {pg.advance_rent && pg.advance_rent !== "0" && pg.advance_rent !== "" && (
                  <div style={modernStyles.chargeItem}>
                    <span style={modernStyles.chargeLabel}>Advance Rent:</span>
                    <span style={modernStyles.chargeValue}>{pg.advance_rent} months</span>
                  </div>
                )}
                {pg.lock_in_period && pg.lock_in_period !== "0" && pg.lock_in_period !== "" && (
                  <div style={modernStyles.chargeItem}>
                    <span style={modernStyles.chargeLabel}>Lock-in Period:</span>
                    <span style={modernStyles.chargeValue}>{pg.lock_in_period} months</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {pg.food_available && pg.food_charges && pg.food_charges !== "0" && pg.food_charges !== "" && (
        <div style={modernStyles.foodCharges}>
          <span style={modernStyles.foodChargesIcon}>🍽️</span>
          <div>
            <div style={modernStyles.foodChargesLabel}>Food Charges (Optional)</div>
            <div style={modernStyles.foodChargesValue}>{formatPriceLocal(pg.food_charges)}/month</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Highlight Category Button (modern)
const HighlightCategoryButton = ({ 
  category, 
  icon, 
  label, 
  count, 
  isActive, 
  onClick,
  color 
}) => (
  <button
    style={{
      ...modernStyles.highlightCategoryBtn,
      background: isActive 
        ? `linear-gradient(135deg, ${color}, ${color}dd)` 
        : 'white',
      color: isActive ? 'white' : '#374151',
      boxShadow: isActive ? `0 4px 15px ${color}40` : '0 2px 10px rgba(0,0,0,0.05)',
      ...(count === 0 ? modernStyles.highlightCategoryBtnEmpty : {})
    }}
    onClick={onClick}
    disabled={count === 0}
  >
    <span style={modernStyles.highlightCategoryIcon}>{icon}</span>
    <span style={modernStyles.highlightCategoryLabel}>
      {label} {count > 0 && <span style={modernStyles.highlightCategoryCount}>{count}</span>}
    </span>
  </button>
);

// Highlight Item Component (modern)
const HighlightItem = ({ name, type, category, icon, onMapView, coordinates, color }) => (
  <div 
    style={{
      ...modernStyles.highlightItem,
      borderLeft: `4px solid ${color}`
    }}
    onClick={onMapView}
  >
    <div style={{
      ...modernStyles.highlightIconContainer,
      background: `linear-gradient(135deg, ${color}, ${color}dd)`
    }}>
      <span style={modernStyles.highlightIcon}>{icon}</span>
    </div>
    <div style={modernStyles.highlightContent}>
      <div style={modernStyles.highlightName}>{name}</div>
      <div style={modernStyles.highlightType}>{type.replace(/_/g, ' ').replace('nearby ', '')}</div>
      {coordinates && (
        <div style={modernStyles.highlightDistance}>
          📏 {calculateDistance(coordinates).toFixed(1)} km away
        </div>
      )}
    </div>
    <button 
      style={{
        ...modernStyles.viewOnMapButton,
        background: `linear-gradient(135deg, ${color}, ${color}dd)`
      }} 
      onClick={(e) => {
        e.stopPropagation();
        onMapView();
      }}
    >
      🗺️ View
    </button>
  </div>
);

// Nearby PG Card Component (modern)
const NearbyPGCard = ({ pg, onClick, distance }) => {
  const getStartingPrice = () => {
    if (!pg) return "—";
    
    const isToLet = pg.pg_category === "to_let";
    const isCoLiving = pg.pg_category === "coliving";
    
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
      if (pg.triple_room && parseInt(pg.triple_room) > 0) return pg.triple_room;
      return "—";
    }
  };

  const getImageUrl = () => {
    if (pg.photos && pg.photos.length > 0) {
      return getCorrectImageUrl(pg.photos[0]);
    }
    return null;
  };

  const imageUrl = getImageUrl();

  return (
    <div style={modernStyles.nearbyPgCard} onClick={onClick}>
      <div style={modernStyles.nearbyPgImageContainer}>
        <div style={modernStyles.nearbyPgImagePlaceholder}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={pg.pg_name} 
              style={modernStyles.nearbyPgImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div style="font-size: 40px; color: #94a3b8;">🏠</div>';
              }}
            />
          ) : (
            <div style={modernStyles.nearbyPgNoImage}>🏠</div>
          )}
        </div>
        <div style={modernStyles.nearbyPgBadges}>
          <span style={modernStyles.nearbyPgTypeBadge}>
            {pg.pg_category === "to_let" ? "🏠 House" : 
             pg.pg_category === "coliving" ? "🤝 Co-Living" : 
             "🏢 PG"}
          </span>
          {distance && (
            <span style={modernStyles.nearbyPgDistanceBadge}>
              📏 {distance.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
      
      <div style={modernStyles.nearbyPgContent}>
        <h4 style={modernStyles.nearbyPgTitle}>{pg.pg_name}</h4>
        <p style={modernStyles.nearbyPgAddress}>
          📍 {pg.address ? `${pg.address.substring(0, 40)}...` : pg.area || pg.city}
        </p>
        
        <div style={modernStyles.nearbyPgStats}>
          <div style={modernStyles.nearbyPgStat}>
            <span style={modernStyles.nearbyPgStatIcon}>💰</span>
            <span style={modernStyles.nearbyPgStatText}>
              ₹{getStartingPrice()}/month
            </span>
          </div>
          <div style={modernStyles.nearbyPgStat}>
            <span style={modernStyles.nearbyPgStatIcon}>🏠</span>
            <span style={modernStyles.nearbyPgStatText}>
              {pg.available_rooms || pg.total_rooms || 0} rooms
            </span>
          </div>
        </div>
        
        <div style={modernStyles.nearbyPgFacilities}>
          {pg.ac_available && <span style={modernStyles.nearbyPgFacility}>❄️</span>}
          {pg.wifi_available && <span style={modernStyles.nearbyPgFacility}>📶</span>}
          {pg.food_available && <span style={modernStyles.nearbyPgFacility}>🍽️</span>}
          {pg.parking_available && <span style={modernStyles.nearbyPgFacility}>🚗</span>}
          {pg.cctv && <span style={modernStyles.nearbyPgFacility}>📹</span>}
          {pg.laundry_available && <span style={modernStyles.nearbyPgFacility}>🧺</span>}
        </div>
        
        <button 
          style={modernStyles.nearbyPgViewButton}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

const calculateDistance = (coordinates) => {
  return Math.random() * 2 + 0.5;
};

const calculateDistanceBetweenCoords = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Interactive Nearby Highlights Panel (modern)
const NearbyHighlightsPanel = ({ 
  highlights, 
  selectedCategory, 
  onCategoryChange, 
  onViewOnMap,
  isLoading,
  highlightCategories 
}) => {
  if (isLoading) {
    return (
      <div style={modernStyles.loadingHighlightsPanel}>
        <div className="spinner"></div>
        <p>Finding nearby places...</p>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div style={modernStyles.noHighlightsPanel}>
        <div style={modernStyles.noHighlightsIcon}>📍</div>
        <h4 style={modernStyles.noHighlightsTitle}>No Nearby Places Found</h4>
        <p style={modernStyles.noHighlightsText}>
          We couldn't find any nearby places in our database for this location.
        </p>
      </div>
    );
  }

  const filteredHighlights = selectedCategory === "all" 
    ? highlights 
    : highlights.filter(h => h.category === selectedCategory);

  const selectedColor = highlightCategories.find(c => c.id === selectedCategory)?.color || '#667eea';

  return (
    <div style={modernStyles.highlightsPanel}>
      <div style={modernStyles.categoriesPills}>
        {highlightCategories.map(category => {
          const count = category.id === "all" 
            ? highlights.length 
            : highlights.filter(h => h.category === category.id).length;
          
          if (count === 0) return null;
          
          return (
            <HighlightCategoryButton
              key={category.id}
              category={category.id}
              icon={category.icon}
              label={category.label}
              count={count}
              isActive={selectedCategory === category.id}
              onClick={() => onCategoryChange(category.id)}
              color={category.color}
            />
          );
        })}
      </div>

      <div style={modernStyles.highlightsList}>
        <div style={modernStyles.highlightsListHeader}>
          <h4 style={modernStyles.highlightsListTitle}>
            <span style={{
              ...modernStyles.categoryIndicator,
              background: selectedColor
            }}></span>
            {selectedCategory === "all" 
              ? `All Nearby Places` 
              : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`
            }
          </h4>
          <span style={modernStyles.highlightsCount}>{filteredHighlights.length} places</span>
        </div>
        
        <div style={modernStyles.highlightsItemsContainer}>
          {filteredHighlights.map((highlight, index) => (
            <HighlightItem
              key={index}
              name={highlight.name}
              type={highlight.type}
              category={highlight.category}
              icon={highlight.icon}
              coordinates={highlight.coordinates}
              onMapView={() => onViewOnMap(highlight)}
              color={highlightCategories.find(c => c.id === highlight.category)?.color || '#667eea'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Nearby PGs Panel Component (modern)
const NearbyPGsPanel = ({ nearbyPGs, isLoading, onViewPG }) => {
  if (isLoading) {
    return (
      <div style={modernStyles.loadingNearbyPGs}>
        <div className="spinner"></div>
        <p>Finding nearby properties...</p>
      </div>
    );
  }

  if (nearbyPGs.length === 0) {
    return (
      <div style={modernStyles.noNearbyPGs}>
        <div style={modernStyles.noNearbyPGsIcon}>🏠</div>
        <h4 style={modernStyles.noNearbyPGsTitle}>No Nearby Properties</h4>
        <p style={modernStyles.noNearbyPGsText}>
          We couldn't find other properties in this area.
        </p>
      </div>
    );
  }

  return (
    <div style={modernStyles.nearbyPGsPanel}>
      <div style={modernStyles.nearbyPGsHeader}>
        <h3 style={modernStyles.nearbyPGsTitle}>
          <span style={modernStyles.nearbyPGsIcon}>🏘️</span>
          Nearby Properties
        </h3>
        <span style={modernStyles.nearbyPGsCount}>{nearbyPGs.length} properties</span>
      </div>
      
      <div style={modernStyles.nearbyPGsGrid}>
        {nearbyPGs.map((nearbyPG, index) => (
          <NearbyPGCard
            key={nearbyPG.id || index}
            pg={nearbyPG}
            onClick={() => onViewPG(nearbyPG.id)}
            distance={nearbyPG.distance}
          />
        ))}
      </div>
      
      <div style={modernStyles.nearbyPGsFooter}>
        <button style={modernStyles.viewAllPropertiesButton} onClick={() => onViewPG('all')}>
          View All Properties in {nearbyPGs[0]?.area || nearbyPGs[0]?.city || "Area"} →
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ✅ USE ONLY THIS - No direct auth.currentUser
  const { user, role, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [loadingNearbyPGs, setLoadingNearbyPGs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState("all");
  const [selectedHighlightCategory, setSelectedHighlightCategory] = useState("all");
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [expandedRules, setExpandedRules] = useState({
    visitors: true,
    lifestyle: true,
    pets: true,
    restrictions: true,
    legal: true
  });

  // Color themes
  const highlightCategories = [
    { id: "all", label: "All", icon: "📍", color: "#667eea" },
    { id: "education", label: "Education", icon: "🎓", color: "#8b5cf6" },
    { id: "transport", label: "Transport", icon: "🚌", color: "#3b82f6" },
    { id: "healthcare", label: "Healthcare", icon: "🏥", color: "#ef4444" },
    { id: "shopping", label: "Shopping", icon: "🛒", color: "#f59e0b" },
    { id: "finance", label: "Finance", icon: "🏦", color: "#10b981" },
    { id: "recreation", label: "Recreation", icon: "🏃", color: "#ec4899" },
    { id: "worship", label: "Worship", icon: "🛐", color: "#8b5cf6" },
    { id: "safety", label: "Safety", icon: "👮", color: "#6366f1" },
    { id: "food", label: "Food", icon: "🍽️", color: "#f97316" }
  ];

  const facilityCategories = [
    { id: "all", label: "All", icon: "🏢", color: "#667eea" },
    { id: "room", label: "Room", icon: "🛏️", color: "#8b5cf6" },
    { id: "kitchen", label: "Kitchen", icon: "🍳", color: "#f59e0b" },
    { id: "safety", label: "Safety", icon: "🛡️", color: "#ef4444" },
    { id: "common", label: "Common", icon: "🏃", color: "#10b981" },
    { id: "basic", label: "Basic", icon: "💧", color: "#3b82f6" },
  ];

  const typeToCategory = {
    nearby_college: "education",
    nearby_school: "education",
    nearby_it_park: "education",
    nearby_office_hub: "education",
    nearby_metro: "transport",
    nearby_bus_stop: "transport",
    nearby_railway_station: "transport",
    distance_main_road: "transport",
    nearby_hospital: "healthcare",
    nearby_clinic: "healthcare",
    nearby_pharmacy: "healthcare",
    nearby_supermarket: "shopping",
    nearby_grocery_store: "shopping",
    nearby_mall: "shopping",
    nearby_bank: "finance",
    nearby_atm: "finance",
    nearby_post_office: "finance",
    nearby_gym: "recreation",
    nearby_park: "recreation",
    nearby_temple: "worship",
    nearby_mosque: "worship",
    nearby_church: "worship",
    nearby_police_station: "safety",
    nearby_restaurant: "food"
  };

  const showNotificationMessage = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // ✅ FETCH PG DETAILS
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

if (data.videos) {
  if (Array.isArray(data.videos)) {
    videos = data.videos.map(v => ({
      type: "video",
      src: getCorrectImageUrl(v),
    }));
  } else if (typeof data.videos === "string") {
    try {
      const parsed = JSON.parse(data.videos);
      if (Array.isArray(parsed)) {
        videos = parsed.map(v => ({
          type: "video",
          src: getCorrectImageUrl(v),
        }));
      }
    } catch (err) {
      console.error("❌ Invalid video JSON:", err);
    }
  }
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

  // ✅ FETCH NEARBY HIGHLIGHTS AND PGS
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const processDBHighlights = () => {
      const highlights = [];
      
      const highlightFields = [
        'nearby_college', 'nearby_school', 'nearby_it_park', 'nearby_office_hub',
        'nearby_metro', 'nearby_bus_stop', 'nearby_railway_station', 'distance_main_road',
        'nearby_hospital', 'nearby_clinic', 'nearby_pharmacy',
        'nearby_supermarket', 'nearby_grocery_store', 'nearby_restaurant', 'nearby_mall',
        'nearby_bank', 'nearby_atm', 'nearby_post_office',
        'nearby_gym', 'nearby_park', 'nearby_temple', 'nearby_mosque', 
        'nearby_church', 'nearby_police_station'
      ];
      
      highlightFields.forEach(field => {
        if (pg[field] && pg[field].trim() !== "") {
          highlights.push({
            name: pg[field],
            type: field,
            category: typeToCategory[field] || "other",
            icon: getHighlightIcon(typeToCategory[field], field),
            source: "database",
            coordinates: generateRandomCoordinates(pg.latitude, pg.longitude, 2)
          });
        }
      });
      
      return highlights;
    };

    const generateRandomCoordinates = (lat, lon, maxDistanceKm) => {
      const R = 6371;
      const maxDistance = maxDistanceKm / R;
      
      const bearing = Math.random() * 2 * Math.PI;
      const distance = Math.random() * maxDistance;
      
      const lat1 = lat * Math.PI / 180;
      const lon1 = lon * Math.PI / 180;
      
      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distance) +
        Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing)
      );
      
      const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1),
        Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2)
      );
      
      return [
        lat2 * 180 / Math.PI,
        lon2 * 180 / Math.PI
      ];
    };

    const dbHighlights = processDBHighlights();
    
    const fetchAutoHighlights = async () => {
      try {
        setLoadingHighlights(true);
        const query = `
          [out:json];
          (
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="hospital"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="school"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="college"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="bank"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="atm"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="police"];
            node(around:1200,${pg.latitude},${pg.longitude})["railway"="station"];
            node(around:1200,${pg.latitude},${pg.longitude})["highway"="bus_stop"];
            node(around:1200,${pg.latitude},${pg.longitude})["shop"="supermarket"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="restaurant"];
            node(around:1200,${pg.latitude},${pg.longitude})["leisure"="park"];
            node(around:1200,${pg.latitude},${pg.longitude})["amenity"="place_of_worship"];
          );
          out tags 15;
        `;

        const res = await axios.post(
          "https://overpass-api.de/api/interpreter",
          query,
          { headers: { "Content-Type": "text/plain" } }
        );

        const autoPlaces = res.data.elements
          .map(el => {
            const type = el.tags?.amenity || el.tags?.shop || el.tags?.railway || 
                        el.tags?.highway || el.tags?.leisure || "other";
            const category = Object.keys(typeToCategory).find(key => 
              type.includes(key.replace("nearby_", ""))
            ) || "other";
            
            return {
              name: el.tags?.name || `Unknown ${type}`,
              type: type,
              category: typeToCategory[category] || "other",
              icon: getHighlightIcon(typeToCategory[category], type),
              source: "osm",
              coordinates: el.lat && el.lon ? [el.lat, el.lon] : null
            };
          })
          .filter(p => p.name && p.name !== "Unknown other");

        const allHighlights = [...dbHighlights, ...autoPlaces];
        const uniqueHighlights = Array.from(
          new Map(allHighlights.map(item => [item.name, item])).values()
        );
        
        setNearbyHighlights(uniqueHighlights);
      } catch (err) {
        console.error("Auto location highlights error", err);
        setNearbyHighlights(dbHighlights);
      } finally {
        setLoadingHighlights(false);
      }
    };

    const fetchNearbyPGs = async () => {
      try {
        setLoadingNearbyPGs(true);
        console.log("Fetching nearby PGs for:", pg.latitude, pg.longitude);
        
        if (!id || id === "undefined") {
          console.error("Invalid PG ID:", id);
          setNearbyPGs([]);
          return;
        }

        const response = await api.get(
          `/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`
        );
        
        console.log("Nearby PGs API response:", response.data);
        
        if (response.data?.success) {
          const pgsWithDistance = response.data.data.map(otherPG => {
            let distance = 0;
            if (otherPG.latitude && otherPG.longitude) {
              distance = calculateDistanceBetweenCoords(
                pg.latitude, 
                pg.longitude, 
                otherPG.latitude, 
                otherPG.longitude
              );
            }
            return {
              ...otherPG,
              distance
            };
          });
          
          const sortedPGs = pgsWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);
          
          console.log("Sorted nearby PGs:", sortedPGs);
          setNearbyPGs(sortedPGs);
        } else {
          console.error("API returned unsuccessful:", response.data);
          setNearbyPGs([]);
        }
      } catch (err) {
        console.error("Error fetching nearby PGs:", err);
        console.error("Error details:", err.response?.data);
        setNearbyPGs([]);
      } finally {
        setLoadingNearbyPGs(false);
      }
    };

    if (dbHighlights.length > 0) {
      setNearbyHighlights(dbHighlights);
      fetchAutoHighlights();
    } else {
      fetchAutoHighlights();
    }
    
    fetchNearbyPGs();
  }, [pg, id]);

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
      if (pg.triple_room && parseInt(pg.triple_room) > 0) return pg.triple_room;
      return "—";
    }
  };

  // ✅ BOOK NOW CLICK - Using user from auth context
  const handleBookNow = () => {
    if (!user) {
      showNotificationMessage("Please register or login to book this property");
      navigate("/register", {
        state: { redirectTo: `/pg/${id}` }
      });
      return;
    }
    setShowBookingModal(true);
  };

  // ✅ BOOKING SUBMIT - Using user from auth context (same as search page)
  const handleBookingSubmit = async (bookingData) => {
    try {
      if (bookingLoading) return;
      setBookingLoading(true);

      if (!user) {
        showNotificationMessage("Please login to continue");
        navigate("/login");
        return;
      }

      const token = await user.getIdToken(true);

      const payload = {
        check_in_date: bookingData.checkInDate,
        room_type: bookingData.roomType
      };

      const res = await api.post(
        `/bookings/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data?.alreadyBooked) {
        showNotificationMessage(res.data.message);
        setShowBookingModal(false);
        return;
      }

      showNotificationMessage(res.data?.message || "✅ Booking request sent to owner");
      setShowBookingModal(false);

    } catch (error) {
      console.log("BOOKING ERROR:", error?.response?.data);

      if (error?.response?.data?.message) {
        showNotificationMessage(error.response.data.message);
      } else {
        showNotificationMessage("❌ Booking failed. Try again");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // 📞 CALL OWNER
  const handleCallOwner = () => {
    if (hasOwnerContact && pg?.contact_phone) {
      window.location.href = `tel:${pg.contact_phone}`;
    } else {
      showNotificationMessage("Owner contact will be visible after booking approval");
    }
  };

  const handleViewOnMap = (highlight) => {
    if (highlight.coordinates) {
      setMapCenter(highlight.coordinates);
      setMapZoom(17);
      setSelectedHighlightCategory(highlight.category);
      
      setTimeout(() => {
        document.getElementById("location-map")?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  const handleViewNearbyPG = (pgId) => {
    console.log("Navigating to PG:", pgId);
    if (pgId && pgId !== 'all') {
      navigate(`/pg/${pgId}`);
    } else if (pgId === 'all' && pg?.area) {
      navigate(`/properties?area=${encodeURIComponent(pg.area)}`);
    } else if (pgId === 'all' && pg?.city) {
      navigate(`/properties?city=${encodeURIComponent(pg.city)}`);
    } else {
      navigate("/properties");
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
             pg.four_sharing || pg.single_room || pg.double_room || pg.triple_room;
    }
  };

  // ✅ PROTECTION - MOVED AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div style={modernStyles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={modernStyles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div style={modernStyles.errorContainer}>
        <h2>Property Not Found</h2>
        <p>{error || "The property you're looking for doesn't exist or has been removed."}</p>
        <button style={modernStyles.backButton} onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>
    );
  }

  const current = media[index];
  
  const availableFacilitiesCount = getTrueFacilitiesCountInCategory("all");
  const filteredFacilities = getFilteredFacilities();

  const shouldShowNearbyHighlights = hasLocation && (nearbyHighlights.length > 0 || loadingHighlights);
  const shouldShowNearbyPGs = nearbyPGs.length > 0 || loadingNearbyPGs;

  return (
    <div style={modernStyles.page}>
      {/* Notification Toast */}
      {notification && (
        <div style={modernStyles.notification}>
          {notification.includes("✅") ? <Check size={18} /> : 
           notification.includes("❌") ? <X size={18} /> : 
           <Info size={18} />}
          {notification}
        </div>
      )}

      <div style={modernStyles.breadcrumb}>
        <span style={modernStyles.breadcrumbLink} onClick={() => navigate("/")}>Home</span>
        <span style={modernStyles.breadcrumbSeparator}>/</span>
        <span style={modernStyles.breadcrumbLink} onClick={() => navigate("/properties")}>Properties</span>
        <span style={modernStyles.breadcrumbSeparator}>/</span>
        <span style={modernStyles.breadcrumbCurrent}>{pg.pg_name}</span>
        <span style={modernStyles.propertyCode}>{getPGCode(pg.id)}</span>
      </div>

      {media.length > 0 ? (
        <div style={modernStyles.slider}>
          {current.type === "photo" ? (
            <img 
              src={current.src} 
              alt={pg.pg_name} 
              style={modernStyles.media}
              onError={(e) => {
                console.error("Image failed to load:", current.src);
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Found";
              }}
            />
          ) : (
            <video src={current.src} controls style={modernStyles.media} />
          )}

          {media.length > 1 && (
            <>
              <button
                style={modernStyles.navBtnLeft}
                onClick={() => setIndex(i => (i === 0 ? media.length - 1 : i - 1))}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                style={modernStyles.navBtnRight}
                onClick={() => setIndex(i => (i + 1) % media.length)}
              >
                <ChevronRight size={24} />
              </button>
              <div style={modernStyles.mediaCounter}>
                {index + 1} / {media.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={modernStyles.noMedia}>
          <div style={modernStyles.noMediaIcon}>📷</div>
          <p>No photos available</p>
        </div>
      )}

      <div style={modernStyles.mainCard}>
        <div style={modernStyles.headerRow}>
          <div>
            <h1 style={modernStyles.title}>{pg.pg_name}</h1>
            <p style={modernStyles.address}>
              <MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}, ${pg.state}`}
            </p>
            {pg.landmark && (
              <p style={modernStyles.landmark}>
                <Navigation size={14} /> Near {pg.landmark}
              </p>
            )}
          </div>
          <div style={modernStyles.actionButtons}>
            <button
              style={modernStyles.bookButton}
              onClick={handleBookNow}
            >
              <BookOpen size={18} />
              Book Now
            </button>
            {hasOwnerContact && (
              <button
                style={modernStyles.callButton}
                onClick={handleCallOwner}
              >
                <Phone size={18} />
                Call Owner
              </button>
            )}
            {hasLocation && (
              <button
                style={modernStyles.directionButton}
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

        <div style={modernStyles.badgeRow}>
          <span style={modernStyles.typeBadge}>
            {isToLet ? "🏠 House/Flat" : 
             isCoLiving ? "🤝 Co-Living" : 
             "🏢 PG/Hostel"}
          </span>
          
          {!isToLet && !isCoLiving && pg.pg_type && (
            <span style={modernStyles.genderBadge}>
              {pg.pg_type === "boys" ? "👨 Boys Only" : 
               pg.pg_type === "girls" ? "👩 Girls Only" : 
               pg.pg_type === "coliving" ? "🤝 Co-Living" : "Mixed"}
            </span>
          )}
          
          {isToLet && pg.bhk_type && (
            <span style={modernStyles.bhkBadge}>
              {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
            </span>
          )}
          
          {isToLet && pg.furnishing_type && (
            <span style={modernStyles.furnishingBadge}>
              {pg.furnishing_type === "fully_furnished" ? "🛋️ Fully Furnished" :
               pg.furnishing_type === "semi_furnished" ? "🛋️ Semi-Furnished" :
               "🛋️ Unfurnished"}
            </span>
          )}
          
          <span style={{
            ...modernStyles.availabilityBadge,
            backgroundColor: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
          }}>
            {pg.available_rooms > 0 ? `🟢 ${pg.available_rooms} Available` : "🔴 Fully Occupied"}
          </span>
        </div>

        <div style={modernStyles.statsGrid}>
          <div style={modernStyles.statItem}>
            <div style={modernStyles.statIcon}>💰</div>
            <div>
              <div style={modernStyles.statLabel}>Starting from</div>
              <div style={modernStyles.statValue}>
                ₹{formatPrice(getStartingPrice())} / month
              </div>
            </div>
          </div>
          <div style={modernStyles.statItem}>
            <div style={modernStyles.statIcon}>🏠</div>
            <div>
              <div style={modernStyles.statLabel}>Total {isToLet ? "Properties" : "Rooms"}</div>
              <div style={modernStyles.statValue}>{pg.total_rooms || "—"}</div>
            </div>
          </div>
          <div style={modernStyles.statItem}>
            <div style={modernStyles.statIcon}>✅</div>
            <div>
              <div style={modernStyles.statLabel}>Facilities</div>
              <div style={modernStyles.statValue}>{availableFacilitiesCount}+</div>
            </div>
          </div>
          <div style={modernStyles.statItem}>
            <div style={modernStyles.statIcon}>📍</div>
            <div>
              <div style={modernStyles.statLabel}>Nearby Places</div>
              <div style={modernStyles.statValue}>{nearbyHighlights.length}+</div>
            </div>
          </div>
        </div>
      </div>

      <div style={modernStyles.twoColumn}>
        <div style={modernStyles.leftColumn}>
          {pg.description && (
            <Section title="📝 About this Property">
              <p style={modernStyles.description}>{pg.description}</p>
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
              <div style={modernStyles.facilityCategories}>
                {facilityCategories.map(category => {
                  const trueCount = getTrueFacilitiesCountInCategory(category.id);
                  
                  if (trueCount === 0 && category.id !== "all") return null;
                  
                  return (
                    <button
                      key={category.id}
                      style={{
                        ...modernStyles.facilityCategoryBtn,
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
                      <span style={modernStyles.facilityCategoryIcon}>{category.icon}</span>
                      <span style={modernStyles.facilityCategoryLabel}>
                        {category.label} {trueCount > 0 && `(${trueCount})`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredFacilities.length > 0 ? (
                <div style={modernStyles.facilitiesGrid}>
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
                <div style={modernStyles.noFacilitiesContainer}>
                  <div style={modernStyles.noFacilitiesIcon}>🏢</div>
                  <p style={modernStyles.noContentText}>
                    No {selectedFacilityCategory === "all" ? "" : selectedFacilityCategory} facilities available
                  </p>
                </div>
              )}

              {pg.water_type && (
                <div style={modernStyles.waterSource}>
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
              <div style={modernStyles.rulesContainer}>
                {(pg.visitor_allowed || pg.couple_allowed || pg.family_allowed) && (
                  <div style={modernStyles.rulesSection}>
                    <div style={modernStyles.rulesSectionHeader} onClick={() => toggleRulesSection('visitors')}>
                      <h4 style={modernStyles.rulesSectionTitle}>
                        <span style={modernStyles.rulesSectionIcon}>👥</span>
                        Visitor Rules
                      </h4>
                      <span style={modernStyles.rulesToggle}>
                        {expandedRules.visitors ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.visitors && (
                      <div style={modernStyles.rulesGrid}>
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
                  <div style={modernStyles.rulesSection}>
                    <div style={modernStyles.rulesSectionHeader} onClick={() => toggleRulesSection('lifestyle')}>
                      <h4 style={modernStyles.rulesSectionTitle}>
                        <span style={modernStyles.rulesSectionIcon}>🚬</span>
                        Lifestyle Rules
                      </h4>
                      <span style={modernStyles.rulesToggle}>
                        {expandedRules.lifestyle ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.lifestyle && (
                      <div style={modernStyles.rulesGrid}>
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
                  <div style={modernStyles.rulesSection}>
                    <div style={modernStyles.rulesSectionHeader} onClick={() => toggleRulesSection('pets')}>
                      <h4 style={modernStyles.rulesSectionTitle}>
                        <span style={modernStyles.rulesSectionIcon}>🐾</span>
                        Pets & Entry Rules
                      </h4>
                      <span style={modernStyles.rulesToggle}>
                        {expandedRules.pets ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.pets && (
                      <div style={modernStyles.rulesGrid}>
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
                  <div style={modernStyles.rulesSection}>
                    <div style={modernStyles.rulesSectionHeader} onClick={() => toggleRulesSection('restrictions')}>
                      <h4 style={modernStyles.rulesSectionTitle}>
                        <span style={modernStyles.rulesSectionIcon}>🎯</span>
                        Restrictions
                      </h4>
                      <span style={modernStyles.rulesToggle}>
                        {expandedRules.restrictions ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.restrictions && (
                      <div style={modernStyles.rulesGrid}>
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
                  <div style={modernStyles.rulesSection}>
                    <div style={modernStyles.rulesSectionHeader} onClick={() => toggleRulesSection('legal')}>
                      <h4 style={modernStyles.rulesSectionTitle}>
                        <span style={modernStyles.rulesSectionIcon}>⚖️</span>
                        Legal & Duration
                      </h4>
                      <span style={modernStyles.rulesToggle}>
                        {expandedRules.legal ? '−' : '+'}
                      </span>
                    </div>
                    {expandedRules.legal && (
                      <div style={modernStyles.rulesGrid}>
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

        <div style={modernStyles.rightColumn}>
          {hasLocation && (
            <Section title="📍 Location">
              <div id="location-map" style={modernStyles.mapContainer}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "250px", width: "100%", borderRadius: "12px" }}
                  key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pg.latitude, pg.longitude]}>
                    <Popup>
                      <div style={modernStyles.mapPopup}>
                        <strong style={modernStyles.mapPopupTitle}>{pg.pg_name}</strong><br/>
                        <small style={modernStyles.mapPopupAddress}>{pg.address || pg.area}</small><br/>
                        <button 
                          style={modernStyles.mapPopupButton}
                          onClick={handleBookNow}
                        >
                          Book Now
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
                
                <div style={modernStyles.locationDetails}>
                  <InfoRow label="Area" value={pg.area} />
                  <InfoRow label="Road" value={pg.road} />
                  <InfoRow label="Landmark" value={pg.landmark} />
                  <InfoRow label="City" value={pg.city} />
                </div>
              </div>
            </Section>
          )}

          {shouldShowNearbyHighlights && (
            <NearbyHighlightsPanel 
              highlights={nearbyHighlights}
              selectedCategory={selectedHighlightCategory}
              onCategoryChange={setSelectedHighlightCategory}
              onViewOnMap={handleViewOnMap}
              isLoading={loadingHighlights}
              highlightCategories={highlightCategories}
            />
          )}

          {shouldShowNearbyPGs && (
            <NearbyPGsPanel
              nearbyPGs={nearbyPGs}
              isLoading={loadingNearbyPGs}
              onViewPG={handleViewNearbyPG}
            />
          )}

          {(hasOwnerContact || hasContactPerson || pg?.contact_email) && (
            <div style={modernStyles.contactCard}>
              <h3 style={modernStyles.contactTitle}>📞 Contact Information</h3>
              {hasContactPerson && (
                <div style={modernStyles.contactItem}>
                  <span style={modernStyles.contactIcon}>👤</span>
                  <div>
                    <div style={modernStyles.contactLabel}>Contact Person</div>
                    <div style={modernStyles.contactValue}>{pg.contact_person}</div>
                  </div>
                </div>
              )}
              
              {hasOwnerContact && (
                <div style={modernStyles.contactItem}>
                  <span style={modernStyles.contactIcon}>📱</span>
                  <div>
                    <div style={modernStyles.contactLabel}>Phone Number</div>
                    <div style={modernStyles.contactValue}>
                      <a href={`tel:${pg.contact_phone}`} style={modernStyles.phoneLink}>
                        {pg.contact_phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {pg.contact_email && (
                <div style={modernStyles.contactItem}>
                  <span style={modernStyles.contactIcon}>✉️</span>
                  <div>
                    <div style={modernStyles.contactLabel}>Email</div>
                    <div style={modernStyles.contactValue}>
                      <a href={`mailto:${pg.contact_email}`} style={modernStyles.emailLink}>
                        {pg.contact_email}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={modernStyles.contactButtons}>
                <button
                  style={modernStyles.bookButtonSmall}
                  onClick={handleBookNow}
                  disabled={bookingLoading}
                >
                  <BookOpen size={16} />
                  Book Now
                </button>
                {hasOwnerContact && (
                  <button
                    style={modernStyles.callButtonSmall}
                    onClick={handleCallOwner}
                    disabled={bookingLoading}
                  >
                    <Phone size={16} />
                    Call Now
                  </button>
                )}
              </div>
            </div>
          )}

          {(pg.total_rooms || pg.available_rooms) && (
            <div style={modernStyles.availabilityCard}>
              <h3 style={modernStyles.availabilityTitle}>🛏 Availability Status</h3>
              {pg.total_rooms && (
                <div style={modernStyles.availabilityItem}>
                  <div style={modernStyles.availabilityLabel}>Total {isToLet ? "Properties" : "Rooms"}</div>
                  <div style={modernStyles.availabilityValue}>{pg.total_rooms}</div>
                </div>
              )}
              {(pg.available_rooms || pg.available_rooms === 0) && (
                <div style={modernStyles.availabilityItem}>
                  <div style={modernStyles.availabilityLabel}>Available Now</div>
                  <div style={{
                    ...modernStyles.availabilityValue,
                    color: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
                  }}>
                    {pg.available_rooms > 0 ? `${pg.available_rooms} Available` : "Fully Occupied"}
                  </div>
                </div>
              )}
              <div style={modernStyles.availabilityNote}>
                {pg.available_rooms > 0 
                  ? "Book now to secure your spot!" 
                  : "Check back later for availability"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={modernStyles.stickyBar}>
        <div style={modernStyles.stickyContent}>
          <div>
            <div style={modernStyles.stickyPrice}>₹{formatPrice(getStartingPrice())} / month</div>
            <div style={modernStyles.stickyInfo}>
              {pg.pg_name} • {pg.area || pg.city}
            </div>
          </div>
          <div style={modernStyles.stickyActions}>
            <button
              style={modernStyles.stickyBookButton}
              onClick={handleBookNow}
              disabled={bookingLoading}
            >
              <BookOpen size={18} />
              Book Now
            </button>
            {hasOwnerContact && (
              <button
                style={modernStyles.stickyCallButton}
                onClick={handleCallOwner}
                disabled={bookingLoading}
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
          bookingLoading={bookingLoading}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
}

/* ================= MODERN STARTUP STYLES ================= */
const modernStyles = {
  // Base layout
  page: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px 20px 100px 20px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: "relative",
  },

  // Loading & Error
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    gap: "16px",
    fontSize: "16px",
    color: "#64748b",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: "32px",
    margin: "20px",
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.1)",
  },
  backButton: {
    marginTop: "24px",
    padding: "12px 28px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "white",
    border: "none",
    borderRadius: "40px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
  },

  // Breadcrumb
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "24px",
    fontSize: "14px",
    color: "#64748b",
    flexWrap: "wrap",
    padding: "8px 0",
  },
  breadcrumbLink: {
    color: "#6366f1",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.2s",
  },
  breadcrumbSeparator: {
    color: "#cbd5e1",
  },
  breadcrumbCurrent: {
    color: "#1e293b",
    fontWeight: "600",
  },
  propertyCode: {
    marginLeft: "auto",
    background: "#f1f5f9",
    padding: "6px 12px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    letterSpacing: "0.5px",
  },

  // Slider
  slider: {
    position: "relative",
    borderRadius: "28px",
    overflow: "hidden",
    marginBottom: "28px",
    boxShadow: "0 25px 40px -12px rgba(0,0,0,0.25)",
    transition: "all 0.3s ease",
  },
  media: {
    width: "100%",
    height: "480px",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.3s ease",
  },
  navBtnLeft: {
    position: "absolute",
    top: "50%",
    left: "20px",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.95)",
    border: "none",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
  },
  navBtnRight: {
    position: "absolute",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.95)",
    border: "none",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
  },
  mediaCounter: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "6px 14px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "600",
    backdropFilter: "blur(8px)",
  },
  noMedia: {
    height: "280px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderRadius: "28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "28px",
    color: "white",
    boxShadow: "0 20px 35px -12px rgba(99,102,241,0.3)",
  },
  noMediaIcon: {
    fontSize: "56px",
    marginBottom: "16px",
    opacity: 0.9,
  },

  // Main Card
  mainCard: {
    backgroundColor: "white",
    borderRadius: "32px",
    padding: "32px",
    marginBottom: "28px",
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.08)",
    border: "1px solid rgba(226,232,240,0.6)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
    lineHeight: "1.2",
    background: "linear-gradient(135deg, #0f172a, #334155)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  },
  address: {
    fontSize: "15px",
    color: "#475569",
    margin: "0 0 4px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  landmark: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  bookButton: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 18px rgba(16,185,129,0.3)",
  },
  callButton: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 18px rgba(59,130,246,0.3)",
  },
  directionButton: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 18px rgba(139,92,246,0.3)",
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "28px",
  },
  typeBadge: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "white",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
  },
  genderBadge: {
    background: "linear-gradient(135deg, #ec4899, #db2777)",
    color: "white",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  bhkBadge: {
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "white",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  furnishingBadge: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "white",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  availabilityBadge: {
    color: "white",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    padding: "20px",
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "all 0.2s ease",
  },
  statIcon: {
    fontSize: "28px",
    width: "56px",
    height: "56px",
    backgroundColor: "white",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "4px",
    fontWeight: "500",
    letterSpacing: "0.3px",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
  },

  // Two column layout
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "28px",
    marginBottom: "100px",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },

  // Sections
  section: {
    backgroundColor: "white",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
    border: "1px solid #eef2ff",
    transition: "all 0.2s ease",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    letterSpacing: "-0.01em",
  },
  sectionBadge: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "white",
    padding: "4px 12px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "600",
  },

  description: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#334155",
    margin: "0",
  },

  // Price Details
  priceDetailsContainer: {
    padding: "0",
    backgroundColor: "transparent",
    borderRadius: "0",
  },
  priceSection: {
    marginBottom: "28px",
  },
  priceSectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 20px 0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
  },
  priceItem: {
    backgroundColor: "#f8fafc",
    padding: "20px 16px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  priceType: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    marginBottom: "8px",
  },
  priceValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#10b981",
    marginBottom: "8px",
  },
  depositAmount: {
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "500",
    backgroundColor: "#fef2f2",
    padding: "4px 10px",
    borderRadius: "30px",
    display: "inline-block",
  },
  additionalCharges: {
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "20px",
  },
  foodCharges: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    backgroundColor: "#f0fdf4",
    borderRadius: "20px",
    marginTop: "20px",
  },

  // Facilities
  facilityCategories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px",
  },
  facilityCategoryBtn: {
    padding: "8px 18px",
    borderRadius: "40px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    border: "1px solid #e2e8f0",
  },
  facilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  facilityItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 18px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  facilityIcon: {
    fontSize: "22px",
    width: "40px",
    height: "40px",
    backgroundColor: "white",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  },
  facilityLabel: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#1e293b",
    flex: 1,
  },
  checkmark: {
    color: "#10b981",
    fontWeight: "bold",
    fontSize: "16px",
  },
  waterSource: {
    marginTop: "20px",
    padding: "14px 18px",
    background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  // Rules
  rulesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rulesSection: {
    backgroundColor: "#f8fafc",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  rulesSectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px",
    cursor: "pointer",
    backgroundColor: "white",
    transition: "all 0.2s ease",
  },
  rulesSectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  rulesToggle: {
    fontSize: "22px",
    color: "#64748b",
    fontWeight: "500",
  },
  rulesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    padding: "20px",
    paddingTop: "0",
  },
  ruleItem: {
    display: "flex",
    gap: "16px",
    padding: "18px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
  },
  ruleIcon: {
    fontSize: "22px",
    width: "48px",
    height: "48px",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  ruleLabel: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "4px",
  },

  // Map
  mapContainer: {
    marginBottom: "0",
  },
  locationDetails: {
    marginTop: "20px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
  },
  infoRow: {
    padding: "10px 0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#475569",
  },

  // Nearby Highlights Panel
  highlightsPanel: {
    backgroundColor: "white",
    borderRadius: "28px",
    overflow: "hidden",
    border: "1px solid #eef2ff",
    boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
  },
  categoriesPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "18px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  highlightCategoryBtn: {
    padding: "8px 16px",
    borderRadius: "40px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    border: "1px solid #e2e8f0",
  },
  highlightsList: {
    padding: "0",
  },
  highlightsListHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  highlightsItemsContainer: {
    maxHeight: "420px",
    overflowY: "auto",
  },
  highlightItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  highlightIconContainer: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 14px rgba(0,0,0,0.1)",
  },
  highlightIcon: {
    fontSize: "22px",
    color: "white",
  },
  highlightName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
  },
  viewOnMapButton: {
    padding: "8px 16px",
    borderRadius: "30px",
    color: "white",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  // Nearby PGs
  nearbyPGsPanel: {
    backgroundColor: "white",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
    border: "1px solid #eef2ff",
  },
  nearbyPGsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  nearbyPGsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  nearbyPGsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  nearbyPgCard: {
    backgroundColor: "white",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  nearbyPgImageContainer: {
    position: "relative",
    height: "160px",
    overflow: "hidden",
  },
  nearbyPgContent: {
    padding: "18px",
  },
  nearbyPgTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  nearbyPgViewButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#f1f5f9",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  // Contact Card
  contactCard: {
    backgroundColor: "white",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
    border: "1px solid #eef2ff",
  },
  contactTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 20px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  contactButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  },
  bookButtonSmall: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    borderRadius: "40px",
    color: "white",
    border: "none",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  },
  callButtonSmall: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    borderRadius: "40px",
    color: "white",
    border: "none",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  },

  // Availability Card
  availabilityCard: {
    backgroundColor: "white",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
    border: "1px solid #eef2ff",
  },
  availabilityTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 20px 0",
  },
  availabilityItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  availabilityNote: {
    marginTop: "16px",
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
    padding: "10px",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
  },

  // Sticky Bar
  stickyBar: {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(12px)",
    padding: "16px 24px",
    boxShadow: "0 -8px 30px rgba(0,0,0,0.08)",
    zIndex: "1000",
    borderTop: "1px solid rgba(226,232,240,0.6)",
  },
  stickyContent: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  stickyPrice: {
    fontSize: "22px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #0f172a, #334155)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  stickyActions: {
    display: "flex",
    gap: "12px",
  },
  stickyBookButton: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    borderRadius: "40px",
    color: "white",
    border: "none",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(16,185,129,0.3)",
  },
  stickyCallButton: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    borderRadius: "40px",
    color: "white",
    border: "none",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(59,130,246,0.3)",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    padding: "20px",
    animation: "fadeIn 0.3s ease",
  },
  modalContainer: {
    background: "white",
    borderRadius: "32px",
    width: "100%",
    maxWidth: "520px",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  },
  modalCloseBtn: {
    position: "absolute",
    top: "18px",
    right: "18px",
    background: "#f1f5f9",
    border: "none",
    width: "40px",
    height: "40px",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 100,
    transition: "all 0.2s ease",
  },
  modalContent: {
    padding: "32px",
  },
  modalHeader: {
    marginBottom: "24px",
  },
  modalTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#64748b",
  },
  modalWarning: {
    background: "#fff7ed",
    padding: "14px 18px",
    borderRadius: "20px",
    marginBottom: "24px",
    fontSize: "13px",
    color: "#9a3412",
    border: "1px solid #fed7aa",
  },
  formGroup: {
    marginBottom: "24px",
  },
  formLabel: {
    display: "block",
    marginBottom: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  formInput: {
    width: "100%",
    padding: "14px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "20px",
    fontSize: "14px",
    background: "#f9fafb",
    transition: "all 0.2s ease",
  },
  formSelect: {
    width: "100%",
    padding: "14px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "20px",
    fontSize: "14px",
    background: "#f9fafb",
  },
  selectedPrice: {
    marginTop: "10px",
    fontWeight: "600",
    color: "#10b981",
    fontSize: "14px",
  },
  infoBox: {
    background: "#f0fdf4",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "28px",
    border: "1px solid #bbf7d0",
  },
  infoBoxHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    fontWeight: "600",
    color: "#065f46",
  },
  infoList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#065f46",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  modalActions: {
    display: "flex",
    gap: "14px",
  },
  cancelBtn: {
    flex: 1,
    padding: "14px",
    background: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  confirmBtn: {
    flex: 2,
    padding: "14px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinnerSmall: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  notification: {
    position: "fixed",
    top: "24px",
    right: "24px",
    background: "#10b981",
    color: "white",
    padding: "14px 24px",
    borderRadius: "60px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
    zIndex: 4000,
    animation: "slideIn 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "500",
    fontSize: "14px",
  },
  noFacilitiesContainer: {
    textAlign: "center",
    padding: "40px 20px",
    background: "#f8fafc",
    borderRadius: "20px",
    border: "1px dashed #cbd5e1",
  },
  noContentText: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "8px",
  },
  loadingHighlightsPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  noHighlightsPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  loadingNearbyPGs: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  noNearbyPGs: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
  },
  // Additional missing styles
  priceCategory: { marginBottom: "20px" },
  priceCategoryTitle: { fontSize: "16px", fontWeight: "600", marginBottom: "12px", paddingLeft: "8px", borderLeft: "4px solid #6366f1" },
  bhkInfo: { marginTop: "12px", fontSize: "14px", color: "#475569", backgroundColor: "#f1f5f9", padding: "8px 14px", borderRadius: "40px", display: "inline-block" },
  includesInfo: { marginTop: "12px", fontSize: "14px", color: "#059669", backgroundColor: "#d1fae5", padding: "8px 14px", borderRadius: "40px", fontWeight: "500" },
  chargesGrid: { display: "grid", gap: "8px" },
  chargeItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" },
  chargeLabel: { fontSize: "14px", color: "#64748b" },
  chargeValue: { fontSize: "14px", fontWeight: "600", color: "#0f172a" },
  noPriceContainer: { textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "20px" },
  noPriceIcon: { fontSize: "48px", opacity: 0.5 },
  noPriceText: { fontSize: "14px", color: "#64748b", marginTop: "12px" },
  mapPopup: { padding: "12px", maxWidth: "220px" },
  mapPopupTitle: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  mapPopupAddress: { fontSize: "12px", color: "#64748b" },
  mapPopupButton: { padding: "6px 14px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "30px", fontSize: "12px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  phoneLink: { color: "#3b82f6", textDecoration: "none" },
  emailLink: { color: "#3b82f6", textDecoration: "none" },
  nearbyPGsFooter: { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" },
  viewAllPropertiesButton: { width: "100%", padding: "12px", backgroundColor: "transparent", color: "#3b82f6", border: "1px solid #3b82f6", borderRadius: "40px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  highlightCategoryBtnEmpty: { opacity: 0.5, cursor: "not-allowed" },
  highlightCategoryCount: { backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "30px", fontSize: "10px", fontWeight: "600", marginLeft: "4px" },
  categoryIndicator: { width: "10px", height: "10px", borderRadius: "50%", display: "inline-block", marginRight: "8px" },
  ruleIconContainer: { display: "flex", alignItems: "center" },
  ruleContent: { flex: 1 },
  ruleStatus: { marginTop: "8px" },
  ruleStatusBadge: { padding: "4px 12px", borderRadius: "30px", fontSize: "11px", fontWeight: "600", color: "white" },
  ruleDescription: { fontSize: "12px", color: "#64748b", marginBottom: "8px" },
  nearbyPgBadges: { position: "absolute", top: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between" },
  nearbyPgTypeBadge: { background: "rgba(59,130,246,0.9)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: "30px", fontSize: "11px", fontWeight: "600", color: "white" },
  nearbyPgDistanceBadge: { background: "rgba(16,185,129,0.9)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: "30px", fontSize: "11px", fontWeight: "600", color: "white" },
  nearbyPgImagePlaceholder: { width: "100%", height: "100%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" },
  nearbyPgImage: { width: "100%", height: "100%", objectFit: "cover" },
  nearbyPgNoImage: { fontSize: "40px", color: "#94a3b8" },
  nearbyPgStats: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  nearbyPgStat: { display: "flex", alignItems: "center", gap: "6px" },
  nearbyPgStatIcon: { fontSize: "14px" },
  nearbyPgStatText: { fontSize: "13px", fontWeight: "500", color: "#334155" },
  nearbyPgFacilities: { display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" },
  nearbyPgFacility: { fontSize: "18px", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "12px" },
  noHighlightsIcon: { fontSize: "48px", marginBottom: "16px", opacity: 0.5 },
  noHighlightsTitle: { fontSize: "16px", fontWeight: "600", color: "#334155", marginBottom: "8px" },
  noHighlightsText: { fontSize: "14px", color: "#64748b", maxWidth: "300px", textAlign: "center" },
  noNearbyPGsIcon: { fontSize: "48px", marginBottom: "16px", opacity: 0.5 },
  noNearbyPGsTitle: { fontSize: "16px", fontWeight: "600", color: "#334155", marginBottom: "8px" },
  noNearbyPGsText: { fontSize: "14px", color: "#64748b", maxWidth: "300px", textAlign: "center" },
  facilityItemActive: { boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  facilityItemInactive: { opacity: 0.7 },
  priceSectionIcon: { fontSize: "20px" },
  foodChargesIcon: { fontSize: "24px" },
  foodChargesLabel: { fontSize: "13px", color: "#047857" },
  foodChargesValue: { fontSize: "16px", fontWeight: "600", color: "#047857" },
  additionalChargesTitle: { fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#475569" },
  facilityCategoryIcon: { fontSize: "16px" },
  facilityCategoryLabel: { fontSize: "13px", fontWeight: "500" },
  rulesSectionIcon: { fontSize: "18px" },
  contactIcon: { fontSize: "20px" },
  contactLabel: { fontSize: "12px", color: "#64748b" },
  contactValue: { fontSize: "15px", fontWeight: "500", color: "#1e293b" },
  availabilityLabel: { fontSize: "14px", color: "#64748b" },
  availabilityValue: { fontSize: "16px", fontWeight: "600", color: "#0f172a" },
  stickyInfo: { fontSize: "13px", color: "#64748b" },
  formHint: { fontSize: "12px", color: "#64748b", marginTop: "6px" },
  highlightCategoryIcon: { fontSize: "14px" },
  highlightCategoryLabel: { fontSize: "13px", fontWeight: "500" },
  highlightsCount: { fontSize: "12px", color: "#64748b", background: "#f1f5f9", padding: "4px 10px", borderRadius: "30px" },
  highlightContent: { flex: 1 },
  highlightType: { fontSize: "12px", color: "#64748b" },
  highlightDistance: { fontSize: "11px", color: "#10b981", marginTop: "4px" },
  highlightsListTitle: { fontSize: "16px", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" },
  nearbyPGsIcon: { fontSize: "20px" },
  nearbyPGsCount: { fontSize: "12px", color: "#64748b", background: "#f1f5f9", padding: "4px 12px", borderRadius: "30px" },
  nearbyPgAddress: { fontSize: "12px", color: "#64748b", marginBottom: "12px", lineHeight: "1.4" },
};