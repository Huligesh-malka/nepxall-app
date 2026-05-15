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

/* ================= BOOKING MODAL COMPONENT ================= */
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
      if (pg.single_sharing && Number(pg.single_sharing) > 0) return "Single Sharing";
      if (pg.double_sharing && Number(pg.double_sharing) > 0) return "Double Sharing";
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) return "Triple Sharing";
      if (pg.four_sharing && Number(pg.four_sharing) > 0) return "Four Sharing";
      if (pg.single_room && Number(pg.single_room) > 0) return "Single Room";
      if (pg.double_room && Number(pg.double_room) > 0) return "Double Room";
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) return "Single Room";
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) return "Double Room";
      if (pg.coliving_three_sharing && Number(pg.coliving_three_sharing) > 0) return "Triple Sharing";
      if (pg.coliving_four_sharing && Number(pg.coliving_four_sharing) > 0) return "Four Sharing";
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) return "1BHK";
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) return "2BHK";
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) return "3BHK";
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) return "4BHK";
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
        label: `Single Room - ₹${formatPrice(pg.co_living_single_room)}` 
      });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ 
        value: "Double Room", 
        label: `Double Room - ₹${formatPrice(pg.co_living_double_room)}` 
      });
      if (pg.coliving_three_sharing && Number(pg.coliving_three_sharing) > 0) types.push({ 
        value: "Triple Sharing", 
        label: `Triple Sharing - ₹${formatPrice(pg.coliving_three_sharing)}` 
      });
      if (pg.coliving_four_sharing && Number(pg.coliving_four_sharing) > 0) types.push({ 
        value: "Four Sharing", 
        label: `Four Sharing - ₹${formatPrice(pg.coliving_four_sharing)}` 
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
      if (bookingData.roomType === "Triple Sharing") return pg.coliving_three_sharing;
      if (bookingData.roomType === "Four Sharing") return pg.coliving_four_sharing;
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
            <h2 style={modernStyles.modalTitle}>Reserve {pg?.pg_name}</h2>
            <p style={modernStyles.modalSubtitle}>Your details will be auto-filled from your profile</p>
          </div>

          <div style={modernStyles.modalWarning}>
            You can only request this property once every 24 hours
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

// Simplified Price Component - Shows all sharing prices clearly
const PriceDetails = ({ pg }) => {
  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;

  const formatPriceLocal = (price) => {
    if (!price || price === "" || price === "0" || price === 0) return null;
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
  };

  // Check if there are any prices to show
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
            (pg.double_room && pg.double_room !== "0" && pg.double_room !== "");
    }
  };

  if (!hasAnyPrice()) {
    return null;
  }

  return (
    <div style={modernStyles.priceDetailsContainer}>
      {/* PG / Hostel Prices */}
      {isPG && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🏢</span>
            Room Prices (per month)
          </h4>
          
          <div style={modernStyles.priceGrid}>
            {pg.single_sharing && pg.single_sharing !== "0" && pg.single_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Single Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.single_sharing)}
                </div>
              </div>
            )}
            {pg.double_sharing && pg.double_sharing !== "0" && pg.double_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Double Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.double_sharing)}
                </div>
              </div>
            )}
            {pg.triple_sharing && pg.triple_sharing !== "0" && pg.triple_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Triple Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.triple_sharing)}
                </div>
              </div>
            )}
            {pg.four_sharing && pg.four_sharing !== "0" && pg.four_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Four Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.four_sharing)}
                </div>
              </div>
            )}
            {pg.single_room && pg.single_room !== "0" && pg.single_room !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Single Room</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.single_room)}
                </div>
              </div>
            )}
            {pg.double_room && pg.double_room !== "0" && pg.double_room !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Double Room</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.double_room)}
                </div>
              </div>
            )}
          </div>

          {/* Additional Charges */}
          {(pg.security_deposit && pg.security_deposit !== "0" && pg.security_deposit !== "") ||
           (pg.maintenance_charges && pg.maintenance_charges !== "0" && pg.maintenance_charges !== "") ||
           (pg.advance_rent && pg.advance_rent !== "0" && pg.advance_rent !== "") ? (
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
          ) : null}
        </div>
      )}

      {/* Co-Living Prices */}
      {isCoLiving && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🤝</span>
            Co-Living Room Prices (per month)
          </h4>
          <div style={modernStyles.priceGrid}>
            {pg.co_living_single_room && pg.co_living_single_room !== "0" && pg.co_living_single_room !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Single Room</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.co_living_single_room)}
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
                  {formatPriceLocal(pg.co_living_double_room)}
                </div>
                {pg.co_living_security_deposit && pg.co_living_security_deposit !== "0" && pg.co_living_security_deposit !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.co_living_security_deposit)}
                  </div>
                )}
              </div>
            )}
            {pg.coliving_three_sharing && pg.coliving_three_sharing !== "0" && pg.coliving_three_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Triple Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.coliving_three_sharing)}
                </div>
              </div>
            )}
            {pg.coliving_four_sharing && pg.coliving_four_sharing !== "0" && pg.coliving_four_sharing !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>Four Sharing</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.coliving_four_sharing)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* To-Let / Rental Prices */}
      {isToLet && (
        <div style={modernStyles.priceSection}>
          <h4 style={modernStyles.priceSectionTitle}>
            <span style={modernStyles.priceSectionIcon}>🏠</span>
            Rental Prices (per month)
          </h4>
          <div style={modernStyles.priceGrid}>
            {pg.price_1bhk && pg.price_1bhk !== "0" && pg.price_1bhk !== "" && (
              <div style={modernStyles.priceItem}>
                <div style={modernStyles.priceType}>1 BHK</div>
                <div style={modernStyles.priceValue}>
                  {formatPriceLocal(pg.price_1bhk)}
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
                  {formatPriceLocal(pg.price_2bhk)}
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
                  {formatPriceLocal(pg.price_3bhk)}
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
                  {formatPriceLocal(pg.price_4bhk)}
                </div>
                {pg.security_deposit_4bhk && pg.security_deposit_4bhk !== "0" && pg.security_deposit_4bhk !== "" && (
                  <div style={modernStyles.depositAmount}>
                    Security: {formatPriceLocal(pg.security_deposit_4bhk)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Food Charges */}
      {pg.food_available && pg.food_charges && pg.food_charges !== "0" && pg.food_charges !== "" && (
        <div style={modernStyles.foodCharges}>
          <span style={modernStyles.foodChargesIcon}>🍽️</span>
          <div>
            <div style={modernStyles.foodChargesLabel}>Food Charges (Optional)</div>
            <div style={modernStyles.foodChargesValue}>{formatPriceLocal(pg.food_charges)}<span style={modernStyles.pricePeriod}>/month</span></div>
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
  
  const { user, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([0, 0]);

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
      return null;
    }
  };

  // BOOK NOW CLICK
  const handleBookNow = () => {
    if (!user) {
      showNotificationMessage("Please register or login to book this property");
      navigate("/login", {
        state: { redirectTo: `/pg/${id}` }
      });
      return;
    }
    setShowBookingModal(true);
  };

  // BOOKING SUBMIT
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

      showNotificationMessage(res.data?.message || "Booking request sent to owner");
      setShowBookingModal(false);

    } catch (error) {
      if (error?.response?.data?.message) {
        showNotificationMessage(error.response.data.message);
      } else {
        showNotificationMessage("Booking failed. Try again");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Helper to check if price details exist
  const hasPriceDetails = () => {
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
            (pg.double_room && pg.double_room !== "0" && pg.double_room !== "");
    }
  };

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

      {/* Image Slider */}
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

      {/* Main Info Card */}
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
            <button
              style={modernStyles.bookButton}
              onClick={handleBookNow}
            >
              <BookOpen size={18} />
              Book Now
            </button>
            
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
          
          {pg.available_rooms !== undefined && (
            <span style={{
              ...modernStyles.availabilityBadge,
              backgroundColor: pg.available_rooms > 0 ? "#10b981" : "#ef4444"
            }}>
              {pg.available_rooms > 0 ? `${pg.available_rooms} Available` : "Fully Occupied"}
            </span>
          )}
        </div>

        <div style={modernStyles.statsGrid}>
          <div style={modernStyles.statItem}>
            <div style={modernStyles.statIcon}>💰</div>
            <div>
              <div style={modernStyles.statLabel}>Starting from</div>
              <div style={modernStyles.statValue}>
                {startingPrice ? `₹${startingPrice.toLocaleString('en-IN')} / month` : "Price on request"}
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
        </div>
      </div>

      {/* Description */}
      {pg.description && (
        <div style={modernStyles.section}>
          <h3 style={modernStyles.sectionTitle}>About this Property</h3>
          <p style={modernStyles.description}>{pg.description}</p>
        </div>
      )}

      {/* Price Details - Shows all sharing prices */}
      {hasPriceDetails() && (
        <div style={modernStyles.section}>
          <h3 style={modernStyles.sectionTitle}>Price Details</h3>
          <PriceDetails pg={pg} />
        </div>
      )}

      {/* Location Map */}
      {hasLocation && (
        <div style={modernStyles.section}>
          <h3 style={modernStyles.sectionTitle}>Location</h3>
          <div id="location-map" style={modernStyles.mapContainer}>
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ height: "300px", width: "100%", borderRadius: "12px" }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[pg.latitude, pg.longitude]}>
                <Popup>
                  <div style={modernStyles.mapPopup}>
                    <strong>{pg.pg_name}</strong><br/>
                    <small>{pg.address || pg.area}</small><br/>
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
              <div style={modernStyles.infoRow}><strong>Area:</strong> {pg.area || "—"}</div>
              <div style={modernStyles.infoRow}><strong>Road:</strong> {pg.road || "—"}</div>
              <div style={modernStyles.infoRow}><strong>Landmark:</strong> {pg.landmark || "—"}</div>
              <div style={modernStyles.infoRow}><strong>City:</strong> {pg.city || "—"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Info */}
      {(Number(pg.total_rooms) > 0 || Number(pg.available_rooms) > 0) && (
        <div style={modernStyles.availabilityCard}>
          <h3 style={modernStyles.availabilityTitle}>Availability Status</h3>
          {Number(pg.total_rooms) > 0 && (
            <div style={modernStyles.availabilityItem}>
              <div style={modernStyles.availabilityLabel}>Total {isToLet ? "Properties" : "Rooms"}</div>
              <div style={modernStyles.availabilityValue}>{pg.total_rooms}</div>
            </div>
          )}
          {Number(pg.available_rooms) > 0 && (
            <div style={modernStyles.availabilityItem}>
              <div style={modernStyles.availabilityLabel}>Available Now</div>
              <div style={{...modernStyles.availabilityValue, color: "#10b981"}}>{pg.available_rooms} Available</div>
            </div>
          )}
          <div style={modernStyles.availabilityNote}>
            {Number(pg.available_rooms) > 0 ? "Book now to secure your spot!" : "Check back later for availability"}
          </div>
        </div>
      )}

      {/* Sticky Footer */}
      <div style={modernStyles.stickyBar}>
        <div style={modernStyles.stickyContent}>
          <div>
            <div style={modernStyles.stickyPrice}>
              {startingPrice ? `₹${startingPrice.toLocaleString('en-IN')} / month` : "Price on request"}
            </div>
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
          </div>
        </div>
      </div>

      {/* Booking Modal */}
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
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @media (max-width: 768px) {
          .leaflet-container {
            height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ================= SIMPLIFIED MODERN STYLES ================= */
const modernStyles = {
  // Base layout
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 20px 100px 20px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
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
    borderRadius: "24px",
    margin: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  backButton: {
    marginTop: "24px",
    padding: "12px 28px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "40px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  // Breadcrumb
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    color: "#64748b",
    flexWrap: "wrap",
  },
  breadcrumbLink: {
    color: "#6366f1",
    cursor: "pointer",
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
    borderRadius: "20px",
    overflow: "hidden",
    marginBottom: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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
    left: "16px",
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
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  navBtnRight: {
    position: "absolute",
    top: "50%",
    right: "16px",
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
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  mediaCounter: {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
  },
  noMedia: {
    height: "250px",
    background: "#e2e8f0",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    color: "#64748b",
  },
  noMediaIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },

  // Main Card
  mainCard: {
    backgroundColor: "white",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  address: {
    fontSize: "14px",
    color: "#475569",
    margin: "0 0 4px 0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  landmark: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
  },
  bookButton: {
    padding: "10px 24px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  directionButton: {
    padding: "10px 24px",
    background: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  },
  typeBadge: {
    background: "#6366f1",
    color: "white",
    padding: "4px 14px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "600",
  },
  genderBadge: {
    background: "#ec4899",
    color: "white",
    padding: "4px 14px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "600",
  },
  availabilityBadge: {
    color: "white",
    padding: "4px 14px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "600",
  },

  statsGrid: {
    display: "flex",
    gap: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statIcon: {
    fontSize: "24px",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },

  // Sections
  section: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 16px 0",
  },

  description: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#334155",
    margin: "0",
  },

  // Price Details
  priceDetailsContainer: {
    padding: "0",
  },
  priceSection: {
    marginBottom: "20px",
  },
  priceSectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  priceSectionIcon: {
    fontSize: "18px",
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
  },
  priceItem: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  priceType: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#64748b",
    marginBottom: "6px",
  },
  priceValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#10b981",
  },
  pricePeriod: {
    fontSize: "11px",
    fontWeight: "400",
    color: "#64748b",
  },
  depositAmount: {
    fontSize: "11px",
    color: "#ef4444",
    backgroundColor: "#fef2f2",
    padding: "2px 8px",
    borderRadius: "20px",
    display: "inline-block",
    marginTop: "6px",
  },
  additionalCharges: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
  },
  additionalChargesTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "10px",
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
    fontSize: "13px",
  },
  chargeLabel: {
    color: "#64748b",
  },
  chargeValue: {
    fontWeight: "600",
    color: "#0f172a",
  },
  foodCharges: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "#f0fdf4",
    borderRadius: "16px",
    marginTop: "16px",
  },
  foodChargesIcon: {
    fontSize: "20px",
  },
  foodChargesLabel: {
    fontSize: "12px",
    color: "#047857",
  },
  foodChargesValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#047857",
  },

  // Map
  mapContainer: {
    marginBottom: "0",
  },
  locationDetails: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
  },
  infoRow: {
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#475569",
  },
  mapPopup: {
    padding: "8px",
    textAlign: "center",
  },
  mapPopupButton: {
    padding: "4px 12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },

  // Availability Card
  availabilityCard: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  availabilityTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 16px 0",
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
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
  },
  availabilityNote: {
    marginTop: "14px",
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
    padding: "8px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
  },

  // Sticky Bar
  stickyBar: {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    background: "white",
    padding: "12px 20px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
    zIndex: "1000",
    borderTop: "1px solid #e2e8f0",
  },
  stickyContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  stickyPrice: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  stickyInfo: {
    fontSize: "12px",
    color: "#64748b",
  },
  stickyActions: {
    display: "flex",
    gap: "10px",
  },
  stickyBookButton: {
    padding: "10px 24px",
    background: "#10b981",
    borderRadius: "40px",
    color: "white",
    border: "none",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },

  // Modal (Booking)
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "16px",
  },
  modalContainer: {
    background: "white",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  modalCloseBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "#f1f5f9",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  modalContent: {
    padding: "24px",
  },
  modalHeader: {
    marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "4px",
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "#64748b",
  },
  modalWarning: {
    background: "#fff7ed",
    padding: "10px 14px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "12px",
    color: "#9a3412",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },
  formInput: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    fontSize: "14px",
  },
  formSelect: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    fontSize: "14px",
  },
  selectedPrice: {
    marginTop: "8px",
    fontWeight: "600",
    color: "#10b981",
    fontSize: "13px",
  },
  formHint: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "4px",
  },
  infoBox: {
    background: "#f0fdf4",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "20px",
  },
  infoBoxHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#065f46",
    fontSize: "13px",
  },
  infoList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#065f46",
    fontSize: "12px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
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
    padding: "12px",
    background: "#10b981",
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
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  notification: {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#10b981",
    color: "white",
    padding: "12px 20px",
    borderRadius: "40px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    zIndex: 3000,
    animation: "slideIn 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },
};

// Responsive styles
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  const applyResponsive = (e) => {
    if (e.matches) {
      modernStyles.twoColumn = { gridTemplateColumns: "1fr" };
      modernStyles.media = { ...modernStyles.media, height: "280px" };
      modernStyles.priceGrid = { gridTemplateColumns: "1fr" };
      modernStyles.statsGrid = { flexDirection: "column", gap: "12px" };
      modernStyles.actionButtons = { flexDirection: "column", width: "100%" };
      modernStyles.bookButton = { width: "100%", justifyContent: "center" };
      modernStyles.directionButton = { width: "100%", justifyContent: "center" };
      modernStyles.stickyContent = { flexDirection: "column", textAlign: "center" };
      modernStyles.stickyActions = { width: "100%" };
      modernStyles.stickyBookButton = { flex: 1, justifyContent: "center" };
    } else {
      modernStyles.media = { ...modernStyles.media, height: "400px" };
      modernStyles.priceGrid = { gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" };
      modernStyles.statsGrid = { flexDirection: "row", gap: "24px" };
      modernStyles.actionButtons = { flexDirection: "row", width: "auto" };
      modernStyles.bookButton = { width: "auto", justifyContent: "flex-start" };
      modernStyles.directionButton = { width: "auto", justifyContent: "flex-start" };
      modernStyles.stickyContent = { flexDirection: "row", textAlign: "left" };
      modernStyles.stickyActions = { width: "auto" };
      modernStyles.stickyBookButton = { flex: "0", justifyContent: "center" };
    }
  };
  applyResponsive(mediaQuery);
  mediaQuery.addEventListener("change", applyResponsive);
}