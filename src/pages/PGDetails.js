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
  X, MapPin, Phone, Home, Users, Bed, Bath, Wifi, Car, Shield,
  Calendar, Clock, UserCheck, BookOpen, Info, Heart, Share2,
  ChevronLeft, ChevronRight, Check, Coffee, Utensils, Snowflake,
  Navigation, Star, DollarSign, Key, DoorOpen, Sofa, Flame, Leaf,
  Zap, Building, Hash, Sun, Moon, Tv, Wind, Sparkles, Pill, Dumbbell,
  Wrench, ArrowRight, AlertCircle, CheckCircle, Loader
} from "lucide-react";

/* ================= LEAFLET FIX ================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Base URL for images
const BASE_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "https://nepxall-backend.onrender.com";

// Helper function to get correct image URL
const getCorrectImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  if (photo.includes('/uploads/')) {
    const uploadsIndex = photo.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = photo.substring(uploadsIndex);
      return `${BASE_URL}${relativePath}`;
    }
  }
  const normalizedPath = photo.startsWith('/') ? photo : `/${photo}`;
  return `${BASE_URL}${normalizedPath}`;
};

// Safe price formatting function
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

// Custom Marker Icon for Map
const customIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
      if (pg.single_sharing && Number(pg.single_sharing) > 0) types.push({ value: "Single Sharing", label: `Single Sharing - ₹${formatPrice(pg.single_sharing)}` });
      if (pg.double_sharing && Number(pg.double_sharing) > 0) types.push({ value: "Double Sharing", label: `Double Sharing - ₹${formatPrice(pg.double_sharing)}` });
      if (pg.triple_sharing && Number(pg.triple_sharing) > 0) types.push({ value: "Triple Sharing", label: `Triple Sharing - ₹${formatPrice(pg.triple_sharing)}` });
      if (pg.four_sharing && Number(pg.four_sharing) > 0) types.push({ value: "Four Sharing", label: `Four Sharing - ₹${formatPrice(pg.four_sharing)}` });
      if (pg.single_room && Number(pg.single_room) > 0) types.push({ value: "Single Room", label: `Single Room - ₹${formatPrice(pg.single_room)}` });
      if (pg.double_room && Number(pg.double_room) > 0) types.push({ value: "Double Room", label: `Double Room - ₹${formatPrice(pg.double_room)}` });
    } else if (pg?.pg_category === "coliving") {
      if (pg.co_living_single_room && Number(pg.co_living_single_room) > 0) types.push({ value: "Single Room", label: `Co-Living Single Room - ₹${formatPrice(pg.co_living_single_room)}` });
      if (pg.co_living_double_room && Number(pg.co_living_double_room) > 0) types.push({ value: "Double Room", label: `Co-Living Double Room - ₹${formatPrice(pg.co_living_double_room)}` });
    } else if (pg?.pg_category === "to_let") {
      if (pg.price_1bhk && Number(pg.price_1bhk) > 0) types.push({ value: "1BHK", label: `1 BHK - ₹${formatPrice(pg.price_1bhk)}` });
      if (pg.price_2bhk && Number(pg.price_2bhk) > 0) types.push({ value: "2BHK", label: `2 BHK - ₹${formatPrice(pg.price_2bhk)}` });
      if (pg.price_3bhk && Number(pg.price_3bhk) > 0) types.push({ value: "3BHK", label: `3 BHK - ₹${formatPrice(pg.price_3bhk)}` });
      if (pg.price_4bhk && Number(pg.price_4bhk) > 0) types.push({ value: "4BHK", label: `4 BHK - ₹${formatPrice(pg.price_4bhk)}` });
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Book {pg?.pg_name}</h2>
            <button onClick={onClose} disabled={bookingLoading} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">You can only request this PG once every 24 hours</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in Date *</label>
              <input
                type="date"
                name="checkInDate"
                value={bookingData.checkInDate}
                onChange={handleInputChange}
                required
                disabled={bookingLoading}
                min={getTomorrowDate()}
                max={getMaxDate()}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Earliest check-in: tomorrow</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {pg?.pg_category === "to_let" ? "BHK Type *" : "Room Type *"}
              </label>
              <select
                name="roomType"
                value={bookingData.roomType}
                onChange={handleInputChange}
                required
                disabled={bookingLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select {pg?.pg_category === "to_let" ? "BHK Type" : "Room Type"}</option>
                {getRoomTypes().map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
              {selectedPrice !== null && selectedPrice > 0 && (
                <p className="text-sm font-medium text-green-600 mt-2">
                  Selected: {bookingData.roomType} - ₹{formatPrice(selectedPrice)}/month
                </p>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-blue-600" />
                <span className="font-medium text-blue-900">Booking Information</span>
              </div>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Your profile details will be auto-filled</li>
                <li>• Register number auto-generated</li>
                <li>• Owner will contact within 24 hours</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={bookingLoading} className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={bookingLoading} className="flex-1 py-2.5 px-4 bg-blue-600 rounded-xl font-medium text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {bookingLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <BookOpen size={18} />
                    Confirm
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

// Helper Components
const Section = ({ title, children, hasContent = true, badgeCount }) =>
  hasContent ? (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{badgeCount}</span>
        )}
      </div>
      {children}
    </div>
  ) : null;

const FacilityItem = ({ icon, label, active = true }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
    <span className="text-2xl">{icon}</span>
    <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
    {active && <Check size={16} className="text-green-600" />}
  </div>
);

const RuleItem = ({ icon, label, allowed, description }) => (
  <div className={`flex gap-3 p-3 rounded-xl border ${allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      <span className="text-sm">{icon}</span>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className={`font-medium ${allowed ? 'text-green-800' : 'text-red-800'}`}>{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${allowed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          {allowed ? 'Allowed' : 'Not Allowed'}
        </span>
      </div>
      {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
    </div>
  </div>
);

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
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <span className="text-4xl opacity-40">💰</span>
        <p className="text-gray-500 mt-2">Price details not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isToLet && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><span>🏠</span>House/Flat Rental Prices</h4>
          <div className="grid grid-cols-2 gap-3">
            {pg.price_1bhk && pg.price_1bhk !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">1 BHK</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.price_1bhk)}/mo</div>
              </div>
            )}
            {pg.price_2bhk && pg.price_2bhk !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">2 BHK</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.price_2bhk)}/mo</div>
              </div>
            )}
            {pg.price_3bhk && pg.price_3bhk !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">3 BHK</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.price_3bhk)}/mo</div>
              </div>
            )}
            {pg.price_4bhk && pg.price_4bhk !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">4 BHK</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.price_4bhk)}/mo</div>
              </div>
            )}
          </div>
        </div>
      )}

      {isCoLiving && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><span>🤝</span>Co-Living Prices</h4>
          <div className="grid grid-cols-2 gap-3">
            {pg.co_living_single_room && pg.co_living_single_room !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Single Room</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.co_living_single_room)}/mo</div>
              </div>
            )}
            {pg.co_living_double_room && pg.co_living_double_room !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Double Room</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.co_living_double_room)}/mo</div>
              </div>
            )}
          </div>
        </div>
      )}

      {isPG && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><span>🏢</span>PG/Hostel Room Prices</h4>
          <div className="grid grid-cols-2 gap-3">
            {pg.single_sharing && pg.single_sharing !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Single Sharing</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.single_sharing)}/mo</div>
              </div>
            )}
            {pg.double_sharing && pg.double_sharing !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Double Sharing</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.double_sharing)}/mo</div>
              </div>
            )}
            {pg.triple_sharing && pg.triple_sharing !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Triple Sharing</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.triple_sharing)}/mo</div>
              </div>
            )}
            {pg.four_sharing && pg.four_sharing !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Four Sharing</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.four_sharing)}/mo</div>
              </div>
            )}
            {pg.single_room && pg.single_room !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Single Room</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.single_room)}/mo</div>
              </div>
            )}
            {pg.double_room && pg.double_room !== "0" && (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <div className="text-sm text-gray-500">Double Room</div>
                <div className="font-semibold text-gray-900">{formatPriceLocal(pg.double_room)}/mo</div>
              </div>
            )}
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
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState([0, 0]);

  const showNotificationMessage = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch PG Details
  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/pg/${id}`);
        if (!res.data?.success) throw new Error(res.data?.message || "Failed to fetch property details");
        const data = res.data.data;

        const photos = Array.isArray(data.photos)
          ? data.photos.map(p => ({ type: "photo", src: getCorrectImageUrl(p) }))
          : [];

        let videos = [];
        try {
          if (data.videos) {
            videos = JSON.parse(data.videos || "[]").map(v => ({ type: "video", src: getCorrectImageUrl(v) }));
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
    if (id) fetchPGDetails();
    else {
      setError("Invalid property ID");
      setLoading(false);
    }
  }, [id]);

  // Fetch Nearby Data
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

    const processDBHighlights = () => {
      const highlights = [];
      const highlightFields = [
        'nearby_college', 'nearby_school', 'nearby_it_park', 'nearby_office_hub',
        'nearby_metro', 'nearby_bus_stop', 'nearby_railway_station',
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
            source: "database",
            coordinates: [pg.latitude + (Math.random() * 0.02 - 0.01), pg.longitude + (Math.random() * 0.02 - 0.01)]
          });
        }
      });
      return highlights;
    };

    const dbHighlights = processDBHighlights();
    setNearbyHighlights(dbHighlights);

    const fetchNearbyPGs = async () => {
      try {
        setLoadingNearbyPGs(true);
        const response = await api.get(`/pg/nearby/${pg.latitude}/${pg.longitude}?radius=5&exclude=${id}`);
        if (response.data?.success) {
          setNearbyPGs(response.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching nearby PGs:", err);
        setNearbyPGs([]);
      } finally {
        setLoadingNearbyPGs(false);
      }
    };
    fetchNearbyPGs();
  }, [pg, id]);

  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const hasOwnerContact = pg?.contact_phone && pg.contact_phone.trim() !== "";
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
    if (!user) {
      showNotificationMessage("Please register or login to book this property");
      navigate("/register", { state: { redirectTo: `/pg/${id}` } });
      return;
    }
    setShowBookingModal(true);
  };

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
      const payload = { check_in_date: bookingData.checkInDate, room_type: bookingData.roomType };
      const res = await api.post(`/bookings/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.alreadyBooked) {
        showNotificationMessage(res.data.message);
        setShowBookingModal(false);
        return;
      }
      showNotificationMessage(res.data?.message || "✅ Booking request sent to owner");
      setShowBookingModal(false);
    } catch (error) {
      if (error?.response?.data?.message) {
        showNotificationMessage(error.response.data.message);
      } else {
        showNotificationMessage("❌ Booking failed. Try again");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCallOwner = () => {
    if (hasOwnerContact && pg?.contact_phone) {
      window.location.href = `tel:${pg.contact_phone}`;
    } else {
      showNotificationMessage("Owner contact will be visible after booking approval");
    }
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
      { key: "water_24x7", label: "24×7 Water Supply", icon: "💦", category: "basic" },
    ];
  };

  const getFilteredFacilities = () => {
    const allFacilities = getAllFacilities();
    const trueFacilities = allFacilities.filter(facility =>
      pg && (pg[facility.key] === true || pg[facility.key] === "true" || pg[facility.key] === 1)
    );
    if (selectedFacilityCategory === "all") return trueFacilities;
    return trueFacilities.filter(facility => facility.category === selectedFacilityCategory);
  };

  const hasRulesContent = () => {
    if (!pg) return false;
    const rulesToCheck = ['visitor_allowed', 'couple_allowed', 'smoking_allowed', 'drinking_allowed', 'pets_allowed'];
    return rulesToCheck.some(rule => pg[rule] === true || pg[rule] === "true" || pg[rule] === "false");
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The property you're looking for doesn't exist."}</p>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const current = media[index];
  const filteredFacilities = getFilteredFacilities();

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

      {/* Hero Slider */}
      <div className="relative">
        {media.length > 0 ? (
          <div className="relative h-[400px] md:h-[500px] bg-gray-900">
            {current.type === "photo" ? (
              <img src={current.src} alt={pg.pg_name} className="w-full h-full object-cover" />
            ) : (
              <video src={current.src} controls className="w-full h-full object-cover" />
            )}
            {media.length > 1 && (
              <>
                <button onClick={() => setIndex(i => (i === 0 ? media.length - 1 : i - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setIndex(i => (i + 1) % media.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white">
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  {index + 1} / {media.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-[300px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <Building size={48} className="mx-auto opacity-80" />
              <p className="mt-2 text-lg font-medium">No photos available</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{pg.pg_name}</h1>
              <p className="text-gray-600 flex items-center gap-1 mt-1">
                <MapPin size={16} /> {pg.address || `${pg.area}, ${pg.city}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Heart size={20} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
              {isToLet ? "🏠 House/Flat" : isCoLiving ? "🤝 Co-Living" : "🏢 PG/Hostel"}
            </span>
            {pg.available_rooms > 0 ? (
              <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                🟢 {pg.available_rooms} Available
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                🔴 Fully Occupied
              </span>
            )}
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              {getPGCode(pg.id)}
            </span>
          </div>

          {/* Price & Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Starting from</p>
              <p className="text-xl font-bold text-gray-900">₹{formatPrice(getStartingPrice())}</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Total Rooms</p>
              <p className="text-xl font-bold text-gray-900">{pg.total_rooms || "—"}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Facilities</p>
              <p className="text-xl font-bold text-gray-900">{filteredFacilities.length}+</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">Nearby Places</p>
              <p className="text-xl font-bold text-gray-900">{nearbyHighlights.length}+</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={handleBookNow} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <BookOpen size={18} /> Book Now
            </button>
            {hasOwnerContact && (
              <button onClick={handleCallOwner} className="flex-1 md:flex-none border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Phone size={18} /> Call Owner
              </button>
            )}
            {hasLocation && (
              <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`, "_blank")} className="flex-1 md:flex-none border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Navigation size={18} /> Directions
              </button>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {pg.description && (
              <Section title="📝 About this Property">
                <p className="text-gray-700 leading-relaxed">{pg.description}</p>
              </Section>
            )}

            {/* Price Details */}
            <Section title="💰 Price Details">
              <PriceDetails pg={pg} />
            </Section>

            {/* Facilities */}
            <Section title={`🏠 Facilities & Amenities`} badgeCount={filteredFacilities.length}>
              <div className="flex flex-wrap gap-2 mb-4">
                {["all", "room", "kitchen", "safety", "common", "basic"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFacilityCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedFacilityCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFacilities.map((facility, idx) => (
                  <FacilityItem key={idx} icon={facility.icon} label={facility.label} active={true} />
                ))}
              </div>
            </Section>

            {/* Rules */}
            {hasRulesContent() && (
              <Section title="📜 House Rules">
                <div className="space-y-3">
                  {pg.visitor_allowed !== undefined && (
                    <RuleItem icon="👥" label="Visitors Allowed" allowed={pg.visitor_allowed === true || pg.visitor_allowed === "true"} />
                  )}
                  {pg.couple_allowed !== undefined && (
                    <RuleItem icon="❤️" label="Couples Allowed" allowed={pg.couple_allowed === true || pg.couple_allowed === "true"} />
                  )}
                  {pg.smoking_allowed !== undefined && (
                    <RuleItem icon="🚬" label="Smoking Allowed" allowed={pg.smoking_allowed === true || pg.smoking_allowed === "true"} />
                  )}
                  {pg.drinking_allowed !== undefined && (
                    <RuleItem icon="🍺" label="Drinking Allowed" allowed={pg.drinking_allowed === true || pg.drinking_allowed === "true"} />
                  )}
                  {pg.pets_allowed !== undefined && (
                    <RuleItem icon="🐕" label="Pets Allowed" allowed={pg.pets_allowed === true || pg.pets_allowed === "true"} />
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column - Map, Contact, Nearby */}
          <div className="space-y-6">
            {/* Map */}
            {hasLocation && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">📍 Location</h3>
                <div className="h-48 rounded-xl overflow-hidden">
                  <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[pg.latitude, pg.longitude]} icon={customIcon}>
                      <Popup>{pg.pg_name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="font-medium">Area:</span> {pg.area || pg.city}</p>
                  {pg.landmark && <p><span className="font-medium">Landmark:</span> {pg.landmark}</p>}
                </div>
              </div>
            )}

            {/* Nearby Highlights */}
            {nearbyHighlights.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">🗺️ Nearby Places</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {nearbyHighlights.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
                      <span className="text-lg">📍</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{h.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{h.type.replace(/_/g, ' ').replace('nearby ', '')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby PGs */}
            {nearbyPGs.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">🏘️ Nearby Properties</h3>
                <div className="space-y-3">
                  {nearbyPGs.slice(0, 3).map((p) => (
                    <div key={p.id} onClick={() => navigate(`/pg/${p.id}`)} className="flex gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center text-2xl">
                        🏠
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.pg_name}</p>
                        <p className="text-xs text-gray-500">{p.area || p.city}</p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">₹{formatPrice(p.price_1bhk || p.single_sharing || "0")}/mo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Card */}
            {(hasOwnerContact || pg?.contact_person) && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">📞 Contact</h3>
                {pg.contact_person && <p className="text-gray-700">{pg.contact_person}</p>}
                {hasOwnerContact && (
                  <a href={`tel:${pg.contact_phone}`} className="text-blue-600 font-medium text-lg mt-1 block">{pg.contact_phone}</a>
                )}
                <button onClick={handleCallOwner} className="w-full mt-4 bg-blue-50 text-blue-700 py-2 rounded-xl font-medium hover:bg-blue-100 transition-colors">
                  Call Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Starting from</p>
            <p className="text-xl font-bold text-gray-900">₹{formatPrice(getStartingPrice())}<span className="text-sm font-normal text-gray-500">/month</span></p>
          </div>
          <div className="flex gap-3">
            {hasOwnerContact && (
              <button onClick={handleCallOwner} className="px-6 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">
                Call
              </button>
            )}
            <button onClick={handleBookNow} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal pg={pg} onClose={() => setShowBookingModal(false)} onBook={handleBookingSubmit} bookingLoading={bookingLoading} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}