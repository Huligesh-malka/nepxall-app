import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import api, { pgAPI } from "../api/api";
import { getImageUrl } from "../config";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const userLocationIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map components
function UserLocationMarker({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation && map) map.setView([userLocation.lat, userLocation.lng], 16);
  }, [userLocation, map]);
  if (!userLocation) return null;
  return <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
    <Popup>📍 Your Current Location</Popup>
  </Marker>;
}

function LocationMarker({ onLocationSelect, selectedLocation }) {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  const lat = parseFloat(selectedLocation?.lat);
  const lng = parseFloat(selectedLocation?.lng);
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
  return <Marker position={[lat, lng]} icon={selectedLocationIcon}>
    <Popup>📍 Selected Property Location</Popup>
  </Marker>;
}

// Initial form state
const initialForm = {
  owner_id: "",
  pg_name: "",
  pg_type: "boys",
  pg_category: "pg",
  
  bhk_type: "1",
  furnishing_type: "unfurnished",
  
  food_available: false,
  food_type: "veg",
  meals_per_day: "",
  ac_available: false,
  wifi_available: false,
  tv: false,
  parking_available: false,
  bike_parking: false,
  laundry_available: false,
  washing_machine: false,
  refrigerator: false,
  microwave: false,
  geyser: false,
  power_backup: false,
  lift_elevator: false,
  cctv: false,
  security_guard: false,
  gym: false,
  housekeeping: false,
  water_purifier: false,
  fire_safety: false,
  study_room: false,
  common_tv_lounge: false,
  balcony_open_space: false,
  water_24x7: false,
  water_type: "borewell",
  
  cupboard_available: false,
  table_chair_available: false,
  dining_table_available: false,
  attached_bathroom: false,
  balcony_available: false,
  wall_mounted_clothes_hook: false,
  bed_with_mattress: false,
  fan_light: false,
  kitchen_room: false,
  
  // Co-Living Inclusions (now manually editable)
  co_living_fully_furnished: false,
  co_living_food_included: false,
  co_living_wifi_included: false,
  co_living_housekeeping: false,
  co_living_power_backup: false,
  co_living_maintenance: false,
  
  visitor_allowed: false,
  visitor_time_restricted: false,
  visitors_allowed_till: "",
  couple_allowed: false,
  family_allowed: false,
  smoking_allowed: false,
  drinking_allowed: false,
  pets_allowed: false,
  late_night_entry_allowed: false,
  entry_curfew_time: "",
  outside_food_allowed: false,
  parties_allowed: false,
  loud_music_restricted: false,
  lock_in_period: false,
  min_stay_months: "0",
  notice_period: "1",
  agreement_mandatory: true,
  id_proof_mandatory: false,
  office_going_only: false,
  students_only: false,
  boys_only: false,
  girls_only: false,
  co_living_allowed: false,
  subletting_allowed: false,
  
  security_deposit: "",
  maintenance_amount: "",
  total_rooms: "",
  available_rooms: "",
  description: "",
  contact_person: "",
  contact_email: "",
  contact_phone: "",
};

const initialRoomRates = {
  single_sharing: "",
  double_sharing: "",
  triple_sharing: "",
  four_sharing: "",
  single_room: "",
  double_room: "",
  triple_room: "",
  price_1bhk: "",
  price_2bhk: "",
  price_3bhk: "",
  price_4bhk: "",
  co_living_single_room: "",
  co_living_double_room: "",
};

const initialBhkConfig = {
  bedrooms_1bhk: "",
  bathrooms_1bhk: "",
  bedrooms_2bhk: "",
  bathrooms_2bhk: "",
  bedrooms_3bhk: "",
  bathrooms_3bhk: "",
  bedrooms_4bhk: "",
  bathrooms_4bhk: "",
};

const initialLocation = {
  address: "",
  area: "",
  road: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
  lat: 12.9716,
  lng: 77.5946
};

function OwnerAddPG() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [photos, setPhotos] = useState([]);
  const [roomRates, setRoomRates] = useState(initialRoomRates);
  const [bhkConfig, setBhkConfig] = useState(initialBhkConfig);
  const [form, setForm] = useState(initialForm);
  const [manualEditMode, setManualEditMode] = useState(false);
  
  // Plan state
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  
  // Validation error states (for red warnings)
  const [validationErrors, setValidationErrors] = useState({});
  
  const mapRef = useRef(null);

  const isToLet = form.pg_category === "to_let";
  const isPG = form.pg_category === "pg";
  const isCoLiving = form.pg_category === "coliving";

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Auth & load plan
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (user && role === "owner") {
      setForm(prev => ({ 
        ...prev, 
        owner_id: user.uid,
        contact_email: user.email || prev.contact_email,
        contact_person: user.displayName || prev.contact_person,
        contact_phone: user.phoneNumber || prev.contact_phone
      }));
    }
  }, [user, role, authLoading, navigate]);

  const loadUserPlan = async () => {
    try {
      setPlanLoading(true);
      const response = await pgAPI.getPlan();
      setPlan(response.data);
    } catch (err) {
      console.error("Failed to load plan:", err);
      setPlan(null);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === "owner") loadUserPlan();
  }, [user, role]);

  // Gender / type sync
  useEffect(() => {
    if (form.boys_only) setForm(prev => ({ ...prev, pg_type: "boys" }));
    else if (form.girls_only) setForm(prev => ({ ...prev, pg_type: "girls" }));
    else if (form.co_living_allowed) setForm(prev => ({ ...prev, pg_type: "coliving" }));
  }, [form.boys_only, form.girls_only, form.co_living_allowed]);

  // Helper: fetch address with English language forced
  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      setMapLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await response.json();
      if (data) {
        const addressParts = data.address || {};
        setSelectedLocation(prev => ({
          ...prev,
          address: data.display_name || "",
          area: addressParts.neighbourhood || addressParts.suburb || addressParts.village || "",
          road: addressParts.road || "",
          landmark: addressParts.amenity || "",
          city: addressParts.city || addressParts.town || addressParts.county || "",
          state: addressParts.state || "",
          pincode: addressParts.postcode || "",
          country: addressParts.country || "",
          lat: lat,
          lng: lng
        }));
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setSelectedLocation(prev => ({ ...prev, lat, lng }));
    } finally {
      setMapLoading(false);
    }
  };

  // Get user location and fetch English address
  const getUserCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        await fetchAddressFromCoordinates(latitude, longitude);
        if (mapRef.current) mapRef.current.setView([latitude, longitude], 16);
        setGettingLocation(false);
      },
      (error) => {
        console.error(error);
        setGettingLocation(false);
        alert("Could not get your location. Please allow location access.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  // Search location (English only)
  const searchLocation = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    try {
      setMapLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=en`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const loc = data[0];
        const lat = parseFloat(loc.lat);
        const lng = parseFloat(loc.lon);
        setSelectedLocation(prev => ({ ...prev, lat, lng }));
        await fetchAddressFromCoordinates(lat, lng);
        if (mapRef.current) mapRef.current.setView([lat, lng], 16);
      } else {
        alert("Location not found. Try a different search.");
      }
    } catch (error) {
      console.error(error);
      alert("Error searching location.");
    } finally {
      setMapLoading(false);
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    await fetchAddressFromCoordinates(lat, lng);
    setSelectedLocation(prev => ({ ...prev, lat, lng }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "boys_only" && checked) {
      setForm(prev => ({ ...prev, boys_only: true, girls_only: false, co_living_allowed: false }));
    } else if (name === "girls_only" && checked) {
      setForm(prev => ({ ...prev, girls_only: true, boys_only: false, co_living_allowed: false }));
    } else if (name === "co_living_allowed" && checked) {
      setForm(prev => ({ ...prev, co_living_allowed: true, boys_only: false, girls_only: false }));
    } else {
      setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    }
    // Clear validation error for this field if any
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleRateChange = (e) => {
    const { name, value } = e.target;
    setRoomRates(prev => ({ ...prev, [name]: value }));
  };

  const handleBhkConfigChange = (e) => {
    const { name, value } = e.target;
    setBhkConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setSelectedLocation(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (plan && photos.length + files.length > plan.max_photos_per_pg) {
      alert(`❌ Your ${plan.name} plan allows only ${plan.max_photos_per_pg} photos per PG. Upgrade to upload more!`);
      return;
    }
    if (photos.length + files.length > 10) {
      alert("Maximum 10 photos allowed");
      return;
    }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeHostelLocation = () => {
    setSelectedLocation(initialLocation);
    setValidationErrors(prev => ({ ...prev, address: false }));
  };

  // Validate form and mark missing fields
  const validateForm = () => {
    const errors = {};
    if (!form.pg_name?.trim()) errors.pg_name = true;
    if (!selectedLocation.address?.trim()) errors.address = true;
    if (!form.contact_person?.trim()) errors.contact_person = true;
    if (!form.contact_phone?.trim()) errors.contact_phone = true;
    if (photos.length === 0) errors.photos = true;
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      errors.contact_email = true;
    }
    if (!/^[0-9]{10,15}$/.test(form.contact_phone.replace(/\D/g, ''))) {
      errors.contact_phone = true;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const appendIfValue = (fd, key, value) => {
    if (value !== "" && value !== null && value !== undefined) fd.append(key, value.toString());
  };

  const isLimitReached = plan && plan.current_usage?.total_pgs >= plan.max_listings;

  const handleSubmit = async () => {
    if (!user) {
      alert("Please log in to add a property");
      navigate("/login");
      return;
    }
    if (isLimitReached) {
      alert(`🚫 Your ${plan?.name} plan limit of ${plan?.max_listings} ${isToLet ? 'properties' : 'listings'} has been reached. Please upgrade to add more.`);
      return;
    }
    if (!validateForm()) {
      alert("Please fill all required fields (marked in red)");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      // Basic info
      formData.append("pg_name", form.pg_name);
      formData.append("pg_category", form.pg_category);
      formData.append("pg_type", form.pg_type);
      
      // Location
      formData.append("address", selectedLocation.address);
      formData.append("area", selectedLocation.area);
      appendIfValue(formData, "road", selectedLocation.road);
      appendIfValue(formData, "landmark", selectedLocation.landmark);
      formData.append("city", selectedLocation.city);
      appendIfValue(formData, "state", selectedLocation.state);
      appendIfValue(formData, "pincode", selectedLocation.pincode);
      appendIfValue(formData, "country", selectedLocation.country);
      
      const lat = parseFloat(selectedLocation.lat);
      const lng = parseFloat(selectedLocation.lng);
      if (!isNaN(lat) && lat !== 0) formData.append("latitude", lat);
      if (!isNaN(lng) && lng !== 0) formData.append("longitude", lng);
      
      // BHK config for to_let
      if (isToLet) {
        formData.append("bhk_type", form.bhk_type);
        formData.append("furnishing_type", form.furnishing_type);
        appendIfValue(formData, "price_1bhk", roomRates.price_1bhk);
        appendIfValue(formData, "price_2bhk", roomRates.price_2bhk);
        appendIfValue(formData, "price_3bhk", roomRates.price_3bhk);
        appendIfValue(formData, "price_4bhk", roomRates.price_4bhk);
        Object.entries(bhkConfig).forEach(([k, v]) => appendIfValue(formData, k, v));
      }
      
      // PG room rates
      if (isPG) {
        Object.entries(roomRates).forEach(([k, v]) => {
          if (k.startsWith("single_") || k.startsWith("double_") || k.startsWith("triple_") || k.startsWith("four_")) {
            appendIfValue(formData, k, v);
          }
        });
      }
      
      // Co-living rates
      if (isCoLiving) {
        appendIfValue(formData, "co_living_single_room", roomRates.co_living_single_room);
        appendIfValue(formData, "co_living_double_room", roomRates.co_living_double_room);
      }
      
      // Facilities (booleans)
      const facilities = [
        "food_available", "ac_available", "wifi_available", "tv",
        "parking_available", "bike_parking", "laundry_available",
        "washing_machine", "refrigerator", "microwave", "geyser",
        "power_backup", "lift_elevator", "cctv", "security_guard",
        "gym", "housekeeping", "water_purifier", "fire_safety",
        "study_room", "common_tv_lounge", "balcony_open_space",
        "water_24x7", "cupboard_available", "table_chair_available",
        "dining_table_available", "attached_bathroom", "balcony_available",
        "wall_mounted_clothes_hook", "bed_with_mattress", "fan_light", "kitchen_room"
      ];
      facilities.forEach(key => formData.append(key, form[key] ? "true" : "false"));
      
      appendIfValue(formData, "food_type", form.food_type);
      appendIfValue(formData, "meals_per_day", form.meals_per_day);
      appendIfValue(formData, "water_type", form.water_type);
      
      // Co-living inclusions (now manually set)
      formData.append("co_living_fully_furnished", form.co_living_fully_furnished ? "true" : "false");
      formData.append("co_living_food_included", form.co_living_food_included ? "true" : "false");
      formData.append("co_living_wifi_included", form.co_living_wifi_included ? "true" : "false");
      formData.append("co_living_housekeeping", form.co_living_housekeeping ? "true" : "false");
      formData.append("co_living_power_backup", form.co_living_power_backup ? "true" : "false");
      formData.append("co_living_maintenance", form.co_living_maintenance ? "true" : "false");
      
      // Rules
      const rules = [
        "visitor_allowed", "visitor_time_restricted", "couple_allowed",
        "family_allowed", "smoking_allowed", "drinking_allowed",
        "pets_allowed", "late_night_entry_allowed", "outside_food_allowed",
        "parties_allowed", "loud_music_restricted", "lock_in_period",
        "agreement_mandatory", "id_proof_mandatory", "office_going_only",
        "students_only", "subletting_allowed"
      ];
      rules.forEach(key => formData.append(key, form[key] ? "true" : "false"));
      formData.append("boys_only", form.boys_only ? "true" : "false");
      formData.append("girls_only", form.girls_only ? "true" : "false");
      formData.append("co_living_allowed", form.co_living_allowed ? "true" : "false");
      
      appendIfValue(formData, "visitors_allowed_till", form.visitors_allowed_till);
      appendIfValue(formData, "entry_curfew_time", form.entry_curfew_time);
      appendIfValue(formData, "min_stay_months", form.min_stay_months);
      formData.append("notice_period", form.notice_period);
      
      appendIfValue(formData, "security_deposit", form.security_deposit);
      appendIfValue(formData, "maintenance_amount", form.maintenance_amount);
      appendIfValue(formData, "total_rooms", form.total_rooms);
      appendIfValue(formData, "available_rooms", form.available_rooms);
      
      formData.append("description", form.description);
      formData.append("contact_person", form.contact_person);
      appendIfValue(formData, "contact_email", form.contact_email);
      formData.append("contact_phone", form.contact_phone);
      
      photos.forEach(photo => formData.append("photos", photo));
      
      const response = await api.post("/pg/add", formData);
      if (response.data.success) {
        alert(`✅ ${isToLet ? 'House/Flat' : 'Property'} Created Successfully!`);
        navigate("/owner/dashboard");
        // Reset form
        setForm({ ...initialForm, owner_id: user.uid });
        setRoomRates(initialRoomRates);
        setBhkConfig(initialBhkConfig);
        setPhotos([]);
        setSelectedLocation(initialLocation);
        setUserLocation(null);
        setValidationErrors({});
      } else {
        alert(`❌ Failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Failed to create property: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper: get error style for input
  const getErrorStyle = (fieldName) => validationErrors[fieldName] ? { border: "2px solid #f44336", backgroundColor: "#ffebee" } : {};

  // ================= RENDER =================
  if (authLoading || planLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "owner") return <Navigate to="/" replace />;

  const isSubmitDisabled = loading || !selectedLocation.address || photos.length === 0 || !form.pg_name?.trim() || !form.contact_person?.trim() || !form.contact_phone?.trim() || isLimitReached;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>➕ Add New Property</h2>
        
        {/* Plan info */}
        {plan && (
          <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 12, padding: 16, marginBottom: 24, color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>💎 Current Plan: {plan.name}</h3>
                <p style={{ margin: "4px 0", fontSize: 14 }}>📊 Listings: {plan.current_usage?.total_pgs || 0} / {plan.max_listings}</p>
                <p style={{ margin: "4px 0", fontSize: 12, opacity: 0.9 }}>📅 Expires: {new Date(plan.expiry_date).toLocaleDateString("en-IN")}</p>
              </div>
              <button onClick={() => navigate("/owner/premium")} style={{ backgroundColor: "white", color: "#667eea", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🚀 Upgrade Plan</button>
            </div>
            <div style={{ marginTop: 12, height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${((plan.current_usage?.total_pgs || 0) / plan.max_listings) * 100}%`, height: "100%", backgroundColor: "#4ade80", borderRadius: 3 }} />
            </div>
          </div>
        )}
        
        {isLimitReached && (
          <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "center" }}>
            <p style={{ color: "#856404", marginBottom: 12, fontSize: 16 }}>🚫 Your {plan?.name} plan limit of {plan?.max_listings} {isToLet ? 'properties' : 'listings'} has been reached.</p>
            <button onClick={() => navigate("/owner/premium")} style={{ backgroundColor: "#ffc107", color: "#333", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🚀 Upgrade Plan to Add More</button>
          </div>
        )}
        
        {/* Basic Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Basic Information</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label>Property Name *</label>
              <input name="pg_name" placeholder={isToLet ? "e.g., 2BHK Flat, Independent House" : "e.g., Royal PG, Cozy Coliving"} value={form.pg_name} onChange={handleChange} style={{...styles.input, ...getErrorStyle("pg_name")}} required disabled={isLimitReached} />
            </div>
            <div style={styles.inputGroup}>
              <label>Property Category *</label>
              <select name="pg_category" value={form.pg_category} onChange={handleChange} style={styles.input} disabled={isLimitReached}>
                <option value="pg">PG/Hostel</option>
                <option value="coliving">Co-Living Space</option>
                <option value="to_let">House/Flat To Let</option>
              </select>
            </div>
            {!isToLet && (
              <div style={styles.inputGroup}>
                <label>Property Type *</label>
                <select name="pg_type" value={form.pg_type} onChange={handleChange} style={styles.input} disabled={isLimitReached}>
                  <option value="boys">Boys Only</option>
                  <option value="girls">Girls Only</option>
                  <option value="coliving">Co-Living</option>
                </select>
              </div>
            )}
          </div>
          {isToLet && (
            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <label>BHK Type *</label>
                <select name="bhk_type" value={form.bhk_type} onChange={handleChange} style={styles.input} disabled={isLimitReached}>
                  <option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option><option value="4">4 BHK</option><option value="4+">4+ BHK</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label>Furnishing Type *</label>
                <select name="furnishing_type" value={form.furnishing_type} onChange={handleChange} style={styles.input} disabled={isLimitReached}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi-Furnished</option>
                  <option value="fully_furnished">Fully Furnished</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Location *</h3>
          <div style={styles.locationButtons}>
            <button type="button" onClick={() => setShowMap(true)} style={styles.mapButton} disabled={isLimitReached}>🗺️ Select on OpenStreetMap</button>
            <button type="button" onClick={() => setManualEditMode(true)} style={styles.manualAddressButton} disabled={isLimitReached}>📝 Enter Address Manually</button>
          </div>
          {selectedLocation.address ? (
            <div style={styles.locationPreview}>
              <div style={styles.locationHeader}>
                <h4>📍 Selected Location</h4>
                <div style={styles.locationActionButtons}>
                  <button type="button" onClick={() => setManualEditMode(true)} style={styles.editLocationBtn}>✏️ Edit</button>
                  <button type="button" onClick={removeHostelLocation} style={styles.removeLocationBtn}>🗑️ Remove</button>
                </div>
              </div>
              <div style={styles.locationDetails}>
                <p><strong>Address:</strong> {selectedLocation.address}</p>
                {selectedLocation.area && <p><strong>Area:</strong> {selectedLocation.area}</p>}
                {selectedLocation.city && <p><strong>City:</strong> {selectedLocation.city}</p>}
                {selectedLocation.state && <p><strong>State:</strong> {selectedLocation.state}</p>}
                {selectedLocation.pincode && <p><strong>Pincode:</strong> {selectedLocation.pincode}</p>}
              </div>
            </div>
          ) : (
            <div style={styles.locationWarning}>⚠️ Please select a location using the map or enter manually</div>
          )}
        </div>

        {/* BHK Configuration */}
        {isToLet && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏠 BHK Configuration</h3>
            <div style={styles.grid}>
              {[1,2,3,4].map(bhk => parseInt(form.bhk_type) >= bhk && (
                <React.Fragment key={bhk}>
                  <div style={styles.inputGroup}>
                    <label>{bhk} BHK - Bedrooms</label>
                    <input type="number" name={`bedrooms_${bhk}bhk`} placeholder={`e.g., ${bhk}`} value={bhkConfig[`bedrooms_${bhk}bhk`]} onChange={handleBhkConfigChange} style={styles.input} min="1" />
                  </div>
                  <div style={styles.inputGroup}>
                    <label>{bhk} BHK - Bathrooms</label>
                    <input type="number" name={`bathrooms_${bhk}bhk`} placeholder={`e.g., ${bhk}`} value={bhkConfig[`bathrooms_${bhk}bhk`]} onChange={handleBhkConfigChange} style={styles.input} min="1" />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Room Rates */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>{isToLet ? "💰 Rental Amount (₹/Month)" : isCoLiving ? "💰 Co-Living Rates (₹/Month)" : "💰 Room Rates (₹/Month)"}</h3>
          {isToLet ? (
            <div style={styles.grid}>
              <div style={styles.inputGroup}><label>1 BHK Rent *</label><input type="number" name="price_1bhk" placeholder="₹" value={roomRates.price_1bhk} onChange={handleRateChange} style={styles.input} min="0" required /></div>
              {parseInt(form.bhk_type) >= 2 && <div style={styles.inputGroup}><label>2 BHK Rent</label><input type="number" name="price_2bhk" placeholder="₹" value={roomRates.price_2bhk} onChange={handleRateChange} style={styles.input} min="0" /></div>}
              {parseInt(form.bhk_type) >= 3 && <div style={styles.inputGroup}><label>3 BHK Rent</label><input type="number" name="price_3bhk" placeholder="₹" value={roomRates.price_3bhk} onChange={handleRateChange} style={styles.input} min="0" /></div>}
              {parseInt(form.bhk_type) >= 4 && <div style={styles.inputGroup}><label>4 BHK Rent</label><input type="number" name="price_4bhk" placeholder="₹" value={roomRates.price_4bhk} onChange={handleRateChange} style={styles.input} min="0" /></div>}
            </div>
          ) : isCoLiving ? (
            <div style={styles.grid}>
              <div style={styles.inputGroup}><label>Co-Living Single Room *</label><input type="number" name="co_living_single_room" placeholder="₹" value={roomRates.co_living_single_room} onChange={handleRateChange} style={styles.input} min="0" required /></div>
              <div style={styles.inputGroup}><label>Co-Living Double Room</label><input type="number" name="co_living_double_room" placeholder="₹" value={roomRates.co_living_double_room} onChange={handleRateChange} style={styles.input} min="0" /></div>
            </div>
          ) : (
            <div style={styles.ratesGrid}>
              {["single_sharing","double_sharing","triple_sharing","four_sharing","single_room","double_room","triple_room"].map(key => (
                <div key={key} style={styles.inputGroup}>
                  <label>{key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</label>
                  <input type="number" name={key} placeholder="₹" value={roomRates[key]} onChange={handleRateChange} style={styles.input} min="0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Facilities & Amenities */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🏠 Facilities & Amenities (Select Available)</h3>
          <div style={styles.checkboxGrid}>
            {!isToLet && (
              <>
                <label style={styles.checkboxLabel}><input type="checkbox" name="food_available" checked={form.food_available} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} /> 🍽️ Food Available</label>
                {form.food_available && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ marginRight: 10 }}>Food Type:</label>
                    <select name="food_type" value={form.food_type} onChange={handleChange} style={{...styles.input, width: 150, display: "inline-block"}} disabled={isLimitReached}>
                      <option value="veg">Vegetarian</option><option value="non_veg">Non-Vegetarian</option><option value="both">Both</option>
                    </select>
                    <label style={{ marginLeft: 20, marginRight: 10 }}>Meals per Day:</label>
                    <input type="number" name="meals_per_day" placeholder="e.g., 3" value={form.meals_per_day} onChange={handleChange} style={{...styles.input, width: 100, display: "inline-block"}} min="1" max="4" disabled={isLimitReached} />
                  </div>
                )}
              </>
            )}
            <div style={{ gridColumn: "1 / -1", marginTop: 10 }}><h4>🛏️ Room Furnishings:</h4></div>
            {["cupboard_available","table_chair_available","dining_table_available","attached_bathroom","balcony_available","wall_mounted_clothes_hook","bed_with_mattress","fan_light","kitchen_room"].map(key => (
              <label key={key} style={styles.checkboxLabel}>
                <input type="checkbox" name={key} checked={form[key]} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} />
                {key === "cupboard_available" && "👔 Cupboard/Wardrobe"}
                {key === "table_chair_available" && "💺 Study Table & Chair"}
                {key === "dining_table_available" && "🍽️ Dining Table"}
                {key === "attached_bathroom" && "🚽 Attached Bathroom"}
                {key === "balcony_available" && "🌿 Balcony"}
                {key === "wall_mounted_clothes_hook" && "🪝 Wall-mounted Clothes Hook"}
                {key === "bed_with_mattress" && "🛌 Bed with Mattress"}
                {key === "fan_light" && "💡 Fan & Light"}
                {key === "kitchen_room" && "🍳 Kitchen Room"}
              </label>
            ))}
            <div style={{ gridColumn: "1 / -1", marginTop: 10 }}><h4>🏢 Building Facilities:</h4></div>
            {["ac_available","wifi_available","tv","parking_available","bike_parking","laundry_available","washing_machine","refrigerator","microwave","geyser","power_backup","lift_elevator","cctv","security_guard","gym","housekeeping","water_purifier","fire_safety","study_room","common_tv_lounge","balcony_open_space","water_24x7"].map(key => (
              <label key={key} style={styles.checkboxLabel}>
                <input type="checkbox" name={key} checked={form[key]} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} />
                {key === "ac_available" && "❄️ Air Conditioner"}
                {key === "wifi_available" && "📶 Wi-Fi / Internet"}
                {key === "tv" && "📺 Television"}
                {key === "parking_available" && "🚗 Car Parking"}
                {key === "bike_parking" && "🏍️ Bike Parking"}
                {key === "laundry_available" && "🧺 Laundry Service"}
                {key === "washing_machine" && "🧼 Washing Machine"}
                {key === "refrigerator" && "🧊 Refrigerator"}
                {key === "microwave" && "🍳 Microwave"}
                {key === "geyser" && "🚿 Geyser"}
                {key === "power_backup" && "🔋 Power Backup"}
                {key === "lift_elevator" && "⬆️ Lift / Elevator"}
                {key === "cctv" && "📹 CCTV Surveillance"}
                {key === "security_guard" && "🛡️ Security Guard"}
                {key === "gym" && "🏋️ Gym / Fitness"}
                {key === "housekeeping" && "🧹 Housekeeping"}
                {key === "water_purifier" && "💧 Water Purifier (RO)"}
                {key === "fire_safety" && "🔥 Fire Safety System"}
                {key === "study_room" && "📚 Study Room"}
                {key === "common_tv_lounge" && "📺 Common TV / Lounge"}
                {key === "balcony_open_space" && "🌿 Balcony / Open Space"}
                {key === "water_24x7" && "💦 24×7 Water Supply"}
              </label>
            ))}
            {/* Co-Living Inclusions - now manually editable */}
            {isCoLiving && (
              <>
                <div style={{ gridColumn: "1 / -1", marginTop: 10 }}><h4>🤝 Co-Living Inclusions (click to edit):</h4></div>
                {[
                  { key: "co_living_fully_furnished", label: "🛋️ Fully Furnished" },
                  { key: "co_living_food_included", label: "🍽️ Food Included" },
                  { key: "co_living_wifi_included", label: "📶 Wi-Fi Included" },
                  { key: "co_living_housekeeping", label: "🧹 Housekeeping" },
                  { key: "co_living_power_backup", label: "🔋 Power Backup" },
                  { key: "co_living_maintenance", label: "🔧 Maintenance" }
                ].map(item => (
                  <label key={item.key} style={{...styles.checkboxLabel, color: "#2E7D32"}}>
                    <input type="checkbox" name={item.key} checked={form[item.key]} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} />
                    {item.label}
                  </label>
                ))}
              </>
            )}
            <div style={{ gridColumn: "1 / -1", marginTop: 10 }}>
              <label style={{ marginRight: 10 }}>💧 Water Source:</label>
              <select name="water_type" value={form.water_type} onChange={handleChange} style={{...styles.input, width: 150, display: "inline-block"}} disabled={isLimitReached}>
                <option value="borewell">Borewell</option><option value="kaveri">Kaveri</option><option value="both">Both</option><option value="municipal">Municipal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rules & Restrictions */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📜 Rules & Restrictions</h3>
          <div style={styles.checkboxGrid}>
            <div style={{ gridColumn: "1 / -1", marginBottom: 10 }}><h4>👥 Allowed For:</h4>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <label style={styles.checkboxLabel}><input type="checkbox" name="boys_only" checked={form.boys_only} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} /> 👨 Boys Only</label>
                <label style={styles.checkboxLabel}><input type="checkbox" name="girls_only" checked={form.girls_only} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} /> 👩 Girls Only</label>
                <label style={styles.checkboxLabel}><input type="checkbox" name="co_living_allowed" checked={form.co_living_allowed} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} /> 🤝 Co-Living (Mixed)</label>
              </div>
            </div>
            {["visitor_allowed","visitor_time_restricted","couple_allowed","family_allowed","smoking_allowed","drinking_allowed","pets_allowed","late_night_entry_allowed","outside_food_allowed","parties_allowed","loud_music_restricted","lock_in_period","agreement_mandatory","id_proof_mandatory","office_going_only","students_only","subletting_allowed"].map(rule => (
              <label key={rule} style={styles.checkboxLabel}>
                <input type="checkbox" name={rule} checked={form[rule]} onChange={handleChange} style={styles.checkbox} disabled={isLimitReached} />
                {rule === "visitor_allowed" && "👥 Visitors Allowed"}
                {rule === "visitor_time_restricted" && "⏰ Visitor Time Restricted"}
                {rule === "couple_allowed" && "❤️ Couples Allowed"}
                {rule === "family_allowed" && "👨‍👩‍👧‍👦 Family Allowed"}
                {rule === "smoking_allowed" && "🚬 Smoking Allowed"}
                {rule === "drinking_allowed" && "🍺 Drinking Allowed"}
                {rule === "pets_allowed" && "🐕 Pets Allowed"}
                {rule === "late_night_entry_allowed" && "🌙 Late Night Entry"}
                {rule === "outside_food_allowed" && "🍕 Outside Food Allowed"}
                {rule === "parties_allowed" && "🎉 Parties Allowed"}
                {rule === "loud_music_restricted" && "🔇 Loud Music Restricted"}
                {rule === "lock_in_period" && "🔒 Lock-in Period"}
                {rule === "agreement_mandatory" && "📝 Agreement Mandatory"}
                {rule === "id_proof_mandatory" && "🆔 ID Proof Mandatory"}
                {rule === "office_going_only" && "💼 Office-Going Only"}
                {rule === "students_only" && "🎓 Students Only"}
                {rule === "subletting_allowed" && "🔄 Sub-letting Allowed"}
              </label>
            ))}
          </div>
          <div style={{...styles.grid, marginTop: 15}}>
            {form.visitor_time_restricted && <div style={styles.inputGroup}><label>Visitors Allowed Till</label><input type="time" name="visitors_allowed_till" value={form.visitors_allowed_till} onChange={handleChange} style={styles.input} disabled={isLimitReached} /></div>}
            {!form.late_night_entry_allowed && <div style={styles.inputGroup}><label>Entry Curfew Time</label><input type="time" name="entry_curfew_time" value={form.entry_curfew_time} onChange={handleChange} style={styles.input} disabled={isLimitReached} /></div>}
            {form.lock_in_period && <div style={styles.inputGroup}><label>Minimum Stay (Months)</label><input type="number" name="min_stay_months" value={form.min_stay_months} onChange={handleChange} style={styles.input} min="1" placeholder="e.g., 6" disabled={isLimitReached} /></div>}
          </div>
        </div>

        {/* Additional Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💰 Additional Details & Charges</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}><label>Security Deposit (₹)</label><input type="number" name="security_deposit" placeholder="e.g., 10000" value={form.security_deposit} onChange={handleChange} style={styles.input} min="0" disabled={isLimitReached} /></div>
            <div style={styles.inputGroup}><label>Maintenance Charges (₹/Month)</label><input type="number" name="maintenance_amount" placeholder="e.g., 1000" value={form.maintenance_amount} onChange={handleChange} style={styles.input} min="0" disabled={isLimitReached} /></div>
            <div style={styles.inputGroup}><label>Notice Period</label><select name="notice_period" value={form.notice_period} onChange={handleChange} style={styles.input} disabled={isLimitReached}><option value="1">1 Month</option><option value="2">2 Months</option><option value="3">3 Months</option></select></div>
            <div style={styles.inputGroup}><label>Total {isToLet ? "Properties" : "Rooms"}</label><input type="number" name="total_rooms" placeholder={isToLet ? "e.g., 1" : "e.g., 10"} value={form.total_rooms} onChange={handleChange} style={styles.input} min="1" disabled={isLimitReached} /></div>
            <div style={styles.inputGroup}><label>Available {isToLet ? "Properties" : "Rooms"}</label><input type="number" name="available_rooms" placeholder={isToLet ? "e.g., 1" : "e.g., 5"} value={form.available_rooms} onChange={handleChange} style={styles.input} min="0" disabled={isLimitReached} /></div>
          </div>
          <div style={styles.inputGroup}>
            <label>Description *</label>
            <textarea name="description" placeholder={isToLet ? "Describe your house/flat, bedrooms, bathrooms, nearby facilities..." : "Describe your property, amenities, nearby facilities..."} value={form.description} onChange={handleChange} style={{...styles.textarea, ...getErrorStyle("description")}} rows="4" required disabled={isLimitReached} />
          </div>
        </div>

        {/* Contact Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📞 Contact Information</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}><label>Contact Person *</label><input name="contact_person" placeholder="e.g., Owner/Manager Name" value={form.contact_person} onChange={handleChange} style={{...styles.input, ...getErrorStyle("contact_person")}} required disabled={isLimitReached} /></div>
            <div style={styles.inputGroup}><label>Contact Email</label><input type="email" name="contact_email" placeholder="contact@example.com" value={form.contact_email} onChange={handleChange} style={{...styles.input, ...getErrorStyle("contact_email")}} disabled={isLimitReached} /></div>
            <div style={styles.inputGroup}><label>Contact Phone *</label><input type="tel" name="contact_phone" placeholder="Enter 10-digit phone number" value={form.contact_phone} onChange={handleChange} style={{...styles.input, ...getErrorStyle("contact_phone")}} required pattern="[0-9]{10,15}" disabled={isLimitReached} /></div>
          </div>
        </div>

        {/* Photo Upload */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📷 Property Photos *</h3>
          <p style={styles.note}>Upload at least 1 photo. Maximum {plan?.max_photos_per_pg || 10} photos allowed.</p>
          {plan && <div style={{ backgroundColor: "#e0f2fe", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 14 }}>📸 Photo usage: {photos.length} / {plan.max_photos_per_pg} photos</div>}
          <div style={styles.fileUpload}>
            <label htmlFor="photo-upload" style={{...styles.fileUploadLabel, opacity: isLimitReached ? 0.5 : 1, cursor: isLimitReached ? "not-allowed" : "pointer"}}>📁 Choose Photos</label>
            <input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={styles.fileInput} disabled={isLimitReached} />
          </div>
          {photos.length > 0 && (
            <div style={styles.photoPreview}>
              {photos.map((photo, idx) => (
                <div key={idx} style={styles.photoItem}>
                  <span style={styles.photoName}>{photo.name.length > 20 ? photo.name.substring(0,20)+"..." : photo.name}</span>
                  <button type="button" onClick={() => removePhoto(idx)} style={styles.removePhotoBtn} disabled={isLimitReached}>✕</button>
                </div>
              ))}
            </div>
          )}
          {validationErrors.photos && <p style={{ color: "#f44336", fontSize: 12, marginTop: 5 }}>⚠️ At least one photo is required</p>}
        </div>

        <button onClick={handleSubmit} disabled={isSubmitDisabled} style={{...styles.submitBtn, ...(isSubmitDisabled ? styles.submitBtnDisabled : {})}}>
          {loading ? "Creating Property..." : (isLimitReached ? "⚠️ Limit Reached - Upgrade to Add" : `➕ Create ${isToLet ? 'House/Flat' : 'Property'}`)}
        </button>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div style={styles.mapModalOverlay}>
          <div style={styles.mapModal}>
            <div style={styles.mapHeader}>
              <h3>Select Property Location</h3>
              <div style={styles.mapControls}>
                <button onClick={getUserCurrentLocation} style={styles.currentLocationButton} disabled={gettingLocation || mapLoading}>{gettingLocation ? "📍 Getting Location..." : "📍 Use My Location"}</button>
                <div style={styles.mapSearch}>
                  <input type="text" id="location-search" placeholder="Search for area, landmark, or address..." style={styles.searchInput} onKeyPress={(e) => e.key === 'Enter' && searchLocation(e.target.value)} />
                  <button onClick={() => searchLocation(document.getElementById('location-search').value)} style={styles.searchButton} disabled={mapLoading}>{mapLoading ? "Searching..." : "🔍 Search"}</button>
                </div>
              </div>
              <button onClick={() => setShowMap(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.mapContainer}>
              {(mapLoading || gettingLocation) && (
                <div style={styles.loadingOverlay}>
                  <div style={styles.spinner}></div>
                  <p>{gettingLocation ? "Getting your location..." : "Loading map..."}</p>
                </div>
              )}
              <MapContainer center={[parseFloat(selectedLocation.lat) || 12.9716, parseFloat(selectedLocation.lng) || 77.5946]} zoom={13} style={styles.leafletMap} ref={mapRef}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <UserLocationMarker userLocation={userLocation} />
                <LocationMarker onLocationSelect={handleLocationSelect} selectedLocation={selectedLocation} />
              </MapContainer>
              <div style={styles.locationPreview}>
                <h4>Selected Location Details:</h4>
                {mapLoading ? <p>Fetching address details...</p> : (
                  <>
                    <p><strong>Coordinates:</strong> {selectedLocation.lat}, {selectedLocation.lng}</p>
                    {selectedLocation.address && <p><strong>Address:</strong> {selectedLocation.address}</p>}
                  </>
                )}
              </div>
              <div style={styles.mapFooter}>
                <button onClick={() => { if (selectedLocation.lat && selectedLocation.lng) setShowMap(false); else alert("Please select a location by clicking on the map"); }} style={styles.confirmButton} disabled={mapLoading || gettingLocation}>✅ Confirm This Location</button>
                <button onClick={() => { setShowMap(false); setManualEditMode(true); }} style={styles.manualButton}>✏️ Enter Address Manually</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Address Modal */}
      {manualEditMode && (
        <div style={styles.manualModalOverlay}>
          <div style={styles.manualModal}>
            <div style={styles.manualHeader}>
              <h3>Enter Address Manually</h3>
              <button onClick={() => setManualEditMode(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.manualForm}>
              <div style={styles.grid}>
                <div style={styles.inputGroup}><label>Full Address *</label><textarea name="address" value={selectedLocation.address} onChange={handleLocationChange} placeholder="Complete address including floor, building, street" style={styles.textarea} rows="3" required /></div>
                <div style={styles.inputGroup}><label>Area/Locality *</label><input type="text" name="area" value={selectedLocation.area} onChange={handleLocationChange} placeholder="e.g., Koramangala, Whitefield" style={styles.input} required /></div>
                <div style={styles.inputGroup}><label>Road/Street</label><input type="text" name="road" value={selectedLocation.road} onChange={handleLocationChange} placeholder="e.g., MG Road, 100 Feet Road" style={styles.input} /></div>
                <div style={styles.inputGroup}><label>Landmark</label><input type="text" name="landmark" value={selectedLocation.landmark} onChange={handleLocationChange} placeholder="e.g., Near Forum Mall, Opposite Metro Station" style={styles.input} /></div>
                <div style={styles.inputGroup}><label>City *</label><input type="text" name="city" value={selectedLocation.city} onChange={handleLocationChange} placeholder="e.g., Bangalore" style={styles.input} required /></div>
                <div style={styles.inputGroup}><label>State *</label><input type="text" name="state" value={selectedLocation.state} onChange={handleLocationChange} placeholder="e.g., Karnataka" style={styles.input} required /></div>
                <div style={styles.inputGroup}><label>Pincode *</label><input type="text" name="pincode" value={selectedLocation.pincode} onChange={handleLocationChange} placeholder="e.g., 560034" style={styles.input} required pattern="[0-9]{6}" /></div>
                <div style={styles.inputGroup}><label>Country *</label><input type="text" name="country" value={selectedLocation.country} onChange={handleLocationChange} placeholder="e.g., India" style={styles.input} required /></div>
                <div style={styles.inputGroup}><label>Latitude (optional)</label><input type="text" name="lat" value={selectedLocation.lat === 0 ? "" : selectedLocation.lat} onChange={handleLocationChange} placeholder="e.g., 12.9716" style={styles.input} step="any" /></div>
                <div style={styles.inputGroup}><label>Longitude (optional)</label><input type="text" name="lng" value={selectedLocation.lng === 0 ? "" : selectedLocation.lng} onChange={handleLocationChange} placeholder="e.g., 77.5946" style={styles.input} step="any" /></div>
              </div>
              <div style={styles.manualFooter}>
                <button onClick={() => { if (selectedLocation.address && selectedLocation.area && selectedLocation.city && selectedLocation.state && selectedLocation.pincode && selectedLocation.country) { setManualEditMode(false); } else { alert("Please fill all required fields (marked with *)"); } }} style={styles.saveButton}>💾 Save Address</button>
                <button onClick={() => { setManualEditMode(false); setShowMap(true); }} style={styles.backToMapButton}>🗺️ Back to Map</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles (unchanged – keep the same as original)
const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg, #667eea, #764ba2)", padding: "20px", display: "flex", justifyContent: "center", alignItems: "flex-start" },
  card: { background: "#ffffff", width: "100%", maxWidth: "1200px", padding: "30px", borderRadius: "20px", boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)", margin: "20px 0" },
  title: { textAlign: "center", marginBottom: "30px", color: "#333", fontSize: "28px", fontWeight: "600" },
  section: { marginBottom: "30px", paddingBottom: "20px", borderBottom: "1px solid #eee" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#444", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" },
  note: { fontSize: "14px", color: "#666", marginBottom: "15px", fontStyle: "italic" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px", marginBottom: "15px" },
  ratesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column" },
  input: { padding: "12px 14px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", transition: "border 0.2s, box-shadow 0.2s", width: "100%", boxSizing: "border-box" },
  textarea: { padding: "12px 14px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", width: "100%", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" },
  locationButtons: { display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap" },
  mapButton: { padding: "12px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "8px", flex: "1", minWidth: "200px" },
  manualAddressButton: { padding: "12px 20px", background: "#2196F3", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "8px", flex: "1", minWidth: "200px" },
  locationPreview: { background: "#f8f9fa", padding: "15px", borderRadius: "8px", marginTop: "10px", borderLeft: "4px solid #4CAF50" },
  locationHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  locationActionButtons: { display: "flex", gap: "10px" },
  editLocationBtn: { background: "#2196F3", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" },
  removeLocationBtn: { background: "#ff4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" },
  locationDetails: { fontSize: "14px", color: "#555" },
  locationWarning: { background: "#FFF3CD", border: "1px solid #FFEEBA", color: "#856404", padding: "10px", borderRadius: "6px", marginTop: "10px", fontSize: "14px" },
  checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#555", padding: "8px", borderRadius: "6px" },
  checkbox: { width: "18px", height: "18px", cursor: "pointer" },
  fileUpload: { marginBottom: "15px" },
  fileUploadLabel: { display: "inline-block", padding: "12px 20px", background: "#667eea", color: "white", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  fileInput: { display: "none" },
  photoPreview: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" },
  photoItem: { display: "flex", alignItems: "center", gap: "10px", background: "#f8f9fa", padding: "8px 12px", borderRadius: "6px", fontSize: "14px", border: "1px solid #e9ecef" },
  photoName: { maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  removePhotoBtn: { background: "#ff4444", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  photoCount: { fontSize: "14px", color: "#666", marginTop: "10px" },
  submitBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s", marginTop: "10px" },
  submitBtnDisabled: { opacity: "0.6", cursor: "not-allowed" },
  mapModalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  mapModal: { background: "white", borderRadius: "12px", width: "95%", maxWidth: "1000px", maxHeight: "95vh", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" },
  mapHeader: { padding: "15px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fa", flexWrap: "wrap", gap: "10px" },
  mapControls: { display: "flex", flex: "1", flexDirection: "column", gap: "10px", minWidth: "300px" },
  currentLocationButton: { padding: "10px 15px", background: "#FF9800", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px", width: "100%", justifyContent: "center" },
  mapSearch: { display: "flex", gap: "10px", width: "100%" },
  searchInput: { flex: "1", padding: "10px 15px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", outline: "none", minWidth: "200px" },
  searchButton: { padding: "10px 15px", background: "#2196F3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px", minWidth: "100px" },
  closeBtn: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 },
  mapContainer: { position: "relative" },
  leafletMap: { height: "400px", width: "100%" },
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  spinner: { border: "4px solid #f3f3f3", borderTop: "4px solid #3498db", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" },
  mapFooter: { padding: "15px 20px", display: "flex", gap: "15px", justifyContent: "center", background: "#f8f9fa", borderTop: "1px solid #eee" },
  confirmButton: { padding: "12px 24px", background: "#4CAF50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" },
  manualButton: { padding: "12px 24px", background: "#2196F3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" },
  manualModalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1001 },
  manualModal: { background: "white", borderRadius: "12px", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" },
  manualHeader: { padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fa" },
  manualForm: { padding: "20px" },
  manualFooter: { padding: "20px", display: "flex", gap: "15px", justifyContent: "center", background: "#f8f9fa", borderTop: "1px solid #eee" },
  saveButton: { padding: "12px 24px", background: "#4CAF50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" },
  backToMapButton: { padding: "12px 24px", background: "#2196F3", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" },
};

export default OwnerAddPG;