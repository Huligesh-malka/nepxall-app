import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// API Base URL - Move to one constant
const API_BASE = "http://localhost:5000";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons - moved outside component to prevent re-renders
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

// Map components moved OUTSIDE to prevent re-renders
function UserLocationMarker({ userLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation && map) {
      map.setView([userLocation.lat, userLocation.lng], 16);
    }
  }, [userLocation, map]);

  if (!userLocation) return null;
  
  return (
    <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
      <Popup>📍 Your Current Location</Popup>
    </Marker>
  );
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
  
  return (
    <Marker position={[lat, lng]} icon={selectedLocationIcon}>
      <Popup>📍 Selected Property Location</Popup>
    </Marker>
  );
}

// Initial form state to avoid duplication
const initialForm = {
  owner_id: "",
  pg_name: "",
  pg_type: "boys",
  pg_category: "pg",
  
  // BHK Configuration
  bhk_type: "1",
  furnishing_type: "unfurnished",
  
  // Facilities & Amenities
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
  
  // Room Furnishings
  cupboard_available: false,
  table_chair_available: false,
  dining_table_available: false,
  attached_bathroom: false,
  balcony_available: false,
  
  // NEW FOUR FEATURES
  wall_mounted_clothes_hook: false,
  bed_with_mattress: false,
  fan_light: false,
  kitchen_room: false,
  
  // Co-Living Inclusions
  co_living_fully_furnished: false,
  co_living_food_included: false,
  co_living_wifi_included: false,
  co_living_housekeeping: false,
  co_living_power_backup: false,
  co_living_maintenance: false,
  
  // Rules & Restrictions
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
  
  // Additional charges
  security_deposit: "",
  maintenance_amount: "",
  
  // Room details
  total_rooms: "",
  available_rooms: "",
  
  // Description
  description: "",
  
  // Contact Information
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
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [user, setUser] = useState(null); // Store Firebase user object
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [photos, setPhotos] = useState([]);
  const [roomRates, setRoomRates] = useState(initialRoomRates);
  const [bhkConfig, setBhkConfig] = useState(initialBhkConfig);
  const [form, setForm] = useState(initialForm);
  const [manualEditMode, setManualEditMode] = useState(false);
  
  const mapRef = useRef(null);

  const isToLet = form.pg_category === "to_let";
  const isPG = form.pg_category === "pg";
  const isCoLiving = form.pg_category === "coliving";

  // ✅ FIX 1: Add CSS animation properly
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

  // ✅ FIX 2: Store user from onAuthStateChanged
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        console.log("User logged in:", currentUser.uid);
        setUser(currentUser);
        setForm(prev => ({ 
          ...prev, 
          owner_id: currentUser.uid,
          contact_email: currentUser.email || prev.contact_email,
          contact_person: currentUser.displayName || prev.contact_person,
          contact_phone: currentUser.phoneNumber || prev.contact_phone
        }));
      } else {
        console.log("No user logged in - redirecting to login");
        setUser(null);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Update co-living inclusions
  useEffect(() => {
    if (isCoLiving) {
      setForm(prev => ({
        ...prev,
        co_living_fully_furnished: true,
        co_living_food_included: true,
        co_living_wifi_included: true,
        co_living_housekeeping: true,
        co_living_power_backup: true,
        co_living_maintenance: true,
      }));
    }
  }, [form.pg_category]);

  // Update pg_type based on gender selection
  useEffect(() => {
    if (form.boys_only) {
      setForm(prev => ({ ...prev, pg_type: "boys" }));
    } else if (form.girls_only) {
      setForm(prev => ({ ...prev, pg_type: "girls" }));
    } else if (form.co_living_allowed) {
      setForm(prev => ({ ...prev, pg_type: "coliving" }));
    }
  }, [form.boys_only, form.girls_only, form.co_living_allowed]);

  // Format coordinate for display
  const formatCoordinate = (coord) => {
    if (!coord && coord !== 0) return "";
    const num = parseFloat(coord);
    return isNaN(num) ? "" : num.toFixed(6);
  };

  // Parse coordinate from input
  const parseCoordinate = (value) => {
    if (!value && value !== 0) return "";
    const num = parseFloat(value);
    return isNaN(num) ? "" : num;
  };

  // Get user's current location
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
        
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setGettingLocation(false);
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            alert("Location access denied. Please enable location services in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out.");
            break;
          default:
            alert("An unknown error occurred while getting your location.");
        }
      },
      {
        // ✅ FIX 9: Disable high accuracy for production
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Fetch address from coordinates
  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      setMapLoading(true);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      
      const data = response.data;
      
      if (data) {
        const address = data.display_name || "";
        const addressParts = data.address || {};
        
        setSelectedLocation(prev => ({
          ...prev,
          address: address,
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
      setSelectedLocation(prev => ({
        ...prev,
        lat: lat,
        lng: lng
      }));
    } finally {
      setMapLoading(false);
    }
  };

  // Handle location selection from map
  const handleLocationSelect = async (lat, lng) => {
    await fetchAddressFromCoordinates(lat, lng);
    setSelectedLocation(prev => ({
      ...prev,
      lat: lat,
      lng: lng
    }));
  };

  // Search location by address
  const searchLocation = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    try {
      setMapLoading(true);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      
      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        setSelectedLocation(prev => ({
          ...prev,
          lat: lat,
          lng: lng
        }));
        
        await fetchAddressFromCoordinates(lat, lng);
        
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Location not found. Please try a different search.");
    } finally {
      setMapLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle exclusive gender selection
    if (name === "boys_only" && checked) {
      setForm(prev => ({ 
        ...prev, 
        [name]: checked,
        girls_only: false,
        co_living_allowed: false
      }));
    } else if (name === "girls_only" && checked) {
      setForm(prev => ({ 
        ...prev, 
        [name]: checked,
        boys_only: false,
        co_living_allowed: false
      }));
    } else if (name === "co_living_allowed" && checked) {
      setForm(prev => ({ 
        ...prev, 
        [name]: checked,
        boys_only: false,
        girls_only: false
      }));
    } else {
      setForm({
        ...form,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleRateChange = (e) => {
    const { name, value } = e.target;
    setRoomRates({
      ...roomRates,
      [name]: value
    });
  };

  const handleBhkConfigChange = (e) => {
    const { name, value } = e.target;
    setBhkConfig({
      ...bhkConfig,
      [name]: value
    });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "lat" || name === "lng") {
      const numValue = value === "" ? "" : parseFloat(value);
      setSelectedLocation(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? "" : numValue
      }));
    } else {
      setSelectedLocation(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 10) {
      alert("Maximum 10 photos allowed");
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Remove location
  const removeHostelLocation = () => {
    setSelectedLocation(initialLocation);
  };

  // ✅ FIX 5: Validation function
  const validateForm = () => {
    if (!form.pg_name?.trim()) return "Enter property name";
    if (!selectedLocation.address?.trim()) return "Select location from map or enter manually";
    if (!form.contact_person?.trim()) return "Enter contact person name";
    if (!form.contact_phone?.trim()) return "Enter contact phone number";
    if (photos.length === 0) return "Upload at least one property photo";
    
    // Email validation (optional but must be valid if provided)
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      return "Enter a valid email address";
    }
    
    // Phone validation
    if (!/^[0-9]{10,15}$/.test(form.contact_phone.replace(/\D/g, ''))) {
      return "Enter a valid phone number (10-15 digits)";
    }
    
    return null;
  };

  // ✅ FIX 6: Helper to append only non-empty values
  const appendIfValue = (formData, key, value) => {
    if (value !== "" && value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // ✅ FIX 2 & 7: Use stored user instead of auth.currentUser
    if (!user) {
      alert("Please log in to add a property");
      navigate("/login");
      return;
    }

    // ✅ FIX 5: Run validation
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      
      // Basic info
      formData.append("pg_name", form.pg_name);
      formData.append("pg_category", form.pg_category);
      formData.append("pg_type", form.pg_type);
      
      // Location details
      formData.append("address", selectedLocation.address);
      formData.append("area", selectedLocation.area);
      appendIfValue(formData, "road", selectedLocation.road);
      appendIfValue(formData, "landmark", selectedLocation.landmark);
      formData.append("city", selectedLocation.city);
      
      // Coordinates
      const lat = parseCoordinate(selectedLocation.lat);
      const lng = parseCoordinate(selectedLocation.lng);
      if (lat) formData.append("latitude", lat.toString());
      if (lng) formData.append("longitude", lng.toString());
      
      // BHK Configuration for To-Let
      if (isToLet) {
        formData.append("bhk_type", form.bhk_type);
        formData.append("furnishing_type", form.furnishing_type);
        
        // BHK Prices - using appendIfValue
        appendIfValue(formData, "price_1bhk", roomRates.price_1bhk);
        appendIfValue(formData, "price_2bhk", roomRates.price_2bhk);
        appendIfValue(formData, "price_3bhk", roomRates.price_3bhk);
        appendIfValue(formData, "price_4bhk", roomRates.price_4bhk);
        
        // BHK Room/Bath counts - using appendIfValue
        appendIfValue(formData, "bedrooms_1bhk", bhkConfig.bedrooms_1bhk);
        appendIfValue(formData, "bathrooms_1bhk", bhkConfig.bathrooms_1bhk);
        appendIfValue(formData, "bedrooms_2bhk", bhkConfig.bedrooms_2bhk);
        appendIfValue(formData, "bathrooms_2bhk", bhkConfig.bathrooms_2bhk);
        appendIfValue(formData, "bedrooms_3bhk", bhkConfig.bedrooms_3bhk);
        appendIfValue(formData, "bathrooms_3bhk", bhkConfig.bathrooms_3bhk);
        appendIfValue(formData, "bedrooms_4bhk", bhkConfig.bedrooms_4bhk);
        appendIfValue(formData, "bathrooms_4bhk", bhkConfig.bathrooms_4bhk);
      }
      
      // Standard PG Room Rates
      if (isPG) {
        Object.keys(roomRates).forEach(key => {
          if (key.startsWith("single_") || key.startsWith("double_") || key.startsWith("triple_") || key.startsWith("four_")) {
            appendIfValue(formData, key, roomRates[key]);
          }
        });
      }
      
      // Co-Living Rates
      if (isCoLiving) {
        appendIfValue(formData, "co_living_single_room", roomRates.co_living_single_room);
        appendIfValue(formData, "co_living_double_room", roomRates.co_living_double_room);
      }
      
      // FACILITIES
      const facilities = [
        "food_available", "ac_available", "wifi_available", "tv",
        "parking_available", "bike_parking", "laundry_available",
        "washing_machine", "refrigerator", "microwave", "geyser",
        "power_backup", "lift_elevator", "cctv", "security_guard",
        "gym", "housekeeping", "water_purifier", "fire_safety",
        "study_room", "common_tv_lounge", "balcony_open_space",
        "water_24x7", "cupboard_available", "table_chair_available",
        "dining_table_available", "attached_bathroom", "balcony_available",
        "wall_mounted_clothes_hook", "bed_with_mattress",
        "fan_light", "kitchen_room"
      ];
      
      facilities.forEach(key => {
        formData.append(key, form[key] ? "true" : "false");
      });
      
      appendIfValue(formData, "food_type", form.food_type);
      appendIfValue(formData, "meals_per_day", form.meals_per_day);
      appendIfValue(formData, "water_type", form.water_type);
      
      // Co-Living Inclusions
      if (isCoLiving) {
        formData.append("co_living_fully_furnished", "true");
        formData.append("co_living_food_included", "true");
        formData.append("co_living_wifi_included", "true");
        formData.append("co_living_housekeeping", "true");
        formData.append("co_living_power_backup", "true");
        formData.append("co_living_maintenance", "true");
      } else {
        formData.append("co_living_fully_furnished", "false");
        formData.append("co_living_food_included", "false");
        formData.append("co_living_wifi_included", "false");
        formData.append("co_living_housekeeping", "false");
        formData.append("co_living_power_backup", "false");
        formData.append("co_living_maintenance", "false");
      }
      
      // RULES
      const rules = [
        "visitor_allowed", "visitor_time_restricted", "couple_allowed",
        "family_allowed", "smoking_allowed", "drinking_allowed",
        "pets_allowed", "late_night_entry_allowed", "outside_food_allowed",
        "parties_allowed", "loud_music_restricted", "lock_in_period",
        "agreement_mandatory", "id_proof_mandatory", "office_going_only",
        "students_only", "subletting_allowed"
      ];
      
      rules.forEach(key => {
        formData.append(key, form[key] ? "true" : "false");
      });
      
      // Gender rules
      formData.append("boys_only", form.boys_only ? "true" : "false");
      formData.append("girls_only", form.girls_only ? "true" : "false");
      formData.append("co_living_allowed", form.co_living_allowed ? "true" : "false");
      
      appendIfValue(formData, "visitors_allowed_till", form.visitors_allowed_till);
      appendIfValue(formData, "entry_curfew_time", form.entry_curfew_time);
      appendIfValue(formData, "min_stay_months", form.min_stay_months);
      formData.append("notice_period", form.notice_period);
      
      // Additional charges
      appendIfValue(formData, "security_deposit", form.security_deposit);
      appendIfValue(formData, "maintenance_amount", form.maintenance_amount);
      
      // Room details
      appendIfValue(formData, "total_rooms", form.total_rooms);
      appendIfValue(formData, "available_rooms", form.available_rooms);
      
      // Description
      formData.append("description", form.description);
      
      // Contact info
      formData.append("contact_person", form.contact_person);
      appendIfValue(formData, "contact_email", form.contact_email);
      formData.append("contact_phone", form.contact_phone);
      
      // Photos
      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      console.log("Submitting property data with owner UID:", user.uid);
      
      // ✅ FIX 7: Use stored user for token
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_BASE}/api/pg/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        alert(`✅ ${isToLet ? 'House/Flat' : 'Property'} Created Successfully! ID: ${response.data.pg_id}`);
        
        // ✅ FIX 4: Reset form using initial state
        navigate("/owner/dashboard");
        
        // Reset all states
        setForm({ ...initialForm, owner_id: user.uid });
        setRoomRates(initialRoomRates);
        setBhkConfig(initialBhkConfig);
        setPhotos([]);
        setSelectedLocation(initialLocation);
        setUserLocation(null);
        
      } else {
        alert(`❌ Failed: ${response.data.message}`);
      }

    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      alert("❌ Failed to create property: " + (err.response?.data?.message || err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // OpenStreetMap Modal Component
  const OpenStreetMapModal = () => {
    const displayLat = formatCoordinate(selectedLocation.lat);
    const displayLng = formatCoordinate(selectedLocation.lng);
    const mapLat = parseCoordinate(selectedLocation.lat) || 12.9716;
    const mapLng = parseCoordinate(selectedLocation.lng) || 77.5946;
    
    return (
      <div style={styles.mapModalOverlay}>
        <div style={styles.mapModal}>
          <div style={styles.mapHeader}>
            <h3>Select Property Location</h3>
            <div style={styles.mapControls}>
              <button 
                onClick={getUserCurrentLocation}
                style={styles.currentLocationButton}
                disabled={gettingLocation || mapLoading}
                title="Use my current location"
              >
                {gettingLocation ? "📍 Getting Location..." : "📍 Use My Location"}
              </button>
              <div style={styles.mapSearch}>
                <input
                  type="text"
                  placeholder="Search for area, landmark, or address..."
                  id="location-search"
                  style={styles.searchInput}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchLocation(e.target.value);
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const searchInput = document.getElementById('location-search');
                    if (searchInput.value) {
                      searchLocation(searchInput.value);
                    }
                  }}
                  style={styles.searchButton}
                  disabled={mapLoading}
                >
                  {mapLoading ? "Searching..." : "🔍 Search"}
                </button>
              </div>
            </div>
            <button onClick={() => setShowMap(false)} style={styles.closeBtn}>✕</button>
          </div>
          
          <div style={styles.mapContainer}>
            {mapLoading || gettingLocation ? (
              <div style={styles.loadingOverlay}>
                <div style={styles.spinner}></div>
                <p>{gettingLocation ? "Getting your location..." : "Loading map..."}</p>
              </div>
            ) : null}
            
            <MapContainer
              center={[mapLat, mapLng]}
              zoom={13}
              style={styles.leafletMap}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <UserLocationMarker userLocation={userLocation} />
              <LocationMarker 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
              />
            </MapContainer>
            
            <div style={styles.locationPreview}>
              <h4>Selected Location Details:</h4>
              {mapLoading ? (
                <p>Fetching address details...</p>
              ) : (
                <>
                  <p><strong>Coordinates:</strong> {displayLat}, {displayLng}</p>
                  {selectedLocation.address && (
                    <p><strong>Address:</strong> {selectedLocation.address}</p>
                  )}
                </>
              )}
            </div>
            
            <div style={styles.mapFooter}>
              <button 
                onClick={() => {
                  const lat = parseCoordinate(selectedLocation.lat);
                  const lng = parseCoordinate(selectedLocation.lng);
                  
                  if (!lat || !lng) {
                    alert("Please select a location by clicking on the map");
                    return;
                  }
                  setShowMap(false);
                }}
                style={styles.confirmButton}
                disabled={mapLoading || gettingLocation}
              >
                ✅ Confirm This Location
              </button>
              <button 
                onClick={() => {
                  setShowMap(false);
                  setManualEditMode(true);
                }}
                style={styles.manualButton}
              >
                ✏️ Enter Address Manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Manual Address Entry Form
  const ManualAddressForm = () => {
    const displayLat = selectedLocation.lat || "";
    const displayLng = selectedLocation.lng || "";
    
    return (
      <div style={styles.manualModalOverlay}>
        <div style={styles.manualModal}>
          <div style={styles.manualHeader}>
            <h3>Enter Address Manually</h3>
            <button onClick={() => setManualEditMode(false)} style={styles.closeBtn}>✕</button>
          </div>
          
          <div style={styles.manualForm}>
            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <label>Full Address *</label>
                <textarea
                  name="address"
                  value={selectedLocation.address}
                  onChange={handleLocationChange}
                  placeholder="Complete address including floor, building, street"
                  style={styles.textarea}
                  rows="3"
                  required
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Area/Locality *</label>
                <input
                  type="text"
                  name="area"
                  value={selectedLocation.area}
                  onChange={handleLocationChange}
                  placeholder="e.g., Koramangala, Whitefield"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Road/Street</label>
                <input
                  type="text"
                  name="road"
                  value={selectedLocation.road}
                  onChange={handleLocationChange}
                  placeholder="e.g., MG Road, 100 Feet Road"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={selectedLocation.landmark}
                  onChange={handleLocationChange}
                  placeholder="e.g., Near Forum Mall, Opposite Metro Station"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={selectedLocation.city}
                  onChange={handleLocationChange}
                  placeholder="e.g., Bangalore"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>State *</label>
                <input
                  type="text"
                  name="state"
                  value={selectedLocation.state}
                  onChange={handleLocationChange}
                  placeholder="e.g., Karnataka"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={selectedLocation.pincode}
                  onChange={handleLocationChange}
                  placeholder="e.g., 560034"
                  style={styles.input}
                  required
                  pattern="[0-9]{6}"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Country *</label>
                <input
                  type="text"
                  name="country"
                  value={selectedLocation.country}
                  onChange={handleLocationChange}
                  placeholder="e.g., India"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Latitude (optional)</label>
                <input
                  type="number"
                  name="lat"
                  value={displayLat}
                  onChange={handleLocationChange}
                  placeholder="e.g., 12.9716"
                  style={styles.input}
                  step="any"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Longitude (optional)</label>
                <input
                  type="number"
                  name="lng"
                  value={displayLng}
                  onChange={handleLocationChange}
                  placeholder="e.g., 77.5946"
                  style={styles.input}
                  step="any"
                />
              </div>
            </div>
            
            <div style={styles.manualFooter}>
              <button 
                onClick={() => {
                  if (!selectedLocation.address || !selectedLocation.area || !selectedLocation.city || !selectedLocation.state || !selectedLocation.pincode || !selectedLocation.country) {
                    alert("Please fill all required fields (marked with *)");
                    return;
                  }
                  setManualEditMode(false);
                }}
                style={styles.saveButton}
              >
                💾 Save Address
              </button>
              <button 
                onClick={() => {
                  setManualEditMode(false);
                  setShowMap(true);
                }}
                style={styles.backToMapButton}
              >
                🗺️ Back to Map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render location preview
  const renderLocationPreview = () => {
    if (!selectedLocation.address) return null;
    
    const displayLat = formatCoordinate(selectedLocation.lat);
    const displayLng = formatCoordinate(selectedLocation.lng);
    
    return (
      <div style={styles.locationPreview}>
        <div style={styles.locationHeader}>
          <h4>📍 Selected Location</h4>
          <div style={styles.locationActionButtons}>
            <button 
              type="button"
              onClick={() => setManualEditMode(true)}
              style={styles.editLocationBtn}
              title="Edit location details"
            >
              ✏️ Edit
            </button>
            <button 
              type="button"
              onClick={removeHostelLocation}
              style={styles.removeLocationBtn}
              title="Remove location"
            >
              🗑️ Remove
            </button>
          </div>
        </div>
        
        <div style={styles.locationDetails}>
          <p><strong>Address:</strong> {selectedLocation.address}</p>
          {selectedLocation.area && <p><strong>Area:</strong> {selectedLocation.area}</p>}
          {selectedLocation.city && <p><strong>City:</strong> {selectedLocation.city}</p>}
          {selectedLocation.state && <p><strong>State:</strong> {selectedLocation.state}</p>}
          {selectedLocation.pincode && <p><strong>Pincode:</strong> {selectedLocation.pincode}</p>}
          {displayLat && displayLng && (
            <p><strong>Coordinates:</strong> {displayLat}, {displayLng}</p>
          )}
        </div>
      </div>
    );
  };

  // Render BHK Configuration
  const renderBhkConfig = () => {
    if (!isToLet) return null;
    
    const bhkNumber = parseInt(form.bhk_type) || 1;
    
    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🏠 BHK Configuration</h3>
        <p style={styles.note}>Configure rooms and bathrooms for each BHK type</p>
        <div style={styles.grid}>
          {bhkNumber >= 1 && (
            <>
              <div style={styles.inputGroup}>
                <label>1 BHK - Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms_1bhk"
                  placeholder="e.g., 1"
                  value={bhkConfig.bedrooms_1bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>1 BHK - Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms_1bhk"
                  placeholder="e.g., 1"
                  value={bhkConfig.bathrooms_1bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
            </>
          )}
          {bhkNumber >= 2 && (
            <>
              <div style={styles.inputGroup}>
                <label>2 BHK - Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms_2bhk"
                  placeholder="e.g., 2"
                  value={bhkConfig.bedrooms_2bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>2 BHK - Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms_2bhk"
                  placeholder="e.g., 2"
                  value={bhkConfig.bathrooms_2bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
            </>
          )}
          {bhkNumber >= 3 && (
            <>
              <div style={styles.inputGroup}>
                <label>3 BHK - Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms_3bhk"
                  placeholder="e.g., 3"
                  value={bhkConfig.bedrooms_3bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>3 BHK - Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms_3bhk"
                  placeholder="e.g., 3"
                  value={bhkConfig.bathrooms_3bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
            </>
          )}
          {bhkNumber >= 4 && (
            <>
              <div style={styles.inputGroup}>
                <label>4 BHK - Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms_4bhk"
                  placeholder="e.g., 4"
                  value={bhkConfig.bedrooms_4bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>4 BHK - Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms_4bhk"
                  placeholder="e.g., 4"
                  value={bhkConfig.bathrooms_4bhk}
                  onChange={handleBhkConfigChange}
                  style={styles.input}
                  min="1"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render rates
  const renderRates = () => {
    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          {isToLet ? "💰 Rental Amount (₹/Month)" : 
           isCoLiving ? "💰 Co-Living Rates (₹/Month)" : 
           "💰 Room Rates (₹/Month)"}
        </h3>
        
        {isToLet ? (
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label>1 BHK Rent *</label>
              <input
                type="number"
                name="price_1bhk"
                placeholder="₹"
                value={roomRates.price_1bhk}
                onChange={handleRateChange}
                style={styles.input}
                min="0"
                required
              />
            </div>
            {parseInt(form.bhk_type) >= 2 && (
              <div style={styles.inputGroup}>
                <label>2 BHK Rent</label>
                <input
                  type="number"
                  name="price_2bhk"
                  placeholder="₹"
                  value={roomRates.price_2bhk}
                  onChange={handleRateChange}
                  style={styles.input}
                  min="0"
                />
              </div>
            )}
            {parseInt(form.bhk_type) >= 3 && (
              <div style={styles.inputGroup}>
                <label>3 BHK Rent</label>
                <input
                  type="number"
                  name="price_3bhk"
                  placeholder="₹"
                  value={roomRates.price_3bhk}
                  onChange={handleRateChange}
                  style={styles.input}
                  min="0"
                />
              </div>
            )}
            {parseInt(form.bhk_type) >= 4 && (
              <div style={styles.inputGroup}>
                <label>4 BHK Rent</label>
                <input
                  type="number"
                  name="price_4bhk"
                  placeholder="₹"
                  value={roomRates.price_4bhk}
                  onChange={handleRateChange}
                  style={styles.input}
                  min="0"
                />
              </div>
            )}
          </div>
        ) : isCoLiving ? (
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label>Co-Living Single Room *</label>
              <input
                type="number"
                name="co_living_single_room"
                placeholder="₹"
                value={roomRates.co_living_single_room}
                onChange={handleRateChange}
                style={styles.input}
                min="0"
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label>Co-Living Double Room</label>
              <input
                type="number"
                name="co_living_double_room"
                placeholder="₹"
                value={roomRates.co_living_double_room}
                onChange={handleRateChange}
                style={styles.input}
                min="0"
              />
            </div>
          </div>
        ) : (
          <>
            <p style={styles.note}>Enter amount for each room type (leave blank if not available)</p>
            <div style={styles.ratesGrid}>
              {[
                { key: "single_sharing", label: "Single Sharing" },
                { key: "double_sharing", label: "Double Sharing" },
                { key: "triple_sharing", label: "Triple Sharing" },
                { key: "four_sharing", label: "Four Sharing" },
                { key: "single_room", label: "Single Room" },
                { key: "double_room", label: "Double Room" },
                { key: "triple_room", label: "Triple Room" },
              ].map((room) => (
                <div key={room.key} style={styles.rateInputGroup}>
                  <label>{room.label}</label>
                  <input
                    type="number"
                    name={room.key}
                    placeholder="₹"
                    value={roomRates[room.key]}
                    onChange={handleRateChange}
                    style={styles.input}
                    min="0"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>➕ Add New Property</h2>
          <div style={styles.loginPrompt}>
            <h3>🔒 Please Log In</h3>
            <p>You need to be logged in to add a new property.</p>
            <button 
              onClick={() => navigate("/login")}
              style={styles.loginButton}
            >
              🔑 Go to Login Page
            </button>
            <p style={styles.loginNote}>
              After logging in, you'll be redirected back to this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX 8: Enhanced disabled condition
  const isSubmitDisabled = loading || 
    !selectedLocation.address || 
    photos.length === 0 ||
    !form.pg_name?.trim() ||
    !form.contact_person?.trim() ||
    !form.contact_phone?.trim();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>➕ Add New Property</h2>
        
        {/* Basic Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Basic Information</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label>Property Name *</label>
              <input
                name="pg_name"
                placeholder={isToLet ? "e.g., 2BHK Flat, Independent House" : "e.g., Royal PG, Cozy Coliving"}
                value={form.pg_name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label>Property Category *</label>
              <select 
                name="pg_category" 
                value={form.pg_category} 
                onChange={handleChange} 
                style={styles.input}
              >
                <option value="pg">PG/Hostel</option>
                <option value="coliving">Co-Living Space</option>
                <option value="to_let">House/Flat To Let</option>
              </select>
            </div>
            
            {!isToLet && (
              <div style={styles.inputGroup}>
                <label>Property Type *</label>
                <select
                  name="pg_type"
                  value={form.pg_type}
                  onChange={handleChange}
                  style={styles.input}
                >
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
                <select name="bhk_type" value={form.bhk_type} onChange={handleChange} style={styles.input}>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="4+">4+ BHK</option>
                </select>
              </div>
              
              <div style={styles.inputGroup}>
                <label>Furnishing Type *</label>
                <select name="furnishing_type" value={form.furnishing_type} onChange={handleChange} style={styles.input}>
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
            <button 
              type="button" 
              onClick={() => setShowMap(true)}
              style={styles.mapButton}
            >
              🗺️ Select on OpenStreetMap
            </button>
            
            <button 
              type="button" 
              onClick={() => setManualEditMode(true)}
              style={styles.manualAddressButton}
            >
              📝 Enter Address Manually
            </button>
          </div>
          
          {renderLocationPreview()}
          
          {!selectedLocation.address && (
            <div style={styles.locationWarning}>
              ⚠️ Please select a location using the map or enter manually
            </div>
          )}
        </div>

        {/* BHK Configuration */}
        {renderBhkConfig()}

        {/* Room Rates */}
        {renderRates()}

        {/* Facilities & Amenities */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🏠 Facilities & Amenities (Select Available)</h3>
          <div style={styles.checkboxGrid}>
            {/* Food */}
            {!isToLet && (
              <>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" name="food_available" checked={form.food_available} onChange={handleChange} style={styles.checkbox} />
                  🍽️ Food Available
                </label>
                {form.food_available && (
                  <>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ marginRight: "10px" }}>Food Type:</label>
                      <select name="food_type" value={form.food_type} onChange={handleChange} style={{...styles.input, width: "150px", display: "inline-block"}}>
                        <option value="veg">Vegetarian</option>
                        <option value="non_veg">Non-Vegetarian</option>
                        <option value="both">Both</option>
                      </select>
                      <label style={{ marginLeft: "20px", marginRight: "10px" }}>Meals per Day:</label>
                      <input
                        type="number"
                        name="meals_per_day"
                        placeholder="e.g., 3"
                        value={form.meals_per_day}
                        onChange={handleChange}
                        style={{...styles.input, width: "100px", display: "inline-block"}}
                        min="1"
                        max="4"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
            {/* Room Furnishings */}
            <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
              <h4>🛏️ Room Furnishings:</h4>
            </div>
            {[
              { key: "cupboard_available", label: "👔 Cupboard/Wardrobe" },
              { key: "table_chair_available", label: "💺 Study Table & Chair" },
              { key: "dining_table_available", label: "🍽️ Dining Table" },
              { key: "attached_bathroom", label: "🚽 Attached Bathroom" },
              { key: "balcony_available", label: "🌿 Balcony" },
              { key: "wall_mounted_clothes_hook", label: "🪝 Wall-mounted Clothes Hook" },
              { key: "bed_with_mattress", label: "🛌 Bed with Mattress" },
              { key: "fan_light", label: "💡 Fan & Light" },
              { key: "kitchen_room", label: "🍳 Kitchen Room" },
            ].map((item) => (
              <label key={item.key} style={styles.checkboxLabel}>
                <input type="checkbox" name={item.key} checked={form[item.key]} onChange={handleChange} style={styles.checkbox} />
                {item.label}
              </label>
            ))}
            
            {/* Building Facilities */}
            <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
              <h4>🏢 Building Facilities:</h4>
            </div>
            {[
              { key: "ac_available", label: "❄️ Air Conditioner" },
              { key: "wifi_available", label: "📶 Wi-Fi / Internet" },
              { key: "tv", label: "📺 Television" },
              { key: "parking_available", label: "🚗 Car Parking" },
              { key: "bike_parking", label: "🏍️ Bike Parking" },
              { key: "laundry_available", label: "🧺 Laundry Service" },
              { key: "washing_machine", label: "🧼 Washing Machine" },
              { key: "refrigerator", label: "🧊 Refrigerator" },
              { key: "microwave", label: "🍳 Microwave" },
              { key: "geyser", label: "🚿 Geyser" },
              { key: "power_backup", label: "🔋 Power Backup" },
              { key: "lift_elevator", label: "⬆️ Lift / Elevator" },
              { key: "cctv", label: "📹 CCTV Surveillance" },
              { key: "security_guard", label: "🛡️ Security Guard" },
              { key: "gym", label: "🏋️ Gym / Fitness" },
              { key: "housekeeping", label: "🧹 Housekeeping" },
              { key: "water_purifier", label: "💧 Water Purifier (RO)" },
              { key: "fire_safety", label: "🔥 Fire Safety System" },
              { key: "study_room", label: "📚 Study Room" },
              { key: "common_tv_lounge", label: "📺 Common TV / Lounge" },
              { key: "balcony_open_space", label: "🌿 Balcony / Open Space" },
              { key: "water_24x7", label: "💦 24×7 Water Supply" },
            ].map((facility) => (
              <label key={facility.key} style={styles.checkboxLabel}>
                <input type="checkbox" name={facility.key} checked={form[facility.key]} onChange={handleChange} style={styles.checkbox} />
                {facility.label}
              </label>
            ))}
            
            {/* Co-Living Inclusions */}
            {isCoLiving && (
              <>
                <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
                  <h4>🤝 Co-Living Inclusions:</h4>
                </div>
                {[
                  { key: "co_living_fully_furnished", label: "🛋️ Fully Furnished" },
                  { key: "co_living_food_included", label: "🍽️ Food Included" },
                  { key: "co_living_wifi_included", label: "📶 Wi-Fi Included" },
                  { key: "co_living_housekeeping", label: "🧹 Housekeeping" },
                  { key: "co_living_power_backup", label: "🔋 Power Backup" },
                  { key: "co_living_maintenance", label: "🔧 Maintenance" },
                ].map((item) => (
                  <label key={item.key} style={{...styles.checkboxLabel, color: "#2E7D32"}}>
                    <input type="checkbox" name={item.key} checked={form[item.key]} onChange={handleChange} style={styles.checkbox} disabled />
                    {item.label}
                  </label>
                ))}
              </>
            )}
            
            {/* Water Type */}
            <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
              <label style={{ marginRight: "10px" }}>💧 Water Source:</label>
              <select name="water_type" value={form.water_type} onChange={handleChange} style={{...styles.input, width: "150px", display: "inline-block"}}>
                <option value="borewell">Borewell</option>
                <option value="kaveri">Kaveri</option>
                <option value="both">Both</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rules & Restrictions */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📜 Rules & Restrictions</h3>
          <div style={styles.checkboxGrid}>
            {/* Gender Selection */}
            <div style={{ gridColumn: "1 / -1", marginBottom: "10px" }}>
              <h4>👥 Allowed For:</h4>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    name="boys_only" 
                    checked={form.boys_only} 
                    onChange={handleChange} 
                    style={styles.checkbox} 
                  />
                  👨 Boys Only
                </label>
                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    name="girls_only" 
                    checked={form.girls_only} 
                    onChange={handleChange} 
                    style={styles.checkbox} 
                  />
                  👩 Girls Only
                </label>
                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    name="co_living_allowed" 
                    checked={form.co_living_allowed} 
                    onChange={handleChange} 
                    style={styles.checkbox} 
                  />
                  🤝 Co-Living (Mixed)
                </label>
              </div>
            </div>
            
            {/* Rules List */}
            {[
              { key: "visitor_allowed", label: "👥 Visitors Allowed" },
              { key: "visitor_time_restricted", label: "⏰ Visitor Time Restricted" },
              { key: "couple_allowed", label: "❤️ Couples Allowed" },
              { key: "family_allowed", label: "👨‍👩‍👧‍👦 Family Allowed" },
              { key: "smoking_allowed", label: "🚬 Smoking Allowed" },
              { key: "drinking_allowed", label: "🍺 Drinking Allowed" },
              { key: "pets_allowed", label: "🐕 Pets Allowed" },
              { key: "late_night_entry_allowed", label: "🌙 Late Night Entry" },
              { key: "outside_food_allowed", label: "🍕 Outside Food Allowed" },
              { key: "parties_allowed", label: "🎉 Parties Allowed" },
              { key: "loud_music_restricted", label: "🔇 Loud Music Restricted" },
              { key: "lock_in_period", label: "🔒 Lock-in Period" },
              { key: "agreement_mandatory", label: "📝 Agreement Mandatory" },
              { key: "id_proof_mandatory", label: "🆔 ID Proof Mandatory" },
              { key: "office_going_only", label: "💼 Office-Going Only" },
              { key: "students_only", label: "🎓 Students Only" },
              { key: "subletting_allowed", label: "🔄 Sub-letting Allowed" },
            ].map((rule) => (
              <label key={rule.key} style={styles.checkboxLabel}>
                <input type="checkbox" name={rule.key} checked={form[rule.key]} onChange={handleChange} style={styles.checkbox} />
                {rule.label}
              </label>
            ))}
          </div>
          
          {/* Time-specific fields */}
          <div style={{...styles.grid, marginTop: "15px"}}>
            {form.visitor_time_restricted && (
              <div style={styles.inputGroup}>
                <label>Visitors Allowed Till</label>
                <input type="time" name="visitors_allowed_till" value={form.visitors_allowed_till} onChange={handleChange} style={styles.input} />
              </div>
            )}
            {!form.late_night_entry_allowed && (
              <div style={styles.inputGroup}>
                <label>Entry Curfew Time</label>
                <input type="time" name="entry_curfew_time" value={form.entry_curfew_time} onChange={handleChange} style={styles.input} />
              </div>
            )}
            {form.lock_in_period && (
              <div style={styles.inputGroup}>
                <label>Minimum Stay (Months)</label>
                <input type="number" name="min_stay_months" value={form.min_stay_months} onChange={handleChange} style={styles.input} min="1" placeholder="e.g., 6" />
              </div>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💰 Additional Details & Charges</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label>Security Deposit (₹)</label>
              <input type="number" name="security_deposit" placeholder="e.g., 10000" value={form.security_deposit} onChange={handleChange} style={styles.input} min="0" />
            </div>
            
            <div style={styles.inputGroup}>
              <label>Maintenance Charges (₹/Month)</label>
              <input type="number" name="maintenance_amount" placeholder="e.g., 1000" value={form.maintenance_amount} onChange={handleChange} style={styles.input} min="0" />
            </div>
            
            <div style={styles.inputGroup}>
              <label>Notice Period</label>
              <select name="notice_period" value={form.notice_period} onChange={handleChange} style={styles.input}>
                <option value="1">1 Month</option>
                <option value="2">2 Months</option>
                <option value="3">3 Months</option>
              </select>
            </div>
            
            <div style={styles.inputGroup}>
              <label>Total {isToLet ? "Properties" : "Rooms"}</label>
              <input type="number" name="total_rooms" placeholder={isToLet ? "e.g., 1" : "e.g., 10"} value={form.total_rooms} onChange={handleChange} style={styles.input} min="1" />
            </div>
            
            <div style={styles.inputGroup}>
              <label>Available {isToLet ? "Properties" : "Rooms"}</label>
              <input type="number" name="available_rooms" placeholder={isToLet ? "e.g., 1" : "e.g., 5"} value={form.available_rooms} onChange={handleChange} style={styles.input} min="0" />
            </div>
          </div>
          
          <div style={styles.inputGroup}>
            <label>Description *</label>
            <textarea
              name="description"
              placeholder={
                isToLet 
                  ? "Describe your house/flat, bedrooms, bathrooms, nearby facilities..." 
                  : "Describe your property, amenities, nearby facilities..."
              }
              value={form.description}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
              required
            />
          </div>
        </div>

        {/* Contact Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📞 Contact Information</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label>Contact Person *</label>
              <input name="contact_person" placeholder="e.g., Owner/Manager Name" value={form.contact_person} onChange={handleChange} style={styles.input} required />
            </div>
            
            <div style={styles.inputGroup}>
              <label>Contact Email</label>
              <input type="email" name="contact_email" placeholder="contact@example.com" value={form.contact_email} onChange={handleChange} style={styles.input} />
            </div>
            
            <div style={styles.inputGroup}>
              <label>Contact Phone *</label>
              <input
                type="tel"
                name="contact_phone"
                placeholder="Enter 10-digit phone number"
                value={form.contact_phone}
                onChange={handleChange}
                style={styles.input}
                required
                pattern="[0-9]{10,15}"
              />
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📷 Property Photos *</h3>
          <p style={styles.note}>Upload at least 1 photo. Maximum 10 photos allowed.</p>
          
          <div style={styles.fileUpload}>
            <label htmlFor="photo-upload" style={styles.fileUploadLabel}>
              📁 Choose Photos
            </label>
            <input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={styles.fileInput} />
          </div>
          
          {photos.length > 0 && (
            <div style={styles.photoPreview}>
              {photos.map((photo, index) => (
                <div key={index} style={styles.photoItem}>
                  <span style={styles.photoName}>
                    {photo.name.length > 20 ? photo.name.substring(0, 20) + "..." : photo.name}
                  </span>
                  <button type="button" onClick={() => removePhoto(index)} style={styles.removePhotoBtn} title="Remove photo">✕</button>
                </div>
              ))}
            </div>
          )}
          <p style={styles.photoCount}>Selected: {photos.length}/10 photos</p>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitDisabled}
          style={{
            ...styles.submitBtn,
            ...(isSubmitDisabled ? styles.submitBtnDisabled : {})
          }}
        >
          {loading ? "Creating Property..." : `➕ Create ${isToLet ? 'House/Flat' : 'Property'}`}
        </button>
      </div>

      {/* Modals */}
      {showMap && <OpenStreetMapModal />}
      {manualEditMode && <ManualAddressForm />}
    </div>
  );
}

// Styles (unchanged)
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    background: "#ffffff",
    width: "100%",
    maxWidth: "1200px",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
    margin: "20px 0",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#333",
    fontSize: "28px",
    fontWeight: "600",
  },
  loginPrompt: {
    textAlign: "center",
    padding: "40px 20px",
    border: "2px dashed #ccc",
    borderRadius: "10px",
    backgroundColor: "#f9f9f9",
  },
  loginButton: {
    padding: "15px 30px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    margin: "20px 0",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },
  loginNote: {
    fontSize: "14px",
    color: "#666",
    marginTop: "10px",
    fontStyle: "italic",
  },
  section: {
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #eee",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#444",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  note: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "15px",
    fontStyle: "italic",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
    marginBottom: "15px",
  },
  ratesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  rateInputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
    width: "100%",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  locationButtons: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
    flexWrap: "wrap",
  },
  mapButton: {
    padding: "12px 20px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    flex: "1",
    minWidth: "200px",
  },
  manualAddressButton: {
    padding: "12px 20px",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    flex: "1",
    minWidth: "200px",
  },
  locationPreview: {
    background: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "10px",
    borderLeft: "4px solid #4CAF50",
  },
  locationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  locationActionButtons: {
    display: "flex",
    gap: "10px",
  },
  editLocationBtn: {
    background: "#2196F3",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  removeLocationBtn: {
    background: "#ff4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  locationDetails: {
    fontSize: "14px",
    color: "#555",
  },
  locationWarning: {
    background: "#FFF3CD",
    border: "1px solid #FFEEBA",
    color: "#856404",
    padding: "10px",
    borderRadius: "6px",
    marginTop: "10px",
    fontSize: "14px",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "12px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#555",
    padding: "8px",
    borderRadius: "6px",
    transition: "background 0.2s",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  fileUpload: {
    marginBottom: "15px",
  },
  fileUploadLabel: {
    display: "inline-block",
    padding: "12px 20px",
    background: "#667eea",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  fileInput: {
    display: "none",
  },
  photoPreview: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
  },
  photoItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f8f9fa",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    border: "1px solid #e9ecef",
  },
  photoName: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  removePhotoBtn: {
    background: "#ff4444",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCount: {
    fontSize: "14px",
    color: "#666",
    marginTop: "10px",
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
    marginTop: "10px",
  },
  submitBtnDisabled: {
    opacity: "0.6",
    cursor: "not-allowed",
  },
  mapModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  mapModal: {
    background: "white",
    borderRadius: "12px",
    width: "95%",
    maxWidth: "1000px",
    maxHeight: "95vh",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  mapHeader: {
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8f9fa",
    flexWrap: "wrap",
    gap: "10px",
  },
  mapControls: {
    display: "flex",
    flex: "1",
    flexDirection: "column",
    gap: "10px",
    minWidth: "300px",
  },
  currentLocationButton: {
    padding: "10px 15px",
    background: "#FF9800",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    width: "100%",
    justifyContent: "center",
  },
  mapSearch: {
    display: "flex",
    gap: "10px",
    width: "100%",
  },
  searchInput: {
    flex: "1",
    padding: "10px 15px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    minWidth: "200px",
  },
  searchButton: {
    padding: "10px 15px",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    minWidth: "100px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    flexShrink: 0,
  },
  mapContainer: {
    position: "relative",
  },
  leafletMap: {
    height: "400px",
    width: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(255,255,255,0.8)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
  mapFooter: {
    padding: "15px 20px",
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    background: "#f8f9fa",
    borderTop: "1px solid #eee",
  },
  confirmButton: {
    padding: "12px 24px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  manualButton: {
    padding: "12px 24px",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  manualModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1001,
  },
  manualModal: {
    background: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  manualHeader: {
    padding: "20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8f9fa",
  },
  manualForm: {
    padding: "20px",
  },
  manualFooter: {
    padding: "20px",
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    background: "#f8f9fa",
    borderTop: "1px solid #eee",
  },
  saveButton: {
    padding: "12px 24px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  backToMapButton: {
    padding: "12px 24px",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default OwnerAddPG;