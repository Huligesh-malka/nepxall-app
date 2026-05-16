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
  Wrench,
  Elevator,
  Dog,
  Music,
  PartyPopper,
  Lock,
  FileText,
  IdCard,
  Building2,
  ParkingCircle,
  Trees,
  Train,
  Bus,
  GraduationCap,
  Briefcase,
  Stethoscope,
  ShoppingBag,
  Landmark,
  Award,
  Sparkles as SparklesIcon,
  Crown
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
  if (price === null || price === undefined || price === "" || price === "0" || price === 0) {
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

// Helper Components
const Section = ({ title, icon, children, badgeCount }) => 
  children ? (
    <div style={modernStyles.section}>
      <div style={modernStyles.sectionHeader}>
        <h3 style={modernStyles.sectionTitle}>
          {icon && <span style={modernStyles.sectionIcon}>{icon}</span>}
          {title}
        </h3>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span style={modernStyles.sectionBadge}>{badgeCount}</span>
        )}
      </div>
      {children}
    </div>
  ) : null;

const FacilityItem = ({ icon, label, active = true }) => (
  <div 
    style={{
      ...modernStyles.facilityItem,
      background: active ? '#f8fafc' : '#f9fafb',
      borderLeft: `4px solid #667eea`,
    }}
  >
    <span style={modernStyles.facilityIcon}>{icon}</span>
    <span style={modernStyles.facilityLabel}>{label}</span>
    {active && <span style={modernStyles.checkmark}>✓</span>}
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
      <strong>{label}:</strong> <span>{value}</span>
    </div>
  );
};

// Price Component for different property types
const PriceDetails = ({ pg }) => {
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;

  const formatPriceLocal = (price) => {
    if (!price || price === "" || price === "0" || price === 0) return null;
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
  };

  const hasAnyPrice = () => {
    if (!pg) return false;
    
    if (isToLet) {
      return (pg.price_1bhk && pg.price_1bhk !== "0" && pg.price_1bhk !== "") ||
            (pg.price_2bhk && pg.price_2bhk !== "0" && pg.price_2bhk !== "") ||
            (pg.price_3bhk && pg.price_3bhk !== "0" && pg.price_3bhk !== "") ||
            (pg.price_4bhk && pg.price_4bhk !== "0" && pg.price_4bhk !== "");
    } else if (isCoLiving) {
      return (pg.co_living_single_room && pg.co_living_single_room !== "0" && pg.co_living_single_room !== "") ||
            (pg.co_living_double_room && pg.co_living_double_room !== "0" && pg.co_living_double_room !== "") ||
            (pg.coliving_three_sharing && pg.coliving_three_sharing !== "0" && pg.coliving_three_sharing !== "") ||
            (pg.coliving_four_sharing && pg.coliving_four_sharing !== "0" && pg.coliving_four_sharing !== "");
    } else {
      return (pg.single_sharing && pg.single_sharing !== "0" && pg.single_sharing !== "") ||
            (pg.double_sharing && pg.double_sharing !== "0" && pg.double_sharing !== "") ||
            (pg.triple_sharing && pg.triple_sharing !== "0" && pg.triple_sharing !== "") ||
            (pg.four_sharing && pg.four_sharing !== "0" && pg.four_sharing !== "") ||
            (pg.single_room && pg.single_room !== "0" && pg.single_room !== "") ||
            (pg.double_room && pg.double_room !== "0" && pg.double_room !== "") ||
            (pg.triple_room && pg.triple_room !== "0" && pg.triple_room !== "");
    }
  };

  if (!hasAnyPrice()) {
    return null;
  }

  return (
    <div style={modernStyles.priceDetailsContainer}>
      {isToLet && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🏠</span>
            Rental Prices
          </h4>
          <div style={modernStyles.priceGrid}>
            {pg.price_1bhk && pg.price_1bhk !== "0" && pg.price_1bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>1 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_1bhk)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
                {pg.security_deposit && pg.security_deposit !== "0" && pg.security_deposit !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Deposit: {formatPriceLocal(pg.security_deposit)}
                  </div>
                )}
              </div>
            )}
            {pg.price_2bhk && pg.price_2bhk !== "0" && pg.price_2bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>2 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_2bhk)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
              </div>
            )}
            {pg.price_3bhk && pg.price_3bhk !== "0" && pg.price_3bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>3 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_3bhk)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
              </div>
            )}
            {pg.price_4bhk && pg.price_4bhk !== "0" && pg.price_4bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>4 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_4bhk)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Property Details for To-Let */}
          <div style={modernStyles.propertyDetails}>
            {pg.bhk_type && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>🏠</span>
                <span>{pg.bhk_type} Apartment</span>
              </div>
            )}
            {pg.furnishing_type && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>🛋️</span>
                <span>{pg.furnishing_type}</span>
              </div>
            )}
            {pg.sqft_area && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>📏</span>
                <span>{pg.sqft_area} sqft</span>
              </div>
            )}
            {pg.family_allowed && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>👨‍👩‍👧</span>
                <span>Family Friendly</span>
              </div>
            )}
            {pg.ready_to_move && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>✓</span>
                <span>Ready to Move</span>
              </div>
            )}
            {pg.parking_available && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>🚗</span>
                <span>Parking Available</span>
              </div>
            )}
            {pg.lift_elevator && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>⬆️</span>
                <span>Lift Available</span>
              </div>
            )}
            {pg.balcony_available && (
              <div style={modernStyles.propertyDetailItem}>
                <span style={modernStyles.propertyDetailIcon}>🌿</span>
                <span>Balcony</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isCoLiving && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🤝</span>
            Co-Living Room Prices
          </h4>
          <div style={modernStyles.priceGrid}>
            {pg.co_living_single_room && pg.co_living_single_room !== "0" && pg.co_living_single_room !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Single Room</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.co_living_single_room)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
              </div>
            )}
            {pg.co_living_double_room && pg.co_living_double_room !== "0" && pg.co_living_double_room !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Double Room</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.co_living_double_room)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
              </div>
            )}
            {pg.coliving_three_sharing && pg.coliving_three_sharing !== "0" && pg.coliving_three_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Triple Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.coliving_three_sharing)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
              </div>
            )}
            {pg.coliving_four_sharing && pg.coliving_four_sharing !== "0" && pg.coliving_four_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Four Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.coliving_four_sharing)}<span style={modernStyles.pricePeriod}>/month</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isPG && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🏢</span>
            Room Prices
          </h4>
          
          {(pg.single_sharing || pg.double_sharing || pg.triple_sharing || pg.four_sharing) && (
            <div style={modernStyles.priceCategory}>
              <div style={modernStyles.priceCategoryTitle}>Sharing Rooms</div>
              <div style={modernStyles.priceGrid}>
                {pg.single_sharing && pg.single_sharing !== "0" && pg.single_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Single Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.single_sharing)}<span style={modernStyles.pricePeriod}>/month</span>
                    </div>
                  </div>
                )}
                {pg.double_sharing && pg.double_sharing !== "0" && pg.double_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Double Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.double_sharing)}<span style={modernStyles.pricePeriod}>/month</span>
                    </div>
                  </div>
                )}
                {pg.triple_sharing && pg.triple_sharing !== "0" && pg.triple_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Triple Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.triple_sharing)}<span style={modernStyles.pricePeriod}>/month</span>
                    </div>
                  </div>
                )}
                {pg.four_sharing && pg.four_sharing !== "0" && pg.four_sharing !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Four Sharing</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.four_sharing)}<span style={modernStyles.pricePeriod}>/month</span>
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
                      {formatPriceLocal(pg.single_room)}<span style={modernStyles.pricePeriod}>/month</span>
                    </div>
                  </div>
                )}
                {pg.double_room && pg.double_room !== "0" && pg.double_room !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Double Room</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.double_room)}<span style={modernStyles.pricePeriod}>/month</span>
                    </div>
                  </div>
                )}
                {pg.triple_room && pg.triple_room !== "0" && pg.triple_room !== "" && (
                  <div style={modernStyles.priceItem}>
                    <div style={modernStyles.priceType}>Triple Room</div>
                    <div style={modernStyles.priceValue}>
                      {formatPriceLocal(pg.triple_room)}<span style={modernStyles.pricePeriod}>/month</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Food Section - ONLY for PG */}
          {pg.food_available && (
            <div style={modernStyles.foodSection}>
              <h5 style={modernStyles.foodSectionTitle}>
                <span style={modernStyles.foodSectionIcon}>🍽️</span>
                Food Information
              </h5>
              <div style={modernStyles.foodDetails}>
                <div style={modernStyles.foodType}>
                  Food Type: {pg.food_type === 'veg' ? 'Vegetarian' : pg.food_type === 'non-veg' ? 'Non-Vegetarian' : 'Veg & Non-Veg'}
                </div>
                {pg.meals_per_day && (
                  <div style={modernStyles.mealsCount}>
                    Meals: {pg.meals_per_day} meals per day
                  </div>
                )}
                {pg.food_charges && pg.food_charges !== "0" && pg.food_charges !== "" && (
                  <div style={modernStyles.foodCharges}>
                    Food Charges: {formatPriceLocal(pg.food_charges)}/month
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Charges Section - ONLY for PG */}
          {(pg.security_deposit || pg.maintenance_charges || pg.advance_rent) && (
            <div style={modernStyles.additionalCharges}>
              <h5 style={modernStyles.additionalChargesTitle}>Additional Charges</h5>
              <div style={modernStyles.chargesGrid}>
                {pg.security_deposit && pg.security_deposit !== "0" && pg.security_deposit !== "" && (
                  <div style={modernStyles.chargeItem}>
                    <span style={modernStyles.chargeLabel}>Security Deposit</span>
                    <span style={modernStyles.chargeValue}>{formatPriceLocal(pg.security_deposit)}</span>
                  </div>
                )}
                {pg.maintenance_charges && pg.maintenance_charges !== "0" && pg.maintenance_charges !== "" && (
                  <div style={modernStyles.chargeItem}>
                    <span style={modernStyles.chargeLabel}>Maintenance Charges</span>
                    <span style={modernStyles.chargeValue}>{formatPriceLocal(pg.maintenance_charges)}<span style={modernStyles.pricePeriod}>/month</span></span>
                  </div>
                )}
                {pg.advance_rent && pg.advance_rent !== "0" && pg.advance_rent !== "" && (
                  <div style={modernStyles.chargeItem}>
                    <span style={modernStyles.chargeLabel}>Advance Rent</span>
                    <span style={modernStyles.chargeValue}>{pg.advance_rent} months</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Highlight Category Button
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
      background: isActive ? '#667eea' : 'white',
      color: isActive ? 'white' : '#374151',
      boxShadow: isActive ? `0 4px 15px #667eea40` : '0 2px 10px rgba(0,0,0,0.05)',
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

// Highlight Item Component
const HighlightItem = ({ name, type, category, icon, onMapView, coordinates, color }) => (
  <div 
    style={{
      ...modernStyles.highlightItem,
      borderLeft: `4px solid #667eea`
    }}
    onClick={onMapView}
  >
    <div style={{
      ...modernStyles.highlightIconContainer,
      background: '#667eea'
    }}>
      <span style={modernStyles.highlightIcon}>{icon}</span>
    </div>
    <div style={modernStyles.highlightContent}>
      <div style={modernStyles.highlightName}>{name}</div>
      <div style={modernStyles.highlightType}>{type.replace(/_/g, ' ').replace('nearby ', '')}</div>
    </div>
    <button 
      style={{
        ...modernStyles.viewOnMapButton,
        background: '#667eea'
      }} 
      onClick={(e) => {
        e.stopPropagation();
        onMapView();
      }}
    >
      View on Map
    </button>
  </div>
);

// Nearby PG Card Component
const NearbyPGCard = ({ pg, onClick, distance }) => {
  const getStartingPrice = () => {
    if (!pg) return null;
    
    const isToLet = pg.pg_category === "to_let";
    const isCoLiving = pg.pg_category === "coliving";
    
    if (isToLet) {
      if (pg.price_1bhk && parseInt(pg.price_1bhk) > 0) return pg.price_1bhk;
      if (pg.price_2bhk && parseInt(pg.price_2bhk) > 0) return pg.price_2bhk;
      if (pg.price_3bhk && parseInt(pg.price_3bhk) > 0) return pg.price_3bhk;
      if (pg.price_4bhk && parseInt(pg.price_4bhk) > 0) return pg.price_4bhk;
      return null;
    } else if (isCoLiving) {
      if (pg.co_living_single_room && parseInt(pg.co_living_single_room) > 0) return pg.co_living_single_room;
      if (pg.co_living_double_room && parseInt(pg.co_living_double_room) > 0) return pg.co_living_double_room;
      if (pg.coliving_three_sharing && parseInt(pg.coliving_three_sharing) > 0) return pg.coliving_three_sharing;
      if (pg.coliving_four_sharing && parseInt(pg.coliving_four_sharing) > 0) return pg.coliving_four_sharing;
      return null;
    } else {
      if (pg.single_sharing && parseInt(pg.single_sharing) > 0) return pg.single_sharing;
      if (pg.double_sharing && parseInt(pg.double_sharing) > 0) return pg.double_sharing;
      if (pg.triple_sharing && parseInt(pg.triple_sharing) > 0) return pg.triple_sharing;
      if (pg.four_sharing && parseInt(pg.four_sharing) > 0) return pg.four_sharing;
      if (pg.single_room && parseInt(pg.single_room) > 0) return pg.single_room;
      if (pg.double_room && parseInt(pg.double_room) > 0) return pg.double_room;
      if (pg.triple_room && parseInt(pg.triple_room) > 0) return pg.triple_room;
      return null;
    }
  };

  const getImageUrl = () => {
    if (pg.photos && pg.photos.length > 0) {
      return getCorrectImageUrl(pg.photos[0]);
    }
    return null;
  };

  const startingPrice = getStartingPrice();
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
            {pg.pg_category === "to_let" ? "House" : 
            pg.pg_category === "coliving" ? "Co-Living" : 
            "PG"}
          </span>
          {distance && distance > 0 && (
            <span style={modernStyles.nearbyPgDistanceBadge}>
              {distance.toFixed(1)} km away
            </span>
          )}
        </div>
      </div>
      
      <div style={modernStyles.nearbyPgContent}>
        <h4 style={modernStyles.nearbyPgTitle}>{pg.pg_name}</h4>
        <p style={modernStyles.nearbyPgAddress}>
          {pg.address ? `${pg.address.substring(0, 40)}...` : pg.area || pg.city}
        </p>
        
        <div style={modernStyles.nearbyPgStats}>
          <div style={modernStyles.nearbyPgStat}>
            <span style={modernStyles.nearbyPgStatIcon}>💰</span>
            <span style={modernStyles.nearbyPgStatText}>
              {startingPrice
                ? `₹${Number(startingPrice).toLocaleString("en-IN")}/month`
                : "Price on request"}
            </span>
          </div>

          {Number(pg.available_rooms || pg.total_rooms) > 0 && (
            <div style={modernStyles.nearbyPgStat}>
              <span style={modernStyles.nearbyPgStatIcon}>🏠</span>
              <span style={modernStyles.nearbyPgStatText}>
                {pg.available_rooms || pg.total_rooms} rooms
              </span>
            </div>
          )}
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
          View Details
        </button>
      </div>
    </div>
  );
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

// Interactive Nearby Highlights Panel
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
    return null;
  }

  const filteredHighlights = selectedCategory === "all" 
    ? highlights 
    : highlights.filter(h => h.category === selectedCategory);

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
              color="#667eea"
            />
          );
        })}
      </div>

      <div style={modernStyles.highlightsList}>
        <div style={modernStyles.highlightsListHeader}>
          <h4 style={modernStyles.highlightsListTitle}>
            <span style={{
              ...modernStyles.categoryIndicator,
              background: '#667eea'
            }}></span>
            {selectedCategory === "all" 
              ? "All Nearby Places" 
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
              color="#667eea"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Nearby PGs Panel Component
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
    return null;
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
          View All Properties in {nearbyPGs[0]?.area || nearbyPGs[0]?.city || "Area"}
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { user, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [loadingNearbyPGs, setLoadingNearbyPGs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [selectedHighlightCategory, setSelectedHighlightCategory] = useState("all");
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState([0, 0]);

  // Color themes - single color for all
  const highlightCategories = [
    { id: "all", label: "All", icon: "📍", color: "#667eea" },
    { id: "education", label: "Education", icon: "🎓", color: "#667eea" },
    { id: "transport", label: "Transport", icon: "🚌", color: "#667eea" },
    { id: "healthcare", label: "Healthcare", icon: "🏥", color: "#667eea" },
    { id: "shopping", label: "Shopping", icon: "🛒", color: "#667eea" },
    { id: "finance", label: "Finance", icon: "🏦", color: "#667eea" },
    { id: "recreation", label: "Recreation", icon: "🏃", color: "#667eea" },
    { id: "worship", label: "Worship", icon: "🛐", color: "#667eea" },
    { id: "safety", label: "Safety", icon: "👮", color: "#667eea" },
    { id: "food", label: "Food", icon: "🍽️", color: "#667eea" }
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

  // FETCH PG DETAILS
  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await api.get(`/pg/${id}`);
        
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to fetch property details");
        }

        const data = res.data.data;

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
              console.error("Invalid video JSON:", err);
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

  // FETCH NEARBY HIGHLIGHTS AND PGS
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
            coordinates: null
          });
        }
      });
      
      return highlights;
    };

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

        const allHighlights = [...processDBHighlights(), ...autoPlaces];
        const uniqueHighlights = Array.from(
          new Map(allHighlights.map(item => [item.name, item])).values()
        );
        
        setNearbyHighlights(uniqueHighlights);
      } catch (err) {
        console.error("Auto location highlights error", err);
        setNearbyHighlights(processDBHighlights());
      } finally {
        setLoadingHighlights(false);
      }
    };

    // Nearby PGs fetch
    const fetchNearbyPGs = async () => {
      try {
        setLoadingNearbyPGs(true);
        
        if (!id || id === "undefined") {
          setNearbyPGs([]);
          return;
        }

        let response = null;
        let success = false;
        
        try {
          const url = `/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`;
          response = await api.get(url);
          if (response.data?.success) {
            success = true;
          }
        } catch (err) {
          console.log("Primary endpoint failed");
        }
        
        if (!success) {
          try {
            const url = `/properties/nearby?lat=${pg.latitude}&lng=${pg.longitude}&radius=5&exclude=${id}`;
            response = await api.get(url);
            if (response.data?.success) {
              success = true;
            }
          } catch (err) {
            console.log("Alternative endpoint failed");
          }
        }
        
        if (success && response?.data?.data) {
          let pgsList = Array.isArray(response.data.data) ? response.data.data : [];
          
          const pgsWithDistance = pgsList
            .filter(otherPG => otherPG.id !== parseInt(id))
            .map(otherPG => {
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
          
          setNearbyPGs(sortedPGs);
        } else {
          setNearbyPGs([]);
        }
      } catch (err) {
        console.error("Error fetching nearby PGs:", err);
        setNearbyPGs([]);
      } finally {
        setLoadingNearbyPGs(false);
      }
    };

    fetchAutoHighlights();
    fetchNearbyPGs();
  }, [pg, id]);

  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;
  const hasLocation = pg?.latitude && pg?.longitude;

  const getStartingPrice = () => {
    if (!pg) return null;
    
    if (isToLet) {
      if (pg.price_1bhk && parseInt(pg.price_1bhk) > 0) return pg.price_1bhk;
      if (pg.price_2bhk && parseInt(pg.price_2bhk) > 0) return pg.price_2bhk;
      if (pg.price_3bhk && parseInt(pg.price_3bhk) > 0) return pg.price_3bhk;
      if (pg.price_4bhk && parseInt(pg.price_4bhk) > 0) return pg.price_4bhk;
      return null;
    } else if (isCoLiving) {
      if (pg.co_living_single_room && parseInt(pg.co_living_single_room) > 0) return pg.co_living_single_room;
      if (pg.co_living_double_room && parseInt(pg.co_living_double_room) > 0) return pg.co_living_double_room;
      if (pg.coliving_three_sharing && parseInt(pg.coliving_three_sharing) > 0) return pg.coliving_three_sharing;
      if (pg.coliving_four_sharing && parseInt(pg.coliving_four_sharing) > 0) return pg.coliving_four_sharing;
      return null;
    } else {
      if (pg.single_sharing && parseInt(pg.single_sharing) > 0) return pg.single_sharing;
      if (pg.double_sharing && parseInt(pg.double_sharing) > 0) return pg.double_sharing;
      if (pg.triple_sharing && parseInt(pg.triple_sharing) > 0) return pg.triple_sharing;
      if (pg.four_sharing && parseInt(pg.four_sharing) > 0) return pg.four_sharing;
      if (pg.single_room && parseInt(pg.single_room) > 0) return pg.single_room;
      if (pg.double_room && parseInt(pg.double_room) > 0) return pg.double_room;
      if (pg.triple_room && parseInt(pg.triple_room) > 0) return pg.triple_room;
      return null;
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

  // Get all facilities (consolidated list)
  const getAllFacilities = () => {
    const allFacilities = [];
    
    // Basic Amenities
    if (pg?.wifi_available) allFacilities.push({ icon: "📶", label: "Wi-Fi / Internet" });
    if (pg?.ac_available) allFacilities.push({ icon: "❄️", label: "Air Conditioner" });
    if (pg?.geyser) allFacilities.push({ icon: "🚿", label: "Geyser / Water Heater" });
    if (pg?.tv) allFacilities.push({ icon: "📺", label: "Television" });
    if (pg?.refrigerator) allFacilities.push({ icon: "🧊", label: "Refrigerator" });
    if (pg?.washing_machine) allFacilities.push({ icon: "🧼", label: "Washing Machine" });
    if (pg?.microwave) allFacilities.push({ icon: "🍳", label: "Microwave" });
    if (pg?.water_purifier) allFacilities.push({ icon: "💧", label: "Water Purifier" });
    
    // Furniture
    if (pg?.bed_with_mattress) allFacilities.push({ icon: "🛏️", label: "Bed with Mattress" });
    if (pg?.cupboard_available) allFacilities.push({ icon: "👔", label: "Cupboard / Wardrobe" });
    if (pg?.table_chair_available) allFacilities.push({ icon: "💺", label: "Study Table & Chair" });
    if (pg?.dining_table_available) allFacilities.push({ icon: "🍽️", label: "Dining Table" });
    if (pg?.sofa) allFacilities.push({ icon: "🛋️", label: "Sofa" });
    
    // Room Features
    if (pg?.attached_bathroom) allFacilities.push({ icon: "🚽", label: "Attached Bathroom" });
    if (pg?.balcony_available) allFacilities.push({ icon: "🌿", label: "Balcony" });
    if (pg?.fan_light) allFacilities.push({ icon: "💡", label: "Fan & Light" });
    if (pg?.wall_mounted_clothes_hook) allFacilities.push({ icon: "🪝", label: "Clothes Hook" });
    
    // Kitchen
    if (pg?.kitchen_room) allFacilities.push({ icon: "🍳", label: "Kitchen" });
    if (pg?.modular_kitchen) allFacilities.push({ icon: "🏗️", label: "Modular Kitchen" });
    
    // Safety & Security
    if (pg?.cctv) allFacilities.push({ icon: "📹", label: "CCTV Surveillance" });
    if (pg?.security_guard) allFacilities.push({ icon: "🛡️", label: "Security Guard" });
    if (pg?.fire_safety) allFacilities.push({ icon: "🔥", label: "Fire Safety System" });
    if (pg?.lock_system) allFacilities.push({ icon: "🔒", label: "Secure Lock System" });
    
    // Parking
    if (pg?.parking_available) allFacilities.push({ icon: "🚗", label: "Car Parking" });
    if (pg?.bike_parking) allFacilities.push({ icon: "🏍️", label: "Bike Parking" });
    
    // Utilities
    if (pg?.power_backup) allFacilities.push({ icon: "🔋", label: "Power Backup" });
    if (pg?.water_24x7) allFacilities.push({ icon: "💦", label: "24×7 Water Supply" });
    if (pg?.lift_elevator) allFacilities.push({ icon: "⬆️", label: "Lift / Elevator" });
    
    // Common Areas
    if (pg?.common_tv_lounge) allFacilities.push({ icon: "📺", label: "Common TV Lounge" });
    if (pg?.study_room) allFacilities.push({ icon: "📚", label: "Study Room" });
    if (pg?.gym) allFacilities.push({ icon: "🏋️", label: "Gym / Fitness" });
    if (pg?.balcony_open_space) allFacilities.push({ icon: "🌿", label: "Open Terrace / Balcony" });
    
    // Services
    if (pg?.housekeeping) allFacilities.push({ icon: "🧹", label: "Housekeeping" });
    if (pg?.laundry_available) allFacilities.push({ icon: "🧺", label: "Laundry Service" });
    
    // Food
    if (pg?.food_available) {
      allFacilities.push({ icon: "🍽️", label: `Food Available (${pg.food_type === 'veg' ? 'Veg' : pg.food_type === 'non-veg' ? 'Non-Veg' : 'Veg & Non-Veg'})` });
    }
    
    return allFacilities;
  };

  // hasPriceDetails function
  const hasPriceDetails = () => {
    if (!pg) return false;
    
    const isToLetLocal = pg.pg_category === "to_let";
    const isCoLivingLocal = pg.pg_category === "coliving";
    
    if (isToLetLocal) {
      return (pg.price_1bhk && pg.price_1bhk !== "0" && pg.price_1bhk !== "") ||
            (pg.price_2bhk && pg.price_2bhk !== "0" && pg.price_2bhk !== "") ||
            (pg.price_3bhk && pg.price_3bhk !== "0" && pg.price_3bhk !== "") ||
            (pg.price_4bhk && pg.price_4bhk !== "0" && pg.price_4bhk !== "");
    } else if (isCoLivingLocal) {
      return (pg.co_living_single_room && pg.co_living_single_room !== "0" && pg.co_living_single_room !== "") ||
            (pg.co_living_double_room && pg.co_living_double_room !== "0" && pg.co_living_double_room !== "") ||
            (pg.coliving_three_sharing && pg.coliving_three_sharing !== "0" && pg.coliving_three_sharing !== "") ||
            (pg.coliving_four_sharing && pg.coliving_four_sharing !== "0" && pg.coliving_four_sharing !== "");
    } else {
      return (pg.single_sharing && pg.single_sharing !== "0" && pg.single_sharing !== "") ||
            (pg.double_sharing && pg.double_sharing !== "0" && pg.double_sharing !== "") ||
            (pg.triple_sharing && pg.triple_sharing !== "0" && pg.triple_sharing !== "") ||
            (pg.four_sharing && pg.four_sharing !== "0" && pg.four_sharing !== "") ||
            (pg.single_room && pg.single_room !== "0" && pg.single_room !== "") ||
            (pg.double_room && pg.double_room !== "0" && pg.double_room !== "") ||
            (pg.triple_room && pg.triple_room !== "0" && pg.triple_room !== "");
    }
  };

  const facilities = getAllFacilities();

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
          Back to Home
        </button>
      </div>
    );
  }

  const current = media[index];
  const shouldShowNearbyHighlights = hasLocation && (nearbyHighlights.length > 0 || loadingHighlights);
  const shouldShowNearbyPGs = nearbyPGs.length > 0 || loadingNearbyPGs;
  const startingPrice = getStartingPrice();

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
      </div>

      {media.length > 0 ? (
        <div style={modernStyles.slider}>
          {current.type === "photo" ? (
            <img 
              src={current.src} 
              alt={pg.pg_name} 
              style={modernStyles.media}
              onError={(e) => {
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
              <MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}, ${pg.state || ''}`}
            </p>
            {pg.landmark && (
              <p style={modernStyles.landmark}>
                <Navigation size={14} /> Near {pg.landmark}
              </p>
            )}
          </div>
          <div style={modernStyles.actionButtons}>
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
                Get Directions
              </button>
            )}
          </div>
        </div>

        <div style={modernStyles.badgeRow}>
          <span style={modernStyles.typeBadge}>
            {isToLet ? "House / Flat" : 
            isCoLiving ? "Co-Living" : 
            "PG / Hostel"}
          </span>
          
          {!isToLet && !isCoLiving && pg.pg_type && (
            <span style={modernStyles.genderBadge}>
              {pg.pg_type === "boys" ? "Boys Only" : 
              pg.pg_type === "girls" ? "Girls Only" : 
              pg.pg_type === "coliving" ? "Co-Living" : "Mixed"}
            </span>
          )}
          
          {isToLet && pg.bhk_type && (
            <span style={modernStyles.bhkBadge}>
              {pg.bhk_type === "4+" ? "4+ BHK" : `${pg.bhk_type} BHK`}
            </span>
          )}
          
          {!isToLet && pg.available_rooms !== undefined && (
            <span style={{
              ...modernStyles.availabilityBadge,
              backgroundColor: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
            }}>
              {pg.available_rooms > 0 ? `${pg.available_rooms} Available` : "Fully Occupied"}
            </span>
          )}
          
          {isToLet && pg.ready_to_move && (
            <span style={{
              ...modernStyles.availabilityBadge,
              backgroundColor: "#f59e0b"
            }}>
              Ready to Move
            </span>
          )}
          
          <span style={{
            ...modernStyles.availabilityBadge,
            backgroundColor: "#667eea"
          }}>
            Zero Brokerage
          </span>
        </div>
      </div>

      <div style={modernStyles.twoColumn}>
        <div style={modernStyles.leftColumn}>
          {pg.description && (
            <Section title="About this Property" icon="📋">
              <p style={modernStyles.description}>{pg.description}</p>
            </Section>
          )}

          {facilities.length > 0 && (
            <Section title="Amenities & Facilities" icon="✨" badgeCount={facilities.length}>
              <div style={modernStyles.facilitiesGrid}>
                {facilities.map((facility, index) => (
                  <FacilityItem key={index} icon={facility.icon} label={facility.label} active={true} />
                ))}
              </div>
              
              {pg.water_type && pg.water_type !== "" && (
                <div style={modernStyles.waterSource}>
                  <strong>💧 Water Source:</strong> {pg.water_type === "borewell" ? "Borewell" : 
                                                pg.water_type === "kaveri" ? "Kaveri" : 
                                                pg.water_type === "both" ? "Both" : 
                                                pg.water_type === "municipal" ? "Municipal" : pg.water_type}
                </div>
              )}
            </Section>
          )}

          {hasPriceDetails() && (
            <Section title="Price Details" icon="💰">
              <PriceDetails pg={pg} />
            </Section>
          )}
        </div>

        <div style={modernStyles.rightColumn}>
          {hasLocation && (
            <Section title="Location" icon="📍">
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

          {(Number(pg.total_rooms) > 0 || Number(pg.available_rooms) > 0) && !isToLet && (
            <div style={modernStyles.availabilityCard}>
              <h3 style={modernStyles.availabilityTitle}>Availability Status</h3>

              {Number(pg.total_rooms) > 0 && (
                <div style={modernStyles.availabilityItem}>
                  <div style={modernStyles.availabilityLabel}>
                    Total {isToLet ? "Properties" : "Rooms"}
                  </div>
                  <div style={modernStyles.availabilityValue}>
                    {pg.total_rooms}
                  </div>
                </div>
              )}

              {Number(pg.available_rooms) > 0 && (
                <div style={modernStyles.availabilityItem}>
                  <div style={modernStyles.availabilityLabel}>Available Now</div>
                  <div style={{
                    ...modernStyles.availabilityValue,
                    color: "#10b981"
                  }}>
                    {pg.available_rooms} Available
                  </div>
                </div>
              )}

              <div style={modernStyles.availabilityNote}>
                {Number(pg.available_rooms) > 0
                  ? "Contact owner to book your spot!"
                  : "Check back later for availability"}
              </div>
            </div>
          )}
        </div>
      </div>

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
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @media (max-width: 768px) {
          .leaflet-container {
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Styles object (modernStyles) - same as before but I'll include it
const modernStyles = {
  // Base layout
  page: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px 20px 60px 20px",
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
    background: "linear-gradient(135deg, #667eea, #667eea)",
    color: "white",
    border: "none",
    borderRadius: "40px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3ease",
    boxShadow: "0 8px 20px rgba(102,126,234,0.3)",
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
    color: "#667eea",
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
    background: "linear-gradient(135deg, #667eea, #667eea)",
    borderRadius: "28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "28px",
    color: "white",
    boxShadow: "0 20px 35px -12px rgba(102,126,234,0.3)",
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
  directionButton: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #667eea, #667eea)",
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
    boxShadow: "0 8px 18px rgba(102,126,234,0.3)",
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "28px",
  },
  typeBadge: {
    background: "linear-gradient(135deg, #667eea, #667eea)",
    color: "white",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(102,126,234,0.25)",
  },
  genderBadge: {
    background: "linear-gradient(135deg, #667eea, #667eea)",
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
    background: "linear-gradient(135deg, #667eea, #667eea)",
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

  // Two column layout - responsive
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "28px",
    marginBottom: "40px",
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
  sectionIcon: {
    fontSize: "22px",
  },
  sectionBadge: {
    background: "linear-gradient(135deg, #667eea, #667eea)",
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
  priceSectionIcon: {
    fontSize: "20px",
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
    marginBottom: "4px",
  },
  pricePeriod: {
    fontSize: "12px",
    fontWeight: "400",
    color: "#64748b",
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
  propertyDetails: {
    marginTop: "20px",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "20px",
  },
  propertyDetailItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "white",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },
  propertyDetailIcon: {
    fontSize: "16px",
  },
  foodSection: {
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#f0fdf4",
    borderRadius: "20px",
    border: "1px solid #dcfce7",
  },
  foodSectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#047857",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  foodSectionIcon: {
    fontSize: "18px",
  },
  foodDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  foodType: {
    fontSize: "14px",
    color: "#047857",
  },
  mealsCount: {
    fontSize: "14px",
    color: "#047857",
  },
  foodCharges: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#047857",
  },
  additionalCharges: {
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "20px",
  },
  additionalChargesTitle: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#475569",
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
    borderBottom: "1px solid #e2e8f0",
  },
  chargeLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  chargeValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  priceCategory: {
    marginBottom: "20px",
  },
  priceCategoryTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    paddingLeft: "8px",
    borderLeft: "4px solid #667eea",
  },

  // Facilities
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
    background: "#f8fafc",
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
  mapPopup: {
    padding: "12px",
    maxWidth: "220px",
  },
  mapPopupTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  mapPopupAddress: {
    fontSize: "12px",
    color: "#64748b",
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
  highlightCategoryBtnEmpty: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  highlightCategoryIcon: {
    fontSize: "14px",
  },
  highlightCategoryLabel: {
    fontSize: "13px",
    fontWeight: "500",
  },
  highlightCategoryCount: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: "30px",
    fontSize: "10px",
    fontWeight: "600",
    marginLeft: "4px",
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
  highlightsListTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  highlightsCount: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "30px",
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
  highlightContent: {
    flex: 1,
  },
  highlightName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px",
  },
  highlightType: {
    fontSize: "12px",
    color: "#64748b",
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
  categoryIndicator: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "8px",
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
  nearbyPGsIcon: {
    fontSize: "20px",
  },
  nearbyPGsCount: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "4px 12px",
    borderRadius: "30px",
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
  nearbyPgImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyPgImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  nearbyPgNoImage: {
    fontSize: "40px",
    color: "#94a3b8",
  },
  nearbyPgBadges: {
    position: "absolute",
    top: "12px",
    left: "12px",
    right: "12px",
    display: "flex",
    justifyContent: "space-between",
  },
  nearbyPgTypeBadge: {
    background: "rgba(102,126,234,0.9)",
    backdropFilter: "blur(4px)",
    padding: "4px 12px",
    borderRadius: "30px",
    fontSize: "11px",
    fontWeight: "600",
    color: "white",
  },
  nearbyPgDistanceBadge: {
    background: "rgba(16,185,129,0.9)",
    backdropFilter: "blur(4px)",
    padding: "4px 12px",
    borderRadius: "30px",
    fontSize: "11px",
    fontWeight: "600",
    color: "white",
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
  nearbyPgAddress: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "12px",
    lineHeight: "1.4",
  },
  nearbyPgStats: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  nearbyPgStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  nearbyPgStatIcon: {
    fontSize: "14px",
  },
  nearbyPgStatText: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
  },
  nearbyPgFacilities: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  nearbyPgFacility: {
    fontSize: "18px",
    backgroundColor: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "12px",
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
  nearbyPGsFooter: {
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  viewAllPropertiesButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "transparent",
    color: "#667eea",
    border: "1px solid #667eea",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
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
  availabilityLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  availabilityValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
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

  // Modal (keeping but hidden from UI)
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
  formHint: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "6px",
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
  noFacilitiesIcon: {
    fontSize: "48px",
    opacity: 0.5,
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
};

// Responsive media queries
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  
  const applyResponsiveStyles = (e) => {
    try {
      if (e.matches) {
        // Mobile styles
        if (modernStyles.twoColumn) modernStyles.twoColumn.gridTemplateColumns = "1fr";
        if (modernStyles.section) modernStyles.section.padding = "20px";
        if (modernStyles.mainCard) modernStyles.mainCard.padding = "20px";
        if (modernStyles.title) modernStyles.title.fontSize = "24px";
        if (modernStyles.media) modernStyles.media.height = "300px";
        if (modernStyles.facilitiesGrid) modernStyles.facilitiesGrid.gridTemplateColumns = "1fr";
        if (modernStyles.priceGrid) modernStyles.priceGrid.gridTemplateColumns = "1fr";
        if (modernStyles.modalContent) modernStyles.modalContent.padding = "20px";
        if (modernStyles.modalTitle) modernStyles.modalTitle.fontSize = "22px";
        
        if (modernStyles.actionButtons) {
          modernStyles.actionButtons.flexDirection = "column";
          modernStyles.actionButtons.width = "100%";
        }
        
        if (modernStyles.directionButton) {
          modernStyles.directionButton.width = "100%";
          modernStyles.directionButton.justifyContent = "center";
        }
      } else {
        // Desktop styles
        if (modernStyles.twoColumn) modernStyles.twoColumn.gridTemplateColumns = "2fr 1fr";
        if (modernStyles.section) modernStyles.section.padding = "28px";
        if (modernStyles.mainCard) modernStyles.mainCard.padding = "32px";
        if (modernStyles.title) modernStyles.title.fontSize = "32px";
        if (modernStyles.media) modernStyles.media.height = "480px";
        if (modernStyles.facilitiesGrid) modernStyles.facilitiesGrid.gridTemplateColumns = "repeat(auto-fill, minmax(260px, 1fr))";
        if (modernStyles.priceGrid) modernStyles.priceGrid.gridTemplateColumns = "repeat(auto-fit, minmax(160px, 1fr))";
        if (modernStyles.modalContent) modernStyles.modalContent.padding = "32px";
        if (modernStyles.modalTitle) modernStyles.modalTitle.fontSize = "26px";
        
        if (modernStyles.actionButtons) {
          modernStyles.actionButtons.flexDirection = "row";
          modernStyles.actionButtons.width = "auto";
        }
        
        if (modernStyles.directionButton) {
          modernStyles.directionButton.width = "auto";
          modernStyles.directionButton.justifyContent = "flex-start";
        }
      }
    } catch (err) {
      console.warn("Responsive style error:", err);
    }
  };
  
  applyResponsiveStyles(mediaQuery);
  mediaQuery.addEventListener("change", applyResponsiveStyles);
}