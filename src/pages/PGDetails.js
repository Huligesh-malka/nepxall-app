import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
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
  Wifi,
  Car,
  Shield,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Star,
  Heart,
  Share2
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

// Helper function to get distance
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
    <div style={styles.nearbyPgCard} onClick={onClick}>
      <div style={styles.nearbyPgImageContainer}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={pg.pg_name} 
            style={styles.nearbyPgImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="font-size: 40px;">🏠</div>';
            }}
          />
        ) : (
          <div style={styles.nearbyPgNoImage}>🏠</div>
        )}
        {distance && distance > 0 && (
          <span style={styles.nearbyPgDistanceBadge}>
            {distance.toFixed(1)} km away
          </span>
        )}
      </div>
      
      <div style={styles.nearbyPgContent}>
        <h4 style={styles.nearbyPgTitle}>{pg.pg_name}</h4>
        <p style={styles.nearbyPgAddress}>
          {pg.area || pg.city}
        </p>
        
        <div style={styles.nearbyPgStats}>
          <div style={styles.nearbyPgStat}>
            <span>💰</span>
            <span style={styles.nearbyPgStatText}>
              {startingPrice
                ? `₹${Number(startingPrice).toLocaleString("en-IN")}/m`
                : "Price on request"}
            </span>
          </div>
        </div>
        
        <div style={styles.nearbyPgFacilities}>
          {pg.ac_available && <span>❄️</span>}
          {pg.wifi_available && <span>📶</span>}
          {pg.food_available && <span>🍽️</span>}
          {pg.parking_available && <span>🚗</span>}
          {pg.cctv && <span>📹</span>}
          {pg.laundry_available && <span>🧺</span>}
        </div>
        
        <button 
          style={styles.nearbyPgViewButton}
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

// Nearby PGs Panel Component
const NearbyPGsPanel = ({ nearbyPGs, isLoading, onViewPG }) => {
  if (isLoading) {
    return (
      <div style={styles.loadingNearbyPGs}>
        <div className="spinner"></div>
        <p>Finding nearby properties...</p>
      </div>
    );
  }

  if (nearbyPGs.length === 0) {
    return null;
  }

  return (
    <div style={styles.nearbyPGsPanel}>
      <h3 style={styles.sectionTitle}>
        <span>🏘️</span> Similar Properties Nearby
      </h3>
      
      <div style={styles.nearbyPGsGrid}>
        {nearbyPGs.map((nearbyPG, index) => (
          <NearbyPGCard
            key={nearbyPG.id || index}
            pg={nearbyPG}
            onClick={() => onViewPG(nearbyPG.id)}
            distance={nearbyPG.distance}
          />
        ))}
      </div>
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
  const [nearbyPGs, setNearbyPGs] = useState([]);
  const [loadingNearbyPGs, setLoadingNearbyPGs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
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

  // FETCH NEARBY PGS
  useEffect(() => {
    if (!pg?.latitude || !pg?.longitude) return;

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

    fetchNearbyPGs();
  }, [pg, id]);

  const isToLet = pg?.pg_category === "to_let";
  const isCoLiving = pg?.pg_category === "coliving";
  const isPG = !isToLet && !isCoLiving;
  const hasOwnerContact = pg?.contact_phone && pg.contact_phone.trim() !== "";
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

  // CALL OWNER - Direct call without any booking
  const handleCallOwner = () => {
    if (hasOwnerContact && pg?.contact_phone) {
      window.location.href = `tel:${pg.contact_phone}`;
    } else {
      showNotificationMessage("Owner contact number not available");
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

  // Get all facilities that are available
  const getAvailableFacilities = () => {
    const allFacilities = [
      { key: "wifi_available", label: "WiFi", icon: "📶" },
      { key: "food_available", label: "Food", icon: "🍽️" },
      { key: "parking_available", label: "Parking", icon: "🚗" },
      { key: "laundry_available", label: "Laundry", icon: "🧺" },
      { key: "ac_available", label: "AC", icon: "❄️" },
      { key: "cctv", label: "CCTV", icon: "📹" },
      { key: "power_backup", label: "Power Backup", icon: "🔋" },
      { key: "geyser", label: "Geyser", icon: "🚿" },
      { key: "gym", label: "Gym", icon: "🏋️" },
      { key: "housekeeping", label: "Housekeeping", icon: "🧹" },
    ];
    
    return allFacilities.filter(facility => 
      pg && (pg[facility.key] === true || pg[facility.key] === "true" || pg[facility.key] === 1)
    );
  };

  // Get nearby places
  const getNearbyPlaces = () => {
    const places = [];
    
    if (pg?.nearby_college && pg.nearby_college.trim()) places.push({ name: pg.nearby_college, type: "College", icon: "🏫" });
    if (pg?.nearby_metro && pg.nearby_metro.trim()) places.push({ name: pg.nearby_metro, type: "Metro Station", icon: "🚇" });
    if (pg?.nearby_bus_stop && pg.nearby_bus_stop.trim()) places.push({ name: pg.nearby_bus_stop, type: "Bus Stop", icon: "🚌" });
    if (pg?.nearby_hospital && pg.nearby_hospital.trim()) places.push({ name: pg.nearby_hospital, type: "Hospital", icon: "🏥" });
    if (pg?.nearby_supermarket && pg.nearby_supermarket.trim()) places.push({ name: pg.nearby_supermarket, type: "Supermarket", icon: "🛒" });
    if (pg?.nearby_restaurant && pg.nearby_restaurant.trim()) places.push({ name: pg.nearby_restaurant, type: "Restaurant", icon: "🍽️" });
    if (pg?.nearby_park && pg.nearby_park.trim()) places.push({ name: pg.nearby_park, type: "Park", icon: "🌳" });
    if (pg?.landmark && pg.landmark.trim()) places.push({ name: pg.landmark, type: "Landmark", icon: "📍" });
    
    return places;
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
          Back to Home
        </button>
      </div>
    );
  }

  const current = media[index];
  const availableFacilities = getAvailableFacilities();
  const nearbyPlaces = getNearbyPlaces();
  const startingPrice = getStartingPrice();

  return (
    <div style={styles.page}>
      {/* Notification Toast */}
      {notification && (
        <div style={styles.notification}>
          {notification}
        </div>
      )}

      {/* Image Slider */}
      {media.length > 0 ? (
        <div style={styles.slider}>
          {current.type === "photo" ? (
            <img 
              src={current.src} 
              alt={pg.pg_name} 
              style={styles.media}
              onError={(e) => {
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

      {/* PG Name and Area */}
      <div style={styles.mainCard}>
        <h1 style={styles.title}>{pg.pg_name}</h1>
        <p style={styles.address}>
          <MapPin size={16} /> {pg.area || pg.city}
        </p>
      </div>

      {/* Price Card */}
      <div style={styles.priceCard}>
        <h2 style={styles.priceAmount}>
          ₹{startingPrice ? formatPrice(startingPrice) : "Contact for Price"}
        </h2>
        <p style={styles.pricePeriod}>per month</p>
      </div>

      {/* Call Owner Button */}
      <button
        onClick={handleCallOwner}
        style={styles.callButton}
      >
        📞 Call Owner
      </button>

      {/* Quick Details */}
      <div style={styles.quickDetailsCard}>
        <h3 style={styles.cardTitle}>Quick Details</h3>
        <div style={styles.quickDetailsGrid}>
          <div style={styles.quickDetailItem}>
            <span>🏠</span>
            <span>Total Rooms: {pg.total_rooms || "—"}</span>
          </div>
          <div style={styles.quickDetailItem}>
            <span>✅</span>
            <span>Available: {pg.available_rooms || "—"}</span>
          </div>
          <div style={styles.quickDetailItem}>
            <span>👥</span>
            <span>{pg.pg_type === "boys" ? "Boys Only" : pg.pg_type === "girls" ? "Girls Only" : "Co-living"}</span>
          </div>
          <div style={styles.quickDetailItem}>
            <span>📍</span>
            <span>{pg.city || "Location"}</span>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      {availableFacilities.length > 0 && (
        <div style={styles.facilitiesCard}>
          <h3 style={styles.cardTitle}>Facilities</h3>
          <div style={styles.facilitiesGrid}>
            {availableFacilities.map((facility, idx) => (
              <div key={idx} style={styles.facilityItem}>
                <span style={styles.facilityIcon}>{facility.icon}</span>
                <span>{facility.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Places */}
      {nearbyPlaces.length > 0 && (
        <div style={styles.nearbyCard}>
          <h3 style={styles.cardTitle}>Nearby Places</h3>
          <div style={styles.nearbyGrid}>
            {nearbyPlaces.map((place, idx) => (
              <div key={idx} style={styles.nearbyItem}>
                <span style={styles.nearbyIcon}>{place.icon}</span>
                <div>
                  <div style={styles.nearbyName}>{place.name}</div>
                  <div style={styles.nearbyType}>{place.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      {hasLocation && (
        <div style={styles.mapCard}>
          <h3 style={styles.cardTitle}>Location Map</h3>
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
                  <div>
                    <strong>{pg.pg_name}</strong><br/>
                    <small>{pg.area || pg.city}</small>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          <button 
            style={styles.directionButton}
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${pg.latitude},${pg.longitude}`,
                "_blank"
              )
            }
          >
            <Navigation size={16} /> Get Directions
          </button>
        </div>
      )}

      {/* Similar PGs */}
      <NearbyPGsPanel
        nearbyPGs={nearbyPGs}
        isLoading={loadingNearbyPGs}
        onViewPG={handleViewNearbyPG}
      />

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
          border: 4px solid #e2e8f0;
          border-top: 4px solid #2563eb;
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

/* ================= SIMPLE CLEAN STYLES ================= */
const styles = {
  // Base layout
  page: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px 16px 40px 16px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
    backgroundColor: "white",
    borderRadius: "24px",
    margin: "20px",
  },
  backButton: {
    marginTop: "24px",
    padding: "12px 24px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  // Slider
  slider: {
    position: "relative",
    borderRadius: "20px",
    overflow: "hidden",
    marginBottom: "20px",
    backgroundColor: "#e2e8f0",
  },
  media: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    display: "block",
  },
  navBtnLeft: {
    position: "absolute",
    top: "50%",
    left: "12px",
    transform: "translateY(-50%)",
    backgroundColor: "white",
    border: "none",
    width: "36px",
    height: "36px",
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
    right: "12px",
    transform: "translateY(-50%)",
    backgroundColor: "white",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  mediaCounter: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  noMedia: {
    height: "280px",
    backgroundColor: "#e2e8f0",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    color: "#64748b",
  },
  noMediaIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
  },

  // Main Card
  mainCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 6px 0",
  },
  address: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  // Price Card
  priceCard: {
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "16px",
    textAlign: "center",
    border: "1px solid #e2e8f0",
  },
  priceAmount: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  pricePeriod: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },

  // Call Button
  callButton: {
    width: "100%",
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  // Quick Details
  quickDetailsCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 16px 0",
  },
  quickDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  quickDetailItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#334155",
    padding: "8px 0",
  },

  // Facilities
  facilitiesCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  facilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  facilityItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#334155",
  },
  facilityIcon: {
    fontSize: "18px",
  },

  // Nearby Places
  nearbyCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  nearbyGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  nearbyItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  nearbyIcon: {
    fontSize: "20px",
    width: "32px",
  },
  nearbyName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
  },
  nearbyType: {
    fontSize: "12px",
    color: "#64748b",
  },

  // Map
  mapCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  mapContainer: {
    marginBottom: "12px",
    borderRadius: "12px",
    overflow: "hidden",
  },
  directionButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#2563eb",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  // Nearby PGs
  nearbyPGsPanel: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  nearbyPGsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  nearbyPgCard: {
    backgroundColor: "white",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
  },
  nearbyPgImageContainer: {
    position: "relative",
    height: "140px",
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  nearbyPgImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  nearbyPgNoImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
    backgroundColor: "#f1f5f9",
  },
  nearbyPgDistanceBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500",
  },
  nearbyPgContent: {
    padding: "14px",
  },
  nearbyPgTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  nearbyPgAddress: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "10px",
  },
  nearbyPgStats: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  nearbyPgStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
  },
  nearbyPgStatText: {
    fontSize: "13px",
  },
  nearbyPgFacilities: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    fontSize: "18px",
  },
  nearbyPgViewButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#2563eb",
    cursor: "pointer",
  },

  // Loading
  loadingNearbyPGs: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    gap: "12px",
    fontSize: "14px",
    color: "#64748b",
  },

  // Notification
  notification: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0f172a",
    color: "white",
    padding: "12px 20px",
    borderRadius: "40px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
    animation: "slideIn 0.3s ease",
    fontSize: "14px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
};