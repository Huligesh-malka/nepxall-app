import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";

// Import icons
import {
  X, MapPin, Phone, BookOpen, Info, ChevronLeft, ChevronRight,
  Check, Navigation, Bed, Bath, Wifi, Car, Shield, Tv, Wind,
  Home, Users, Calendar, Clock, Heart, Share2, Star, AlertCircle,
  CheckCircle, Loader, ArrowRight, Building, MapPinned, IndianRupee,
  DoorOpen, Sofa, Flame, Droplets, Zap, Wrench, Dumbbell, Coffee,
  Utensils, Snowflake, Key, Camera, Video, Maximize2, Minimize2
} from "lucide-react";

/* ================= LEAFLET FIX ================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker for property
const propertyIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

// Helper Functions
const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return `${BASE_URL}${photo.substring(uploadsIndex)}`;
    }
  }
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BASE_URL}${normalizedPath}`;
};

const formatPrice = (price) => {
  if (!price || price === "" || price === "0") return "0";
  const numPrice = Number(price);
  if (isNaN(numPrice)) return "0";
  try {
    return numPrice.toLocaleString('en-IN');
  } catch {
    return numPrice.toString();
  }
};

const getPGCode = (id) => `PG-${String(id).padStart(5, "0")}`;

const getTomorrowDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
};

const getMaxDate = () => {
  const max = new Date();
  max.setMonth(max.getMonth() + 6);
  return max.toISOString().split('T')[0];
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/* ================= BOOKING MODAL ================= */
const BookingModal = ({ pg, onClose, onBook, bookingLoading }) => {
  const [bookingData, setBookingData] = useState({ checkInDate: "", roomType: "" });

  useEffect(() => {
    const defaultRoomType = getDefaultRoomType();
    setBookingData({ checkInDate: "", roomType: defaultRoomType || "" });
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

  const getRoomTypes = () => {
    const types = [];
    if (pg?.pg_category === "pg") {
      if (pg.single_sharing > 0) types.push({ value: "Single Sharing", label: `Single Sharing - ₹${formatPrice(pg.single_sharing)}` });
      if (pg.double_sharing > 0) types.push({ value: "Double Sharing", label: `Double Sharing - ₹${formatPrice(pg.double_sharing)}` });
      if (pg.triple_sharing > 0) types.push({ value: "Triple Sharing", label: `Triple Sharing - ₹${formatPrice(pg.triple_sharing)}` });
      if (pg.four_sharing > 0) types.push({ value: "Four Sharing", label: `Four Sharing - ₹${formatPrice(pg.four_sharing)}` });
      if (pg.single_room > 0) types.push({ value: "Single Room", label: `Single Room - ₹${formatPrice(pg.single_room)}` });
      if (pg.double_room > 0) types.push({ value: "Double Room", label: `Double Room - ₹${formatPrice(pg.double_room)}` });
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room > 0) types.push({ value: "Single Room", label: `Single Room - ₹${formatPrice(pg.co_living_single_room)}` });
      if (pg.co_living_double_room > 0) types.push({ value: "Double Room", label: `Double Room - ₹${formatPrice(pg.co_living_double_room)}` });
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk > 0) types.push({ value: "1BHK", label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` });
      if (pg.price_2bhk > 0) types.push({ value: "2BHK", label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` });
      if (pg.price_3bhk > 0) types.push({ value: "3BHK", label: `3 BHK - ₹${formatPrice(pg.price_3bhk)}` });
      if (pg.price_4bhk > 0) types.push({ value: "4BHK", label: `4 BHK - ₹${formatPrice(pg.price_4bhk)}` });
    }
    return types;
  };

  const getSelectedPrice = () => {
    if (!bookingData.roomType) return null;
    const roomMap = {
      "Single Sharing": pg?.single_sharing, "Double Sharing": pg?.double_sharing,
      "Triple Sharing": pg?.triple_sharing, "Four Sharing": pg?.four_sharing,
      "Single Room": pg?.pg_category === "coliving" ? pg?.co_living_single_room : pg?.single_room,
      "Double Room": pg?.pg_category === "coliving" ? pg?.co_living_double_room : pg?.double_room,
      "1BHK": pg?.price_1bhk, "2BHK": pg?.price_2bhk, "3BHK": pg?.price_3bhk, "4BHK": pg?.price_4bhk
    };
    return roomMap[bookingData.roomType];
  };

  const selectedPrice = getSelectedPrice();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Book {pg?.pg_name}</h2>
          <button onClick={onClose} disabled={bookingLoading} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">You can only request this property once every 24 hours</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onBook(bookingData); }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in Date *</label>
              <input type="date" name="checkInDate" value={bookingData.checkInDate} 
                onChange={(e) => setBookingData(prev => ({ ...prev, checkInDate: e.target.value }))}
                required disabled={bookingLoading} min={getTomorrowDate()} max={getMaxDate()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <p className="text-xs text-gray-500 mt-1">Earliest check-in: tomorrow</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {pg?.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
              </label>
              <select name="roomType" value={bookingData.roomType}
                onChange={(e) => setBookingData(prev => ({ ...prev, roomType: e.target.value }))}
                required disabled={bookingLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select {pg?.pg_category === "to_let" ? "BHK Type" : "Room Type"}</option>
                {getRoomTypes().map((type, i) => (
                  <option key={i} value={type.value}>{type.label}</option>
                ))}
              </select>
              {selectedPrice > 0 && (
                <p className="text-sm font-medium text-green-600 mt-2">
                  Selected: {bookingData.roomType} - ₹{formatPrice(selectedPrice)}/month
                </p>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-blue-600" />
                <span className="font-medium text-blue-900">Booking Information</span>
              </div>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Your profile details will be auto-filled</li>
                <li>• Owner will contact within 24 hours</li>
                <li>• Confirmation via email/SMS</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={bookingLoading} 
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={bookingLoading}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-medium text-white hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
                {bookingLoading ? <><Loader size={18} className="animate-spin" /> Processing...</> : <><BookOpen size={18} /> Confirm</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ================= NEARBY PG CARD ================= */
const NearbyPGCard = ({ pg, onClick, currentLocation }) => {
  const distance = currentLocation?.lat && currentLocation?.lon && pg.latitude && pg.longitude
    ? calculateDistance(currentLocation.lat, currentLocation.lon, pg.latitude, pg.longitude)
    : null;

  const getStartingPrice = () => {
    if (!pg) return "—";
    const prices = pg.pg_category === "to_let" 
      ? [pg.price_1bhk, pg.price_2bhk, pg.price_3bhk, pg.price_4bhk]
      : pg.pg_category === "coliving"
      ? [pg.co_living_single_room, pg.co_living_double_room]
      : [pg.single_sharing, pg.double_sharing, pg.triple_sharing, pg.four_sharing, pg.single_room, pg.double_room];
    
    const validPrices = prices.filter(p => p && Number(p) > 0);
    return validPrices.length > 0 ? Math.min(...validPrices.map(Number)) : "—";
  };

  const imageUrl = pg.photos?.[0] ? getCorrectImageUrl(pg.photos[0]) : null;

  return (
    <div onClick={() => onClick(pg.id)} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
      <div className="relative h-40 bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt={pg.pg_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <Building size={40} className="text-blue-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {pg.pg_category === "to_let" ? "🏠 House" : pg.pg_category === "coliving" ? "🤝 Co-Living" : "🏢 PG"}
          </span>
        </div>
        {distance && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            📍 {distance.toFixed(1)} km
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 truncate">{pg.pg_name}</h4>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin size={12} /> {pg.area || pg.city || "Location"}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-xs text-gray-500">Starting from</p>
            <p className="text-lg font-bold text-blue-600">₹{formatPrice(getStartingPrice())}<span className="text-xs font-normal text-gray-500">/mo</span></p>
          </div>
          <div className="flex gap-1">
            {pg.ac_available && <span className="text-sm" title="AC">❄️</span>}
            {pg.wifi_available && <span className="text-sm" title="WiFi">📶</span>}
            {pg.food_available && <span className="text-sm" title="Food">🍽️</span>}
            {pg.parking_available && <span className="text-sm" title="Parking">🚗</span>}
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {pg.available_rooms > 0 ? `${pg.available_rooms} rooms available` : 'Fully booked'}
          </span>
          <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            View <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function PGDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pg, setPG] = useState(null);
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nearbyHighlights, setNearbyHighlights] = useState([]);
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India center
  const [mapZoom, setMapZoom] = useState(13);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch PG Details
  useEffect(() => {
    const fetchPG = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pg/${id}`);
        if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch property");
        
        const data = res.data.data;
        setPG(data);
        
        // Process media
        const photos = Array.isArray(data.photos) 
          ? data.photos.map(p => ({ type: "photo", src: getCorrectImageUrl(p) }))
          : [];
        let videos = [];
        try {
          if (data.videos) {
            videos = JSON.parse(data.videos || "[]").map(v => ({ type: "video", src: getCorrectImageUrl(v) }));
          }
        } catch (e) {}
        setMedia([...photos, ...videos]);
        
        if (data.latitude && data.longitude) {
          setMapCenter([data.latitude, data.longitude]);
        }
      } catch (err) {
        setError(err.message || "Failed to load property");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPG();
  }, [id]);

  // Fetch Nearby Data
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const fetchNearbyData = async () => {
      setLoadingNearby(true);
      try {
        // Fetch nearby PGs
        const nearbyRes = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
        if (nearbyRes.data?.success) {
          setNearbyPGs(nearbyRes.data.data.slice(0, 6));
        }

        // Process highlights from database
        const highlightFields = [
          'nearby_college', 'nearby_school', 'nearby_hospital', 'nearby_pharmacy',
          'nearby_bus_stop', 'nearby_railway_station', 'nearby_metro', 'nearby_bank',
          'nearby_atm', 'nearby_restaurant', 'nearby_supermarket', 'nearby_mall',
          'nearby_gym', 'nearby_park', 'nearby_police_station'
        ];
        
        const highlights = [];
        highlightFields.forEach(field => {
          if (pg[field]?.trim()) {
            highlights.push({
              name: pg[field],
              type: field.replace('nearby_', '').replace(/_/g, ' '),
              category: field.includes('college') || field.includes('school') ? 'education' :
                       field.includes('hospital') || field.includes('pharmacy') ? 'healthcare' :
                       field.includes('bus') || field.includes('railway') || field.includes('metro') ? 'transport' :
                       field.includes('bank') || field.includes('atm') ? 'finance' :
                       field.includes('restaurant') ? 'food' :
                       field.includes('supermarket') || field.includes('mall') ? 'shopping' :
                       field.includes('gym') || field.includes('park') ? 'recreation' : 'other'
            });
          }
        });
        setNearbyHighlights(highlights);
      } catch (err) {
        console.error("Error fetching nearby data:", err);
      } finally {
        setLoadingNearby(false);
      }
    };

    fetchNearbyData();
  }, [pg, id]);

  const handleBookNow = () => {
    if (!user) {
      showNotification("Please login to book this property");
      navigate("/login", { state: { redirectTo: `/pg/${id}` } });
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      setBookingLoading(true);
      const token = await user.getIdToken(true);
      const res = await api.post(`/bookings/${id}`, 
        { check_in_date: bookingData.checkInDate, room_type: bookingData.roomType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data?.alreadyBooked) {
        showNotification(res.data.message);
      } else {
        showNotification("✅ Booking request sent successfully!");
      }
      setShowBookingModal(false);
    } catch (error) {
      showNotification(error?.response?.data?.message || "❌ Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCallOwner = () => {
    if (pg?.contact_phone) {
      window.location.href = `tel:${pg.contact_phone}`;
    } else {
      showNotification("Contact number not available");
    }
  };

  const getStartingPrice = () => {
    if (!pg) return "—";
    const isToLet = pg.pg_category === "to_let";
    const isCoLiving = pg.pg_category === "coliving";
    
    const prices = isToLet ? [pg.price_1bhk, pg.price_2bhk, pg.price_3bhk, pg.price_4bhk] :
                   isCoLiving ? [pg.co_living_single_room, pg.co_living_double_room] :
                   [pg.single_sharing, pg.double_sharing, pg.triple_sharing, pg.four_sharing, pg.single_room, pg.double_room];
    
    const validPrices = prices.filter(p => p && Number(p) > 0);
    return validPrices.length > 0 ? Math.min(...validPrices.map(Number)) : "—";
  };

  // Get only TRUE house rules
  const getTrueRules = () => {
    if (!pg) return [];
    
    const rules = [
      { key: 'visitor_allowed', label: 'Visitors Allowed', icon: '👥', category: 'visitors' },
      { key: 'couple_allowed', label: 'Couples Allowed', icon: '❤️', category: 'visitors' },
      { key: 'family_allowed', label: 'Family Allowed', icon: '👨‍👩‍👧‍👦', category: 'visitors' },
      { key: 'smoking_allowed', label: 'Smoking Allowed', icon: '🚬', category: 'lifestyle' },
      { key: 'drinking_allowed', label: 'Drinking Allowed', icon: '🍺', category: 'lifestyle' },
      { key: 'outside_food_allowed', label: 'Outside Food Allowed', icon: '🍕', category: 'lifestyle' },
      { key: 'parties_allowed', label: 'Parties Allowed', icon: '🎉', category: 'lifestyle' },
      { key: 'pets_allowed', label: 'Pets Allowed', icon: '🐕', category: 'pets' },
      { key: 'late_night_entry_allowed', label: 'Late Night Entry Allowed', icon: '🌙', category: 'entry' },
      { key: 'loud_music_restricted', label: 'Loud Music Restricted', icon: '🔇', category: 'restrictions' },
      { key: 'office_going_only', label: 'Office Going Only', icon: '💼', category: 'restrictions' },
      { key: 'students_only', label: 'Students Only', icon: '🎓', category: 'restrictions' },
      { key: 'boys_only', label: 'Boys Only', icon: '👨', category: 'restrictions' },
      { key: 'girls_only', label: 'Girls Only', icon: '👩', category: 'restrictions' },
      { key: 'subletting_allowed', label: 'Subletting Allowed', icon: '🔄', category: 'legal' },
      { key: 'lock_in_period', label: `Lock-in Period: ${pg.lock_in_period} months`, icon: '🔒', category: 'legal', hasValue: true },
      { key: 'agreement_mandatory', label: 'Agreement Mandatory', icon: '📝', category: 'legal' },
      { key: 'id_proof_mandatory', label: 'ID Proof Mandatory', icon: '🆔', category: 'legal' }
    ];
    
    return rules.filter(rule => {
      if (rule.hasValue) return pg[rule.key] && pg[rule.key] !== "0";
      return pg[rule.key] === true || pg[rule.key] === "true" || pg[rule.key] === 1;
    });
  };

  const getTrueFacilities = () => {
    if (!pg) return [];
    
    const facilities = [
      { key: 'ac_available', label: 'Air Conditioning', icon: '❄️' },
      { key: 'wifi_available', label: 'WiFi Internet', icon: '📶' },
      { key: 'food_available', label: 'Food Available', icon: '🍽️' },
      { key: 'parking_available', label: 'Car Parking', icon: '🚗' },
      { key: 'bike_parking', label: 'Bike Parking', icon: '🏍️' },
      { key: 'laundry_available', label: 'Laundry Service', icon: '🧺' },
      { key: 'washing_machine', label: 'Washing Machine', icon: '🧼' },
      { key: 'refrigerator', label: 'Refrigerator', icon: '🧊' },
      { key: 'microwave', label: 'Microwave', icon: '🍳' },
      { key: 'geyser', label: 'Geyser', icon: '🚿' },
      { key: 'power_backup', label: 'Power Backup', icon: '🔋' },
      { key: 'lift_elevator', label: 'Lift/Elevator', icon: '⬆️' },
      { key: 'cctv', label: 'CCTV Surveillance', icon: '📹' },
      { key: 'security_guard', label: 'Security Guard', icon: '🛡️' },
      { key: 'gym', label: 'Gym/Fitness', icon: '🏋️' },
      { key: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
      { key: 'water_purifier', label: 'RO Water Purifier', icon: '💧' },
      { key: 'fire_safety', label: 'Fire Safety', icon: '🔥' },
      { key: 'study_room', label: 'Study Room', icon: '📚' },
      { key: 'common_tv_lounge', label: 'TV Lounge', icon: '📺' },
      { key: 'cupboard_available', label: 'Cupboard/Wardrobe', icon: '👔' },
      { key: 'table_chair_available', label: 'Study Table & Chair', icon: '💺' },
      { key: 'attached_bathroom', label: 'Attached Bathroom', icon: '🚽' },
      { key: 'balcony_available', label: 'Balcony', icon: '🌿' },
      { key: 'bed_with_mattress', label: 'Bed with Mattress', icon: '🛏️' },
      { key: 'kitchen_room', label: 'Kitchen Room', icon: '🍳' },
      { key: 'water_24x7', label: '24x7 Water Supply', icon: '💦' }
    ];
    
    return facilities.filter(f => pg[f.key] === true || pg[f.key] === "true" || pg[f.key] === 1);
  };

  const trueRules = getTrueRules();
  const trueFacilities = getTrueFacilities();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏚️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "This property doesn't exist or has been removed."}</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentMedia = media[currentIndex];
  const isToLet = pg.pg_category === "to_let";
  const isCoLiving = pg.pg_category === "coliving";
  const startingPrice = getStartingPrice();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slideIn">
          {notification.includes("✅") ? <CheckCircle size={18} className="text-green-400" /> :
           notification.includes("❌") ? <AlertCircle size={18} className="text-red-400" /> :
           <Info size={18} className="text-blue-400" />}
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[60%]">{pg.pg_name}</h1>
          <div className="flex gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-full"><Heart size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full"><Share2 size={20} /></button>
          </div>
        </div>
      </header>

      {/* Media Gallery */}
      <div className="relative">
        {media.length > 0 ? (
          <div className={`relative ${fullscreenImage ? 'fixed inset-0 z-50 bg-black' : 'h-[300px] md:h-[450px]'}`}>
            {currentMedia.type === "photo" ? (
              <img src={currentMedia.src} alt={pg.pg_name} 
                className={`w-full h-full ${fullscreenImage ? 'object-contain' : 'object-cover'}`}
                onClick={() => setFullscreenImage(!fullscreenImage)} />
            ) : (
              <video src={currentMedia.src} controls className="w-full h-full object-cover" />
            )}
            
            {media.length > 1 && (
              <>
                <button onClick={() => setCurrentIndex(i => i === 0 ? media.length - 1 : i - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setCurrentIndex(i => (i + 1) % media.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {media.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-6' : 'bg-white/60'}`} />
              ))}
            </div>
            
            <button onClick={() => setFullscreenImage(!fullscreenImage)}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white">
              {fullscreenImage ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        ) : (
          <div className="h-[300px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Building size={64} className="text-white/80" />
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
              {isToLet ? "🏠 House/Flat" : isCoLiving ? "🤝 Co-Living" : "🏢 PG/Hostel"}
            </span>
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              {getPGCode(pg.id)}
            </span>
            {pg.available_rooms > 0 ? (
              <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                {pg.available_rooms} Available
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                Fully Occupied
              </span>
            )}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{pg.pg_name}</h1>
          <p className="text-gray-600 flex items-start gap-2 mt-2">
            <MapPin size={18} className="shrink-0 mt-0.5" />
            <span>{pg.address || [pg.area, pg.city, pg.state].filter(Boolean).join(', ')}</span>
          </p>
          {pg.landmark && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1 ml-6">
              <Navigation size={14} /> Near {pg.landmark}
            </p>
          )}
          
          {/* Price */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Starting from</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{formatPrice(startingPrice)}<span className="text-base font-normal text-gray-500">/month</span>
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-5">
            <button onClick={handleBookNow} 
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <BookOpen size={18} /> Book Now
            </button>
            <button onClick={handleCallOwner}
              className="flex-1 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2">
              <Phone size={18} /> Call
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-6">
          {['overview', 'facilities', 'rules', 'location'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-medium text-sm capitalize transition ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-5">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {pg.description && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">About this property</h3>
                  <p className="text-gray-700 leading-relaxed">{pg.description}</p>
                </div>
              )}
              
              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl mb-1">🛏️</div>
                  <p className="text-sm text-gray-500">Total Rooms</p>
                  <p className="text-xl font-semibold">{pg.total_rooms || "—"}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl mb-1">🚻</div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="text-xl font-semibold">{pg.bathrooms || "—"}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl mb-1">📐</div>
                  <p className="text-sm text-gray-500">Room Size</p>
                  <p className="text-xl font-semibold">{pg.room_size || "—"} {pg.room_size ? 'sq.ft' : ''}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl mb-1">🏢</div>
                  <p className="text-sm text-gray-500">Floor</p>
                  <p className="text-xl font-semibold">{pg.floor_number || "—"} {pg.total_floors ? `/ ${pg.total_floors}` : ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Facilities Tab */}
          {activeTab === "facilities" && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Amenities & Facilities</h3>
              {trueFacilities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {trueFacilities.map((facility, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-xl">{facility.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{facility.label}</span>
                      <Check size={16} className="text-green-600 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No facilities listed</p>
              )}
            </div>
          )}

          {/* Rules Tab - Only True Rules */}
          {activeTab === "rules" && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">House Rules</h3>
              {trueRules.length > 0 ? (
                <div className="space-y-3">
                  {trueRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <span className="text-2xl">{rule.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{rule.label}</p>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Allowed</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No specific rules listed</p>
              )}
              
              {pg.entry_curfew_time && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="font-medium text-amber-800">⏰ Entry Curfew: {pg.entry_curfew_time}</p>
                </div>
              )}
              {pg.min_stay_months && (
                <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-medium text-blue-800">🔒 Minimum Stay: {pg.min_stay_months} months</p>
                </div>
              )}
            </div>
          )}

          {/* Location Tab */}
          {activeTab === "location" && (
            <div className="space-y-5">
              {/* Map */}
              {pg.latitude && pg.longitude && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">📍 Location</h3>
                  <div className="h-64 rounded-xl overflow-hidden">
                    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[pg.latitude, pg.longitude]} icon={propertyIcon}>
                        <Popup>{pg.pg_name}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                  <button onClick={() => window.open(`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}`, "_blank")}
                    className="mt-3 w-full py-3 border border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 flex items-center justify-center gap-2">
                    <Navigation size={16} /> Get Directions
                  </button>
                </div>
              )}

              {/* Nearby Highlights */}
              {nearbyHighlights.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">🗺️ Nearby Places</h3>
                  <div className="space-y-2">
                    {nearbyHighlights.slice(0, 6).map((h, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <span className="text-xl">📍</span>
                        <div>
                          <p className="font-medium text-gray-900">{h.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{h.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nearby Properties Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🏘️ Similar Properties Nearby</h2>
            <button onClick={() => navigate('/properties')} className="text-blue-600 text-sm font-medium flex items-center gap-1">
              View all <ArrowRight size={16} />
            </button>
          </div>
          
          {loadingNearby ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : nearbyPGs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nearbyPGs.map((nearbyPg) => (
                <NearbyPGCard 
                  key={nearbyPg.id} 
                  pg={nearbyPg} 
                  onClick={(pgId) => navigate(`/pg/${pgId}`)}
                  currentLocation={{ lat: pg.latitude, lon: pg.longitude }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <Building size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No nearby properties found</p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Interested in this property?</h3>
              <p className="text-blue-100">Book now or contact the owner directly</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCallOwner}
                className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2">
                <Phone size={18} /> Call Owner
              </button>
              <button onClick={handleBookNow}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition flex items-center gap-2">
                <BookOpen size={18} /> Book Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Starting from</p>
            <p className="text-xl font-bold text-gray-900">₹{formatPrice(startingPrice)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
          </div>
          <button onClick={handleBookNow} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold">
            Book Now
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal pg={pg} onClose={() => setShowBookingModal(false)} onBook={handleBookingSubmit} bookingLoading={bookingLoading} />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}